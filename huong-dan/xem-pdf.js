// Kiểm tra PDF: chụp từng trang thành PNG.  npx electron huong-dan/xem-pdf.js <thư mục ra>
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
app.whenReady().then(async () => {
  const pdf = path.join(__dirname, 'Huong-dan-su-dung-ToanViet-Studio.pdf');
  const out = process.argv[2];
  const n = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log('pages: ' + n);
  for (let i = 1; i <= n; i++) {
    const win = new BrowserWindow({ show: false, width: 800, height: 1100, webPreferences: { plugins: true } });
    await win.loadURL('file:///' + pdf.replace(/\\/g, '/') + '#page=' + i + '&toolbar=0&navpanes=0&view=Fit').catch(() => {});
    await new Promise((r) => setTimeout(r, 1800));
    fs.writeFileSync(path.join(out, 'p' + String(i).padStart(2, '0') + '.png'), (await win.webContents.capturePage()).toPNG());
    win.destroy();
  }
  app.quit();
});
