// Bản vá: kéo được điểm tính từ thông số (vd C = (a, 0), A = tron(D, b, goc)):
// khi kéo, phần mềm giải ngược ra giá trị các thông số trên dòng định nghĩa điểm đó.
//   node build/patch-keothongso.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 80));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};
rep('src/plane.js', '  root.Plane = { render, KINDS, scriptOf, params, setParam };',
  '  // toạ độ các điểm (dùng khi kéo điểm để giải ngược thông số)\n  const points = (script) => build(script).P;\n  root.Plane = { render, KINDS, scriptOf, params, setParam, points };');
rep('src/space.js', '  root.Space = { render, KINDS, scriptOf, params, setParam, viewOf };',
  '  const points = (script) => build(script).P; // toạ độ trong (x phải, y sau, z lên)\n  root.Space = { render, KINDS, scriptOf, params, setParam, viewOf, points };');

// ---------- giao diện ----------
rep('src/app.js', '  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);',
`  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);
  // điểm tính từ thông số: các thông số xuất hiện trên dòng định nghĩa điểm
  function paramPts(o) {
    const M = o.type === 'space' ? Space : Plane, ps = M.params(o.script).map((p) => p.name), out = {};
    if (!ps.length) return out;
    String(o.script || '').split('\\n').forEach((ln) => {
      const m = ln.replace(/#.*$/, '').trim().match(/^([A-Z](?:'{1,2}|_?\\d)?)\\s*=\\s*(.+)$/);
      if (!m) return;
      const used = ps.filter((p) => new RegExp('(^|[^A-Za-z0-9_])' + p + '(?![A-Za-z0-9_])').test(m[2]));
      if (used.length) out[m[1]] = used.slice(0, 3);
    });
    return out;
  }
  // giải ngược: tìm giá trị các thông số để điểm name tới gần vị trí target nhất (Gauss–Newton có giảm chấn)
  function solveParams(o, name, names, start, target) {
    const M = o.type === 'space' ? Space : Plane;
    const pos = (vals) => { let sc = o.script; names.forEach((n, i) => { sc = M.setParam(sc, n, vals[i]); }); const p = M.points(sc)[name]; return p && p.every(isFinite) ? p : null; };
    let v = start.slice(), cur = pos(v);
    if (!cur) return null;
    const dist = (p) => Math.hypot(...p.map((t, i) => t - target[i]));
    for (let it = 0; it < 12; it++) {
      const r = cur.map((t, i) => t - target[i]);
      if (Math.hypot(...r) < 1e-4) break;
      const J = names.map((_, k) => { const h = 1e-4 * Math.max(1, Math.abs(v[k])), w = v.slice(); w[k] += h; const q = pos(w); return q ? q.map((t, i) => (t - cur[i]) / h) : r.map(() => 0); });
      const n = names.length, A = [], g = [];
      for (let a = 0; a < n; a++) { A.push([]); g.push(-J[a].reduce((s, t, i) => s + t * r[i], 0)); for (let b = 0; b < n; b++) A[a].push(J[a].reduce((s, t, i) => s + t * J[b][i], 0) + (a === b ? 1e-6 + 1e-3 * J[a].reduce((s, t) => s + t * t, 0) : 0)); }
      // giải hệ n × n (n ≤ 3)
      for (let c = 0; c < n; c++) { let p = c; for (let q = c + 1; q < n; q++) if (Math.abs(A[q][c]) > Math.abs(A[p][c])) p = q; [A[c], A[p]] = [A[p], A[c]]; [g[c], g[p]] = [g[p], g[c]]; if (Math.abs(A[c][c]) < 1e-12) return v; for (let q = c + 1; q < n; q++) { const f = A[q][c] / A[c][c]; for (let k = c; k < n; k++) A[q][k] -= f * A[c][k]; g[q] -= f * g[c]; } }
      const d = new Array(n).fill(0); for (let c = n - 1; c >= 0; c--) { let s2 = g[c]; for (let k = c + 1; k < n; k++) s2 -= A[c][k] * d[k]; d[c] = s2 / A[c][c]; }
      // bước lùi nếu không tốt hơn
      let step = 1, nv = null, np = null;
      for (let t = 0; t < 6; t++) { const w = v.map((x, i) => x + step * d[i]); const q = pos(w); if (q && dist(q) < dist(cur)) { nv = w; np = q; break; } step /= 2; }
      if (!nv) break;
      v = nv; cur = np;
    }
    return v;
  }`);
rep('src/app.js', "  function pointHandles(o, res) {\n    const fr = freePts(o), on = ptSel(o);",
  "  function pointHandles(o, res) {\n    const fr = freePts(o), pp = paramPts(o), on = ptSel(o);");
