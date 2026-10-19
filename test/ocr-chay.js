// Đo độ chính xác đọc đề từ ảnh: chạy trong cửa sổ ToanViet (electron . --evalfile=test/ocr-chay.js).
// Lấy các đề trong test/de-hinh-lop.js (dạng chữ thường như người dùng chép), vẽ thành ảnh theo nhiều kiểu
// (ảnh màn hình web, Word/PDF, chữ nhỏ, nền tối, Zalo nén, ảnh chụp điện thoại nghiêng mờ), làm rõ ảnh (src/ocr-anh.js),
// nhận chữ (Tesseract trên máy), sửa lỗi nhận chữ (src/ocr-sua.js), rồi so kịch bản hình với kịch bản đọc từ chữ gốc.
// Biến môi trường: TVS_OCR_KIEU=web,word,... (mặc định tất cả), TVS_OCR_SO=số đề tối đa, TVS_OCR_OUT=tệp ghi chi tiết.
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  const src = await (await fetch('../test/de-hinh-lop.js?' + Date.now())).text();
  const LIST = new Function(src.replace(/if \(typeof module[\s\S]*$/, '') + '; return DE_HINH_LOP;')();
  for (const f of ['ocr-anh.js', 'ocr-tudien.js', 'ocr-sua.js', 'dedehinh.js']) new Function(await (await fetch(f + '?' + Date.now())).text()).call(window);
  const plain = (de) => de.replace(/\\(?:widehat|hat)\s*\{([^{}]*)\}/g, 'góc $1').replace(/\\overrightarrow\s*\{([^{}]*)\}/g, 'vectơ $1')
    .replace(/\\vec\s*\{?0\}?/g, '0').replace(/\\vec\s*\{([^{}]*)\}/g, '$1').replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\perp/g, '⊥').replace(/\\parallel/g, '//').replace(/\\Delta\s*/g, 'Δ').replace(/\^\\circ/g, '°').replace(/\\in\b/g, '∈')
    .replace(/\\ne\b/g, '≠').replace(/\\cdot/g, '.').replace(/\\backsim/g, '∽').replace(/\\sqrt\{([^{}]*)\}/g, '√$1').replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\$/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/\s+/g, ' ').trim();

  // vẽ đề thành ảnh theo kiểu
  const KIEU = {
    web: { font: '15px "Segoe UI", Arial', w: 760, fg: '#202124', bg: '#ffffff' },
    word: { font: '17px "Times New Roman"', w: 820, fg: '#000', bg: '#fff' },
    nho: { font: '12px "Times New Roman"', w: 560, fg: '#111', bg: '#fff' },
    toi: { font: '15px "Segoe UI", Arial', w: 700, fg: '#e8e8e8', bg: '#1f2023' },
    zalo: { font: '15px Arial', w: 640, fg: '#081c36', bg: '#e5efff', jpeg: 0.35, down: 0.8 },
    chup: { font: '22px "Times New Roman"', w: 900, fg: '#222', bg: '#efe8da', photo: true, jpeg: 0.7 },
  };
  function draw(text, k) {
    const st = KIEU[k], c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = st.font; const lh = Math.round(parseFloat(st.font) * 1.45), pad = 14;
    const words = text.split(' '), lines = []; let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (x.measureText(t).width > st.w - 2 * pad && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    c.width = st.w; c.height = lines.length * lh + 2 * pad + 6;
    x.fillStyle = st.bg; x.fillRect(0, 0, c.width, c.height);
    x.font = st.font; x.fillStyle = st.fg; x.textBaseline = 'top';
    lines.forEach((l, i) => x.fillText(l, pad, pad + i * lh));
    let out = c;
    if (st.photo) {
      // ảnh chụp: nghiêng 2,5°, mờ nhẹ, sáng tối không đều, nhiễu hạt
      const p = document.createElement('canvas'); p.width = c.width + 80; p.height = c.height + 80;
      const px = p.getContext('2d'); px.fillStyle = st.bg; px.fillRect(0, 0, p.width, p.height);
      px.translate(p.width / 2, p.height / 2); px.rotate(2.5 * Math.PI / 180); px.filter = 'blur(0.9px)'; px.drawImage(c, -c.width / 2, -c.height / 2); px.setTransform(1, 0, 0, 1, 0, 0); px.filter = 'none';
      const gr = px.createLinearGradient(0, 0, p.width, p.height); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
      px.fillStyle = gr; px.fillRect(0, 0, p.width, p.height);
      const id = px.getImageData(0, 0, p.width, p.height); let seed = 7;
      for (let i = 0; i < id.data.length; i += 4) { seed = (seed * 16807) % 2147483647; const n = (seed / 2147483647 - 0.5) * 30; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
      px.putImageData(id, 0, 0); out = p;
    }
    if (st.down) { const d = document.createElement('canvas'); d.width = Math.round(out.width * st.down); d.height = Math.round(out.height * st.down); d.getContext('2d').drawImage(out, 0, 0, d.width, d.height); out = d; }
    return out;
  }
  const toImg = (canvas, jpeg) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = canvas.toDataURL(jpeg ? 'image/jpeg' : 'image/png', jpeg || undefined); });
  const lev = (a, b) => { const m = a.length, n = b.length, d = new Array(n + 1); for (let j = 0; j <= n; j++) d[j] = j; for (let i = 1; i <= m; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= n; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[n]; };
  const scriptOf = (t) => { try { const r = DeHinh.plane(t) || DeHinh.space(t); return r ? r.script || r.kind : ''; } catch (e) { return 'LỖI ' + e.message; } };

  const kinds = (window.__OCR_KIEU || Object.keys(KIEU)), max = window.__OCR_SO || 1e9;
  const items = LIST.filter((x) => x[3].hinh).slice(0, max);
  const stat = {};
  for (const k of kinds) stat[k] = { n: 0, dung: 0, cer: 0, cer0: 0, ms: 0 };
  for (let i = 0; i < items.length; i++) {
    const [lop, cd, de] = items[i], text = plain(de), ref = scriptOf(text);
    for (const k of kinds) {
      const im = await toImg(draw(text, k), KIEU[k].jpeg);
      const t0 = performance.now();
      const pr = OcrAnh.prep(im), png = await OcrAnh.toPng(pr.canvas);
      const r = await window.api.ocr(png);
      if (!r.ok) { console.log('OCRERR ' + r.error); continue; }
      const raw = OcrSua.ghep(r.lines), fixed = OcrSua.sua(raw);
      const ms = performance.now() - t0, got = scriptOf(fixed), ok = got === ref;
      const s = stat[k]; s.n++; s.ms += ms; if (ok) s.dung++;
      s.cer += lev(fixed, text) / text.length; s.cer0 += lev(raw, text) / text.length;
      console.log('OCRROW ' + JSON.stringify({ i, lop, cd, k, ok, text, raw, fixed, scale: +pr.scale.toFixed(2), angle: pr.angle, inv: pr.inverted }));
    }
  }
  for (const k of kinds) { const s = stat[k]; console.log('OCRSUM ' + k + ': ' + s.dung + '/' + s.n + ' hình đúng như đọc từ chữ · sai ký tự ' + (100 * s.cer / s.n).toFixed(1) + '% (chưa sửa ' + (100 * s.cer0 / s.n).toFixed(1) + '%) · ' + Math.round(s.ms / s.n) + ' ms/ảnh'); }
  console.log('OCRDONE');
})();
