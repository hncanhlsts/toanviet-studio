// Trình chiếu tương tác trên TV / bảng tương tác (hiện dần, giải đặt tính từng bước, bấm để hiện đáp án, kéo thả)
// và hộp "Mẫu theo bài" (sách Toán 1 – 5 Kết nối tri thức). Nhận các hàm, biến dùng chung qua đối số C.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.trinhchieu = function (C) {
    const { $, page, stage, S, esc, msg, insert, renderObj, renderAll, buildProps, commit, setSel, elOf, modal, setZoom } = C;

    // ---------- Trình chiếu ----------
    let P = null; // trạng thái đang trình chiếu
    const FLAGS = ['dapan', 'an', 'khongkim'];
    const isAnswerable = (o) => o.type === 'baitap' || (o.type === 'minhhoa' && FLAGS.some((k) => k in o));
    function startPresent(step) {
      if (P) return;
      if (!S.objs.length) return msg('Trang chưa có gì để trình chiếu', true);
      P = { step, zoom: S.zoom, saved: new Map(), order: S.objs.slice().sort((a, b) => a.y - b.y || a.x - b.x).map((o) => o.id), shown: 0 };
      S.objs.forEach((o) => P.saved.set(o.id, { x: o.x, y: o.y, dapan: o.dapan, an: o.an, khongkim: o.khongkim }));
      setSel([]);
      document.body.classList.add('present');
      try { document.documentElement.requestFullscreen(); } catch (e) { /* không toàn màn hình được: vẫn trình chiếu trong cửa sổ */ }
      // đặt tính: bắt đầu từ các số đã cho, mỗi lần nhấp hiện thêm một bước
      S.objs.forEach((o) => { if (o.type === 'dattinh') o._buoc = 0; });
      renderAll();
      const bar = document.createElement('div');
      bar.id = 'presbar';
      bar.innerHTML = '<button data-p="prev" title="Lùi (←)">◀</button><button data-p="next" title="Tiếp (→, Space)">▶</button><button data-p="ans" title="Hiện / ẩn mọi đáp án (D)">Đáp án</button><button data-p="exit" title="Thoát trình chiếu (Esc)">Thoát</button><span>Nhấp vào phép đặt tính để giải từng bước · nhấp vào bài tập để hiện đáp án · kéo để di chuyển</span>';
      bar.addEventListener('click', (e) => { const b = e.target.closest('[data-p]'); if (!b) return; ({ prev, next, ans: allAnswers, exit: stopPresent })[b.dataset.p](); });
      document.body.appendChild(bar);
      if (step) { P.shown = 0; applyShown(); }
      setTimeout(fit, 120);
      window.addEventListener('resize', fit);
      msg(step ? 'Trình chiếu hiện dần: bấm → hoặc Space để hiện phần tiếp theo; Esc để thoát' : 'Trình chiếu: Esc để thoát');
    }
    function fit() {
      if (!P) return;
      const base = page.getBoundingClientRect().width / S.zoom;
      setZoom(Math.min(3, Math.max(0.4, (window.innerWidth - 90) / base)));
    }
    function applyShown() {
      P.order.forEach((id, i) => { const el = elOf(id); if (el) el.style.visibility = !P.step || i < P.shown ? '' : 'hidden'; });
      const last = P.step && P.shown > 0 ? elOf(P.order[P.shown - 1]) : null;
      if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function next() { if (!P) return; if (P.step && P.shown < P.order.length) { P.shown++; applyShown(); } }
    function prev() { if (!P) return; if (P.step && P.shown > 0) { P.shown--; applyShown(); } }
    function allAnswers() {
      if (!P) return;
      const any = S.objs.some((o) => isAnswerable(o) && !revealed(o));
      S.objs.forEach((o) => { if (isAnswerable(o)) setReveal(o, any); if (o.type === 'dattinh') o._buoc = any ? undefined : 0; renderObj(o); });
      applyShown();
    }
    const revealed = (o) => (o.type === 'baitap' ? !!o.dapan : !o.an && !o.khongkim);
    function setReveal(o, on) {
      const sv = P.saved.get(o.id) || {};
      if (o.type === 'baitap') o.dapan = on ? true : sv.dapan;
      else { o.an = on ? false : sv.an; o.khongkim = on ? false : sv.khongkim; }
    }
    function stopPresent() {
      if (!P) return;
      S.objs.forEach((o) => { const sv = P.saved.get(o.id); if (sv) { o.x = sv.x; o.y = sv.y; ['dapan', 'an', 'khongkim'].forEach((k) => { if (sv[k] === undefined) delete o[k]; else o[k] = sv[k]; }); } delete o._buoc; });
      window.removeEventListener('resize', fit);
      const bar = $('#presbar'); if (bar) bar.remove();
      document.body.classList.remove('present');
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* bỏ qua */ }
      setZoom(P.zoom);
      P = null;
      renderAll(); buildProps();
      msg('Đã thoát trình chiếu (vị trí và đáp án trở lại như trước khi trình chiếu)');
    }
    // nhấp vào một đối tượng khi trình chiếu
    function act(o) {
      if (o.type === 'dattinh') {
        const r = TieuHoc.renderDatTinh(Object.assign({}, o, { _buoc: undefined }));
        o._buoc = (o._buoc || 0) >= r.buoc ? 0 : (o._buoc || 0) + 1;
        renderObj(o);
      } else if (isAnswerable(o)) { setReveal(o, !revealed(o)); renderObj(o); }
    }
    // bắt sự kiện trước các xử lý soạn thảo của trang
    page.addEventListener('pointerdown', (e) => {
      if (!P) return;
      e.stopPropagation(); e.preventDefault();
      const el = e.target.closest('.obj');
      if (!el) { next(); return; }
      const o = S.objs.find((t) => t.id === el.dataset.id); if (!o) return;
      const p0 = { x: e.clientX, y: e.clientY, ox: o.x, oy: o.y };
      let moved = false;
      const mv = (ev) => {
        const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true; o.x = Math.round(p0.ox + dx); o.y = Math.round(p0.oy + dy); el.style.left = o.x + 'px'; el.style.top = o.y + 'px';
      };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); if (!moved) act(o); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }, true);
    page.addEventListener('dblclick', (e) => { if (P) { e.stopPropagation(); e.preventDefault(); } }, true);
    document.addEventListener('keydown', (e) => {
      if (!P) return;
      const k = e.key;
      if (k === 'Escape') stopPresent();
      else if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') next();
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') prev();
      else if (k === 'd' || k === 'D') allAnswers();
      else { e.stopPropagation(); return; } // phím khác: không chuyển cho phần soạn thảo (tránh xoá, sửa nhầm khi đang chiếu)
      e.preventDefault(); e.stopPropagation();
    }, true);
    document.addEventListener('fullscreenchange', () => { if (P) setTimeout(fit, 80); });

    // ---------- Mẫu theo bài (sách Toán 1 – 5 Kết nối tri thức) ----------
    function insertItems(items) {
      let y = Math.round(30 + stage.scrollTop / S.zoom), x = 40, rowH = 0;
      const ids = [];
      items.forEach(([type, kind, extra]) => {
        const inline = type === 'dattinh';
        if (!inline && rowH) { y += rowH + 16; x = 40; rowH = 0; }
        const o = insert(type, kind, Object.assign({ x, y }, type === 'baitap' ? { w: 714 } : {}, extra || {}));
        ids.push(o.id);
        const el = elOf(o.id), h = el ? el.offsetHeight : o.h || 60, w = el ? el.offsetWidth : o.w || 200;
        if (inline) { x += w + 46; rowH = Math.max(rowH, h); if (x > 640) { y += rowH + 16; x = 40; rowH = 0; } }
        else { y += h + 16; }
      });
      setSel(ids);
      commit();
      return ids.length;
    }
    function openMau() {
      const MAU = root.MauKNTT || [];
      let lop = 1;
      try { lop = +localStorage.getItem('tvs-mau-lop') || 1; } catch (e) { /* bỏ qua */ }
      modal('maudlg', 'Mẫu theo bài – sách Toán Kết nối tri thức');
      const d = $('#maudlg'), body = d.querySelector('.tvbody');
      const draw = () => {
        const L = MAU.find((x) => x.lop === lop) || MAU[0];
        body.innerHTML = '<div class="tvtabs">' + MAU.map((x) => `<button data-lop="${x.lop}" class="${x.lop === lop ? 'on' : ''}">Lớp ${x.lop}</button>`).join('') + '</div>' +
          '<p class="tvhint">Chọn bài đang dạy rồi bấm <b>Chèn</b>: các dạng bài, phép đặt tính, hình minh hoạ được đặt sẵn trên trang để thầy cô sửa số liệu ở khung Thuộc tính. Tên bài theo sách; đề bài, số liệu là bài tập tự soạn.</p>' +
          '<div class="maulist">' + L.chude.map(([cd, bais], ci) => `<div class="maucd">${esc(cd)}</div>` + bais.map(([ten, items], bi) => `<div class="maubai"><span>${esc(ten)}</span><span class="maucnt">${items.length} mục</span><button class="primary" data-c="${ci}" data-b="${bi}">Chèn</button></div>`).join('')).join('') + '</div>';
        body.querySelectorAll('[data-lop]').forEach((b) => { b.onclick = () => { lop = +b.dataset.lop; try { localStorage.setItem('tvs-mau-lop', String(lop)); } catch (e) { /* bỏ qua */ } draw(); }; });
        body.querySelectorAll('[data-c]').forEach((b) => {
          b.onclick = () => {
            const [ten, items] = L.chude[+b.dataset.c][1][+b.dataset.b];
            d.close();
            const n = insertItems(items);
            msg('Đã chèn ' + n + ' mục của "' + ten + '" (lớp ' + lop + ') — chọn từng mục để sửa ở khung Thuộc tính');
          };
        });
      };
      draw();
      d.showModal();
    }
    return { startPresent, stopPresent, openMau, isPresenting: () => !!P };
  };
})(window);
