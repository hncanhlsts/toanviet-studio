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
    ok('ghi chú những gì đã chuẩn hoá', /Đã chuẩn hoá/.test(document.getElementById('bgnotes').textContent));
    ok('xem trước có công thức', document.querySelectorAll('#bgview .bgf .ML__latex').length > 5);
    document.getElementById('bgtitle').value = 'Lời giải thử';
    const r = await window.__baigiai.make(src.value);
    ok('tạo tệp Word', r && r.ok, JSON.stringify(r));
    console.log('BG-KQ ' + JSON.stringify(r));
    ok('trang soạn thảo của người dùng được trả lại nguyên vẹn', document.querySelectorAll('#page .obj').length === before, document.querySelectorAll('#page .obj').length);
  } catch (e) { console.log('BG: ✘ lỗi ' + e.message + ' ' + e.stack); }
  console.log('BG-XONG');
})();
