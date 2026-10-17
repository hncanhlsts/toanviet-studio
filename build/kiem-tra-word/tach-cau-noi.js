// Tách mã cầu nối Office (OFFICE_PS trong office-bridge.js) ra tệp .ps1 để các kịch bản thử Word chạy đúng mã phần mềm đang dùng
//   node build/kiem-tra-word/tach-cau-noi.js <office-bridge.js> <ra.ps1>
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const m = fs.readFileSync(src, 'utf8').match(/const OFFICE_PS = String\.raw`([\s\S]*?)`;/);
if (!m) { console.error('Không thấy OFFICE_PS trong ' + src); process.exit(1); }
fs.writeFileSync(out, '﻿' + m[1], 'utf8');
