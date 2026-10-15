// Bản vá: Thư viện của tôi + Báo lỗi (phần giao diện). Chạy một lần:  node build/patch-thuvien.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  let s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b.trim().slice(0, 60)) && !s.includes(a)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 60));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};
const block = fs.readFileSync(path.join(__dirname, 'patch-thuvien.app.txt'), 'utf8');

// nhật ký thông báo gần đây
rep('src/app.js', "  function msg(t, err) {\n    $('#msg').textContent = t;",
  "  // nhật ký ngắn các thông báo gần đây (đưa vào tệp báo lỗi)\n  const LOG = [];\n  const logPush = (t) => { LOG.push(new Date().toLocaleTimeString('vi-VN') + '  ' + t); if (LOG.length > 40) LOG.shift(); };\n  window.addEventListener('error', (e) => logPush('LỖI: ' + e.message + ' (' + String(e.filename || '').replace(/^.*[\\\\/]/, '') + ':' + e.lineno + ')'));\n  window.addEventListener('unhandledrejection', (e) => logPush('LỖI: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)));\n  function msg(t, err) {\n    if (err) logPush(t);\n    $('#msg').textContent = t;");
rep('src/app.js', '  const CMD = {', block + '  const CMD = {');
rep('src/app.js', "    demo: async () => { if (await confirmDiscard()) window.__demo(); },",
  "    demo: async () => { if (await confirmDiscard()) window.__demo(); },\n    lib: () => openLib(),\n    report: () => openReport(),");
rep('main.js', "ipcMain.handle('renderPng', async (e, target, withData) => {\n  const scale = 4;\n  capture.keep = true; // đang chuyển đổi hàng loạt",
  "ipcMain.handle('renderPng', async (e, target, withData, release) => {\n  const scale = 4;\n  capture.keep = !release; // chuyển đổi hàng loạt: giữ chế độ chụp; ảnh thu nhỏ cho thư viện: trả cửa sổ về như cũ");
rep('preload.js', "  renderPng: (target, withData) => ipcRenderer.invoke('renderPng', target, !!withData),",
  "  renderPng: (target, withData, release) => ipcRenderer.invoke('renderPng', target, !!withData, !!release),");
rep('src/index.html', '<button data-cmd="ins-text"',
  '<button data-cmd="lib" title="Thư viện của tôi: công thức, hình hay dùng (Ctrl+L)"><i>📚</i>Thư viện</button>\n      <button data-cmd="ins-text"');
const css = fs.readFileSync(R('src/styles.css'), 'utf8');
if (!css.includes('.tvdlg')) { fs.appendFileSync(R('src/styles.css'), fs.readFileSync(path.join(__dirname, 'patch-thuvien.css.txt'), 'utf8')); console.log('ok: styles.css'); }
