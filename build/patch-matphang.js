// Bản vá: xoay hình không gian bằng chuột; chọn mặt phẳng trên hình và dựng nhanh với mặt phẳng.
//   node build/patch-matphang.js
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

// ---------- space.js: trả vị trí tên mặt phẳng để chọn ----------
rep('src/space.js', "    cmds.forEach((c) => {\n      if (c.k === 'plane') {\n        const pl = PL[c.p], pc = pl.color || col;",
  "    const planeAt = {}; // vị trí tên mặt phẳng trên hình (để nhấp chọn mặt phẳng)\n    cmds.forEach((c) => {\n      if (c.k === 'plane') {\n        const pl = PL[c.p], pc = pl.color || col;");
rep('src/space.js', "        if (pl.corner !== -2) {\n          const cn = S[k],",
  "        planeAt[pl.name] = [S.reduce((t, p) => t + p[0], 0) / S.length, S.reduce((t, p) => t + p[1], 0) / S.length];\n        if (pl.corner !== -2) {\n          const cn = S[k],");
rep('src/space.js', "          labels.push({ x: cn[0] + Math.cos(mid) * 27, y: cn[1] + Math.sin(mid) * 27, tex: pl.label || texName(pl.name), size: 16, color: o.pcolor || lcol });",
  "          labels.push({ x: cn[0] + Math.cos(mid) * 27, y: cn[1] + Math.sin(mid) * 27, tex: pl.label || texName(pl.name), size: 16, color: o.pcolor || lcol });\n          planeAt[pl.name] = [cn[0] + Math.cos(mid) * 27, cn[1] + Math.sin(mid) * 27];");
rep('src/space.js', ", labels, errors, pts: S, view: { sc, cx: vx, cy: vy, dim: 3, axes, oxyz } };",
  ", labels, errors, pts: S, planes: planeAt, view: { sc, cx: vx, cy: vy, dim: 3, axes, oxyz } };");

// ---------- app.js ----------
// nút chọn mặt phẳng và nút xoay
rep('src/app.js', "        if (res.pts && (o.type === 'plane' || o.type === 'space')) { o._res = res; html += pointHandles(o, res); }",
  "        if (res.pts && (o.type === 'plane' || o.type === 'space')) { o._res = res; html += pointHandles(o, res); }\n        if (res.planes) { const on = plSel(o); html += Object.keys(res.planes).map((n) => `<div class=\"plh${on.includes(n) ? ' on' : ''}\" data-pl=\"${esc(n)}\" style=\"left:${Math.round(res.planes[n][0])}px;top:${Math.round(res.planes[n][1])}px\" title=\"Mặt phẳng ${esc(n)} — nhấp để chọn (dựng nhanh)\"></div>`).join(''); }\n        if (o.type === 'space' || o.type === 'solid') html += '<div class=\"roth\" title=\"Kéo để xoay hình (nhấp đúp: về góc nhìn SGK)\">⟳</div>';");
rep('src/app.js', "  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);",
  "  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);\n  const plSel = (o) => (S.ptSel && S.ptSel.id === o.id ? (S.ptSel.planes || []) : []);\n  function togglePlane(o, n) {\n    if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [], planes: [] };\n    const a = S.ptSel.planes || (S.ptSel.planes = []), k = a.indexOf(n);\n    if (k >= 0) a.splice(k, 1); else a.push(n);\n    renderObj(o); buildProps();\n  }\n  // xoay hình không gian bằng chuột: kéo ngang đổi góc xoay, kéo dọc đổi góc nhìn từ trên\n  function rotateDrag(e, o) {\n    const p0 = { x: e.clientX, y: e.clientY };\n    if (o.type === 'space' && o.proj !== 'xoay') { o.proj = 'xoay'; o.yaw = -25; o.pitch = 20; }\n    const y0 = parseFloat(o.yaw) || 0, q0 = isFinite(parseFloat(o.pitch)) ? parseFloat(o.pitch) : 20;\n    let moved = false;\n    const mv = (ev) => {\n      const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;\n      if (!moved && Math.hypot(dx, dy) < 2) return;\n      moved = true;\n      o.yaw = Math.round(y0 - dx * 0.6); o.pitch = Math.round(Math.max(-85, Math.min(85, q0 + dy * 0.5)));\n      renderObj(o); msg('Xoay ngang ' + o.yaw + '°, nhìn từ trên ' + o.pitch + '° — nhấp đúp nút ⟳ để về góc nhìn SGK');\n    };\n    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (moved) { commit(); buildProps(); } };\n    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);\n    e.preventDefault(); e.stopPropagation();\n  }");
rep('src/app.js', "        if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [] };",
  "        if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [], planes: [] };");
rep('src/app.js', "    if (e.target.classList.contains('pth') && !many()) return pointDrag(e, o, el, e.target.dataset.pt);",
  "    if (e.target.classList.contains('pth') && !many()) return pointDrag(e, o, el, e.target.dataset.pt);\n    if (e.target.classList.contains('roth') && !many()) return rotateDrag(e, o);\n    if (e.target.classList.contains('plh') && !many()) { e.preventDefault(); return togglePlane(o, e.target.dataset.pl); }");
// nhấp đúp nút xoay: về góc nhìn SGK
rep('src/app.js', "  page.addEventListener('dblclick', (e) => {\n    const el = e.target.closest('.obj');",
  "  page.addEventListener('dblclick', (e) => {\n    if (e.target.classList.contains('roth')) { const ob = get(e.target.closest('.obj').dataset.id); if (ob.type === 'space') Object.assign(ob, Space.viewOf(ob.kind)); else { ob.yaw = 25; ob.pitch = 18; } renderObj(ob); commit(); buildProps(); msg('Đã về góc nhìn mặc định'); return; }\n    const el = e.target.closest('.obj');");
