// Toán Tiểu học (lớp 1–5): đặt tính theo cột (cộng, trừ, nhân, chia kiểu Việt Nam) và các dạng bài trên phiếu bài tập
(function (root) {
  'use strict';
  const r1 = (v) => Math.round(v * 10) / 10;
  const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const RED = '#d62728';

  // ---------- Số: chuỗi chữ số + số chữ số phần thập phân ----------
  // "4 536", "4.536" (dấu chấm tách lớp), "12,75" (dấu phẩy thập phân)
  function readNum(src) {
    let s = String(src).trim().replace(/\s+/g, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace('.', ',');
    const m = s.match(/^(\d*)(?:,(\d*))?$/);
    if (!m || !(m[1] || m[2])) throw new Error('Không hiểu số: ' + src);
    let int = (m[1] || '0').replace(/^0+(?=\d)/, '');
    const frac = m[2] || '';
    return { int, frac, d: frac.length, v: BigInt(int + frac) }; // v: số nguyên sau khi bỏ dấu phẩy
  }
  const P10 = (k) => 10n ** BigInt(k);
  // số nguyên lớn (đã nhân 10^d) -> { int, frac } với đúng d chữ số thập phân
  function fromScaled(v, d) {
    let s = v.toString();
    if (d > 0) { s = s.padStart(d + 1, '0'); return { int: s.slice(0, s.length - d), frac: s.slice(s.length - d) }; }
    return { int: s, frac: '' };
  }
  // tách lớp nghìn bằng khoảng trắng (từ 5 chữ số), dấu phẩy thập phân
  function fmtNum(v) {
    if (!isFinite(v)) return '';
    const neg = v < 0; v = Math.abs(v);
    let s = (Math.round(v * 1e6) / 1e6).toString();
    if (/e/.test(s)) s = v.toFixed(6);
    let [i, f] = s.split('.');
    if (i.length >= 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '-' : '') + i + (f ? ',' + f : '');
  }

  // ---------- Đặt tính ----------
  function parseOp(expr) {
    const s = String(expr || '').replace(/[×xX*·]/g, '×').replace(/[:÷]/g, ':').replace(/[−–]/g, '-').trim();
    const m = s.match(/^([\d\s.,]+?)\s*([+\-×:])\s*([\d\s.,+\-×:]+?)\s*(=.*)?$/);
    if (!m) throw new Error('Viết phép tính dạng  4536 : 12  hoặc  356 + 278  hoặc  24,5 × 3,2');
    const op = m[2];
    const rest = m[3].split(op);
    if (op !== '+' && rest.length > 1) throw new Error('Phép ' + (op === '-' ? 'trừ' : op === '×' ? 'nhân' : 'chia') + ' chỉ đặt tính với hai số');
    if (/[+\-×:]/.test(rest.join(''))) throw new Error('Mỗi lần chỉ đặt tính một loại phép tính');
    return { op, nums: [m[1]].concat(rest).map(readNum) };
  }

  // Mỗi chữ cần vẽ: { c: cột (0 = hàng đơn vị của kết quả, tăng sang trái), r: hàng, t: chữ, k: loại }
  //   k: 'g' số đã cho, 'k' kết quả, 'm' kết quả trung gian (tích riêng, số dư từng bước), 's' dấu, 'n' số nhớ
  function layoutAddSub(op, nums) {
    const D = Math.max(...nums.map((n) => n.d));
    const vals = nums.map((n) => n.v * P10(D - n.d));
    let res;
    if (op === '+') res = vals.reduce((a, b) => a + b, 0n);
    else { res = vals[0] - vals[1]; if (res < 0n) throw new Error('Số bị trừ phải lớn hơn hoặc bằng số trừ'); }
    const items = [], commas = [];
    const put = (n, r, k) => {
      const f = fromScaled(n, D), s = f.int + f.frac;
      for (let i = 0; i < s.length; i++) items.push({ c: s.length - 1 - i, r, t: s[i], k, s: s.length - i });
      if (D) commas.push({ c: D, r });
    };
    nums.forEach((n, i) => {
      // giữ nguyên cách viết của số (không thêm số 0 ở phần thập phân)
      const s = n.int + n.frac, sh = D - n.d;
      for (let j = 0; j < s.length; j++) items.push({ c: s.length - 1 - j + sh, r: i, t: s[j], k: 'g' });
      if (n.d) commas.push({ c: n.d + sh, r: i });
    });
    const nr = nums.length;
    put(res, nr, 'k');
    const width = Math.max(...items.map((it) => it.c)) + 1;
    // số nhớ (cộng) / số trả (trừ: thêm 1 vào hàng kế bên của số trừ)
    const carries = [];
    let carry = 0;
    const digit = (v, c) => Number((v / P10(c)) % 10n);
    for (let c = 0; c < width; c++) {
      if (op === '+') {
        const sum = vals.reduce((a, v) => a + digit(v, c), 0) + carry;
        carry = Math.floor(sum / 10);
        if (carry && c + 1 < width) carries.push({ c: c + 1, r: -0.62, t: String(carry), k: 'n', s: c + 1 });
      } else {
        const a = digit(vals[0], c), b = digit(vals[1], c) + carry;
        carry = a < b ? 1 : 0;
        if (carry && c + 1 < width) carries.push({ c: c + 1, r: 1 - 0.62, t: '1', k: 'n', small: true, dx: 0.42, s: c + 1 });
      }
    }
    return { items: items.concat(carries), commas, signs: [{ c: width, r: (nr - 1) / 2, t: op === '+' ? '+' : '−' }], lines: [{ r: nr - 1, c0: width, c1: -1 }], rows: nr + 1, width: width + 1 };
  }

  function layoutMul(nums) {
    const [a, b] = nums;
    const items = [], commas = [], lines = [];
    const sa = a.int + a.frac, sb = (b.int === '0' && b.frac ? '0' : b.int) + b.frac;
    for (let i = 0; i < sa.length; i++) items.push({ c: sa.length - 1 - i, r: 0, t: sa[i], k: 'g' });
    for (let i = 0; i < sb.length; i++) items.push({ c: sb.length - 1 - i, r: 1, t: sb[i], k: 'g' });
    if (a.d) commas.push({ c: a.d, r: 0 });
    if (b.d) commas.push({ c: b.d, r: 1 });
    const bd = sb.replace(/^0+(?=\d)/, '').split('').reverse().map(Number);
    const parts = [];
    bd.forEach((dg, i) => { if (dg) parts.push({ v: a.v * BigInt(dg), sh: i, dg }); });
    const prod = a.v * b.v, D = a.d + b.d;
    let r = 2;
    lines.push({ r: 1, c0: Math.max(sa.length, sb.length), c1: -1 });
    const signs = [{ c: Math.max(sa.length, sb.length), r: 0.5, t: '×' }];
    const carries = [];
    if (parts.length <= 1) {
      // nhân với số có một chữ số (hoặc chỉ một chữ số khác 0): ghi thẳng kết quả
      if (bd.length === 1) {
        let carry = 0;
        const da = sa.split('').reverse().map(Number);
        da.forEach((x, c) => { const p = x * bd[0] + carry; carry = Math.floor(p / 10); if (carry && c + 1 < da.length) carries.push({ c: c + 1, r: -0.62, t: String(carry), k: 'n', s: c + 1 }); });
      }
    } else {
      parts.forEach((p, pi) => { const s = p.v.toString(); for (let i = 0; i < s.length; i++) items.push({ c: s.length - 1 - i + p.sh, r, t: s[i], k: 'm', s: pi + 1 }); r++; });
      const wP = Math.max(...items.filter((it) => it.k === 'm').map((it) => it.c)) + 1;
      signs.push({ c: wP, r: 2 + (parts.length - 1) / 2, t: '+' });
      lines.push({ r: r - 1, c0: wP, c1: -1 });
    }
    const f = fromScaled(prod, D), s = (f.int + f.frac).replace(/^0+(?=\d)/, '');
    const full = s.length < D + 1 ? s.padStart(D + 1, '0') : s;
    for (let i = 0; i < full.length; i++) items.push({ c: full.length - 1 - i, r, t: full[i], k: 'k', s: parts.length > 1 ? parts.length + 1 : full.length - i });
    if (D) commas.push({ c: D, r });
    const width = Math.max(...items.map((it) => it.c), ...signs.map((x) => x.c - 1)) + 1;
    return { items: items.concat(carries), commas, signs, lines, rows: r + 1, width: width + 1 };
  }

  // Chia kiểu Việt Nam: số bị chia bên trái, số chia bên phải, thương dưới số chia; các bước trừ ghi dưới số bị chia
  function layoutDiv(nums, o) {
    let [a, b] = nums;
    if (b.v === 0n) throw new Error('Không chia được cho 0');
    let note = '';
    if (b.d) {
      // chuyển dấu phẩy: nhân cả số bị chia và số chia với 10^k (như SGK lớp 5)
      const k = b.d;
      const av = a.v * P10(k);
      const na = fromScaled(av, a.d);
      a = readNum(na.int + (na.frac.replace(/0+$/, '') ? ',' + na.frac.replace(/0+$/, '') : ''));
      b = readNum(b.v.toString());
      note = 'Đã chuyển dấu phẩy: ' + (a.int + (a.frac ? ',' + a.frac : '')) + ' : ' + b.int;
    }
    const d = b.v;
    const digs = (a.int + a.frac).split('').map(Number);
    const ci = a.int.length; // số chữ số phần nguyên
    const maxDec = Math.max(a.d, Math.max(0, Math.round(+o.thapphan || 0)));
    const full = o.kieuchia !== 'gon';
    // chọn phần đầu của số bị chia đủ để chia (phần nguyên nhỏ hơn số chia thì thương bắt đầu bằng 0)
    let k = 1, cur = BigInt(digs[0]);
    while (cur < d && k < ci) { cur = cur * 10n + BigInt(digs[k]); k++; }
    const q = [], steps = [];
    let qComma = -1, pos = k - 1;
    const n = digs.length;
    for (;;) {
      const qd = cur / d, p = qd * d, r = cur - p;
      q.push(Number(qd));
      steps.push({ cur, pos, p, r });
      const next = pos + 1;
      if (next < n) { if (next === ci && qComma < 0) qComma = q.length; cur = r * 10n + BigInt(digs[next]); pos = next; continue; }
      if (r === 0n || next - ci >= maxDec) break;
      if (qComma < 0) qComma = q.length;
      cur = r * 10n; pos = next; // thêm chữ số 0 vào bên phải số dư rồi chia tiếp
    }
    // các hàng bên trái
    const items = [], commas = [], lines = [];
    digs.forEach((x, i) => items.push({ L: i, r: 0, t: String(x), k: 'g' }));
    if (a.frac) commas.push({ L: ci - 1, r: 0 });
    let r = 1;
    const signs = [];
    steps.forEach((st, i) => {
      const ps = st.p.toString(), cs = st.cur.toString();
      if (full && !(i === 0 && st.p === 0n)) {
        for (let j = 0; j < ps.length; j++) items.push({ L: st.pos - (ps.length - 1 - j), r, t: ps[j], k: 'm', s: i + 1 });
        // sách Kết nối tri thức không ghi dấu trừ ở mỗi bước, chỉ kẻ vạch dưới tích
        if (o.dautru) signs.push({ L: st.pos - Math.max(ps.length, cs.length), r: r - 0.5, t: '−' });
        lines.push({ r: r, L0: st.pos - Math.max(ps.length, cs.length) + 1, L1: st.pos + 1, s: i + 1 });
        r++;
      }
      // số dư, kèm chữ số hạ xuống ở bước sau ("04": dư 0, hạ 4)
      const nx = steps[i + 1];
      const wr = nx ? (st.r === 0n ? '0' + nx.cur.toString() : nx.cur.toString()) : st.r.toString();
      const rp = nx ? nx.pos : st.pos;
      for (let j = 0; j < wr.length; j++) items.push({ L: rp - (wr.length - 1 - j), r, t: wr[j], k: 'm', s: i + 1 });
      r++;
    });
    // bên phải: số chia, thương
    const qs = q.map(String);
    const right = [];
    const bs = b.int;
    for (let j = 0; j < bs.length; j++) right.push({ R: j, r: 0, t: bs[j], k: 'g' });
    qs.forEach((x, j) => right.push({ R: j + (qComma >= 0 && j >= qComma ? 0.35 : 0), r: 1, t: x, k: 'k', s: j + 1 }));
    if (qComma >= 0) right.push({ R: qComma - 0.5 + 0.12, r: 1, t: ',', k: 'k', comma: true, s: qComma + 1 });
    const leftW = Math.max(...items.map((it) => it.L)) + 1;
    return { div: true, items, right, commas, signs, lines, rows: Math.max(r, 2), leftW: Math.max(leftW, digs.length), digsW: digs.length, rightW: Math.max(bs.length, qs.length + (qComma >= 0 ? 0.4 : 0)), note };
  }

  // chữ số bị giấu theo chế độ "điền chữ số còn thiếu"
  function pickHidden(list, n, seed) {
    let s = (seed | 0) * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const idx = list.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return new Set(idx.slice(0, Math.max(0, Math.min(n, idx.length))));
  }

  function renderDatTinh(o) {
    const size = +o.size || 24, cw = size * 0.62, rh = size * 1.32, pad = Math.round(size * 0.3);
    const col = o.color || '#111111', red = o.acolor || RED;
    const P = parseOp(o.expr);
    const svg = [], errors = [];
    let L;
    if (P.op === '+' || P.op === '-') L = layoutAddSub(P.op, P.nums);
    else if (P.op === '×') L = layoutMul(P.nums);
    else L = layoutDiv(P.nums, o);
    const stepMode = typeof o._buoc === 'number';
    const mode = stepMode ? 'none' : o.an || 'none';
    // phần bị giấu
    const all = L.div ? L.items.concat(L.right) : L.items;
    const isRes = (it) => it.k === 'k' || it.k === 'm';
    let hid = new Set();
    if (mode === 'kq' || mode === 'otrong') all.forEach((it, i) => { if (isRes(it) && !it.comma) hid.add(i); });
    else if (mode === 'ngaunhien') {
      const cand = all.map((it, i) => (it.k !== 'n' && it.k !== 's' && !it.comma && /\d/.test(it.t) ? i : -1)).filter((i) => i >= 0);
      const pick = pickHidden(cand, Math.round(+o.nan || 3), +o.seed || 1);
      cand.forEach((ci, j) => { if (pick.has(j)) hid.add(ci); });
    }
    const boxes = mode === 'otrong' || mode === 'ngaunhien';
    // trong chế độ "giấu kết quả": bỏ cả các hàng trung gian của phép chia (học sinh tự làm)
    const blankRows = mode === 'kq' && L.div;
    // phông như sách (chữ số không chân) hoặc Times New Roman
    const FAM = o.phong === 'times' ? 'Times New Roman, serif' : 'Arial, Helvetica, sans-serif';
    const font = `font-family="${FAM}" font-size="${size}"`;
    const T = (x, y, t, c, extra) => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" fill="${c}" ${font}${extra || ''}>${escH(t)}</text>`;
    const SG = (x, yb, t) => {
      const y = yb - size * 0.32, a = size * 0.22, st = `stroke="${col}" stroke-width="${r1(Math.max(1, size * 0.055))}" stroke-linecap="round"`;
      if (t === '+') return `<path d="M${r1(x - a)},${r1(y)}H${r1(x + a)}M${r1(x)},${r1(y - a)}V${r1(y + a)}" ${st}/>`;
      if (t === '×') { const b = a * 0.75; return `<path d="M${r1(x - b)},${r1(y - b)}L${r1(x + b)},${r1(y + b)}M${r1(x - b)},${r1(y + b)}L${r1(x + b)},${r1(y - b)}" ${st}/>`; }
      return `<path d="M${r1(x - a)},${r1(y)}H${r1(x + a)}" ${st}/>`;
    };
    const base = (r) => pad + size * 0.92 + r * rh;
    const box = (x, y) => `<rect x="${r1(x - cw * 0.46)}" y="${r1(y - size * 0.82)}" width="${r1(cw * 0.92)}" height="${r1(size * 1.02)}" fill="#fff" stroke="${col}" stroke-width="1"/>`;
    const drawDigit = (it, i, x) => {
      if (stepMode && it.s > o._buoc) return;
      const y = base(it.r);
      if (it.k === 'n') { if (o.nho) svg.push(`<text x="${r1(x + (it.dx || 0.3) * cw)}" y="${r1(base(0) + it.r * rh + size * 0.1)}" text-anchor="middle" fill="${red}" font-family="${FAM}" font-size="${r1(size * 0.5)}">${escH(it.t)}</text>`); return; }
      if (it.comma) { svg.push(T(x, y, ',', hid.has(i) && !o.dapan ? 'transparent' : col)); return; }
      if (hid.has(i)) {
        if (boxes) svg.push(box(x, y));
        if (o.dapan) svg.push(T(x, y, it.t, red));
        return;
      }
      svg.push(T(x, y, it.t, col));
    };
    let W, H;
    if (!L.div) {
      const width = L.width;
      const X = (c) => pad + (width - 1 - c) * cw + cw / 2;
      L.items.forEach((it, i) => drawDigit(it, i, X(it.c)));
      L.commas.forEach((cm) => {
        const hide = L.items.some((it, i) => it.r === cm.r && hid.has(i) && it.k === 'k') && !o.dapan && mode !== 'ngaunhien';
        if (!hide) svg.push(T(X(cm.c) + cw * 0.5, base(cm.r) + size * 0.02, ',', col));
      });
      // để trống kết quả: chỉ giữ dấu và vạch kẻ đầu tiên (học sinh tự viết các tích riêng)
      const firstOnly = mode === "kq";
      L.signs.forEach((s, i) => { if (!firstOnly || i === 0) svg.push(SG(X(s.c), base(s.r), s.t)); });
      L.lines.forEach((ln, i) => { if (firstOnly && i > 0) return; const y = r1(base(ln.r) + size * 0.3); svg.push(`<line x1="${r1(X(ln.c0) - cw * 0.3)}" y1="${y}" x2="${r1(X(ln.c1) - cw * 0.45)}" y2="${y}" stroke="${col}" stroke-width="1.2"/>`); });
      W = pad * 2 + width * cw; H = base(L.rows - 1) + size * 0.35 + pad;
    } else {
      const XL = (c) => pad + c * cw + cw / 2;
      const barX = pad + L.digsW * cw + cw * 0.45;
      const XR = (c) => barX + cw * 0.55 + c * cw + cw / 2;
      L.items.forEach((it, i) => { if (blankRows && it.r > 0) return; drawDigit(it, i, XL(it.L)); });
      L.commas.forEach((cm) => svg.push(T(XL(cm.L) + cw * 0.5, base(cm.r) + size * 0.02, ',', col)));
      if (!blankRows) L.signs.forEach((s) => svg.push(SG(XL(s.L) + cw * 0.2, base(s.r), s.t)));
      if (!blankRows) L.lines.forEach((ln) => {
        if (stepMode && ln.s > o._buoc) return; const y = r1(base(ln.r) + size * 0.3); svg.push(`<line x1="${r1(XL(ln.L0) - cw * 0.5)}" y1="${y}" x2="${r1(XL(ln.L1) - cw * 0.5)}" y2="${y}" stroke="${col}" stroke-width="1"/>`); });
      L.right.forEach((it, j) => {
        const i = L.items.length + j;
        if (it.comma) { if (!(hid.size && mode !== 'ngaunhien' && !o.dapan)) svg.push(T(XR(it.R) , base(1) + size * 0.02, ',', hid.has(i - 0) && !o.dapan && mode !== 'ngaunhien' ? 'transparent' : col)); return; }
        drawDigit(it, i, XR(it.R));
      });
      const top = r1(base(0) - size * 0.85), mid = r1(base(0) + size * 0.3);
      const rw = Math.max(L.rightW, 1.6) * cw + cw * 0.7;
      svg.push(`<line x1="${r1(barX)}" y1="${top}" x2="${r1(barX)}" y2="${r1(base(1) + size * 0.32)}" stroke="${col}" stroke-width="1.2"/>`);
      svg.push(`<line x1="${r1(barX)}" y1="${mid}" x2="${r1(barX + rw)}" y2="${mid}" stroke="${col}" stroke-width="1.2"/>`);
      W = Math.max(barX + rw + pad, XL(L.leftW - 1) + cw / 2 + pad);
      H = base((blankRows ? 2 : L.rows) - 1) + size * 0.35 + pad + (blankRows ? rh * Math.max(0, L.rows - 2) : 0);
    }
    const buoc = Math.max(0, ...all.map((it) => it.s || 0));
    return { svg: svg.join(''), labels: [], errors, w: Math.ceil(W), h: Math.ceil(H), buoc, note: L.note || '' };
  }

  // ---------- Tính giá trị biểu thức tiểu học (để tự điền đáp án) ----------
  function evalExpr(src) {
    let s = String(src).replace(/ |\s+(?=\d{3}\b)/g, '').replace(/(\d)\.(?=\d{3}\b)/g, '$1').replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[×xX*·]/g, '*').replace(/[:÷]/g, '/').replace(/[−–]/g, '-').replace(/\s+/g, '');
    if (!s || /[^0-9.+\-*/()]/.test(s)) return NaN;
    try { const v = Function('"use strict";return (' + s + ')')(); return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; }
  }
  const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  // giải "5 + [] = 12": thử nghiệm đúng là số nguyên trước, rồi giải tuyến tính
  function solveBlank(line) {
    const parts = line.split('=');
    if (parts.length !== 2) return null;
    const f = (t) => evalExpr(parts[0].replace(/\[\s*\]/g, '(' + t + ')')) - evalExpr(parts[1].replace(/\[\s*\]/g, '(' + t + ')'));
    const f0 = f(0), f1 = f(1);
    if (isFinite(f0) && isFinite(f1) && f1 !== f0) { const t = -f0 / (f1 - f0); if (isFinite(t) && Math.abs(f(t)) < 1e-7) return Math.round(t * 1e6) / 1e6; }
    for (let t = 1; t <= 10000; t++) if (Math.abs(f(t)) < 1e-9) return t;
    return null;
  }

  // ---------- Dòng chữ của bài tập -> HTML: số, dấu × :, phân số a/b, ô trống [7], chỗ chấm {7}, hình tròn (?) ----------
  function inline(src, o, ctx) {
    const show = !!o.dapan, red = o.acolor || RED;
    const ans = (t) => (show && t !== '' ? `<span class="th-ans" style="color:${red}">${escH(t)}</span>` : '');
    let out = '', i = 0;
    const s = String(src);
    while (i < s.length) {
      const c = s[i];
      if (c === '[') {
        const j = s.indexOf(']', i); if (j < 0) { out += escH(s.slice(i)); break; }
        let t = s.slice(i + 1, j).trim();
        if (t === '' && ctx && ctx.auto !== undefined && ctx.auto !== null) t = ctx.auto;
        const wd = Math.max(String(t).length, 2);
        out += `<span class="th-box${o.dauhoi ? ' th-hoi' : ''}" style="min-width:${(wd * 0.62 + 0.5).toFixed(2)}em">${ans(t) || (o.dauhoi ? '?' : '')}</span>`;
        i = j + 1; continue;
      }
      if (c === '{') {
        const j = s.indexOf('}', i); if (j < 0) { out += escH(s.slice(i)); break; }
        const t = s.slice(i + 1, j).trim();
        out += `<span class="th-dots">${ans(t) || '&#160;'}</span>`;
        i = j + 1; continue;
      }
      if (c === '(' && s[i + 1] === '?' && s[i + 2] === ')') { out += `<span class="th-cir">${ctx && ctx.sign ? ans(ctx.sign) : ''}</span>`; i += 3; continue; }
      const fm = s.slice(i).match(/^(\d+)\s*\/\s*(\d+)/);
      if (fm && !/\d/.test(s[i - 1] || '')) { out += `<span class="th-fr"><span>${fm[1]}</span><span>${fm[2]}</span></span>`; i += fm[0].length; continue; }
      if (c === '*' || ((c === 'x' || c === 'X') && /[\d\s)\]]/.test(s[i - 1] || '') && /[\s\d([]/.test(s[i + 1] || ''))) { out += '<span class="th-op">×</span>'; i++; continue; }
      if (c === ':' && /[\d\s)\]]/.test(s[i - 1] || '') && /[\s\d([]/.test(s[i + 1] || '')) { out += '<span class="th-op">:</span>'; i++; continue; }
      if (c === '-' && /[\d\s)\]]/.test(s[i - 1] || '') && /[\s\d([]/.test(s[i + 1] || '')) { out += '<span class="th-op">−</span>'; i++; continue; }
      if ((c === '+' || c === '=' || c === '<' || c === '>') && s[i - 1] !== '-') { out += `<span class="th-op">${escH(c)}</span>`; i++; continue; }
      if (c === '-' && s[i + 1] === '>') { out += '<span class="th-op">→</span>'; i += 2; continue; }
      out += escH(c); i++;
    }
    return out;
  }

  const lines = (t) => String(t || '').split('\n').map((x) => x.replace(/\s+$/, '')).filter((x) => x.trim());
  function grid(items, cols, cls) {
    return `<div class="th-grid ${cls || ''}" style="grid-template-columns:repeat(${Math.max(1, cols | 0)},minmax(0,1fr))">${items.map((x) => `<div class="th-it">${x}</div>`).join('')}</div>`;
  }
  const SIGN = (a, b) => (near(a, b) ? '=' : a < b ? '<' : '>');

  function renderBaiTap(o) {
    const errors = [];
    const kind = o.kind || 'otrong';
    const cols = +o.cols || 1;
    const red = o.acolor || RED;
    let body = '';
    const L = lines(o.text);
    if (kind === 'otrong') {
      body = grid(L.map((ln) => {
        const blanks = (ln.match(/\[\s*\]/g) || []).length;
        let auto = null;
        if (blanks === 1) { const v = solveBlank(ln.replace(/^[a-zđ]\)\s*/i, '')); if (v !== null) auto = fmtNum(v); }
        return inline(ln, o, { auto });
      }), cols);
    } else if (kind === 'sosanh') {
      body = grid(L.map((ln, li) => {
        const m = ln.replace(/^[a-zđ]\)\s*/i, '').split('(?)');
        let sign = '';
        if (m.length === 2) { const a = evalExpr(m[0]), b = evalExpr(m[1]); if (isFinite(a) && isFinite(b)) sign = SIGN(a, b); else errors.push('Dòng ' + (li + 1) + ': không tính được để điền dấu'); }
        else errors.push('Dòng ' + (li + 1) + ': đặt (?) vào chỗ cần điền dấu, vd  345 (?) 354');
        return inline(ln, o, { sign });
      }), cols);
    } else if (kind === 'dungsai') {
      body = '<div class="th-ds">' + L.map((ln, li) => {
        let t = ln, a = '';
        const m = t.match(/\s*\[(Đ|S|đ|s|D|d)\]\s*$/);
        if (m) { a = /[đdĐD]/.test(m[1]) ? 'Đ' : 'S'; t = t.slice(0, m.index); }
        else {
          const e = t.replace(/^[a-zđ]\)\s*/i, '').match(/^(.*?)(<=|>=|=|<|>)(.*)$/);
          if (e) { const x = evalExpr(e[1]), y = evalExpr(e[3]); if (isFinite(x) && isFinite(y)) { const ok = { '=': near(x, y), '<': x < y && !near(x, y), '>': x > y && !near(x, y), '<=': x <= y || near(x, y), '>=': x >= y || near(x, y) }[e[2]]; a = ok ? 'Đ' : 'S'; } }
          if (!a) errors.push('Dòng ' + (li + 1) + ': thêm [Đ] hoặc [S] ở cuối để ghi đáp án');
        }
        return `<div class="th-it">${inline(t, o)}</div><div class="th-box th-dsbox">${o.dapan && a ? `<span class="th-ans" style="color:${red}">${a}</span>` : ''}</div>`;
      }).join('') + '</div>';
    } else if (kind === 'khoanh') {
      // các câu cách nhau bằng một dòng trống; dòng đầu là câu hỏi, các dòng sau là phương án, dấu * trước phương án đúng
      const blocks = String(o.text || '').split(/\n\s*\n/).map(lines).filter((b) => b.length);
      body = blocks.map((b, bi) => {
        const q = b[0], opts = b.slice(1);
        if (!opts.length) errors.push('Câu ' + (bi + 1) + ': thêm các phương án ở các dòng sau câu hỏi');
        if (opts.length && !opts.some((x) => /^\s*\*/.test(x))) errors.push('Câu ' + (bi + 1) + ': đánh dấu * trước phương án đúng');
        const items = opts.map((x, k) => {
          const ok = /^\s*\*/.test(x), t = x.replace(/^\s*\*\s*/, '').replace(/^[A-D]\.\s*/, '');
          const letter = 'ABCDEF'[k];
          return `<span class="th-letter${ok && o.dapan ? ' on' : ''}" style="${ok && o.dapan ? 'border-color:' + red : ''}">${letter}.</span> ${inline(t, o)}`;
        });
        return `<div class="th-q">${inline(q, o)}</div>` + grid(items, cols > 1 ? cols : Math.min(4, opts.length), 'th-opts');
      }).join('');
    } else if (kind === 'noi') {
      const pairs = L.map((ln) => ln.split('|').map((x) => x.trim())).filter((p) => p.length >= 2);
      if (!pairs.length) errors.push('Mỗi dòng một cặp đúng:  vế trái | vế phải');
      // xáo vế phải (cố định theo "số xáo" để in lại vẫn như cũ)
      const n = pairs.length;
      let perm = pairs.map((_, i) => i);
      let s = (+o.seed || 1) * 7919;
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for (let tries = 0; tries < 20; tries++) {
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
        if (n < 2 || perm.some((p, i) => p !== i)) break;
      }
      const rowH = 2.4; // em
      const gap = 6; // em, khoảng nối
      const lines2 = o.dapan ? pairs.map((_, i) => { const j = perm.indexOf(i); return `<line x1="0" y1="${(i + 0.5) * rowH}" x2="${gap}" y2="${(j + 0.5) * rowH}" stroke="${red}" stroke-width="0.07"/>`; }).join('') : '';
      body = `<div class="th-noi" style="grid-template-columns:max-content ${gap}em max-content;grid-template-rows:repeat(${n},${rowH}em)">` +
        pairs.map((p, i) => `<div class="th-nl" style="grid-row:${i + 1}">${inline(p[0], o)}<i class="th-dot"></i></div><div class="th-nr" style="grid-row:${i + 1}"><i class="th-dot"></i>${inline(pairs[perm[i]][1], o)}</div>`).join('') +
        `<svg class="th-noisvg" style="grid-row:1 / span ${n};width:${gap}em;height:${n * rowH}em" viewBox="0 0 ${gap} ${n * rowH}" preserveAspectRatio="none">${lines2}</svg></div>`;
    } else if (kind === 'maytinh') {
      body = L.map((ln, li) => {
        const parts = ln.split(/\s*(?:->|→)\s*/);
        let v = NaN, html = '';
        parts.forEach((p, k) => {
          const isOp = k % 2 === 1;
          if (isOp) {
            const opv = p.replace(/^[×x*]/, '×').replace(/^[:÷]/, ':').replace(/^-/, '−');
            const m = p.match(/^\s*([+\-−×x*:÷])\s*(.+)$/);
            if (m && isFinite(v)) { const b = evalExpr(m[2]); const op = m[1]; v = /[+]/.test(op) ? v + b : /[-−]/.test(op) ? v - b : /[×x*]/.test(op) ? v * b : v / b; } else v = NaN;
            html += `<span class="th-arrow"><span class="th-arrlb">${inline(opv, o)}</span><svg viewBox="0 0 40 10" preserveAspectRatio="none"><line x1="0" y1="5" x2="36" y2="5" stroke="currentColor" stroke-width="1.3"/><path d="M40,5L32,1.5L34,5L32,8.5Z" fill="currentColor"/></svg></span>`;
          } else {
            const m = p.match(/^\[(.*)\]$/);
            if (m) {
              const t = m[1].trim() !== '' ? m[1].trim() : (isFinite(v) ? fmtNum(v) : '');
              if (m[1].trim() !== '') v = evalExpr(m[1]);
              html += `<span class="th-mbox${o.dauhoi ? ' th-hoi' : ''}">${o.dapan && t ? `<span class="th-ans" style="color:${red}">${escH(t)}</span>` : o.dauhoi ? '?' : '&#160;'}</span>`;
            } else { v = evalExpr(p); html += `<span class="th-mbox${k === 0 ? ' th-first' : ''}">${inline(p, o)}</span>`; }
            if (k === 0 && !isFinite(v)) errors.push('Dòng ' + (li + 1) + ': số đầu tiên chưa đúng');
          }
        });
        return `<div class="th-chain">${html}</div>`;
      }).join('');
    } else if (kind === 'bang') {
      const rows = L.map((ln) => ln.split('|').map((x) => x.trim()));
      body = `<table class="th-tab">${rows.map((r, ri) => `<tr>${r.map((c, ci) => {
        const m = c.match(/^\[(.*)\]$/);
        const head = (o.head && ri === 0) || (o.headcol && ci === 0);
        if (m) return `<td>${o.dapan && m[1].trim() ? `<span class="th-ans" style="color:${red}">${escH(m[1].trim())}</span>` : ''}</td>`;
        return `<td${head ? ' class="th-h"' : ''}>${inline(c, o)}</td>`;
      }).join('')}</tr>`).join('')}</table>`;
    } else if (kind === 'tieude') {
      body = `<div class="th-head"><div class="th-ht">${inline(L[0] || 'PHIẾU BÀI TẬP TOÁN', o)}</div>${L.slice(1).map((x) => `<div class="th-hs">${inline(x, o)}</div>`).join('')}</div>`;
    } else if (kind === 'oly') {
      // vở ô li: mỗi ô lớn gồm 4 dòng li; chữ / số mẫu ghi ở đầu dòng
      const n = Math.max(1, Math.min(30, Math.round(+o.nrow || 4)));
      const q = 1.6; // em: cạnh ô lớn
      const W = Math.max(4, Math.floor((+o.w || 600) / ((+o.size || 20) * q)));
      let g = '';
      for (let r = 0; r <= n; r++) g += `<line x1="0" y1="${r * q}" x2="${W * q}" y2="${r * q}" stroke="#7a9cc6" stroke-width="0.045"/>`;
      for (let r = 0; r < n; r++) for (let k = 1; k < 4; k++) g += `<line x1="0" y1="${r * q + k * q / 4}" x2="${W * q}" y2="${r * q + k * q / 4}" stroke="#b9cbe3" stroke-width="0.025"/>`;
      for (let c = 0; c <= W; c++) g += `<line x1="${c * q}" y1="0" x2="${c * q}" y2="${n * q}" stroke="#7a9cc6" stroke-width="0.04"/>`;
      const samples = lines(o.text);
      // mỗi chữ / số (cách nhau bằng dấu cách) viết vào một ô, cao hai dòng li như vở tập viết
      const txt = samples.slice(0, n).map((t, r) => t.trim().split(/\s+/).slice(0, W).map((w, c) => `<text x="${r1((c + 0.5) * q)}" y="${r1(r * q + q * 0.75)}" text-anchor="middle" font-size="${r1(q * 0.62)}" font-family="Times New Roman, serif" fill="${o.color || '#111'}">${escH(w)}</text>`).join('')).join('');
      body = `<svg class="th-oly" overflow="visible" viewBox="0 0 ${W * q} ${n * q}" style="width:${W * q}em;height:${n * q}em">${g}${txt}</svg>`;
    }
    const de = String(o.de || '').trim();
    // đề bài: kiểu sách (số thứ tự trong hình tròn tím; "Số", "Đ, S", ">, <, =" trong ô vàng) hoặc kiểu thường (chữ "Bài 1." đậm)
    let head = '';
    if (de) {
      const m = de.match(/^(?:(?:Bài|Câu)\s*)?(\d+)\s*[.:)]?\s*(.*)$/);
      if (m && o.kieude !== 'thuong') {
        const tag = m[2].match(/^(Số|Đ,\s*S|>\s*,\s*<\s*,\s*=)\s*\?\s*(.*)$/);
        const rest = tag ? '<span class="th-tag">' + escH(tag[1]) + '</span> ?' + (tag[2] ? ' ' + inline(tag[2], o) : '') : inline(m[2], o);
        head = `<div class="th-de sgk"><span class="th-num">${m[1]}</span><span>${rest}</span></div>`;
      } else head = `<div class="th-de">${inline(de, o).replace(/^(Bài\s*\d+\s*[.:]?|Câu\s*\d+\s*[.:]?)/, '<b>$1</b>')}</div>`;
    }
    return { html: `<div class="th-wrap${o.phong === 'times' ? ' times' : ''}" style="font-size:${+o.size || 20}px;color:${o.color || '#111'}">${head}${body}</div>`, errors };
  }

  // ---------- Mẫu ----------
  const DT_KINDS = {
    cong: ['Phép cộng có nhớ (lớp 2, 3)', { expr: '356 + 278' }],
    tru: ['Phép trừ có nhớ (lớp 2, 3)', { expr: '732 - 458' }],
    nhan1: ['Nhân với số có một chữ số (lớp 3)', { expr: '1 234 × 3' }],
    nhan2: ['Nhân với số có hai, ba chữ số (lớp 4)', { expr: '236 × 47' }],
    chia1: ['Chia cho số có một chữ số (lớp 3)', { expr: '648 : 3' }],
    chiadu: ['Phép chia có dư (lớp 3)', { expr: '237 : 5' }],
    chia2: ['Chia cho số có hai chữ số, viết gọn (lớp 4)', { expr: '4536 : 12', kieuchia: 'gon' }],
    congtp: ['Cộng, trừ số thập phân (lớp 5)', { expr: '45,08 + 24,9' }],
    nhantp: ['Nhân số thập phân (lớp 5)', { expr: '6,4 × 4,8' }],
    chiatp: ['Chia số thập phân, chia tiếp phần thập phân (lớp 5)', { expr: '27 : 4', thapphan: 2 }],
    chiatp2: ['Chia cho số thập phân (lớp 5)', { expr: '23,56 : 6,2' }],
  };
  const BT_KINDS = {
    tieude: ['Tiêu đề phiếu bài tập (họ tên, lớp)', { text: 'PHIẾU BÀI TẬP TOÁN – TUẦN …\nHọ và tên: {} Lớp: {}', size: 20 }],
    otrong: ['Số? (điền vào ô trống, chỗ chấm)', { de: 'Bài 1. Số?', text: 'a) 5 + [] = 12\nb) [] - 7 = 8\nc) 6 x [] = 42\nd) 36 : [] = 4\ne) 3 dm = {30} cm\ng) 1 giờ = {60} phút', cols: 2 }],
    sosanh: ['Điền dấu >, <, =', { de: 'Bài 2. >, <, = ?', text: '345 (?) 354\n27 + 8 (?) 35\n1 000 (?) 999\n4 x 6 (?) 30 - 5\n3/4 (?) 2/4\n12,5 (?) 12,50', cols: 3 }],
    dungsai: ['Đúng ghi Đ, sai ghi S', { de: 'Bài 3. Đúng ghi Đ, sai ghi S:', text: 'a) 45 + 37 = 82\nb) 63 - 28 = 45\nc) 7 x 8 = 56\nd) 48 : 6 = 9' }],
    khoanh: ['Khoanh vào chữ đặt trước câu trả lời đúng', { de: 'Bài 4. Khoanh vào chữ đặt trước câu trả lời đúng:', text: 'a) Số lớn nhất trong các số 789; 798; 879; 897 là:\n789\n798\n879\n*897\n\nb) Kết quả của phép tính 25 x 4 là:\n*100\n90\n29\n125', cols: 4 }],
    noi: ['Nối (mỗi phép tính với kết quả đúng)', { de: 'Bài 5. Nối mỗi phép tính với kết quả đúng:', text: '8 x 7 | 56\n63 : 9 | 7\n45 + 18 | 63\n90 - 36 | 54', seed: 3 }],
    maytinh: ['Số? (máy tính mũi tên)', { de: 'Bài 6. Số?', text: '12 -> +5 -> [] -> x2 -> []\n48 -> :6 -> [] -> -3 -> []' }],
    bang: ['Bảng số (viết số thích hợp vào ô trống)', { de: 'Bài 7. Viết số thích hợp vào ô trống:', text: 'Thừa số | 2 | 3 | 4 | 5\nThừa số | 6 | 6 | 6 | 6\nTích | [12] | [18] | [24] | [30]', headcol: true }],
    oly: ['Dòng kẻ ô li (vở lớp 1, 2)', { text: '1 2 3 4 5\n6 7 8 9 10', nrow: 4, size: 18 }],
  };

  // kết quả phép tính đọc từ bố cục (dùng cho kiểm thử)
  function ketQua(expr, o) {
    const P = parseOp(expr), L = P.op === ':' ? layoutDiv(P.nums, o || {}) : P.op === '×' ? layoutMul(P.nums) : layoutAddSub(P.op, P.nums);
    if (L.div) { const rows = L.items.filter((it) => it.r === Math.max(...L.items.map((x) => x.r))); return L.right.filter((it) => it.r === 1).sort((a, b) => a.R - b.R).map((it) => it.t).join('') + ' dư ' + rows.sort((a, b) => a.L - b.L).map((it) => it.t).join(''); }
    const last = L.rows - 1, its = L.items.filter((it) => it.r === last && it.k === 'k').sort((a, b) => b.c - a.c), cm = L.commas.find((c) => c.r === last);
    return its.map((it) => (cm && it.c === cm.c - 1 ? ',' : '') + it.t).join('');
  }
  root.TieuHoc = { renderDatTinh, renderBaiTap, DT_KINDS, BT_KINDS, parseOp, evalExpr, solveBlank, fmtNum, ketQua };
})(typeof window !== 'undefined' ? window : globalThis);
