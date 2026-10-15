// Bản vá: chọn nhiều đối tượng, kéo cùng lúc, khung chọn, bắt dính, nhóm, căn thẳng hàng, chia đều.
//   node build/patch-chonnhieu.js
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'src', 'app.js');
let s = fs.readFileSync(F, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('không thấy mốc: ' + a.slice(0, 80)); s = s.replace(a, () => b); };
const between = (a, b, text) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('không thấy đoạn: ' + a.slice(0, 60)); s = s.slice(0, i) + text + s.slice(j); };
if (s.includes('function setSel(')) { console.log('đã vá rồi'); process.exit(0); }

rep('const S = { objs: [], sel: null,', 'const S = { objs: [], sel: null, multi: [],');
rep('    S.sel = null; S.file = file || null;', '    S.sel = null; S.multi = []; S.file = file || null;');
rep('    if (!cur()) S.sel = null;\n    S.dirty = true;\n    renderAll(); buildProps(); title();',
  '    S.multi = S.multi.filter((id) => get(id));\n    if (!cur()) S.sel = S.multi[S.multi.length - 1] || null;\n    S.dirty = true;\n    renderAll(); buildProps(); title();');

// ---------- trạng thái chọn ----------
rep('  function renderAll() {', `  // ---------- Chọn nhiều đối tượng, nhóm ----------
  const isSel = (id) => S.multi.includes(id);
  const selObjs = () => S.multi.map(get).filter(Boolean);
  const many = () => S.multi.length > 1;
  const cleanObj = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : v)));
  function paintSel() {
    const m = many();
    page.querySelectorAll('.obj').forEach((el) => { const on = isSel(el.dataset.id); el.classList.toggle('sel', on); el.classList.toggle('msel', on && m); });
  }
  // nhấp vào một đối tượng trong nhóm là chọn cả nhóm
  const groupOf = (id) => { const o = get(id); return o && o.grp ? S.objs.filter((x) => x.grp === o.grp).map((x) => x.id) : [id]; };
  function setSel(ids, primary) {
    const uniq = [...new Set(ids)].filter((id) => get(id));
    if (S.ptSel && !uniq.includes(S.ptSel.id)) { const old = get(S.ptSel.id); S.ptSel = null; if (old) renderObj(old); }
    S.multi = uniq;
    S.sel = uniq.length ? (primary && uniq.includes(primary) ? primary : uniq[uniq.length - 1]) : null;
    paintSel(); buildProps();
  }
  function toggleSel(id) { const g = groupOf(id), on = g.every(isSel); setSel(on ? S.multi.filter((x) => !g.includes(x)) : S.multi.concat(g), on ? null : id); }
  const elOf = (id) => page.querySelector('[data-id="' + id + '"]');
  const boxOf = (o) => { const el = elOf(o.id); return { x: o.x, y: o.y, w: el ? el.offsetWidth : 0, h: el ? el.offsetHeight : 0 }; };
  // nhóm đang chọn thành một đối tượng "group" (toạ độ tính từ góc trên trái của nhóm)
  function groupData() {
    const os = selObjs().map(cleanObj), x0 = Math.min(...os.map((o) => o.x)), y0 = Math.min(...os.map((o) => o.y));
    os.forEach((o) => { o.x -= x0; o.y -= y0; delete o.id; delete o.grp; });
    return { type: 'group', objs: os };
  }
  function pasteGroup(g, x, y) {
    const gid = 'g' + Date.now().toString(36);
    const ids = g.objs.map((o0) => { const o = JSON.parse(JSON.stringify(o0)); o.id = 'o' + S.seq++; o.x += x; o.y += y; o.grp = gid; S.objs.push(o); renderObj(o); return o.id; });
    setSel(ids); commit();
  }
  // dán / nhân bản nhiều đối tượng: giữ nguyên các nhóm (đổi sang mã nhóm mới)
  function pasteMany(list) {
    const remap = {};
    const ids = list.map((o0) => { const o = JSON.parse(JSON.stringify(o0)); o.id = 'o' + S.seq++; o.x += 20; o.y += 20; if (o.grp) o.grp = remap[o.grp] || (remap[o.grp] = 'g' + Date.now().toString(36) + Object.keys(remap).length); S.objs.push(o); renderObj(o); return o.id; });
    setSel(ids); commit();
  }
  function alignSel(kind) {
    const bs = selObjs().map((o) => ({ o, b: boxOf(o) }));
    if (bs.length < 2) return;
    const L = Math.min(...bs.map((t) => t.b.x)), R = Math.max(...bs.map((t) => t.b.x + t.b.w)), T = Math.min(...bs.map((t) => t.b.y)), B = Math.max(...bs.map((t) => t.b.y + t.b.h));
    if (kind === 'left') bs.forEach((t) => { t.o.x = L; });
    if (kind === 'hcenter') bs.forEach((t) => { t.o.x = Math.round((L + R) / 2 - t.b.w / 2); });
    if (kind === 'right') bs.forEach((t) => { t.o.x = R - t.b.w; });
    if (kind === 'top') bs.forEach((t) => { t.o.y = T; });
    if (kind === 'vcenter') bs.forEach((t) => { t.o.y = Math.round((T + B) / 2 - t.b.h / 2); });
    if (kind === 'bottom') bs.forEach((t) => { t.o.y = B - t.b.h; });
    if (kind === 'hdist' || kind === 'vdist') {
      if (bs.length < 3) return msg('Chia đều cần từ ba đối tượng trở lên', true);
      const hz = kind === 'hdist', key = hz ? 'x' : 'y', sz = hz ? 'w' : 'h';
      bs.sort((p, q) => p.b[key] - q.b[key]);
      const total = bs.reduce((t, x) => t + x.b[sz], 0), span = (hz ? R - L : B - T), gap = (span - total) / (bs.length - 1);
      let pos = hz ? L : T;
      bs.forEach((t) => { t.o[key] = Math.round(pos); pos += t.b[sz] + gap; });
    }
    if (kind === 'pcenter') { const cx = 397 - (L + R) / 2; bs.forEach((t) => { t.o.x = Math.round(t.o.x + cx); }); }
    bs.forEach((t) => renderObj(t.o)); paintSel(); commit();
  }
  function multiProps() {
    const n = S.multi.length, grouped = selObjs().some((o) => o.grp);
    const mk = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html !== undefined) el.innerHTML = html; return el; };
    props.appendChild(mk('h4', '', 'Đã chọn ' + n + ' đối tượng'));
    props.appendChild(mk('div', 'help', 'Kéo một đối tượng để di chuyển cả nhóm chọn (giữ Alt để tắt bắt dính). Shift + nhấp để thêm / bớt; kéo trên vùng trống để chọn bằng khung; Ctrl+A chọn tất cả.'));
    const grp = (title, items) => {
      props.appendChild(mk('h4', '', title));
      const box = mk('div'); box.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px';
      items.forEach(([label, tip, fn, off]) => { const b = mk('button', '', label); b.title = tip; b.style.cssText = 'width:auto;padding:4px 9px;margin:0'; b.disabled = !!off; b.onclick = fn; box.appendChild(b); });
      props.appendChild(box);
    };
    grp('Căn thẳng hàng', [
      ['⇤ Trái', 'Căn mép trái', () => alignSel('left')], ['↔ Giữa', 'Căn giữa theo chiều ngang', () => alignSel('hcenter')], ['⇥ Phải', 'Căn mép phải', () => alignSel('right')],
      ['⤒ Trên', 'Căn mép trên', () => alignSel('top')], ['↕ Giữa', 'Căn giữa theo chiều dọc', () => alignSel('vcenter')], ['⤓ Dưới', 'Căn mép dưới', () => alignSel('bottom')],
    ]);
    grp('Chia đều, đặt giữa trang', [
      ['Chia đều ngang', 'Khoảng cách ngang giữa các đối tượng bằng nhau (từ 3 đối tượng)', () => alignSel('hdist'), n < 3],
      ['Chia đều dọc', 'Khoảng cách dọc giữa các đối tượng bằng nhau (từ 3 đối tượng)', () => alignSel('vdist'), n < 3],
      ['Giữa trang', 'Đưa cả vùng chọn vào giữa trang theo chiều ngang', () => alignSel('pcenter')],
    ]);
    grp('Nhóm', [
      ['Nhóm (Ctrl+G)', 'Gộp thành một nhóm: nhấp một đối tượng là chọn cả nhóm, chèn vào Word thành một hình', () => run('group')],
      ['Bỏ nhóm (Ctrl+Shift+G)', 'Tách nhóm thành các đối tượng riêng', () => run('ungroup'), !grouped],
      ['Lưu vào thư viện', 'Lưu cả vùng chọn thành một mục trong Thư viện', () => run('lib')],
      ['Xoá', 'Xoá các đối tượng đang chọn (Delete)', () => run('del')],
    ]);
  }
  // khung chọn: kéo trên vùng trống của trang
  function rubberBand(e) {
    const p0 = pagePt(e), add = e.shiftKey || e.ctrlKey, before = add ? S.multi.slice() : [];
    const band = document.createElement('div'); band.className = 'rband'; page.appendChild(band);
    let moved = false, rect = null;
    const mv = (ev) => {
      const p = pagePt(ev);
      if (!moved && Math.hypot(p.x - p0.x, p.y - p0.y) < 4) return;
      moved = true;
      rect = { x: Math.min(p.x, p0.x), y: Math.min(p.y, p0.y), w: Math.abs(p.x - p0.x), h: Math.abs(p.y - p0.y) };
      band.style.cssText = 'left:' + rect.x + 'px;top:' + rect.y + 'px;width:' + rect.w + 'px;height:' + rect.h + 'px';
    };
    const up = () => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); band.remove();
      if (!moved) { if (!add) setSel([]); return; }
      const hit = S.objs.filter((o) => { const b = boxOf(o); return b.x < rect.x + rect.w && b.x + b.w > rect.x && b.y < rect.y + rect.h && b.y + b.h > rect.y; });
      setSel(before.concat(...hit.map((o) => groupOf(o.id))));
      if (S.multi.length) msg('Đã chọn ' + S.multi.length + ' đối tượng');
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    e.preventDefault();
  }
  // đường dóng khi kéo: bắt dính vào mép / tâm các đối tượng khác và giữa trang
  function snapper(moving) {
    const ex = new Set(moving.map((t) => t.o.id)), xs = [397], ys = [];
    S.objs.forEach((o) => { if (ex.has(o.id)) return; const b = boxOf(o); xs.push(b.x, b.x + b.w / 2, b.x + b.w); ys.push(b.y, b.y + b.h / 2, b.y + b.h); });
    const L = Math.min(...moving.map((t) => t.sx)), R = Math.max(...moving.map((t) => t.sx + t.b.w)), T = Math.min(...moving.map((t) => t.sy)), B = Math.max(...moving.map((t) => t.sy + t.b.h));
    const guides = [];
    const clear = () => { guides.forEach((g) => g.remove()); guides.length = 0; };
    const line = (v, vert) => { const g = document.createElement('div'); g.className = 'guide ' + (vert ? 'gv' : 'gh'); g.style[vert ? 'left' : 'top'] = v + 'px'; page.appendChild(g); guides.push(g); };
    const best = (edges, lines, d) => { let r = null; edges.forEach((e0) => lines.forEach((l) => { const off = l - (e0 + d); if (Math.abs(off) <= 6 / S.zoom && (!r || Math.abs(off) < Math.abs(r.off))) r = { off, at: l }; })); return r; };
    return {
      snap(dx, dy, off) {
        clear();
        if (off) return [dx, dy];
        const bx = best([L, (L + R) / 2, R], xs, dx), by = best([T, (T + B) / 2, B], ys, dy);
        if (bx) { dx += bx.off; line(bx.at, true); }
        if (by) { dy += by.off; line(by.at, false); }
        return [dx, dy];
      },
      clear,
    };
  }
  function renderAll() {`);

