# ToanViet Studio

Phần mềm soạn công thức Toán (kiểu MathType) kèm công cụ vẽ cho chương trình Toán phổ thông Việt Nam, chạy trên Windows.

## Chạy

    npm install
    npm start

Đóng gói thành thư mục chương trình có tệp .exe (không cần cài Node trên máy dùng):

    npm run dist

Kết quả nằm trong `dist/ToanViet Studio-win32-x64/ToanViet Studio.exe`.

## Bộ cài đặt

    npm run installer

Tạo `cai-dat/ToanVietStudio-Setup-1.0.0.exe` (chọn thư mục cài, tạo lối tắt Desktop/Start Menu, gắn tệp `.tvs` với chương trình, có trình gỡ cài đặt).

## Tính năng

- **Dấu đồng dạng kiểu SGK Việt Nam** (`\dongdang`), mũ góc `\widehat`, cung `\overarc` trong nhóm *Góc – Cung – Đồng dạng*.
- **Gõ chữ tại chỗ**: nhấp đúp vào chỗ trống trên trang; Ctrl+M khi đang gõ để chèn công thức tại con trỏ.
- **Sửa lại công thức**: nhấp đúp (cả công thức trong dòng chữ), hoặc Enter/F2.

- **Công thức**: soạn trực quan (MathLive), bảng mẫu và ký hiệu theo nhóm: Mẫu, Ký hiệu, Hy Lạp, Đại số 10–11, Giải tích 12, Hình học. Có hệ/tuyển phương trình, khoảng/đoạn dùng dấu `;`, véctơ, góc, cung, tổ hợp, giới hạn, tích phân.
- **Văn bản** tiếng Việt, công thức trong dòng đặt giữa `$...$`.
- **Đồ thị hàm số**: nhiều hàm, tiệm cận, điểm đánh dấu có đường gióng, tô hình phẳng (ứng dụng tích phân), chia trục theo π.
- **Bảng biến thiên** và **bảng xét dấu**: lập tự động từ biểu thức (đạo hàm tượng trưng, tìm nghiệm, giới hạn), chỉnh tay được bằng LaTeX.
- **Miền nghiệm** hệ bất phương trình bậc nhất hai ẩn: kiểu gạch bỏ như SGK hoặc tô miền nghiệm, ghi toạ độ đỉnh.
- **Hình không gian**: chóp tam giác/tứ giác, tứ diện, hộp chữ nhật, lập phương, lăng trụ tam giác, chóp cụt, trụ, nón, nón cụt, cầu. Nét khuất tự vẽ đứt; thêm trung điểm, tâm, trọng tâm và đoạn nối.
- **Toán Tiểu học** (Xem ▸ Chế độ Tiểu học, Ctrl+Shift+T), trình bày theo sách Toán 1 – 5 Kết nối tri thức: đặt tính theo cột (chia kiểu Việt Nam như sách, số thập phân, dạng bài ô trống / điền chữ số), các dạng bài trên phiếu, gần 40 hình minh hoạ (sơ đồ đoạn thẳng, phân số, đồng hồ, lịch, cân, thước, nhiệt kế, tiền, que tính, khối trăm – chục, bảng kiểm đếm, biểu đồ tranh / cột / quạt, lưới ô vuông, thước đo góc, hình khai triển), hơn 70 mẫu theo từng bài sách, trình chiếu tương tác (F5: giải đặt tính từng bước, bấm hiện đáp án, kéo thả, hiện dần).
- **Hình vẽ**: đoạn thẳng, mũi tên, chữ nhật, elip.
- **Xuất**: Ctrl+C chép ảnh nét cao để dán vào Word/PowerPoint, chép LaTeX, chép MathML, xuất PNG, xuất PDF A4. Lưu/mở tệp `.tvs`.

## Phím tắt

Ctrl+M công thức · Enter/nhấp đúp sửa · Delete xoá · Ctrl+D nhân bản · Ctrl+C chép ảnh · Ctrl+Z/Y hoàn tác/làm lại · mũi tên dịch 1px (Shift: 10px) · Ctrl+lăn chuột phóng to.

## Cấu trúc mã

- `main.js`: tiến trình chính (menu, lưu/mở, cầu nối Word/PowerPoint bằng PowerShell, thư viện, thư mục dùng chung, cập nhật).
- `src/app.js`: lõi giao diện (trang, vẽ đối tượng, khung Thuộc tính, hộp soạn công thức, lệnh).
- `src/mod/*.js`: các mô-đun giao diện tách riêng (chonnhieu, keodiem, thuvien, soande, trinhchieu). Mỗi mô-đun nhận các hàm dùng chung qua đối số `C` và trả về các hàm nó cung cấp; `app.js` gọi chúng ngay trước lần vẽ đầu tiên.
- `src/*.js` khác: bộ vẽ (plane, space, graph, bbt, numline, sgk, tieuhoc, minhhoa…); `src/maukntt.js`: mẫu theo bài sách Kết nối tri thức và bộ chuyển đổi (omml, mtef, mtefw, mmlfix).

## Bản quyền

Thiết kế bởi: Thầy Hoàng Ngọc Cảnh — Giáo viên trường THCS - THPT Đinh Thiện Lý — canhld@gmail.com

© 2026 Hoàng Ngọc Cảnh. Phát hành theo giấy phép MIT.

## Kiểm thử

    npm test                 # kiểm thử chức năng (test/*.test.js) và giao diện (test/ui.js)
    npx electron test/run.js --cap-nhat   # khi cố ý đổi hình mẫu: cập nhật ảnh chuẩn trong test/anh-chuan.json
    node test/ui.js          # chỉ chạy kiểm thử giao diện (thao tác giả lập trong phần mềm thật, dữ liệu tạm)
    powershell -File build\test-tuluu.ps1 -Out <thư mục tạm>   # tự lưu, khôi phục, hộp thoại khi đóng

## Quản lý phiên bản (Git)

Mỗi phiên bản phát hành là một mốc (tag) `vX.Y.Z`.

    git log --oneline --decorate     # xem lịch sử
    git diff v2.0.8                  # xem thay đổi so với bản 2.0.8
    git checkout v2.0.8 -- src/app.js   # lấy lại một tệp từ bản cũ

Quy trình phát hành: `npm test` đạt hết → tăng `version` trong package.json → `npm run installer` → `git commit` → `git tag -a vX.Y.Z`.

## Sao lưu mã nguồn (tệp nén)

    powershell -File build\sao-luu.ps1

Tệp nén nằm trong `..\ToanVietStudio-luu-tru\ma-nguon`.

## Giấy phép

Phát hành theo giấy phép MIT — xem tệp [LICENSE](LICENSE). © 2026 Hoàng Ngọc Cảnh.
