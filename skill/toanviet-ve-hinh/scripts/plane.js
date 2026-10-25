// Hình học phẳng: dựng hình từ một kịch bản ngắn (điểm + lệnh vẽ), theo chương trình GDPT 2018
(function (root) {
  'use strict';
  const NAME = "[A-Z](?:'{1,2}|_?\\d)?";
  const NAME_RE = new RegExp(NAME, 'g'), NAME_FULL = new RegExp('^' + NAME + '$');
  const r1 = (v) => Math.round(v * 10) / 10;
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]], add = (p, q) => [p[0] + q[0], p[1] + q[1]], mul = (p, k) => [p[0] * k, p[1] * k];
  const len = (p) => Math.hypot(p[0], p[1]), dist = (p, q) => len(sub(p, q));
  const cross = (u, v) => u[0] * v[1] - u[1] * v[0], dot = (u, v) => u[0] * v[0] + u[1] * v[1];
  function inter(a, b, c, d) { const r = sub(b, a), s = sub(d, c), k = cross(r, s); if (Math.abs(k) < 1e-12) throw new Error('hai đường thẳng song song'); return add(a, mul(r, cross(sub(c, a), s) / k)); }
  const foot = (p, a, b) => { const d = sub(b, a); return add(a, mul(d, dot(sub(p, a), d) / dot(d, d))); };
  function circum(a, b, c) {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    if (Math.abs(d) < 1e-12) throw new Error('ba điểm thẳng hàng');
    const A = dot(a, a), B = dot(b, b), C = dot(c, c);
    return [(A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d, (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d];
  }
  function incenter(a, b, c) { const la = dist(b, c), lb = dist(c, a), lc = dist(a, b), s = la + lb + lc; return [(la * a[0] + lb * b[0] + lc * c[0]) / s, (la * a[1] + lb * b[1] + lc * c[1]) / s]; }
  function splitTop(s) {
    const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if ((ch === ',' || ch === ';') && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  const COLORS = { do: '#e8423f', xanh: '#1a9bd7', xanhla: '#2e8b57', den: '#111111', xam: '#7f8c8d', cam: '#e67e22', tim: '#8e44ad' };
  const numOf = (s) => { const v = MathExpr.compile(s, [])(); if (!isFinite(v)) throw new Error('không tính được "' + s + '"'); return v; };

  // Các phép dựng điểm
  const FN = {
    trungdiem: (a, b) => mul(add(a, b), 0.5),
    chan: (p, a, b) => foot(p, a, b),
    phangiac: (a, b, c) => { const lb = dist(a, b), lc = dist(a, c); return [(b[0] * lc + c[0] * lb) / (lb + lc), (b[1] * lc + c[1] * lb) / (lb + lc)]; },
    trongtam: (a, b, c) => mul(add(add(a, b), c), 1 / 3),
    tamngoai: circum,
    tamnoi: incenter,
    tructam: (a, b, c) => sub(add(add(a, b), c), mul(circum(a, b, c), 2)),
    giao: inter,
    chia: (a, b, k) => add(a, mul(sub(b, a), k)),
    doixung: (p, o) => sub(mul(o, 2), p),
    doixungtruc: (p, a, b) => sub(mul(foot(p, a, b), 2), p),
    quay: (p, o, deg) => { const t = deg * Math.PI / 180, d = sub(p, o); return [o[0] + d[0] * Math.cos(t) - d[1] * Math.sin(t), o[1] + d[0] * Math.sin(t) + d[1] * Math.cos(t)]; },
    tinhtien: (p, a, b) => add(p, sub(b, a)),
    hbh: (a, b, c) => sub(add(a, c), b),
    tron: (o, a, deg) => { const r = typeof a === 'number' ? a : dist(o, a), t = deg * Math.PI / 180; return [o[0] + r * Math.cos(t), o[1] + r * Math.sin(t)]; },
    // đỉnh A của tam giác biết B, C và hai cạnh AB = c, AC = b (A nằm bên trái hướng B -> C)
    dinh: (b, c, lc, lb) => { const d = dist(b, c), x = (lc * lc - lb * lb + d * d) / (2 * d), y2 = lc * lc - x * x; if (y2 < -1e-9) throw new Error('không dựng được: ba cạnh không thoả bất đẳng thức tam giác'); const u = mul(sub(c, b), 1 / d), y = Math.sqrt(Math.max(0, y2)); return [b[0] + u[0] * x - u[1] * y, b[1] + u[1] * x + u[0] * y]; },
    // phangiacgoc(X, A, Y): một điểm trên tia phân giác của góc XAY (đỉnh A ở giữa, giống lệnh goc);
    // phangiacgoc(X, A, Y, P, Q): giao điểm của tia phân giác góc XAY với đường thẳng PQ
    phangiacgoc: (x, a, y, p, q) => { const u = sub(x, a), v = sub(y, a), lu = len(u), lv = len(v); if (!lu || !lv) throw new Error('góc suy biến'); let d = add(mul(u, 1 / lu), mul(v, 1 / lv)); if (len(d) < 1e-9) d = [-u[1] / lu, u[0] / lu]; const t = add(a, mul(d, lu / len(d))); if (p === undefined) return t; if (q === undefined) throw new Error('viết: phangiacgoc(X, A, Y, P, Q)'); return inter(a, t, p, q); },
    // giaotron(P, Q, O, R, k): giao của đường thẳng PQ với đường tròn tâm O bán kính |OR| (hoặc số R);
    //   k = 1: giao thứ nhất theo hướng P → Q, k = 2: giao thứ hai
    giaotron: (p, q, o, rr, k) => { const r = typeof rr === 'number' ? rr : dist(o, rr), d = sub(q, p), f = sub(p, o), a = dot(d, d), b = 2 * dot(f, d), c = dot(f, f) - r * r, D = b * b - 4 * a * c; if (D < -1e-9) throw new Error('đường thẳng không cắt đường tròn'); const s = Math.sqrt(Math.max(0, D)), t = k === 1 ? (-b - s) / (2 * a) : (-b + s) / (2 * a); return add(p, mul(d, t)); },
    // giaotronkhac(P, Q, O, R, X): giao của đường thẳng PQ với đường tròn, lấy giao xa điểm X (giao "khác X")
    giaotronkhac: (p, q, o, rr, x) => { const r = typeof rr === 'number' ? rr : dist(o, rr), d = sub(q, p), f = sub(p, o), a = dot(d, d), b = 2 * dot(f, d), c = dot(f, f) - r * r, D = b * b - 4 * a * c; if (D < -1e-9) throw new Error('đường thẳng không cắt đường tròn'); const s = Math.sqrt(Math.max(0, D)), p1 = add(p, mul(d, (-b - s) / (2 * a))), p2 = add(p, mul(d, (-b + s) / (2 * a))); return dist(p1, x) >= dist(p2, x) ? p1 : p2; },
    // tohop(w1, P1, w2, P2, …) = w1·P1 + w2·P2 + … (tổng trọng số bằng 1): điểm cho bằng đẳng thức vectơ
    tohop: (...a) => { let x = 0, y = 0; for (let i = 0; i + 1 < a.length; i += 2) { x += a[i] * a[i + 1][0]; y += a[i] * a[i + 1][1]; } return [x, y]; },
    // dat(P, Q, X, Y): điểm trên tia PQ cách P một đoạn bằng XY;  dat(P, Q, d): cách P một đoạn d
    dat: (p, q, a, b) => { const d = dist(p, q); if (!d) throw new Error('tia suy biến'); const l = typeof a === 'number' ? a : dist(a, b); return add(p, mul(sub(q, p), l / d)); },
    tiepdiem: (p, o, a, k) => { const r = typeof a === 'number' ? a : dist(o, a), d = dist(p, o); if (d <= r) throw new Error('điểm nằm trong đường tròn'); const base = Math.atan2(p[1] - o[1], p[0] - o[0]), t = Math.acos(r / d) * (k === 2 ? -1 : 1); return [o[0] + r * Math.cos(base + t), o[1] + r * Math.sin(base + t)]; },
  };

  function build(script) {
    const P = {}, V = {}, cmds = [], errors = [], hidden = new Set(), relabel = {}, dots = new Set();
    // thay tên thông số bằng giá trị rồi mới tính
    const num = (s) => numOf(String(s).replace(/[a-z_][a-z0-9_]*/gi, (m) => (Object.prototype.hasOwnProperty.call(V, m) ? '(' + V[m] + ')' : m)));
    const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', '{,}');
    const pt = (n) => { if (!P[n]) throw new Error('chưa có điểm ' + n); return P[n]; };
    const names = (s) => { const m = s.match(NAME_RE) || []; if (!m.length) throw new Error('thiếu tên điểm'); m.forEach(pt); return m; };
    let tickAuto = 0;
    String(script || '').split(/\n/).forEach((raw) => {
      const line = raw.replace(/#.*$/, '').replace(/[−–]/g, '-').trim(); // dấu trừ Unicode (chép từ trang AI)
      if (!line) return;
      try {
        const vdef = line.match(/^([a-z][a-z0-9_]*)\s*=\s*(.+)$/);
        if (vdef) { V[vdef[1]] = num(vdef[2]); return; }
        const def = line.match(new RegExp('^(' + NAME + ')\\s*=\\s*(.+)$'));
        if (def) {
          const rhs = def[2].trim(), co = rhs.match(/^\((.*)\)$/), fn = rhs.match(/^([a-z]+)\((.*)\)$/);
          if (co) { const a = splitTop(co[1]); if (a.length !== 2) throw new Error('toạ độ cần hai số'); P[def[1]] = [num(a[0]), num(a[1])]; }
          else if (fn) { if (!FN[fn[1]]) throw new Error('không có phép dựng "' + fn[1] + '"'); P[def[1]] = FN[fn[1]].apply(null, splitTop(fn[2]).map((a) => (NAME_FULL.test(a) ? pt(a) : num(a)))); }
          else throw new Error('không hiểu');
          return;
        }
        const sp = line.indexOf(' '), kw = (sp < 0 ? line : line.slice(0, sp)).toLowerCase();
        let rest = sp < 0 ? '' : line.slice(sp + 1).trim(), label = '', color = '';
        if (kw !== 'nhan') rest = rest.replace(/\s+(#[0-9a-fA-F]{6}|do|xanh|xanhla|den|xam|cam|tim)\b/g, (m, c) => { color = COLORS[c] || c; return ''; });
        const eq = rest.indexOf('=');
        if (eq >= 0 && kw !== 'nhan') { label = rest.slice(eq + 1).trim().replace(/^\$(.*)\$$/, '$1').replace(/\s*°/g, '^{\\circ}'); rest = rest.slice(0, eq).trim(); }
        // tên điểm viết cách nhau ("goc C1 A A2", "doan A B", "dagiac A B C"): ghép lại — ba điểm một góc, cả dãy một đường,
        // từng cặp cho dấu bằng nhau / song song (cách viết tự nhiên của trợ lí AI)
        const groups = () => {
          const gs = rest.split(/[,\s]+/).filter(Boolean).map(names);
          if (gs.length > 1 && gs.every((g) => g.length === 1)) {
            const all = gs.map((g) => g[0]), cut = (k) => { const o = []; for (let i = 0; i < all.length; i += k) o.push(all.slice(i, i + k)); return o; };
            if (kw === 'goc' || kw === 'vuong') { if (all.length % 3 === 0) return cut(3); }
            else if (kw === 'bang' || kw === 'ssong') { if (all.length % 2 === 0) return cut(2); }
            else return [all];
          }
          return gs;
        };
        const pairs = (closed) => { const out = []; groups().forEach((g) => { for (let i = 0; i + 1 < g.length; i++) out.push([g[i], g[i + 1]]); if (closed && g.length > 2) out.push([g[g.length - 1], g[0]]); }); return out; };
        switch (kw) {
          case 'doan': pairs().forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1], color, label })); break;
          // thanghang D E F: các điểm thẳng hàng thì vẽ đoạn nối hai điểm xa nhau nhất; không thẳng hàng thì không vẽ gì
          case 'thanghang': {
            const n = names(rest); if (n.length < 3) throw new Error('viết: thanghang A B C');
            let best = null;
            n.forEach((a, i) => n.slice(i + 1).forEach((b) => { const d = dist(P[a], P[b]); if (!best || d > best[2]) best = [a, b, d]; }));
            if (best[2] > 1e-9 && n.every((c) => Math.abs(cross(sub(P[best[1]], P[best[0]]), sub(P[c], P[best[0]]))) / best[2] < 1e-3 * best[2] + 1e-6)) cmds.push({ k: 'seg', a: best[0], b: best[1], color, label: '' });
            break;
          }
          case 'netdut': pairs().forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1], dash: true, color, label })); break;
          case 'dagiac': pairs(true).forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1] })); break;
          case 'duongthang': pairs().forEach((s) => cmds.push({ k: 'line', a: s[0], b: s[1], color, label })); break;
          case 'tia': pairs().forEach((s) => cmds.push({ k: 'ray', a: s[0], b: s[1], color, label })); break;
          case 'vecto': pairs().forEach((s) => cmds.push({ k: 'vec', a: s[0], b: s[1], color, label })); break;
          case 'truc': { const t = rest.split(/[\s,]+/).filter(Boolean), grid = t.includes('luoi'), nm = t.filter((x) => x !== 'luoi').map(num); if (nm.length < 4) throw new Error('viết: truc xmin xmax ymin ymax [luoi]'); cmds.push({ k: 'axes', x0: nm[0], x1: nm[1], y0: nm[2], y1: nm[3], grid }); break; }
          case 'duongtron': {
            const m = rest.match(new RegExp('^(' + NAME + ')[,\\s]+(.+)$'));
            if (!m) throw new Error('viết: duongtron O A  hoặc  duongtron O 2.5');
            const c = pt(m[1]); cmds.push({ k: 'circle', c, r: NAME_FULL.test(m[2].trim()) ? dist(c, pt(m[2].trim())) : num(m[2]) }); break;
          }
          case 'ngoaitiep': { const n = names(rest), c = circum(pt(n[0]), pt(n[1]), pt(n[2])); cmds.push({ k: 'circle', c, r: dist(c, pt(n[0])) }); break; }
          case 'noitiep': { const n = names(rest), c = incenter(pt(n[0]), pt(n[1]), pt(n[2])); cmds.push({ k: 'circle', c, r: dist(c, foot(c, pt(n[0]), pt(n[1]))) }); break; }
          case 'cung': case 'quat': { const n = names(rest); if (n.length !== 3) throw new Error('viết: ' + kw + ' O A B'); cmds.push({ k: kw === 'cung' ? 'arc' : 'sector', c: n[0], a: n[1], b: n[2] }); break; }
          case 'goc': case 'vuong': {
            const xm = rest.match(/\bx(\d)\s*$/); if (xm) rest = rest.replace(/\bx\d\s*$/, '');
            groups().forEach((g) => {
              if (g.length !== 3) throw new Error('góc cần ba điểm, đỉnh ở giữa');
              let lb = label;
              if (lb === '?') { const u = sub(pt(g[0]), pt(g[1])), v = sub(pt(g[2]), pt(g[1])); lb = fmt(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v))))) * 180 / Math.PI) + '^{\\circ}'; }
              cmds.push({ k: kw === 'goc' ? 'angle' : 'right', b: g[0], a: g[1], c: g[2], label: lb, n: xm ? +xm[1] : 1 });
            });
            break;
          }
          case 'bang': { const n = label ? Math.max(1, Math.min(4, parseInt(label, 10) || 1)) : (tickAuto = tickAuto % 3 + 1); pairs().forEach((s) => cmds.push({ k: 'tick', a: s[0], b: s[1], n })); break; }
          case 'ssong': pairs().forEach((s) => cmds.push({ k: 'par', a: s[0], b: s[1] })); break;
          case 'to': cmds.push({ k: 'fill', pts: names(rest), color: color || '#aed6f1' }); break;
          case 'ghi': { const n = names(rest); if (n.length !== 2 || !label) throw new Error('viết: ghi AB = 5\\,cm'); let lb = label; if (lb[0] === '?') { const unit = lb.slice(1).trim(); lb = fmt(dist(pt(n[0]), pt(n[1]))) + (unit ? '\\,\\text{' + unit + '}' : ''); } cmds.push({ k: 'len', a: n[0], b: n[1], label: lb }); break; }
          case 'diem': names(rest).forEach((n) => dots.add(n)); break;
          case 'an': names(rest).forEach((n) => hidden.add(n)); break;
          case 'nhan': { const m = rest.match(new RegExp('^(' + NAME + ')\\s*=\\s*(.*)$')); if (!m) throw new Error('viết: nhan A = x'); pt(m[1]); relabel[m[1]] = m[2]; break; }
          default: throw new Error('không có lệnh "' + kw + '"');
        }
      } catch (e) { errors.push(line + '  →  ' + e.message); }
    });
    return { P, cmds, errors, hidden, relabel, dots };
  }

  // Đặt tên điểm / tên tia, đường thẳng sao cho KHÔNG nét nào cắt ngang chữ (dùng chung cho hình phẳng và hình không gian).
  // items: [{ k, p: [x, y], tx }] (toạ độ màn hình); prims: các nét [[x, y], [x, y]]; circs: [{ c, r }]; labels: nhãn đã có (thêm vào đây);
  // pts: mọi điểm đang hiện { tên: [x, y] }; cen: tâm hình; w, h: khung; size, color: cỡ, màu chữ.
  function placeNames(items, prims, circs, labels, pts, cen, w, h, size, color) {
    const boxOf = (l) => { const txt = String(l.tex !== undefined ? l.tex : l.text || '').replace(/\\[a-zA-Z]+|[{}^_\s]/g, ''), fs = l.size || 14; const bw = fs * 0.36 + Math.max(1, txt.length) * fs * 0.58, bh = fs * 1.05; return [l.x - bw / 2, l.y - bh / 2, l.x + bw / 2, l.y + bh / 2]; };
    // đoạn PQ có cắt hình chữ nhật r không (Liang–Barsky)
    const hit = (p, q, r) => {
      let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
      for (const [pp, qq] of [[-dx, p[0] - r[0]], [dx, r[2] - p[0]], [-dy, p[1] - r[1]], [dy, r[3] - p[1]]]) {
        if (pp === 0) { if (qq < 0) return false; } else { const tt = qq / pp; if (pp < 0) { if (tt > t1) return false; if (tt > t0) t0 = tt; } else { if (tt < t0) return false; if (tt < t1) t1 = tt; } }
      }
      return true;
    };
    const circHit = (cc, r) => { const nx = Math.max(r[0], Math.min(cc.c[0], r[2])), ny = Math.max(r[1], Math.min(cc.c[1], r[3])), dmin = Math.hypot(nx - cc.c[0], ny - cc.c[1]); const dmax = Math.max(...[[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]].map((v) => Math.hypot(v[0] - cc.c[0], v[1] - cc.c[1]))); return dmin <= cc.r && cc.r <= dmax; };
    const over = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    const placed = labels.map(boxOf);
    // điểm có nhiều nét đi qua đặt trước (khó chỗ hơn)
    const deg = (it) => prims.filter((s) => Math.min(Math.hypot(s[0][0] - it.p[0], s[0][1] - it.p[1]), Math.hypot(s[1][0] - it.p[0], s[1][1] - it.p[1])) < 1).length;
    items.slice().sort((a, b) => deg(b) - deg(a)).forEach((it) => {
      const p = it.p, k = it.k, tx = it.tx, out = Math.atan2(p[1] - cen[1], p[0] - cen[0]);
      const proto = boxOf({ x: 0, y: 0, tex: tx, size }), hw = (proto[2] - proto[0]) / 2, hh = (proto[3] - proto[1]) / 2;
      let best = null;
      // điểm chỉ nằm trên một đường (các nét qua điểm cùng phương): tên các điểm trên cùng đường ghi thống nhất một phía
      // (phía trên; đường gần thẳng đứng: bên trái) như SGK, không chỗ trên chỗ dưới — trừ khi phía đó bị nét khác chắn
      let pref = null;
      {
        const dirs = [];
        prims.forEach((s) => {
          const dx = s[1][0] - s[0][0], dy = s[1][1] - s[0][1], L = Math.hypot(dx, dy); if (L < 1) return;
          const tt = ((p[0] - s[0][0]) * dx + (p[1] - s[0][1]) * dy) / (L * L), dd = Math.abs((p[0] - s[0][0]) * dy - (p[1] - s[0][1]) * dx) / L;
          if (dd < 1 && tt > -0.01 && tt < 1.01) dirs.push([dx / L, dy / L]);
        });
        // điểm nằm trên đường tròn: ghi ra phía ngoài đường tròn như thường lệ, không theo quy tắc này
        const onCirc = circs.some((cc) => Math.abs(Math.hypot(p[0] - cc.c[0], p[1] - cc.c[1]) - cc.r) < 1.5);
        if (!onCirc && dirs.length && dirs.every((u) => Math.abs(u[0] * dirs[0][1] - u[1] * dirs[0][0]) < 0.02)) {
          const u = dirs[0]; let nrm = [u[1], -u[0]];
          // tâm hình ở hẳn một phía của đường (cạnh đáy của tam giác…): ghi ra phía ngoài hình, cùng phía với tên hai đỉnh;
          // hình chỉ nằm dọc theo đường (các điểm thẳng hàng, tia đối): phía trên
          const side = (cen[0] - p[0]) * nrm[0] + (cen[1] - p[1]) * nrm[1];
          if (Math.abs(side) > 12) { if (side > 0) nrm = [-nrm[0], -nrm[1]]; }
          else if (Math.abs(nrm[1]) > 0.35 ? nrm[1] > 0 : nrm[0] > 0) nrm = [-nrm[0], -nrm[1]];
          pref = nrm;
        }
      }
      const score = (x, y, extra, a) => {
        const r = [x - hw - 1, y - hh - 1, x + hw + 1, y + hh + 1];
        let pen = extra * 1.5 - (pref ? 0 : 4 * Math.cos(a - out));
        if (pref) pen += 8 * (1 - (Math.cos(a) * pref[0] + Math.sin(a) * pref[1]));
        prims.forEach((s) => { if (hit(s[0], s[1], r)) pen += 100; });
        circs.forEach((cc) => { if (circHit(cc, r)) pen += 100; });
        placed.forEach((b) => { const ov = over(b, r); if (ov > 0) pen += 60 + ov; });
        Object.keys(pts).forEach((n) => { const q = pts[n]; if (n !== k && q[0] > r[0] - 2 && q[0] < r[2] + 2 && q[1] > r[1] - 2 && q[1] < r[3] + 2) pen += 60; });
        if (r[0] < 0 || r[1] < 0 || r[2] > w || r[3] > h) pen += 40;
        return { pen, x, y, r };
      };
      // tên tia, đường thẳng (x, y, z, d…): ở cuối nét nhưng lệch lên trên / xuống dưới nét, không chắn đầu nét
      if (/^[a-z](?:'{1,2}|_?\d)?$/.test(tx)) {
        prims.forEach((s) => {
          let e = Math.hypot(s[1][0] - p[0], s[1][1] - p[1]) < 1 ? 1 : Math.hypot(s[0][0] - p[0], s[0][1] - p[1]) < 1 ? 0 : -1;
          let tip = p;
          if (e < 0) {
            // điểm nằm trong nét (tia, đường thẳng vẽ dài quá điểm): tên đặt ở đầu nét gần điểm đó
            const dx = s[1][0] - s[0][0], dy = s[1][1] - s[0][1], l2 = dx * dx + dy * dy, tt = ((p[0] - s[0][0]) * dx + (p[1] - s[0][1]) * dy) / (l2 || 1);
            if (tt <= 0 || tt >= 1 || Math.abs((p[0] - s[0][0]) * dy - (p[1] - s[0][1]) * dx) / Math.sqrt(l2 || 1) > 1) return;
            e = tt > 0.5 ? 1 : 0; tip = s[e];
          }
          const o2 = s[1 - e], ll = Math.hypot(tip[0] - o2[0], tip[1] - o2[1]) || 1, u = [(tip[0] - o2[0]) / ll, (tip[1] - o2[1]) / ll];
          const px = tip;
          for (const nrm of [[u[1], -u[0]], [-u[1], u[0]]]) {
            const dp = 4 + Math.abs(nrm[0]) * hw + Math.abs(nrm[1]) * hh;
            for (const back of [6, 11, 16]) {
              const c = score(px[0] - u[0] * back + nrm[0] * dp, px[1] - u[1] * back + nrm[1] * dp, back / 3, Math.atan2(nrm[1], nrm[0]));
              c.pen -= nrm[1] < 0 ? 3 : 0; // ưu tiên phía trên
              if (!best || c.pen < best.pen) best = c;
            }
          }
        });
      }
      for (const extra of (best && best.pen < 50 ? [] : [0, 3, 7, 12])) {
        for (let i = 0; i < 24; i++) {
          const a = i * Math.PI / 12, ca = Math.cos(a), sa = Math.sin(a), d = 5 + Math.abs(ca) * hw + Math.abs(sa) * hh + extra;
          const c = score(p[0] + ca * d, p[1] + sa * d, extra, a);
          if (!best || c.pen < best.pen) best = c;
        }
        if (best && best.pen < 50) break; // đã có chỗ sạch ở khoảng cách này
      }
      placed.push(best.r);
      labels.push(Object.assign({ x: best.x, y: best.y, tex: tx, size }, color ? { color } : {}));
    });
  }

  function render(o, w, h) {
    const { P, cmds, errors, hidden, relabel, dots } = build(o.script);
    const names = Object.keys(P);
    if (!names.length) return { svg: '', labels: [{ x: w / 2, y: h / 2, text: 'Chưa có điểm nào', size: 13 }], errors };
    // các đầu mút kéo dài của đường thẳng, tia
    const ext = (c) => { const a = P[c.a], b = P[c.b], d = sub(b, a); return c.k === 'line' ? [sub(a, mul(d, 0.3)), add(b, mul(d, 0.3))] : c.k === 'ray' ? [a, add(b, mul(d, 0.3))] : [a, b]; };
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const grow = (p) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
    names.forEach((n) => grow(P[n]));
    cmds.forEach((c) => {
      if (c.k === 'line' || c.k === 'ray') ext(c).forEach(grow);
      if (c.k === 'axes') { grow([c.x0, c.y0]); grow([c.x1, c.y1]); }
      if (c.k === 'circle') { grow([c.c[0] - c.r, c.c[1] - c.r]); grow([c.c[0] + c.r, c.c[1] + c.r]); }
    });
    const M = 26;
    let sc = Math.min((w - 2 * M) / Math.max(1e-6, x1 - x0), (h - 2 * M) / Math.max(1e-6, y1 - y0)), vx = (x0 + x1) / 2, vy = (y0 + y1) / 2;
    // khi đang kéo điểm: giữ nguyên khung nhìn để hình không nhảy theo
    if (o._view && o._view.sc) { sc = o._view.sc; vx = o._view.cx; vy = o._view.cy; }
    // trình chiếu dựng hình từng bước (src/mod/trinhchieu.js): khung nhìn tính theo cả hình (hình không nhảy),
    // chỉ vẽ o._buoc nét đầu; điểm chưa có nét nào đi qua thì chưa ghi tên
    const tongBuoc = cmds.length;
    if (typeof o._buoc === 'number') {
      const vis = cmds.slice(0, Math.max(0, o._buoc)), co = new Set();
      vis.forEach((c) => {
        ['a', 'b', 'c'].forEach((k) => { if (typeof c[k] === 'string') co.add(c[k]); });
        (c.pts || []).forEach((n) => co.add(n));
        if (c.k === 'circle') names.forEach((n) => { if (dist(P[n], c.c) < 1e-9) co.add(n); });
      });
      names.forEach((n) => { if (!co.has(n)) hidden.add(n); });
      cmds.length = 0; vis.forEach((c) => cmds.push(c));
    }
    const T = (p) => [w / 2 + (p[0] - vx) * sc, h / 2 - (p[1] - vy) * sc];
    const S = {}; names.forEach((n) => { S[n] = T(P[n]); });
    const cen = T([names.reduce((s, n) => s + P[n][0], 0) / names.length, names.reduce((s, n) => s + P[n][1], 0) / names.length]);
    const col = o.color || '#111', sw = parseFloat(o.stroke) || 1.5;
    const fills = [], parts = [], marks = [], labels = [], segs = [];
    const L = (p, q, extra) => `<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"${extra || ''}/>`;
    const unit = (p, q) => { const d = sub(q, p), l = len(d) || 1; return [d[0] / l, d[1] / l]; };
    const mid = (p, q) => mul(add(p, q), 0.5);
    const away = (m, nrm) => (dot(sub(m, cen), nrm) >= 0 ? nrm : mul(nrm, -1));
    const vecCols = new Set();
    cmds.forEach((c) => {
      if (c.k === 'axes') {
        const ac = '#333333', o0 = T([0, 0]);
        if (c.grid) for (let v = Math.ceil(c.x0); v <= Math.floor(c.x1); v++) { const p = T([v, c.y0]), q = T([v, c.y1]); fills.push(`<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="#d5dde6" stroke-width="0.8"/>`); }
        if (c.grid) for (let v = Math.ceil(c.y0); v <= Math.floor(c.y1); v++) { const p = T([c.x0, v]), q = T([c.x1, v]); fills.push(`<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="#d5dde6" stroke-width="0.8"/>`); }
        vecCols.add(ac);
        const ax = (p, q) => fills.push(`<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${ac}" stroke-width="1.2" marker-end="url(#pv${o.id}333333)"/>`);
        ax(T([c.x0, 0]), T([c.x1, 0])); ax(T([0, c.y0]), T([0, c.y1]));
        for (let v = Math.ceil(c.x0); v < c.x1 - 0.3; v++) { if (!v) continue; const p = T([v, 0]); fills.push(`<line x1="${r1(p[0])}" y1="${r1(p[1] - 3)}" x2="${r1(p[0])}" y2="${r1(p[1] + 3)}" stroke="${ac}"/>`); labels.push({ x: p[0], y: p[1] + 12, tex: String(v), size: 12, color: '#444' }); }
        for (let v = Math.ceil(c.y0); v < c.y1 - 0.3; v++) { if (!v) continue; const p = T([0, v]); fills.push(`<line x1="${r1(p[0] - 3)}" y1="${r1(p[1])}" x2="${r1(p[0] + 3)}" y2="${r1(p[1])}" stroke="${ac}"/>`); labels.push({ x: p[0] - 10, y: p[1], tex: String(v), size: 12, color: '#444' }); }
        const xe = T([c.x1, 0]), ye = T([0, c.y1]);
        labels.push({ x: xe[0] - 4, y: xe[1] + 13, tex: 'x', size: 15 }, { x: ye[0] - 11, y: ye[1] + 4, tex: 'y', size: 15 });
        if (!P.O) labels.push({ x: o0[0] - 10, y: o0[1] + 12, tex: 'O', size: 15 });
        return;
      }
      if (c.k === 'seg' || c.k === 'line' || c.k === 'ray' || c.k === 'vec') {
        const e = ext(c).map(T), cc = c.color || col;
        if (c.k === 'vec') vecCols.add(cc);
        let ln = L(e[0], e[1], (c.dash ? ' stroke-dasharray="6 4"' : '') + (c.k === 'vec' ? ` marker-end="url(#pv${o.id}${cc.replace('#', '')})"` : ''));
        if (c.color) ln = ln.replace('stroke="' + col + '"', 'stroke="' + cc + '"');
        parts.push(ln);
        if (c.label) { const m = mid(e[0], e[1]), u = unit(e[0], e[1]), nrm = away(m, [-u[1], u[0]]); labels.push({ x: m[0] + nrm[0] * 14, y: m[1] + nrm[1] * 14, tex: c.label, size: 16, color: c.color || col }); }
        segs.push([c.a, c.b, c.k]);
      } else if (c.k === 'circle') {
        const p = T(c.c);
        parts.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(c.r * sc)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`);
      } else if (c.k === 'arc' || c.k === 'sector') {
        const ct = S[c.c], a = S[c.a], b = S[c.b], R = dist(ct, a);
        const t1 = Math.atan2(P[c.a][1] - P[c.c][1], P[c.a][0] - P[c.c][0]), t2 = Math.atan2(P[c.b][1] - P[c.c][1], P[c.b][0] - P[c.c][0]);
        const sweep = ((t2 - t1) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); // ngược chiều kim đồng hồ từ A đến B
        const end = [ct[0] + R * Math.cos(t2), ct[1] - R * Math.sin(t2)];
        const d = `M${r1(a[0])},${r1(a[1])}A${r1(R)},${r1(R)} 0 ${sweep > Math.PI ? 1 : 0} 0 ${r1(end[0])},${r1(end[1])}`;
        if (c.k === 'sector') fills.push(`<path d="${d}L${r1(ct[0])},${r1(ct[1])}Z" fill="#aed6f1" fill-opacity="0.45" stroke="none"/>`);
        parts.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"/>`);
      } else if (c.k === 'fill') {
        fills.push(`<polygon points="${c.pts.map((n) => r1(S[n][0]) + ',' + r1(S[n][1])).join(' ')}" fill="${c.color}" fill-opacity="0.4" stroke="none"/>`);
      } else if (c.k === 'angle') {
        const a = S[c.a], t1 = Math.atan2(S[c.b][1] - a[1], S[c.b][0] - a[0]), t2 = Math.atan2(S[c.c][1] - a[1], S[c.c][0] - a[0]);
        let df = t2 - t1; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
        // hai góc kề nhau cùng đỉnh (vd hai góc tạo bởi tia phân giác): cung vẫn liền từ tia này sang tia kia nhưng
        // góc sau vẽ ở bán kính lệch ra một chút, để hai cung không nối thành một cung của góc lớn (như hình SGK)
        const ix = cmds.indexOf(c), dir = (p) => Math.atan2(S[p][1] - a[1], S[p][0] - a[0]);
        const same = (u, t) => Math.abs(Math.atan2(Math.sin(u - t), Math.cos(u - t))) < 1e-3;
        const before = cmds.slice(0, ix).filter((d) => d.k === 'angle' && d.a === c.a && [d.b, d.c].some((p) => same(dir(p), t1) || same(dir(p), t2))).length;
        const R0 = (Math.abs(df) < 0.6 ? 26 : 17) + before * 5;
        for (let k = 0; k < c.n; k++) {
          const R = R0 + k * 3.5;
          marks.push(`<path d="M${r1(a[0] + R * Math.cos(t1))},${r1(a[1] + R * Math.sin(t1))}A${R},${R} 0 0 ${df > 0 ? 1 : 0} ${r1(a[0] + R * Math.cos(t2))},${r1(a[1] + R * Math.sin(t2))}" fill="none" stroke="${col}" stroke-width="${Math.max(0.9, sw * 0.7)}"/>`);
        }
        // nhãn số đo: góc hẹp thì đặt xa đỉnh hơn để nhãn nằm gọn trong góc, không chồng nhãn góc bên cạnh
        if (c.label) { const tm = t1 + df / 2, tw = c.label.replace(/\\[a-zA-Z]+|[{}^_]/g, '').length * 4.2, R = Math.min(90, Math.max(R0 + c.n * 3.5 + 11, tw / Math.max(0.05, Math.sin(Math.abs(df) / 2)) * 0.95)); labels.push({ x: a[0] + R * Math.cos(tm), y: a[1] + R * Math.sin(tm), tex: c.label, size: 13 }); }
      } else if (c.k === 'right') {
        const a = S[c.a], u = mul(unit(a, S[c.b]), 9), v = mul(unit(a, S[c.c]), 9), p1 = add(a, u), p2 = add(add(a, u), v), p3 = add(a, v);
        marks.push(`<path d="M${r1(p1[0])},${r1(p1[1])}L${r1(p2[0])},${r1(p2[1])}L${r1(p3[0])},${r1(p3[1])}" fill="none" stroke="${col}" stroke-width="${Math.max(0.9, sw * 0.7)}"/>`);
      } else if (c.k === 'tick') {
        const p = S[c.a], q = S[c.b], m = mid(p, q), u = unit(p, q), nrm = [-u[1], u[0]];
        for (let k = 0; k < c.n; k++) { const off = (k - (c.n - 1) / 2) * 3.6, ctr = add(m, mul(u, off)); marks.push(L(add(ctr, mul(nrm, 5)), sub(ctr, mul(nrm, 5)))); }
      } else if (c.k === 'par') {
        const p = S[c.a], q = S[c.b], m = mid(p, q), u = unit(p, q), nrm = [-u[1], u[0]], tip = add(m, mul(u, 5));
        marks.push(`<path d="M${r1(tip[0] - u[0] * 8 + nrm[0] * 4.5)},${r1(tip[1] - u[1] * 8 + nrm[1] * 4.5)}L${r1(tip[0])},${r1(tip[1])}L${r1(tip[0] - u[0] * 8 - nrm[0] * 4.5)},${r1(tip[1] - u[1] * 8 - nrm[1] * 4.5)}" fill="none" stroke="${col}" stroke-width="${Math.max(0.9, sw * 0.75)}"/>`);
      } else if (c.k === 'len') {
        const p = S[c.a], q = S[c.b], m = mid(p, q), u = unit(p, q), nrm = away(m, [-u[1], u[0]]);
        const tl = c.label.replace(/\\[a-zA-Z]+/g, '').replace(/[{}\\,^_]/g, '').length, off = 13 + Math.abs(nrm[0]) * tl * 3.3;
        labels.push({ x: m[0] + nrm[0] * off, y: m[1] + nrm[1] * off, tex: c.label, size: 13 });
      }
    });
    // chấm điểm. Ngoài các điểm kịch bản yêu cầu (diem …), tự chấm điểm "nằm một mình": điểm ở giữa một đường
    // (đoạn, đường thẳng, tia) mà không có nét nào khác đi tới theo hướng khác, hoặc điểm không nằm trên nét nào —
    // như SGK, để thấy rõ vị trí của điểm (giao điểm, đầu mút của đoạn khác thì đã rõ, không chấm)
    const lone = (n) => {
      if (relabel[n] !== undefined && !/^[A-Z]/.test(String(relabel[n]))) return false; // đầu tia x, y, đường thẳng d: không chấm
      const p = P[n], dirs = [];
      cmds.forEach((c) => {
        if (!['seg', 'line', 'ray', 'vec'].includes(c.k)) return;
        const a = P[c.a], b = P[c.b], d = sub(b, a), L = len(d); if (L < 1e-9) return;
        const u = [d[0] / L, d[1] / L], v = mul(u, -1);
        if (c.a === n || c.b === n) {
          if (c.k === 'line' || (c.k === 'ray' && c.b === n)) dirs.push(u, v); else dirs.push(c.a === n ? u : v);
          return;
        }
        const w = sub(p, a), t = dot(w, d) / (L * L), lo = c.k === 'line' ? -0.3 : 0, hi = c.k === 'seg' || c.k === 'vec' ? 1 : 1.3;
        if (Math.abs(cross(d, w)) / L < 1e-6 * Math.max(1, L) && t > lo + 1e-6 && t < hi - 1e-6) dirs.push(u, v);
      });
      if (!dirs.length) return true;
      // nằm trên đường tròn: là giao điểm của đường tròn với đường đó, đã rõ
      if (cmds.some((c) => c.k === 'circle' && Math.abs(dist(p, c.c) - c.r) < 1e-6 * Math.max(1, c.r))) return false;
      return dirs.every((x) => Math.abs(cross(dirs[0], x)) < 1e-6) && dirs.some((x) => dot(dirs[0], x) < -0.5);
    };
    names.forEach((n) => { if ((dots.has(n) || o.dots || lone(n)) && !hidden.has(n)) marks.push(`<circle cx="${r1(S[n][0])}" cy="${r1(S[n][1])}" r="2.4" fill="${col}"/>`); });
    // tên điểm, tên đường / tia (x, y, d…): chọn chỗ đặt sao cho KHÔNG nét nào cắt ngang chữ (như SGK):
    // thử nhiều hướng và khoảng cách quanh điểm, tính khung chữ thật, phạt khi khung bị đoạn / đường thẳng / tia / đường tròn
    // cắt qua, đè lên chữ hay điểm khác, ra ngoài khung hình; ưu tiên gần điểm và phía xa tâm hình.
    if (o.labels !== false) {
      const prims = [], circs = [];
      cmds.forEach((c) => {
        if (c.k === 'seg' || c.k === 'line' || c.k === 'ray' || c.k === 'vec') { const e = ext(c); prims.push([T(e[0]), T(e[1])]); }
        else if (c.k === 'circle') circs.push({ c: T(c.c), r: c.r * sc });
        else if (c.k === 'axes') { prims.push([T([c.x0, 0]), T([c.x1, 0])], [T([0, c.y0]), T([0, c.y1])]); }
      });
      const shown = names.filter((k) => !hidden.has(k)), pts = {}; shown.forEach((k) => { pts[k] = S[k]; });
      // hai điểm có tên trùng nhau (đề cho hai cách gọi cùng một điểm): một nhãn chung "I ≡ K", không ghi hai chữ chồng nhau
      const items = [];
      shown.filter((k) => relabel[k] !== '').forEach((k) => {
        const tx = relabel[k] !== undefined ? relabel[k] : k, same = items.find((it) => dist(it.p, S[k]) < 0.5);
        if (same) same.tx += ' \\equiv ' + tx; else items.push({ k, p: S[k], tx });
      });
      placeNames(items, prims, circs, labels, pts, cen, w, h, 16);
    }
    let defs = '';
    vecCols.forEach((cc) => { defs += `<marker id="pv${o.id}${cc.replace('#', '')}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="${cc}"/></marker>`; });
    if (defs) defs = '<defs>' + defs + '</defs>';
    return { svg: defs + fills.join('') + parts.join('') + marks.join(''), labels, errors, pts: S, view: { sc, cx: vx, cy: vy, dim: 2 }, buoc: tongBuoc };
  }

  // Hình mẫu theo chương trình GDPT 2018 (nhóm -> tên -> kịch bản).
  // Dòng "ten = số  # chú thích" là THÔNG SỐ: đổi số thì hình đổi theo. Nhãn "?" là số đo thật của hình.
  const S = (t) => String.raw(t).replace(/^\n/, '');
  const TRI = S`
a = 6      # Cạnh BC
b = 5.2    # Cạnh CA
c = 4.4    # Cạnh AB
B = (0, 0)
C = (a, 0)
A = dinh(B, C, c, b)`;
  const KINDS = [
    ['Điểm, đoạn thẳng, góc (lớp 6 – 7)', {
      doan: ['Đoạn thẳng và trung điểm', S`
d = 6   # Độ dài đoạn AB
A = (0, 0)
B = (d, 0)
M = trungdiem(A, B)
doan AB
diem A B M
bang AM MB
ghi AB = ? cm`],
      goc: ['Góc xOy', S`
so_do = 60   # Số đo góc xOy (độ)
O = (0, 0)
A = (5, 0)
B = quay(A, O, so_do)
tia OA OB
nhan A = x
nhan B = y
goc AOB = ?`],
      phangiac: ['Tia phân giác của một góc', S`
so_do = 70   # Số đo góc xOy (độ)
O = (0, 0)
A = (5, 0)
B = quay(A, O, so_do)
D = quay(A, O, so_do/2)
tia OA OB OD
nhan A = x
nhan B = y
nhan D = z
goc AOD = ?
goc DOB = ?`],
      kebu: ['Hai góc kề bù', S`
so_do = 60   # Số đo góc xOz (độ)
O = (0, 0)
A = (4.5, 0)
B = (-4.5, 0)
C = tron(O, 4, so_do)
doan AB
tia OC
nhan A = x
nhan B = y
nhan C = z
goc AOC = ?
goc COB x2 = ?
diem O`],
      doidinh: ['Hai góc đối đỉnh', S`
so_do = 50   # Số đo góc xOy (độ)
O = (0, 0)
A = (4.5, 0)
B = (-4.5, 0)
C = tron(O, 4.5, so_do)
D = doixung(C, O)
doan AB CD
nhan A = x
nhan B = x'
nhan C = y
nhan D = y'
goc AOC = ?
goc BOD = ?`],
      songsong: ['Hai đường thẳng song song và cát tuyến', S`
goc_cat = 60   # Góc giữa cát tuyến và đường thẳng a (độ)
kc = 3         # Khoảng cách giữa a và b
P = (0, kc)
Q = (8, kc)
R = (0, 0)
S = (8, 0)
A = (4.8, kc)
T = tron(A, 1, goc_cat + 180)
B = giao(A, T, R, S)
doan PQ RS
duongthang AB
nhan P = a
nhan R = b
an Q S T
ssong PQ RS
goc PAB = ?
goc ABS = ?
diem A B`],
      trungtruc: ['Đường trung trực của đoạn thẳng', S`
d = 6   # Độ dài đoạn AB
A = (0, 0)
B = (d, 0)
M = trungdiem(A, B)
D = (d/2, 3.2)
E = (d/2, -2)
doan AB
duongthang ED
an E
nhan D = d
vuong DMB
bang AM MB
diem A B M`],
    }],
    ['Tam giác (lớp 6 – 8)', {
      tamgiac: ['Tam giác ABC (ba cạnh)', TRI + S`

dagiac ABC
ghi BC = ?
ghi CA = ?
ghi AB = ?`],
      tamgiacgoc: ['Tam giác ABC (một cạnh, hai góc)', S`
a = 6        # Cạnh BC
goc_b = 55   # Góc B (độ)
goc_c = 45   # Góc C (độ)
B = (0, 0)
C = (a, 0)
X = quay(C, B, goc_b)
Y = quay(B, C, -goc_c)
A = giao(B, X, C, Y)
an X Y
dagiac ABC
goc CBA = ?
goc ACB x2 = ?
goc BAC x3 = ?`],
      can: ['Tam giác cân', S`
day = 5     # Cạnh đáy BC
ben = 5.5   # Cạnh bên AB = AC
B = (0, 0)
C = (day, 0)
A = dinh(B, C, ben, ben)
dagiac ABC
bang AB AC = 1
goc CBA = ?
goc ACB = ?`],
      deu: ['Tam giác đều', S`
canh = 5   # Độ dài cạnh
B = (0, 0)
C = (canh, 0)
A = quay(C, B, 60)
dagiac ABC
bang AB BC CA = 1
goc BAC = ?`],
      vuong: ['Tam giác vuông', S`
ab = 3.6   # Cạnh góc vuông AB
ac = 5.4   # Cạnh góc vuông AC
A = (0, 0)
B = (0, ab)
C = (ac, 0)
dagiac ABC
vuong BAC
ghi AB = ?
ghi AC = ?
ghi BC = ?`],
      vuongcan: ['Tam giác vuông cân', S`
canh = 4   # Cạnh góc vuông
A = (0, 0)
B = (0, canh)
C = (canh, 0)
dagiac ABC
vuong BAC
bang AB AC = 1`],
      trungtuyen: ['Ba đường trung tuyến, trọng tâm', TRI + S`

M = trungdiem(B, C)
N = trungdiem(C, A)
P = trungdiem(A, B)
G = trongtam(A, B, C)
dagiac ABC
doan AM BN CP
bang BM MC = 1
bang CN NA = 2
bang AP PB = 3
diem G`],
      duongcao: ['Ba đường cao, trực tâm', TRI + S`

D = chan(A, B, C)
E = chan(B, C, A)
F = chan(C, A, B)
H = tructam(A, B, C)
dagiac ABC
doan AD BE CF
vuong ADC
vuong BEC
vuong CFB
diem H`],
      noitiep: ['Ba đường phân giác, đường tròn nội tiếp', TRI + S`

I = tamnoi(A, B, C)
D = phangiac(A, B, C)
E = phangiac(B, C, A)
F = phangiac(C, A, B)
dagiac ABC
doan AD BE CF
noitiep ABC
diem I`],
      ngoaitiep: ['Ba đường trung trực, đường tròn ngoại tiếp', TRI + S`

O = tamngoai(A, B, C)
M = trungdiem(B, C)
N = trungdiem(C, A)
P = trungdiem(A, B)
dagiac ABC
ngoaitiep ABC
netdut OM ON OP
vuong OMC
vuong ONA
vuong OPB
diem O`],
      bangnhau: ['Hai tam giác bằng nhau', S`
a = 4.4   # Cạnh BC
b = 4.6   # Cạnh CA
c = 3.7   # Cạnh AB
B = (0, 0)
C = (a, 0)
A = dinh(B, C, c, b)
B' = (a + 2.8, 0)
C' = (2*a + 2.8, 0)
A' = dinh(B', C', c, b)
dagiac ABC
dagiac A'B'C'
bang AB A'B' = 1
bang AC A'C' = 2
bang BC B'C' = 3`],
      dongdang: ['Hai tam giác đồng dạng', S`
a = 5.6   # Cạnh BC
b = 5.7   # Cạnh CA
c = 4.6   # Cạnh AB
k = 0.6   # Tỉ số đồng dạng A'B'/AB
B = (0, 0)
C = (a, 0)
A = dinh(B, C, c, b)
B' = (a + 2.4, 0)
C' = (a + 2.4 + k*a, 0)
A' = dinh(B', C', k*c, k*b)
dagiac ABC
dagiac A'B'C'
goc CBA
goc C'B'A'
goc ACB x2
goc A'C'B' x2`],
      thales: ['Định lí Thalès (MN // BC)', TRI + S`

k = 0.55   # Tỉ số AM/AB
M = chia(A, B, k)
N = chia(A, C, k)
dagiac ABC
doan MN
ssong MN BC`],
      trungbinh: ['Đường trung bình của tam giác', TRI + S`

M = trungdiem(A, B)
N = trungdiem(A, C)
dagiac ABC
doan MN
bang AM MB = 1
bang AN NC = 2
ghi MN = ?
ghi BC = ?`],
      tcphangiac: ['Tính chất đường phân giác', TRI + S`

D = phangiac(A, B, C)
dagiac ABC
doan AD
goc BAD = ?
goc DAC = ?`],
      luonggiac: ['Tam giác vuông và tỉ số lượng giác', S`
alpha = 31    # Góc nhọn C (độ)
huyen = 6.5   # Cạnh huyền BC
A = (0, 0)
B = (0, huyen*sin(alpha*pi/180))
C = (huyen*cos(alpha*pi/180), 0)
dagiac ABC
vuong BAC
goc ACB = \alpha
ghi AB = \text{cạnh đối}
ghi AC = \text{cạnh kề}
ghi BC = \text{cạnh huyền}`],
    }],
    ['Tứ giác, đa giác (lớp 6, 8)', {
      hbhphangiac: ['Hình bình hành và các đường phân giác', S`
a = 5.6    # Cạnh DC
b = 3.4    # Cạnh AD
goc = 65   # Góc D (độ)
D = (0, 0)
C = (a, 0)
A = tron(D, b, goc)
B = hbh(A, D, C)
dagiac ABCD
M = phangiacgoc(D, A, B, D, C)   # phân giác góc DAB cắt DC tại M
N = phangiacgoc(B, C, D, A, B)   # phân giác góc BCD cắt AB tại N
doan AM CN
goc DAM MAB = ?
goc BCN NCD = ?
diem M N`],
      hinhthang: ['Hình thang', S`
day_lon = 6.5   # Đáy lớn DC
day_nho = 3.2   # Đáy nhỏ AB
cao = 3         # Chiều cao
lech = 1.4      # Độ lệch của A so với D
D = (0, 0)
C = (day_lon, 0)
A = (lech, cao)
B = (lech + day_nho, cao)
dagiac ABCD
ssong AB DC`],
      thangcan: ['Hình thang cân', S`
day_lon = 6.5   # Đáy lớn DC
day_nho = 3.5   # Đáy nhỏ AB
cao = 3         # Chiều cao
D = (0, 0)
C = (day_lon, 0)
A = ((day_lon - day_nho)/2, cao)
B = ((day_lon + day_nho)/2, cao)
dagiac ABCD
ssong AB DC
bang AD BC = 1
goc ADC = ?
goc DCB = ?`],
      binhhanh: ['Hình bình hành', S`
a = 5       # Cạnh DC
b = 3.4     # Cạnh AD
goc = 65    # Góc D (độ)
D = (0, 0)
C = (a, 0)
A = tron(D, b, goc)
B = hbh(A, D, C)
O = giao(A, C, B, D)
dagiac ABCD
doan AC BD
bang OA OC = 1
bang OB OD = 2`],
      chunhat: ['Hình chữ nhật', S`
dai = 5.6    # Chiều dài
rong = 3.2   # Chiều rộng
D = (0, 0)
C = (dai, 0)
B = (dai, rong)
A = (0, rong)
O = giao(A, C, B, D)
dagiac ABCD
doan AC BD
vuong ADC`],
      thoi: ['Hình thoi', S`
canh = 3.8   # Độ dài cạnh
goc = 64     # Góc A (độ)
A = (0, 0)
B = tron(A, canh, goc/2)
D = tron(A, canh, -goc/2)
C = hbh(B, A, D)
O = giao(A, C, B, D)
dagiac ABCD
doan AC BD
vuong BOC
bang AB BC CD DA = 1`],
      vuongh: ['Hình vuông', S`
canh = 4   # Độ dài cạnh
D = (0, 0)
C = (canh, 0)
B = (canh, canh)
A = (0, canh)
dagiac ABCD
vuong ADC
bang AB BC CD DA = 1`],
      lucgiac: ['Lục giác đều', S`
r = 3   # Bán kính đường tròn ngoại tiếp (bằng cạnh)
O = (0, 0)
A = tron(O, r, 120)
B = tron(O, r, 60)
C = tron(O, r, 0)
D = tron(O, r, -60)
E = tron(O, r, -120)
F = tron(O, r, 180)
dagiac ABCDEF
netdut AD BE CF
diem O`],
    }],
    ['Đường tròn (lớp 6, 9)', {
      duongtron: ['Đường tròn: bán kính, đường kính, dây', S`
r = 3   # Bán kính
O = (0, 0)
A = tron(O, r, 180)
B = tron(O, r, 0)
C = tron(O, r, 70)
D = tron(O, r, 215)
E = tron(O, r, 325)
duongtron O A
doan AB OC DE
diem O`],
      tieptuyen: ['Tiếp tuyến tại một điểm', S`
r = 2.6     # Bán kính
vi_tri = 40 # Vị trí tiếp điểm A trên đường tròn (độ)
O = (0, 0)
A = tron(O, r, vi_tri)
B = quay(O, A, 90)
C = quay(O, A, -90)
duongtron O A
doan OA
duongthang BC
an B
nhan C = d
vuong OAB
diem O A`],
      haitieptuyen: ['Hai tiếp tuyến cắt nhau', S`
r = 2.4   # Bán kính
d = 6     # Khoảng cách OM
O = (0, 0)
R = (r, 0)
M = (d, 0)
A = tiepdiem(M, O, R, 1)
B = tiepdiem(M, O, R, 2)
an R
duongtron O R
doan MA MB OA OB OM
vuong OAM
vuong OBM
diem O`],
      goctam: ['Góc ở tâm và góc nội tiếp', S`
r = 3        # Bán kính
cung = 110   # Số đo cung AB (độ)
vi_tri = 100 # Vị trí điểm C trên đường tròn (độ)
O = (0, 0)
A = tron(O, r, 270 - cung/2)
B = tron(O, r, 270 + cung/2)
C = tron(O, r, vi_tri)
duongtron O A
doan OA OB CA CB
goc AOB = ?
goc ACB x2 = ?
diem O`],
      tgnoitiep: ['Tứ giác nội tiếp', S`
r = 3   # Bán kính
O = (0, 0)
A = tron(O, r, 120)
B = tron(O, r, 30)
C = tron(O, r, -50)
D = tron(O, r, 205)
duongtron O A
dagiac ABCD
goc DAB = ?
goc BCD x2 = ?
diem O`],
      quat: ['Hình quạt tròn', S`
r = 3        # Bán kính
so_do = 90   # Số đo cung (độ)
O = (0, 0)
A = tron(O, r, 20)
B = tron(O, r, 20 + so_do)
quat O A B
duongtron O A
doan OA OB
goc AOB = ?
diem O`],
      haiduongtron: ['Hai đường tròn cắt nhau', S`
r1 = 3     # Bán kính đường tròn (O)
r2 = 2.2   # Bán kính đường tròn (O')
d = 4      # Khoảng cách OO'
O = (0, 0)
O' = (d, 0)
A = dinh(O, O', r1, r2)
B = doixungtruc(A, O, O')
duongtron O A
duongtron O' A
doan OO' AB OA O'A
diem O O'`],
    }],
    ['Vectơ, lượng giác (lớp 10 – 11)', {
      vecto: ['Tổng hai vectơ (quy tắc hình bình hành)', S`
A = (0, 0)
B = (4.6, 0.6)
D = (1.5, 3)
C = hbh(D, A, B)
vecto AB AD AC
netdut BC DC
ghi AB = \vec{a}
ghi AD = \vec{b}`],
      bavecto: ['Quy tắc ba điểm', S`
A = (0, 0)
B = (3, 3.2)
C = (6.5, 0.6)
vecto AB BC AC`],
      dtluonggiac: ['Đường tròn lượng giác', S`
alpha = 50   # Góc lượng giác (độ)
O = (0, 0)
A = (1, 0)
B = (0, 1)
X = (1.45, 0)
Y = (0, 1.45)
P = (-1.45, 0)
Q = (0, -1.45)
M = tron(O, 1, alpha)
H = chan(M, O, A)
K = chan(M, O, B)
duongtron O A
vecto PX QY
an P Q B
nhan X = x
nhan Y = y
doan OM
netdut MH MK
goc AOM = \alpha
diem M H K`],
    }],
    ['Vectơ (lớp 10, chương IV)', {
      vt_khainiem: ['Vectơ cùng phương, cùng hướng, bằng nhau', S`
A = (0, 0)
B = (3, 1)
C = (0.6, -2)
D = (3.6, -1)
E = (6.4, 1.6)
F = (4.9, 1.1)
vecto AB = \overrightarrow{AB} xanh
vecto CD = \overrightarrow{CD} xanh
vecto EF = \overrightarrow{EF} do`],
      vt_badiem: ['Tổng hai vectơ: quy tắc ba điểm', S`
A = (0, 0)
B = (3.5, 2.5)
C = (6.5, 0.5)
vecto AB = \vec{a} xanh
vecto BC = \vec{b} xanh
vecto AC = \vec{a}+\vec{b} do`],
      vt_hbh: ['Tổng hai vectơ: quy tắc hình bình hành', S`
a = 4      # Độ dài AB
A = (0, 0)
B = (a, 0)
D = (1.4, 2.4)
C = hbh(B, A, D)
netdut BC DC
vecto AB AD xanh
vecto AC = \overrightarrow{AB}+\overrightarrow{AD} do`],
      vt_hieu: ['Hiệu hai vectơ', S`
O = (0, 0)
A = (4, 2.5)
B = (4.6, -0.6)
vecto OA = \vec{a} xanh
vecto OB = \vec{b} xanh
vecto BA = \vec{a}-\vec{b} do`],
      vt_tichso: ['Tích của một vectơ với một số', S`
A = (0, 2.4)
B = (2, 3.2)
C = (0, 1)
E = tinhtien(C, A, B)
D = chia(C, E, 2)
G = (5, 0.3)
K = tinhtien(G, A, B)
H = chia(G, K, -1.5)
vecto AB = \vec{a} xanh
vecto CD = 2\vec{a} do
vecto GH = -1{,}5\,\vec{a} cam
an E K`],
      vt_trongtam: ['Trọng tâm tam giác: GA + GB + GC = 0', S`
A = (1.2, 4)
B = (0, 0)
C = (5, 0.4)
G = trongtam(A, B, C)
doan AB BC CA xam
vecto GA GB GC do
diem G`],
      vt_goc: ['Góc giữa hai vectơ, tích vô hướng', S`
g = 60     # Góc giữa hai vectơ (độ)
O = (0, 0)
A = (4, 0)
B = tron(O, 3, g)
vecto OA = \vec{a} xanh
vecto OB = \vec{b} xanh
goc AOB = ?`],
      vt_oxy: ['Toạ độ của vectơ trong mặt phẳng Oxy', S`
ux = 3     # Hoành độ của u
uy = 2     # Tung độ của u
truc -1 5 -1 4 luoi
O = (0, 0)
I = (1, 0)
J = (0, 1)
M = (ux, uy)
H = (ux, 0)
K = (0, uy)
netdut MH MK
vecto OI = \vec{i} do
vecto OJ = \vec{j} do
vecto OM = \vec{u} xanh
an O I J H K`],
      vt_hai_diem: ['Toạ độ vectơ AB khi biết A, B', S`
truc -1 6 -1 5 luoi
A = (1, 1)
B = (4, 3.5)
H = (4, 1)
vecto AB = \overrightarrow{AB} xanh
netdut AH HB
an H`],
      vt_hopluc: ['Hợp lực của hai lực (Vật lí)', S`
O = (0, 0)
A = (4, 0.6)
B = (1.2, 2.8)
C = hbh(A, O, B)
netdut AC BC
vecto OA = \vec{F}_1 xanh
vecto OB = \vec{F}_2 xanh
vecto OC = \vec{F} do
diem O`],
    }],  ];
  const scriptOf = (kind) => { for (const g of KINDS) if (g[1][kind]) return g[1][kind][1]; return ''; };

  // Thông số trong kịch bản: các dòng "ten = số  # chú thích"
  const PARAM = /^([a-z][a-z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:#\s*(.*))?$/;
  function params(script) {
    const out = [];
    String(script || '').split('\n').forEach((line, i) => { const m = line.trim().match(PARAM); if (m) out.push({ name: m[1], value: parseFloat(m[2]), label: (m[3] || m[1]).trim(), line: i }); });
    return out;
  }
  function setParam(script, name, value) {
    return String(script || '').split('\n').map((line) => { const m = line.trim().match(PARAM); return m && m[1] === name ? name + ' = ' + value + (m[3] ? '   # ' + m[3] : '') : line; }).join('\n');
  }

  // toạ độ các điểm (dùng khi kéo điểm để giải ngược thông số)
  const points = (script) => build(script).P;
  // các dòng kịch bản lỗi (kiểm tra kịch bản hình do AI viết)
  const loi = (script) => build(script).errors;
  const soBuoc = (script) => build(script).cmds.length; // số nét vẽ (trình chiếu dựng hình từng bước)
  root.Plane = { render, KINDS, scriptOf, params, setParam, points, placeNames, loi, soBuoc };
})(window);
