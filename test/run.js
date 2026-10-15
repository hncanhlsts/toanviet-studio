// Bộ kiểm thử tự động:  npm test        (cập nhật ảnh chuẩn của hình mẫu: npm test -- --cap-nhat)
// Chạy các tệp test/*.test.js trong một cửa sổ ẩn có đủ các mô-đun của phần mềm.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const update = process.argv.includes('--cap-nhat');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: false } });
  let failed = 0;
  win.webContents.on('console-message', (e) => {
    const m = e.message;
    if (/^(✔|✘|•|==)/.test(m)) console.log(m);
    if (/^✘/.test(m)) failed++;
  });
  await win.loadFile(path.join(__dirname, 'harness.html'));
  const tests = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort();
  const snapFile = path.join(__dirname, 'anh-chuan.json');
  const snaps = fs.existsSync(snapFile) ? JSON.parse(fs.readFileSync(snapFile, 'utf8')) : {};
  await win.webContents.executeJavaScript('window.__SNAPS = ' + JSON.stringify(snaps) + '; window.__UPDATE = ' + update + ';');
  for (const t of tests) await win.webContents.executeJavaScript('{' + fs.readFileSync(path.join(__dirname, t), 'utf8') + '\n};0');
  const res = await win.webContents.executeJavaScript('window.__summary()');
  if (update) { fs.writeFileSync(snapFile, JSON.stringify(res.snaps, null, 1)); console.log('Đã cập nhật ' + Object.keys(res.snaps).length + ' ảnh chuẩn'); }
  console.log(`\nKết quả: ${res.pass} đạt, ${res.fail} lỗi`);
  app.exit(res.fail ? 1 : 0);
});