rep(`  function select(id) {
    if (S.sel === id) return;
    if (S.ptSel && S.ptSel.id !== id) { const old = get(S.ptSel.id); S.ptSel = null; if (old) renderObj(old); }
    S.sel = id;
    page.querySelectorAll('.obj').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
    buildProps();
  }`, `  function select(id) {
    const g = id ? groupOf(id) : [];
    if (S.sel === id && S.multi.length === g.length && g.every(isSel)) return;
    setSel(g, id);
  }`);
rep("    el.className = 'obj ' + o.type + (S.sel === o.id ? ' sel' : '');", "    el.className = 'obj ' + o.type + (isSel(o.id) ? ' sel' + (many() ? ' msel' : '') : '');");
rep("  function buildProps() {\n    const o = cur();\n    props.innerHTML = '';\n", "  function buildProps() {\n    const o = cur();\n    props.innerHTML = '';\n    if (many()) return multiProps();\n");

// ---------- chuột trên trang ----------
between("  page.addEventListener('pointerdown', (e) => {", "  page.addEventListener('dblclick', (e) => {", `  page.addEventListener('pointerdown', (e) => {
    if (S.placing) { e.preventDefault(); e.stopPropagation(); if (document.activeElement) document.activeElement.blur(); newTextAt(pagePt(e)); return; }
    const el = e.target.closest('.obj');
    if (!el) { if (document.activeElement) document.activeElement.blur(); rubberBand(e); return; }
    if (el.classList.contains('editing')) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    const o = get(el.dataset.id);
    const mod = e.shiftKey || e.ctrlKey, wasIn = isSel(o.id) && many();
    if (mod) { toggleSel(o.id); if (!isSel(o.id)) return; } else if (!isSel(o.id)) select(o.id);
    if (e.target.classList.contains('pth') && !many()) return pointDrag(e, o, el, e.target.dataset.pt);
    const resizing = e.target.classList.contains('handle') && !many();
    const p0 = { x: e.clientX, y: e.clientY }, st = { x: o.x, y: o.y, w: o.w, h: o.h, size: o.size, bw: el.offsetWidth };
    const moving = selObjs().map((x) => ({ o: x, sx: x.x, sy: x.y, b: boxOf(x), el: elOf(x.id) }));
    const sn = resizing ? null : snapper(moving);
    let moved = false;
    const mv = (ev) => {
      let dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (!resizing) {
        [dx, dy] = sn.snap(dx, dy, ev.altKey);
        moving.forEach((t) => { t.o.x = Math.round(t.sx + dx); t.o.y = Math.round(t.sy + dy); if (t.el) { t.el.style.left = t.o.x + 'px'; t.el.style.top = t.o.y + 'px'; } });
        return;
      }
      if (o.type === 'formula') o.size = Math.max(8, Math.min(96, Math.round(st.size * (st.bw + dx) / st.bw)));
      else if (o.type === 'text') o.w = Math.max(60, Math.round(st.w + dx));
      else {
        o.w = Math.max(o.type === 'shape' ? 4 : 80, Math.round(st.w + dx));
        o.h = Math.max(o.type === 'shape' ? 2 : 50, Math.round(st.h + dy));
      }
      renderObj(o);
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      if (sn) sn.clear();
      if (moved) { commit(); buildProps(); return; }
      if (wasIn && !mod) select(o.id); // nhấp (không kéo) vào một đối tượng trong vùng chọn: chỉ chọn nó (hoặc nhóm của nó)
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  });
`);

