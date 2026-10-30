// Kiểm thử mô-đun Hỗ trợ soạn bài SGK (src/soanbai.js)
nhom('Hỗ trợ soạn bài: Icon, thẻ đề mục, khung hoạt động SGK (soanbai.js)');

thu('mọi mẫu Soạn bài SGK dựng được, SVG hợp lệ không lỗi XML', () => {
  dung(typeof SoanBai !== 'undefined', 'SoanBai đã được nạp');
  dung(SoanBai.GROUPS.length >= 5, 'Có đủ ít nhất 5 nhóm soạn bài chuẩn SGK');

  Object.keys(SoanBai.KINDS).forEach((k) => {
    const d = SoanBai.KINDS[k][1];
    const r = SoanBai.render(Object.assign({ kind: k }, d), d.w, d.h);
    dung(!r.errors.length, k + ' có lỗi: ' + r.errors.join('; '));
    dung(r.svg && r.svg.length > 50, k + ' chuỗi SVG quá ngắn');

    // Kiểm tra tính hợp lệ XML của chuỗi SVG sinh ra
    const doc = new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + r.svg + '</svg>', 'image/svg+xml');
    const pe = doc.querySelector('parsererror');
    if (pe) throw new Error(k + ' tạo ra SVG lỗi cú pháp XML: ' + pe.textContent.replace(/\s+/g, ' ').slice(0, 160));
  });
});

thu('4 hoạt động dạy học chuẩn CV 5512 (Khởi động, Khám phá, Luyện tập, Vận dụng)', () => {
  const g1 = SoanBai.GROUPS[0];
  dung(g1[0].includes('5512'), 'Nhóm 1 là 4 hoạt động CV 5512');
  dung(SoanBai.KINDS.khoidong && SoanBai.KINDS.khampha && SoanBai.KINDS.luyentap && SoanBai.KINDS.vandung, 'Có đủ 4 hoạt động');

  const rKD = SoanBai.render({ ve: 'badge', kieu: 'pill', icon: 'rocket', tieuDe: 'Khởi động', mau: 'cam' }, 150, 42);
  dung(rKD.svg.includes('Khởi động'), 'Thẻ Khởi động có chữ');
  dung(rKD.svg.includes('rect') && rKD.svg.includes('circle'), 'Thẻ Khởi động có hình khối SVG');
});

thu('các kiểu dáng hiển thị: pill, ribbon, box, icon', () => {
  const kPill = SoanBai.render({ ve: 'badge', kieu: 'pill', icon: 'book', tieuDe: 'Khái niệm', so: '1' }, 140, 42);
  dung(kPill.svg.includes('rx="'), 'Pill có bo tròn bán kính r');

  const kRibbon = SoanBai.render({ ve: 'badge', kieu: 'ribbon', icon: 'flag', tieuDe: 'Chủ đề', so: '1' }, 160, 44);
  dung(kRibbon.svg.includes('<path d="M 1,1 L'), 'Ribbon có vạt cờ');

  const kBox = SoanBai.render({ ve: 'badge', kieu: 'box', icon: 'lightbulb', tieuDe: 'Định lý', so: '1', noiDung: 'Nội dung định lý' }, 320, 100);
  dung(kBox.html && kBox.html.includes('Nội dung định lý'), 'Box HTML có chứa nội dung định lý');

  const kIcon = SoanBai.render({ ve: 'badge', kieu: 'icon', icon: 'target' }, 40, 40);
  dung(kIcon.svg.includes('circle'), 'Icon độc lập vẽ trên nền tròn');
});

thu('khung Định lý / Định nghĩa: hỗ trợ công thức Toán học và khối Chú ý', () => {
  const dly = SoanBai.render({
    ve: 'badge',
    kieu: 'box',
    icon: 'lightbulb',
    tieuDe: 'Định lý',
    so: 'Pythagore',
    mau: 'cam',
    noiDung: 'Trong tam giác vuông: $$a^2 = b^2 + c^2$$\nVới $a$ là độ dài cạnh huyền.',
    chuyi: 'Chỉ áp dụng với góc vuông $90^\\circ$.',
  }, 380, 160);

  dung(dly.html.includes('sb-body'), 'Có phần thân HTML sb-body');
  dung(dly.html.includes('sb-disp-fx'), 'Có công thức display căn giữa sb-disp-fx');
  dung(dly.html.includes('ifx'), 'Có thẻ inline formula ifx');
  dung(dly.html.includes('sb-chuyi'), 'Có khối chú ý sb-chuyi');
  dung(dly.html.includes('⚠️ Chú ý:'), 'Có nhãn ⚠️ Chú ý');
  dung(dly.html.includes('90^\\circ') || dly.html.includes('90'), 'Chú ý chứa công thức toán');
});

thu('bảng màu nhận diện SGK phong phú và đồng bộ', () => {
  const themes = ['xanhduong', 'cam', 'xanhla', 'tim', 'do', 'ngoc', 'vang', 'xam'];
  themes.forEach((m) => {
    dung(SoanBai.THEMES[m] && SoanBai.THEMES[m].main, 'Màu ' + m + ' hợp lệ');
    const r = SoanBai.render({ ve: 'badge', mau: m, tieuDe: 'Mẫu ' + m }, 130, 40);
    dung(r.svg.includes(SoanBai.THEMES[m].main), 'SVG áp dụng đúng mã màu');
  });
});
