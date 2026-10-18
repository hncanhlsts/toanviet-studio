// Dựng video giới thiệu từ các cảnh đã quay (video/khung/*) theo kịch bản dựng video/dung/canh.js.
//   npx electron video/dung/dung.js                     → video/ToanViet-Studio-gioi-thieu.webm
//   npx electron video/dung/dung.js --anh=10,65.5,120   → ảnh xem thử các thời điểm (giây) vào video/xem/
//   npx electron video/dung/dung.js --tu=60 --den=90    → chỉ dựng một đoạn (xem nhanh)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false, width: 1920, height: 1080, webPreferences: { nodeIntegration: true, contextIsolation: false, backgroundThrottling: false } });
  win.webContents.on('console-message', (_e, _l, msg) => console.log(msg));
  const args = process.argv.filter((a) => a.startsWith('--')).join(' ');
  win.loadFile(path.join(__dirname, 'dung.html'), { query: { args } });
  ipcMain.on('xong', (_e, code) => { app.exit(code || 0); });
});
