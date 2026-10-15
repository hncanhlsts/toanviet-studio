const fs = require('fs');
let s = fs.readFileSync('src/app.js', 'utf8').replace(/\r\n/g, '\n');
const a = s.indexOf('window.__prepCapture'), b = s.indexOf('}, 120);', a);
if (a < 0 || b < 0) throw new Error('prepCapture not found');
s = s.slice(0, b) + '}, 40);' + s.slice(b + '}, 120);'.length);
fs.writeFileSync('src/app.js', s);

let g = fs.readFileSync('huong-dan/huong-dan.html', 'utf8').replace(/\r\n/g, '\n');
const rep = (x, y) => { if (!g.includes(x)) console.log('MISSING: ' + x.slice(0, 60)); g = g.replace(x, () => y); };
rep('Phiên bản 1.9.0', 'Phiên bản 2.0.0');
rep('ToanVietStudio-Setup-1.9.0.exe', 'ToanVietStudio-Setup-2.0.0.exe');
rep('<p>Bốn nút trong nhóm <b>Thống nhất định dạng công thức</b>', '<p>Sáu nút trong nhóm <b>Thống nhất định dạng công thức</b>');
rep('  <tr><td>ToanViet → Equation</td><td>Thay mọi công thức ToanViet bằng công thức Equation của Word</td></tr>', `  <tr><td>ToanViet → Equation</td><td>Thay mọi công thức ToanViet bằng công thức Equation của Word</td></tr>
  <tr><td>LaTeX → ToanViet</td><td>Dành cho nội dung dán từ các trợ lí AI: mọi đoạn mã LaTeX viết giữa <code>$…$</code>, <code>$$…$$</code>, <code>\\(…\\)</code>, <code>\\[…\\]</code> được thay bằng công thức ToanViet</td></tr>
  <tr><td>ToanViet → LaTeX</td><td>Thay mọi công thức ToanViet bằng mã LaTeX đặt giữa hai dấu <code>$</code></td></tr>`);
rep('<div class="col">Equation → ToanViet<br>ToanViet → Equation</div>', '<div class="col">Equation → ToanViet<br>ToanViet → Equation</div><div class="col">LaTeX → ToanViet<br>ToanViet → LaTeX</div>');
fs.writeFileSync('huong-dan/huong-dan.html', g);
console.log('v2.0b patched');
