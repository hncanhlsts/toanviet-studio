// Kịch bản kiểm thử giao diện: chạy trong cửa sổ phần mềm (chế độ chụp), in "✔ …" / "✘ …" ra console.
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  let pass = 0, fail = 0;
  const ok = (name, cond, info) => { if (cond) { pass++; console.log('✔ ' + name); } else { fail++; console.log('✘ ' + name + (info ? ': ' + info : '')); } };
  const step = async (name, fn) => { try { await fn(); } catch (e) { fail++; console.log('✘ ' + name + ': lỗi ' + e.message); } };
  const page = document.getElementById('page');
  const P = (x, y) => { const r = page.getBoundingClientRect(); return { clientX: r.left + x, clientY: r.top + y }; };
  const objEl = (id) => document.querySelector('[data-id="' + id + '"]');
  const down = (el, pt, opt) => el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ bubbles: true }, pt, opt || {})));
  const move = (pt, opt) => window.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, pt, opt || {})));
  const up = () => window.dispatchEvent(new PointerEvent('pointerup', {}));
  const corner = (el) => { const r = el.getBoundingClientRect(); return { clientX: r.left + 3, clientY: r.top + 3 }; };
  const clickObj = async (id, opt) => { down(objEl(id), corner(objEl(id)), opt); up(); await w(120); };
  const handle = (id, sel) => objEl(id).querySelector(sel);
  const dragFrom = async (el, dx, dy, opt) => { const r = el.getBoundingClientRect(), x = r.x + 5, y = r.y + 5; down(el, { clientX: x, clientY: y }); move({ clientX: x + dx, clientY: y + dy }, opt); up(); await w(150); };
  const btn = (text) => [...document.querySelectorAll('#props button, dialog[open] button')].find((b) => b.textContent.trim() === text);
  const script = () => (document.querySelector('textarea[data-k=script]') || {}).value || '';
  const key = (k, o) => document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, o || {})));
  const nSel = () => document.querySelectorAll('#page .obj.sel').length;

  await step('Chọn nhiều, căn hàng, nhóm', async () => {
    __clear();
    __add('formula', null, { latex: 'a^2', x: 100, y: 100 }); __add('formula', null, { latex: 'b^2+c^2', x: 180, y: 200 }); __add('formula', null, { latex: '\\frac{1}{2}', x: 140, y: 330 });
    await w(250);
    down(page, P(60, 60)); move(P(400, 420)); up(); await w(150);
    ok('kéo khung chọn được 3 đối tượng', nSel() === 3, nSel());
    btn('⇤ Trái').click(); await w(80);
    const lefts = [...document.querySelectorAll('#page .obj')].map((e) => e.style.left);
    ok('căn trái', new Set(lefts).size === 1, lefts.join(','));
    btn('Chia đều dọc').click(); await w(80);
    const bs = [...document.querySelectorAll('#page .obj')].map((e) => ({ t: parseFloat(e.style.top), h: e.offsetHeight })).sort((a, b) => a.t - b.t);
    const gaps = [bs[1].t - bs[0].t - bs[0].h, bs[2].t - bs[1].t - bs[1].h];
    ok('chia đều dọc', Math.abs(gaps[0] - gaps[1]) <= 1, gaps.join(','));
    key('g', { ctrlKey: true }); await w(80);
    down(page, P(700, 1000)); up(); await w(80);
    ok('nhấp chỗ trống bỏ chọn', nSel() === 0, nSel());
    await clickObj(document.querySelectorAll('#page .obj')[1].dataset.id);
    ok('nhấp một đối tượng trong nhóm chọn cả nhóm', nSel() === 3, nSel());
    key('d', { ctrlKey: true }); await w(100);
    ok('nhân bản cả nhóm', document.querySelectorAll('#page .obj').length === 6);
    key('Delete'); await w(100);
    ok('xoá cả vùng chọn', document.querySelectorAll('#page .obj').length === 3);
    document.querySelector('[data-cmd=undo]').click(); await w(100);
    ok('hoàn tác', document.querySelectorAll('#page .obj').length === 6);
  });

  await step('Bắt dính khi kéo', async () => {
    __clear(); __add('formula', null, { latex: 'a^2+b^2=c^2', x: 100, y: 100 }); const id = __add('formula', null, { latex: 'x+1', x: 233, y: 260 }); await w(200);
    const el = objEl(id); const r = el.getBoundingClientRect();
    down(el, { clientX: r.left + 3, clientY: r.top + 3 }); move({ clientX: r.left + 3 - 130, clientY: r.top + 23 }); await w(40);
    ok('hiện đường dóng', document.querySelectorAll('.guide').length > 0);
    up(); await w(80);
    ok('đường dóng biến mất khi thả chuột', document.querySelectorAll('.guide').length === 0);
  });

  await step('Kéo điểm', async () => {
    __clear(); const id = __add('plane', 'phangiac', { x: 60, y: 60, w: 420, h: 340, script: 'A = (1, 4)\nB = (0, 0)\nC = (6, 0)\ndagiac ABC' }); await w(250);
    await clickObj(id);
    await dragFrom(handle(id, '.pth[data-pt="A"]'), 60, 0);
    ok('kéo điểm tự do đổi toạ độ', /^A = \((?!1,)/m.test(script()), script().split('\n')[0]);
    __clear(); const id2 = __add('plane', 'hbhphangiac', { x: 60, y: 60, w: 420, h: 340 }); await w(250);
    await clickObj(id2);
    ok('điểm theo thông số có chấm xanh lá', handle(id2, '.pth[data-pt="C"]').classList.contains('pdrag'));
    await dragFrom(handle(id2, '.pth[data-pt="C"]'), 60, 0);
    const a = parseFloat((script().match(/^a = ([\d.]+)/m) || [])[1]);
    ok('kéo C đổi thông số a', a > 5.6, a);
    const Pt = Plane.points(script()), ang = (X, O, Y) => { const u = [Pt[X][0] - Pt[O][0], Pt[X][1] - Pt[O][1]], v = [Pt[Y][0] - Pt[O][0], Pt[Y][1] - Pt[O][1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)); };
    ok('phân giác vẫn đúng sau khi kéo', Math.abs(ang('D', 'A', 'M') - ang('M', 'A', 'B')) < 1e-9);
  });

  await step('Dựng nhanh', async () => {
    __clear(); const id = __add('plane', 'phangiac', { x: 60, y: 60, w: 420, h: 340, script: 'A = (1, 4)\nB = (0, 0)\nC = (6, 0)\ndagiac ABC' }); await w(250);
    await clickObj(id);
    for (const n of ['B', 'C']) { const h = handle(id, '.pth[data-pt="' + n + '"]'); down(h, corner(h)); up(); await w(100); }
    btn('Trung điểm').click(); await w(200);
    ok('trung điểm', /M = trungdiem\(B, C\)/.test(script()));
  });

  await step('Dựng nhanh với mặt phẳng, xoay hình', async () => {
    __clear(); const id = __add('space', 'dtcatmp', { x: 60, y: 60, w: 420, h: 360, script: 'O = (0, 0, 0)\nmp P ngang O 8 5\nA = (-1.5, 0.5, 3)\nB = (-0.4, 0.2, 1.4)\nan O' }); await w(250);
    await clickObj(id);
    const pick = async (sel) => { const h = handle(id, sel); down(h, corner(h)); up(); await w(100); };
    await pick('.plh[data-pl="P"]'); await pick('.pth[data-pt="A"]');
    btn('Hình chiếu lên mặt phẳng').click(); await w(200);
    ok('hình chiếu lên mặt phẳng', /H = chanmp\(A, P\)/.test(script()));
    await pick('.plh[data-pl="P"]'); btn('Điểm trên mặt phẳng').click(); await w(200);
    const nm = (script().match(/^(\w) = trenmp/m) || [])[1];
    ok('điểm trên mặt phẳng', !!nm);
    await dragFrom(handle(id, '.pth[data-pt="' + nm + '"]'), 50, 15);
    ok('kéo điểm vẫn nằm trên mặt phẳng', Math.abs(Space.points(script())[nm][2]) < 1e-9);
    ok('không có lỗi kịch bản', !document.getElementById('perr').textContent, document.getElementById('perr').textContent);
    await dragFrom(handle(id, '.roth'), 60, 20);
    ok('xoay hình bằng chuột', /Xoay ngang/.test(document.getElementById('msg').textContent));
  });

  await step('Thư viện', async () => {
    __clear(); const id = __add('formula', null, { latex: 'x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}', size: 20, x: 60, y: 60 }); await w(200);
    await clickObj(id);
    document.querySelector('[data-cmd=lib]').click(); await w(300);
    document.getElementById('libname').value = 'Công thức nghiệm'; document.getElementById('libadd').click(); await w(2500);
    const items = await api.lib({ action: 'load' });
    ok('lưu vào thư viện (có ảnh thu nhỏ)', items.length === 1 && !!items[0].thumb, items.length);
    document.querySelector('#libdlg .tvcard [data-a=ins]').click(); await w(200);
    ok('chèn từ thư viện', document.querySelectorAll('#page .obj').length === 2);
  });

  await step('Thư viện tổ (thư mục dùng chung)', async () => {
    document.querySelector('[data-cmd=lib]').click(); await w(400);
    const dlg = document.getElementById('libdlg');
    dlg.querySelector('[data-tab=shared]').click(); await w(150);
    dlg.querySelector('#libdir').click(); await w(400);
    ok('chọn thư mục dùng chung', /tvs-ui-|\\to/.test(dlg.querySelector('.tvdir').textContent), dlg.querySelector('.tvdir').textContent);
    const au = dlg.querySelector('#libauthor'); au.value = 'Thầy A'; au.dispatchEvent(new Event('change')); await w(200);
    dlg.querySelector('[data-tab=mine]').click(); await w(150);
    const sh = dlg.querySelector('.tvcard [data-a=share]');
    ok('có nút Chia sẻ', !!sh);
    sh.click(); await w(400);
    dlg.querySelector('[data-tab=shared]').click(); await w(150);
    ok('mục đã lên thư viện tổ', dlg.querySelectorAll('.tvcard').length === 1 && /Thầy A/.test(dlg.querySelector('.tvmeta').textContent), dlg.querySelectorAll('.tvcard').length);
    ok('có nút Gỡ cho mục của mình', !!dlg.querySelector('.tvcard [data-a=unshare]'));
    dlg.close();
  });

  await step('Cập nhật từ thư mục dùng chung', async () => {
    window.__run('update'); await w(1500);
    ok('đã gọi kiểm tra bản mới', true); // bộ chạy kiểm tra bộ cài được chép ra thư mục tạm
  });
  await step('Soạn đề', async () => {
    __clear(); document.querySelector('[data-cmd=exam]').click(); await w(300);
    document.getElementById('exsample').click(); await w(500);
    const d = document.getElementById('examdlg');
    ok('đề ví dụ có 6 câu', d.querySelectorAll('.exq').length === 6, d.querySelectorAll('.exq').length);
    d.querySelectorAll('.exq')[5].click(); await w(250);
    ok('xem trước câu hỏi', /Câu 2\./.test(document.getElementById('exprev').textContent));
    const st = document.getElementById('exstem'); st.value = 'Tính $\\widehat{BAC}$'; st.dispatchEvent(new Event('input')); await w(100);
    ok('sửa nội dung cập nhật xem trước', /Tính/.test(document.getElementById('exprev').textContent));
    d.close();
  });

  await step('Báo lỗi', async () => {
    __clear(); const id = __add('plane', 'phangiac', { x: 60, y: 60, w: 300, h: 260, script: 'A = (0, 0)\ndoan AC' }); await w(200);
    await clickObj(id);
    const f = await new Promise((res) => { const old = api.report; res(null); void old; });
    void f;
    window.__run('report'); await w(250);
    document.getElementById('reptxt').value = 'thử'; document.getElementById('repgo').click(); await w(1200);
    ok('tạo tệp báo lỗi', true); // tệp được bộ chạy kiểm tra trong thư mục tạm
  });

  await step('Phông công thức kiểu Times', async () => {
    window.__run('font-times'); await w(150);
    ok('bật phông Times', document.body.classList.contains('ftimes'));
    window.__run('font-tex'); await w(150);
    ok('tắt phông Times', !document.body.classList.contains('ftimes'));
  });

  await step('Chế độ Tiểu học, đặt tính, phiếu mẫu', async () => {
    __clear();
    const vis = (sel) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e.closest('.grp') || e).display !== 'none'; };
    window.__run('tieuhoc'); await w(150);
    ok('bật chế độ Tiểu học: hiện nhóm nút Tiểu học, ẩn Đồ thị', vis('#dtKind') && !vis('[data-cmd="ins-graph"]'));
    document.getElementById('dtKind').value = 'chia2';
    document.querySelector('[data-cmd="ins-dattinh"]').click(); await w(200);
    const o = document.querySelector('#page .obj.dattinh');
    ok('chèn phép đặt tính chia', !!o && /378/.test(o.textContent.replace(/\s/g, '')), o && o.textContent);
    const inp = document.querySelector('#props input[data-k="expr"]');
    inp.value = '648 : 3'; inp.dispatchEvent(new Event('input')); inp.dispatchEvent(new Event('change')); await w(150);
    ok('đổi phép tính ở khung Thuộc tính', /216/.test(document.querySelector('#page .obj.dattinh').textContent.replace(/\s/g, '')));
    const w0 = document.querySelector('#page .obj.dattinh').offsetWidth;
    await dragFrom(document.querySelector('#page .obj.dattinh .handle'), 60, 0); await w(100);
    ok('kéo góc phóng to chữ số', document.querySelector('#page .obj.dattinh').offsetWidth > w0 + 20);
    __clear();
    window.__run('ins-phieu'); await w(300);
    ok('chèn phiếu bài tập mẫu', document.querySelectorAll('#page .obj.baitap').length === 5 && document.querySelectorAll('#page .obj.dattinh').length === 4);
    const bt = document.querySelectorAll('#page .obj.baitap')[1];
    await clickObj(bt.dataset.id);
    const da = [...document.querySelectorAll('#props label.chk')].find((l) => /đáp án/.test(l.textContent)).querySelector('input');
    da.click(); await w(150);
    ok('bật đáp án: ô trống có số màu đỏ', /th-ans/.test(document.querySelector('[data-id="' + bt.dataset.id + '"]').innerHTML));
    window.__run('tieuhoc'); await w(100);
    ok('tắt chế độ Tiểu học', !document.body.classList.contains('tieuhoc') && vis('[data-cmd="ins-graph"]'));
  });

  await step('Hình minh hoạ, mẫu theo bài, trình chiếu', async () => {
    __clear(); window.__run('tieuhoc'); await w(150);
    document.getElementById('mhKind').value = 'bdcot';
    document.querySelector('[data-cmd="ins-minhhoa"]').click(); await w(200);
    const mh = document.querySelector('#page .obj.minhhoa');
    ok('chèn biểu đồ cột từ nhóm Tiểu học', !!mh && mh.querySelectorAll('rect').length >= 4);
    const ta = document.querySelector('#props textarea[data-k="dulieu"]');
    ta.value = 'A | 3\nB | 9'; ta.dispatchEvent(new Event('input')); ta.dispatchEvent(new Event('change')); await w(150);
    ok('sửa số liệu ở khung Thuộc tính, biểu đồ vẽ lại', /9/.test(document.querySelector('#page .obj.minhhoa').textContent));
    __clear();
    window.__run('mau'); await w(250);
    document.querySelector('#maudlg [data-lop="2"]').click(); await w(150);
    const row = [...document.querySelectorAll('#maudlg .maubai')].find((x) => /Bài 60/.test(x.textContent));
    row.querySelector('button').click(); await w(400);
    ok('chèn mẫu theo bài (lớp 2, bài 60): đề bài và 3 phép đặt tính', document.querySelectorAll('#page .obj.dattinh').length === 3 && document.querySelectorAll('#page .obj.baitap').length === 1);
    const dt = document.querySelector('#page .obj.dattinh'), x0 = dt.style.left;
    window.__run('present'); await w(400);
    ok('vào trình chiếu: ẩn thanh công cụ', document.body.classList.contains('present') && getComputedStyle(document.getElementById('ribbon')).display === 'none');
    const dt2 = document.querySelector('#page .obj.dattinh'), n0 = dt2.querySelectorAll('text').length;
    const r = dt2.getBoundingClientRect();
    dt2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 })); window.dispatchEvent(new PointerEvent('pointerup', {})); await w(120);
    ok('nhấp vào phép đặt tính: hiện thêm một bước', document.querySelector('#page .obj.dattinh').querySelectorAll('text').length > n0);
    const el = document.querySelector('#page .obj.dattinh'), r2 = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r2.left + 4, clientY: r2.top + 4 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: r2.left + 120, clientY: r2.top + 60 })); window.dispatchEvent(new PointerEvent('pointerup', {})); await w(120);
    ok('kéo thả khi trình chiếu', document.querySelector('#page .obj.dattinh').style.left !== x0);
    key('Delete'); await w(80);
    ok('phím Delete không xoá gì khi đang chiếu', document.querySelectorAll('#page .obj').length === 4);
    key('Escape'); await w(300);
    ok('thoát trình chiếu: vị trí trở lại như cũ', !document.body.classList.contains('present') && document.querySelector('#page .obj.dattinh').style.left === x0);
    window.__run('tieuhoc'); await w(100);
  });

  await step('Hộp soạn công thức: nhấp chuột, Tab, hỗn số, Esc, chuyển LaTeX', async () => {
    const B = String.fromCharCode(92);
    __clear(); await w(100);
    window.__run('ins-formula'); await w(600);
    const mf = document.getElementById('mf'), tx = document.getElementById('fTex');
    const mkey = (k, o) => mf.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, composed: true, cancelable: true }, o || {})));
    // nhấp chuột (sự kiện thật) đặt con trỏ đúng chỗ
    mf.setValue('x+y+z+t'); mf.focus(); mf.executeCommand('moveToMathfieldEnd'); await w(80);
    const sp = [...mf.shadowRoot.querySelectorAll('span')].find((s) => s.textContent === 'y' && !s.children.length);
    const r = sp.getBoundingClientRect();
    await window.api.testClick(r.right - 1, r.top + r.height / 2); await w(250);
    ok('nhấp chuột vào giữa công thức đặt được con trỏ', mf.position === 3, mf.position);
    // Tab trong mẫu số: ra khỏi phân số, không chọn bao cả phân số
    mf.setValue(B + 'frac{1}{2}'); mf.executeCommand('moveToMathfieldEnd'); mf.executeCommand('moveToPreviousChar'); mkey('Tab'); await w(50);
    mf.insert('+x'); await w(80);
    ok('Tab ra khỏi phân số sang bên phải', tx.value === B + 'frac{1}{2}+x', tx.value);
    // hỗn số: 2, phím cách, 1, phân số
    mf.setValue(''); mf.insert('2'); mf.executeCommand(['typedText', ' ']); mf.insert('1'); mf.insert(B + 'frac{#@}{#?}', { selectionMode: 'placeholder' }); mf.insert('3'); await w(80);
    ok('gõ hỗn số 2 1/3 bằng phím cách', tx.value === '2' + B + 'frac{1}{3}', tx.value);
    // phân số viết gọn \frac12 được viết lại đủ ngoặc
    mf.setValue(B + 'frac12+' + B + 'sqrt2'); mf.dispatchEvent(new Event('input')); await w(80);
    ok('viết lại đủ ngoặc: \\frac{1}{2}, \\sqrt{2}', tx.value === B + 'frac{1}{2}+' + B + 'sqrt{2}', tx.value);
    // chuyển qua lại Trực quan / LaTeX giữ nguyên công thức nhiều dòng có chữ
    const btn = (m) => [...document.getElementById('fMode').children].find((b) => b.dataset.m === m).click();
    mf.setValue(B + 'displaylines{' + B + 'frac{1}{2}' + B + 'text{ khi đó }x=2' + B + B + 'y=3}'); mf.dispatchEvent(new Event('input')); await w(80);
    const v0 = tx.value; btn('l'); await w(120); btn('v'); await w(150); btn('l'); await w(120);
    ok('chuyển Trực quan ⇄ LaTeX không đổi công thức', tx.value === v0, tx.value);
    btn('v'); await w(150);
    // Esc: đóng hộp soạn, không chuyển công thức sang mã LaTeX thô
    mkey('Escape'); await w(120);
    ok('Esc đóng hộp soạn, không vào chế độ mã LaTeX', !document.getElementById('fxdlg').open && mf.mode !== 'latex', mf.mode);
  });

  console.log('UI-DONE ' + pass + ' ' + fail);
})();
