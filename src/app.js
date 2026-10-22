// ToanViet Studio — trang soạn thảo: đối tượng, chọn/kéo/co giãn, thuộc tính, tệp, xuất
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const page = $('#page'), stage = $('#stage'), props = $('#props');
  const api = window.api || null;
  const S = { objs: [], sel: null, multi: [], zoom: 1, file: null, dirty: false, hist: [], hpos: -1, seq: 1, clip: null };

  MathfieldElement.fontsDirectory = null; // phông đã nạp qua mathlive-fonts.css
  MathfieldElement.soundsDirectory = null;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // lỗi của đối tượng ở khung Thuộc tính: lời thường (src/loi-de-hieu.js), rê chuột xem lỗi gốc
  const showErr = (el, err) => { el.textContent = err && window.LoiDeHieu ? LoiDeHieu.dich(err).join('\n') : err || ''; el.title = err || ''; };
  // Dấu đồng dạng kiểu SGK Việt Nam (chữ S nằm ngang, hai đầu cuộn tròn): nét vẽ lấy từ dự án BangVeToan
  const SIM_D = 'M300 370C200 430 75 360 75 245C75 130 200 70 300 135C390 190 390 310 480 365C580 430 705 370 705 255C705 140 580 70 480 130';
  const SIM_TEX = '\\mathrel{\\class{tv-sim}{\\sim}}';
  const simMask = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 45 720 410"><path transform="translate(0 500) scale(1 -1)" d="' + SIM_D + '" fill="none" stroke="#000" stroke-width="44" stroke-linecap="round"/></svg>') + '")';
  const SIM_CSS = '.tv-sim{position:relative;display:inline-block;min-width:.92em;text-align:center;-webkit-text-fill-color:transparent}' +
    '.tv-sim::after{content:"";position:absolute;left:50%;top:50%;width:.9em;height:.5em;transform:translate(-50%,-50%);background:currentColor;-webkit-mask:' + simMask + ' center/100% 100% no-repeat;mask:' + simMask + ' center/100% 100% no-repeat}' +
    // chữ tiếng Việt trong công thức (\text{...}) dùng Times New Roman để đủ dấu
    // mũ góc, dấu cung (dấu co giãn) phải phủ đúng giữa toàn bộ phần bên dưới
    '.ML__center:has(.ML__stretchy){margin-left:0!important}' +
    '.ML__text{font-family:"Times New Roman",Cambria,serif!important}';
  const addSimCss = (rootNode) => { const st = document.createElement('style'); st.textContent = SIM_CSS; rootNode.appendChild(st); };
  addSimCss(document.head);
  const expandSim = (l) => String(l).replace(/\\dongdang(?![a-zA-Z])/g, SIM_TEX);
  const collapseSim = (l) => String(l).replace(/\\mathrel\{\\class\{tv-sim\}\{\\sim\}\}/g, '\\dongdang ');
  // Công thức nhiều dòng (\displaylines{a \\ b}) dựng thành các dòng canh trái; chỉ tách ở dấu \\ ngoài cùng
  function multiline(latex) {
    const m = /^\s*\\displaylines\{([\s\S]*)\}\s*$/.exec(latex);
    if (!m) return latex;
    const rows = [], t = m[1];
    let d = 0, cur = '';
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === '\\') {
        if (t[i + 1] === '\\' && d === 0) { rows.push(cur); cur = ''; i++; continue; }
        if (t.startsWith('\\begin', i)) d++; else if (t.startsWith('\\end', i)) d--;
        cur += ch + (t[i + 1] || ''); i++; continue;
      }
      if (ch === '{') d++; else if (ch === '}') d--;
      cur += ch;
    }
    rows.push(cur);
    return '\\begin{aligned}' + rows.map((r) => '&' + r).join('\\\\') + '\\end{aligned}';
  }
  const texOf = (o) => { const t = multiline(o.latex); return o.bold ? '\\boldsymbol{' + t + '}' : t; };
  // MathLive gióng DÒNG ĐẦU của môi trường array vào đường chân chữ (LaTeX gióng giữa cả khối), nên hệ, hệ "hoặc"
  // viết bằng \left[\begin{array}{l}…\end{array}\right. bị treo xuống dưới, ngoặc thừa một khoảng trống phía trên
  // (càng nhiều dòng càng lệch). Khi VẼ, đổi array sang aligned / gathered tương đương — gióng giữa đúng, khoảng cách
  // dòng như hệ trong SGK. Mã LaTeX lưu trữ và mọi phép chuyển đổi (Equation, MathType, MathML) vẫn dùng array gốc.
  function splitTop(s, kind) { // tách theo \\ (kind 'row') hoặc & (kind 'col') ở mức ngoài cùng
    const out = [];
    let d = 0, env = 0, cur = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '\\') {
        if (kind === 'row' && s[i + 1] === '\\' && !d && !env) {
          out.push(cur); cur = ''; i++;
          if (s[i + 1] === '[') { const j = s.indexOf(']', i + 1); if (j > 0) i = j; } // \\[3pt]
          continue;
        }
        if (s.startsWith('\\begin{', i)) env++; else if (s.startsWith('\\end{', i)) env--;
        cur += ch + (s[i + 1] || ''); i++; // lệnh hoặc kí tự thoát (\{ \& …): giữ nguyên, không tính
        continue;
      }
      if (ch === '{') d++; else if (ch === '}') d--;
      if (kind === 'col' && ch === '&' && !d && !env) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }
  const ARR_RX = /\\begin\{array\}(?:\[[tcb]\])?\{([^{}]*)\}((?:(?!\\begin\{array\})[\s\S])*?)\\end\{array\}/;
  function arrayFix(t) {
    // hệ cases / dcases: MathLive chừa sẵn cột điều kiện nên dư khoảng trống sau hệ — vẽ như \left\{ array{ll} \right.
    if (/\\begin\{d?cases\}/.test(t)) t = t.replace(/\\begin\{d?cases\}/g, '\\left\\{\\begin{array}{ll}').replace(/\\end\{d?cases\}/g, '\\end{array}\\right.');
    if (t.indexOf('\\begin{array}') < 0) return t;
    for (let n = 0; n < 60; n++) {
      const m = ARR_RX.exec(t);
      if (!m) break;
      const spec = m[1].replace(/\s/g, ''), body = m[2];
      let rep;
      if (!/^[lcr]+$/.test(spec) || /\\[hc]line/.test(body)) {
        rep = m[0].replace('\\begin{array}', '\\begin{TVSARR}').replace(/\\end\{array\}$/, '\\end{TVSARR}'); // bảng có kẻ (GT/KL…): giữ nguyên
      } else {
        const rows = splitTop(body, 'row');
        if (rows.length > 1 && !rows[rows.length - 1].trim()) rows.pop(); // \\ thừa ở cuối
        if (spec === 'c') rep = '\\begin{gathered}' + rows.join('\\\\') + '\\end{gathered}';
        else {
          // aligned có các cột xen kẽ phải, trái (cặp "phải–trái" nằm sát nhau như x+y&=3): đặt mỗi cột array vào
          // cột aligned cùng kiểu gióng gần nhất, chèn ô trống khi cần
          rep = '\\begin{aligned}' + rows.map((r) => {
            const cells = splitTop(r, 'col');
            while (cells.length > 1 && !cells[cells.length - 1].trim()) cells.pop(); // cột trống cuối: không chừa chỗ
            let s = '', pos = 0;
            [...spec].slice(0, cells.length).forEach((a, j) => {
              const want = a === 'r' ? 0 : 1;
              if (j > 0) { s += '&'; pos++; }
              while (pos % 2 !== want) { s += '&'; pos++; }
              s += cells[j] || '';
            });
            return s;
          }).join('\\\\') + '\\end{aligned}';
        }
      }
      t = t.slice(0, m.index) + rep + t.slice(m.index + m[0].length);
    }
    return t.replace(/\{TVSARR\}/g, '{array}');
  }
  const mkCache = new Map();
  function tex(latex, inline) {
    const key = (inline ? 'i' : 'd') + latex;
    if (!mkCache.has(key)) {
      let html;
      try { html = MathLive.convertLatexToMarkup(expandSim(arrayFix(latex)), { defaultMode: inline ? 'inline-math' : 'math' }); } catch (e) { html = esc(latex); }
      mkCache.set(key, html);
    }
    return mkCache.get(key);
  }
  // nhật ký ngắn các thông báo gần đây (đưa vào tệp báo lỗi)
  const LOG = [];
  const logPush = (t) => { LOG.push(new Date().toLocaleTimeString('vi-VN') + '  ' + t); if (LOG.length > 40) LOG.shift(); };
  window.addEventListener('error', (e) => logPush('LỖI: ' + e.message + ' (' + String(e.filename || '').replace(/^.*[\\/]/, '') + ':' + e.lineno + ')'));
  window.addEventListener('unhandledrejection', (e) => logPush('LỖI: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)));
  function msg(t, err) {
    if (err) logPush(t);
    $('#msg').textContent = t;
    $('#status').classList.toggle('err', !!err);
  }

  // ---------- Mô hình ----------
  const get = (id) => S.objs.find((o) => o.id === id);
  const cur = () => get(S.sel);
  const serialize = () => JSON.stringify(S.objs, (k, v) => (k[0] === '_' ? undefined : v));
  function commit() {
    const snap = serialize();
    if (S.hist[S.hpos] === snap) return;
    S.hist = S.hist.slice(0, S.hpos + 1);
    S.hist.push(snap);
    if (S.hist.length > 120) S.hist.shift();
    S.hpos = S.hist.length - 1;
    S.dirty = true;
    title();
  }
  function restore(i) {
    if (i < 0 || i >= S.hist.length) return;
    S.hpos = i;
    S.objs = JSON.parse(S.hist[i]);
    S.multi = S.multi.filter((id) => get(id));
    if (!cur()) S.sel = S.multi[S.multi.length - 1] || null;
    S.dirty = true;
    renderAll(); buildProps(); title();
  }
  function title() {
    const name = S.file ? S.file.replace(/^.*[\\/]/, '') : 'Chưa đặt tên';
    if (api) api.setTitle((S.dirty ? '● ' : '') + name + ' — ToanViet Studio');
    if (api && api.setDirty) api.setDirty(S.dirty && (S.objs.length > 0 || !!(S.exam && S.exam.qs.length)));
  }
  function loadDoc(objs, file) {
    S.objs = objs || [];
    S.seq = S.objs.reduce((m, o) => Math.max(m, parseInt(String(o.id).slice(1), 10) || 0), 0) + 1;
    S.sel = null; S.multi = []; S.exam = null; S.file = file || null;
    S.hist = [serialize()]; S.hpos = 0; S.dirty = false;
    renderAll(); buildProps(); title();
  }

  // ---------- Vẽ đối tượng ----------
  function labelsHtml(labels) {
    return labels.map((l) => {
      const tr = (l.ax === 'l' ? '0' : l.ax === 'r' ? '-100%' : '-50%') + ',-50%';
      return `<span class="lb${l.bg ? ' bg' : ''}" style="left:${Math.round(l.x * 10) / 10}px;top:${Math.round(l.y * 10) / 10}px;font-size:${l.size || 14}px;color:${l.color || '#111'};transform:translate(${tr})">${l.tex !== undefined ? tex(l.tex, true) : esc(l.text)}</span>`;
    }).join('');
  }
  function shapeSvg(o) {
    const w = o.w, h = o.h, sw = o.sw || 1.5;
    const st = `stroke="${o.color || '#111'}" stroke-width="${sw}"${o.dash ? ' stroke-dasharray="7 4"' : ''}`;
    const fill = o.nofill === false ? (o.fill || '#aed6f1') : 'none';
    const i = sw / 2; // nét nằm trọn trong khung (không bị cắt ở mép)
    if (o.kind === 'rect') return `<rect x="${i}" y="${i}" width="${w - sw}" height="${h - sw}" fill="${fill}" ${st}/>`;
    if (o.kind === 'box') return `<rect x="${i}" y="${i}" width="${w - sw}" height="${h - sw}" rx="${Math.min(14, h / 3)}" fill="${fill}" ${st}/>`;
    if (o.kind === 'ellipse') return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - i}" ry="${h / 2 - i}" fill="${fill}" ${st}/>`;
    if (o.kind === 'diamond') return `<polygon points="${w / 2},${i} ${w - i},${h / 2} ${w / 2},${h - i} ${i},${h / 2}" fill="${fill}" ${st}/>`;
    if (o.kind === 'conn') return sodo.connSvg(o);
    const y1 = o.flip ? h : 0, y2 = o.flip ? 0 : h, both = o.kind === 'arrow' && o.head === 'both';
    const mk = o.kind === 'arrow' ? `<defs><marker id="sa${o.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="${o.color || '#111'}"/></marker></defs>` : '';
    return `${mk}<line x1="0" y1="${y1}" x2="${w}" y2="${y2}" ${st}${mk ? ` marker-end="url(#sa${o.id})"` : ''}${both ? ` marker-start="url(#sa${o.id})"` : ''}/><line x1="0" y1="${y1}" x2="${w}" y2="${y2}" stroke="transparent" stroke-width="12"/>`;
  }
  // Tách khối chữ thành đoạn chữ và công thức: $…$ trong dòng, $$…$$ đứng riêng một dòng (canh giữa như SGK).
  // Trước đây chỉ tách theo từng dấu $ nên $$A$$ hiện nguyên mã LaTeX. s, e: vị trí trong chuỗi gốc (để sửa đúng chỗ).
  function textSegs(text) {
    const t = String(text || ''), out = [], rx = /\$\$([\s\S]+?)\$\$|\$([^$]*)\$/g;
    let last = 0, m;
    while ((m = rx.exec(t))) {
      if (m.index > last) out.push({ t: t.slice(last, m.index) });
      out.push(m[1] !== undefined ? { m: m[1], disp: true, s: m.index, e: m.index + m[0].length } : { m: m[2], s: m.index, e: m.index + m[0].length });
      last = m.index + m[0].length;
    }
    if (last < t.length) out.push({ t: t.slice(last) });
    return out;
  }
  window.TextSegs = textSegs;
  function textHtml(o) {
    return textSegs(o.text).map((g, i) => (g.m === undefined ? esc(g.t)
      : '<span class="ifx' + (g.disp ? ' disp' : '') + '" data-i="' + i + '" title="Nhấp đúp để sửa công thức">' + tex(g.m, !g.disp) + '</span>')).join('');
  }
  // ---------- Kéo điểm (toạ độ, thông số), chọn điểm / mặt phẳng, xoay hình không gian: src/mod/keodiem.js ----------
  let ptSel, plSel, togglePlane, rotateDrag, pointHandles, freshName, pointDrag;
  // ---------- Sơ đồ, sơ đồ tư duy (ô chữ, đường nối bám ô, thêm nhánh): src/mod/sodo.js ----------
  let sodo = { CLOSED: [], isConn: () => false, connSvg: () => "", refreshConns() {}, refreshAll() {} };
  function renderObj(o) {
    let el = page.querySelector(`[data-id="${o.id}"]`);
    if (!el) { el = document.createElement('div'); el.dataset.id = o.id; page.appendChild(el); }
    if (el.classList.contains('editing')) return el;
    el.className = 'obj ' + o.type + (o.type === 'shape' ? ' sh-' + o.kind : '') + (isSel(o.id) ? ' sel' + (many() ? ' msel' : '') : '');
    let connSvg = '';
    if (o.type === 'shape' && o.kind === 'conn') connSvg = sodo.connSvg(o); // đường nối: tính lại khung theo hai ô trước khi đặt vị trí
    el.style.cssText = `left:${o.x}px;top:${o.y}px;`;
    o._err = '';
    let html = '';
    try {
      if (o.type === 'formula') {
        html = o.latex ? `<span style="font-size:${o.size}px;color:${o.color || '#000'}">${tex(texOf(o))}</span>` : '<span class="empty">(công thức trống — nhấp đúp để soạn)</span>';
      } else if (o.type === 'text') {
        el.style.cssText += `width:${o.w}px;font-size:${o.size}px;color:${o.color || '#000'};text-align:${o.align || 'left'};font-weight:${o.bold ? 700 : 400};font-style:${o.italic ? 'italic' : 'normal'};`;
        html = textHtml(o);
      } else if (o.type === 'baitap') {
        // dạng bài tiểu học: khối chữ tự xuống dòng như văn bản, chiều cao tự theo nội dung
        el.style.cssText += `width:${o.w}px;`;
        const res = TieuHoc.renderBaiTap(o);
        html = res.html; o._err = res.errors.join('\n');
      } else {
        let res;
        if (o.type === 'graph') res = Graph.renderGraph(o, o.w, o.h);
        else if (o.type === 'region') res = Graph.renderRegion(o, o.w, o.h);
        else if (o.type === 'bbt') res = BBT.render(o, o.w, o.h);
        else if (o.type === 'solid') res = Solid.render(o, o.w, o.h);
        else if (o.type === 'plane') res = Plane.render(o, o.w, o.h);
        else if (o.type === 'space') res = Space.render(o, o.w, o.h);
        else if (o.type === 'sym') res = SGK.render(o, o.w, o.h);
        else if (o.type === 'numline') res = NumLine.render(o, o.w, o.h);
        else if (o.type === 'venn') res = NumLine.renderVenn(o, o.w, o.h);
        else if (o.type === 'dattinh') { res = TieuHoc.renderDatTinh(o); o.w = res.w; o.h = res.h; }
        else if (o.type === 'minhhoa') res = MinhHoa.render(o, o.w, o.h);
        else res = { svg: connSvg || shapeSvg(o), labels: [], errors: [] };
        el.style.cssText += `width:${o.w}px;height:${o.h}px;`;
        html = `<svg width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}" xmlns="http://www.w3.org/2000/svg">${res.svg}</svg>` + labelsHtml(res.labels);
        // chữ trong ô (sơ đồ, sơ đồ tư duy): canh giữa, tự xuống dòng, có công thức $…$
        if (o.type === 'shape' && sodo.CLOSED.includes(o.kind) && o.text) html += `<div class="shtext" style="font-size:${o.tsize || 16}px;color:${o.tcolor || '#111'};font-weight:${o.bold ? 700 : 400};${o.kind === 'diamond' ? 'padding:0 22%;' : o.kind === 'ellipse' ? 'padding:0 12%;' : ''}">${textHtml(o)}</div>`;
        o._err = res.errors.join('\n');
        if (res.pts && (o.type === 'plane' || o.type === 'space')) { o._res = res; html += pointHandles(o, res); }
        if (res.planes) { const on = plSel(o); html += Object.keys(res.planes).map((n) => `<div class="plh${on.includes(n) ? ' on' : ''}" data-pl="${esc(n)}" style="left:${Math.round(res.planes[n][0])}px;top:${Math.round(res.planes[n][1])}px" title="Mặt phẳng ${esc(n)} — nhấp để chọn (dựng nhanh)"></div>`).join(''); }
        if (o.type === 'space' || o.type === 'solid') html += '<div class="roth" title="Kéo để xoay hình (nhấp đúp: về góc nhìn SGK)">⟳</div>';
      }
    } catch (e) { o._err = e.message; html = `<span class="empty" style="color:#b03a2e">${esc(e.message)}</span>`; }
    // đoạn, mũi tên, đường nối: hai nút tròn ở hai đầu mút — kéo đầu mút về hướng cần chỉ (thả vào ô chữ thì gắn với ô)
    if (o.type === 'shape' && o.kind === 'conn' && sodo.ends) html += sodo.ends(o).map((p, i) => `<div class="eph" data-ep="${i + 1}" title="Kéo đầu mút: xoay, kéo dài (Shift: góc tròn 15°)" style="left:${Math.round(p.x - o.x)}px;top:${Math.round(p.y - o.y)}px"></div>`).join('');
    el.innerHTML = html + '<div class="handle"></div>';
    if (S.sel === o.id) { const er = $('#perr'); if (er) showErr(er, o._err); }
    return el;
  }
  // ---------- Chọn nhiều đối tượng, khung chọn, bắt dính, nhóm, căn thẳng hàng: src/mod/chonnhieu.js ----------
  let isSel, selObjs, many, cleanObj, paintSel, groupOf, setSel, toggleSel, elOf, boxOf, groupData, pasteGroup, pasteMany, multiProps, rubberBand, snapper;
  function renderAll() {
    page.innerHTML = '';
    S.objs.forEach(renderObj);
    sodo.refreshAll(); // đường nối vẽ lại khi các ô đã có trên trang (ô chữ thường đo theo phần tử đã vẽ)
  }
  function select(id) {
    const g = id ? groupOf(id) : [];
    if (S.sel === id && S.multi.length === g.length && g.every(isSel)) return;
    setSel(g, id);
  }

  // ---------- Tạo đối tượng ----------
  const SOLID_DEFAULTS = {
    chop3: { base: 'deu', apex: 'A', points: 'M = BC', segs: 'AM, SM' },
    chop4: { apex: 'tam', points: 'O = AC', segs: 'AC, BD, SO' },
    tudien: { points: 'G = BCD', segs: 'AG' },
    hop: { b: 3, ch: 3, points: '', segs: "AC'" },
    lapphuong: { points: '', segs: "A'C, BD" },
    langtru3: { base: 'deu', ch: 5, points: '', segs: '' },
    chopcut: { ratio: 0.5, ch: 3, points: '', segs: '' },
    tru: { a: 2, ch: 4 }, non: { a: 2, ch: 4 }, noncut: { a: 2.4, b: 1.2, ch: 3 }, cau: { a: 2 },
  };
  function defaults(type, kind) {
    switch (type) {
      case 'formula': return { latex: '', size: 16, color: '#000000' }; // 16px = cỡ 12 của Word
      case 'text': return { text: 'Nhập văn bản. Gõ công thức giữa hai dấu đô la: $x^2+1$', size: 17, w: 420, color: '#000000', align: 'left' };
      case 'graph': return { w: 360, h: 330, funcs: 'x^3 - 3x', xmin: '-4', xmax: '4', ymin: '-4', ymax: '4', xstep: '1', ystep: '1', grid: true, ticks: true, legend: true, proj: true, points: '', guides: '', shadeA: '', shadeB: '', stroke: 1.8 };
      case 'bbt': return { w: 520, h: 170, expr: 'x^3 - 3x', a: '', b: '', xrow: '', drow: '', frow: '', lx: 'x', ld: "y'", lf: 'y' };
      case 'sign': return { type: 'bbt', signOnly: true, w: 480, h: 76, expr: '(x-1)(x+2)/(x-3)', a: '', b: '', xrow: '', drow: '', frow: '', lx: 'x', ld: 'f(x)', lf: '' };
      case 'region': return { w: 360, h: 360, ineqs: 'x + y <= 4\nx - 2y <= 2\nx >= 0\ny >= 0', style: 'hatch', vertices: true, lineNames: true, xmin: '-2', xmax: '6', ymin: '-2', ymax: '6', xstep: '1', ystep: '1', grid: false, ticks: true };
      case 'solid': return Object.assign({ kind, w: 300, h: 300, a: 4, b: 4, ch: 4, yaw: -18, pitch: 20, labels: true, fill: false, stroke: 1.5, color: '#111111', points: '', segs: '' }, SOLID_DEFAULTS[kind]);
      case 'sym': return Object.assign({ kind, label: '', data: 'ud ud u u u', inner: true, stroke: 1.5, color: '#111111' }, SGK.sizeOf(kind));
      case 'space': return Object.assign({ kind, w: 360, h: 300, script: Space.scriptOf(kind), labels: true, dots: false, stroke: 1.5, color: '#111111', lcolor: '#1a6fc4', yaw: 20, pitch: 20 }, Space.viewOf(kind));
      case 'plane': return { kind, w: 340, h: 280, script: Plane.scriptOf(kind), labels: true, dots: false, stroke: 1.5, color: '#111111' };
      case 'numline': return Object.assign({ kind, color: '#111111', pcolor: '#d62728', ncolor: '#1f77b4', xname: '' }, JSON.parse(JSON.stringify(NumLine.KINDS[kind][1])));
      case 'venn': return Object.assign({ kind, color: '#111111' }, JSON.parse(JSON.stringify(NumLine.VKINDS[kind][1])));
      case 'dattinh': return Object.assign({ kind, expr: '356 + 278', size: 26, an: 'none', nan: 3, seed: 1, dapan: false, nho: false, kieuchia: 'day', thapphan: 0, color: '#111111', acolor: '#d62728', w: 100, h: 100 }, TieuHoc.DT_KINDS[kind][1]);
      case 'baitap': return Object.assign({ kind, de: '', text: '', size: 20, cols: 1, dapan: false, seed: 1, head: false, headcol: false, nrow: 4, color: '#111111', acolor: '#d62728', w: 640 }, JSON.parse(JSON.stringify(TieuHoc.BT_KINDS[kind][1])));
      case 'minhhoa': return Object.assign({ kind, color: '#222222' }, JSON.parse(JSON.stringify(MinhHoa.KINDS[kind][1])));
      case 'shape':
        // ô chữ (sơ đồ): nền trắng, chữ ở giữa; đường nối: cong, mũi tên một đầu
        if (kind === 'box') return { kind, w: 160, h: 56, color: '#2e86c1', sw: 1.8, dash: false, nofill: false, fill: '#ffffff', text: 'Ô chữ', tsize: 16, tcolor: '#111111', bold: false };
        if (kind === 'diamond') return { kind, w: 150, h: 90, color: '#111111', sw: 1.5, dash: false, nofill: false, fill: '#fef9e7', text: 'Điều kiện?', tsize: 15, tcolor: '#111111', bold: false };
        if (kind === 'conn') return { kind, w: 160, h: 60, color: '#555555', sw: 2, dash: false, style: 'cong', head: 'end' };
        return { kind, w: kind === 'line' || kind === 'arrow' ? 160 : 140, h: kind === 'line' || kind === 'arrow' ? 60 : 100, color: '#111111', sw: 1.5, dash: false, nofill: true, fill: '#aed6f1', flip: false, text: '', tsize: 16, tcolor: '#111111', bold: false };
    }
  }
  function autoBBT(o) {
    const r = BBT.analyse(o.expr, o.a, o.b, !!o.signOnly);
    o.xrow = r.xrow; o.drow = r.drow; o.frow = r.frow;
    return r.note;
  }
  function insert(type, kind, extra) {
    const base = defaults(type, kind);
    const n = S.objs.length % 8;
    const o = Object.assign({ id: 'o' + S.seq++, type, x: Math.round(60 + n * 18 + stage.scrollLeft / S.zoom), y: Math.round(50 + n * 18 + stage.scrollTop / S.zoom) }, base, extra || {});
    if (o.type === 'bbt' && !o.xrow) { try { autoBBT(o); } catch (e) { msg(e.message, true); } }
    S.objs.push(o);
    renderObj(o);
    select(o.id);
    return o;
  }

  // ---------- Hộp soạn công thức (theo thiết kế của Bảng vẽ Toán) ----------
  const dlg = $('#fxdlg'), fTex = $('#fTex'), fPrev = $('#fPrev');
  let fxDone = null, fMode = 'v', fTab = 1, pfx = null, fT = 0; // thẻ 0 (Tiểu học) mở sẵn ở chế độ Tiểu học
  const fSt = { size: 16, color: '#000000', bold: false };
  // Cỡ chữ hiển thị theo point như Word (12 pt = 16 px trên trang)
  const toPt = (px) => Math.round(px * 0.75 * 2) / 2, toPx = (pt) => pt / 0.75;
  // Phím tắt kiểu MathType. Ctrl+G, Ctrl+T, Ctrl+K là phím mở đầu: bấm xong thả ra rồi gõ tiếp một phím.
  const SC = { f: '\\frac{#@}{#?}', r: '\\sqrt{#?}', h: '#@^{#?}', l: '#@_{#?}', j: '#@_{#?}^{#?}', i: '\\int_{#?}^{#?}#?\\mathrm{d}x', 9: '\\left(#?\\right)', 0: '\\left(#?\\right)', '[': '\\left[#?\\right]',
    'shift+{': '\\left\\{#?\\right\\}', 'shift+i': '\\int#?\\mathrm{d}x', 'shift+e': '\\text{#?}' };
  const GREEK = { a: 'alpha', b: 'beta', g: 'gamma', d: 'delta', e: 'varepsilon', z: 'zeta', h: 'eta', q: 'theta', i: 'iota', k: 'kappa', l: 'lambda', m: 'mu', n: 'nu', x: 'xi', p: 'pi', r: 'rho', s: 'sigma', t: 'tau', u: 'upsilon', f: 'varphi', c: 'chi', y: 'psi', w: 'omega',
    D: 'Delta', G: 'Gamma', L: 'Lambda', S: 'Sigma', W: 'Omega', F: 'Phi', P: 'Pi', Q: 'Theta', Y: 'Psi', X: 'Xi' };
  const TPL = { n: '\\sqrt[#?]{#?}', s: '\\sum_{#?}^{#?}#?', p: '\\prod_{#?}^{#?}#?', l: '\\lim_{#?\\to#?}', '|': '\\left|#?\\right|', a: '\\widehat{#?}', c: '\\overarc{#?}', v: '\\overrightarrow{#?}', o: '\\overline{#?}', u: '\\underbrace{#?}_{#?}',
    h: '\\begin{cases}#?\\\\#?\\end{cases}', m: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}' };
  const SYM = { i: '\\infty', a: '\\to', e: '\\in', t: '\\times', d: '\\partial', p: '\\perp', '.': '\\cdot', '<': '\\le', ',': '\\le', '>': '\\ge', '=': '\\ne', '/': '⫽', '+': '\\pm', r: '\\Rightarrow', l: '\\Leftrightarrow', o: '^{\\circ}', s: '\\dongdang' };
  const FKEYS = [['Ctrl+F', 'Phân số'], ['Ctrl+R', 'Căn bậc hai'], ['Ctrl+H', 'Số mũ'], ['Ctrl+L', 'Chỉ số dưới'], ['Ctrl+J', 'Chỉ số trên và dưới'], ['Ctrl+I', 'Tích phân có cận'], ['Ctrl+Shift+I', 'Tích phân không cận'],
    ['Ctrl+9', 'Ngoặc tròn'], ['Ctrl+[', 'Ngoặc vuông'], ['Ctrl+Shift+{', 'Ngoặc nhọn'], ['Ctrl+Shift+E', 'Đổi qua lại giữa gõ toán và gõ chữ'], ['Enter', 'Thêm dòng mới ở cuối công thức'], ['Shift+Enter', 'Thêm hàng cho hệ phương trình, ma trận đang đứng'], ['Ctrl+Shift+Backspace', 'Xoá dòng đang đứng'], ['Ctrl+Enter', 'Chèn công thức'],
    ['Ctrl+T rồi N', 'Căn bậc n'], ['Ctrl+T rồi S', 'Tổng ∑'], ['Ctrl+T rồi P', 'Tích ∏'], ['Ctrl+T rồi L', 'Giới hạn'], ['Ctrl+T rồi |', 'Giá trị tuyệt đối'], ['Ctrl+T rồi A', 'Góc (dấu mũ rộng)'], ['Ctrl+T rồi C', 'Cung'],
    ['Ctrl+T rồi V', 'Vectơ'], ['Ctrl+T rồi O', 'Gạch trên'], ['Ctrl+T rồi U', 'Ngoặc ôm bên dưới kèm chú thích'], ['Ctrl+T rồi H', 'Hệ phương trình'], ['Ctrl+T rồi M', 'Ma trận 2×2'],
    ['Ctrl+G rồi chữ cái', 'Chữ Hy Lạp: a→α, b→β, d→δ, D→Δ, p→π, q→θ, w→ω, f→φ, l→λ…'],
    ['Ctrl+K rồi I', '∞'], ['Ctrl+K rồi A', '→'], ['Ctrl+K rồi E', '∈'], ['Ctrl+K rồi T', '×'], ['Ctrl+K rồi .', 'Dấu nhân chấm'], ['Ctrl+K rồi <  >  =', '≤  ≥  ≠'], ['Ctrl+K rồi P  /', '⊥ (vuông góc)  ⫽ (song song, như sách)'], ['Ctrl+K rồi R  L', '⇒  ⇔'], ['Ctrl+K rồi O', 'Độ °'], ['Ctrl+K rồi S', 'Đồng dạng ∽'],
    ['/  ^  _', 'Gõ thẳng: phân số, mũ, chỉ số'], ['\\tên rồi Tab', 'Ký hiệu theo tên LaTeX, ví dụ \\omega'], ['Tab, phím mũi tên', 'Sang ô trống kế tiếp, ra khỏi ô con']];
  $('#fKeyList').innerHTML = FKEYS.map((k) => '<kbd>' + esc(k[0]) + '</kbd><span>' + esc(k[1]) + '</span>').join('');
  const SCREV = new Map();
  for (const k in SC) SCREV.set(SC[k], 'Ctrl+' + k.replace('shift+', 'Shift+').toUpperCase().replace('SHIFT', 'Shift'));
  for (const k in TPL) if (!SCREV.has(TPL[k])) SCREV.set(TPL[k], 'Ctrl+T rồi ' + k.toUpperCase());
  for (const k in SYM) if (!SCREV.has(SYM[k])) SCREV.set(SYM[k], 'Ctrl+K rồi ' + k.toUpperCase());
  for (const k in GREEK) SCREV.set('\\' + GREEK[k], 'Ctrl+G rồi ' + k);

  const mf = new MathfieldElement();
  mf.id = 'mf';
  $('#fMathBox').append(mf);
  mf.mathVirtualKeyboardPolicy = 'manual';
  mf.macros = Object.assign({}, mf.macros, { dongdang: SIM_TEX });
  // <=> ra ⇔ như sách (MathLive mặc định ra mũi tên dài ⟺ kèm khoảng trắng)
  mf.inlineShortcuts = Object.assign({}, mf.inlineShortcuts, { dongdang: '\\dongdang', '<=>': '\\Leftrightarrow', '=>': '\\Rightarrow' });
  let lastSlash = 0;
  // Phím cách trong ô toán chèn một khoảng rộng 0 (\kern0pt) để ngắt nhóm chữ số: gõ "2 1/3" ra hỗn số liền như sách
  // (không gộp 21 làm tử số, không có khoảng trống thừa), gõ "1 000" ra số tách lớp.
  // Khi lấy giá trị: giữa hai chữ số thành \, (tách lớp), các chỗ khác bỏ đi.
  mf.mathModeSpace = '\\kern0pt';
  const spaceFix = (v) => v.replace(/(\d)\s*\\(?:kern|hspace\{?)0pt\}?\s*(?=\d)/g, '$1\\,').replace(/\\(?:kern|hspace\{?)0pt\}?\s*/g, '').replace(/(\d)\s*\\:\s*(?=\d)/g, '$1\\,').replace(/\\:\s*/g, '');
  let simInShadow = false;
  // MathLive viết gọn \frac12, \sqrt2: viết lại đủ ngoặc cho dễ đọc ở ô LaTeX và cho các bộ chuyển (MathType, Equation)
  const braceFix = (v) => v.replace(/\\(dfrac|tfrac|frac|binom)(\d)(\d)/g, '\\$1{$2}{$3}').replace(/\\(dfrac|tfrac|frac|binom)(\d)(?=\{)/g, '\\$1{$2}')
    .replace(/(\\(?:dfrac|tfrac|frac|binom)\{[^{}]*\})(\d)/g, '$1{$2}').replace(/\\sqrt(\d)/g, '\\sqrt{$1}');
  // chữ thường đứng ngay trước chữ có dấu (gõ "và" trong ô toán: v rồi tự chuyển sang chữ) gộp vào \text{…}: v\text{à} → \text{và}
  const textJoin = (v) => v.replace(/([A-Za-z]+)\\text\{(?=[À-ỹđĐ])/g, '\\text{$1');
  const mfVal = () => textJoin(braceFix(spaceFix(collapseSim(mf.getValue('latex-expanded'))))).trim();
  const fxValue = () => (fMode === 'v' ? mfVal() : collapseSim(fTex.value).trim());
  const syncTex = () => { fTex.value = mfVal(); previewF(); };

  // Chữ thường (có dấu tiếng Việt, có khoảng trắng) gõ ở ô riêng rồi đưa vào công thức dưới dạng \text{...}
  function addText() {
    const el = $('#fText'), v = el.value.replace(/[\\{}#~^]/g, '');
    if (!v.trim()) return;
    el.value = '';
    // % & _ $ không nằm được trong \text nên tách ra ngoài thành ký hiệu riêng
    fIns(v.split(/([%&_$])/).map((p) => (!p ? '' : /^[%&_$]$/.test(p) ? '\\' + p : '\\text{' + p + '}')).join(''), true);
  }
  // Gõ chữ ngay tại con trỏ: chuyển ô nhập giữa chế độ toán và chế độ chữ (nhận dấu cách, chữ có dấu)
  function syncTM() { const m = fMode === 'v' && mf.mode === 'text' ? 'text' : 'math'; for (const b of $('#fTM').children) b.setAttribute('aria-pressed', b.dataset.m === m); }
  function setTM(m) {
    if (fMode !== 'v') { $('#fText').focus(); return; }
    mf.focus();
    if (mf.mode !== m) mf.executeCommand(['switchMode', m]);
    syncTM();
  }
  // Enter: xuống dòng mới. Công thức nhiều dòng được giữ dưới dạng \displaylines{dòng 1 \\ dòng 2}
  function newLine() {
    const v = mfVal(), m = /^\s*\\displaylines\{([\s\S]*)\}\s*$/.exec(v), inner = m ? m[1] : (v || '\\placeholder{}');
    mf.setValue('', { silenceNotifications: true });
    mf.insert('\\displaylines{' + inner + '\\\\#?}', { focus: true, selectionMode: 'after' });
    // đưa con trỏ vào ô trống của dòng mới (không nhảy về ô trống còn sót ở các dòng trên)
    try { mf.selection = { ranges: [[mf.lastOffset - 1, mf.lastOffset]], direction: 'forward' }; } catch (e) { mf.executeCommand('moveToMathfieldEnd'); }
    if (mf.mode !== 'math') mf.executeCommand(['switchMode', 'math']);
    syncTex(); syncTM();
  }
  function fIns(t, raw) {
    if (t === '\\text{#?}' && !raw) { setTM(mf.mode === 'text' ? 'math' : 'text'); return; }
    if (fMode === 'v') { mf.focus(); mf.insert(t, { focus: true, selectionMode: t.includes('#?') ? 'placeholder' : 'after' }); fTex.value = mfVal(); }
    else { fTex.setRangeText(t.replace(/#[?@]/g, ''), fTex.selectionStart, fTex.selectionEnd, 'end'); fTex.focus(); }
    previewF();
  }
  function setPfx(p) { pfx = p; $('#fPfx').textContent = p ? 'Ctrl+' + p.toUpperCase() + ': gõ tiếp một phím' + (p === 'g' ? ' chữ cái để ra chữ Hy Lạp' : '') + '…' : ''; }
  // chữ có dấu tiếng Việt vừa vào ô toán (gõ trực tiếp hoặc qua Unikey / telex): đổi sang chữ đứng trong \text{…}
  // rồi để ô soạn ở chế độ gõ chữ cho các chữ tiếp theo
  // (làm sau sự kiện, một lần: MathLive phát sự kiện input lồng nhau khi xoá / chèn, xử lý ngay sẽ lặp vô tận)
  let viFix = false;
  mf.addEventListener('input', (e) => {
    syncTex();
    if (viFix || mf.mode !== 'math' || !e || e.inputType !== 'insertText') return;
    const at = (i) => { try { return mf.getValue(i - 1, i, 'latex').trim(); } catch (err) { return ''; } };
    const p = mf.position, d = at(p);
    if (d.length !== 1 || !/[À-ỹđĐ]/.test(d)) return;
    // lấy cả các chữ cái Latin liền trước (vd "v" trong "và") để cả từ nằm trong một \text{…}
    let i = p - 1, word = d;
    while (i > 0 && /^[A-Za-z]$/.test(at(i))) { word = at(i) + word; i--; }
    viFix = true;
    setTimeout(() => {
      try {
        for (let k = 0; k < word.length; k++) mf.executeCommand('deleteBackward');
        mf.executeCommand(['switchMode', 'text']);
        mf.insert(word, { mode: 'text' });
      } finally { viFix = false; }
      syncTM(); syncTex();
      $('#fPfx').textContent = 'Đã chuyển sang gõ chữ (Abc Chữ). Bấm Ctrl+Shift+E hoặc nút ∑ Toán để gõ toán tiếp.';
    }, 0);
  });
  mf.addEventListener('mode-change', () => setTimeout(syncTM, 0));
  mf.addEventListener('selection-change', syncTM);
  // Bắt phím ở tầng cửa sổ (pha bắt sự kiện), trước khi MathLive nhận: MathLive xử lý phím thật trước mọi bộ xử lý gắn trên
  // ô công thức, nên Tab (đẩy focus ra ngoài), Esc (chuyển sang mã LaTeX thô)… phải chặn từ đây mới có tác dụng.
  window.addEventListener('keydown', (e) => {
    if (!dlg.open || !e.composedPath().includes(mf)) return;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (pfx && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'Shift') return;
      const p = pfx, t = p === 'g' ? (GREEK[e.key] ? '\\' + GREEK[e.key] : null) : p === 't' ? TPL[e.key.toLowerCase()] : SYM[e.key.toLowerCase()];
      setPfx(null); stop();
      if (t) fIns(t);
      return;
    }
    // gõ hai dấu / liền nhau: ký hiệu song song ⫽ như sách (dấu / đầu đã tạo phân số: hoàn tác rồi thay)
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && mf.mode === 'math') {
      if (Date.now() - lastSlash < 1200) { stop(); lastSlash = 0; mf.executeCommand('undo'); mf.insert('⫽'); syncTex(); return; }
      lastSlash = Date.now();
    } else if (e.key.length === 1) lastSlash = 0;
    // chữ có dấu tiếng Việt gõ trong ô toán: tự chuyển sang gõ chữ (chữ đứng, có dấu cách) và nhắc cách làm
    if (e.key.length === 1 && /[À-ỹđĐ]/.test(e.key) && !/[α-ωΑ-Ω]/.test(e.key) && mf.mode === 'math' && !e.ctrlKey && !e.metaKey) {
      mf.executeCommand(['switchMode', 'text']); syncTM();
      $('#fPfx').textContent = 'Đã chuyển sang gõ chữ (Abc Chữ). Bấm Ctrl+Shift+E hoặc nút ∑ Toán để gõ toán tiếp.';
    }
    // Esc: đóng hộp soạn (không để MathLive chuyển cả công thức sang dạng mã LaTeX thô — dễ làm hỏng công thức)
    if (e.key === 'Escape' && mf.mode !== 'latex') { stop(); closeFx(false); return; }
    // Tab: sang ô trống kế tiếp; hết ô trống thì ra khỏi phân số, căn, mũ… sang bên phải (không chọn bao cả nhóm)
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey && mf.mode !== 'latex') {
      stop();
      const p0 = mf.position;
      // chỉ nhảy tới ô trống khi thật sự còn ô trống phía trước / phía sau: hết ô trống thì lệnh này của MathLive
      // chuyển focus sang phần tử khác trên trang (con trỏ "biến mất", gõ tiếp không vào công thức)
      let rest = '';
      try { rest = e.shiftKey ? mf.getValue(0, p0, 'latex') : mf.getValue(p0, mf.lastOffset, 'latex'); } catch (err) { rest = ''; }
      if (/\\placeholder/.test(rest)) mf.executeCommand(e.shiftKey ? 'moveToPreviousPlaceholder' : 'moveToNextPlaceholder');
      // hết ô trống: đi theo từng ô như MathType — cuối tử số → mẫu số, cuối mẫu số / số mũ / căn → ra ngoài bên phải
      // (Shift+Tab: đầu mẫu số → cuối tử số, đầu tử số → ra ngoài bên trái)
      if (mf.position === p0) { mf.executeCommand(e.shiftKey ? 'moveToGroupStart' : 'moveToGroupEnd'); mf.executeCommand(e.shiftKey ? 'moveToPreviousChar' : 'moveToNextChar'); }
      if (mf.position === p0) mf.executeCommand(e.shiftKey ? 'moveToPreviousChar' : 'moveToNextChar');
      return;
    }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { stop(); newLine(); return; }
    if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey) { stop(); mf.executeCommand('addRowAfter'); syncTex(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Backspace') { stop(); mf.executeCommand('removeRow'); syncTex(); return; }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (e.key === 'Enter') { stop(); closeFx(true); return; }
    if (!e.shiftKey && (key === 'g' || key === 't' || key === 'k')) { stop(); setPfx(key); return; }
    const t = SC[(e.shiftKey ? 'shift+' : '') + key];
    if (t) { stop(); fIns(t); }
  }, true);
  // Bàn phím toán: khi hiện, hộp công thức dời lên trên bàn phím (body.kb-open, --kbh = chiều cao bàn phím) để ô gõ và
  // các nút Chèn / Huỷ không bị che; có nút "Đóng bàn phím" ngay trên bàn phím; nút trong hộp đổi thành "Ẩn bàn phím"
  const kbSync = () => {
    const kb = window.mathVirtualKeyboard, on = !!(kb && kb.visible && dlg.open);
    let h = 0;
    try { h = on && kb.boundingRect ? Math.round(kb.boundingRect.height) : 0; } catch (e) { h = 0; }
    if (on && !h) { const el = document.querySelector('.ML__keyboard .MLK__plate') || document.querySelector('.ML__keyboard'); if (el) h = Math.min(Math.round(el.getBoundingClientRect().height), innerHeight); }
    document.body.classList.toggle('kb-open', on);
    if (on && h) document.body.style.setProperty('--kbh', h + 'px');
    $('#kbClose').hidden = !on;
    $('#fKb').textContent = on ? '⌨ Ẩn bàn phím' : '⌨ Bàn phím toán';
  };
  if (window.mathVirtualKeyboard) {
    ['geometrychange', 'virtual-keyboard-toggle', 'visibilitychange'].forEach((ev) => { try { window.mathVirtualKeyboard.addEventListener(ev, () => setTimeout(kbSync, 0)); } catch (e) { /* bản MathLive không có sự kiện này */ } });
  }
  const kbHide = () => { try { if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide(); } catch (e) { /* bỏ qua */ } setTimeout(kbSync, 50); };
  $('#fKb').onclick = () => { const kb = window.mathVirtualKeyboard; if (!kb) return; mf.focus(); if (kb.visible) kb.hide(); else kb.show(); setTimeout(kbSync, 50); setTimeout(kbSync, 400); };
  $('#kbClose').addEventListener('pointerdown', (e) => e.preventDefault()); // giữ con trỏ trong ô công thức
  $('#kbClose').onclick = () => { kbHide(); mf.focus(); };
  addEventListener('resize', () => { if (document.body.classList.contains('kb-open')) kbSync(); });

  function showTab(ti) {
    fTab = ti;
    const tabs = $('#tabs'), pal = $('#palette');
    [...tabs.children].forEach((b, i) => b.classList.toggle('on', i === ti));
    pal.innerHTML = '';
    const tab = PALETTE[ti];
    let items = tab.items;
    if (tab.grades) {
      // nhóm theo khối lớp: hàng nút Lớp 6 … Lớp 12, nhớ lớp đang dùng
      let g = 0;
      try { g = Math.min(tab.grades.length - 1, Math.max(0, +localStorage.getItem('tvs-grade-' + ti) || 0)); } catch (e) { /* không có bộ nhớ */ }
      const bar = document.createElement('div');
      bar.className = 'gradebar';
      tab.grades.forEach((gr, gi) => {
        const gb = document.createElement('button');
        gb.type = 'button'; gb.textContent = gr.name; gb.className = gi === g ? 'on' : '';
        gb.onmousedown = (e) => e.preventDefault();
        gb.onclick = () => { try { localStorage.setItem('tvs-grade-' + ti, gi); } catch (e) { /* bỏ qua */ } showTab(ti); };
        bar.appendChild(gb);
      });
      pal.appendChild(bar);
      items = tab.grades[g].items;
    }
    pal.classList.toggle('tall', !!tab.grades);
    items.forEach((item) => {
      const code = Array.isArray(item) ? item[1] : item;
      let shown = (Array.isArray(item) ? item[0] : item).replace(/#@|#\?/g, '\\square ');
      if (/^[\^_]/.test(shown)) shown = '\\square ' + shown;
      const b = document.createElement('button');
      b.type = 'button';
      if (tab.wide) b.className = 'wide';
      b.innerHTML = tex(shown, true);
      b.title = (SCREV.has(code) ? SCREV.get(code) + '  ·  ' : '') + code.replace(/#@|#\?/g, '□');
      b.onmousedown = (e) => e.preventDefault(); // giữ con trỏ trong ô công thức
      b.onclick = () => fIns(code);
      pal.appendChild(b);
    });
  }
  PALETTE.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.name; b.onclick = () => showTab(i); $('#tabs').appendChild(b); });

  function previewF() {
    clearTimeout(fT);
    fT = setTimeout(() => {
      const t = fxValue();
      if (!t) { fPrev.innerHTML = '<span class="ph">Công thức sẽ hiện ở đây, đúng như khi nằm trên trang.</span>'; return; }
      fPrev.innerHTML = `<span style="font-size:${fSt.size}px;color:${fSt.color}">${tex(texOf({ latex: t, bold: fSt.bold }))}</span>`;
    }, 120);
  }
  function setFMode(m) {
    fMode = m;
    for (const b of $('#fMode').children) b.setAttribute('aria-pressed', b.dataset.m === m);
    $('#fMathBox').hidden = m !== 'v'; fTex.hidden = m !== 'l'; $('#fVHint').hidden = m !== 'v';
    $('#fPaneT').textContent = m === 'v' ? 'TRỰC QUAN' : 'MÃ LATEX';
    if (m === 'v') { mf.setValue(fTex.value, { silenceNotifications: true }); setTimeout(() => mf.focus(), 30); } else { fTex.value = mfVal(); fTex.focus(); }
    syncTM();
  }
  for (const b of $('#fMode').children) b.onclick = () => setFMode(b.dataset.m);
  fTex.addEventListener('input', previewF);
  fTex.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); closeFx(true); } });
  const FCOL = ['#000000', '#1f3fa8', '#0a73c9', '#c81e1e', '#0f9d58', '#6a2fb5'];
  const fColBtns = FCOL.map((c) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.title = c; b.onclick = () => { fSt.color = c; syncF(); }; $('#fColors').append(b); return b; });
  function syncF() {
    const sel = $('#fSize'), pt = toPt(fSt.size);
    if (![...sel.options].some((o) => +o.value === pt)) { const o = document.createElement('option'); o.value = o.textContent = pt; sel.append(o); }
    sel.value = pt;
    $('#fBold').setAttribute('aria-pressed', fSt.bold);
    fColBtns.forEach((b, i) => b.setAttribute('aria-pressed', FCOL[i].toLowerCase() === String(fSt.color).toLowerCase()));
    mf.style.color = fSt.color;
    mf.style.fontWeight = fSt.bold ? '700' : '';
    previewF();
  }
  $('#fTextAdd').onclick = addText;
  for (const b of $('#fTM').children) b.onclick = () => setTM(b.dataset.m);
  $('#fText').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addText();
    if (e.ctrlKey || e.metaKey) closeFx(true);
  });
  $('#fSize').addEventListener('change', (e) => { fSt.size = toPx(+e.target.value); syncF(); });
  $('#fBold').onclick = () => { fSt.bold = !fSt.bold; syncF(); };
  $('#fKeys').onclick = () => { $('#fKeyList').hidden = !$('#fKeyList').hidden; };

  // st: {size, color, bold} của công thức đang sửa (bỏ trống khi chèn công thức vào dòng chữ)
  function openFx(latex, done, st, okLabel) {
    fxDone = done;
    if (st) Object.assign(fSt, { size: +st.size || 16, color: st.color || '#000000', bold: !!st.bold });
    fTex.value = latex || '';
    $('#fxok').textContent = okLabel || (latex ? 'Cập nhật' : 'Chèn vào trang');
    $('#fKeyList').hidden = true;
    setPfx(null);
    $('#fxback').hidden = false;
    dlg.show();
    if (!simInShadow && mf.shadowRoot) { addSimCss(mf.shadowRoot); simInShadow = true; }
    showTab(fTab);
    syncF();
    setFMode('v');
    // mở hộp mới luôn ở chế độ gõ toán (lần trước có thể dừng ở chế độ chữ)
    if (mf.mode !== 'math') { try { mf.executeCommand(['switchMode', 'math']); } catch (e) { /* bỏ qua */ } syncTM(); }
  }
  function closeFx(ok) {
    if (!dlg.open) return;
    const v = fxValue();
    dlg.close();
    $('#fxback').hidden = true;
    kbHide();
    const d = fxDone; fxDone = null;
    if (d) d(ok ? thFix(v) : null);
  }
  $('#fxok').onclick = () => closeFx(true);
  $('#fxcancel').onclick = () => closeFx(false);
  $('#fxback').addEventListener('pointerdown', (e) => e.preventDefault());
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); if (pfx) setPfx(null); else closeFx(false); } });

  function editFormula(o, isNew) {
    openFx(o.latex, (v) => {
      if (v !== null) Object.assign(o, { size: fSt.size, color: fSt.color, bold: fSt.bold });
      if (OFFICE && OFFICE.auto) return officeDone(o, v);
      if (v === null || (isNew && !v.trim())) {
        if (isNew) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); }
        return;
      }
      o.latex = v; renderObj(o); buildProps(); commit();
    }, o, OFFICE && OFFICE.auto ? 'Chèn vào ' + officeName() : null);
  }
  // gõ chữ ngay trong ô (sơ đồ): hiện chữ gốc (kể cả $…$), Enter / Esc / nhấp ra ngoài để xong, Shift+Enter xuống dòng;
  // selAll: chọn hết chữ để gõ đè (ô vừa tạo bằng Tab)
  function editShapeText(o, selAll) {
    const el = page.querySelector(`[data-id="${o.id}"]`); if (!el) return;
    let t = el.querySelector('.shtext');
    if (!t) { t = document.createElement('div'); t.className = 'shtext'; t.style.cssText = `font-size:${o.tsize || 16}px;color:${o.tcolor || '#111'};font-weight:${o.bold ? 700 : 400}`; el.appendChild(t); }
    el.classList.add('editing'); t.contentEditable = 'true'; t.textContent = o.text || ''; t.focus();
    const r = document.createRange(); r.selectNodeContents(t); if (!selAll) r.collapse(false);
    const s = document.getSelection(); s.removeAllRanges(); s.addRange(r);
    const done = () => {
      t.removeEventListener('blur', done); t.removeEventListener('keydown', key);
      o.text = t.innerText.replace(/\n+$/, ''); el.classList.remove('editing'); t.contentEditable = 'false';
      renderObj(o); sodo.refreshConns([o.id]); commit(); buildProps();
    };
    const key = (e) => { e.stopPropagation(); if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') { e.preventDefault(); t.blur(); } else if (e.key === 'Tab') { e.preventDefault(); t.blur(); const n = sodo.addBranch(o); if (n) setTimeout(() => editShapeText(n, true), 0); } };
    t.addEventListener('blur', done); t.addEventListener('keydown', key);
  }
  function editText(o) {
    const el = page.querySelector(`[data-id="${o.id}"]`);
    el.classList.add('editing');
    el.contentEditable = 'plaintext-only';
    el.textContent = o.text;
    el.focus();
    document.getSelection().selectAllChildren(el);
    let fxAt = -1;
    el.addEventListener('blur', () => {
      o.text = el.innerText.replace(/\n$/, '');
      el.classList.remove('editing');
      el.contentEditable = 'false';
      el.removeEventListener('keydown', onKey);
      if (!o.text.trim() && fxAt < 0) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); commit(); return; }
      renderObj(o); buildProps(); commit();
      if (fxAt >= 0) {
        // Ctrl+M khi đang gõ chữ: chèn công thức đúng vị trí con trỏ
        const at = Math.min(fxAt, o.text.length);
        openFx('', (v) => {
          if (v) { o.text = o.text.slice(0, at) + '$' + v + '$' + o.text.slice(at); renderObj(o); buildProps(); commit(); }
          else if (!o.text.trim()) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); commit(); }
        });
      }
    }, { once: true });
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') el.blur();
      else if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const sel = document.getSelection();
        if (sel.rangeCount) { const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(el); r.setEnd(sel.focusNode, sel.focusOffset); fxAt = r.toString().length; } else fxAt = el.innerText.length;
        el.blur();
      }
    };
    el.addEventListener('keydown', onKey);
  }

  // ---------- Chuột ----------
  const pagePt = (e) => { const r = page.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) / S.zoom), y: Math.round((e.clientY - r.top) / S.zoom) }; };
  function newTextAt(p) {
    S.placing = false; page.classList.remove('placing');
    const o = insert('text', null, { x: Math.max(0, p.x - 4), y: Math.max(0, p.y - 14), text: '', w: Math.max(160, Math.min(460, 794 - p.x - 24)) });
    setTimeout(() => editText(o), 0);
  }
  // chèn đoạn / mũi tên (đường nối tự do hai đầu mút): thẳng thì nằm ngang, cong thì chéo nhẹ
  function insLine(head, style) {
    const o = insert('shape', 'conn', { style: style || 'thang', head, color: '#111111', sw: 1.5 });
    o.p1 = { x: o.x, y: o.y + (style ? 60 : 30) }; o.p2 = { x: o.x + 170, y: o.y + (style ? 0 : 30) };
    renderObj(o); commit(); buildProps();
  }
  // kéo một đầu mút của đoạn / mũi tên / đường nối: đầu kia đứng yên; gần nằm ngang / thẳng đứng thì tự bắt thẳng,
  // giữ Shift: góc tròn bội 15°; thả lên ô chữ (sơ đồ) thì gắn đầu mút vào ô, thả ra ngoài thì đầu mút tự do
  function endDrag(e, o, k) {
    e.preventDefault(); e.stopPropagation();
    const [a, b] = sodo.ends(o), fixed = k === 1 ? b : a;
    let moved = false;
    const mv = (ev) => {
      moved = true;
      let p = pagePt(ev);
      const dx = p.x - fixed.x, dy = p.y - fixed.y, L = Math.hypot(dx, dy);
      if (L > 4) {
        let ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const step = ev.shiftKey ? 15 : 90, r = Math.round(ang / step) * step;
        if (ev.shiftKey || Math.abs(ang - r) < 6) { ang = r * Math.PI / 180; p = { x: Math.round(fixed.x + L * Math.cos(ang)), y: Math.round(fixed.y + L * Math.sin(ang)) }; }
      }
      // thả lên ô chữ / hình thoi / elip: gắn vào ô
      const box = S.objs.find((x) => x.type === 'shape' && sodo.CLOSED.includes(x.kind) && x.id !== o.id && p.x >= x.x && p.x <= x.x + x.w && p.y >= x.y && p.y <= x.y + x.h);
      const key = k === 1 ? 'from' : 'to', pk = k === 1 ? 'p1' : 'p2';
      if (box && !ev.altKey) { o[key] = box.id; delete o[pk]; }
      else { delete o[key]; o[pk] = p; }
      // đầu kia đang tự do: giữ nguyên toạ độ
      const ok = k === 1 ? 'p2' : 'p1', okey = k === 1 ? 'to' : 'from';
      if (!o[okey]) o[ok] = { x: fixed.x, y: fixed.y };
      renderObj(o);
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      if (moved) { commit(); buildProps(); }
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }
  page.addEventListener('pointerdown', (e) => {
    if (S.placing) { e.preventDefault(); e.stopPropagation(); if (document.activeElement) document.activeElement.blur(); newTextAt(pagePt(e)); return; }
    const el = e.target.closest('.obj');
    if (!el) { if (document.activeElement) document.activeElement.blur(); rubberBand(e); return; }
    if (el.classList.contains('editing')) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    const o = get(el.dataset.id);
    const mod = e.shiftKey || e.ctrlKey, wasIn = isSel(o.id) && many();
    if (mod) { toggleSel(o.id); if (!isSel(o.id)) return; } else if (!isSel(o.id)) select(o.id);
    if (e.target.classList.contains('pth') && !many()) return pointDrag(e, o, el, e.target.dataset.pt);
    if (e.target.classList.contains('roth') && !many()) return rotateDrag(e, o);
    if (e.target.classList.contains('plh') && !many()) { e.preventDefault(); return togglePlane(o, e.target.dataset.pl); }
    if (e.target.classList.contains('eph') && !many()) return endDrag(e, o, +e.target.dataset.ep);
    const resizing = e.target.classList.contains('handle') && !many();
    const p0 = { x: e.clientX, y: e.clientY }, st = { x: o.x, y: o.y, w: o.w, h: o.h, size: o.size, bw: el.offsetWidth };
    const moving = selObjs().map((x) => ({ o: x, sx: x.x, sy: x.y, b: boxOf(x), el: elOf(x.id) }));
    const sn = resizing ? null : snapper(moving);
    let moved = false;
    const mv = (ev) => {
      let dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (!resizing) {
        [dx, dy] = sn.snap(dx, dy, ev.altKey);
        moving.forEach((t) => {
          if (sodo.isConn(t.o)) {
            // đường nối: đầu mút gắn với ô thì đi theo ô; đầu mút tự do dời theo chuột
            if (!t.p) t.p = { p1: t.o.p1 && Object.assign({}, t.o.p1), p2: t.o.p2 && Object.assign({}, t.o.p2) };
            if (!t.o.from && t.p.p1) t.o.p1 = { x: Math.round(t.p.p1.x + dx), y: Math.round(t.p.p1.y + dy) };
            if (!t.o.to && t.p.p2) t.o.p2 = { x: Math.round(t.p.p2.x + dx), y: Math.round(t.p.p2.y + dy) };
            renderObj(t.o); return;
          }
          t.o.x = Math.round(t.sx + dx); t.o.y = Math.round(t.sy + dy); if (t.el) { t.el.style.left = t.o.x + 'px'; t.el.style.top = t.o.y + 'px'; }
        });
        sodo.refreshConns(moving.map((t) => t.o.id));
        return;
      }
      if (o.type === 'formula') o.size = Math.max(8, Math.min(96, Math.round(st.size * (st.bw + dx) / st.bw)));
      else if (o.type === 'text' || o.type === 'baitap') o.w = Math.max(60, Math.round(st.w + dx));
      else if (o.type === 'dattinh') o.size = Math.max(10, Math.min(96, Math.round(st.size * (st.w + dx) / st.w)));
      else {
        o.w = Math.max(o.type === 'shape' ? 4 : 80, Math.round(st.w + dx));
        o.h = Math.max(o.type === 'shape' ? 2 : 50, Math.round(st.h + dy));
      }
      renderObj(o);
      sodo.refreshConns([o.id]);
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      if (sn) sn.clear();
      if (moved) { commit(); buildProps(); return; }
      if (wasIn && !mod) select(o.id); // nhấp (không kéo) vào một đối tượng trong vùng chọn: chỉ chọn nó (hoặc nhóm của nó)
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  });
  page.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('roth')) { const ob = get(e.target.closest('.obj').dataset.id); if (ob.type === 'space') Object.assign(ob, Space.viewOf(ob.kind)); else { ob.yaw = 25; ob.pitch = 18; } renderObj(ob); commit(); buildProps(); msg('Đã về góc nhìn mặc định'); return; }
    const el = e.target.closest('.obj');
    if (!el) { newTextAt(pagePt(e)); return; } // nhấp đúp vào chỗ trống: gõ chữ ngay tại đó
    if (el.classList.contains('editing')) return;
    const o = get(el.dataset.id);
    if (o.type === 'shape' && sodo.CLOSED.includes(o.kind)) { editShapeText(o); return; }
    if (o.type === 'formula') editFormula(o);
    else if (o.type === 'text') {
      const fx = e.target.closest('.ifx');
      if (!fx) return editText(o);
      const g = textSegs(o.text)[+fx.dataset.i];
      if (!g || g.m === undefined) return editText(o);
      openFx(g.m, (v) => { if (v === null) return; const q = g.disp ? '$$' : '$'; o.text = o.text.slice(0, g.s) + q + v + q + o.text.slice(g.e); renderObj(o); buildProps(); commit(); });
    }
  });
  stage.addEventListener('pointerdown', (e) => { if (e.target === stage) select(null); });

  // ---------- Bảng thuộc tính ----------
  function buildProps() {
    const o = cur();
    props.innerHTML = '';
    if (many()) return multiProps();
    if (!o) {
      props.innerHTML = `<div class="help"><b>Bắt đầu nhanh</b><br>• Chọn <b>môn</b> (Toán, Vật lí, Hoá học, Sinh học, Tiểu học) và <b>giao diện cơ bản</b> ở góc dưới bên phải: thanh công cụ chỉ còn các nút cần dùng.<br>• Bấm <b>Công thức</b> (Ctrl+M) để soạn công thức, nhấp đúp để sửa.<br>• <b>Gõ chữ</b>: nhấp đúp vào chỗ trống bất kỳ trên trang (hoặc bấm <b>Văn bản</b> rồi nhấp vào trang) và gõ tiếng Việt ngay tại đó; <b>Ctrl+M</b> khi đang gõ để chèn công thức tại con trỏ.<br>• <b>Sửa lại công thức</b>: nhấp đúp vào công thức (kể cả công thức nằm trong dòng chữ), hoặc chọn rồi nhấn Enter/F2.<br>• <b>Đồ thị</b>, <b>Biến thiên</b>, <b>Xét dấu</b>, <b>Miền nghiệm</b>: nhập biểu thức ở khung này, hình tự cập nhật.<br>• <b>Hình không gian</b>: chọn loại hình rồi bấm <b>Chèn hình</b>; nét khuất tự vẽ đứt.<br>• Kéo để di chuyển, kéo ô vuông ở góc để co giãn.<br>• <b>Ctrl+C</b> rồi dán vào Word/PowerPoint dưới dạng ảnh nét cao.<br><br><b>Cú pháp biểu thức</b><br><code>x^3-3x+1</code>, <code>(2x+1)/(x-1)</code>, <code>sqrt(x)</code>, <code>|x|</code>, <code>sin x</code>, <code>ln(x)</code>, <code>log(x)</code>, <code>e^x</code>, <code>2^x</code>, <code>pi</code></div>`;
      return;
    }
    const add = (el) => { props.appendChild(el); return el; };
    const mk = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html !== undefined) el.innerHTML = html; return el; };
    const onEdit = (k, v, rebuild) => { o[k] = v; renderObj(o); sodo.refreshConns([o.id]); if (rebuild) buildProps(); };
    function field(k, label, kind, opt) {
      const wrap = mk('div');
      if (kind === 'chk') {
        const l = mk('label', 'chk'); const i = mk('input'); i.type = 'checkbox'; i.checked = !!o[k];
        i.onchange = () => { onEdit(k, i.checked); commit(); };
        l.append(i, label); wrap.appendChild(l); return wrap;
      }
      wrap.appendChild(mk('label', '', label));
      let i;
      if (kind === 'area') { i = mk('textarea'); i.rows = (opt && opt.rows) || 3; i.spellcheck = false; }
      // __on là hàm chạy khi đổi lựa chọn, không phải một lựa chọn
      else if (kind === 'sel') { i = mk('select'); for (const key in opt) { if (key === '__on' || typeof opt[key] !== 'string') continue; const op = mk('option', '', opt[key]); op.value = key; i.appendChild(op); } }
      else { i = mk('input'); i.type = kind === 'num' ? 'number' : kind === 'color' ? 'color' : 'text'; i.spellcheck = false; if (kind === 'num' && opt) i.step = opt; }
      i.value = o[k] === undefined ? '' : o[k];
      // ô chọn chưa có giá trị (thuộc tính mới, tài liệu cũ): hiện lựa chọn mặc định đầu tiên thay vì để trống
      if (kind === 'sel' && i.selectedIndex < 0 && i.options.length) i.selectedIndex = 0;
      i.dataset.k = k;
      const read = () => (kind === 'num' ? (i.value === '' ? 0 : parseFloat(i.value)) : i.value);
      if (kind === 'sel') i.onchange = () => { if (opt.__on) opt.__on(i.value); onEdit(k, i.value, true); commit(); };
      else { i.oninput = () => onEdit(k, read()); i.onchange = () => commit(); }
      wrap.appendChild(i);
      return wrap;
    }
    const row = (...els) => { const r = mk('div', 'row'); els.forEach((e) => r.appendChild(e)); return add(r); };
    const btn = (label, fn, primary) => { const b = mk('button', primary ? 'primary' : '', label); b.onclick = fn; return add(b); };
    const help = (html) => add(mk('div', 'help', html));
    const h4 = (t) => add(mk('h4', '', t));
    // dựng nhanh bằng nút bấm từ các điểm đã chọn trên hình
    const quickEd = (dim) => {
      const sel = ptSel(o), N = sel.length, Q = (t) => t, PLS = dim === 3 ? plSel(o) : [], NP = PLS.length;
      h4('Dựng nhanh');
      help(N || NP ? 'Đã chọn: <b>' + sel.join(', ') + '</b>' + (NP ? (N ? '; ' : '') + 'mặt phẳng <b>' + PLS.join(', ') + '</b>' : '') + ' (theo thứ tự nhấp)' : 'Nhấp vào các chấm tròn trên hình để chọn điểm (nhấp lại để bỏ). Chấm xanh dương: kéo để đổi toạ độ; chấm xanh lá: kéo để đổi thông số (a, h, góc…); chấm rỗng: điểm dựng từ điểm khác.');
      const box = mk('div'); box.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 6px';
      const addLines = (lines) => { o.script = String(o.script || '').replace(/\s*$/, '') + '\n' + lines.join('\n'); S.ptSel = null; renderObj(o); commit(); buildProps(); };
      const B = (label, need, title, fn) => { const b = mk('button', '', label); b.title = title; b.style.cssText = 'width:auto;padding:3px 8px;font-size:12px;margin:0'; const ok = typeof need === 'number' ? N === need : need(N); b.disabled = !ok; b.onclick = () => addLines(fn(sel)); box.appendChild(b); };
      const P = (a) => a.join('');
      B('＋ Điểm mới', () => true, 'Thêm một điểm tự do rồi kéo đến chỗ cần', () => {
        const n = freshName(o, 'M'), v = o._res && o._res.view;
        if (dim === 2) { const x = v ? Math.round(v.cx * 10) / 10 : 0, y = v ? Math.round(v.cy * 10) / 10 : 0; return [n + ' = (' + x + ', ' + y + ')', 'diem ' + n]; }
        return [n + ' = (0, 0, 0)', 'diem ' + n];
      });
      B('Đoạn', 2, 'Nối đoạn thẳng giữa 2 điểm', (a) => ['doan ' + P(a)]);
      if (dim === 3) B('Nét đứt', 2, 'Đoạn nét đứt', (a) => ['netdut ' + P(a)]);
      B('Đường thẳng', 2, 'Đường thẳng qua 2 điểm', (a) => ['duongthang ' + P(a)]);
      B('Vectơ', 2, 'Vectơ từ điểm 1 đến điểm 2', (a) => ['vecto ' + P(a)]);
      B('Trung điểm', 2, 'Trung điểm của 2 điểm đã chọn', (a) => { const n = freshName(o, 'M'); return [n + ' = trungdiem(' + a.join(', ') + ')', 'diem ' + n]; });
      if (dim === 2) B('Đường tròn', 2, 'Đường tròn tâm điểm 1, đi qua điểm 2', (a) => ['duongtron ' + a[0] + ' ' + a[1]]);
      B('Hạ vuông góc', 3, 'Từ điểm 1 hạ vuông góc xuống đường thẳng qua điểm 2 và 3', (a) => { const n = freshName(o, 'H'); return [n + ' = chan(' + a.join(', ') + ')', 'doan ' + a[0] + n, 'vuong ' + a[0] + n + a[2]]; });
      B('Phân giác góc', 3, 'Phân giác của góc tạo bởi 3 điểm, đỉnh là điểm thứ 2 (chọn theo thứ tự X, đỉnh, Y)', (a) => { const n = freshName(o, 'D'); return [n + ' = phangiacgoc(' + a.join(', ') + ')', 'tia ' + a[1] + n, 'an ' + n, 'goc ' + a[0] + a[1] + n + ' ' + n + a[1] + a[2]]; });
      B('Số đo góc', 3, 'Ghi số đo thật của góc (đỉnh là điểm thứ 2)', (a) => ['goc ' + P(a) + ' = ?']);
      B('Góc vuông', 3, 'Ký hiệu góc vuông (đỉnh là điểm thứ 2)', (a) => ['vuong ' + P(a)]);
      B('Trọng tâm', 3, 'Trọng tâm tam giác', (a) => { const n = freshName(o, 'G'); return [n + ' = trongtam(' + a.join(', ') + ')', 'diem ' + n]; });
      B('Hình bình hành', 3, 'Thêm đỉnh thứ tư để được hình bình hành (theo thứ tự đã chọn)', (a) => { const n = freshName(o, 'D'); return [n + ' = hbh(' + a.join(', ') + ')', 'dagiac ' + P(a) + n]; });
      B('Giao điểm', 4, 'Giao điểm của đường thẳng (1,2) và đường thẳng (3,4)', (a) => { const n = freshName(o, 'I'); return [n + ' = giao(' + a.join(', ') + ')', 'diem ' + n]; });
      B('Đánh dấu bằng nhau', 4, 'Gạch đánh dấu đoạn (1,2) bằng đoạn (3,4)', (a) => ['bang ' + a[0] + a[1] + ' ' + a[2] + a[3]]);
      B('Đa giác', (n) => n >= 3, 'Nối các điểm thành đa giác', (a) => ['dagiac ' + P(a)]);
      if (dim === 2) B('Độ dài', 2, 'Ghi độ dài thật của đoạn', (a) => ['ghi ' + P(a) + ' = ?']);
      if (dim === 3) {
        // các thao tác với mặt phẳng: nhấp vào ô vuông nhỏ ở tên mặt phẳng để chọn
        const pl = PLS[0], need = (np, f) => () => NP === np && f(N);
        const freshParam = (base) => { const used = new Set(Space.params(o.script).map((p) => p.name)); for (let i = 1; ; i++) if (!used.has(base + i)) return base + i; };
        B('Giao với mặt phẳng', need(1, (n) => n === 2), 'Giao điểm của đường thẳng (2 điểm) với mặt phẳng đã chọn', (a) => { const n = freshName(o, 'I'); return [n + ' = giao(' + a[0] + ', ' + a[1] + ', ' + pl + ')', 'duongthang ' + a[0] + n + ' keo 0.15', 'diem ' + n]; }); // vẽ đường thẳng tới tận giao điểm
        B('Hình chiếu lên mặt phẳng', need(1, (n) => n === 1), 'Hình chiếu vuông góc của điểm lên mặt phẳng đã chọn', (a) => { const n = freshName(o, 'H'); return [n + ' = chanmp(' + a[0] + ', ' + pl + ')', 'doan ' + a[0] + n, 'diem ' + n]; });
        B('Vuông góc với mặt phẳng', need(1, (n) => n === 1), 'Dựng đoạn vuông góc với mặt phẳng tại điểm đã chọn (điểm nằm trên mặt phẳng), dài 3', (a) => { const n = freshName(o, 'T'), h = freshParam('h'); return [h + ' = 3   # Độ dài ' + a[0] + n, n + ' = vuonggoc(' + a[0] + ', ' + pl + ', ' + h + ')', 'doan ' + a[0] + n]; });
        B('Đối xứng qua mặt phẳng', need(1, (n) => n === 1), 'Điểm đối xứng với điểm đã chọn qua mặt phẳng', (a) => { const n = freshName(o, 'K'); return [n + ' = doixungmp(' + a[0] + ', ' + pl + ')', 'netdut ' + a[0] + n, 'diem ' + n]; });
        B('Điểm trên mặt phẳng', need(1, (n) => n === 0), 'Thêm một điểm luôn nằm trên mặt phẳng đã chọn (kéo chấm xanh lá để di chuyển trên mặt phẳng)', () => { const n = freshName(o, 'M'), u = freshParam('u'), v = freshParam('v'); return [u + ' = 0.5   # Vị trí ' + n + ' trên (' + pl + ') theo chiều thứ nhất', v + ' = 0.5   # Vị trí ' + n + ' trên (' + pl + ') theo chiều thứ hai', n + ' = trenmp(' + pl + ', ' + u + ', ' + v + ')', 'diem ' + n]; });
        B('Mặt phẳng qua 3 điểm', need(0, (n) => n === 3), 'Vẽ mặt phẳng (tam giác) qua 3 điểm đã chọn', (a) => { const used = new Set(String(o.script).split('\n').map((l) => (l.trim().match(/^mp\s+([^\s:]+)/) || [])[1]).filter(Boolean)); const nm = ['Q', 'R', 'alpha', 'beta', 'P1', 'P2'].find((x) => !used.has(x)) || 'P' + used.size; return ['mp ' + nm + ': ' + a.join(' ')]; });
      }
      add(box);
      if (N) { const c = mk('button', '', 'Bỏ chọn'); c.style.cssText = 'padding:2px 8px;font-size:12px;margin-bottom:6px'; c.onclick = () => { S.ptSel = null; renderObj(o); buildProps(); }; add(c); }
    };    // các điểm cho bằng toạ độ số trong kịch bản: hiện thành ô số để sửa nhanh
    const coordEd = (dim) => {
      const RE = /^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?)\s*)?\)\s*(#.*)?$/;
      const rows = [];
      String(o.script || '').split('\n').forEach((ln, i) => { const m = ln.trim().match(RE); if (m && (dim === 3) === (m[4] !== undefined)) rows.push({ i, name: m[1], v: [m[2], m[3], m[4]].filter((x) => x !== undefined).map(Number), cm: m[5] || '' }); });
      if (!rows.length) return;
      h4('Toạ độ các điểm (' + (dim === 3 ? 'x, y, z' : 'x, y') + ')');
      rows.forEach((r) => {
        const wrap = mk('div'); wrap.style.cssText = 'display:flex;gap:4px;align-items:center;margin:2px 0';
        const lb = mk('label', '', r.name); lb.style.cssText = 'width:30px;margin:0;font-weight:600'; wrap.appendChild(lb);
        r.v.forEach((val, k) => {
          const inp = mk('input'); inp.type = 'number'; inp.step = '0.1'; inp.value = val; inp.title = ['x', 'y', 'z'][k]; inp.style.cssText = 'flex:1;min-width:0';
          inp.oninput = () => { const x = parseFloat(inp.value); if (isNaN(x)) return; r.v[k] = x; const L = String(o.script).split('\n'); L[r.i] = r.name + ' = (' + r.v.join(', ') + ')' + (r.cm ? '   ' + r.cm : ''); o.script = L.join('\n'); renderObj(o); const ta = props.querySelector('textarea[data-k="script"]'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wrap.appendChild(inp);
        });
        add(wrap);
      });
    };
    // đổi tên hiển thị của điểm: ghi thành dòng "nhan X = tên mới" trong kịch bản
    const nameEd = () => {
      const lines = String(o.script || '').split('\n'), defs = [], shown = {};
      lines.forEach((ln) => {
        const d = ln.trim().match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=/); if (d && !defs.includes(d[1])) defs.push(d[1]);
        const n = ln.trim().match(/^nhan\s+([A-Z](?:'{1,2}|_?\d)?)\s*=\s*(.*)$/); if (n) shown[n[1]] = n[2].trim();
      });
      if (!defs.length) return;
      h4('Tên hiển thị của điểm');
      const grid = mk('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px';
      defs.forEach((nm) => {
        const cell = mk('div'); cell.style.cssText = 'display:flex;align-items:center;gap:3px';
        const lb = mk('label', '', nm); lb.style.cssText = 'margin:0;font-size:11px;color:#667;min-width:18px';
        const inp = mk('input'); inp.type = 'text'; inp.value = shown[nm] !== undefined ? shown[nm] : nm; inp.style.cssText = 'width:100%;min-width:0'; inp.spellcheck = false;
        inp.onchange = () => {
          const v = inp.value.trim(), L = String(o.script).split('\n').filter((ln) => !new RegExp('^\\s*nhan\\s+' + nm.replace(/'/g, "\\'") + '\\s*=').test(ln));
          if (v !== nm) L.push('nhan ' + nm + ' = ' + v);
          o.script = L.join('\n'); renderObj(o); commit(); buildProps();
        };
        cell.append(lb, inp); grid.appendChild(cell);
      });
      add(grid);
      help('Để trống ô để ẩn tên điểm. Tên có thể là LaTeX, ví dụ <code>A\'</code>, <code>O_1</code>.');
    };    const range = () => {
      h4('Hệ trục');
      row(field('xmin', 'x từ'), field('xmax', 'đến'));
      row(field('ymin', 'y từ'), field('ymax', 'đến'));
      row(field('xstep', 'Bước chia x'), field('ystep', 'Bước chia y'));
      add(field('grid', 'Hiện lưới', 'chk')); add(field('ticks', 'Hiện vạch chia và số', 'chk'));
    };

    if (o.type === 'formula') {
      btn('✎ Sửa công thức…', () => editFormula(o), true);
      add(field('latex', 'Mã LaTeX', 'area', { rows: 4 }));
      const szw = mk('div'); szw.appendChild(mk('label', '', 'Cỡ chữ (pt, như Word)'));
      const szi = mk('input'); szi.type = 'number'; szi.step = 0.5; szi.min = 6; szi.value = toPt(o.size);
      szi.oninput = () => { const v = parseFloat(szi.value); if (v >= 4) { o.size = toPx(v); renderObj(o); } };
      szi.onchange = () => commit();
      szw.appendChild(szi);
      row(szw, field('color', 'Màu', 'color'));
      add(field('bold', 'Chữ đậm', 'chk'));
    } else if (o.type === 'text') {
      add(field('text', 'Nội dung (công thức đặt giữa $…$)', 'area', { rows: 6 }));
      btn('∑ Chèn công thức vào văn bản…', () => openFx('', (v) => { if (v) { o.text += (o.text && !/\s$/.test(o.text) ? ' ' : '') + '$' + v + '$'; renderObj(o); buildProps(); commit(); } }));
      row(field('size', 'Cỡ chữ', 'num'), field('color', 'Màu', 'color'));
      add(field('align', 'Căn lề', 'sel', { left: 'Trái', center: 'Giữa', right: 'Phải', justify: 'Đều hai bên' }));
      row(field('bold', 'Đậm', 'chk'), field('italic', 'Nghiêng', 'chk'));
    } else if (o.type === 'graph') {
      add(field('funcs', 'Hàm số y = … (mỗi dòng một hàm)', 'area', { rows: 3 }));
      add(field('legend', 'Hiện công thức hàm số', 'chk'));
      add(field('piTicks', 'Chia trục x theo π/2 (hàm lượng giác)', 'chk'));
      range();
      h4('Điểm, tiệm cận, hình phẳng');
      add(field('points', 'Điểm đánh dấu, vd: A(1; -2)', 'area', { rows: 2 }));
      add(field('proj', 'Vẽ đường gióng xuống hai trục', 'chk'));
      add(field('guides', 'Đường nét đứt, vd: x = 1, y = 2'));
      row(field('shadeA', 'Tô hình phẳng từ x ='), field('shadeB', 'đến x ='));
      help('Hình phẳng giới hạn bởi hàm thứ nhất và hàm thứ hai (hoặc trục Ox nếu chỉ có một hàm).');
      add(field('stroke', 'Độ dày nét', 'num', 0.1));
    } else if (o.type === 'bbt') {
      add(field('expr', o.signOnly ? 'Biểu thức f(x) cần xét dấu' : 'Hàm số y = f(x)'));
      row(field('a', 'Khảo sát từ (trống = −∞)'), field('b', 'đến (trống = +∞)'));
      btn(o.signOnly ? '⚙ Lập bảng xét dấu tự động' : '⚙ Lập bảng biến thiên tự động', () => {
        try { const note = autoBBT(o); renderObj(o); buildProps(); commit(); msg(note || 'Đã lập bảng cho ' + o.expr, !!note); } catch (e) { msg('Lỗi: ' + e.message, true); }
      }, true);
      h4('Chỉnh tay (LaTeX, ngăn cách bằng |)');
      add(field('xrow', 'Hàng x', 'area', { rows: 2 }));
      add(field('drow', o.signOnly ? 'Hàng dấu: dấu | giá trị | dấu …' : "Hàng y': dấu | giá trị | dấu …", 'area', { rows: 2 }));
      if (!o.signOnly) add(field('frow', 'Hàng y: giá trị tại từng cột', 'area', { rows: 3 }));
      row(field('lx', 'Nhãn hàng 1'), field('ld', 'Nhãn hàng 2'), ...(o.signOnly ? [] : [field('lf', 'Nhãn hàng 3')]));
      help('Dấu: <code>+</code> <code>-</code>; <code>x</code> = khoảng không xác định (gạch chéo); <code>||</code> = không xác định tại điểm. Ở hàng y, viết <code>-\\infty || +\\infty</code> cho giới hạn trái || phải. Mũi tên tự vẽ theo dấu của y\'. Có thể dùng tham số, vd <code>\\frac{m}{2}</code>.');
    } else if (o.type === 'region') {
      add(field('ineqs', 'Hệ bất phương trình (mỗi dòng một BPT)', 'area', { rows: 5 }));
      add(field('style', 'Cách thể hiện', 'sel', { hatch: 'Gạch bỏ phần không là nghiệm (kiểu SGK)', fill: 'Tô màu miền nghiệm' }));
      add(field('vertices', 'Ghi toạ độ các đỉnh của miền nghiệm', 'chk'));
      add(field('lineNames', 'Đặt tên đường thẳng d₁, d₂, …', 'chk'));
      add(field('vnames', 'Tên đỉnh theo lời giải (mỗi dòng một điểm, vd A(0; 3); bỏ trống: tự đặt A, B, C…)', 'area', { rows: 3 }));
      add(field('lnames', 'Tên đường thẳng theo thứ tự các BPT (mỗi dòng một tên, dòng trống: không ghi; bỏ trống cả ô: d₁, d₂…)', 'area', { rows: 3 }));
      help('Dùng <code>&lt;=</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&gt;</code>. Bất phương trình ngặt được vẽ bằng nét đứt.');
      range();
    } else if (o.type === 'solid') {
      const round = Solid.isRound(o.kind);
      add(field('kind', 'Loại hình', 'sel', Object.assign({ __on: (k) => Object.assign(o, { points: '', segs: '' }, SOLID_DEFAULTS[k]) }, Solid.KINDS)));
      if (round) {
        row(field('a', o.kind === 'noncut' ? 'Bán kính đáy lớn' : 'Bán kính', 'num', 0.1), ...(o.kind === 'noncut' ? [field('b', 'Bán kính đáy nhỏ', 'num', 0.1)] : []));
        if (o.kind !== 'cau') add(field('ch', 'Chiều cao', 'num', 0.1));
        add(field('pitch', 'Góc nhìn từ trên xuống (độ)', 'num'));
      } else {
        const cube = o.kind === 'lapphuong' || o.kind === 'tudien';
        row(field('a', 'Cạnh a', 'num', 0.1), ...(cube || (/chop3|langtru3/.test(o.kind) && o.base === 'deu') ? [] : [field('b', 'Cạnh b', 'num', 0.1)]), ...(cube ? [] : [field('ch', 'Chiều cao', 'num', 0.1)]));
        if (o.kind === 'chop3' || o.kind === 'langtru3') add(field('base', 'Đáy', 'sel', { deu: 'Tam giác đều cạnh a', vuongA: 'Tam giác vuông tại A (AB = a, AC = b)', vuongB: 'Tam giác vuông tại B (BC = a, BA = b)' }));
        if (o.kind === 'chop3' || o.kind === 'chop4') add(field('apex', 'Chân đường cao', 'sel', { tam: 'Tâm đáy (hình chóp đều)', A: 'Đỉnh A (SA ⊥ đáy)', B: 'Đỉnh B (SB ⊥ đáy)' }));
        if (o.kind === 'chopcut') add(field('ratio', 'Tỉ số đáy nhỏ / đáy lớn', 'num', 0.05));
        row(field('yaw', 'Xoay ngang (độ)', 'num'), field('pitch', 'Nhìn từ trên (độ)', 'num'));
        h4('Điểm và đoạn thẳng thêm');
        add(field('points', 'Điểm thêm (mỗi dòng một điểm)', 'area', { rows: 3 }));
        help('<code>M = SA</code>: trung điểm SA · <code>O = AC</code>: tâm đáy · <code>G = ABC</code>: trọng tâm tam giác.');
        add(field('segs', 'Đoạn nối thêm, vd: SO, AC, BM'));
        help('Nét liền / nét đứt được xác định tự động theo góc nhìn.');
      }
      add(field('labels', 'Hiện tên điểm / kích thước', 'chk'));
      add(field('fill', 'Tô nhạt các mặt nhìn thấy', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
    } else if (o.type === 'plane') {
      const kinds = { __on: (k) => { o.script = Plane.scriptOf(k); } };
      Plane.KINDS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Hình mẫu (chọn lại sẽ thay kịch bản bên dưới)', 'sel', kinds));
      const ps = Plane.params(o.script);
      if (ps.length) {
        h4('Thông số (đổi số thì hình và số đo đổi theo)');
        ps.forEach((p) => {
          const wdiv = mk('div'); wdiv.appendChild(mk('label', '', p.label));
          const inp = mk('input'); inp.type = 'number'; inp.step = 'any'; inp.value = p.value;
          inp.oninput = () => { if (inp.value === '' || isNaN(parseFloat(inp.value))) return; o.script = Plane.setParam(o.script, p.name, parseFloat(inp.value)); renderObj(o); const ta = props.querySelector('textarea'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wdiv.appendChild(inp); add(wdiv);
        });
        h4('Kịch bản');
      }
      quickEd(2);
      coordEd(2);
      nameEd();
      const scr = add(field('script', 'Kịch bản dựng hình: điểm và lệnh vẽ, mỗi dòng một ý', 'area', { rows: 13 }));
      scr.querySelector('textarea').addEventListener('change', () => buildProps());
      add(field('labels', 'Hiện tên điểm', 'chk'));
      add(field('dots', 'Chấm tròn tại mọi điểm', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      h4('Cách viết');
      help('<b>Điểm</b>: <code>A = (1, 2)</code> · <code>M = trungdiem(A, B)</code> · <code>H = chan(A, B, C)</code> (chân đường vuông góc từ A xuống BC) · <code>D = phangiac(A, B, C)</code> (<b>đỉnh A viết trước</b>: chân phân giác góc A của tam giác ABC, nằm trên BC) · <code>M = phangiacgoc(D, A, B, D, C)</code> (<b>đỉnh ở giữa</b> như lệnh goc: phân giác góc DAB cắt đường thẳng DC tại M) · <code>G = trongtam(A, B, C)</code> · <code>tructam</code> · <code>tamnoi</code> · <code>tamngoai</code> · <code>I = giao(A, B, C, D)</code> · <code>N = chia(A, B, 1/3)</code> · <code>doixung(A, O)</code> · <code>doixungtruc(A, B, C)</code> · <code>quay(A, O, 60)</code> · <code>tinhtien(A, B, C)</code> · <code>D = hbh(A, B, C)</code> · <code>tron(O, 3, 45)</code> · <code>tiepdiem(M, O, A, 1)</code>');
      help('<b>Nét vẽ</b>: <code>doan AB CD</code> · <code>netdut AH</code> · <code>dagiac ABCD</code> · <code>duongthang AB</code> · <code>tia OA</code> · <code>vecto AB</code> · <code>duongtron O A</code> hoặc <code>duongtron O 2.5</code> · <code>ngoaitiep ABC</code> · <code>noitiep ABC</code> · <code>cung O A B</code> · <code>quat O A B</code> · <code>to ABC</code> (tô nền)');
      help('<b>Vectơ, hệ trục</b>: <code>vecto AB = \\vec{a} do</code> (tên vectơ, màu đỏ; cũng dùng cho <code>doan</code>, <code>duongthang</code>) · <code>truc -1 5 -1 4 luoi</code> (hệ trục Oxy từ x = −1 đến 5, y = −1 đến 4, có lưới). Màu: <code>do</code>, <code>xanh</code>, <code>xanhla</code>, <code>xam</code>, <code>cam</code>, <code>tim</code>.');
      help('<b>Thông số và số đo</b>: dòng <code>so_do = 60  # chú thích</code> tạo một thông số; dùng tên đó trong toạ độ và phép dựng, ví dụ <code>B = quay(A, O, so_do)</code>. Viết <code>goc AOB = ?</code> hoặc <code>ghi AB = ? cm</code> để hình tự ghi số đo thật.');
      help('<b>Ký hiệu</b>: <code>goc BAC = 60^{\\circ}</code> (đỉnh ở giữa; thêm <code>x2</code> để vẽ hai cung) · <code>vuong BAC</code> · <code>bang AB AC = 1</code> (số gạch) · <code>ssong AB CD</code> · <code>ghi AB = 5\\,cm</code> · <code>diem M N</code> (chấm điểm) · <code>an P Q</code> (ẩn tên) · <code>nhan A = x</code> (đổi tên hiển thị)');
    } else if (o.type === 'space') {
      const kinds = { __on: (k) => { o.script = Space.scriptOf(k); Object.assign(o, Space.viewOf(k)); } };
      Space.KINDS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Hình mẫu (chọn lại sẽ thay kịch bản bên dưới)', 'sel', kinds));
      const ps = Space.params(o.script);
      if (ps.length) {
        h4('Thông số (đổi số thì hình đổi theo)');
        ps.forEach((p) => {
          const wdiv = mk('div'); wdiv.appendChild(mk('label', '', p.label));
          const inp = mk('input'); inp.type = 'number'; inp.step = 'any'; inp.value = p.value;
          inp.oninput = () => { if (inp.value === '' || isNaN(parseFloat(inp.value))) return; o.script = Space.setParam(o.script, p.name, parseFloat(inp.value)); renderObj(o); const ta = props.querySelector('textarea'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wdiv.appendChild(inp); add(wdiv);
        });
      }
      quickEd(3);
      coordEd(3);
      nameEd();
      h4('Góc nhìn');
      add(field('proj', 'Cách chiếu', 'sel', { xien: 'Chiếu xiên như SGK (mặt nằm ngang là hình bình hành)', xoay: 'Xoay tự do' }));
      if (o.proj === 'xoay') row(field('yaw', 'Xoay ngang (độ)', 'num'), field('pitch', 'Nhìn từ trên (độ)', 'num'));
      else row(field('ob', 'Góc xiên (độ)', 'num'), field('ok', 'Tỉ số rút gọn', 'num', 0.05));
      h4('Kịch bản');
      const scr = add(field('script', 'Kịch bản dựng hình (toạ độ x, y, z; z hướng lên)', 'area', { rows: 13 }));
      scr.querySelector('textarea').addEventListener('change', () => buildProps());
      add(field('labels', 'Hiện tên điểm', 'chk'));
      add(field('dots', 'Chấm tròn tại mọi điểm', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'), field('lcolor', 'Màu tên', 'color'));
      h4('Cách viết');
      help('<b>Điểm</b>: <code>A = (1, 2, 0)</code> · <code>trungdiem(A, B)</code> · <code>chia(A, B, 1/3)</code> · <code>trongtam(A, B, C)</code> · <code>tinhtien(M, A, B)</code> (M + vectơ AB) · <code>hbh(A, B, C)</code> · <code>chan(M, A, B)</code> (chân đường vuông góc xuống AB) · <code>chanmp(M, P)</code> (hình chiếu vuông góc lên (P)) · <code>vuonggoc(H, P, 3)</code> (điểm cách H một đoạn 3 trên đường vuông góc với (P)) · <code>giao(A, B, P)</code> (AB cắt (P)) · <code>giao(A, B, C, D)</code> · <code>chieu(M, P, A, B)</code> (chiếu song song theo phương AB) · <code>trenmp(P, 0.3, 0.6)</code> · <code>doixungmp(M, P)</code>');
      help('<b>Mặt phẳng</b>: <code>mp P ngang O 8 5</code> (nằm ngang, tâm O, rộng 8, sâu 5) · <code>mp Q dung O 6 4 30</code> (thẳng đứng, quay 30°) · <code>mp Q nghieng O 6 4 50</code> (nghiêng 50°) · <code>mp R: A B C D</code> (qua các điểm). Thêm <code>lien</code> để cạnh mặt phẳng luôn nét liền. <code>nhanmp P 2</code>: đặt tên ở góc thứ 2 (0 = ẩn). Tên <code>alpha</code>, <code>beta</code> hiện thành α, β.');
      help('<b>Nét vẽ</b>: <code>doan AB</code> · <code>duongthang AB = a do</code> (tên a, màu đỏ) · <code>keo 0.5</code> (kéo dài hai đầu) · <code>tia OA</code> · <code>vecto AB</code> · <code>dagiac ABC</code> · <code>netdut AH</code> / <code>netlien AH</code> (bắt buộc kiểu nét). Phần bị mặt phẳng che <b>tự vẽ nét đứt</b>. Màu: <code>do</code>, <code>xanh</code>, <code>xanhla</code>, <code>den</code>, <code>xam</code>, <code>cam</code>, <code>tim</code>.');
      help('<b>Hệ trục Oxyz (lớp 12)</b>: dòng <code>oxyz</code> để toạ độ điểm theo SGK 12 (Ox hướng về phía người nhìn, Oy sang phải, Oz lên trên) · <code>truc 4 4 4</code> vẽ ba trục · <code>toado M</code> vẽ các đường gióng và ghi toạ độ của M · <code>vecto OM = \\vec{u} do</code>');
      help('<b>Ký hiệu</b>: <code>vuong SHA</code> · <code>goc HAB = \\varphi</code> hoặc <code>= ?</code> (số đo thật) · <code>bang AI IB = 1</code> · <code>ghi MH = ?</code> · <code>diem I M</code> · <code>an X</code> · <code>nhan A1 = A\'</code> · <code>vitri A tren</code> · <code>to P</code>');
    } else if (o.type === 'sym') {
      const kinds = { __on: (k) => Object.assign(o, SGK.sizeOf(k)) };
      SGK.GROUPS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Ký hiệu', 'sel', kinds));
      if (o.kind === 'oluongtu') { add(field('data', 'Các ô (cách nhau bằng dấu cách)')); help('<code>ud</code>: hai electron ghép đôi · <code>u</code>: một electron · <code>d</code>: một electron quay xuống · <code>-</code>: ô trống. Ví dụ 2p⁴: <code>ud u u</code>'); }
      add(field('label', 'Nhãn phía trên (LaTeX, vd R_1)'));
      add(field('inner', 'Hiện chữ chú thích có sẵn trong hình', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      help('Kéo ô vuông ở góc để co giãn. Ghép các ký hiệu với nút <b>Đoạn</b> để vẽ sơ đồ mạch điện.');
    } else if (o.type === 'numline') {
      const kinds = { __on: (k) => Object.assign(o, JSON.parse(JSON.stringify(NumLine.KINDS[k][1]))) };
      for (const k in NumLine.KINDS) kinds[k] = NumLine.KINDS[k][0];
      add(field('kind', 'Mẫu (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      h4('Tập hợp, bất phương trình (mỗi dòng một trục số)');
      const sets = add(field('sets', '', 'area', { rows: 4 }));
      const nRows = () => String(o.sets || '').split('\n').filter((t) => t.trim()).length;
      let rowsNow = nRows();
      sets.querySelector('textarea').addEventListener('input', () => { const n = nRows(); if (n !== rowsNow && n > 0) { rowsNow = n; o.h = NumLine.rowsH(o.sets); renderObj(o); const hi = props.querySelector('[data-k="h"]'); if (hi) hi.value = o.h; } });
      help('Bất phương trình: <code>x &gt; 4</code> · <code>x &lt;= 3/4</code> · <code>-2 &lt; x &lt;= 3</code> · <code>x &lt; -1 hoặc x &gt;= 2</code> · <code>x != 2</code>.<br>Tập hợp: <code>(-2; 3)</code> · <code>[1; +oo)</code> · <code>(-oo; sqrt(2)]</code> · <code>{1; 2; 5}</code> · <code>R</code>. Đặt tên: <code>E = [1; +oo)</code>, rồi dùng ở dòng sau: <code>E ∩ F</code>, <code>A ∪ B</code>, <code>A \\ B</code>, <code>R \\ A</code> (kết quả tự tính).');
      add(field('style', 'Cách thể hiện', 'sel', { hatch: 'Gạch bỏ phần không thuộc tập, dùng ngoặc [ ( (kiểu SGK)', bold: 'Tô đậm phần thuộc tập, chấm tròn đặc / rỗng' }));
      add(field('rowLabels', 'Ghi tập hợp ở đầu mỗi trục (kèm kết quả phép toán)', 'chk'));
      add(field('colorful', 'Mỗi tập một màu', 'chk'));
      add(field('zero', 'Luôn ghi điểm 0', 'chk'));
      h4('Điểm trên trục số (mỗi dòng một điểm)');
      add(field('points', '', 'area', { rows: 4 }));
      help('<code>A = 7/4</code> · <code>N = -sqrt(2)</code> · <code>-2 1/3</code> (hỗn số) · <code>0,3</code> · <code>4,1(6)</code> (tuần hoàn). Thêm <code>: nhãn LaTeX</code> để tự ghi nhãn, vd <code>M = 1.41 : \\sqrt{2}</code>.');
      add(field('plabel', 'Nhãn điểm', 'sel', { ten: 'Tên điểm ở trên (không tên thì ghi số)', so: 'Giá trị ở trên, tên điểm ở dưới' }));
      h4('Trục số');
      add(field('ticks', 'Vạch chia đơn vị', 'chk'));
      add(field('nums', 'Ghi số dưới vạch chia', 'chk'));
      row(field('step', 'Đơn vị (khoảng giữa hai số)', 'num', 0.5), field('sub', 'Chia mỗi đơn vị thành', 'num', 1));
      row(field('xmin', 'Hiện từ (trống = tự động)'), field('xmax', 'đến'));
      add(field('xname', 'Tên ẩn ở cuối trục (vd x)'));
      row(field('color', 'Màu trục', 'color'), field('pcolor', 'Màu điểm', 'color'), field('ncolor', 'Màu tên', 'color'));
    } else if (o.type === 'venn') {
      const kinds = { __on: (k) => Object.assign(o, JSON.parse(JSON.stringify(NumLine.VKINDS[k][1]))) };
      for (const k in NumLine.VKINDS) kinds[k] = NumLine.VKINDS[k][0];
      add(field('kind', 'Mẫu (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      add(field('layout', 'Kiểu biểu đồ', 'sel', NumLine.LAYOUTS));
      add(field('names', 'Tên các tập (cách nhau bằng dấu phẩy)'));
      row(field('unv', 'Vẽ tập bao (khung chữ nhật)', 'chk'), field('uname', 'Tên tập bao'));
      h4('Phần tử (mỗi dòng một vùng)');
      add(field('elements', '', 'area', { rows: 4 }));
      help('<code>A: 1; 3; 5</code> chỉ thuộc A · <code>AB: 4; 27</code> thuộc cả A và B · <code>ABC: 0</code> · <code>ngoài: 8; 9</code> ngoài các tập. Phần tử cách nhau bằng dấu <code>;</code>.');
      h4('Tô vùng');
      add(field('shade', 'Biểu thức vùng tô (trống = không tô)'));
      help('<code>A ∩ B</code> · <code>A ∪ B</code> · <code>A \\ B</code> · <code>(A ∪ B) ∩ C</code> · <code>A\'</code> (phần bù) · <code>E \\ A</code>. Gõ được <code>\\cap</code>, <code>\\cup</code>, <code>\\</code>.');
      row(field('style', 'Kiểu tô', 'sel', { fill: 'Tô màu', hatch: 'Gạch chéo' }), field('fill', 'Màu tô', 'color'));
      add(field('colorful', 'Mỗi tập một màu viền', 'chk'));
      row(field('esize', 'Cỡ chữ phần tử', 'num'), field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu', 'color'));
    } else if (o.type === 'dattinh') {
      const kinds = { __on: (k) => Object.assign(o, { kieuchia: 'day', thapphan: 0 }, TieuHoc.DT_KINDS[k][1]) };
      for (const k in TieuHoc.DT_KINDS) kinds[k] = TieuHoc.DT_KINDS[k][0];
      add(field('kind', 'Mẫu', 'sel', kinds));
      add(field('expr', 'Phép tính')).querySelector('input').addEventListener('change', () => buildProps());
      try { const nt = TieuHoc.renderDatTinh(o).note; if (nt) help('<b>' + esc(nt) + '</b> (số chia là số thập phân: chuyển dấu phẩy như sách lớp 5).'); } catch (e) { /* phép tính chưa đúng: lỗi hiện ở dưới */ }
      help('Gõ <code>356 + 278</code> · <code>732 - 458</code> · <code>236 x 47</code> · <code>4536 : 12</code> · số thập phân dùng dấu phẩy: <code>45,08 + 24,9</code>. Phép cộng được nhiều số hạng: <code>125 + 348 + 207</code>.');
      if (/:|÷/.test(o.expr)) {
        add(field('kieuchia', 'Cách viết phép chia', 'sel', { day: 'Đầy đủ: ghi tích và dấu trừ ở từng bước (lớp 3)', gon: 'Viết gọn: chỉ ghi số dư (lớp 4, 5)' }));
        add(field('thapphan', 'Chia tiếp đến số chữ số ở phần thập phân của thương (0 = dừng, ghi số dư)', 'num', 1));
        if (o.kieuchia !== 'gon') add(field('dautru', 'Ghi dấu trừ ở mỗi bước (sách Kết nối tri thức không ghi)', 'chk'));
      }
      add(field('phong', 'Phông chữ số', 'sel', { sgk: 'Như sách giáo khoa (không chân)', times: 'Times New Roman' }));
      h4('Dùng làm bài tập');
      add(field('an', 'Phần cho học sinh làm', 'sel', { none: 'Hiện đầy đủ (bài mẫu)', kq: 'Để trống kết quả (học sinh tự tính)', otrong: 'Ô trống ở từng chữ số của kết quả', ngaunhien: 'Điền chữ số còn thiếu (giấu ngẫu nhiên)' }));
      if (o.an === 'ngaunhien') row(field('nan', 'Số chữ số giấu', 'num', 1), field('seed', 'Số xáo (đổi để giấu chỗ khác)', 'num', 1));
      add(field('dapan', 'Hiện đáp án (màu đỏ) — bản cho giáo viên', 'chk'));
      add(field('nho', 'Ghi số nhớ nhỏ (cộng, nhân với số có một chữ số)', 'chk'));
      row(field('size', 'Cỡ chữ số', 'num', 1), field('color', 'Màu', 'color'), field('acolor', 'Màu đáp án', 'color'));
      help('Kéo ô vuông ở góc để phóng to, thu nhỏ.');
    } else if (o.type === 'baitap') {
      const kinds = { __on: (k) => Object.assign(o, { de: '', cols: 1, head: false, headcol: false }, JSON.parse(JSON.stringify(TieuHoc.BT_KINDS[k][1]))) };
      for (const k in TieuHoc.BT_KINDS) kinds[k] = TieuHoc.BT_KINDS[k][0];
      add(field('kind', 'Dạng bài (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      if (o.kind !== 'tieude' && o.kind !== 'oly') add(field('de', 'Đề bài (lệnh), vd: Bài 1. Số?'));
      const TH_HELP = {
        tieude: 'Dòng đầu là tên phiếu, các dòng sau ghi thêm. <code>{}</code> là chỗ chấm để học sinh viết, vd <code>Họ và tên: {} Lớp: {}</code>.',
        otrong: 'Mỗi dòng một phép tính. <code>[]</code> ô trống (đáp án tự tính khi dòng có một ô trống), <code>[7]</code> ô trống có đáp án 7, <code>{30}</code> chỗ chấm có đáp án 30. Phân số viết <code>3/4</code>, nhân <code>x</code>, chia <code>:</code>.',
        sosanh: 'Mỗi dòng một cặp, đặt <code>(?)</code> vào chỗ điền dấu: <code>27 + 8 (?) 35</code>. Dấu đúng tự tính.',
        dungsai: 'Mỗi dòng một khẳng định. Đáp án tự tính với phép tính có dấu =, &lt;, &gt;; dòng khác thêm <code>[Đ]</code> hoặc <code>[S]</code> ở cuối.',
        khoanh: 'Dòng đầu là câu hỏi, các dòng sau là phương án (chữ A, B, C, D tự thêm). Đặt dấu <code>*</code> trước phương án đúng. Các câu cách nhau một dòng trống.',
        noi: 'Mỗi dòng một cặp đúng: <code>8 x 7 | 56</code>. Cột bên phải tự xáo thứ tự; đổi "Số xáo" để xáo kiểu khác.',
        maytinh: 'Mỗi dòng một chuỗi: <code>12 -&gt; +5 -&gt; [] -&gt; x2 -&gt; []</code>. Số trong ô trống tự tính.',
        bang: 'Mỗi dòng một hàng, các ô cách nhau bằng <code>|</code>. <code>[12]</code> là ô để trống, đáp án 12.',
        oly: 'Mỗi dòng nội dung là chữ / số mẫu viết ở đầu một dòng ô li.',
      };
      add(field('text', 'Nội dung', 'area', { rows: 7 }));
      help(TH_HELP[o.kind] || '');
      if (o.kind === 'oly') add(field('nrow', 'Số dòng ô li', 'num', 1));
      if (/otrong|sosanh|khoanh/.test(o.kind)) add(field('cols', 'Số cột', 'num', 1));
      if (o.kind === 'noi') add(field('seed', 'Số xáo', 'num', 1));
      if (o.kind === 'bang') row(field('head', 'Hàng đầu đậm', 'chk'), field('headcol', 'Cột đầu đậm', 'chk'));
      if (o.kind !== 'tieude' && o.kind !== 'oly') add(field('dapan', 'Hiện đáp án (màu đỏ) — bản cho giáo viên', 'chk'));
      if (/otrong|maytinh/.test(o.kind)) add(field('dauhoi', 'Ghi dấu ? trong ô trống (như sách)', 'chk'));
      if (o.kind !== 'tieude' && o.kind !== 'oly') add(field('kieude', 'Cách ghi đề bài', 'sel', { sgk: 'Như sách: số bài trong hình tròn, "Số" trong ô vàng', thuong: 'Chữ "Bài 1." in đậm' }));
      add(field('phong', 'Phông chữ', 'sel', { sgk: 'Như sách giáo khoa (không chân)', times: 'Times New Roman' }));
      row(field('size', 'Cỡ chữ', 'num', 1), field('color', 'Màu chữ', 'color'), field('acolor', 'Màu đáp án', 'color'));
    } else if (o.type === 'minhhoa') {
      const kinds = { __on: (k) => { Object.keys(o).forEach((key) => { if (!/^(id|type|x|y|grp)$/.test(key)) delete o[key]; }); Object.assign(o, { kind: k, color: '#222222' }, JSON.parse(JSON.stringify(MinhHoa.KINDS[k][1]))); } };
      for (const k in MinhHoa.KINDS) kinds[k] = MinhHoa.KINDS[k][0];
      add(field('kind', 'Mẫu (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      (MinhHoa.FIELDS[o.ve] || []).filter((f) => MinhHoa.fieldUse(o, f[0])).forEach((f) => {
        const el = add(field(f[0], MinhHoa.fieldLabel(o, f[0], f[1]), f[2] === 'area' ? 'area' : f[2] || 'text', f[2] === 'area' ? { rows: 4 } : f[3]));
        if (f[2] === 'sel') el.querySelector('select').addEventListener('change', () => buildProps());
      });
      if (MinhHoa.HELP[o.ve]) help(MinhHoa.HELP[o.ve]);
      add(field('color', 'Màu chữ, màu nét', 'color'));
      help('Kéo ô vuông ở góc để đổi kích thước. Hình được vẽ lại bằng nét, in rõ ở mọi cỡ.');
    } else if (o.type === 'shape') {
      if (sodo.CLOSED.includes(o.kind)) {
        // chữ trong ô (sơ đồ): nhấp đúp vào ô để gõ ngay trên trang
        add(field('text', 'Chữ trong ô (công thức giữa hai dấu $)', 'area', { rows: 2 }));
        row(field('tsize', 'Cỡ chữ', 'num'), field('tcolor', 'Màu chữ', 'color'));
        add(field('bold', 'Chữ đậm', 'chk'));
      }
      row(field('color', 'Màu nét', 'color'), field('sw', 'Độ dày', 'num', 0.5));
      add(field('dash', 'Nét đứt', 'chk'));
      if (o.kind === 'conn') {
        add(field('style', 'Kiểu đường', 'sel', { thang: 'Thẳng', cong: 'Cong (sơ đồ tư duy)', gap: 'Gấp khúc (sơ đồ khối)' }));
        add(field('head', 'Mũi tên', 'sel', { end: 'Một đầu', both: 'Hai đầu', none: 'Không có (đoạn thẳng)' }));
        help('Kéo nút tròn ở một đầu để xoay, kéo dài về hướng cần chỉ (gần nằm ngang / thẳng đứng thì tự bắt thẳng; giữ Shift: góc tròn 15°). ' +
          (o.from || o.to ? 'Đầu gắn với ô: kéo ô thì đường chạy theo; kéo đầu mút ra ngoài ô để gỡ.' : 'Thả đầu mút lên ô chữ để gắn vào ô. Kéo thân đường để dời cả đường.'));
      } else if (o.kind === 'line' || o.kind === 'arrow') {
        add(field('flip', 'Đảo hướng chéo', 'chk'));
        if (o.kind === 'arrow') add(field('head', 'Mũi tên', 'sel', { end: 'Một đầu', both: 'Hai đầu' }));
      } else { add(field('nofill', 'Không tô nền', 'chk')); add(field('fill', 'Màu nền', 'color')); }
      if (sodo.CLOSED.includes(o.kind)) btn('⊕ Thêm nhánh con (Tab)', () => sodo.addBranch(o));
    }
    h4('Vị trí' + (o.w && o.type !== 'formula' ? ' và kích thước' : ''));
    row(field('x', 'X', 'num'), field('y', 'Y', 'num'));
    if (o.type === 'baitap') add(field('w', 'Rộng', 'num'));
    else if (o.type !== 'formula' && o.type !== 'text' && o.type !== 'dattinh') row(field('w', 'Rộng', 'num'), field('h', 'Cao', 'num'));
    const er = add(mk('div', 'err')); er.id = 'perr'; showErr(er, o._err);
  }

  // ---------- Lệnh ----------
  function setZoom(z) {
    S.zoom = Math.max(0.4, Math.min(3, z));
    page.style.zoom = S.zoom;
    $('#zoomlbl').textContent = Math.round(S.zoom * 100) + '%';
  }
  const fxLatex = () => { const o = cur(); return o && o.type === 'formula' ? o.latex : null; };
  async function confirmDiscard() {
    if (!S.dirty || !S.objs.length) return true;
    return api ? api.confirm('Tài liệu chưa lưu. Bỏ các thay đổi?') : window.confirm('Tài liệu chưa lưu. Bỏ các thay đổi?');
  }
  // ---------- Thư viện của tôi, báo lỗi / góp ý: src/mod/thuvien.js ----------
  let modal, libThumb, openLib, openReport;
  // ---------- Soạn đề kiểm tra theo cấu trúc 2025, xuất sang Word: src/mod/soande.js ----------
  let openExam, openBaiGiai, makeBaiGiai, openKichBan;
  // ---------- Trình chiếu tương tác, mẫu theo bài sách Kết nối tri thức: src/mod/trinhchieu.js ----------
  let startPresent, stopPresent, openMau, isPresenting;
  function setFormulaFont(times) {
    document.body.classList.toggle('ftimes', !!times);
    try { localStorage.setItem('tvs-font-times', times ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    mkCache.clear(); renderAll(); paintSel();
    msg(times ? 'Công thức dùng phông kiểu Times New Roman (giống chữ trong Word)' : 'Công thức dùng phông mặc định');
  }
  try { if (localStorage.getItem('tvs-font-times') === '1') document.body.classList.add('ftimes'); } catch (e) { /* bỏ qua */ }
  // Môn / cấp học (chọn ở chân trang hoặc menu Xem): thanh công cụ chỉ hiện nhóm nút của môn đó.
  // Tiểu học: nhóm nút Tiểu học, công thức theo quy ước tiểu học. Vật lí / Hoá học / Sinh học: ẩn hình học và
  // bảng biến thiên…, danh sách ký hiệu chỉ còn của môn đó, bảng ký hiệu trong hộp công thức mở sẵn thẻ của môn.
  const MON = {
    tieuhoc: { ten: 'Tiểu học', the: 'Tiểu học', loi: 'Chế độ Tiểu học (lớp 1–5): nhóm nút Tiểu học ở thanh công cụ; công thức dùng dấu × và dấu phẩy thập phân' },
    toan: { ten: 'Toán THCS – THPT', the: 'Cơ bản', loi: 'Môn Toán THCS – THPT: hiện đủ công cụ' },
    li: { ten: 'Vật lí', the: 'Đơn vị đo', kyhieu: 'Vật lí', loi: 'Môn Vật lí: ký hiệu mạch điện, quang học, cơ học; đồ thị; bảng đơn vị đo trong hộp công thức' },
    hoa: { ten: 'Hoá học', the: 'Mũi tên & Hoá học', kyhieu: 'Hoá học', loi: 'Môn Hoá học: dụng cụ thí nghiệm, vòng benzen, ô lượng tử; mũi tên phản ứng trong hộp công thức' },
    sinh: { ten: 'Sinh học', the: 'Cơ bản', kyhieu: 'Sinh học', loi: 'Môn Sinh học: ký hiệu phả hệ, nhiễm sắc thể, ADN' },
  };
  let monHien = 'toan', symGroups = null;
  function setMon(m, quiet) {
    if (!MON[m]) m = 'toan';
    monHien = m;
    const M = MON[m], bd = document.body.classList;
    bd.toggle('tieuhoc', m === 'tieuhoc');
    ['li', 'hoa', 'sinh'].forEach((k) => bd.toggle('mon-' + k, m === k));
    bd.toggle('mon-khtn', !!M.kyhieu);
    fTab = Math.max(0, PALETTE.findIndex((t) => t.name === M.the));
    // danh sách ký hiệu SGK: chỉ các nhóm của môn đang chọn
    const yk = $('#symKind');
    if (yk && symGroups) {
      yk.replaceChildren(...symGroups.filter((og) => !M.kyhieu || og.label.startsWith(M.kyhieu)));
      if (!yk.value && yk.options.length) yk.selectedIndex = 0;
    }
    const lb = $('#gHinhLbl'); if (lb) lb.textContent = M.kyhieu ? 'Ký hiệu ' + M.ten : 'Hình học và ký hiệu Lí – Hoá – Sinh';
    const ld = document.querySelector('.g-dai > span'); if (ld) ld.textContent = m === 'li' ? 'Đồ thị' : 'Đại số & Giải tích';
    const b = $('#modeBadge'); if (b && b.value !== m) b.value = m;
    try { localStorage.setItem('tvs-mon', m); localStorage.removeItem('tvs-tieuhoc'); } catch (e) { /* bỏ qua */ }
    if (!quiet) msg(M.loi);
  }
  const setTieuHoc = (on, quiet) => setMon(on ? 'tieuhoc' : 'toan', quiet);
  // Giao diện cơ bản: chỉ các nút hay dùng (các nút class "nc" ẩn đi), cho thầy cô mới làm quen
  function setCoBan(on, quiet) {
    document.body.classList.toggle('coban', !!on);
    const b = $('#uiBadge'); if (b) b.textContent = on ? 'Giao diện cơ bản' : 'Giao diện đầy đủ';
    try { localStorage.setItem('tvs-coban', on ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    if (!quiet) msg(on ? 'Giao diện cơ bản: chỉ hiện các nút hay dùng — nhấp "Giao diện cơ bản" ở góc dưới để hiện đủ' : 'Giao diện đầy đủ: hiện mọi nút');
  }
  // quy ước trình bày tiểu học trong công thức: 2,5 (không có khoảng trắng sau dấu phẩy), dấu nhân ×
  const thFix = (v) => (document.body.classList.contains('tieuhoc') && v ? v.replace(/(\d),(?=\d)/g, '$1{,}').replace(/\\ast(?![a-zA-Z])|\*/g, '\\times ') : v);
  // phiếu bài tập mẫu: tiêu đề và các dạng bài hay gặp, xếp lần lượt từ trên xuống
  function phieuMau() {
    let y = Math.round(30 + stage.scrollTop / S.zoom);
    const ids = [];
    const put = (type, kind, extra) => { const o = insert(type, kind, Object.assign({ x: 40, y }, extra)); ids.push(o.id); const el = elOf(o.id); y += (el ? el.offsetHeight : o.h || 60) + 14; return o; };
    put('baitap', 'tieude', { w: 714 });
    put('baitap', 'otrong', { w: 714 });
    put('baitap', 'sosanh', { w: 714 });
    put('baitap', 'dungsai', { w: 420 });
    const de = put('baitap', 'otrong', { w: 714, de: 'Bài 4. Đặt tính rồi tính:', text: '' });
    de.text = ''; renderObj(de);
    y -= 6;
    [['cong', 40], ['tru', 210], ['nhan2', 380], ['chia1', 550]].forEach(([k, x]) => { const o = insert('dattinh', k, { x, y, an: 'kq' }); ids.push(o.id); });
    setSel(ids);
    commit();
    msg('Đã chèn phiếu bài tập mẫu — chọn từng phần để sửa nội dung ở khung Thuộc tính');
  }
  const CMD = {
    'ins-formula': () => editFormula(insert('formula'), true),
    'ins-text': () => { S.placing = true; page.classList.add('placing'); msg('Nhấp vào vị trí bất kỳ trên trang để gõ chữ (Esc: thôi)'); },
    'ins-graph': () => { insert('graph'); commit(); },
    'ins-bbt': () => { insert('bbt'); commit(); },
    'ins-sign': () => { insert('sign'); commit(); },
    'ins-region': () => { insert('region'); commit(); },
    'ins-solid': () => { const v = $('#solidKind').value; if (v.startsWith('sp:')) insert('space', v.slice(3)); else insert('solid', v); commit(); },
    'ins-plane': () => { insert('plane', $('#planeKind').value); commit(); },
    // chèn hình theo kịch bản (khối mã ```toanviet AI trả về) — hình phẳng hoặc không gian
    'ins-kichban': () => openKichBan(),
    'ins-sym': () => { insert('sym', $('#symKind').value); commit(); },
    'ins-numline': () => { insert('numline', document.body.classList.contains('tieuhoc') ? 'tiaso' : 'bpt'); commit(); },
    'ins-venn': () => { insert('venn', 'phantu'); commit(); },
    'ins-dattinh': () => { insert('dattinh', $('#dtKind').value); commit(); },
    'ins-baitap': () => { insert('baitap', $('#btKind').value); commit(); },
    'ins-minhhoa': () => { const v = $('#mhKind').value; if (v === 'tiaso') insert('numline', 'tiaso'); else insert('minhhoa', v); commit(); },
    'ins-phieu': () => phieuMau(),
    mau: () => openMau(),
    present: () => startPresent(false),
    'present-step': () => startPresent(true),
    tieuhoc: () => setTieuHoc(!document.body.classList.contains('tieuhoc')),
    'mon-tieuhoc': () => setMon('tieuhoc'), 'mon-toan': () => setMon('toan'), 'mon-li': () => setMon('li'), 'mon-hoa': () => setMon('hoa'), 'mon-sinh': () => setMon('sinh'),
    coban: () => setCoBan(!document.body.classList.contains('coban')),
    // đoạn, mũi tên: nằm ngang khi chèn; kéo hai đầu mút (nút tròn) để xoay về hướng cần chỉ
    'ins-line': () => insLine('none'),
    'ins-arrow': () => insLine('end'),
    'ins-rect': () => { insert('shape', 'rect'); commit(); },
    'ins-ellipse': () => { insert('shape', 'ellipse'); commit(); },
    // sơ đồ, sơ đồ tư duy
    'ins-box': () => { insert('shape', 'box'); commit(); },
    'ins-diamond': () => { insert('shape', 'diamond'); commit(); },
    'ins-darrow': () => insLine('both'),
    'ins-curve': () => insLine('end', 'cong'),
    'ins-connect': () => sodo.connectSelected(),
    'ins-mindmap': () => sodo.mindmap(),
    'add-branch': () => sodo.addBranch(get(S.sel)),
    undo: () => restore(S.hpos - 1),
    redo: () => restore(S.hpos + 1),
    del: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = S.objs.filter((o) => !ids.has(o.id) && !(sodo.isConn(o) && (ids.has(o.from) || ids.has(o.to)))); /* xoá ô thì xoá luôn đường nối gắn với ô */ S.sel = null; S.multi = []; renderAll(); buildProps(); commit(); },
    dup: () => { if (!S.multi.length) return; pasteMany(selObjs().map(cleanObj)); },
    front: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = S.objs.filter((t) => !ids.has(t.id)).concat(selObjs()); renderAll(); commit(); },
    back: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = selObjs().concat(S.objs.filter((t) => !ids.has(t.id))); renderAll(); commit(); },
    selall: () => { setSel(S.objs.map((o) => o.id)); msg('Đã chọn tất cả ' + S.multi.length + ' đối tượng'); },
    group: () => { if (!many()) return msg('Chọn từ hai đối tượng trở lên để nhóm (Shift + nhấp hoặc kéo khung chọn)', true); const g = 'g' + Date.now().toString(36); selObjs().forEach((o) => { o.grp = g; }); commit(); buildProps(); msg('Đã nhóm ' + S.multi.length + ' đối tượng — nhấp một đối tượng là chọn cả nhóm'); },
    ungroup: () => { const os = selObjs().filter((o) => o.grp); if (!os.length) return msg('Vùng chọn không có nhóm nào', true); os.forEach((o) => { delete o.grp; }); commit(); buildProps(); msg('Đã bỏ nhóm'); },
    copyimg: async () => {
      if (!cur()) return msg('Hãy chọn một đối tượng để sao chép', true);
      if (!api) return;
      try { await api.capture({ target: many() ? 'sel:' + S.multi.join(',') : S.sel, mode: 'clipboard' }); msg('Đã chép ảnh vào bộ nhớ tạm — dán (Ctrl+V) vào Word/PowerPoint'); } catch (e) { msg('Lỗi chép ảnh: ' + e.message, true); }
    },
    copytex: () => { const l = fxLatex(); if (l === null) return msg('Hãy chọn một công thức', true); if (api) api.copyText(multiline(l).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim')); msg('Đã chép mã LaTeX'); },
    copymml: () => {
      const l = fxLatex(); if (l === null) return msg('Hãy chọn một công thức', true);
      const mml = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' + MathLive.convertLatexToMathMl(multiline(l).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim')) + '</math>';
      if (api) api.copyText(mml);
      msg('Đã chép MathML — trong Word, dán bằng "Chỉ giữ văn bản" (Keep Text Only) để thành công thức');
    },
    png: async () => {
      if (!api) return;
      try { const f = await api.capture({ target: many() ? 'sel:' + S.multi.join(',') : S.sel || 'page', mode: 'file', name: S.sel ? 'hinh' : 'trang' }); if (f) msg('Đã xuất ' + f); } catch (e) { msg('Lỗi xuất ảnh: ' + e.message, true); }
    },
    pdf: async () => { if (!api) return; const z = S.zoom; setZoom(1); try { const f = await api.pdf(); if (f) msg('Đã xuất ' + f); } catch (e) { msg('Lỗi xuất PDF: ' + e.message, true); } setZoom(z); },
    new: async () => { if (await confirmDiscard()) { loadDoc([], null); if (api && api.draft) api.draft({ action: 'clear' }); } },
    open: async () => {
      if (!api || !(await confirmDiscard())) return;
      const r = await api.open();
      if (!r) return;
      try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); if (d.exam) S.exam = d.exam; msg('Đã mở ' + r.file + (d.exam ? ' (có đề kiểm tra ' + d.exam.qs.length + ' câu — Ctrl+Shift+D để mở)' : '')); if (api.draft) api.draft({ action: 'clear' }); } catch (e) { msg('Tệp không hợp lệ', true); }
    },
    save: async (as) => {
      if (!api) return;
      const data = JSON.stringify(Object.assign({ app: 'ToanVietStudio', version: 1, objects: JSON.parse(serialize()) }, S.exam && S.exam.qs.length ? { exam: S.exam } : {}), null, 1);
      const f = await api.save(data, as === true ? null : S.file);
      if (f) { S.file = f; S.dirty = false; title(); msg('Đã lưu ' + f); if (api.draft) api.draft({ action: 'clear' }); }
      return !!f;
    },
    'save-quit': async () => { if (await CMD.save()) api.quit(); },
    saveas: () => CMD.save(true),
    toword: () => toOffice('word'),
    toppt: () => toOffice('ppt'),
    fromoffice: async () => {
      if (!api) return;
      const r = await api.office({ action: 'read' });
      if (!r.ok) return msg(r.error, true);
      try {
        const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0))));
        o.x = 60; o.y = Math.round(50 + stage.scrollTop / S.zoom);
        if (o.type === 'group') { pasteGroup(o, 60, o.y); return msg('Đã lấy nhóm ' + o.objs.length + ' đối tượng từ ' + r.from); }
        paste(o);
        msg('Đã lấy đối tượng từ ' + r.from + '. Sửa xong bấm "Vào ' + r.from + '" để thay cho hình đang chọn.');
        if (o.type === 'formula') editFormula(o);
      } catch (e) { msg('Không đọc được dữ liệu của hình đang chọn', true); }
    },
    zoomin: () => setZoom(S.zoom + 0.1), zoomout: () => setZoom(S.zoom - 0.1), zoom100: () => setZoom(1),
    demo: async () => { if (await confirmDiscard()) window.__demo(); },
    lib: () => openLib(),
    exam: () => openExam(),
    baigiai: () => openBaiGiai(),
    'font-times': () => setFormulaFont(true),
    'font-tex': () => setFormulaFont(false),
    report: () => openReport(),
    update: () => checkUpdate(true),
  };
  // Lựa chọn 'chèn dạng Equation của Word' (nhớ cho lần sau)
  const eqMode = () => { try { return localStorage.getItem('tvs-insert-eq') === '1'; } catch (e) { return false; } };
  // ToanViet -> MathML để Word đổi sang Equation (dấu đồng dạng đổi thành ký hiệu ∽ chuẩn)
  const toMathML = (o) => MmlFix.convert(multiline(o.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim '));
  async function toOffice(app) {
    const o = cur();
    if (!o) return msg('Hãy chọn công thức hoặc hình cần chèn', true);
    if (!api) return;
    const name = app === 'word' ? 'Word' : 'PowerPoint';
    msg('Đang chèn vào ' + name + '…');
    const bytes = new TextEncoder().encode(many() ? JSON.stringify(groupData()) : JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));
    let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
    // công thức vào Word dạng Equation gốc (nếu người dùng chọn)
    const asEq = app === 'word' && o.type === 'formula' && !many() && eqMode();
    const r = asEq
      ? await api.office({ action: 'inserteq', app, mathml: toMathML(o), source: (OFFICE && OFFICE.source) || '', quick: !!(OFFICE && OFFICE.quitAfter) })
      : await api.office({ action: 'insert', app, target: many() ? 'sel:' + S.multi.join(',') : o.id, data: btoa(bin), source: (OFFICE && OFFICE.source) || '', quick: !!(OFFICE && OFFICE.quitAfter) });
    if (OFFICE) OFFICE.lastOk = r.ok;
    msg(r.ok ? 'Đã chèn vào ' + name + (r.replaced ? ' (thay cho hình đang chọn)' : ' tại vị trí con trỏ') : r.error, !r.ok);
  }
  function paste(o) {
    o.id = 'o' + S.seq++; o.x += 20; o.y += 20;
    S.objs.push(o); renderObj(o); select(o.id); commit();
  }
  const typing = () => {
    const a = document.activeElement;
    return dlg.open || (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable || a.tagName === 'MATH-FIELD'));
  };
  function run(cmd) {
    if ((cmd === 'undo' || cmd === 'redo') && typing()) { document.execCommand(cmd); return; }
    if (dlg.open) return;
    if (CMD[cmd]) CMD[cmd]();
  }
  $('#ribbon').addEventListener('click', (e) => { const b = e.target.closest('button[data-cmd]'); if (b) run(b.dataset.cmd); });
  // Thanh công cụ luôn nằm trên một hàng: cửa sổ hẹp thì thu gọn dần — bớt khoảng đệm, rồi lần lượt chuyển các nhóm ít dùng
  // sang dạng biểu tượng nhỏ hai hàng (tên nút hiện khi rê chuột), giống Word / PowerPoint
  function fitRibbon() {
    const rb = $('#ribbon');
    const grps = [...rb.querySelectorAll(':scope > .grp')];
    const lbl = (g) => g.dataset.ten || (g.querySelector(':scope > span') || {}).textContent || ''; // tên nhóm cố định (nhãn đổi theo môn)
    // thứ tự thu gọn: nhóm ít dùng trước
    const ORDER = ['Sắp xếp', 'Xuất sang Word / in ấn', 'Word / PowerPoint', 'Tệp', 'Hình vẽ', 'Sơ đồ', 'Đại số & Giải tích', 'Soạn thảo', 'Hình học và ký hiệu Lí – Hoá – Sinh', 'Tiểu học (lớp 1–5)'];
    const seq = ORDER.map((t) => grps.find((g) => lbl(g) === t)).filter(Boolean);
    const wraps = () => { const vis = grps.filter((g) => g.offsetParent !== null); return vis.length > 1 && vis.some((g) => g.offsetTop > vis[0].offsetTop + 4); };
    rb.classList.remove('gon', 'hep', 'cuon'); grps.forEach((g) => g.classList.remove('ic'));
    if (!wraps()) return;
    rb.classList.add('gon');
    for (const g of seq) { if (!wraps()) break; g.classList.add('ic'); }
    // cửa sổ rất hẹp: thu hẹp các ô chọn hình; vẫn chưa đủ thì giữ một hàng, cuộn ngang
    if (wraps()) rb.classList.add('hep');
    if (wraps()) rb.classList.add('cuon');
  }
  let fitT = 0;
  addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitRibbon, 80); });
  new MutationObserver(() => fitRibbon()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.__fitRibbon = fitRibbon; // kiểm thử
  fitRibbon();
  $('#modeBadge').onchange = (e) => setMon(e.target.value);
  $('#uiBadge').onclick = () => run('coban');
  if (api) api.onMenu(run);
  if (api && api.onLibFile) api.onLibFile(async (r) => {
    try {
      const d = JSON.parse(r.data);
      if (d.format !== 'tvslib' || !Array.isArray(d.items)) throw new Error('không phải gói thư viện');
      const items = await api.lib({ action: 'load' }), have = new Set(items.map((x) => x.id));
      const add = d.items.filter((it) => it && it.obj && it.obj.type && !have.has(it.id));
      if (!add.length) { await api.info('Các mục trong gói “' + r.file + '” đều đã có trong thư viện.'); return openLib(); }
      if (!(await api.confirm('Nhập ' + add.length + ' mục từ gói “' + r.file + '” vào Thư viện của tôi?'))) return;
      await api.lib({ action: 'save', items: items.concat(add) });
      openLib();
    } catch (e) { api.info('Không đọc được gói thư viện “' + r.file + '”: ' + e.message); }
  });
  if (api && api.onOpenFile) api.onOpenFile((r) => { try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); if (d.exam) S.exam = d.exam; msg('Đã mở ' + r.file); } catch (e) { msg('Tệp không hợp lệ', true); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.placing) { S.placing = false; page.classList.remove('placing'); msg('Sẵn sàng'); return; }
    if (typing()) return;
    const o = cur(), k = e.key.toLowerCase();
    if (o && e.key === 'F2') { e.preventDefault(); if (o.type === 'formula') editFormula(o); else if (o.type === 'text') editText(o); else if (o.type === 'shape' && sodo.CLOSED.includes(o.kind)) editShapeText(o); return; }
    // sơ đồ tư duy: Tab thêm nhánh con cho ô đang chọn; Enter gõ chữ trong ô
    if (o && e.key === 'Tab' && !many() && o.type === 'shape' && sodo.CLOSED.includes(o.kind)) { e.preventDefault(); const n = sodo.addBranch(o); if (n) setTimeout(() => editShapeText(n, true), 0); return; }
    if (o && e.key === 'Enter' && !many() && o.type === 'shape' && sodo.CLOSED.includes(o.kind)) { e.preventDefault(); editShapeText(o); return; }
    if (e.ctrlKey && k === 'm') { e.preventDefault(); run('ins-formula'); return; }
    if (e.ctrlKey && k === 'v' && S.clip) { e.preventDefault(); const c = JSON.parse(S.clip); if (Array.isArray(c)) pasteMany(c); else paste(c); return; }
    if (e.ctrlKey && k === 'a') { e.preventDefault(); run('selall'); return; }
    if (!o) return;
    if (e.ctrlKey && k === 'g') { e.preventDefault(); run(e.shiftKey ? 'ungroup' : 'group'); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); run('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); if (o.type === 'formula') editFormula(o); else if (o.type === 'text') editText(o); }
    else if (e.ctrlKey && k === 'd') { e.preventDefault(); run('dup'); }
    else if (e.ctrlKey && (k === 'c' || k === 'x')) {
      e.preventDefault();
      S.clip = many() ? JSON.stringify(selObjs().map(cleanObj)) : JSON.stringify(o, (key, v) => (key[0] === '_' ? undefined : v));
      if (k === 'x') run('del'); else run('copyimg');
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      selObjs().forEach((t) => { if (e.key === 'ArrowLeft') t.x -= d; if (e.key === 'ArrowRight') t.x += d; if (e.key === 'ArrowUp') t.y -= d; if (e.key === 'ArrowDown') t.y += d; renderObj(t); });
      paintSel(); commit();
    }
  });
  stage.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom(S.zoom + (e.deltaY < 0 ? 0.1 : -0.1)); } }, { passive: false });

  $('#credit').onclick = () => { if (api && api.about) api.about(); };
  const dk = $('#dtKind'), bk = $('#btKind');
  for (const k in TieuHoc.DT_KINDS) { const op = document.createElement('option'); op.value = k; op.textContent = TieuHoc.DT_KINDS[k][0]; dk.appendChild(op); }
  for (const k in TieuHoc.BT_KINDS) { const op = document.createElement('option'); op.value = k; op.textContent = TieuHoc.BT_KINDS[k][0]; bk.appendChild(op); }
  const mk = $('#mhKind');
  MinhHoa.GROUPS.forEach((g, gi) => { const og = document.createElement('optgroup'); og.label = g[0]; if (gi === 0) { const op = document.createElement('option'); op.value = 'tiaso'; op.textContent = 'Tia số (lớp 1 – 5)'; og.appendChild(op); } for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } mk.appendChild(og); });
  const yk = $('#symKind');
  SGK.GROUPS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } yk.appendChild(og); });
  symGroups = [...yk.children];
  try { setMon(localStorage.getItem('tvs-mon') || (localStorage.getItem('tvs-tieuhoc') === '1' ? 'tieuhoc' : 'toan'), true); setCoBan(localStorage.getItem('tvs-coban') === '1', true); } catch (e) { setMon('toan', true); }
  const pk = $('#planeKind');
  Plane.KINDS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } pk.appendChild(og); });
  const sk = $('#solidKind');
  Space.KINDS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = 'sp:' + k; op.textContent = g[1][k][0]; og.appendChild(op); } sk.appendChild(og); });

  // ---------- Chụp ảnh (gọi từ tiến trình chính) ----------
  let savedZoom = 1;
  window.__prepCapture = (target) => new Promise((res) => {
    savedZoom = S.zoom;
    document.body.classList.add('capturing');
    setZoom(1);
    setTimeout(() => {
      if (String(target).startsWith('sel:')) {
        // nhiều đối tượng: chụp vùng bao quanh tất cả
        const els = target.slice(4).split(',').map((id) => page.querySelector(`[data-id="${id}"]`)).filter(Boolean);
        if (!els.length) return res(null);
        els[0].scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const rs = els.map((x) => x.getBoundingClientRect()), x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));
        return res({ x: Math.max(0, x0 - 8), y: Math.max(0, y0 - 8), width: x1 - x0 + 16, height: y1 - y0 + 16, depthPt: 0 });
      }
      const el = target === 'page' ? page : page.querySelector(`[data-id="${target}"]`);
      if (!el) return res(null);
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      res(measureCapture(el, target));
    }, 40);
  });
  // vùng cần chụp của một đối tượng (công thức: cắt sát và tính độ hạ dòng để khớp đường chân chữ trong Word)
  function measureCapture(el, target) {
    {
      const r = el.getBoundingClientRect(), pad = target === 'page' ? 0 : 8;
      let padB = pad, depthPt = 0;
      const o = get(target);
      if (o && o.type === 'formula' && el.firstElementChild) {
        // đo đường chân chữ của công thức, rồi chỉnh lề dưới để phần nằm dưới chân chữ là số nguyên point
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        el.firstElementChild.appendChild(probe);
        const descent = Math.max(0, r.bottom - probe.getBoundingClientRect().top);
        probe.remove();
        depthPt = Math.ceil((descent + 3) * 0.75);
        padB = depthPt / 0.75 - descent;
      }
      const padX = depthPt ? -2 : pad, padT = depthPt ? 1 : pad; // công thức chèn giữa dòng chữ: cắt sát để không hở xa chữ, không đẩy dòng
      return { x: Math.max(0, r.left - padX), y: Math.max(0, r.top - padT), width: r.width + 2 * padX, height: r.height + padT + padB, depthPt };
    }
  }
  // chụp nhiều công thức một lượt (chuyển đổi hàng loạt): đo tất cả rồi tiến trình chính chụp liên tiếp
  window.__prepBatch = (ids) => new Promise((res) => {
    savedZoom = S.zoom;
    document.body.classList.add('capturing');
    setZoom(1); stage.scrollTop = 0; stage.scrollLeft = 0;
    setTimeout(() => res(ids.map((id) => { const el = page.querySelector(`[data-id="${id}"]`); return el ? measureCapture(el, id) : null; })), 40);
  });
  window.__endCapture = () => { document.body.classList.remove('capturing'); setZoom(savedZoom); };

  // Dùng khi chụp ảnh minh hoạ: thêm đối tượng bằng lệnh
  window.__clear = () => loadDoc([], null);
  window.__add = (type, kind, extra) => { const o = insert(type, kind, extra); renderObj(o); return o.id; };
  window.__get = (id) => get(id);
  window.__unselect = () => select(null);
  window.__run = (c) => run(c);

  // ---------- Tài liệu mẫu ----------
  window.__demo = () => {
    S.seq = 1;
    const objs = [];
    const mkObj = (type, kind, extra) => { const o = Object.assign({ id: 'o' + S.seq++, type }, defaults(type, kind), extra); if (o.type === 'bbt') autoBBT(o); objs.push(o); };
    mkObj('text', null, { x: 40, y: 22, w: 714, size: 21, bold: true, align: 'center', color: '#1f3f7a', text: 'KHẢO SÁT HÀM SỐ – MIỀN NGHIỆM – HÌNH KHÔNG GIAN' });
    mkObj('text', null, { x: 40, y: 66, w: 714, text: 'Ví dụ 1. Khảo sát sự biến thiên và vẽ đồ thị hàm số $y=x^{3}-3x$. Ta có $y\'=3x^{2}-3$; $y\'=0\\Leftrightarrow x=\\pm 1$.' });
    mkObj('graph', null, { x: 40, y: 128, w: 320, h: 300, points: 'A(-1; 2)\nB(1; -2)' });
    mkObj('bbt', null, { x: 380, y: 132, w: 374, h: 160 });
    mkObj('formula', null, { x: 384, y: 306, size: 19, latex: '\\int_{-1}^{0}\\left(x^{3}-3x\\right)\\mathrm{d}x=\\left.\\left(\\frac{x^{4}}{4}-\\frac{3x^{2}}{2}\\right)\\right|_{-1}^{0}=\\frac{5}{4}' });
    mkObj('sign', null, { x: 380, y: 360, w: 374, h: 70 });
    mkObj('text', null, { x: 40, y: 440, w: 714, text: 'Ví dụ 2. Hàm số $y=\\dfrac{2x+1}{x-1}$ có tiệm cận đứng $x=1$, tiệm cận ngang $y=2$.' });
    mkObj('bbt', null, { x: 40, y: 494, w: 380, h: 160, expr: '(2x+1)/(x-1)' });
    mkObj('graph', null, { x: 440, y: 478, w: 314, h: 250, funcs: '(2x+1)/(x-1)', xmin: '-5', xmax: '7', ymin: '-4', ymax: '8', xstep: '2', ystep: '2', guides: 'x = 1, y = 2' });
    mkObj('text', null, { x: 40, y: 668, w: 380, text: 'Ví dụ 3. Miền nghiệm của hệ $\\begin{cases}x+y\\le 4\\\\x-2y\\le 2\\\\x\\ge 0,\\ y\\ge 0\\end{cases}$' });
    mkObj('region', null, { x: 40, y: 770, w: 280, h: 280 });
    mkObj('solid', 'chop4', { x: 330, y: 735, w: 210, h: 210 });
    mkObj('solid', 'hop', { x: 545, y: 745, w: 215, h: 190 });
    mkObj('solid', 'tru', { x: 330, y: 945, w: 140, h: 170 });
    mkObj('solid', 'non', { x: 472, y: 945, w: 140, h: 170 });
    mkObj('solid', 'cau', { x: 615, y: 955, w: 145, h: 150 });
    loadDoc(objs, null);
  };

  // bản mới đặt trong thư mục dùng chung của tổ (tệp ToanVietStudio-Setup-x.y.z.exe)
  async function checkUpdate(manual) {
    if (!api || !api.shared || (api.officeMode && api.officeMode.app)) return;
    const sh = await api.shared({ action: 'get' });
    if (!sh.dir) { if (manual) api.info('Chưa chọn thư mục dùng chung của tổ.\n\nMở Thư viện (Ctrl+L) ▸ thẻ "Thư viện tổ" ▸ "Chọn thư mục…". Người phụ trách chép bộ cài bản mới (ToanVietStudio-Setup-x.y.z.exe) vào thư mục đó, các máy sẽ tự thấy bản mới.'); return; }
    if (!sh.ok) { if (manual) api.info('Không mở được thư mục dùng chung: ' + sh.dir); return; }
    const r = await api.shared({ action: 'checkUpdate' });
    if (!r) return;
    if (r.none) { if (manual) api.info('Đang dùng bản mới nhất (' + r.current + ').'); return; }
    if (!(await api.confirm('Đã có ToanViet Studio ' + r.version + ' trong thư mục dùng chung của tổ.\n\nCài bản mới ngay? Phần mềm sẽ đóng rồi chạy bộ cài (nếu tài liệu chưa lưu, phần mềm sẽ hỏi trước).'))) return;
    await api.shared({ action: 'runUpdate', file: r.file });
  }
  setTimeout(() => checkUpdate(false), 4000);
  // nạp các mô-đun (src/mod/*.js) trước lần vẽ đầu tiên
  ({ isSel, selObjs, many, cleanObj, paintSel, groupOf, setSel, toggleSel, elOf, boxOf, groupData, pasteGroup, pasteMany, multiProps, rubberBand, snapper } = TVM.chonnhieu({ page, props, S, msg, get, commit, title, renderObj, pagePt, buildProps, run }));
  ({ ptSel, plSel, togglePlane, rotateDrag, pointHandles, freshName, pointDrag } = TVM.keodiem({ $, S, msg, cur, commit, title, renderObj, buildProps }));
  sodo = TVM.sodo({ S, get, renderObj, commit, select, setSel, buildProps, msg, insert, elOf });
  ({ modal, libThumb, openLib, openReport } = TVM.thuvien({ $, stage, api, S, esc, LOG, msg, cur, title, many, groupData, pasteGroup, select, paste }));
  ({ startPresent, stopPresent, openMau, isPresenting } = TVM.trinhchieu({ $, page, stage, S, esc, msg, insert, renderObj, renderAll, buildProps, commit, setSel, elOf, modal, setZoom }));
  ({ openBaiGiai, makeBaiGiai, openKichBan } = TVM.baigiai({ $, page, api, S, esc, msg, modal, tex, renderObj, renderAll, toPx, defaults, insert, commit }));
  window.__baigiai = { open: () => openBaiGiai(), make: (t) => makeBaiGiai(t) }; // kiểm thử
  ({ openExam } = TVM.soande({ $, page, api, S, esc, msg, cur, title, textHtml, renderObj, many, cleanObj, elOf, groupData, select, dlg, openFx, modal, libThumb }));

  loadDoc([], null);

  // ---------- Tự lưu bản nháp và khôi phục ----------
  let draftSig = '';
  const saveDraft = () => {
    if (!api || !api.draft || !S.dirty || !(S.objs.length || (S.exam && S.exam.qs.length))) return;
    const data = S.exam && S.exam.qs.length ? JSON.stringify({ objects: JSON.parse(serialize()), exam: S.exam }) : serialize();
    if (data === draftSig) return;
    draftSig = data;
    api.draft({ action: 'write', data, file: S.file });
  };
  setInterval(saveDraft, 60000);
  window.addEventListener('blur', saveDraft); // chuyển sang cửa sổ khác: lưu ngay bản nháp
  window.__saveDraftNow = saveDraft;
  (async () => {
    if (!api || !api.draft || (api.officeMode && api.officeMode.app)) return;
    const d = await api.draft({ action: 'read' });
    if (!d || !d.data) return;
    let objs, exam = null; try { objs = JSON.parse(d.data); } catch (e) { return; }
    if (objs && !Array.isArray(objs)) { exam = objs.exam || null; objs = objs.objects || []; }
    if (!Array.isArray(objs) || !(objs.length || exam)) return;
    const when = new Date(d.time).toLocaleString('vi-VN');
    const ok = await api.confirm('Lần trước ToanViet Studio đã đóng khi tài liệu chưa được lưu' + (d.file ? ' (' + d.file.replace(/^.*[\\/]/, '') + ')' : '') + '.\n\nBản nháp tự lưu lúc ' + when + ' có ' + objs.length + ' đối tượng.\n\nKhôi phục bản nháp này?');
    if (ok) {
      loadDoc(objs, d.file || null);
      if (exam) S.exam = exam;
      S.dirty = true; title();
      msg('Đã khôi phục bản nháp lúc ' + when + '. Nhớ bấm Lưu (Ctrl+S).');
    } else api.draft({ action: 'clear' });
  })();

  // ---------- Chế độ add-in: mở từ nút ToanViet trong Word / PowerPoint, chèn xong tự đóng ----------
  const OFFICE = api && api.officeMode ? { app: api.officeMode.app, mode: api.officeMode.mode, sizePt: api.officeMode.sizePt, op: api.officeMode.op, auto: false, lastOk: false, source: '' } : null;
  // cỡ công thức mới lấy theo cỡ chữ tại con trỏ trong Word (mặc định 12 pt)
  const officeSize = () => (OFFICE.sizePt >= 5 && OFFICE.sizePt <= 200 ? toPx(OFFICE.sizePt) : 16);
  const officeName = () => (OFFICE.app === 'word' ? 'Word' : 'PowerPoint');
  async function officeInsertAndQuit() {
    if (!cur()) return msg('Hãy chọn (nhấp vào) đối tượng cần chèn vào ' + officeName(), true);
    OFFICE.quitAfter = true; // cho phép ẩn cửa sổ ngay khi đã có ảnh, không chờ Word chèn xong
    await toOffice(OFFICE.app);
    OFFICE.quitAfter = false;
    if (OFFICE.lastOk) api.quit();
  }
  // Công thức soạn xong trong hộp thoại: chèn luôn rồi đóng; huỷ thì đóng
  async function officeDone(o, v) {
    if (v === null || !v.trim()) return api.quit();
    o.latex = v; renderObj(o); select(o.id);
    await officeInsertAndQuit();
    if (!OFFICE.lastOk) { OFFICE.auto = false; buildProps(); } // lỗi: giữ cửa sổ để người dùng thử lại bằng nút trên thanh
  }
  // ---------- Chuyển đổi hàng loạt công thức trong tài liệu Word ----------
  const CONVERT = {
    mt2tv: { kind: 'ole', from: 'MathType', to: 'ToanViet' },
    eq2tv: { kind: 'omath', from: 'Equation', to: 'ToanViet' },
    tv2eq: { kind: 'tvs', from: 'ToanViet', to: 'Equation' },
    tv2mt: { kind: 'tvs', from: 'ToanViet', to: 'MathType' },
    tex2tv: { kind: 'latex', from: 'mã LaTeX', to: 'ToanViet' },
    tv2tex: { kind: 'tvs', from: 'ToanViet', to: 'mã LaTeX' },
  };
  const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const objToB64 = (o) => { const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v))); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
  async function runConvert() {
    const cv = CONVERT[OFFICE.op];
    const veil = document.createElement('div');
    veil.id = 'convveil';
    veil.innerHTML = '<div><b>ToanViet Studio</b><p id="convmsg">Đang tìm công thức ' + (cv ? cv.from : '') + ' trong tài liệu…</p></div>';
    document.body.appendChild(veil);
    const say = (t) => { $('#convmsg').textContent = t; };
    const finish = async (t) => { await api.info(t); api.quit(); };
    if (!cv || OFFICE.app !== 'word') return finish('Chuyển đổi hàng loạt hiện chỉ làm được trong Word.');
    const sc = await api.office({ action: 'scan', app: 'word', kind: cv.kind });
    if (!sc.ok) return finish(sc.error);
    let items = sc.items;
    if (cv.kind === 'tvs') {
      // chỉ công thức mới chuyển được; đồ thị, bảng, hình giữ nguyên
      items = items.map((it) => { try { it.obj = JSON.parse(new TextDecoder().decode(b64ToBytes(it.data))); } catch (e) { it.obj = null; } return it; }).filter((it) => it.obj && it.obj.type === 'formula');
    }
    if (!items.length) return finish('Không tìm thấy công thức ' + cv.from + ' nào trong tài liệu.');
    if (!(await api.confirm('Tìm thấy ' + items.length + ' công thức ' + cv.from + ' trong tài liệu.\n\nChuyển tất cả sang ' + cv.to + '?\n(Sau khi chuyển, bấm Ctrl+Z trong Word nếu muốn hoàn tác.)'))) return api.quit();
    items.sort((a, b) => b.i - a.i);
    const jobs = [];
    let failed = 0, firstErr = '';
    // dựng một đợt công thức xếp dọc trên trang rồi chụp liên tiếp (nhanh hơn nhiều so với từng cái một)
    let batch = [];
    const flush = async () => {
      if (!batch.length) return;
      S.objs = []; S.sel = null; page.innerHTML = '';
      let y = 10;
      const ready = [];
      for (const b of batch) {
        b.o.y = y; S.objs.push(b.o); const el = renderObj(b.o);
        y += Math.ceil(el.offsetHeight) + 24;
        ready.push(b);
        // chụp ngay khi sắp quá đáy trang giấy: công thức nằm ngoài trang sẽ bị chụp trên nền xám của vùng làm việc
        if (y > page.clientHeight - 60) { await shoot(ready.splice(0)); S.objs = []; page.innerHTML = ''; y = 10; }
      }
      await shoot(ready);
      batch = [];
    };
    const shoot = async (list) => {
      if (!list.length) return;
      say('Đang dựng công thức ' + (jobs.length + 1) + '–' + (jobs.length + list.length) + ' / ' + items.length + '…');
      const rs = await api.renderBatch(list.map((b) => b.o.id));
      list.forEach((b, n) => { const r = rs[n]; if (!r) { failed++; return; } jobs.push({ i: b.it.i, end: b.it.end, png: r.file, w: r.w, h: r.h, pos: r.depthPt, alt: objToB64(b.o) }); });
    };
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      say('Đang chuẩn bị công thức ' + (k + 1) + ' / ' + items.length + '…');
      try {
        if (OFFICE.op === 'tv2tex') {
          jobs.push({ i: it.i, text: '$' + multiline(it.obj.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim').replace(/\s+/g, ' ').trim() + '$' });
        } else if (OFFICE.op === 'mt2tv' || OFFICE.op === 'eq2tv' || OFFICE.op === 'tex2tv') {
          const raw = b64ToBytes(it.data);
          const latex = OFFICE.op === 'mt2tv' ? MTEF.oleToLatex(raw) : OFFICE.op === 'eq2tv' ? OMML.toLatex(new TextDecoder().decode(raw)) : cleanLatex(new TextDecoder().decode(raw));
          if (!latex.trim()) throw new Error('rỗng');
          const o = { id: 'c' + k, type: 'formula', x: 30, y: 0, latex, size: it.size >= 5 && it.size <= 200 ? toPx(it.size) : 16, color: '#000000' };
          if (tex(texOf(o)).includes('ML__error')) throw new Error('mã LaTeX không hợp lệ');
          batch.push({ o, it });
          if (batch.length >= 40) await flush();
        } else if (OFFICE.op === 'tv2eq') {
          const tx = multiline(it.obj.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim ');
          jobs.push({ i: it.i, mathml: toMathML({ latex: it.obj.latex }) }); void tx;
        } else {
          const r = await mathTypeXml(it.obj);
          jobs.push({ i: it.i, xml: r });
        }
      } catch (e) { failed++; if (!firstErr) firstErr = e.message; }
    }
    await flush();
    if (!jobs.length) return finish('Không chuyển được công thức nào (' + failed + ' công thức gặp lỗi: ' + firstErr + '). Tài liệu không thay đổi.');
    say('Đang ghi ' + jobs.length + ' công thức vào Word…');
    const res = await api.office({ action: 'apply', app: 'word', op: OFFICE.op, jobs });
    if (!res.ok) return finish(res.error);
    const skipped = items.length - res.count;
    return finish('Đã chuyển ' + res.count + ' / ' + items.length + ' công thức ' + cv.from + ' sang ' + cv.to + '.' + (skipped ? '\n\n' + skipped + ' công thức chưa chuyển được và được giữ nguyên.' : '') + '\n\nBấm Ctrl+Z trong Word nếu muốn hoàn tác.');
  }
  // Dọn mã LaTeX lấy từ các trợ lí AI cho hợp với ô soạn ToanViet
  function cleanLatex(t) {
    let s = String(t).replace(/[\r\n\u000b\u00a0]+/g, ' ').replace(/\\(tag|label)\{[^{}]*\}/g, '').replace(/\\(nonumber|notag|displaystyle)\b/g, '').trim();
    s = s.replace(/\\begin\{(equation|gather|displaymath)\*?\}|\\end\{(equation|gather|displaymath)\*?\}/g, '').replace(/\\(begin|end)\{(align|alignat|flalign|eqnarray|split)\*?\}/g, '\\$1{aligned}').trim();
    // nhiều dòng nối bằng \\ mà không nằm trong môi trường nào: đưa về công thức nhiều dòng của ToanViet
    if (/\\\\/.test(s) && !/\\begin\{/.test(s)) s = '\\displaylines{' + s + '}';
    return s;
  }
  // ToanViet -> MathType: sẽ được nạp từ mtef-write.js nếu có
  async function mathTypeXml(obj) {
    if (!window.MTEFW) throw new Error('chưa hỗ trợ');
    S.objs = [Object.assign({ id: 'cmt' }, obj, { x: 60, y: 50 })]; S.sel = null; renderAll();
    const tx = texOf(obj).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim ');
    window.MTEFW.latexToMtef(tx); // báo lỗi sớm nếu có cấu trúc chưa hỗ trợ, trước khi dựng ảnh
    const r = await api.renderPng('cmt', true);
    return window.MTEFW.wordXml(tx, r, r.b64);
  }

  async function startOffice() {
    if (OFFICE.mode === 'convert') return runConvert();
    document.body.classList.add('office');
    $('#officebar').hidden = false;
    $('#officetxt').textContent = 'Đang soạn cho ' + officeName() + ': Ctrl+Enter chèn và đóng · Esc đóng không chèn.';
    $('#officeins').textContent = 'Chèn vào ' + officeName() + ' và đóng';
    $('#officeins').onclick = officeInsertAndQuit;
    if (OFFICE.app === 'word') { const cb = $('#fEq'); $('#fEqWrap').hidden = false; cb.checked = eqMode(); cb.onchange = () => { try { localStorage.setItem('tvs-insert-eq', cb.checked ? '1' : '0'); } catch (e) { /* bỏ qua */ } }; }
    $('#officecancel').onclick = () => api.quit();
    if (OFFICE.mode === 'edit') {
      const r = await api.office({ action: 'read', app: OFFICE.app });
      if (r.ok && (r.from === 'MathType' || r.from === 'WordEq')) {
        // Công thức MathType hoặc Equation của Word: đọc nội dung sang ToanViet để sửa.
        // Khi bấm chèn, bản ToanViet thay cho công thức gốc; bấm Huỷ thì tài liệu không đổi.
        const kind = r.from === 'MathType' ? 'MathType' : 'Equation';
        try {
          const raw = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
          const latex = r.from === 'MathType' ? MTEF.oleToLatex(raw) : OMML.toLatex(new TextDecoder().decode(raw));
          OFFICE.source = r.from === 'MathType' ? 'ole' : 'omath';
          OFFICE.auto = true;
          const o = insert('formula', null, { latex, size: officeSize(), x: 60, y: 50 });
          msg('Đã mở công thức ' + kind + '. Bấm chèn để thay cho công thức gốc; Esc để giữ nguyên.');
          editFormula(o);
          return;
        } catch (e) {
          await api.info('Không đọc được công thức ' + kind + ' này (' + e.message + ').\n\nCông thức trong tài liệu được giữ nguyên.');
          return api.quit();
        }
      } else if (r.ok) {
        if (r.src === 'img') OFFICE.source = 'img';
        try {
          const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0))));
          o.x = 60; o.y = 50;
          if (o.type === 'group') { pasteGroup(o, 60, 50); msg('Sửa xong bấm "Chèn vào ' + officeName() + ' và đóng" (cả nhóm đang được chọn) để thay cho hình.'); return; }
          paste(o);
          if (o.type === 'formula') { OFFICE.auto = true; editFormula(o); }
          else msg('Sửa xong bấm "Chèn vào ' + officeName() + ' và đóng" để thay cho hình đang chọn.');
          return;
        } catch (e) {
          await api.info('Không đọc được dữ liệu của hình ToanViet đang chọn (dữ liệu bị hỏng). Hình trong tài liệu được giữ nguyên.\n\nThầy cô có thể soạn lại công thức mới, rồi xoá hình cũ.');
        }
      } else if (r.error && !/Hãy chọn/.test(r.error)) {
        await api.info(r.error);
      }
      msg('Chưa chọn công thức ToanViet nào trong ' + officeName() + ' — soạn công thức mới.', true);
    }
    if (OFFICE.mode === 'full') return msg('Dựng đồ thị, bảng hoặc hình rồi bấm "Chèn vào ' + officeName() + ' và đóng".');
    OFFICE.auto = true;
    editFormula(insert('formula', null, { size: officeSize() }), true);
  }
  // Phím tắt ở chế độ add-in (khi không đứng trong hộp soạn): Ctrl+Enter chèn và đóng, Esc đóng không chèn
  if (OFFICE) document.addEventListener('keydown', (e) => {
    if (dlg.open) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); officeInsertAndQuit(); }
    else if (e.key === 'Escape' && !typing() && !S.placing) { e.preventDefault(); api.quit(); }
  });
  if (OFFICE) startOffice();
  else msg('Sẵn sàng — bấm "Công thức" hoặc vào Tệp ▸ Tài liệu mẫu để xem ví dụ');
})();