// ---------- lệnh ----------
rep("    del: () => { if (!cur()) return; S.objs = S.objs.filter((o) => o.id !== S.sel); S.sel = null; renderAll(); buildProps(); commit(); },\n    dup: () => { const o = cur(); if (!o) return; paste(JSON.parse(JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : v)))); },\n    front: () => { const o = cur(); if (!o) return; S.objs = S.objs.filter((t) => t !== o).concat([o]); renderAll(); commit(); },\n    back: () => { const o = cur(); if (!o) return; S.objs = [o].concat(S.objs.filter((t) => t !== o)); renderAll(); commit(); },",
  "    del: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = S.objs.filter((o) => !ids.has(o.id)); S.sel = null; S.multi = []; renderAll(); buildProps(); commit(); },\n    dup: () => { if (!S.multi.length) return; pasteMany(selObjs().map(cleanObj)); },\n    front: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = S.objs.filter((t) => !ids.has(t.id)).concat(selObjs()); renderAll(); commit(); },\n    back: () => { if (!S.multi.length) return; const ids = new Set(S.multi); S.objs = selObjs().concat(S.objs.filter((t) => !ids.has(t.id))); renderAll(); commit(); },\n    selall: () => { setSel(S.objs.map((o) => o.id)); msg('Đã chọn tất cả ' + S.multi.length + ' đối tượng'); },\n    group: () => { if (!many()) return msg('Chọn từ hai đối tượng trở lên để nhóm (Shift + nhấp hoặc kéo khung chọn)', true); const g = 'g' + Date.now().toString(36); selObjs().forEach((o) => { o.grp = g; }); commit(); buildProps(); msg('Đã nhóm ' + S.multi.length + ' đối tượng — nhấp một đối tượng là chọn cả nhóm'); },\n    ungroup: () => { const os = selObjs().filter((o) => o.grp); if (!os.length) return msg('Vùng chọn không có nhóm nào', true); os.forEach((o) => { delete o.grp; }); commit(); buildProps(); msg('Đã bỏ nhóm'); },");
