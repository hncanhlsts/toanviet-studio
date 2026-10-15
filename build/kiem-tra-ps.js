// Tách kịch bản PowerShell của cầu nối Word/PowerPoint trong main.js ra tệp để kiểm tra cú pháp
//   node build/kiem-tra-ps.js <tệp ra .ps1>
const fs = require('fs');
const s = fs.readFileSync(require('path').join(__dirname, '..', 'main.js'), 'utf8');
const a = s.indexOf('const OFFICE_PS = String.raw`'), b = s.indexOf('`;', a);
fs.writeFileSync(process.argv[2], '﻿' + s.slice(a + 'const OFFICE_PS = String.raw`'.length, b));
