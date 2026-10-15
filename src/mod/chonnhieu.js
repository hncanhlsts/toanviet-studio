// Chọn nhiều đối tượng, khung chọn, bắt dính, nhóm, căn thẳng hàng — tách từ app.js; nhận các hàm, biến dùng chung qua đối số C.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.chonnhieu = function (C) {
    const { page, props, S, msg, get, commit, title, renderObj, pagePt, buildProps, run } = C;
  // ---------- Chọn nhiều đối tượng, nhóm ----------
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
    return { isSel, selObjs, many, cleanObj, paintSel, groupOf, setSel, toggleSel, elOf, boxOf, groupData, pasteGroup, pasteMany, multiProps, rubberBand, snapper };
  };
})(window);