rep("      if (!cur()) return msg('Hãy chọn một đối tượng để sao chép', true);\n      if (!api) return;\n      try { await api.capture({ target: S.sel, mode: 'clipboard' });",
  "      if (!cur()) return msg('Hãy chọn một đối tượng để sao chép', true);\n      if (!api) return;\n      try { await api.capture({ target: many() ? 'sel:' + S.multi.join(',') : S.sel, mode: 'clipboard' });");
rep("const f = await api.capture({ target: S.sel || 'page', mode: 'file', name: S.sel ? 'hinh' : 'trang' });",
  "const f = await api.capture({ target: many() ? 'sel:' + S.multi.join(',') : S.sel || 'page', mode: 'file', name: S.sel ? 'hinh' : 'trang' });");
// chèn vào Word / PowerPoint: nhiều đối tượng thành một hình, lấy về sửa thì tách lại
rep("    const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));",
  "    const bytes = new TextEncoder().encode(many() ? JSON.stringify(groupData()) : JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));");
rep("    const asEq = app === 'word' && o.type === 'formula' && eqMode();", "    const asEq = app === 'word' && o.type === 'formula' && !many() && eqMode();");
rep("      : await api.office({ action: 'insert', app, target: o.id, data: btoa(bin),", "      : await api.office({ action: 'insert', app, target: many() ? 'sel:' + S.multi.join(',') : o.id, data: btoa(bin),");
rep("        o.x = 60; o.y = Math.round(50 + stage.scrollTop / S.zoom);\n        paste(o);", "        o.x = 60; o.y = Math.round(50 + stage.scrollTop / S.zoom);\n        if (o.type === 'group') { pasteGroup(o, 60, o.y); return msg('Đã lấy nhóm ' + o.objs.length + ' đối tượng từ ' + r.from); }\n        paste(o);");
rep("          o.x = 60; o.y = 50;\n          paste(o);", "          o.x = 60; o.y = 50;\n          if (o.type === 'group') { pasteGroup(o, 60, 50); msg('Sửa xong bấm \"Chèn vào ' + officeName() + ' và đóng\" (cả nhóm đang được chọn) để thay cho hình.'); return; }\n          paste(o);");

