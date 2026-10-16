// Bảng biến thiên / bảng xét dấu: khảo sát tự động và vẽ bảng
(function (root) {
  'use strict';

  // ---------- Khảo sát hàm số ----------
  function findRoots(g, lo, hi) {
    const N = 4000, roots = [];
    const add = (r) => { if (!roots.some((t) => Math.abs(t - r) < 1e-6)) roots.push(r); };
    let px = lo, pv = g(lo);
    const absAt = (x) => { const v = Math.abs(g(x)); return isFinite(v) ? v : Infinity; };
    let p2 = Infinity, p1 = absAt(lo);
    for (let i = 1; i <= N; i++) {
      const x = lo + (hi - lo) * i / N, v = g(x);
      if (v === 0) add(x);
      else if (isFinite(v) && isFinite(pv) && pv !== 0 && v * pv < 0) {
        let a = px, b = x, fa = pv;
        for (let k = 0; k < 80; k++) {
          const m = (a + b) / 2, fm = g(m);
          if (!isFinite(fm)) break;
          if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
        }
        const r = (a + b) / 2;
        // loại điểm đổi dấu do tiệm cận (|g| rất lớn)
        if (Math.abs(g(r)) < 1e-6 * (1 + Math.abs(pv) + Math.abs(v))) add(r);
      }
      // nghiệm kép: |g| đạt cực tiểu bằng 0
      const cur = absAt(x);
      if (i >= 2 && p1 < p2 && p1 <= cur && p1 < 1e-3) {
        let a = x - 2 * (hi - lo) / N, b = x;
        for (let k = 0; k < 100; k++) {
          const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
          if (absAt(m1) < absAt(m2)) b = m2; else a = m1;
        }
        const r = (a + b) / 2;
        if (absAt(r) < 1e-10) add(r);
      }
      p2 = p1; p1 = cur; px = x; pv = v;
    }
    return roots.map(snap).sort((a, b) => a - b);
  }
  function snap(x) {
    const f = NumFmt.asFraction(x, 60);
    if (f && Math.abs(f[0] / f[1] - x) < 1e-8) return f[0] / f[1];
    return x;
  }
  function snapVal(v) {
    if (!isFinite(v)) return v;
    const r = Math.round(v * 1e5) / 1e5;
    const f = NumFmt.asFraction(r, 60);
    return f ? f[0] / f[1] : v;
  }
  function limitAt(f, x0, side) {
    const s = Math.max(1, Math.abs(x0));
    const v = [1e-3, 1e-6, 1e-9].map((h) => f(x0 + side * h * s));
    if (!isFinite(v[2])) return isFinite(v[1]) ? snapVal(v[1]) : NaN;
    if (Math.abs(v[2] - v[1]) < 1e-4 * (1 + Math.abs(v[2]))) return snapVal(v[2]);
    return v[2] > 0 ? Infinity : -Infinity;
  }
  function limitInf(f, sign) {
    let a = f(sign * 1e6), b = f(sign * 1e8);
    if (Number.isNaN(a) || Number.isNaN(b)) { a = f(sign * 1e2); b = f(sign * 1e3); }
    if (Number.isNaN(b)) return NaN;
    if (!isFinite(b)) return b;
    if (Math.abs(b - a) < 1e-4 * (1 + Math.abs(b))) return snapVal(b);
    if (Math.abs(b) > Math.abs(a)) return b > 0 ? Infinity : -Infinity;
    return snapVal(b);
  }
  function parseBound(s, dflt) {
    s = String(s == null ? '' : s).trim();
    if (!s) return dflt;
    if (/^[-−]\s*(inf|oo|∞|vc)/i.test(s)) return -Infinity;
    if (/^\+?\s*(inf|oo|∞|vc)/i.test(s)) return Infinity;
    const v = MathExpr.compile(s, [])();
    return isFinite(v) ? v : dflt;
  }

  function analyse(expr, aStr, bStr, signOnly) {
    const tree = MathExpr.parse(String(expr).replace(/^\s*(y|f\(x\))\s*=\s*/i, ''));
    const f = MathExpr.compile(tree);
    // bảng xét dấu: xét dấu chính f; bảng biến thiên: xét dấu f'
    const d = signOnly ? f : MathExpr.compile(MathExpr.diff(tree, 'x'));
    const lo = parseBound(aStr, -Infinity), hi = parseBound(bStr, Infinity);
    if (!(hi > lo)) throw new Error('Khoảng khảo sát không hợp lệ');
    const sLo = isFinite(lo) ? lo : Math.min(-30, isFinite(hi) ? hi - 60 : -30);
    const sHi = isFinite(hi) ? hi : Math.max(30, isFinite(lo) ? lo + 60 : 30);
    const parts = MathExpr.domainParts(tree);
    let special = [];
    parts.zero.concat(parts.nonneg, parts.pos).forEach((n) => {
      special = special.concat(findRoots(MathExpr.compile(n), sLo, sHi));
    });
    let crit = findRoots(d, sLo, sHi).filter((r) => isFinite(f(r)));
    let xs = special.concat(crit).filter((x) => x > lo + 1e-9 && x < hi - 1e-9).sort((a, b) => a - b);
    xs = xs.filter((x, i) => i === 0 || Math.abs(x - xs[i - 1]) > 1e-6);
    let note = '';
    if (xs.length > 10) { xs = xs.slice(0, 10); note = 'Hàm số có quá nhiều điểm đặc biệt, hãy thu hẹp khoảng khảo sát [a; b].'; }
    const nodes = [lo].concat(xs, [hi]);
    const n = nodes.length;
    const signs = [];
    for (let i = 0; i < n - 1; i++) {
      const a = isFinite(nodes[i]) ? nodes[i] : (isFinite(nodes[i + 1]) ? nodes[i + 1] - 20 : -20);
      const b = isFinite(nodes[i + 1]) ? nodes[i + 1] : (isFinite(nodes[i]) ? nodes[i] + 20 : 20);
      let pos = 0, neg = 0, bad = 0;
      for (const t of [0.21, 0.5, 0.79]) {
        const x = a + (b - a) * t;
        const fv = f(x), dv = d(x);
        if (!isFinite(fv) || !isFinite(dv)) bad++;
        else if (dv > 1e-12) pos++; else if (dv < -1e-12) neg++;
      }
      signs.push(bad >= 2 ? 'x' : pos > neg ? '+' : neg > pos ? '-' : '=');
    }
    const marks = [], vals = [];
    for (let i = 0; i < n; i++) {
      const x = nodes[i];
      const L = i > 0 && signs[i - 1] !== 'x', R = i < n - 1 && signs[i] !== 'x';
      if (!isFinite(x)) { vals.push(L || R ? NumFmt.toTex(limitInf(f, x > 0 ? 1 : -1)) : ''); continue; }
      const fv = f(x);
      if (isFinite(fv) && Math.abs(fv) < 1e12) {
        vals.push(NumFmt.toTex(snapVal(fv)));
        if (i > 0 && i < n - 1) {
          const dv = d(x);
          if (signOnly) marks.push(Math.abs(fv) < 1e-7 ? '0' : '');
          else if (!isFinite(dv)) marks.push('||'); // điểm không có đạo hàm
          else marks.push(L && R && Math.abs(dv) < 1e-6 ? '0' : '');
        }
      } else {
        const l = L ? NumFmt.toTex(limitAt(f, x, -1)) : '', r = R ? NumFmt.toTex(limitAt(f, x, 1)) : '';
        vals.push(l + ' || ' + r);
        if (i > 0 && i < n - 1) marks.push('||');
      }
    }
    const xrow = nodes.map((x) => NumFmt.toTex(x));
    const drow = [];
    for (let i = 0; i < n - 1; i++) { drow.push(signs[i]); if (i < n - 2) drow.push(marks[i]); }
    return { xrow: xrow.join(' | '), drow: drow.join(' | '), frow: signOnly ? '' : vals.join(' | '), note };
  }

  // ---------- Vẽ bảng ----------
  const splitRow = (s) => String(s || '').trim() === '' ? [] : String(s).split(/(?<!\|)\|(?!\|)/).map((t) => t.trim());
  const texLen = (t) => {
    const fr = /\\d?frac/.test(t);
    const s = t.replace(/\\[a-zA-Z]+/g, 'M').replace(/[{}^_ ]/g, '');
    return Math.max(1, fr ? Math.ceil(s.length / 2) : s.length);
  };
  const r1 = (v) => Math.round(v * 10) / 10;

  function render(o, w, h) {
    const xs = splitRow(o.xrow), dr = splitRow(o.drow), fr = splitRow(o.frow);
    const n = xs.length;
    const hasF = fr.length > 0;
    const parts = [], labels = [], errors = [];
    if (n < 2) return { svg: '', labels: [{ x: w / 2, y: h / 2, text: 'Nhập biểu thức f(x) rồi bấm "Lập bảng tự động"', size: 13 }], errors };
    const signs = [], marks = [];
    for (let i = 0; i < n - 1; i++) { signs.push(dr[2 * i] || ''); if (i < n - 2) marks.push(dr[2 * i + 1] || ''); }
    const LW = 70, PADX = 36;
    const h1 = hasF ? Math.min(40, h * 0.2) : h / 2, h2 = h1;
    const fTop = h1 + h2, fBot = h;
    const cx = (i) => LW + PADX + i * (w - LW - 2 * PADX) / (n - 1);
    const id = 'bh' + o.id;
    parts.push(`<defs><pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#666" stroke-width="0.8"/></pattern>` +
      `<marker id="ar${o.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="#222"/></marker></defs>`);
    // khoảng không xác định: gạch chéo
    for (let i = 0; i < n - 1; i++) {
      if (signs[i].toLowerCase() === 'x') parts.push(`<rect x="${r1(cx(i))}" y="${h1}" width="${r1(cx(i + 1) - cx(i))}" height="${h - h1}" fill="url(#${id})"/>`);
    }
    // SGK Kết nối tri thức: bảng biến thiên để mở (không khung ngoài), bảng xét dấu có khung
    if (!hasF) parts.push(`<rect x="0.6" y="0.6" width="${w - 1.2}" height="${h - 1.2}" fill="none" stroke="#222" stroke-width="1.2"/>`);
    parts.push(`<path d="M0,${h1}H${w}${hasF ? `M0,${fTop}H${w}` : ''}M${LW},0V${h}" stroke="#222" stroke-width="1.2" fill="none"/>`);
    labels.push({ x: LW / 2, y: h1 / 2, tex: o.lx || 'x', size: 16 });
    labels.push({ x: LW / 2, y: h1 + h2 / 2, tex: o.ld || "f'(x)", size: 16 });
    if (hasF) labels.push({ x: LW / 2, y: (fTop + fBot) / 2, tex: o.lf || 'f(x)', size: 16 });
    xs.forEach((t, i) => { if (t) labels.push({ x: cx(i), y: h1 / 2, tex: t, size: 15 }); });
    signs.forEach((s, i) => {
      if (s === '+' || s === '-') labels.push({ x: (cx(i) + cx(i + 1)) / 2, y: h1 + h2 / 2, tex: s === '-' ? '-' : '+', size: 16 });
      else if (s && s !== '=' && s.toLowerCase() !== 'x') labels.push({ x: (cx(i) + cx(i + 1)) / 2, y: h1 + h2 / 2, tex: s, size: 15 });
    });
    const fv = (i) => (fr[i] === undefined ? '' : fr[i]);
    const isSplit = (i) => fv(i).includes('||');
    for (let i = 1; i < n - 1; i++) {
      const m = marks[i - 1];
      const x = cx(i);
      if (m === '||') {
        const y2 = hasF && (isSplit(i) || fv(i) === '') ? h : fTop;
        parts.push(`<path d="M${r1(x - 2)},${h1}V${y2}M${r1(x + 2)},${h1}V${y2}" stroke="#222" stroke-width="1" fill="none"/>`);
      } else {
        if (m) labels.push({ x, y: h1 + h2 / 2, tex: m, size: 15 });
        if (hasF && isSplit(i)) parts.push(`<path d="M${r1(x - 2)},${fTop}V${h}M${r1(x + 2)},${fTop}V${h}" stroke="#222" stroke-width="1" fill="none"/>`);
      }
    }
    if (hasF) {
      const yT = fTop + 20, yB = fBot - 20, yM = (yT + yB) / 2;
      const mono = (s) => s === '+' || s === '-' || s === '=';
      const endOf = (s) => (s === '+' ? yT : s === '-' ? yB : yM);
      const startOf = (s) => (s === '+' ? yB : s === '-' ? yT : yM);
      const node = [];
      for (let i = 0; i < n; i++) {
        const sL = i > 0 ? signs[i - 1] : '', sR = i < n - 1 ? signs[i] : '';
        const okL = mono(sL), okR = mono(sR);
        const nd = { x: cx(i) };
        if (isSplit(i)) {
          const [l, r] = fv(i).split('||').map((t) => t.trim());
          nd.yL = endOf(sL); nd.yR = startOf(sR);
          nd.hwL = nd.hwR = 6;
          if (l) { labels.push({ x: cx(i) - 6, y: nd.yL, tex: l, size: 15, ax: 'r' }); nd.hwL = 12 + texLen(l) * 8; }
          if (r) { labels.push({ x: cx(i) + 6, y: nd.yR, tex: r, size: 15, ax: 'l' }); nd.hwR = 12 + texLen(r) * 8; }
        } else {
          let y;
          if (okL && okR) y = sL === sR ? yM : (sL === '+' && sR === '-') ? yT : (sL === '-' && sR === '+') ? yB : (sL === '=' ? startOf(sR) : endOf(sL));
          else if (okL) y = endOf(sL);
          else if (okR) y = startOf(sR);
          else y = yM;
          nd.yL = nd.yR = y;
          nd.hwL = nd.hwR = fv(i) ? 6 + texLen(fv(i)) * 4.5 : 3;
          if (fv(i)) labels.push({ x: cx(i), y, tex: fv(i), size: 15 });
        }
        node.push(nd);
      }
      for (let i = 0; i < n - 1; i++) {
        if (!mono(signs[i])) continue;
        const a = node[i], b = node[i + 1];
        const x1 = a.x + a.hwR, x2 = b.x - b.hwL;
        // rút ngắn mũi tên theo đúng hướng để không đè lên nhãn
        const t = (x) => a.yR + (b.yL - a.yR) * (x - a.x) / (b.x - a.x);
        parts.push(`<line x1="${r1(x1)}" y1="${r1(t(x1))}" x2="${r1(x2)}" y2="${r1(t(x2))}" stroke="#222" stroke-width="1.1" marker-end="url(#ar${o.id})"/>`);
      }
    }
    return { svg: parts.join(''), labels, errors };
  }

  root.BBT = { analyse, render };
})(window);
