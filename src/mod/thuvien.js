// Thư viện của tôi, báo lỗi / góp ý — tách từ app.js; nhận các hàm, biến dùng chung qua đối số C.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.thuvien = function (C) {
    const { $, stage, api, S, esc, LOG, msg, cur, title, many, groupData, pasteGroup, select, paste } = C;
  // ---------- Thư viện của tôi ----------
  const modal = (id, title) => {
    let d = document.getElementById(id);
    if (!d) { d = document.createElement('dialog'); d.id = id; d.className = 'tvdlg'; document.body.appendChild(d); }
    d.innerHTML = '<div class="tvhead"><b>' + esc(title) + '</b><button class="tvx" title="Đóng (Esc)">✕</button></div><div class="tvbody"></div>';
    d.querySelector('.tvx').onclick = () => d.close();
    return d;
  };
  const libThumb = async (o) => {
    // ảnh thu nhỏ của đối tượng: dựng ảnh nét cao rồi thu nhỏ còn tối đa 240 × 150
    const r = await api.renderPng(o.id, true, true);
    const img = new Image(); img.src = 'data:image/png;base64,' + r.b64; await img.decode();
    const k = Math.min(1, 240 / img.width, 150 / img.height), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  };
  const LIBKEY = () => 'L' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const KIND_NAME = { group: 'Nhóm', formula: 'Công thức', text: 'Văn bản', graph: 'Đồ thị', bbt: 'Bảng', region: 'Miền nghiệm', solid: 'Khối', plane: 'Hình phẳng', space: 'Hình không gian', sym: 'Ký hiệu', numline: 'Trục số', venn: 'Biểu đồ Ven', shape: 'Hình vẽ' };
  async function openLib() {
    if (!api) return;
    let items = await api.lib({ action: 'load' });
    let q = '', grp = '', tab = 'mine';
    // thư viện tổ: các tệp .tvslib trong thư mục dùng chung (ổ mạng trường, OneDrive, Google Drive…)
    const shared = { dir: '', ok: false, author: '', items: [], bad: [] };
    const loadShared = async () => {
      Object.assign(shared, await api.shared({ action: 'get' }));
      const r = shared.ok ? await api.shared({ action: 'load' }) : { items: [], bad: [] };
      shared.items = r.items; shared.bad = r.bad || [];
    };
    await loadShared();
    const d = modal('libdlg', 'Thư viện');
    const body = d.querySelector('.tvbody');
    const save = () => api.lib({ action: 'save', items });
    const draw = () => {
      const src = tab === 'mine' ? items : shared.items;
      const groups = [...new Set(src.map((it) => it.group || 'Chung'))].sort();
      if (grp && !groups.includes(grp)) grp = '';
      const shown = src.filter((it) => (!grp || (it.group || 'Chung') === grp) && (!q || (it.name + ' ' + (it.group || '') + ' ' + (it.src || '') + ' ' + (it.obj.latex || '') + ' ' + (it.obj.script || '')).toLowerCase().includes(q.toLowerCase())));
      const o = cur();
      const mine = tab === 'mine';
      body.innerHTML = `
        <div class="tvtabs"><button data-tab="mine" class="${mine ? 'on' : ''}">Của tôi (${items.length})</button><button data-tab="shared" class="${mine ? '' : 'on'}">Thư viện tổ${shared.ok ? ' (' + shared.items.length + ')' : ''}</button></div>
        <div class="tvrow">
          <input id="libq" placeholder="Tìm theo tên, nhóm, nội dung${mine ? '' : ', người chia sẻ'}…" value="${esc(q)}">
          <select id="libg"><option value="">Mọi nhóm (${src.length})</option>${groups.map((g) => `<option${g === grp ? ' selected' : ''}>${esc(g)}</option>`).join('')}</select>
        </div>
        ${mine ? `<div class="tvrow tvsave">
          <input id="libname" placeholder="Tên mục mới, vd: Công thức nghiệm bậc hai" ${o ? '' : 'disabled'}>
          <input id="libgroup" placeholder="Nhóm, vd: Lớp 10 – Vectơ" list="libgroups" value="${esc(grp)}" ${o ? '' : 'disabled'}>
          <datalist id="libgroups">${groups.map((g) => `<option>${esc(g)}</option>`).join('')}</datalist>
          <button id="libadd" class="primary" ${o ? '' : 'disabled'} title="${o ? '' : 'Chọn một đối tượng trên trang trước'}">＋ Lưu đối tượng đang chọn</button>
        </div>` : `<div class="tvrow tvsave">
          <span>Thư mục dùng chung:</span><b class="tvdir" title="${esc(shared.dir)}">${shared.dir ? esc(shared.dir) : '(chưa chọn)'}</b>
          <button id="libdir">${shared.dir ? 'Đổi thư mục…' : 'Chọn thư mục…'}</button>
          <span>Tên của bạn:</span><input id="libauthor" value="${esc(shared.author)}" placeholder="vd: Thầy Cảnh" style="max-width:150px">
        </div>
        ${shared.dir && !shared.ok ? '<p class="tvhint" style="color:#b03a2e">Không mở được thư mục này (ổ mạng chưa kết nối?).</p>' : ''}
        ${shared.bad.length ? '<p class="tvhint">Không đọc được: ' + esc(shared.bad.join('; ')) + '</p>' : ''}`}
        <div class="tvgrid">${shown.length ? shown.map((it) => `
          <div class="tvcard" data-k="${esc(it.id)}" data-src="${esc(it.src || '')}">
            <div class="tvimg">${it.thumb ? `<img src="${it.thumb}" alt="">` : '<span>' + esc(KIND_NAME[it.obj.type] || it.obj.type) + '</span>'}</div>
            <div class="tvname" title="${esc(it.name)}">${esc(it.name)}</div>
            <div class="tvmeta">${esc(it.group || 'Chung')} · ${esc(KIND_NAME[it.obj.type] || it.obj.type)}${it.src ? ' · ' + esc(it.src.replace(/^ThuVien-/, '')) : ''}</div>
            <div class="tvbtns"><button data-a="ins" class="primary">Chèn</button>${mine
              ? '<button data-a="ren">Đổi tên</button><button data-a="del">Xoá</button>' + (shared.ok ? '<button data-a="share" title="Đưa mục này lên thư viện tổ">Chia sẻ</button>' : '')
              : '<button data-a="keep" title="Chép mục này về Thư viện của tôi">Lưu về máy</button>' + (it.src === 'ThuVien-' + (shared.author || 'Chung').replace(/[\\/:*?"<>|]/g, '-').trim() ? '<button data-a="unshare" title="Gỡ mục của bạn khỏi thư viện tổ">Gỡ</button>' : '')}</div>
          </div>`).join('') : '<p class="tvempty">' + (mine ? (items.length ? 'Không có mục nào khớp.' : 'Thư viện còn trống. Chọn một công thức hoặc hình trên trang rồi bấm “Lưu đối tượng đang chọn”.') : (!shared.dir ? 'Chọn một thư mục mà cả tổ cùng dùng (ổ mạng của trường, thư mục OneDrive / Google Drive được chia sẻ). Mỗi người bấm “Chia sẻ” ở thẻ “Của tôi” để đưa mục lên; mọi người trong tổ đều thấy ở đây.' : (shared.items.length ? 'Không có mục nào khớp.' : 'Thư viện tổ chưa có mục nào.'))) + '</p>'}</div>
        <div class="tvrow tvfoot">
          ${mine ? `<button id="libimp">Nhập gói thư viện…</button>
          <button id="libexp" ${shown.length ? '' : 'disabled'}>Xuất ${shown.length} mục đang hiện thành gói…</button>
          <span style="flex:1"></span><span class="tvhint">Gói thư viện (.tvslib) gửi được cho đồng nghiệp qua email, Zalo, USB.</span>`
            : `<button id="libreload" ${shared.ok ? '' : 'disabled'}>Tải lại</button><span style="flex:1"></span><span class="tvhint">Thư mục này cũng dùng để cập nhật: chép bộ cài ToanVietStudio-Setup-x.y.z.exe vào đây, các máy trong tổ sẽ được báo có bản mới.</span>`}
        </div>`;
      body.querySelectorAll('[data-tab]').forEach((bt) => { bt.onclick = () => { tab = bt.dataset.tab; grp = ''; draw(); }; });
      const qi = body.querySelector('#libq');
      qi.oninput = () => { q = qi.value; draw(); const n = body.querySelector('#libq'); n.focus(); n.setSelectionRange(q.length, q.length); };
      body.querySelector('#libg').onchange = (e) => { grp = e.target.value; draw(); };
      const add = body.querySelector('#libadd');
      if (add) add.onclick = async () => {
        const ob = cur(); if (!ob) return;
        const name = body.querySelector('#libname').value.trim() || (KIND_NAME[ob.type] || 'Mục') + ' ' + (items.length + 1);
        const group = body.querySelector('#libgroup').value.trim() || 'Chung';
        add.disabled = true; add.textContent = 'Đang lưu…';
        // tạm đóng hộp thoại khi chụp ảnh thu nhỏ để lớp nền tối không lẫn vào ảnh
        let thumb = ''; d.close(); try { thumb = await libThumb(many() ? { id: 'sel:' + S.multi.join(',') } : ob); } catch (e) { /* không có ảnh thu nhỏ vẫn lưu */ } d.showModal();
        const obj = many() ? groupData() : JSON.parse(JSON.stringify(ob, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));
        items.unshift({ id: LIBKEY(), name, group, obj, thumb, created: Date.now() });
        await save(); msg('Đã lưu “' + name + '” vào thư viện'); draw();
      };
      const dirB = body.querySelector('#libdir');
      if (dirB) dirB.onclick = async () => { const f = await api.shared({ action: 'choose' }); if (!f) return; await loadShared(); draw(); msg('Thư mục dùng chung: ' + f); };
      const au = body.querySelector('#libauthor');
      if (au) au.onchange = async () => { await api.shared({ action: 'author', author: au.value.trim() }); shared.author = au.value.trim(); draw(); };
      const rl = body.querySelector('#libreload');
      if (rl) rl.onclick = async () => { await loadShared(); draw(); };
      body.querySelectorAll('.tvcard').forEach((card) => card.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const it = src.find((x) => x.id === card.dataset.k && (x.src || '') === card.dataset.src); if (!it) return;
        if (b.dataset.a === 'ins') {
          const o2 = JSON.parse(JSON.stringify(it.obj));
          o2.x = Math.round(40 + stage.scrollLeft / S.zoom); o2.y = Math.round(30 + stage.scrollTop / S.zoom);
          if (o2.type === 'group') pasteGroup(o2, o2.x, o2.y); else paste(o2);
          d.close(); msg('Đã chèn “' + it.name + '” từ thư viện');
        } else if (b.dataset.a === 'ren') {
          const nm = card.querySelector('.tvname'); nm.innerHTML = `<input value="${esc(it.name)}">`; const inp = nm.querySelector('input'); inp.focus(); inp.select();
          let finished = false;
          const done = async () => { if (finished) return; finished = true; it.name = inp.value.trim() || it.name; await save(); draw(); };
          inp.onkeydown = (ev) => { if (ev.key === 'Enter') done(); if (ev.key === 'Escape') { ev.preventDefault(); finished = true; draw(); } }; inp.onblur = done;
        } else if (b.dataset.a === 'del') {
          if (!(await api.confirm('Xoá “' + it.name + '” khỏi thư viện?'))) return;
          items = items.filter((x) => x !== it); await save(); draw();
        } else if (b.dataset.a === 'share') {
          if (!shared.author) { tab = 'shared'; draw(); const a2 = body.querySelector('#libauthor'); if (a2) a2.focus(); return msg('Nhập "Tên của bạn" trước khi chia sẻ (để tổ biết ai chia sẻ)', true); }
          const f = await api.shared({ action: 'put', items: [it], name: shared.author });
          if (f) { await loadShared(); msg('Đã chia sẻ “' + it.name + '” lên thư viện tổ'); draw(); }
        } else if (b.dataset.a === 'keep') {
          if (items.some((x) => x.id === it.id)) return msg('Mục này đã có trong thư viện của bạn');
          const c = JSON.parse(JSON.stringify(it)); delete c.src; items.unshift(c); await save(); msg('Đã lưu “' + it.name + '” về thư viện của bạn'); draw();
        } else if (b.dataset.a === 'unshare') {
          if (!(await api.confirm('Gỡ “' + it.name + '” khỏi thư viện tổ?'))) return;
          await api.shared({ action: 'unput', src: it.src, id: it.id }); await loadShared(); draw();
        }
      }));
      const imp = body.querySelector('#libimp');
      if (imp) imp.onclick = async () => {
        const r = await api.lib({ action: 'import' }); if (!r) return;
        const have = new Set(items.map((x) => x.id)); let added = 0;
        r.items.forEach((it) => { if (it && it.obj && it.obj.type && !have.has(it.id)) { if (!it.id) it.id = LIBKEY(); items.push(it); have.add(it.id); added++; } });
        await save(); draw();
        api.info('Đã thêm ' + added + ' mục vào thư viện' + (r.items.length - added ? ' (' + (r.items.length - added) + ' mục đã có sẵn, bỏ qua)' : '') + '.' + (r.bad.length ? '\n\nKhông đọc được:\n' + r.bad.join('\n') : ''));
      };
      const exp = body.querySelector('#libexp');
      if (exp) exp.onclick = async () => {
        const f = await api.lib({ action: 'export', items: shown, name: grp ? 'ThuVien-' + grp.replace(/[\\/:*?"<>|]/g, '-') : 'ThuVien-ToanViet' });
        if (f) msg('Đã xuất ' + shown.length + ' mục: ' + f);
      };
    };
    draw();
    d.showModal();
  }
  // ---------- Báo lỗi / góp ý ----------
  function openReport() {
    if (!api) return;
    const d = modal('repdlg', 'Báo lỗi / góp ý');
    const o = cur();
    d.querySelector('.tvbody').innerHTML = `
      <p>Mô tả ngắn: bạn đã làm gì, mong đợi điều gì, phần mềm làm gì khác đi.</p>
      <textarea id="reptxt" rows="6" placeholder="Ví dụ: Vẽ hình bình hành ABCD rồi bấm Phân giác góc, nhưng đường phân giác không chia đôi góc A…"></textarea>
      <label class="chk"><input type="checkbox" id="repobj" ${o ? 'checked' : 'disabled'}> Kèm đối tượng đang chọn${o ? ' (' + esc(KIND_NAME[o.type] || o.type) + ')' : ' (chưa chọn đối tượng nào)'}</label>
      <label class="chk"><input type="checkbox" id="repall"> Kèm toàn bộ nội dung trang (${S.objs.length} đối tượng)</label>
      <p class="tvhint">Phần mềm tạo một tệp văn bản và một ảnh màn hình trên Desktop. Bạn mở xem rồi tự gửi qua email; phần mềm không tự gửi gì đi.</p>
      <div class="tvrow tvfoot"><span style="flex:1"></span><button id="repgo" class="primary">Tạo tệp báo lỗi</button></div>`;
    d.querySelector('#repgo').onclick = async () => {
      const txt = d.querySelector('#reptxt').value.trim();
      const strip = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === '_res' || k === '_view' ? undefined : v)));
      const parts = ['MÔ TẢ', txt || '(không có)', ''];
      if (d.querySelector('#repobj').checked && o) parts.push('ĐỐI TƯỢNG ĐANG CHỌN', JSON.stringify(strip(o), null, 1), o._err ? 'Lỗi của đối tượng: ' + o._err : '', '');
      const errs = S.objs.filter((x) => x._err).map((x) => (KIND_NAME[x.type] || x.type) + ' ' + x.id + ': ' + x._err);
      if (errs.length) parts.push('ĐỐI TƯỢNG ĐANG BÁO LỖI', ...errs, '');
      if (d.querySelector('#repall').checked) parts.push('TOÀN BỘ TRANG', JSON.stringify(S.objs.map(strip), null, 1), '');
      parts.push('THÔNG BÁO GẦN ĐÂY', ...(LOG.length ? LOG : ['(không có)']));
      d.close();
      await api.report({ text: parts.join('\n'), summary: txt.slice(0, 600) });
    };
    d.showModal();
  }
    return { modal, libThumb, openLib, openReport };
  };
})(window);
