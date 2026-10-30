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
      khainiem: ['Khái niệm / Định nghĩa', { ve: 'badge', kieu: 'box', icon: 'book', tieuDe: 'Định nghĩa', so: '', mau: 'xanhduong', noiDung: 'Cho tam giác $ABC$ vuông tại $A$. Cạnh huyền là $BC$, hai cạnh góc vuông là $AB$ và $AC$.', chuyi: '', coChu: 15, w: 380, h: 120 }],
      dinhly:   ['Định lý / Tính chất',     { ve: 'badge', kieu: 'box', icon: 'lightbulb', tieuDe: 'Định lý', so: '1', mau: 'cam', noiDung: 'Trong một tam giác vuông, bình phương của cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông:\n$$a^2 = b^2 + c^2$$', chuyi: 'Định lý này còn được gọi là Định lý Pythagore.', coChu: 15, w: 380, h: 165 }],
      quytac:   ['Quy tắc / Công thức',    { ve: 'badge', kieu: 'box', icon: 'compass', tieuDe: 'Quy tắc', so: '', mau: 'ngoc', noiDung: 'Muốn nhân hai luỹ thừa cùng cơ số, ta giữ nguyên cơ số và cộng các số mũ:\n$$a^m \\cdot a^n = a^{m+n}\\quad (a \\ne 0)$$', chuyi: 'Quy ước: $a^0 = 1$ với mọi $a \\ne 0$.', coChu: 15, w: 380, h: 165 }],
      chuy:     ['Chú ý / Lưu ý',          { ve: 'badge', kieu: 'pill', icon: 'warning', tieuDe: 'Chú ý', so: '', mau: 'do', noiDung: '', chuyi: '', w: 125, h: 42 }],
      ghinho:   ['Ghi nhớ / Trọng tâm',     { ve: 'badge', kieu: 'box', icon: 'pin', tieuDe: 'Ghi nhớ', so: '', mau: 'vang', noiDung: 'Phương trình bậc hai $ax^2 + bx + c = 0\\ (a \\ne 0)$ có biệt thức:\n$$\\Delta = b^2 - 4ac$$', chuyi: 'Nếu $\\Delta > 0$: 2 nghiệm phân biệt; $\\Delta = 0$: nghiệm kép; $\\Delta < 0$: vô nghiệm.', coChu: 15, w: 380, h: 165 }],
    }],
    ['Thực hành, Bài tập & Đề thi', 'all', {
      vidu:     ['Ví dụ mẫu',        { ve: 'badge', kieu: 'pill', icon: 'magnifier', tieuDe: 'Ví dụ', so: '1', mau: 'xanhla', noiDung: '', chuyi: '', w: 125, h: 42 }],
      cau:      ['Câu hỏi (Câu 1, Câu 2...)', { ve: 'badge', kieu: 'pill', icon: 'question', tieuDe: 'Câu', so: '1', mau: 'xanhduong', noiDung: '', chuyi: '', w: 120, h: 42 }],
      baitap:   ['Bài tập (Bài 1, Bài 2...)', { ve: 'badge', kieu: 'pill', icon: 'paper', tieuDe: 'Bài', so: '1', mau: 'xanhduong', noiDung: '', chuyi: '', w: 120, h: 42 }],
      hoatdong: ['Hoạt động nhóm / Thảo luận', { ve: 'badge', kieu: 'pill', icon: 'users', tieuDe: 'Hoạt động nhóm', so: '', mau: 'tim', noiDung: '', chuyi: '', w: 175, h: 42 }],
      trochoi:  ['Trò chơi / Thử thách', { ve: 'badge', kieu: 'pill', icon: 'trophy', tieuDe: 'Thử thách', so: '', mau: 'cam', noiDung: '', chuyi: '', w: 145, h: 42 }],
    }],
    ['Hướng dẫn & Lời giải', 'all', {
      loigiai:    ['Lời giải',          { ve: 'badge', kieu: 'pill', icon: 'pencil', tieuDe: 'Lời giải', so: '', mau: 'xanhla', noiDung: '', chuyi: '', w: 130, h: 42 }],
      phuongphap: ['Phương pháp giải',  { ve: 'badge', kieu: 'box', icon: 'key', tieuDe: 'Phương pháp', so: '', mau: 'cam', noiDung: 'Bước 1: Tìm tập xác định của phương trình.\nBước 2: Biến đổi về dạng cơ bản $f(x) = g(x)$.\nBước 3: Giải và đối chiếu điều kiện.', chuyi: 'Luôn luôn kiểm tra điều kiện trước khi kết luận nghiệm.', coChu: 15, w: 380, h: 165 }],
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
      ['tieuDe', 'Tiêu đề thẻ (vd: Định nghĩa, Định lý, Khởi động...)'],
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
      ['noiDung', 'Nội dung kiến thức (gõ công thức giữa $...$ hoặc $$...$$)', 'area'],
      ['chuyi', 'Chú ý / Lưu ý / Nhận xét (tùy chọn, gõ công thức giữa $...$)', 'area'],
      ['coChu', 'Cỡ chữ nội dung (px)', 'num'],
      ['dam', 'Chữ tiêu đề in đậm', 'chk'],
    ],
  };

  const HELP = {
    badge: '<b>Thẻ đề mục & Icon bài học chuẩn SGK GDPT 2018</b>: Hỗ trợ gõ công thức toán học giữa hai dấu <code>$...$</code> (trong dòng) hoặc <code>$$...$$</code> (dòng riêng căn giữa), chèn phần <b>Chú ý / Lưu ý</b> trang nhã và đồng bộ màu sắc chuẩn SGK.',
  };

  const fieldUse = (o, k) => {
    if (k === 'noiDung' || k === 'chuyi' || k === 'coChu') return o.kieu === 'box';
    return true;
  };
  const fieldLabel = (o, k, d) => d;

  // ---------------- HÀM ĐỊNH DẠNG CÔNG THỨC TOÁN HỌC ----------------
  function formatMathHtml(str, texFn) {
    if (!str) return '';
    const lines = String(str).split(/\r?\n/);
    const getTex = (expr, inline) => {
      if (texFn) return texFn(expr, inline);
      if (typeof window !== 'undefined' && typeof window.tex === 'function') return window.tex(expr, inline);
      if (typeof MathLive !== 'undefined' && MathLive.convertLatexToMarkup) {
        try { return MathLive.convertLatexToMarkup(expr, { defaultMode: inline ? 'inline-math' : 'math' }); } catch (_) {}
      }
      return '<span class="tex-raw">' + String(expr).replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
    };

    const outLines = lines.map((line) => {
      const trimmed = line.trim();
      // Toàn bộ dòng là công thức display $$...$$
      const mDisp = trimmed.match(/^\$\$([\s\S]+?)\$\$$/);
      if (mDisp) {
        return `<div class="sb-disp-fx ifx disp" data-tex="${encodeURIComponent(mDisp[1])}" title="Nhấp đúp để sửa công thức" style="text-align:center;margin:6px 0;">${getTex(mDisp[1], false)}</div>`;
      }
      // Tách $...$ và $$...$$ trong dòng
      let out = '', last = 0;
      const rx = /\$\$([\s\S]+?)\$\$|\$([^$]*)\$/g;
      let m;
      while ((m = rx.exec(line))) {
        if (m.index > last) out += line.slice(last, m.index).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const isD = m[1] !== undefined;
        const code = isD ? m[1] : m[2];
        if (isD) {
          out += `<div class="sb-disp-fx ifx disp" data-tex="${encodeURIComponent(code)}" title="Nhấp đúp để sửa công thức" style="text-align:center;margin:6px 0;">${getTex(code, false)}</div>`;
        } else {
          out += `<span class="ifx" data-tex="${encodeURIComponent(code)}" title="Nhấp đúp để sửa công thức">${getTex(code, true)}</span>`;
        }
        last = m.index + m[0].length;
      }
      if (last < line.length) out += line.slice(last).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return out;
    });

    return outLines.join('<br>');
  }

  // ---------------- HÀM VẼ (RENDER SVG & HTML) ----------------
  function render(o, w, h, opt) {
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
    let html = '';

    // 1. KIỂU VIÊN THUỐC (PILL BADGE) - Rất trang nhã, chuẩn mực
    if (kieu === 'pill') {
      const r = Math.min(H / 2, 22);
      svg += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r}" fill="${th.bg}" stroke="${th.border}" stroke-width="1.6"/>`;
      const iconPad = 4;
      const iconDiam = H - iconPad * 2;
      const iconRadius = iconDiam / 2;
      const iconCX = iconPad + iconRadius;
      const iconCY = H / 2;
      svg += `<circle cx="${iconCX}" cy="${iconCY}" r="${iconRadius}" fill="#ffffff" stroke="${th.border}" stroke-width="1.2"/>`;
      const scaleIcon = (iconDiam * 0.6) / 24;
      const tx = iconCX - 12 * scaleIcon;
      const ty = iconCY - 12 * scaleIcon;
      svg += `<g transform="translate(${tx}, ${ty}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      const fontSize = Math.max(12, Math.min(18, Math.round(H * 0.42)));
      const textX = iconCX + iconRadius + 8;
      const textY = H / 2 + fontSize * 0.36;
      svg += `<text x="${textX}" y="${textY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="${fontSize}" font-weight="${isBold ? '700' : '600'}" fill="${th.text}">${textStr}</text>`;
    }

    // 2. KIỂU RUY BĂNG VẠT CỜ (RIBBON BANNER) - Thích hợp cho Chủ đề, Bài học
    else if (kieu === 'ribbon') {
      const r = 6;
      const vCut = 12;
      const p = `M 1,1 L ${W - vCut},1 L ${W - 2},${H / 2} L ${W - vCut},${H - 1} L 1,${H - 1} Z`;
      svg += `<path d="${p}" fill="${th.main}" stroke="${th.dark}" stroke-width="1.2"/>`;
      svg += `<path d="M 5,1 L 1,${H / 2} L 5,${H - 1}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.4"/>`;
      const iconDiam = H - 12;
      const iconCX = 10 + iconDiam / 2;
      const iconCY = H / 2;
      svg += `<circle cx="${iconCX}" cy="${iconCY}" r="${iconDiam / 2}" fill="#ffffff"/>`;
      const scaleIcon = (iconDiam * 0.65) / 24;
      svg += `<g transform="translate(${iconCX - 12 * scaleIcon}, ${iconCY - 12 * scaleIcon}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      const fontSize = Math.max(12, Math.min(18, Math.round(H * 0.4)));
      const textX = iconCX + iconDiam / 2 + 8;
      const textY = H / 2 + fontSize * 0.36;
      svg += `<text x="${textX}" y="${textY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="${fontSize}" font-weight="${isBold ? '700' : '600'}" fill="#ffffff" letter-spacing="0.3">${textStr.toUpperCase()}</text>`;
    }

    // 3. KIỂU KHUNG KIẾN THỨC SGK (CALLOUT BOX WITH ACCENT BAR)
    else if (kieu === 'box') {
      const r = 8;
      const accentW = 6;
      svg += `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${r}" fill="${th.bg}" stroke="${th.border}" stroke-width="1.2"/>`;
      svg += `<path d="M 1,${r} Q 1,1 ${r},1 L ${accentW + 1},1 L ${accentW + 1},${H - 1} L ${r},${H - 1} Q 1,${H - 1} 1,${H - r} Z" fill="${th.main}"/>`;
      const headerY = 24;
      const scaleIcon = 0.85;
      svg += `<g transform="translate(${accentW + 10}, ${headerY - 17}) scale(${scaleIcon})">${drawIcon(th.main)}</g>`;
      svg += `<text x="${accentW + 36}" y="${headerY}" font-family="Segoe UI, -apple-system, Roboto, sans-serif" font-size="15" font-weight="700" fill="${th.dark}">${textStr}</text>`;
      svg += `<line x1="${accentW + 8}" y1="35" x2="${W - 14}" y2="35" stroke="${th.border}" stroke-width="1" stroke-dasharray="3 3"/>`;

      // HTML Overlay cho nội dung văn bản + công thức toán học + chú ý
      const texFn = opt && opt.tex;
      const fs = o.coChu || 15;
      const bodyHtml = formatMathHtml(o.noiDung || '', texFn);
      const chuyiHtml = o.chuyi ? formatMathHtml(o.chuyi, texFn) : '';

      html = `<div class="sb-body" style="position:absolute;left:${accentW + 14}px;top:42px;right:14px;bottom:10px;overflow-y:auto;pointer-events:auto;user-select:text;font-family:'Times New Roman',Cambria,serif;font-size:${fs}px;line-height:1.55;color:${th.text};">` +
        `<div class="sb-noidung">${bodyHtml}</div>` +
        (chuyiHtml ? `<div class="sb-chuyi" style="margin-top:8px;padding:5px 10px;background:${th.border}33;border-left:3.5px solid ${th.main};border-radius:4px;font-size:${Math.max(12, fs - 1.5)}px;color:${th.dark};line-height:1.45;"><span style="font-weight:700;margin-right:5px;">⚠️ Chú ý:</span><span>${chuyiHtml}</span></div>` : '') +
        `</div>`;
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

    return { svg, html, labels, errors };
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
