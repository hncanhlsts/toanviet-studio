// Đọc đề từ ảnh: bộ sửa lỗi nhận chữ (src/ocr-sua.js). Các câu dưới đây là lỗi thật Tesseract gặp khi đọc ảnh đề
// (ảnh màn hình, Word, chữ nhỏ, nền tối, Zalo nén, ảnh chụp) — đo bằng test/ocr-chay.js.
nhom('Sửa lỗi nhận chữ đề Toán (ocr-sua.js)');
const sua = (s) => OcrSua.sua(s);
thu('khôi phục dấu tiếng Việt theo ngữ cảnh lời văn đề hình học', () => {
  bang(sua('Vẽ ba điệm A, B, C thăng hàng sao cho điệm B năm giữa hai điêm A vả C.'), 'Vẽ ba điểm A, B, C thẳng hàng sao cho điểm B nằm giữa hai điểm A và C.');
  bang(sua('Vẽ hai tia đồi nhau Ox và Ov. Lắy điểm À thuộc tia Ox, điệm B thuộc tia O:'), 'Vẽ hai tia đối nhau Ox và Oy. Lấy điểm A thuộc tia Ox, điểm B thuộc tia Oy');
  bang(sua('Trên ta Ox lẫy hai điểm A vã B sao cho OA = 3 em, OB =6 cm.'), 'Trên tia Ox lấy hai điểm A và B sao cho OA = 3 cm, OB =6 cm.');
  bang(sua('Cho hình bình hình ABCD có AD = 2AB. Gọi M là trng iễm của AD.'), 'Cho hình bình hành ABCD có AD = 2AB. Gọi M là trung điểm của AD.');
  bang(sua('Vẽ bai tỉa đổi nhau Ox và Oy.'), 'Vẽ hai tia đối nhau Ox và Oy.');
  bang(sua('Cho đoan thẳng AB = 8 cím. Gọi M là Ung điểm của AB.'), 'Cho đoạn thẳng AB = 8 cm. Gọi M là trung điểm của AB.');
});
thu('không sửa nhầm chữ đúng, tên góc, tên đường thẳng', () => {
  bang(sua('Cho các điểm. Kéo dài AM. Góc mOn và xOt, yOz. Đường thẳng xy. Trong mặt phẳng toạ độ Oxy.'), 'Cho các điểm. Kéo dài AM. Góc mOn và xOt, yOz. Đường thẳng xy. Trong mặt phẳng toạ độ Oxy.');
  bang(sua('Tính diện tích xung quanh. Gọi H là hình chiếu của A. Nửa mặt phẳng bờ AB.'), 'Tính diện tích xung quanh. Gọi H là hình chiếu của A. Nửa mặt phẳng bờ AB.');
  bang(sua('Chứng minh vectơ AB + AC = 2 vectơ AM.'), 'Chứng minh vectơ AB + AC = 2 vectơ AM.');
  bang(sua('Cho hình hộp chữ nhật ABCD.A\'B\'C\'D\'.'), 'Cho hình hộp chữ nhật ABCD.A\'B\'C\'D\'.');
});
thu('kí hiệu Toán: Δ, ⊥, ∽, ∈, (O; R), √, toạ độ, đơn vị, độ', () => {
  bang(sua('Cho AABC cân tại A. Kẻ AH L BC tại H.'), 'Cho ΔABC cân tại A. Kẻ AH ⊥ BC tại H.');
  bang(sua('Kẻ AH + BC tại H. Chứng minh AHBA - ΔABC.'), 'Kẻ AH ⊥ BC tại H. Chứng minh ΔHBA ∽ ΔABC.');
  bang(sua('Cho đường tròn (O, R). Cạnh av2. Cho A(1; 2), B3; -1). AB = $ cm. M € d.'), 'Cho đường tròn (O; R). Cạnh a√2. Cho A(1; 2), B(3; -1). AB = 8 cm. M ∈ d.');
  bang(sua('Vẽ góc xOy có số đo bằng 60”.'), 'Vẽ góc xOy có số đo bằng 60°.');
  bang(sua('Vẽ hình chữ nhật ABCD có AB z5 cm,8C=z 3 cm.'), 'Vẽ hình chữ nhật ABCD có AB = 5 cm,BC = 3 cm.');
  bang(sua('MD ~ MA.'), 'MD = MA.');
});
thu('tên điểm đọc sai: bờ → BC, mi → MI, MINP → MNP, BẮC → BAC, mềOn → mOn, (1 thuộc → (I thuộc', () => {
  bang(sua('Cho tam giác MNP nhọn có đường cao MI (1 thuộc NP). Trên đoạn mi, lấy điểm K (không trùng M, ]). Chứng minh MINP.'), 'Cho tam giác MNP nhọn có đường cao MI (I thuộc NP). Trên đoạn MI, lấy điểm K (không trùng M, I). Chứng minh MNP.');
  bang(sua('Cho tam giác ABC. Trên tia đối của tia bờ lấy điểm D. Chứng minh góc ABD = góc BẮC + góc ACB.'), 'Cho tam giác ABC. Trên tia đối của tia BC lấy điểm D. Chứng minh góc ABD = góc BAC + góc ACB.');
  bang(sua('Cho góc tù mOn, vẽ tia Ot nằm trong góc mềOn.'), 'Cho góc tù mOn, vẽ tia Ot nằm trong góc mOn.');
});
thu('bỏ dòng rác (vệt bẩn, nét hình đọc thành chữ), nối dòng bị ngắt', () => {
  bang(OcrSua.ghep([{ text: 'Cho tam giác ABC có góc A = 70°, góc', conf: 82 }, { text: 'B = 50°. Tính góc C.', conf: 80 }, { text: 'ì: h "ít, ñ 2 „và __u $ xxx: HS He', conf: 40 }, { text: 'x', conf: 30 }, { text: '⁄ `', conf: 20 }]), 'Cho tam giác ABC có góc A = 70°, góc B = 50°. Tính góc C.');
});