rep('src/app.js', "      return `<div class=\"pth${fr[n] ? ' drag' : ''}${k >= 0 ? ' on' : ''}\" data-pt=\"${n}\" style=\"left:${Math.round(p[0])}px;top:${Math.round(p[1])}px\" title=\"${n}${fr[n] ? ' — kéo để di chuyển' : ' — điểm dựng, nhấp để chọn'}\">${k >= 0 ? k + 1 : ''}</div>`;",
  "      return `<div class=\"pth${fr[n] ? ' drag' : pp[n] ? ' pdrag' : ''}${k >= 0 ? ' on' : ''}\" data-pt=\"${n}\" style=\"left:${Math.round(p[0])}px;top:${Math.round(p[1])}px\" title=\"${n}${fr[n] ? ' — kéo để di chuyển' : pp[n] ? ' — kéo để đổi thông số ' + pp[n].join(', ') : ' — điểm dựng, nhấp để chọn'}\">${k >= 0 ? k + 1 : ''}</div>`;");
// kéo: điểm tự do đổi toạ độ; điểm theo thông số đổi thông số
rep('src/app.js', "    const fr = freePts(o)[name], view = o._res && o._res.view;\n    const p0 = { x: e.clientX, y: e.clientY }, start = fr ? fr.v.slice() : null;\n    let moved = false;\n    if (fr && view) o._view = Object.assign({}, view);",
  "    const fr = freePts(o)[name], view = o._res && o._res.view;\n    const pnames = !fr ? paramPts(o)[name] : null, M = o.type === 'space' ? Space : Plane;\n    const pstart = pnames ? pnames.map((n) => (M.params(o.script).find((p) => p.name === n) || {}).value) : null;\n    const wstart = pnames ? (M.points(o.script)[name] || null) : null;\n    const p0 = { x: e.clientX, y: e.clientY }, start = fr ? fr.v.slice() : null;\n    let moved = false;\n    if ((fr || (pnames && wstart)) && view) o._view = Object.assign({}, view);");
rep('src/app.js', "      moved = true;\n      if (!fr || !view) return;\n      let d;",
  "      moved = true;\n      if (pnames && wstart && view) { dragParams(ev, dx, dy); return; }\n      if (!fr || !view) return;\n      let d;");
rep('src/app.js', "    const up = () => {\n      window.removeEventListener('pointermove', mv);\n      window.removeEventListener('pointerup', up);\n      delete o._view;\n      if (moved && fr) { renderObj(o); commit(); buildProps(); return; }",
  "    // kéo điểm theo thông số: vị trí đích (toạ độ trong) rồi giải ngược ra thông số\n    const dragParams = (ev, dx, dy) => {\n      let tgt;\n      if (view.dim === 2) tgt = [wstart[0] + dx / view.sc, wstart[1] - dy / view.sc];\n      else {\n        const [a, b, c] = view.axes;\n        let q;\n        if (ev.shiftKey) q = [0, 0, Math.abs(c[1]) > 1e-9 ? dy / c[1] : 0];\n        else { const det = a[0] * b[1] - a[1] * b[0]; q = Math.abs(det) < 1e-9 ? [0, 0, 0] : [(dx * b[1] - dy * b[0]) / det, (a[0] * dy - a[1] * dx) / det, 0]; }\n        tgt = wstart.map((t, i) => t + q[i]);\n      }\n      const v = solveParams(o, name, pnames, pstart, tgt);\n      if (!v) return;\n      const step = ev.ctrlKey ? 1 : 0.1;\n      let sc = o.script;\n      const shown = pnames.map((n, i) => { const x = Math.round(v[i] / step) * step, r = Math.round(x * 100) / 100; sc = M.setParam(sc, n, Object.is(r, -0) ? 0 : r); return n + ' = ' + String(r).replace('.', ','); });\n      o.script = sc; renderObj(o);\n      msg('Kéo ' + name + ': ' + shown.join('; ') + '  — giữ Ctrl để làm tròn số nguyên');\n    };\n    const up = () => {\n      window.removeEventListener('pointermove', mv);\n      window.removeEventListener('pointerup', up);\n      delete o._view;\n      if (moved && (fr || pnames)) { renderObj(o); commit(); buildProps(); return; }");
const css = R('src/styles.css');
if (!fs.readFileSync(css, 'utf8').includes('.pth.pdrag')) fs.appendFileSync(css, '.pth.pdrag { background: #2e8b57; border-color: #2e8b57; cursor: move; }\n');
console.log('xong');
