---
name: toanviet-ve-hinh
description: Chuyển đề hình học phẳng (lớp 6–12) do giáo viên viết thành kịch bản hình ToanViet Studio trong khối [HÌNH TOANVIET] … [/HÌNH TOANVIET], để ToanViet vẽ đúng hình khi dán bài vào Bài giải AI. Dùng skill này bất cứ khi nào người dùng đưa đề / bài giải có hình học phẳng (tam giác, tứ giác, đường tròn, tia, góc, đường thẳng song song, vuông góc…) và muốn vẽ hình, soạn bài giải để dán vào ToanViet, hoặc nhắc tới ToanViet, "vẽ hình cho đề", "kịch bản hình" — kể cả khi không nói rõ chữ "skill".
---

# Vẽ hình học phẳng cho ToanViet Studio

ToanViet Studio (phần mềm soạn công thức, hình vẽ Toán cho Word) có hộp **Bài giải AI**: giáo viên dán câu trả lời của
trợ lí AI vào, phần mềm trình bày lại theo SGK và đặt hình vào tài liệu Word. Đọc lời văn để đoán hình dễ sai
(tia Bx, nửa mặt phẳng, tia đối…). Vì vậy skill này yêu cầu **viết sẵn hình bằng kịch bản ToanViet**: mỗi điểm được dựng
đúng quan hệ của đề, ToanViet vẽ y như kịch bản.

## Quy trình

1. Đọc kĩ đề. Tách điểm **cho trước** (đặt toạ độ) và điểm **dựng thêm** (dựng bằng phép dựng: trungdiem, giao, chan,
   tinhtien, doixung…). Không tự tính toạ độ cho điểm dựng thêm.
2. Viết kịch bản theo **`references/kich-ban-hinh.md`** — đọc toàn bộ tệp này trước khi viết lần đầu: bảng phép dựng,
   lệnh vẽ, quy ước SGK (đoạn / đường thẳng / tia ở lớp 6–7, tên tia viết thường, nét đứt, kí hiệu bằng nhau, góc vuông)
   và các ví dụ mẫu.
3. Nếu chạy được Node.js, kiểm tra kịch bản bằng đúng bộ dựng hình của ToanViet:
   ```
   node scripts/kiem-tra.js hinh.txt
   ```
   (`hinh.txt` chứa các dòng kịch bản, hoặc cả câu trả lời có khối [HÌNH TOANVIET]). Lệnh in dòng lỗi (nếu có) và toạ độ
   từng điểm — dùng toạ độ đó để tự kiểm tra các điều kiện của đề: song song, vuông góc, nằm giữa, cùng / khác phía,
   độ dài bằng nhau. Sửa đến khi không còn lỗi và mọi điều kiện đều đúng.
4. Trả lời theo bố cục: đề bài → khối `[HÌNH TOANVIET]` (các dòng kịch bản đặt trong ``` để giữ xuống dòng) →
   **Lời giải**. Mỗi câu có hình một khối; tên điểm trong lời giải khớp với hình.

## Lưu ý

- Chọn toạ độ đúng giả thiết và tránh trường hợp đặc biệt ngoài ý đề (tam giác thường không cân, không vuông; "AB < AC"
  thì đỉnh A lệch về phía B…). Cạnh đáy nằm ngang, hình rộng khoảng 6–8 đơn vị.
- Đúng hướng: tia đối (chia với k < 0, doixung), nửa mặt phẳng (tinhtien(P, A, B) hay tinhtien(P, B, A)), điểm nằm giữa.
- Chỉ đánh dấu giả thiết lên hình; không đánh dấu điều phải chứng minh.
- Người dùng đang dùng ChatGPT / Gemini thay vì Claude: trong ToanViet, hộp Bài giải AI có nút
  **📋 Chép lời nhắc vẽ hình cho AI** — cùng nội dung với `references/kich-ban-hinh.md`, dán vào trợ lí AI đó.
