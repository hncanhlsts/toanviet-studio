// Kiểm tra kịch bản hình ToanViet bằng đúng bộ dựng hình của phần mềm (plane.js, mathexpr.js chép kèm skill).
//   node scripts/kiem-tra.js <tệp>      tệp: các dòng kịch bản, hoặc cả câu trả lời có khối [HÌNH TOANVIET] … [/HÌNH TOANVIET]
// In ra: dòng lỗi (nếu có) và toạ độ từng điểm của mỗi hình. Mã thoát 1 khi có lỗi.
const fs = require('fs');
const path = require('path');
global.window = global;
require(path.join(__dirname, 'mathexpr.js'));
require(path.join(__dirname, 'plane.js'));
const f = process.argv[2];
if (!f) { console.log('Cách dùng: node kiem-tra.js <tệp kịch bản hoặc câu trả lời>'); process.exit(2); }
const text = fs.readFileSync(f, 'utf8').replace(/\r\n?/g, '\n');
const blocks = [...text.matchAll(/\[\s*H[ÌI]NH\s+TOANVIET\s*\]([\s\S]*?)\[\s*\/\s*H[ÌI]NH(?:\s+TOANVIET)?\s*\]/giu)].map((m) => m[1]);
if (!blocks.length) blocks.push(text);
let bad = 0;
blocks.forEach((b, i) => {
  const script = b.replace(/^\s*```.*$/gm, '').split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  console.log('== Hình ' + (i + 1));
  const errs = window.Plane.loi(script);
  errs.forEach((e) => console.log('  LỖI  ' + e));
  bad += errs.length;
  const P = window.Plane.points(script);
  Object.keys(P).forEach((n) => console.log('  ' + n + ' = (' + P[n].map((v) => Math.round(v * 1000) / 1000).join(', ') + ')'));
  if (!errs.length) console.log('  Không có lỗi.');
});
process.exit(bad ? 1 : 0);
