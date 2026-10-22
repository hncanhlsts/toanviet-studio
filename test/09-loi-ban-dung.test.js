// Lỗi kịch bản hình bằng lời thường (src/loi-de-hieu.js) và số bản dựng của bộ cài (src/ban-dung.js)
nhom('Lỗi kịch bản hình viết bằng lời thường; số bản dựng của bộ cài');
thu('hai đường song song (có điểm phụ Z1): nói điểm nào, vì sao, không lộ tên điểm phụ; lỗi kéo theo gộp lại', () => {
  const e = Plane.loi('A = (0, 0)\nB = (4, 0)\nH = (0, 3)\nZ1 = (4, 3)\nD = giao(B, Z1, A, H)\ndoan BD\ndoan HD');
  bang(e.length, 3);
  const d = LoiDeHieu.dich(e);
  bang(d.length, 2);
  dung(/^Không dựng được điểm D: đường thẳng kẻ qua B song song với đường thẳng AH/.test(d[0]) && !/Z1|giao\(/.test(d[0]), d[0]);
  dung(/2 nét vẽ có điểm D/.test(d[1]), d[1]);
});
thu('các lỗi thường gặp: điểm chưa có, lệnh lạ, sai cú pháp, toạ độ thiếu số, tam giác không dựng được, không gian', () => {
  const d = LoiDeHieu.dich(Plane.loi('A = (0, 0)\nB = (5, 0)\ndoan AQ\nfoo AB\nX = (1)\nghi AB\nT = dinh(A, B, 1, 10)'));
  dung(/cần điểm Q nhưng điểm Q chưa được dựng/.test(d[0]), d[0]);
  dung(/Không hiểu lệnh «foo»/.test(d[1]), d[1]);
  dung(/Toạ độ điểm X cần hai số/.test(d[2]), d[2]);
  dung(/Cách viết đúng: ghi AB = 5/.test(d[3]), d[3]);
  dung(/Không dựng được điểm T: ba độ dài đã cho không tạo thành tam giác/.test(d[4]), d[4]);
  const k = LoiDeHieu.dich(Space.loi('A = (0, 0)\nchop S ABC'));
  dung(k.length && k.every((x) => !/→/.test(x)), k.join(' | '));
  bang(LoiDeHieu.dich('lỗi khác không có mũi tên')[0], 'lỗi khác không có mũi tên');
});
thu('mọi thông báo lỗi của plane.js / space.js đều được viết lại (không còn dạng "dòng  →  lỗi")', () => {
  const ca = ['P = giao(A, B, C, D)', 'P = tamngoai(A, B, A)', 'P = (1)', 'P = (1, 2, 3)', 'P = abc(A)', 'goc AB', 'duongtron', 'truc 1', 'P = dat(A, A, 2)', 'P = 1/0x'];
  ca.forEach((c) => { const d = LoiDeHieu.dich(Plane.loi('A = (0, 0)\nB = (1, 0)\nC = (0, 1)\nD = (1, 1)\n' + c)); dung(d.length === 1 && !/→/.test(d[0]), c + ': ' + d.join(' | ')); });
  dung(/hai điểm trùng nhau/.test(LoiDeHieu.dich(Plane.loi('A = (0, 0)\nB = (1, 0)\nP = tamngoai(A, B, A)'))[0]), 'tamngoai(A, B, A)');
});
thu('số bản dựng đọc từ phần phiên bản tệp (VS_FIXEDFILEINFO); nhãn "2.7.9 (bản dựng 2)"', () => {
  const b = new Uint8Array(200);
  b.set([0xbd, 0x04, 0xef, 0xfe], 50); // chữ ký
  const u32 = (k, v) => { b[k] = v & 255; b[k + 1] = (v >>> 8) & 255; b[k + 2] = (v >>> 16) & 255; b[k + 3] = (v >>> 24) & 255; };
  u32(58, (2 << 16) | 7); u32(62, (9 << 16) | 3);
  bang(BanDung.docPhienBan(b).join('.'), '2.7.9.3');
  bang(BanDung.docPhienBan(new Uint8Array(40)), null);
  bang(BanDung.nhan('2.7.9', 0), '2.7.9');
  bang(BanDung.nhan('2.7.9', 2), '2.7.9 (bản dựng 2)');
});
