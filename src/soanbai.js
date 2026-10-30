// Hỗ trợ soạn bài: Icon, thẻ đề mục, khung hoạt động dạy học chuẩn SGK GDPT 2018 (CV 5512)
(function (root) {
  'use strict';

  // ---------------- BẢNG MÀU CHUẨN SÁCH GIÁO KHOA ----------------
  const THEMES = {
    xanhduong: { main: '#1a5fb4', bg: '#f0f6ff', border: '#7cb5f9', dark: '#0d47a1', text: '#0d3c61' },
    cam:       { main: '#d97706', bg: '#fffbeb', border: '#fcd34d', dark: '#b45309', text: '#78350f' },
    xanhla:    { main: '#16a34a', bg: '#f0fdf4', border: '#86efac', dark: '#15803d', text: '#14532d' },
    tim:       { main: '#7c3aed', bg: '#faf5ff', border: '#d8b4fe', dark: '#6d28d9', text: '#4c1d95' },
    do:        { main: '#dc2626', bg: '#fef2f2', border: '#fca5a5', dark: '#b91c1c', text: '#7f1d1d' },
    ngoc:      { main: '#0891b2', bg: '#ecfeff', border: '#67e8f9', dark: '#0e7490', text: '#164e63' },
    vang:      { main: '#ca8a04', bg: '#fefce8', border: '#fde047', dark: '#a16207', text: '#713f12' },
    xam:       { main: '#334155', bg: '#f8fafc', border: '#cbd5e1', dark: '#1e293b', text: '#0f172a' },
  };

  // ---------------- KHO BIỂU TƯỢNG VECTOR (SVG PATHS SẮC NÉT) ----------------
  // Vẽ trong viewbox 0 0 24 24
  const ICONS = {
    // Cuốn sách mở: Khái niệm, Định nghĩa, Đọc hiểu
    book: (c) => `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM8 6h8M8 10h6" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // Bóng đèn phát sáng: Định lý, Tính chất, Ý tưởng
    lightbulb: (c) => `<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.6 1.4 4.8 3.5 6h7c2.1-1.2 3.5-3.4 3.5-6a7 7 0 0 0-7-7z" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="9" r="1.5" fill="${c}"/>`,
    // Tên lửa: Khởi động, Mở đầu bài học
    rocket: (c) => `<path d="M4.5 16.5c-1.5 1.5-2 5.5-2 5.5s4-.5 5.5-2c1-1 1.5-2.5 1.5-3.5L5 12c-1 0-2.5.5-3.5 1.5zM12 15l-3-3 6-6c1.5-1.5 4.5-2 6-2 0 1.5-.5 4.5-2 6l-7 5z" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16.5" cy="7.5" r="1" fill="${c}"/>`,
    // Kính lúp: Khám phá, Tìm tòi, Ví dụ mẫu
    magnifier: (c) => `<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="${c}" stroke-width="2.2"/><path d="M15.5 15.5L21 21" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`,
    // Compa / Thước: Quy tắc, Công thức, Phương pháp
    compass: (c) => `<circle cx="12" cy="5" r="2" fill="none" stroke="${c}" stroke-width="2"/><path d="M11 7L6 21M13 7l5 14M8.5 15h7" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    // Cây bút viết: Lời giải, Luyện tập, Tự luận
    pencil: (c) => `<path d="M18 2l4 4-13 13H5v-4L18 2zM15 5l4 4" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // Tờ giấy bài tập & bút: Bài tập, Phiếu học tập, Trắc nghiệm
    paper: (c) => `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M8 13h8M8 17h5" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    // Hồng tâm / Bia bắn: Mục tiêu bài học, Yêu cầu cần đạt
    target: (c) => `<circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="${c}"/>`,
    // Tam giác chấm than: Chú ý, Lưu ý, Cảnh báo sai lầm
    warning: (c) => `<path d="M10.3 3.2L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M12 9v4" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.2" fill="${c}"/>`,
    // Chìa khóa: Phương pháp giải, Bí quyết
    key: (c) => `<circle cx="8" cy="12" r="5" fill="none" stroke="${c}" stroke-width="2"/><path d="M13 12h8M18 12v3M21 12v2" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    // Đinh ghim: Ghi nhớ, Tóm tắt trọng tâm
    pin: (c) => `<path d="M16 3l5 5-2 2-1-1-4 4v5l-2-2-4 4-1-1 4-4-2-2h5l4-4-1-1 2-2z" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="15" r="1" fill="${c}"/>`,
    // Lá cờ: Chủ đề, Chuyên đề, Bài học
    flag: (c) => `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // Nhóm người thảo luận: Hoạt động nhóm
    users: (c) => `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="7" r="4" fill="none" stroke="${c}" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
    // Cúp vinh quang: Trò chơi, Thử thách, Vận dụng
    trophy: (c) => `<path d="M6 9H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M18 9h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3M6 3h12v7a6 6 0 0 1-12 0V3zM12 16v4M8 20h8" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
    // Dấu hỏi bo tròn: Câu hỏi, Thắc mắc
    question: (c) => `<circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="2"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="${c}"/>`,
    // Ngôi sao: Vận dụng, Điểm sáng
    star: (c) => `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  // ---------------- DANH MỤC MẪU THẺ SOẠN BÀI SGK ----------------
  const GROUPS = [
    ['4 Hoạt động dạy học (Công văn 5512)', 'all', {
      khoidong: ['Khởi động', { ve: 'badge', kieu: 'pill', icon: 'rocket', tieuDe: 'Khởi động', so: '', mau: 'cam', noiDung: '', w: 145, h: 42 }],
      khampha:  ['Khám phá',  { ve: 'badge', kieu: 'pill', icon: 'magnifier', tieuDe: 'Khám phá', so: '1', mau: 'xanhla', noiDung: '', w: 145, h: 42 }],
      luyentap: ['Luyện tập', { ve: 'badge', kieu: 'pill', icon: 'pencil', tieuDe: 'Luyện tập', so: '1', mau: 'xanhduong', noiDung: '', w: 145, h: 42 }],
      vandung:  ['Vận dụng',  { ve: 'badge', kieu: 'pill', icon: 'star', tieuDe: 'Vận dụng', so: '1', mau: 'tim', noiDung: '', w: 145, h: 42 }],
    }],
    ['Cấu trúc bài giảng & Chuyên đề', 'all', {
      chude:   ['Chủ đề',            { ve: 'badge', kieu: 'ribbon', icon: 'flag', tieuDe: 'Chủ đề', so: '1', mau: 'xanhduong', noiDung: '', w: 160, h: 44 }],
      bai:     ['Bài học',           { ve: 'badge', kieu: 'ribbon', icon: 'book', tieuDe: 'Bài', so: '1', mau: 'ngoc', noiDung: '', w: 140, h: 44 }],
      muctieu: ['Mục tiêu bài học',  { ve: 'badge', kieu: 'pill', icon: 'target', tieuDe: 'Mục tiêu', so: '', mau: 'xanhduong', noiDung: '', w: 135, h: 42 }],
    }],
    ['Đơn vị lý thuyết SGK', 'all', {
      khainiem: ['Khái niệm / Định nghĩa', { ve: 'badge', kieu: 'box', icon: 'book', tieuDe: 'Định nghĩa', so: '', mau: 'xanhduong', noiDung: 'Nội dung định nghĩa hoặc khái niệm cơ bản...', w: 320, h: 100 }],
      dinhly:   ['Định lý / Tính chất',     { ve: 'badge', kieu: 'box', icon: 'lightbulb', tieuDe: 'Định lý', so: '1', mau: 'cam', noiDung: 'Nội dung định lý, tính chất quan trọng...', w: 320, h: 100 }],
      quytac:   ['Quy tắc / Công thức',    { ve: 'badge', kieu: 'box', icon: 'compass', tieuDe: 'Quy tắc', so: '', mau: 'ngoc', noiDung: 'Nội dung quy tắc, công thức tính toán...', w: 320, h: 100 }],
      chuy:     ['Chú ý / Lưu ý',          { ve: 'badge', kieu: 'pill', icon: 'warning', tieuDe: 'Chú ý', so: '', mau: 'do', noiDung: '', w: 125, h: 42 }],
      ghinho:   ['Ghi nhớ / Trọng tâm',     { ve: 'badge', kieu: 'box', icon: 'pin', tieuDe: 'Ghi nhớ', so: '', mau: 'vang', noiDung: 'Kiến thức cốt lõi học sinh cần ghi nhớ...', w: 320, h: 100 }],
    }],
    ['Thực hành, Bài tập & Đề thi', 'all', {
      vidu:     ['Ví dụ mẫu',        { ve: 'badge', kieu: 'pill', icon: 'magnifier', tieuDe: 'Ví dụ', so: '1', mau: 'xanhla', noiDung: '', w: 125, h: 42 }],
      cau:      ['Câu hỏi (Câu 1, Câu 2...)', { ve: 'badge', kieu: 'pill', icon: 'question', tieuDe: 'Câu', so: '1', mau: 'xanhduong', noiDung: '', w: 120, h: 42 }],
      baitap:   ['Bài tập (Bài 1, Bài 2...)', { ve: 'badge', kieu: 'pill', icon: 'paper', tieuDe: 'Bài', so: '1', mau: 'xanhduong', noiDung: '', w: 120, h: 42 }],
      hoatdong: ['Hoạt động nhóm / Thảo luận', { ve: 'badge', kieu: 'pill', icon: 'users', tieuDe: 'Hoạt động nhóm', so: '', mau: 'tim', noiDung: '', w: 175, h: 42 }],
      trochoi:  ['Trò chơi / Thử thách', { ve: 'badge', kieu: 'pill', icon: 'trophy', tieuDe: 'Thử thách', so: '', mau: 'cam', noiDung: '', w: 145, h: 42 }],
    }],
    ['Hướng dẫn & Lời giải', 'all', {
      loigiai:    ['Lời giải',          { ve: 'badge', kieu: 'pill', icon: 'pencil', tieuDe: 'Lời giải', so: '', mau: 'xanhla', noiDung: '', w: 130, h: 42 }],
      phuongphap: ['Phương pháp giải',  { ve: 'badge', kieu: 'box', icon: 'key', tieuDe: 'Phương pháp', so: '', mau: 'cam', noiDung: 'Các bước giải hoặc phương pháp tư duy bài toán...', w: 320, h: 100 }],
    }],
  ];

  const KINDS = {}, MON = {};
  GROUPS.forEach((g) => {
    for (const k in g[2]) {
      KINDS[k] = g[2][k];
      MON[k] = g[1];
    }
  });

  // ---------------- THUỘC TÍNH CHỈNH SỬA Ở KHUNG PHẢI ----------------
  const FIELDS = {
    badge: [
      ['tieuDe', 'Tiêu đề thẻ (vd: Định lý, Câu, Khởi động...)'],
      ['so', 'Số thứ tự (để trống nếu không có số)'],
      ['kieu', 'Kiểu dáng hiển thị', 'sel', {
        pill: 'Thẻ viên thuốc (Pill Badge)',
        ribbon: 'Thẻ ruy băng vạt cờ (Ribbon)',
        box: 'Khung kiến thức SGK (có viền trái & nội dung)',
        icon: 'Icon độc lập (kèm vòng tròn)',
      }],
      ['mau', 'Màu nhận diện SGK', 'sel', {
        xanhduong: 'Xanh dương (Kết Nối Tri Thức)',
        cam: 'Vàng cam (Cánh Diều)',
        xanhla: 'Xanh lá cây (Khám phá / Luyện tập)',
        tim: 'Tím hoa cà (Vận dụng / Chuyên đề)',
        do: 'Đỏ gạch (Chú ý / Cảnh báo)',
        ngoc: 'Xanh ngọc (Chân Trời Sáng Tạo)',
        vang: 'Vàng nắng (Ghi nhớ / Trọng tâm)',
        xam: 'Đơn sắc (Bản in đen trắng)',
      }],
      ['icon', 'Biểu tượng (Icon)', 'sel', {
        book: '📖 Cuốn sách (Khái niệm, Định nghĩa)',
        lightbulb: '💡 Bóng đèn (Định lý, Tính chất)',
        rocket: '🚀 Tên lửa (Khởi động, Mở đầu)',
        magnifier: '🔍 Kính lúp (Khám phá, Ví dụ)',
        compass: '📐 Thước êke (Quy tắc, Công thức)',
        pencil: '✏️ Cây bút (Lời giải, Luyện tập)',
        paper: '📝 Tờ giấy bút (Bài tập, Phiếu học)',
        target: '🎯 Bia bắn (Mục tiêu bài học)',
        warning: '⚠️ Tam giác chấm than (Chú ý)',
        key: '🔑 Chìa khóa (Phương pháp giải)',
        pin: '📌 Đinh ghim (Ghi nhớ, Tóm tắt)',
        flag: '🚩 Lá cờ (Chủ đề, Chuyên đề)',
        users: '👥 Nhóm người (Hoạt động nhóm)',
        trophy: '🏆 Cúp vàng (Trò chơi, Thử thách)',
        question: '❓ Dấu hỏi (Câu hỏi)',
        star: '⭐ Ngôi sao (Vận dụng)',
      }],
      ['noiDung', 'Nội dung ghi chú (chỉ dùng cho kiểu Khung kiến thức SGK)', 'area'],
      ['dam', 'Chữ đậm', 'chk'],
    ],
  };

  const HELP = {
    badge: '<b>Thẻ đề mục & Icon bài học chuẩn SGK GDPT 2018</b>: Giúp đồng bộ giao diện giáo án, tài liệu học tập, phiếu bài tập và đề thi. Hỗ trợ 4 hoạt động dạy học Công văn 5512 (Khởi động, Khám phá, Luyện tập, Vận dụng) và các đơn vị kiến thức (Định nghĩa, Định lý, Ví dụ, Lời giải...).',
  };

  const fieldUse = (o, k) => (k === 'noiDung' ? o.kieu === 'box' : true);
  const fieldLabel = (o, k, d) => d;

  // ---------------- HÀM VẼ (RENDER SVG) ----------------
  function render(o, w, h) {
    const W = Math.max(40, w || o.w || 140);
    const H = Math.max(28, h || o.h || 42);
    const th = THEMES[o.mau] || THEMES.xanhduong;
    const kieu = o.kieu || 'pill';
    const iconKey = o.icon || 'book';
    const drawIcon = ICONS[iconKey] || ICONS.book;
    const tieuDe = (o.tieuDe || '').trim();
    const so = (o.so || '').trim();
    const textStr = tieuDe + (so ? ' ' + so : '');
    const isBold = o.dam !== false;
    const errors = [];
    const labels = [];
    let svg = '';

    // 1. KIỂU VIÊN THUỐC (PILL BADGE) - Rất trang nhã, chuẩn mực
    if (kieu === 'pill') {
      const r = Math.min(H / 2, 22);
      // Nền viên thuốc bo tròn mềm mại
      svg += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r}" fill="${th.bg}" stroke="${th.border}" stroke-width="1.6"/>`;
      // Vòng tròn trắng chứa Icon bên trái
      const iconPad = 4;
      const iconDiam = H - iconPad * 2;
      const iconRadius = iconDiam / 2;
      const iconCX = iconPad + iconRadius;
      const iconCY = H / 2;
      svg += `<circle cx="${iconCX}" cy="${iconCY}" r="${iconRadius}" fill="#ffffff" stroke="${th.border}" stroke-width="1.2"/>`;
      // Icon vector ở giữa vòng tròn trắng
      const scaleIcon = (iconDiam * 0.6) / 24;
      const tx = iconCX - 12 * scaleIcon;
      const ty = iconCY - 12 * scaleIcon;
      svg += `<g transform="translate(${tx}, ${ty}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      // Chữ tiêu đề
      const fontSize = Math.max(12, Math.min(18, Math.round(H * 0.42)));
      const textX = iconCX + iconRadius + 8;
      const textY = H / 2 + fontSize * 0.36;
      svg += `<text x="${textX}" y="${textY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="${fontSize}" font-weight="${isBold ? '700' : '600'}" fill="${th.text}">${textStr}</text>`;
    }

    // 2. KIỂU RUY BĂNG VẠT CỜ (RIBBON BANNER) - Thích hợp cho Chủ đề, Bài học
    else if (kieu === 'ribbon') {
      const r = 6;
      const vCut = 12; // Góc khoét đuôi cờ bên phải
      const p = `M 1,1 L ${W - vCut},1 L ${W - 2},${H / 2} L ${W - vCut},${H - 1} L 1,${H - 1} Z`;
      svg += `<path d="${p}" fill="${th.main}" stroke="${th.dark}" stroke-width="1.2"/>`;
      // Dải trang trí sọc trắng nhẹ
      svg += `<path d="M 5,1 L 1,${H / 2} L 5,${H - 1}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4"/>`;
      // Vòng tròn nhỏ chứa icon
      const iconDiam = H - 12;
      const iconCX = 10 + iconDiam / 2;
      const iconCY = H / 2;
      svg += `<circle cx="${iconCX}" cy="${iconCY}" r="${iconDiam / 2}" fill="#ffffff"/>`;
      const scaleIcon = (iconDiam * 0.65) / 24;
      svg += `<g transform="translate(${iconCX - 12 * scaleIcon}, ${iconCY - 12 * scaleIcon}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      // Chữ trắng in hoa trang trọng
      const fontSize = Math.max(12, Math.min(18, Math.round(H * 0.4)));
      const textX = iconCX + iconDiam / 2 + 8;
      const textY = H / 2 + fontSize * 0.36;
      svg += `<text x="${textX}" y="${textY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="${fontSize}" font-weight="${isBold ? '700' : '600'}" fill="#ffffff" letter-spacing="0.3">${textStr.toUpperCase()}</text>`;
    }

    // 3. KIỂU KHUNG KIẾN THỨC SGK (CALLOUT BOX WITH ACCENT BAR)
    else if (kieu === 'box') {
      const r = 8;
      const accentW = 6;
      // Khung nền chính
      svg += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r}" fill="${th.bg}" stroke="${th.border}" stroke-width="1.2"/>`;
      // Dải màu nhấn mép trái (Accent bar) bo góc tròn theo khung
      svg += `<path d="M 1,${r} Q 1,1 ${r},1 L ${accentW + 1},1 L ${accentW + 1},${H - 1} L ${r},${H - 1} Q 1,${H - 1} 1,${H - r} Z" fill="${th.main}"/>`;
      // Tiêu đề phía trên kèm Icon
      const headerY = 26;
      const scaleIcon = 0.85;
      svg += `<g transform="translate(${accentW + 10}, ${headerY - 18}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      svg += `<text x="${accentW + 36}" y="${headerY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="15" font-weight="700" fill="${th.dark}">${textStr}</text>`;
      // Đường phân cách mờ
      svg += `<line x1="${accentW + 8}" y1="${headerY + 8}" x2="${W - 14}" y2="${headerY + 8}" stroke="${th.border}" stroke-width="1" stroke-dasharray="3 3"/>`;
      // Nội dung bên dưới
      const content = o.noiDung || 'Nhập nội dung vào khung này ở bảng Thuộc tính...';
      const lines = content.split('\n');
      lines.slice(0, 4).forEach((line, i) => {
        svg += `<text x="${accentW + 12}" y="${headerY + 28 + i * 19}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="13" fill="${th.text}">${line}</text>`;
      });
    }

    // 4. KIỂU ICON ĐỘC LẬP (STANDALONE ICON)
    else if (kieu === 'icon') {
      const size = Math.min(W, H);
      const cx = W / 2;
      const cy = H / 2;
      const r = size / 2 - 2;
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${th.bg}" stroke="${th.border}" stroke-width="1.8"/>`;
      const scaleIcon = (size * 0.58) / 24;
      svg += `<g transform="translate(${cx - 12 * scaleIcon}, ${cy - 12 * scaleIcon}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
    }

    return { svg, labels, errors };
  }

  root.SoanBai = {
    render,
    GROUPS,
    KINDS,
    MON,
    FIELDS,
    HELP,
    THEMES,
    ICONS,
    fieldUse,
    fieldLabel,
  };
})(typeof window !== 'undefined' ? window : global);
