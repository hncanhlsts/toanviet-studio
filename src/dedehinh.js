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
      .replace(/\\(widehat|angle)\s*\{?((?:[A-Z]'?){3})\}?/g, 'góc $2').replace(/\^\{?\\circ\}?/g, '°').replace(/\\cdot|\\times/g, '*')
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
    t.split(/[;.](?!\d)|,(?![^(]*\))|\s+và\s+|\s+với\s+/).forEach((cl) => {
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

  const api = { space, norm, lenVal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DeHinh = api;
})(this);
