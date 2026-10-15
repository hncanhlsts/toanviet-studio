// Kéo điểm (toạ độ, thông số), chọn điểm / mặt phẳng, xoay hình không gian — tách từ app.js; nhận các hàm, biến dùng chung qua đối số C.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.keodiem = function (C) {
    const { $, S, msg, cur, commit, title, renderObj, buildProps } = C;
  // ---------- Kéo điểm và dựng nhanh (hình phẳng, hình không gian) ----------
  const PT_RE = /^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?)\s*)?\)\s*(#.*)?$/;
  // các điểm cho bằng toạ độ số trong kịch bản: kéo được
  function freePts(o) {
    const out = {}, dim = o.type === 'space' ? 3 : 2;
    String(o.script || '').split('\n').forEach((ln, i) => { const m = ln.trim().match(PT_RE); if (m && (dim === 3) === (m[4] !== undefined)) out[m[1]] = { i, v: [m[2], m[3], m[4]].filter((x) => x !== undefined).map(Number), cm: m[5] || '' }; });
    return out;
  }
  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);
  const plSel = (o) => (S.ptSel && S.ptSel.id === o.id ? (S.ptSel.planes || []) : []);
  function togglePlane(o, n) {
    if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [], planes: [] };
    const a = S.ptSel.planes || (S.ptSel.planes = []), k = a.indexOf(n);
    if (k >= 0) a.splice(k, 1); else a.push(n);
    renderObj(o); buildProps();
  }
  // xoay hình không gian bằng chuột: kéo ngang đổi góc xoay, kéo dọc đổi góc nhìn từ trên
  function rotateDrag(e, o) {
    const p0 = { x: e.clientX, y: e.clientY };
    if (o.type === 'space' && o.proj !== 'xoay') { o.proj = 'xoay'; o.yaw = -25; o.pitch = 20; }
    const y0 = parseFloat(o.yaw) || 0, q0 = isFinite(parseFloat(o.pitch)) ? parseFloat(o.pitch) : 20;
    let moved = false;
    const mv = (ev) => {
      const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      moved = true;
      o.yaw = Math.round(y0 - dx * 0.6); o.pitch = Math.round(Math.max(-85, Math.min(85, q0 + dy * 0.5)));
      renderObj(o); msg('Xoay ngang ' + o.yaw + '°, nhìn từ trên ' + o.pitch + '° — nhấp đúp nút ⟳ để về góc nhìn SGK');
    };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (moved) { commit(); buildProps(); } };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    e.preventDefault(); e.stopPropagation();
  }
  // điểm tính từ thông số: các thông số xuất hiện trên dòng định nghĩa điểm
  function paramPts(o) {
    const M = o.type === 'space' ? Space : Plane, ps = M.params(o.script).map((p) => p.name), out = {};
    if (!ps.length) return out;
    String(o.script || '').split('\n').forEach((ln) => {
      const m = ln.replace(/#.*$/, '').trim().match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*(.+)$/);
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
  }
  function pointHandles(o, res) {
    const fr = freePts(o), pp = paramPts(o), on = ptSel(o);
    return Object.keys(res.pts).map((n) => {
      const p = res.pts[n], k = on.indexOf(n);
      return `<div class="pth${fr[n] ? ' drag' : pp[n] ? ' pdrag' : ''}${k >= 0 ? ' on' : ''}" data-pt="${n}" style="left:${Math.round(p[0])}px;top:${Math.round(p[1])}px" title="${n}${fr[n] ? ' — kéo để di chuyển' : pp[n] ? ' — kéo để đổi thông số ' + pp[n].join(', ') : ' — điểm dựng, nhấp để chọn'}">${k >= 0 ? k + 1 : ''}</div>`;
    }).join('');
  }
  function usedNames(o) { const u = new Set(); String(o.script || '').split('\n').forEach((ln) => { const m = ln.trim().match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=/); if (m) u.add(m[1]); }); return u; }
  function freshName(o, pref) {
    const u = usedNames(o);
    for (const c of (pref || '') + 'MNPQHKIEFGTUVXYZRJL') if (!u.has(c)) return c;
    for (let i = 1; ; i++) if (!u.has((pref || 'M') + i)) return (pref || 'M') + i;
  }
  function pointDrag(e, o, el, name) {
    const fr = freePts(o)[name], view = o._res && o._res.view;
    const pnames = !fr ? paramPts(o)[name] : null, M = o.type === 'space' ? Space : Plane;
    const pstart = pnames ? pnames.map((n) => (M.params(o.script).find((p) => p.name === n) || {}).value) : null;
    const wstart = pnames ? (M.points(o.script)[name] || null) : null;
    const p0 = { x: e.clientX, y: e.clientY }, start = fr ? fr.v.slice() : null;
    let moved = false;
    if ((fr || (pnames && wstart)) && view) o._view = Object.assign({}, view);
    const fmt = (v) => { const r = Math.round(v * 100) / 100; return String(Object.is(r, -0) ? 0 : r); };
    const mv = (ev) => {
      const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (pnames && wstart && view) { dragParams(ev, dx, dy); return; }
      if (!fr || !view) return;
      let d;
      if (view.dim === 2) d = [dx / view.sc, -dy / view.sc];
      else {
        const [a, b, c] = view.axes;
        let q;
        if (ev.shiftKey) q = [0, 0, Math.abs(c[1]) > 1e-9 ? dy / c[1] : 0]; // giữ Shift: kéo lên xuống theo trục đứng
        else { const det = a[0] * b[1] - a[1] * b[0]; q = Math.abs(det) < 1e-9 ? [0, 0, 0] : [(dx * b[1] - dy * b[0]) / det, (a[0] * dy - a[1] * dx) / det, 0]; }
        d = view.oxyz ? [-q[1], q[0], q[2]] : q;
      }
      const step = ev.ctrlKey ? 1 : 0.1;
      const nv = start.map((v, k) => Math.round((v + d[k]) / step) * step);
      const L = String(o.script).split('\n');
      L[fr.i] = name + ' = (' + nv.map(fmt).join(', ') + ')' + (fr.cm ? '   ' + fr.cm : '');
      o.script = L.join('\n');
      renderObj(o);
      msg(name + ' = (' + nv.map(fmt).join('; ') + ')' + (view.dim === 3 ? '  — giữ Shift để kéo theo chiều cao' : '') + '  — giữ Ctrl để làm tròn số nguyên');
    };
    // kéo điểm theo thông số: vị trí đích (toạ độ trong) rồi giải ngược ra thông số
    const dragParams = (ev, dx, dy) => {
      let tgt;
      if (view.dim === 2) tgt = [wstart[0] + dx / view.sc, wstart[1] - dy / view.sc];
      else {
        const [a, b, c] = view.axes;
        let q;
        if (ev.shiftKey) q = [0, 0, Math.abs(c[1]) > 1e-9 ? dy / c[1] : 0];
        else { const det = a[0] * b[1] - a[1] * b[0]; q = Math.abs(det) < 1e-9 ? [0, 0, 0] : [(dx * b[1] - dy * b[0]) / det, (a[0] * dy - a[1] * dx) / det, 0]; }
        tgt = wstart.map((t, i) => t + q[i]);
      }
      const v = solveParams(o, name, pnames, pstart, tgt);
      if (!v) return;
      const step = ev.ctrlKey ? 1 : 0.1;
      let sc = o.script;
      const shown = pnames.map((n, i) => { const x = Math.round(v[i] / step) * step, r = Math.round(x * 100) / 100; sc = M.setParam(sc, n, Object.is(r, -0) ? 0 : r); return n + ' = ' + String(r).replace('.', ','); });
      o.script = sc; renderObj(o);
      msg('Kéo ' + name + ': ' + shown.join('; ') + '  — giữ Ctrl để làm tròn số nguyên');
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      delete o._view;
      if (moved && (fr || pnames)) { renderObj(o); commit(); buildProps(); return; }
      if (!moved) { // nhấp: chọn / bỏ chọn điểm để dựng nhanh
        if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [], planes: [] };
        const k = S.ptSel.names.indexOf(name);
        if (k >= 0) S.ptSel.names.splice(k, 1); else S.ptSel.names.push(name);
        renderObj(o); buildProps();
      }
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    e.preventDefault(); e.stopPropagation();
  }
    return { ptSel, plSel, togglePlane, rotateDrag, pointHandles, freshName, pointDrag };
  };
})(window);
