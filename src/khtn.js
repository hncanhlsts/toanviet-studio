// Hình theo môn cho THCS – THPT, vẽ bằng nét (in rõ ở mọi cỡ, dán vào Word dạng ảnh):
//   Toán: bảng số liệu, biểu đồ cột / cột kép / đoạn thẳng / hình quạt tròn, biểu đồ tần số ghép nhóm, sơ đồ cây xác suất;
//   Vật lí: mạch điện theo lưới (ký hiệu linh kiện lấy từ src/sgk.js), dựng ảnh qua thấu kính, đồ thị theo số liệu;
//   Hoá học: cấu hình electron (ô lượng tử, lớp vỏ), công thức cấu tạo thu gọn;
//   Sinh học: sơ đồ lai, khung Punnett, sơ đồ phả hệ (tự xếp thế hệ).
// Cùng khuôn với src/minhhoa.js: mẫu (GROUPS / KINDS) + ô nhập ở khung Thuộc tính (FIELDS) + hàm vẽ (DRAW).
(function (root) {
  'use strict';
  const r1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FONT = "'Times New Roman', Times, serif"; // ngoặc đơn: chuỗi này nằm trong font-family="…", ngoặc kép lồng làm hỏng SVG khi xuất ảnh
  // màu biểu đồ: dịu, phân biệt được khi in đen trắng (đậm nhạt khác nhau)
  const PAL = ['#4472c4', '#ed7d31', '#70ad47', '#ffc000', '#5b9bd5', '#a5a5a5', '#c0504d', '#8064a2'];
  const T = (x, y, t, o) => {
    o = o || {};
    return `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${o.a || 'middle'}" dominant-baseline="central" font-family="${FONT}" font-size="${r1(o.s || 14)}"${o.b ? ' font-weight="700"' : ''}${o.i ? ' font-style="italic"' : ''} fill="${o.c || '#111'}">${o.raw ? t : esc(t)}</text>`;
  };
  const L = (x1, y1, x2, y2, c, w, dash) => `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${c || '#111'}" stroke-width="${w || 1.2}"${dash ? ` stroke-dasharray="${dash === true ? '5 4' : dash}"` : ''} stroke-linecap="round"/>`;
  const R = (x, y, w, h, f, c, sw) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.1 : sw}"/>`;
  const C = (x, y, r, f, c, sw) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.2 : sw}"/>`;
  const P = (d, f, c, sw, extra) => `<path d="${d}" fill="${f || 'none'}" stroke="${c || '#111'}" stroke-width="${sw === undefined ? 1.2 : sw}" stroke-linejoin="round" stroke-linecap="round"${extra || ''}/>`;
  // mũi tên nhỏ ở đầu (x2, y2)
  const arrowHead = (x1, y1, x2, y2, c, k) => {
    const a = Math.atan2(y2 - y1, x2 - x1), s = k || 8;
    const p = (t) => r1(x2 - s * Math.cos(a + t)) + ',' + r1(y2 - s * Math.sin(a + t));
    return `<path d="M${p(0.42)} L${r1(x2)},${r1(y2)} L${p(-0.42)}" fill="none" stroke="${c || '#111'}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>`;
  };
  // số viết kiểu Việt Nam: dấu phẩy thập phân; phân số a/b
  const num = (s) => {
    const t = String(s === undefined ? '' : s).replace(/\s| /g, '').replace(',', '.');
    const f = t.match(/^(-?[\d.]+)\/([\d.]+)$/);
    const v = f ? parseFloat(f[1]) / parseFloat(f[2]) : parseFloat(t);
    return isFinite(v) ? v : NaN;
  };
  const fmt = (v, d) => String(Math.round(v * Math.pow(10, d === undefined ? 3 : d)) / Math.pow(10, d === undefined ? 3 : d)).replace('.', ',');
  const tw = (s, size) => String(s).length * size * 0.5; // bề rộng ước lượng của chữ
  // dữ liệu "tên | số | số …" mỗi dòng một mục
  const rowsOf = (t) => String(t || '').split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#')).map((x) => { const p = x.split('|').map((s) => s.trim()); return { name: p[0], cells: p, vals: p.slice(1).map(num) }; });
  // khoảng chia trục "đẹp"; số liệu đếm (số nguyên) thì khoảng chia cũng nguyên
  const niceStep = (range, n, nguyen) => {
    const raw = Math.max(range, 1e-9) / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    if (nguyen && raw <= 1) return 1;
    for (const m of nguyen ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]) if (m * mag >= raw - 1e-12) return m * mag;
    return 10 * mag;
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  // chỉ số dưới cho công thức hoá học viết thường: CH3 → CH₃ (tspan), (CH3)2 → (CH₃)₂
  const chemSvg = (s) => esc(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<tspan baseline-shift="sub" font-size="72%">$2</tspan>');
  const chemTex = (s) => '\\mathrm{' + String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1_{$2}') + '}';

  // ---------------- TOÁN: thống kê, xác suất ----------------
  // bảng số liệu, bảng tần số: mỗi dòng một hàng, ô cách nhau bằng |
  function bangsl(o, w, h, out, errs, labels) {
    const rows = String(o.dulieu || '').split('\n').filter((x) => x.trim()).map((x) => x.split('|').map((s) => s.trim()));
    if (!rows.length) { errs.push('chưa có dữ liệu'); return; }
    const nc = Math.max(...rows.map((r) => r.length)), fs = +o.co || 15, rh = fs * 1.9;
    const cw = [];
    for (let j = 0; j < nc; j++) cw.push(Math.max(36, ...rows.map((r) => tw((r[j] || '').replace(/\$/g, ''), fs) + 18)));
    const W = cw.reduce((a, b) => a + b, 0), H = rh * rows.length, s = Math.min((w - 2) / W, (h - 2) / H, 1.6);
    const x0 = (w - W * s) / 2, y0 = (h - H * s) / 2;
    out.push(`<g transform="translate(${r1(x0)},${r1(y0)}) scale(${Math.round(s * 1000) / 1000})">`);
    rows.forEach((r, i) => {
      let x = 0;
      for (let j = 0; j < nc; j++) {
        const dau = (o.dauhang && i === 0) || (o.cotdau && j === 0);
        out.push(R(x, i * rh, cw[j], rh, dau ? '#e8eef7' : '#fff', '#222', 1));
        const t = r[j] || '';
        if (/^\$.*\$$/.test(t)) labels.push({ x: x0 + (x + cw[j] / 2) * s, y: y0 + (i + 0.5) * rh * s, tex: t.slice(1, -1), size: fs * s });
        else out.push(T(x + cw[j] / 2, (i + 0.5) * rh, t, { s: fs, b: dau }));
        x += cw[j];
      }
    });
    out.push('</g>');
  }
  // khung trục cho biểu đồ: trả về hàm đổi giá trị → toạ độ dọc
  function khungTruc(o, box, vmin, vmax, out) {
    const step = num(o.buoc) > 0 ? num(o.buoc) : niceStep(vmax - vmin, 5, box.nguyen);
    const lo = Math.min(0, Math.floor(vmin / step) * step), hi = Math.max(step, Math.ceil(vmax / step - 1e-9) * step);
    const Y = (v) => box.y1 - ((v - lo) / (hi - lo)) * (box.y1 - box.y0);
    for (let v = lo; v <= hi + step / 2; v += step) {
      const y = Y(v);
      if (Math.abs(v) > 1e-9) out.push(L(box.x0, y, box.x1, y, '#c8ccd2', 0.8, '3 3'));
      out.push(L(box.x0 - 4, y, box.x0, y, '#111', 1));
      out.push(T(box.x0 - 7, y, fmt(v), { a: 'end', s: 12 }));
    }
    out.push(L(box.x0, box.y1 + 2, box.x0, box.y0 - 14, '#111', 1.2) + arrowHead(box.x0, box.y0, box.x0, box.y0 - 14));
    out.push(L(box.x0, Y(0), box.x1 + 12, Y(0), '#111', 1.2) + arrowHead(box.x0, Y(0), box.x1 + 12, Y(0)));
    if (o.donvi) out.push(T(box.x0 + 6, box.y0 - 16, o.donvi, { a: 'start', s: 12.5, i: true }));
    if (o.tentruc) out.push(T(box.x1 + 16, Y(0), o.tentruc, { a: 'start', s: 12.5, i: true })); // bên phải mũi tên trục ngang
    return Y;
  }
  const chuThich = (names, x, y, out, kieu) => {
    let cx = x;
    names.forEach((n, i) => {
      if (kieu === 'doan') out.push(L(cx, y, cx + 18, y, PAL[i % PAL.length], 2.2) + C(cx + 9, y, 3, PAL[i % PAL.length], PAL[i % PAL.length]));
      else out.push(R(cx, y - 6, 14, 12, PAL[i % PAL.length], 'none', 0));
      out.push(T(cx + 22, y, n, { a: 'start', s: 12.5 }));
      cx += 30 + tw(n, 12.5) + 10;
    });
  };
  // biểu đồ cột, cột kép (nhiều số mỗi dòng), biểu đồ đoạn thẳng
  function bieudo(o, w, h, out, errs) {
    const rows = rowsOf(o.dulieu);
    if (!rows.length) { errs.push('chưa có dữ liệu'); return; }
    const ns = Math.max(1, ...rows.map((r) => r.vals.length));
    const ten = String(o.chuoi || '').split('|').map((s) => s.trim()).filter(Boolean);
    const all = [].concat(...rows.map((r) => r.vals)).filter((v) => isFinite(v));
    if (!all.length) { errs.push('dữ liệu chưa có số (viết: tên | số)'); return; }
    const top = (o.tieude ? 30 : 10) + (ten.length ? 20 : 0) + 22;
    const nl = Math.max(1, ...rows.map((r) => r.name.split('\\').length));
    const box = { x0: 52, x1: w - 26 - (o.tentruc ? tw(o.tentruc, 12.5) + 4 : 0), y0: top, y1: h - 18 - nl * 15, nguyen: all.every(Number.isInteger) };
    if (o.tieude) out.push(T(w / 2, 14, o.tieude, { b: true, s: 15 }));
    if (ten.length) chuThich(ten, box.x0 + 8, (o.tieude ? 34 : 14), out, o.loai);
    const Y = khungTruc(o, box, Math.min(0, ...all), Math.max(0, ...all), out);
    const sw = (box.x1 - box.x0) / rows.length;
    rows.forEach((r, i) => {
      const cx = box.x0 + sw * (i + 0.5);
      r.name.split('\\').forEach((ln, k) => out.push(T(cx, Y(0) + 13 + k * 15, ln.trim(), { s: 12.5 })));
      if (o.loai !== 'doan') {
        const bw = Math.min(46, (sw * 0.62) / ns);
        r.vals.forEach((v, s) => {
          if (!isFinite(v)) return;
          const x = cx - (bw * ns) / 2 + s * bw, y = Math.min(Y(v), Y(0)), hh = Math.abs(Y(v) - Y(0));
          out.push(R(x, y, bw, hh, PAL[s % PAL.length], '#333', 0.6));
          if (o.hienso) out.push(T(x + bw / 2, v >= 0 ? Y(v) - 8 : Y(v) + 9, fmt(v), { s: 11.5 }));
        });
      }
    });
    if (o.loai === 'doan') {
      for (let s = 0; s < ns; s++) {
        const pts = rows.map((r, i) => [box.x0 + sw * (i + 0.5), r.vals[s]]).filter((p) => isFinite(p[1]));
        out.push(P('M' + pts.map((p) => r1(p[0]) + ',' + r1(Y(p[1]))).join(' L'), 'none', PAL[s % PAL.length], 2));
        pts.forEach((p) => {
          out.push(C(p[0], Y(p[1]), 3.4, PAL[s % PAL.length], PAL[s % PAL.length], 0));
          if (o.hienso) out.push(T(p[0], Y(p[1]) - 10, fmt(p[1]), { s: 11.5 }));
          if (o.giong) out.push(L(box.x0, Y(p[1]), p[0], Y(p[1]), '#777', 0.8, '4 3'));
        });
      }
    }
  }
  // biểu đồ hình quạt tròn
  function quat(o, w, h, out, errs) {
    const rows = rowsOf(o.dulieu).filter((r) => isFinite(r.vals[0]) && r.vals[0] > 0);
    if (!rows.length) { errs.push('chưa có dữ liệu (viết: tên | số)'); return; }
    const tong = rows.reduce((a, r) => a + r.vals[0], 0);
    const top = o.tieude ? 28 : 6, leg = o.chuthich ? Math.min(w * 0.42, 40 + Math.max(...rows.map((r) => tw(r.name, 13)))) : 0;
    if (o.tieude) out.push(T(w / 2, 14, o.tieude, { b: true, s: 15 }));
    const R0 = Math.max(10, Math.min((w - leg) / 2 - 12, (h - top) / 2 - 10)), cx = (w - leg) / 2, cy = top + (h - top) / 2;
    let a = -Math.PI / 2;
    rows.forEach((r, i) => {
      const da = (r.vals[0] / tong) * Math.PI * 2, b = a + da, col = PAL[i % PAL.length];
      if (rows.length === 1) out.push(C(cx, cy, R0, col, '#fff', 1.5));
      else out.push(P(`M${r1(cx)},${r1(cy)} L${r1(cx + R0 * Math.cos(a))},${r1(cy + R0 * Math.sin(a))} A${r1(R0)},${r1(R0)} 0 ${da > Math.PI ? 1 : 0} 1 ${r1(cx + R0 * Math.cos(b))},${r1(cy + R0 * Math.sin(b))} Z`, col, '#fff', 1.5));
      const m = (a + b) / 2, pct = fmt((r.vals[0] / tong) * 100, 1) + '%';
      const tx = cx + R0 * 0.62 * Math.cos(m), ty = cy + R0 * 0.62 * Math.sin(m);
      if (o.chuthich) out.push(T(tx, ty, pct, { s: 13, b: true, c: '#111' }));
      else { out.push(T(tx, ty - 8, r.name, { s: 12.5 })); out.push(T(tx, ty + 8, pct, { s: 12.5, b: true })); }
      a = b;
    });
    if (o.chuthich) rows.forEach((r, i) => { const y = cy - (rows.length * 20) / 2 + i * 20 + 10; out.push(R(w - leg + 6, y - 6, 14, 12, PAL[i % PAL.length], 'none', 0) + T(w - leg + 26, y, r.name, { a: 'start', s: 13 })); });
  }
  // biểu đồ tần số mẫu số liệu ghép nhóm (cột liền nhau), đa giác tần số
  function ghepnhom(o, w, h, out, errs) {
    const rows = rowsOf(o.dulieu).map((r) => { const m = r.name.match(/(-?\d+(?:[.,]\d+)?)\s*[;–-]\s*(-?\d+(?:[.,]\d+)?)/); return m ? { a: num(m[1]), b: num(m[2]), f: r.vals[0] } : null; });
    if (!rows.length || rows.some((r) => !r || !isFinite(r.f))) { errs.push('mỗi dòng viết: [40; 50) | 5'); return; }
    const top = (o.tieude ? 30 : 10) + 22, box = { x0: 52, x1: w - 30 - (o.tentruc ? tw(o.tentruc, 12.5) : 0), y0: top, y1: h - 34, nguyen: rows.every((r) => Number.isInteger(r.f)) };
    if (o.tieude) out.push(T(w / 2, 14, o.tieude, { b: true, s: 15 }));
    const fmax = Math.max(...rows.map((r) => r.f)), Y = khungTruc(o, box, 0, fmax, out);
    const a0 = rows[0].a, bn = rows[rows.length - 1].b, d = rows[0].b - rows[0].a;
    const lo = o.dagiac ? a0 - d / 2 : a0 - d * 0.4, hi = o.dagiac ? bn + d / 2 : bn;
    const X = (v) => box.x0 + 14 + ((v - lo) / (hi - lo)) * (box.x1 - box.x0 - 24);
    if (a0 > 0) out.push(P(`M${r1(box.x0 + 4)},${r1(Y(0) - 5)} l3,10 l3,-10`, '#fff', '#111', 1)); // dấu ngắt trục: trục ngang không bắt đầu từ 0
    rows.forEach((r) => out.push(R(X(r.a), Y(r.f), X(r.b) - X(r.a), Y(0) - Y(r.f), '#bdd7ee', '#2f5597', 1) + (o.hienso ? T((X(r.a) + X(r.b)) / 2, Y(r.f) - 8, fmt(r.f), { s: 11.5 }) : '')));
    const ticks = [...new Set([].concat(...rows.map((r) => [r.a, r.b])))];
    ticks.forEach((v) => out.push(L(X(v), Y(0), X(v), Y(0) + 4, '#111', 1) + T(X(v), Y(0) + 13, fmt(v), { s: 12 })));
    if (o.dagiac) {
      const pts = [[a0 - d / 2, 0]].concat(rows.map((r) => [(r.a + r.b) / 2, r.f]), [[bn + d / 2, 0]]);
      out.push(P('M' + pts.map((p) => r1(X(p[0])) + ',' + r1(Y(p[1]))).join(' L'), 'none', '#c0504d', 1.8));
      pts.forEach((p) => out.push(C(X(p[0]), Y(p[1]), 3, '#c0504d', '#c0504d', 0)));
    }
  }
  // sơ đồ cây xác suất: mỗi dòng một nhánh "tên | xác suất", thụt vào bằng dấu - (hoặc hai dấu cách) cho tầng sau
  function caySoDo(o, w, h, out, errs, labels) {
    const lines = String(o.dulieu || '').split('\n').filter((x) => x.trim());
    const goc = { ten: o.goc || '', con: [], sau: 0 }, st = [goc];
    for (const ln of lines) {
      const m = ln.match(/^(\s*)(-*)\s*(.*)$/), sau = m[2].length + Math.floor(m[1].length / 2) + 1;
      const p = m[3].split('|').map((s) => s.trim());
      const nut = { ten: p[0], xs: p[1] || '', con: [], sau };
      while (st.length > sau) st.pop();
      if (st.length < sau) { errs.push('dòng "' + ln.trim() + '" thụt vào quá một tầng'); return; }
      st[st.length - 1].con.push(nut); st.push(nut);
    }
    if (!goc.con.length) { errs.push('chưa có nhánh nào'); return; }
    const la = [], walk = (n, path) => { n.path = path; if (!n.con.length) la.push(n); n.con.forEach((c) => walk(c, path.concat(c))); };
    walk(goc, []);
    const depth = Math.max(...la.map((n) => n.path.length));
    const tichW = o.tich ? Math.min(w * 0.38, 40 + Math.max(...la.map((n) => tw(n.path.map((p) => p.ten).join('') + ' = 0,000', 13)))) : 0;
    const colW = (w - 40 - tichW) / depth, rowH = (h - 16) / la.length;
    la.forEach((n, i) => { n.y = 8 + rowH * (i + 0.5); });
    const setY = (n) => { if (n.con.length) { n.con.forEach(setY); n.y = n.con.reduce((a, c) => a + c.y, 0) / n.con.length; } };
    setY(goc);
    const draw = (n, x) => {
      n.con.forEach((c) => {
        const x2 = x + colW;
        out.push(L(x + (n === goc ? 4 : 14), n.y, x2 - 14, c.y, '#333', 1.2));
        const mx = (x + x2) / 2, my = (n.y + c.y) / 2;
        if (c.xs) labels.push({ x: mx, y: my - 10, tex: /\//.test(c.xs) ? '\\tfrac{' + c.xs.split('/')[0] + '}{' + c.xs.split('/')[1] + '}' : c.xs.replace(/[.,]/, '{,}'), size: 13, color: '#1f4f8f', bg: true });
        out.push(T(x2, c.y, c.ten, { s: 14, b: true }));
        draw(c, x2);
      });
    };
    if (goc.ten) out.push(T(14, goc.y, goc.ten, { s: 14, b: true }));
    draw(goc, 8);
    if (o.tich) la.forEach((n) => {
      const ps = n.path.map((p) => p.xs), phan = ps.every((p) => /^\d+\/\d+$/.test(p));
      let kq;
      if (phan) { let a = 1, b = 1; ps.forEach((p) => { a *= +p.split('/')[0]; b *= +p.split('/')[1]; }); const g = gcd(a, b); kq = '\\tfrac{' + a / g + '}{' + b / g + '}'; }
      else kq = fmt(ps.reduce((a, p) => a * num(p), 1), 4).replace(',', '{,}');
      labels.push({ x: w - tichW + 6, y: n.y, tex: '\\text{' + n.path.map((p) => p.ten).join('') + '}:\\ ' + kq, size: 13, ax: 'l' });
    });
  }

  // ---------------- VẬT LÍ ----------------
  // mạch điện: "A = (0, 0)" đặt nút; "dientro A B = R_1" linh kiện nối hai nút (hoặc "0,0 3,0"); "day B C" dây nối
  const LK = { dientro: 'dientro', bientro: 'bientro', nguon: 'nguon', pin: 'nguon', bopin: 'bopin', den: 'den', khoa: 'congtacmo', khoamo: 'congtacmo', khoadong: 'congtacdong', congtacmo: 'congtacmo', congtacdong: 'congtacdong', ampeke: 'ampeke', vonke: 'vonke', dienke: 'dienke', tudien: 'tudien', cuoncam: 'cuoncam', diot: 'diot', chuong: 'chuong', dongco: 'dongco' };
  function machdien(o, w, h, out, errs, labels) {
    const N = {}, parts = [], cham = new Set();
    const pt = (s) => { const t = s.trim(), m = t.match(/^\(?\s*(-?[\d.]+)\s*[,;]\s*(-?[\d.]+)\s*\)?$/); if (m) return [+m[1], +m[2]]; if (N[t]) return N[t]; throw new Error('chưa có nút ' + t); };
    String(o.kichban || '').split('\n').forEach((raw) => {
      const ln = raw.replace(/#.*$/, '').trim();
      if (!ln) return;
      try {
        let m;
        if ((m = ln.match(/^([A-Za-z][A-Za-z0-9']*)\s*=\s*\(?\s*(-?[\d.]+)\s*[,;]\s*(-?[\d.]+)\s*\)?$/))) { N[m[1]] = [+m[2], +m[3]]; N[m[1]].ten = m[1]; return; }
        if ((m = ln.match(/^cham\s+(.+)$/))) { m[1].split(/[\s,]+/).filter(Boolean).forEach((n) => { pt(n); cham.add(n); }); return; }
        const eq = ln.indexOf('='), nhan = eq >= 0 ? ln.slice(eq + 1).trim() : '', head = (eq >= 0 ? ln.slice(0, eq) : ln).trim();
        const tok = head.match(/^([a-z]+)\s+(\([^)]*\)|\S+)\s+(\([^)]*\)|\S+)$/);
        if (!tok) throw new Error('viết: dientro A B = R_1');
        if (tok[1] !== 'day' && !LK[tok[1]]) throw new Error('không có linh kiện "' + tok[1] + '" (dientro, bientro, nguon, bopin, den, khoa, khoadong, ampeke, vonke, tudien, cuoncam, diot, chuong, dongco, day)');
        parts.push({ k: tok[1], a: pt(tok[2]), b: pt(tok[3]), an: tok[2], bn: tok[3], nhan });
      } catch (e) { errs.push(ln + '  →  ' + e.message); }
    });
    if (!parts.length) { if (!errs.length) errs.push('chưa có linh kiện nào'); return; }
    const all = [].concat(...parts.map((p) => [p.a, p.b]));
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), mg = 34;
    const u = Math.min((w - 2 * mg) / Math.max(1, maxx - minx), (h - 2 * mg) / Math.max(1, maxy - miny));
    const ox = (w - (maxx - minx) * u) / 2, oy = (h - (maxy - miny) * u) / 2;
    const X = (p) => [ox + (p[0] - minx) * u, h - oy - (p[1] - miny) * u]; // trục y hướng lên
    const deg = {}, key = (p) => p[0] + ',' + p[1];
    parts.forEach((p) => { deg[key(p.a)] = (deg[key(p.a)] || 0) + 1; deg[key(p.b)] = (deg[key(p.b)] || 0) + 1; });
    const col = o.color || '#111', sw = +o.stroke || 1.5;
    const SG = root.SGK;
    parts.forEach((p) => {
      const A = X(p.a), B = X(p.b), len = Math.hypot(B[0] - A[0], B[1] - A[1]);
      if (p.k === 'day' || !SG || len < 1) { out.push(L(A[0], A[1], B[0], B[1], col, sw)); return; }
      const cl = Math.min(len * 0.62, 78), k = cl / 120, ang = Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, ux = (B[0] - A[0]) / len, uy = (B[1] - A[1]) / len;
      out.push(L(A[0], A[1], mx - ux * cl / 2, my - uy * cl / 2, col, sw) + L(mx + ux * cl / 2, my + uy * cl / 2, B[0], B[1], col, sw));
      const g = SG.render({ kind: LK[p.k], w: 120, h: 60, color: col, stroke: sw, inner: false }, 120, 60).svg;
      // chữ trong ampe kế, vôn kế luôn đứng thẳng: linh kiện thẳng đứng thì xoay hình nhưng giữ chữ
      const quay = Math.abs(ang) > 90 && Math.abs(ang) < 270 ? ang + 180 : ang;
      out.push(`<g transform="translate(${r1(mx)},${r1(my)}) rotate(${r1(quay)}) scale(${Math.round(k * 1000) / 1000}) translate(-60,-30)">${['ampeke', 'vonke', 'dienke', 'dongco'].includes(LK[p.k]) ? g.replace(/<text /, `<text transform="rotate(${r1(-quay)} 60 30)" `) : g}</g>`);
      if (p.nhan) {
        // nhãn sát linh kiện, về phía ngoài mạch (xa tâm các nút)
        const nx = -uy, ny = ux, d = 30 * k + 12, tam = X([(minx + maxx) / 2, (miny + maxy) / 2]);
        const sgn = (nx * (mx - tam[0]) + ny * (my - tam[1])) >= 0 ? 1 : -1;
        labels.push({ x: mx + sgn * nx * d, y: my + sgn * ny * d, tex: p.nhan, size: 15 });
      }
    });
    Object.keys(deg).forEach((k) => { const n = Object.keys(N).find((t) => key(N[t]) === k); if (deg[k] >= 3 || (n && cham.has(n))) { const P0 = X(k.split(',').map(Number)); out.push(C(P0[0], P0[1], 3.2, col, col, 0)); } });
    Object.keys(N).forEach((t) => { if (/^[A-Z]/.test(t)) { const P0 = X(N[t]); labels.push({ x: P0[0] - 10, y: P0[1] - 11, tex: t.replace(/(\d+)$/, '_{$1}'), size: 15 }); } });
  }
  // dựng ảnh của vật AB qua thấu kính: 1/f = 1/d + 1/d'
  function thaukinh(o, w, h, out, errs, labels) {
    const hoitu = o.loai !== 'phanki', f = Math.abs(num(o.f)), d = num(o.d), hv = num(o.hv) || 2;
    if (!(f > 0) || !(d > 0)) { errs.push('tiêu cự f và khoảng cách d phải là số dương'); return; }
    const fs = hoitu ? f : -f, voCuc = hoitu && Math.abs(d - f) < 1e-9;
    const d2 = voCuc ? Infinity : (d * fs) / (d - fs), h2 = voCuc ? 0 : (-hv * d2) / d;
    const xsA = [-d, -f * 1.25, f * 1.25].concat(voCuc ? [] : [d2]), lo = Math.min(...xsA) - f * 0.3, hi = Math.max(...xsA, f * 1.6) + f * 0.3;
    const ymax = Math.max(Math.abs(hv), voCuc ? 0 : Math.min(Math.abs(h2), hv * 6)) * 1.25;
    // hai tỉ lệ ngang / dọc riêng như hình SGK (phép co giãn giữ nguyên đường thẳng và giao điểm nên tia, ảnh vẫn đúng)
    const top = 14, bot = o.ghiso ? 46 : 16, u = (w - 20) / (hi - lo), v = (h - top - bot) / (2 * ymax);
    const cx = 10 - lo * u, cy = top + (h - top - bot) / 2;
    const X = (x) => cx + x * u, Y = (y) => cy - y * v, col = o.color || '#111';
    // trục chính, thấu kính, tiêu điểm
    out.push(L(6, cy, w - 6, cy, col, 1));
    const lh = ymax * v * 0.95;
    out.push(L(cx, cy - lh, cx, cy + lh, col, 1.6));
    out.push(hoitu ? arrowHead(cx, cy - lh + 10, cx, cy - lh, col) + arrowHead(cx, cy + lh - 10, cx, cy + lh, col) : arrowHead(cx, cy - lh, cx, cy - lh + 9, col) + arrowHead(cx, cy + lh, cx, cy + lh - 9, col));
    [[-f, 'F'], [f, "F'"]].forEach(([x, t]) => { out.push(C(X(x), cy, 2.4, col, col, 0)); labels.push({ x: X(x), y: cy + 13, tex: hoitu ? t : t === 'F' ? "F'" : 'F', size: 14 }); });
    labels.push({ x: cx + 9, y: cy + 12, tex: 'O', size: 14 });
    const ten = String(o.ten || 'AB').replace(/\s/g, ''), tA = ten[0] || 'A', tB = ten[1] || 'B';
    // vật
    out.push(L(X(-d), cy, X(-d), Y(hv), '#1f4f8f', 2) + arrowHead(X(-d), cy, X(-d), Y(hv), '#1f4f8f', 9));
    labels.push({ x: X(-d), y: cy + 13, tex: tA, size: 14 }, { x: X(-d) - 10, y: Y(hv), tex: tB, size: 14 });
    const B = [X(-d), Y(hv)], I = [cx, Y(hv)], ray = '#c0504d';
    const toEdge = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1]; const t = dx > 0 ? (w - 6 - p[0]) / dx : 9; return [p[0] + dx * t, p[1] + dy * t]; };
    const tia = (p, q) => L(p[0], p[1], q[0], q[1], ray, 1.3) + arrowHead(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, ray, 7);
    // tia 1: song song trục chính → ló qua F' (hội tụ) / có đường kéo dài qua F (phân kì)
    out.push(tia(B, I));
    const F2 = [X(hoitu ? f : -f), cy];
    const ra1 = hoitu ? toEdge(I, F2) : toEdge(I, [2 * I[0] - F2[0], 2 * I[1] - F2[1]]);
    out.push(tia(I, ra1));
    // tia 2: qua quang tâm O truyền thẳng
    const O = [cx, cy], ra2 = toEdge(O, [2 * O[0] - B[0], 2 * O[1] - B[1]]);
    out.push(tia(B, O) + tia(O, ra2));
    // tia 3: qua tiêu điểm F (vật ngoài khoảng tiêu cự, thấu kính hội tụ) → ló song song trục chính
    if (hoitu && d > f && o.batia) {
      const F1 = [X(-f), cy], t = (cx - B[0]) / (F1[0] - B[0]), J = [cx, B[1] + (F1[1] - B[1]) * t];
      out.push(tia(B, J) + tia(J, [w - 6, J[1]]));
    }
    if (voCuc) { out.push(T(w / 2, h - 12, 'Vật ở tiêu điểm: chùm tia ló song song, ảnh ở rất xa (vô cực)', { s: 12.5, i: true })); return; }
    const B2 = [X(d2), Y(h2)], that = d2 > 0;
    // ảnh ảo: vẽ nét đứt đường kéo dài của tia ló
    if (!that) out.push(L(I[0], I[1], B2[0], B2[1], ray, 1, '4 3') + L(O[0], O[1], B2[0], B2[1], ray, 1, '4 3'));
    out.push(L(X(d2), cy, B2[0], B2[1], '#1f4f8f', 2, that ? false : '5 3') + arrowHead(X(d2), cy, B2[0], B2[1], '#1f4f8f', 9));
    labels.push({ x: X(d2), y: cy + (h2 < 0 ? -13 : 13), tex: tA + "'", size: 14 }, { x: B2[0] + 12, y: B2[1], tex: tB + "'", size: 14 });
    if (o.ghiso) {
      out.push(T(w / 2, h - 30, `d = ${fmt(d, 2)} cm;  d' = ${fmt(Math.abs(d2), 2)} cm;  ${tA}'${tB}' = ${fmt(Math.abs(h2), 2)} cm`, { s: 12.5 }));
      out.push(T(w / 2, h - 12, `Ảnh ${that ? 'thật, ngược chiều' : 'ảo, cùng chiều'}, ${Math.abs(h2) > hv + 1e-9 ? 'lớn hơn' : Math.abs(h2) < hv - 1e-9 ? 'nhỏ hơn' : 'bằng'} vật`, { s: 12.5, i: true }));
    }
  }
  // đồ thị theo số liệu (x–t, v–t, U–I…): điểm "x | y", nối gấp khúc / đường thẳng phù hợp nhất / chỉ chấm điểm
  function sodulieu(o, w, h, out, errs, labels) {
    const pts = rowsOf(o.dulieu).map((r) => [num(r.name), r.vals[0]]).filter((p) => isFinite(p[0]) && isFinite(p[1]));
    if (!pts.length) { errs.push('mỗi dòng một điểm: x | y'); return; }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const sx = niceStep(Math.max(...xs, 0) - Math.min(...xs, 0), 6, xs.every(Number.isInteger)), sy = niceStep(Math.max(...ys, 0) - Math.min(...ys, 0), 5, ys.every(Number.isInteger));
    const x0 = Math.min(0, Math.floor(Math.min(...xs) / sx) * sx), x1 = Math.max(sx, Math.ceil(Math.max(...xs) / sx) * sx);
    const y0 = Math.min(0, Math.floor(Math.min(...ys) / sy) * sy), y1 = Math.max(sy, Math.ceil(Math.max(...ys) / sy) * sy);
    // tên trục ngang đặt sau mũi tên: chừa chỗ theo độ dài tên (bỏ lệnh \text, \,)
    const tenX = String(o.tentrucx || '').replace(/\\[a-z]+|[{}]/g, ''), box = { x0: 44, x1: w - 34 - (tenX ? tw(tenX, 14) + 4 : 0), y0: 26, y1: h - 30 };
    const X = (v) => box.x0 + ((v - x0) / (x1 - x0)) * (box.x1 - box.x0), Y = (v) => box.y1 - ((v - y0) / (y1 - y0)) * (box.y1 - box.y0);
    if (o.luoi) { for (let v = x0 + sx; v <= x1 + 1e-9; v += sx) out.push(L(X(v), box.y0, X(v), box.y1, '#dde1e6', 0.7)); for (let v = y0 + sy; v <= y1 + 1e-9; v += sy) out.push(L(box.x0, Y(v), box.x1, Y(v), '#dde1e6', 0.7)); }
    out.push(L(box.x0, Y(0), box.x1 + 16, Y(0), '#111', 1.2) + arrowHead(box.x0, Y(0), box.x1 + 16, Y(0)));
    out.push(L(X(0), box.y1, X(0), box.y0 - 14, '#111', 1.2) + arrowHead(X(0), box.y1, X(0), box.y0 - 14));
    for (let v = x0; v <= x1 + 1e-9; v += sx) if (Math.abs(v) > 1e-9) out.push(L(X(v), Y(0), X(v), Y(0) + 4, '#111', 1) + T(X(v), Y(0) + 13, fmt(v), { s: 12 }));
    for (let v = y0; v <= y1 + 1e-9; v += sy) if (Math.abs(v) > 1e-9) out.push(L(X(0) - 4, Y(v), X(0), Y(v), '#111', 1) + T(X(0) - 7, Y(v), fmt(v), { a: 'end', s: 12 }));
    out.push(T(X(0) - 7, Y(0) + 11, 'O', { a: 'end', s: 12, i: true }));
    if (o.tentrucx) labels.push({ x: box.x1 + 20, y: Y(0), tex: o.tentrucx, size: 14, ax: 'l' });
    if (o.tentrucy) labels.push({ x: X(0) + 8, y: box.y0 - 14, tex: o.tentrucy, size: 14, ax: 'l' });
    const col = o.color || '#c0504d';
    if (o.noi === 'thang' && pts.length >= 2) {
      const n = pts.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      const sxx = xs.reduce((a, x) => a + (x - mx) * (x - mx), 0), a = sxx ? xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx : 0, b = my - a * mx;
      const ya = a * x0 + b, yb = a * x1 + b;
      out.push(L(X(x0), Y(ya), X(x1), Y(yb), col, 1.6));
      // phương trình viết theo tên đại lượng trên trục (I = 0,2U + …), không có tên thì x, y
      const bien = (s, d) => (String(s || '').match(/^\s*([A-Za-z](?:_\{?\w+\}?)?)/) || [])[1] || d;
      if (o.ghipt) labels.push({ x: box.x1 - 4, y: box.y0 + 6, tex: bien(o.tentrucy, 'y') + ' = ' + fmt(a, 3).replace(',', '{,}') + bien(o.tentrucx, 'x') + (b >= 0 ? ' + ' : ' - ') + fmt(Math.abs(b), 3).replace(',', '{,}'), size: 13, ax: 'r', bg: true });
    } else if (o.noi !== 'diem') {
      const s = pts.slice().sort((p, q) => p[0] - q[0]);
      out.push(P('M' + s.map((p) => r1(X(p[0])) + ',' + r1(Y(p[1]))).join(' L'), 'none', col, 1.8));
    }
    pts.forEach((p) => {
      if (o.giong) out.push(L(X(p[0]), Y(0), X(p[0]), Y(p[1]), '#777', 0.8, '4 3') + L(X(0), Y(p[1]), X(p[0]), Y(p[1]), '#777', 0.8, '4 3'));
      out.push(C(X(p[0]), Y(p[1]), 3.2, col, col, 0));
    });
  }

  // ---------------- HOÁ HỌC ----------------
  const NT = ['', 'H Hydrogen', 'He Helium', 'Li Lithium', 'Be Beryllium', 'B Boron', 'C Carbon', 'N Nitrogen', 'O Oxygen', 'F Fluorine', 'Ne Neon', 'Na Sodium', 'Mg Magnesium', 'Al Aluminium', 'Si Silicon', 'P Phosphorus', 'S Sulfur', 'Cl Chlorine', 'Ar Argon', 'K Potassium', 'Ca Calcium', 'Sc Scandium', 'Ti Titanium', 'V Vanadium', 'Cr Chromium', 'Mn Manganese', 'Fe Iron', 'Co Cobalt', 'Ni Nickel', 'Cu Copper', 'Zn Zinc', 'Ga Gallium', 'Ge Germanium', 'As Arsenic', 'Se Selenium', 'Br Bromine', 'Kr Krypton'].map((s) => s.split(' '));
  const PL = [[1, 's'], [2, 's'], [2, 'p'], [3, 's'], [3, 'p'], [4, 's'], [3, 'd'], [4, 'p']];
  const CAP = { s: 2, p: 6, d: 10 };
  // cấu hình electron theo mức năng lượng (Cr, Cu: bán bão hoà / bão hoà phân lớp d)
  function cauHinh(z) {
    const c = [];
    let con = z;
    for (const [n, l] of PL) { if (con <= 0) break; const e = Math.min(CAP[l], con); c.push({ n, l, e }); con -= e; }
    if (z === 24 || z === 29) { const s4 = c.find((x) => x.n === 4 && x.l === 's'), d3 = c.find((x) => x.n === 3 && x.l === 'd'); s4.e -= 1; d3.e += 1; }
    return c;
  }
  const zOf = (s) => { const t = String(s || '').trim(); if (/^\d+$/.test(t)) return +t; const i = NT.findIndex((x) => x[0] && (x[0].toLowerCase() === t.toLowerCase() || x[1].toLowerCase() === t.toLowerCase())); return i; };
  function nguyentu(o, w, h, out, errs, labels) {
    const z = zOf(o.z);
    if (!(z >= 1 && z <= 36)) { errs.push('nhập số hiệu nguyên tử 1 – 36 hoặc kí hiệu (vd Fe, Cl)'); return; }
    const c = cauHinh(z), theoLop = c.slice().sort((a, b) => a.n - b.n || 'spd'.indexOf(a.l) - 'spd'.indexOf(b.l));
    let y = 18;
    const ten = NT[z];
    labels.push({ x: 10, y, tex: '\\mathrm{' + ten[0] + '}\\ (Z = ' + z + ')\\text{ — ' + ten[1] + '}', size: 15, ax: 'l' });
    y += 30;
    if (o.cauhinh !== false) {
      labels.push({ x: 10, y, tex: '\\text{Cấu hình electron: }' + theoLop.map((x) => x.n + x.l + '^{' + x.e + '}').join('\\,'), size: 15, ax: 'l' });
      y += 30;
    }
    const lop = {};
    c.forEach((x) => { lop[x.n] = (lop[x.n] || 0) + x.e; });
    const nMax = Math.max(...Object.keys(lop).map(Number));
    if (o.oluongtu !== false) {
      // ô lượng tử của lớp ngoài cùng (và phân lớp 3d với nguyên tố d)
      const vs = theoLop.filter((x) => x.n === nMax || (x.l === 'd' && x.n === nMax - 1));
      labels.push({ x: 10, y: y + 13, tex: '\\text{Ô orbital:}', size: 14, ax: 'l' });
      let x = 100;
      const bw = 24, bh = 24, col = o.color || '#111';
      vs.forEach((s) => {
        const nb = CAP[s.l] / 2, up = [], dn = [];
        for (let i = 0; i < nb; i++) { up.push(i < s.e); dn.push(i < s.e - nb); }
        for (let i = 0; i < nb; i++) {
          out.push(R(x + i * bw, y, bw, bh, '#fff', col, 1.1));
          const mx = x + i * bw + bw / 2;
          if (up[i]) out.push(L(mx - 4, y + bh - 4, mx - 4, y + 4, col, 1.3) + arrowHead(mx - 4, y + bh - 4, mx - 4, y + 4, col, 5));
          if (dn[i]) out.push(L(mx + 4, y + 4, mx + 4, y + bh - 4, col, 1.3) + arrowHead(mx + 4, y + 4, mx + 4, y + bh - 4, col, 5));
        }
        labels.push({ x: x + (nb * bw) / 2, y: y + bh + 12, tex: s.n + s.l + '^{' + s.e + '}', size: 13 });
        x += nb * bw + 14;
      });
      y += bh + 34;
    }
    if (o.lopvo !== false) {
      // sơ đồ lớp vỏ co theo chỗ còn lại phía dưới (quá chật thì bỏ)
      const nl = nMax, dk = Math.min(w - 20, h - y - 6), R0 = dk / 2 / (nl + 0.4), cx = w / 2, cy = y + dk / 2;
      if (dk >= 70) {
        out.push(C(cx, cy, R0 * 0.62, '#fde9d9', '#c0504d', 1.2) + T(cx, cy, '+' + z, { s: Math.max(10, R0 * 0.55), b: true, c: '#c0504d' }));
        for (let n = 1; n <= nl; n++) {
          const r = R0 * (n + 0.25);
          out.push(C(cx, cy, r, 'none', '#555', 1));
          for (let k = 0; k < lop[n]; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / lop[n]; out.push(C(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(2.2, R0 * 0.13), '#1f4f8f', '#1f4f8f', 0)); }
        }
      }
    }
  }
  // công thức cấu tạo thu gọn: mạch chính viết ngang, nhánh trong ngoặc vẽ thẳng đứng (dưới, rồi trên)
  function tachMach(s) {
    const items = [], bonds = [];
    let i = 0, cur = '', br = [];
    const flush = () => { items.push({ g: cur, br }); cur = ''; br = []; };
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') {
        let d = 1, j = i + 1;
        while (j < s.length && d) { if (s[j] === '(') d++; else if (s[j] === ')') d--; j++; }
        const inner = s.slice(i + 1, j - 1);
        let k = j, so = '';
        while (k < s.length && /\d/.test(s[k])) so += s[k++];
        // "(CH3)2": hai nhánh giống nhau; nhóm chỉ có một nguyên tử không có liên kết → viết liền ("C(O)")
        if (/[-=≡#]/.test(inner) || /^[A-Z]/.test(inner)) for (let t = 0; t < (+so || 1); t++) br.push(inner);
        else cur += '(' + inner + ')' + so;
        i = k; continue;
      }
      if ('-=≡#'.includes(ch)) { flush(); bonds.push(ch === '#' ? '≡' : ch); i++; continue; }
      cur += ch; i++;
    }
    flush();
    return { items, bonds };
  }
  function lienKet(x1, y1, x2, y2, b, col) {
    const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len * 3, ny = (x2 - x1) / len * 3;
    if (b === '=') return L(x1 + nx, y1 + ny, x2 + nx, y2 + ny, col, 1.2) + L(x1 - nx, y1 - ny, x2 - nx, y2 - ny, col, 1.2);
    if (b === '≡') return L(x1, y1, x2, y2, col, 1.2) + L(x1 + 1.6 * nx, y1 + 1.6 * ny, x2 + 1.6 * nx, y2 + 1.6 * ny, col, 1.2) + L(x1 - 1.6 * nx, y1 - 1.6 * ny, x2 - 1.6 * nx, y2 - 1.6 * ny, col, 1.2);
    return L(x1, y1, x2, y2, col, 1.2);
  }
  function cautao(o, w, h, out, errs) {
    const s = String(o.ct || '').replace(/\s/g, '');
    if (!s) { errs.push('nhập công thức, vd CH3-CH(CH3)-CH2-OH'); return; }
    if ((s.match(/\(/g) || []).length !== (s.match(/\)/g) || []).length) { errs.push('ngoặc chưa cân: ' + s); return; }
    const fs = +o.co || 18, col = o.color || '#111', gw = (g) => Math.max(fs * 0.8, g.replace(/\d/g, '').length * fs * 0.62 + g.replace(/\D/g, '').length * fs * 0.4);
    const m = tachMach(s), gap = fs * 1.5;
    const widths = m.items.map((it) => gw(it.g));
    const total = widths.reduce((a, b) => a + b, 0) + gap * m.bonds.length;
    const sc = Math.min(1, (w - 16) / total), x00 = (w - total * sc) / 2, cy = h / 2;
    out.push(`<g transform="translate(${r1(x00)},${r1(cy)}) scale(${Math.round(sc * 1000) / 1000})">`);
    let x = 0;
    const veNhanh = (txt, cx, dir) => {
      // nhánh: có thể là cả mạch "CH2-CH3" → vẽ dọc
      const n = tachMach(txt);
      let yy = dir * fs * 0.6;
      n.items.forEach((it, i) => {
        const b = i === 0 ? '-' : n.bonds[i - 1];
        out.push(lienKet(cx, yy, cx, yy + dir * fs * 0.9, b, col));
        yy += dir * fs * 0.9 + dir * fs * 0.55;
        out.push(`<text x="${r1(cx)}" y="${r1(yy)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" fill="${col}">${chemSvg(it.g)}</text>`);
        yy += dir * fs * 0.55;
      });
    };
    m.items.forEach((it, i) => {
      const cx = x + widths[i] / 2;
      out.push(`<text x="${r1(cx)}" y="0" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" fill="${col}">${chemSvg(it.g)}</text>`);
      it.br.forEach((b, k) => veNhanh(b, cx, k % 2 === 0 ? 1 : -1));
      x += widths[i];
      if (i < m.bonds.length) { out.push(lienKet(x + 3, 0, x + gap - 3, 0, m.bonds[i], col)); x += gap; }
    });
    out.push('</g>');
  }

  // ---------------- SINH HỌC ----------------
  // kiểu gen "AaBb": các cặp alen theo thứ tự chữ cái xuất hiện
  function capGen(g) {
    const s = String(g || '').replace(/\s/g, ''), loci = [];
    for (const ch of s) {
      if (!/[A-Za-z]/.test(ch)) throw new Error('kiểu gen chỉ gồm chữ cái, vd AaBb');
      const k = loci.find((l) => l.k === ch.toLowerCase());
      if (k) k.a.push(ch); else loci.push({ k: ch.toLowerCase(), a: [ch] });
    }
    if (!loci.length || loci.some((l) => l.a.length !== 2)) throw new Error('mỗi gen viết đủ hai alen, vd AaBb');
    return loci;
  }
  const giaoTu = (loci) => loci.reduce((acc, l) => { const r = []; acc.forEach((g) => [...new Set(l.a)].forEach((a) => r.push(g + a))); return r; }, ['']);
  const chuanKG = (s) => { const m = {}; for (const ch of s) (m[ch.toLowerCase()] = m[ch.toLowerCase()] || []).push(ch); return Object.keys(m).map((k) => m[k].sort().join('')).join(''); };
  // tên kiểu hình: "A | hạt vàng" mỗi dòng một alen trội / lặn
  const tenKH = (o) => { const m = {}; String(o.kieuhinh || '').split('\n').forEach((ln) => { const p = ln.split('|').map((s) => s.trim()); if (p[0] && p[1]) m[p[0]] = p[1]; }); return m; };
  const kieuHinh = (kg, m) => {
    const loci = {}; for (const ch of kg) (loci[ch.toLowerCase()] = loci[ch.toLowerCase()] || []).push(ch);
    const ks = Object.keys(loci);
    const coTen = ks.every((k) => m[k.toUpperCase()] && m[k]);
    return ks.map((k) => { const troi = loci[k].some((c) => c === c.toUpperCase()); return coTen ? m[troi ? k.toUpperCase() : k] : troi ? k.toUpperCase() + '-' : k + k; }).join(coTen ? ', ' : '');
  };
  function laiF1(o) {
    const l1 = capGen(o.p1), l2 = capGen(o.p2);
    if (l1.map((l) => l.k).join() !== l2.map((l) => l.k).join()) throw new Error('hai bên P phải cùng các gen (cùng chữ cái)');
    const g1 = giaoTu(l1), g2 = giaoTu(l2), kg = {};
    g1.forEach((a) => g2.forEach((b) => { const k = chuanKG(a + b); kg[k] = (kg[k] || 0) + 1; }));
    return { g1, g2, kg };
  }
  const tiLe = (map) => { const ks = Object.keys(map), g = ks.reduce((a, k) => gcd(a, map[k]), 0); return ks.map((k) => [map[k] / g, k]); };
  function sodolai(o, w, h, out, errs) {
    let r;
    try { r = laiF1(o); } catch (e) { errs.push(e.message); return; }
    const m = tenKH(o), fs = +o.co || 16, col = o.color || '#111';
    const kgs = Object.keys(r.kg).sort((a, b) => (b.match(/[A-Z]/g) || []).length - (a.match(/[A-Z]/g) || []).length || (a < b ? -1 : 1));
    const kh = {};
    kgs.forEach((k) => { const t = kieuHinh(k, m); kh[t] = (kh[t] || 0) + r.kg[k]; });
    const p1 = chuanKG(o.p1.replace(/\s/g, '')), p2 = chuanKG(o.p2.replace(/\s/g, ''));
    const khP = (k) => (Object.keys(m).length ? ' (' + kieuHinh(k, m) + ')' : '');
    // P và G viết thành hai cột: giao tử nằm ngay dưới bên P tạo ra nó (như SGK)
    const a1 = (o.gioitinh ? '♀ ' : '') + p1 + khP(p1), a2 = (o.gioitinh ? '♂ ' : '') + p2 + khP(p2);
    const ga = [...new Set(r.g1)].join(', '), gb = [...new Set(r.g2)].join(', ');
    const c1 = Math.max(tw(a1, fs), tw(ga, fs)) + fs * 1.2, c2 = Math.max(tw(a2, fs), tw(gb, fs));
    const lines = [
      ['P', [a1, '×', a2]],
      ['G', [ga, '', gb]],
      ['F1', [tiLe(Object.fromEntries(kgs.map((k) => [k, r.kg[k]]))).map(([n, k]) => (n > 1 ? n : '1') + k).join(' : ')]],
      ['', ['Tỉ lệ kiểu hình: ' + tiLe(kh).map(([n, k]) => n + ' ' + k).join(' : ')]],
    ];
    // dòng tỉ lệ dài: xuống dòng ở dấu ":" để chữ không bị thu quá nhỏ
    const rong = Math.max((w - 12) / 0.85 - 48, 48 + c1 + fs * 1.6 + c2 - 48);
    for (let i = 2; i < lines.length; i++) {
      const t = lines[i][1][0];
      if (tw(t, fs) <= rong) continue;
      const parts = t.split(' : '), moi = [];
      let cur = '';
      parts.forEach((p, k) => { const thu = cur ? cur + ' : ' + p : p; if (cur && tw(thu, fs) > rong) { moi.push(cur + ' :'); cur = p; } else cur = thu; if (k === parts.length - 1) moi.push(cur); });
      lines.splice(i, 1, [lines[i][0], [moi[0]]], ...moi.slice(1).map((x) => ['', [x]]));
      i += moi.length - 1;
    }
    const lineH = fs * 1.9, maxw = Math.max(48 + c1 + fs * 1.6 + c2, ...lines.slice(2).map((l) => tw(l[1][0], fs) + 48));
    const sc = Math.min(1, (w - 12) / maxw, (h - 8) / (lines.length * lineH));
    out.push(`<g transform="translate(8,${r1((h - lines.length * lineH * sc) / 2)}) scale(${Math.round(sc * 1000) / 1000})">`);
    lines.forEach((l, i) => {
      const y = (i + 0.5) * lineH;
      if (l[0]) out.push(`<text x="0" y="${r1(y)}" dominant-baseline="central" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="${col}">${l[0].replace(/(\d)$/, '<tspan baseline-shift="sub" font-size="72%">$1</tspan>')}:</text>`);
      if (l[1].length === 3) {
        out.push(T(48, y, l[1][0], { a: 'start', s: fs, c: col }));
        if (l[1][1]) out.push(T(48 + c1 + fs * 0.2, y, l[1][1], { s: fs, c: col }));
        out.push(T(48 + c1 + fs * 1.4, y, l[1][2], { a: 'start', s: fs, c: col }));
      } else out.push(T(48, y, l[1][0], { a: 'start', s: fs, c: col }));
    });
    out.push('</g>');
  }
  function punnett(o, w, h, out, errs) {
    let r;
    try { r = laiF1(o); } catch (e) { errs.push(e.message); return; }
    const g1 = [...new Set(r.g1)], g2 = [...new Set(r.g2)], m = tenKH(o);
    const n = g2.length + 1, k = g1.length + 1, cw = Math.min((w - 4) / n, 110), ch = Math.min((h - 4) / k, 52), fs = Math.min(17, ch * 0.42, cw * 0.22);
    const x0 = (w - cw * n) / 2, y0 = (h - ch * k) / 2, khs = [];
    out.push(R(x0, y0, cw, ch, '#e8eef7', '#222', 1) + L(x0, y0, x0 + cw, y0 + ch, '#222', 0.8) + T(x0 + cw * 0.72, y0 + ch * 0.3, o.gioitinh ? '♂' : 'G', { s: fs * 0.9 }) + T(x0 + cw * 0.28, y0 + ch * 0.72, o.gioitinh ? '♀' : 'G', { s: fs * 0.9 }));
    g2.forEach((g, j) => out.push(R(x0 + cw * (j + 1), y0, cw, ch, '#e8eef7', '#222', 1) + T(x0 + cw * (j + 1.5), y0 + ch / 2, g, { s: fs, b: true })));
    g1.forEach((a, i) => {
      out.push(R(x0, y0 + ch * (i + 1), cw, ch, '#e8eef7', '#222', 1) + T(x0 + cw / 2, y0 + ch * (i + 1.5), a, { s: fs, b: true }));
      g2.forEach((b, j) => {
        const kg = chuanKG(a + b), t = kieuHinh(kg, m);
        let ci = khs.indexOf(t); if (ci < 0) { khs.push(t); ci = khs.length - 1; }
        out.push(R(x0 + cw * (j + 1), y0 + ch * (i + 1), cw, ch, o.tomau ? ['#fff2cc', '#dae8fc', '#e2efda', '#fce4d6', '#ededed', '#e4dfec'][ci % 6] : '#fff', '#222', 1) + T(x0 + cw * (j + 1.5), y0 + ch * (i + 1.5), kg, { s: fs }));
      });
    });
  }
  // sơ đồ phả hệ: mỗi dòng một người "mã | nam/nữ | bệnh / mang | bố+mẹ"; thế hệ tự tính từ quan hệ bố mẹ
  function phahe(o, w, h, out, errs, labels) {
    const ds = [], M = {};
    String(o.dulieu || '').split('\n').forEach((ln) => {
      const p = ln.split('|').map((s) => s.trim());
      if (!p[0]) return;
      const gioi = /^n(ữ|u)/i.test(p[1] || '') ? 'nu' : 'nam', tt = (p[2] || '').toLowerCase();
      const bm = (p[3] || '').split(/[+,&]/).map((s) => s.trim()).filter(Boolean);
      const ng = { ma: p[0], gioi, benh: /^(b|bệnh|benh)/.test(tt), mang: /^(m|mang)/.test(tt), bm };
      ds.push(ng); M[ng.ma] = ng;
    });
    if (!ds.length) { errs.push('chưa có người nào (mỗi dòng: mã | nam/nữ | bệnh | bố+mẹ)'); return; }
    for (const n of ds) for (const b of n.bm) if (!M[b]) { errs.push('người ' + n.ma + ': chưa có bố / mẹ "' + b + '"'); return; }
    // vợ chồng: cặp bố mẹ của ít nhất một người con
    const vc = {};
    ds.forEach((n) => { if (n.bm.length === 2) { const [a, b] = n.bm; (vc[a] = vc[a] || new Set()).add(b); (vc[b] = vc[b] || new Set()).add(a); } });
    ds.forEach((n) => { n.the = 0; });
    for (let lap = 0; lap < ds.length + 2; lap++) ds.forEach((n) => {
      if (n.bm.length) n.the = Math.max(...n.bm.map((b) => M[b].the)) + 1;
      else if (vc[n.ma]) n.the = Math.max(n.the, ...[...vc[n.ma]].map((b) => M[b].the));
    });
    const soThe = Math.max(...ds.map((n) => n.the)) + 1, hang = [];
    for (let t = 0; t < soThe; t++) hang.push([]);
    const daXep = new Set(), sp = 64;
    const them = (n, t) => { if (daXep.has(n.ma)) return; daXep.add(n.ma); hang[t].push(n); (vc[n.ma] ? [...vc[n.ma]] : []).map((b) => M[b]).filter((b) => !b.bm.length && b.the === t).forEach((b) => { if (!daXep.has(b.ma)) { daXep.add(b.ma); hang[t].push(b); } }); };
    ds.filter((n) => n.the === 0).forEach((n) => them(n, 0));
    hang[0].forEach((n, i) => { n.x = i * sp; });
    for (let t = 1; t < soThe; t++) {
      const nhom = {};
      ds.filter((n) => n.the === t && n.bm.length).forEach((n) => { const k = n.bm.slice().sort().join('+'); (nhom[k] = nhom[k] || []).push(n); });
      const fam = Object.keys(nhom).map((k) => ({ k, ds: nhom[k], cx: nhom[k][0].bm.reduce((a, b) => a + M[b].x, 0) / nhom[k][0].bm.length })).sort((a, b) => a.cx - b.cx);
      let cuoi = -Infinity;
      fam.forEach((f) => {
        const truoc = hang[t].length;
        f.ds.forEach((n) => them(n, t));
        const moi = hang[t].slice(truoc), x0 = Math.max(f.cx - ((moi.length - 1) * sp) / 2, cuoi + sp);
        moi.forEach((n, i) => { n.x = x0 + i * sp; });
        cuoi = x0 + (moi.length - 1) * sp;
      });
      ds.filter((n) => n.the === t && !daXep.has(n.ma)).forEach((n) => { them(n, t); n.x = cuoi + sp; cuoi = n.x; });
    }
    ds.filter((n) => n.x === undefined).forEach((n, i) => { n.x = i * sp; });
    const minx = Math.min(...ds.map((n) => n.x)), maxx = Math.max(...ds.map((n) => n.x));
    const left = 44, legH = o.chuthich ? (w - 12 < 4 * 28 + tw('Nam bình thườngNam bị bệnhNữ bình thườngNữ bị bệnh', 12) ? 48 : 30) : 0, rowH = Math.min(96, (h - 24 - legH) / soThe);
    const sc = Math.min(1.3, (w - left - 30) / Math.max(sp, maxx - minx + sp * 0.6)), s = Math.min(26, rowH * 0.36) * Math.min(1, sc + 0.25);
    const X = (n) => left + 14 + (n.x - minx) * sc, Yh = (t) => 12 + rowH * t + s / 2;
    const col = o.color || '#111';
    const kyHieu = (n) => {
      const x = X(n), y = Yh(n.the), f = n.benh ? col : '#fff';
      let g = n.gioi === 'nam' ? R(x - s / 2, y - s / 2, s, s, f, col, 1.4) : C(x, y, s / 2, f, col, 1.4);
      if (n.mang && !n.benh) g += C(x, y, s * 0.14, col, col, 0);
      return g;
    };
    // đường hôn nhân và đường con cái
    const daVe = new Set();
    ds.forEach((n) => {
      if (n.bm.length !== 2) return;
      const k = n.bm.slice().sort().join('+');
      const [a, b] = n.bm.map((m) => M[m]), ya = Yh(a.the);
      const xa = Math.min(X(a), X(b)), xb = Math.max(X(a), X(b));
      if (!daVe.has(k)) {
        daVe.add(k);
        out.push(L(xa + s / 2, ya, xb - s / 2, ya, col, 1.3));
        const con = ds.filter((c) => c.bm.slice().sort().join('+') === k), mid = (xa + xb) / 2, yl = (ya + Yh(a.the + 1)) / 2;
        out.push(L(mid, ya, mid, yl, col, 1.3));
        const xs = con.map(X);
        out.push(L(Math.min(mid, ...xs), yl, Math.max(mid, ...xs), yl, col, 1.3));
        con.forEach((c) => out.push(L(X(c), yl, X(c), Yh(c.the) - s / 2, col, 1.3)));
      }
    });
    ds.forEach((n) => out.push(kyHieu(n)));
    const LA = ['I', 'II', 'III', 'IV', 'V', 'VI'];
    for (let t = 0; t < soThe; t++) {
      out.push(T(14, Yh(t), LA[t] || String(t + 1), { s: 15, b: true }));
      hang[t].slice().sort((a, b) => a.x - b.x).forEach((n, i) => out.push(T(X(n), Yh(t) + s / 2 + 11, o.ghima ? n.ma : String(i + 1), { s: 12 })));
    }
    if (o.chuthich) {
      // chú thích: một hàng nếu đủ rộng, khung hẹp thì hai hàng (nam / nữ)
      const k = 14, muc = [['nam', false, 'Nam bình thường'], ['nam', true, 'Nam bị bệnh'], ['nu', false, 'Nữ bình thường'], ['nu', true, 'Nữ bị bệnh']];
      const rongMuc = (t) => k + 14 + tw(t, 12), haiHang = muc.reduce((a, m) => a + rongMuc(m[2]), 0) > w - 12;
      const cot = haiHang ? Math.max(rongMuc(muc[0][2]), rongMuc(muc[2][2])) : 0;
      let x = haiHang ? Math.max(6, (w - cot - rongMuc(muc[1][2])) / 2) : left, x0 = x;
      muc.forEach(([g, b, t], i) => {
        const y = haiHang ? h - 32 + (i % 2) * 18 : h - 14;
        if (haiHang) x = x0 + (i < 2 ? 0 : cot); // cột trái: nam, cột phải: nữ
        out.push(g === 'nam' ? R(x, y - k / 2, k, k, b ? col : '#fff', col, 1.2) : C(x + k / 2, y, k / 2, b ? col : '#fff', col, 1.2));
        out.push(T(x + k + 5, y, t, { a: 'start', s: 12 }));
        if (!haiHang) x += rongMuc(t);
      });
    }
  }

  const DRAW = { bangsl, bieudo, quat, ghepnhom, caySoDo, machdien, thaukinh, sodulieu, nguyentu, cautao, sodolai, punnett, phahe };
  function render(o, w, h) {
    const out = [], errors = [], labels = [];
    const f = DRAW[o.ve];
    if (!f) return { svg: '', labels: [], errors: ['không có kiểu hình "' + o.ve + '"'] };
    try { f(o, w, h, out, errors, labels); } catch (e) { errors.push(e.message); }
    return { svg: out.join(''), labels, errors };
  }

  // ---------- Mẫu theo môn và ô nhập ở khung Thuộc tính ----------
  // mỗi nhóm: [tên, môn (toan / li / hoa / sinh), { khoá: [tên mẫu, dữ liệu] }]; dữ liệu có "ve" là kiểu hình
  const GROUPS = [
    ['Thống kê và xác suất', 'toan', {
      bangsl: ['Bảng số liệu, bảng tần số', { ve: 'bangsl', dulieu: 'Điểm | 5 | 6 | 7 | 8 | 9 | 10\nSố học sinh | 2 | 5 | 9 | 12 | 7 | 3', dauhang: false, cotdau: true, co: 15, w: 460, h: 80 }],
      bdcot: ['Biểu đồ cột', { ve: 'bieudo', loai: 'cot', tieude: 'Số học sinh tham gia các câu lạc bộ', dulieu: 'Bóng đá | 32\nCờ vua | 18\nMĩ thuật | 24\nÂm nhạc | 27', donvi: 'Số học sinh', tentruc: 'Câu lạc bộ', hienso: true, w: 480, h: 300 }],
      bdcotkep: ['Biểu đồ cột kép', { ve: 'bieudo', loai: 'cot', tieude: 'Số học sinh giỏi của hai lớp', chuoi: 'Lớp 7A | Lớp 7B', dulieu: 'Toán | 12 | 10\nNgữ văn | 8 | 11\nTiếng Anh | 9 | 7', donvi: 'Số học sinh', tentruc: 'Môn', hienso: true, w: 480, h: 300 }],
      bddoan: ['Biểu đồ đoạn thẳng', { ve: 'bieudo', loai: 'doan', tieude: 'Nhiệt độ trung bình các tháng', dulieu: 'T1 | 17\nT2 | 18\nT3 | 21\nT4 | 25\nT5 | 28\nT6 | 30', donvi: '°C', tentruc: 'Tháng', hienso: true, giong: false, w: 480, h: 280 }],
      bdquat: ['Biểu đồ hình quạt tròn', { ve: 'quat', tieude: 'Phương tiện đến trường', dulieu: 'Xe đạp | 45\nXe buýt | 25\nĐi bộ | 20\nXe máy | 10', chuthich: true, w: 380, h: 240 }],
      ghepnhom: ['Biểu đồ tần số ghép nhóm (lớp 11)', { ve: 'ghepnhom', tieude: 'Chiều cao của học sinh lớp 11A', dulieu: '[150; 155) | 4\n[155; 160) | 9\n[160; 165) | 15\n[165; 170) | 8\n[170; 175) | 4', donvi: 'Tần số', tentruc: 'cm', hienso: true, dagiac: false, w: 480, h: 290 }],
      sodocay: ['Sơ đồ cây xác suất', { ve: 'caySoDo', goc: '', dulieu: 'A | 0,6\n- B | 0,3\n- B̄ | 0,7\nĀ | 0,4\n- B | 0,5\n- B̄ | 0,5', tich: true, w: 460, h: 240 }],
    }],
    ['Vật lí', 'li', {
      machdien: ['Mạch điện (theo lưới)', { ve: 'machdien', kichban: '# nút: tên = (x, y); linh kiện: tên đầu cuối = nhãn\nA = (0, 3)\nB = (4, 3)\nC = (4, 0)\nD = (0, 0)\nnguon A B = U\nkhoa B C = K\nampeke D A\nM = (3, 0)\nN = (1, 0)\nday C M\nden M N = Đ\nday N D\nday M (3,-2)\nvonke (3,-2) (1,-2)\nday (1,-2) N', color: '#111111', stroke: 1.5, w: 380, h: 300 }],
      machsongsong: ['Mạch điện hai điện trở song song', { ve: 'machdien', kichban: 'A = (0, 2)\nB = (5, 2)\nnguon (0,4) (5,4) = U\nday (0,4) A\nday (5,4) B\ndientro A B = R_1\nM = (0, 0)\nN = (5, 0)\nday A M\ndientro M N = R_2\nday N B', color: '#111111', stroke: 1.5, w: 380, h: 280 }],
      thaukinh: ['Dựng ảnh qua thấu kính hội tụ', { ve: 'thaukinh', loai: 'hoitu', f: 10, d: 25, hv: 3, ten: 'AB', batia: true, ghiso: true, w: 520, h: 280 }],
      thaukinh2: ['Dựng ảnh qua thấu kính phân kì', { ve: 'thaukinh', loai: 'phanki', f: 12, d: 20, hv: 4, ten: 'AB', batia: false, ghiso: true, w: 520, h: 260 }],
      sodulieu: ['Đồ thị theo số liệu (x – t, v – t, U – I…)', { ve: 'sodulieu', dulieu: '0 | 0\n2 | 6\n4 | 12\n6 | 12\n8 | 0', tentrucx: 't\\,(\\text{s})', tentrucy: 'v\\,(\\text{m/s})', noi: 'gapkhuc', giong: true, luoi: false, ghipt: false, w: 440, h: 280 }],
      sodulieu2: ['Số liệu thí nghiệm: đường thẳng phù hợp (U – I)', { ve: 'sodulieu', dulieu: '0 | 0\n1,5 | 0,31\n3 | 0,59\n4,5 | 0,92\n6 | 1,2', tentrucx: 'U\\,(\\text{V})', tentrucy: 'I\\,(\\text{A})', noi: 'thang', giong: false, luoi: true, ghipt: true, w: 440, h: 280 }],
    }],
    ['Hoá học', 'hoa', {
      nguyentu: ['Cấu hình electron, ô orbital, lớp vỏ', { ve: 'nguyentu', z: 'Fe', cauhinh: true, oluongtu: true, lopvo: true, color: '#111111', w: 460, h: 420 }],
      cautao: ['Công thức cấu tạo thu gọn', { ve: 'cautao', ct: 'CH3-CH(CH3)-CH2-OH', co: 18, color: '#111111', w: 380, h: 170 }],
      cautao2: ['Công thức cấu tạo có liên kết đôi, ba', { ve: 'cautao', ct: 'CH2=CH-C≡CH', co: 18, color: '#111111', w: 360, h: 90 }],
    }],
    ['Sinh học', 'sinh', {
      sodolai: ['Sơ đồ lai', { ve: 'sodolai', p1: 'AaBb', p2: 'aabb', kieuhinh: 'A | vàng\na | xanh\nB | trơn\nb | nhăn', gioitinh: false, co: 16, color: '#111111', w: 560, h: 170 }],
      punnett: ['Khung Punnett', { ve: 'punnett', p1: 'AaBb', p2: 'AaBb', kieuhinh: '', gioitinh: true, tomau: true, w: 460, h: 280 }],
      phahe: ['Sơ đồ phả hệ', { ve: 'phahe', dulieu: '1 | nam |  |\n2 | nữ |  |\n3 | nam | bệnh | 1+2\n4 | nữ |  | 1+2\n5 | nam |  |\n6 | nữ | bệnh | 4+5\n7 | nam |  | 4+5', ghima: false, chuthich: true, color: '#111111', w: 460, h: 300 }],
    }],
  ];
  const KINDS = {}, MON = {};
  GROUPS.forEach((g) => { for (const k in g[2]) { KINDS[k] = g[2][k]; MON[k] = g[1]; } });
  // ô nhập ở khung Thuộc tính: [khoá, nhãn, kiểu, lựa chọn]
  const FIELDS = {
    bangsl: [['dulieu', 'Dữ liệu: mỗi dòng một hàng, ô cách nhau bằng | (ô viết $…$ là công thức)', 'area'], ['dauhang', 'Hàng đầu là tiêu đề', 'chk'], ['cotdau', 'Cột đầu là tiêu đề', 'chk'], ['co', 'Cỡ chữ', 'num']],
    bieudo: [['tieude', 'Tên biểu đồ'], ['dulieu', 'Dữ liệu: tên | số (cột kép: tên | số | số); tên dài xuống dòng bằng \\', 'area'], ['chuoi', 'Tên các dãy số (cột kép), cách nhau bằng |'], ['loai', 'Kiểu', 'sel', { cot: 'Biểu đồ cột', doan: 'Biểu đồ đoạn thẳng' }], ['donvi', 'Tên trục đứng (đơn vị)'], ['tentruc', 'Tên trục ngang'], ['buoc', 'Khoảng chia trục đứng (trống = tự chọn)'], ['hienso', 'Ghi số liệu', 'chk'], ['giong', 'Đường gióng (biểu đồ đoạn thẳng)', 'chk']],
    quat: [['tieude', 'Tên biểu đồ'], ['dulieu', 'Dữ liệu: tên | số (tự tính phần trăm)', 'area'], ['chuthich', 'Ghi tên ở bảng chú thích bên cạnh', 'chk']],
    ghepnhom: [['tieude', 'Tên biểu đồ'], ['dulieu', 'Dữ liệu: [a; b) | tần số (mỗi dòng một nhóm)', 'area'], ['donvi', 'Tên trục đứng'], ['tentruc', 'Tên trục ngang (đơn vị)'], ['hienso', 'Ghi tần số', 'chk'], ['dagiac', 'Vẽ đa giác tần số', 'chk']],
    caySoDo: [['goc', 'Tên ở gốc (có thể để trống)'], ['dulieu', 'Mỗi dòng một nhánh: tên | xác suất; nhánh con viết thêm dấu - ở đầu', 'area'], ['tich', 'Ghi xác suất từng đường đi (nhân theo nhánh)', 'chk']],
    machdien: [['kichban', 'Kịch bản mạch điện', 'area'], ['color', 'Màu nét', 'color'], ['stroke', 'Độ dày nét', 'num']],
    thaukinh: [['loai', 'Thấu kính', 'sel', { hoitu: 'Hội tụ', phanki: 'Phân kì' }], ['f', 'Tiêu cự f (cm)', 'num'], ['d', 'Vật cách thấu kính d (cm)', 'num'], ['hv', 'Chiều cao vật (cm)', 'num'], ['ten', 'Tên vật (vd AB)'], ['batia', 'Vẽ thêm tia qua tiêu điểm F', 'chk'], ['ghiso', 'Ghi d\', độ cao ảnh và tính chất ảnh', 'chk']],
    sodulieu: [['dulieu', 'Số liệu: x | y (mỗi dòng một điểm)', 'area'], ['tentrucx', 'Tên trục ngang (công thức, vd t\\,(\\text{s}))'], ['tentrucy', 'Tên trục đứng (công thức)'], ['noi', 'Nối các điểm', 'sel', { gapkhuc: 'Đường gấp khúc', thang: 'Đường thẳng phù hợp nhất (số liệu thí nghiệm)', diem: 'Chỉ chấm điểm' }], ['giong', 'Đường gióng', 'chk'], ['luoi', 'Kẻ lưới', 'chk'], ['ghipt', 'Ghi phương trình đường thẳng', 'chk'], ['color', 'Màu đường', 'color']],
    nguyentu: [['z', 'Nguyên tố: kí hiệu hoặc số hiệu Z (1 – 36)'], ['cauhinh', 'Cấu hình electron', 'chk'], ['oluongtu', 'Ô orbital lớp ngoài cùng', 'chk'], ['lopvo', 'Sơ đồ lớp vỏ', 'chk'], ['color', 'Màu nét', 'color']],
    cautao: [['ct', 'Công thức (vd CH3-CH(CH3)-CH2-OH; liên kết đôi =, ba ≡ hoặc #)'], ['co', 'Cỡ chữ', 'num'], ['color', 'Màu', 'color']],
    sodolai: [['p1', 'Kiểu gen P thứ nhất (vd AaBb)'], ['p2', 'Kiểu gen P thứ hai'], ['kieuhinh', 'Tên kiểu hình: alen | tính trạng (mỗi dòng một alen, trống = viết A-, aa)', 'area'], ['gioitinh', 'Ghi ♀, ♂', 'chk'], ['co', 'Cỡ chữ', 'num'], ['color', 'Màu chữ', 'color']],
    punnett: [['p1', 'Kiểu gen bên ♀ (hàng)'], ['p2', 'Kiểu gen bên ♂ (cột)'], ['kieuhinh', 'Tên kiểu hình: alen | tính trạng (để tô màu theo kiểu hình)', 'area'], ['gioitinh', 'Ghi ♀, ♂ ở góc', 'chk'], ['tomau', 'Tô màu theo kiểu hình', 'chk']],
    phahe: [['dulieu', 'Mỗi dòng một người: mã | nam/nữ | bệnh hoặc mang | bố+mẹ', 'area'], ['ghima', 'Ghi mã thay cho số thứ tự trong thế hệ', 'chk'], ['chuthich', 'Chú thích kí hiệu', 'chk'], ['color', 'Màu', 'color']],
  };
  const HELP = {
    machdien: 'Mỗi dòng một lệnh. Đặt nút: <code>A = (0, 3)</code> (toạ độ ô lưới, trục đứng hướng lên; tên chữ thường thì không ghi trên hình). Linh kiện nối hai nút: <code>dientro A B = R_1</code> — nhãn sau dấu = viết như công thức. Linh kiện: <code>dientro, bientro, nguon, bopin, den, khoa</code> (mở), <code>khoadong, ampeke, vonke, dienke, tudien, cuoncam, diot, chuong, dongco</code>; dây nối: <code>day A B</code>. Có thể viết thẳng toạ độ: <code>day (0,4) A</code>. Chỗ ba dây gặp nhau tự có chấm nối; thêm chấm: <code>cham A</code>.',
    caySoDo: 'Ví dụ hai lần chọn: dòng <code>A | 0,6</code> là nhánh tầng 1; dòng <code>- B | 0,3</code> (có dấu - ở đầu) là nhánh con của dòng tầng 1 ngay trên. Xác suất viết số thập phân (0,6) hoặc phân số (3/5).',
    phahe: 'Ví dụ: <code>3 | nam | bệnh | 1+2</code> — người mã 3 là nam, bị bệnh, con của người 1 và người 2. Cột thứ ba để trống nếu bình thường, viết <code>mang</code> nếu mang gen (chấm giữa kí hiệu). Người không có bố mẹ trong sơ đồ (vợ / chồng lấy vào) tự xếp cạnh người kia; thế hệ I, II, III tự tính.',
    sodolai: 'Kiểu gen viết liền, mỗi gen hai alen, các gen phân li độc lập (vd <code>AaBb × aabb</code>); tính trạng trội hoàn toàn. Đặt tên kiểu hình để F<sub>1</sub> ghi bằng lời (vàng, trơn…).',
  };
  const fieldUse = (o, key) => !(o.ve === 'bieudo' && key === 'giong' && o.loai !== 'doan') && !(o.ve === 'thaukinh' && key === 'batia' && o.loai === 'phanki');
  const fieldLabel = (o, key, label) => label;
  const api = { render, GROUPS, KINDS, MON, FIELDS, HELP, fieldUse, fieldLabel, cauHinh, laiF1, tachMach, NT };
  root.KhoaHoc = api; // bộ đọc khối ```toanviet-mon (baigiai-chuyen.js) tìm ở đây, cả khi chạy bằng Node (skill)
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
