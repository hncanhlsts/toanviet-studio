// Lời nhắc vẽ hình cho AI (src/loi-nhac-ai.js) và khối [HÌNH TOANVIET] trong Bài giải AI (src/baigiai-chuyen.js)
nhom('Lời nhắc vẽ hình cho AI, khối [HÌNH TOANVIET]');
const khoiTV = (s) => [...s.matchAll(/\[HÌNH TOANVIET\]([\s\S]*?)\[\/HÌNH TOANVIET\]/g)].map((m) => m[1].replace(/^\s*```.*$/gm, '').trim());
thu('mọi kịch bản ví dụ trong lời nhắc (phẳng và không gian) dựng không lỗi', () => {
  const ks = BaiGiai.docKhoi(LoiNhacAI.text());
  dung(ks.filter((k) => k.type === 'plane').length >= 4 && ks.filter((k) => k.type === 'space').length >= 1, 'số ví dụ: ' + ks.map((k) => k.type).join());
  ks.forEach((k) => { const e = BaiGiai.loiKhoi(k); dung(!e.length, e.join('; ')); });
});
thu('lệnh nhờ AI chỉ dựng hình: có lời nhắc, đề bài, yêu cầu không giải', () => {
  const t = LoiNhacAI.nhoDung('Cho tam giác ABC có M là trung điểm BC.');
  dung(/\[HÌNH TOANVIET\]/.test(t) && /KHÔNG giải bài/.test(t) && /Cho tam giác ABC có M là trung điểm BC\.\s*$/.test(t), t.slice(-300));
});
thu('đọc khối từ câu trả lời AI: thẻ không gian, kịch bản không có thẻ (toạ độ ba số → không gian), chữ thường không phải kịch bản', () => {
  bang(BaiGiai.docKhoi('[HÌNH KHÔNG GIAN TOANVIET]\nA = (0, 0, 0)\nB = (4, 0, 0)\nC = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABC\n[/HÌNH KHÔNG GIAN TOANVIET]')[0].type, 'space');
  bang(BaiGiai.docKhoi('A = (0, 0, 0)\nB = (4, 0, 0)\nC = (0, 3, 0)\nS = (0, 0, 4)\nchop S ABC')[0].type, 'space');
  bang(BaiGiai.docKhoi('B = (0, 0)\nC = (6, 0)\nA = (2, 4)\ndagiac ABC')[0].type, 'plane');
  bang(BaiGiai.docKhoi('xin chào thầy').length, 0);
});
thu('ví dụ tia Bx // AC: đúng quan hệ của đề (song song, D nằm giữa A và E, AF = AC, I trên AB và EF)', () => {
  const P = Plane.points(khoiTV(LoiNhacAI.text())[1]);
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
