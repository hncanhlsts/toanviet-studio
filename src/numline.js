// Trục số (biểu diễn điểm, tập nghiệm bất phương trình, khoảng – đoạn, giao – hợp – hiệu) và biểu đồ Ven
(function (root) {
  'use strict';
  const EPS = 1e-9;
  const r1 = (v) => Math.round(v * 10) / 10;
  const PAL = ['#1f77b4', '#d62728', '#2e8b57', '#8e44ad', '#e67e22'];

  // ---------- Đọc số và tập hợp ----------
  function norm(s) {
    return String(s).replace(/−/g, '-')
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
      .replace(/\\left|\\right|\\,/g, '').replace(/\\infty|∞/g, 'oo').replace(/\\cap|∩/g, '∩').replace(/\\cup|∪/g, '∪')
      .replace(/\\setminus|∖/g, '∖').replace(/\\le(q)?\b|≤/g, '<=').replace(/\\ge(q)?\b|≥/g, '>=').replace(/\\ne(q)?\b|≠|!=/g, '<>')
      .replace(/\\\{/g, '{').replace(/\\\}/g, '}').replace(/\\mathbb\{R\}|ℝ/g, 'R').replace(/\\varnothing|\\emptyset/g, '∅')
      .replace(/\\/g, '∖');
  }
  // Một số: "3/4", "-sqrt(2)", "0,3", "4,1(6)" (tuần hoàn), "-2 1/3" (hỗn số), "+oo"
  function num(src) {
    const s = String(src).trim();
    if (!s) throw new Error('Thiếu số');
    if (/^\+?oo$/.test(s)) return { v: Infinity, tex: '+\\infty' };
    if (/^-oo$/.test(s)) return { v: -Infinity, tex: '-\\infty' };
    let m = s.match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) return { v: (+m[2] + m[3] / m[4]) * (m[1] ? -1 : 1), tex: m[1] + m[2] + '\\frac{' + m[3] + '}{' + m[4] + '}' };
    m = s.match(/^(-?)(\d*)[.,](\d*)\((\d+)\)$/);
    if (m) return { v: parseFloat((m[2] || '0') + '.' + m[3] + m[4].repeat(Math.ceil(16 / m[4].length))) * (m[1] ? -1 : 1), tex: m[1] + (m[2] || '0') + '{,}' + m[3] + '(' + m[4] + ')' };
    m = s.match(/^(-?)(\d*)[.,](\d+)$/);
    if (m) return { v: parseFloat(m[1] + (m[2] || '0') + '.' + m[3]), tex: m[1] + (m[2] || '0') + '{,}' + m[3] };
    if (/^-?\d+$/.test(s)) return { v: parseInt(s, 10), tex: s };
    let t;
    try { t = root.MathExpr.parse(s); } catch (e) { throw new Error('Không hiểu số: ' + s); }
    const v = root.MathExpr.evalTree(t, {});
    if (!isFinite(v)) throw new Error('Không hiểu số: ' + s);
    let tx = s;
    try { tx = root.MathExpr.toTex(t).replace(/\\dfrac/g, '\\frac').replace(/^-\s*(?=\\)/, '{-}'); } catch (e) { /* giữ nguyên chữ */ }
    return { v, tex: tx };
  }

  // Tập hợp = hàm thuộc + các đầu mút (để vẽ)
  const inter = (a, b, ca, cb) => ({ f: (x) => (x > a + EPS || (ca && Math.abs(x - a) < EPS)) && (x < b - EPS || (cb && Math.abs(x - b) < EPS)), pts: [] });
  const OPF = { '∩': (A, B) => (x) => A.f(x) && B.f(x), '∪': (A, B) => (x) => A.f(x) || B.f(x), '∖': (A, B) => (x) => A.f(x) && !B.f(x) };
  const OPT = { '∩': ' \\cap ', '∪': ' \\cup ', '∖': ' \\setminus ' };
  // ngoặc vuông viết bằng lệnh để MathLive không hiểu nhầm là tham số tuỳ chọn
  const BR = { '[': '\\lbrack ', ']': '\\rbrack ', '(': '(', ')': ')' };
  const join = (A, B, k) => ({ f: OPF[k](A, B), pts: A.pts.concat(B.pts), tex: (A.tex || '') + OPT[k] + (B.tex || '') });

  function parseSet(s, env) {
    let i = 0;
    const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
    function expr() {
      let a = term();
      for (;;) {
        ws(); const c = s[i];
        if (c === '∪' || c === '∖') { i++; a = join(a, term(), c); a.parts = null; } else return a;
      }
    }
    function term() {
      let a = prim(); let parts = [a];
      for (;;) {
        ws();
        if (s[i] === '∩') { i++; const b = prim(); parts.push(b); a = join(a, b, '∩'); a.parts = parts; } else return a;
      }
    }
    function prim() {
      ws(); const c = s[i];
      if (c === undefined) throw new Error('Thiếu tập hợp');
      if (c === '∅') { i++; return { f: () => false, pts: [], tex: '\\varnothing' }; }
      if (/[A-Z]/.test(c)) {
        const id = s.slice(i).match(/^[A-Z][A-Za-z0-9_']*/)[0]; i += id.length;
        if (id === 'R') return { f: () => true, pts: [], tex: '\\mathbb{R}' };
        if (env && env[id]) return Object.assign({}, env[id], { tex: id, parts: null });
        throw new Error('Chưa có tập ' + id + ' ở các dòng trên');
      }
      if (c === '{') {
        const j = s.indexOf('}', i); if (j < 0) throw new Error('Thiếu dấu }');
        const items = s.slice(i + 1, j).split(';').map((t) => t.trim()).filter(Boolean).map(num);
        i = j + 1;
        return { f: (x) => items.some((p) => Math.abs(x - p.v) < EPS), pts: items, tex: '\\{' + items.map((p) => p.tex).join(';\\,') + '\\}' };
      }
      if (c === '(' || c === '[') {
        let d = 0, j = i, semi = -1;
        for (; j < s.length; j++) {
          const ch = s[j];
          if (ch === '(' || ch === '[') d++;
          else if (ch === ')' || ch === ']') { d--; if (d === 0) break; }
          else if (ch === ';' && d === 1 && semi < 0) semi = j;
        }
        if (j >= s.length) throw new Error('Thiếu dấu đóng ngoặc');
        if (semi < 0) {
          if (c !== '(') throw new Error('Khoảng cần hai đầu mút cách nhau bằng dấu ;');
          i++; const a = expr(); ws(); if (s[i] !== ')') throw new Error('Thiếu dấu )'); i++;
          return Object.assign({}, a, { tex: '\\left(' + a.tex + '\\right)', parts: null });
        }
        const A = num(s.slice(i + 1, semi)), B = num(s.slice(semi + 1, j));
        const ca = c === '[', cb = s[j] === ']';
        if ((ca && !isFinite(A.v)) || (cb && !isFinite(B.v))) throw new Error('Đầu mút vô cực phải dùng ngoặc tròn');
        if (A.v >= B.v) throw new Error('Đầu mút trái phải nhỏ hơn đầu mút phải');
        i = j + 1;
        const r = inter(A.v, B.v, ca, cb);
        r.pts = [A, B].filter((p) => isFinite(p.v));
        r.tex = BR[c] + A.tex + ';\\,' + B.tex + BR[s[j]];
        return r;
      }
      throw new Error('Không hiểu: ' + s.slice(i));
    }
    const r = expr(); ws();
    if (i < s.length) throw new Error('Không hiểu: ' + s.slice(i));
    return r;
  }

  // Bất phương trình: "x > 4", "-2 < x <= 3", "x < -1 hoặc x >= 2", "x >= 1 và x < 5"
  const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '=': '=', '<>': '<>' };
  const CT = { '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge', '=': '=', '<>': '\\ne' };
  function cmp(o, c) {
    const v = c.v; let r;
    if (o === '<') r = inter(-Infinity, v, false, false);
    else if (o === '<=') r = inter(-Infinity, v, false, true);
    else if (o === '>') r = inter(v, Infinity, false, false);
    else if (o === '>=') r = inter(v, Infinity, true, false);
    else if (o === '=') r = { f: (x) => Math.abs(x - v) < EPS };
    else r = { f: (x) => Math.abs(x - v) >= EPS };
    r.pts = [c];
    return r;
  }
  function chain(q) {
    const tk = q.split(/(<=|>=|<>|<|>|=)/).map((t) => t.trim());
    if (tk.length < 3) throw new Error('Thiếu dấu so sánh');
    const isVar = (t) => /^[a-z]$/i.test(t);
    const vals = tk.map((t, i) => (i % 2 ? null : isVar(t) ? null : num(t)));
    let S = null;
    for (let i = 0; i + 2 < tk.length; i += 2) {
      let o = tk[i + 1], c;
      if (isVar(tk[i]) && vals[i + 2]) c = vals[i + 2];
      else if (isVar(tk[i + 2]) && vals[i]) { c = vals[i]; o = FLIP[o]; }
      else throw new Error('Mỗi phép so sánh cần đúng một ẩn, ví dụ x > 4');
      const r = cmp(o, c);
      S = S ? join(S, r, '∩') : r;
    }
    return { S, tex: tk.map((t, i) => (i % 2 ? CT[t] : isVar(t) ? t : vals[i].tex)).join(' ') };
  }
  function parseIneq(s) {
    let S = null; const tx = [];
    s.split(/\s+(?:hoặc|hoac|or)\s+|∨/i).forEach((part) => {
      let A = null; const at = [];
      part.split(/\s+(?:và|va|and)\s+|∧/i).forEach((q) => { const r = chain(q); A = A ? join(A, r.S, '∩') : r.S; at.push(r.tex); });
      S = S ? join(S, A, '∪') : A;
      tx.push(at.join('\\ \\text{và}\\ '));
    });
    return { S, tex: tx.join('\\ \\text{hoặc}\\ ') };
  }

  // Tách trục số thành các khoảng giữa các đầu mút: khoảng nào, điểm nào thuộc tập
  function pieces(S) {
    const ps = [];
    S.pts.filter((p) => isFinite(p.v)).sort((a, b) => a.v - b.v).forEach((p) => { if (!ps.length || Math.abs(ps[ps.length - 1].v - p.v) > EPS) ps.push(p); });
    const v = ps.map((p) => p.v), n = v.length, gaps = [];
    if (!n) gaps.push(S.f(0));
    else { gaps.push(S.f(v[0] - 1)); for (let k = 0; k + 1 < n; k++) gaps.push(S.f((v[k] + v[k + 1]) / 2)); gaps.push(S.f(v[n - 1] + 1)); }
    return { ps, gaps, pin: v.map((x) => S.f(x)) };
  }
  function resultTex(P) {
    const { ps, gaps, pin } = P, out = [];
    let start = gaps[0] ? { tex: '-\\infty', c: false } : null;
    ps.forEach((p, k) => {
      const R = gaps[k + 1], inn = pin[k];
      if (start) {
        if (!R || !inn) { out.push(BR[start.c ? '[' : '('] + start.tex + ';\\,' + p.tex + BR[inn ? ']' : ')']); start = R ? { tex: p.tex, c: false } : null; }
      } else if (R) start = { tex: p.tex, c: inn };
      else if (inn) out.push('\\{' + p.tex + '\\}');
    });
    if (start) out.push(BR[start.c ? '[' : '('] + start.tex + ';\\,+\\infty)');
    if (!out.length) return '\\varnothing';
    if (out.length === 1 && out[0] === '(-\\infty;\\,+\\infty)') return '\\mathbb{R}';
    return out.join(' \\cup ');
  }
  function parseRow(raw, env) {
    let s = norm(raw), name = '';
    const m = s.match(/^([A-Z][A-Za-z0-9_']*)\s*=(?![=<>])\s*(.+)$/);
    if (m && m[1] !== 'R') { name = m[1]; s = m[2]; }
    let S, tx, isOp = false;
    if (/[<>=]/.test(s)) { const r = parseIneq(s); S = r.S; tx = r.tex; }
    else { S = parseSet(s, env); tx = S.tex; isOp = /[∩∪∖]/.test(s); }
    if (name) env[name] = S;
    const P = pieces(S);
    let label = name ? name + ' = ' + tx : tx;
    if (isOp) label += ' = ' + resultTex(P);
    return { P, label, parts: S.parts && S.parts.length > 1 ? S.parts.map(pieces) : null };
  }

  // Ước lượng độ rộng nhãn LaTeX (px, cỡ 15)
  const texWidth = (t) => String(t).replace(/\\(frac|dfrac)\{([^{}]*)\}\{([^{}]*)\}/g, (a, b, c, d) => (c.length > d.length ? c : d)).replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}]/g, '').replace(/\\[,;: ]/g, '').length * 8.2;
  const fmtTick = (v) => { const s = (Math.round(v * 1000) / 1000).toString(); return s.replace('.', '{,}'); };

  // ---------- Vẽ trục số ----------
  function render(o, w, h) {
    const svg = [], labels = [], errors = [];
    const col = o.color || '#111111', pcol = o.pcolor || '#d62728', ncol = o.ncolor || '#1f77b4';
    const rows = [], env = {};
    String(o.sets || '').split('\n').forEach((line, li) => {
      if (!line.trim()) return;
      try { rows.push(parseRow(line.trim(), env)); } catch (e) { errors.push('Tập hợp, dòng ' + (li + 1) + ': ' + e.message); }
    });
    const pts = [];
    String(o.points || '').split('\n').forEach((line, li) => {
      let s = line.trim(); if (!s) return;
      try {
        let lab = null; const ci = s.indexOf(':');
        if (ci >= 0) { lab = s.slice(ci + 1).trim(); s = s.slice(0, ci).trim(); }
        let name = ''; const m = s.match(/^([A-Za-zÀ-ỹ][A-Za-z0-9_'À-ỹ]*)\s*=\s*(.+)$/);
        if (m) { name = m[1]; s = m[2]; }
        const n = num(norm(s));
        pts.push({ v: n.v, tex: lab || n.tex, name });
      } catch (e) { errors.push('Điểm, dòng ' + (li + 1) + ': ' + e.message); }
    });

    // khoảng hiển thị
    const st = parseFloat(o.step) > 0 ? parseFloat(o.step) : 1, sub = Math.max(1, Math.round(parseFloat(o.sub) || 1));
    const vals = pts.map((p) => p.v);
    rows.forEach((r) => { r.P.ps.forEach((p) => vals.push(p.v)); (r.parts || []).forEach((P) => P.ps.forEach((p) => vals.push(p.v))); });
    let a = vals.length ? Math.min(...vals) : -1, b = vals.length ? Math.max(...vals) : 1;
    if (o.zero || o.ticks) { a = Math.min(a, 0); b = Math.max(b, 0); }
    let lo, hi;
    if (o.ticks) { lo = Math.floor(a / st + EPS) * st - 0.6 * st; hi = Math.ceil(b / st - EPS) * st + 0.75 * st; }
    else { const span = Math.max(b - a, 1), pad = Math.max(span * 0.35, 0.8); lo = a - pad; hi = b + pad; }
    const ux = parseFloat(String(o.xmin).replace(',', '.')), uy = parseFloat(String(o.xmax).replace(',', '.'));
    if (isFinite(ux)) lo = ux;
    if (isFinite(uy)) hi = uy;
    if (!(hi > lo)) { errors.push('Khoảng hiển thị không hợp lệ'); hi = lo + 1; }

    const nr = Math.max(rows.length, 1);
    const lw = o.rowLabels && rows.length ? Math.min(w * 0.5, Math.max(...rows.map((r) => texWidth(r.label))) + 18) : 0;
    const x0 = lw + 10, x1 = w - 8, xe = x1 - 12;
    const X = (v) => (v === -Infinity ? x0 : v === Infinity ? xe : x0 + (v - lo) / (hi - lo) * (xe - x0));
    const rowH = h / nr;
    let hid = 0;
    const hatch = (xa, xb, y, c) => {
      xa = Math.max(xa, x0); xb = Math.min(xb, xe);
      if (xb - xa < 1) return;
      const id = 'nl' + o.id + '_' + (hid++);
      let ln = '';
      for (let x = xa - 16; x < xb + 16; x += 4.5) ln += `<line x1="${r1(x)}" y1="${r1(y + 7)}" x2="${r1(x + 9)}" y2="${r1(y - 7)}"/>`;
      svg.push(`<clipPath id="${id}"><rect x="${r1(xa)}" y="${r1(y - 8)}" width="${r1(xb - xa)}" height="16"/></clipPath><g clip-path="url(#${id})" stroke="${c}" stroke-width="1.1">${ln}</g>`);
    };
    const mark = (x, y, k, c) => {
      const H = 10, s = `fill="none" stroke="${c}" stroke-width="1.8"`;
      x = r1(x);
      if (k === '[') return `<path d="M${x + 5},${y - H}H${x}V${y + H}H${x + 5}" ${s}/>`;
      if (k === ']') return `<path d="M${x - 5},${y - H}H${x}V${y + H}H${x - 5}" ${s}/>`;
      if (k === '(') return `<path d="M${x + 4},${y - H}Q${x - 4},${y} ${x + 4},${y + H}" ${s}/>`;
      if (k === ')') return `<path d="M${x - 4},${y - H}Q${x + 4},${y} ${x - 4},${y + H}" ${s}/>`;
      if (k === 'dot') return `<circle cx="${x}" cy="${y}" r="3.8" fill="${c}"/>`;
      return `<circle cx="${x}" cy="${y}" r="3.8" fill="#fff" stroke="${c}" stroke-width="1.6"/>`;
    };
    // vẽ một tập trên trục ở độ cao y; trả về các giá trị đã ghi nhãn
    const drawSet = (P, y, c, done) => {
      const { ps, gaps, pin } = P, bold = o.style === 'bold';
      const bx = [x0].concat(ps.map((p) => X(p.v)), [xe]);
      gaps.forEach((g, k) => {
        if (bold) { if (g) svg.push(`<line x1="${r1(bx[k])}" y1="${y}" x2="${r1(bx[k + 1])}" y2="${y}" stroke="${c}" stroke-width="4.5" stroke-linecap="butt" opacity="0.85"/>`); }
        else if (!g) hatch(bx[k], bx[k + 1], y, c);
      });
      ps.forEach((p, k) => {
        if (p.v < lo || p.v > hi) return;
        const L = gaps[k], R = gaps[k + 1], inn = pin[k];
        let kind = null;
        if (L !== R) kind = bold ? (inn ? 'dot' : 'hole') : R ? (inn ? '[' : '(') : (inn ? ']' : ')');
        else if (inn && !L) kind = 'dot';
        else if (!inn && L) kind = 'hole';
        if (!kind) return;
        svg.push(mark(X(p.v), y, kind, bold ? c : col));
        if (!done.some((d) => Math.abs(d - p.v) < EPS)) { done.push(p.v); labels.push({ x: X(p.v), y: y + (/\\frac/.test(p.tex) ? 28 : 21), tex: p.tex, size: 15, color: col }); }
      });
    };

    for (let ri = 0; ri < nr; ri++) {
      const y = r1(rowH * ri + rowH * (ri === 0 && pts.length ? 0.6 : 0.5)), row = rows[ri];
      svg.push(`<line x1="${x0}" y1="${y}" x2="${x1 - 2}" y2="${y}" stroke="${col}" stroke-width="1.4"/><path d="M${x1},${y}L${x1 - 11},${y - 4.5}L${x1 - 8},${y}L${x1 - 11},${y + 4.5}Z" fill="${col}"/>`);
      if (o.xname) labels.push({ x: x1 - 4, y: y + 16, tex: o.xname, size: 15, color: col });
      const done = [];
      const named = ri === 0 && o.plabel === 'so' ? pts.filter((p) => p.name).map((p) => p.v) : [];
      if (o.ticks) {
        const d = st / sub, k0 = Math.ceil(lo / d - EPS), k1 = Math.floor(hi / d + EPS);
        for (let k = k0; k <= k1; k++) {
          const v = k * d, x = X(v);
          if (x > xe - 6) continue;
          const major = k % sub === 0, t = major ? 5.5 : 3.5;
          svg.push(`<line x1="${r1(x)}" y1="${y - t}" x2="${r1(x)}" y2="${y + t}" stroke="${col}" stroke-width="${major ? 1.3 : 1}"/>`);
          if (major && o.nums !== false && !named.some((nv) => Math.abs(nv - v) < EPS) && !(row && row.P.ps.some((p) => Math.abs(p.v - v) < EPS))) {
            labels.push({ x: x, y: y + 19, tex: fmtTick(v), size: 15, color: col }); done.push(v);
          }
        }
      }
      if (row) {
        const rc = (k) => (o.colorful ? PAL[k % PAL.length] : col);
        if (row.parts && o.style !== 'bold') row.parts.forEach((P, k) => drawSet(P, y, rc(k), done));
        else drawSet(row.P, y, rc(ri), done);
        if (o.rowLabels) labels.push({ x: 2, y, tex: row.label, size: 15, color: col, ax: 'l' });
      }
      if (o.zero && !o.ticks && lo < 0 && hi > 0 && !done.some((v) => Math.abs(v) < EPS)) {
        svg.push(`<line x1="${r1(X(0))}" y1="${y - 4}" x2="${r1(X(0))}" y2="${y + 4}" stroke="${col}" stroke-width="1.2"/>`);
        labels.push({ x: X(0), y: y + 21, tex: '0', size: 15, color: col });
      }
      if (ri === 0) {
        let lastR = -1e9, lastUp = false; // nhãn phía trên sát nhau thì đẩy lên một bậc
        pts.slice().sort((p, q) => p.v - q.v).forEach((p) => {
          if (p.v < lo || p.v > hi) { errors.push('Điểm ' + (p.name || p.tex) + ' nằm ngoài khoảng hiển thị'); return; }
          const x = X(p.v);
          svg.push(`<circle cx="${r1(x)}" cy="${y}" r="3.4" fill="${pcol}"/>`);
          const top = o.plabel === 'so' ? p.tex : (p.name || p.tex);
          const hw = texWidth(top) / 2 + 6, up = x - hw < lastR && !lastUp;
          lastUp = up; lastR = up ? lastR : x + hw;
          const ty = y - (/\\frac/.test(top) ? 24 : 18) - (up ? 22 : 0);
          if (o.plabel === 'so') {
            labels.push({ x, y: ty, tex: top, size: 15, color: col });
            if (p.name) labels.push({ x, y: y + 20, tex: p.name, size: 15, color: ncol });
          } else labels.push({ x, y: ty, tex: top, size: 15, color: p.name ? pcol : col });
        });
      }
    }
    return { svg: svg.join(''), labels, errors };
  }

  // ---------- Biểu đồ Ven ----------
  function renderVenn(o, w, h) {
    const svg = [], labels = [], errors = [];
    const col = o.color || '#111111', L = o.layout || 'hai';
    const need = L === 'mot' ? 1 : L === 'ba' ? 3 : 2;
    const names = String(o.names || '').split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    while (names.length < 3) names.push('ABC'[names.length]);
    // tập đã đặt tên nhưng kiểu biểu đồ hiện tại không vẽ (vd đổi từ 3 tập sang 2 tập): coi là tập rỗng, không báo lỗi
    const hiddenNames = names.slice(need);
    names.length = need;
    const uni = !!o.unv, R = { x: 4, y: 4, w: w - 8, h: h - 8 };
    const top = uni ? 10 : 0;
    const cx = w / 2, cy = (h + top) / 2;
    let C;
    if (L === 'mot') { const r = Math.min(w * 0.28, (h - top) * 0.34); C = [[cx, cy, r]]; }
    else if (L === 'hai') { const r = Math.min((h - top) * 0.34, w * 0.23); C = [[cx - 0.68 * r, cy, r], [cx + 0.68 * r, cy, r]]; }
    else if (L === 'roi') { const r = Math.min((h - top) * 0.32, w * 0.19); C = [[cx - 1.2 * r, cy, r], [cx + 1.2 * r, cy, r]]; }
    else if (L === 'con') { const r = Math.min((h - top) * 0.38, w * 0.3); C = [[cx, cy, r], [cx - 0.32 * r, cy + 0.1 * r, 0.52 * r]]; }
    else { const r = Math.min((h - top) * 0.27, w * 0.2); const c2 = cy - 0.18 * r; C = [[cx - 0.62 * r, c2 - 0.36 * r, r], [cx + 0.62 * r, c2 - 0.36 * r, r], [cx, c2 + 0.72 * r, r]]; }
    const maskAt = (x, y) => C.reduce((m, c, k) => m | ((x - c[0]) ** 2 + (y - c[1]) ** 2 < c[2] * c[2] ? 1 << k : 0), 0);
    // điểm đặt phần tử của từng vùng: chỗ xa biên nhất
    const best = {};
    for (let y = R.y + 3; y < R.y + R.h; y += 3) {
      for (let x = R.x + 3; x < R.x + R.w; x += 3) {
        let m = 0, cl = Math.min(x - R.x, R.x + R.w - x, y - R.y, R.y + R.h - y) * (uni ? 1 : 0.6);
        C.forEach((c, k) => { const d = Math.hypot(x - c[0], y - c[1]); if (d < c[2]) m |= 1 << k; cl = Math.min(cl, Math.abs(d - c[2])); });
        if (!best[m] || cl > best[m].c) best[m] = { x, y, c: cl };
      }
    }
    const UN = [o.uname, 'U', 'E', 'X'].filter(Boolean);
    const id = 'vn' + o.id;
    // vùng tô
    let shadeF = null;
    if (String(o.shade || '').trim()) {
      try {
        const s = norm(o.shade); let i = 0;
        const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
        const ex = () => { let a = tm(); for (;;) { ws(); const c = s[i]; if (c === '∪' || c === '∖') { i++; const b = tm(), A = a; a = c === '∪' ? (m) => A(m) || b(m) : (m) => A(m) && !b(m); } else return a; } };
        const tm = () => { let a = pf(); for (;;) { ws(); if (s[i] === '∩') { i++; const b = pf(), A = a; a = (m) => A(m) && b(m); } else return a; } };
        const pf = () => { let a = pr(); for (;;) { ws(); if (s[i] === "'") { i++; const A = a; a = (m) => !A(m); } else return a; } };
        const pr = () => {
          ws();
          if (s[i] === '(') { i++; const a = ex(); ws(); if (s[i] !== ')') throw new Error('Thiếu dấu )'); i++; return a; }
          const cand = names.map((n, k) => [n, k]).sort((p, q) => q[0].length - p[0].length);
          for (const [n, k] of cand) if (s.startsWith(n, i)) { i += n.length; return (m) => !!(m & (1 << k)); }
          for (const u of UN) if (s.startsWith(u, i)) { i += u.length; return () => true; }
          for (const n of hiddenNames.slice().sort((p, q) => q.length - p.length)) if (s.startsWith(n, i)) { i += n.length; return () => false; }
          throw new Error('Không hiểu: ' + s.slice(i));
        };
        shadeF = ex(); ws();
        if (i < s.length) throw new Error('Không hiểu: ' + s.slice(i));
      } catch (e) { errors.push('Phần tô: ' + e.message); shadeF = null; }
    }
    const scol = o.fill || '#f5b041';
    let defs = `<pattern id="${id}h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${scol}" stroke-width="2"/></pattern>`;
    C.forEach((c, k) => {
      defs += `<clipPath id="${id}c${k}"><circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(c[2])}"/></clipPath>`;
      defs += `<mask id="${id}m${k}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/><circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(c[2])}" fill="#000"/></mask>`;
    });
    svg.push('<defs>' + defs + '</defs>');
    if (shadeF) {
      const fillv = o.style === 'hatch' ? `url(#${id}h)` : scol;
      Object.keys(best).map(Number).filter((m) => shadeF(m)).forEach((m) => {
        let g = `<rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="${fillv}"${o.style === 'hatch' ? '' : ' fill-opacity="0.6"'}/>`;
        C.forEach((c, k) => { g = m & (1 << k) ? `<g clip-path="url(#${id}c${k})">${g}</g>` : `<g mask="url(#${id}m${k})">${g}</g>`; });
        svg.push(g);
      });
    }
    const sw = parseFloat(o.stroke) || 1.6;
    if (uni) {
      svg.push(`<rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" fill="none" stroke="${col}" stroke-width="${sw}"/>`);
      labels.push({ x: R.x + 8, y: R.y + 14, tex: o.uname || 'U', size: 17, color: col, ax: 'l' });
    }
    C.forEach((c, k) => {
      const cc = o.colorful ? PAL[k] : col;
      svg.push(`<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r1(c[2])}" fill="none" stroke="${cc}" stroke-width="${sw}"/>`);
      let ang = k === 0 ? 135 : k === 1 ? 45 : 270;
      if (L === 'ba' && k === 2) ang = 300;
      if (L === 'con' && k === 1) { labels.push({ x: c[0], y: c[1] - c[2] * 0.68, tex: names[k], size: 17, color: cc }); return; }
      const t = ang * Math.PI / 180, d = c[2] + 11;
      labels.push({ x: c[0] + d * Math.cos(t), y: c[1] - d * Math.sin(t), tex: names[k], size: 17, color: cc });
    });
    // phần tử
    const keyMask = (key) => {
      const k = key.trim();
      if (!k || UN.includes(k) || /^ngo[aà]i$/i.test(k)) return 0;
      let m = 0;
      const toks = k.split(/[\s∩,]+/).filter(Boolean);
      toks.forEach((t) => {
        const j = names.indexOf(t);
        if (j >= 0) { m |= 1 << j; return; }
        if (hiddenNames.includes(t)) { m = -1; return; }
        for (const ch of t) { const q = names.indexOf(ch); if (q < 0) { if (hiddenNames.includes(ch)) { m = -1; return; } throw new Error('Không có tập ' + t); } if (m >= 0) m |= 1 << q; }
      });
      if (m < 0) return -1; // dòng của tập đang ẩn: bỏ qua
      if (L === 'con' && m & 2) m |= 1; // B ⊂ A
      return m;
    };
    const es = parseFloat(o.esize) || 16;
    String(o.elements || '').split('\n').forEach((line, li) => {
      if (!line.trim()) return;
      try {
        const ci = line.indexOf(':');
        if (ci < 0) throw new Error('Viết dạng  A: 1; 2; 3');
        const m = keyMask(line.slice(0, ci));
        if (m < 0) return;
        if (!best[m]) throw new Error(L === 'roi' ? 'hai tập rời nhau không có phần tử chung, vùng "' + line.slice(0, ci).trim() + '" không vẽ được' : 'Vùng "' + line.slice(0, ci).trim() + '" không có trong kiểu biểu đồ này');
        const body = line.slice(ci + 1);
        const items = body.split(body.includes(';') ? ';' : ',').map((t) => t.trim()).filter(Boolean);
        if (!items.length) return;
        const colW = Math.max(...items.map((t) => texWidth(t))) * es / 15 + 14, lh = es * 1.35;
        const a = best[m];
        // số phần tử mỗi hàng: vừa với bề rộng vùng
        const per = Math.max(1, Math.min(items.length, Math.floor((a.c * 1.7) / colW), Math.ceil(Math.sqrt(items.length * 1.5))));
        const nrow = Math.ceil(items.length / per);
        items.forEach((t, k) => {
          const r = Math.floor(k / per), c = k % per, inRow = Math.min(per, items.length - r * per);
          const x = a.x + (c - (inRow - 1) / 2) * colW, y = a.y + (r - (nrow - 1) / 2) * lh;
          const isText = /[À-ỹ]/.test(t) || /\s/.test(t);
          labels.push(Object.assign({ x, y, size: es, color: col }, isText ? { text: t } : { tex: t }));
        });
      } catch (e) { errors.push('Phần tử, dòng ' + (li + 1) + ': ' + e.message); }
    });
    return { svg: svg.join(''), labels, errors };
  }

  // ---------- Mẫu ----------
  const rowsH = (sets, extra) => Math.max(1, String(sets).split('\n').filter((t) => t.trim()).length) * 62 + (extra || 8);
  const LINE = (sets, more) => Object.assign({ sets, points: '', ticks: false, nums: true, zero: true, rowLabels: false, colorful: false, style: 'hatch', plabel: 'ten', step: 1, sub: 1, xmin: '', xmax: '', w: 480, h: rowsH(sets) }, more);
  const KINDS = {
    tiaso: ['Tia số (lớp 1 – 5)', { sets: '', points: 'A = 30\nB = 70', ticks: true, zero: true, plabel: 'ten', step: 10, sub: 1, xmin: '0', xmax: '105', w: 560, h: 80 }],
    nguyen: ['Số nguyên trên trục số (lớp 6)', { sets: '', points: 'A = -3\nB = 2\nO = 0', ticks: true, zero: false, plabel: 'ten', step: 1, sub: 1, w: 520, h: 80 }],
    huuti: ['Số hữu tỉ: chia đơn vị thành phần bằng nhau (lớp 7)', { sets: '', points: 'C = -9/4\nB = -3/4\nO = 0\nA = 7/4', ticks: true, zero: false, plabel: 'ten', step: 1, sub: 4, w: 520, h: 80 }],
    thuc: ['Số thực trên trục số: giá trị ở trên, tên ở dưới (lớp 7)', { sets: '', points: '-2 1/3\nN = -sqrt(2)\n-3/5\nO = 0\n0,3\nM = sqrt(2)\nsqrt(3)\n2 1/3\n4,1(6)', ticks: true, zero: false, plabel: 'so', step: 1, sub: 1, w: 680, h: 110 }],
    bpt: ['Tập nghiệm bất phương trình (lớp 8, 10)', LINE('x > 4')],
    bpt2: ['Tập nghiệm có hai đầu mút / hệ bất phương trình', LINE('-2 < x <= 3')],
    bpt3: ['Tập nghiệm dạng "hoặc" (hai tia)', LINE('x < -1 hoặc x >= 2')],
    khoang: ['Khoảng, đoạn, nửa khoảng (lớp 10)', LINE('(-2; 3)\n[-2; 3]\n[1; +oo)\n(-oo; 3/4]', { rowLabels: true, zero: false })],
    giao: ['Giao của hai tập hợp (lớp 10)', LINE('E = [1; +oo)\nF = (-oo; 3]\nE ∩ F', { rowLabels: true, colorful: true, zero: false, w: 560 })],
    hop: ['Hợp của hai tập hợp (lớp 10)', LINE('A = (-2; 1]\nB = [0; 4)\nA ∪ B', { rowLabels: true, colorful: true, zero: false, w: 560 })],
    hieu: ['Hiệu và phần bù (lớp 10)', LINE('A = [-3; 2)\nB = (0; 5]\nA ∖ B\nR ∖ A', { rowLabels: true, zero: false, w: 560 })],
  };
  const VENN = (more) => Object.assign({ layout: 'hai', names: 'A, B', elements: '', shade: '', style: 'fill', unv: false, uname: 'U', colorful: false, fill: '#f5b041', esize: 16, stroke: 1.6, w: 360, h: 230 }, more);
  const VKINDS = {
    phantu: ['Hai tập hợp có ghi phần tử (lớp 6, 10)', VENN({ names: 'C, D', elements: 'C: 7\nCD: 4; 27\nD: 2; 9; 36' })],
    mot: ['Một tập hợp và các phần tử (lớp 6)', VENN({ layout: 'mot', names: 'A', elements: 'A: 0; 1; 2; 3\nngoài: 5; 7', unv: true, w: 300, h: 220 })],
    con: ['Tập con: B ⊂ A (lớp 10)', VENN({ layout: 'con', elements: '' })],
    giao: ['Giao A ∩ B (lớp 10)', VENN({ shade: 'A ∩ B' })],
    hop: ['Hợp A ∪ B (lớp 10)', VENN({ shade: 'A ∪ B' })],
    hieu: ['Hiệu A ∖ B (lớp 10)', VENN({ shade: 'A ∖ B' })],
    bu: ['Phần bù của A trong E (lớp 10)', VENN({ layout: 'mot', names: 'A', unv: true, uname: 'E', shade: 'E ∖ A', w: 320, h: 220 })],
    roi: ['Hai tập hợp rời nhau', VENN({ layout: 'roi' })],
    ba: ['Ba tập hợp (lớp 10)', VENN({ layout: 'ba', names: 'A, B, C', shade: 'A ∩ B ∩ C', w: 340, h: 300 })],
  };
  const LAYOUTS = { mot: 'Một tập hợp', hai: 'Hai tập cắt nhau', roi: 'Hai tập rời nhau', con: 'B là tập con của A', ba: 'Ba tập hợp' };

  root.NumLine = { render, renderVenn, KINDS, VKINDS, LAYOUTS, rowsH, parseRow, num };
})(typeof window !== 'undefined' ? window : globalThis);