// ---------- bàn phím ----------
rep("    if (e.ctrlKey && k === 'v' && S.clip) { e.preventDefault(); paste(JSON.parse(S.clip)); return; }\n    if (!o) return;",
  "    if (e.ctrlKey && k === 'v' && S.clip) { e.preventDefault(); const c = JSON.parse(S.clip); if (Array.isArray(c)) pasteMany(c); else paste(c); return; }\n    if (e.ctrlKey && k === 'a') { e.preventDefault(); run('selall'); return; }\n    if (!o) return;\n    if (e.ctrlKey && k === 'g') { e.preventDefault(); run(e.shiftKey ? 'ungroup' : 'group'); return; }");
rep("      S.clip = JSON.stringify(o, (key, v) => (key[0] === '_' ? undefined : v));", "      S.clip = many() ? JSON.stringify(selObjs().map(cleanObj)) : JSON.stringify(o, (key, v) => (key[0] === '_' ? undefined : v));");
rep("      if (e.key === 'ArrowLeft') o.x -= d; if (e.key === 'ArrowRight') o.x += d;\n      if (e.key === 'ArrowUp') o.y -= d; if (e.key === 'ArrowDown') o.y += d;\n      renderObj(o); commit();",
  "      selObjs().forEach((t) => { if (e.key === 'ArrowLeft') t.x -= d; if (e.key === 'ArrowRight') t.x += d; if (e.key === 'ArrowUp') t.y -= d; if (e.key === 'ArrowDown') t.y += d; renderObj(t); });\n      paintSel(); commit();");

