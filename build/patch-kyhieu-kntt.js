// Đồng bộ ký hiệu với sách Toán 6 – 12 Kết nối tri thức (đối chiếu trên sgk.olm.vn):
//  - song song viết "AB // CD" (hai gạch chéo), không dùng ∥
//  - khoảng cách d(M, (P)) với chữ d đứng
//  - nguyên hàm, tích phân viết ∫f(x)dx (dx liền, d đứng)
//  - thêm mẫu bảng GT / KL (giả thiết – kết luận), tích có hướng [u, v], phần bù C_E A
//   node build/patch-kyhieu-kntt.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const SS = String.raw`\\mathrel{//}`; // trong mã nguồn JS (chuỗi có \\)
function patch(file, pairs) {
  let s = fs.readFileSync(R(file), 'utf8');
  for (const [a, b, all] of pairs) {
    if (!s.includes(a)) { console.log('không thấy trong ' + file + ': ' + a); continue; }
    s = all ? s.split(a).join(b) : s.replace(a, () => b);
  }
  fs.writeFileSync(R(file), s);
  console.log('ok ' + file);
}
patch('src/symbols.js', [
  // \parallel (không đụng \nparallel) -> //
  [String.raw`'\\parallel'`, `'${SS}'`, true],
  [String.raw`"\\parallel"`, `"${SS}"`, true],
  [String.raw`a\\parallel b`, `a${SS} b`, true],
  [String.raw`#?\\parallel #?`, `#?${SS} #?`, true],
  [String.raw`MN\\parallel BC`, `MN${SS} BC`, true],
  [String.raw`a\\parallel\\left(P\\right)`, `a${SS}\\left(P\\right)`, true],
  [String.raw`#?\\parallel\\left(#?\\right)`, `#?${SS}\\left(#?\\right)`, true],
  [String.raw`\\left(P\\right)\\parallel\\left(Q\\right)`, `\\left(P\\right)${SS}\\left(Q\\right)`, true],
  [String.raw`\\left(#?\\right)\\parallel\\left(#?\\right)`, `\\left(#?\\right)${SS}\\left(#?\\right)`, true],
  // dx liền như sách
  [String.raw`\\,\\mathrm{d}x`, String.raw`\\mathrm{d}x`, true],
  // khoảng cách: d đứng
  [String.raw`'d\\left(#?,#?\\right)'`, String.raw`'\\mathrm{d}\\left(#?,#?\\right)'`, true],
  [String.raw`"d\\left(#?,#?\\right)"`, String.raw`"\\mathrm{d}\\left(#?,#?\\right)"`, true],
  // mẫu mới trong nhóm Hình học & Vectơ: tích có hướng, bảng GT / KL, phần bù
  [String.raw`'\\triangle', '\\perp',`, String.raw`'\\triangle', '\\perp', ['\\left[\\vec{u},\\vec{v}\\right]', '\\left[\\vec{#?},\\vec{#?}\\right]'], ['\\begin{array}{c|l}\\text{GT}&\\triangle ABC\\\\\\hline\\text{KL}&AB=AC\\end{array}', '\\begin{array}{c|l}\\text{GT}&#?\\\\\\hline\\text{KL}&#?\\end{array}'], ['C_{E}A', 'C_{#?}#?'],`],
]);
patch('src/app.js', [
  [String.raw`\\,\\mathrm{d}x`, String.raw`\\mathrm{d}x`, true],
  [String.raw`'/': '\\parallel'`, `'/': '${SS}'`],
]);
