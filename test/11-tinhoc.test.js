// Môn Tin học: mã nguồn, sơ đồ khối thuật toán, khối lệnh Scratch (src/tinhoc.js)
nhom('Môn Tin học: mã nguồn, sơ đồ khối, khối lệnh Scratch (tinhoc.js)');

thu('mọi mẫu Tin học dựng được, không lỗi', () => {
  Object.keys(TinHoc.KINDS).forEach((k) => {
    const d = TinHoc.KINDS[k][1];
    const r = TinHoc.render(Object.assign({ kind: k }, d), d.w, d.h);
    dung(!r.errors.length, k + ' có lỗi: ' + r.errors.join('; '));
    dung(r.svg.length > 50, k + ' chuỗi SVG quá ngắn');
    // Kiểm tra tính hợp lệ XML của chuỗi SVG sinh ra
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + r.svg + '</svg>', 'image/svg+xml');
    const pe = doc.querySelector('parsererror');
    if (pe) throw new Error(k + ' tạo ra SVG lỗi cú pháp XML: ' + pe.textContent.replace(/\s+/g, ' ').slice(0, 160));
  });
});

thu('mã nguồn: Python, C++, Pascal, SQL, mã giả tô màu đúng từ khoá', () => {
  const pyToks = TinHoc.codeTokens('for i in range(1, 10): print(i)', 'python', {});
  dung(pyToks.some(([t, k]) => t === 'for' && k === 'kw'), 'Python for keyword');
  dung(pyToks.some(([t, k]) => t === 'print' && k === 'ty'), 'Python print built-in');

  const cppToks = TinHoc.codeTokens('#include <iostream>', 'cpp', {});
  dung(cppToks.some(([t, k]) => t.startsWith('#include') && k === 'pre'), 'C++ #include');
  const cppToks2 = TinHoc.codeTokens('int main() { return 0; }', 'cpp', {});
  dung(cppToks2.some(([t, k]) => t === 'int' && k === 'ty'), 'C++ int type');

  const pasToks = TinHoc.codeTokens('program TinhTong; begin end.', 'pascal', {});
  dung(pasToks.some(([t, k]) => t.toLowerCase() === 'program' && k === 'kw'), 'Pascal program');

  const sqlToks = TinHoc.codeTokens('SELECT * FROM HocSinh WHERE Diem >= 8;', 'sql', {});
  dung(sqlToks.some(([t, k]) => t.toUpperCase() === 'SELECT' && k === 'kw'), 'SQL SELECT');

  const psToks = TinHoc.codeTokens('Bước 1: Nhập n\nBước 2: Nếu n > 0 thì in n', 'pseudo', {});
  dung(psToks.some(([t, k]) => t.toLowerCase() === 'nhập' && k === 'kw'), 'Mã giả Nhập');
  dung(psToks.some(([t, k]) => t.toLowerCase() === 'nếu' && k === 'kw'), 'Mã giả Nếu');
});

thu('sơ đồ khối: tự sinh từ Python (tuần tự, rẽ nhánh if-else, vòng lặp while/for)', () => {
  // Tuần tự
  const f1 = TinHoc.flowFromPython('a = int(input())\nb = int(input())\ns = a + b\nprint(s)');
  dung(f1.nodes.some((n) => n.k === 'start'), 'có start');
  dung(f1.nodes.some((n) => n.k === 'end'), 'có end');
  dung(f1.nodes.filter((n) => n.k === 'io').length >= 3, 'có đủ các khối nhập và xuất');
  dung(f1.nodes.some((n) => n.k === 'proc'), 'có khối xử lý phép gán');

  // Rẽ nhánh if - else
  const f2 = TinHoc.flowFromPython('x = int(input())\nif x > 0:\n    print("Dương")\nelse:\n    print("Âm")');
  dung(f2.nodes.some((n) => n.k === 'cond'), 'có khối điều kiện hình thoi');
  dung(f2.edges.some((e) => e.t === 'Đúng') && f2.edges.some((e) => e.t === 'Sai'), 'có hai nhánh Đúng và Sai');

  // Vòng lặp while
  const f3 = TinHoc.flowFromPython('s = 0\ni = 1\nwhile i <= n:\n    s = s + i\n    i = i + 1\nprint(s)');
  dung(f3.nodes.some((n) => n.k === 'cond'), 'while có khối điều kiện');
  dung(f3.edges.some((e) => e.side === 'l'), 'có đường rẽ nhánh lặp vòng lên');
});

thu('khối Scratch: nhận diện song ngữ (tiếng Anh & tiếng Việt) và render không lỗi', () => {
  const enScript = 'when flag clicked\nrepeat (10)\n  move (10) steps\nend\nsay [Xin chào!]';
  const rEn = TinHoc.render({ ve: 'scratch', src: enScript }, 360, 240);
  dung(!rEn.errors.length, 'Scratch tiếng Anh: ' + rEn.errors.join('; '));

  const viScript = 'khi bấm vào cờ xanh\nlặp lại (10)\n  di chuyển (10) bước\nkết thúc\nnói [Xin chào!]';
  const rVi = TinHoc.render({ ve: 'scratch', src: viScript }, 360, 240);
  dung(!rVi.errors.length, 'Scratch tiếng Việt: ' + rVi.errors.join('; '));

  // Kiểm tra SVG hợp lệ và dùng chuẩn scratchblocks scratch.mit.edu
  dung(/sb3-|scratchblocks/.test(rVi.svg), 'Scratch dùng chuẩn scratchblocks scratch.mit.edu');
  const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + rVi.svg + '</svg>', 'image/svg+xml');
  dung(!doc.querySelector('parsererror'), 'Scratch SVG không có lỗi XML');
});
