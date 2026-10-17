// Sinh tệp cầu nối build/cau-noi/toanviet-bridge.ps1 (đưa vào bộ cài) từ office-bridge.js.
//   node build/tao-cau-noi.js            ghi tệp
//   node build/tao-cau-noi.js --kiem-tra  chỉ kiểm tra tệp đã khớp mã nguồn (dùng trong npm test)
const fs = require('fs');
const path = require('path');
const { PS_LOOP } = require('../office-bridge');
const out = path.join(__dirname, 'cau-noi', 'toanviet-bridge.ps1');
const want = '﻿' + PS_LOOP;
if (process.argv.includes('--kiem-tra')) {
  const ok = fs.existsSync(out) && fs.readFileSync(out, 'utf8') === want;
  console.log(ok ? 'Tệp cầu nối khớp mã nguồn' : 'Tệp cầu nối CŨ: chạy node build/tao-cau-noi.js');
  process.exit(ok ? 0 : 1);
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, want, 'utf8');
console.log('Đã ghi ' + out);
