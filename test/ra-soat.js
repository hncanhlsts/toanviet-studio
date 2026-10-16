// Rà soát giao diện theo vai người dùng: chèn mọi loại đối tượng, mọi mẫu; mở khung Thuộc tính, thử mọi lựa chọn của mọi ô chọn;
// thử mọi nút ký hiệu trong hộp soạn công thức. In ra danh sách vấn đề tìm thấy (RS: ...). Chạy bằng: node test/ra-soat-chay.js
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  const issues = [];
  const add = (where, what) => { issues.push(where + ' — ' + what); };
  const BAD_TEXT = /undefined|NaN|\[object|=>|function\s*\(|Infinity/;
  const props = document.getElementById('props');
  // kiểm tra một đối tượng đang chọn
  const check = (where, o) => {
    const el = document.querySelector('[data-id="' + o.id + '"]');
    if (!el) { add(where, 'không thấy phần tử trên trang'); return; }
    const txt = el.textContent || '';
    if (BAD_TEXT.test(txt)) add(where, 'hình có chữ lạ: ' + txt.match(BAD_TEXT)[0] + ' … ' + txt.slice(0, 60));
    if (/NaN|undefined/.test(el.innerHTML.replace(/<script[\s\S]*?<\/script>/g, ''))) add(where, 'mã hình có NaN/undefined');
    if (o._err) add(where, 'báo lỗi: ' + o._err.split('\n')[0]);
    if (el.offsetWidth < 4 || el.offsetHeight < 4) add(where, 'hình trống/kích thước 0');
    if (el.querySelector('.ML__error')) add(where, 'công thức trong hình lỗi LaTeX');
    props.querySelectorAll('select').forEach((s) => { if (s.selectedIndex < 0 || !s.value) add(where, 'ô chọn "' + (s.dataset.k || '?') + '" đang trống'); });
    props.querySelectorAll('select').forEach((s) => [...s.options].forEach((op) => { if (BAD_TEXT.test(op.textContent) || !op.textContent.trim()) add(where, 'ô chọn "' + (s.dataset.k || '?') + '" có lựa chọn lạ: ' + op.textContent.slice(0, 50)); }));
    props.querySelectorAll('label').forEach((l) => { if (BAD_TEXT.test(l.textContent)) add(where, 'nhãn lạ: ' + l.textContent.slice(0, 50)); });
  };
  const S = window.__state ? window.__state() : null;
  const tryAll = async (type, kinds, extra) => {
    for (const k of kinds) {
      __clear(); await w(10);
      let id;
      try { id = __add(type, k, Object.assign({ x: 40, y: 40 }, extra || {})); } catch (e) { add(type + '/' + k, 'không chèn được: ' + e.message); continue; }
      await w(20);
      const o = window.__get(id);
      check(type + '/' + k, o);
      // thử mọi lựa chọn của các ô chọn (trừ ô "Mẫu" đã duyệt ở ngoài)
      const sels = [...props.querySelectorAll('select')].map((s) => s.dataset.k).filter((key) => key && key !== 'kind');
      for (const key of sels) {
        const s = props.querySelector('select[data-k="' + key + '"]'); if (!s) continue;
        const vals = [...s.options].map((op) => op.value);
        for (const v of vals) {
          const s2 = props.querySelector('select[data-k="' + key + '"]'); if (!s2) break;
          s2.value = v; s2.dispatchEvent(new Event('change')); await w(10);
          check(type + '/' + k + ' [' + key + '=' + v + ']', window.__get(id));
        }
      }
      // bật / tắt mọi ô đánh dấu
      const chks = [...props.querySelectorAll('label.chk input')];
      for (let i = 0; i < chks.length; i++) {
        const c = [...props.querySelectorAll('label.chk input')][i]; if (!c) break;
        c.click(); await w(10); check(type + '/' + k + ' [ô đánh dấu ' + i + ']', window.__get(id));
        const c2 = [...props.querySelectorAll('label.chk input')][i]; if (c2) { c2.click(); await w(5); }
      }
    }
  };
  const keys = (sel) => [...document.querySelectorAll(sel + ' option')].map((o) => o.value);
  __run('tieuhoc'); await w(50);
  await tryAll('dattinh', Object.keys(TieuHoc.DT_KINDS));
  await tryAll('baitap', Object.keys(TieuHoc.BT_KINDS));
  await tryAll('minhhoa', Object.keys(MinhHoa.KINDS));
  __run('tieuhoc'); await w(50);
  await tryAll('numline', Object.keys(NumLine.KINDS));
  await tryAll('venn', Object.keys(NumLine.VKINDS));
  await tryAll('plane', keys('#planeKind'));
  const sk = keys('#solidKind');
  await tryAll('space', sk.filter((v) => v.startsWith('sp:')).map((v) => v.slice(3)));
  await tryAll('sym', keys('#symKind'));
  for (const t of ['graph', 'bbt', 'sign', 'region']) await tryAll(t, [null]);
  for (const k of ['line', 'arrow', 'rect', 'ellipse']) await tryAll('shape', [k]);
  await tryAll('formula', [null], { latex: 'x^2+1' });
  await tryAll('text', [null], { text: 'Chữ có công thức $x^2$' });
  // mọi lệnh mở hộp thoại phải làm hộp thoại hiện lên thật (không chỉ dựng nội dung)
  for (const [cmd, sel] of [['lib', '#libdlg'], ['exam', 'dialog[open]'], ['mau', '#maudlg'], ['report', 'dialog[open]'], ['ins-formula', '#fxdlg']]) {
    __clear(); await w(50);
    try { __run(cmd); } catch (e) { add('lệnh ' + cmd, 'lỗi khi mở: ' + e.message); }
    await w(500);
    const d = document.querySelector(sel);
    if (!d || !d.open) add('lệnh ' + cmd, 'hộp thoại không hiện lên');
    document.querySelectorAll('dialog[open]').forEach((x) => { const b = x.querySelector('.tvx'); if (b) b.click(); else if (x.id === 'fxdlg') document.getElementById('fxcancel').click(); else x.close(); });
    await w(100);
  }
  // nút ký hiệu trong hộp soạn công thức
  __clear(); __run('ins-formula'); await w(500);
  const tabs = [...document.querySelectorAll('#tabs button')];
  for (let ti = 0; ti < tabs.length; ti++) {
    document.querySelectorAll('#tabs button')[ti].click(); await w(30);
    const grades = [...document.querySelectorAll('#palette .gradebar button')];
    const rounds = Math.max(1, grades.length);
    for (let g = 0; g < rounds; g++) {
      if (grades.length) { document.querySelectorAll('#palette .gradebar button')[g].click(); await w(30); }
      document.querySelectorAll('#palette > button').forEach((b) => {
        if (b.querySelector('.ML__error') || /\\[a-zA-Z]/.test(b.textContent)) add('bảng ký hiệu "' + tabs[ti].textContent + '"' + (grades.length ? ' / ' + grades[g].textContent : ''), 'nút hiện lỗi: ' + (b.title || b.textContent).slice(0, 60));
      });
    }
  }
  document.getElementById('fxcancel').click(); await w(50);
  console.log('RS-TONG ' + issues.length);
  [...new Set(issues)].slice(0, 400).forEach((s) => console.log('RS: ' + s));
  console.log('RS-XONG');
})();
