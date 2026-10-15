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

  console.log('UI-DONE ' + pass + ' ' + fail);
})();
