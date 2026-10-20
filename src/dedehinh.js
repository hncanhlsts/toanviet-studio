// Đọc đề hình học không gian (tiếng Việt, cách viết của SGK) → kịch bản hình ToanViet (src/space.js), không cần AI.
// Nhận: hình chóp (thường, đều; đáy tam giác / vuông / chữ nhật / bình hành / thoi / thang), lăng trụ (đứng, xiên, đều),
// hình hộp, hình lập phương, tứ diện (thường, đều, ba cạnh đôi một vuông góc); vị trí đỉnh (SA ⊥ đáy, chóp đều, mặt bên
// vuông góc với đáy, hình chiếu của S); độ dài theo a; điểm phụ: trung điểm, giao điểm, tâm, trọng tâm, hình chiếu,
// "kẻ AH ⊥ SC", điểm chia đoạn theo tỉ số; nối các đoạn, mặt được nhắc tới. Câu không hiểu được liệt kê để giáo viên sửa.
(function (root) {
  'use strict';
  const PN = "[A-Z](?:'{1,2}|\\d(?!\\d|[.,]\\d))?"; // tên điểm: A, A', A'', G1 (viết G_1 trong đề)
  const re = (s, f) => new RegExp(s.replace(/PN/g, PN), f || '');
  const namesIn = (s) => String(s).match(re('PN', 'g')) || [];

  // chữ trong đề: bỏ $, đổi LaTeX sang kí hiệu thường
  function norm(t) {
    let s = String(t).replace(/\$+/g, ' ').replace(/\\(text|mathrm)\{([^{}]*)\}/g, '$2')
      .replace(/\^\{?\\prime\\prime\}?/g, "''").replace(/\^\{?\\prime\}?|′|’/g, "'")
      .replace(/\\perp/g, '⊥').replace(/\\(parallel|sslash)|⫽|∥/g, '∥').replace(/\\left|\\right/g, '')
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\sqrt\s*(\d+)/g, '√$1')
      .replace(/\\(widehat|angle)\s*\{?((?:[A-Z]'?){3}|[a-z][A-Z][a-z])\}?/g, 'góc $2').replace(/\\(widehat|hat|angle)\s*\{?([A-Z]'?)\}?/g, 'góc $2')
      .replace(/∠\s*/g, 'góc ').replace(/△\s*/g, 'tam giác ').replace(/\\(overrightarrow|vec)\s*\{?((?:[A-Z]'?){2})\}?/g, 'vectơ $2').replace(/\^\{?\\circ\}?/g, '°').replace(/\\cdot|\\times/g, '*')
      .replace(/([A-Z])_\{?(\d)\}?/g, '$1$2').replace(/\\(Delta|triangle)\s*/g, 'tam giác ').replace(/[Δ∆]\s*(?=[A-Z]{3}(?![A-Za-z]))/g, 'tam giác ').replace(/\\[,;: ]/g, ' ').replace(/\\(in)(?![a-z])/g, '∈').replace(/[{}]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    // chữ đầu câu của một từ tiếng Việt (Cho, Gọi, Kẻ, Lấy…) viết thường để mẫu câu khớp; tên điểm (hai chữ hoa) giữ nguyên
    // kể cả sau nhãn câu nhỏ "c) Trên…", "**b)** Gọi…"
    return s.replace(/(^|[.;:]\s+|\(\s*|(?:^|\s)\**[a-zđ]\)\**\s+)([A-ZÀ-ỸĐ])(?=[a-zà-ỹđ])/g, (m0, p, c) => p + c.toLowerCase());
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
    const t = apRules(norm(text)); // cách vẽ giáo viên đã dạy (ghi nhớ)
    const notes = [], unknown = [];
    let m;
    // ---------- 1. Khối chính ----------
    let kind = '', apex = '', base = [], top = [], regular = false, upright = true, solidKind = '';
    if ((m = re('(?:hình\\s+|khối\\s+)?chóp\\s+(?:(tam giác|tứ giác)\\s+)?(đều\\s+)?(?:(tam giác|tứ giác)\\s+(đều)\\s+)?([A-Z])\\s*\\.\\s*([A-Z]{3,6})').exec(t))) {
      kind = 'chop'; regular = !!(m[2] || m[4]); apex = m[5]; base = m[6].split('');
    } else if ((m = re("(?:hình\\s+|khối\\s+)?lăng trụ\\s+(đứng\\s+|đều\\s+)?(?:(tam giác|tứ giác)\\s+)?(đều\\s+)?((?:[A-Z]){3,4})\\s*\\.\\s*((?:[A-Z]'){3,4})").exec(t))) {
      kind = 'langtru'; base = m[4].split(''); top = namesIn(m[5]); regular = /đều/i.test((m[1] || '') + (m[3] || '')); upright = /đứng|đều/i.test((m[1] || '') + (m[3] || ''));
    } else if ((m = re("(?:hình|khối) hộp\\s*(chữ nhật)?\\s+([A-Z]{4})\\s*\\.\\s*((?:[A-Z]'){4})").exec(t))) {
      kind = 'langtru'; solidKind = m[1] ? 'hopcn' : 'hop'; base = m[2].split(''); top = namesIn(m[3]); upright = !!m[1];
    } else if ((m = re("(?:hình\\s+|khối\\s+)?lập phương\\s+([A-Z]{4})\\s*\\.\\s*((?:[A-Z]'){4})").exec(t))) {
      kind = 'langtru'; solidKind = 'lapphuong'; base = m[1].split(''); top = namesIn(m[2]); upright = true;
    } else if ((m = /tứ diện\s+(đều\s+)?([A-Z]{4})/i.exec(t))) {
      kind = 'tudien'; regular = !!m[1]; base = m[2].split('');
    } else {
      // khối tròn xoay: dựng theo mẫu của phần mềm (bán kính, chiều cao chỉnh ở khung Thuộc tính)
      const rt = /(?:hình|khối)\s+(nón cụt|nón|trụ|cầu)(?![a-zà-ỹ])|mặt\s+(cầu)(?![a-zà-ỹ])/.exec(t);
      if (!rt) return null;
      const k2 = { 'nón cụt': 'k_noncut', 'nón': 'k_non', 'trụ': 'k_tru', 'cầu': 'k_cau' }[rt[1] || rt[2]];
      return { kind: k2, script: '', round: true, notes: ['hình ' + (rt[1] || 'cầu') + ' theo mẫu'], unknown: [] };
    }
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
      const r1 = re('(?<![A-Za-z])((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng|theo thứ tự)?\\s*là\\s+(?:các\\s+)?trung điểm\\s+(?:của\\s+)?(?:các\\s+)?(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?|dây\\s+(?:cung\\s+)?)?((?:PN){2}(?:\\s*(?:,|và)\\s*(?:cạnh\\s+)?(?:PN){2})*)', 'g');
      while ((q = r1.exec(snt))) {
        const segs = listPairs(q[2]), ns0 = listNames(q[1]), ns = ns0.slice(Math.max(0, ns0.length - segs.length)); // "trọng tâm G và M là trung điểm của BC": chỉ M
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
      // G1, G2 lần lượt là trọng tâm của các tam giác ABC và ABD
      const r3l = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)+)\\s+lần lượt\\s+là\\s+(?:các\\s+)?trọng tâm\\s+(?:của\\s+)?(?:các\\s+)?(?:tam giác\\s+)?([A-Z]{3}(?:\\s*(?:,|và)\\s*(?:tam giác\\s+)?[A-Z]{3})+)', 'g');
      while ((q = r3l.exec(snt))) {
        const ns = listNames(q[1]), ts = q[2].match(/[A-Z]{3}/g);
        ns.forEach((n, i) => { const tr = ts[i] && ts[i].split(''); if (tr && tr.every((c) => p3[c] || base.includes(c))) add(n, tr, n + ' = trongtam(' + tr.map(nm).join(', ') + ')', 'trọng tâm'); });
        hit = true;
      }
      const r3 = re('(?:(PN)\\s+là\\s+(trọng tâm|tâm)|(trọng tâm|tâm)\\s+(PN))\\s+(?:của\\s+)?(?:mặt\\s+)?(?:đáy|hình vuông|hình chữ nhật|hình bình hành|hình thoi|tam giác(?:\\s+đều)?|tứ giác)?\\s*([A-Z]{3,4})?', 'g');
      while ((q = r3.exec(snt))) {
        const n = q[1] || q[4], ns = q[5] ? q[5].split('') : (q[0].includes('đáy') ? base : null);
        if (!n || !ns || ns.some((c) => !p3[c] && !base.includes(c))) continue;
        if (ns.length === 4) add(n, ns, n + ' = giao(' + nm(ns[0]) + ', ' + nm(ns[2]) + ', ' + nm(ns[1]) + ', ' + nm(ns[3]) + ')', 'tâm');
        else if (ns.length === 3) add(n, ns, n + ' = trongtam(' + ns.map(nm).join(', ') + ')', 'trọng tâm');
        hit = true;
      }
      // hình chiếu (vuông góc) của A trên SB / (SBC); M, N lần lượt là hình chiếu của A trên SB, SD
      const r4 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng|theo thứ tự)?\\s*là\\s+(?:các\\s+)?hình chiếu\\s+(?:vuông góc\\s+)?(?:của\\s+)?(?:điểm\\s+)?(PN)\\s+(?:trên|lên|xuống)\\s+((?:(?:đường thẳng|mặt phẳng)\\s+)?(?:\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2})(?:\\s*(?:,|và)\\s*(?:\\(\\s*(?:PN){3,4}\\s*\\)|(?:PN){2}))*)', 'g');
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
    // tên có chỉ số trong đề (G_1, G_2): nhãn viết chỉ số dưới
    [...made].filter((n) => /^[A-Z]\d$/.test(n)).forEach((n) => lines.push('nhan ' + n + ' = ' + n[0] + '_{' + n[1] + '}'));
    // câu có vẻ là dựng hình nhưng chưa hiểu
    sentences.forEach((snt, si) => {
      if (used.has(si)) return;
      if (/(chứng minh|tính|tìm|xác định|hỏi|so sánh|giải thích)/i.test(snt)) return;
      if (re('(PN)\\s+(?:là|thuộc)\\s+|kẻ\\s+|sao cho|lấy điểm|dựng\\s+').test(snt) && !/(?:hình|khối)\s+(?:chóp|lăng trụ|hộp|lập phương|tứ diện|nón|trụ|cầu)(?![a-zà-ỹ])|chóp\s+[A-Z]\s*\.|lăng trụ|lập phương|tứ diện|mặt cầu/i.test(snt)) unknown.push(snt.trim());
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
    let t = apRules(norm(text)); // cách vẽ giáo viên đã dạy (ghi nhớ) đổi câu trước khi đọc
    const notes = [], unknown = [], chuaHieu = [];
    // câu / tên hiển thị cho giáo viên: tên tia, đường thẳng viết thường như trong đề (OZ → Oz, XOY → xOy, XU → d)
    const hien = (s) => String(s).replace(/(?<![A-Za-zÀ-ỹ])[A-Z][A-Z']*(?![a-zà-ỹ])/g, (w) => w.split('').filter((c) => !lcHide.includes(c)).map((c) => lcLabel[c] || c).join(''));
    let m, q;
    // tên viết thường của tia, đường thẳng, góc (góc xOy, tia Ox, tia phân giác Ot, đường thẳng d, xy): đổi sang chữ hoa
    // chưa dùng trong đề để dựng như điểm; cuối cùng ghi lại nhãn viết thường (nhan X = x)
    const LC = {}, lcLabel = {}, lcHide = [];
    {
      const used = new Set(t.match(/[A-Z]/g) || []);
      const pool = 'XYZTUVWSRQPLKJG'.split('').filter((c) => !used.has(c));
      const take = () => pool.shift();
      const ray = new Set(), lineN = new Set();
      t.replace(/góc\s+(?:(?:nhọn|tù|vuông|bẹt)\s+)?([a-z])([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, a, o, b) => { ray.add(a); ray.add(b); return m0; });
      t.replace(/tia\s+(?:phân giác\s+)?([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, o, a) => { ray.add(a); return m0; });
      // "Oz là tia phân giác (của góc xOy)"
      t.replace(/(?<![A-Za-zÀ-ỹ])([A-Z])([a-z])\s+(?:là\s+)?(?:tia\s+)?(?:đường\s+)?phân giác/g, (m0, o, a) => { ray.add(a); return m0; });
      // các tiếp tuyến Ax và By (mọi tên dạng Ax trong cùng câu)
      t.replace(/tiếp tuyến[^.;]*/g, (seg) => { seg.replace(/(?<![A-Za-zÀ-ỹ])([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, o, a) => { ray.add(a); return m0; }); return seg; });
      t.replace(/đường thẳng\s+([a-z]{1,2})(?![A-Za-zÀ-ỹ])/g, (m0, a) => { lineN.add(a); return m0; });
      // tên góc viết kiểu xOy, mOn, yOz ở bất kì đâu (hai góc kề bù xOy và yOz…); hai đường thẳng a và b / a, b, c;
      // đường trung trực d
      t.replace(/(?<![A-Za-zÀ-ỹ\\])([a-z])([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, a, o, b) => { ray.add(a); ray.add(b); return m0; });
      t.replace(/đường thẳng\s+(?:song song\s+)?([a-z])(?:\s*(?:,|và)\s*([a-z])(?![A-Za-zÀ-ỹ]))(?:\s*(?:,|và)\s*([a-z])(?![A-Za-zÀ-ỹ]))?/g, (m0, a, b, c) => { [a, b, c].forEach((x) => x && lineN.add(x)); return m0; });
      t.replace(/đường trung trực\s+([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, a) => { lineN.add(a); return m0; });
      ray.forEach((a) => { if (!LC[a]) { const c = take(); if (c) { LC[a] = c; lcLabel[c] = a; } } });
      lineN.forEach((nm) => {
        if (nm.length === 2) nm.split('').forEach((a) => { if (!LC[a]) { const c = take(); if (c) { LC[a] = c; lcLabel[c] = a; } } });
        else if (!LC[nm]) { const c1 = take(), c2 = take(); if (c1 && c2) { LC[nm] = c1 + c2; lcLabel[c1] = nm; lcHide.push(c2); } }
      });
      if (Object.keys(LC).length) {
        const ln = (nm) => (nm.length === 2 ? (LC[nm[0]] && LC[nm[1]] ? LC[nm[0]] + LC[nm[1]] : '') : LC[nm] || '');
        t = t.replace(/(góc\s+(?:(?:nhọn|tù|vuông|bẹt)\s+)?)([a-z])([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, p, a, o, b) => (LC[a] && LC[b] ? p + LC[a] + o + LC[b] : m0));
        t = t.replace(/(?<![A-Za-zÀ-ỹ])([A-Z])([a-z])(?![A-Za-zÀ-ỹ'])/g, (m0, o, a) => (ray.has(a) && LC[a] ? o + LC[a] : m0));
        t = t.replace(/(?<![A-Za-zÀ-ỹ\\])([a-z])([A-Z])([a-z])(?![A-Za-zÀ-ỹ])/g, (m0, a, o, b) => (LC[a] && LC[b] && ray.has(a) && ray.has(b) ? LC[a] + o + LC[b] : m0));
        t = t.replace(/(đường thẳng|đường trung trực|song song|⊥|∥|vuông góc với|cắt|trên|thuộc|với|và|,)(\s*)([a-z]{1,2})(?![A-Za-zÀ-ỹ])/g, (m0, k, sp, nm) => (lineN.has(nm) && ln(nm) ? k + sp + ln(nm) : m0));
        t = t.replace(/(?<![A-Za-zÀ-ỹ])([a-z]{2})(?![A-Za-zÀ-ỹ])/g, (m0, nm) => (lineN.has(nm) && ln(nm) ? ln(nm) : m0));
      }
    }
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
    // số đo góc chỉ lấy ở phần giả thiết: "Chứng minh góc ABD = 90°", "Tính góc C" là điều phải tìm
    const tGiven = t.split(/(?<=[.;])\s+/).map((s) => s.replace(/(?:^|\s)(?:chứng minh|chứng tỏ|suy ra|từ đó|tính|so sánh|tìm|xác định)(?=\s|$)[\s\S]*$/i, '')).join(' ');
    tGiven.replace(re('góc\\s+(?:(?:nhọn|tù)\\s+)?((?:PN){1,3})\\s*(?:có\\s+)?(?:số đo\\s+)?(?:=|bằng|là)\\s*(\\d+(?:[.,]\\d+)?)\\s*°', 'g'), (m0, g, v) => { const ns = namesIn(g); ANG[ns.length === 3 ? ns[1] : ns[0]] = +v.replace(',', '.'); return m0; });
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
    // hai đường tròn (O) và (O') cắt nhau tại A và B / tiếp xúc ngoài (trong) tại A / ở ngoài nhau
    const cir2Re = re('hai\\s+đường tròn\\s*(?:\\(\\s*(PN)(?:\\s*;[^)]*)?\\)|tâm\\s+(PN))\\s+và\\s+(?:đường tròn\\s*)?(?:\\(\\s*(PN)(?:\\s*;[^)]*)?\\)|tâm\\s+(PN))\\s*(cắt nhau|tiếp xúc ngoài|tiếp xúc trong|tiếp xúc|ở ngoài nhau|ngoài nhau|không giao nhau|đựng nhau)?(?:\\s+(?:nhau\\s+)?tại\\s+(?:hai\\s+điểm\\s+)?(?:điểm\\s+)?(PN)(?:\\s+và\\s+(PN))?)?');
    if ((m = cir2Re.exec(t))) cand.push({ i: m.index - 0.1, end: m.index + m[0].length, k: 'cir2', o1: m[1] || m[2], o2: m[3] || m[4], rel: m[5] || 'cắt nhau', a: m[6] || '', b: m[7] || '' });
    // góc xOy (tên tia viết thường đã đổi sang chữ hoa ở trên), đoạn thẳng AB
    const angRe = re('góc\\s+(?:(nhọn|tù|vuông|bẹt|kề bù)\\s+)?(PN)(PN)(PN)(?![A-Za-z\'])');
    if ((m = angRe.exec(t)) && lcLabel[m[2]] && lcLabel[m[4]]) cand.push({ i: m.index, end: m.index + m[0].length, k: 'ang', o: m[3], a: m[2], b: m[4], type: m[1] || '' });
    const hexRe = re('lục giác đều\\s+([A-Z]{6})(?![A-Za-z\'])(?:\\s+(?:có\\s+)?tâm\\s+(?:là\\s+)?(PN)|\\s+nội tiếp\\s+(?:trong\\s+)?đường tròn\\s*(?:\\(\\s*(PN)|tâm\\s+(PN)))?');
    if ((m = hexRe.exec(t))) cand.push({ i: m.index, end: m.index + m[0].length, k: 'hex', name: m[1], o: m[2] || m[3] || m[4] || '', ins: !!(m[3] || m[4]) });
    const segRe0 = /đoạn thẳng\s+([A-Z])([A-Z])(?![A-Za-z'])/;
    if ((m = segRe0.exec(t))) cand.push({ i: m.index, end: m.index + m[0].length, k: 'seg', a: m[1], b: m[2] });
    // hình tự do lớp 6, 7 (không có đa giác, đường tròn): ba điểm thẳng hàng, hai tia đối nhau, một tia, hai đường thẳng
    // cắt nhau / song song, một đường thẳng và điểm nằm ngoài. Chỉ dùng khi không có hình chính nào khác.
    {
      const F = [
        ['coll', re('(?:ba\\s+điểm\\s+)?(?<![A-Za-z])(PN)\\s*,\\s*(PN)\\s*(?:,|và)\\s*(PN)\\s+thẳng hàng')],
        ['btw', re('(?:điểm\\s+)?(PN)\\s+nằm giữa\\s+(?:hai\\s+điểm\\s+)?(PN)\\s+và\\s+(PN)')],
        ['opp', re('(?:hai\\s+)?tia\\s+(?:(PN)(PN)\\s+và\\s+(PN)(PN)\\s+(?:là\\s+)?(?:hai\\s+tia\\s+)?đối nhau|đối nhau\\s+(PN)(PN)\\s+và\\s+(PN)(PN))')],
        ['x2', re('(?:hai\\s+)?(?:đường thẳng\\s+)?(?<![A-Za-z])(PN)(PN)\\s+và\\s+(?:đường thẳng\\s+)?(PN)(PN)\\s+cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])')],
        ['par', re('(?:hai\\s+)?đường thẳng\\s+(?:song song\\s+)?(PN)(PN)\\s+và\\s+(PN)(PN)(?:\\s+song song)?|(?<![A-Za-z])(PN)(PN)\\s*∥\\s*(PN)(PN)')],
        ['out', re('(?:điểm\\s+)?(PN)\\s+(?:nằm\\s+)?(?:ở\\s+)?ngoài\\s+đường thẳng\\s+(PN)(PN)|đường thẳng\\s+(PN)(PN)\\s+và\\s+(?:một\\s+)?điểm\\s+(PN)\\s+(?:không thuộc|nằm ngoài)')],
        ['ray', re('tia\\s+(PN)(PN)(?![A-Za-z])')],
      ];
      for (const [k, r0] of F) {
        if (!(m = r0.exec(t))) continue;
        if (k === 'par' && !/song song|∥/.test(m[0] + t.slice(m.index + m[0].length, m.index + m[0].length + 20))) continue;
        if (k === 'ray' && !lcLabel[m[2]]) continue;
        cand.push({ i: m.index + 0.5, end: m.index + m[0].length, k: 'free', f: k, g: m.slice(1).filter(Boolean), raw: m.slice(1) });
        break;
      }
    }
    const pts0 = [];
    if (/O\s*xy|toạ độ|tọa độ/.test(t)) {
      const pr = re('(?<![A-Za-z])(PN)\\s*\\(\\s*([-+−]?[\\d.,/()√]+)\\s*[;,]\\s*([-+−]?[\\d.,/()√]+)\\s*\\)', 'g');
      while ((q = pr.exec(t))) { const x = numEval(q[2]), y = numEval(q[3]); if (x != null && y != null && !pts0.some((p) => p[0] === q[1])) pts0.push([q[1], x, y]); }
      // đã đọc toạ độ: bỏ "(1; 2)" sau tên điểm để các câu "M(1; 2) là trung điểm của BC" khớp mẫu câu
      if (pts0.length) t = t.replace(pr, (m0, n, x, y) => (numEval(x) != null && numEval(y) != null ? n : m0));
    }
    const P = {}, lines = [], marks = [], made = new Set(), edges = new Set(), dots = new Set();
    const edge = (p, qq) => edges.add(key(p, qq));
    const cyc = (ns) => ns.forEach((n, i) => edge(n, ns[(i + 1) % ns.length]));
    let tickN = 0;
    const tick = (pairs) => { tickN++; marks.push('bang ' + pairs.join(' ') + ' = ' + Math.min(tickN, 4)); };
    const angMark = (ns, v) => { const i = ns.indexOf(v); if (i < 0 || ANG[v] == null || ANG[v] === 90) return; const a = ns[(i + ns.length - 1) % ns.length], b = ns[(i + 1) % ns.length]; marks.push('goc ' + a + v + b + ' = ' + lab(ANG[v]) + '^{\\circ}'); };
    let tpl = '', baseNames = [], cir = null, inscribed = false;
    cand.sort((a, b) => a.i - b.i);
    // hình chính phải được nêu trong câu dựng đề ("Cho tam giác…", "Xét…", "Vẽ…", "Từ điểm M…"), không phải câu nhắc qua;
    // hình tự do ở câu đầu của đề ("Hai đường thẳng AB và CD cắt nhau tại O.") cũng là câu dựng đề
    const valid = (c) => {
      const st = Math.max(t.lastIndexOf('.', c.i), t.lastIndexOf(';', c.i), t.lastIndexOf('#', c.i)) + 1;
      return /(^|\s)(cho|xét|vẽ|dựng|từ|lấy|gọi|trên)\s/i.test(t.slice(st, Math.ceil(c.i) + 1)) || (c.k === 'free' && /^\s*(?:#\w+\s*)?(?:\**(?:bài|câu|ví dụ)\s*\d+\s*[.:]?\**)?\s*$/i.test(t.slice(0, st)));
    };
    const ok = cand.filter(valid);
    // hình tự do (điểm, tia, đường thẳng) chỉ dùng khi đề không có đa giác, đường tròn, góc, đoạn thẳng làm hình chính
    let base = ok.find((c) => c.k !== 'free') || ok[0];
    if (pts0.length >= 2 && (!base || base.k !== 'cir')) base = { k: 'oxy' };
    if (!base) return null;
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
      // "tam giác ABC có AB = AC" (trong câu dựng đề): cân tại A; "vuông tại A có AB = AC": vuông cân
      {
        const sEnd = t.slice(base.i).search(/[.;](?!\d)/), sent = t.slice(base.i, sEnd < 0 ? undefined : base.i + sEnd);
        const eq = re('(PN)(PN)\\s*=\\s*(PN)(PN)').exec(sent), nm3 = base.name.split('');
        if (eq) {
          const s1 = [eq[1], eq[2]], s2 = [eq[3], eq[4]], v = s1.find((c) => s2.includes(c));
          if (v && [...s1, ...s2].every((c) => nm3.includes(c)) && new Set([...s1, ...s2]).size === 3) {
            if (/vuông/.test(base.type) && (!base.at || base.at === v)) { base.type = 'vuông cân'; base.at = v; }
            else if (!base.type || base.type === 'nhọn') { base.type = 'cân'; base.at = v; }
          }
        }
      }
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
        // phân giác góc A cắt đường tròn ngoại tiếp tại điểm chính giữa cung BC: tam giác lệch hẳn để A không sát điểm đối tâm
        else if (!b && !c && /phân giác[^.;]*cắt[^.;]*(?:đường tròn|\(\s*[A-Z]\s*\))/.test(t)) { D0[1] = 5.6; D0[2] = 3.9; }
        // đường tròn đường kính BC cắt AB, AC: tam giác cao hơn để hai giao điểm cách xa A và cách xa nhau
        else if (!b && !c && re('đường tròn\\s+(?:có\\s+)?đường kính\\s+(?:' + n1 + n2 + '|' + n2 + n1 + ')').test(t)) { D0[1] = 5.9; D0[2] = 5.4; }
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
        // tỉ số hai cạnh kề: "AB = 2BC", "AD = 2AB"
        const rk2 = re('(PN)(PN)\\s*=\\s*(\\d+(?:[.,]\\d+)?)\\s*(PN)(PN)').exec(tGiven);
        if (rk2) {
          const horiz = (x, y) => [A + B, B + A, C + D, D + C].includes(x + y), k = +rk2[3].replace(',', '.');
          const h1 = horiz(rk2[1], rk2[2]), h2 = horiz(rk2[4], rk2[5]);
          if (h1 !== h2) { if (w && !h) h = h1 ? w / k : w * k; else if (h && !w) w = h1 ? h * k : h / k; else if (!w && !h) { if (h1) { h = 3; w = 3 * k; } else { w = 4; h = 4 * k; } } }
        }
        if (w && !h) h = dg && dg > w ? Math.sqrt(dg * dg - w * w) : 0.57 * w; if (h && !w) w = dg && dg > h ? Math.sqrt(dg * dg - h * h) : h / 0.57; if (!w) { w = 5.6; h = 3.2; }
        P[D] = [0, 0]; P[C] = [w, 0]; P[B] = [w, h]; P[A] = [0, h];
        marks.push('vuong ' + A + D + C); tpl = 'chunhat';
      } else if (/bình hành/.test(ty)) {
        let a = g(A, B, g(C, D, 0)), b = g(A, D, g(B, C, 0));
        // tỉ số hai cạnh kề: "AD = 2AB", "AB = 2BC"
        const rkb = re('(PN)(PN)\\s*=\\s*(\\d+(?:[.,]\\d+)?)\\s*(PN)(PN)').exec(tGiven);
        if (rkb && !(a && b)) {
          const hz = (x, y) => [A + B, B + A, C + D, D + C].includes(x + y), k = +rkb[3].replace(',', '.'), h1 = hz(rkb[1], rkb[2]), h2 = hz(rkb[4], rkb[5]);
          if (h1 !== h2) { if (a) b = h1 ? a / k : a * k; else if (b) a = h1 ? b * k : b / k; else if (h1) { b = 2.6; a = 2.6 * k; } else { a = 3; b = 3 * k; } }
        }
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
        // hai cạnh đối kéo dài cắt nhau (AB cắt CD tại E, AD cắt BC tại F): đặt đỉnh để giao điểm cách tâm khoảng 1,7R
        // (đặt tuỳ ý thì giao điểm có thể ở rất xa, hình bị thu nhỏ, các điểm dồn vào nhau)
        const sd = (p, q2) => '(?:' + p + q2 + '|' + q2 + p + ')';
        const meet = t.split(/[.;]/).some((s) => /cắt/.test(s) && ((re(sd(A, B)).test(s) && re(sd(C, D)).test(s)) || (re(sd(A, D)).test(s) && re(sd(B, C)).test(s))));
        const o = (meet ? [135, 75, -55, 175] : [120, 30, -50, 205]).map((d) => d * Math.PI / 180);
        ns.forEach((n, i) => { P[n] = [3 * Math.cos(o[i]), 3 * Math.sin(o[i])]; });
        tpl = 'tgnoitiep';
      } else { P[D] = [0, 0]; P[C] = [6, 0]; P[B] = [5, 3.6]; P[A] = [0.8, 3.1]; tpl = 'tgnoitiep'; }
      notes.push(ty + ' ' + base.name);
      ns.forEach((v) => angMark(ns, v));
    } else if (base.k === 'ang') {
      // góc xOy: O ở gốc, tia Ox nằm ngang, tia Oy theo số đo (nhọn 55°, tù 125°, vuông 90°)
      const d = ANG[base.o] || { 'nhọn': 55, 'tù': 125, 'vuông': 90, 'bẹt': 180 }[base.type] || 60, R = d * Math.PI / 180;
      P[base.o] = [0, 0]; P[base.a] = [8, 0]; P[base.b] = [8 * Math.cos(R), 8 * Math.sin(R)]; // tia dài, nhãn x, y ở đầu mút
      tpl = 'goc'; notes.push('góc ' + lcLabel[base.a] + base.o + lcLabel[base.b]);
      // số đo cho trong đề: ghi lên hình (góc vuông: kí hiệu vuông)
      if (ANG[base.o] === 90) marks.push('vuong ' + base.a + base.o + base.b);
      else if (ANG[base.o]) marks.push('goc ' + base.a + base.o + base.b + ' = ' + lab(ANG[base.o]) + '^{\\circ}');
      // hai góc kề bù xOy và yOz: tia Oz là tia đối của tia Ox
      const kb = re('kề bù\\s+(?:góc\\s+)?(PN)(PN)(PN)\\s+và\\s+(?:góc\\s+)?(PN)(PN)(PN)').exec(t);
      if (kb && kb[2] === base.o && kb[5] === base.o) {
        const z = [kb[4], kb[6]].find((c) => c !== base.a && c !== base.b);
        if (z && !P[z]) { P[z] = [-8, 0]; base.extra = z; notes.push('góc kề bù'); }
      }
    } else if (base.k === 'hex') {
      // lục giác đều: A trên trái, đi theo chiều kim đồng hồ (như hình SGK); tâm O ở gốc
      const ns = base.name.split('');
      [120, 60, 0, -60, -120, 180].forEach((d, i) => { P[ns[i]] = [4 * Math.cos(d * Math.PI / 180), 4 * Math.sin(d * Math.PI / 180)]; });
      if (base.o) { P[base.o] = [0, 0]; dots.add(base.o); }
      if (base.ins) base.ext = ['duongtron ' + base.o + ' ' + base.name[0]];
      baseNames = ns; cyc(ns); tick(ns.map((n, i) => n + ns[(i + 1) % 6]));
      tpl = 'lucgiac'; notes.push('lục giác đều ' + base.name);
    } else if (base.k === 'seg') {
      const l = getL(base.a, base.b) || 6;
      P[base.a] = [0, 0]; P[base.b] = [l, 0]; edge(base.a, base.b); dots.add(base.a); dots.add(base.b); // đoạn thẳng: chấm hai đầu mút để phân biệt với đường thẳng (lớp 6)
      tpl = 'doan'; notes.push('đoạn thẳng ' + base.a + base.b);
    } else if (base.k === 'cir2') {
      // (O) bán kính 3 ở gốc, (O') bán kính nhỏ hơn bên phải, khoảng cách tâm theo vị trí tương đối
      const r1 = 3, rel = base.rel, inner = /trong|đựng/.test(rel), r2v = inner ? 1.8 : 2.2;
      const d = /tiếp xúc ngoài|^tiếp xúc$/.test(rel) ? r1 + r2v : /tiếp xúc trong/.test(rel) ? r1 - r2v : /đựng/.test(rel) ? 0.6 : /ngoài nhau|không giao/.test(rel) ? r1 + r2v + 2 : 4;
      const O1 = base.o1, O2 = base.o2;
      P[O1] = [0, 0]; P[O2] = [d, 0]; dots.add(O1); dots.add(O2);
      if (/cắt/.test(rel) && base.a) { const x = (d * d + r1 * r1 - r2v * r2v) / (2 * d), h = Math.sqrt(r1 * r1 - x * x); P[base.a] = [x, h]; if (base.b) P[base.b] = [x, -h]; }
      else if (/tiếp xúc/.test(rel) && base.a) P[base.a] = [r1, 0];
      base.c2 = { [O1]: [0, 0, r1], [O2]: [d, 0, r2v] };
      cir = { o: O1 }; rr = r1;
      notes.push('hai đường tròn (' + O1 + ') và (' + O2 + ') ' + rel);
      tpl = 'duongtron';
    } else if (base.k === 'free') {
      const g = base.g, ext = [];
      // đường thẳng đặt tên bằng hai điểm (AB, CD): vẽ kéo dài quá hai điểm, chấm hai điểm — phân biệt với đoạn thẳng như
      // SGK lớp 6; đường thẳng tên chữ thường (a, b, d, xy) vẽ như cũ, tên ở cuối nét
      const lineCmd = (a, b) => (lcLabel[a] || lcLabel[b] || lcHide.includes(a) || lcHide.includes(b) ? 'doan' : (dots.add(a), dots.add(b), 'duongthang'));
      if (base.f === 'coll' || base.f === 'btw') {
        // thứ tự trên đường thẳng: điểm nằm giữa ở giữa ("B nằm giữa A và C" có thể ở câu khác)
        let ord = base.f === 'btw' ? [g[1], g[0], g[2]] : g.slice();
        const bw = re('(PN)\\s+nằm giữa\\s+(?:hai\\s+điểm\\s+)?(PN)\\s+và\\s+(PN)').exec(t);
        if (base.f === 'coll' && bw && [bw[1], bw[2], bw[3]].every((c) => ord.includes(c))) ord = [bw[2], bw[1], bw[3]];
        [[0, 0], [3.2, 0], [7.5, 0]].forEach((p, i) => { P[ord[i]] = p; dots.add(ord[i]); });
        ext.push('duongthang ' + ord[0] + ord[2]); // ba điểm thẳng hàng: nằm trên một đường thẳng (vẽ kéo dài, các điểm được chấm) notes.push('ba điểm thẳng hàng ' + ord.join(', '));
      } else if (base.f === 'opp') {
        const [O, X, , Y] = g; P[O] = [0, 0]; P[X] = [6, 0]; P[Y] = [-6, 0]; dots.add(O);
        ext.push('doan ' + O + X + ' ' + O + Y); notes.push('hai tia đối nhau');
      } else if (base.f === 'ray') {
        const [O, X] = g; P[O] = [0, 0]; P[X] = [8, 0]; dots.add(O); ext.push('doan ' + O + X); notes.push('tia ' + O + (lcLabel[X] || X));
      } else if (base.f === 'x2') {
        const [A, B, C, D, O] = g; P[O] = [0, 0]; P[A] = [-5, -1.6]; P[B] = [5, 1.6]; P[C] = [-1.8, 4.2]; P[D] = [1.8, -4.2];
        ext.push(lineCmd(A, B) + ' ' + A + B, lineCmd(C, D) + ' ' + C + D); notes.push('hai đường thẳng cắt nhau tại ' + O);
      } else if (base.f === 'par') {
        const [A, B, C, D] = g; P[A] = [-5, 2]; P[B] = [5, 2]; P[C] = [-5, -1.2]; P[D] = [5, -1.2];
        ext.push(lineCmd(A, B) + ' ' + A + B, lineCmd(C, D) + ' ' + C + D); notes.push('hai đường thẳng song song');
      } else if (base.f === 'out') {
        const w = base.raw, [A, X, Y] = w[0] ? [w[0], w[1], w[2]] : [w[5], w[3], w[4]];
        P[X] = [-5, 0]; P[Y] = [5, 0]; P[A] = [-0.6, 3.2]; dots.add(A);
        ext.push('doan ' + X + Y); notes.push('điểm ' + A + ' nằm ngoài đường thẳng');
      }
      // đường thẳng đặt tên chữ thường còn lại (đường thẳng c cắt a tại A và cắt b tại B): một cát tuyến xiên
      const tv = [[-1.6, 4.4], [1.6, -3.6], [-3.5, -3.8], [3.5, 4.2]];
      Object.keys(LC).filter((k2) => k2.length === 1 && LC[k2].length === 2).forEach((k2, i) => {
        const [c1, c2] = LC[k2].split(''); if (P[c1] || P[c2] || i > 1) return;
        P[c1] = tv[2 * (i % 2)]; P[c2] = tv[2 * (i % 2) + 1]; ext.push('doan ' + c1 + c2);
      });
      base.ext = ext; tpl = 'doan';
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
    if (base.k === 'ang') lines.push('doan ' + base.o + base.a + ' ' + base.o + base.b + (base.extra ? ' ' + base.o + base.extra : ''));
    if (base.k === 'seg') lines.push('doan ' + base.a + base.b);
    if ((base.k === 'free' || base.k === 'hex') && base.ext) base.ext.forEach((l) => lines.push(l));
    // đường tròn chính / đường tròn ngoại tiếp đa giác nội tiếp
    const circPool = [];
    if (base.k === 'cir') {
      cir = { o: base.o };
      lines.push('r = ' + r2(rr) + '   # Bán kính');
      lines.push(base.o + ' = (0, 0)'); made.add(base.o); dots.add(base.o);
      if (base.dia) { lines.push(base.dia[0] + ' = tron(' + base.o + ', r, 180)', base.dia[1] + ' = tron(' + base.o + ', r, 0)'); base.dia.forEach((n) => made.add(n)); lines.push('doan ' + base.dia.join('')); edge(base.dia[0], base.dia[1]); circPool.push(65, 125, 35, 150, -60, -120); }
      else circPool.push(70, 215, 325, 120, 30, -50, 160);
      lines.push(base.half && base.dia ? 'cung ' + base.o + ' ' + base.dia[1] + ' ' + base.dia[0] : 'duongtron ' + base.o + ' r');
      notes.push('đường tròn (' + base.o + (rTex ? '; ' + rTex : '') + ')' + (base.dia ? ', đường kính ' + base.dia.join('') : ''));
      tpl = 'duongtron';
    } else if (base.k === 'cir2') {
      const ks = Object.keys(base.c2);
      lines.unshift('r = ' + r2(base.c2[ks[0]][2]) + '   # Bán kính (' + ks[0] + ')');
      lines.push('duongtron ' + ks[0] + ' r', 'duongtron ' + ks[1] + ' ' + r2(base.c2[ks[1]][2]));
      circPool.push(110, 200, 250, 150);
    } else if (inscribed) {
      const o = cir.o || 'O';
      lines.push(o + ' = tamngoai(' + baseNames.slice(0, 3).join(', ') + ')', 'duongtron ' + o + ' ' + baseNames[0]);
      made.add(o); dots.add(o); notes.push('nội tiếp đường tròn (' + o + ')');
    }

    // ---------- 3. Điểm phụ ----------
    const cons = [];
    const onSeg = {}; // điểm lấy trên một đoạn / tia → hai đầu (để quyết định có chấm điểm hay không)
    const rArg = base.k === 'cir' || base.k === 'cir2' ? 'r' : baseNames[0];
    const isDef = (n) => made.has(n) || cons.some((c) => c.name === n);
    const add = (name, need, line, src, more) => { if (!isDef(name) && !(uuTien.has(name) && !curUser)) cons.push({ name, need, line, src, more: more || [] }); };
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
    // câu mô tả lại một điểm do giáo viên viết (ghi nhớ theo từng điểm): "⁂E: E là giao điểm của Bx và AD"
    // — điểm E chỉ dựng theo câu này, bỏ cách đọc khác của đề cho E
    const uuTien = new Set(), userSi = new Set();
    const sentences = t.split(/(?<=[.;])\s+|\.\s*$/).filter(Boolean).map((s0, si) => s0.replace(re('^\\s*⁂(PN):\\s*'), (m0, n) => { uuTien.add(n); userSi.add(si); return ''; }));
    t = t.replace(re('⁂(PN):\\s*', 'g'), '');
    let curUser = false;
    const used = new Set();
    const onCirc = [], chordFirst = []; // dây cung cho trước (dây BC cố định): hai đầu nằm dưới, điểm khác trên cung lớn
    const lineThrough = {}, linePts = {}; // đường thẳng (hai điểm phụ) → điểm nó đi qua; số điểm đã lấy trên đó
    const vtx = (P0) => (base.k === 'tri' && baseNames.includes(P0)) || (base.k === 'quad' && baseNames.includes(P0));
    // đường tròn đã có: tâm → bán kính (điểm trên đường tròn hoặc thông số r); điểm nằm trên đường tròn chính
    const circReg = {}, circOn = {}, diaReg = {}; // tâm → bán kính; tâm → điểm đã nằm trên đường tròn; đường kính → tâm phụ
    if (cir && cir.o) circReg[cir.o] = rArg;
    if (base.k === 'cir2') { const ks = Object.keys(base.c2); circReg[ks[1]] = r2(base.c2[ks[1]][2]); }
    let lastC = cir && cir.o ? cir.o : '';
    const onC = new Set(base.k === 'cir' && base.dia ? base.dia : inscribed ? baseNames : base.k === 'cir2' ? [base.a, base.b].filter(Boolean) : []);
    const tanH = {}; // tiếp tuyến tại X → [Z1, Z2] (hai điểm phụ trên tiếp tuyến)
    const tanAt = (X, O) => { if (tanH[X]) return tanH[X]; const h1 = helper(), h2 = helper(); hidden.push(h1, h2); cons.push({ name: h1, need: [X, O], line: h1 + ' = quay(' + O + ', ' + X + ', 90)\n' + h2 + ' = quay(' + O + ', ' + X + ', -90)', src: '', more: ['vuong ' + O + X + h1] }); cons.push({ name: h2, need: [h1], line: '', src: '', more: [] }); tanH[X] = [h1, h2]; return tanH[X]; };
    const cOf = (s) => { const m2 = re('\\(\\s*(PN)\\s*(?:;[^)]*)?\\)').exec(s || ''); return m2 && circReg[m2[1]] !== undefined ? m2[1] : lastC; };
    sentences.forEach((snt0, si) => {
      let hit = false, tanDone = false;
      curUser = userSi.has(si);
      // dữ kiện để dựng hình: bỏ phần "chứng minh / suy ra / từ đó…" (đó là điều phải chứng minh, không phải dữ kiện),
      // nhưng giữ các chú thích "(với AD là đường kính…)"
      const cutAt = snt0.search(/(?:^|\s)(?:chứng minh|suy ra|từ đó|chứng tỏ)(?:\s|$)/i);
      const snt = cutAt < 0 ? snt0 : snt0.slice(0, cutAt) + ' ' + (snt0.slice(cutAt).match(/\(\s*với[^()]*(?:\([^()]*\)[^()]*)*\)|với\s+mọi\s+điểm[^.;]*/g) || []).join(' ');
      // đường kính XY (X đã có): Y đối xứng với X qua tâm; "AD là đường kính của (O)"
      const rdk = re('(?:(?:kẻ|vẽ)\\s+)?đường kính\\s+(PN)(PN)(?![A-Za-z])(?:\\s+của\\s+(?:đường tròn\\s*)?\\(\\s*(PN))?|(PN)(PN)\\s+là\\s+(?:một\\s+)?đường kính(?:\\s+của\\s+(?:đường tròn\\s*)?\\(\\s*(PN))?', 'g');
      while ((q = rdk.exec(snt))) {
        const X = q[1] || q[4], Y = q[2] || q[5], O = q[3] || q[6] || lastC;
        if (!O || circReg[O] === undefined) continue;
        if (isDef(X) && !isDef(Y)) { add(Y, [X, O], Y + ' = doixung(' + X + ', ' + O + ')', 'đường kính', ['doan ' + X + Y]); if (O === (cir && cir.o)) onC.add(Y); hit = true; }
        else if (isDef(Y) && !isDef(X)) { add(X, [Y, O], X + ' = doixung(' + Y + ', ' + O + ')', 'đường kính', ['doan ' + X + Y]); if (O === (cir && cir.o)) onC.add(X); hit = true; }
      }
      // đường tròn tâm O đường kính AH (đường tròn phụ, có tên tâm)
      const rdt = re('đường tròn\\s+tâm\\s+(PN)\\s*,?\\s*đường kính\\s+(PN)(PN)', 'g');
      while ((q = rdt.exec(snt))) { if (!isDef(q[1])) { add(q[1], [q[2], q[3]], q[1] + ' = trungdiem(' + q[2] + ', ' + q[3] + ')', 'tâm đường tròn', ['duongtron ' + q[1] + ' ' + q[2], 'diem ' + q[1]]); circReg[q[1]] = q[2]; circOn[q[1]] = [q[2], q[3]]; lastC = q[1]; hit = true; } }
      // đường tròn (này) cắt các cạnh AB và AC lần lượt tại D và E (khác A)
      // đường tròn (này / (O) / đường kính BC) cắt AB, AC lần lượt tại E và D: giao điểm khác điểm đã nằm trên đường tròn
      const rcc = re('đường tròn\\s*(?:này|\\(\\s*(PN)\\s*\\)|đường kính\\s+(PN)(PN))?\\s+cắt\\s+(?:các\\s+)?(?:cạnh\\s+|đường thẳng\\s+|đoạn thẳng\\s+)?(PN)(PN)\\s*(?:,|và)\\s*(?:cạnh\\s+)?(PN)(PN)\\s+(?:lần lượt\\s+)?tại\\s+(?:các\\s+điểm\\s+|điểm\\s+)?(PN)\\s*(?:,|và)\\s*(PN)', 'g');
      while ((q = rcc.exec(snt))) {
        let O = q[1] || lastC;
        if (q[2]) {
          const k = [q[2], q[3]].sort().join('');
          if (!diaReg[k]) { const h = helper(); hidden.push(h); cons.push({ name: h, need: [q[2], q[3]], line: h + ' = trungdiem(' + q[2] + ', ' + q[3] + ')', src: '', more: ['duongtron ' + h + ' ' + q[2]] }); diaReg[k] = h; circReg[h] = q[2]; circOn[h] = [q[2], q[3]]; }
          O = diaReg[k]; lastC = O;
        }
        const s1 = [q[4], q[5]], s2 = [q[6], q[7]], A0 = s1.find((c) => s2.includes(c)) || s1[0];
        if (!O || circReg[O] === undefined) continue;
        const on = (c) => (circOn[O] || []).includes(c) || (O === (cir && cir.o) && onC.has(c));
        [[s1, q[8]], [s2, q[9]]].forEach(([sg, n]) => {
          if (isDef(n)) return;
          const o2 = sg.find((c) => c !== A0) || sg[1], ex = on(o2) ? o2 : A0;
          add(n, [A0, o2, O], n + ' = giaotronkhac(' + A0 + ', ' + o2 + ', ' + O + ', ' + circReg[O] + ', ' + ex + ')', 'giao với đường tròn');
          (circOn[O] = circOn[O] || []).push(n);
        });
        hit = true;
      }
      // cát tuyến SCD từ điểm S ngoài đường tròn (C nằm giữa S và D)
      const rct = re('cát tuyến\\s+(PN)(PN)(PN)(?![A-Za-z])', 'g');
      while ((q = rct.exec(snt))) {
        const [S, Cc, Dd] = [q[1], q[2], q[3]], O = cOf(snt) || (cir && cir.o);
        if (!O || isDef(Cc) || isDef(Dd)) continue;
        const h = helper(); hidden.push(h);
        // "tia SD nằm giữa hai tia SO và SB": hướng cát tuyến giữa hai tia đó
        const bt = re('tia\\s+' + S + Dd + '\\s+nằm giữa\\s+(?:hai\\s+)?tia\\s+' + S + '(PN)\\s+và\\s+' + S + '(PN)').exec(t);
        const hl = bt ? h + ' = chia(' + bt[1] + ', ' + bt[2] + ', 0.55)' : h + ' = quay(' + O + ', ' + S + ', 14)';
        add(Cc, [S, O].concat(bt ? [bt[1], bt[2]] : []), hl + '\n' + Cc + ' = giaotron(' + S + ', ' + h + ', ' + O + ', ' + circReg[O] + ', 1)\n' + Dd + ' = giaotron(' + S + ', ' + h + ', ' + O + ', ' + circReg[O] + ', 2)', 'cát tuyến', ['doan ' + S + Dd]);
        cons.push({ name: Dd, need: [Cc], line: '', src: '', more: [] }); onC.add(Cc); onC.add(Dd); hit = true;
      }
      // điểm trên cung nhỏ / cung lớn BC
      const rcg = re('(PN)\\s+(?:di động\\s+|bất k[ìỳ]\\s+)?(?:nằm\\s+)?(?:trên|thuộc)\\s+cung\\s+(nhỏ|lớn)\\s+(PN)(PN)', 'g');
      while ((q = rcg.exec(snt))) {
        const n = q[1], O = cOf(snt) || (cir && cir.o); if (isDef(n) || !O) continue;
        const h = helper(); hidden.push(h);
        const hl = q[2] === 'nhỏ' ? h + ' = chia(' + q[3] + ', ' + q[4] + ', 0.38)' : helper() + ' = chia(' + q[3] + ', ' + q[4] + ', 0.62)';
        const line = q[2] === 'nhỏ' ? hl + '\n' + n + ' = dat(' + O + ', ' + h + ', ' + O + ', ' + q[3] + ')' : hl + '\n' + h + ' = doixung(Z' + hid + ', ' + O + ')\n' + n + ' = dat(' + O + ', ' + h + ', ' + O + ', ' + q[3] + ')';
        if (q[2] !== 'nhỏ') hidden.push('Z' + hid);
        add(n, [q[3], q[4], O], line, 'điểm trên cung'); onC.add(n); hit = true;
      }
      // đường thẳng XY cắt đường tròn (O) tại (điểm thứ hai) N (N khác X); "N là giao điểm của đường thẳng EF và (O)"
      const rxc = re('(?:(?:đoạn thẳng|đường thẳng|tia)\\s+)?(?<![A-Za-z])(PN)(PN)\\s+cắt\\s+(?:lại\\s+)?(?:đường tròn\\s*)?(\\(\\s*PN\\s*(?:;[^)]*)?\\)|đường tròn(?:\\s+này)?)\\s+tại\\s+(?:điểm\\s+)?(?:thứ hai\\s+)?(?:là\\s+)?(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      const rxg = re('(PN)\\s+là\\s+giao điểm\\s+(?:thứ hai\\s+)?của\\s+(?:đường thẳng\\s+|tia\\s+|đoạn thẳng\\s+)?(PN)(PN)\\s+(?:và|với)\\s+(?:đường tròn\\s*)?(\\(\\s*PN\\s*(?:;[^)]*)?\\))', 'g');
      const lineCirc = (X, Y, cs, n) => {
        const O = cOf(cs); if (!O || isDef(n) || !isDef(X) || !isDef(Y)) return false;
        const R = circReg[O];
        let line;
        const bw = re('(PN)\\s+nằm giữa\\s+' + n + '\\s+và\\s+(PN)|(PN)\\s+nằm giữa\\s+(PN)\\s+và\\s+' + n).exec(t);
        if (bw) { const mid = bw[1] || bw[3], far = bw[2] || bw[4]; line = n + ' = giaotron(' + far + ', ' + mid + ', ' + O + ', ' + R + ', 2)'; }
        else if (onC.has(X) && O === (cir && cir.o)) line = n + ' = giaotronkhac(' + X + ', ' + Y + ', ' + O + ', ' + R + ', ' + X + ')';
        else if (onC.has(Y) && O === (cir && cir.o)) line = n + ' = giaotronkhac(' + X + ', ' + Y + ', ' + O + ', ' + R + ', ' + Y + ')';
        else line = n + ' = giaotron(' + X + ', ' + Y + ', ' + O + ', ' + R + ', 2)';
        add(n, [X, Y, O], line, 'giao với đường tròn', ['doan ' + X + n + ' ' + Y + n]); if (O === (cir && cir.o)) onC.add(n);
        return true;
      };
      while ((q = rxc.exec(snt))) if (lineCirc(q[1], q[2], q[3], q[4])) hit = true;
      while ((q = rxg.exec(snt))) if (lineCirc(q[2], q[3], q[4], q[1])) hit = true;
      // qua B kẻ đường thẳng song song (vuông góc) với AC, cắt đường tròn (O) tại điểm thứ hai D
      const rqc = re('qua\\s+(?:điểm\\s+)?(PN)\\s*,?\\s*(?:kẻ|vẽ)?\\s*(?:đường thẳng|tia)?\\s*(song song|vuông góc)\\s+với\\s+(?:đường thẳng\\s+)?(PN)(PN)\\s*,?\\s*(?:và\\s+)?cắt\\s+(?:đường tròn\\s*)?(\\(\\s*PN\\s*\\))\\s+tại\\s+(?:điểm\\s+)?(?:thứ hai\\s+)?(?:là\\s+)?(?:điểm\\s+)?(PN)', 'g');
      while ((q = rqc.exec(snt))) {
        const P0 = q[1], [X, Y] = [q[3], q[4]], n = q[6], O = cOf(q[5]); if (isDef(n) || !O) continue;
        const h = helper(), h2 = helper(); hidden.push(h, h2);
        const hl = q[2] === 'song song' ? h + ' = tinhtien(' + P0 + ', ' + X + ', ' + Y + ')\n' + h2 + ' = chia(' + P0 + ', ' + h + ', 1)' : h2 + ' = tinhtien(' + P0 + ', ' + X + ', ' + Y + ')\n' + h + ' = quay(' + h2 + ', ' + P0 + ', 90)';
        add(n, [P0, X, Y, O], hl + '\n' + n + ' = giaotronkhac(' + P0 + ', ' + h + ', ' + O + ', ' + circReg[O] + ', ' + P0 + ')', 'đường song song cắt đường tròn', ['doan ' + P0 + n]);
        if (O === (cir && cir.o)) onC.add(n); hit = true;
      }
      // tia phân giác góc A cắt cạnh BC tại D và cắt đường tròn (O) tại M
      const rpc = re('phân giác\\s+(?:của\\s+)?(?:góc\\s+)?((?:PN){3}|PN)\\s+cắt\\s+(?:cạnh\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)\\s+và\\s+cắt\\s+(?:đường tròn\\s*)?(\\(\\s*PN\\s*\\))\\s+tại\\s+(?:điểm\\s+)?(PN)', 'g');
      while ((q = rpc.exec(snt))) {
        const g3 = namesIn(q[1]), V = g3.length === 3 ? g3[1] : g3[0], O = cOf(q[5]), n = q[6];
        if (isDef(n) || !O) continue;
        // D có thể chưa dựng ở bước này (mẫu "phân giác … cắt BC tại D" xử lý sau): cần D
        if (!isDef(q[4])) add(q[4], [V, q[2], q[3]], q[4] + ' = phangiacgoc(' + [q[2], V, q[3], q[2], q[3]].join(', ') + ')', 'phân giác', ['doan ' + V + q[4], 'goc ' + q[2] + V + q[4] + ' ' + q[4] + V + q[3]]);
        add(n, [V, q[4], O], n + ' = giaotronkhac(' + V + ', ' + q[4] + ', ' + O + ', ' + circReg[O] + ', ' + V + ')', 'phân giác cắt đường tròn', ['doan ' + q[4] + n]);
        if (O === (cir && cir.o)) onC.add(n); hit = true;
      }
      // M là điểm chính giữa (của) cung nhỏ / cung lớn BC
      const rcm = re('(PN)\\s+là\\s+điểm chính giữa\\s+(?:của\\s+)?cung\\s+(?:(nhỏ|lớn)\\s+)?(PN)(PN)|điểm chính giữa\\s+(PN)\\s+(?:của\\s+)?cung\\s+(?:(nhỏ|lớn)\\s+)?(PN)(PN)', 'g');
      while ((q = rcm.exec(snt))) {
        const n = q[1] || q[5], kind = q[2] || q[6] || 'nhỏ', B0 = q[3] || q[7], C0 = q[4] || q[8], O = cOf(snt) || (cir && cir.o);
        if (!O || isDef(n)) continue;
        // trung điểm dây → tia từ tâm qua đó cắt cung nhỏ; cung lớn: điểm đối xứng qua tâm
        const h = helper(), h2 = helper(); hidden.push(h, h2);
        const line = h + ' = trungdiem(' + B0 + ', ' + C0 + ')\n' + (kind === 'nhỏ' ? n + ' = dat(' + O + ', ' + h + ', ' + O + ', ' + B0 + ')' : h2 + ' = dat(' + O + ', ' + h + ', ' + O + ', ' + B0 + ')\n' + n + ' = doixung(' + h2 + ', ' + O + ')');
        add(n, [B0, C0, O], line, 'điểm chính giữa cung');
        onC.add(n); hit = true;
      }
      // tiếp tuyến tại C cắt (hai) tiếp tuyến tại A và B lần lượt tại M và N
      const rt3 = re('tiếp tuyến\\s+tại\\s+(PN)\\s+cắt\\s+(?:hai\\s+)?(?:các\\s+)?tiếp tuyến\\s+tại\\s+(PN)\\s+và\\s+(PN)[^.;]*?lần lượt\\s+tại\\s+(?:điểm\\s+)?(PN)\\s+và\\s+(PN)', 'g');
      while ((q = rt3.exec(snt))) {
        const O = cOf(snt) || (cir && cir.o); if (!O) continue;
        const tc = tanAt(q[1], O), ta = tanAt(q[2], O), tb = tanAt(q[3], O);
        [[ta, q[4], q[2]], [tb, q[5], q[3]]].forEach(([tx, n, X]) => add(n, [tc[1], tx[1]], n + ' = giao(' + tc.join(', ') + ', ' + tx.join(', ') + ')', 'giao hai tiếp tuyến', ['doan ' + X + n]));
        cons.push({ name: '', need: [q[4], q[5]], line: '', src: '', more: ['doan ' + q[4] + q[5]] }); hit = true; tanDone = true;
      }
      // tiếp tuyến tại D (của đường tròn (O)) cắt (đường thẳng) BC tại K
      const rtk = re('tiếp tuyến\\s+tại\\s+(?:điểm\\s+)?(PN)\\s+(?:của\\s+(?:đường tròn\\s*)?(\\(\\s*PN\\s*(?:;[^)]*)?\\))\\s+)?cắt\\s+(?:đường thẳng\\s+|cạnh\\s+|tia\\s+|đoạn thẳng\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rtk.exec(snt))) {
        const O = cOf(q[2] || snt), n = q[5]; if (!O || isDef(n) || (cir && cir.o === O)) continue; // đường tròn chính: xử lý ở mẫu "tiếp tuyến tại …" phía dưới (vẽ tia)
        const tx = tanAt(q[1], O);
        add(n, [tx[1], q[3], q[4]], n + ' = giao(' + tx.join(', ') + ', ' + q[3] + ', ' + q[4] + ')', 'giao của tiếp tuyến', ['doan ' + q[1] + n + ' ' + q[3] + n + ' ' + q[4] + n]); hit = true; tanDone = true;
      }
      // tia đối của tia EC cắt tiếp tuyến tại B (của (O)) tại S
      const rtd = re('tia đối của tia\\s+(PN)(PN)\\s+cắt\\s+tiếp tuyến\\s+tại\\s+(PN)[^.;]*?\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rtd.exec(snt))) {
        const O = cOf(snt) || (cir && cir.o), n = q[4]; if (!O || isDef(n)) continue;
        const tb = tanAt(q[3], O);
        add(n, [q[1], q[2], tb[1]], n + ' = giao(' + q[1] + ', ' + q[2] + ', ' + tb.join(', ') + ')', 'giao với tiếp tuyến', ['doan ' + q[2] + n + ' ' + q[3] + n]); hit = true; tanDone = true;
      }
      // hai đường tròn: tiếp tuyến chung ngoài (trong) BC, B thuộc (O), C thuộc (O')
      const rtc = re('tiếp tuyến chung\\s+(ngoài|trong)?\\s*(PN)(PN)(?![A-Za-z])', 'g');
      while (base.c2 && (q = rtc.exec(snt))) {
        const ks = Object.keys(base.c2), [x1, , ra] = base.c2[ks[0]], [x2, , rb] = base.c2[ks[1]], d = x2 - x1;
        let [B0, C0] = [q[2], q[3]];
        const own = re('(PN)\\s*(?:∈|thuộc)\\s*\\(\\s*(PN)').exec(t); if (own && own[1] === C0 && own[2] === ks[0]) [B0, C0] = [C0, B0];
        if (isDef(B0) || isDef(C0)) continue;
        const inner = q[1] === 'trong', ph = Math.acos(inner ? (ra + rb) / d : (ra - rb) / d);
        if (!isFinite(ph)) continue;
        const pB = [x1 + ra * Math.cos(ph), ra * Math.sin(ph)], pC = inner ? [x2 - rb * Math.cos(ph), -rb * Math.sin(ph)] : [x2 + rb * Math.cos(ph), rb * Math.sin(ph)];
        add(B0, [], B0 + ' = (' + r2(pB[0]) + ', ' + r2(pB[1]) + ')', 'tiếp tuyến chung', ['doan ' + B0 + C0 + ' ' + ks[0] + B0 + ' ' + ks[1] + C0, 'vuong ' + ks[0] + B0 + C0 + ' ' + ks[1] + C0 + B0]);
        add(C0, [], C0 + ' = (' + r2(pC[0]) + ', ' + r2(pC[1]) + ')', 'tiếp tuyến chung');
        hit = true;
      }
      // tiếp tuyến Ax tại điểm A của đường tròn (tên tia viết thường)
      // (các) tiếp tuyến Ax và By: hai tiếp tuyến tại hai đầu đường kính vẽ về cùng một phía như hình SGK
      const rtx = re('tiếp tuyến\\s+((?:PN)(?:PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*)(?![A-Za-z])', 'g');
      while ((q = rtx.exec(snt))) {
        const O = cOf(snt) || (cir && cir.o);
        listPairs(q[1]).map(namesIn).forEach(([A0, X]) => {
          if (!O || !X || !lcLabel[X] || isDef(X) || !(onC.has(A0) || isDef(A0))) return;
          const sg = base.dia && A0 === base.dia[1] ? -90 : 90;
          add(X, [A0, O], X + ' = quay(' + O + ', ' + A0 + ', ' + sg + ')', 'tiếp tuyến', ['doan ' + A0 + X, 'vuong ' + O + A0 + X]); hit = true;
        });
      }
      // tiếp tuyến tại M cắt Ax, By (hai đường thẳng) lần lượt tại C và D
      const rt2l = re('tiếp tuyến\\s+tại\\s+(?:điểm\\s+)?(PN)\\s+(?:của\\s+[^,]*?\\s+)?cắt\\s+(?:các\\s+(?:tiếp tuyến|đường thẳng)\\s+)?(PN)(PN)\\s*(?:,|và)\\s*(PN)(PN)\\s+(?:lần lượt\\s+)?tại\\s+(?:điểm\\s+)?(PN)\\s*(?:,|và)\\s*(PN)', 'g');
      while ((q = rt2l.exec(snt))) {
        const O = cOf(snt) || (cir && cir.o); if (!O) continue;
        const tm = tanAt(q[1], O);
        [[q[2], q[3], q[6]], [q[4], q[5], q[7]]].forEach(([U, V, n]) => {
          // tia Ax (tên chữ thường) đã dựng ngắn: hướng chuyển sang điểm phụ, đầu tia x đặt quá giao điểm để chữ x ở cuối nét
          let dir = V; const cx = cons.find((c) => c.name === V && /= quay\(/.test(c.line));
          if (cx && lcLabel[V]) {
            dir = helper(); hidden.push(dir);
            cons.push({ name: dir, need: cx.need, line: cx.line.replace(new RegExp('^' + V + ' ='), dir + ' ='), src: '', more: [] });
            cx.line = V + ' = chia(' + U + ', ' + n + ', 1.3)'; cx.need = [U, n];
          }
          add(n, [tm[1], U, dir], n + ' = giao(' + tm.join(', ') + ', ' + U + ', ' + dir + ')', 'giao của tiếp tuyến', ['doan ' + U + n]);
        });
        cons.push({ name: '', need: [q[6], q[7]], line: '', src: '', more: ['doan ' + q[6] + q[7]] }); hit = true; tanDone = true;
      }
      // đẳng thức vectơ cho một điểm chưa có: MA + MB + 2MC = 0, AM = 2MB, 3MB + MC = 0, AM + 2BM − CM = 0
      {
        const CO = '(?:\\d+(?:[.,]\\d+)?|\\(\\d+\\)/\\(\\d+\\))';
        const TERM = '([+-]?)\\s*(' + CO + ')?\\s*\\*?\\s*vectơ\\s*(PN)(PN)';
        const SIDE = '(?:[+-]?\\s*' + CO + '?\\s*\\*?\\s*vectơ\\s*(?:PN)(?:PN)\\s*)+';
        const reEq = re('(' + SIDE + ')=\\s*(' + SIDE + '|\\\\vec\\s*0|0)', 'g');
        let qe;
        while ((qe = reEq.exec(snt))) {
          const terms = [];
          const grab = (s, sign) => { const r = re(TERM, 'g'); let u; while ((u = r.exec(s))) { const c = u[2] ? numEval(u[2]) : 1; if (c == null) return false; terms.push({ c: sign * (u[1] === '-' ? -1 : 1) * c, P: u[3], Q: u[4] }); } return true; };
          if (!grab(qe[1], 1) || !grab(/vectơ/.test(qe[2]) ? qe[2] : '', -1)) continue;
          const unk = [...new Set(terms.flatMap((x) => [x.P, x.Q]))].filter((n) => !isDef(n));
          if (unk.length !== 1) continue;
          const n = unk[0], wt = {}; let a = 0;
          terms.forEach(({ c, P, Q }) => { if (Q === n) a += c; else wt[Q] = (wt[Q] || 0) + c; if (P === n) a -= c; else wt[P] = (wt[P] || 0) - c; });
          if (Math.abs(a) < 1e-12) continue;
          // a·n + Σ w·X = 0  →  n = Σ (−w/a)·X  (tổng trọng số bằng 1)
          const ks = Object.keys(wt).filter((X) => Math.abs(wt[X]) > 1e-12);
          add(n, ks, n + ' = tohop(' + ks.map((X) => r2(-wt[X] / a) + ', ' + X).join(', ') + ')', 'đẳng thức vectơ', ['diem ' + n]);
          hit = true;
        }
      }
      // hình bình hành (chữ nhật, thoi, vuông) ABCD tâm O
      // "hình vuông ABCD tâm O", "hình vuông ABCD cạnh a, tâm O", "… có tâm là O"
      const rtam = re('(?:hình vuông|hình chữ nhật|hình bình hành|hình thoi)\\s+([A-Z]{4})\\s+(?:[^.;]{0,30}?,\\s*)?(?:có\\s+)?tâm\\s+(?:là\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rtam.exec(snt))) { const ns = q[1].split(''), n = q[2]; if (!isDef(n)) { add(n, ns, n + ' = giao(' + ns[0] + ', ' + ns[2] + ', ' + ns[1] + ', ' + ns[3] + ')', 'tâm', ['doan ' + ns[0] + ns[2] + ' ' + ns[1] + ns[3], 'diem ' + n]); hit = true; } }
      // điểm M tuỳ ý (không nằm trên đường nào): đặt ngoài hình, phía trên bên phải
      const rfree = re('(?:với\\s+mọi\\s+điểm\\s+(PN)|điểm\\s+(PN)\\s+(?:tùy ý|tuỳ ý|bất kì|bất kỳ)|(PN)\\s+là\\s+(?:một\\s+)?điểm\\s+(?:tùy ý|tuỳ ý|bất kì|bất kỳ))(?!\\s+(?:trên|thuộc|nằm))', 'g');
      while ((q = rfree.exec(snt))) {
        const n = q[1] || q[2] || q[3]; if (isDef(n)) continue;
        // "Trên đoạn MI, lấy điểm K tùy ý": điểm nằm trên đoạn / cạnh / tia / đường thẳng đã nêu, không phải điểm ngoài hình
        if (re('(?:trên|thuộc)\\s+(?:đoạn thẳng|đoạn|cạnh|tia|đường thẳng|nửa đường tròn|đường tròn|cung)\\s').test(snt) || re(n + '\\s+(?:nằm\\s+)?(?:trên|thuộc|trong)\\s').test(snt)) continue;
        const vs = Object.values(P); if (!vs.length) continue;
        const xs = vs.map((v) => v[0]), ys = vs.map((v) => v[1]), sp = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
        add(n, [], n + ' = (' + r2((Math.min(...xs) + Math.max(...xs)) / 2 + 0.2 * sp) + ', ' + r2(Math.max(...ys) + 0.45 * sp) + ')', 'điểm tuỳ ý', ['diem ' + n]); hit = true;
      }
      // giao với trục toạ độ: "C nằm trên trục Ox sao cho A, B, C thẳng hàng", "giao điểm M của đường thẳng AB với trục tung Oy"
      const axisPts = (ax) => { const h1 = helper(), h2 = helper(); hidden.push(h1, h2); return [h1, h2, h1 + ' = (0, 0)\n' + h2 + (/x|hoành/.test(ax) ? ' = (1, 0)' : ' = (0, 1)')]; };
      const rax1 = re('(PN)\\s+(?:nằm\\s+)?(?:trên|thuộc)\\s+trục\\s+(Ox|Oy|hoành|tung)[^.;]*?sao cho\\s+(PN)\\s*,\\s*(PN)\\s*,\\s*(PN)\\s+thẳng hàng', 'g');
      while ((q = rax1.exec(snt))) { const n = q[1], two = [q[3], q[4], q[5]].filter((c) => c !== n); if (isDef(n) || two.length !== 2) continue; const [h1, h2, ln] = axisPts(q[2]); add(n, two, ln + '\n' + n + ' = giao(' + two.join(', ') + ', ' + h1 + ', ' + h2 + ')', 'giao với trục', ['doan ' + two[0] + n + ' ' + two[1] + n, 'diem ' + n]); hit = true; }
      const rax2 = re('giao điểm\\s+(PN)\\s+của\\s+(?:đường thẳng\\s+)?(PN)(PN)\\s+(?:với|và)\\s+trục\\s+(Ox|Oy|hoành|tung)', 'g');
      while ((q = rax2.exec(snt))) { const n = q[1]; if (isDef(n)) continue; const [h1, h2, ln] = axisPts(q[4]); add(n, [q[2], q[3]], ln + '\n' + n + ' = giao(' + q[2] + ', ' + q[3] + ', ' + h1 + ', ' + h2 + ')', 'giao với trục', ['doan ' + q[2] + n + ' ' + q[3] + n, 'diem ' + n]); hit = true; }
      // tia phân giác Oz (của góc xOy); "góc xOy có tia phân giác Ot"
      // "tia phân giác Oz (của góc xOy)"; "Oz là (tia) phân giác (của góc xOy)"
      const rpz = re('tia phân giác\\s+(PN)(PN)(?:\\s+của\\s+góc\\s+(PN)(PN)(PN))?|(?<![A-Za-z])(PN)(PN)\\s+là\\s+(?:tia\\s+)?(?:đường\\s+)?phân giác(?:\\s+(?:của\\s+)?góc\\s+(PN)(PN)(PN))?', 'g');
      while ((q = rpz.exec(snt))) {
        if (q[6]) q = [q[0], q[6], q[7], q[8], q[9], q[10]];
        const O = q[1], Z = q[2], A0 = q[3] || (base.k === 'ang' ? base.a : ''), B0 = q[5] || (base.k === 'ang' ? base.b : '');
        if (isDef(Z) || !A0 || !B0 || (q[4] && q[4] !== O)) continue;
        // góc của tam giác (tứ giác): "tia phân giác AD của góc BAC" — D nằm trên cạnh đối diện BC
        if (baseNames.includes(O) && baseNames.includes(A0) && baseNames.includes(B0)) add(Z, [A0, O, B0], Z + ' = phangiacgoc(' + [A0, O, B0, A0, B0].join(', ') + ')', 'tia phân giác', ['doan ' + O + Z, 'goc ' + A0 + O + Z + ' ' + Z + O + B0]);
        else add(Z, [A0, O, B0], Z + ' = phangiacgoc(' + A0 + ', ' + O + ', ' + B0 + ')', 'tia phân giác', ['doan ' + O + Z, 'goc ' + A0 + O + Z + ' ' + Z + O + B0]);
        hit = true;
      }
      // "đoạn thẳng AB có trung điểm (là) O"
      const rmo = re('((?:PN){2})\\s+có\\s+trung điểm\\s+(?:là\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rmo.exec(snt))) { const sg = namesIn(q[1]), n = q[2]; if (!isDef(n)) { onSeg[n] = sg; add(n, sg, n + ' = trungdiem(' + sg.join(', ') + ')', 'trung điểm', ['bang ' + sg[0] + n + ' ' + n + sg[1] + ' = #']); hit = true; } }
      // "vẽ tia Bx ∥ AC (song song / vuông góc với AC)", có thể kèm "trên nửa mặt phẳng bờ BC (không) chứa A":
      // Bx là tia gốc B, x là điểm ẩn theo hướng AC (đổi hướng cho đúng nửa mặt phẳng khi biết toạ độ)
      const rtp = re('(?:vẽ|kẻ|dựng)\\s+(?:tia|đường thẳng)\\s+(PN)(PN)(?![A-Za-z])\\s*(song song với|song song|∥|//|vuông góc với|vuông góc|⊥)\\s*(?:đường thẳng\\s+|cạnh\\s+|đoạn thẳng\\s+|tia\\s+)?(PN)(PN)(?![A-Za-z])', 'g');
      while ((q = rtp.exec(snt))) {
        const O = q[1], X = q[2], [U, W] = [q[4], q[5]];
        // gốc tia là điểm thật (B), không phải tên viết thường (đường thẳng xy)
        if (!lcLabel[X] || isDef(X) || lcLabel[O] || lcHide.includes(O)) continue;
        const ss = /song|∥|\/\//.test(q[3]);
        let [a, b] = [U, W];
        const hp = re('nửa mặt phẳng\\s+bờ\\s+(?:là\\s+)?(?:đường thẳng\\s+)?(PN)(PN)\\s+(không\\s+)?chứa\\s+(?:điểm\\s+)?(PN)').exec(snt);
        if (hp && [O, U, W, hp[1], hp[2], hp[4]].every((c) => P[c])) {
          const d = [P[W][0] - P[U][0], P[W][1] - P[U][1]], dir = ss ? d : [-d[1], d[0]];
          const side = (p) => (P[hp[2]][0] - P[hp[1]][0]) * (p[1] - P[hp[1]][1]) - (P[hp[2]][1] - P[hp[1]][1]) * (p[0] - P[hp[1]][0]);
          const sx = side([P[O][0] + dir[0], P[O][1] + dir[1]]), sa = side(P[hp[4]]);
          if (sx * sa !== 0 && (sx * sa > 0) === !!hp[3]) [a, b] = [W, U];
        }
        const h = helper(); hidden.push(h);
        const line = ss ? X + ' = tinhtien(' + O + ', ' + a + ', ' + b + ')' : h + ' = tinhtien(' + O + ', ' + a + ', ' + b + ')\n' + X + ' = quay(' + h + ', ' + O + ', 90)';
        add(X, [O, U, W], line, 'tia ' + (ss ? 'song song' : 'vuông góc'), ['doan ' + O + X].concat(ss ? [] : ['vuong ' + X + O + W]));
        hit = true;
      }
      // qua P kẻ / vẽ đường thẳng d (xy) [vuông góc với AB | không vuông góc với AB | sao cho …]
      // qua M vẽ đường thẳng d (vuông góc / song song / ⊥ / // với BC)
      const rql = re('qua\\s+(?:điểm\\s+)?(PN)\\s*,?\\s*(?:kẻ|vẽ)\\s+(?:một\\s+)?đường thẳng\\s+((?:PN){2})(?![A-Za-z])(\\s*\\(?\\s*(không\\s+)?(vuông góc|song song|⊥|∥|//)\\s*(?:với\\s+)?(?:đường thẳng\\s+|đoạn thẳng\\s+|cạnh\\s+)?((?:PN){2}))?', 'g');
      while ((q = rql.exec(snt))) {
        if (q[3]) q = [q[0], q[1], q[2], q[3], q[4], q[6], /song|∥|\/\//.test(q[5])];
        const P0 = q[1], [U, V] = namesIn(q[2]);
        if (isDef(U) || isDef(V)) continue;
        const h1 = helper(), h2 = helper();
        let line;
        if (q[3] && !q[4] && q[6]) { const [X, Y] = namesIn(q[5]); line = h1 + ' = tinhtien(' + P0 + ', ' + X + ', ' + Y + ')\n' + h2 + ' = chia(' + P0 + ', ' + h1 + ', 1)\n' + U + ' = chia(' + P0 + ', ' + h2 + ', ' + r2(5 / Math.max(1, getL(X, Y) || 6)) + ')'; }
        else if (q[3] && !q[4]) { const [X, Y] = namesIn(q[5]); line = h1 + ' = tinhtien(' + P0 + ', ' + X + ', ' + Y + ')\n' + h2 + ' = quay(' + h1 + ', ' + P0 + ', 90)\n' + U + ' = chia(' + P0 + ', ' + h2 + ', 0.6)'; marks.push('vuong ' + U + P0 + Y); }
        else if (vtx(P0) && baseNames.length === 3) { const [Y, Z] = baseNames.filter((c) => c !== P0); line = h1 + ' = trungdiem(' + Y + ', ' + Z + ')\n' + h2 + ' = quay(' + h1 + ', ' + P0 + ', 100)\n' + U + ' = chia(' + P0 + ', ' + h2 + ', 1.6)'; }
        else { const R0 = base.k === 'seg' ? (base.b === P0 ? base.a : base.b) : [...made].find((c) => c !== P0); line = h1 + ' = quay(' + R0 + ', ' + P0 + ', 35)\n' + h2 + ' = chia(' + P0 + ', ' + h1 + ', 1)\n' + U + ' = chia(' + P0 + ', ' + h2 + ', 1.6)'; }
        hidden.push(h1, h2);
        add(U, [P0].concat(q[5] ? namesIn(q[5]) : []), line + '\n' + V + ' = doixung(' + U + ', ' + P0 + ')', 'đường thẳng qua ' + P0, ['doan ' + U + V]);
        cons.push({ name: V, need: [U], line: '', src: '', more: [] }); // điểm thứ hai đã dựng cùng dòng trên
        lineThrough[U + V] = P0; lineThrough[V + U] = P0; hit = true;
      }
      // lấy điểm M (bất kỳ) trên đường thẳng d [sao cho I nằm giữa M và N]
      const rol = re('(PN)\\s+(?:là\\s+(?:một\\s+)?điểm\\s+)?(?:bất k[ìỳ]\\s+)?(?:thuộc|nằm trên|trên)\\s+đường thẳng\\s+((?:PN){2})(?![A-Za-z])', 'g');
      while ((q = rol.exec(snt))) {
        const n = q[1], ln2 = q[2], [U, V] = namesIn(ln2), thr = lineThrough[ln2];
        if (isDef(n)) continue;
        const btw = re('sao cho\\s+(PN)\\s+nằm giữa\\s+(PN)\\s+và\\s+(PN)').exec(snt.slice(q.index));
        const k = (linePts[ln2] = (linePts[ln2] || 0) + 1);
        let line, need = [U, V];
        if (btw && [btw[2], btw[3]].includes(n)) { const o = btw[2] === n ? btw[3] : btw[2]; line = n + ' = chia(' + o + ', ' + btw[1] + ', 1.7)'; need = [o, btw[1]]; }
        else if (thr) line = n + ' = chia(' + thr + ', ' + (k === 1 ? U : V) + ', ' + (k === 1 ? 0.75 : 0.6) + ')';
        else line = n + ' = chia(' + U + ', ' + V + ', ' + (k === 1 ? 0.3 : 0.7) + ')';
        add(n, need, line, 'điểm trên đường thẳng'); onSeg[n] = [U, V]; hit = true;
      }
      // trung điểm; đối xứng khi trung điểm đã có và một đầu mút chưa có
      const r1 = re('(?<![A-Za-z])((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng|theo thứ tự)?\\s*là\\s+(?:các\\s+)?trung điểm\\s+(?:của\\s+)?(?:các\\s+)?(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?|dây\\s+(?:cung\\s+)?)?((?:PN){2}(?:\\s*(?:,|và)\\s*(?:cạnh\\s+)?(?:PN){2})*)', 'g');
      while ((q = r1.exec(snt))) {
        const segs = listPairs(q[2]), ns0 = listNames(q[1]), ns = ns0.slice(Math.max(0, ns0.length - segs.length)); // "trọng tâm G và M là trung điểm của BC": chỉ M
        ns.forEach((n, i) => {
          const sg = namesIn(segs[i] || ''); if (sg.length !== 2) return;
          if (!isDef(n)) { onSeg[n] = sg; add(n, sg, n + ' = trungdiem(' + sg.join(', ') + ')', 'trung điểm', ['bang ' + sg[0] + n + ' ' + n + sg[1] + ' = #']); hit = true; }
          else if (isDef(sg[0]) !== isDef(sg[1])) { const k = isDef(sg[0]) ? 0 : 1; add(sg[1 - k], [sg[k], n], sg[1 - k] + ' = doixung(' + sg[k] + ', ' + n + ')', 'đối xứng', ['bang ' + sg[0] + n + ' ' + n + sg[1] + ' = #']); hit = true; }
        });
      }
      const r1b = re('trung điểm\\s+(PN)\\s+(?:của\\s+)?(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)?((?:PN){2})', 'g');
      while ((q = r1b.exec(snt))) { const sg = namesIn(q[2]); onSeg[q[1]] = onSeg[q[1]] || sg; add(q[1], sg, q[1] + ' = trungdiem(' + sg.join(', ') + ')', 'trung điểm', ['bang ' + sg[0] + q[1] + ' ' + q[1] + sg[1] + ' = #']); hit = true; }
      // đối xứng qua điểm / qua đường thẳng
      const rs = re('(PN)\\s+(?:là\\s+(?:điểm\\s+)?)?đối xứng\\s+(?:của\\s+|với\\s+)?(?:điểm\\s+)?(PN)\\s+qua\\s+(?:điểm\\s+|đường thẳng\\s+|cạnh\\s+)?((?:PN){1,2})(?![A-Za-z])', 'g');
      while ((q = rs.exec(snt))) {
        // nối điểm với điểm đối xứng của nó (qua tâm: đoạn đi qua tâm; qua trục: đoạn vuông góc với trục tại chân)
        const ax = namesIn(q[3]), [n, s0] = [q[1], q[2]];
        if (ax.length === 1) add(n, [s0].concat(ax), n + ' = doixung(' + s0 + ', ' + ax[0] + ')', 'đối xứng', ['doan ' + s0 + n]);
        else { const h = helper(); hidden.push(h); add(n, [s0].concat(ax), h + ' = chan(' + s0 + ', ' + ax.join(', ') + ')\n' + n + ' = doixungtruc(' + s0 + ', ' + ax.join(', ') + ')', 'đối xứng', ['doan ' + s0 + n, 'vuong ' + s0 + h + ax[0], 'bang ' + s0 + h + ' ' + h + n + ' = #']); }
        hit = true;
      }
      // đầu câu "qua điểm A (thuộc tia Ox / trên cạnh AB), (ta) kẻ / vẽ (một)": dùng chung cho các mẫu đường qua một điểm
      const QUA = 'qua\\s+(?:điểm\\s+)?(PN)(?:\\s*\\(?\\s*(?:thuộc|nằm trên|trên|nằm trong)\\s+(?:tia|cạnh|đoạn thẳng|đoạn|đường thẳng|góc)?\\s*(?:PN){2,3}\\s*\\)?)?\\s*,?\\s*(?:ta\\s+)?(?:kẻ|vẽ|dựng)?\\s*(?:một\\s+)?';
      // (đường thẳng) qua K vuông góc (song song) với MI cắt (các) cạnh MN, MP lần lượt tại E, F;
      // "qua M kẻ đường thẳng vuông góc với AD, đường thẳng này cắt AB và AC lần lượt tại K và H"
      const rq2 = re(QUA + '(?:đường thẳng|tia)?\\s*(?:(PN)\\s+)?(song song|vuông góc)\\s+với\\s+(?:đường thẳng\\s+|cạnh\\s+|đoạn thẳng\\s+)?(PN)(PN)\\s*,?\\s*(?:(?:đường thẳng|đường) này\\s+|nó\\s+)?(?:và\\s+)?cắt\\s+(?:các\\s+|hai\\s+)?(?:cạnh\\s+|đường thẳng\\s+|đoạn thẳng\\s+|tia\\s+)?(PN)(PN)\\s*(?:,|và)\\s*(?:cạnh\\s+|đường thẳng\\s+|tia\\s+)?(PN)(PN)\\s+(?:lần lượt\\s+|theo thứ tự\\s+)?tại\\s+(?:các\\s+điểm\\s+|điểm\\s+|hai\\s+điểm\\s+)?(PN)\\s*(?:,|và)\\s*(PN)', 'g');
      while ((q = rq2.exec(snt))) {
        const M0 = q[1], [X, Y] = [q[4], q[5]], E = q[10], F = q[11];
        if (isDef(E) || isDef(F)) continue;
        const h = helper(); hidden.push(h);
        let dirLine;
        if (q[3] === 'song song') dirLine = h + ' = tinhtien(' + M0 + ', ' + X + ', ' + Y + ')';
        else { const h2 = helper(); hidden.push(h2); dirLine = h2 + ' = tinhtien(' + M0 + ', ' + X + ', ' + Y + ')\n' + h + ' = quay(' + h2 + ', ' + M0 + ', 90)'; }
        // góc vuông đánh dấu tại M0 khi M0 nằm trên đường XY (K trên MI, M trên AD)
        const onXY = onSeg[M0] && onSeg[M0].slice().sort().join() === [X, Y].sort().join();
        const mk = q[3] === 'vuông góc' && onXY ? ['vuong ' + E + M0 + Y] : q[3] === 'vuông góc' ? [] : [];
        add(E, [M0, X, Y, q[6], q[7]], dirLine + '\n' + E + ' = giao(' + M0 + ', ' + h + ', ' + q[6] + ', ' + q[7] + ')', 'đường ' + q[3], ['doan ' + E + F].concat(mk));
        add(F, [E, h, q[8], q[9]], F + ' = giao(' + M0 + ', ' + h + ', ' + q[8] + ', ' + q[9] + ')', 'đường ' + q[3]);
        hit = true;
      }
      // qua M kẻ đường thẳng song song (vuông góc) với BC, cắt AC tại N
      // cả cách viết kí hiệu: "qua A vẽ đường thẳng d // BC, d cắt AB tại E", "… ⊥ BC, nó cắt …"
      const rq = re(QUA + '(?:đường thẳng|tia)?\\s*(?:((?:PN){1,2})\\s+)?(song song|vuông góc|∥|//|⊥)\\s*(?:với\\s+)?(?:đường thẳng\\s+|cạnh\\s+)?(PN)(PN)\\s*,?\\s*(?:(?:(?:PN){1,2}|đường thẳng này|đường này|nó)\\s+)?(?:và\\s+)?cắt\\s+(?:cạnh\\s+|đường thẳng\\s+|tia\\s+)?(PN)(PN)\\s+(?:lần lượt\\s+)?tại\\s+(?:điểm\\s+)?(PN)', 'g');
      while ((q = rq.exec(snt))) {
        q[3] = /song|∥|\/\//.test(q[3]) ? 'song song' : 'vuông góc';
        const M = q[1], [X, Y] = [q[4], q[5]], [U, W] = [q[6], q[7]], n = q[8], h = helper();
        const hl = q[3] === 'song song' ? h + ' = tinhtien(' + M + ', ' + X + ', ' + Y + ')' : h + ' = quay(tinhtien(' + M + ', ' + X + ', ' + Y + '), ' + M + ', 90)';
        if (q[3] === 'vuông góc') { const h2 = helper(); add(n, [M, X, Y, U, W], h2 + ' = tinhtien(' + M + ', ' + X + ', ' + Y + ')\n' + h + ' = quay(' + h2 + ', ' + M + ', 90)\n' + n + ' = giao(' + M + ', ' + h + ', ' + U + ', ' + W + ')', 'đường vuông góc', ['doan ' + M + n]); hidden.push(h, h2); }
        else { add(n, [M, X, Y, U, W], hl + '\n' + n + ' = giao(' + M + ', ' + h + ', ' + U + ', ' + W + ')', 'đường song song', ['doan ' + M + n]); hidden.push(h); }
        // "… cắt AB tại H và cắt AD tại K": giao tiếp theo của cùng đường đó
        const w2 = re('^\\s*,?\\s*(?:và\\s+)?cắt\\s+(?:cạnh\\s+|đường thẳng\\s+|đoạn thẳng\\s+|tia\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])').exec(snt.slice(rq.lastIndex));
        if (w2 && !isDef(w2[3])) add(w2[3], [n, w2[1], w2[2]], w2[3] + ' = giao(' + M + ', ' + n + ', ' + w2[1] + ', ' + w2[2] + ')', 'giao điểm', ['doan ' + M + w2[3] + ' ' + n + w2[3] + ' ' + w2[1] + w2[3] + ' ' + w2[2] + w2[3]]);
        hit = true;
      }
      // giao điểm: "O là giao điểm của AC và BD", "giao điểm O của …", "AC cắt BD tại O", "hai đường chéo cắt nhau tại O"
      const rg = re('(?:(PN)\\s+là\\s+giao điểm|giao điểm\\s+(PN))\\s+(?:của\\s+)?(?:hai\\s+)?(?:đường thẳng\\s+|đường chéo\\s+|tia\\s+)?((?:PN){2})\\s+(?:và|với)\\s+(?:đường thẳng\\s+|tia\\s+)?((?:PN){2})', 'g');
      while ((q = rg.exec(snt))) { const n = q[1] || q[2], a = namesIn(q[3]), b = namesIn(q[4]); add(n, a.concat(b), n + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm', ['doan ' + a.join('') + ' ' + b.join('')]); hit = true; }
      // "các đường cao AD, BE, CF cắt nhau tại H": giao của hai đường đầu
      const rn = re('(?<![A-Za-z])((?:PN)(?:PN))\\s*(?:,|và)\\s*((?:PN)(?:PN))(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*\\s+(?:đồng quy|cắt nhau)\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      while ((q = rn.exec(snt))) { const a = namesIn(q[1]), b = namesIn(q[2]); if (!isDef(q[3])) { add(q[3], a.concat(b), q[3] + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm'); hit = true; } }
      // "…song song với Oy cắt Oz tại M": Oy là đường được so sánh, không phải đường đi qua M — không dùng mẫu giao này
      const rc = re('(?<![A-Za-z])(?<!(?:song song|vuông góc)\\s+với\\s+(?:đường thẳng\\s+|cạnh\\s+|đoạn thẳng\\s+)?)(PN)(PN)\\s+(?:và\\s+(PN)(PN)\\s+)?cắt\\s+(?:nhau\\s+)?(?:đường thẳng\\s+|đoạn thẳng\\s+|đoạn\\s+|tia\\s+|cạnh\\s+)?(?:(PN)(PN)\\s+(?:kéo dài\\s+|\\(\\s*kéo dài\\s*\\)\\s+)?)?tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])', 'g');
      const giaoDraw = (a, b, n) => add(n, a.concat(b), n + ' = giao(' + a.concat(b).join(', ') + ')', 'giao điểm', ['doan ' + a.join('') + ' ' + b.join('') + ' ' + a[0] + n + ' ' + a[1] + n + ' ' + b[0] + n + ' ' + b[1] + n]);
      // "… cắt CH tại I và cắt AN tại K": cùng một đường cắt tiếp đường khác
      const chainRe = re('^\\s*,?\\s*(?:và\\s+)?cắt\\s+(?:đường thẳng\\s+|đoạn thẳng\\s+|đoạn\\s+|tia\\s+|cạnh\\s+)?(PN)(PN)\\s+tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])');
      while ((q = rc.exec(snt))) {
        const a = [q[1], q[2]], b = q[3] ? [q[3], q[4]] : q[5] ? [q[5], q[6]] : null, n = q[7];
        if (b && !isDef(n)) { giaoDraw(a, b, n); hit = true; }
        let w2;
        if (b && !q[3] && (w2 = chainRe.exec(snt.slice(rc.lastIndex))) && !isDef(w2[3])) { giaoDraw(a, [w2[1], w2[2]], w2[3]); hit = true; }
      }
      if (baseNames.length === 4 && (q = re('(?:hai\\s+)?đường chéo\\s+(?:(PN)(PN)\\s+(?:và\\s+)?(PN)(PN)\\s+)?cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)').exec(snt))) {
        const [A, B, C, D] = baseNames; add(q[5], baseNames, q[5] + ' = giao(' + A + ', ' + C + ', ' + B + ', ' + D + ')', 'giao điểm hai đường chéo', ['doan ' + A + C + ' ' + B + D]); hit = true;
      }
      // tâm đường tròn ngoại tiếp / nội tiếp; đường tròn ngoại / nội tiếp không nêu tên tâm
      // "I là tâm đường tròn nội tiếp tam giác." (không nhắc tên): tam giác chính; "xác định tâm O và bán kính đường tròn ngoại tiếp…"
      const rt = re('(?:(PN)\\s+là\\s+tâm\\s+(?:của\\s+)?đường tròn|tâm\\s+(PN)\\s+(?:và\\s+[^.;]*?\\s+)?(?:của\\s+)?đường tròn|đường tròn\\s*(?:\\(\\s*(PN)\\s*\\)|tâm\\s+(PN))?)\\s+(ngoại|nội)\\s+tiếp\\s*(?:tam giác\\s*)?([A-Z]{3})?', 'g');
      while ((q = rt.exec(snt))) {
        const n = q[1] || q[2] || q[3] || q[4], ns = (q[6] || (baseNames.length === 3 ? baseNames.join('') : tris[0] || '')).split(''), out = q[5] === 'ngoại';
        if (ns.length !== 3) continue;
        if (n) add(n, ns, n + ' = ' + (out ? 'tamngoai' : 'tamnoi') + '(' + ns.join(', ') + ')', out ? 'tâm đường tròn ngoại tiếp' : 'tâm đường tròn nội tiếp', [(out ? 'duongtron ' + n + ' ' + ns[0] : 'noitiep ' + ns.join('')), 'diem ' + n]);
        else if (ns.every(isDef)) cons.push({ name: '', need: ns, line: '', src: '', more: [(out ? 'ngoaitiep ' : 'noitiep ') + ns.join('')] });
        hit = true;
      }
      // trọng tâm, trực tâm, tâm của hình vuông / hình bình hành…
      const r3 = re('(?:(PN)\\s+là\\s+(trọng tâm|trực tâm|tâm)|(trọng tâm|trực tâm|tâm)\\s+(PN))\\s*(?:của\\s+)?(?:hình vuông|hình chữ nhật|hình bình hành|hình thoi|tam giác(?:\\s+đều)?|tứ giác)?\\s*([A-Z]{3,4})?(?![A-Za-z])', 'g');
      while ((q = r3.exec(snt))) {
        const n = q[1] || q[4], kind = q[2] || q[3];
        // "G là trọng tâm." (không nhắc lại tên tam giác): tam giác chính của đề
        const tri0 = baseNames.length === 3 ? baseNames.join('') : tris.find((x) => x.split('').every(isDef)) || '';
        if (!q[5] && (kind === 'tâm' || !tri0)) continue;
        if (isDef(n)) { hit = true; continue; }
        const ns = (q[5] || tri0).split('');
        if (ns.length === 4) add(n, ns, n + ' = giao(' + ns[0] + ', ' + ns[2] + ', ' + ns[1] + ', ' + ns[3] + ')', 'tâm', ['doan ' + ns[0] + ns[2] + ' ' + ns[1] + ns[3]]);
        else if (kind === 'trực tâm') add(n, ns, n + ' = tructam(' + ns.join(', ') + ')', 'trực tâm', ['diem ' + n]);
        else if (kind === 'tâm') add(n, ns, n + ' = tamngoai(' + ns.join(', ') + ')', 'tâm', ['diem ' + n]);
        else {
          // trọng tâm: vẽ các trung tuyến tới trung điểm cạnh đối diện đã có (G nằm trên đó, như hình SGK)
          const med = ns.map((v) => { const o2 = ns.filter((c) => c !== v).sort().join(); const mm = Object.keys(onSeg).find((k2) => onSeg[k2].slice().sort().join() === o2); return mm ? 'doan ' + v + mm : ''; }).filter(Boolean);
          add(n, ns, n + ' = trongtam(' + ns.join(', ') + ')', 'trọng tâm', ['diem ' + n].concat(med));
        }
        hit = true;
      }
      // trong phần kết luận vẫn có thể định nghĩa điểm: "…thì trọng tâm G của tam giác ACD luôn chạy trên…"
      if (cutAt >= 0) {
        const r3k = re('(trọng tâm|trực tâm)\\s+(PN)\\s+(?:của\\s+)?tam giác\\s+([A-Z]{3})(?![A-Za-z])', 'g');
        while ((q = r3k.exec(snt0.slice(cutAt)))) {
          const n = q[2], ns = q[3].split(''); if (isDef(n)) continue;
          add(n, ns, n + ' = ' + (q[1] === 'trực tâm' ? 'tructam' : 'trongtam') + '(' + ns.join(', ') + ')', q[1], ['diem ' + n]);
        }
      }
      // đường cao, trung tuyến, phân giác: "đường cao AH", "các đường trung tuyến AM, BN", "AD là phân giác của tam giác ABC"
      const rl = re('(?:các\\s+)?(đường cao|đường trung tuyến|trung tuyến|đường phân giác(?:\\s+trong)?|phân giác)\\s+((?:PN)(?:PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*)(?:\\s+(?:của\\s+)?tam giác\\s+([A-Z]{3}))?|(?<![A-Za-z])((?:PN)(?:PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))*)\\s+(?:lần lượt\\s+)?là\\s+(?:một\\s+|hai\\s+|ba\\s+|các\\s+)?(?:tia\\s+)?(đường cao|đường trung tuyến|trung tuyến|đường phân giác|phân giác)(?:\\s+(?:của\\s+)?tam giác\\s+([A-Z]{3}))?', 'g');
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
      const r4 = re('((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:lần lượt|tương ứng|theo thứ tự)?\\s*là\\s+(?:các\\s+)?(?:hình chiếu\\s+(?:vuông góc\\s+)?|chân\\s+(?:các\\s+)?đường (?:vuông góc|cao)\\s+(?:kẻ\\s+)?)(?:của\\s+|từ\\s+)?(?:điểm\\s+)?(PN)\\s+(?:trên|lên|xuống|đến|tới)\\s+((?:(?:cạnh|đường thẳng)\\s+)?(?:PN){2}(?:\\s*(?:,|và)\\s*(?:PN){2})*)', 'g');
      while ((q = r4.exec(snt))) {
        const ns = listNames(q[1]), src = q[2], tg = listPairs(q[3].replace(/cạnh|đường thẳng/g, ''));
        ns.forEach((n, i) => { const ps = namesIn(tg[i] || tg[0] || ''); if (ps.length === 2) { foot(n, src, ps, 'hình chiếu'); hit = true; } });
      }
      const r5 = re('(?:kẻ\\s+)?(PN)(PN)\\s*(?:⊥|vuông góc(?:\\s+với)?)\\s*(?:đường thẳng\\s+|cạnh\\s+)?(PN)(PN)(?![A-Za-z])', 'g');
      while ((q = r5.exec(snt))) {
        if (!isDef(q[2]) && isDef(q[1])) {
          foot(q[2], q[1], [q[3], q[4]], 'đường vuông góc'); hit = true;
          // từ điểm trên đường tròn hạ vuông góc xuống cạnh: chân có thể nằm trên phần kéo dài của cạnh (đường thẳng Simson)
          if (onC.has(q[1])) cons.push({ name: '', need: [q[2]], line: '', src: '', more: ['doan ' + q[3] + q[2] + ' ' + q[4] + q[2]] });
        }
      }
      // đỉnh thứ tư: "lấy điểm E sao cho ABCE là hình bình hành"
      const rh = re('(?:tứ giác\\s+)?([A-Z]{4})\\s+là\\s+(?:một\\s+)?(hình bình hành|hình chữ nhật|hình thoi|hình vuông)', 'g');
      while ((q = rh.exec(snt))) {
        const ns = q[1].split(''), miss = ns.filter((n) => !isDef(n));
        if (miss.length !== 1 || (base.k === 'quad' && base.name === q[1])) continue;
        const i = ns.indexOf(miss[0]), p = ns[(i + 3) % 4], o = ns[(i + 2) % 4], nx = ns[(i + 1) % 4];
        add(miss[0], [p, o, nx], miss[0] + ' = hbh(' + nx + ', ' + o + ', ' + p + ')', 'đỉnh thứ tư của ' + q[2], ['doan ' + p + miss[0] + ' ' + miss[0] + nx]); hit = true;
      }
      // trên tia (đối của tia) OX lấy điểm N sao cho ON = PQ; "N thuộc tia đối của tia OX sao cho …"
      // trên các cạnh AB, BC, CA lấy các điểm D, E, F (sao cho AD = BE = CF)
      const rcl = re('trên\\s+(?:các\\s+)?(?:cạnh|đoạn thẳng|đoạn)\\s+((?:PN){2}(?:\\s*(?:,|và)\\s*(?:PN){2})+)\\s*,?\\s*(?:lần lượt\\s+)?lấy\\s+(?:các\\s+|hai\\s+|ba\\s+)?(?:điểm\\s+)?((?:PN)(?:\\s*(?:,|và)\\s*PN)+)(?:\\s+sao cho\\s+([^.;]+))?', 'g');
      while ((q = rcl.exec(snt))) {
        const sgs = listPairs(q[1]).map(namesIn), ns = listNames(q[2]);
        const terms = (q[3] || '').split('=').map((x) => namesIn(x)).filter((x) => x.length === 2);
        let first = null;
        ns.forEach((n, i) => {
          const sg = sgs[i]; if (!sg || sg.length !== 2 || isDef(n)) return;
          const tm = terms.find((x) => x.includes(n)), P0 = tm ? tm.find((x) => x !== n) : sg[0], Q0 = sg.find((x) => x !== P0) || sg[1];
          if (tm && first && sg.includes(P0)) add(n, [P0, Q0].concat(first), n + ' = dat(' + P0 + ', ' + Q0 + ', ' + first.join(', ') + ')', 'điểm trên cạnh');
          else { add(n, [P0, Q0], n + ' = chia(' + P0 + ', ' + Q0 + ', ' + (tm ? 0.35 : 0.45) + ')', 'điểm trên cạnh'); if (tm) first = [P0, n]; }
          onSeg[n] = sg;
        });
        if (terms.length >= 2) cons.push({ name: '', need: ns, line: '', src: '', more: ['bang ' + terms.map((x) => x.join('')).join(' ') + ' = #'] });
        hit = true;
      }
      // đường trung trực d của đoạn thẳng AB (đường thẳng có tên); điểm trên đó dựng bởi các mẫu "M thuộc d"
      const rtr = re('đường trung trực\\s+(PN)(PN)\\s+(?:của\\s+)?(?:đoạn thẳng\\s+|đoạn\\s+|cạnh\\s+)?(PN)(PN)(?![A-Za-z])', 'g');
      while ((q = rtr.exec(snt))) {
        const [X, Y, A0, B0] = [q[1], q[2], q[3], q[4]]; if (isDef(X)) continue;
        const z = helper(), h = helper(); hidden.push(z, h);
        add(X, [A0, B0], z + ' = trungdiem(' + A0 + ', ' + B0 + ')\n' + h + ' = quay(' + A0 + ', ' + z + ', 90)\n' + X + ' = chia(' + z + ', ' + h + ', 1.7)\n' + Y + ' = doixung(' + X + ', ' + z + ')', 'đường trung trực', ['doan ' + X + Y, 'vuong ' + X + z + B0, 'bang ' + A0 + z + ' ' + z + B0 + ' = #']);
        cons.push({ name: Y, need: [X], line: '', src: '', more: [] }); lineThrough[X + Y] = z; hit = true;
      }
      // các đường trung trực của AB và AC cắt nhau tại O / O là giao điểm của các đường trung trực…
      const rtr2 = re('(?:(PN)\\s+là\\s+giao điểm\\s+(?:của\\s+)?)?(?:các\\s+|hai\\s+|ba\\s+)?đường trung trực\\s+(?:của\\s+)?(?:các\\s+|hai\\s+)?(?:cạnh\\s+|đoạn thẳng\\s+)?(PN)(PN)\\s*(?:,|và)\\s*(?:cạnh\\s+|đoạn thẳng\\s+)?(PN)(PN)(?:\\s*(?:,|và)\\s*(?:PN)(?:PN))?(?:\\s+(?:của tam giác\\s+[A-Z]{3}\\s+)?cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN))?', 'g');
      while ((q = rtr2.exec(snt))) {
        const n = q[1] || q[6], ns = [...new Set([q[2], q[3], q[4], q[5]])]; if (!n || isDef(n) || ns.length !== 3) continue;
        const m1 = helper(), m2 = helper(); hidden.push(m1, m2);
        add(n, ns, m1 + ' = trungdiem(' + q[2] + ', ' + q[3] + ')\n' + m2 + ' = trungdiem(' + q[4] + ', ' + q[5] + ')\n' + n + ' = tamngoai(' + ns.join(', ') + ')', 'giao các đường trung trực',
          ['doan ' + m1 + n + ' ' + m2 + n, 'vuong ' + n + m1 + q[3] + ' ' + n + m2 + q[5], 'bang ' + q[2] + m1 + ' ' + m1 + q[3] + ' = #', 'bang ' + q[4] + m2 + ' ' + m2 + q[5] + ' = #', 'diem ' + n]);
        hit = true;
      }
      // các tia phân giác của góc B và góc C cắt nhau tại I
      const rpg2 = re('(?:các\\s+|hai\\s+)?(?:tia\\s+|đường\\s+)?phân giác\\s+(?:trong\\s+)?(?:của\\s+)?(?:các\\s+|hai\\s+)?góc\\s+(PN)\\s+và\\s+(?:góc\\s+)?(PN)(?:\\s+của tam giác\\s+[A-Z]{3})?\\s+cắt nhau\\s+tại\\s+(?:điểm\\s+)?(PN)', 'g');
      while ((q = rpg2.exec(snt))) {
        const n = q[3], tr = (tris.find((x) => x.includes(q[1]) && x.includes(q[2])) || '').split(''); if (isDef(n) || tr.length !== 3) continue;
        const o = tr.find((c) => c !== q[1] && c !== q[2]);
        add(n, tr, n + ' = tamnoi(' + tr.join(', ') + ')', 'giao hai phân giác', ['doan ' + q[1] + n + ' ' + q[2] + n, 'goc ' + o + q[1] + n + ' ' + n + q[1] + q[2], 'goc ' + o + q[2] + n + ' ' + n + q[2] + q[1]]);
        hit = true;
      }
      // điểm M nằm (bên) trong tam giác ABC: không trùng trọng tâm để không lẫn với điểm đặc biệt
      const rin = re('(?:điểm\\s+)?(?<![A-Za-z])(PN)\\s+(?:là\\s+(?:một\\s+)?điểm\\s+)?(?:bất k[ìỳ]\\s+)?(?:nằm\\s+)?(?:ở\\s+)?(?:bên\\s+)?trong\\s+(?:tam giác|tứ giác)\\s*([A-Z]{3,4})?(?![A-Za-z])', 'g');
      while ((q = rin.exec(snt))) {
        const n = q[1], ns = (q[2] || (baseNames.length >= 3 ? baseNames.join('') : '')).split(''); if (isDef(n) || ns.length < 3) continue;
        add(n, ns.slice(0, 3), n + ' = tohop(0.5, ' + ns[0] + ', 0.3, ' + ns[1] + ', 0.2, ' + ns[2] + ')', 'điểm trong tam giác', ['diem ' + n]); hit = true;
      }
      // dựng ra phía ngoài (trong) tam giác ABC: tam giác đều ABD, ACE; hình vuông ABDE; tam giác vuông cân ABD tại A
      const rout2 = re('(?:vẽ|dựng)\\s+(?:về\\s+)?(?:phía\\s+ngoài\\s+(?:của\\s+)?tam giác\\s+[A-Z]{3}\\s+)?(?:các\\s+|hai\\s+)?(tam giác đều|tam giác vuông cân|hình vuông)\\s+((?:[A-Z]{3,4})(?:\\s*(?:,|và)\\s*[A-Z]{3,4})*)(?:\\s+tại\\s+(PN))?([^.;]*)', 'g');
      while ((q = rout2.exec(snt))) {
        const kind = q[1], shapes = q[2].match(/[A-Z]{3,4}/g), rest = q[0];
        const inside = /phía\s+trong|cùng phía/.test(rest) && !/ngoài|khác phía/.test(rest);
        shapes.forEach((sh) => {
          const ns = sh.split(''), known = ns.filter((c) => P[c]), fresh = ns.filter((c) => !P[c] && !isDef(c));
          if (known.length !== 2 || !fresh.length) return;
          const [X, Y] = known, W = baseNames.find((c) => c !== X && c !== Y && P[c]);
          const rot = (p, o, deg) => { const a = deg * Math.PI / 180, dx = p[0] - o[0], dy = p[1] - o[1]; return [o[0] + dx * Math.cos(a) - dy * Math.sin(a), o[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
          const far = (deg) => { if (!W) return 1; const c = rot(P[Y], P[X], deg), d = Math.hypot(c[0] - P[W][0], c[1] - P[W][1]); const c2 = rot(P[Y], P[X], -deg), d2 = Math.hypot(c2[0] - P[W][0], c2[1] - P[W][1]); return (d > d2) !== inside ? 1 : -1; };
          if (kind === 'tam giác đều') { const Z = fresh[0], s = far(60); add(Z, [X, Y], Z + ' = quay(' + Y + ', ' + X + ', ' + 60 * s + ')', 'tam giác đều', ['doan ' + X + Z + ' ' + Y + Z, 'bang ' + X + Y + ' ' + Y + Z + ' ' + Z + X + ' = #']); }
          else if (kind === 'tam giác vuông cân') { const V = q[3] && known.includes(q[3]) ? q[3] : X, U = V === X ? Y : X, Z = fresh[0], s = far(90); add(Z, [X, Y], Z + ' = quay(' + U + ', ' + V + ', ' + 90 * s * (V === X ? 1 : -1) + ')', 'tam giác vuông cân', ['doan ' + V + Z + ' ' + U + Z, 'vuong ' + U + V + Z, 'bang ' + V + U + ' ' + V + Z + ' = #']); }
          else if (fresh.length === 2) {
            // hình vuông XYZT theo thứ tự đỉnh trong tên: hai đỉnh mới quay từ hai đỉnh đã có
            const i0 = ns.indexOf(X), i1 = ns.indexOf(Y), [A1, B1] = (i1 === (i0 + 1) % 4) ? [X, Y] : [Y, X];
            const C1 = ns[(ns.indexOf(B1) + 1) % 4], D1 = ns[(ns.indexOf(B1) + 2) % 4];
            const s = (() => { const rA = rot(P[A1], P[B1], 90), rB = rot(P[A1], P[B1], -90); if (!W) return 1; return (Math.hypot(rA[0] - P[W][0], rA[1] - P[W][1]) > Math.hypot(rB[0] - P[W][0], rB[1] - P[W][1])) !== inside ? 1 : -1; })();
            add(C1, [A1, B1], C1 + ' = quay(' + A1 + ', ' + B1 + ', ' + 90 * s + ')\n' + D1 + ' = hbh(' + B1 + ', ' + A1 + ', ' + C1 + ')', 'hình vuông', ['doan ' + B1 + C1 + ' ' + C1 + D1 + ' ' + D1 + A1, 'vuong ' + A1 + B1 + C1]);
            cons.push({ name: D1, need: [C1], line: '', src: '', more: [] });
          }
        });
        hit = true;
      }
      // O là giao điểm (của) hai đường chéo (tứ giác chính)
      if (baseNames.length === 4 && (q = re('(PN)\\s+là\\s+giao điểm\\s+(?:của\\s+)?(?:hai\\s+)?đường chéo').exec(snt))) {
        const [A, B, C, D] = baseNames; add(q[1], baseNames, q[1] + ' = giao(' + A + ', ' + C + ', ' + B + ', ' + D + ')', 'giao điểm hai đường chéo', ['doan ' + A + C + ' ' + B + D]); hit = true;
      }
      // qua O kẻ (một) đường thẳng cắt AB tại E và cắt CD tại F / cắt AB, CD lần lượt tại E, F
      const rqo = re('qua\\s+(?:điểm\\s+)?(PN)\\s*,?\\s*(?:kẻ|vẽ)\\s+(?:một\\s+)?đường thẳng\\s+(?:bất k[ìỳ]\\s+)?(?:\\(?[^()]{0,40}\\)?\\s*)?cắt\\s+(?:cạnh\\s+|đường thẳng\\s+)?(PN)(PN)\\s+(?:tại\\s+(PN)\\s+và\\s+cắt\\s+(?:cạnh\\s+|đường thẳng\\s+)?(PN)(PN)\\s+tại\\s+(PN)|(?:,|và)\\s*(?:cạnh\\s+)?(PN)(PN)\\s+(?:lần lượt\\s+)?tại\\s+(PN)\\s*(?:,|và)\\s*(PN))', 'g');
      while ((q = rqo.exec(snt))) {
        const O = q[1], [X, Y] = [q[2], q[3]], [U, V] = q[4] ? [q[5], q[6]] : [q[8], q[9]], E = q[4] || q[10], F = q[7] || q[11];
        if (isDef(E) || isDef(F)) continue;
        add(E, [X, Y], E + ' = chia(' + X + ', ' + Y + ', 0.3)', 'đường thẳng qua ' + O, ['doan ' + E + F]);
        add(F, [E, O, U, V], F + ' = giao(' + E + ', ' + O + ', ' + U + ', ' + V + ')', 'đường thẳng qua ' + O);
        onSeg[E] = [X, Y]; hit = true;
      }
      // vẽ tia Ot nằm trong góc xOy (giữa hai tia, lệch về phía Ox)
      const rtg = re('tia\\s+(PN)(PN)\\s+(?:nằm\\s+)?(?:trong|ở trong|nằm giữa)\\s+(?:góc\\s+)?(PN)(PN)(PN)', 'g');
      while ((q = rtg.exec(snt))) {
        const [O, T, A0, V, B0] = [q[1], q[2], q[3], q[4], q[5]];
        if (O !== V || isDef(T)) continue;
        const h = helper(); hidden.push(h); add(T, [O, A0, B0], h + ' = chia(' + A0 + ', ' + B0 + ', 0.42)\n' + T + ' = dat(' + O + ', ' + h + ', ' + O + ', ' + A0 + ')', 'tia nằm trong góc', ['doan ' + O + T]); hit = true;
      }
      // trên tia Ox lấy hai điểm A và B (sao cho OA = 3 cm, OB = 6 cm)
      const rtia2 = re('trên\\s+tia\\s+(PN)(PN)\\s*,?\\s*lấy\\s+(?:hai|ba|các)\\s+điểm\\s+((?:PN)(?:\\s*(?:,|và)\\s*PN)+)', 'g');
      while ((q = rtia2.exec(snt))) {
        const O = q[1], X = q[2], ns = listNames(q[3]);
        ns.forEach((n, i) => {
          if (isDef(n)) return;
          const w = re('(?:' + O + n + '|' + n + O + ')\\s*=\\s*(\\d+(?:[.,]\\d+)?)').exec(snt), r = w && lenOf(w[1]);
          add(n, [O, X], n + (r ? ' = dat(' + O + ', ' + X + ', ' + r2(r.v) + ')' : ' = chia(' + O + ', ' + X + ', ' + r2((i + 1) / (ns.length + 1)) + ')'), 'điểm trên tia', ['doan ' + O + n]);
          onSeg[n] = [O, X];
        });
        hit = true;
      }
      const rtia = re('(?:trên\\s+tia\\s+(?:phân giác\\s+)?(đối\\s+của\\s+tia\\s+)?(PN)(PN)\\s*,?\\s*lấy\\s+(?:một\\s+)?(?:điểm\\s+)?(PN)|(PN)\\s+(?:là\\s+(?:một\\s+)?điểm\\s+)?(?:bất k[ìỳ]\\s+)?(?:thuộc|nằm trên|trên)\\s+tia\\s+(?:phân giác\\s+)?(đối\\s+của\\s+tia\\s+)?(PN)(PN))(?:\\s+sao cho\\s+([^,;.]+))?', 'g');
      while ((q = rtia.exec(snt))) {
        const opp = !!(q[1] || q[6]), O = q[2] || q[7], X = q[3] || q[8], n = q[4] || q[5];
        if (isDef(n) || !O || !X) continue;
        const c3 = (q[9] || '').replace(/\s+/g, ''), w = re('^(PN)(PN)=(PN)(PN)$').exec(c3), wn = re('^(PN)(PN)=([\\d.,]+)(?:cm)?$').exec(c3);
        let line, need = [O, X], tk = [];
        const side = w && ([w[1], w[2]].sort().join() === [O, n].sort().join() ? [w[3], w[4]] : [w[3], w[4]].sort().join() === [O, n].sort().join() ? [w[1], w[2]] : null);
        let dir = X, pre = '';
        if (opp) { dir = helper(); pre = dir + ' = doixung(' + X + ', ' + O + ')\n'; hidden.push(dir); }
        if (side && opp && side.sort().join() === [O, X].sort().join()) { line = n + ' = doixung(' + X + ', ' + O + ')'; pre = ''; hidden.pop(); tk = [O + X, O + n]; }
        else if (side) { line = pre + n + ' = dat(' + O + ', ' + dir + ', ' + side.join(', ') + ')'; need = need.concat(side); tk = [side.join(''), O + n]; }
        else if (wn && [wn[1], wn[2]].sort().join() === [O, n].sort().join()) { const r = lenOf(wn[3]); line = pre + n + ' = dat(' + O + ', ' + dir + ', ' + r2(r ? r.v : 1) + ')'; }
        else { line = pre + n + (opp ? ' = chia(' + O + ', ' + dir + ', 0.8)' : ' = chia(' + O + ', ' + X + ', 0.6)'); if (c3) notes.push('điểm ' + n + ' trên tia ' + O + X + ': chưa rõ vị trí, đặt tạm'); }
        add(n, need, line, opp ? 'điểm trên tia đối' : 'điểm trên tia', ['doan ' + O + n].concat(tk.length ? ['bang ' + tk.join(' ') + ' = #'] : []));
        onSeg[n] = [O, X];
        hit = true;
      }
      // ba điểm X, Y, Z thẳng hàng: nối hai điểm ngoài (đường qua điểm giữa)
      const rk = re('(?:ba\\s+điểm\\s+)?(PN)\\s*,\\s*(PN)\\s*(?:,|và)\\s*(PN)\\s+thẳng hàng', 'g');
      while ((q = rk.exec(snt))) { cons.push({ name: '', need: [q[1], q[2], q[3]], line: '', src: '', more: ['doan ' + q[1] + q[3]] }); hit = true; }
      // điều phải chứng minh "ba điểm D, E, F thẳng hàng" (các điểm đã dựng): vẽ đường thẳng qua ba điểm như hình SGK
      if (snt !== snt0) { const rk2 = re('(?:ba\\s+điểm\\s+)?(PN)\\s*,\\s*(PN)\\s*(?:,|và)\\s*(PN)\\s+thẳng hàng', 'g'); while ((q = rk2.exec(snt0.slice(cutAt)))) cons.push({ name: '', need: [q[1], q[2], q[3]], line: '', src: '', more: ['thanghang ' + q[1] + ' ' + q[2] + ' ' + q[3]] }); }
      // điểm trên cạnh theo tỉ số / độ dài
      const r6 = re('(?:(PN)\\s+(?:là\\s+(?:một\\s+)?điểm\\s+)?(?:bất k[ìỳ]\\s+)?(?:thuộc|nằm trên|trên)\\s+(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)?((?:PN){2})|trên\\s+(?:cạnh\\s+|đoạn\\s+(?:thẳng\\s+)?)((?:PN){2})\\s*,?\\s*lấy\\s+(?:một\\s+)?(?:điểm\\s+)?(PN)(?:\\s+(?:tùy ý|tuỳ ý|bất k[ìỳ]))?)(?:\\s+sao cho\\s+([^,;.]+))?', 'g');
      while ((q = r6.exec(snt))) {
        const n = q[1] || q[4], sg = namesIn(q[2] || q[3]); if (sg.length !== 2 || isDef(n)) continue;
        let k = 0.4, ok = !q[5] || /bất k[ìỳ]/.test(q[0]);
        // "lấy điểm B thuộc d (B) khác H": đặt xa điểm đã nêu để hai điểm không sát nhau
        // (khác cả hai đầu mút "M khác A và D" thì giữ vị trí giữa đoạn)
        const kh = re('^\\s*,?\\s*\\(?\\s*(?:PN\\s*)?(?:khác|≠|\\\\ne)\\s+(?:điểm\\s+)?(PN)(?:\\s*(?:,|và)\\s*(PN))?').exec(snt.slice(r6.lastIndex) + ' ');
        if (kh && !(kh[2] && sg.includes(kh[1]) && sg.includes(kh[2]))) k = 0.82;
        if (q[5]) {
          const c3 = q[5].replace(/\s+/g, '');
          let w;
          if ((w = re('^(PN)(PN)=([\\d.,()/]*)(PN)(PN)$').exec(c3)) && [w[1], w[2]].includes(n) && [w[4], w[5]].includes(n)) {
            // N chia đoạn: "BN = 2NC", "NC = 2NB" (mọi thứ tự viết): |N L| = k·|N R|
            const Lp = w[1] === n ? w[2] : w[1], Rp = w[4] === n ? w[5] : w[4], r = w[3] ? lenOf(w[3]) : { v: 1 };
            if (r && sg.includes(Lp) && sg.includes(Rp) && Lp !== Rp) { const kk = r.v / (r.v + 1); k = Lp === sg[0] ? kk : 1 - kk; ok = true; }
          }
          else if ((w = re('^(PN)(PN)=([\\d.,()/]+)(PN)(PN)$').exec(c3)) && w[2] === n) { const r = lenOf(w[3]); if (r && r.v < 1) { k = w[1] === sg[0] ? r.v : 1 - r.v; ok = true; } }
          else if ((w = re('^(PN)(PN)=([\\d.,]+(?:cm)?)$').exec(c3)) && w[2] === n) { const r = lenOf(w[3]), whole = getL(sg[0], sg[1]); if (r && whole && r.v < whole) { k = w[1] === sg[0] ? r.v / whole : 1 - r.v / whole; ok = true; } }
          else if ((w = re('^(PN)(PN)=(PN)(PN)$').exec(c3))) {
            // hai đoạn bằng nhau, vd AE = DF với F trên CD: F cách D một đoạn bằng AE
            const s1 = [w[1], w[2]], s2 = [w[3], w[4]], mine = s1.includes(n) ? s1 : s2.includes(n) ? s2 : null, other = mine === s1 ? s2 : s1;
            const P = mine && mine.find((x) => x !== n);
            if (mine && P && sg.includes(P) && !other.includes(n)) {
              const Q = sg.find((x) => x !== P);
              add(n, [P, Q].concat(other), n + ' = dat(' + P + ', ' + Q + ', ' + other.join(', ') + ')', 'điểm trên cạnh', ['bang ' + other.join('') + ' ' + P + n + ' = #']);
              onSeg[n] = sg; hit = true; continue;
            }
          }
        }
        // đường thẳng có điểm gốc (trung trực d qua trung điểm): đặt điểm cách gốc một khoảng vừa phải, không sát đoạn AB
        const thr = lineThrough[sg.join('')];
        if (thr && !q[5]) add(n, sg, n + ' = chia(' + thr + ', ' + (lcLabel[sg[0]] ? sg[1] : sg[0]) + ', 0.75)', 'điểm trên đường thẳng');
        else add(n, sg, n + ' = chia(' + sg.join(', ') + ', ' + r2(k) + ')', 'điểm trên cạnh');
        onSeg[n] = sg;
        if (!ok) notes.push('điểm ' + n + ' trên ' + sg.join('') + ': chưa rõ vị trí, đặt tạm');
        hit = true;
      }
      // đường tròn (B; BA), đường tròn tâm B bán kính BA, đường tròn đường kính BC
      const rd = re('đường tròn\\s*(?:\\(\\s*(PN)\\s*;\\s*(PN)(PN)\\s*\\)|tâm\\s+(PN)\\s*,?\\s*bán kính\\s+(PN)(PN)|đường kính\\s+(PN)(PN))', 'g');
      while ((q = rd.exec(snt))) {
        if (q[7] && diaReg[[q[7], q[8]].sort().join('')]) { hit = true; continue; }
        if (q[7]) { const h = helper(); diaReg[[q[7], q[8]].sort().join('')] = h; circReg[h] = q[7]; circOn[h] = [q[7], q[8]]; cons.push({ name: h, need: [q[7], q[8]], line: h + ' = trungdiem(' + q[7] + ', ' + q[8] + ')', src: '', more: ['duongtron ' + h + ' ' + q[7]] }); hidden.push(h); }
        else { const c = q[1] || q[4], a = q[1] ? q[2] : q[5], b = q[1] ? q[3] : q[6]; cons.push({ name: '', need: [c, a, b], line: '', src: '', more: ['duongtron ' + c + ' ' + (a === c ? b : a)] }); }
        hit = true;
      }
      // điểm trên đường tròn, dây, tiếp tuyến
      if (cir && cir.o) {
        const O = cir.o;
        const ro = re('(?:lấy\\s+)?(?:(?:các|hai|một|ba)\\s+)?(?:điểm\\s+)?((?:PN)(?:\\s*(?:,|và)\\s*PN)*)\\s+(?:là\\s+)?(?:(?:các|hai|một|ba)\\s+)?(?:điểm\\s+)?(?:bất kì\\s+|phân biệt\\s+|khác\\s+[A-Z]\\s+)?(?:nằm\\s+)?(?:trên|thuộc)\\s+(?:nửa\\s+)?(?:đường tròn|\\(\\s*' + O + '\\s*[);]|cung)', 'g');
        while ((q = ro.exec(snt))) { listNames(q[1]).forEach((n) => { if (!isDef(n) && n !== O) { onCirc.push(n); cons.push({ name: n, need: [O], line: '', src: 'điểm trên đường tròn', more: [] }); hit = true; } }); }
        const rch = re('dây\\s+(?:cung\\s+)?((?:PN){2})', 'g');
        while ((q = rch.exec(snt))) { namesIn(q[1]).forEach((n) => { if (!isDef(n)) { if (!onCirc.length) chordFirst.push(n); else if (chordFirst.length === 1 && onCirc.length === 1) chordFirst.push(n); onCirc.push(n); cons.push({ name: n, need: [O], line: '', src: 'dây', more: [] }); } }); cons.push({ name: '', need: namesIn(q[1]), line: '', src: '', more: ['doan ' + q[1]] }); hit = true; }
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
        while (!tanDone && (q = rta.exec(snt))) {
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
      const pool = chordFirst.length === 2 && !base.dia ? [210, 330, 100, 40, 150, -90] : circPool.length ? circPool : [70, 215, 325, 120, 30, -50, 160];
      onCirc.forEach((n, i) => { const c = cons.find((x) => x.name === n); if (c) c.line = n + ' = tron(' + cir.o + ', ' + rArg + ', ' + pool[i % pool.length] + ')'; });
    }
    // dựng theo thứ tự phụ thuộc
    const after = [], built = [];
    let guard = 0;
    while (cons.length && guard++ < 80) {
      const i = cons.findIndex((c) => c.need.every((n) => made.has(n)));
      if (i < 0) break;
      const c = cons.splice(i, 1)[0];
      if (c.line) { lines.push(c.line); c.line.split('\n').forEach((l) => { const d = /^([A-Z]\d*)\s*=/.exec(l); if (d) made.add(d[1]); }); }
      if (c.name) { made.add(c.name); built.push(c.name); }
      c.more.forEach((x) => after.push(x));
    }
    cons.forEach((c) => { if (c.name && !/^Z\d+$/.test(c.name)) unknown.push('không dựng được điểm ' + c.name + ' (' + c.src + '): thiếu điểm ' + c.need.filter((n) => !made.has(n)).join(', ')); });

    // ---------- 4. Đoạn, đa giác được nhắc tới ----------
    const out = [], seen = new Set();
    const push = (s) => { if (!seen.has(s)) { seen.add(s); out.push(s); } };
    after.filter((s) => /^(doan|duongthang|tia|duongtron|ngoaitiep|noitiep|thanghang)/.test(s)).forEach((s) => { push(s); if (/^doan/.test(s)) s.slice(5).trim().split(/\s+/).forEach((sg) => { const ns = namesIn(sg); if (ns.length === 2) edge(ns[0], ns[1]); }); });
    // đa giác được nhắc tới: "tứ giác ABCD", "hình chữ nhật ABDC", và cả "ABDC là hình chữ nhật" (tên đứng trước)
    const polyM = (t.match(/(?:tam giác|tứ giác|hình bình hành|hình chữ nhật|hình thoi|hình vuông|hình thang)\s+(?:\S+\s+)?([A-Z]{3,4})(?![A-Za-z'])/g) || [])
      .concat((t.match(/(?<![A-Za-z])[A-Z]{4}(?=\s+(?:là|cũng là)\s+(?:một\s+)?(?:tứ giác|hình bình hành|hình chữ nhật|hình thoi|hình vuông|hình thang))/g) || []));
    polyM.forEach((x) => {
      const ns = namesIn(/([A-Z]{3,4})$/.exec(x)[1]);
      if (ns.every((n) => made.has(n)) && ns.join('') !== baseNames.join('')) { const sg = ns.map((n, i) => [n, ns[(i + 1) % ns.length]]).filter((p) => !edges.has(key(p[0], p[1]))); if (sg.length) push('doan ' + sg.map((p) => p.join('')).join(' ')); cyc(ns); }
    });
    let mq;
    const segRe = re('(vectơ\\s+)?(?<![A-Za-zÀ-ỹ.(])((?:PN){2})(?![A-Za-zÀ-ỹ(])', 'g');
    while ((mq = segRe.exec(t))) {
      const ns = namesIn(mq[2]);
      if (ns.length !== 2 || ns[0] === ns[1] || !ns.every((n) => made.has(n))) continue;
      // vectơ được nhắc trong đề: vẽ đoạn thẳng như hình SGK (không thêm mũi tên chồng lên cạnh)
      if (!edges.has(key(ns[0], ns[1]))) { push('doan ' + ns.join('')); edge(ns[0], ns[1]); }
    }
    out.forEach((s) => lines.push(s));
    // dấu: góc vuông, cạnh bằng nhau, góc cho trước
    after.filter((s) => /^(vuong|bang|goc|diem)/.test(s)).forEach((s) => {
      if (/^bang .* = #$/.test(s)) { tickN++; s = s.replace('#', String(Math.min(tickN, 4))); }
      marks.push(s);
    });
    const markOk = (s) => { const g = s.replace(/=.*$/, '').trim().split(/\s+/).slice(1); return g.every((x) => namesIn(x).every((n) => made.has(n))); };
    // góc chính có tia nằm trong (tia phân giác, tia Ot…) đã đánh dấu các góc con: bỏ cung số đo của góc lớn để không chồng
    if (base.k === 'ang') {
      const big = 'goc ' + base.a + base.o + base.b + ' =';
      if (marks.some((s) => /^goc /.test(s) && !s.startsWith(big) && markOk(s) && s.slice(4).trim().split(/\s+/).some((g) => namesIn(g)[1] === base.o))) {
        for (let i = marks.length - 1; i >= 0; i--) if (marks[i].startsWith(big)) marks.splice(i, 1);
      }
    }
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
    // cạnh có điểm lấy trên đó (vd trung điểm M của AB): không ghi độ dài giữa cạnh để khỏi đè tên điểm
    const busyEdge = (s) => { const m3 = /^ghi\s+(\S+)/.exec(s); if (!m3) return false; const e = namesIn(m3[1]).sort().join(); return Object.keys(onSeg).some((n) => made.has(n) && onSeg[n].slice().sort().join() === e); };
    // dấu bằng nhau đặt ở giữa cạnh: cạnh đã có điểm lấy trên đó (D trên AB của tam giác đều…) thì bỏ dấu của cạnh nguyên,
    // để không lẫn với dấu của các đoạn con (AD = BE = CF)
    const baseEdge = (e) => baseNames.some((n, i) => [n, baseNames[(i + 1) % baseNames.length]].sort().join() === e);
    const busyTick = (s) => /^bang /.test(s) && s.replace(/=.*$/, '').trim().split(/\s+/).slice(1).some((g) => { const e = namesIn(g).sort().join(); return baseEdge(e) && Object.keys(onSeg).some((n) => made.has(n) && onSeg[n].slice().sort().join() === e); });
    marks.filter((s) => !/^(vuong|diem)/.test(s) && markOk(s) && !busyEdge(s) && !busyTick(s)).forEach((s) => { if (!lines.includes(s)) lines.push(s); });
    marks.filter((s) => /^diem/.test(s)).forEach((s) => namesIn(s.slice(5)).forEach((n) => dots.add(n)));
    // điểm lấy trên một đoạn mà không có đường nào khác đi tới: bộ vẽ (plane.js) tự chấm theo toạ độ thật — giao điểm
    // của hai đường (K trên MI, nơi đường EF đi qua) đã rõ vị trí nên không chấm (như SGK)
    // nhãn viết thường của tia, đường thẳng (x, y, z, t, d); điểm thứ hai của đường thẳng một tên (d) thì ẩn
    Object.keys(lcLabel).forEach((c) => { if (made.has(c)) { lines.push('nhan ' + c + ' = ' + lcLabel[c]); dots.delete(c); } });
    lcHide.forEach((c) => { if (made.has(c)) { hidden.push(c); dots.delete(c); } });
    // tên có chỉ số (G_1, G_2 trong đề): nhãn viết chỉ số dưới
    [...made].filter((n) => /^[A-Z]\d$/.test(n) && !lcLabel[n] && !hidden.includes(n) && !/^Z\d+$/.test(n)).forEach((n) => lines.push('nhan ' + n + ' = ' + n[0] + '_{' + n[1] + '}'));
    const dd = [...dots].filter((n) => made.has(n));
    if (dd.length) lines.push('diem ' + dd.join(' '));
    const hh = hidden.filter((n) => made.has(n));
    if (hh.length) lines.push('an ' + hh.join(' '));
    // câu có vẻ là dựng hình nhưng chưa hiểu
    sentences.forEach((snt, si) => {
      if (used.has(si)) return;
      if (userSi.has(si + 1) && !userSi.has(si)) return; // điểm của câu này đã được giáo viên mô tả lại ngay sau
      if (/(chứng minh|chứng tỏ|tính|tìm|xác định|hỏi|so sánh|giải thích|vì sao|có bằng|có song song|có vuông góc)/i.test(snt)) return;
      if (base.i != null && t.indexOf(snt) <= base.i && t.indexOf(snt) + snt.length >= base.end) return;
      if (re('(PN)\\s+(?:là|thuộc)\\s+|kẻ\\s+|vẽ\\s+|sao cho|lấy điểm|dựng\\s+').test(snt)) { unknown.push(snt.trim()); chuaHieu.push(hien(snt.trim())); }
    });
    // điểm có tên trong phần giả thiết mà chưa dựng được (kèm lí do: thiếu điểm nào), để gợi ý giáo viên sửa câu
    const thieu = [];
    {
      // bỏ nhãn của định dạng Bài giải (#C Câu 2., #G, #H1…) — không phải tên điểm
      const gt = sentences.map((s) => s.replace(/#[A-Z]+\d*\b[^.]*\.?/g, ' ')).map((s) => { const c = s.search(/(?:^|\s)(?:chứng minh|chứng tỏ|suy ra|từ đó|tính|so sánh|tìm|xác định)(?=\s|$)/i); return c < 0 ? s : s.slice(0, c); }).join(' ');
      const all = [...new Set(namesIn(gt.replace(re('(?<![A-Za-zÀ-ỹ])(?:PN){2,}', 'g'), (m0) => ' ' + m0 + ' ')))].filter((n) => !lcLabel[n] && !lcHide.includes(n));
      all.forEach((n) => {
        if (made.has(n)) return;
        const c = cons.find((x) => x.name === n), can = c ? c.need.filter((x) => !made.has(x)) : [];
        // câu nói tới điểm (bỏ câu kết luận "chứng minh …")
        const cau = sentences.filter((s) => re('(?<![A-Za-z])' + escRe(n) + '(?![a-z\'])').test(s) && !/^\s*(?:chứng minh|chứng tỏ|suy ra|tính|so sánh|tìm|xác định)(?=\s|$)/i.test(s)).map((s) => hien(s.trim())).slice(0, 2);
        thieu.push({ ten: n, can: can.map((x) => hien(x)), cau });
      });
    }
    // tia đặt tên chữ thường (Ox, Oz…): điểm dựng thêm nằm trên tia mà xa hơn đầu tia (M trên Oz) thì kéo dài tia qua điểm đó
    // — đầu tia (mang tên x, z) luôn ở cuối nét, không có điểm nào "lòi" ra ngoài tia (tính bằng toạ độ thật của src/plane.js)
    const PLN = root.Plane || (typeof globalThis !== 'undefined' && globalThis.Plane);
    if (PLN && PLN.points && Object.keys(lcLabel).length) {
      try {
        const Q = PLN.points(lines.join('\n'));
        Object.keys(lcLabel).forEach((X) => {
          if (!Q[X] || lcHide.includes(X)) return;
          const segL = lines.find((l) => re('^doan\\s.*(?<![A-Za-z])(PN)' + X + '(?![A-Za-z\'])').test(l));
          const mO = segL && re('(?<![A-Za-z])(PN)' + X + '(?![A-Za-z\'])').exec(segL.slice(5)); if (!mO || !Q[mO[1]]) return;
          const O = mO[1], o = Q[O], x = Q[X], dx = x[0] - o[0], dy = x[1] - o[1], L2 = dx * dx + dy * dy; if (!L2) return;
          let tmax = 0;
          Object.keys(Q).forEach((n) => {
            if (n === X || n === O || /^Z\d+$/.test(n) || lcLabel[n]) return;
            const p = Q[n], t = ((p[0] - o[0]) * dx + (p[1] - o[1]) * dy) / L2, d = Math.abs((p[0] - o[0]) * dy - (p[1] - o[1]) * dx) / Math.sqrt(L2);
            if (d < 1e-6 && t > tmax) tmax = t;
          });
          if (tmax <= 0.8) return;
          // giữ X cho các phép dựng khác (điểm khác dựng theo X); nét tia vẽ tới điểm phụ E xa hơn, tên tia chuyển sang E
          const i = lines.findIndex((l) => l.startsWith(X + ' = ')); if (i < 0) return;
          const E = helper();
          lines.splice(i + 1, 0, E + ' = chia(' + O + ', ' + X + ', ' + r2(tmax + 0.22) + ')');
          const seg = new RegExp('(^|\\s)(' + O + X + '|' + X + O + ')(?=\\s|$)');
          for (let j = 0; j < lines.length; j++) if (/^doan /.test(lines[j]) && seg.test(lines[j])) lines[j] = lines[j].replace(seg, '$1' + O + E);
          for (let j = 0; j < lines.length; j++) if (lines[j] === 'nhan ' + X + ' = ' + lcLabel[X]) lines[j] = 'nhan ' + E + ' = ' + lcLabel[X];
          hidden.push(X);
        });
        const hh2 = hidden.filter((n) => made.has(n) || lines.some((l) => l.startsWith(n + ' = ')));
        const ai = lines.findIndex((l) => /^an /.test(l));
        if (hh2.length) { if (ai >= 0) lines[ai] = 'an ' + [...new Set(hh2)].join(' '); else lines.push('an ' + [...new Set(hh2)].join(' ')); }
      } catch (err) { /* giữ nguyên */ }
    }
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
    // các điểm đã dựng từ lời đề (không kể đỉnh hình chính, điểm phụ): để giáo viên mô tả lại điểm vẽ sai
    const diem = built.filter((n) => !/^Z\d+$/.test(n) && !lcLabel[n] && !lcHide.includes(n) && !hidden.includes(n) && !baseNames.includes(n))
      .map((n) => ({ ten: n, cau: sentences.filter((s) => re('(?<![A-Za-z])' + escRe(n) + '(?![a-z\'])').test(s)).map((s) => hien(s.trim()))[0] || '' }))
      .filter((d, i, a) => d.cau && a.findIndex((x) => x.ten === d.ten) === i);
    return { kind: tpl || 'tamgiac', script: lines.join('\n'), notes, unknown, chuaHieu, thieu, diem };
  }

  // ---------- Cách vẽ do giáo viên dạy (ghi nhớ) ----------
  // Câu phần mềm chưa hiểu được giáo viên viết lại theo cách phần mềm hiểu; cặp (câu gốc → câu viết lại) được ghi nhớ
  // thành mẫu chung: tên điểm thay bằng {1}, {2}… — lần sau gặp câu cùng dạng (tên điểm khác) thì tự đổi rồi mới đọc.
  let RULES = [];
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function ruleRe(from) {
    const seen = {};
    let src = escRe(from).replace(/\\\{(\d+)\\\}/g, (m0, n) => { if (seen[n]) return '\\' + seen[n]; seen[n] = Object.keys(seen).length + 1; return '(' + PN + ')'; });
    src = src.replace(/\s+/g, '\\s*');
    return { rx: new RegExp(src, 'gi'), order: Object.keys(seen).sort((a, b) => seen[a] - seen[b]) };
  }
  function setRules(list) { RULES = (list || []).filter((r) => r && r.from && r.to).map((r) => Object.assign({}, r, ruleRe(r.from))); }
  function apRules(t) {
    RULES.forEach((r) => { r.rx.lastIndex = 0; t = t.replace(r.rx, (...g) => { const vals = g.slice(1, 1 + r.order.length); return r.to.replace(/\{(\d+)\}/g, (m0, n) => { const i = r.order.indexOf(n); return i >= 0 ? vals[i] : m0; }); }); });
    return t;
  }
  // tạo mẫu từ câu gốc và câu viết lại: tên điểm (A, B, A', G1) theo thứ tự xuất hiện trong câu gốc → {1}, {2}…
  function hocMau(goc, moi) {
    const a = norm(goc).replace(/[.;]\s*$/, ''), b = norm(moi).replace(/[.;]\s*$/, '');
    const map = {}; let k = 0;
    const gen = (s, add) => s.replace(re('(?<![A-Za-zÀ-ỹ])((?:PN)+)(?![a-zà-ỹ])', 'g'), (m0) => namesIn(m0).map((n) => { if (!map[n] && add) map[n] = '{' + (++k) + '}'; return map[n] || n; }).join(''));
    const from = gen(a, true), to = gen(b, false);
    if (!k || from === to) return null;
    return { from, to, goc: a, moi: b };
  }
  // gợi ý cách viết mà phần mềm hiểu, theo từ khoá trong câu; điền sẵn tên điểm của chính câu đó
  function goiY(cau) {
    const s = norm(cau);
    const tok = (rx) => { const m0 = re(rx).exec(s); return m0 ? m0[1] : ''; };
    // vai trò của tên điểm trong câu: điểm sau "qua", đường sau "song song / vuông góc (với)", đường sau "cắt", điểm sau "tại"
    // tên đường: hai điểm (BC) hoặc tia / đường viết thường (Oy, Ox, d)
    const LN = '((?:PN){2}|[A-Z][a-z]|[a-z])';
    const qua = tok('qua\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])'), voi = tok('(?:song song|vuông góc|⊥|∥|//)\\s*(?:với\\s+)?(?:đường thẳng\\s+|cạnh\\s+|tia\\s+)?' + LN + '(?![A-Za-z])');
    const cat = tok('cắt\\s+(?:cạnh\\s+|đường thẳng\\s+|đoạn thẳng\\s+|tia\\s+)?' + LN + '(?![A-Za-z])'), tai = tok('tại\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])');
    const pairs = s.match(re('(?<![A-Za-zÀ-ỹ])(?:PN){2}(?![A-Za-z])', 'g')) || [], quad = tok('(?:tứ giác|hình)\\s+(?:\\S+\\s+)?([A-Z]{4})(?![A-Za-z])'), tri = tok('(?:tam giác|góc)\\s+([A-Z]{3})(?![A-Za-z])');
    const singles = (s.match(re('(?<![A-Za-zÀ-ỹ])(PN)(?![A-Za-z\'])', 'g')) || []);
    const sub = tok('^\\s*(?:gọi|lấy|cho)?\\s*(?:điểm\\s+)?(PN)\\s+(?:là|thuộc|nằm|trên)') || singles[0] || '';
    const P = (x, d) => x || d, out = [], add = (x) => { if (!out.includes(x)) out.push(x); };
    if (/song song|∥|\/\//.test(s)) {
      if (quad && /cạnh đối|song song/.test(s)) add(quad + ' là hình bình hành.');
      add('Qua ' + P(qua, P(sub, 'M')) + ' kẻ đường thẳng song song với ' + P(voi, 'BC') + ' cắt ' + P(cat, 'AC') + ' tại ' + P(tai, 'N') + '.');
    }
    if (/vuông góc|⊥/.test(s)) {
      const ab = pairs[0] || 'AH', cd = voi || pairs[1] || 'BC';
      if (!qua) add('Kẻ ' + ab + ' ⊥ ' + cd + ' tại ' + P(tai, ab[ab.length - 1]) + '.');
      add('Qua ' + P(qua, ab[0]) + ' kẻ đường thẳng vuông góc với ' + cd + ' cắt ' + P(cat, 'AB') + ' tại ' + P(tai, 'N') + '.');
    }
    if (/trung điểm/.test(s)) add(P(sub, 'M') + ' là trung điểm của ' + P(pairs[0], 'BC') + '.');
    if (/phân giác/.test(s)) add('Tia phân giác của góc ' + P(tri, 'BAC') + ' cắt ' + P(cat, 'BC') + ' tại ' + P(tai, 'D') + '.');
    if (/giao|cắt nhau/.test(s) || (/cắt/.test(s) && !/song song|vuông góc|∥|⊥|\/\//.test(s))) { add(P(tai, P(sub, 'I')) + ' là giao điểm của ' + P(pairs[0], 'AB') + ' và ' + P(pairs[1], 'CD') + '.'); }
    if (/đối xứng/.test(s)) add(P(sub, 'D') + ' đối xứng với ' + P(singles[1], 'A') + ' qua ' + P(singles[2], 'M') + '.');
    if (/tia đối/.test(s)) add('Trên tia đối của tia ' + P(pairs[0], 'MA') + ' lấy điểm ' + P(sub, 'D') + ' sao cho ' + (pairs[0] ? pairs[0][0] : 'M') + P(sub, 'D') + ' = ' + P(pairs[0], 'MA') + '.');
    if (/lấy|thuộc|nằm trên/.test(s) && !/tia đối/.test(s) && !qua) add('Trên cạnh ' + P(pairs[0], 'BC') + ' lấy điểm ' + P(sub, 'M') + '.');
    if (/đường cao|trung tuyến/.test(s)) add('Kẻ đường cao ' + P(pairs[0], 'AH') + ' của tam giác ' + P(tri, 'ABC') + '.');
    if (/hình chiếu|chân/.test(s)) add(P(sub, 'H') + ' là hình chiếu của ' + P(singles[1], 'A') + ' trên ' + P(pairs[0], 'BC') + '.');
    if (/tiếp tuyến/.test(s)) add('Tiếp tuyến tại ' + P(singles[0], 'A') + ' của đường tròn (O) cắt ' + P(cat, 'BC') + ' tại ' + P(tai, 'M') + '.');
    if (/đường tròn/.test(s) && !/tiếp tuyến/.test(s)) add(P(pairs[0], 'AB') + ' cắt đường tròn (O) tại điểm thứ hai ' + P(tai, 'C') + '.');
    if (/thẳng hàng/.test(s)) add('Ba điểm ' + (singles.slice(0, 3).join(', ') || 'A, B, C') + ' thẳng hàng.');
    if (!out.length) { add(P(sub, 'M') + ' là trung điểm của ' + P(pairs[0], 'BC') + '.'); add(P(sub, 'I') + ' là giao điểm của ' + P(pairs[0], 'AB') + ' và ' + P(pairs[1], 'CD') + '.'); }
    // câu mẫu viết hoa đầu câu
    return out.slice(0, 4).map((x) => x[0].toUpperCase() + x.slice(1));
  }


  // ---------- sửa từng điểm ----------
  // mô tả ngắn của giáo viên cho một điểm → câu đầy đủ ToanViet đọc được
  // ("giao điểm của Bx và AD" → "E là giao điểm của Bx và AD"; "qua B kẻ đường thẳng song song với AC cắt AD" → "… tại E")
  function cauDiem(ten, moTa) {
    const T = escRe(ten);
    let m = norm(moTa).replace(/[.;]\s*$/, '').trim().replace(re('^(?:điểm\\s+)?' + T + '\\s*(?::\\s*|là\\s+)'), '').trim();
    if (!m) return '';
    m = m.replace(/^giao\s+(?!điểm)(?:của\s+)?/, 'giao điểm của ');
    if (re('(?<![A-Za-z])' + T + '(?![a-z\'\\d])').test(m)) return m; // đã là câu có tên điểm
    if (/^(?:qua|từ|vẽ|kẻ|dựng)\s/.test(m) && /cắt/.test(m)) return m.replace(/\s+tại\s*$/, '') + ' tại ' + ten;
    if (/^trên\s/.test(m)) return /lấy/.test(m) ? m.replace(/lấy(?:\s+(?:một\s+)?điểm)?/, 'lấy điểm ' + ten) : m + ' lấy điểm ' + ten;
    if (/^(?:thuộc|nằm|đối xứng)/.test(m)) return ten + ' ' + m;
    return ten + ' là ' + m;
  }
  // gợi ý mô tả cho điểm `ten` theo câu đề nói tới điểm đó (điền sẵn tên đường, tên điểm của câu)
  function goiYDiem(ten, cau) {
    // bỏ gợi ý trùng nghĩa ("qua A … cắt Oz" và "Qua A … cắt Oz tại M" cùng một câu đầy đủ)
    const s = norm(cau || ''), T = escRe(ten), out = [], full = (x) => cauDiem(ten, x).toLowerCase(), add = (x) => { if (x && !out.some((o) => full(o) === full(x))) out.push(x); };
    const LN = '((?:PN){2}|[A-Z][a-z]|[a-z])', VE = '(?:tia\\s+|đường thẳng\\s+|cạnh\\s+|đoạn thẳng\\s+|đoạn\\s+)?';
    const tok = (rx, i) => { const m0 = re(rx).exec(s); return m0 ? m0[i || 1] : ''; };
    const cat = tok('cắt\\s+' + VE + LN + '\\s+(?:lần lượt\\s+)?tại\\s+(?:điểm\\s+)?' + T + '(?![A-Za-z\'])');
    // "Bx cắt tia AD tại E" (không lấy "… song song với Oy cắt Oz tại M": Oy là đường so sánh)
    const subj = tok('(?<![A-Za-zÀ-ỹ])(?<!(?:song song|vuông góc|∥|⊥|//)\\s*(?:với\\s+)?' + VE + ')' + LN + '\\s+cắt\\s+' + VE + LN + '\\s+tại\\s+(?:điểm\\s+)?' + T + '(?![A-Za-z\'])');
    const voi = tok('(?:song song|vuông góc|⊥|∥|//)\\s*(?:với\\s+)?' + VE + LN + '(?![A-Za-z])');
    const qua = tok('qua\\s+(?:điểm\\s+)?(PN)(?![A-Za-z])') || tok('(?:tia|đường thẳng)\\s+(PN)[a-z](?![A-Za-zÀ-ỹ])');
    const pairs = (s.match(re('(?<![A-Za-zÀ-ỹ])(?:PN){2}(?![A-Za-z])', 'g')) || []).filter((p) => !namesIn(p).includes(ten));
    const lines = (s.match(re('(?<![A-Za-zÀ-ỹ])(?:(?:PN){2}|[A-Z][xyztmn])(?![A-Za-z])', 'g')) || []).filter((p) => !namesIn(p).includes(ten));
    { const qd = tok('(?:tứ giác|hình)\\s+(?:\\S+\\s+)?([A-Z]{4})(?![A-Za-z])'); if (qd && qd.includes(ten) && /song song|cạnh đối|hình bình hành/.test(s)) add(qd + ' là hình bình hành'); }
    if (subj && cat) add('giao điểm của ' + subj + ' và ' + cat);
    { const g = re('giao điểm\\s+(?:của\\s+)?' + VE + LN + '\\s+(?:và|với)\\s+' + VE + LN).exec(s); if (g) add('giao điểm của ' + g[1] + ' và ' + g[2]); }
    if (voi && (cat || pairs.length) && qua) add('qua ' + qua + ' kẻ đường thẳng ' + (/vuông góc|⊥/.test(s) ? 'vuông góc' : 'song song') + ' với ' + (/^[A-Z][a-z]$/.test(voi) ? (pairs[0] || voi) : voi) + ' cắt ' + (cat || pairs.find((p) => p !== voi) || 'BC'));
    { const g = re('tia đối\\s+của\\s+tia\\s+(PN)(PN)').exec(s); if (g) add('trên tia đối của tia ' + g[1] + g[2] + ' lấy điểm sao cho ' + g[1] + ten + ' = ' + g[1] + g[2]); }
    if (/trung điểm/.test(s) && pairs.length) add('trung điểm của ' + pairs[0]);
    if (/đối xứng/.test(s)) { const g = re('đối xứng\\s+(?:của\\s+|với\\s+)?(?:điểm\\s+)?(PN)\\s+qua\\s+(?:điểm\\s+)?(PN)').exec(s); add('điểm đối xứng của ' + (g ? g[1] + ' qua ' + g[2] : 'A qua M')); }
    if (/vuông góc|⊥|hình chiếu|chân|đường cao/.test(s) && pairs.length) { const a = (s.match(re('(?<![A-Za-zÀ-ỹ])(PN)(?![A-Za-z\'])', 'g')) || []).find((x) => x !== ten) || 'A'; add('hình chiếu của ' + a + ' trên ' + (pairs.find((p) => !p.includes(a)) || pairs[0])); }
    // hai đường bất kì của câu không chung điểm (Ox, Oy chung O: giao là O — không gợi ý)
    { const ls = [...new Set(lines)], nm = (x) => x.replace(/[a-z]/g, '').split(''); let pr = null;
      for (let i = 0; i < ls.length && !pr; i++) for (let j = i + 1; j < ls.length && !pr; j++) if (!nm(ls[i]).some((c) => nm(ls[j]).includes(c))) pr = [ls[i], ls[j]];
      if (pr) add('giao điểm của ' + pr[0] + ' và ' + pr[1]); }
    if (pairs.length) add('trung điểm của ' + pairs[0]);
    // câu mẫu của goiY dựng chính điểm này (… tại E, E là …, lấy điểm E, ABEC là hình …)
    goiY(s).forEach((g) => { if (re('(?:tại|lấy điểm)\\s+' + T + '(?![A-Za-z\'])|^' + T + '\\s+là\\s|^[A-Z]*' + T + '[A-Z]*\\s+là\\s+hình', 'i').test(g)) add(g.replace(/\.$/, '')); });
    return out.slice(0, 4);
  }
  // ghi nhớ cách vẽ một điểm: câu đề gốc (tên điểm → {1}, {2}…) giữ nguyên, thêm câu mô tả điểm, đánh dấu ưu tiên cho điểm đó
  function hocDiem(cau, ten, moTa) {
    const moi = cauDiem(ten, moTa);
    if (!moi) return null;
    const a = norm(cau).replace(/[.;]\s*$/, ''), b = norm(moi).replace(/[.;]\s*$/, '');
    const map = {}; let k = 0;
    const gen = (s, add) => s.replace(re('(?<![A-Za-zÀ-ỹ])((?:PN)+)(?=[b-df-hj-np-tv-z]?(?![a-zà-ỹ]))', 'g'), (m0) => namesIn(m0).map((n) => { if (!map[n] && add) map[n] = '{' + (++k) + '}'; return map[n] || n; }).join(''));
    const from = gen(a, true), to = gen(b, false);
    if (!map[ten]) return null;
    return { from, to: from + ' . ⁂' + map[ten] + ': ' + to, goc: a, moi: b, diem: ten };
  }

  const api = { space, plane, norm, lenVal, setRules, hocMau, goiY, apRules: (t) => apRules(norm(t)), cauDiem, goiYDiem, hocDiem };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DeHinh = api;
})(this);
