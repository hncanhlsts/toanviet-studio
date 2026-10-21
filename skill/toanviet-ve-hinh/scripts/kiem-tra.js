// Kiểm tra kịch bản hình ToanViet bằng đúng bộ đọc và bộ dựng hình của phần mềm (baigiai-chuyen.js, plane.js, space.js,
// mathexpr.js chép kèm skill — cùng cách ToanViet đọc câu trả lời của AI khi giáo viên dán vào).
//   node scripts/kiem-tra.js <tệp>      tệp: câu trả lời có khối mã ```toanviet / ```toanviet-khonggian, hoặc các dòng kịch bản
// In ra: dòng lỗi (nếu có) và toạ độ từng điểm của mỗi hình. Mã thoát 1 khi có lỗi hoặc không thấy hình nào.
const fs = require('fs');
const path = require('path');
global.window = global;
require(path.join(__dirname, 'mathexpr.js'));
require(path.join(__dirname, 'plane.js'));
require(path.join(__dirname, 'space.js'));
const BaiGiai = require(path.join(__dirname, 'baigiai-chuyen.js'));
const f = process.argv[2];
if (!f) { console.log('Cách dùng: node kiem-tra.js <tệp kịch bản hoặc câu trả lời>'); process.exit(2); }
const ks = BaiGiai.khoiCau(fs.readFileSync(f, 'utf8'));
if (!ks.length) { console.log('Không thấy kịch bản hình nào (cần khối mã ```toanviet).'); process.exit(1); }
let bad = 0;
ks.forEach((k, i) => {
  const M = k.sp.type === 'space' ? window.Space : window.Plane;
  console.log('== Hình ' + (i + 1) + (k.so ? ' (Câu ' + k.so + ')' : '') + (k.sp.type === 'space' ? ' — không gian' : ' — phẳng'));
  const errs = BaiGiai.loiKhoi(k.sp);
  errs.forEach((e) => console.log('  LỖI  ' + e));
  bad += errs.length;
  const P = M.points(k.sp.script);
  Object.keys(P).forEach((n) => console.log('  ' + n + ' = (' + P[n].map((v) => Math.round(v * 1000) / 1000).join(', ') + ')'));
  if (!errs.length) console.log('  Không có lỗi.');
});
process.exit(bad ? 1 : 0);
