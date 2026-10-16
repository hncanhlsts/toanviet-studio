// Thêm thông tin bản quyền: trình đơn Trợ giúp ▸ Giới thiệu, thanh trạng thái, package.json
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 60)); return s.replace(a, () => b); };

let m = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
m = rep(m, "      { label: 'Công cụ lập trình', role: 'toggleDevTools' },\n    ] },", `      { label: 'Công cụ lập trình', role: 'toggleDevTools' },
    ] },
    { label: 'Trợ giúp', submenu: [
      { label: 'Giới thiệu ToanViet Studio', click: showAbout },
    ] },`);
m = rep(m, '// Chụp một đối tượng', `function showAbout() {
  dialog.showMessageBox(win, {
    type: 'info', title: 'Giới thiệu', buttons: ['Đóng'],
    message: 'ToanViet Studio ' + app.getVersion(),
    detail: 'Soạn công thức Toán, đồ thị, bảng biến thiên, miền nghiệm và hình không gian cho chương trình Toán phổ thông Việt Nam.\\n\\n' +
      'Thiết kế bởi: Thầy Hoàng Ngọc Cảnh\\nGiáo viên trường THCS - THPT Đinh Thiện Lý\\nEmail: canhld@gmail.com\\n\\n© 2026 Hoàng Ngọc Cảnh. Phát hành theo giấy phép MIT.',
  });
}
ipcMain.on('about', showAbout);

// Chụp một đối tượng`);
fs.writeFileSync('main.js', m);

let p = fs.readFileSync('preload.js', 'utf8');
p = rep(p, "  quit: () => ipcRenderer.send('quit'),", "  quit: () => ipcRenderer.send('quit'),\n  about: () => ipcRenderer.send('about'),");
fs.writeFileSync('preload.js', p);

let h = fs.readFileSync('src/index.html', 'utf8');
h = rep(h, '<span id="zoomlbl">100%</span>', '<a id="credit" title="Thiết kế bởi: Thầy Hoàng Ngọc Cảnh — Giáo viên trường THCS - THPT Đinh Thiện Lý — canhld@gmail.com">© Thầy Hoàng Ngọc Cảnh · THCS - THPT Đinh Thiện Lý</a><span id="zoomlbl">100%</span>');
fs.writeFileSync('src/index.html', h);

let a = fs.readFileSync('src/app.js', 'utf8');
a = rep(a, "  const sk = $('#solidKind');", "  $('#credit').onclick = () => { if (api && api.about) api.about(); };\n  const sk = $('#solidKind');");
fs.writeFileSync('src/app.js', a);

fs.appendFileSync('src/styles.css', `
/* bản quyền trên thanh trạng thái */
#status { gap: 16px; }
#status #msg { flex: 1; }
#credit { cursor: pointer; opacity: .92; white-space: nowrap; }
#credit:hover { text-decoration: underline; opacity: 1; }
`);

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.4.0';
pk.author = { name: 'Hoàng Ngọc Cảnh', email: 'canhld@gmail.com' };
pk.license = 'MIT';
pk.build.copyright = '© 2026 Hoàng Ngọc Cảnh - Giáo viên trường THCS - THPT Đinh Thiện Lý';
pk.build.nsis.license = 'build/license.txt';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));

// build/license.txt (giấy phép MIT) giữ nguyên, không ghi đè
console.log('about patched');
