// Đọc đề hình học không gian (tiếng Việt, cách viết của SGK) → kịch bản hình ToanViet (src/space.js), không cần AI.
// Nhận: hình chóp (thường, đều; đáy tam giác / vuông / chữ nhật / bình hành / thoi / thang), lăng trụ (đứng, xiên, đều),
// hình hộp, hình lập phương, tứ diện (thường, đều, ba cạnh đôi một vuông góc); vị trí đỉnh (SA ⊥ đáy, chóp đều, mặt bên
// vuông góc với đáy, hình chiếu của S); độ dài theo a; điểm phụ: trung điểm, giao điểm, tâm, trọng tâm, hình chiếu,
// "kẻ AH ⊥ SC", điểm chia đoạn theo tỉ số; nối các đoạn, mặt được nhắc tới. Câu không hiểu được liệt kê để giáo viên sửa.
(function (root) {
  'use strict';
  const PN = "[A-Z]'{0,2}"; // tên điểm: A, A', A''
  const re = (s, f) => new RegExp(s.replace(/PN/g, PN), f || '');
  const namesIn = (s) => String(s).match(re('PN', 'g')) || [];

  // chữ trong đề: bỏ $, đổi LaTeX sang kí hiệu thường
  function norm(t) {
    let s = String(t).replace(/\$+/g, ' ').replace(/\\(text|mathrm)\{([^{}]*)\}/g, '$2')
      .replace(/\^\{?\\prime\\prime\}?/g, "''").replace(/\^\{?\\prime\}?|′|’/g, "'")
      .replace(/\\perp/g, '⊥').replace(/\\(parallel|sslash)|⫽|∥/g, '∥').replace(/\\left|\\right/g, '')
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\sqrt\s*(\d+)/g, '√$1')
      .replace(/\\(widehat|angle)\s*\{?((?:[A-Z]'?){3})\}?/g, 'góc $2').replace(/\\(widehat|hat|angle)\s*\{?([A-Z]'?)\}?/g, 'góc $2')
      .replace(/∠\s*/g, 'góc ').replace(/△\s*/g, 'tam giác ').replace(/\\(overrightarrow|vec)\s*\{?((?:[A-Z]'?){2})\}?/g, 'vectơ $2').replace(/\^\{?\\circ\}?/g, '°').replace(/\\cdot|\\times/g, '*')
      .replace(/\\(Delta|triangle)\s*/g, 'tam giác ').replace(/\\[,;: ]/g, ' ').replace(/\\(in)(?![a-z])/g, '∈').replace(/[{}]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    // chữ đầu câu của một từ tiếng Việt (Cho, Gọi, Kẻ, Lấy…) viết thường để mẫu câu khớp; tên điểm (hai chữ hoa) giữ nguyên
    return s.replace(/(^|[.;:]\s+|\(\s*)([A-ZÀ-ỸĐ])(?=[a-zà-ỹđ])/g, (m0, p, c) => p + c.toLowerCase());
  }
  // độ dài theo a (a = 1): "a", "2a", "a√2", "(a√3)/2", "3a/2" → số; không phải biểu thức theo a thì null
  function lenVal(x) {
    let e = String(x).trim().replace(/\s+/g, '').replace(/[.,]$/, '');
    if (!/a/.test(e) && !/^[\d.()√/*+-]+$/.test(e)) return null;
    e = e.replace(/√\(([^()]*)\)/g, 'R($1)').replace(/√(\d+(?:\.\d+)?)/g, 'R($1)').replace(/(\d|\)|a)(?=a|R|\()/g, '$1*').replace(/a/g, '1');
    if (!/^[\d.()*/+\-R]*$/.test(e)) return null;
    e = e.replace(/R/g, 'Math.sqrt');
    try { const v = new Function('return ' + e)(); return isFinite(v) && v > 0 ? v : null; } catch (err) { return null; }
  }
  const fx = (v) => String(Math.round(v * 1000) / 1000);

  function space(text) {
    const t = norm(text);
    const notes = [], unknown = [];
    let m;
    // ---------- 1. Khối chính ----------
    let kind = '', apex = '', base = [], top = [], regular = false, upright = true, solidKind = '';
    if ((m = re('hình chóp\\s+(?:(tam giác|tứ giác)\\s+)?(đều\\s+)?(?:(tam giác|tứ giác)\\s+(đều)\\s+)?([A-Z])\\s*\\.\\s*([A-Z]{3,6})').exec(t))) {
      kind = 'chop'; regular = !!(m[2] || m[4]); apex = m[5]; base = m[6].split('');
    } else if ((m = re("(?:hình\\s+)?lăng trụ\\s+(đứng\\s+|đều\\s+)?(?:(tam giác|tứ giác)\\s+)?(đều\\s+)?((?:[A-Z]){3,4})\\s*\\.\\s*((?:[A-Z]'){3,4})").exec(t))) {
      kind = 'langtru'; base = m[4].split(''); top = namesIn(m[5]); regular = /đều/i.test((m[1] || '') + (m[3] || '')); upright = /đứng|đều/i.test((m[1] || '') + (m[3] || ''));
    } else if ((m = re("hình hộp\\s*(chữ nhật)?\\s+([A-Z]{4})\\s*\\.\\s*((?:[A-Z]'){4})").exec(t))) {
      kind = 'langtru'; solidKind = m[1] ? 'hopcn' : 'hop'; base = m[2].split(''); top = namesIn(m[3]); upright = !!m[1];
    } else if ((m = re("(?:hình\\s+)?lập phương\\s+([A-Z]{4})\\s*\\.\\s*((?:[A-Z]'){4})").exec(t))) {
      kind = 'langtru'; solidKind = 'lapphuong'; base = m[1].split(''); top = namesIn(m[2]); upright = true;
    } else if ((m = /tứ diện\s+(đều\s+)?([A-Z]{4})/i.exec(t))) {
      kind = 'tudien'; regular = !!m[1]; base = m[2].split('');
    } else return null;
    const lo = t.toLowerCase();

    // ---------- 2. Độ dài (theo a) ----------
    const L = {}; // "AB" -> giá trị
    const key = (p, q) => [p, q].sort().join('|');
    const setL = (p, q, v) => { L[key(p, q)] = v; };
    const getL = (p, q) => L[key(p, q)];
    t.split(/[;.](?!\d)|,(?![^(.;]*\))|\s+và\s+|\s+với\s+/).forEach((cl) => {
      const mm = re('^\\s*((?:\\s*(?:PN)(?:PN)\\s*=)+)\\s*([^=]+)$').exec(cl);
      if (!mm) return;
      const v = lenVal(mm[2]);
      if (v == null) return;
      (mm[1].match(re('(PN)(PN)\\s*=', 'g')) || []).forEach((pq) => { const nn = namesIn(pq); if (nn.length === 2) setL(nn[0], nn[1], v); });
    });
    let side = null, lateral = null, height = null;
    if ((m = /cạnh đáy\s*(?:bằng|là|=)?\s*([^,;.]+?)(?=[,;.]|\s+và\s|\s+cạnh|$)/i.exec(t))) side = lenVal(m[1]);
    if (side == null && (m = /(?:có\s+)?cạnh\s*(?:bằng|là|=)?\s*((?:\d+|\(?\d*\s*a)[^,;.]*?)(?=[,;.]|\s+và\s|\s+[A-Z]|$)/i.exec(t))) side = lenVal(m[1]);
    if ((m = /cạnh bên\s*(?:bằng|là|=)?\s*([^,;.]+?)(?=[,;.]|\s+và\s|$)/i.exec(t))) lateral = lenVal(m[1]);
    if ((m = /chiều cao\s*(?:của hình (?:chóp|lăng trụ))?\s*(?:bằng|là|=)\s*([^,;.]+?)(?=[,;.]|\s+và\s|$)/i.exec(t))) height = lenVal(m[1]);

    // ---------- 3. Đáy ----------
    // hình dạng đáy: chỉ xét câu nói về đáy (tên trùng các đỉnh đáy, hoặc "đáy là …"), không lẫn với mặt bên
    const baseSet = new Set(base);
    const isBaseName = (n) => n && n.length === base.length && n.split('').every((c) => baseSet.has(c)) && (!apex || !n.includes(apex));
    let shape = '', at = '';
    const triRe = /(?:tam giác\s+([A-Z]{3})|([A-Z]{3})\s+là\s+(?:một\s+)?tam giác|đáy\s+(?:là\s+)?(?:một\s+)?tam giác)\s*(vuông cân|vuông|cân|đều)?(?:\s+tại\s+([A-Z]))?/gi;
    const quadRe = /(?:đáy\s+(?:([A-Z]{4})\s+)?(?:là\s+)?(?:một\s+)?|([A-Z]{4})\s+là\s+(?:một\s+)?|(?:hình)\s+)(hình vuông|hình chữ nhật|hình bình hành|hình thoi|hình thang(?:\s+vuông)?(?:\s+cân)?)(?:\s+([A-Z]{4}))?((?:\s+vuông)?\s+tại\s+([A-Z])\s+và\s+([A-Z]))?/gi;
    if (base.length === 3 || kind === 'tudien') {
      while ((m = triRe.exec(t))) { const n = m[1] || m[2]; if ((n && isBaseName(n)) || (!n && /đáy/i.test(m[0]))) { shape = (m[3] || 'thường').toLowerCase(); at = m[4] || ''; break; } }
    } else if (base.length === 4) {
      while ((m = quadRe.exec(t))) { const n = m[1] || m[2] || m[4]; if (!n || isBaseName(n)) { shape = m[3].toLowerCase(); at = m[6] ? m[6] + m[7] : ''; break; } }
    }
    if (solidKind === 'lapphuong') shape = 'hình vuông';
    if (solidKind === 'hopcn' && !shape) shape = 'hình chữ nhật';
    if (regular && base.length === 3 && !shape) shape = 'đều';
    if (regular && base.length === 4 && !shape) shape = 'hình vuông';
    if (shape) notes.push('đáy: ' + shape + (at ? ' (' + at + ')' : ''));

    // toạ độ đáy (mặt phẳng z = 0, x sang phải, y ra sau) — đơn vị: a, sau đó đổi tỉ lệ cho hình vừa khung
    const [A, B, C, D] = base;
    const P = {};
    const s0 = side || getL(A, B) || getL(B, C) || 1;
    if (kind !== 'tudien' && base.length === 4) {
      const p = getL(A, B) || side || 1, q = getL(A, D) || getL(B, C) || (shape.includes('vuông') && !shape.includes('thang') ? p : p * 0.75);
      if (/hình vuông/.test(shape)) { P[A] = [0, 0]; P[B] = [p, 0]; P[C] = [p, p]; P[D] = [0, p]; }
      else if (/chữ nhật/.test(shape)) { P[A] = [0, 0]; P[B] = [p, 0]; P[C] = [p, q]; P[D] = [0, q]; }
      else if (/thoi/.test(shape)) { const c = Math.cos(70 * Math.PI / 180), s = Math.sin(70 * Math.PI / 180); P[A] = [0, 0]; P[B] = [p, 0]; P[C] = [p + p * c, p * s]; P[D] = [p * c, p * s]; }
      else if (/thang/.test(shape)) {
        const v = at;
        if (v === A + B || v === B + A) { const h2 = getL(A, B) || 0.8 * p, ad = getL(A, D) || 2 * (getL(B, C) || h2 * 0.75), bc = getL(B, C) || ad / 2; P[A] = [0, 0]; P[D] = [ad, 0]; P[B] = [0, h2]; P[C] = [bc, h2]; }
        else if (v === A + D || v === D + A) { const ab = getL(A, B) || p, ad = getL(A, D) || 0.75 * ab, dc = getL(C, D) || ab / 2; P[A] = [0, 0]; P[B] = [ab, 0]; P[D] = [0, ad]; P[C] = [dc, ad]; }
        else if (/AD\s*∥\s*BC|BC\s*∥\s*AD|đáy lớn AD|đáy lớn là AD/.test(t)) { const ad = getL(A, D) || 2 * p, bc = getL(B, C) || ad / 2, hh = 0.7 * ad; P[A] = [0, 0]; P[D] = [ad, 0]; P[B] = [(ad - bc) / 2, hh]; P[C] = [(ad + bc) / 2, hh]; }
        else { const ab = getL(A, B) || 1.4 * p, cd = getL(C, D) || ab / 2, hh = 0.55 * ab; P[A] = [0, 0]; P[B] = [ab, 0]; P[C] = [(ab + cd) / 2, hh]; P[D] = [(ab - cd) / 2, hh]; }
      } else { const sh = 0.45 * q; P[A] = [0, 0]; P[B] = [p, 0]; P[C] = [p + sh, q]; P[D] = [sh, q]; } // hình bình hành / tứ giác
    } else if (kind !== 'tudien' && base.length === 3) {
      // tam giác: đỉnh đặc biệt (vuông / cân tại X) ở gốc, hai đỉnh còn lại theo hai phương
      const X = at || A, others = base.filter((c) => c !== X), Y = others[0], Z = others[1];
      const xy = getL(X, Y) || s0, xz = getL(X, Z) || (/cân/.test(shape) ? xy : s0 * 1.2);
      if (/đều/.test(shape)) { const a = getL(A, B) || side || 1; P[A] = [0, 0]; P[C] = [a, 0]; P[B] = [a / 2, -a * Math.sqrt(3) / 2]; }
      else if (/vuông/.test(shape)) { P[X] = [0, 0]; P[Z] = [xz, 0]; P[Y] = [0, -xy]; }
      else if (/cân/.test(shape)) { const yz = getL(Y, Z) || xy; const hh = Math.sqrt(Math.max(xy * xy - yz * yz / 4, 0.2)); P[Y] = [0, 0]; P[Z] = [yz, 0]; P[X] = [yz / 2, -hh]; }
      else { const ab = getL(A, B) || s0, ac = getL(A, C) || 1.25 * ab; P[A] = [0, 0]; P[C] = [ac, 0]; P[B] = [ab * Math.cos(55 * Math.PI / 180), -ab * Math.sin(55 * Math.PI / 180)]; }
    }
    // tỉ lệ: cạnh đáy lớn nhất ≈ 4,4 đơn vị vẽ
    const span = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 0.1); };
    const K = Object.keys(P).length ? 4.4 / span(Object.values(P)) : 4.4;
    const p3 = {}; // tên điểm -> [x, y, z] (đơn vị vẽ)
    Object.keys(P).forEach((n) => { p3[n] = [P[n][0] * K, P[n][1] * K, 0]; });
    const center = (ns) => ns.reduce((s, n) => [s[0] + p3[n][0] / ns.length, s[1] + p3[n][1] / ns.length, 0], [0, 0, 0]);

    // ---------- 4. Đỉnh, đáy trên ----------
    const lines = [], made = new Set(base), extra = [], marks = [];
    const nm = (n) => n.replace(/^([A-Z])''$/, '$12').replace(/^([A-Z])'$/, '$11'); // A' → A1 (nhãn đổi lại ở cuối)
    if (kind === 'chop') {
      let foot = null, fname = '';
      const h0 = (v) => (v == null ? null : v * K);
      // SA ⊥ (đáy)
      const perp = re('([A-Z])([A-Z])\\s*(?:⊥|vuông góc với)\\s*(?:mặt phẳng\\s*)?(?:\\(\\s*([A-Z]{3,4})\\s*\\)|mặt đáy|đáy)').exec(t);
      // hình chiếu (vuông góc) của S trên (đáy) là …
      const proj = re('hình chiếu\\s+(?:vuông góc\\s+)?(?:của\\s+)?' + apex + '\\s+(?:trên|lên|xuống)\\s+(?:mặt phẳng\\s*)?(?:\\(\\s*[A-Z]{3,4}\\s*\\)|mặt đáy|đáy)\\s+(?:là\\s+)?(?:điểm\\s+)?(trung điểm|trọng tâm|giao điểm|tâm)?\\s*([A-Z])?\\s*(?:của\\s+)?(?:đoạn\\s+|cạnh\\s+|tam giác\\s+)?([A-Z]{2,4})?(?:\\s+(?:và|với)\\s+([A-Z]{2}))?').exec(t);
      // mặt bên SAB … vuông góc với đáy
      const side3 = re('(?:mặt bên|tam giác)\\s*\\(?\\s*(' + apex + '[A-Z]{2}|[A-Z]' + apex + '[A-Z]|[A-Z]{2}' + apex + ')\\s*\\)?[^.;]*?(đều|vuông cân|cân|vuông)?[^.;]*?(?:nằm trong mặt phẳng vuông góc với|vuông góc với)\\s*(?:mặt phẳng\\s*)?(?:đáy|\\(\\s*[A-Z]{3,4}\\s*\\))').exec(t);
      if (perp && perp[1] === apex && baseSet.has(perp[2])) { foot = p3[perp[2]]; notes.push(apex + perp[2] + ' ⊥ đáy'); }
      else if (proj && (proj[2] || proj[1])) {
        const nn = proj[3] ? proj[3].split('') : [];
        fname = proj[2] || (proj[1] && proj[1].includes('trọng') ? 'G' : 'H');
        if (/trung điểm/i.test(proj[1] || '') && nn.length === 2) foot = center(nn);
        else if (/trọng tâm/i.test(proj[1] || '') && nn.length === 3) foot = center(nn);
        else if (/giao điểm/i.test(proj[1] || '') && nn.length === 2 && proj[4]) extra.push(fname + ' = giao(' + nm(nn[0]) + ', ' + nm(nn[1]) + ', ' + nm(proj[4][0]) + ', ' + nm(proj[4][1]) + ')');
        else foot = center(base);
        notes.push('chân đường cao: ' + fname);
      } else if (side3) {
        const face = side3[1].split('').filter((c) => c !== apex);
        fname = /\bH\b/.test(t) ? 'H' : 'H';
        foot = center(face);
        const ty = (side3[2] || '').toLowerCase(), e = Math.hypot(p3[face[0]][0] - p3[face[1]][0], p3[face[0]][1] - p3[face[1]][1]);
        if (!height) height = (/đều/.test(ty) ? e * Math.sqrt(3) / 2 : /vuông/.test(ty) ? e / 2 : e) / K;
        notes.push('mặt bên ' + side3[1] + ' vuông góc với đáy');
      } else if (regular) { foot = center(base); fname = /\bO\b/.test(t) ? 'O' : 'O'; notes.push('chóp đều: đỉnh ở trên tâm đáy'); }
      else { const c = center(base); foot = [c[0] + 0.15 * K, c[1] + 0.1 * K, 0]; }
      // chiều cao
      let h = h0(height);
      if (h == null && perp && perp[1] === apex) h = h0(getL(apex, perp[2]));
      if (h == null && fname) h = h0(getL(apex, fname));
      if (h == null && lateral && foot) { const b0 = p3[base[0]], r = Math.hypot(b0[0] - foot[0], b0[1] - foot[1]); const l = lateral * K; if (l > r) h = Math.sqrt(l * l - r * r); }
      if (h == null) h = 4.2;
      h = Math.min(Math.max(h, 3), 6.5); // hình minh hoạ: chiều cao trong khoảng dễ nhìn (SGK cũng không vẽ đúng tỉ lệ)
      base.forEach((n) => lines.push(nm(n) + ' = (' + p3[n].map(fx).join(', ') + ')'));
      if (foot) {
        if (fname) { lines.push(fname + ' = (' + foot.map(fx).join(', ') + ')'); made.add(fname); }
        lines.push(apex + ' = (' + fx(foot[0]) + ', ' + fx(foot[1]) + ', ' + fx(h) + ')');
      }
      made.add(apex);
      lines.push('chop ' + apex + ' ' + base.join(''));
      if (perp && perp[1] === apex && baseSet.has(perp[2])) { const v = perp[2], i = base.indexOf(v), nb = [base[(i + 1) % base.length], base[(i + base.length - 1) % base.length]]; marks.push('vuong ' + nb.map((x) => apex + v + x).join(' ')); }
      if (fname && foot) { lines.push('doan ' + apex + fname); if (regular && base.length === 4) lines.push('doan ' + A + C + ' ' + B + D); }
    } else if (kind === 'langtru') {
      const h = (getL(base[0], top[0]) || lateral || height || (solidKind === 'lapphuong' ? (getL(A, B) || side || 1) : null)) ;
      const H = Math.min(Math.max(h ? h * K : 3.6, 2.6), 5); // chiều cao dễ nhìn so với đáy (cạnh lớn nhất ≈ 4,4)
      if (solidKind === 'hop' || solidKind === 'hopcn' || solidKind === 'lapphuong') { /* đáy đã có */ }
      const off = upright ? [0, 0, H] : [0.9, 0.55, H];
      base.forEach((n) => lines.push(nm(n) + ' = (' + p3[n].map(fx).join(', ') + ')'));
      top.forEach((n, i) => { const b = p3[base[i]]; p3[n] = [b[0] + off[0], b[1] + off[1], off[2]]; lines.push(nm(n) + ' = (' + p3[n].map(fx).join(', ') + ')'); made.add(n); });
      lines.push('langtru ' + base.join('') + ' ' + top.map(nm).join(''));
      notes.push((solidKind === 'lapphuong' ? 'hình lập phương' : solidKind ? 'hình hộp' : 'lăng trụ ' + (upright ? 'đứng' : 'xiên')));
    } else if (kind === 'tudien') {
      const [W, X, Y, Z] = base;
      const ortho = re('(' + '[A-Z]' + ')([A-Z])\\s*,\\s*\\1([A-Z])\\s*,\\s*\\1([A-Z])\\s*đôi một vuông góc').exec(t);
      if (ortho) {
        const o = ortho[1], [a1, a2, a3] = [ortho[2], ortho[3], ortho[4]];
        const la = (getL(o, a1) || 1), lb = (getL(o, a2) || 1), lc = (getL(o, a3) || 1), k = 3.8 / Math.max(la, lb, lc);
        p3[o] = [0, 0, 0]; p3[a1] = [0, -la * k * 0.9, 0]; p3[a2] = [lb * k, 0, 0]; p3[a3] = [0, 0, lc * k];
        notes.push('tứ diện có ' + o + a1 + ', ' + o + a2 + ', ' + o + a3 + ' đôi một vuông góc');
      } else if (regular) {
        const a = 4.2;
        p3[X] = [0, 0, 0]; p3[Y] = [a, 0, 0]; p3[Z] = [a / 2, a * Math.sqrt(3) / 2, 0]; p3[W] = [a / 2, a * Math.sqrt(3) / 6, a * Math.sqrt(2 / 3)];
        notes.push('tứ diện đều');
      } else { p3[X] = [0, 0, 0]; p3[Y] = [4.2, -0.6, 0]; p3[Z] = [3.4, 2.8, 0]; p3[W] = [1.8, 0.6, 3.8]; }
      base.forEach((n) => lines.push(nm(n) + ' = (' + p3[n].map(fx).join(', ') + ')'));
      lines.push('tudien ' + base.join(''));
    }

    // ---------- 5. Điểm phụ ----------
    const cons = []; // { name, need: [tên điểm], line, src }
    const add = (name, need, line, src) => { if (!cons.some((c) => c.name === name) && !made.has(name)) cons.push({ name, need, line, src }); };
    const pairOf = (s) => namesIn(s);
    let hidPl = 0;
    const planeLine = (ns) => { const id = 'Q' + (++hidPl); return { id, line: 'mp ' + id + ': ' + ns.map(nm).join(' ') + ' an', need: ns }; };
    const listNames = (s) => namesIn(String(s).replace(/\s+(?:và|,)\s+/g, ','));
    const listPairs = (s) => String(s).split(/\s*(?:,|và)\s*/).map((x) => x.replace(/^(?:cạnh|đoạn|các cạnh)\s+/, '').trim()).filter(Boolean);
    const sentences = t.split(/(?<=[.;])\s+|\.\s*$/).filter(Boolean);
    const used = new Set();
    sentences.forEach((snt, si) => {
      let hit = false, q;
      // trung điểm (M là trung điểm của AB; M, N lần lượt là trung điểm của SB, SD; trung điểm M của AB)
      const r1 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng)?\\s*là\\s+(?:các\\s+)?trung điểm\\s+(?:của\\s+)?(?:các\\s+)?(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)?((?:PN){2}(?:\\s*(?:,|và)\\s*(?:cạnh\\s+)?(?:PN){2})*)', 'g');
      while ((q = r1.exec(snt))) {
        const ns = listNames(q[1]), segs = listPairs(q[2]);
        ns.forEach((n, i) => { const sg = pairOf(segs[i] || ''); if (sg.length === 2) { add(n, sg, n + ' = trungdiem(' + nm(sg[0]) + ', ' + nm(sg[1]) + ')', 'trung điểm'); hit = true; } });
      }
      const r1b = re('trung điểm\\s+(PN)\\s+(?:của\\s+)?(?:cạnh\\s+|đoạn\\s+)?((?:PN){2})', 'g');
      while ((q = r1b.exec(snt))) { const sg = pairOf(q[2]); add(q[1], sg, q[1] + ' = trungdiem(' + nm(sg[0]) + ', ' + nm(sg[1]) + ')', 'trung điểm'); hit = true; }
      // giao điểm của AC và BD; giao điểm O của AC và BD; giao điểm của SC với (AMN)
      const r2 = re('(?:(PN)\\s+là\\s+giao điểm|giao điểm\\s+(PN))\\s+(?:của\\s+)?(?:hai\\s+)?(?:đường thẳng\\s+)?((?:PN){2})\\s+(?:và|với)\\s+(?:đường thẳng\\s+|mặt phẳng\\s+)?(\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2})', 'g');
      while ((q = r2.exec(snt))) {
        const n = q[1] || q[2], a = pairOf(q[3]), b = pairOf(q[4]);
        if (b.length === 2) add(n, a.concat(b), n + ' = giao(' + a.map(nm).join(', ') + ', ' + b.map(nm).join(', ') + ')', 'giao điểm');
        else { const pl = planeLine(b); add(n, a.concat(b), pl.line + '\n' + n + ' = giao(' + a.map(nm).join(', ') + ', ' + pl.id + ')', 'giao điểm với mặt phẳng'); }
        hit = true;
      }
      // tâm của đáy / hình vuông ABCD / tam giác đều ABC; trọng tâm G của tam giác ABC
      const r3 = re('(?:(PN)\\s+là\\s+(trọng tâm|tâm)|(trọng tâm|tâm)\\s+(PN))\\s+(?:của\\s+)?(?:mặt\\s+)?(?:đáy|hình vuông|hình chữ nhật|hình bình hành|hình thoi|tam giác(?:\\s+đều)?|tứ giác)?\\s*([A-Z]{3,4})?', 'g');
      while ((q = r3.exec(snt))) {
        const n = q[1] || q[4], ns = q[5] ? q[5].split('') : (q[0].includes('đáy') ? base : null);
        if (!n || !ns || ns.some((c) => !p3[c] && !base.includes(c))) continue;
        if (ns.length === 4) add(n, ns, n + ' = giao(' + nm(ns[0]) + ', ' + nm(ns[2]) + ', ' + nm(ns[1]) + ', ' + nm(ns[3]) + ')', 'tâm');
        else if (ns.length === 3) add(n, ns, n + ' = trongtam(' + ns.map(nm).join(', ') + ')', 'trọng tâm');
        hit = true;
      }
      // hình chiếu (vuông góc) của A trên SB / (SBC); M, N lần lượt là hình chiếu của A trên SB, SD
      const r4 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng)?\\s*là\\s+(?:các\\s+)?hình chiếu\\s+(?:vuông góc\\s+)?(?:của\\s+)?(?:điểm\\s+)?(PN)\\s+(?:trên|lên|xuống)\\s+((?:(?:đường thẳng|mặt phẳng)\\s+)?(?:\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2})(?:\\s*(?:,|và)\\s*(?:\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2}))*)', 'g');
      while ((q = r4.exec(snt))) {
        const ns = listNames(q[1]), src = q[2], tg = q[3].replace(/đường thẳng|mặt phẳng/g, '').split(/\s*(?:,|và)\s*/).map((x) => x.trim()).filter(Boolean);
        ns.forEach((n, i) => {
          const g = tg[i] || tg[0]; if (!g) return;
          const ps = pairOf(g);
          if (ps.length === 2) { add(n, [src].concat(ps), n + ' = chan(' + nm(src) + ', ' + ps.map(nm).join(', ') + ')', 'hình chiếu'); extra.push('doan ' + nm(src) + nm(n)); marks.push('vuong ' + src + n + ps[0]); }
          else { const pl = planeLine(ps); add(n, [src].concat(ps), pl.line + '\n' + n + ' = chan(' + nm(src) + ', ' + pl.id + ')', 'hình chiếu lên mặt phẳng'); extra.push('doan ' + nm(src) + nm(n)); }
          hit = true;
        });
      }
      // kẻ AH ⊥ SC (H ∈ SC) / kẻ AH vuông góc với (SBC)
      const r5 = re('kẻ\\s+(PN)(PN)\\s*(?:⊥|vuông góc với)\\s*(?:đường thẳng\\s+|mặt phẳng\\s+)?(\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2})', 'g');
      while ((q = r5.exec(snt))) {
        const src = q[1], n = q[2], ps = pairOf(q[3]);
        if (ps.length === 2) { add(n, [src].concat(ps), n + ' = chan(' + nm(src) + ', ' + ps.map(nm).join(', ') + ')', 'đường vuông góc'); marks.push('vuong ' + src + n + ps[0]); }
        else { const pl = planeLine(ps); add(n, [src].concat(ps), pl.line + '\n' + n + ' = chan(' + nm(src) + ', ' + pl.id + ')', 'đường vuông góc với mặt phẳng'); }
        extra.push('doan ' + nm(src) + nm(n));
        hit = true;
      }
      // điểm trên cạnh, chia theo tỉ số: M thuộc SC sao cho SM = 2MC / SM = (1)/(3)SC
      const r6 = re('(PN)\\s+(?:thuộc|nằm trên|trên)\\s+(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?|đường thẳng\\s+)?((?:PN){2})(?:\\s+sao cho\\s+([^,;.]+))?', 'g');
      while ((q = r6.exec(snt))) {
        const n = q[1], sg = pairOf(q[2]); if (sg.length !== 2 || made.has(n) || cons.some((c) => c.name === n)) continue;
        let k = 0.4, ok = !q[3];
        if (q[3]) {
          const c3 = q[3].replace(/\s+/g, '');
          let w;
          if ((w = re('^(PN)(PN)=([\\d.()/]+)(PN)(PN)$').exec(c3)) && w[2] === n && w[4] === n) { const r = lenVal(w[3]); if (r) { k = w[1] === sg[0] ? r / (r + 1) : 1 / (r + 1); ok = true; } }
          else if ((w = re('^(PN)(PN)=([\\d.()/]+)(PN)(PN)$').exec(c3)) && w[2] === n) { const r = lenVal(w[3]); if (r && r < 1) { k = w[1] === sg[0] ? r : 1 - r; ok = true; } }
        }
        add(n, sg, n + ' = chia(' + nm(sg[0]) + ', ' + nm(sg[1]) + ', ' + fx(k) + ')', 'điểm trên cạnh');
        if (!ok) notes.push('điểm ' + n + ' trên ' + sg.join('') + ': chưa rõ vị trí, đặt tạm');
        hit = true;
      }
      if (hit) used.add(si);
    });
    // dựng theo thứ tự phụ thuộc (điểm dùng điểm chưa có thì dựng sau)
    let guard = 0;
    while (cons.length && guard++ < 50) {
      const i = cons.findIndex((c) => c.need.every((n) => made.has(n)));
      if (i < 0) break;
      const c = cons.splice(i, 1)[0];
      lines.push(c.line); made.add(c.name);
    }
    cons.forEach((c) => unknown.push('không dựng được điểm ' + c.name + ' (' + c.src + '): thiếu điểm ' + c.need.filter((n) => !made.has(n)).join(', ')));
    // các đoạn, mặt được nhắc tới trong đề, lời giải: SC, MN, (AMN)…
    const segs = new Set(extra);
    const known = (n) => made.has(n);
    // cạnh của khối (đã vẽ): không vẽ lại
    const edges = new Set();
    const edge = (p, q) => edges.add([p, q].sort().join('|'));
    const cyc = (ns) => ns.forEach((n, i) => edge(n, ns[(i + 1) % ns.length]));
    if (kind === 'chop') { cyc(base); base.forEach((n) => edge(apex, n)); }
    if (kind === 'langtru') { cyc(base); cyc(top); base.forEach((n, i) => edge(n, top[i])); }
    if (kind === 'tudien') base.forEach((p, i) => base.slice(i + 1).forEach((q) => edge(p, q)));
    const isEdge = (p, q) => edges.has([p, q].sort().join('|'));
    (t.match(re('\\((?:PN){3,4}\\)', 'g')) || []).forEach((pl) => { const ns = namesIn(pl); if (ns.every(known) && !(ns.length === base.length && ns.every((n) => baseSet.has(n)))) segs.add('dagiac ' + ns.map(nm).join('')); });
    (t.match(re('(?<![A-Za-zÀ-ỹ.(])(?:PN){2}(?![A-Za-zÀ-ỹ(])', 'g')) || []).forEach((sg) => { const ns = namesIn(sg); if (ns.length === 2 && ns.every(known) && ns[0] !== ns[1] && !isEdge(ns[0], ns[1])) segs.add('doan ' + ns.map(nm).join('')); });
    segs.forEach((s) => lines.push(s));
    marks.forEach((s) => { const gs = s.slice(6).trim().split(/\s+/).map(namesIn).filter((g) => g.length === 3 && g.every(known)); if (gs.length) lines.push('vuong ' + gs.map((g) => g.map(nm).join('')).join(' ')); });
    const aux = [...made].filter((n) => !base.includes(n) && !top.includes(n) && n !== apex);
    if (aux.length) lines.push('diem ' + aux.map(nm).join(' '));
    [...made].filter((n) => /'/.test(n)).forEach((n) => lines.push('nhan ' + nm(n) + ' = ' + n));
    // câu có vẻ là dựng hình nhưng chưa hiểu
    sentences.forEach((snt, si) => {
      if (used.has(si)) return;
      if (/(chứng minh|tính|tìm|xác định|hỏi|so sánh|giải thích)/i.test(snt)) return;
      if (re('(PN)\\s+(?:là|thuộc)\\s+|kẻ\\s+|sao cho|lấy điểm|dựng\\s+').test(snt) && !/hình chóp|lăng trụ|hình hộp|lập phương|tứ diện/i.test(snt)) unknown.push(snt.trim());
    });
    const tpl = kind === 'chop' ? (base.length === 3 ? 'k_chop3sa' : 'k_chop4sa') : kind === 'tudien' ? 'k_tudien' : solidKind === 'lapphuong' ? 'k_lapphuong' : solidKind ? 'k_hop' : base.length === 3 ? 'k_langtru3' : 'k_hop';
    return { kind: tpl, script: lines.join('\n'), notes, unknown };
  }

  // ======================= HÌNH PHẲNG (src/plane.js) =======================
  // Nhận: tam giác (thường, nhọn, tù, vuông, cân, vuông cân, đều; cạnh, góc cho trước), tứ giác (vuông, chữ nhật, bình hành,
  // thoi, thang, thang vuông, thang cân, tứ giác thường; nội tiếp đường tròn), đường tròn (tâm, bán kính, đường kính, điểm
  // trên đường tròn, dây, tiếp tuyến), điểm cho bằng toạ độ trong mặt phẳng Oxy. Điểm phụ: trung điểm, đối xứng, giao điểm,
  // trọng tâm, trực tâm, tâm đường tròn ngoại / nội tiếp, đường cao, trung tuyến, phân giác, hình chiếu, điểm trên cạnh theo
  // tỉ số, đỉnh thứ tư của hình bình hành, đường thẳng qua một điểm song song / vuông góc với một đường. Cách đặt đỉnh theo các
  // mẫu hình phẳng của phần mềm: tam giác ABC có A ở trên; tứ giác ABCD có A trên trái, B trên phải, C dưới phải, D dưới trái.
  const r2 = (v) => String(Math.round(v * 1000) / 1000);
  const lab = (v) => String(Math.round(v * 100) / 100).replace('.', '{,}');
  function numEval(x) {
    const e = String(x).replace(/\s+/g, '').replace(/(\d),(\d)/g, '$1.$2').replace(/−/g, '-');
    if (!/^[-+]?[\d.()/*+\-√]+$/.test(e)) return null;
    const v = lenVal(e.replace(/^[-+]/, ''));
    return v == null ? (/^[-+]?0+(\.0+)?$/.test(e) ? 0 : null) : (e[0] === '-' ? -v : v);
  }
  // "3 cm", "1,5", "2a", "a√3", "2R" → { v, tex } (R tính theo bán kính rr)
  function lenOf(x, rr) {
    let s = String(x).trim().replace(/\s*(cm|mm|dm|km|m)\s*$/, '').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '');
    const unit = /\d\s*cm\s*$/.test(String(x).trim()) ? 'cm' : '';
    if (/^\d+(\.\d+)?$/.test(s)) return +s > 0 ? { v: +s, tex: lab(+s) + (unit ? '\\,\\text{cm}' : '') } : null;
    const rel = /R/.test(s);
    if (rel) s = s.replace(/R/g, 'a');
    const v = lenVal(s);
    if (v == null) return null;
    const tex = s.replace(/\*/g, '').replace(/√\(([^()]*)\)/g, '\\sqrt{$1}').replace(/√(\d+)/g, '\\sqrt{$1}').replace(/\(([^()]*)\)\/\(([^()]*)\)/g, '\\frac{$1}{$2}');
    return { v: rel ? v * rr : v, tex: rel ? tex.replace(/a/g, 'R') : tex };
  }

  function plane(text) {
    const t = norm(text);
    const notes = [], unknown = [];
    let m, q;
    // ---------- 1. Độ dài, góc cho trước ----------
    const Lraw = {}, given = new Set(); // given: độ dài cho trong đề (trước #G) — chỉ những độ dài này được ghi lên hình
    const key = (p, qq) => [p, qq].sort().join('|');
    const gi = t.indexOf('#G');
    [[gi >= 0 ? t.slice(0, gi) : t, true], [gi >= 0 ? t.slice(gi) : '', false]].forEach(([part, isGiven]) => part.split(/[;.](?!\d)|,(?![^(.;]*\))(?!\d)|\s+và\s+|\s+với\s+/).forEach((cl) => {
      const mm = re('^\\s*(?:\\S+\\s+)*?((?:\\s*(?:PN)(?:PN)\\s*=)+)\\s*([^=<>]+)$').exec(cl);
      if (!mm || !lenOf(mm[2].trim(), 1)) return;
      (mm[1].match(re('(PN)(PN)\\s*=', 'g')) || []).forEach((pq) => { const nn = namesIn(pq), k = nn.length === 2 && key(nn[0], nn[1]); if (k && !Lraw[k]) { Lraw[k] = mm[2].trim(); if (isGiven) given.add(k); } });
    }));
    const ANG = {};
    t.replace(re('góc\\s+((?:PN){1,3})\\s*(?:=|bằng)\\s*(\\d+(?:[.,]\\d+)?)\\s*°', 'g'), (m0, g, v) => { const ns = namesIn(g); ANG[ns.length === 3 ? ns[1] : ns[0]] = +v.replace(',', '.'); return m0; });
    let rr = 3, rTex = '';
    const getL = (p, qq) => { const raw = Lraw[key(p, qq)]; const o = raw ? lenOf(raw, rr) : null; return o ? o.v : null; };
    const texL = (p, qq) => { const raw = given.has(key(p, qq)) && Lraw[key(p, qq)]; const o = raw ? lenOf(raw, rr) : null; return o ? o.tex : ''; };
    let side = null;
    if ((m = /(?:có\s+)?(?:độ dài\s+)?cạnh\s*(?:bằng|là|=)?\s*(\d+(?:,\d+)?\s*(?:cm)?|\(?\d*\s*a[^,;.]*?)(?=[,;.]|\s+và\s|\s+[A-Z]|\s*$)/.exec(t))) { const o = lenOf(m[1], rr); if (o) side = o; }

    // ---------- 2. Hình chính ----------
    const QT = '(hình vuông|hình chữ nhật|hình bình hành|hình thoi|hình thang(?:\\s+vuông)?(?:\\s+cân)?|tứ giác(?:\\s+lồi)?)';
    const TT = '(vuông cân|vuông|cân|đều|nhọn|tù)';
    const cand = [];
    const triRe = new RegExp('tam giác\\s+(?:' + TT + '\\s+)?([A-Z]{3})(?![A-Za-z\'])(?:\\s*\\(?\\s*(?:có\\s+)?' + TT + '?(?:\\s+tại\\s+([A-Z]))?)?', 'g');
    if ((m = triRe.exec(t))) cand.push({ i: m.index, end: m.index + m[0].length, k: 'tri', name: m[2], type: m[1] || m[3] || '', at: m[4] || '' });
    const quadRe = new RegExp(QT + '\\s+([A-Z]{4})(?![A-Za-z\'])|([A-Z]{4})\\s+là\\s+(?:một\\s+)?' + QT, 'g');
    if ((m = quadRe.exec(t))) cand.push({ i: m.index, end: m.index + m[0].length, k: 'quad', name: m[2] || m[3], type: (m[1] || m[4]).replace(/\s+/g, ' ') });
    const cirRe = re('(nửa\\s+)?đường tròn\\s*(?:\\(\\s*(PN)\\s*(?:;\\s*([^()]*?))?\\s*\\)|tâm\\s+(PN)(?:\\s*,?\\s*bán kính\\s*(?:(?:R|r)\\s*=\\s*)?(\\d+(?:,\\d+)?\\s*(?:cm)?|[A-Za-z]\\b))?)(?:\\s*,?\\s*(?:có\\s+)?đường kính\\s+(PN)(PN))?');
    if ((m = cirRe.exec(t))) cand.push({ i: m.index, end: m.index + m[0].length, k: 'cir', o: m[2] || m[4], r: m[3] || m[5] || '', dia: m[6] ? [m[6], m[7]] : null, half: !!m[1] });
    const pts0 = [];
    if (/O\s*xy|toạ độ|tọa độ/.test(t)) {
      const pr = re('(?<![A-Za-z])(PN)\\s*\\(\\s*([-+−]?[\\d.,/()√]+)\\s*[;,]\\s*([-+−]?[\\d.,/()√]+)\\s*\\)', 'g');
      while ((q = pr.exec(t))) { const x = numEval(q[2]), y = numEval(q[3]); if (x != null && y != null && !pts0.some((p) => p[0] === q[1])) pts0.push([q[1], x, y]); }
    }
    const P = {}, lines = [], marks = [], made = new Set(), edges = new Set(), dots = new Set();
    const edge = (p, qq) => edges.add(key(p, qq));
    const cyc = (ns) => ns.forEach((n, i) => edge(n, ns[(i + 1) % ns.length]));
    let tickN = 0;
    const tick = (pairs) => { tickN++; marks.push('bang ' + pairs.join(' ') + ' = ' + Math.min(tickN, 4)); };
    const angMark = (ns, v) => { const i = ns.indexOf(v); if (i < 0 || ANG[v] == null || ANG[v] === 90) return; const a = ns[(i + ns.length - 1) % ns.length], b = ns[(i + 1) % ns.length]; marks.push('goc ' + a + v + b + ' = ' + lab(ANG[v]) + '^{\\circ}'); };
    let tpl = '', baseNames = [], cir = null, inscribed = false;
    cand.sort((a, b) => a.i - b.i);
    let base = cand[0];
    if (pts0.length >= 2 && (!base || base.k !== 'cir')) base = { k: 'oxy' };
    if (!base) return null;
    // hình chính phải được nêu trong câu dựng đề ("Cho tam giác…", "Xét…", "Vẽ…", "Từ điểm M…"), không phải câu nhắc qua
    if (base.k !== 'oxy') {
      const st = Math.max(t.lastIndexOf('.', base.i), t.lastIndexOf(';', base.i), t.lastIndexOf('#', base.i)) + 1;
      if (!/(^|\s)(cho|xét|vẽ|dựng|từ|lấy|gọi|trên)\s/i.test(t.slice(st, base.i + 1))) return null;
    }
    if (base.k === 'tri' || base.k === 'quad') {
      // đa giác nội tiếp đường tròn (tâm O)
      const after = t.slice(base.end, base.end + 160).split(/[.;](?!\d)/)[0];
      const ins = re('nội tiếp\\s+(?:trong\\s+)?(?:nửa\\s+)?đường tròn\\s*(?:\\(\\s*(PN)|tâm\\s+(PN))?').exec(after);
      if (ins) { inscribed = true; cir = { o: ins[1] || ins[2] || '' }; }
    }
    if (base.k === 'cir') {
      const o = lenOf(base.r || '', 3);
      if (o && !/^[A-Za-z]$/.test(base.r.trim())) { rr = o.v; rTex = o.tex; }
      else if (base.r && /^[A-Za-z]$/.test(base.r.trim())) rTex = base.r.trim();
    }

    if (base.k === 'tri') {
      const ns = base.name.split(''), [n0, n1, n2] = ns, ty = base.type;
      baseNames = ns; cyc(ns);
      // đường cao từ đỉnh góc vuông: SGK vẽ cạnh huyền nằm ngang
      if (/vuông/.test(ty)) {
        const X = base.at || n0, [Y, Z] = ns.filter((c) => c !== X);
        let l1 = getL(X, Y), l2 = getL(X, Z); const hy = getL(Y, Z);
        if (/cân/.test(ty)) { l1 = l1 || l2 || (hy ? hy / Math.SQRT2 : 4); l2 = l1; tick([X + Y, X + Z]); }
        else {
          if (!l1 && !l2 && ANG[Y] && ANG[Y] < 90) { l1 = hy ? hy * Math.cos(ANG[Y] * Math.PI / 180) : 3.6; }
          if (!l1 && !l2 && ANG[Z] && ANG[Z] < 90) { l2 = hy ? hy * Math.cos(ANG[Z] * Math.PI / 180) : 5.4; }
          if (l1 && !l2) l2 = hy && hy > l1 ? Math.sqrt(hy * hy - l1 * l1) : ANG[Y] ? l1 * Math.tan(ANG[Y] * Math.PI / 180) : ANG[Z] ? l1 / Math.tan(ANG[Z] * Math.PI / 180) : 1.5 * l1;
          if (l2 && !l1) l1 = hy && hy > l2 ? Math.sqrt(hy * hy - l2 * l2) : ANG[Z] ? l2 * Math.tan(ANG[Z] * Math.PI / 180) : ANG[Y] ? l2 / Math.tan(ANG[Y] * Math.PI / 180) : l2 / 1.5;
          if (!l1 && !l2) { if (hy) { l1 = 0.55 * hy; l2 = Math.sqrt(hy * hy - l1 * l1); } else { l1 = 3.6; l2 = 5.4; } }
        }
        const alt = re('đường cao\\s+' + X + '[A-Z]|' + X + '[A-Z]\\s*(?:⊥|vuông góc với)\\s*(?:' + Y + Z + '|' + Z + Y + ')|hình chiếu\\s+(?:vuông góc\\s+)?(?:của\\s+)?(?:điểm\\s+)?' + X + '\\s+(?:trên|lên|xuống)').test(t);
        if (alt) { const h = Math.hypot(l1, l2); P[Y] = [0, 0]; P[Z] = [h, 0]; P[X] = [l1 * l1 / h, l1 * l2 / h]; }
        else { P[X] = [0, 0]; P[Y] = [0, l1]; P[Z] = [l2, 0]; }
        marks.push('vuong ' + Y + X + Z);
        tpl = /cân/.test(ty) ? 'vuongcan' : 'vuong';
        notes.push('tam giác ' + base.name + ' vuông' + (/cân/.test(ty) ? ' cân' : '') + ' tại ' + X);
      } else if (/đều/.test(ty)) {
        const s = getL(n0, n1) || getL(n1, n2) || getL(n0, n2) || (side && side.v) || 5;
        P[n1] = [0, 0]; P[n2] = [s, 0]; P[n0] = [s / 2, s * Math.sqrt(3) / 2];
        tick([n0 + n1, n1 + n2, n2 + n0]); tpl = 'deu'; notes.push('tam giác ' + base.name + ' đều');
      } else if (/cân/.test(ty)) {
        const X = base.at || n0, [Y, Z] = ns.filter((c) => c !== X);
        let l = getL(X, Y) || getL(X, Z), b = getL(Y, Z);
        if (ANG[X] && ANG[X] < 180) { l = l || (b ? b / (2 * Math.sin(ANG[X] * Math.PI / 360)) : 5.5); b = b || 2 * l * Math.sin(ANG[X] * Math.PI / 360); }
        const bA = ANG[Y] || ANG[Z];
        if (bA && bA < 90 && !(l && b)) { b = b || (l ? 2 * l * Math.cos(bA * Math.PI / 180) : 5); l = l || b / (2 * Math.cos(bA * Math.PI / 180)); }
        if (l && !b) b = l / 1.1; if (b && !l) l = 1.1 * b; if (!l) { l = 5.5; b = 5; }
        if (l <= b / 2) l = 0.65 * b;
        P[Y] = [0, 0]; P[Z] = [b, 0]; P[X] = [b / 2, Math.sqrt(l * l - b * b / 4)];
        tick([X + Y, X + Z]); tpl = 'can'; notes.push('tam giác ' + base.name + ' cân tại ' + X);
      } else {
        // tam giác thường: B, C nằm ngang, A ở trên (A bên trái hướng B → C)
        const D0 = [6, 5.2, 4.4];
        let a = getL(n1, n2), b = getL(n0, n2), c = getL(n0, n1);
        const f = a ? a / D0[0] : b ? b / D0[1] : c ? c / D0[2] : side ? side.v / D0[0] : 1;
        if (/AB\s*>\s*AC/.test(t) && !b && !c) { D0[1] = 4.4; D0[2] = 5.2; }
        a = a || D0[0] * f; b = b || D0[1] * f; c = c || D0[2] * f;
        let al = ANG[n0], be = ANG[n1], ga = ANG[n2];
        if (/tù/.test(ty) && !al) al = 115;
        if (al && be && !ga) ga = 180 - al - be; if (al && ga && !be) be = 180 - al - ga;
        const R = (d) => d * Math.PI / 180;
        P[n1] = [0, 0];
        if (be && ga) { P[n2] = [a, 0]; const cc = a * Math.sin(R(ga)) / Math.sin(R(be + ga)); P[n0] = [cc * Math.cos(R(be)), cc * Math.sin(R(be))]; }
        else if (be) { P[n2] = [a, 0]; P[n0] = [c * Math.cos(R(be)), c * Math.sin(R(be))]; }
        else if (ga) { P[n2] = [a, 0]; P[n0] = [a - b * Math.cos(R(ga)), b * Math.sin(R(ga))]; }
        else if (!al && !getL(n1, n2) && !getL(n0, n2) && !getL(n0, n1) && re('tiếp tuyến\\s+(?:\\S+\\s+){0,5}?tại\\s+(?:điểm\\s+)?' + n0 + '(?![A-Za-z\'])').test(t)) {
          // tiếp tuyến tại A cắt BC: góc B, C chênh nhau nhiều để giao điểm nằm gần hình (như hình SGK)
          [[n0, 130], [n1, 215], [n2, 335]].forEach(([n, d]) => { P[n] = [3 * Math.cos(R(d)), 3 * Math.sin(R(d))]; });
        } else {
          if (al) a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(R(al)));
          if (a >= b + c || b >= a + c || c >= a + b) { a = D0[0] * f; b = D0[1] * f; c = D0[2] * f; notes.push('ba cạnh không tạo thành tam giác: vẽ tạm'); }
          P[n2] = [a, 0]; const x = (c * c - b * b + a * a) / (2 * a); P[n0] = [x, Math.sqrt(Math.max(0, c * c - x * x))];
        }
        tpl = 'tamgiac';
      }
      ns.forEach((v) => angMark(ns, v));
    } else if (base.k === 'quad') {
      const ns = base.name.split(''), [A, B, C, D] = ns, ty = base.type;
      baseNames = ns; cyc(ns);
      const g = (p, qq, d) => getL(p, qq) || d;
      if (/hình vuông/.test(ty)) {
        const s = g(A, B, g(B, C, g(C, D, g(D, A, side ? side.v : 4))));
        P[D] = [0, 0]; P[C] = [s, 0]; P[B] = [s, s]; P[A] = [0, s];
        marks.push('vuong ' + A + D + C); tick([A + B, B + C, C + D, D + A]); tpl = 'vuongh';
      } else if (/chữ nhật/.test(ty)) {
        let w = g(A, B, g(C, D, 0)), h = g(A, D, g(B, C, 0)); const dg = getL(A, C) || getL(B, D);
        if (w && !h) h = dg && dg > w ? Math.sqrt(dg * dg - w * w) : 0.57 * w; if (h && !w) w = dg && dg > h ? Math.sqrt(dg * dg - h * h) : h / 0.57; if (!w) { w = 5.6; h = 3.2; }
        P[D] = [0, 0]; P[C] = [w, 0]; P[B] = [w, h]; P[A] = [0, h];
        marks.push('vuong ' + A + D + C); tpl = 'chunhat';
      } else if (/bình hành/.test(ty)) {
        const a = g(A, B, g(C, D, 0)), b = g(A, D, g(B, C, 0));
        const a1 = a || (b ? b / 0.68 : 5), b1 = b || 0.68 * a1;
        const gd = ANG[D] || (ANG[B]) || (ANG[A] ? 180 - ANG[A] : ANG[C] ? 180 - ANG[C] : 65), R = gd * Math.PI / 180;
        P[D] = [0, 0]; P[C] = [a1, 0]; P[A] = [b1 * Math.cos(R), b1 * Math.sin(R)]; P[B] = [P[A][0] + a1, P[A][1]];
        tpl = 'binhhanh';
      } else if (/thoi/.test(ty)) {
        const s = g(A, B, g(B, C, side ? side.v : 3.8)), ga = ANG[A] || ANG[C] || (ANG[B] ? 180 - ANG[B] : ANG[D] ? 180 - ANG[D] : 64), R = ga * Math.PI / 360;
        P[A] = [0, 0]; P[B] = [s * Math.cos(R), s * Math.sin(R)]; P[D] = [s * Math.cos(R), -s * Math.sin(R)]; P[C] = [2 * s * Math.cos(R), 0];
        tick([A + B, B + C, C + D, D + A]); tpl = 'thoi';
      } else if (/thang/.test(ty)) {
        const after = t.slice(base.end, base.end + 120);
        const rt = /^\s*\(?\s*(?:vuông\s+)?tại\s+([A-Z])\s+và\s+([A-Z])/.exec(after);
        const par = re('(PN)(PN)\\s*∥\\s*(PN)(PN)').exec(t);
        const adBc = (par && new Set([par[1] + par[2], par[3] + par[4]].map((x) => x.split('').sort().join(''))).has([A, D].sort().join(''))) || re('đáy\\s+(?:lớn\\s+)?' + A + D + '|' + A + D + '\\s*∥|đáy\\s+' + B + C + '\\s+(?:và|,)\\s*' + A + D).test(t);
        const vu = /vuông/.test(ty) || !!rt, can = /cân/.test(ty);
        if (adBc) {
          // hai đáy AD (dưới) và BC (trên): A dưới trái, B trên trái, C trên phải, D dưới phải
          const big = g(A, D, 6.5), small = g(B, C, big / 2), h = getL(A, B) && vu ? getL(A, B) : 0.46 * big;
          const lech = vu ? 0 : can ? (big - small) / 2 : 0.22 * big;
          P[A] = [0, 0]; P[D] = [big, 0]; P[B] = [lech, h]; P[C] = [lech + small, h];
          if (vu) marks.push('vuong ' + D + A + B, 'vuong ' + A + B + C);
          if (can) tick([A + B, C + D]);
          marks.push('ssong ' + B + C + ' ' + A + D);
        } else {
          const big = g(C, D, 6.5), small = g(A, B, big / 2), h = vu && getL(A, D) ? getL(A, D) : 0.46 * big;
          const lech = vu ? 0 : can ? (big - small) / 2 : 0.22 * big;
          P[D] = [0, 0]; P[C] = [big, 0]; P[A] = [lech, h]; P[B] = [lech + small, h];
          if (vu) marks.push('vuong ' + C + D + A, 'vuong ' + D + A + B);
          if (can) tick([A + D, B + C]);
          marks.push('ssong ' + A + B + ' ' + D + C);
        }
        tpl = can ? 'thangcan' : 'hinhthang';
      } else if (inscribed) {
        const o = [120, 30, -50, 205].map((d) => d * Math.PI / 180);
        ns.forEach((n, i) => { P[n] = [3 * Math.cos(o[i]), 3 * Math.sin(o[i])]; });
        tpl = 'tgnoitiep';
      } else { P[D] = [0, 0]; P[C] = [6, 0]; P[B] = [5, 3.6]; P[A] = [0.8, 3.1]; tpl = 'tgnoitiep'; }
      notes.push(ty + ' ' + base.name);
      ns.forEach((v) => angMark(ns, v));
    } else if (base.k === 'oxy') {
      pts0.forEach(([n, x, y]) => { P[n] = [x, y]; dots.add(n); });
      tpl = 'vt_oxy'; notes.push('mặt phẳng toạ độ Oxy: ' + pts0.map((p) => p[0]).join(', '));
    }
    if (base.k !== 'cir' && base.k !== 'oxy') {
      // độ dài cho trước ghi lên cạnh
      baseNames.forEach((n, i) => { const n2 = baseNames[(i + 1) % baseNames.length], tx = texL(n, n2); if (tx && baseNames.length === 3) marks.push('ghi ' + n + n2 + ' = ' + tx); });
    }
    Object.keys(P).forEach((n) => { lines.push(n + ' = (' + r2(P[n][0]) + ', ' + r2(P[n][1]) + ')'); made.add(n); });
    if (base.k === 'oxy') {
      const xs = pts0.map((p) => p[1]).concat(0), ys = pts0.map((p) => p[2]).concat(0);
      lines.unshift('truc ' + [Math.floor(Math.min(...xs)) - 1, Math.ceil(Math.max(...xs)) + 1, Math.floor(Math.min(...ys)) - 1, Math.ceil(Math.max(...ys)) + 1].join(' '));
    }
    if (baseNames.length) lines.push('dagiac ' + baseNames.join(''));
    // đường tròn chính / đường tròn ngoại tiếp đa giác nội tiếp
    const circPool = [];
    if (base.k === 'cir') {
      cir = { o: base.o };
      lines.push('r = ' + r2(rr) + '   # Bán kính');
      lines.push(base.o + ' = (0, 0)'); made.add(base.o); dots.add(base.o);
      if (base.dia) { lines.push(base.dia[0] + ' = tron(' + base.o + ', r, 180)', base.dia[1] + ' = tron(' + base.o + ', r, 0)'); base.dia.forEach((n) => made.add(n)); lines.push('doan ' + base.dia.join('')); edge(base.dia[0], base.dia[1]); circPool.push(65, 125, 35, 150, -60, -120); }
      else circPool.push(70, 215, 325, 120, 30, -50, 160);
      lines.push('duongtron ' + base.o + ' r');
      notes.push('đường tròn (' + base.o + (rTex ? '; ' + rTex : '') + ')' + (base.dia ? ', đường kính ' + base.dia.join('') : ''));
      tpl = 'duongtron';
    } else if (inscribed) {
      const o = cir.o || 'O';
      lines.push(o + ' = tamngoai(' + baseNames.slice(0, 3).join(', ') + ')', 'duongtron ' + o + ' ' + baseNames[0]);
      made.add(o); dots.add(o); notes.push('nội tiếp đường tròn (' + o + ')');
    }

    // ---------- 3. Điểm phụ ----------
    const cons = [];
    const rArg = base.k === 'cir' ? 'r' : baseNames[0];
    const isDef = (n) => made.has(n) || cons.some((c) => c.name === n);
    const add = (name, need, line, src, more) => { if (!isDef(name)) cons.push({ name, need, line, src, more: more || [] }); };
    let hid = 0;
    const helper = () => 'Z' + (++hid);
    const hidden = [];
    const tris = []; // các tam giác được nhắc tới (để tìm cạnh đối diện của đường cao, trung tuyến)
    (t.match(/tam giác\s+(?:\S+\s+)?([A-Z]{3})(?![A-Za-z'])/g) || []).forEach((x) => tris.push(/([A-Z]{3})$/.exec(x)[1]));
    if (baseNames.length === 3) tris.unshift(baseNames.join(''));
    const opp = (v, hint) => { const tr = (hint && hint.length === 3 && hint.includes(v) ? hint : tris.find((x) => x.includes(v))) || ''; return tr ? tr.split('').filter((c) => c !== v) : null; };
    const listNames = (s) => namesIn(String(s).replace(/\s+(?:và|,)\s+/g, ','));
    const listPairs = (s) => String(s).split(/\s*(?:,|và)\s*/).map((x) => x.replace(/^(?:cạnh|đoạn|các cạnh|đoạn thẳng)\s+/, '').trim()).filter(Boolean);
    const foot = (n, src, ps, srcTxt) => { add(n, [src].concat(ps), n + ' = chan(' + src + ', ' + ps.join(', ') + ')', srcTxt, ['doan ' + src + n, 'vuong ' + src + n + ps[0]]); };
    const sentences = t.split(/(?<=[.;])\s+|\.\s*$/).filter(Boolean);
    const used = new Set();
    const onCirc = [];
    sentences.forEach((snt, si) => {
      let hit = false;
      // trung điểm; đối xứng khi trung điểm đã có và một đầu mút chưa có
      const r1 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng)?\\s*là\\s+(?:các\\s+)?trung điểm\\s+(?:của\\s+)?(?:các\\s+)?(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)?((?:PN){2}(?:\\s*(?:,|và)\\s*(?:cạnh\\s+)?(?:PN){2})*)', 'g');
      while ((q = r1.exec(snt))) {
        const ns = listNames(q[1]), segs = listPairs(q[2]);
        ns.forEach((n, i) => {
          const sg = namesIn(segs[i] || ''); if (sg.length !== 2) return;
          if (!isDef(n)) { add(n, sg, n + ' = trungdiem(' + sg.join(', ') + ')', 'trung điểm', ['bang ' + sg[0] + n + ' ' + n + sg[1] + ' = #']); hit = true; }
          else if (isDef(sg[0]) !== isDef(sg[1])) { const k = isDef(sg[0]) ? 0 : 1; add(sg[1 - k], [sg[k], n], sg[1 - k] + ' = doixung(' + sg[k] + ', ' + n + ')', 'đối xứng', ['bang ' + sg[0] + n + ' ' + n + sg[1] + ' = #']); hit = true; }
        });
      }
      const r1b = re('trung điểm\\s+(PN)\\s+(?:của\\s+)?(?:cạnh\\s+|đoạn\\s+)?((?:PN){2})', 'g');
      while ((q = r1b.exec(snt))) { const sg = namesIn(q[2]); add(q[1], sg, q[1] + ' = trungdiem(' + sg.join(', ') + ')', 'trung điểm', ['bang ' + sg[0] + q[1] + ' ' + q[1] + sg[1] + ' = #']); hit = true; }
      // đối xứng qua điểm / qua đường thẳng
      const rs = re('(PN)\\s+(?:là\\s+(?:điểm\\s+)?)?đối xứng\\s+(?:của\\s+|với\\s+)?(?:điểm\\s+)?(PN)\\s+qua\\s+(?:điểm\\s+|đường thẳng\\s+|cạnh\\s+)?((?:PN){1,2})(?![A-Za-z])', 'g');
      while ((q = rs.exec(snt))) { const ax = namesIn(q[3]); add(q[1], [q[2]].concat(ax), q[1] + (ax.length === 1 ? ' = doixung(' + q[2] + ', ' + ax[0] + ')' : ' = doixungtruc(' + q[2] + ', ' + ax.join(', ') + ')'), 'đối xứng'); hit = true; }
      // qua M kẻ đường thẳng song song (vuông góc) với BC, cắt AC tại N
      const rq = re('qua\\s+(?:điểm\\s+)?(PN)\\s*,?\\s*(?:kẻ|vẽ)?\\s*(?:đường thẳng|tia)?\\s*(?:(PN)\\s+)?(song song|vuông góc)\\s+với\\s+(?:đường thẳng\\s+|cạnh\\s+)?(PN)(PN)\\s*,?\\s*(?:và\\s+)?cắt\\s+(?:cạnh\\s+|đường thẳng\\s+|tia\\s+)?(PN)(PN)\\s+(?:lần lượt\\s+)?tại\\s+(?:điểm\\s+)?(PN)', 'g');
      while ((q = rq.exec(snt))) {
        const M = q[1], [X, Y] = [q[4], q[5]], [U, W] = [q[6], q[7]], n = q[8], h = helper();
        const hl = q[3] === 'song song' ? h + ' = tinhtien(' + M + ', ' + X + ', ' + Y + ')' : h + ' = quay(tinhtien(' + M + ', ' + X + ', ' + Y + '), ' + M + ', 90)';
        if (q[3] === 'vuông góc') { const h2 = helper(); add(n, [M, X, Y, U, W], h2 + ' = tinhtien(' + M + ', ' + X + ', ' + Y + ')\n' + h + ' = quay(' + h2 + ', ' + M + ', 90)\n' + n + ' = giao(' + M + ', ' + h + ', ' + U + ', ' + W + ')', 'đường vuông góc', ['doan ' + M + n]); hidden.push(h, h2); }
        else { add(n, [M, X, Y, U, W], hl + '\n' + n + ' = giao(' + M + ', ' + h + ', ' + U + ', ' + W + ')', 'đường song song', ['doan ' + M + n]); hidden.push(h); }
        hit = true;
      }
      // giao điểm: "O là giao điểm của AC và BD", "giao điểm O của …", "AC cắt BD tại O", "hai đường chéo cắt nhau tại O"
      const rg = re('(?:(PN)\\s+là\\s+giao điểm|giao điểm\\s+(PN))\\s+(?:của\\s+)?(?:hai\\s+)?(?:đường thẳng\\s+|đường chéo\\s+|tia\\s+)?((?:PN){2})\\s+(?:và|với)\\s+(?:đường thẳng\\s+|tia\\s+)?((?:PN){2})', 'g');
      while ((q = rg.exec(snt))) { const n = q[1] || q[2], a = namesIn(q[3]), b = namesIn(q[4]); add(n, a.concat(b), n + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm', ['doan ' + a.join('') + ' ' + b.join('')]); hit = true; }
      // "các đường cao AD, BE, CF cắt nhau tại H": giao của hai đường đầu
      const rn = re('(?<![A-Za-z])((?:PN)(?:PN))\\s*(?:,|và)\\s*((?:PN)(?:PN))(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*\\s+(?:đồng quy|cắt nhau)\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rn.exec(snt))) { const a = namesIn(q[1]), b = namesIn(q[2]); if (!isDef(q[3])) { add(q[3], a.concat(b), q[3] + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm'); hit = true; } }
      const rc = re('(?<![A-Za-z])(PN)(PN)\\s+(?:và\\s+(PN)(PN)\\s+)?cắt\\s+(?:nhau\\s+)?(?:đường thẳng\\s+|tia\\s+|cạnh\\s+)?(?:(PN)(PN)\\s+)?tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rc.exec(snt))) {
        const a = [q[1], q[2]], b = q[3] ? [q[3], q[4]] : q[5] ? [q[5], q[6]] : null, n = q[7];
        if (b && !isDef(n)) { add(n, a.concat(b), n + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm', ['doan ' + a.join('') + ' ' + b.join('')]); hit = true; }
      }
      if (baseNames.length === 4 && (q = re('(?:hai\\s+)?đường chéo\\s+(?:(PN)(PN)\\s+(?:và\\s+)?(PN)(PN)\\s+)?cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(snt))) {
        const [A, B, C, D] = baseNames; add(q[5], baseNames, q[5] + ' = giao(' + A + ', ' + C + ', ' + B + ', ' + D + ')', 'giao điểm hai đường chéo', ['doan ' + A + C + ' ' + B + D]); hit = true;
      }
      // tâm đường tròn ngoại tiếp / nội tiếp; đường tròn ngoại / nội tiếp không nêu tên tâm
      const rt = re('(?:(PN)\\s+là\\s+tâm\\s+(?:của\\s+)?đường tròn|đường tròn\\s*(?:\\(\\s*(PN)\\s*\\)|tâm\\s+(PN))?)\\s+(ngoại|nội)\\s+tiếp\\s+(?:tam giác\\s+)?([A-Z]{3})', 'g');
      while ((q = rt.exec(snt))) {
        const n = q[1] || q[2] || q[3], ns = q[5].split(''), out = q[4] === 'ngoại';
        if (n) add(n, ns, n + ' = ' + (out ? 'tamngoai' : 'tamnoi') + '(' + ns.join(', ') + ')', out ? 'tâm đường tròn ngoại tiếp' : 'tâm đường tròn nội tiếp', [(out ? 'duongtron ' + n + ' ' + ns[0] : 'noitiep ' + ns.join('')), 'diem ' + n]);
        else if (ns.every(isDef)) cons.push({ name: '', need: ns, line: '', src: '', more: [(out ? 'ngoaitiep ' : 'noitiep ') + ns.join('')] });
        hit = true;
      }
      // trọng tâm, trực tâm, tâm của hình vuông / hình bình hành…
      const r3 = re('(?:(PN)\\s+là\\s+(trọng tâm|trực tâm|tâm)|(trọng tâm|trực tâm|tâm)\\s+(PN))\\s+(?:của\\s+)?(?:hình vuông|hình chữ nhật|hình bình hành|hình thoi|tam giác(?:\\s+đều)?|tứ giác)?\\s*([A-Z]{3,4})(?![A-Za-z])', 'g');
      while ((q = r3.exec(snt))) {
        const n = q[1] || q[4], kind = q[2] || q[3], ns = q[5].split('');
        if (ns.length === 4) add(n, ns, n + ' = giao(' + ns[0] + ', ' + ns[2] + ', ' + ns[1] + ', ' + ns[3] + ')', 'tâm', ['doan ' + ns[0] + ns[2] + ' ' + ns[1] + ns[3]]);
        else if (kind === 'trực tâm') add(n, ns, n + ' = tructam(' + ns.join(', ') + ')', 'trực tâm', ['diem ' + n]);
        else if (kind === 'tâm') add(n, ns, n + ' = tamngoai(' + ns.join(', ') + ')', 'tâm', ['diem ' + n]);
        else add(n, ns, n + ' = trongtam(' + ns.join(', ') + ')', 'trọng tâm', ['diem ' + n]);
        hit = true;
      }
      // đường cao, trung tuyến, phân giác: "đường cao AH", "các đường trung tuyến AM, BN", "AD là phân giác của tam giác ABC"
      const rl = re('(?:các\\s+)?(đường cao|đường trung tuyến|trung tuyến|đường phân giác(?:\\s+trong)?|phân giác)\\s+((?:PN)(?:PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*)(?:\\s+(?:của\\s+)?tam giác\\s+([A-Z]{3}))?|((?:PN)(?:PN))\\s+là\\s+(?:một\\s+)?(?:tia\\s+)?(đường cao|đường trung tuyến|trung tuyến|đường phân giác|phân giác)(?:\\s+(?:của\\s+)?tam giác\\s+([A-Z]{3}))?', 'g');
      while ((q = rl.exec(snt))) {
        const kind = q[1] || q[5], hint = q[3] || q[6];
        listPairs(q[2] || q[4]).forEach((pq) => {
          const [v, n] = namesIn(pq); if (!v || !n || !isDef(v)) return;
          if (isDef(n)) { hit = true; return; } // điểm đã dựng (vd lời giải nhắc lại "AM là đường trung tuyến"): câu đã hiểu
          const o = opp(v, hint); if (!o) return;
          if (/cao/.test(kind)) foot(n, v, o, 'đường cao');
          else if (/trung tuyến/.test(kind)) add(n, o, n + ' = trungdiem(' + o.join(', ') + ')', 'trung tuyến', ['doan ' + v + n, 'bang ' + o[0] + n + ' ' + n + o[1] + ' = #']);
          else add(n, [v].concat(o), n + ' = phangiac(' + v + ', ' + o.join(', ') + ')', 'phân giác', ['doan ' + v + n, 'goc ' + o[0] + v + n + ' ' + n + v + o[1]]);
          hit = true;
        });
      }
      // tia phân giác của góc BAC cắt BC tại D
      const rp = re('phân giác\\s+(?:của\\s+)?góc\\s+((?:PN){3}|PN)\\s+cắt\\s+(?:cạnh\\s+|đường thẳng\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)', 'g');
      while ((q = rp.exec(snt))) {
        const g3 = namesIn(q[1]); let X, V, Y;
        if (g3.length === 3) [X, V, Y] = g3; else { V = g3[0]; const o = opp(V); if (!o) continue; [X, Y] = o; }
        add(q[4], [X, V, Y, q[2], q[3]], q[4] + ' = phangiacgoc(' + [X, V, Y, q[2], q[3]].join(', ') + ')', 'phân giác', ['doan ' + V + q[4], 'goc ' + X + V + q[4] + ' ' + q[4] + V + Y]); hit = true;
      }
      // hình chiếu, chân đường vuông góc, kẻ AH ⊥ BC
      const r4 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng)?\\s*là\\s+(?:các\\s+)?(?:hình chiếu\\s+(?:vuông góc\\s+)?|chân\\s+(?:các\\s+)?đường (?:vuông góc|cao)\\s+(?:kẻ\\s+)?)(?:của\\s+|từ\\s+)?(?:điểm\\s+)?(PN)\\s+(?:trên|lên|xuống|đến|tới)\\s+((?:(?:cạnh|đường thẳng)\\s+)?(?:PN){2}(?:\\s*(?:,|và)\\s*(?:PN){2})*)', 'g');
      while ((q = r4.exec(snt))) {
        const ns = listNames(q[1]), src = q[2], tg = listPairs(q[3].replace(/cạnh|đường thẳng/g, ''));
        ns.forEach((n, i) => { const ps = namesIn(tg[i] || tg[0] || ''); if (ps.length === 2) { foot(n, src, ps, 'hình chiếu'); hit = true; } });
      }
      const r5 = re('(?:kẻ\\s+)?(PN)(PN)\\s*(?:⊥|vuông góc với)\\s*(?:đường thẳng\\s+|cạnh\\s+)?(PN)(PN)(?![A-Za-z])', 'g');
      while ((q = r5.exec(snt))) { if (!isDef(q[2]) && isDef(q[1])) { foot(q[2], q[1], [q[3], q[4]], 'đường vuông góc'); hit = true; } }
      // đỉnh thứ tư: "lấy điểm E sao cho ABCE là hình bình hành"
      const rh = re('(?:tứ giác\\s+)?([A-Z]{4})\\s+là\\s+(?:một\\s+)?(hình bình hành|hình chữ nhật|hình thoi|hình vuông)', 'g');
      while ((q = rh.exec(snt))) {
        const ns = q[1].split(''), miss = ns.filter((n) => !isDef(n));
        if (miss.length !== 1 || (base.k === 'quad' && base.name === q[1])) continue;
        const i = ns.indexOf(miss[0]), p = ns[(i + 3) % 4], o = ns[(i + 2) % 4], nx = ns[(i + 1) % 4];
        add(miss[0], [p, o, nx], miss[0] + ' = hbh(' + nx + ', ' + o + ', ' + p + ')', 'đỉnh thứ tư của ' + q[2], ['doan ' + p + miss[0] + ' ' + miss[0] + nx]); hit = true;
      }
      // điểm trên cạnh theo tỉ số / độ dài
      const r6 = re('(?:(PN)\\s+(?:là\\s+(?:một\\s+)?điểm\\s+)?(?:bất kì\\s+)?(?:thuộc|nằm trên|trên)\\s+(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)?((?:PN){2})|trên\\s+(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)((?:PN){2})\\s+lấy\\s+(?:điểm\\s+)?(PN))(?:\\s+sao cho\\s+([^,;.]+))?', 'g');
      while ((q = r6.exec(snt))) {
        const n = q[1] || q[4], sg = namesIn(q[2] || q[3]); if (sg.length !== 2 || isDef(n)) continue;
        let k = 0.4, ok = !q[5] || /bất kì/.test(q[0]);
        if (q[5]) {
          const c3 = q[5].replace(/\s+/g, '');
          let w;
          if ((w = re('^(PN)(PN)=([\\d.,()/]*)(PN)(PN)$').exec(c3)) && w[2] === n && w[4] === n) { const r = w[3] ? lenOf(w[3]) : { v: 1 }; if (r) { k = w[1] === sg[0] ? r.v / (r.v + 1) : 1 / (r.v + 1); ok = true; } }
          else if ((w = re('^(PN)(PN)=([\\d.,()/]+)(PN)(PN)$').exec(c3)) && w[2] === n) { const r = lenOf(w[3]); if (r && r.v < 1) { k = w[1] === sg[0] ? r.v : 1 - r.v; ok = true; } }
          else if ((w = re('^(PN)(PN)=([\\d.,]+(?:cm)?)$').exec(c3)) && w[2] === n) { const r = lenOf(w[3]), whole = getL(sg[0], sg[1]); if (r && whole && r.v < whole) { k = w[1] === sg[0] ? r.v / whole : 1 - r.v / whole; ok = true; } }
        }
        add(n, sg, n + ' = chia(' + sg.join(', ') + ', ' + r2(k) + ')', 'điểm trên cạnh');
        if (!ok) notes.push('điểm ' + n + ' trên ' + sg.join('') + ': chưa rõ vị trí, đặt tạm');
        hit = true;
      }
      // đường tròn (B; BA), đường tròn tâm B bán kính BA, đường tròn đường kính BC
      const rd = re('đường tròn\\s*(?:\\(\\s*(PN)\\s*;\\s*(PN)(PN)\\s*\\)|tâm\\s+(PN)\\s*,?\\s*bán kính\\s+(PN)(PN)|đường kính\\s+(PN)(PN))', 'g');
      while ((q = rd.exec(snt))) {
        if (q[7]) { const h = helper(); cons.push({ name: h, need: [q[7], q[8]], line: h + ' = trungdiem(' + q[7] + ', ' + q[8] + ')', src: '', more: ['duongtron ' + h + ' ' + q[7]] }); hidden.push(h); }
        else { const c = q[1] || q[4], a = q[1] ? q[2] : q[5], b = q[1] ? q[3] : q[6]; cons.push({ name: '', need: [c, a, b], line: '', src: '', more: ['duongtron ' + c + ' ' + (a === c ? b : a)] }); }
        hit = true;
      }
      // điểm trên đường tròn, dây, tiếp tuyến
      if (cir && cir.o) {
        const O = cir.o;
        const ro = re('(?:lấy\\s+)?(?:(?:các|hai|một|ba)\\s+)?(?:điểm\\s+)?((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:là\\s+)?(?:(?:các|hai|một|ba)\\s+)?(?:điểm\\s+)?(?:bất kì\\s+|phân biệt\\s+|khác\\s+[A-Z]\\s+)?(?:nằm\\s+)?(?:trên|thuộc)\\s+(?:nửa\\s+)?(?:đường tròn|\\(\\s*' + O + '\\s*[);]|cung)', 'g');
        while ((q = ro.exec(snt))) { listNames(q[1]).forEach((n) => { if (!isDef(n) && n !== O) { onCirc.push(n); cons.push({ name: n, need: [O], line: '', src: 'điểm trên đường tròn', more: [] }); hit = true; } }); }
        const rch = re('dây\\s+(?:cung\\s+)?((?:PN){2})', 'g');
        while ((q = rch.exec(snt))) { namesIn(q[1]).forEach((n) => { if (!isDef(n)) { onCirc.push(n); cons.push({ name: n, need: [O], line: '', src: 'dây', more: [] }); } }); cons.push({ name: '', need: namesIn(q[1]), line: '', src: '', more: ['doan ' + q[1]] }); hit = true; }
        const rout = re('(?:điểm\\s+)?(PN)\\s+(?:nằm\\s+)?(?:ở\\s+)?ngoài\\s+(?:đường tròn|\\(\\s*' + O + ')', 'g');
        while ((q = rout.exec(snt))) { const d = getL(O, q[1]) || 2.3 * rr; add(q[1], [O], q[1] + ' = tron(' + O + ', ' + r2(d) + ', 0)', 'điểm ngoài đường tròn', ['diem ' + q[1]]); hit = true; }
        // hai tiếp tuyến MA, MB (A, B là các tiếp điểm)
        const rtt = re('(?:hai\\s+)?tiếp tuyến\\s+((?:PN)(?:PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*)(?![A-Za-z])', 'g');
        while ((q = rtt.exec(snt))) {
          let k = 0;
          listPairs(q[1]).forEach((pq) => { const [M, A] = namesIn(pq); if (!M || !A || isDef(A)) return; k++; add(A, [M, O], A + ' = tiepdiem(' + M + ', ' + O + ', ' + rArg + ', ' + k + ')', 'tiếp điểm', ['doan ' + M + A + ' ' + O + A, 'vuong ' + O + A + M]); hit = true; });
          if (k) cons.push({ name: '', need: [O], line: '', src: '', more: ['doan ' + O + namesIn(q[1])[0]] });
        }
        // tiếp tuyến tại A (… cắt BC tại M; hai tiếp tuyến tại A và B cắt nhau tại M)
        const rta = re('tiếp tuyến\\s+(?:của\\s+(?:đường tròn\\s+)?\\(\\s*PN\\s*\\)\\s+)?tại\\s+(?:điểm\\s+)?((?:PN)(?:\\s+và\\s+PN)?)([^.;]*)', 'g');
        while ((q = rta.exec(snt))) {
          const at = namesIn(q[1]), hs = at.map((A) => { const h1 = helper(), h2 = helper(); hidden.push(h1, h2); cons.push({ name: h1, need: [A, O], line: h1 + ' = quay(' + O + ', ' + A + ', 90)\n' + h2 + ' = quay(' + O + ', ' + A + ', -90)', src: '', more: ['duongthang ' + h1 + h2, 'vuong ' + O + A + h1] }); return [h1, h2, A]; });
          let w;
          // tiếp tuyến có giao điểm N: vẽ tia từ N qua tiếp điểm (vượt quá tiếp điểm một chút) thay cho đường thẳng tự do
          const toN = (N) => hs.forEach((h) => { const c = cons.find((x) => x.name === h[0]); if (c) c.more[0] = 'tia ' + N + h[2]; });
          if (hs.length === 2 && (w = re('cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(q[2]))) toN(w[1]);
          else if (hs.length === 1 && (w = re('cắt\\s+(?:đường thẳng\\s+|tia\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(q[2]))) toN(w[3]);
          w = null;
          if (hs.length === 2 && (w = re('cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(q[2]))) add(w[1], [hs[0][0], hs[1][0]], w[1] + ' = giao(' + hs[0][0] + ', ' + hs[0][1] + ', ' + hs[1][0] + ', ' + hs[1][1] + ')', 'giao hai tiếp tuyến');
          else if (hs.length === 1 && (w = re('cắt\\s+(?:đường thẳng\\s+|tia\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(q[2]))) add(w[3], [hs[0][0], w[1], w[2]], w[3] + ' = giao(' + hs[0][0] + ', ' + hs[0][1] + ', ' + w[1] + ', ' + w[2] + ')', 'giao của tiếp tuyến', ['doan ' + w[1] + w[2] + ' ' + w[3] + w[1] + ' ' + w[3] + w[2]]);
          hit = true;
        }
      }
      if (hit) used.add(si);
    });
    // điểm trên đường tròn: rải theo các góc chưa dùng
    if (cir && cir.o) {
      const pool = circPool.length ? circPool : [70, 215, 325, 120, 30, -50, 160];
      onCirc.forEach((n, i) => { const c = cons.find((x) => x.name === n); if (c) c.line = n + ' = tron(' + cir.o + ', ' + rArg + ', ' + pool[i % pool.length] + ')'; });
    }
    // dựng theo thứ tự phụ thuộc
    const after = [];
    let guard = 0;
    while (cons.length && guard++ < 80) {
      const i = cons.findIndex((c) => c.need.every((n) => made.has(n)));
      if (i < 0) break;
      const c = cons.splice(i, 1)[0];
      if (c.line) { lines.push(c.line); c.line.split('\n').forEach((l) => { const d = /^([A-Z]\d*)\s*=/.exec(l); if (d) made.add(d[1]); }); }
      if (c.name) made.add(c.name);
      c.more.forEach((x) => after.push(x));
    }
    cons.forEach((c) => { if (c.name && !/^Z\d+$/.test(c.name)) unknown.push('không dựng được điểm ' + c.name + ' (' + c.src + '): thiếu điểm ' + c.need.filter((n) => !made.has(n)).join(', ')); });

    // ---------- 4. Đoạn, đa giác được nhắc tới ----------
    const out = [], seen = new Set();
    const push = (s) => { if (!seen.has(s)) { seen.add(s); out.push(s); } };
    after.filter((s) => /^(doan|duongthang|tia|duongtron|ngoaitiep|noitiep)/.test(s)).forEach((s) => { push(s); if (/^doan/.test(s)) s.slice(5).trim().split(/\s+/).forEach((sg) => { const ns = namesIn(sg); if (ns.length === 2) edge(ns[0], ns[1]); }); });
    (t.match(/(?:tam giác|tứ giác|hình bình hành|hình chữ nhật|hình thoi|hình vuông|hình thang)\s+(?:\S+\s+)?([A-Z]{3,4})(?![A-Za-z'])/g) || []).forEach((x) => {
      const ns = namesIn(/([A-Z]{3,4})$/.exec(x)[1]);
      if (ns.every((n) => made.has(n)) && ns.join('') !== baseNames.join('')) { const sg = ns.map((n, i) => [n, ns[(i + 1) % ns.length]]).filter((p) => !edges.has(key(p[0], p[1]))); if (sg.length) push('doan ' + sg.map((p) => p.join('')).join(' ')); cyc(ns); }
    });
    let mq;
    const segRe = re('(vectơ\\s+)?(?<![A-Za-zÀ-ỹ.(])((?:PN){2})(?![A-Za-zÀ-ỹ(])', 'g');
    while ((mq = segRe.exec(t))) {
      const ns = namesIn(mq[2]);
      if (ns.length !== 2 || ns[0] === ns[1] || !ns.every((n) => made.has(n))) continue;
      if (mq[1]) { push('vecto ' + ns.join('')); continue; }
      if (!edges.has(key(ns[0], ns[1]))) { push('doan ' + ns.join('')); edge(ns[0], ns[1]); }
    }
    out.forEach((s) => lines.push(s));
    // dấu: góc vuông, cạnh bằng nhau, góc cho trước
    after.filter((s) => /^(vuong|bang|goc|diem)/.test(s)).forEach((s) => {
      if (/^bang .* = #$/.test(s)) { tickN++; s = s.replace('#', String(Math.min(tickN, 4))); }
      marks.push(s);
    });
    const markOk = (s) => { const g = s.replace(/=.*$/, '').trim().split(/\s+/).slice(1); return g.every((x) => namesIn(x).every((n) => made.has(n))); };
    const vs = marks.filter((s) => /^vuong/.test(s) && markOk(s)).map((s) => s.slice(6).trim()).filter((v, i, a) => a.indexOf(v) === i);
    if (vs.length) lines.push('vuong ' + vs.join(' '));
    // ký hiệu góc: các góc bằng nhau cùng ký hiệu, các góc khác nhau khác ký hiệu (1, 2, 3… cung).
    // Nhóm góc bằng nhau không ghi số đo (cặp góc của tia phân giác) dùng cung đơn trước; góc ghi số đo: cùng số đo cùng ký hiệu.
    {
      const gs = marks.filter((s) => /^goc /.test(s) && markOk(s));
      const keyOf = (s) => { const lb = (/=\s*(.+)$/.exec(s) || [])[1]; return lb ? 'v:' + lb.trim() : 'm:' + s; };
      const keys = [...new Set(gs.filter((s) => !/=/.test(s)).map(keyOf).concat(gs.filter((s) => /=/.test(s)).map(keyOf)))];
      marks.forEach((s, i) => {
        if (!/^goc /.test(s) || !markOk(s)) return;
        const n = Math.min(4, keys.indexOf(keyOf(s)) + 1), m2 = /^goc\s+([^=]+?)\s*(=.*)?$/.exec(s);
        if (n > 1 && m2) marks[i] = 'goc ' + m2[1] + ' x' + n + (m2[2] ? ' ' + m2[2] : '');
      });
    }
    marks.filter((s) => !/^(vuong|diem)/.test(s) && markOk(s)).forEach((s) => { if (!lines.includes(s)) lines.push(s); });
    marks.filter((s) => /^diem/.test(s)).forEach((s) => namesIn(s.slice(5)).forEach((n) => dots.add(n)));
    const dd = [...dots].filter((n) => made.has(n));
    if (dd.length) lines.push('diem ' + dd.join(' '));
    const hh = hidden.filter((n) => made.has(n));
    if (hh.length) lines.push('an ' + hh.join(' '));
    // câu có vẻ là dựng hình nhưng chưa hiểu
    sentences.forEach((snt, si) => {
      if (used.has(si)) return;
      if (/(chứng minh|tính|tìm|xác định|hỏi|so sánh|giải thích|vì sao)/i.test(snt)) return;
      if (base.i != null && t.indexOf(snt) <= base.i && t.indexOf(snt) + snt.length >= base.end) return;
      if (re('(PN)\\s+(?:là|thuộc)\\s+|kẻ\\s+|vẽ\\s+|sao cho|lấy điểm|dựng\\s+').test(snt)) unknown.push(snt.trim());
    });
    if (lines.filter((l) => /^[A-Z]/.test(l)).length < 2) return null;
    if (base.k === 'oxy' && !lines.some((l) => /^(doan|dagiac|vecto|duongtron|duongthang) /.test(l))) return null; // chỉ có điểm: không cần hình
    // Oxy: khung trục phủ cả các điểm dựng thêm (khi có src/plane.js để tính)
    if (base.k === 'oxy' && root.Plane && root.Plane.points) {
      try {
        const Q = root.Plane.points(lines.join('\n')), ps = Object.keys(Q).filter((n) => !/^Z\d+$/.test(n)).map((n) => Q[n]);
        const xs = ps.map((p) => p[0]).concat(0), ys = ps.map((p) => p[1]).concat(0);
        lines[0] = 'truc ' + [Math.floor(Math.min(...xs)) - 1, Math.ceil(Math.max(...xs)) + 1, Math.floor(Math.min(...ys)) - 1, Math.ceil(Math.max(...ys)) + 1].join(' ');
      } catch (err) { /* giữ khung theo các điểm cho trước */ }
    }
    return { kind: tpl || 'tamgiac', script: lines.join('\n'), notes, unknown };
  }

  const api = { space, plane, norm, lenVal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DeHinh = api;
})(this);
