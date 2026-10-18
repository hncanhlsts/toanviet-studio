// Hệ trục toạ độ, đồ thị hàm số và miền nghiệm của hệ bất phương trình bậc nhất hai ẩn
(function (root) {
  'use strict';
  const COLORS = ['#1f5fbf', '#c0392b', '#1e8449', '#8e44ad', '#d35400', '#117a8b'];
  const PAD = 16;

  function niceStep(range) {
    const raw = range / 8;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function val(s, dflt) {
    if (typeof s === 'number') return s;
    try { const v = MathExpr.compile(String(s), [])(); return isFinite(v) ? v : dflt; } catch (e) { return dflt; }
  }
  const r2 = (v) => Math.round(v * 100) / 100;

  // Khung toạ độ: trả về phép đổi toạ độ và phần SVG của lưới, trục
  function frame(o, w, h) {
    let xmin = val(o.xmin, -5), xmax = val(o.xmax, 5), ymin = val(o.ymin, -5), ymax = val(o.ymax, 5);
    if (xmax <= xmin) xmax = xmin + 1;
    if (ymax <= ymin) ymax = ymin + 1;
    const X = (x) => PAD + (x - xmin) / (xmax - xmin) * (w - 2 * PAD);
    const Y = (y) => h - PAD - (y - ymin) / (ymax - ymin) * (h - 2 * PAD);
    const parts = [], labels = [];
    const clip = 'clip' + o.id;
    parts.push(`<defs><clipPath id="${clip}"><rect x="${PAD}" y="${PAD}" width="${w - 2 * PAD}" height="${h - 2 * PAD}"/></clipPath>` +
      `<marker id="ah${o.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="#222"/></marker></defs>`);
    const usePi = !!o.piTicks;
    const sx = usePi ? Math.PI / 2 : (val(o.xstep, 0) > 0 ? val(o.xstep, 0) : niceStep(xmax - xmin));
    const sy = val(o.ystep, 0) > 0 ? val(o.ystep, 0) : niceStep(ymax - ymin);
    const ox = Math.min(Math.max(0, xmin), xmax), oy = Math.min(Math.max(0, ymin), ymax);
    const X0 = X(ox), Y0 = Y(oy);
    const tickTex = (v, step) => {
      if (usePi && step === sx) return NumFmt.toTex(v);
      return null;
    };
    const tx = [], ty = [];
    for (let k = Math.ceil(xmin / sx); k * sx <= xmax + 1e-9; k++) tx.push(k * sx);
    for (let k = Math.ceil(ymin / sy); k * sy <= ymax + 1e-9; k++) ty.push(k * sy);
    if (o.grid !== false) {
      let g = '';
      for (const x of tx) g += `M${r2(X(x))},${PAD}V${h - PAD}`;
      for (const y of ty) g += `M${PAD},${r2(Y(y))}H${w - PAD}`;
      parts.push(`<path d="${g}" stroke="#d5dbe3" stroke-width="0.7" fill="none"/>`);
    }
    // trục
    parts.push(`<line x1="${PAD - 8}" y1="${r2(Y0)}" x2="${w - 4}" y2="${r2(Y0)}" stroke="#222" stroke-width="1.2" marker-end="url(#ah${o.id})"/>`);
    parts.push(`<line x1="${r2(X0)}" y1="${h - PAD + 8}" x2="${r2(X0)}" y2="4" stroke="#222" stroke-width="1.2" marker-end="url(#ah${o.id})"/>`);
    labels.push({ x: w - 8, y: Y0 + 12, tex: o.xlabel || 'x', size: 15 });
    labels.push({ x: X0 - 11, y: 9, tex: o.ylabel || 'y', size: 15 });
    labels.push({ x: X0 - 9, y: Y0 + 11, tex: 'O', size: 15 });
    if (o.ticks !== false) {
      let t = '';
      for (const x of tx) {
        if (Math.abs(x - ox) < 1e-9 || X(x) > w - PAD - 10) continue;
        t += `M${r2(X(x))},${r2(Y0 - 3)}v6`;
        const tt = tickTex(x, sx);
        labels.push(tt ? { x: X(x), y: Y0 + 14, tex: tt, size: 11 } : { x: X(x), y: Y0 + 12, text: NumFmt.plain(x), size: 12 });
      }
      for (const y of ty) {
        if (Math.abs(y - oy) < 1e-9 || Y(y) < PAD + 10) continue;
        t += `M${r2(X0 - 3)},${r2(Y(y))}h6`;
        labels.push({ x: X0 - 6, y: Y(y), text: NumFmt.plain(y), size: 12, ax: 'r' });
      }
      parts.push(`<path d="${t}" stroke="#222" stroke-width="1" fill="none"/>`);
    }
    return { X, Y, xmin, xmax, ymin, ymax, parts, labels, clip };
  }

  function curvePath(f, fr, w, h) {
    const n = Math.max(200, Math.round(w * 2));
    const span = fr.ymax - fr.ymin;
    let d = '', pen = false, py = NaN;
    for (let i = 0; i <= n; i++) {
      const x = fr.xmin + (fr.xmax - fr.xmin) * i / n;
      const y = f(x);
      if (!isFinite(y)) { pen = false; py = NaN; continue; }
      // ngắt nét tại tiệm cận đứng
      if (pen && Math.abs(y - py) > span * 1.5 && (y - fr.ymin) * (py - fr.ymin) < 0 || (pen && Math.abs(y - py) > span * 6)) pen = false;
      const yy = Math.max(fr.ymin - span * 3, Math.min(fr.ymax + span * 3, y));
      d += (pen ? 'L' : 'M') + r2(fr.X(x)) + ',' + r2(fr.Y(yy));
      pen = true; py = y;
    }
    return d;
  }

  function parsePoint(line) {
    // "A(1; -2)", "(1; 2)" hoặc "1; 2"
    const m = line.match(/^\s*([A-Z][\w']*)?\s*\((.*)\)\s*$/);
    const xy = (m ? m[2] : line).split(';');
    if (xy.length !== 2) return null;
    const x = val(xy[0], NaN), y = val(xy[1], NaN);
    if (!isFinite(x) || !isFinite(y)) return null;
    return { name: (m && m[1]) || '', x, y };
  }

  function renderGraph(o, w, h) {
    const fr = frame(o, w, h);
    const parts = fr.parts, labels = fr.labels;
    const errors = [];
    const fs = [];
    String(o.funcs || '').split('\n').map((s) => s.trim()).filter(Boolean).forEach((line, i) => {
      try {
        const src = line.replace(/^\s*(y|f\(x\))\s*=\s*/i, '');
        const f = MathExpr.compile(src);
        fs.push({ f, color: COLORS[i % COLORS.length], tex: MathExpr.toTex(f.tree) });
      } catch (e) { errors.push(line + ': ' + e.message); }
    });
    // tô hình phẳng giới hạn bởi đồ thị (ứng dụng tích phân)
    const sa = val(o.shadeA, NaN), sb = val(o.shadeB, NaN);
    if (fs.length && isFinite(sa) && isFinite(sb) && sb > sa) {
      const f1 = fs[0].f, f2 = fs[1] ? fs[1].f : () => 0;
      let d = '';
      const n = 120;
      for (let i = 0; i <= n; i++) { const x = sa + (sb - sa) * i / n; const y = f1(x); if (isFinite(y)) d += (d ? 'L' : 'M') + r2(fr.X(x)) + ',' + r2(fr.Y(y)); }
      for (let i = n; i >= 0; i--) { const x = sa + (sb - sa) * i / n; const y = f2(x); if (isFinite(y)) d += 'L' + r2(fr.X(x)) + ',' + r2(fr.Y(y)); }
      parts.push(`<path d="${d}Z" fill="#f5b041" fill-opacity="0.45" stroke="none" clip-path="url(#${fr.clip})"/>`);
    }
    // đường phụ: tiệm cận x = a, y = b
    String(o.guides || '').split(/[\n,]/).map((s) => s.trim()).filter(Boolean).forEach((g) => {
      const m = g.match(/^([xy])\s*=\s*(.+)$/i);
      if (!m) return;
      const v = val(m[2], NaN);
      if (!isFinite(v)) return;
      if (m[1].toLowerCase() === 'x') parts.push(`<line x1="${r2(fr.X(v))}" y1="${PAD}" x2="${r2(fr.X(v))}" y2="${h - PAD}" stroke="#555" stroke-width="1" stroke-dasharray="6 4" clip-path="url(#${fr.clip})"/>`);
      else parts.push(`<line x1="${PAD}" y1="${r2(fr.Y(v))}" x2="${w - PAD}" y2="${r2(fr.Y(v))}" stroke="#555" stroke-width="1" stroke-dasharray="6 4" clip-path="url(#${fr.clip})"/>`);
    });
    fs.forEach((it) => {
      parts.push(`<path d="${curvePath(it.f, fr, w, h)}" fill="none" stroke="${it.color}" stroke-width="${o.stroke || 1.8}" stroke-linejoin="round" clip-path="url(#${fr.clip})"/>`);
    });
    if (o.legend !== false) {
      fs.forEach((it, i) => labels.push({ x: w - PAD - 4, y: PAD + 14 + i * 26, tex: 'y=' + it.tex, size: 14, color: it.color, ax: 'r', bg: true }));
    }
    // điểm đánh dấu + đường gióng
    String(o.points || '').split('\n').map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const p = parsePoint(line);
      if (!p) { errors.push('Điểm không hợp lệ: ' + line); return; }
      const px = fr.X(p.x), py = fr.Y(p.y);
      if (o.proj !== false) {
        parts.push(`<path d="M${r2(px)},${r2(py)}V${r2(fr.Y(0))}M${r2(px)},${r2(py)}H${r2(fr.X(0))}" stroke="#555" stroke-width="0.9" stroke-dasharray="4 3" fill="none" clip-path="url(#${fr.clip})"/>`);
      }
      parts.push(`<circle cx="${r2(px)}" cy="${r2(py)}" r="3" fill="#111"/>`);
      if (p.name) labels.push({ x: px + 7, y: py - 9, tex: p.name, size: 14, ax: 'l' });
    });
    return { svg: parts.join(''), labels, errors };
  }

  // ---------------- Miền nghiệm ----------------
  function parseIneq(line) {
    const m = line.match(/^(.*?)(<=|>=|≤|≥|<|>|=)(.*)$/);
    if (!m) throw new Error('Thiếu dấu so sánh: ' + line);
    const L = MathExpr.compile(m[1], ['x', 'y']), R = MathExpr.compile(m[3], ['x', 'y']);
    const g = (x, y) => L(x, y) - R(x, y);
    let c = g(0, 0), a = g(1, 0) - c, b = g(0, 1) - c;
    if (!isFinite(a + b + c) || (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12)) throw new Error('Không phải bất phương trình bậc nhất: ' + line);
    let op = m[2].replace('≤', '<=').replace('≥', '>=');
    if (op === '>' || op === '>=') { a = -a; b = -b; c = -c; }
    // dạng chuẩn: a x + b y + c <= 0 (hoặc < 0)
    return { a, b, c, strict: op === '<' || op === '>', eq: op === '=', src: line };
  }
  function clipPoly(poly, a, b, c) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const fp = a * p[0] + b * p[1] + c, fq = a * q[0] + b * q[1] + c;
      if (fp <= 0) out.push(p);
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
        const t = fp / (fp - fq);
        out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
    return out;
  }

  function renderRegion(o, w, h) {
    const fr = frame(o, w, h);
    const parts = fr.parts, labels = fr.labels, errors = [];
    const box = [[fr.xmin, fr.ymin], [fr.xmax, fr.ymin], [fr.xmax, fr.ymax], [fr.xmin, fr.ymax]];
    const ineqs = [];
    String(o.ineqs || '').split('\n').map((s) => s.trim()).filter(Boolean).forEach((line) => {
      try { ineqs.push(parseIneq(line)); } catch (e) { errors.push(e.message); }
    });
    const toPts = (poly) => poly.map((p) => r2(fr.X(p[0])) + ',' + r2(fr.Y(p[1]))).join(' ');
    let feas = box;
    ineqs.forEach((q) => { if (!q.eq) feas = clipPoly(feas, q.a, q.b, q.c); });
    const hatchMode = o.style === 'hatch';
    if (hatchMode) {
      // kiểu SGK: gạch bỏ phần không thuộc miền nghiệm, phần để trắng là miền nghiệm
      let defs = '';
      ineqs.forEach((q, i) => {
        if (q.eq) return;
        const ang = [45, -45, 0, 90, 20, -20][i % 6];
        const col = '#8c8c8c'; // SGK: phần bị gạch bỏ dùng nét xám, mỗi bất phương trình một hướng gạch
        defs += `<pattern id="ht${o.id}_${i}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(${ang})"><line x1="0" y1="0" x2="0" y2="9" stroke="${col}" stroke-width="0.8" stroke-opacity="0.8"/></pattern>`;
        const bad = clipPoly(box, -q.a, -q.b, -q.c);
        if (bad.length > 2) parts.push(`<polygon points="${toPts(bad)}" fill="url(#ht${o.id}_${i})" stroke="none"/>`);
      });
      parts.splice(1, 0, `<defs>${defs}</defs>`);
    } else if (feas.length > 2 && ineqs.length) {
      parts.push(`<polygon points="${toPts(feas)}" fill="#5dade2" fill-opacity="0.38" stroke="none"/>`);
    }
    // chỗ đã có chữ (đỉnh và nhãn toạ độ đỉnh, tên các đường thẳng đã đặt): tên đường thẳng tránh đè lên
    const busy = [];
    if (o.vertices && feas.length > 2) feas.forEach((p) => { const vx = fr.X(p[0]), vy = fr.Y(p[1]); busy.push([vx - 6, vy - 24, vx + 100, vy + 6]); });
    const free = (x, y) => !busy.some((b) => x + 12 > b[0] && x - 12 < b[2] && y + 10 > b[1] && y - 10 < b[3]) && x > PAD && x < w - PAD && y > PAD && y < h - PAD;
    ineqs.forEach((q, i) => {
      const col = hatchMode ? '#d63031' : COLORS[i % COLORS.length]; // SGK: bờ miền nghiệm màu đỏ
      let p1, p2;
      if (Math.abs(q.b) >= Math.abs(q.a)) {
        p1 = [fr.xmin, -(q.a * fr.xmin + q.c) / q.b]; p2 = [fr.xmax, -(q.a * fr.xmax + q.c) / q.b];
      } else {
        p1 = [-(q.b * fr.ymin + q.c) / q.a, fr.ymin]; p2 = [-(q.b * fr.ymax + q.c) / q.a, fr.ymax];
      }
      parts.push(`<line x1="${r2(fr.X(p1[0]))}" y1="${r2(fr.Y(p1[1]))}" x2="${r2(fr.X(p2[0]))}" y2="${r2(fr.Y(p2[1]))}" stroke="${col}" stroke-width="1.6"${q.strict ? ' stroke-dasharray="7 4"' : ''} clip-path="url(#${fr.clip})"/>`);
      // tên đường thẳng: theo o.lnames (mỗi dòng một tên, bỏ trống = không ghi, vd trục toạ độ) hoặc d1, d2…
      const lname = o.lnames ? (String(o.lnames).split('\n')[i] || '').trim() : 'd_{' + (i + 1) + '}';
      if (o.lineNames !== false && lname) {
        // đặt tên đường thẳng tại đoạn nằm trong khung
        const seg = clipSeg(p1, p2, fr);
        if (seg) {
          // thử vài vị trí dọc theo đường thẳng, lấy chỗ đầu tiên không đè lên chữ khác
          const at = (t) => [fr.X(seg[0][0] + t * (seg[1][0] - seg[0][0])) + 10, fr.Y(seg[0][1] + t * (seg[1][1] - seg[0][1])) - 10];
          const tt = [0.88, 0.72, 0.94, 0.6, 0.8, 0.45, 0.3, 0.15];
          const pos = tt.map(at).find((p) => free(p[0], p[1])) || at(0.88);
          busy.push([pos[0] - 14, pos[1] - 12, pos[0] + 14, pos[1] + 12]);
          labels.push({ x: pos[0], y: pos[1], tex: lname, size: 14, color: col, bg: true });
        }
      }
    });
    if (o.vertices && feas.length > 2 && ineqs.length) {
      const onEdge = (p) => Math.abs(p[0] - fr.xmin) < 1e-9 || Math.abs(p[0] - fr.xmax) < 1e-9 || Math.abs(p[1] - fr.ymin) < 1e-9 || Math.abs(p[1] - fr.ymax) < 1e-9;
      const seen = [];
      // tên đỉnh theo lời giải (o.vnames: mỗi dòng "A(0; 3)"); đỉnh không có trong đó dùng chữ cái còn trống
      const given = [];
      String(o.vnames || '').split('\n').forEach((s) => { const m = /^\s*([A-Za-z][A-Za-z0-9_']*)\s*\(\s*([^;]+);([^)]+)\)/.exec(s); if (m) { const x = parseFloat(m[2].replace(',', '.')), y = parseFloat(m[3].replace(',', '.')); if (isFinite(x) && isFinite(y)) given.push([m[1], x, y]); } });
      const used = new Set(given.map((g) => g[0]));
      let k = 0;
      feas.forEach((p) => {
        if (onEdge(p) || seen.some((s) => Math.hypot(s[0] - p[0], s[1] - p[1]) < 1e-7)) return;
        seen.push(p);
        parts.push(`<circle cx="${r2(fr.X(p[0]))}" cy="${r2(fr.Y(p[1]))}" r="3" fill="#111"/>`);
        const g = given.find((q) => Math.hypot(q[1] - p[0], q[2] - p[1]) < 1e-6);
        let name = g ? g[0] : '';
        // đỉnh ở gốc toạ độ: gọi là O như SGK (khi lời giải chưa đặt tên khác)
        if (!name && Math.hypot(p[0], p[1]) < 1e-9 && !used.has('O')) { name = 'O'; used.add('O'); }
        while (!name) { const c = 'ABCDEFGHIJKLMNPQ'[k++ % 16]; if (!used.has(c) || k > 32) { name = c; used.add(c); } }
        labels.push({ x: fr.X(p[0]) + 8, y: fr.Y(p[1]) - 11, tex: name + '\\left(' + NumFmt.toTex(p[0]).replace(/dfrac/g, 'frac') + ';' + NumFmt.toTex(p[1]).replace(/dfrac/g, 'frac') + '\\right)', size: 13, ax: 'l', bg: true });
      });
    }
    return { svg: parts.join(''), labels, errors };
  }
  function clipSeg(p1, p2, fr) {
    let t0 = 0, t1 = 1;
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const tests = [[-dx, p1[0] - fr.xmin], [dx, fr.xmax - p1[0]], [-dy, p1[1] - fr.ymin], [dy, fr.ymax - p1[1]]];
    for (const [p, q] of tests) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    }
    if (t0 >= t1) return null;
    return [[p1[0] + t0 * dx, p1[1] + t0 * dy], [p1[0] + t1 * dx, p1[1] + t1 * dy]];
  }

  root.Graph = { renderGraph, renderRegion, COLORS };
})(window);