// ---------- chụp ảnh nhiều đối tượng ----------
rep("      const el = target === 'page' ? page : page.querySelector(`[data-id=\"${target}\"]`);\n      if (!el) return res(null);",
  "      if (String(target).startsWith('sel:')) {\n        // nhiều đối tượng: chụp vùng bao quanh tất cả\n        const els = target.slice(4).split(',').map((id) => page.querySelector(`[data-id=\"${id}\"]`)).filter(Boolean);\n        if (!els.length) return res(null);\n        els[0].scrollIntoView({ block: 'nearest', inline: 'nearest' });\n        const rs = els.map((x) => x.getBoundingClientRect()), x0 = Math.min(...rs.map((r) => r.left)), y0 = Math.min(...rs.map((r) => r.top)), x1 = Math.max(...rs.map((r) => r.right)), y1 = Math.max(...rs.map((r) => r.bottom));\n        return res({ x: Math.max(0, x0 - 8), y: Math.max(0, y0 - 8), width: x1 - x0 + 16, height: y1 - y0 + 16, depthPt: 0 });\n      }\n      const el = target === 'page' ? page : page.querySelector(`[data-id=\"${target}\"]`);\n      if (!el) return res(null);");

// ---------- thư viện: lưu và chèn nhóm ----------
rep("  const KIND_NAME = { formula: 'Công thức',", "  const KIND_NAME = { group: 'Nhóm', formula: 'Công thức',");
rep("        let thumb = ''; d.close(); try { thumb = await libThumb(ob); } catch (e) { /* không có ảnh thu nhỏ vẫn lưu */ } d.showModal();\n        const obj = JSON.parse(JSON.stringify(ob, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));",
  "        let thumb = ''; d.close(); try { thumb = await libThumb(many() ? { id: 'sel:' + S.multi.join(',') } : ob); } catch (e) { /* không có ảnh thu nhỏ vẫn lưu */ } d.showModal();\n        const obj = many() ? groupData() : JSON.parse(JSON.stringify(ob, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));");
rep("          paste(o2); d.close();", "          if (o2.type === 'group') pasteGroup(o2, o2.x, o2.y); else paste(o2);\n          d.close();");

fs.writeFileSync(F, s);
// kiểu hiển thị
const css = path.join(__dirname, '..', 'src', 'styles.css');
if (!fs.readFileSync(css, 'utf8').includes('.rband')) fs.appendFileSync(css, `
/* chọn nhiều, khung chọn, đường dóng */
.obj.msel { outline: 1.5px dashed #1f5fbf; outline-offset: 2px; }
.obj.msel .handle, .obj.msel .pth { display: none !important; }
.rband { position: absolute; border: 1px dashed #1f5fbf; background: rgba(31,95,191,.08); pointer-events: none; z-index: 5; }
.guide { position: absolute; pointer-events: none; z-index: 6; background: #e8423f; }
.guide.gv { top: 0; bottom: 0; width: 1px; }
.guide.gh { left: 0; right: 0; height: 1px; }
body.capturing .guide, body.capturing .rband { display: none !important; }
body.capturing .obj.msel { outline: none !important; }
`);
console.log('ok');
