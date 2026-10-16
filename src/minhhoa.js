// Hình minh hoạ Toán Tiểu học (lớp 1–5). Cách trình bày (nét, màu, bố cục) theo sách Toán Kết nối tri thức với cuộc sống
// – bộ sách dùng thống nhất từ năm 2026; mọi hình đều tự vẽ bằng nét, không dùng hình ảnh của sách:
// sơ đồ đoạn thẳng, phân số, đồng hồ, lịch, thước, cân, ca nước, nhiệt kế, tiền, que tính, khối trăm–chục–đơn vị,
// bảng kiểm đếm, biểu đồ tranh, biểu đồ cột, biểu đồ hình quạt, lưới ô vuông, thước đo góc, hình khai triển,
// hình xếp khối lập phương, sơ đồ chuyển động
(function (root) {
  'use strict';
  const r1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // chữ và số trong sách in bằng phông không chân
const FONT = 'Arial, Helvetica, sans-serif';
  // bảng màu tươi, nhẹ như hình trong sách giáo khoa
  const PAL = ['#f7c948', '#4fc3d9', '#f26b5b', '#8cc63f', '#f7931e', '#29a9e0', '#a77dc2', '#ec6fa0'];
  const SKY = '#38b6e8', ORANGE = '#f7931e', RIM = '#f28c28';
  const LIGHT = ['#cfe3f7', '#fde0c4', '#d4edd5', '#f9d0d6', '#fdf0c4', '#e6dbf4', '#c9eeed', '#fadbe8'];
  const T = (x, y, t, o) => {
    o = o || {};
    return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || 'middle'}" font-family="${FONT}" font-size="${r1(o.s || 16)}"${o.b ? ' font-weight="700"' : ''}${o.i ? ' font-style="italic"' : ''} fill="${o.c || '#111'}"${o.dy ? ` dominant-baseline="${o.dy}"` : ''}>${esc(t)}</text>`;
  };
  const L = (x1, y1, x2, y2, c, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c || '#111'}" stroke-width="${w || 1.3}"${dash ? ' stroke-dasharray="5 4"' : ''} stroke-linecap="round"/>`;
  const R = (x, y, w, h, f, c, sw, rx) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"${rx ? ` rx="${rx}"` : ''} fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.2 : sw}"/>`;
  const C = (x, y, r, f, c, sw) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.2 : sw}"/>`;
  const P = (d, f, c, sw, extra) => `<path d="${d}" fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.2 : sw}" stroke-linejoin="round"${extra || ''}/>`;
  const num = (s) => { const v = parseFloat(String(s).replace(/\s| /g, '').replace(',', '.')); return isFinite(v) ? v : NaN; };
  const fmt = (v) => { let s = (Math.round(v * 1000) / 1000).toString().replace('.', ','); const [i, f] = s.split(','); return (i.length >= 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : i) + (f ? ',' + f : ''); };
  // dữ liệu dạng "nhãn | số" mỗi dòng một mục
  const rowsOf = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const p = x.split('|').map((s) => s.trim()); return { name: p[0], v: num(p[1]), raw: p[1] || '', extra: p[2] || '' }; });
  // ngoặc nhọn nằm ngang từ x1 đến x2 tại y, s = -1 mở lên (ngoặc ở trên), +1 mở xuống
  function braceH(x1, x2, y, s, c) {
    const h = 7, mx = (x1 + x2) / 2, k = Math.min(h, (x2 - x1) / 4);
    return P(`M${r1(x1)},${r1(y)} Q${r1(x1)},${r1(y + s * h)} ${r1(x1 + k)},${r1(y + s * h)} L${r1(mx - k)},${r1(y + s * h)} Q${r1(mx)},${r1(y + s * h)} ${r1(mx)},${r1(y + s * 2 * h)} Q${r1(mx)},${r1(y + s * h)} ${r1(mx + k)},${r1(y + s * h)} L${r1(x2 - k)},${r1(y + s * h)} Q${r1(x2)},${r1(y + s * h)} ${r1(x2)},${r1(y)}`, 'none', c || '#111', 1.2);
  }
  // ngoặc nhọn thẳng đứng từ y1 đến y2 tại x, mở sang phải (s = 1) hoặc trái
  function braceV(y1, y2, x, s, c) {
    const h = 7, my = (y1 + y2) / 2, k = Math.min(h, (y2 - y1) / 4);
    return P(`M${r1(x)},${r1(y1)} Q${r1(x + s * h)},${r1(y1)} ${r1(x + s * h)},${r1(y1 + k)} L${r1(x + s * h)},${r1(my - k)} Q${r1(x + s * h)},${r1(my)} ${r1(x + s * 2 * h)},${r1(my)} Q${r1(x + s * h)},${r1(my)} ${r1(x + s * h)},${r1(my + k)} L${r1(x + s * h)},${r1(y2 - k)} Q${r1(x + s * h)},${r1(y2)} ${r1(x)},${r1(y2)}`, 'none', c || '#111', 1.2);
  }
  // phân số viết dọc
  const FR = (x, y, a, b, s, c) => T(x, y - s * 0.18, a, { s, c }) + L(x - s * 0.45 * Math.max(String(a).length, String(b).length, 1) * 0.7 - 2, y, x + s * 0.45 * Math.max(String(a).length, String(b).length, 1) * 0.7 + 2, y, c || '#111', 1.1) + T(x, y + s * 0.95, b, { s, c });

  // ---------- 1. Sơ đồ đoạn thẳng (tóm tắt bài toán có lời văn) ----------
  function sodo(o, w, h, out) {
    const col = o.color || '#111', s = +o.size || 15, dang = o.dang || 'tongti';
    const m = Math.max(1, Math.round(+o.m || 3)), n = Math.max(1, Math.round(+o.n || 5));
    const lw = Math.max(s * 2.6, ...[o.ten1, o.ten2].map((t) => String(t || '').length * s * 0.56)) + 10;
    const top = o.tomtat ? s * 1.7 : 0;
    if (o.tomtat) out.push(T(w / 2, s * 1.15, 'Tóm tắt', { s, i: true, c: col }));
    const hasRight = dang === 'tongti' || dang === 'tonghieu';
    const x0 = lw, right = hasRight ? Math.max(64, String(o.tong || '?').length * s * 0.56 + 34) : 16;
    const span = w - x0 - right;
    const y1 = top + (h - top) * 0.38, y2 = top + (h - top) * 0.7;
    const tick = (x, y, hh) => L(x, y - hh, x, y + hh, col, 1.1);
    const seg = (xa, xb, parts, y) => { let g = L(xa, y, xb, y, col, 1.3) + tick(xa, y, 6) + tick(xb, y, 6); for (let k = 1; k < parts; k++) g += tick(xa + (xb - xa) * k / parts, y, 4.5); return g; };
    const lab = (x, y, t, a) => T(x, y, t, { s, a: a || 'middle', c: col });
    out.push(T(x0 - 8, y1 + s * 0.35, o.ten1 || '', { a: 'end', s, c: col }), T(x0 - 8, y2 + s * 0.35, o.ten2 || '', { a: 'end', s, c: col }));
    const topBrace = (xa, xb, y, t) => { if (t) out.push(braceH(xa, xb, y - 9, -1, col), lab((xa + xb) / 2, y - 31, t)); };
    const botBrace = (xa, xb, y, t) => { if (t) out.push(braceH(xa, xb, y + 9, 1, col), lab((xa + xb) / 2, y + 26 + s * 0.8, t)); };
    // ngoặc phần chênh lệch: dưới đoạn trên, ở khoảng giữa hai dòng
    const midBrace = (xa, xb, t) => { if (t) out.push(braceH(xa, xb, y1 + 8, 1, col), lab((xa + xb) / 2, y1 + 22 + s * 0.85, t)); };
    const rightBrace = (xr, t) => { if (t) out.push(braceV(y1 - 7, y2 + 7, xr, 1, col), lab(xr + 19, (y1 + y2) / 2 + s * 0.35, t, 'start')); };
    if (dang === 'tongti' || dang === 'hieuti') {
      const u = span / Math.max(m, n);
      out.push(seg(x0, x0 + m * u, m, y1), seg(x0, x0 + n * u, n, y2));
      topBrace(x0, x0 + m * u, y1, o.hoi1); botBrace(x0, x0 + n * u, y2, o.hoi2);
      if (dang === 'tongti') rightBrace(x0 + Math.max(m, n) * u + 8, o.tong || '?');
      else {
        const a = Math.min(m, n) * u, b = Math.max(m, n) * u;
        out.push(L(x0 + a, y1 + 6, x0 + a, y2 - 6, col, 0.9, true));
        if (m > n) midBrace(x0 + a, x0 + b, o.hieu || '?');
        else out.push(braceH(x0 + a, x0 + b, y2 + 9, 1, col), lab(x0 + (a + b) / 2, y2 + 26 + s * 0.8, o.hieu || '?'));
      }
    } else if (dang === 'tonghieu') {
      const t = num(o.tong), d = num(o.hieu);
      let big = 0.62, small = 0.38;
      // độ dài hai đoạn theo số liệu: từ tổng và hiệu, hoặc từ hai số đã biết (bài "hơn, kém nhau bao nhiêu")
      const a1 = num(o.hoi1), a2 = num(o.hoi2);
      if (isFinite(t) && isFinite(d) && t > d && d >= 0) { big = (t + d) / 2 / t; small = (t - d) / 2 / t; }
      else if (isFinite(a1) && isFinite(a2) && a1 > a2 && a2 > 0) { big = 1; small = a2 / a1; }
      const Lb = span * 0.98, Ls = Lb * small / big;
      out.push(seg(x0, x0 + Lb, 1, y1), tick(x0 + Ls, y1, 4.5), seg(x0, x0 + Ls, 1, y2));
      out.push(L(x0 + Ls, y1 + 6, x0 + Ls, y2 - 6, col, 0.9, true));
      midBrace(x0 + Ls, x0 + Lb, o.hieu || '?');
      topBrace(x0, x0 + Lb, y1, o.hoi1); botBrace(x0, x0 + Ls, y2, o.hoi2);
      rightBrace(x0 + Lb + 8, o.tong === '' ? '' : o.tong || '?');
    } else if (dang === 'giamdi') {
      // giảm một số đi nhiều lần: đoạn trên n phần, đoạn dưới 1 phần
      const u = span / n;
      out.push(seg(x0, x0 + n * u, n, y1), seg(x0, x0 + u, 1, y2));
      out.push(L(x0 + u, y1 + 6, x0 + u, y2 - 6, col, 0.9, true));
      topBrace(x0, x0 + n * u, y1, o.tong || '?'); botBrace(x0, x0 + u, y2, o.hoi2 || '?');
    } else {
      // gấp một số lên nhiều lần: đoạn trên 1 phần, đoạn dưới n phần
      const u = span / n;
      out.push(seg(x0, x0 + u, 1, y1), seg(x0, x0 + n * u, n, y2));
      out.push(L(x0, y1 + 6, x0, y2 - 6, col, 0.9, true), L(x0 + u, y1 + 6, x0 + u, y2 - 6, col, 0.9, true));
      topBrace(x0, x0 + u, y1, o.tong || '?'); botBrace(x0, x0 + n * u, y2, o.hoi2 || '?');
    }
  }

  // ---------- 2. Phân số trực quan ----------
  function phanso(o, w, h, out, errs) {
    const list = String(o.ps || '3/4').split(/[;,]/).map((x) => x.trim()).filter(Boolean).map((x) => { const m = x.match(/^(\d+)\s*\/\s*(\d+)$/); return m ? [+m[1], +m[2]] : null; });
    if (list.some((x) => !x || !x[1])) { errs.push('Viết phân số dạng 3/4, cách nhau bằng dấu chấm phẩy'); return; }
    const shapes = [];
    list.forEach(([p, q], k) => { const whole = Math.max(1, Math.ceil(p / q)); for (let j = 0; j < whole; j++) shapes.push({ fill: Math.max(0, Math.min(q, p - j * q)), q, k, last: j === whole - 1 }); });
    const lab = o.ghiso !== false;
    const gap = 22, bh = lab ? 46 : 6;
    const hinh = o.hinh || 'tron';
    // kích thước mỗi hình: rộng cw, cao ch (băng giấy dài theo chiều ngang)
    const avail = (w - gap * (shapes.length + 1)) / shapes.length, hAvail = h - bh - 12;
    let cw, ch;
    if (hinh === 'thanh') { cw = avail; ch = Math.min(40, hAvail); }
    else if (hinh === 'chunhat') { cw = Math.min(avail, hAvail / 0.62); ch = cw * 0.62; }
    else { cw = Math.min(avail, hAvail); ch = cw; }
    const x0 = (w - (shapes.length * cw + (shapes.length - 1) * gap)) / 2;
    const col = o.color || '#111', fill = o.fill || SKY, top = 8;
    shapes.forEach((sh, si) => {
      const x = x0 + si * (cw + gap), cx = x + cw / 2;
      if (hinh === 'tron') {
        const r = cw / 2, cy = top + r;
        for (let i = 0; i < sh.q; i++) {
          const a0 = -Math.PI / 2 + i * 2 * Math.PI / sh.q, a1 = a0 + 2 * Math.PI / sh.q;
          const f = i < sh.fill ? fill : '#fff';
          if (sh.q === 1) out.push(C(cx, cy, r, f, col, 1.4));
          else out.push(P(`M${r1(cx)},${r1(cy)} L${r1(cx + r * Math.cos(a0))},${r1(cy + r * Math.sin(a0))} A${r1(r)},${r1(r)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(cx + r * Math.cos(a1))},${r1(cy + r * Math.sin(a1))} Z`, f, col, 1.3));
        }
      } else {
        // hình chữ nhật, băng giấy: chia cột; hình vuông: chia lưới gần vuông
        let cols = sh.q, rows = 1;
        if (hinh === 'vuong') { rows = Math.floor(Math.sqrt(sh.q)); while (sh.q % rows) rows--; cols = sh.q / rows; }
        for (let i = 0; i < sh.q; i++) {
          const cI = i % cols, rI = Math.floor(i / cols);
          out.push(R(x + cI * cw / cols, top + rI * ch / rows, cw / cols, ch / rows, i < sh.fill ? fill : '#fff', col, 1.3));
        }
      }
    });
    if (lab) {
      // ghi phân số dưới mỗi nhóm hình (hỗn số: dưới cả nhóm)
      list.forEach(([p, q], k) => {
        const idx = shapes.map((sh, i) => (sh.k === k ? i : -1)).filter((i) => i >= 0);
        const xa = x0 + idx[0] * (cw + gap), xb = xa + idx.length * cw + (idx.length - 1) * gap;
        out.push(FR((xa + xb) / 2, top + ch + 24, o.an ? '?' : p, o.an ? '?' : q, 17, col));
      });
    }
  }

  // ---------- 3. Đồng hồ (viền cam, mặt trắng như sách) ----------
  function dongho(o, w, h, out, errs) {
    const times = String(o.gio || '7:15').split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    const n = times.length, col = o.color || '#222';
    const lbH = o.ghi === 'khong' ? 4 : 30;
    const cell = Math.min((w - 16) / n, h - lbH);
    times.forEach((t, k) => {
      const m = t.match(/^(\d{1,2})\s*[:hg]\s*(\d{1,2})?/i);
      if (!m) { errs.push('Giờ viết dạng 7:15'); return; }
      const hh = +m[1], mm = +(m[2] || 0);
      const cx = 8 + k * (w - 16) / n + (w - 16) / n / 2, r = cell / 2 - 7, cy = r + 7;
      if (o.kieu === 'so') {
        // đồng hồ điện tử: khung trắng viền tối, chữ số kiểu màn hình
        out.push(R(cx - r, cy - r * 0.38, 2 * r, r * 0.76, '#fff', '#3b3b3b', 2.2, 6));
        out.push(T(cx, cy + r * 0.2, String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), { s: r * 0.52, c: '#222', b: true }));
      } else {
        out.push(C(cx, cy, r + 4, '#fff', RIM, 6), C(cx, cy, r - 1, '#fff', '#d8d8d8', 0.8));
        for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0; out.push(L(cx + Math.sin(a) * r * (big ? 0.85 : 0.9), cy - Math.cos(a) * r * (big ? 0.85 : 0.9), cx + Math.sin(a) * r * 0.96, cy - Math.cos(a) * r * 0.96, col, big ? 1.6 : 0.7)); }
        for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; out.push(T(cx + Math.sin(a) * r * 0.68, cy - Math.cos(a) * r * 0.68 + r * 0.075, String(i), { s: r * 0.2, c: col })); }
        if (!o.khongkim) {
          const ah = ((hh % 12) + mm / 60) * Math.PI / 6, am = mm * Math.PI / 30;
          out.push(L(cx, cy, cx + Math.sin(ah) * r * 0.46, cy - Math.cos(ah) * r * 0.46, '#222', Math.max(3, r * 0.065)));
          out.push(L(cx, cy, cx + Math.sin(am) * r * 0.74, cy - Math.cos(am) * r * 0.74, '#222', Math.max(2, r * 0.04)));
          out.push(L(cx - Math.sin(am) * r * 0.12, cy + Math.cos(am) * r * 0.12, cx, cy, '#222', Math.max(2, r * 0.04)));
        }
        out.push(C(cx, cy, Math.max(2.5, r * 0.05), '#e84a5f', '#222', 1));
      }
      if (o.ghi !== 'khong') {
        const txt = o.ghi === 'cho' ? '… giờ … phút' : mm ? hh + ' giờ ' + mm + ' phút' : hh + ' giờ';
        out.push(T(cx, cy + r + 27, txt, { s: 15, c: col }));
      }
    });
  }

  // ---------- 4. Lịch tháng ----------
  function lich(o, w, h, out) {
    const th = Math.min(12, Math.max(1, Math.round(+o.thang || 5))), nam = Math.round(+o.nam || new Date().getFullYear());
    const first = (new Date(nam, th - 1, 1).getDay() + 6) % 7; // 0 = Thứ Hai
    const days = new Date(nam, th, 0).getDate();
    const rows = Math.ceil((first + days) / 7);
    const head = 34, sub = 24, cw = w / 7, ch = (h - head - sub) / rows;
    const hl = new Set(String(o.to || '').split(/[;,\s]+/).map(Number).filter(Boolean));
    const blank = new Set(String(o.an || '').split(/[;,\s]+/).map(Number).filter(Boolean));
    out.push(R(0.5, 0.5, w - 1, h - 1, '#fff', '#2f6fb3', 1.5, 6), R(0.5, 0.5, w - 1, head, '#2f6fb3', '#2f6fb3', 1, 6));
    out.push(T(w / 2, head * 0.7, 'THÁNG ' + th + (o.ghinam === false ? '' : ' – ' + nam), { s: 18, b: true, c: '#fff' }));
    const DN = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
    DN.forEach((d, i) => out.push(T(cw * i + cw / 2, head + sub * 0.7, d, { s: Math.min(14, cw / 4.6), b: true, c: i === 6 ? '#d62728' : '#1d3557' })));
    for (let r = 0; r <= rows; r++) out.push(L(0, head + sub + r * ch, w, head + sub + r * ch, '#b9cbe3', 0.8));
    for (let d = 1; d <= days; d++) {
      const i = first + d - 1, cx = (i % 7) * cw + cw / 2, cy = head + sub + Math.floor(i / 7) * ch + ch / 2;
      if (hl.has(d)) out.push(C(cx, cy, Math.min(cw, ch) * 0.36, '#fde0c4', '#e67e22', 1.5));
      if (!blank.has(d)) out.push(T(cx, cy + ch * 0.13, String(d), { s: Math.min(ch * 0.42, 20), c: i % 7 === 6 ? '#d62728' : '#111', b: hl.has(d) }));
      else out.push(R(cx - cw * 0.22, cy - ch * 0.26, cw * 0.44, ch * 0.52, '#fff', '#111', 1));
    }
  }

  // ---------- 5. Thước kẻ có vật cần đo ----------
  function thuoc(o, w, h, out) {
    const N = Math.max(3, Math.min(30, Math.round(+o.cm || 12)));
    const m = String(o.dai || '0-8').match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:-\s*(\d+(?:[.,]\d+)?))?\s*$/);
    let a = 0, b = 8;
    if (m) { if (m[2] !== undefined) { a = num(m[1]); b = num(m[2]); } else b = num(m[1]); }
    const x0 = 16, u = (w - 52) / N, ry = h * 0.52, rh = h * 0.36;
    // thước
    out.push(R(x0 - 10, ry, N * u + 40, rh, '#fbe7a1', '#b8962e', 1.2, 4));
    for (let i = 0; i <= N * 10; i++) {
      const x = x0 + i * u / 10, big = i % 10 === 0, mid = i % 5 === 0;
      if (!big && !mid && !o.mm) continue;
      out.push(L(x, ry, x, ry + (big ? rh * 0.42 : mid ? rh * 0.28 : rh * 0.17), '#3b3115', big ? 1.2 : 0.7));
      if (big) out.push(T(x, ry + rh * 0.82, String(i / 10), { s: Math.min(15, u * 0.5), c: '#3b3115' }));
    }
    out.push(T(x0 + N * u + 14, ry + rh * 0.82, 'cm', { s: 12, a: 'start', c: '#3b3115' }));
    // vật đặt lên thước
    const xa = x0 + a * u, xb = x0 + b * u, oy = ry - 6, oh = Math.min(h * 0.28, 34);
    const vat = o.vat || 'butchi';
    if (vat === 'butchi') {
      const tip = Math.min(oh * 1.1, (xb - xa) * 0.25);
      out.push(P(`M${r1(xa)},${r1(oy - oh)} L${r1(xb - tip)},${r1(oy - oh)} L${r1(xb)},${r1(oy - oh / 2)} L${r1(xb - tip)},${r1(oy)} L${r1(xa)},${r1(oy)} Z`, '#f6c445', '#8a6d1d', 1.2));
      out.push(P(`M${r1(xb - tip * 0.35)},${r1(oy - oh * 0.68)} L${r1(xb)},${r1(oy - oh / 2)} L${r1(xb - tip * 0.35)},${r1(oy - oh * 0.32)} Z`, '#333', '#333', 1));
      out.push(R(xa, oy - oh, Math.min(oh * 0.7, (xb - xa) * 0.12), oh, '#e84a5f', '#8a6d1d', 1.2));
    } else if (vat === 'bang') {
      out.push(R(xa, oy - oh * 0.7, xb - xa, oh * 0.7, '#9bd4f5', '#2f6fb3', 1.2, 3));
    } else {
      out.push(R(xa, oy - oh * 0.35, xb - xa, oh * 0.35, '#c98b4f', '#7a4d22', 1.2, 2));
    }
    out.push(L(xa, oy, xa, ry + rh * 0.42, '#d62728', 1, true), L(xb, oy, xb, ry + rh * 0.42, '#d62728', 1, true));
    if (o.ghi) out.push(T((xa + xb) / 2, oy - oh - 8, o.ghi, { s: 16 }));
  }

  // ---------- 6. Cân ----------
  function can(o, w, h, out) {
    const col = o.color || '#222';
    if (o.kieu === 'dongho') {
      const max = num(o.max) || 5, v = num(o.so) || 0, r = Math.min(w, h * 0.92) * 0.36, cx = w / 2, cy = h * 0.56;
      // mặt bàn cân, thân cân đỏ, mặt số trắng
      out.push(R(cx - r * 1.1, cy - r * 1.42, r * 2.2, r * 0.22, '#d9dde2', '#8a96a3', 1.2, 4), R(cx - r * 0.12, cy - r * 1.22, r * 0.24, r * 0.25, '#8a96a3', '#6b7785', 1));
      out.push(R(cx - r * 1.1, cy - r * 1.0, r * 2.2, r * 2.18, '#e84a5f', '#b3283c', 1.4, r * 0.25), C(cx, cy, r, '#fff', '#b3283c', 2));
      const steps = max * 10;
      for (let i = 0; i < steps; i++) { const a = i / steps * 2 * Math.PI, big = i % 10 === 0, mid = i % 5 === 0; out.push(L(cx + Math.sin(a) * r * (big ? 0.8 : mid ? 0.85 : 0.89), cy - Math.cos(a) * r * (big ? 0.8 : mid ? 0.85 : 0.89), cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95, col, big ? 1.5 : 0.6)); }
      for (let i = 0; i < max; i++) { const a = i / max * 2 * Math.PI; out.push(T(cx + Math.sin(a) * r * 0.64, cy - Math.cos(a) * r * 0.64 + r * 0.07, String(i), { s: r * 0.18, b: true, c: col })); }
      out.push(T(cx, cy + r * 0.4, 'kg', { s: r * 0.15, c: col }));
      const a = v / max * 2 * Math.PI;
      if (!o.khongkim) out.push(L(cx, cy, cx + Math.sin(a) * r * 0.86, cy - Math.cos(a) * r * 0.86, '#d62728', 2.4), C(cx, cy, 4, '#d62728', '#d62728', 1));
      if (o.vat) out.push(T(cx, cy - r * 1.52, o.vat, { s: 15, c: col }));
      return;
    }
    // cân bàn hai bên (như sách lớp 2, 3): thân cân hồng, mặt cân là tấm ván nghiêng về bên nặng
    const lech = Math.max(-1, Math.min(1, Math.round(+o.lech || 0))), cx = w / 2, by = h * 0.62, arm = w * 0.42;
    const ang = lech * 0.07, dx = Math.cos(ang) * arm, dy = Math.sin(ang) * arm;
    out.push(P(`M${r1(cx - w * 0.07)},${r1(h - 4)} L${r1(cx + w * 0.07)},${r1(h - 4)} L${r1(cx + w * 0.03)},${r1(by + 14)} L${r1(cx - w * 0.03)},${r1(by + 14)} Z`, '#f49ab0', '#c2557a', 1.2));
    out.push(C(cx, by + 18, Math.min(14, h * 0.07), '#fff', '#c2557a', 1.4), L(cx, by + 18, cx + Math.sin(-lech * 0.8) * 8, by + 10, '#d62728', 1.4));
    out.push(L(cx, by + 4, cx, by + 12, '#c2557a', 3));
    out.push(P(`M${r1(cx - dx)},${r1(by + dy)} L${r1(cx + dx)},${r1(by - dy)} L${r1(cx + dx)},${r1(by - dy + 6)} L${r1(cx - dx)},${r1(by + dy + 6)} Z`, '#7ec8e3', '#3a8db0', 1.2));
    // vật / quả cân trên mỗi đầu: các mục cách nhau bằng dấu ;
    const side = (sx, sy, lbl) => {
      const items = String(lbl || '').split(';').map((s) => s.trim()).filter(Boolean);
      const iw = Math.min((arm * 0.8) / Math.max(1, items.length) - 4, 66);
      items.forEach((t, k) => {
        const ix = sx - (items.length * (iw + 4)) / 2 + k * (iw + 4) + 2, isKg = /^\d+([.,]\d+)?\s*(kg|g)$/i.test(t);
        if (isKg) out.push(P(`M${r1(ix + iw * 0.18)},${r1(sy - 1)} L${r1(ix + iw * 0.82)},${r1(sy - 1)} L${r1(ix + iw * 0.7)},${r1(sy - 30)} L${r1(ix + iw * 0.3)},${r1(sy - 30)} Z`, '#9aa3ad', '#5d6670', 1), R(ix + iw * 0.4, sy - 36, iw * 0.2, 6, '#9aa3ad', '#5d6670', 1, 2), T(ix + iw / 2, sy - 44, t, { s: 13, c: col }));
        else out.push(R(ix, sy - 30, iw, 29, LIGHT[k % LIGHT.length], PAL[(k + 2) % PAL.length], 1.2, 10), T(ix + iw / 2, sy - 11, t, { s: Math.min(13, iw / Math.max(3, t.length) * 1.7), c: col }));
      });
    };
    side(cx - dx * 0.6, by + dy * 0.6, o.trai); side(cx + dx * 0.6, by - dy * 0.6, o.phai);
  }

  // ---------- 7. Ca, bình đo dung tích ----------
  function canuoc(o, w, h, out) {
    const max = num(o.max) || 5, v = Math.max(0, Math.min(max, num(o.so) || 0)), donvi = o.donvi || 'l';
    const x = w * 0.28, bw = w * 0.44, top = 14, bot = h - 10, bh = bot - top;
    const lvl = bot - (v / max) * bh * 0.9;
    out.push(P(`M${r1(x)},${r1(lvl)} L${r1(x + bw)},${r1(lvl)} L${r1(x + bw)},${r1(bot - 6)} Q${r1(x + bw)},${r1(bot)} ${r1(x + bw - 6)},${r1(bot)} L${r1(x + 6)},${r1(bot)} Q${r1(x)},${r1(bot)} ${r1(x)},${r1(bot - 6)} Z`, '#9fd3f5', 'none', 0));
    out.push(P(`M${r1(x - 8)},${r1(top)} L${r1(x)},${r1(top + 8)} L${r1(x)},${r1(bot - 6)} Q${r1(x)},${r1(bot)} ${r1(x + 6)},${r1(bot)} L${r1(x + bw - 6)},${r1(bot)} Q${r1(x + bw)},${r1(bot)} ${r1(x + bw)},${r1(bot - 6)} L${r1(x + bw)},${r1(top)}`, 'none', '#4f6575', 1.8));
    out.push(P(`M${r1(x + bw)},${r1(top + bh * 0.15)} C${r1(x + bw + w * 0.18)},${r1(top + bh * 0.15)} ${r1(x + bw + w * 0.18)},${r1(top + bh * 0.6)} ${r1(x + bw)},${r1(top + bh * 0.6)}`, 'none', '#4f6575', 5));
    const step = max <= 10 ? 1 : max <= 100 ? 10 : 100;
    for (let k = step; k <= max; k += step) { const y = bot - (k / max) * bh * 0.9; out.push(L(x, y, x + bw * 0.25, y, '#1d4f91', 1.4), T(x + bw * 0.3, y + 5, fmt(k) + ' ' + donvi, { s: 13, a: 'start', c: '#1d4f91' })); }
  }

  // ---------- 8. Nhiệt kế ----------
  function nhietke(o, w, h, out) {
    const lo = num(o.min), hi = num(o.max), v = num(o.so);
    const a = isFinite(lo) ? lo : 0, b = isFinite(hi) ? hi : 50, val = isFinite(v) ? v : 30;
    const cx = w * 0.4, top = 12, bulbR = Math.min(w * 0.13, 16), bot = h - bulbR * 2 - 6, tw = bulbR * 0.8;
    const Y = (t) => bot - (t - a) / (b - a) * (bot - top - 6);
    out.push(R(cx - tw / 2, top, tw, bot - top + bulbR, '#fff', '#5d6b78', 1.4, tw / 2), C(cx, bot + bulbR, bulbR, '#e84a5f', '#5d6b78', 1.4));
    out.push(R(cx - tw * 0.22, Y(val), tw * 0.44, bot + bulbR - Y(val), '#e84a5f', 'none', 0));
    const st = (b - a) <= 20 ? 1 : (b - a) <= 60 ? 2 : 5;
    for (let t = Math.ceil(a / st) * st; t <= b; t += st) {
      const big = t % (st * 5) === 0;
      out.push(L(cx + tw / 2, Y(t), cx + tw / 2 + (big ? 10 : 6), Y(t), '#111', big ? 1.2 : 0.8));
      if (big) out.push(T(cx + tw / 2 + 14, Y(t) + 5, String(t), { s: 13, a: 'start' }));
    }
    out.push(T(cx - tw / 2 - 6, top + 12, '°C', { s: 14, a: 'end' }));
  }

  // ---------- 9. Tiền Việt Nam (vẽ cách điệu, không phải hình tờ tiền thật) ----------
  function tien(o, w, h, out) {
    const vals = String(o.menhgia || '1000; 2000; 5000; 10000').split(/[;,]/).map((s) => num(s)).filter((v) => v > 0);
    const COL = { 100: '#b9a27a', 200: '#c8956a', 500: '#8fb08a', 1000: '#c9b37c', 2000: '#b48a6d', 5000: '#7b9ec9', 10000: '#d6a347', 20000: '#5f8fc9', 50000: '#d07ba3', 100000: '#6aaa6e', 200000: '#c97b5a', 500000: '#4bb3c4' };
    const per = Math.max(1, Math.round(+o.cot || Math.min(4, vals.length)));
    const nw = (w - 10 * (per + 1)) / per, nh = Math.min(nw * 0.48, (h - 10) / Math.ceil(vals.length / per) - 10);
    vals.forEach((v, k) => {
      const x = 10 + (k % per) * (nw + 10), y = 6 + Math.floor(k / per) * (nh + 10), c = COL[v] || PAL[k % PAL.length];
      out.push(R(x, y, nw, nh, c, '#4a4a4a', 1, 6), R(x + 5, y + 5, nw - 10, nh - 10, 'none', 'rgba(255,255,255,.75)', 1.2, 4));
      out.push(C(x + nw * 0.24, y + nh / 2, nh * 0.26, 'rgba(255,255,255,.35)', 'rgba(255,255,255,.8)', 1));
      out.push(T(x + nw * 0.64, y + nh * 0.52, fmt(v), { s: nh * 0.3, b: true, c: '#fff' }), T(x + nw * 0.64, y + nh * 0.78, 'đồng', { s: nh * 0.17, c: '#fff' }));
    });
  }

  // ---------- 10. Que tính, bó chục ----------
  function quetinh(o, w, h, out) {
    const n = Math.max(0, Math.min(99, Math.round(+o.so || 34))), bo = Math.floor(n / 10), le = n % 10;
    const qh = h - 30, qw = 5, gap = 7;
    let x = 14;
    const stick = (x, y, c) => R(x, y, qw, qh, c || '#f6c445', '#a17b16', 0.8, 2) + R(x, y, qw, 7, '#e84a5f', '#a17b16', 0.6, 2);
    for (let b = 0; b < bo; b++) {
      for (let i = 0; i < 10; i++) out.push(stick(x + i * 3.2, 6));
      out.push(R(x - 3, 6 + qh * 0.45, 10 * 3.2 + 4, 8, '#3d8bd4', '#1d4f91', 1, 2));
      x += 10 * 3.2 + 22;
    }
    for (let i = 0; i < le; i++) { out.push(stick(x, 6)); x += qw + gap; }
    if (o.ghi !== false) out.push(T(w / 2, h - 4, bo + ' chục và ' + le + ' đơn vị' + (o.an ? '' : ' = ' + n), { s: 16 }));
  }

  // ---------- 11. Khối trăm – chục – đơn vị (ô vuông viền xanh như sách lớp 2) ----------
  function khoi(o, w, h, out) {
    const n = Math.max(0, Math.min(9999, Math.round(+o.so || 245)));
    const ng = Math.floor(n / 1000), tr = Math.floor(n / 100) % 10, ch = Math.floor(n / 10) % 10, dv = n % 10;
    const u = Math.min(9, (h - (o.ghi === false ? 10 : 36)) / 10.6);
    const B = '#2f6fb7';
    let x = 10;
    const grid = (x, y, cols, rows) => { let g = R(x, y, cols * u, rows * u, '#fff', B, 1.2); for (let i = 1; i < cols; i++) g += L(x + i * u, y, x + i * u, y + rows * u, B, 0.6); for (let j = 1; j < rows; j++) g += L(x, y + j * u, x + cols * u, y + j * u, B, 0.6); return g; };
    for (let k = 0; k < ng; k++) { for (let a = 2; a >= 0; a--) out.push(grid(x + a * 4, 4 + (2 - a) * 4, 10, 10)); x += u * 10 + 22; }
    for (let k = 0; k < tr; k++) { out.push(grid(x, 4, 10, 10)); x += u * 10 + 10; }
    if (tr) x += 8;
    for (let k = 0; k < ch; k++) { out.push(grid(x, 4, 1, 10)); x += u + 7; }
    if (ch) x += 8;
    for (let k = 0; k < dv; k++) out.push(grid(x + (k % 3) * (u + 4), 4 + 10 * u - u - Math.floor(k / 3) * (u + 4), 1, 1));
    if (o.ghi !== false) out.push(T(w / 2, h - 7, (ng ? ng + ' nghìn, ' : '') + tr + ' trăm, ' + ch + ' chục, ' + dv + ' đơn vị' + (o.an ? '' : ' = ' + fmt(n)), { s: 15 }));
  }

  // ---------- 12. Chấm tròn trong khung 10 ô ----------
  function chamtron(o, w, h, out) {
    const n = Math.max(0, Math.min(100, Math.round(+o.so || 7))), frames = Math.max(1, Math.ceil(n / 10));
    const fw = Math.min((w - 10 * (frames + 1)) / frames, (h - 8) * 2.5), u = fw / 5;
    for (let f = 0; f < frames; f++) {
      const x0 = 10 + f * (fw + 10);
      for (let i = 0; i < 10; i++) {
        const x = x0 + (i % 5) * u, y = 4 + Math.floor(i / 5) * u;
        out.push(R(x, y, u, u, '#fff', '#1d4f91', 1));
        if (f * 10 + i < n) out.push(C(x + u / 2, y + u / 2, u * 0.32, i < 5 ? '#e84a5f' : '#3d8bd4', 'none', 0));
      }
    }
  }

  // ---------- 13. Bảng các số từ 1 đến 100 ----------
  function bang100(o, w, h, out) {
    const a = Math.max(0, Math.round(+o.tu || 1)), hl = new Set(String(o.to || '').split(/[;,\s]+/).map(Number).filter((x) => !isNaN(x) && x !== 0));
    const an = new Set(String(o.an || '').split(/[;,\s]+/).map(Number).filter((x) => !isNaN(x) && x !== 0));
    const cw = w / 10, ch = h / 10;
    for (let i = 0; i < 100; i++) {
      const v = a + i, x = (i % 10) * cw, y = Math.floor(i / 10) * ch;
      out.push(R(x, y, cw, ch, hl.has(v) ? '#fde0c4' : '#fff', '#2f6fb3', 0.9));
      if (!an.has(v)) out.push(T(x + cw / 2, y + ch * 0.66, String(v), { s: Math.min(ch * 0.5, 18), b: hl.has(v) }));
    }
  }

  // ---------- 14. Bảng kiểm đếm ----------
  // vạch kiểm đếm: "vach" — 4 vạch đứng và 1 vạch chéo; "vuong" — mỗi nét là một cạnh hình vuông, nét thứ năm là đường chéo (sách lớp 4)
  function tally(n, x, y, hh, out) {
    const kieu = tally.kieu, sx = hh * 0.36;
    for (let g = 0; g < Math.ceil(n / 5); g++) {
      const cnt = Math.min(5, n - g * 5);
      if (kieu === 'vuong') {
        const a = hh * 0.62, x0 = x, y0 = y + (hh - a) / 2, pts = [[x0, y0 + a, x0, y0], [x0, y0, x0 + a, y0], [x0 + a, y0, x0 + a, y0 + a], [x0 + a, y0 + a, x0, y0 + a], [x0, y0 + a, x0 + a, y0]];
        for (let i = 0; i < cnt; i++) out.push(L(pts[i][0], pts[i][1], pts[i][2], pts[i][3], '#222', 1.6));
        x += a + 12;
      } else {
        for (let i = 0; i < Math.min(4, cnt); i++) out.push(L(x + i * sx, y + hh * 0.2, x + i * sx, y + hh * 0.8, '#222', 1.6));
        if (cnt === 5) out.push(L(x - 4, y + hh * 0.72, x + 3 * sx + 4, y + hh * 0.28, '#222', 1.6));
        x += 4 * sx + 12;
      }
    }
  }
  function kiemdem(o, w, h, out) {
    const rows = rowsOf(o.dulieu);
    const head = 30, rh = (h - head) / Math.max(1, rows.length), c1 = w * 0.3, c2 = w * 0.5;
    const G = '#7cc47f';
    out.push(R(0.5, 0.5, w - 1, h - 1, '#fff', G, 1.2), R(0.5, 0.5, w - 1, head, '#e3f3e3', G, 1.2));
    out.push(T(c1 / 2, head * 0.68, o.cot1 || 'Loại', { s: 15, b: true }), T(c1 + c2 / 2, head * 0.68, 'Kiểm đếm', { s: 15, b: true }), T(c1 + c2 + (w - c1 - c2) / 2, head * 0.68, 'Số', { s: 15, b: true }));
    out.push(L(c1, 0, c1, h, G, 1.2), L(c1 + c2, 0, c1 + c2, h, G, 1.2));
    tally.kieu = o.kieu;
    rows.forEach((r, k) => {
      const y = head + k * rh;
      if (k) out.push(L(0, y, w, y, G, 1));
      out.push(T(c1 / 2, y + rh * 0.62, r.name, { s: 15 }));
      tally(Math.max(0, Math.round(r.v || 0)), c1 + 14, y, rh, out);
      if (!o.an) out.push(T(c1 + c2 + (w - c1 - c2) / 2, y + rh * 0.62, fmt(r.v || 0), { s: 15 }));
      else out.push(R(c1 + c2 + (w - c1 - c2) / 2 - 12, y + rh / 2 - 11, 24, 22, '#fff', '#e0a93b', 1.2, 3), T(c1 + c2 + (w - c1 - c2) / 2, y + rh / 2 + 5, '?', { s: 14 }));
    });
  }
  // ---------- 14b. Bảng số liệu nằm ngang (như sách lớp 2, 3) ----------
  function bangsolieu(o, w, h, out) {
    const rows = rowsOf(o.dulieu), n = Math.max(1, rows.length);
    const lw = o.nhan ? Math.max(70, String(o.nhan).length * 8 + 16) : 0, cw = (w - lw) / n, rh = h / 2;
    const HEAD = ['#fde8c4', '#d6f0d6', '#fbd9d9', '#dbe7f7', '#efe0f5', '#fff3c4'];
    if (lw) { out.push(R(0.5, 0.5, lw, rh, '#e3f3e3', '#7cc47f', 1), R(0.5, rh, lw, rh - 1, '#fff', '#7cc47f', 1), T(lw / 2, rh * 0.62, o.nhan, { s: 14, b: true }), T(lw / 2, rh * 1.62, o.nhan2 || 'Số lượng', { s: 14, b: true })); }
    rows.forEach((r, k) => {
      const x = lw + k * cw;
      out.push(R(x + 0.5, 0.5, cw, rh, HEAD[k % HEAD.length], '#7cc47f', 1), R(x + 0.5, rh, cw, rh - 1, '#fff', '#7cc47f', 1));
      out.push(T(x + cw / 2, rh * 0.62, r.name, { s: 14 }));
      if (o.an || r.raw === '?') out.push(R(x + cw / 2 - 11, rh * 1.5 - 11, 22, 22, '#fff', '#e0a93b', 1.2, 3), T(x + cw / 2, rh * 1.5 + 5, '?', { s: 14 }));
      else out.push(T(x + cw / 2, rh * 1.62, r.raw, { s: 15 }));
    });
  }

  // biểu tượng dùng trong biểu đồ tranh (vẽ đơn giản)
  function icon(kind, x, y, s, c, half) {
    const clip = half ? ` clip-path="inset(0 50% 0 0)"` : '';
    const g = (body) => `<g${clip}>${body}</g>`;
    if (kind === 'sao') { let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.22 : s * 0.5, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + r1(x + r * Math.cos(a)) + ',' + r1(y + r * Math.sin(a)); } return g(P(d + 'Z', c, '#7a5c00', 0.8)); }
    if (kind === 'tim') return g(P(`M${r1(x)},${r1(y + s * 0.4)} C${r1(x - s * 0.7)},${r1(y - s * 0.05)} ${r1(x - s * 0.35)},${r1(y - s * 0.55)} ${r1(x)},${r1(y - s * 0.18)} C${r1(x + s * 0.35)},${r1(y - s * 0.55)} ${r1(x + s * 0.7)},${r1(y - s * 0.05)} ${r1(x)},${r1(y + s * 0.4)} Z`, c, '#8a1f2d', 0.8));
    if (kind === 'qua') return g(C(x, y + s * 0.06, s * 0.4, c, '#7a1d12', 0.8) + L(x, y - s * 0.32, x + s * 0.06, y - s * 0.5, '#6b4423', 1.6) + P(`M${r1(x + s * 0.05)},${r1(y - s * 0.38)} q${r1(s * 0.22)},${r1(-s * 0.2)} ${r1(s * 0.34)},${r1(-s * 0.04)} q${r1(-s * 0.16)},${r1(s * 0.14)} ${r1(-s * 0.34)},${r1(s * 0.04)}Z`, '#4caf50', '#2e7d32', 0.6));
    if (kind === 'hoa') { let b = ''; for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5; b += C(x + Math.cos(a) * s * 0.24, y + Math.sin(a) * s * 0.24, s * 0.18, c, 'none', 0); } return g(b + C(x, y, s * 0.15, '#f6c445', 'none', 0)); }
    if (kind === 'vuong') return g(R(x - s * 0.4, y - s * 0.4, s * 0.8, s * 0.8, c, 'none', 0));
    if (kind === 'tamgiac') return g(P(`M${r1(x)},${r1(y - s * 0.45)} L${r1(x + s * 0.45)},${r1(y + s * 0.38)} L${r1(x - s * 0.45)},${r1(y + s * 0.38)} Z`, c, 'none', 0));
    return g(C(x, y, s * 0.42, c, 'none', 0));
  }

  // ---------- 15. Biểu đồ tranh (dải tiêu đề màu, bảng viền xanh như sách lớp 2) ----------
  function bdtranh(o, w, h, out) {
    const rows = rowsOf(o.dulieu), moi = Math.max(1, num(o.moi) || 1), ic = o.bieutuong || 'qua';
    const title = o.tieude ? 26 : 0, foot = moi > 1 || o.chuthich ? 28 : 0, G = '#5bb85f';
    const col = { qua: '#e84a5f', sao: '#f7c948', tim: '#e84a5f', hoa: '#ec6fa0', tron: '#29a9e0', vuong: '#3fae49', tamgiac: '#3fae49' }[ic] || '#29a9e0';
    if (o.tieude) { out.push(R(0.5, 0.5, w - 1, title, G, G, 1), T(w / 2, title * 0.7, String(o.tieude).toUpperCase(), { s: 13, b: true, c: '#fff' })); }
    const bodyH = h - title - foot;
    if (o.doc) {
      // các cột đứng, tên ở dưới
      const n = Math.max(1, rows.length), cw = w / n, lab = 26, s = Math.min(cw * 0.55, 26), maxN = Math.max(1, ...rows.map((r) => Math.ceil((r.v || 0) / moi)));
      const step = Math.min(s + 4, (bodyH - lab - 8) / maxN);
      out.push(R(0.5, title, w - 1, bodyH, '#fff', G, 1));
      rows.forEach((r, k) => {
        const x = k * cw;
        if (k) out.push(L(x, title, x, title + bodyH, G, 1));
        out.push(R(x + 0.5, title + bodyH - lab, cw, lab, LIGHT[k % LIGHT.length], G, 1), T(x + cw / 2, title + bodyH - lab * 0.32, r.name, { s: 13, b: true }));
        const cnt = (r.v || 0) / moi;
        for (let i = 0; i < Math.ceil(cnt - 1e-9); i++) out.push(icon(ic, x + cw / 2, title + bodyH - lab - step * (i + 0.55), Math.min(s, step - 2), col, cnt - i < 0.99));
      });
    } else {
      const rh = bodyH / Math.max(1, rows.length), c1 = Math.max(w * 0.2, 76), s = Math.min(rh * 0.7, 28);
      out.push(R(0.5, title, w - 1, bodyH, '#fff', G, 1), L(c1, title, c1, title + bodyH, G, 1));
      rows.forEach((r, k) => {
        const y = title + k * rh;
        if (k) out.push(L(0, y, w, y, G, 1));
        out.push(T(10, y + rh * 0.6, r.name, { s: 14, a: 'start' }));
        const cnt = (r.v || 0) / moi;
        for (let i = 0; i < Math.ceil(cnt - 1e-9); i++) out.push(icon(ic, c1 + 12 + s / 2 + i * (s + 6), y + rh / 2, s, col, cnt - i < 0.99));
      });
    }
    if (foot) out.push(icon(ic, w * 0.32, h - foot / 2, 18, col), T(w * 0.32 + 14, h - foot / 2 + 5, ': ' + (o.chuthich || moi + ' ' + (o.donvi || 'quả')), { s: 14, a: 'start' }));
  }

  // trục và lưới chung cho biểu đồ cột
  function niceStep(max, n) { const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }

  // ---------- 16. Biểu đồ cột (như sách lớp 4: cột cam, lưới nhạt, số trên đầu cột) ----------
  function bdcot(o, w, h, out) {
    const rows = rowsOf(o.dulieu);
    const max = Math.max(1, ...rows.map((r) => r.v || 0)), st = num(o.buoc) || niceStep(max, 6), top = Math.ceil(max / st) * st;
    const title = o.tieude ? 24 : 4, xname = o.tentruc ? 60 : 12;
    const x0 = 42, y0 = h - 34, y1 = title + 22, x1 = w - xname;
    if (o.tieude) out.push(T(4, 15, String(o.tieude).toUpperCase(), { s: 12, a: 'start', c: '#333' }));
    const bw = (x1 - x0) / Math.max(1, rows.length);
    for (let v = 0; v <= top + 1e-9; v += st) { const y = y0 - v / top * (y0 - y1); out.push(L(x0, y, x1, y, v ? '#cfd6de' : '#333', v ? 0.8 : 1.2), T(x0 - 6, y + 5, fmt(v), { s: 12, a: 'end' })); }
    for (let k = 1; k <= rows.length; k++) out.push(L(x0 + k * bw, y1, x0 + k * bw, y0, '#e3e7ec', 0.8));
    out.push(L(x0, y0, x0, y1 - 12, '#333', 1.2), L(x0, y0, x1 + 6, y0, '#333', 1.2));
    if (o.donvi) out.push(T(x0 - 6, y1 - 16, '(' + o.donvi + ')', { s: 12, a: 'end' }));
    if (o.tentruc) out.push(T(x1 + 8, y0 + 16, '(' + o.tentruc + ')', { s: 12, a: 'start' }));
    rows.forEach((r, k) => {
      const v = r.v || 0, bh = v / top * (y0 - y1), x = x0 + k * bw + bw * 0.28, c = o.nhieumau ? PAL[k % PAL.length] : ORANGE;
      out.push(R(x, y0 - bh, bw * 0.44, bh, c, 'none', 0));
      if (o.ghiso !== false) out.push(T(x + bw * 0.22, y0 - bh - 5, fmt(v), { s: 13, c: o.nhieumau ? '#333' : ORANGE }));
      String(r.name).split('\\').forEach((ln, i) => out.push(T(x0 + k * bw + bw / 2, y0 + 16 + i * 14, ln.trim(), { s: 12 })));
    });
  }

  // ---------- 17. Biểu đồ hình quạt tròn (lớp 5): tên và phần trăm ghi trong từng phần ----------
  function bdquat(o, w, h, out, errs) {
    const rows = rowsOf(o.dulieu), tot = rows.reduce((s, r) => s + (r.v || 0), 0);
    if (Math.abs(tot - 100) > 0.5 && o.phantram !== false) errs.push('Tổng các phần là ' + fmt(tot) + '%, chưa bằng 100%');
    const legend = !!o.chuthich, r = Math.min(h / 2 - 6, legend ? w * 0.3 : w / 2 - 6), cx = legend ? r + 8 : w / 2, cy = h / 2;
    let a = -Math.PI / 2;
    rows.forEach((row, k) => {
      const da = (row.v || 0) / (o.phantram === false ? tot : 100) * 2 * Math.PI, a1 = a + da;
      out.push(P(`M${r1(cx)},${r1(cy)} L${r1(cx + r * Math.cos(a))},${r1(cy + r * Math.sin(a))} A${r1(r)},${r1(r)} 0 ${da > Math.PI ? 1 : 0} 1 ${r1(cx + r * Math.cos(a1))},${r1(cy + r * Math.sin(a1))} Z`, PAL[k % PAL.length], '#fff', 1.2));
      const am = (a + a1) / 2, lx = cx + r * 0.58 * Math.cos(am), ly = cy + r * 0.58 * Math.sin(am);
      const pct = fmt(row.v || 0) + (o.phantram === false ? '' : '%');
      if (legend) { if (da > 0.25) out.push(T(lx, ly + 5, pct, { s: 13 })); }
      else if (da > 0.35) { out.push(T(lx, ly - 2, row.name, { s: 12 }), T(lx, ly + 13, pct, { s: 12, b: true })); }
      a = a1;
      if (legend) out.push(R(cx + r + 22, 12 + k * 22, 12, 12, PAL[k % PAL.length], 'none', 0), T(cx + r + 40, 23 + k * 22, row.name, { s: 13, a: 'start' }));
    });
  }

  // ---------- 18. Lưới ô vuông (vẽ hình, đếm ô) ----------
  function luoi(o, w, h, out, errs) {
    const nx = Math.max(2, Math.round(+o.cot || 12)), ny = Math.max(2, Math.round(+o.hang || 8)), u = Math.min(w / nx, h / ny);
    const ox = (w - nx * u) / 2, oy = (h - ny * u) / 2;
    if (o.cham) { for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) out.push(C(ox + i * u, oy + j * u, 1.8, '#5d7fa3', 'none', 0)); }
    else { for (let i = 0; i <= nx; i++) out.push(L(ox + i * u, oy, ox + i * u, oy + ny * u, '#a9c1dc', 0.8)); for (let j = 0; j <= ny; j++) out.push(L(ox, oy + j * u, ox + nx * u, oy + j * u, '#a9c1dc', 0.8)); }
    const X = (x) => ox + x * u, Y = (y) => oy + (ny - y) * u;
    String(o.hinh || '').split('\n').map((s) => s.trim()).filter(Boolean).forEach((ln, k) => {
      const nm = ln.match(/^([A-Z]+)\s*:/);
      const body = nm ? ln.slice(nm[0].length) : ln;
      const pts = [...body.matchAll(/(-?\d+(?:[.,]\d+)?)\s*,\s*(-?\d+(?:[.,]\d+)?)/g)].map((m) => [num(m[1]), num(m[2])]);
      if (pts.length < 2) { errs.push('Dòng ' + (k + 1) + ': cần ít nhất hai điểm dạng x,y'); return; }
      const closed = !/\bmo\b|\bduong\b/.test(body) && pts.length > 2, fill = /\bto\b/.test(body);
      const d = pts.map((p, i) => (i ? 'L' : 'M') + r1(X(p[0])) + ',' + r1(Y(p[1]))).join(' ') + (closed ? ' Z' : '');
      out.push(P(d, fill ? LIGHT[k % LIGHT.length] : 'none', PAL[k % PAL.length], 2));
      if (nm) nm[1].split('').forEach((c, i) => { if (pts[i]) { const p = pts[i]; const cxm = pts.reduce((s, q) => s + q[0], 0) / pts.length, cym = pts.reduce((s, q) => s + q[1], 0) / pts.length; const dx = p[0] - cxm, dy = p[1] - cym, l = Math.hypot(dx, dy) || 1; out.push(C(X(p[0]), Y(p[1]), 2.4, '#111', 'none', 0), T(X(p[0]) + dx / l * 13, Y(p[1]) - dy / l * 13 + 5, c, { s: 15, i: true })); } });
    });
  }

  // ---------- 19. Thước đo góc: tâm thước trùng đỉnh góc, vạch 0 của thang ngoài nằm trên cạnh OB ----------
  function thuocdo(o, w, h, out) {
    const deg = Math.max(0, Math.min(180, num(o.goc) || 60));
    const r = Math.min(w / 2 - 30, h - 40), cx = w / 2, cy = h - 24;
    const B = '#2f6fb7';
    const pt = (d, k) => [cx + Math.cos(d * Math.PI / 180) * r * k, cy - Math.sin(d * Math.PI / 180) * r * k];
    out.push(P(`M${r1(cx - r)},${r1(cy)} A${r1(r)},${r1(r)} 0 0 1 ${r1(cx + r)},${r1(cy)} Z`, 'rgba(207,227,247,.55)', B, 1.4));
    out.push(P(`M${r1(cx - r * 0.5)},${r1(cy)} A${r1(r * 0.5)},${r1(r * 0.5)} 0 0 1 ${r1(cx + r * 0.5)},${r1(cy)}`, 'none', B, 0.8));
    for (let d = 0; d <= 180; d++) {
      const big = d % 10 === 0, mid = d % 5 === 0, [xa, ya] = pt(d, 1), [xb, yb] = pt(d, big ? 0.9 : mid ? 0.94 : 0.965);
      out.push(L(xa, ya, xb, yb, B, big ? 1 : 0.5));
      if (big) {
        // thang ngoài: 0 ở bên phải (trên cạnh OB); thang trong: 0 ở bên trái
        const [ox, oy] = pt(d, 0.82), [ix, iy] = pt(d, 0.71);
        out.push(T(ox, oy + 4, String(d), { s: Math.max(8, r * 0.055), c: B }), T(ix, iy + 4, String(180 - d), { s: Math.max(7, r * 0.045), c: '#c0392b' }));
      }
    }
    const [ax, ay] = pt(deg, 1.12);
    out.push(L(cx, cy, cx + r * 1.12, cy, '#111', 2), L(cx, cy, ax, ay, '#111', 2));
    out.push(C(cx, cy, 3, '#111', 'none', 0), T(cx, cy + 18, o.dinh || 'O', { s: 16, i: true }));
    const nm = String(o.ten || 'B A').split(/[,s]+/);
    if (nm[0]) out.push(T(cx + r * 1.12 + 4, cy - 6, nm[0], { s: 16, i: true, a: 'start' }));
    if (nm[1]) { const [lx, ly] = pt(deg, 1.2); out.push(T(lx, ly + 5, nm[1], { s: 16, i: true })); }
  }

  // ---------- 20. Hình khai triển hình hộp chữ nhật, hình lập phương, hình trụ (lớp 5) ----------
  function khaitrien(o, w, h, out) {
    const FACE = ['#8cc63f', '#f7931e', '#29a9e0', '#f26b5b', '#f7c948', '#4fc3d9'];
    if (o.loai === 'tru') {
      // hình trụ: mặt xung quanh là hình chữ nhật (dài = chu vi đáy), hai đáy là hai hình tròn
      const r0 = num(o.rong) || 1, hh = num(o.cao) || 3, C0 = 2 * Math.PI * r0, totW = C0, totH = hh + 4 * r0;
      const u = Math.min((w - 20) / totW, (h - 20) / totH), x0 = (w - totW * u) / 2, y0 = (h - totH * u) / 2 + 2 * r0 * u;
      out.push(R(x0, y0, C0 * u, hh * u, '#f7931e', '#b35f00', 1.3), C(x0 + r0 * u * 1.4, y0 - r0 * u, r0 * u, '#8cc63f', '#4d7d15', 1.3), C(x0 + r0 * u * 1.4, y0 + hh * u + r0 * u, r0 * u, '#8cc63f', '#4d7d15', 1.3));
      if (o.ghiso !== false) out.push(T(x0 + C0 * u / 2, y0 + hh * u + 16, 'Chu vi đáy', { s: 12 }), T(x0 + C0 * u + 6, y0 + hh * u / 2 + 4, fmt(hh) + ' cm', { s: 12, a: 'start' }));
      return;
    }
    let a = num(o.dai) || 4, b = num(o.rong) || 2, c = num(o.cao) || 3;
    if (o.loai === 'lapphuong') { b = a; c = a; }
    // dạng chữ thập: hàng giữa là bốn mặt bên (b, a, b, a), mặt trên và mặt đáy gắn vào mặt thứ hai
    const totW = 2 * a + 2 * b, totH = c + 2 * b, u = Math.min((w - 70) / totW, (h - 24) / totH);
    const x0 = (w - totW * u) / 2, y0 = (h - totH * u) / 2 + b * u;
    const mau = o.motmau ? () => '#cfe8f7' : (k) => FACE[k % FACE.length];
    const face = (x, y, fw, fh, k, lab) => R(x0 + x * u, y0 + y * u, fw * u, fh * u, mau(k), '#333', 1.2) + (lab ? T(x0 + (x + fw / 2) * u, y0 + (y + fh / 2) * u + 5, lab, { s: 12, c: '#222' }) : '');
    out.push(face(0, 0, b, c, 0, o.ghimat ? 'bên' : ''), face(b, 0, a, c, 1, o.ghimat ? 'trước' : ''), face(b + a, 0, b, c, 0, o.ghimat ? 'bên' : ''), face(2 * b + a, 0, a, c, 1, o.ghimat ? 'sau' : ''));
    out.push(face(b, -b, a, b, 2, o.ghimat ? 'trên' : ''), face(b, c, a, b, 3, o.ghimat ? 'đáy' : ''));
    if (o.ghiso !== false) {
      out.push(T(x0 + (b + a / 2) * u, y0 + (c + b) * u + 15, fmt(a) + ' cm', { s: 12 }));
      out.push(T(x0 + (b + a) * u + 5, y0 + (c + b / 2) * u + 4, fmt(b) + ' cm', { s: 12, a: 'start' }));
      out.push(T(x0 - 5, y0 + c / 2 * u + 4, fmt(c) + ' cm', { s: 12, a: 'end' }));
    }
  }

  // ---------- 21. Hình xếp từ các khối lập phương nhỏ ----------
  function xepkhoi(o, w, h, out) {
    const grid = String(o.cao || '2 1 1\n1 1 0').split('\n').map((l) => l.trim().split(/\s+/).map(Number)).filter((r) => r.length && !r.some(isNaN));
    const rows = grid.length, cols = Math.max(...grid.map((r) => r.length)), maxH = Math.max(1, ...grid.flat());
    // phép chiếu trục đo: x sang phải, y (hàng) lùi về sau – lên trên, z lên trên
    const k = Math.min(w / (cols + rows * 0.5 + 1), h / (maxH + rows * 0.5 + 1));
    const ox = 10, oy = h - 10;
    const pt = (x, y, z) => [ox + (x + y * 0.5) * k, oy - (z + y * 0.5) * k];
    const poly = (ps, f) => P('M' + ps.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' L') + ' Z', f, '#1d4f91', 1);
    let total = 0;
    for (let y = rows - 1; y >= 0; y--) for (let x = 0; x < cols; x++) for (let z = 0; z < (grid[rows - 1 - y][x] || 0); z++) {
      total++;
      out.push(poly([pt(x, y, z + 1), pt(x + 1, y, z + 1), pt(x + 1, y + 1, z + 1), pt(x, y + 1, z + 1)], '#cfe3f7'));
      out.push(poly([pt(x, y, z), pt(x + 1, y, z), pt(x + 1, y, z + 1), pt(x, y, z + 1)], '#7fb8ea'));
      out.push(poly([pt(x + 1, y, z), pt(x + 1, y + 1, z), pt(x + 1, y + 1, z + 1), pt(x + 1, y, z + 1)], '#4f93d2'));
    }
    if (o.ghi) out.push(T(w - 6, 18, 'Có ' + total + ' hình lập phương nhỏ', { s: 14, a: 'end' }));
  }

  // ---------- 22. Sơ đồ chuyển động ----------
  function chuyendong(o, w, h, out) {
    const A = o.a || 'A', B = o.b || 'B', y = h * 0.55, x0 = 30, x1 = w - 30, col = o.color || '#111';
    const car = (x, y, dir, c) => { const s = 0.9; const g = `<g transform="translate(${r1(x)},${r1(y)}) scale(${dir * s},${s})">` + P('M-18,-4 L-14,-14 L6,-14 L12,-6 L18,-5 L18,4 L-18,4 Z', c, '#333', 1) + C(-10, 5, 4.5, '#333', '#333', 1) + C(10, 5, 4.5, '#333', '#333', 1) + R(-11, -12, 7, 6, '#e8f4ff', 'none', 0) + R(-2, -12, 7, 6, '#e8f4ff', 'none', 0) + '</g>'; return g; };
    out.push(L(x0, y, x1, y, col, 2), L(x0, y - 7, x0, y + 7, col, 2), L(x1, y - 7, x1, y + 7, col, 2));
    out.push(T(x0, y + 24, A, { s: 17, i: true }), T(x1, y + 24, B, { s: 17, i: true }));
    if (o.quangduong) out.push(braceH(x0, x1, y + 30, 1, col), T((x0 + x1) / 2, y + 62, o.quangduong, { s: 15 }));
    const arr = (xa, xb, yy, c) => L(xa, yy, xb, yy, c, 1.6) + P(`M${r1(xb)},${r1(yy)} l${xb > xa ? -9 : 9},-4 l0,8 Z`, c, c, 1);
    if (o.chieu === 'cung') {
      out.push(car(x0 + 22, y - 10, 1, '#e84a5f'), car(x0 + (x1 - x0) * 0.45, y - 10, 1, '#3d8bd4'));
      out.push(arr(x0 + 46, x0 + 120, y - 40, '#e84a5f'), T(x0 + 82, y - 48, o.v1 || '', { s: 15, c: '#c0392b' }));
      out.push(arr(x0 + (x1 - x0) * 0.45 + 24, x0 + (x1 - x0) * 0.45 + 98, y - 40, '#3d8bd4'), T(x0 + (x1 - x0) * 0.45 + 60, y - 48, o.v2 || '', { s: 15, c: '#1d4f91' }));
    } else {
      out.push(car(x0 + 22, y - 10, 1, '#e84a5f'), car(x1 - 22, y - 10, -1, '#3d8bd4'));
      out.push(arr(x0 + 46, x0 + 120, y - 40, '#e84a5f'), T(x0 + 82, y - 48, o.v1 || '', { s: 15, c: '#c0392b' }));
      out.push(arr(x1 - 46, x1 - 120, y - 40, '#3d8bd4'), T(x1 - 82, y - 48, o.v2 || '', { s: 15, c: '#1d4f91' }));
      if (o.gap) out.push(P(`M${r1((x0 + x1) / 2 - 6)},${r1(y - 6)} L${r1((x0 + x1) / 2 + 6)},${r1(y + 6)} M${r1((x0 + x1) / 2 + 6)},${r1(y - 6)} L${r1((x0 + x1) / 2 - 6)},${r1(y + 6)}`, 'none', '#d62728', 2), T((x0 + x1) / 2, y - 14, o.gap, { s: 15, c: '#d62728' }));
    }
  }

  const DRAW = { bangsolieu, sodo, phanso, dongho, lich, thuoc, can, canuoc, nhietke, tien, quetinh, khoi, chamtron, bang100, kiemdem, bdtranh, bdcot, bdquat, luoi, thuocdo, khaitrien, xepkhoi, chuyendong };
  function render(o, w, h) {
    const out = [], errors = [];
    const f = DRAW[o.ve] || DRAW.sodo;
    try { f(o, w, h, out, errors); } catch (e) { errors.push(e.message); }
    return { svg: out.join(''), labels: [], errors };
  }

  // ---------- Mẫu và ô nhập ở khung Thuộc tính ----------
  // mỗi mẫu: [tên, dữ liệu]; dữ liệu có "ve" là kiểu hình
  const GROUPS = [
    ['Số và cấu tạo số', {
      chamtron: ['Chấm tròn trong khung 10 ô (lớp 1)', { ve: 'chamtron', so: 8, w: 300, h: 70 }],
      quetinh: ['Que tính: bó chục và que rời (lớp 1)', { ve: 'quetinh', so: 34, w: 420, h: 150 }],
      bang100: ['Bảng các số từ 1 đến 100 (lớp 1)', { ve: 'bang100', tu: 1, to: '', an: '', w: 440, h: 330 }],
      khoi: ['Đơn vị, chục, trăm, nghìn (lớp 2)', { ve: 'khoi', so: 245, w: 520, h: 150 }],
      tien: ['Tiền Việt Nam (lớp 2, 3)', { ve: 'tien', menhgia: '1000; 2000; 5000; 10000', w: 560, h: 90 }],
    }],
    ['Tóm tắt bài toán (sơ đồ đoạn thẳng)', {
      sodo_gaplan: ['Gấp một số lên một số lần (lớp 3)', { ve: 'sodo', dang: 'gaplan', tomtat: true, ten1: 'Lan:', ten2: 'Hoa:', n: 3, tong: '5 bông', hoi2: '? bông', w: 440, h: 140 }],
      sodo_giamdi: ['Giảm một số đi một số lần (lớp 3)', { ve: 'sodo', dang: 'giamdi', tomtat: true, ten1: 'Thùng to:', ten2: 'Thùng nhỏ:', n: 4, tong: '36 l', hoi2: '? l', w: 460, h: 150 }],
      sodo_tonghieu: ['Tổng và hiệu (lớp 4)', { ve: 'sodo', dang: 'tonghieu', tomtat: true, ten1: 'Bình:', ten2: 'An:', tong: '30 quyển', hieu: '6 quyển', hoi1: '? quyển', hoi2: '? quyển', w: 500, h: 170 }],
      sodo_tongti: ['Tổng và tỉ số (lớp 5)', { ve: 'sodo', dang: 'tongti', tomtat: true, ten1: 'Lớp 5A:', ten2: 'Lớp 5B:', m: 3, n: 4, tong: '70 cây', hoi1: '? cây', hoi2: '? cây', w: 500, h: 170 }],
      sodo_hieuti: ['Hiệu và tỉ số (lớp 5)', { ve: 'sodo', dang: 'hieuti', tomtat: true, ten1: 'Số lớn:', ten2: 'Số bé:', m: 5, n: 2, hieu: '45', hoi1: '?', hoi2: '?', w: 500, h: 170 }],
      chuyendong: ['Hai xe đi ngược chiều (lớp 5)', { ve: 'chuyendong', chieu: 'nguoc', a: 'A', b: 'B', v1: '45 km/giờ', v2: '35 km/giờ', quangduong: '160 km', gap: 'Gặp nhau', w: 560, h: 150 }],
      chuyendong2: ['Hai xe đi cùng chiều (lớp 5)', { ve: 'chuyendong', chieu: 'cung', a: 'A', b: 'B', v1: '50 km/giờ', v2: '30 km/giờ', quangduong: '', w: 560, h: 120 }],
    }],
    ['Phân số', {
      phanso: ['Một phần mấy: hình tròn (lớp 3)', { ve: 'phanso', hinh: 'tron', ps: '1/4', w: 180, h: 200 }],
      phanso1: ['Một phần mấy: hình chữ nhật (lớp 3)', { ve: 'phanso', hinh: 'chunhat', ps: '1/3; 1/5', w: 420, h: 150 }],
      phanso2: ['Khái niệm phân số, so sánh (lớp 4)', { ve: 'phanso', hinh: 'tron', ps: '1/6; 2/6', w: 420, h: 200 }],
      phanso3: ['Phân số trên băng giấy (lớp 4)', { ve: 'phanso', hinh: 'thanh', ps: '3/8', w: 420, h: 110 }],
      phanso4: ['Hỗn số (lớp 5)', { ve: 'phanso', hinh: 'tron', ps: '7/4', w: 340, h: 200 }],
    }],
    ['Thời gian và đo lường', {
      dongho: ['Đồng hồ (lớp 1 – 3)', { ve: 'dongho', gio: '7:00; 9:30; 3:05', kieu: 'kim', ghi: 'co', w: 480, h: 200 }],
      dongho2: ['Đồng hồ điện tử (lớp 2, 3)', { ve: 'dongho', gio: '15:45', kieu: 'so', ghi: 'co', w: 200, h: 120 }],
      lich: ['Tờ lịch tháng (lớp 2, 3)', { ve: 'lich', thang: 5, nam: new Date().getFullYear(), to: '1; 19', an: '', w: 460, h: 300 }],
      thuoc: ['Thước kẻ: đo độ dài (lớp 1, 2)', { ve: 'thuoc', cm: 12, dai: '0-8', vat: 'butchi', mm: false, w: 520, h: 140 }],
      thuoc2: ['Đo mi-li-mét (lớp 3)', { ve: 'thuoc', cm: 6, dai: '1-4,5', vat: 'que', mm: true, ghi: '? mm', w: 520, h: 140 }],
      can: ['Cân bàn: nặng hơn, nhẹ hơn (lớp 2)', { ve: 'can', kieu: 'dia', trai: 'Quả bưởi', phai: '1 kg', lech: 0, w: 440, h: 200 }],
      can2: ['Cân đồng hồ (lớp 2, 3)', { ve: 'can', kieu: 'dongho', max: 5, so: 3, vat: 'Túi gạo', w: 240, h: 260 }],
      canuoc: ['Ca, bình đo lít (lớp 2, 3)', { ve: 'canuoc', max: 5, so: 3, donvi: 'l', w: 200, h: 220 }],
      nhietke: ['Nhiệt kế (lớp 3)', { ve: 'nhietke', min: 0, max: 50, so: 30, w: 120, h: 260 }],
    }],
    ['Hình học', {
      luoi: ['Lưới ô vuông: vẽ hình, đếm ô (lớp 2 – 4)', { ve: 'luoi', cot: 14, hang: 8, cham: false, hinh: 'ABCD: 1,1 6,1 6,5 1,5 to\nMNP: 8,1 13,1 10,6 to', w: 520, h: 300 }],
      thuocdo: ['Thước đo góc (lớp 4)', { ve: 'thuocdo', goc: 60, dinh: 'O', ten: 'B A', w: 420, h: 240 }],
      khaitrien: ['Hình khai triển hình hộp chữ nhật (lớp 5)', { ve: 'khaitrien', loai: 'hop', dai: 4, rong: 2, cao: 3, ghiso: true, ghimat: false, w: 500, h: 320 }],
      khaitrien2: ['Hình khai triển hình lập phương (lớp 5)', { ve: 'khaitrien', loai: 'lapphuong', dai: 3, ghiso: false, ghimat: false, w: 420, h: 320 }],
      khaitrien3: ['Hình khai triển hình trụ (lớp 5)', { ve: 'khaitrien', loai: 'tru', rong: 1, cao: 3, ghiso: false, w: 360, h: 300 }],
      xepkhoi: ['Hình xếp từ khối lập phương nhỏ (lớp 5)', { ve: 'xepkhoi', cao: '2 1 1\n1 1 0\n1 0 0', ghi: false, w: 300, h: 240 }],
    }],
    ['Thống kê, biểu đồ', {
      bangsolieu: ['Bảng số liệu nằm ngang (lớp 2, 3)', { ve: 'bangsolieu', dulieu: 'Gà trống | 5\nGà mái | 8\nGà con | ?', nhan: '', an: false, w: 420, h: 70 }],
      kiemdem: ['Bảng kiểm đếm (lớp 2 – 4)', { ve: 'kiemdem', cot1: 'Loại quả', dulieu: 'Cam | 8\nTáo | 5\nXoài | 12', kieu: 'vuong', an: false, w: 460, h: 160 }],
      bdtranh: ['Biểu đồ tranh (lớp 2)', { ve: 'bdtranh', tieude: 'Số bông hoa đã nở trong vườn', dulieu: 'Hoa hồng | 6\nHoa cúc | 4\nHoa mai | 9', bieutuong: 'hoa', moi: 1, donvi: 'bông', w: 480, h: 150 }],
      bdtranh2: ['Biểu đồ tranh dạng cột (lớp 2)', { ve: 'bdtranh', tieude: 'Số hình bạn Nam cắt được', dulieu: 'Hình vuông | 6\nHình tròn | 8\nHình tam giác | 4', bieutuong: 'tron', doc: true, moi: 1, w: 420, h: 260 }],
      bdcot: ['Biểu đồ cột (lớp 4)', { ve: 'bdcot', tieude: 'Số bạn yêu thích mỗi môn thể thao', dulieu: 'Bóng đá | 7\nBóng rổ | 5\nBơi | 3\nCờ vua | 4', donvi: 'Bạn', tentruc: 'Môn', w: 480, h: 280 }],
      bdquat: ['Biểu đồ hình quạt tròn (lớp 5)', { ve: 'bdquat', dulieu: 'Leo núi | 30\nTắm biển | 25\nCắm trại | 45', phantram: true, chuthich: false, w: 260, h: 240 }],
    }],
  ];
  const KINDS = {};
  GROUPS.forEach((g) => { for (const k in g[1]) KINDS[k] = g[1][k]; });
  // ô nhập ở khung Thuộc tính: [khoá, nhãn, kiểu, lựa chọn]
  const FIELDS = {
    sodo: [['dang', 'Dạng bài', 'sel', { gaplan: 'Gấp một số lên một số lần (lớp 3)', giamdi: 'Giảm một số đi một số lần (lớp 3)', tonghieu: 'Tổng và hiệu (lớp 4)', tongti: 'Tổng và tỉ số (lớp 5)', hieuti: 'Hiệu và tỉ số (lớp 5)' }], ['tomtat', 'Ghi chữ Tóm tắt', 'chk'], ['ten1', 'Tên đoạn trên'], ['ten2', 'Tên đoạn dưới'], ['m', 'Số phần đoạn trên', 'num'], ['n', 'Số phần đoạn dưới', 'num'], ['tong', 'Ghi ở ngoặc tổng (hoặc giá trị một phần)'], ['hieu', 'Ghi ở ngoặc hiệu'], ['hoi1', 'Ghi ở ngoặc đoạn trên (vd ?)'], ['hoi2', 'Ghi ở ngoặc đoạn dưới']],
    phanso: [['ps', 'Phân số (cách nhau bằng dấu ;)'], ['hinh', 'Hình', 'sel', { tron: 'Hình tròn', chunhat: 'Hình chữ nhật', vuong: 'Hình vuông chia lưới', thanh: 'Băng giấy' }], ['fill', 'Màu tô', 'color'], ['ghiso', 'Ghi phân số dưới hình', 'chk'], ['an', 'Ghi ? thay cho phân số (học sinh tự viết)', 'chk']],
    dongho: [['gio', 'Giờ (vd 7:15; 9:30)'], ['kieu', 'Kiểu', 'sel', { kim: 'Đồng hồ kim', so: 'Đồng hồ điện tử' }], ['ghi', 'Dòng chữ dưới', 'sel', { co: 'Ghi giờ', cho: 'Chỗ trống: … giờ … phút', khong: 'Không ghi' }], ['khongkim', 'Không vẽ kim (học sinh tự vẽ)', 'chk']],
    lich: [['thang', 'Tháng', 'num'], ['nam', 'Năm', 'num'], ['to', 'Khoanh các ngày (vd 1; 19)'], ['an', 'Để trống các ngày (học sinh điền)'], ['ghinam', 'Ghi năm', 'chk']],
    thuoc: [['cm', 'Thước dài (cm)', 'num'], ['dai', 'Vật dài từ – đến (vd 0-8 hoặc 2-9)'], ['vat', 'Vật cần đo', 'sel', { butchi: 'Bút chì', bang: 'Băng giấy', que: 'Que' }], ['mm', 'Vạch chia mi-li-mét', 'chk'], ['ghi', 'Ghi phía trên (vd ? cm)']],
    can: [['kieu', 'Loại cân', 'sel', { dia: 'Cân đĩa', dongho: 'Cân đồng hồ' }], ['trai', 'Đĩa trái (các vật cách nhau bằng ;)'], ['phai', 'Đĩa phải (vd 1 kg; 2 kg)'], ['lech', 'Cân lệch: -1 trái nặng, 0 thăng bằng, 1 phải nặng', 'num'], ['max', 'Cân đồng hồ: số lớn nhất (kg)', 'num'], ['so', 'Cân đồng hồ: kim chỉ (kg)', 'num'], ['vat', 'Vật trên cân'], ['khongkim', 'Không vẽ kim', 'chk']],
    canuoc: [['max', 'Vạch lớn nhất', 'num'], ['so', 'Mực nước', 'num'], ['donvi', 'Đơn vị (l hoặc ml)']],
    nhietke: [['min', 'Từ (°C)', 'num'], ['max', 'Đến (°C)', 'num'], ['so', 'Nhiệt độ chỉ', 'num']],
    tien: [['menhgia', 'Mệnh giá (cách nhau bằng ;)'], ['cot', 'Số tờ mỗi hàng', 'num']],
    quetinh: [['so', 'Số que', 'num'], ['ghi', 'Ghi chục và đơn vị', 'chk'], ['an', 'Không ghi kết quả', 'chk']],
    khoi: [['so', 'Số', 'num'], ['ghi', 'Ghi phân tích số', 'chk'], ['an', 'Không ghi kết quả', 'chk']],
    chamtron: [['so', 'Số chấm', 'num']],
    bang100: [['tu', 'Bắt đầu từ số', 'num'], ['to', 'Tô các số (cách nhau bằng ;)'], ['an', 'Để trống các số (học sinh điền)']],
    kiemdem: [['cot1', 'Tên cột đầu'], ['dulieu', 'Dữ liệu: tên | số (mỗi dòng một loại)', 'area'], ['kieu', 'Kiểu vạch kiểm đếm', 'sel', { vuong: 'Ô vuông (sách lớp 4)', vach: 'Bốn vạch và một vạch chéo' }], ['an', 'Để trống cột Số (ô ?)', 'chk']],
    bangsolieu: [['dulieu', 'Dữ liệu: tên | số (mỗi dòng một cột; số là ? để trống)', 'area'], ['nhan', 'Tên hàng đầu (trống = không có cột tên)'], ['nhan2', 'Tên hàng dưới'], ['an', 'Để trống mọi ô số (ô ?)', 'chk']],
    bdtranh: [['tieude', 'Tên biểu đồ (dải màu phía trên)'], ['dulieu', 'Dữ liệu: tên | số (mỗi dòng một hàng)', 'area'], ['doc', 'Xếp thành cột đứng', 'chk'], ['bieutuong', 'Hình', 'sel', { qua: 'Quả táo', sao: 'Ngôi sao', tim: 'Trái tim', hoa: 'Bông hoa', tron: 'Hình tròn', vuong: 'Hình vuông', tamgiac: 'Hình tam giác' }], ['moi', 'Mỗi hình ứng với', 'num'], ['donvi', 'Đơn vị (vd quả, bạn)'], ['chuthich', 'Chú thích tự viết (trống = tự động)']],
    bdcot: [['tieude', 'Tên biểu đồ'], ['dulieu', 'Dữ liệu: tên | số (mỗi dòng một cột; tên dài xuống dòng bằng \)', 'area'], ['donvi', 'Đơn vị trục đứng (vd Bạn)'], ['tentruc', 'Tên trục ngang (vd Môn thể thao)'], ['buoc', 'Khoảng chia trục đứng (trống = tự động)', 'num'], ['ghiso', 'Ghi số trên đầu cột', 'chk'], ['nhieumau', 'Mỗi cột một màu', 'chk']],
    bdquat: [['dulieu', 'Dữ liệu: tên | phần trăm (mỗi dòng một phần)', 'area'], ['phantram', 'Số liệu là phần trăm', 'chk'], ['chuthich', 'Ghi tên ở bảng chú thích bên cạnh', 'chk']],
    luoi: [['cot', 'Số ô ngang', 'num'], ['hang', 'Số ô dọc', 'num'], ['cham', 'Giấy chấm (không kẻ ô)', 'chk'], ['hinh', 'Hình (mỗi dòng một hình)', 'area']],
    thuocdo: [['goc', 'Số đo góc (độ)', 'num'], ['dinh', 'Tên đỉnh'], ['ten', 'Tên điểm trên cạnh nằm ngang và cạnh còn lại (vd B A)']],
    khaitrien: [['loai', 'Hình', 'sel', { hop: 'Hình hộp chữ nhật', lapphuong: 'Hình lập phương', tru: 'Hình trụ' }], ['dai', 'Chiều dài (cạnh)', 'num'], ['rong', 'Chiều rộng (hình trụ: bán kính đáy)', 'num'], ['cao', 'Chiều cao', 'num'], ['ghiso', 'Ghi kích thước', 'chk'], ['ghimat', 'Ghi tên các mặt', 'chk'], ['motmau', 'Tô một màu', 'chk']],
    xepkhoi: [['cao', 'Số khối ở mỗi cột (mỗi dòng một hàng, hàng trên ở phía sau)', 'area'], ['ghi', 'Ghi số khối', 'chk']],
    chuyendong: [['chieu', 'Chiều chuyển động', 'sel', { nguoc: 'Ngược chiều', cung: 'Cùng chiều' }], ['a', 'Điểm đầu'], ['b', 'Điểm cuối'], ['v1', 'Vận tốc xe thứ nhất'], ['v2', 'Vận tốc xe thứ hai'], ['quangduong', 'Quãng đường'], ['gap', 'Ghi ở chỗ gặp nhau']],
  };
  const HELP = {
    luoi: 'Mỗi dòng một hình, toạ độ là số ô tính từ góc dưới bên trái: <code>ABCD: 1,1 6,1 6,5 1,5 to</code> (<code>to</code>: tô màu, <code>mo</code>: đường gấp khúc không khép kín). Tên đỉnh viết trước dấu hai chấm.',
    can: 'Đĩa cân: các vật cách nhau bằng <code>;</code>. Viết <code>1 kg</code>, <code>500 g</code> để vẽ quả cân.',
  };

  // ô nhập không dùng tới với lựa chọn hiện tại thì ẩn khỏi khung Thuộc tính (và đổi nhãn cho đúng nghĩa)
  const SODO_USE = { tongti: ['m', 'n', 'tong', 'hoi1', 'hoi2'], hieuti: ['m', 'n', 'hieu', 'hoi1', 'hoi2'], tonghieu: ['tong', 'hieu', 'hoi1', 'hoi2'], gaplan: ['n', 'tong', 'hoi2'], giamdi: ['n', 'tong', 'hoi2'] };
  function fieldUse(o, key) {
    if (o.ve === 'sodo') {
      if (['dang', 'tomtat', 'ten1', 'ten2'].includes(key)) return true;
      return (SODO_USE[o.dang || 'tongti'] || []).includes(key);
    }
    if (o.ve === 'can') return key === 'kieu' || (o.kieu === 'dongho' ? ['max', 'so', 'vat', 'khongkim'] : ['trai', 'phai', 'lech']).includes(key);
    if (o.ve === 'khaitrien') return !((o.loai === 'lapphuong' && (key === 'rong' || key === 'cao')) || (o.loai === 'tru' && (key === 'dai' || key === 'ghimat' || key === 'motmau')));
    if (o.ve === 'dongho') return !(key === 'khongkim' && o.kieu === 'so');
    if (o.ve === 'chuyendong') return !(key === 'gap' && o.chieu === 'cung');
    return true;
  }
  const SODO_LABEL = {
    gaplan: { n: 'Gấp lên mấy lần', tong: 'Ghi ở ngoặc đoạn trên (vd 5 bông)', hoi2: 'Ghi ở ngoặc đoạn dưới (vd ? bông)' },
    giamdi: { n: 'Giảm đi mấy lần', tong: 'Ghi ở ngoặc đoạn trên (vd 36 l)', hoi2: 'Ghi ở ngoặc đoạn dưới (vd ? l)' },
    tonghieu: { tong: 'Ghi ở ngoặc tổng (bên phải)', hieu: 'Ghi ở ngoặc hiệu (phần hơn)' },
  };
  const fieldLabel = (o, key, label) => (o.ve === 'sodo' && SODO_LABEL[o.dang] && SODO_LABEL[o.dang][key]) || label;
  root.MinhHoa = { render, GROUPS, KINDS, FIELDS, HELP, fieldUse, fieldLabel };
})(typeof window !== 'undefined' ? window : globalThis);
