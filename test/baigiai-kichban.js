// Kịch bản thử "Bài giải AI → Word" trong phần mềm thật: mở hộp thoại, dán HTML kiểu ChatGPT (test/baigiai-mau.html),
// tạo tệp Word (đường dẫn trong biến TVS_DOCX_OUT, không hỏi chỗ lưu). In "BG: …". Chạy: node test/baigiai-chay.js
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  const ok = (name, cond, info) => console.log('BG: ' + (cond ? '✔ ' : '✘ ') + name + (cond || !info ? '' : ': ' + info));
  try {
    __clear(); await w(100);
    __add('formula', null, { latex: 'a^2+b^2', x: 100, y: 100 }); await w(100);
    const before = document.querySelectorAll('#page .obj').length;
    window.__baigiai.open(); await w(300);
    const dlg = document.getElementById('bgdlg');
    ok('hộp thoại mở', dlg && dlg.open);
    const html = await (await fetch('../test/baigiai-mau.html')).text();
    const dt = new DataTransfer(); dt.setData('text/html', html); dt.setData('text/plain', 'chữ thường');
    const src = document.getElementById('bgsrc'); src.focus();
    src.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); await w(500);
    const v = src.value;
    console.log('BG-NOIDUNG\n' + v + '\nBG-HET');
    ok('lấy đúng mã LaTeX gốc từ HTML (không phải chữ hiển thị)', v.includes('$m<-9$') && !v.includes('A∩B'));
    ok('bỏ câu chào, câu kết của AI và [cite]', !/Chắc chắn|Hy vọng|Nếu bạn cần|cite/.test(v));
    ok('nhãn câu: "Câu 1." và "Câu 2."', /^#C Câu 1\.$/m.test(v) && /^#C Câu 2\.$/m.test(v), v.match(/^#C.*$/gm));
    ok('nhãn Lời giải', /^#G$/m.test(v));
    ok('công thức riêng dòng', /^\$\$.*\\Leftrightarrow.*\$\$$/m.test(v));
    ok('bảng', /^#TAB$/m.test(v) && /\|y'\|/.test(v));
    ok('ký hiệu SGK: [−4; 2), ∅, ⇔, Δ, đồng dạng, ⫽, góc, 1,5', v.includes('[-4;2)') && v.includes('\\varnothing') && v.includes('\\Leftrightarrow') && v.includes('\\Delta ABC\\dongdang') && v.includes('⫽') && v.includes('\\widehat{ABC}') && v.includes('1{,}5'));
    ok('ghi chú những gì đã chuẩn hoá', /Đã làm/.test(document.getElementById('bgnotes').textContent));
    ok('xem trước có công thức', document.querySelectorAll('#bgview .bgf .ML__latex').length > 5);
    document.getElementById('bgtitle').value = 'Lời giải thử';
    const r = await window.__baigiai.make(src.value);
    ok('tạo tệp Word', r && r.ok, JSON.stringify(r));
    console.log('BG-KQ ' + JSON.stringify(r));
    ok('trang soạn thảo của người dùng được trả lại nguyên vẹn', document.querySelectorAll('#page .obj').length === before, document.querySelectorAll('#page .obj').length);
    // bài miền nghiệm (chữ thường, có $…$): tự vẽ hình miền nghiệm khớp tên đỉnh, đường thẳng trong lời giải
    document.getElementById('bgclear').click(); await w(100);
    const txt = await (await fetch('../test/baigiai-mien-nghiem.txt')).text();
    const dt2 = new DataTransfer(); dt2.setData('text/plain', txt);
    src.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt2, bubbles: true, cancelable: true })); await w(800);
    const v2 = src.value;
    console.log('BG-NOIDUNG\n' + v2 + '\nBG-HET');
    const spec = JSON.parse((/^#FIG h1 (\{.*\})$/m.exec(v2) || [0, 'null'])[1]);
    ok('miền nghiệm: thêm hình', spec && spec.type === 'region', v2.slice(0, 200));
    ok('miền nghiệm: suy ra đúng hệ x + y ≥ 3, 2x − y ≤ 6, y ≤ 4, x ≥ 0', spec && spec.ineqs === 'x + y >= 3\n2x - y <= 6\ny <= 4\nx >= 0', spec && spec.ineqs);
    ok('miền nghiệm: tên đỉnh, đường thẳng theo lời giải', spec && /A\(0; 3\)/.test(spec.vnames) && /D\(3; 0\)/.test(spec.vnames) && spec.lnames.startsWith('d_{1}'));
    ok('hình đặt sau câu "Miền nghiệm…", có nhắc "(Hình 1)"', /kể cả bờ \(Hình 1\)\.\n\[FIG h1\|Hình 1\]/.test(v2));
    const pvFig = document.querySelector('#bgview .pv-fig svg');
    ok('xem trước có hình miền nghiệm', !!pvFig);
    const r2 = await window.__baigiai.make(src.value);
    ok('tạo tệp Word có hình', r2 && r2.ok && r2.missing.length === 0, JSON.stringify(r2));
    console.log('BG-KQ2 ' + JSON.stringify(r2));
    // trục số (phép toán trên tập hợp) và đồ thị hàm số
    document.getElementById('bgclear').click(); await w(100);
    const txt3 = await (await fetch('../test/baigiai-truc-so-do-thi.txt')).text();
    const dt3 = new DataTransfer(); dt3.setData('text/plain', txt3);
    src.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt3, bubbles: true, cancelable: true })); await w(800);
    const v3 = src.value;
    console.log('BG-NOIDUNG\n' + v3 + '\nBG-HET');
    const sp = {}; v3.split('\n').forEach((l) => { const m = /^#FIG (\S+) (\{.*\})$/.exec(l); if (m) sp[m[1]] = JSON.parse(m[2]); });
    const nl = Object.values(sp).find((s) => s.type === 'numline'), gr = Object.values(sp).find((s) => s.type === 'graph');
    ok('trục số: A, B và các phép ∪, ∩, \\, phần bù', nl && /A=\[-3;4\)/.test(nl.sets) && /A\\cup B/.test(nl.sets) && /A\\cap B/.test(nl.sets) && /A\\setminus B/.test(nl.sets) && /mathbb\{R\}\\setminus A/.test(nl.sets), nl && nl.sets);
    ok('đồ thị: hàm số và các điểm có tên nằm trên đồ thị', gr && gr.funcs === 'x^2-4x+3' && /I\(2; -1\)/.test(gr.points) && /C\(0; 3\)/.test(gr.points), gr && JSON.stringify(gr));
    ok('xem trước có 2 hình, không báo lỗi', document.querySelectorAll('#bgview .pv-fig svg').length === 2 && !document.querySelector('#bgview .pv-fig .bgerr'), document.getElementById('bgview').querySelectorAll('.pv-fig').length);
    const r3 = await window.__baigiai.make(src.value);
    ok('tạo tệp Word có trục số, đồ thị', r3 && r3.ok && r3.missing.length === 0, JSON.stringify(r3));
    // hình không gian: đọc từ đề, vẽ ngay đầu lời giải
    document.getElementById('bgclear').click(); await w(100);
    const txt4 = await (await fetch('../test/baigiai-khong-gian.txt')).text();
    const dt4 = new DataTransfer(); dt4.setData('text/plain', txt4);
    src.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt4, bubbles: true, cancelable: true })); await w(800);
    const v4 = src.value;
    console.log('BG-NOIDUNG\n' + v4 + '\nBG-HET');
    const sp4 = (/^#FIG \S+ (\{.*"type":"space".*\})$/m.exec(v4) || [])[1];
    const s4 = sp4 ? JSON.parse(sp4) : null;
    ok('hình không gian: đọc đúng đề (chóp, SA ⊥ đáy, M, N, O)', s4 && /chop S ABCD/.test(s4.script) && /M = trungdiem\(S, B\)/.test(s4.script) && /O = giao\(A, C, B, D\)/.test(s4.script), s4 && s4.script);
    ok('hình không gian đặt ngay đầu lời giải', /^#G\n\[FIG h\d+\|Hình \d+\]/m.test(v4), v4.slice(0, 300));
    ok('xem trước có hình không gian, không lỗi', !!document.querySelector('#bgview .pv-fig svg') && !document.querySelector('#bgview .pv-fig .bgerr'));
    const r4 = await window.__baigiai.make(src.value);
    ok('tạo tệp Word có hình không gian', r4 && r4.ok && r4.missing.length === 0, JSON.stringify(r4));
  } catch (e) { console.log('BG: ✘ lỗi ' + e.message + ' ' + e.stack); }
  console.log('BG-XONG');
})();
