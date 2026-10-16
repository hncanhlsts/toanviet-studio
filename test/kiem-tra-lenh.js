// Kiểm tra tĩnh: mọi lệnh gọi từ menu (main.js) và nút trên thanh công cụ (index.html) đều có trong bảng lệnh CMD (app.js)
//   node test/kiem-tra-lenh.js
const fs = require('fs');
const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const app = R('src/app.js');
const a = app.indexOf('const CMD = {'), b = app.indexOf('\n  };', a);
const block = app.slice(a, b);
// tên lệnh ở đầu dòng, hoặc sau dấu phẩy (nhiều lệnh trên một dòng)
const keys = new Set([...block.matchAll(/(?:^\s{4}|,\s)(?:'([^']+)'|([A-Za-z_][\w]*))\s*:\s*(?:async\s*)?\(/gm)].map((m) => m[1] || m[2]));
const sends = [...new Set([...R('main.js').matchAll(/send\('([^']+)'\)/g)].map((m) => m[1]))];
const btns = [...new Set([...R('src/index.html').matchAll(/data-cmd="([^"]+)"/g)].map((m) => m[1]))];
const miss = sends.filter((c) => !keys.has(c)).map((c) => 'menu: ' + c).concat(btns.filter((c) => !keys.has(c)).map((c) => 'nút: ' + c));
console.log('Bảng lệnh có ' + keys.size + ' lệnh; menu gọi ' + sends.length + ', nút gọi ' + btns.length + '.');
console.log(miss.length ? 'THIẾU: ' + miss.join(', ') : 'Không thiếu lệnh nào.');
process.exit(miss.length ? 1 : 0);