// dựng nhanh với mặt phẳng
rep('src/app.js', "      const sel = ptSel(o), N = sel.length, Q = (t) => t;",
  "      const sel = ptSel(o), N = sel.length, Q = (t) => t, PLS = dim === 3 ? plSel(o) : [], NP = PLS.length;");
rep('src/app.js', "      help(N ? 'Đã chọn: <b>' + sel.join(', ') + '</b> (theo thứ tự nhấp)' :",
  "      help(N || NP ? 'Đã chọn: <b>' + sel.join(', ') + '</b>' + (NP ? (N ? '; ' : '') + 'mặt phẳng <b>' + PLS.join(', ') + '</b>' : '') + ' (theo thứ tự nhấp)' :");
rep('src/app.js', "      if (dim === 2) B('Độ dài', 2, 'Ghi độ dài thật của đoạn', (a) => ['ghi ' + P(a) + ' = ?']);",
  `      if (dim === 2) B('Độ dài', 2, 'Ghi độ dài thật của đoạn', (a) => ['ghi ' + P(a) + ' = ?']);
      if (dim === 3) {
        // các thao tác với mặt phẳng: nhấp vào ô vuông nhỏ ở tên mặt phẳng để chọn
        const pl = PLS[0], need = (np, f) => () => NP === np && f(N);
        const freshParam = (base) => { const used = new Set(Space.params(o.script).map((p) => p.name)); for (let i = 1; ; i++) if (!used.has(base + i)) return base + i; };
        B('Giao với mặt phẳng', need(1, (n) => n === 2), 'Giao điểm của đường thẳng (2 điểm) với mặt phẳng đã chọn', (a) => { const n = freshName(o, 'I'); return [n + ' = giao(' + a[0] + ', ' + a[1] + ', ' + pl + ')', 'duongthang ' + P(a), 'diem ' + n]; });
        B('Hình chiếu lên mặt phẳng', need(1, (n) => n === 1), 'Hình chiếu vuông góc của điểm lên mặt phẳng đã chọn', (a) => { const n = freshName(o, 'H'); return [n + ' = chanmp(' + a[0] + ', ' + pl + ')', 'doan ' + a[0] + n, 'diem ' + n]; });
        B('Vuông góc với mặt phẳng', need(1, (n) => n === 1), 'Dựng đoạn vuông góc với mặt phẳng tại điểm đã chọn (điểm nằm trên mặt phẳng), dài 3', (a) => { const n = freshName(o, 'T'), h = freshParam('h'); return [h + ' = 3   # Độ dài ' + a[0] + n, n + ' = vuonggoc(' + a[0] + ', ' + pl + ', ' + h + ')', 'doan ' + a[0] + n]; });
        B('Đối xứng qua mặt phẳng', need(1, (n) => n === 1), 'Điểm đối xứng với điểm đã chọn qua mặt phẳng', (a) => { const n = freshName(o, 'K'); return [n + ' = doixungmp(' + a[0] + ', ' + pl + ')', 'netdut ' + a[0] + n, 'diem ' + n]; });
        B('Điểm trên mặt phẳng', need(1, (n) => n === 0), 'Thêm một điểm luôn nằm trên mặt phẳng đã chọn (kéo chấm xanh lá để di chuyển trên mặt phẳng)', () => { const n = freshName(o, 'M'), u = freshParam('u'), v = freshParam('v'); return [u + ' = 0.5   # Vị trí ' + n + ' trên (' + pl + ') theo chiều thứ nhất', v + ' = 0.5   # Vị trí ' + n + ' trên (' + pl + ') theo chiều thứ hai', n + ' = trenmp(' + pl + ', ' + u + ', ' + v + ')', 'diem ' + n]; });
        B('Mặt phẳng qua 3 điểm', need(0, (n) => n === 3), 'Vẽ mặt phẳng (tam giác) qua 3 điểm đã chọn', (a) => { const used = new Set(String(o.script).split('\\n').map((l) => (l.trim().match(/^mp\\s+([^\\s:]+)/) || [])[1]).filter(Boolean)); const nm = ['Q', 'R', 'alpha', 'beta', 'P1', 'P2'].find((x) => !used.has(x)) || 'P' + used.size; return ['mp ' + nm + ': ' + a.join(' ')]; });
      }`);
const css = R('src/styles.css');
if (!fs.readFileSync(css, 'utf8').includes('.plh')) fs.appendFileSync(css, `
/* chọn mặt phẳng, nút xoay hình không gian */
.plh { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border: 1.5px solid #8e44ad; background: rgba(255,255,255,.8); border-radius: 2px; cursor: pointer; display: none; z-index: 2; }
.plh.on { background: #8e44ad; }
.obj.sel .plh { display: block; }
.roth { position: absolute; right: -9px; top: -9px; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 1.5px solid #1f5fbf; color: #1f5fbf; font: 700 13px/18px 'Segoe UI', sans-serif; text-align: center; cursor: grab; display: none; z-index: 3; }
.obj.sel .roth { display: block; }
.obj.msel .plh, .obj.msel .roth, body.capturing .plh, body.capturing .roth { display: none !important; }
@media print { .plh, .roth { display: none !important; } }
`);
console.log('xong');
