// Hình không gian tự dựng (lớp 11: quan hệ song song, quan hệ vuông góc): kịch bản điểm 3D, mặt phẳng, đường thẳng.
// Phần đường thẳng / cạnh bị một mặt phẳng che khuất tự vẽ nét đứt.
(function (root) {
  'use strict';
  const NAME = "[A-Z](?:'{1,2}|_?\\d)?";
  const NAME_RE = new RegExp(NAME, 'g'), NAME_FULL = new RegExp('^' + NAME + '$');
  const r1 = (v) => Math.round(v * 10) / 10;
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]], add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
  const mul = (p, k) => [p[0] * k, p[1] * k, p[2] * k], dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = (u) => Math.hypot(u[0], u[1], u[2]), unit = (u) => mul(u, 1 / (len(u) || 1));
  const s2 = { sub: (p, q) => [p[0] - q[0], p[1] - q[1]], len: (p) => Math.hypot(p[0], p[1]) };
  const COLORS = { do: '#e8423f', xanh: '#1a9bd7', xanhla: '#2e8b57', den: '#111111', xam: '#7f8c8d', cam: '#e67e22', tim: '#8e44ad' };
  const GREEK = { alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\Delta', Delta: '\\Delta', phi: '\\varphi', theta: '\\theta' };
  const texName = (n) => GREEK[n] || n;

  function splitTop(s) {
    const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if ((ch === ',' || ch === ';') && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  const numOf = (s) => { const v = root.MathExpr.compile(s, [])(); if (!isFinite(v)) throw new Error('không tính được "' + s + '"'); return v; };

  function makePlane(name, pts) {
    if (pts.length < 3) throw new Error('mặt phẳng cần ít nhất 3 điểm');
    const n = unit(cross(sub(pts[1], pts[0]), sub(pts[pts.length - 1], pts[0])));
    if (!len(n)) throw new Error('ba điểm thẳng hàng');
    return { name, pts, n, c0: pts[0], e1: sub(pts[1], pts[0]), e2: sub(pts[pts.length - 1], pts[0]) };
  }
  const footLine = (m, a, b) => { const d = sub(b, a); return add(a, mul(d, dot(sub(m, a), d) / dot(d, d))); };
  const footPlane = (m, pl) => sub(m, mul(pl.n, dot(sub(m, pl.c0), pl.n)));
  const isPl = (x) => x && x.n;
  const FN = {
    trungdiem: (a, b) => mul(add(a, b), 0.5),
    // điểm trên đường tròn nằm ngang tâm O bán kính r (hoặc OA), ở góc deg so với trục x
    tron: (o, r, deg) => { const R = typeof r === 'number' ? r : len(sub(r, o)), t = deg * Math.PI / 180; return [o[0] + R * Math.cos(t), o[1] + R * Math.sin(t), o[2]]; },
    phangiacgoc: (x, a, y, p, q) => { const u = unit(sub(x, a)), v = unit(sub(y, a)); let d = add(u, v); if (len(d) < 1e-9) throw new Error('góc bẹt'); const t = add(a, mul(unit(d), len(sub(x, a)))); return p === undefined ? t : FN.giao(a, t, p, q); },
    chia: (a, b, k) => add(a, mul(sub(b, a), k)),
    trongtam: (a, b, c) => mul(add(add(a, b), c), 1 / 3),
    tinhtien: (m, a, b) => add(m, sub(b, a)),
    hbh: (a, b, c) => sub(add(a, c), b),
    doixung: (a, o) => sub(mul(o, 2), a),
    chan: (m, a, b) => (isPl(a) ? footPlane(m, a) : footLine(m, a, b)),
    chanmp: (m, pl) => { if (!isPl(pl)) throw new Error('chanmp(M, P): P phải là mặt phẳng'); return footPlane(m, pl); },
    doixungmp: (m, pl) => sub(mul(footPlane(m, pl), 2), m),
    // giao(A, B, P): đường thẳng AB cắt mặt phẳng P;  giao(A, B, C, D): hai đường thẳng (đồng phẳng) cắt nhau
    giao: (a, b, c, d) => {
      if (isPl(c)) { const u = sub(b, a), k = dot(c.n, u); if (Math.abs(k) < 1e-12) throw new Error('đường thẳng song song với mặt phẳng'); return add(a, mul(u, dot(c.n, sub(c.c0, a)) / k)); }
      const u = sub(b, a), v = sub(d, c), w = sub(a, c), A = dot(u, u), B = dot(u, v), C = dot(v, v), D = dot(u, w), E = dot(v, w), den = A * C - B * B;
      if (Math.abs(den) < 1e-12) throw new Error('hai đường thẳng song song');
      const s = (B * E - C * D) / den, t = (A * E - B * D) / den;
      return mul(add(add(a, mul(u, s)), add(c, mul(v, t))), 0.5);
    },
    // chiếu song song điểm M lên mặt phẳng P theo phương AB
    chieu: (m, pl, a, b) => { if (!isPl(pl)) throw new Error('chieu(M, P, A, B): P phải là mặt phẳng'); if (!b) return footPlane(m, pl); const u = sub(b, a), k = dot(pl.n, u); if (Math.abs(k) < 1e-12) throw new Error('phương chiếu song song với mặt phẳng'); return add(m, mul(u, dot(pl.n, sub(pl.c0, m)) / k)); },
    trenmp: (pl, u, v) => { if (!isPl(pl)) throw new Error('trenmp(P, u, v): P phải là mặt phẳng'); return add(pl.c0, add(mul(pl.e1, u), mul(pl.e2, v))); },
    // điểm cách M một đoạn h theo phương vuông góc với mặt phẳng P (về phía trên / phía người nhìn)
    vuonggoc: (m, pl, h) => { if (!isPl(pl)) throw new Error('vuonggoc(M, P, h): P phải là mặt phẳng'); let n = pl.n; if (n[2] < -1e-9 || (Math.abs(n[2]) < 1e-9 && n[1] > 0)) n = mul(n, -1); return add(m, mul(n, h)); },
  };

  function build(script) {
    const P = {}, V = {}, PL = {}, cmds = [], errors = [], hidden = new Set(), relabel = {}, dots = new Set(), place = {}, FC = [];
    // khối đa diện: các mặt dùng để che (tự vẽ nét đứt), các cạnh được vẽ một lần
    const addSolid = (faces, color) => {
      const seen = new Set();
      faces.forEach((f) => { FC.push(f.map((n) => P[n])); f.forEach((n, i) => { const m = f[(i + 1) % f.length], key = [n, m].sort().join('|'); if (!seen.has(key)) { seen.add(key); cmds.push({ k: 'seg', a: n, b: m, style: 'auto', color }); } }); });
    };
    // chế độ Oxyz như SGK 12: Ox hướng về phía người nhìn, Oy sang phải, Oz lên trên
    let oxyz = false;
    const M3 = (x, y, z) => (oxyz ? [y, -x, z] : [x, y, z]), I3 = (p) => (oxyz ? [-p[1], p[0], p[2]] : p);
    const num = (s) => numOf(String(s).replace(/[a-z_][a-z0-9_]*/gi, (m) => (Object.prototype.hasOwnProperty.call(V, m) ? '(' + V[m] + ')' : m)));
    const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', '{,}');
    const pt = (n) => { if (!P[n]) throw new Error('chưa có điểm ' + n); return P[n]; };
    const names = (s) => { const m = s.match(NAME_RE) || []; if (!m.length) throw new Error('thiếu tên điểm'); m.forEach(pt); return m; };
    const plane = (n) => { if (!PL[n]) throw new Error('chưa có mặt phẳng ' + n); return PL[n]; };
    const arg = (a) => (PL[a] ? PL[a] : NAME_FULL.test(a) ? pt(a) : num(a));
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
          if (co) { const a = splitTop(co[1]); if (a.length !== 3) throw new Error('toạ độ không gian cần ba số (x, y, z)'); P[def[1]] = M3.apply(null, a.map(num)); }
          else if (fn) { if (!FN[fn[1]]) throw new Error('không có phép dựng "' + fn[1] + '"'); P[def[1]] = FN[fn[1]].apply(null, splitTop(fn[2]).map(arg)); }
          else throw new Error('không hiểu');
          return;
        }
        const sp = line.indexOf(' '), kw = (sp < 0 ? line : line.slice(0, sp)).toLowerCase();
        let rest = sp < 0 ? '' : line.slice(sp + 1).trim(), label = '', color = '', keo = null, solid = false;
        rest = rest.replace(/\s+lien\b/, () => { solid = true; return ''; });
        // màu và độ kéo dài viết ở cuối dòng
        rest = rest.replace(/\s+(#[0-9a-fA-F]{6}|do|xanh|xanhla|den|xam|cam|tim)\b/g, (m, c) => { color = COLORS[c] || c; return ''; });
        rest = rest.replace(/\s+keo\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?/, (m, a, b) => { keo = [parseFloat(a), parseFloat(b === undefined ? a : b)]; return ''; });
        if (kw === 'mp') {
          // mp P: A B C an  — mặt phẳng phụ để dựng điểm (hình chiếu, giao điểm), không vẽ
          let anMp = false;
          rest = rest.replace(/\s+an\s*$/, () => { anMp = true; return ''; });
          const m = rest.match(/^([^\s:]+)\s*:?\s*(.*)$/);
          if (!m) throw new Error('viết: mp P: A B C D  hoặc  mp P ngang O 6 4');
          const nm = m[1], body = m[2].trim(), tk = body.split(/[\s,]+/).filter(Boolean);
          let pts;
          if (tk[0] === 'ngang') { const o = pt(tk[1]), a = num(tk[2] || 6) / 2, b = num(tk[3] || 4) / 2; pts = [[-a, -b], [a, -b], [a, b], [-a, b]].map((q) => add(o, [q[0], q[1], 0])); }
          else if (tk[0] === 'dung') { const o = pt(tk[1]), a = num(tk[2] || 6) / 2, b = num(tk[3] || 4) / 2, g = num(tk[4] || 0) * Math.PI / 180, u = [Math.cos(g), Math.sin(g), 0]; pts = [[-a, -b], [a, -b], [a, b], [-a, b]].map((q) => add(o, add(mul(u, q[0]), [0, 0, q[1]]))); }
          else if (tk[0] === 'nghieng') { const o = pt(tk[1]), a = num(tk[2] || 6) / 2, b = num(tk[3] || 4) / 2, g = num(tk[4] || 30) * Math.PI / 180, v = [0, Math.cos(g), Math.sin(g)]; pts = [[-a, -b], [a, -b], [a, b], [-a, b]].map((q) => add(o, add([q[0], 0, 0], mul(v, q[1])))); }
          else pts = names(body).map(pt);
          PL[nm] = makePlane(nm, pts);
          PL[nm].color = color; PL[nm].corner = -1; PL[nm].solid = solid;
          if (!anMp) cmds.push({ k: 'plane', p: nm });
          return;
        }
        const eq = rest.indexOf('=');
        if (eq >= 0 && kw !== 'nhan') { label = rest.slice(eq + 1).trim().replace(/^\$(.*)\$$/, '$1').replace(/\s*°/g, '^{\\circ}'); rest = rest.slice(0, eq).trim(); }
        // tên điểm viết cách nhau ("goc S A B", "doan S A"): ghép lại như hình phẳng (src/plane.js)
        const groups = () => {
          const gs = rest.split(/[,\s]+/).filter(Boolean).map(names);
          if (gs.length > 1 && gs.every((g) => g.length === 1)) {
            const all = gs.map((g) => g[0]), cut = (k) => { const o = []; for (let i = 0; i < all.length; i += k) o.push(all.slice(i, i + k)); return o; };
            if (kw === 'goc' || kw === 'vuong') { if (all.length % 3 === 0) return cut(3); }
            else if (kw === 'bang') { if (all.length % 2 === 0) return cut(2); }
            else return [all];
          }
          return gs;
        };
        const pairs = (closed) => { const out = []; groups().forEach((g) => { for (let i = 0; i + 1 < g.length; i++) out.push([g[i], g[i + 1]]); if (closed && g.length > 2) out.push([g[g.length - 1], g[0]]); }); return out; };
        switch (kw) {
          case 'doan': case 'netdut': case 'netlien': case 'vecto':
            pairs().forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1], style: kw === 'netdut' ? 'dash' : kw === 'netlien' ? 'solid' : 'auto', vec: kw === 'vecto', color, label }));
            break;
          case 'dagiac': pairs(true).forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1], style: 'auto', color })); break;
          case 'duongthang': case 'tia': pairs().forEach((s) => cmds.push({ k: 'seg', a: s[0], b: s[1], style: 'auto', ext: kw === 'tia' ? [0, keo ? keo[1] : 0.35] : (keo || [0.35, 0.35]), color, label })); break;
          case 'goc': case 'vuong': {
            const xm = rest.match(/\bx(\d)\s*$/); if (xm) rest = rest.replace(/\bx\d\s*$/, '');
            groups().forEach((g) => {
              if (g.length !== 3) throw new Error('góc cần ba điểm, đỉnh ở giữa');
              let lb = label;
              if (lb === '?') { const u = sub(pt(g[0]), pt(g[1])), v = sub(pt(g[2]), pt(g[1])); lb = fmt(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v))))) * 180 / Math.PI) + '^{\\circ}'; }
              cmds.push({ k: kw === 'goc' ? 'angle' : 'right', b: g[0], a: g[1], c: g[2], label: lb, n: xm ? +xm[1] : 1, color });
            });
            break;
          }
          case 'bang': { const n = label ? Math.max(1, Math.min(4, parseInt(label, 10) || 1)) : (tickAuto = tickAuto % 3 + 1); pairs().forEach((s) => cmds.push({ k: 'tick', a: s[0], b: s[1], n, color })); break; }
          case 'ghi': { const n = names(rest); if (n.length !== 2 || !label) throw new Error('viết: ghi AB = 5\\,cm  hoặc  ghi AB = ?'); let lb = label; if (lb[0] === '?') { const u = lb.slice(1).trim(); lb = fmt(len(sub(pt(n[0]), pt(n[1])))) + (u ? '\\,\\text{' + u + '}' : ''); } cmds.push({ k: 'len', a: n[0], b: n[1], label: lb }); break; }
          case 'to': { const t = rest.trim(); if (PL[t]) cmds.push({ k: 'fill', pts: PL[t].pts, color: color || '#aed6f1' }); else cmds.push({ k: 'fill', pts: names(t).map(pt), color: color || '#aed6f1' }); break; }
          case 'nhanmp': { const m = rest.split(/\s+/); const pl = plane(m[0]); pl.corner = m[1] === undefined ? -1 : m[1] === '0' ? -2 : parseInt(m[1], 10) - 1; if (label) pl.label = label; break; }
          case 'diem': names(rest).forEach((n) => dots.add(n)); break;
          case 'oxyz': oxyz = true; break;
          case 'khoi': addSolid(rest.split(/[,;]+/).map((t) => names(t.replace(/\s+/g, ''))), color); break;
          case 'chop': { const t = rest.split(/\s+/).filter(Boolean); if (t.length !== 2) throw new Error('viết: chop S ABCD'); const s0 = names(t[0])[0], b = names(t[1]); addSolid([b].concat(b.map((q, i) => [s0, q, b[(i + 1) % b.length]])), color); break; }
          case 'langtru': { const t = rest.split(/\s+/).filter(Boolean); if (t.length !== 2) throw new Error('viết: langtru ABC A1B1C1'); const b = names(t[0]), u = names(t[1]); if (b.length !== u.length) throw new Error('hai đáy phải có cùng số đỉnh'); addSolid([b, u].concat(b.map((q, i) => [q, b[(i + 1) % b.length], u[(i + 1) % b.length], u[i]])), color); break; }
          case 'tudien': { const n = names(rest); if (n.length !== 4) throw new Error('viết: tudien ABCD'); addSolid([[n[0], n[1], n[2]], [n[0], n[1], n[3]], [n[0], n[2], n[3]], [n[1], n[2], n[3]]], color); break; }
          case 'tru': case 'non': case 'noncut': case 'cau': {
            const t = rest.split(/[\s,]+/).filter(Boolean);
            if (kw === 'cau') { cmds.push({ k: 'round', type: 'cau', c0: pt(t[0]), r1: num(t[1]), color }); break; }
            if (t.length < 3) throw new Error(kw === 'tru' ? 'viết: tru O O1 r' : kw === 'non' ? 'viết: non O S r' : 'viết: noncut O O1 r1 r2');
            const r1v = num(t[2]); cmds.push({ k: 'round', type: kw, c0: pt(t[0]), c1: pt(t[1]), r1: r1v, r2: kw === 'noncut' ? num(t[3]) : kw === 'tru' ? r1v : 0, color }); break;
          }
          case 'truc': { const t = rest.split(/[\s,]+/).filter(Boolean).map(num); const a = t[0] || 4, b = t[1] || a, c = t[2] || a; cmds.push({ k: 'axes', O: M3(0, 0, 0), X: M3(a, 0, 0), Y: M3(0, b, 0), Z: M3(0, 0, c), n: oxyz ? ['x', 'y', 'z'] : ['x', 'y', 'z'] }); break; }
          case 'toado': names(rest).forEach((n) => { const m = I3(pt(n)); cmds.push({ k: 'coord', p: n, M: pt(n), Mp: M3(m[0], m[1], 0), F: [M3(m[0], 0, 0), M3(0, m[1], 0), M3(0, 0, m[2])], v: m }); }); break;
          case 'an': names(rest).forEach((n) => hidden.add(n)); break;
          case 'nhan': { const m = rest.match(new RegExp('^(' + NAME + ')\\s*=\\s*(.*)$')); if (!m) throw new Error('viết: nhan A = x'); pt(m[1]); relabel[m[1]] = m[2]; break; }
          case 'vitri': { const m = rest.split(/\s+/); pt(m[0]); const D = { phai: 0, duoiphai: 45, duoi: 90, duoitrai: 135, trai: 180, trentrai: 225, tren: 270, trenphai: 315 }; if (!(m[1] in D)) throw new Error('vị trí: tren, duoi, trai, phai, trentrai, trenphai, duoitrai, duoiphai'); place[m[0]] = D[m[1]] * Math.PI / 180; break; }
          default: throw new Error('không có lệnh "' + kw + '"');
        }
      } catch (e) { errors.push(line + '  →  ' + e.message); }
    });
    return { P, PL, cmds, errors, hidden, relabel, dots, place, FC, oxyz };
  }

  function camera(o) {
    if (o.proj === 'xoay') {
      const yaw = (parseFloat(o.yaw) || 0) * Math.PI / 180, pitch = (isFinite(parseFloat(o.pitch)) ? parseFloat(o.pitch) : 20) * Math.PI / 180;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      return { proj: (p) => [p[0] * cy - p[1] * sy, -((p[0] * sy + p[1] * cy) * sp + p[2] * cp)], view: [sy * cp, cy * cp, -sp] };
    }
    // phép chiếu xiên như SGK: trục y (hướng ra sau) vẽ xiên góc a, rút ngắn k lần
    const a = (isFinite(parseFloat(o.ob)) ? parseFloat(o.ob) : 45) * Math.PI / 180, k = parseFloat(o.ok) > 0 ? parseFloat(o.ok) : 0.5;
    return { proj: (p) => [p[0] + k * p[1] * Math.cos(a), -(p[2] + k * p[1] * Math.sin(a))], view: unit([-k * Math.cos(a), 1, -k * Math.sin(a)]) };
  }
  function inPoly(q, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  function render(o, w, h) {
    const { P, PL, cmds, errors, hidden, relabel, dots, place, FC, oxyz } = build(o.script);
    const names = Object.keys(P);
    if (!names.length) return { svg: '', labels: [{ x: w / 2, y: h / 2, text: 'Chưa có điểm nào', size: 13 }], errors };
    const cam = camera(o), view = cam.view;
    const planes = Object.keys(PL).map((k) => PL[k]);
    const segEnds = (c) => { const a = P[c.a], b = P[c.b], d = sub(b, a); return c.ext ? [sub(a, mul(d, c.ext[0])), add(b, mul(d, c.ext[1]))] : [a, b]; };
    // khung hình
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const grow = (p3) => { const p = cam.proj(p3); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
    names.forEach((n) => grow(P[n]));
    planes.forEach((pl) => pl.pts.forEach(grow));
    cmds.forEach((c) => {
      if (c.k === 'seg') segEnds(c).forEach(grow);
      if (c.k === 'axes') [c.X, c.Y, c.Z].forEach(grow);
      if (c.k === 'round') [c.c0, c.c1].filter(Boolean).forEach((q, i) => { const r = i ? c.r2 : c.r1; for (let k = 0; k < 8; k++) grow(add(q, [r * Math.cos(k * Math.PI / 4), r * Math.sin(k * Math.PI / 4), 0])); if (c.type === 'cau') { grow(add(q, [0, 0, r])); grow(add(q, [0, 0, -r])); grow(add(q, [r, 0, 0])); grow(add(q, [-r, 0, 0])); } });
    });
    const M = 24;
    let sc = Math.min((w - 2 * M) / Math.max(1e-6, x1 - x0), (h - 2 * M) / Math.max(1e-6, y1 - y0)), vx = (x0 + x1) / 2, vy = (y0 + y1) / 2;
    if (o._view && o._view.sc) { sc = o._view.sc; vx = o._view.cx; vy = o._view.cy; }
    const T = (p3) => { const p = cam.proj(p3); return [w / 2 + (p[0] - vx) * sc, h / 2 + (p[1] - vy) * sc]; };
    const span = Math.max(x1 - x0, y1 - y0) || 1;
    // vật che: các mặt phẳng và các mặt của khối đa diện
    const occ = planes.map((pl) => ({ n: pl.n, c0: pl.c0, poly: pl.pts.map(T), ref: pl }));
    (FC || []).forEach((f) => { const n = unit(cross(sub(f[1], f[0]), sub(f[2], f[0]))); if (len(n)) occ.push({ n, c0: f[0], poly: f.map(T), ref: null }); });
    // điểm p bị che không (tia từ p về phía người nhìn cắt một mặt bên trong đa giác của mặt đó)
    const covered = (p, skip) => occ.some((oc) => {
      if (skip && oc.ref === skip) return false;
      const k = dot(oc.n, view); if (Math.abs(k) < 1e-9) return false;
      const t = dot(oc.n, sub(p, oc.c0)) / k;
      return t > 1e-5 * span && inPoly(T(p), oc.poly);
    });
    const col = o.color || '#111111', lcol = o.lcolor || '#1a6fc4', sw = parseFloat(o.stroke) || 1.5;
    const fills = [], parts = [], marks = [], labels = [], segs2 = [];
    const dash = ' stroke-dasharray="5 3.5"';
    // vẽ đoạn p-q (3D) với phần bị che là nét đứt
    const drawSeg = (p, q, color, style, skip, vecId) => {
      const N = 160, runs = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, hid = style === 'dash' ? true : style === 'solid' ? false : covered(add(p, mul(sub(q, p), t)), skip);
        if (!runs.length || runs[runs.length - 1].hid !== hid) runs.push({ hid, t0: i ? (i - 0.5) / N : 0, t1: t }); else runs[runs.length - 1].t1 = t;
      }
      runs[runs.length - 1].t1 = 1;
      runs.forEach((r, i) => {
        const a = T(add(p, mul(sub(q, p), r.t0))), b = T(add(p, mul(sub(q, p), r.t1)));
        const mk = vecId && i === runs.length - 1 ? ` marker-end="url(#${vecId})"` : '';
        parts.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"${r.hid ? dash : ''}${mk}/>`);
      });
      segs2.push([T(p), T(q)]);
    };
    const vecIds = new Set();
    // đường cong 3D (dãy điểm) với cờ khuất cho từng điểm
    const drawPoly = (pts, hid, color) => {
      let cur = null, d = '';
      const flush = () => { if (cur && cur.d) parts.push(`<path d="${cur.d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round"${cur.h ? dash : ''}/>`); };
      pts.forEach((p, i) => { const q = T(p), h = hid[i]; if (!cur || cur.h !== h) { const prev = cur ? cur.last : null; flush(); cur = { h, d: prev ? 'M' + prev : '' }; cur.d += (cur.d ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); } else cur.d += 'L' + r1(q[0]) + ',' + r1(q[1]); cur.last = r1(q[0]) + ',' + r1(q[1]); });
      flush();
    };
    const circle3 = (c, a, r, N) => { let u = cross(a, [0, 0, 1]); if (len(u) < 1e-6) u = cross(a, [1, 0, 0]); u = unit(u); const w2 = cross(a, u), out = []; for (let i = 0; i <= N; i++) { const t = 2 * Math.PI * i / N; out.push(add(c, add(mul(u, r * Math.cos(t)), mul(w2, r * Math.sin(t))))); } return out; };
    // vẽ đường tròn đáy: phía trước nét liền, phía sau nét đứt (nếu mặt đáy quay ra sau)
    const drawCap = (c, nOut, r, color, backArc) => { const pts = circle3(c, nOut, r, 120); const vis = dot(nOut, view) < 0; drawPoly(pts, pts.map((p, i) => (vis ? false : backArc ? backArc(i, p) : dot(sub(p, c), view) > 1e-9)), color); return pts; };
    const drawRound = (c) => {
      const color = c.color || col;
      if (c.type === 'cau') {
        const g = circle3(c.c0, view, c.r1, 160); drawPoly(g, g.map(() => false), color);
        const e = circle3(c.c0, [0, 0, 1], c.r1, 160); drawPoly(e, e.map((p) => dot(sub(p, c.c0), view) > 1e-9), color);
        return;
      }
      const a = unit(sub(c.c1, c.c0));
      if (c.type === 'non') {
        const S2 = T(c.c1), base = circle3(c.c0, a, c.r1, 120), B2 = base.map(T), C2 = T(c.c0), ref = Math.atan2(C2[1] - S2[1], C2[0] - S2[0]);
        if (inPoly(S2, B2)) { drawPoly(base, base.map(() => false), color); return; }
        let iMin = 0, iMax = 0, aMin = Infinity, aMax = -Infinity;
        B2.forEach((q, i) => { let t = Math.atan2(q[1] - S2[1], q[0] - S2[0]) - ref; while (t > Math.PI) t -= 2 * Math.PI; while (t < -Math.PI) t += 2 * Math.PI; if (t < aMin) { aMin = t; iMin = i; } if (t > aMax) { aMax = t; iMax = i; } });
        const lo = Math.min(iMin, iMax), hi = Math.max(iMin, iMax);
        const inner = (i) => i > lo && i < hi;
        let front = 0, best = Infinity; base.forEach((p, i) => { const d = dot(sub(p, c.c0), view); if (d < best) { best = d; front = i; } });
        const frontInner = inner(front);
        drawCap(c.c0, mul(a, -1), c.r1, color, (i) => (i === lo || i === hi ? false : inner(i) !== frontInner));
        drawSeg(c.c1, base[iMin], color, 'solid'); drawSeg(c.c1, base[iMax], color, 'solid');
        return;
      }
      // trụ, nón cụt
      let s = cross(a, view); const ok = len(s) > 1e-6; s = unit(s);
      drawCap(c.c0, mul(a, -1), c.r1, color); drawCap(c.c1, a, c.r2, color);
      if (ok) { drawSeg(add(c.c0, mul(s, c.r1)), add(c.c1, mul(s, c.r2)), color, 'solid'); drawSeg(add(c.c0, mul(s, -c.r1)), add(c.c1, mul(s, -c.r2)), color, 'solid'); }
    };
    const planeAt = {}; // vị trí tên mặt phẳng trên hình (để nhấp chọn mặt phẳng)
    cmds.forEach((c) => {
      if (c.k === 'plane') {
        const pl = PL[c.p], pc = pl.color || col;
        pl.pts.forEach((p, i) => drawSeg(p, pl.pts[(i + 1) % pl.pts.length], pc, pl.solid ? 'solid' : 'auto', pl));
        // tên mặt phẳng ở một góc, có cung nhỏ như SGK
        const S = pl.pts.map(T);
        let k = pl.corner;
        if (k < 0 || k >= S.length) { k = 0; S.forEach((s, i) => { if (s[0] - s[1] < S[k][0] - S[k][1]) k = i; }); }
        planeAt[pl.name] = [S.reduce((t, p) => t + p[0], 0) / S.length, S.reduce((t, p) => t + p[1], 0) / S.length];
        if (pl.corner !== -2) {
          const cn = S[k], u = s2.sub(S[(k + 1) % S.length], cn), v = s2.sub(S[(k + S.length - 1) % S.length], cn);
          const lu = s2.len(u) || 1, lv = s2.len(v) || 1, a1 = Math.atan2(u[1], u[0]), a2 = Math.atan2(v[1], v[0]);
          let df = a2 - a1; while (df > Math.PI) df -= 2 * Math.PI; while (df < -Math.PI) df += 2 * Math.PI;
          const R = 15, mid = a1 + df / 2;
          marks.push(`<path d="M${r1(cn[0] + R * u[0] / lu)},${r1(cn[1] + R * u[1] / lu)}A${R},${R} 0 0 ${df > 0 ? 1 : 0} ${r1(cn[0] + R * v[0] / lv)},${r1(cn[1] + R * v[1] / lv)}" fill="none" stroke="${pc}" stroke-width="1"/>`);
          labels.push({ x: cn[0] + Math.cos(mid) * 27, y: cn[1] + Math.sin(mid) * 27, tex: pl.label || texName(pl.name), size: 16, color: o.pcolor || lcol });
          planeAt[pl.name] = [cn[0] + Math.cos(mid) * 27, cn[1] + Math.sin(mid) * 27];
        }
      } else if (c.k === 'seg') {
        const e = segEnds(c), color = c.color || col;
        let vid = null;
        if (c.vec) { vid = 'sv' + o.id + color.replace('#', ''); vecIds.add(color); }
        drawSeg(e[0], e[1], color, c.style, null, vid);
        if (c.label && c.ext) {
          const a = T(e[0]), b = T(e[1]), d = s2.sub(b, a), l = s2.len(d) || 1, u = [d[0] / l, d[1] / l];
          let nrm = [-u[1], u[0]]; if (nrm[0] < 0 || (Math.abs(nrm[0]) < 0.2 && nrm[1] > 0)) nrm = [-nrm[0], -nrm[1]];
          labels.push({ x: b[0] - u[0] * 8 + nrm[0] * 11, y: b[1] - u[1] * 8 + nrm[1] * 11, tex: texName(c.label), size: 16, color: c.color || lcol });
        } else if (c.label) {
          const a = T(e[0]), b = T(e[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = s2.sub(b, a), l = s2.len(d) || 1;
          labels.push({ x: m[0] - d[1] / l * 12, y: m[1] + d[0] / l * 12, tex: texName(c.label), size: 15, color: c.color || lcol });
        }
      } else if (c.k === 'round') {
        drawRound(c);
      } else if (c.k === 'axes') {
        const ac = '#333333'; vecIds.add(ac);
        [c.X, c.Y, c.Z].forEach((e, i) => { drawSeg(c.O, e, ac, 'auto', null, 'sv' + o.id + '333333'); const a = T(c.O), b = T(e), d = s2.sub(b, a), l = s2.len(d) || 1; labels.push({ x: b[0] + d[0] / l * 4 + (i === 2 ? -11 : d[1] / l * 12), y: b[1] + d[1] / l * 4 + (i === 2 ? 4 : -d[0] / l * 12 + 2), tex: c.n[i], size: 16, color: '#222' }); });
        if (!P.O) { const q = T(c.O); labels.push({ x: q[0] + 10, y: q[1] + 12, tex: 'O', size: 16, color: lcol }); }
      } else if (c.k === 'coord') {
        const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', '{,}');
        drawSeg(c.M, c.Mp, col, 'dash'); c.F.forEach((f, i) => { if (Math.abs(c.v[i]) < 1e-9) return; drawSeg(i === 2 ? c.M : c.Mp, f, col, 'dash'); const s = T(f); marks.push(`<circle cx="${r1(s[0])}" cy="${r1(s[1])}" r="2.2" fill="${col}"/>`); labels.push({ x: s[0] + (i === 0 ? -10 : i === 1 ? 2 : -12), y: s[1] + (i === 0 ? 8 : i === 1 ? 13 : 0), tex: fmt(c.v[i]), size: 14, color: '#333' }); });
      } else if (c.k === 'fill') {
        fills.push(`<polygon points="${c.pts.map(T).map((s) => r1(s[0]) + ',' + r1(s[1])).join(' ')}" fill="${c.color}" fill-opacity="0.3" stroke="none"/>`);
      } else if (c.k === 'right' || c.k === 'angle') {
        const A = P[c.a], u = unit(sub(P[c.b], A)), v0 = sub(P[c.c], A), cc = c.color || col;
        if (c.k === 'right') {
          const s = 9 / sc, v = unit(v0), p1 = T(add(A, mul(u, s))), p2 = T(add(A, add(mul(u, s), mul(v, s)))), p3 = T(add(A, mul(v, s)));
          marks.push(`<path d="M${r1(p1[0])},${r1(p1[1])}L${r1(p2[0])},${r1(p2[1])}L${r1(p3[0])},${r1(p3[1])}" fill="none" stroke="${cc}" stroke-width="${Math.max(0.9, sw * 0.7)}"/>`);
        } else {
          const wv = unit(sub(v0, mul(u, dot(v0, u)))), ang = Math.acos(Math.max(-1, Math.min(1, dot(u, unit(v0)))));
          for (let k = 0; k < c.n; k++) {
            const R = (16 + k * 4) / sc; let d = '';
            for (let i = 0; i <= 24; i++) { const t = ang * i / 24, q = T(add(A, add(mul(u, R * Math.cos(t)), mul(wv, R * Math.sin(t))))); d += (i ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); }
            marks.push(`<path d="${d}" fill="none" stroke="${cc}" stroke-width="${Math.max(0.9, sw * 0.7)}"/>`);
          }
          if (c.label) { const R = (16 + c.n * 4 + 12) / sc, q = T(add(A, add(mul(u, R * Math.cos(ang / 2)), mul(wv, R * Math.sin(ang / 2))))); labels.push({ x: q[0], y: q[1], tex: c.label, size: 14, color: cc }); }
        }
      } else if (c.k === 'tick') {
        const p = T(P[c.a]), q = T(P[c.b]), m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = s2.sub(q, p), l = s2.len(d) || 1, u = [d[0] / l, d[1] / l], nrm = [-u[1], u[0]];
        for (let k = 0; k < c.n; k++) { const off = (k - (c.n - 1) / 2) * 3.6, ct = [m[0] + u[0] * off, m[1] + u[1] * off]; marks.push(`<line x1="${r1(ct[0] + nrm[0] * 5)}" y1="${r1(ct[1] + nrm[1] * 5)}" x2="${r1(ct[0] - nrm[0] * 5)}" y2="${r1(ct[1] - nrm[1] * 5)}" stroke="${c.color || col}" stroke-width="${Math.max(0.9, sw * 0.75)}"/>`); }
      } else if (c.k === 'len') {
        const p = T(P[c.a]), q = T(P[c.b]), d = s2.sub(q, p), l = s2.len(d) || 1;
        labels.push({ x: (p[0] + q[0]) / 2 - d[1] / l * 13, y: (p[1] + q[1]) / 2 + d[0] / l * 13, tex: c.label, size: 14 });
      }
    });
    // chấm điểm
    names.forEach((n) => { if ((dots.has(n) || o.dots) && !hidden.has(n)) { const s = T(P[n]); marks.push(`<circle cx="${r1(s[0])}" cy="${r1(s[1])}" r="2.5" fill="${lcol}"/>`); } });
    // tên điểm: hướng có khoảng trống lớn nhất, ưu tiên phía xa tâm hình
    const S = {}; names.forEach((n) => { S[n] = T(P[n]); });
    const cen = [names.reduce((s, n) => s + S[n][0], 0) / names.length, names.reduce((s, n) => s + S[n][1], 0) / names.length];
    // cách đặt chung với hình phẳng (Plane.placeNames): không nét nào cắt ngang chữ; điểm có hướng đặt sẵn (place) giữ nguyên
    const placeFn = root.Plane && root.Plane.placeNames;
    if (o.labels !== false && placeFn) {
      const shown = names.filter((k) => !hidden.has(k)), pts = {}; shown.forEach((k) => { pts[k] = S[k]; });
      const auto = shown.filter((k) => relabel[k] !== '' && place[k] === undefined);
      placeFn(auto.map((k) => ({ k, p: S[k], tx: relabel[k] !== undefined ? relabel[k] : k })), segs2.map(([a, b]) => [a, b]), [], labels, pts, cen, w, h, 16, lcol);
    }
    if (o.labels !== false) names.forEach((k) => {
      if (hidden.has(k) || relabel[k] === '') return;
      if (placeFn && place[k] === undefined) return; // đã đặt ở trên
      const p = S[k];
      let best = place[k];
      if (best === undefined) {
        const out = Math.atan2(p[1] - cen[1], p[0] - cen[0]), angs = [];
        segs2.forEach(([a, b]) => {
          const da = s2.len(s2.sub(a, p)), db = s2.len(s2.sub(b, p));
          if (da < 2) { angs.push(Math.atan2(b[1] - p[1], b[0] - p[0])); return; }
          if (db < 2) { angs.push(Math.atan2(a[1] - p[1], a[0] - p[0])); return; }
          const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2, dt = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
          if (Math.abs(cr) / Math.sqrt(l2 || 1) < 2 && dt > 0 && dt < l2) { const t = Math.atan2(b[1] - a[1], b[0] - a[0]); angs.push(t, t + Math.PI); }
        });
        best = out;
        if (angs.length) {
          const srt = angs.map((t) => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
          let score = -Infinity;
          srt.forEach((t, i) => { const gap = (i + 1 < srt.length ? srt[i + 1] : srt[0] + 2 * Math.PI) - t, m = t + gap / 2, s = Math.min(gap, Math.PI) + 0.35 * Math.cos(m - out); if (s > score) { score = s; best = m; } });
        }
      }
      labels.push({ x: p[0] + Math.cos(best) * 14, y: p[1] + Math.sin(best) * 14, tex: relabel[k] !== undefined ? relabel[k] : k, size: 16, color: lcol });
    });
    let defs = '';
    vecIds.forEach((c) => { defs += `<marker id="sv${o.id}${c.replace('#', '')}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="${c}"/></marker>`; });
    // hướng trên màn hình của ba trục (để đổi chuyển động chuột thành toạ độ khi kéo điểm)
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => { const p = cam.proj(e); return [p[0] * sc, p[1] * sc]; });
    return { svg: (defs ? '<defs>' + defs + '</defs>' : '') + fills.join('') + parts.join('') + marks.join(''), labels, errors, pts: S, planes: planeAt, view: { sc, cx: vx, cy: vy, dim: 3, axes, oxyz } };
  }

  // ---------- Hình mẫu lớp 11 ----------
  const S = (t) => String.raw(t).replace(/^\n/, '');
  const KINDS = [
    ['Khối đa diện, khối tròn xoay', {
      k_chop3sa: ['Hình chóp S.ABC có SA ⊥ (ABC)', S`
a = 4.4    # Cạnh AC
b = 3.4    # Cạnh AB
g = 50     # Góc BAC (độ)
h = 4      # Chiều cao SA
A = (0, 0, 0)
C = (a, 0, 0)
B = (b * cos(g * pi / 180), -b * sin(g * pi / 180), 0)
S = (0, 0, h)
chop S ABC
vuong SAB SAC`],
      k_chop3deu: ['Hình chóp tam giác đều S.ABC', S`
a = 4      # Cạnh đáy
h = 4.5    # Chiều cao SO
A = (0, 0, 0)
B = (a / 2, -a * sqrt(3) / 2, 0)
C = (a, 0, 0)
O = trongtam(A, B, C)
S = (a / 2, -a * sqrt(3) / 6, h)
M = trungdiem(B, C)
chop S ABC
doan SO AM SM
vuong SOM
diem O`],
      k_chop4deu: ['Hình chóp tứ giác đều S.ABCD', S`
a = 4      # Cạnh đáy
h = 4.5    # Chiều cao SO
A = (0, 0, 0)
B = (a, 0, 0)
C = (a, a, 0)
D = (0, a, 0)
O = trungdiem(A, C)
S = (a / 2, a / 2, h)
chop S ABCD
doan AC BD SO
diem O`],
      k_chop4sa: ['Hình chóp S.ABCD có SA ⊥ (ABCD), đáy hình chữ nhật', S`
a = 4.4    # Cạnh AB
b = 3.6    # Cạnh AD
h = 4      # Chiều cao SA
A = (0, 0, 0)
B = (a, 0, 0)
C = (a, b, 0)
D = (0, b, 0)
S = (0, 0, h)
chop S ABCD
vuong SAB SAD`],
      k_tudien: ['Tứ diện ABCD', S`
B = (0, 0, 0)
C = (4.2, -0.6, 0)
D = (3.4, 2.8, 0)
A = (1.8, 0.6, 3.8)
tudien ABCD`],
      k_hop: ['Hình hộp chữ nhật ABCD.A\'B\'C\'D\'', S`
a = 5      # AB
b = 3.6    # AD
c = 3      # AA'
A = (0, 0, 0)
B = (a, 0, 0)
C = (a, b, 0)
D = (0, b, 0)
A1 = (0, 0, c)
B1 = (a, 0, c)
C1 = (a, b, c)
D1 = (0, b, c)
langtru ABCD A1B1C1D1
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'`],
      k_lapphuong: ['Hình lập phương ABCD.A\'B\'C\'D\'', S`
a = 4      # Cạnh
A = (0, 0, 0)
B = (a, 0, 0)
C = (a, a, 0)
D = (0, a, 0)
A1 = (0, 0, a)
B1 = (a, 0, a)
C1 = (a, a, a)
D1 = (0, a, a)
langtru ABCD A1B1C1D1
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'`],
      k_langtru3: ['Lăng trụ đứng tam giác ABC.A\'B\'C\'', S`
a = 4.4    # Cạnh AB
b = 3.6    # Cạnh AC
g = 70     # Góc BAC (độ)
h = 4      # Chiều cao AA'
A = (0, 0, 0)
B = (a, 0, 0)
C = (b * cos(g * pi / 180), b * sin(g * pi / 180), 0)
A1 = (0, 0, h)
B1 = tinhtien(B, A, A1)
C1 = tinhtien(C, A, A1)
langtru ABC A1B1C1
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'`],
      k_langtruxien: ['Lăng trụ xiên ABC.A\'B\'C\'', S`
a = 4.4    # Cạnh AB
h = 3.6    # Chiều cao
dx = 1.4   # Độ xiên của cạnh bên
A = (0, 0, 0)
B = (a, 0, 0)
C = (1.4, 2.8, 0)
A1 = (dx, 0.6, h)
B1 = tinhtien(B, A, A1)
C1 = tinhtien(C, A, A1)
H = (dx, 0.6, 0)
langtru ABC A1B1C1
netdut A1H
vuong A1HA
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'`],
      k_chopcut: ['Hình chóp cụt đều ABCD.A\'B\'C\'D\'', S`
a = 5      # Cạnh đáy lớn
b = 2.6    # Cạnh đáy nhỏ
h = 3.4    # Chiều cao
A = (0, 0, 0)
B = (a, 0, 0)
C = (a, a, 0)
D = (0, a, 0)
A1 = ((a - b) / 2, (a - b) / 2, h)
B1 = ((a + b) / 2, (a - b) / 2, h)
C1 = ((a + b) / 2, (a + b) / 2, h)
D1 = ((a - b) / 2, (a + b) / 2, h)
langtru ABCD A1B1C1D1
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'`],
      k_tru: ['Hình trụ', S`
r = 2      # Bán kính đáy
h = 4.5    # Chiều cao
O = (0, 0, 0)
O1 = (0, 0, h)
A = tron(O, r, -40)
tru O O1 r
netdut OO1 OA
nhan O1 = O'
diem O O1`],
      k_non: ['Hình nón', S`
r = 2.4    # Bán kính đáy
h = 4.5    # Chiều cao
O = (0, 0, 0)
S = (0, 0, h)
A = tron(O, r, -40)
non O S r
netdut SO OA
doan SA
vuong SOA
diem O`],
      k_noncut: ['Hình nón cụt', S`
r1 = 2.6   # Bán kính đáy lớn
r2 = 1.4   # Bán kính đáy nhỏ
h = 3.6    # Chiều cao
O = (0, 0, 0)
O1 = (0, 0, h)
noncut O O1 r1 r2
netdut OO1
nhan O1 = O'
diem O O1`],
      k_cau: ['Hình cầu', S`
r = 3      # Bán kính
O = (0, 0, 0)
A = tron(O, r, 0)
cau O r
netdut OA
ghi OA = R
diem O
an A`],
    }],    ['Quan hệ song song (lớp 11, chương IV)', {
      vitri2dt: ['Hai đường thẳng chéo nhau, cắt nhau, song song', S`
O = (0, 0, 0)
mp P ngang O 8 5
A = (-2.2, -0.9, 0)
B = (2.4, 1.3, 0)
M = (0.6, -0.6, 2.4)
N = (-0.6, 0.7, -1.4)
duongthang AB = a xanh keo 0.05
duongthang MN = b do
I = giao(M, N, P)
diem I
an O A B M N`],
      dtcatmp: ['Đường thẳng cắt mặt phẳng', S`
O = (0, 0, 0)
mp P ngang O 8 5
A = (-0.8, 0.4, 2.6)
B = (0.9, -0.3, -1.6)
M = giao(A, B, P)
duongthang AB = d do
diem M
an O A B`],
      dtssmp: ['Đường thẳng song song với mặt phẳng', S`
O = (0, 0, 0)
mp P ngang O 8 5
h = 2      # Khoảng cách từ a đến (P)
A = (-2.5, -0.5, h)
B = (2.5, 0.8, h)
A1 = chanmp(A, P)
B1 = chanmp(B, P)
duongthang AB = a do keo 0.15
duongthang A1B1 = b xanh keo 0.05
an O A B A1 B1`],
      giaotuyen: ['Hai mặt phẳng cắt nhau theo giao tuyến', S`
O = (0, 0, 0)
mp P ngang O 8 5
g = 55     # Góc nghiêng của (Q)
C = (0, 0, 0)
mp Q nghieng C 6 4.6 g
A = (-2.6, 0, 0)
B = (2.6, 0, 0)
duongthang AB = d do keo 0.1
nhanmp Q 3
an O C A B`],
      mpss: ['Hai mặt phẳng song song', S`
O = (0, 0, 0)
h = 2.4    # Khoảng cách giữa (P) và (Q)
O1 = (0, 0, h)
mp P ngang O 8 5 lien
mp Q ngang O1 8 5 lien
A = (-2.2, -0.8, h)
B = (2, 1, h)
C = (-1.6, 1.2, h)
D = (2.2, -1.2, h)
duongthang AB = a xanh keo 0.1
duongthang CD = b xanh keo 0.1
I = giao(A, B, C, D)
diem I
an O O1 A B C D`],
      thales: ['Định lí Thalès trong không gian', S`
O = (0, 0, 0)
O1 = (0, 0, 2.2)
O2 = (0, 0, 4.4)
mp P ngang O 8 4 lien
mp Q ngang O1 8 4 lien
mp R ngang O2 8 4 lien
A = (-2.2, 0.4, 4.4)
C = (-1.2, -0.4, 0)
A1 = (1.2, -0.6, 4.4)
C1 = (2.6, 0.6, 0)
B = chia(A, C, 0.5)
B1 = chia(A1, C1, 0.5)
duongthang AC = d do keo 0.15
duongthang A1C1 = d' do keo 0.15 0.4
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
diem A B C A1 B1 C1
an O O1 O2`],
      chieuss: ['Phép chiếu song song', S`
O = (0, 0, 0)
mp P ngang O 8 5
L1 = (2.6, 1.2, 3.4)
L2 = (3.2, 0.2, 1.6)
A = (-1.8, 0.4, 2.6)
B = (0.4, 1.2, 3)
A1 = chieu(A, P, L1, L2)
B1 = chieu(B, P, L1, L2)
doan AB
doan A1B1 xanh
doan AA1 BB1 do
vecto L1L2 = l do
nhan A1 = A'
nhan B1 = B'
diem A1 B1
an O L1 L2`],
    }],
    ['Quan hệ vuông góc (lớp 11, chương VII)', {
      goc2dt: ['Góc giữa hai đường thẳng (Hình 7.2)', S`
O = (0, 0, 0)
A = (1.2, 0.6, 1.8)
B = (2.6, 0.4, 1.1)
t1 = 0.9   # Dịch chuyển a, b
O1 = (t1, -0.4, -2.2)
A1 = tinhtien(A, O, O1)
B1 = tinhtien(B, O, O1)
duongthang OA = a do keo 0.5 0.6
duongthang OB = b do keo 0.4 0.5
doan AB BB1 OO1 O1B1
netdut AA1 A1B1
duongthang O1A1 = a' xanh keo 0.5 0.6
duongthang O1B1 = b' xanh keo 0.4 0.5
nhan O1 = O'
nhan A1 = A'
nhan B1 = B'`],
      dtvgmp: ['Đường thẳng vuông góc với mặt phẳng (Hình 7.12)', S`
O = (0, 0, 0)
mp P ngang O 8 5
H = (-1.2, 0.2, 0)
T = vuonggoc(H, P, 3)
D = vuonggoc(H, P, -2)
duongthang DT = \Delta do keo 0
A = (-0.2, -1.4, 0)
B = (3.4, 1.2, 0)
C = (0.2, 1.6, 0)
E = (3.6, -1, 0)
duongthang AB = a xam keo 0
duongthang EC = b xam keo 0
I = giao(A, B, C, E)
diem H I
an O T D A B C E I H`],
      dkvg: ['Điều kiện để đường thẳng vuông góc với mặt phẳng', S`
O = (0, 0, 0)
mp P ngang O 8 5
T = vuonggoc(O, P, 3)
D = vuonggoc(O, P, -1.6)
A = (3, 0.3, 0)
B = (-1.4, -2.1, 0)
duongthang OA = a xanh keo 0.8 0.1
duongthang OB = b xanh keo 0.8 0.1
duongthang DT = \Delta do keo 0
vuong TOA
vuong TOB
diem O
an T D A B`],
      hai_dt_vgmp: ['Hai đường thẳng cùng vuông góc với một mặt phẳng (Hình 7.20)', S`
O = (0, 0, 0)
mp P ngang O 8 5
H = (0.6, 0, 0)
K = (2, 0.4, 0)
A = vuonggoc(H, P, 3)
A2 = vuonggoc(H, P, -1.5)
B = vuonggoc(K, P, 3)
B2 = vuonggoc(K, P, -1.5)
duongthang A2A = a do keo 0
duongthang B2B = b do keo 0
M = (-2.6, 1.2, 0)
N = (0.8, -0.8, 0)
doan MN = m
diem H K
an O H K A A2 B B2 M N`],
      hinh721: ['Đường thẳng qua O song song với b ⊥ (P) (Hình 7.21)', S`
O = (0, 0, 0)
mp P ngang O 8 5
H = (-1.6, 0.4, 0)
B = vuonggoc(H, P, 3.6)
B2 = vuonggoc(H, P, -1.4)
K = (0.9, 0.2, 0)
A = vuonggoc(K, P, 4.6)
A2 = vuonggoc(K, P, -1.4)
C1 = (0.6, 0.2, 3.6)
C2 = (2.2, 0.3, -1.4)
X = giao(C1, C2, K, A)
nhan X = O
vitri X phai
duongthang B2B = b do keo 0
duongthang A2A = a do keo 0
duongthang C1C2 = c do keo 0
diem H K X
an O H K A A2 B B2 C1 C2`],
      trungtruc: ['Mặt phẳng trung trực của đoạn thẳng (Hình 7.18)', S`
O = (0, 0, 0)
I = (0, 0, 0)
mp alpha dung I 4.4 5 90
nhanmp alpha 1
A = (-3, 0, 0)
B = (3, 0, 0)
M = (0, 0.6, 1.2)
doan AB AM MB MI
bang AI IB = 1
diem I
an O`],
      badvg: ['Định lí ba đường vuông góc', S`
O = (0, 0, 0)
mp P ngang O 8 5
H = (-0.6, 1.3, 0)
S = vuonggoc(H, P, 3.2)
A1 = (-2.6, -1.1, 0)
A2 = (3.4, -1.1, 0)
M = chan(H, A1, A2)
duongthang A1A2 = a xanh keo 0.05
doan SH SM HM
vuong SHM
vuong SMA2
vuong HMA2
diem H M
an O A1 A2`],
      gocdtmp: ['Hình chiếu, góc giữa đường thẳng và mặt phẳng', S`
O = (0, 0, 0)
mp P ngang O 8 5
A = (-2.4, -0.4, 0)
B = (1.4, 0.8, 2.6)
H = chanmp(B, P)
duongthang AB = d do keo 0.15
duongthang AH = d' xanh keo 0.15 0.45
netdut BH
vuong BHA
goc HAB = \varphi
diem H
an O`],
      haimpvg: ['Hai mặt phẳng vuông góc (Hình 7.16)', S`
O = (0, 0, 0)
mp P dung O 6 4.4 0
X1 = (-3, 0, 2.2)
X2 = (-3, 0, -2.2)
Y1 = (-3, 3.4, 2.2)
Y2 = (-3, 3.4, -2.2)
mp Q: X2 X1 Y1 Y2
nhanmp P 3
nhanmp Q 3
duongthang X2X1 = d do keo 0
K = (-3, 0, 0.4)
U = (-0.2, 0, 0.4)
V = (-3, 2.4, 0.4)
doan KU = a xanh
doan KV = b xanh
vuong UKV
nhan K = O
an O X1 X2 Y1 Y2 U V`],
      nhidien: ['Góc nhị diện và góc phẳng nhị diện', S`
g = 70     # Số đo góc nhị diện
A = (0, -2, 0)
B = (0, 2.4, 0)
C = (-4, -2, 0)
D = (-4, 2.4, 0)
O = (0, 0.2, 0)
X = (-3, 0.2, 0)
E = (-4 * cos(g * pi / 180), -2, 4 * sin(g * pi / 180))
F = tinhtien(E, A, B)
Y = (-3 * cos(g * pi / 180), 0.2, 3 * sin(g * pi / 180))
mp P: A B D C
mp Q: A B F E
duongthang AB = d do keo 0.15
doan OX OY
vuong XOB
vuong YOB
goc XOY = ?
nhanmp Q 3
diem O
an A B C D E F`],
      kcdiemmp: ['Khoảng cách từ một điểm đến mặt phẳng', S`
O = (0, 0, 0)
mp P ngang O 8 5
h = 3      # Khoảng cách MH
H = (-0.4, 0.4, 0)
M = vuonggoc(H, P, h)
A = (2, -0.8, 0)
doan MH MA AH
vuong MHA
ghi MH = ?
diem H A
an O`],
      kccheo: ['Khoảng cách giữa hai đường thẳng chéo nhau', S`
O = (0, 0, 0)
mp P ngang O 8 5
A1 = (-3, -0.8, 0)
A2 = (3, 1.2, 0)
N = (0.4, 0.2, 0)
M = vuonggoc(N, P, 2.6)
Q1 = (-1.4, 1.6, 0)
Q2 = (1.6, -1.8, 0)
B1 = tinhtien(M, O, Q1)
B2 = tinhtien(M, O, Q2)
duongthang A1A2 = b xanh keo 0.05
duongthang B1B2 = a do keo 0.6
doan MN
vuong MNA2
vuong NMB2
diem M N
an O A1 A2 B1 B2 Q1 Q2`],
      hinh717: ['Đường thẳng vuông góc với hai đường cắt nhau (Hình 7.17)', S`
O = (0, 0, 0)
A = (4, 0, 0)
B = (3.6, 0.2, 1)
C = (3.2, 0.4, 1.8)
duongthang OA = a xam keo 0.35 0.2
duongthang OB = b xam keo 0.2 0.2
duongthang OC = c xam keo 0.2 0.2
T = (3.4, -0.4, 3)
D = (3.4, -0.4, -0.8)
duongthang DT = \Delta do keo 0
an A B C T D`],
    }],
    ['Vectơ và hệ trục toạ độ trong không gian (lớp 12)', {
      vt_hinhhop: ['Quy tắc hình hộp', S`
A = (0, 0, 0)
B = (4, 0, 0)
D = (1.2, 2.6, 0)
C = hbh(B, A, D)
A1 = (0, 0, 3)
B1 = tinhtien(B, A, A1)
C1 = tinhtien(C, A, A1)
D1 = tinhtien(D, A, A1)
doan BC CC1 BB1 A1B1 B1C1 C1D1 D1A1
netdut AD DC DD1
vecto AB AD AA1 xanh
vecto AC1 do
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'`],
      vt_tudien: ['Vectơ trong tứ diện, trọng tâm', S`
B = (0, 0, 0)
C = (3.6, -0.6, 0)
D = (4.2, 2.6, 0)
A = (1.8, 0.8, 3.6)
G = trongtam(B, C, D)
doan AB AC AD BC CD
netdut BD
vecto AG do
netdut BG CG DG
diem G`],
      vt_goc3: ['Góc giữa hai vectơ trong không gian (hình lập phương)', S`
a = 3      # Cạnh hình lập phương
A = (0, 0, 0)
B = (a, 0, 0)
D = (0, a, 0)
C = hbh(B, A, D)
A1 = (0, 0, a)
B1 = tinhtien(B, A, A1)
C1 = tinhtien(C, A, A1)
D1 = tinhtien(D, A, A1)
doan BC CC1 BB1 AA1 A1B1 B1C1 C1D1 D1A1
netdut AD DC DD1
vecto AB = \vec{u} xanh
vecto AC1 = \vec{v} do
goc BAC1 = ?
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'`],
      oxyz_ijk: ['Hệ trục toạ độ Oxyz và các vectơ đơn vị', S`
oxyz
truc 4 4 4
O = (0, 0, 0)
I = (1.4, 0, 0)
J = (0, 1.4, 0)
K = (0, 0, 1.4)
vecto OI = \vec{i} do
vecto OJ = \vec{j} do
vecto OK = \vec{k} do
an I J K`],
      oxyz_diem: ['Toạ độ của một điểm M(x; y; z)', S`
oxyz
xm = 2     # Hoành độ x
ym = 3     # Tung độ y
zm = 2.5   # Cao độ z
truc 4 4.5 4
O = (0, 0, 0)
M = (xm, ym, zm)
toado M
diem M`],
      oxyz_vecto: ['Toạ độ của vectơ u = OM', S`
oxyz
ux = 2     # Toạ độ thứ nhất
uy = 3     # Toạ độ thứ hai
uz = 2.5   # Toạ độ thứ ba
truc 4 4.5 4
O = (0, 0, 0)
M = (ux, uy, uz)
toado M
vecto OM = \vec{u} do
an M`],
      oxyz_hhcn: ['Gắn hệ trục toạ độ vào hình hộp chữ nhật', S`
oxyz
a = 3      # AB
b = 4      # AD
c = 2.5    # AA'
truc 4.6 5.6 4
O = (0, 0, 0)
B = (a, 0, 0)
D = (0, b, 0)
C = (a, b, 0)
A1 = (0, 0, c)
B1 = (a, 0, c)
C1 = (a, b, c)
D1 = (0, b, c)
doan BC CD BB1 CC1 DD1 A1B1 B1C1 C1D1 D1A1
nhan O = A
nhan A1 = A'
nhan B1 = B'
nhan C1 = C'
nhan D1 = D'
vitri O trentrai`],
      oxyz_chop: ['Gắn hệ trục toạ độ vào hình chóp S.ABCD có SA ⊥ đáy', S`
oxyz
a = 3      # Cạnh đáy
h = 3.5    # SA
truc 4.6 4.6 4.8
O = (0, 0, 0)
B = (a, 0, 0)
D = (0, a, 0)
C = (a, a, 0)
S = (0, 0, h)
doan BC CD SB SC SD
nhan O = A
vitri O trentrai`],
    }],  ];
  const scriptOf = (kind) => { for (const g of KINDS) if (g[1][kind]) return g[1][kind][1]; return ''; };
  const PARAM = /^([a-z][a-z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:#\s*(.*))?$/;
  function params(script) {
    const out = [];
    String(script || '').split('\n').forEach((line, i) => { const m = line.trim().match(PARAM); if (m) out.push({ name: m[1], value: parseFloat(m[2]), label: (m[3] || m[1]).trim(), line: i }); });
    return out;
  }
  function setParam(script, name, value) {
    return String(script || '').split('\n').map((line) => { const m = line.trim().match(PARAM); return m && m[1] === name ? name + ' = ' + value + (m[3] ? '   # ' + m[3] : '') : line; }).join('\n');
  }
  // góc nhìn riêng cho khối tròn xoay: nhìn thẳng, đáy là elip nằm ngang như SGK
  const VIEW = { k_tru: { proj: 'xoay', yaw: 0, pitch: 16 }, k_non: { proj: 'xoay', yaw: 0, pitch: 16 }, k_noncut: { proj: 'xoay', yaw: 0, pitch: 16 }, k_cau: { proj: 'xoay', yaw: 0, pitch: 16 } };
  const viewOf = (kind) => Object.assign({ proj: 'xien', ob: 45, ok: 0.5 }, VIEW[kind] || {});
  const points = (script) => build(script).P; // toạ độ trong (x phải, y sau, z lên)
  // các dòng kịch bản lỗi (kiểm tra kịch bản hình do AI viết)
  const loi = (script) => build(script).errors;
  root.Space = { render, KINDS, scriptOf, params, setParam, viewOf, points, loi };
})(typeof window !== 'undefined' ? window : globalThis);
