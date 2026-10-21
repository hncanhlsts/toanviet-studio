// Lời nhắc vẽ hình cho AI (src/loi-nhac-ai.js) và khối [HÌNH TOANVIET] trong Bài giải AI (src/baigiai-chuyen.js)
nhom('Lời nhắc vẽ hình cho AI, khối mã toanviet (và dạng cũ [HÌNH TOANVIET])');
thu('mọi kịch bản ví dụ trong lời nhắc (phẳng và không gian) dựng không lỗi', () => {
  const ks = BaiGiai.docKhoi(LoiNhacAI.text());
  dung(ks.filter((k) => k.type === 'plane').length >= 4 && ks.filter((k) => k.type === 'space').length >= 1, 'số ví dụ: ' + ks.map((k) => k.type).join());
  ks.forEach((k) => { const e = BaiGiai.loiKhoi(k); dung(!e.length, e.join('; ')); });
});
thu('lệnh nhờ AI chỉ dựng hình: có lời nhắc, đề bài, yêu cầu không giải', () => {
  const t = LoiNhacAI.nhoDung('Cho tam giác ABC có M là trung điểm BC.');
  dung(/```toanviet\n/.test(t) && /không tự vẽ hình/.test(t) && /KHÔNG giải bài/.test(t) && /Cho tam giác ABC có M là trung điểm BC\.\s*$/.test(t), t.slice(-300));
});
thu('đọc khối từ câu trả lời AI: thẻ không gian, kịch bản không có thẻ (toạ độ ba số → không gian), chữ thường không phải kịch bản', () => {
  bang(BaiGiai.docKhoi('[HÌNH KHÔNG GIAN TOANVIET]\nA = (0, 0, 0)\nB = (4, 0, 0)\nC = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABC\n[/HÌNH KHÔNG GIAN TOANVIET]')[0].type, 'space');
  bang(BaiGiai.docKhoi('A = (0, 0, 0)\nB = (4, 0, 0)\nC = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABC')[0].type, 'space');
  bang(BaiGiai.docKhoi('B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC')[0].type, 'plane');
  bang(BaiGiai.docKhoi('xin chào thầy').length, 0);
});
thu('ví dụ tia Bx // AC: đúng quan hệ của đề (song song, D nằm giữa A và E, AF = AC, I trên AB và EF)', () => {
  const P = Plane.points(BaiGiai.docKhoi(LoiNhacAI.text())[0].script);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], cr = (u, v) => u[0] * v[1] - u[1] * v[0], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  dung(Math.abs(cr(sub(P.E, P.B), sub(P.C, P.A))) < 1e-9, 'BE // AC');
  dung(Math.abs(d(P.A, P.D) + d(P.D, P.E) - d(P.A, P.E)) < 1e-9, 'D nằm giữa A và E');
  dung(Math.abs(d(P.A, P.F) - d(P.A, P.C)) < 1e-9 && Math.abs(d(P.F, P.A) + d(P.A, P.C) - d(P.F, P.C)) < 1e-9, 'F trên tia đối, AF = AC');
  dung(Math.abs(cr(sub(P.I, P.A), sub(P.B, P.A))) < 1e-9 && Math.abs(cr(sub(P.I, P.E), sub(P.F, P.E))) < 1e-9, 'I = AB ∩ EF');
});
thu('khối [HÌNH TOANVIET] (có hoặc không có ```) thành hình đúng kịch bản, đánh số Hình 1, 2; dựng lại không đổi', () => {
  const md = 'Câu 1. Cho tam giác ABC có M là trung điểm BC.\n\n[HÌNH TOANVIET]\n```\nB = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC\nM = trungdiem(B, C)\ndoan AM\n```\n[/HÌNH TOANVIET]\n\nLời giải\nTa có $BM = MC$.\n\nCâu 2. Cho tam giác MNP.\n[HÌNH TOANVIET]\nN = (0, 0)\nP = (5, 0)\nM = (1, 3)\ndagiac MNP\n[/HÌNH TOANVIET]';
  const r = BaiGiai.fromText(md), f = BaiGiai.figures(r.markup);
  dung(/^#FIG tv1 .*M = trungdiem\(B, C\)/m.test(f.markup) && /\[FIG tv1\|Hình 1\]/.test(f.markup) && /\[FIG tv2\|Hình 2\]/.test(f.markup), f.markup);
  dung(!/^#FIG h\d/m.test(f.markup), 'không đọc đề vẽ thêm hình khác');
  bang(f.loi.filter((L) => L.loiKB).length, 0);
  bang(BaiGiai.figures(f.markup).markup, f.markup);
});
thu('khối mã ```toanviet (nhiều câu, không gian), kịch bản bị dồn một dòng (Copilot), chỉ Copy khối mã; khối mã python không phải hình', () => {
  const k = BaiGiai.khoiCau('Câu 1.\n```toanviet\nB = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC\n```\nCâu 2.\n```toanviet-khonggian\nA = (0, 0, 0)\nB = (4, 0, 0)\nC = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABC\n```');
  dung(k.length === 2 && k[0].so === '1' && k[0].sp.type === 'plane' && k[1].so === '2' && k[1].sp.type === 'space', JSON.stringify(k.map((x) => [x.so, x.sp.type])));
  // chuỗi thầy chép từ Copilot (20/10/2026): rác công thức + kịch bản dồn một dòng, chữ Ì tách dấu
  const cp = BaiGiai.docKhoi('HÌNHTOANVIET]‘‘‘‘A=(0,0)B=(8,0)M=chia(A,B,0.3)‘‘‘[/HÌNHTOANVIET]‘‘‘‘HÌNH TOANVIET] ```` A = (0, 0) B = (8, 0) M = chia(A, B, 0.3) N = chia(A, B, 0.7) O = trungdiem(A, B) O1 = trungdiem(A, M) duongtron O A duongtron O1 A doan AB diem A B M N ``` [/HÌNH TOANVIET] ````');
  dung(cp.length === 1 && !BaiGiai.loiKhoi(cp[0]).length && cp[0].script.split('\n').length === 10, JSON.stringify(cp.map((x) => x.script)));
  const mot = BaiGiai.docKhoi('```toanviet A = (0, 0) B = (6, 0) C = (2, 3) dagiac ABC nhan C = x goc BAC = 60^{\\circ} ```')[0];
  bang(mot.script, 'A = (0, 0)\nB = (6, 0)\nC = (2, 3)\ndagiac ABC\nnhan C = x\ngoc BAC = 60^{\\circ}');
  bang(BaiGiai.docKhoi('A = (0, 0)\nB = (10, 0)\nO = trungdiem(A, B)\nduongtron O A\ndoan AB')[0].type, 'plane');
  bang(BaiGiai.docKhoi('```python\nx = (1, 2)\nprint(x)\n```').length, 0);
  const h = BaiGiai.fromText(BaiGiai.fromHtml('<p>Câu 1. Cho tam giác ABC.</p><pre><div>toanviet</div><code class="language-toanviet">B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC</code></pre>')).markup;
  dung(/^#FIG tv1 .*dagiac ABC/m.test(h), h);
});
thu('kịch bản AI viết sai: báo dòng lỗi', () => {
  const r = BaiGiai.fromText('Câu 1. Cho tam giác MNP.\n[HÌNH TOANVIET]\nM = (0, 0)\nN = trungdiem(M, Q)\n[/HÌNH TOANVIET]');
  const f = BaiGiai.figures(r.markup), L = f.loi.find((x) => x.loiKB);
  dung(L && /chưa có điểm Q/.test(L.loiKB), JSON.stringify(f.loi));
});
thu('dán HTML từ trang AI: khối mã <pre> giữ xuống dòng, bỏ thanh tên ngôn ngữ', () => {
  const html = '<p>Câu 1. Cho tam giác ABC.</p><p>[HÌNH TOANVIET]</p><pre><div>plaintext</div><code>B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC</code></pre><p>[/HÌNH TOANVIET]</p>';
  const f = BaiGiai.figures(BaiGiai.fromText(BaiGiai.fromHtml(html)).markup);
  const m = /^#FIG tv1 (\{.*\})$/m.exec(f.markup);
  bang(m && JSON.parse(m[1]).script, "B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC");
});
thu('kịch bản AI viết tên điểm cách nhau (goc C1 A A2, doan A B, dagiac A B C), dấu °, dấu trừ Unicode: dựng được', () => {
  bang(Plane.loi('A = (0, 0)\nB = (4, −1)\nC = (2, 3)\ndoan A B\ndagiac A B C\ngoc B A C = 40°\nvuong A B C\nbang A B A C').join(), '');
  // kịch bản thầy gửi 21/10/2026 (AI viết "goc C1 A A2 = 65^\circ")
  const kb = 'A = (0, 3)\nB = (-1.5, 0)\nC = (3, 3)\nA1 = (-3, 3)\nA2 = (5, 3)\nB1 = (-4.5, 0)\nB2 = (3.5, 0)\nduongthang A1A2\nduongthang B1B2\nnhan A1 = a\nnhan B1 = b\nan A2 B2\nC1 = chia(A, B, -0.6)\nC2 = chia(A, B, 1.6)\nduongthang C1C2\nnhan C1 = c\nan C2\nD = chan(C, B1, B2)\nD1 = chia(C, D, -0.4)\nD2 = chia(C, D, 1.4)\nduongthang D1D2\nnhan D1 = d\nan D2\nvuong ACD\ngoc C1 A A2 = 65^\circ\ngoc A B B2 = 65^\circ\ndiem A B C D\nnhan A = A_1\nnhan B = B_1';
  bang(Plane.loi(kb).join(), '');
  const sp = BaiGiai.docKhoi('1. A = (0, 0)\n2. B = (6, 0)\n3. C\_1 = (2, 3)\n- dagiac A B C\_1;\n- goc B A C\_1 = 40°')[0];
  dung(sp && !BaiGiai.loiKhoi(sp).length, JSON.stringify(sp));
});
thu('bảng "Từ ngữ chỉ vị trí" trong lời nhắc: mọi phép dựng đều chạy được', () => {
  const t = LoiNhacAI.text(), sec = t.slice(t.indexOf('## 4b.'), t.indexOf('## 4c.'));
  const goc = 'A = (0, 0)\nB = (6, 0)\nC = (2, 4)\nO = (0, 0)\nX = (6, 0)\nY = (2, 5)\nr = 3\nA1 = (-5, 2)\nA2 = (5, 2)\n';
  const dong = sec.split('\n').filter((l) => /^\| .* \| .*= .* \|$/.test(l)).map((l) => l.split('|')[2].trim());
  dung(dong.length >= 14, 'số dòng bảng: ' + dong.length);
  dong.forEach((d) => { const kb = d.split(/ rồi | ; | — | hoặc /)[0].replace(/^tia Ox: /, '').replace(/\s+\([^)]*[à-ỹ][^)]*\)\s*$/, ''); /* bỏ ghi chú "(góc khác …)" */ const e = Plane.loi(goc + 'M = (1, 1)\n' + kb.replace(/\bH = /, 'H = ').replace(/^X = /, 'X9 = ').replace(/^D = /, 'D = ')); dung(!e.length, d + ' → ' + e.join('; ')); });
});
