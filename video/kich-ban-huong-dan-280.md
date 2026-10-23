# Kịch bản video hướng dẫn ToanViet Studio 2.8.0

- Tệp: `ToanViet-Studio-huong-dan-2.8.0.mp4` — 1920 × 1080, H.264, khoảng 9 phút 50 giây
- Âm thanh: nhạc nền từ hai bài trong thư mục `video` (phát lần lượt, hết thì lặp lại cho đến hết video; chuyển bài mờ dần,
  nhỏ dần ở cuối). Không lời đọc — nội dung bằng phụ đề tiếng Việt in trên hình, mỗi thao tác đánh số **Bước n**.
- Hình ảnh: quay màn hình phần mềm thật bản 2.8.0, dữ liệu mẫu tự soạn (không dùng đề, hình trong SGK).
- Dựng lại: `node video/quay/chay.js <cảnh>` cho từng cảnh, `powershell -File video\quay\word.ps1 -Canh c7` / `-Canh c8`
  cho cảnh Word, rồi `npx electron video/dung/dung.js --kb=canh-280` (kịch bản dựng: `video/dung/canh-280.js`).

## 1. Slide giới thiệu (0:00 – 0:26)

| Slide | Nội dung |
|---|---|
| Tên phần mềm | ToanViet Studio 2.8.0 — công thức và hình vẽ cho giáo viên Tiểu học, Toán, Vật lí, Hoá học, Sinh học; miễn phí, mã nguồn mở, gắn sẵn vào Word, PowerPoint |
| Mục lục | Bắt đầu · Tiểu học · Toán · Vật lí · Hoá học · Sinh học · Tính năng nâng cao |
| Cài đặt trong 1 phút | Tải từ GitHub (Releases) → đóng Word, PowerPoint → chạy bộ cài → mở từ Desktop hoặc thẻ ToanViet trong Word |

## 2. Bắt đầu — mọi giáo viên (0:26) · cảnh `d0-bat-dau`

1. Ô **chọn môn** ở góc dưới bên phải.
2. Chọn môn: thanh công cụ chỉ còn các nút của môn đó (Vật lí, Hoá học, Sinh học, Tiểu học, Toán); phần mềm nhớ môn đã chọn.
3. **Giao diện cơ bản**: chỉ giữ các nút hay dùng.

## 3. Giáo viên Tiểu học (0:53) · slide 5 tính năng + cảnh `t1-tieu-hoc`

1. Chọn môn Tiểu học.
2. **Đặt tính cột dọc**: chọn phép tính → Chèn → gõ số ở khung Thuộc tính (346 × 25), tự tính, thẳng cột; phép chia.
3. **Dạng bài trên phiếu**: Số?, điền dấu >, <, =.
4. **Trình chiếu**: nhấp vào phép tính để giải từng bước; nút Đáp án; Thoát — trang trở lại như cũ.
5. **Hình minh hoạ**: đồng hồ, phân số, sơ đồ tổng – hiệu, biểu đồ cột.
6. **Mẫu theo bài** sách Toán 1 – 5.

## 4. Giáo viên Toán (2:04) · slide 6 tính năng + cảnh `c1`, `c2`, `c3`, `c4`, `t2-thong-ke`

1. Gõ công thức bằng phím tắt kiểu MathType (Ctrl+M).
2. Tiếng Việt trong công thức, nhiều dòng; ký hiệu đúng SGK.
3. Bảng biến thiên tự lập, bảng xét dấu, đồ thị, miền nghiệm.
4. Hình phẳng: chọn mẫu, kéo đỉnh — hình tự vẽ lại đúng tính chất.
5. Hình không gian: xoay bằng chuột, nét khuất tự thành nét đứt; dựng nhanh trung điểm, giao điểm.
6. **Mới** — thống kê, xác suất: bảng tần số, biểu đồ cột kép (thêm một dòng dữ liệu, vẽ lại ngay), hình quạt, tần số ghép nhóm có đa giác tần số, sơ đồ cây xác suất.

## 5. Giáo viên Vật lí (4:41) · slide 5 tính năng + cảnh `l1-vat-li`

1. Chọn môn Vật lí.
2. **Mạch điện theo lưới**: thêm nhánh bóng đèn song song bằng vài dòng kịch bản.
3. **Thấu kính**: đổi d = 6 cm → ảnh ảo, cùng chiều; d = 25 cm → ảnh thật, ngược chiều.
4. **Đồ thị số liệu**: U – I có đường thẳng phù hợp nhất và phương trình; v – t có đường gióng.
5. Công thức Vật lí (thẻ Đơn vị đo).

## 6. Giáo viên Hoá học (5:38) · slide 5 tính năng + cảnh `h1-hoa`

1. Chọn môn Hoá học, bấm **Phương trình hoá học…**
2. Gõ như viết tay: KMnO4 + HCl -> KCl + MnCl2 + Cl2↑ + H2O.
3. **Cân bằng hệ số** → 2, 16, 2, 2, 5, 8; chèn phương trình (là công thức, sang Word thành Equation); phản ứng thuận nghịch có điều kiện.
4. **Cấu hình electron** của Cr (ngoại lệ 3d⁵4s¹), ô orbital, lớp vỏ.
5. **Công thức cấu tạo**: CH3-C(CH3)2-CH=CH2.

## 7. Giáo viên Sinh học (6:36) · slide 5 tính năng + cảnh `s1-sinh`

1. Chọn môn Sinh học.
2. **Sơ đồ lai**: sửa kiểu gen AaBb × AaBb, F₁ tính lại ngay.
3. **Khung Punnett** tô màu theo kiểu hình.
4. **Phả hệ**: thêm người, thế hệ III tự xếp.
5. Công thức di truyền quần thể.

## 8. Tính năng nâng cao — chỉ có ở ToanViet (7:25) · slide 6 tính năng

| Thời điểm | Cảnh | Nội dung |
|---|---|---|
| 7:36 | `c8-bai-giai-ai`, `c8-word` | Bài giải AI → Word: dán lời giải ChatGPT / Gemini / Copilot, tự dựng bố cục, **tự đọc đề vẽ hình**; tài liệu Word hoàn chỉnh |
| 8:10 | `c7-word`, `c7-chen`, `c7-sua` | Trong Word thật: Công thức mới → chèn đúng dòng chữ → nhấp đúp sửa → chuyển cả tài liệu Equation → ToanViet |
| 8:47 | `n1-ai-mon` | AI viết hình theo môn: dán khối mã `toanviet-mon` vào hộp Kịch bản → thấu kính phân kì vẽ đúng |
| 9:02 | `n2-trinh-chieu` | Trình chiếu dựng hình từng nét (Shift+F5); đề / kịch bản sai → lỗi báo bằng lời |

## 9. Kết (9:39)

Lưới ảnh 6 môn; slide cuối: link tải GitHub, hướng dẫn PDF (F1), tác giả, giấy phép MIT.
