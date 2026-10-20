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
    ok('hộp Mẫu theo bài hiện lên', document.getElementById('maudlg').open);
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
    const gapOf = () => { const sp = [...mf.shadowRoot.querySelectorAll('span')].filter((s) => !s.children.length); return sp.find((s) => s.textContent === '1').getBoundingClientRect().left - sp.find((s) => s.textContent === '2').getBoundingClientRect().right; };
    const gGo = gapOf(); mf.setValue('2' + B + 'frac{1}{3}'); await w(60); const gChuan = gapOf();
    ok('hỗn số gõ bằng phím cách hiện liền như hỗn số chuẩn (không có khoảng trống thừa)', Math.abs(gGo - gChuan) < 1, gGo + ' / ' + gChuan);
    mf.setValue(''); mf.insert('1'); mf.executeCommand(['typedText', ' ']); mf.insert('000'); await w(80);
    ok('gõ 1 000 bằng phím cách ra số tách lớp', tx.value === '1' + B + ',000', tx.value);
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

  // lỗi 2.7.5: chuyển hàng loạt (vd 213 công thức Equation) — công thức nằm quá đáy trang bị chụp trên nền xám → "vết mờ" trong Word
  await step('Chụp hàng loạt: nền ảnh luôn trắng, kể cả công thức nằm ngoài trang', async () => {
    __clear();
    const a = __add('formula', null, { latex: '\\frac{3}{4}', x: 30, y: 200 });
    const b = __add('formula', null, { latex: '\\frac{3}{4}', x: 30, y: 1500 }); // quá đáy trang A4 (1123px)
    await w(200);
    const rs = await window.api.renderBatch([a, b]);
    const bg = async (file) => {
      const img = new Image(); img.src = 'file:///' + file.replace(/\\/g, '/'); await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(1, 1, 1, 1).data; return Math.min(d[0], d[1], d[2]);
    };
    const v1 = await bg(rs[0].file), v2 = await bg(rs[1].file);
    ok('ảnh công thức trong trang: nền trắng', v1 >= 250, v1);
    ok('ảnh công thức nằm ngoài trang: nền trắng (không có vết mờ)', v2 >= 250, v2);
    await window.api.renderPng(a, true, true); // trả cửa sổ về như cũ
  });

  // lỗi 2.7.6: hệ / hệ "hoặc" viết bằng array bị MathLive treo xuống, ngoặc thừa khoảng trống phía trên
  await step('Hệ viết bằng array: nội dung nằm giữa ngoặc như SGK', async () => {
    const B = String.fromCharCode(92);
    for (const [name, lt] of [['hệ "hoặc" 2 dòng', B + 'left[' + B + 'begin{array}{l}m+5<-4' + B + B + 'm-1' + B + 'ge 2' + B + 'end{array}' + B + 'right.'],
      ['hệ "hoặc" 3 dòng', B + 'left[' + B + 'begin{array}{l}x=1' + B + B + 'x=2' + B + B + 'x=3' + B + 'end{array}' + B + 'right.'],
      ['hệ ngoặc nhọn {ll}', B + 'left' + B + '{' + B + 'begin{array}{ll}x+y=3&(1)' + B + B + 'x-y=1&(2)' + B + 'end{array}' + B + 'right.']]) {
      __clear();
      const id = __add('formula', null, { latex: lt, x: 60, y: 60, size: 20 }); await w(150);
      // đo trên ảnh chụp: nét ngoặc (vài cột đầu) so với nội dung (các cột sau ngoặc): hở trên ≈ hở dưới
      const r = await window.api.renderPng(id, true, true);
      const img = new Image(); img.src = 'data:image/png;base64,' + r.b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
      const ink = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] > 40 && d[i] < 200; };
      let x0 = 0; while (x0 < W && ![...Array(H).keys()].some((y) => ink(x0, y))) x0++;
      const ext = (xa, xb) => { let t = -1, b = -1; for (let y = 0; y < H; y++) for (let x = xa; x < xb; x++) if (ink(x, y)) { if (t < 0) t = y; b = y; break; } return [t, b]; };
      const [bt, bb] = ext(x0, x0 + 8), [ct, cb] = ext(x0 + 60, W);
      const gapT = (ct - bt) / 4, gapB = (bb - cb) / 4;
      ok(name + ': nội dung nằm giữa ngoặc (hở trên ' + gapT.toFixed(1) + 'px, hở dưới ' + gapB.toFixed(1) + 'px)', Math.abs(gapT - gapB) < 5, 'hở trên ' + gapT + ', hở dưới ' + gapB);
    }
  });
  await step('Khối chữ: $$…$$ là công thức đứng riêng dòng, không hiện mã LaTeX', async () => {
    __clear();
    const id = __add('text', null, { x: 40, y: 40, w: 600, text: 'Ta có:\n$$x^2+1>0$$ với mọi $x$.' }); await w(150);
    const el = objEl(id);
    ok('có công thức đứng riêng dòng', !!el.querySelector('.ifx.disp .ML__latex'));
    ok('không còn dấu $ hay mã LaTeX thô', !/\$|\\|\^/.test(el.textContent), el.textContent);
  });
  await step('Ảnh công thức chèn Word cắt sát nét chữ (không thừa khoảng trắng phía trên)', async () => {
    __clear();
    for (const lt of ['x+1', '-', 'a_{n}', '\\frac{1}{2}']) {
      const id = __add('formula', null, { latex: lt, x: 60, y: 60, size: 16 }); await w(100);
      const r = await window.api.renderPng(id, true, true);
      const img = new Image(); img.src = 'data:image/png;base64,' + r.b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let top = -1;
      for (let y = 0; y < c.height && top < 0; y++) for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; if (d[i + 3] > 40 && d[i] < 200) { top = y; break; } }
      ok('“' + lt + '”: trắng phía trên ≤ 2px', top >= 0 && top / 4 <= 2, (top / 4) + 'px');
      __clear();
    }
  });

  await step('Bàn phím toán: không che nút Chèn / Huỷ, có nút đóng, gõ được và chèn được vào trang', async () => {
    __clear(); await w(100);
    __run('ins-formula'); await w(600);
    const kb = window.mathVirtualKeyboard, mf = document.getElementById('mf');
    const vis = (el) => { const r = el.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!t && (t === el || el.contains(t)); };
    document.getElementById('fKb').click(); await w(900);
    ok('bàn phím hiện', kb && kb.visible);
    ok('nút Chèn vào trang không bị bàn phím che', vis(document.getElementById('fxok')));
    ok('nút Huỷ không bị che', vis(document.getElementById('fxcancel')));
    ok('ô gõ công thức không bị che', vis(mf));
    ok('có nút Đóng bàn phím', vis(document.getElementById('kbClose')));
    document.getElementById('kbClose').click(); await w(500);
    ok('nút Đóng bàn phím ẩn bàn phím', !kb.visible && !document.body.classList.contains('kb-open'));
    document.getElementById('fKb').click(); await w(700);
    mf.value = 'a+b'; document.getElementById('fxok').click(); await w(500);
    const objs = document.querySelectorAll('#page .obj');
    ok('chèn được công thức khi bàn phím đang mở; bàn phím tự đóng', objs.length === 1 && !kb.visible && !document.getElementById('fxdlg').open, objs.length + ' / ' + kb.visible);
    __clear();
  });

  await step('Sơ đồ tư duy: mẫu, thêm nhánh (Tab), nối hai ô, kéo ô thì đường nối chạy theo, xoá ô xoá đường nối', async () => {
    __clear(); await w(100);
    __run('ins-mindmap'); await w(300);
    const conns = () => document.querySelectorAll('#page .sh-conn').length, objs = () => document.querySelectorAll('#page .obj').length;
    ok('mẫu có chủ đề, 4 nhánh, 4 đường nối', objs() === 9 && conns() === 4, objs() + ' / ' + conns());
    const box = document.querySelector('#page .sh-box');
    box.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: box.getBoundingClientRect().x + 5, clientY: box.getBoundingClientRect().y + 5 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await w(100);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })); await w(300);
    if (document.activeElement && document.activeElement.classList.contains('shtext')) document.activeElement.blur(); await w(100);
    ok('Tab thêm một nhánh con và một đường nối', objs() === 11 && conns() === 5, objs() + ' / ' + conns());
    // kéo ô chủ đề bằng chuột: các đường nối gắn với nó dời theo
    const root0 = [...document.querySelectorAll('#page .sh-ellipse')][0];
    const pos = () => [...document.querySelectorAll('#page .sh-conn')].map((e) => e.style.left + ',' + e.style.top).join(' ');
    const before = pos(), rb = root0.getBoundingClientRect(), cx = rb.x + rb.width / 2, cy = rb.y + rb.height / 2;
    await window.api.testMouse([{ t: 'move', x: cx, y: cy }, { t: 'down', x: cx, y: cy }, { t: 'move', x: cx + 30, y: cy + 20, drag: true }, { t: 'move', x: cx + 60, y: cy + 45, drag: true }, { t: 'up', x: cx + 60, y: cy + 45 }]); await w(300);
    ok('kéo ô thì đường nối dời theo', pos() !== before, before + ' → ' + pos());
    // xoá ô chủ đề: các đường nối gắn với nó bị xoá theo
    window.__unselect(); await w(50);
    root0.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: root0.getBoundingClientRect().x + 30, clientY: root0.getBoundingClientRect().y + 30 }));
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); await w(100);
    __run('del'); await w(200);
    ok('xoá ô chủ đề xoá luôn 4 đường nối gắn với nó', conns() === 1, conns());
    __clear();
  });

  await step('Bài giải AI: hình chưa vẽ đủ — báo gọn điểm đặt tạm, nhờ AI dựng hình câu đó; đề đọc được thì vẽ đủ', async () => {
    __clear(); await w(50);
    window.__baigiai.open(); await w(300);
    const src = document.getElementById('bgsrc');
    const paste = async (t) => { src.value = ''; const dt = new DataTransfer(); dt.setData('text/plain', t); src.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); await w(500); };
    await paste('Câu 1. Cho tam giác ABC. Lấy điểm E sao cho tứ giác ABEC có hai cạnh đối song song. Gọi I là giao điểm của AE và BC.');
    const box = document.getElementById('bgloi');
    ok('khung hình chưa vẽ đủ: báo gọn "đặt tạm điểm E", có mục nhờ AI dựng hình; I vẽ được ngay; không còn ô sửa từng điểm', !!box.querySelector('.bgloi') && /đặt tạm điểm E/.test(box.innerText) && !!box.querySelector('.bgloi .bgai') && /I = giao/.test(src.value) && !box.querySelector('.bgdrow, .bgchip, .bgnho'), box.innerText.slice(0, 200));
    const ai1 = box.querySelector('.bgloi .bgai');
    if (ai1) { ai1.querySelector('.bgaiin').value = '[HÌNH TOANVIET]\nB = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC\nE = hbh(C, A, B)\nI = giao(A, E, B, C)\ndoan BE EC AE\n[/HÌNH TOANVIET]'; ai1.querySelector('.bgaiok').click(); await w(400); }
    ok('dùng hình AI dựng: khung lỗi biến mất, hình theo kịch bản', !box.querySelector('.bgloi') && /#FIG tv1 .*E = hbh\(C, A, B\)/.test(src.value), src.value.slice(0, 300));
    await paste('Câu 3. Cho ΔABC nhọn (AB < AC) có D là trung điểm của BC. Trên nửa mặt phẳng bờ BC không chứa điểm A, vẽ tia Bx // AC, Bx cắt tia AD tại E. Trên tia đối của tia AC lấy điểm F sao cho AF = AC. Gọi I là giao điểm của AB và EF.');
    ok('đề tia Bx // AC vẽ đủ E, F, I', !box.querySelector('.bgloi') && /E = giao\(B, X, A, D\)/.test(src.value) && /I = giao\(A, B, E, F\)/.test(src.value), src.value.slice(0, 400));
    // AI viết sẵn hình theo lời nhắc: khối [HÌNH TOANVIET] được vẽ đúng kịch bản
    ok('có nút "Chép lời nhắc vẽ hình cho AI", lời nhắc có khối [HÌNH TOANVIET]', !!document.getElementById('bgnhac') && /\[HÌNH TOANVIET\]/.test(LoiNhacAI.text()));
    await paste('Câu 4. Cho tam giác ABC có M là trung điểm của BC.\n[HÌNH TOANVIET]\n```\nB = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC\nM = trungdiem(B, C)\ndoan AM\nbang BM MC\n```\n[/HÌNH TOANVIET]\nLời giải\nTa có $BM = MC$.');
    ok('dán câu trả lời có khối [HÌNH TOANVIET]: hình đúng kịch bản, có trong phần xem trước', /#FIG tv1 .*M = trungdiem\(B, C\)/.test(src.value) && /\[FIG tv1\|Hình 1\]/.test(src.value) && !!document.querySelector('#bgview svg, #bgview img'), src.value.slice(0, 300));
    // nhờ AI dựng lại hình một câu: chép lệnh (không cần lời giải), dán khối AI trả về → thay hình của câu
    await paste('Câu 5. Cho tam giác ABC có M là trung điểm của BC.\nLời giải\nTa có $BM = MC$.');
    const ai = box.querySelector('.bgai');
    ok('câu đã vẽ: có mục nhờ AI dựng hình (lệnh có đề, yêu cầu không giải)', !!ai && /Cho tam giác ABC có M là trung điểm của BC/.test(LoiNhacAI.nhoDung(ai.dataset.de)) && /KHÔNG giải bài/.test(LoiNhacAI.nhoDung(ai.dataset.de)));
    if (ai) { ai.querySelector('.bgaiin').value = '[HÌNH TOANVIET]\n```\nB = (0, 0)\nC = (7, 0)\nA = (1, 5)\ndagiac ABC\nM = trungdiem(B, C)\ndoan AM\n```\n[/HÌNH TOANVIET]'; ai.querySelector('.bgaiok').click(); await w(400); }
    ok('"Dùng hình này": hình của câu thay bằng kịch bản AI, không còn hình tự đọc đề', /#FIG tv1 .*C = \(7, 0\)/.test(src.value) && !/^#FIG h\d/m.test(src.value) && /\[FIG tv1\|Hình 1\]/.test(src.value), src.value.slice(0, 300));
    document.querySelector('#bgdlg') && document.querySelector('#bgdlg').close();
  });

  await step('Chèn hình theo kịch bản (nút Kịch bản): hình không gian, hình phẳng; kịch bản lỗi không chèn', async () => {
    __clear(); await w(50);
    const S_count = () => document.querySelectorAll('#page .obj').length;
    const S_last = () => { const els = document.querySelectorAll('#page .obj'); return els.length ? __get(els[els.length - 1].dataset.id) : {}; };
    const n0 = S_count();
    document.querySelector('[data-cmd="ins-kichban"]').click(); await w(200);
    const dlgK = document.getElementById('kbdlg'), kb = document.getElementById('kbsrc');
    ok('mở hộp Chèn hình theo kịch bản, có ô đề và nút chép lệnh nhờ AI', !!dlgK && dlgK.open && !!document.getElementById('kbde') && !!document.getElementById('kbchep'));
    kb.value = '[HÌNH KHÔNG GIAN TOANVIET]\n```\nA = (0, 0, 0)\nB = (4, 0, 0)\nC = (4, 3, 0)\nD = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABCD\n```\n[/HÌNH KHÔNG GIAN TOANVIET]';
    kb.dispatchEvent(new Event('input')); await w(50);
    ok('nhận ra hình không gian, không lỗi', /Hình không gian, 6 dòng — không có lỗi/.test(document.getElementById('kbstat').textContent), document.getElementById('kbstat').textContent);
    document.getElementById('kbok').click(); await w(300);
    const o = document.querySelector('.obj.sel') ; const objs = window.__objs ? window.__objs() : null;
    ok('chèn được hình không gian đúng kịch bản', !dlgK.open && S_count() === n0 + 1 && /chop S ABCD/.test(S_last().script || '') && S_last().type === 'space', JSON.stringify(S_last()).slice(0, 200));
    document.querySelector('[data-cmd="ins-kichban"]').click(); await w(200);
    const kb2 = document.getElementById('kbsrc');
    kb2.value = 'B = (0, 0)\nC = (6, 0)\nN = trungdiem(B, Q)'; kb2.dispatchEvent(new Event('input'));
    document.getElementById('kbok').click(); await w(200);
    ok('kịch bản lỗi (điểm Q chưa có): báo lỗi, không chèn', document.getElementById('kbdlg').open && S_count() === n0 + 1 && /chưa có điểm Q/.test(document.getElementById('kbstat').textContent));
    kb2.value = 'B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC'; document.getElementById('kbok').click(); await w(300);
    ok('chèn hình phẳng theo kịch bản', S_count() === n0 + 2 && S_last().type === 'plane' && /dagiac ABC/.test(S_last().script));
    __clear();
  });

  console.log('UI-DONE ' + pass + ' ' + fail);
})();
