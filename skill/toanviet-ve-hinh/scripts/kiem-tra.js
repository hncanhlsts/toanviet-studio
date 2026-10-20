// Kiểm tra kịch bản hình ToanViet bằng đúng bộ dựng hình của phần mềm (plane.js, space.js, mathexpr.js chép kèm skill).
//   node scripts/kiem-tra.js <tệp>      tệp: các dòng kịch bản, hoặc cả câu trả lời có khối [HÌNH TOANVIET] … [/HÌNH TOANVIET]
//                                        (hình không gian: [HÌNH KHÔNG GIAN TOANVIET] … [/HÌNH KHÔNG GIAN TOANVIET])
// In ra: dòng lỗi (nếu có) và toạ độ từng điểm của mỗi hình. Mã thoát 1 khi có lỗi.
const fs = require('fs');
const path = require('path');
global.window = global;
require(path.join(__dirname, 'mathexpr.js'));
require(path.join(__dirname, 'plane.js'));
require(path.join(__dirname, 'space.js'));
const f = process.argv[2];
if (!f) { console.log('Cách dùng: node kiem-tra.js <tệp kịch bản hoặc câu trả lời>'); process.exit(2); }
const text = fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const RX = /\[\s*H[ÌI]NH\s+(KH[ÔO]NG\s+GIAN\s+)?TOANVIET\s*\]([\s\S]*?)\[\s*\/\s*H[ÌI]NH(?:\s+(?:KH[ÔO]NG\s+GIAN\s+)?TOANVIET)?\s*\]/giu;
const blocks = [...text.matchAll(RX)].map((m) => ({ kg: !!m[1], body: m[2] }));
if (!blocks.length) blocks.push({ kg: false, body: text });
let bad = 0;
blocks.forEach((b, i) => {
  const script = b.body.replace(/^\s*```.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  // hình không gian: theo thẻ, hoặc toạ độ có ba số
  const kg = b.kg || /^[A-Z][^=\n]*=\s*\(\s*[^,()]+,[^,()]+,[^,()]+\)\s*(?:#.*)?$/m.test(script);
  const M = kg ? window.Space : window.Plane;
  console.log('== Hình ' + (i + 1) + (kg ? ' (không gian)' : ' (phẳng)'));
  const errs = M.loi(script);
  errs.forEach((e) => console.log('  LỖI  ' + e));
  bad += errs.length;
  const P = M.points(script);
  Object.keys(P).forEach((n) => console.log('  ' + n + ' = (' + P[n].map((v) => Math.round(v * 1000) / 1000).join(', ') + ')'));
  if (!errs.length) console.log('  Không có lỗi.');
});
process.exit(bad ? 1 : 0);
