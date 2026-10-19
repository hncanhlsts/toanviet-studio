// Tạo từ điển lời văn đề Toán cho bộ sửa lỗi nhận chữ (src/ocr-tudien.js): đếm tần suất từ và cặp từ liền nhau
// (chữ thường) trong build/tu-vung-de-toan.txt và các bộ đề kiểm thử. Chạy: node build/tao-tu-dien-ocr.js
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..');
const texts = [fs.readFileSync(path.join(__dirname, 'tu-vung-de-toan.txt'), 'utf8')];
// từ thông dụng (danh sách từ, không phải câu): chỉ thêm vào danh sách từ, không tạo cặp từ
const chung = fs.readFileSync(path.join(__dirname, 'tu-vung-chung.txt'), 'utf8').toLowerCase().match(/[a-zà-ỹđ]+/g) || [];
fs.readdirSync(path.join(R, 'test')).filter((f) => /^baigiai-.*\.txt$/.test(f)).forEach((f) => texts.push(fs.readFileSync(path.join(R, 'test', f), 'utf8')));
// test/de-hinh-lop.js là bộ đề dùng để ĐO độ chính xác (test/ocr-chay.js) nên không đưa vào từ điển
for (const f of ['de-hinh-phang.js']) require(path.join(R, 'test', f)).forEach((x) => texts.push(String(x[1])));
const words = (s) => String(s).replace(/\$[^$]*\$/g, ' ').replace(/\\[a-zA-Z]+/g, ' ').toLowerCase().match(/[a-zà-ỹđ]+/g) || [];
const uni = {}, bi = {};
// tách câu theo dấu chấm, chấm phẩy, hai chấm, xuống dòng, ngoặc (dấu phẩy không tách: "…, và" không phải đầu câu)
texts.forEach((t) => t.split(/[.;:\n()]/).forEach((sent) => {
  const ws = words(sent);
  ws.forEach((w, i) => { uni[w] = (uni[w] || 0) + 1; const k = (i ? ws[i - 1] : '^') + ' ' + w; bi[k] = (bi[k] || 0) + 1; }); // '^': đầu câu
}));
// bỏ "từ" một chữ cái (tên tia x, y, tên đường thẳng d…) — không sửa dấu chúng
chung.forEach((w) => { uni[w] = (uni[w] || 0) + 1; });
Object.keys(uni).forEach((w) => { if (w.length < 2) delete uni[w]; });
const out = '// Tạo tự động bởi build/tao-tu-dien-ocr.js — không sửa tay. Tần suất từ (uni) và cặp từ (bi) trong lời văn đề Toán.\n' +
  '(function (root) { root.OcrTuDien = ' + JSON.stringify({ uni, bi }) + ';\n' +
  "if (typeof module !== 'undefined' && module.exports) module.exports = root.OcrTuDien; })(typeof window !== 'undefined' ? window : globalThis);\n";
fs.writeFileSync(path.join(R, 'src', 'ocr-tudien.js'), out);
console.log('Từ điển: ' + Object.keys(uni).length + ' từ, ' + Object.keys(bi).length + ' cặp từ');
