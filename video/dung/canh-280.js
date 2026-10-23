// Kịch bản dựng video HƯỚNG DẪN ToanViet Studio 2.8.0 theo từng môn (kịch bản: video/kich-ban-huong-dan-280.md).
//   npx electron video/dung/dung.js --kb=canh-280 --ra=<tệp>.mp4
// Cách viết đoạn: xem video/dung/canh.js. Phụ đề: [mốc khi quay | giây, kéo dài (0 = tới phụ đề sau), chữ].
// Nhạc nền: hai bài trong thư mục video, phát lần lượt, lặp lại cho tới hết video.
const WIDE = { x: 130, y: 84, w: 1470 };
const PAGE = { x: 230, y: 90, w: 1100 }; // trang giấy (không gồm khung Thuộc tính)
const PROPS = { x: 900, y: 120, w: 700 }; // khung Thuộc tính bên phải
const RIBBON = { x: 0, y: 0, w: 1100 }; // thanh công cụ
const chuong = (title, tag, items, extra) => ({ card: Object.assign({ y: 180, title, size: 76, lines: [{ text: tag, size: 36, gap: 18, color: '#1f5fbf', weight: '600' }], items, listY: 400, itemGap: Math.min(100, 560 / items.length), itemSize: 40, listX: 300, step: 0.5 }, extra || {}), dur: 4 + items.length * 1.2 });
module.exports = {
  fps: 30,
  bitrateMp4: 8000000,
  ra: 'ToanViet-Studio-huong-dan-2.8.0.mp4',
  nhac: ['cinematic-soul-uplifting-background-music-city-without-sleep-587091.mp3', 'nastelbom-no-copyright-music-617067.mp3'],
  amLuong: 0.8,
  segments: [
    // ================= 1. SLIDE GIỚI THIỆU =================
    { card: { logo: true, y: 470, title: 'ToanViet Studio 2.8.0', size: 104, lines: [
      { text: 'Phần mềm soạn **công thức và hình vẽ** cho giáo viên', size: 48, gap: 40 },
      { text: '**Tiểu học · Toán · Vật lí · Hoá học · Sinh học** — trình bày đúng SGK Việt Nam', size: 40, gap: 16 },
      { text: 'Miễn phí · Mã nguồn mở · Gắn sẵn vào Word và PowerPoint', size: 34, gap: 26, color: '#5b6b82' },
    ] }, dur: 8 },
    { card: { y: 160, title: 'Video này hướng dẫn', size: 72, items: [
      '**Bắt đầu**: chọn môn, giao diện cơ bản',
      'Giáo viên **Tiểu học**',
      'Giáo viên **Toán** THCS – THPT',
      'Giáo viên **Vật lí**',
      'Giáo viên **Hoá học**',
      'Giáo viên **Sinh học**',
      '**Tính năng nâng cao** chỉ có ở ToanViet Studio',
    ], listY: 300, itemGap: 88, listX: 520, step: 0.45 }, dur: 9 },
    { card: { y: 200, title: 'Cài đặt trong 1 phút', size: 72, items: [
      'Vào **github.com/hncanhlsts/toanviet-studio** → mục Releases',
      'Tải tệp **ToanVietStudio-Setup-2.8.0.exe**, đóng Word và PowerPoint',
      'Chạy bộ cài (SmartScreen hỏi thì chọn **Thông tin bổ sung → Vẫn chạy**)',
      'Mở **ToanViet Studio** từ Desktop, hoặc dùng thẻ **ToanViet** trong Word',
    ], listY: 360, itemGap: 110, listX: 250, itemSize: 38 }, dur: 9 },

    // ================= BẮT ĐẦU =================
    { rec: 'd0-bat-dau', from: 'bat-dau', to: 'het', speed: 1.15, title: 'Bắt đầu', tag: 'Mọi giáo viên',
      cam: [WIDE, [1.2, { x: 1000, y: 700, w: 600 }, 1.2], [20.2, WIDE, 1]],
      caps: [[0.5, 0, '**Bước 1.** Nhìn góc dưới bên phải: ô **chọn môn**'], ['mon-li', 0, '**Bước 2.** Chọn môn — thanh công cụ chỉ còn các nút của môn đó'],
        ['mon-tieuhoc', 0, 'Tiểu học, Toán THCS – THPT, Vật lí, Hoá học, Sinh học. Phần mềm **nhớ môn đã chọn**'],
        ['co-ban', 0, '**Bước 3.** Mới làm quen? Bấm **Giao diện cơ bản** — chỉ giữ các nút hay dùng']] },

    // ================= TIỂU HỌC =================
    chuong('Giáo viên Tiểu học', 'Lớp 1 – 5 · chọn môn "Tiểu học"', [
      '**Đặt tính cột dọc**: cộng, trừ, nhân, chia — thẳng hàng tuyệt đối',
      '**Phiếu bài tập**: Số?, điền dấu >, <, =, Đúng / Sai, khoanh, nối',
      '**Trình chiếu** trên TV: bấm để giải từng bước, hiện đáp án',
      '**Hình minh hoạ**: đồng hồ, phân số, sơ đồ đoạn thẳng, biểu đồ',
      '**Mẫu theo bài** sách Toán 1 – 5 Kết nối tri thức',
    ]),
    { rec: 't1-tieu-hoc', from: 'bat-dau', to: 'het', speed: 1.25, title: 'Tiểu học', tag: 'Lớp 1 – 5',
      cam: [WIDE],
      caps: [[0.3, 0, '**Bước 1.** Chọn môn **Tiểu học** — nhóm nút Tiểu học hiện trên thanh công cụ'],
        ['dat-tinh', 0, '**Bước 2.** Đặt tính: chọn phép tính → **Chèn**, gõ số ở khung Thuộc tính — tự tính, thẳng cột'],
        ['dang-bai', 0, '**Bước 3.** Dạng bài trên phiếu: Số?, điền dấu… chọn rồi bấm **Chèn**'],
        ['trinh-chieu', 0, '**Bước 4.** **Trình chiếu** — nhấp vào phép tính: giải thêm **từng bước** cho cả lớp theo dõi'],
        ['dap-an', 0, 'Nút **Đáp án** hiện mọi đáp án; **Thoát**: trang trở lại như cũ'],
        ['minh-hoa', 0, '**Bước 5.** Hình minh hoạ: đồng hồ, phân số, sơ đồ tổng – hiệu, biểu đồ cột'],
        ['mau-bai', 0, '**Bước 6.** **Theo bài**: mẫu soạn sẵn cho từng bài trong sách Toán 1 – 5']] },

    // ================= TOÁN =================
    chuong('Giáo viên Toán', 'THCS – THPT · chọn môn "Toán THCS – THPT"', [
      '**Gõ công thức** nhanh bằng phím tắt kiểu MathType, gõ tiếng Việt trong công thức',
      '**Bảng biến thiên, xét dấu** tự lập; đồ thị, miền nghiệm đúng mẫu SGK',
      '**Hình phẳng**: kéo đỉnh bằng chuột, hình tự vẽ lại đúng tính chất',
      '**Hình không gian**: xoay bằng chuột, nét khuất tự thành nét đứt',
      '**Thống kê**: bảng tần số, biểu đồ cột, quạt, tần số ghép nhóm',
      '**Xác suất**: sơ đồ cây tự nhân xác suất theo nhánh',
    ]),
    { rec: 'c1-cong-thuc', from: 'bat-dau', to: 'het', speed: 2, title: 'Toán — gõ công thức', tag: 'Toán THCS – THPT',
      cam: [{ x: 40, y: 50, w: 1260 }],
      caps: [[0.5, 0, '**Bước 1.** Bấm **Công thức** (Ctrl+M) — gõ bằng phím tắt quen thuộc như MathType'],
        ['he-phuong-trinh', 0, '**Bước 2.** Gõ **tiếng Việt** ngay trong công thức, nhiều dòng, thẳng hàng'],
        ['ky-hieu', 0, 'Ký hiệu đúng như SGK: đồng dạng, song song, khoảng, cung, góc…']] },
    { rec: 'c2-bang-do-thi', from: 'bat-dau', to: 'het', speed: 1.65, title: 'Toán — bảng biến thiên, đồ thị', tag: 'Toán THCS – THPT',
      cam: [WIDE, [26.2, { x: 230, y: 215, w: 1200 }, 1.4]],
      caps: [[0.5, 0, '**Bước 3.** **Biến thiên**: nhập hàm số — bảng biến thiên **tự lập**'],
        ['xet-dau', 0, 'Bảng xét dấu đúng mẫu SGK'], ['do-thi', 0, 'Đồ thị có điểm đặc biệt, đường gióng'],
        ['mien-nghiem', 0, 'Miền nghiệm: gạch bỏ phần không là nghiệm, ghi toạ độ đỉnh — như trong sách']] },
    { rec: 'c3-hinh-phang', from: 'bat-dau', to: 'het', speed: 1.1, title: 'Toán — hình phẳng', tag: 'Toán THCS – THPT',
      cam: [WIDE],
      caps: [[0.5, 0, '**Bước 4.** **Hình phẳng**: chọn mẫu rồi bấm Chèn — hơn 50 hình mẫu'],
        ['keo', 0, 'Kéo đỉnh bằng chuột — đường cao, trực tâm, góc vuông **tự vẽ lại**'],
        ['goc', 0, 'Ký hiệu góc, đoạn bằng nhau theo đúng quy ước SGK']] },
    { rec: 'c4-khong-gian', from: 'bat-dau', to: 'het', speed: 2.1, title: 'Toán — hình không gian', tag: 'Toán THPT',
      cam: [WIDE],
      caps: [[0.5, 0, '**Bước 5.** **Hình không gian**: xoay bằng chuột — nét khuất tự thành nét đứt'],
        ['dung', 0, 'Dựng nhanh: chọn điểm rồi bấm — trung điểm, giao điểm, đoạn thẳng']] },
    { rec: 't2-thong-ke', from: 'bat-dau', to: 'het', speed: 1.05, title: 'Toán — thống kê, xác suất', tag: 'Mới ở bản 2.8.0',
      cam: [PAGE, [7, WIDE, 1]],
      caps: [[0.4, 0, '**Bước 6.** Nhóm **Thống kê – xác suất**: chọn mẫu → **Chèn**'],
        ['cot', 0, 'Biểu đồ cột kép: thêm một dòng **tên | số | số** ở khung Thuộc tính — biểu đồ vẽ lại ngay'],
        ['quat', 0, 'Biểu đồ hình quạt **tự tính phần trăm**'],
        ['ghep', 0, 'Tần số ghép nhóm (lớp 11), bật **đa giác tần số**'],
        ['cay', 0, 'Sơ đồ cây xác suất: **tự nhân theo nhánh**']] },

    // ================= VẬT LÍ =================
    chuong('Giáo viên Vật lí', 'THCS – THPT · chọn môn "Vật lí"', [
      '**Mạch điện theo lưới**: linh kiện tự xoay theo dây, có chấm nối',
      '**Dựng ảnh qua thấu kính** hội tụ, phân kì — tự tính d\', ảnh thật / ảo',
      '**Đồ thị theo số liệu**: x – t, v – t, U – I có đường gióng',
      '**Số liệu thí nghiệm**: đường thẳng phù hợp nhất, ghi phương trình',
      '**Công thức có đơn vị**, ký hiệu Vật lí SGK (quang học, cơ học)',
    ]),
    { rec: 'l1-vat-li', from: 'bat-dau', to: 'het', speed: 1.05, title: 'Vật lí', tag: 'Mới ở bản 2.8.0',
      cam: [WIDE],
      caps: [[0.3, 0, '**Bước 1.** Chọn môn **Vật lí** — nhóm **Sơ đồ, đồ thị Vật lí** hiện ra'],
        ['mach', 0, '**Bước 2.** **Mạch điện**: mỗi dòng một linh kiện — thêm nhánh đèn chỉ bằng vài dòng'],
        ['thau-kinh', 0, '**Bước 3.** **Thấu kính**: đổi d = 6 cm → ảnh **ảo**, cùng chiều; d = 25 cm → ảnh **thật**, ngược chiều'],
        ['so-lieu', 0, '**Bước 4.** Đồ thị số liệu: U – I có **đường thẳng phù hợp nhất**, đồ thị v – t có đường gióng'],
        ['cong-thuc', 0, '**Bước 5.** Công thức Vật lí — hộp công thức mở sẵn thẻ **Đơn vị đo**']] },

    // ================= HOÁ HỌC =================
    chuong('Giáo viên Hoá học', 'THCS – THPT · chọn môn "Hoá học"', [
      '**Phương trình hoá học**: gõ như viết tay, tự viết chỉ số, mũi tên, ↑ ↓',
      '**Tự cân bằng hệ số** — cả phản ứng oxi hoá – khử, phương trình ion',
      'Phương trình chèn vào là **công thức**, sang Word thành Equation',
      '**Cấu hình electron**, ô orbital theo quy tắc Hund, sơ đồ lớp vỏ',
      '**Công thức cấu tạo** thu gọn: nhánh, liên kết đôi, ba',
    ]),
    { rec: 'h1-hoa', from: 'bat-dau', to: 'het', speed: 1.1, title: 'Hoá học', tag: 'Mới ở bản 2.8.0',
      cam: [WIDE],
      caps: [[0.3, 0, '**Bước 1.** Chọn môn **Hoá học**, bấm **⚗ Phương trình hoá học…**'],
        [['pt', 1], 0, '**Bước 2.** Gõ như viết tay: KMnO4 + HCl -> KCl + MnCl2 + Cl2↑ + H2O'],
        ['can-bang', 0, '**Bước 3.** Bấm **Cân bằng hệ số** → 2, 16, 2, 2, 5, 8 — rồi **Chèn phương trình**'],
        [['can-bang', 9], 0, 'Phản ứng thuận nghịch, điều kiện trên mũi tên: viết <=>[t°, xt, p]'],
        ['nguyen-tu', 0, '**Bước 4.** **Cấu hình electron**: gõ Cr — đúng ngoại lệ 3d⁵4s¹, ô orbital, lớp vỏ'],
        ['cau-tao', 0, '**Bước 5.** **Công thức cấu tạo**: gõ CH3-C(CH3)2-CH=CH2 — nhánh tự vẽ thẳng đứng']] },

    // ================= SINH HỌC =================
    chuong('Giáo viên Sinh học', 'THCS – THPT · chọn môn "Sinh học"', [
      '**Sơ đồ lai**: P, giao tử G, F₁ với tỉ lệ kiểu gen, kiểu hình',
      '**Khung Punnett** tô màu theo kiểu hình',
      '**Sơ đồ phả hệ**: thế hệ I, II, III tự xếp, đường hôn nhân tự vẽ',
      'Ký hiệu SGK: nhiễm sắc thể, ADN, giới đực / cái',
      '**Công thức di truyền** quần thể, tỉ lệ',
    ]),
    { rec: 's1-sinh', from: 'bat-dau', to: 'het', speed: 1.05, title: 'Sinh học', tag: 'Mới ở bản 2.8.0',
      cam: [WIDE],
      caps: [[0.3, 0, '**Bước 1.** Chọn môn **Sinh học**'],
        ['lai', 0, '**Bước 2.** **Sơ đồ lai**: sửa kiểu gen thành AaBb × AaBb — F₁ tính lại ngay'],
        ['punnett', 0, '**Bước 3.** **Khung Punnett**: ô tô màu theo kiểu hình'],
        ['pha-he', 0, '**Bước 4.** **Phả hệ**: mỗi dòng một người "mã | giới | bệnh | bố+mẹ" — thế hệ III tự thêm'],
        ['cong-thuc', 0, '**Bước 5.** Công thức di truyền quần thể']] },

    // ================= NÂNG CAO =================
    chuong('Tính năng nâng cao', 'Chỉ có ở ToanViet Studio', [
      '**Bài giải AI → Word**: dán lời giải ChatGPT, Gemini, Copilot',
      '**Tự đọc đề** để vẽ hình phẳng, hình không gian',
      '**Dùng ngay trong Word**: nhấp đúp sửa, chuyển cả tài liệu Equation → ToanViet',
      '**AI viết hình theo môn** (khối toanviet-mon): thấu kính, biểu đồ, sơ đồ lai…',
      '**Trình chiếu dựng hình từng nét** như vẽ trên bảng',
      '**Lỗi hình báo bằng lời**: chỉ rõ đề sai ở đâu',
    ]),
    { rec: 'c8-bai-giai-ai', from: 'bat-dau', to: 'tao-bam', speed: 0.85, hold: 1, title: 'Bài giải AI → Word', tag: 'Nâng cao',
      cam: [WIDE, [3.2, { x: 140, y: 60, w: 1180 }, 1]],
      caps: [[0.4, 0, 'Có lời giải từ ChatGPT, Gemini, Copilot? Bấm **Bài giải AI**'],
        ['dan', 0, '**Dán vào** — tự bỏ phần thừa, dựng bố cục Câu – Lời giải, đổi ký hiệu theo SGK'],
        ['xem', 0, '**Tự đọc đề để vẽ hình** phẳng và không gian'], ['tao', 0, 'Bấm **Tạo tài liệu Word**']] },
    { rec: 'c8-word', optional: true, from: 'bat-dau', to: 'het', speed: 1, cam: [{ x: 260, y: 240, w: 1700 }],
      caps: [[0.3, 0, 'Tài liệu Word hoàn chỉnh: công thức ToanViet, hình có chú thích — **nhấp đúp để sửa**']] },
    { rec: 'c7-word', optional: true, from: 'bat-dau', to: ['bam-nut', 0.6], speed: 1, title: 'Dùng ngay trong Word', tag: 'Nâng cao',
      cam: [{ x: 0, y: 64, w: 2160 }, [0.9, { x: 0, y: 64, w: 1250 }, 1.1]],
      caps: [[0.5, 0, 'Bấm nút **Công thức mới** trên thẻ ToanViet ngay trong Word']] },
    { rec: 'c7-chen', optional: true, from: 'bat-dau', to: 'het', speed: 1.4, cut: true, cam: [{ x: 160, y: 90, w: 1000 }],
      caps: [[0, 0, 'Gõ công thức, bấm **Chèn vào Word**']] },
    { rec: 'c7-word', optional: true, from: ['chen-xong', -0.8], to: ['nhap-dup', 0.3], speed: 1, cut: true, cam: [{ x: 150, y: 200, w: 1600 }],
      caps: [[0, 3.6, 'Công thức nằm **đúng dòng chữ**, cỡ chữ khớp văn bản'], [3.7, 0, 'Nhấp đúp để sửa']] },
    { rec: 'c7-sua', optional: true, from: 'bat-dau', to: 'het', speed: 1.4, cut: true, cam: [{ x: 160, y: 90, w: 1000 }],
      caps: [[0, 0, 'ToanViet mở **đúng công thức đó** để sửa']] },
    { rec: 'c7-word', optional: true, from: ['sua-xong', -0.8], to: 'het', speed: 1.3, cut: true,
      cam: [{ x: 150, y: 200, w: 1600 }, [2.4, { x: 0, y: 64, w: 1250 }, 0.9], [4.6, { x: 150, y: 200, w: 1600 }, 1]],
      caps: [[0, 2.8, 'Cập nhật ngay trong tài liệu'], [3, 0, 'Tài liệu cũ dùng Equation? Bấm **Equation → ToanViet** — chuyển cả tài liệu']] },
    { rec: 'n1-ai-mon', from: 'bat-dau', to: 'het', speed: 0.9, title: 'AI viết hình theo môn', tag: 'Mới ở bản 2.8.0',
      cam: [WIDE],
      caps: [[0.3, 0, 'Nhờ ChatGPT, Gemini viết hình: AI trả về **khối mã toanviet-mon**'],
        ['dan', 0, 'Dán vào hộp **Kịch bản** — ToanViet kiểm tra ngay'], ['chen', 0, 'Bấm **Chèn hình** — thấu kính phân kì vẽ **đúng như AI mô tả**']] },
    { rec: 'n2-trinh-chieu', from: 'bat-dau', to: 'het', speed: 1, title: 'Dựng hình từng nét, lỗi bằng lời', tag: 'Mới ở bản 2.8.0',
      cam: [WIDE, [16.6, { x: 640, y: 360, w: 960 }, 1.2]],
      caps: [[0.3, 0, '**Shift+F5**: trình chiếu hiện dần — mỗi lần bấm, hình **thêm một nét** như vẽ trên bảng'],
        ['loi', 0, 'Kịch bản / đề sai? ToanViet **báo bằng lời**: điểm nào không dựng được, vì sao', 'tren']] },

    // ================= KẾT =================
    { grid: [
      { rec: 't1-tieu-hoc', at: ['mau-bai', -1], cam: { x: 280, y: 120, w: 1000 }, label: 'Tiểu học' },
      { rec: 'c2-bang-do-thi', at: 'het', cam: { x: 265, y: 215, w: 1060 }, label: 'Toán: bảng, đồ thị' },
      { rec: 't2-thong-ke', at: 'het', cam: { x: 250, y: 110, w: 1050 }, label: 'Toán: thống kê, xác suất' },
      { rec: 'l1-vat-li', at: ['cong-thuc', -0.5], cam: { x: 250, y: 110, w: 1050 }, label: 'Vật lí' },
      { rec: 'h1-hoa', at: 'het', cam: { x: 250, y: 110, w: 1050 }, label: 'Hoá học' },
      { rec: 's1-sinh', at: ['cong-thuc', -0.5], cam: { x: 250, y: 110, w: 1050 }, label: 'Sinh học' },
    ], heading: 'ToanViet Studio 2.8.0 — cho giáo viên mọi cấp, mọi môn tự nhiên', top: 170, dur: 9 },
    { card: { logo: true, y: 470, title: 'ToanViet Studio', size: 100, lines: [
      { text: 'Tải miễn phí:  **github.com/hncanhlsts/toanviet-studio**', size: 46, gap: 44 },
      { text: 'Hướng dẫn chi tiết: phím **F1** trong phần mềm (tệp PDF)', size: 38, gap: 24 },
      { text: 'Tác giả: Hoàng Ngọc Cảnh — Trường THCS - THPT Đinh Thiện Lý', size: 36, gap: 24 },
      { text: 'Mã nguồn mở · Giấy phép MIT', size: 32, gap: 16, color: '#5b6b82' },
    ] }, dur: 11 },
  ],
};
