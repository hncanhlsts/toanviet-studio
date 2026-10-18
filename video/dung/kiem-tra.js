// Kiểm tra tệp video vừa dựng bằng trình phát của Chromium: thời lượng, kích thước, tua được không.
//   npx electron video/dung/kiem-tra.js video/ToanViet-Studio-gioi-thieu.webm
const { app, BrowserWindow } = require('electron');
const path = require('path');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { backgroundThrottling: false } });
  await win.loadFile(__filename); // trang file:// để được phép mở tệp video trên máy
  await win.webContents.executeJavaScript("document.body.innerHTML = '<video id=v muted></video>'");
  const f = 'file:///' + path.resolve(process.argv[process.argv.length - 1]).split(path.sep).join('/');
  const r = await win.webContents.executeJavaScript(`new Promise((res) => {
    const v = document.getElementById('v');
    v.onerror = () => res('LỖI ' + (v.error && v.error.message));
    v.onloadedmetadata = async () => {
      const d = v.duration; v.currentTime = d * 0.6;
      await new Promise((s) => { v.onseeked = s; });
      res('thời lượng ' + d.toFixed(2) + ' giây, cỡ ' + v.videoWidth + 'x' + v.videoHeight + ', tua tới ' + v.currentTime.toFixed(2) + ' giây: được');
    };
    v.src = ${JSON.stringify(f)};
    setTimeout(() => res('quá giờ'), 20000);
  })`);
  console.log('KIỂM TRA: ' + r);
  app.exit(0);
});
