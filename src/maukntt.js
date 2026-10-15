// Mẫu soạn nhanh theo từng bài trong sách Toán 1 – 5 (Kết nối tri thức với cuộc sống, bộ sách dùng thống nhất từ năm 2026).
// Chỉ dùng tên chủ đề, tên bài của sách; đề bài, số liệu là bài tập tự soạn để giáo viên sửa tiếp.
// Mỗi mục: [loại đối tượng, mẫu, thuộc tính thêm]
(function (root) {
  'use strict';
  const B = (kind, de, text, more) => ['baitap', kind, Object.assign({ de, text }, more || {})];
  const D = (expr, more) => ['dattinh', 'cong', Object.assign({ expr, an: 'kq' }, more || {})];
  const M = (kind, more) => ['minhhoa', kind, more || {}];
  const MAU = [
    { lop: 1, chude: [
      ['Chủ đề 1: Các số từ 0 đến 10', [
        ['Bài 1, 2. Các số từ 0 đến 10', [M('chamtron', { so: 6 }), B('otrong', '1. Số?', 'Có [6] chấm tròn.', { cols: 1 })]],
        ['Bài 3. Nhiều hơn, ít hơn, bằng nhau', [B('sosanh', '1. >, <, = ?', '4 (?) 6\n7 (?) 7\n9 (?) 5\n3 (?) 8\n10 (?) 2\n0 (?) 1', { cols: 3 })]],
        ['Bài 4. So sánh số', [B('khoanh', '1. Khoanh vào chữ đặt trước câu trả lời đúng:', 'a) Số lớn nhất trong các số 3, 8, 5, 6 là:\n3\n*8\n5\n6\n\nb) Số bé nhất trong các số 9, 4, 7, 10 là:\n9\n*4\n7\n10', { cols: 4 })]],
        ['Bài 5. Mấy và mấy', [B('otrong', '1. Số?', '6 gồm 2 và []\n8 gồm 5 và []\n10 gồm 7 và []\n9 gồm [] và 4', { cols: 2 })]],
      ]],
      ['Chủ đề 3: Phép cộng, phép trừ trong phạm vi 10', [
        ['Bài 10. Phép cộng trong phạm vi 10', [B('otrong', '1. Số?', '3 + 4 = []\n5 + 2 = []\n6 + [] = 9\n[] + 3 = 10', { cols: 2 }), B('maytinh', '2. Số?', '2 -> +3 -> [] -> +4 -> []')]],
        ['Bài 11. Phép trừ trong phạm vi 10', [B('otrong', '1. Số?', '9 - 4 = []\n8 - 5 = []\n10 - [] = 6\n[] - 2 = 5', { cols: 2 }), B('dungsai', '2. Đ, S ?', 'a) 7 - 3 = 4\nb) 10 - 6 = 3\nc) 5 - 5 = 0')]],
        ['Bài 12. Bảng cộng, bảng trừ trong phạm vi 10', [B('bang', '1. Số?', '+ | 1 | 2 | 3 | 4\n5 | [6] | [7] | [8] | [9]\n6 | [7] | [8] | [9] | [10]', { head: true, headcol: true })]],
      ]],
      ['Chủ đề 6: Các số đến 100', [
        ['Bài 21. Số có hai chữ số', [M('quetinh', { so: 47 }), B('otrong', '1. Số?', '47 gồm [4] chục và [7] đơn vị\n63 gồm [6] chục và [3] đơn vị', { cols: 1 })]],
        ['Bài 22. So sánh số có hai chữ số', [B('sosanh', '1. >, <, = ?', '45 (?) 54\n38 (?) 83\n70 (?) 69\n91 (?) 91\n26 (?) 62\n57 (?) 75', { cols: 3 })]],
        ['Bài 23. Bảng các số từ 1 đến 100', [M('bang100', { an: '15; 37; 58; 72; 99', to: '' })]],
      ]],
      ['Chủ đề 7: Độ dài và đo độ dài', [
        ['Bài 26. Đơn vị đo độ dài', [M('thuoc', { cm: 10, dai: '0-7', ghi: '? cm' })]],
      ]],
      ['Chủ đề 8: Phép cộng, phép trừ (không nhớ) trong phạm vi 100', [
        ['Bài 30. Phép cộng số có hai chữ số với số có hai chữ số', [B('otrong', '1. Đặt tính rồi tính:', ''), D('34 + 25'), D('52 + 46'), D('61 + 27')]],
        ['Bài 32. Phép trừ số có hai chữ số cho số có hai chữ số', [B('otrong', '1. Đặt tính rồi tính:', ''), D('78 - 35'), D('96 - 42'), D('59 - 17')]],
      ]],
      ['Chủ đề 9: Thời gian. Giờ và lịch', [
        ['Bài 34. Xem giờ đúng trên đồng hồ', [M('dongho', { gio: '7:00; 10:00; 3:00', ghi: 'cho' })]],
        ['Bài 35. Các ngày trong tuần', [M('lich', { thang: 9, to: '5', an: '' }), B('otrong', '1. Số?', 'Ngày 5 tháng 9 là thứ {}.')]],
      ]],
    ] },
    { lop: 2, chude: [
      ['Chủ đề 1: Ôn tập và bổ sung', [
        ['Bài 2. Tia số. Số liền trước, số liền sau', [['numline', 'tiaso', {}], B('bang', '1. Số?', 'Số liền trước | Số | Số liền sau\n[34] | 35 | [36]\n[59] | 60 | [61]\n[89] | 90 | [91]', { head: true })]],
        ['Bài 4. Hơn, kém nhau bao nhiêu', [M('sodo_gaplan', { dang: 'tonghieu', ten1: 'Mai:', ten2: 'Nam:', tong: '', hieu: '? quả', hoi1: '12 quả', hoi2: '8 quả', tomtat: true })]],
      ]],
      ['Chủ đề 2: Phép cộng, phép trừ trong phạm vi 20', [
        ['Bài 8. Bảng cộng (qua 10)', [B('otrong', '1. Số?', '9 + 4 = []\n8 + 5 = []\n7 + 6 = []\n6 + 8 = []', { cols: 2 }), B('noi', '2. Nối mỗi phép tính với kết quả đúng:', '9 + 3 | 12\n8 + 7 | 15\n6 + 5 | 11\n7 + 7 | 14')]],
        ['Bài 12. Bảng trừ (qua 10)', [B('otrong', '1. Số?', '13 - 5 = []\n15 - 8 = []\n12 - 7 = []\n16 - 9 = []', { cols: 2 })]],
      ]],
      ['Chủ đề 3: Làm quen với khối lượng, dung tích', [
        ['Bài 15. Ki-lô-gam', [M('can', { trai: 'Quả dưa', phai: '2 kg', lech: 0 }), B('otrong', '1. Số?', 'Quả dưa cân nặng {2} kg.')]],
        ['Bài 16. Lít', [M('canuoc', { max: 5, so: 4 }), B('otrong', '1. Số?', 'Trong ca có {4} l nước.')]],
      ]],
      ['Chủ đề 4: Phép cộng, phép trừ (có nhớ) trong phạm vi 100', [
        ['Bài 20. Phép cộng (có nhớ) số có hai chữ số với số có hai chữ số', [B('otrong', '1. Đặt tính rồi tính:', ''), D('38 + 45'), D('27 + 56'), D('49 + 36')]],
        ['Bài 23. Phép trừ (có nhớ) số có hai chữ số cho số có hai chữ số', [B('otrong', '1. Đặt tính rồi tính:', ''), D('72 - 38'), D('64 - 27'), D('91 - 45')]],
      ]],
      ['Chủ đề 6: Ngày – giờ, giờ – phút, ngày – tháng', [
        ['Bài 29. Ngày – giờ, giờ – phút', [M('dongho', { gio: '8:15; 9:30; 4:45', ghi: 'cho' })]],
        ['Bài 30. Ngày – tháng', [M('lich', { thang: 11, to: '20', an: '' }), B('otrong', '1. Số?', 'Tháng 11 có {30} ngày.\nNgày 20 tháng 11 là thứ {}.')]],
      ]],
      ['Chủ đề 8: Phép nhân, phép chia', [
        ['Bài 39. Bảng nhân 2', [B('bang', '1. Số?', 'Thừa số | 2 | 2 | 2 | 2\nThừa số | 3 | 5 | 7 | 9\nTích | [6] | [10] | [14] | [18]', { headcol: true })]],
        ['Bài 41. Phép chia', [B('otrong', '1. Số?', '10 : 2 = []\n15 : 5 = []\n18 : 2 = []\n25 : 5 = []', { cols: 2 })]],
      ]],
      ['Chủ đề 10, 11: Các số trong phạm vi 1 000. Tiền Việt Nam', [
        ['Bài 48. Đơn vị, chục, trăm, nghìn', [M('khoi', { so: 324 })]],
        ['Bài 56. Giới thiệu tiền Việt Nam', [M('tien', { menhgia: '100; 200; 500; 1000' })]],
      ]],
      ['Chủ đề 12: Phép cộng, phép trừ trong phạm vi 1 000', [
        ['Bài 60. Phép cộng (có nhớ) trong phạm vi 1 000', [B('otrong', '1. Đặt tính rồi tính:', ''), D('356 + 127'), D('248 + 391'), D('475 + 286')]],
        ['Bài 62. Phép trừ (có nhớ) trong phạm vi 1 000', [B('otrong', '1. Đặt tính rồi tính:', ''), D('652 - 318'), D('740 - 265'), D('913 - 487')]],
      ]],
      ['Chủ đề 13: Làm quen với yếu tố thống kê, xác suất', [
        ['Bài 64. Thu thập, phân loại, kiểm đếm số liệu', [M('bangsolieu', { dulieu: 'Bút chì | 6\nThước kẻ | 3\nTẩy | ?' })]],
        ['Bài 65. Biểu đồ tranh', [M('bdtranh', { tieude: 'Số quả các bạn hái được', dulieu: 'Mai | 5\nNam | 3\nViệt | 6', bieutuong: 'qua' })]],
      ]],
    ] },
    { lop: 3, chude: [
      ['Chủ đề 2: Bảng nhân, bảng chia', [
        ['Bài 9 – 12. Bảng nhân, bảng chia 6, 7, 8, 9', [B('otrong', '1. Số?', '6 x 7 = []\n8 x 9 = []\n56 : 7 = []\n63 : 9 = []', { cols: 2 }), B('maytinh', '2. Số?', '6 -> x7 -> [] -> :6 -> []')]],
        ['Bài 14. Một phần mấy', [M('phanso1', { ps: '1/3; 1/4' }), B('dungsai', '1. Đ, S ?', 'a) Đã tô màu 1/3 hình chữ nhật thứ nhất. [Đ]\nb) Đã tô màu 1/3 hình chữ nhật thứ hai. [S]')]],
      ]],
      ['Chủ đề 4: Phép nhân, phép chia trong phạm vi 100', [
        ['Bài 24. Gấp một số lên một số lần', [M('sodo_gaplan', { ten1: 'Con:', ten2: 'Mẹ:', n: 4, tong: '8 tuổi', hoi2: '? tuổi' })]],
        ['Bài 25. Phép chia hết, phép chia có dư', [D('37 : 5', { an: 'kq' }), D('45 : 9', { an: 'kq' }), D('29 : 4', { an: 'kq' })]],
        ['Bài 26. Chia số có hai chữ số cho số có một chữ số', [D('84 : 4', { an: 'kq' }), D('96 : 3', { an: 'kq' }), D('75 : 5', { an: 'kq' })]],
        ['Bài 27. Giảm một số đi một số lần', [M('sodo_giamdi', { ten1: 'Lúc đầu:', ten2: 'Lúc sau:', n: 3, tong: '24 l', hoi2: '? l' })]],
      ]],
      ['Chủ đề 5: Đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ', [
        ['Bài 30. Mi-li-mét', [M('thuoc2', {})]],
        ['Bài 31. Gam', [M('can', { trai: 'Gói bánh', phai: '200 g; 50 g', lech: 0 }), B('otrong', '1. Số?', 'Gói bánh cân nặng {250} g.')]],
        ['Bài 32. Mi-li-lít', [M('canuoc', { max: 500, so: 300, donvi: 'ml' })]],
        ['Bài 33. Nhiệt độ. Đơn vị đo nhiệt độ', [M('nhietke', { so: 28 }), B('otrong', '1. Số?', 'Nhiệt kế chỉ {28} °C.')]],
      ]],
      ['Chủ đề 6: Phép nhân, phép chia trong phạm vi 1 000', [
        ['Bài 36. Nhân số có ba chữ số với số có một chữ số', [D('214 x 3'), D('132 x 4'), D('245 x 2')]],
        ['Bài 37. Chia số có ba chữ số cho số có một chữ số', [D('486 : 2'), D('639 : 3'), D('257 : 4')]],
      ]],
      ['Chủ đề 9: Chu vi, diện tích một số hình phẳng', [
        ['Bài 51. Diện tích của một hình. Xăng-ti-mét vuông', [M('luoi', { cot: 12, hang: 6, hinh: 'A: 1,1 5,1 5,4 1,4 to\nB: 7,1 11,1 11,3 7,3 to' }), B('otrong', '1. Số?', 'Hình A gồm {12} ô vuông. Hình B gồm {8} ô vuông.')]],
      ]],
      ['Chủ đề 10: Cộng, trừ, nhân, chia trong phạm vi 10 000', [
        ['Bài 56. Nhân số có bốn chữ số với số có một chữ số', [D('1 213 x 3'), D('2 107 x 4')]],
        ['Bài 57. Chia số có bốn chữ số cho số có một chữ số', [D('4 826 : 2'), D('3 648 : 3')]],
      ]],
      ['Chủ đề 13: Xem đồng hồ. Tháng – năm. Tiền Việt Nam', [
        ['Bài 66. Xem đồng hồ. Tháng – năm', [M('dongho', { gio: '3:05; 5:43; 10:20', ghi: 'cho' })]],
        ['Bài 68. Tiền Việt Nam', [M('tien', { menhgia: '10000; 20000; 50000; 100000' })]],
      ]],
      ['Chủ đề 15: Làm quen với yếu tố thống kê, xác suất', [
        ['Bài 73. Thu thập, phân loại, ghi chép số liệu. Bảng số liệu', [M('bangsolieu', { dulieu: 'Lớp 3A | 32\nLớp 3B | 30\nLớp 3C | 35', nhan: 'Lớp', nhan2: 'Số học sinh' })]],
      ]],
    ] },
    { lop: 4, chude: [
      ['Chủ đề 2: Góc và đơn vị đo góc', [
        ['Bài 7. Đo góc, đơn vị đo góc', [M('thuocdo', { goc: 60 }), B('otrong', '1. Số?', 'Góc đỉnh O; cạnh OA, OB bằng {60}°.')]],
        ['Bài 8. Góc nhọn, góc tù, góc bẹt', [M('thuocdo', { goc: 120, ten: 'D C' })]],
      ]],
      ['Chủ đề 4: Một số đơn vị đo đại lượng', [
        ['Bài 17. Yến, tạ, tấn', [B('otrong', '1. Số?', '1 yến = {10} kg\n1 tạ = {100} kg\n1 tấn = {1 000} kg\n3 tạ = {300} kg', { cols: 2 })]],
      ]],
      ['Chủ đề 5: Phép cộng và phép trừ', [
        ['Bài 22. Phép cộng các số có nhiều chữ số', [D('45 726 + 31 458'), D('208 374 + 56 915')]],
        ['Bài 23. Phép trừ các số có nhiều chữ số', [D('82 405 - 37 168'), D('650 000 - 284 637')]],
        ['Bài 25. Tìm hai số biết tổng và hiệu của hai số đó', [M('sodo_tonghieu', {})]],
      ]],
      ['Chủ đề 8: Phép nhân và phép chia', [
        ['Bài 39. Chia cho số có một chữ số', [D('45 759 : 5', { kieuchia: 'gon' }), D('7 236 : 6', { kieuchia: 'gon' })]],
        ['Bài 43. Nhân với số có hai chữ số', [D('236 x 47'), D('1 205 x 34')]],
        ['Bài 44. Chia cho số có hai chữ số', [D('4 536 : 12', { kieuchia: 'gon' }), D('9 875 : 25', { kieuchia: 'gon' })]],
      ]],
      ['Chủ đề 9: Làm quen với yếu tố thống kê, xác suất', [
        ['Bài 50. Biểu đồ cột', [M('kiemdem', { cot1: 'Môn', dulieu: 'Bóng đá | 7\nBóng rổ | 5\nBơi | 3\nCờ vua | 4' }), M('bdcot', {})]],
      ]],
      ['Chủ đề 10: Phân số', [
        ['Bài 53. Khái niệm phân số', [M('phanso2', { ps: '3/5; 2/8' })]],
        ['Bài 58. So sánh phân số', [B('sosanh', '1. >, <, = ?', '3/7 (?) 5/7\n4/9 (?) 2/9\n2/3 (?) 4/6\n5/8 (?) 1/2', { cols: 2 })]],
      ]],
    ] },
    { lop: 5, chude: [
      ['Chủ đề 1: Ôn tập và bổ sung', [
        ['Bài 7. Hỗn số', [M('phanso4', { ps: '9/4' })]],
      ]],
      ['Chủ đề 4: Các phép tính với số thập phân', [
        ['Bài 19, 20. Phép cộng, phép trừ số thập phân', [D('45,08 + 24,9'), D('72,5 - 38,46')]],
        ['Bài 21. Phép nhân số thập phân', [D('6,4 x 4,8'), D('12,5 x 0,6')]],
        ['Bài 22. Phép chia số thập phân', [D('27 : 4', { thapphan: 2 }), D('23,56 : 6,2'), D('8,4 : 4')]],
      ]],
      ['Chủ đề 7: Tỉ số và các bài toán liên quan', [
        ['Bài 38. Tìm hai số khi biết tổng và tỉ số của hai số đó', [M('sodo_tongti', {})]],
        ['Bài 39. Tìm hai số khi biết hiệu và tỉ số của hai số đó', [M('sodo_hieuti', {})]],
      ]],
      ['Chủ đề 8, 9: Thể tích. Diện tích và thể tích một số hình khối', [
        ['Bài 45. Thể tích của một hình', [M('xepkhoi', { cao: '2 2 1\n1 1 1', ghi: false }), B('otrong', '1. Số?', 'Hình trên gồm {8} hình lập phương nhỏ.')]],
        ['Bài 49. Hình khai triển của hình lập phương, hình hộp chữ nhật và hình trụ', [M('khaitrien2', {}), M('khaitrien', {}), M('khaitrien3', {})]],
      ]],
      ['Chủ đề 10: Số đo thời gian. Vận tốc. Chuyển động đều', [
        ['Bài 59. Vận tốc của một chuyển động đều', [M('chuyendong2', { v1: '? km/giờ', v2: '', quangduong: '120 km', chieu: 'cung' })]],
        ['Bài 60. Quãng đường, thời gian của một chuyển động đều', [M('chuyendong', {})]],
      ]],
      ['Chủ đề 11: Một số yếu tố thống kê và xác suất', [
        ['Bài 64. Biểu đồ hình quạt tròn', [M('bdquat', { dulieu: 'Kính lúp | 65\nĐèn pin | 10\nThuốc xịt côn trùng | 25', chuthich: true }), B('khoanh', '1. Khoanh vào chữ đặt trước câu trả lời đúng:', 'Đồ vật được nhiều bạn mang theo nhất là:\n*Kính lúp\nĐèn pin\nThuốc xịt côn trùng', { cols: 3 })]],
      ]],
    ] },
  ];
  root.MauKNTT = MAU;
})(typeof window !== 'undefined' ? window : globalThis);
