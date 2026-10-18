// Kịch bản dựng video giới thiệu (theo video/kich-ban-gioi-thieu.md). Thời gian tính bằng giây.
// Đoạn quay: rec = tên cảnh trong video/khung, from / to = mốc (REC.mark), [mốc, lệch giây] hoặc số giây; speed = tốc độ phát;
//   hold = giữ khung cuối thêm (giây); optional = bỏ qua khi chưa quay; cut = nối thẳng, không mờ qua trắng.
// cam: khung nhìn theo toạ độ cảnh quay (cửa sổ phần mềm 1600×900; cửa sổ Word: điểm ảnh 2400×1350):
//   [ {x, y, w}, [t, {x, y, w}, thời gian chuyển], … ] (cao = rộng × 9/16), t tính theo giây của đoạn.
// caps: phụ đề [bắt đầu, kéo dài, 'chữ — **đậm**'] tính theo giây của đoạn.
const WIDE = { x: 130, y: 84, w: 1470 };
module.exports = {
  fps: 30,
  bitrate: 6000000,
  segments: [
    // ---------- Mở đầu ----------
    { card: { y: 330, lines: [
      { text: 'Soạn một đề kiểm tra **Toán, Lí, Hoá, Sinh**', size: 64, weight: '700', color: '#14233d' },
      { text: 'mất của thầy cô bao lâu?', size: 64, weight: '700', color: '#14233d', gap: 10 },
      { text: 'Gõ từng ký hiệu…   Kẻ bảng bằng tay…   Vẽ hình ở nơi khác rồi chụp dán vào…', size: 38, gap: 70 },
      { text: 'Giờ mọi việc đó nằm trong **một phần mềm**.', size: 46, gap: 60, weight: '600', color: '#14233d' },
    ], step: 1.5 }, dur: 9 },
    { card: { logo: true, y: 520, title: 'ToanViet Studio', size: 110, lines: [
      { text: 'Công thức và hình vẽ cho **mọi môn tự nhiên**, trình bày đúng SGK Việt Nam', size: 44, gap: 40 },
      { text: 'Gắn sẵn vào **Word**, **PowerPoint**  ·  **Miễn phí, mã nguồn mở**', size: 40, gap: 18 },
    ] }, dur: 8 },
    // ---------- 1. Gõ công thức ----------
    { rec: 'c1-cong-thuc', from: 'bat-dau', to: 'het', speed: 2, title: '1. Gõ công thức nhanh', tag: 'Mọi môn',
      cam: [{ x: 40, y: 50, w: 1260 }],
      caps: [[1, 6, 'Phím tắt quen thuộc như **MathType** — không cần học lại'], [7.3, 8.5, 'Gõ **tiếng Việt** ngay trong công thức, nhiều dòng, thẳng hàng'], [16.4, 8.2, 'Ký hiệu đúng như SGK: đồng dạng, song song, khoảng dùng dấu chấm phẩy']] },
    // ---------- 2. Bảng biến thiên, xét dấu, đồ thị, miền nghiệm ----------
    { rec: 'c2-bang-do-thi', from: 'bat-dau', to: 'het', speed: 1.65, title: '2. Bảng biến thiên, đồ thị, miền nghiệm', tag: 'Toán THCS – THPT',
      cam: [WIDE, [26.2, { x: 230, y: 215, w: 1200 }, 1.4]],
      caps: [[0.8, 5, 'Nhập hàm số — **bảng biến thiên tự lập**, không cần kẻ bảng'], [6, 6.5, 'Bảng xét dấu đúng mẫu SGK'], [12.9, 7.5, 'Đồ thị có điểm đặc biệt, đường gióng, khung vừa vặn'], [20.9, 8.6, 'Miền nghiệm: gạch bỏ phần không thuộc miền, bờ đỏ, tên đỉnh — như trong sách']] },
    // ---------- 3. Hình phẳng ----------
    { rec: 'c3-hinh-phang', from: 'bat-dau', to: 'het', speed: 1.1, title: '3. Vẽ hình phẳng', tag: 'Toán THCS – THPT',
      cam: [WIDE],
      caps: [[0.6, 5, 'Hơn 50 hình phẳng mẫu: tam giác, tứ giác, đường tròn, vectơ…'], [5.9, 6.2, 'Kéo đỉnh bằng chuột — đường cao, trực tâm, góc vuông **tự vẽ lại**'], [12.3, 9, 'Đổi số đo — hình dựng lại chính xác; **góc khác nhau, ký hiệu khác nhau**'], [21.5, 8.3, 'Tia phân giác: hai góc bằng nhau cùng ký hiệu — đúng quy ước SGK']] },
    // ---------- 4. Hình không gian ----------
    { rec: 'c4-khong-gian', from: 'bat-dau', to: 'het', speed: 2.1, title: '4. Hình không gian', tag: 'Toán THPT',
      cam: [WIDE],
      caps: [[0.6, 6.2, 'Xoay hình bằng chuột — **nét khuất tự chuyển thành nét đứt**'], [7, 13, 'Dựng nhanh: chọn điểm rồi bấm — trung điểm, giao điểm, đoạn thẳng']] },
    // ---------- 5. Tiểu học ----------
    { rec: 'c5-tieu-hoc', from: 'bat-dau', to: 'het', speed: 1.45, title: '5. Toán Tiểu học', tag: 'Lớp 1 – 5',
      cam: [WIDE],
      caps: [[0.4, 1.8, 'Chuyển sang chế độ **Tiểu học**'], [2.3, 11.3, 'Đặt tính cột dọc: cộng, trừ, nhân, chia — **thẳng hàng tuyệt đối**'], [13.9, 4.4, 'Sơ đồ đoạn thẳng cho các dạng toán có lời văn'], [18.4, 6.6, 'Toán chuyển động, hình minh hoạ — có sẵn mẫu theo lớp']] },
    // ---------- 6. Vật lí, Hoá học, Sinh học ----------
    { rec: 'c6-khtn', from: 'ly', to: 'het', speed: 1.3, title: '6. Vật lí · Hoá học · Sinh học', tag: 'THCS – THPT',
      cam: [WIDE],
      caps: [[0.4, 11, 'Vật lí: công thức theo lớp, **sơ đồ mạch điện** ghép từ ký hiệu SGK'], [11.9, 17, 'Hoá học: phương trình có **điều kiện phản ứng**, số oxi hoá, ion, ô lượng tử, dụng cụ'], [29.6, 10, 'Sinh học: sơ đồ lai, phả hệ, di truyền quần thể']] },
    // ---------- 7. Word, PowerPoint (Word thật) ----------
    { rec: 'c7-word', optional: true, from: 'bat-dau', to: ['bam-nut', 0.6], speed: 1, title: '7. Dùng ngay trong Word', tag: 'Mọi môn',
      cam: [{ x: 0, y: 64, w: 2160 }, [0.9, { x: 0, y: 64, w: 1250 }, 1.1]],
      caps: [[0.5, 6, 'Bấm nút **Công thức mới** trên thẻ ToanViet ngay trong Word']] },
    { rec: 'c7-chen', optional: true, from: 'bat-dau', to: 'het', speed: 1.4, cut: true, cam: [{ x: 160, y: 90, w: 1000 }],
      caps: [[0, 7, 'Gõ công thức, bấm **Chèn vào Word**']] },
    { rec: 'c7-word', optional: true, from: ['chen-xong', -0.8], to: ['nhap-dup', 0.3], speed: 1, cut: true, cam: [{ x: 150, y: 200, w: 1600 }],
      caps: [[0, 3.6, 'Công thức nằm **đúng dòng chữ**, cỡ chữ khớp văn bản'], [3.7, 1.8, 'Nhấp đúp để sửa']] },
    { rec: 'c7-sua', optional: true, from: 'bat-dau', to: 'het', speed: 1.4, cut: true, cam: [{ x: 160, y: 90, w: 1000 }],
      caps: [[0, 6.5, 'ToanViet mở **đúng công thức đó** để sửa']] },
    { rec: 'c7-word', optional: true, from: ['sua-xong', -0.8], to: 'het', speed: 1.3, cut: true,
      cam: [{ x: 150, y: 200, w: 1600 }, [2.4, { x: 0, y: 64, w: 1250 }, 0.9], [4.6, { x: 150, y: 200, w: 1600 }, 1]],
      caps: [[0, 2.8, 'Cập nhật ngay trong tài liệu'], [3, 7.4, 'Tài liệu cũ dùng Equation? Bấm **Equation → ToanViet** — chuyển cả tài liệu']] },
    // ---------- 8. Bài giải AI → Word ----------
    { rec: 'c8-bai-giai-ai', from: 'bat-dau', to: 'tao-bam', speed: 0.85, hold: 1, title: '8. Bài giải AI → tài liệu Word', tag: 'Mọi môn',
      cam: [WIDE, [3.2, { x: 140, y: 60, w: 1180 }, 1]],
      caps: [[0.4, 3, 'Có lời giải từ ChatGPT, Gemini, Copilot?'], [3.5, 5.6, 'Chỉ cần **dán vào** — tự bỏ phần thừa, dựng bố cục Câu – Lời giải, đổi ký hiệu theo SGK'], [9.2, 6.3, '**Tự đọc đề để vẽ hình**: hình phẳng, hình không gian, miền nghiệm…'], [15.6, 6, 'Bấm **Tạo tài liệu Word** — không cần tài khoản AI nào']] },
    { rec: 'c8-word', optional: true, from: 'bat-dau', to: 'het', speed: 1, cut: false, cam: [{ x: 260, y: 240, w: 1700 }],
      caps: [[0.3, 12, 'Tài liệu Word hoàn chỉnh: công thức ToanViet, hình có chú thích — **nhấp đúp để sửa**']] },
    // ---------- Kết ----------
    { grid: [
      { rec: 'c1-cong-thuc', at: 'het', cam: { x: 80, y: 180, w: 640 }, label: 'Công thức' },
      { rec: 'c2-bang-do-thi', at: 'het', cam: { x: 265, y: 215, w: 1060 }, label: 'Bảng, đồ thị, miền nghiệm' },
      { rec: 'c3-hinh-phang', at: 'het', cam: { x: 180, y: 195, w: 940 }, label: 'Hình phẳng' },
      { rec: 'c4-khong-gian', at: 'het', cam: { x: 150, y: 240, w: 560 }, label: 'Hình không gian' },
      { rec: 'c5-tieu-hoc', at: 'het', cam: { x: 230, y: 205, w: 880 }, label: 'Tiểu học' },
      { rec: 'c6-khtn', at: ['sinh', -0.6], cam: { x: 120, y: 110, w: 1000 }, label: 'Vật lí · Hoá học · Sinh học' },
    ], heading: 'ToanViet Studio — cho giáo viên mọi cấp, mọi môn tự nhiên', top: 170, dur: 9 },
    { card: { logo: true, y: 470, title: 'ToanViet Studio', size: 100, lines: [
      { text: 'Tải miễn phí:  **github.com/hncanhlsts/toanviet-studio**', size: 46, gap: 44 },
      { text: 'Tác giả: Hoàng Ngọc Cảnh — Trường THCS - THPT Đinh Thiện Lý', size: 38, gap: 30 },
      { text: 'Mã nguồn mở · Giấy phép MIT', size: 32, gap: 16, color: '#5b6b82' },
    ] }, dur: 10 },
  ],
};
