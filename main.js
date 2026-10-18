const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

let win;
// kiểm thử: dùng thư mục dữ liệu riêng để không đụng thư viện thật của người dùng
if (process.env.TVS_USERDATA) app.setPath('userData', process.env.TVS_USERDATA);
const shotArg = process.argv.find((a) => a.startsWith('--shot='));
// Chế độ gọi từ add-in Word/PowerPoint: --office=word|ppt --mode=new|edit|full
const argVal = (name) => { const a = process.argv.find((t) => t.startsWith(name + '=')); return a ? a.slice(name.length + 1) : ''; };
const office = /^(word|ppt)$/.test(argVal('--office')) ? { app: argVal('--office'), mode: /^(new|edit|full|convert)$/.test(argVal('--mode')) ? argVal('--mode') : 'new', op: /^(mt2tv|tv2mt|eq2tv|tv2eq|tex2tv|tv2tex)$/.test(argVal('--op')) ? argVal('--op') : '' } : null;

// Nhật ký khởi động (thư mục dữ liệu: %APPDATA%\ToanViet Studio\khoi-dong.log): ghi lúc mở, lúc cửa sổ sẵn sàng và mọi lỗi
// làm phần mềm thoát — để biết vì sao "bấm trong Word mà không thấy ToanViet mở" trên máy người dùng.
const bootT0 = Date.now();
function bootLog(msg) {
  try {
    const f = path.join(app.getPath('userData'), 'khoi-dong.log');
    if (fs.existsSync(f) && fs.statSync(f).size > 200000) fs.renameSync(f, f + '.cu');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, new Date().toLocaleString('vi-VN') + '  [' + ((Date.now() - bootT0) / 1000).toFixed(1) + ' s]  ' + msg + '\r\n', 'utf8');
  } catch (e) { /* không ghi được nhật ký: bỏ qua */ }
}
process.on('uncaughtException', (e) => { bootLog('LỖI: ' + (e && e.stack || e)); });
app.on('render-process-gone', (_e, _wc, d) => bootLog('Trang giao diện dừng: ' + d.reason + ' (mã ' + d.exitCode + ')'));
app.on('child-process-gone', (_e, d) => bootLog('Tiến trình con dừng: ' + d.type + ' ' + d.reason + ' (mã ' + d.exitCode + ')'));

function createWindow() {
  if (!shotArg) bootLog('Mở ToanViet Studio ' + app.getVersion() + ' ' + process.argv.slice(1).filter((a) => a.startsWith('--')).join(' '));
  win = new BrowserWindow({
    width: office && office.mode !== 'full' ? 1080 : 1400, height: office && office.mode !== 'full' ? 760 : 900, minWidth: 980, minHeight: 600,
    // quay video giới thiệu (chế độ kiểm thử): cửa sổ đúng khung 16:9, vd TVS_WIN_SIZE=1600x900
    ...(shotArg && /^\d+x\d+$/.test(process.env.TVS_WIN_SIZE || '') ? { width: +process.env.TVS_WIN_SIZE.split('x')[0], height: +process.env.TVS_WIN_SIZE.split('x')[1], useContentSize: true } : {}),
    title: 'ToanViet Studio',
    show: true,
    webPreferences: { additionalArguments: office ? ['--tvs-office=' + office.app, '--tvs-mode=' + office.mode, '--tvs-size=' + (parseFloat(argVal('--size')) || 0), '--tvs-op=' + office.op] : [], preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  guardClose(win);
  // mở từ Word/PowerPoint: đưa cửa sổ lên trước để gõ được ngay
  if (office) win.webContents.once('did-finish-load', () => { win.show(); win.focus(); app.focus({ steal: true }); win.webContents.focus(); });
  if (!shotArg) win.webContents.once('did-finish-load', () => bootLog('Cửa sổ sẵn sàng'));
  win.webContents.on('did-fail-load', (_e, code, desc) => bootLog('Không tải được giao diện: ' + desc + ' (' + code + ')'));
  // mở tệp .tvs khi nhấp đúp trong Explorer
  const fileArg = process.argv.slice(1).find((a) => /\.tvs$/i.test(a) && fs.existsSync(a));
  if (fileArg) win.webContents.once('did-finish-load', () => win.webContents.send('openfile', { file: fileArg, data: fs.readFileSync(fileArg, 'utf8') }));
  // nhấp đúp gói thư viện .tvslib: nhập vào Thư viện của tôi
  const libArg = process.argv.slice(1).find((a) => /\.tvslib$/i.test(a) && fs.existsSync(a));
  if (libArg) win.webContents.once('did-finish-load', () => win.webContents.send('libfile', { file: path.basename(libArg), data: fs.readFileSync(libArg, 'utf8') }));
  const send = (cmd) => () => win.webContents.send('menu', cmd);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Tệp', submenu: [
      { label: 'Mới', accelerator: 'Ctrl+N', click: send('new') },
      { label: 'Mở…', accelerator: 'Ctrl+O', click: send('open') },
      { label: 'Lưu', accelerator: 'Ctrl+S', click: send('save') },
      { label: 'Lưu thành…', accelerator: 'Ctrl+Shift+S', click: send('saveas') },
      { type: 'separator' },
      { label: 'Xuất ảnh PNG…', accelerator: 'Ctrl+E', click: send('png') },
      { label: 'Xuất PDF…', accelerator: 'Ctrl+P', click: send('pdf') },
      { type: 'separator' },
      { label: 'Tài liệu mẫu', click: send('demo') },
      { label: 'Thư viện của tôi…', accelerator: 'Ctrl+L', click: send('lib') },
      { label: 'Soạn đề kiểm tra…', accelerator: 'Ctrl+Shift+D', click: send('exam') },
      { label: 'Bài giải AI → tài liệu Word…', accelerator: 'Ctrl+Shift+B', click: send('baigiai') },
      { label: 'Mẫu theo bài (Toán 1 – 5, Kết nối tri thức)…', accelerator: 'Ctrl+Shift+M', click: send('mau') },
      { type: 'separator' },
      { label: 'Thoát', accelerator: 'Ctrl+Q', role: 'quit' },
    ] },
    { label: 'Sửa', submenu: [
      { label: 'Hoàn tác', accelerator: 'Ctrl+Z', click: send('undo') },
      { label: 'Làm lại', accelerator: 'Ctrl+Y', click: send('redo') },
    ] },
    { label: 'Xem', submenu: [
      { label: 'Phóng to', accelerator: 'Ctrl+=', click: send('zoomin') },
      { label: 'Thu nhỏ', accelerator: 'Ctrl+-', click: send('zoomout') },
      { label: '100%', accelerator: 'Ctrl+0', click: send('zoom100') },
      { type: 'separator' },
      { label: 'Chế độ Tiểu học (lớp 1–5): bật / tắt', accelerator: 'Ctrl+Shift+T', click: send('tieuhoc') },
      { label: 'Trình chiếu', accelerator: 'F5', click: send('present') },
      { label: 'Trình chiếu hiện dần từng phần', accelerator: 'Shift+F5', click: send('present-step') },
      { type: 'separator' },
      { label: 'Phông công thức: kiểu Times New Roman', click: send('font-times') },
      { label: 'Phông công thức: mặc định', click: send('font-tex') },
      { type: 'separator' },
      { label: 'Toàn màn hình', role: 'togglefullscreen' },
      { label: 'Công cụ lập trình', role: 'toggleDevTools' },
    ] },
    { label: 'Trợ giúp', submenu: [
      { label: 'Hướng dẫn sử dụng (PDF)', accelerator: 'F1', click: () => showGuide('Huong-dan-su-dung-ToanViet-Studio.pdf') },
      { label: 'Hướng dẫn lập kịch bản vẽ hình (PDF)', accelerator: 'Shift+F1', click: () => showGuide('Huong-dan-lap-kich-ban-ve-hinh.pdf') },
      { label: 'Kiểm tra bản mới (thư mục dùng chung)…', click: send('update') },
      { label: 'Báo lỗi / góp ý…', click: send('report') },
      { type: 'separator' },
      { label: 'Kiểm tra kết nối với Word / PowerPoint…', click: () => diagnoseOffice() },
      { label: 'Mở thư mục nhật ký', click: () => require('electron').shell.openPath(app.getPath('userData')) },
      { type: 'separator' },
      { label: 'Giới thiệu ToanViet Studio', click: showAbout },
    ] },
  ]));
  // Khởi động sẵn cầu nối Word (sau khi đã dựng menu: có lỗi cũng không làm hỏng cửa sổ) để lần chèn đầu không phải chờ;
  // khi cửa sổ đã hiện thì xoá dòng "đang mở…" trên thanh trạng thái Word
  if (office) {
    try { startBridge(); } catch (e) { bootLog('Lỗi khởi động cầu nối: ' + (e && e.stack || e)); }
    win.webContents.once('did-finish-load', () => runOffice({ TVS_ACT: 'warm', TVS_APP: office.app }).then((r) => { bootLog('Cầu nối Word/PowerPoint: ' + r); }));
  }

  if (shotArg) {
    win.webContents.on('console-message', (_e, _l, msg) => console.log('[renderer]', msg));
    win.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        if (!office && !process.env.TVS_NO_DEMO) await win.webContents.executeJavaScript('window.__demo()');
        await new Promise((r) => setTimeout(r, 800));
        const buf = await capture(win.webContents, 'page', 1.5);
        fs.writeFileSync(shotArg.slice(7), buf);
        const ev = process.argv.find((a) => a.startsWith('--eval='));
        if (ev) { await win.webContents.executeJavaScript(ev.slice(7)); await new Promise((r) => setTimeout(r, 1200)); }
        // kiểm thử giao diện: kịch bản dài đọc từ tệp
        const evf = process.argv.find((a) => a.startsWith('--evalfile='));
        if (evf) { await win.webContents.executeJavaScript(fs.readFileSync(evf.slice(11), 'utf8')); await new Promise((r) => setTimeout(r, 300)); }
        // kiểm thử hộp thoại khi đóng: đóng cửa sổ giống như bấm nút ✕
        if (process.env.TVS_AUTO_CLOSE) { win.close(); await new Promise((r) => setTimeout(r, 2500)); if (win.isDestroyed()) return; console.log('WINDOW-STILL-OPEN'); }
        fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '.pdf'), await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'none' } }));
        if (process.env.TVS_SHOT_PAGE) fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '-after.png'), await capture(win.webContents, 'page', 1.5));
        const ui = await win.webContents.capturePage();
        fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '-ui.png'), ui.toPNG());
      } catch (e) { console.log('SHOT ERROR', e); }
      allowClose = true; // chế độ chụp / kiểm thử: luôn thoát được
      app.quit();
    });
  }
}

// Mở tệp PDF hướng dẫn bằng trình xem PDF mặc định của máy
function showGuide(name) {
  const file = [path.join(process.resourcesPath || '', 'huong-dan', name), path.join(__dirname, 'huong-dan', name)].find((f) => fs.existsSync(f));
  if (file) require('electron').shell.openPath(file);
  else dialog.showMessageBox(win, { type: 'info', title: 'Hướng dẫn sử dụng', message: 'Không tìm thấy tệp hướng dẫn.', buttons: ['Đóng'] });
}

// Trợ giúp ▸ Kiểm tra kết nối: PowerShell có chạy được không, ở chế độ nào, tìm thấy Word / PowerPoint đang mở không
async function diagnoseOffice() {
  const t0 = Date.now();
  const r = await runOffice({ TVS_ACT: 'diag' });
  const ok = r.startsWith('OK:');
  const lines = ok ? r.slice(3).split('|') : [r.replace(/^ERR:/, 'Lỗi: ')];
  bootLog('Kiểm tra kết nối: ' + r);
  const res = await dialog.showMessageBox(win, {
    type: ok ? 'info' : 'warning', title: 'Kiểm tra kết nối với Word / PowerPoint', buttons: ['Đóng', 'Mở thư mục nhật ký'], defaultId: 0, cancelId: 0,
    message: ok ? 'Cầu nối hoạt động (' + ((Date.now() - t0) / 1000).toFixed(1) + ' giây).' : 'Cầu nối KHÔNG hoạt động.',
    detail: lines.join('\n') + '\n\nPowerShell: ' + PS_EXE + ' (cách chạy: ' + (psMode === 'file' ? 'tệp .ps1' : 'dự phòng') + ')\nNhật ký: ' + path.join(app.getPath('userData'), 'khoi-dong.log'),
  });
  if (res.response === 1) require('electron').shell.openPath(app.getPath('userData'));
}

function showAbout() {
  dialog.showMessageBox(win, {
    type: 'info', title: 'Giới thiệu', buttons: ['Đóng'],
    message: 'ToanViet Studio ' + app.getVersion(),
    detail: 'Soạn công thức Toán, đồ thị, bảng biến thiên, miền nghiệm và hình không gian cho chương trình Toán phổ thông Việt Nam.\n\n' +
      'Thiết kế bởi: Thầy Hoàng Ngọc Cảnh\nGiáo viên trường THCS - THPT Đinh Thiện Lý\nEmail: canhld@gmail.com\n\n© 2026 Hoàng Ngọc Cảnh. Phát hành theo giấy phép MIT.',
  });
}
ipcMain.on('about', showAbout);

// Ảnh công thức: cắt sát nét chữ ở trên và dưới. Khung MathLive cao theo dòng chữ (chừa chỗ cho chữ cao nhất, mũ, chỉ số…),
// nên ảnh cũ thừa khoảng trắng phía trên — chèn vào Word làm giãn dòng. Giữ đường chân chữ đúng chỗ: độ hạ dòng
// (point, số nguyên) tính lại theo phần nét nằm dưới chân chữ.
function trimFormula(buf, depthPt, scale) {
  const img = nativeImage.createFromBuffer(buf);
  const { width: W, height: H } = img.getSize();
  const bmp = img.toBitmap(); // BGRA
  const inkRow = (y) => { for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (bmp[i + 3] > 30 && Math.min(bmp[i], bmp[i + 1], bmp[i + 2]) < 215) return true; } return false; };
  let top = 0;
  while (top < H && !inkRow(top)) top++;
  if (top >= H) return { buf, depthPt };
  let bot = H - 1;
  while (bot > top && !inkRow(bot)) bot--;
  const m = Math.round(1.5 * scale); // lề 1,5px quanh nét
  const base = H - depthPt / 0.75 * scale; // hàng của đường chân chữ, tính từ trên
  const y0 = Math.max(0, top - m);
  let dPt = Math.ceil(Math.max(0, bot + m - base) / scale * 0.75);
  if (dPt > depthPt) dPt = depthPt;
  const y1 = Math.min(H, Math.round(base + dPt / 0.75 * scale));
  if (y0 <= 0 && y1 >= H) return { buf, depthPt };
  return { buf: img.crop({ x: 0, y: y0, width: W, height: y1 - y0 }).toPNG(), depthPt: dPt };
}

// Chụp một đối tượng (hoặc cả trang) thành PNG độ phân giải cao
async function capture(wc, target, scale) {
  const dbg = wc.debugger;
  const fresh = !dbg.isAttached();
  if (fresh) dbg.attach('1.3');
  try {
    if (fresh) await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: 1900, height: 2600, deviceScaleFactor: 1, mobile: false });
    const rect = await wc.executeJavaScript(`window.__prepCapture(${JSON.stringify(target)})`);
    if (!rect) throw new Error('Không có gì để xuất');
    capture.depthPt = rect.depthPt || 0;
    const res = await dbg.sendCommand('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale } });
    const raw = Buffer.from(res.data, 'base64');
    if (!rect.depthPt) return raw;
    const t = trimFormula(raw, rect.depthPt, scale); capture.depthPt = t.depthPt; return t.buf;
  } finally {
    try { await wc.executeJavaScript('window.__endCapture()'); } catch (e) { /* cửa sổ đã đóng */ }
    if (!capture.keep) {
      try { await dbg.sendCommand('Emulation.clearDeviceMetricsOverride'); } catch (e) { /* bỏ qua */ }
      try { dbg.detach(); } catch (e) { /* đã tách */ }
    }
  }
}

ipcMain.handle('capture', async (e, { target, mode, name }) => {
  const buf = await capture(e.sender, target, mode === 'clipboard' ? 2 : 3);
  if (mode === 'clipboard') { clipboard.writeImage(nativeImage.createFromBuffer(buf)); return true; }
  const r = await dialog.showSaveDialog(win, { title: 'Xuất ảnh PNG', defaultPath: (name || 'hinh') + '.png', filters: [{ name: 'Ảnh PNG', extensions: ['png'] }] });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});
ipcMain.handle('pdf', async (e) => {
  const r = await dialog.showSaveDialog(win, { title: 'Xuất PDF', defaultPath: 'tai-lieu.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled) return false;
  const buf = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'none' } });
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});
ipcMain.handle('save', async (_e, { data, file }) => {
  if (!file) {
    const r = await dialog.showSaveDialog(win, { title: 'Lưu tài liệu', defaultPath: 'tai-lieu.tvs', filters: [{ name: 'ToanViet Studio', extensions: ['tvs'] }] });
    if (r.canceled) return null;
    file = r.filePath;
  }
  // giữ bản trước của tệp thành .bak, phòng khi lưu nhầm
  try { if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak'); } catch (err) { /* bỏ qua */ }
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, file);
  return file;
});
ipcMain.handle('open', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Mở tài liệu', properties: ['openFile'], filters: [{ name: 'ToanViet Studio', extensions: ['tvs', 'json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  return { file: r.filePaths[0], data: fs.readFileSync(r.filePaths[0], 'utf8') };
});
// ---------- Thư viện của tôi: các công thức, hình hay dùng (lưu trong thư mục dữ liệu của người dùng) ----------
const libFile = () => path.join(app.getPath('userData'), 'thu-vien.json');
ipcMain.handle('lib', async (_e, o) => {
  if (o.action === 'load') { try { const d = JSON.parse(fs.readFileSync(libFile(), 'utf8')); return Array.isArray(d.items) ? d.items : []; } catch (err) { return []; } }
  if (o.action === 'save') { fs.mkdirSync(path.dirname(libFile()), { recursive: true }); fs.writeFileSync(libFile(), JSON.stringify({ format: 'tvslib', version: 1, items: o.items }), 'utf8'); return true; }
  if (o.action === 'export') {
    const r = process.env.TVS_LIBFILE ? { filePath: process.env.TVS_LIBFILE } : await dialog.showSaveDialog(win, { title: 'Xuất gói thư viện để chia sẻ', defaultPath: (o.name || 'ThuVien-ToanViet') + '.tvslib', filters: [{ name: 'Gói thư viện ToanViet', extensions: ['tvslib'] }] });
    if (r.canceled) return null;
    fs.writeFileSync(r.filePath, JSON.stringify({ format: 'tvslib', version: 1, author: o.author || '', items: o.items }), 'utf8');
    return r.filePath;
  }
  if (o.action === 'import') {
    const r = process.env.TVS_LIBFILE ? { filePaths: [process.env.TVS_LIBFILE] } : await dialog.showOpenDialog(win, { title: 'Nhập gói thư viện', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Gói thư viện ToanViet', extensions: ['tvslib', 'json'] }] });
    if (r.canceled || !r.filePaths.length) return null;
    const items = [], bad = [];
    r.filePaths.forEach((f) => { try { const d = JSON.parse(fs.readFileSync(f, 'utf8')); if (d.format !== 'tvslib' || !Array.isArray(d.items)) throw new Error('không phải gói thư viện'); items.push(...d.items); } catch (err) { bad.push(path.basename(f) + ': ' + err.message); } });
    return { items, bad };
  }
  return null;
});
// ---------- Thư mục dùng chung của tổ: thư viện chung (*.tvslib) và bộ cài bản mới ----------
const setFile = () => path.join(app.getPath('userData'), 'cai-dat.json');
const readSet = () => { try { return JSON.parse(fs.readFileSync(setFile(), 'utf8')); } catch (err) { return {}; } };
const writeSet = (o) => { fs.mkdirSync(path.dirname(setFile()), { recursive: true }); fs.writeFileSync(setFile(), JSON.stringify(Object.assign(readSet(), o), null, 1), 'utf8'); };
const verCmp = (x, y) => { const a = x.split('.').map(Number), b = y.split('.').map(Number); for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0); return 0; };
let pendingInstaller = null;
ipcMain.handle('shared', async (_e, o) => {
  const st = readSet(), dir = st.sharedDir || '';
  if (o.action === 'get') return { dir, ok: !!dir && fs.existsSync(dir), author: st.author || '' };
  if (o.action === 'author') { writeSet({ author: String(o.author || '').slice(0, 60) }); return true; }
  if (o.action === 'choose') {
    const r = process.env.TVS_SHARED_DIR ? { filePaths: [process.env.TVS_SHARED_DIR] } : await dialog.showOpenDialog(win, { title: 'Chọn thư mục dùng chung của tổ (ổ mạng, OneDrive, Google Drive…)', properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null;
    writeSet({ sharedDir: r.filePaths[0] }); return r.filePaths[0];
  }
  if (o.action === 'clear') { writeSet({ sharedDir: '' }); return true; }
  if (!dir || !fs.existsSync(dir)) return o.action === 'load' ? { items: [], bad: [], error: dir ? 'Không mở được thư mục ' + dir : '' } : null;
  if (o.action === 'load') {
    const items = [], bad = [];
    fs.readdirSync(dir).filter((f) => /\.tvslib$/i.test(f)).forEach((f) => {
      try { const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (d.format !== 'tvslib') throw new Error('không phải gói thư viện'); d.items.forEach((it) => { if (it && it.obj) items.push(Object.assign({}, it, { src: f.replace(/\.tvslib$/i, '') })); }); } catch (err) { bad.push(f + ': ' + err.message); }
    });
    return { items, bad };
  }
  if (o.action === 'put') {
    // ghi các mục vào tệp của người chia sẻ trong thư mục chung (mục cùng mã thì thay bản mới)
    const name = (String(o.name || 'Chung').replace(/[\\/:*?"<>|]/g, '-').trim() || 'Chung');
    const f = path.join(dir, 'ThuVien-' + name + '.tvslib');
    let old = []; try { old = JSON.parse(fs.readFileSync(f, 'utf8')).items || []; } catch (err) { /* tệp mới */ }
    const ids = new Set(o.items.map((it) => it.id));
    const items = old.filter((it) => !ids.has(it.id)).concat(o.items.map((it) => { const c = Object.assign({}, it); delete c.src; return c; }));
    const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ format: 'tvslib', version: 1, author: o.name || '', items }), 'utf8'); fs.renameSync(tmp, f);
    return f;
  }
  if (o.action === 'unput') {
    const f = path.join(dir, String(o.src || '') + '.tvslib');
    try { const d = JSON.parse(fs.readFileSync(f, 'utf8')); d.items = d.items.filter((it) => it.id !== o.id); fs.writeFileSync(f, JSON.stringify(d), 'utf8'); return true; } catch (err) { return false; }
  }
  if (o.action === 'checkUpdate') {
    if (shotArg && !process.env.TVS_UPDATE_TEST) return null;
    const found = fs.readdirSync(dir).map((f) => { const m = f.match(/^ToanVietStudio-Setup-(\d+\.\d+\.\d+)\.exe$/i); return m ? { version: m[1], file: path.join(dir, f) } : null; }).filter(Boolean)
      .filter((x) => verCmp(x.version, app.getVersion()) > 0).sort((x, y) => verCmp(y.version, x.version));
    return found[0] || { none: true, current: app.getVersion() };
  }
  if (o.action === 'runUpdate') {
    // chép bộ cài về máy rồi chạy sau khi phần mềm đã đóng (để cài đè được)
    const tmp = path.join(app.getPath('temp'), path.basename(o.file));
    fs.copyFileSync(o.file, tmp);
    pendingInstaller = tmp;
    if (process.env.TVS_UPDATE_TEST) { fs.appendFileSync(process.env.TVS_UPDATE_TEST, 'INSTALLER: ' + tmp + '\n'); pendingInstaller = null; return tmp; }
    app.quit();
    return tmp;
  }
  return null;
});
app.on('will-quit', () => { if (pendingInstaller) { try { require('child_process').spawn(pendingInstaller, [], { detached: true, stdio: 'ignore' }).unref(); } catch (err) { /* bỏ qua */ } } });
// ---------- Báo lỗi / góp ý: ghi thông tin cần thiết ra Desktop để người dùng tự gửi ----------
ipcMain.handle('report', async (_e, o) => {
  const t = new Date(), z = (n) => String(n).padStart(2, '0'), stamp = t.getFullYear() + z(t.getMonth() + 1) + z(t.getDate()) + '-' + z(t.getHours()) + z(t.getMinutes()) + z(t.getSeconds());
  const dir = process.env.TVS_REPORT_DIR || app.getPath('desktop'), base = path.join(dir, 'BaoLoi-ToanViet-' + stamp);
  const info = ['Phiên bản: ' + app.getVersion(), 'Windows: ' + require('os').release() + ' (' + process.arch + ')', 'Electron: ' + process.versions.electron, 'Thời điểm: ' + new Date().toLocaleString('vi-VN'), ''].join('\r\n');
  fs.writeFileSync(base + '.txt', info + String(o.text || '').replace(/\r?\n/g, '\r\n'), 'utf8');
  let png = '';
  try { const img = await win.webContents.capturePage(); png = base + '.png'; fs.writeFileSync(png, img.toPNG()); } catch (err) { png = ''; }
  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'REPORT: ' + base + '.txt\n'); return base + '.txt'; }
  const r = await dialog.showMessageBox(win, {
    type: 'info', title: 'Báo lỗi / góp ý',
    message: 'Đã tạo tệp báo lỗi trên Desktop:\n' + path.basename(base + '.txt') + (png ? '\n' + path.basename(png) + ' (ảnh màn hình)' : ''),
    detail: 'Tệp gồm: phiên bản phần mềm, mô tả của bạn, đối tượng đang chọn (nếu có) và các thông báo lỗi gần đây. Hãy mở xem trước khi gửi, rồi đính kèm vào thư gửi tác giả (canhld@gmail.com).',
    buttons: ['Mở thư mục chứa tệp', 'Soạn thư', 'Đóng'], defaultId: 0, cancelId: 2,
  });
  const { shell } = require('electron');
  if (r.response === 0) shell.showItemInFolder(base + '.txt');
  if (r.response === 1) { shell.showItemInFolder(base + '.txt'); shell.openExternal('mailto:canhld@gmail.com?subject=' + encodeURIComponent('[ToanViet ' + app.getVersion() + '] Báo lỗi / góp ý') + '&body=' + encodeURIComponent('Kính gửi thầy,\n\n' + String(o.summary || '') + '\n\n(Đính kèm tệp ' + path.basename(base + '.txt') + (png ? ' và ảnh màn hình' : '') + ' trên Desktop.)')); }
  return base + '.txt';
});
ipcMain.handle('copyText', (_e, t) => { clipboard.writeText(String(t)); return true; });ipcMain.handle('confirm', async (_e, msg) => {
  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'CONFIRM: ' + String(msg).replace(/\n+/g, ' / ') + '\n'); return true; }
  const r = await dialog.showMessageBox(win, { type: 'question', buttons: ['Đồng ý', 'Huỷ'], defaultId: 0, cancelId: 1, message: msg });
  return r.response === 0;
});
// ---------- Cầu nối Word / PowerPoint (COM): mã PowerShell ở office-bridge.js ----------
const { PS_LOOP } = require('./office-bridge');
// PowerShell cầu nối: mở một lần, nhận lệnh qua stdin. Ưu tiên chạy tệp toanviet-bridge.ps1 có sẵn trong thư mục cài
// (powershell -File): không ghi tệp script vào Temp lúc chạy, không dùng -EncodedCommand / Invoke-Expression — kiểu chạy
// mà phần mềm diệt virus hay chặn. Nếu chính sách của máy cấm chạy tệp .ps1, tự chuyển sang cách dự phòng.
let psProc = null, psBuf = '', psMode = 'file', psAnswered = false, psErr = '';
const psWait = []; // { cb, line }
const PS_EXE = (() => {
  const p = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  return fs.existsSync(p) ? p : 'powershell.exe'; // đường dẫn đầy đủ: không phụ thuộc biến PATH của máy
})();
function bridgeScript() {
  const fixed = path.join(process.resourcesPath || '', 'cau-noi', 'toanviet-bridge.ps1');
  if (app.isPackaged && fs.existsSync(fixed)) return fixed;
  const file = path.join(app.getPath('temp'), 'toanviet-bridge.ps1'); // chạy từ mã nguồn (đang phát triển)
  fs.writeFileSync(file, '\ufeff' + PS_LOOP, 'utf8');
  return file;
}
function startBridge() {
  if (psProc) return;
  let file;
  try { file = bridgeScript(); } catch (e) { bootLog('Không chuẩn bị được tệp cầu nối: ' + e.message); return; }
  // kiểm thử: giả lập máy cấm chạy tệp .ps1 (tệp không chạy được) để thử cách dự phòng
  if (process.env.TVS_TEST_PS_FILE_FAIL && psMode === 'file') file += '.khong-co';
  const args = psMode === 'file'
    ? ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file]
    : ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from('Invoke-Expression ([IO.File]::ReadAllText($env:TVS_SCRIPT, [Text.Encoding]::UTF8))', 'utf16le').toString('base64')];
  try {
    psProc = require('child_process').spawn(PS_EXE, args, { env: Object.assign({}, process.env, { TVS_SCRIPT: file }), windowsHide: true });
  } catch (e) { bootLog('Không chạy được PowerShell (' + PS_EXE + '): ' + e.message); psProc = null; return; }
  psBuf = ''; psAnswered = false; psErr = '';
  psProc.stdout.setEncoding('utf8');
  psProc.stdout.on('data', (d) => {
    psBuf += d;
    let i;
    while ((i = psBuf.indexOf('\n')) >= 0) {
      const line = psBuf.slice(0, i).trim(); psBuf = psBuf.slice(i + 1);
      if (line.startsWith('@@')) { psAnswered = true; const w = psWait.shift(); if (w) w.cb(Buffer.from(line.slice(2), 'base64').toString('utf8').trim() || 'ERR:'); }
    }
  });
  psProc.stderr.setEncoding('utf8');
  psProc.stderr.on('data', (d) => { if (psErr.length < 4000) psErr += d; });
  const proc = psProc;
  const dead = (why) => {
    if (psProc !== proc) return;
    psProc = null;
    bootLog('Cầu nối PowerShell dừng (' + psMode + '): ' + why + (psErr ? ' — ' + psErr.replace(/\s+/g, ' ').slice(0, 600) : ''));
    // chưa trả lời lệnh nào mà đã dừng khi chạy tệp: thử lại bằng cách dự phòng, gửi lại các lệnh đang chờ
    if (!psAnswered && psMode === 'file') {
      psMode = 'enc';
      if (psWait.length) {
        startBridge();
        if (psProc) { psWait.forEach((w) => { try { psProc.stdin.write(w.line); } catch (e) { /* bỏ qua */ } }); return; }
      }
    }
    const msg = 'ERR:Không kết nối được với Word/PowerPoint qua PowerShell. Có thể phần mềm diệt virus hoặc chính sách của máy đang chặn PowerShell. Xem nhật ký: ' + path.join(app.getPath('userData'), 'khoi-dong.log');
    psWait.splice(0).forEach((w) => w.cb(msg));
  };
  psProc.on('exit', (code) => dead('thoát, mã ' + code));
  psProc.on('error', (e) => dead('lỗi ' + e.message));
}
// tiến trình Word đã mở ToanViet (add-in truyền vào): chèn đúng vào phiên đó
const wordPid = /^\d+$/.test(argVal('--wpid')) ? argVal('--wpid') : '';
const HIDDEN_MSG = 'Máy đang có một phiên Word chạy ngầm (không có cửa sổ). ToanViet không chèn vào đó để công thức không bị mất. Hãy lưu và đóng Word, bấm Ctrl+Shift+Esc mở Task Manager, kết thúc mọi mục "Microsoft Word" còn lại, rồi mở lại tài liệu và chèn lại.';
const CLM_MSG = 'PowerShell trên máy này đang bị giới hạn (Constrained Language Mode — do chính sách bảo mật của Windows hoặc phần mềm quản lí / diệt virus), nên ToanViet không điều khiển được Word. Nhờ người quản trị máy bỏ giới hạn, hoặc tạm dùng Ctrl+C trong ToanViet rồi dán vào Word. Chi tiết: Trợ giúp ▸ Kiểm tra kết nối với Word.';
function runOffice(env) {
  startBridge();
  env = Object.assign({ TVS_WPID: wordPid }, env);
  return new Promise((done) => {
    const cb = (out) => done(/TVSHIDDEN/.test(out) ? 'ERR:' + HIDDEN_MSG : /TVSCLM/.test(out) ? 'ERR:' + CLM_MSG : out);
    if (!psProc) return cb('ERR:Không khởi động được cầu nối với Word/PowerPoint. Xem nhật ký: ' + path.join(app.getPath('userData'), 'khoi-dong.log'));
    const line = Buffer.from(JSON.stringify(env), 'utf8').toString('base64') + '\n';
    psWait.push({ cb, line });
    try { psProc.stdin.write(line); } catch (e) { psWait.pop(); cb('ERR:' + e.message); }
  });
}
app.on('will-quit', () => { try { if (psProc) psProc.kill(); } catch (e) { /* đã thoát */ } });
// chụp nhiều công thức một lượt khi chuyển đổi hàng loạt: đo tất cả trong một lần rồi chụp liên tiếp
// kiểm thử giao diện: gửi cú nhấp chuột thật (sự kiện tin cậy) vào cửa sổ — chỉ khi chạy ở chế độ kiểm thử
ipcMain.handle('test-click', async (e, p) => {
  if (!shotArg) return false;
  const x = Math.round(p.x), y = Math.round(p.y);
  e.sender.sendInputEvent({ type: 'mouseMove', x, y });
  e.sender.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
  e.sender.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
  return true;
});
// kiểm thử giao diện: chụp cửa sổ đúng lúc kịch bản cần (chỉ khi chạy ở chế độ kiểm thử)
ipcMain.handle('test-shot', async (e, file) => {
  if (!shotArg) return false;
  const img = await e.sender.capturePage();
  fs.writeFileSync(String(file), /\.jpg$/i.test(String(file)) ? img.toJPEG(92) : img.toPNG());
  return true;
});
// kiểm thử giao diện: gõ phím thật (sự kiện tin cậy) — chỉ khi chạy ở chế độ kiểm thử.
// Mỗi mục: chuỗi ký tự để gõ, hoặc { key: 'Tab' | 'Enter' | 'F' ..., mods: ['control', 'shift'] }
ipcMain.handle('test-keys', async (e, seq) => {
  if (!shotArg) return false;
  const wc = e.sender, pause = () => new Promise((r) => setTimeout(r, 25));
  for (const it of seq) {
    if (typeof it === 'string') {
      for (const ch of it) {
        const kc = ch === ' ' ? 'Space' : ch;
        wc.sendInputEvent({ type: 'keyDown', keyCode: kc });
        wc.sendInputEvent({ type: 'char', keyCode: ch });
        wc.sendInputEvent({ type: 'keyUp', keyCode: kc });
        await pause();
      }
    } else {
      const modifiers = it.mods || [];
      wc.sendInputEvent({ type: 'keyDown', keyCode: it.key, modifiers });
      if (it.char) wc.sendInputEvent({ type: 'char', keyCode: it.char, modifiers });
      wc.sendInputEvent({ type: 'keyUp', keyCode: it.key, modifiers });
      await pause();
    }
  }
  return true;
});
// kiểm thử / quay video giới thiệu: chuỗi thao tác chuột thật (di, nhấn, thả, nhấp đúp, cuộn) — chỉ khi chạy ở chế độ kiểm thử.
// Mỗi mục: { t: 'move' | 'down' | 'up' | 'dbl' | 'wheel', x, y, dy, wait }
ipcMain.handle('test-mouse', async (e, seq) => {
  if (!shotArg) return false;
  const wc = e.sender;
  for (const it of seq) {
    const x = Math.round(it.x), y = Math.round(it.y);
    if (it.t === 'move') wc.sendInputEvent({ type: 'mouseMove', x, y, button: it.drag ? 'left' : undefined, modifiers: it.drag ? ['leftButtonDown'] : [] });
    else if (it.t === 'down') wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
    else if (it.t === 'up') wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
    else if (it.t === 'dbl') { for (const c of [1, 2]) { wc.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: c }); wc.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: c }); } }
    else if (it.t === 'wheel') wc.sendInputEvent({ type: 'mouseWheel', x, y, deltaX: 0, deltaY: it.dy || -100 });
    if (it.wait) await new Promise((r) => setTimeout(r, it.wait));
  }
  return true;
});
ipcMain.handle('renderBatch', async (e, ids) => {
  const scale = 4, wc = e.sender, dbg = wc.debugger;
  capture.keep = true;
  if (!dbg.isAttached()) { dbg.attach('1.3'); await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: 1900, height: 2600, deviceScaleFactor: 1, mobile: false }); }
  const rects = await wc.executeJavaScript(`window.__prepBatch(${JSON.stringify(ids)})`);
  const out = [];
  try {
    for (const rect of rects) {
      if (!rect) { out.push(null); continue; }
      const res = await dbg.sendCommand('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale } });
      const t = rect.depthPt ? trimFormula(Buffer.from(res.data, 'base64'), rect.depthPt, scale) : { buf: Buffer.from(res.data, 'base64'), depthPt: 0 };
      const buf = t.buf, size = nativeImage.createFromBuffer(buf).getSize(); rect.depthPt = t.depthPt;
      const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.png');
      fs.writeFileSync(file, buf);
      out.push({ file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: rect.depthPt || 0 });
    }
  } finally { try { await wc.executeJavaScript('window.__endCapture()'); } catch (err) { /* bỏ qua */ } }
  return out;
});
// Bài giải AI → Word: ghép tệp .docx trực tiếp (không cần Word / PowerShell) từ nội dung chuẩn và ảnh công thức ToanViet,
// lưu (hộp thoại chọn chỗ lưu, mặc định thư mục Tài liệu) rồi mở bằng Word
ipcMain.handle('makeDocx', async (e, o) => {
  // chụp hàng loạt xong: trả cửa sổ về kích thước thật (như sau khi chuyển đổi)
  if (capture.keep) { capture.keep = false; try { if (e.sender.debugger.isAttached()) { await e.sender.debugger.sendCommand('Emulation.clearDeviceMetricsOverride'); e.sender.debugger.detach(); } } catch (err) { /* bỏ qua */ } }
  const { buildDocx } = require('./docx-writer');
  const formulas = {}, figures = {};
  for (const f of o.formulas || []) { try { formulas[f.latex] = { png: fs.readFileSync(f.file), w: f.w, h: f.h, depthPt: f.depthPt || 0, alt: f.alt }; } catch (err) { /* ảnh lỗi: ghi mã LaTeX */ } }
  for (const f of o.figures || []) { try { figures[f.key] = { png: fs.readFileSync(f.file), w: f.w, h: f.h, alt: f.alt, scale: f.scale || 0.8 }; } catch (err) { /* hình lỗi: ghi [THIẾU HÌNH] */ } }
  const r = buildDocx(o.markup, formulas, { pt: o.pt || 12, figures });
  (o.formulas || []).concat(o.figures || []).forEach((f) => fs.unlink(f.file, () => {}));
  const name = (String(o.name || 'Loi-giai').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'Loi-giai') + '.docx';
  let file = process.env.TVS_DOCX_OUT || '';
  if (!file) {
    const s = await dialog.showSaveDialog(win, { title: 'Lưu tài liệu Word', defaultPath: path.join(app.getPath('documents'), name), filters: [{ name: 'Tài liệu Word', extensions: ['docx'] }] });
    if (s.canceled) return { ok: false, canceled: true };
    file = s.filePath;
  }
  try { fs.writeFileSync(file, r.buf); } catch (err) { return { ok: false, error: 'Không ghi được tệp (tệp đang mở trong Word?): ' + err.message }; }
  if (!process.env.TVS_DOCX_OUT) require('electron').shell.openPath(file);
  return { ok: true, file, count: r.count, missing: r.missing };
});
// dựng ảnh PNG của một đối tượng ra tệp tạm (dùng khi chuyển đổi hàng loạt)
ipcMain.handle('renderPng', async (e, target, withData, release) => {
  const scale = 4;
  capture.keep = !release; // chuyển đổi hàng loạt: giữ chế độ chụp; ảnh thu nhỏ cho thư viện: trả cửa sổ về như cũ
  const buf = await capture(e.sender, target, scale);
  const size = nativeImage.createFromBuffer(buf).getSize();
  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.png');
  fs.writeFileSync(file, buf);
  const res = { file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: capture.depthPt || 0 };
  if (withData) { res.b64 = buf.toString('base64'); fs.unlink(file, () => {}); }
  return res;
});
// Đọc khối dữ liệu tEXt "ToanViet" trong ảnh PNG (nếu có). Word nén lại ảnh khi lưu nên thường không còn;
// dùng để phân biệt và báo rõ khi hình ToanViet đã mất "văn bản thay thế".
function pngData(buf) {
  let p = 8;
  while (p + 8 <= buf.length) {
    const n = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8);
    if (type === 'tEXt') { const s = buf.toString('latin1', p + 8, p + 8 + n); if (s.startsWith('ToanViet\0')) return s.slice(9); }
    if (type === 'IEND') break;
    p += 12 + n;
  }
  return null;
}
ipcMain.handle('office', async (e, opts) => {
  const name = opts.app === 'ppt' ? 'PowerPoint' : 'Word';
  const noApp = 'Chưa mở tài liệu Word nào.';
  if (opts.action === 'scan') {
    const outFile = path.join(app.getPath('temp'), 'toanviet-scan-' + Date.now() + '.txt');
    const out = await runOffice({ TVS_ACT: 'scan', TVS_KIND: opts.kind, TVS_OUT: outFile });
    if (!out.startsWith('OK')) return { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
    const items = fs.readFileSync(outFile, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { const p = l.split('|'); return { i: +p[0], size: parseFloat(p[1]) || 0, data: p[2], end: p[3] !== undefined ? +p[3] : undefined }; });
    fs.unlink(outFile, () => {});
    return { ok: true, items };
  }
  if (opts.action === 'apply') {
    if (capture.keep) { capture.keep = false; try { if (e.sender.debugger.isAttached()) { await e.sender.debugger.sendCommand('Emulation.clearDeviceMetricsOverride'); e.sender.debugger.detach(); } } catch (err) { /* bỏ qua */ } }
    const dir = app.getPath('temp');
    const lines = opts.jobs.map((j, k) => {
      if (opts.op === 'tv2eq') return j.i + '|' + Buffer.from(j.mathml, 'utf8').toString('base64');
      if (opts.op === 'tv2mt') { const xf = path.join(dir, 'toanviet-mt-' + Date.now() + '-' + k + '.xml'); fs.writeFileSync(xf, j.xml, 'utf8'); j.tmp = xf; return j.i + '|' + xf; }
      if (opts.op === 'tv2tex') return j.i + '|' + Buffer.from(j.text, 'utf8').toString('base64');
      j.tmp = j.png;
      return [j.i, j.png, j.w, j.h, j.pos, j.alt, j.end === undefined ? '' : j.end].join('|');
    });
    const jobFile = path.join(dir, 'toanviet-job-' + Date.now() + '.txt');
    fs.writeFileSync(jobFile, lines.join('\r\n'), 'utf8');
    const out = await runOffice({ TVS_ACT: 'apply', TVS_OP: opts.op, TVS_JOB: jobFile });
    fs.unlink(jobFile, () => {});
    opts.jobs.forEach((j) => { if (j.tmp) fs.unlink(j.tmp, () => {}); });
    const m = out.match(/^OK:(\d+)$/);
    return m ? { ok: true, count: +m[1] } : { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
  }
  if (opts.action === 'read') {
    const out = await runOffice({ TVS_ACT: 'read', TVS_APP: opts.app || '' });
    const m = out.match(/^OK:(Word|PPT|WordEq|MathType|Img):(.+)$/);
    if (m && m[1] === 'Img') {
      const d = pngData(Buffer.from(m[2], 'base64'));
      if (d) return { ok: true, from: 'Word', data: d, src: 'img' };
      return { ok: false, error: 'Hình đang chọn không có dữ liệu ToanViet. Nếu đây là công thức ToanViet, dữ liệu của nó đã bị mất (thường do tài liệu từng được mở, lưu bằng phần mềm khác như WPS, Google Docs) — cần soạn lại công thức này.' };
    }
    if (m) return { ok: true, from: m[1], data: m[2] };
    return { ok: false, error: out === 'ERR:NOSEL' ? 'Hãy chọn (nhấp vào) một hình ToanViet trong Word hoặc PowerPoint trước' : 'Lỗi: ' + out.slice(4) };
  }
  if (opts.action === 'buildexam') {
    const jf = path.join(app.getPath('temp'), 'toanviet-de-' + Date.now() + '.json');
    fs.writeFileSync(jf, JSON.stringify(opts.job), 'utf8');
    const out = await runOffice({ TVS_ACT: 'buildexam', TVS_JOB: jf });
    fs.unlink(jf, () => {});
    (opts.job.images || []).forEach((im) => fs.unlink(im.file, () => {}));
    const m = out.match(/^OK:(\d+)$/);
    return m ? { ok: true, count: +m[1] } : { ok: false, error: 'Lỗi khi tạo đề trong Word: ' + out.slice(4) };
  }
  if (opts.action === 'inserteq') {
    const hideNow = !!office && !!opts.quick && win && !shotArg;
    if (hideNow) win.hide();
    const mf = path.join(app.getPath('temp'), 'toanviet-eq-' + Date.now() + '.xml');
    fs.writeFileSync(mf, opts.mathml, 'utf8');
    const out = await runOffice({ TVS_ACT: 'inserteq', TVS_JOB: mf, TVS_SRC: /^(ole|omath)$/.test(opts.source || '') ? opts.source : '' });
    fs.unlink(mf, () => {});
    if (out.startsWith('OK')) return { ok: true, replaced: out === 'OK:1' };
    if (hideNow) { win.show(); win.focus(); }
    return { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
  }
  const scale = 4;
  const buf = await capture(e.sender, opts.target, scale);  const size = nativeImage.createFromBuffer(buf).getSize();
  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '.png');
  fs.writeFileSync(file, buf);
  // kiểm thử: chỉ xuất ảnh và độ hạ dòng ra tệp, không đụng tới Word / PowerPoint
  if (process.env.TVS_DEBUG_PNG) { fs.copyFileSync(file, process.env.TVS_DEBUG_PNG); fs.writeFileSync(process.env.TVS_DEBUG_PNG + '.txt', size.width + ' ' + size.height + ' ' + (capture.depthPt || 0)); return { ok: true, replaced: false }; }
  const k = (opts.app === 'ppt' ? 2 : 1) * 0.75 / scale; // px ảnh -> point; trên trang chiếu phóng gấp đôi
  const hideNow = !!office && !!opts.quick && win && !shotArg;
  if (hideNow) win.hide();
  const out = await runOffice({ TVS_ACT: 'insert', TVS_APP: opts.app, TVS_PNG: file, TVS_ALT: 'TVS1:' + opts.data, TVS_POS: String(capture.depthPt || 0), TVS_SRC: /^(ole|omath|img)$/.test(opts.source || '') ? opts.source : '', TVS_W: String(size.width * k), TVS_H: String(size.height * k) });
  fs.unlink(file, () => {});
  if (out.startsWith('OK')) return { ok: true, replaced: out === 'OK:1' };
  if (hideNow) { win.show(); win.focus(); }
  return { ok: false, error: out === 'ERR:NOAPP' ? 'Chưa mở tài liệu ' + name + ' nào. Hãy mở ' + name + ' và đặt con trỏ vào chỗ cần chèn.' : 'Lỗi ' + name + ': ' + out.slice(4) };
});
// ---------- Đóng khi chưa lưu, tự lưu bản nháp ----------
let docDirty = false, allowClose = false;
const draftFile = () => path.join(app.getPath('userData'), 'ban-nhap.json');
ipcMain.on('dirty', (_e, v) => { docDirty = !!v; });
ipcMain.on('quit', () => { allowClose = true; app.quit(); });
// lưu bản nháp (data = null: xoá bản nháp). Không ghi khi đang chạy kiểm thử / chụp ảnh hay mở từ Word.
ipcMain.handle('draft', (_e, o) => {
  if ((shotArg && !process.env.TVS_DRAFT_TEST) || office) return null;
  if (o.action === 'write') { fs.mkdirSync(path.dirname(draftFile()), { recursive: true }); const tmp = draftFile() + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ time: Date.now(), file: o.file || null, data: o.data }), 'utf8'); fs.renameSync(tmp, draftFile()); return true; }
  if (o.action === 'clear') { try { fs.unlinkSync(draftFile()); } catch (err) { /* không có bản nháp */ } return true; }
  if (o.action === 'read') { try { return JSON.parse(fs.readFileSync(draftFile(), 'utf8')); } catch (err) { return null; } }
  return null;
});
// hộp thoại khi đóng cửa sổ mà tài liệu chưa lưu
function guardClose(w) {
  w.on('close', (e) => {
    const auto = process.env.TVS_AUTO_CLOSE; // kiểm thử: save | discard | cancel
    if (allowClose || !docDirty || office || (!auto && (shotArg || process.env.TVS_AUTO))) return;
    e.preventDefault();
    const r = auto ? ['save', 'discard', 'cancel'].indexOf(auto) : dialog.showMessageBoxSync(w, { type: 'warning', title: 'ToanViet Studio', message: 'Tài liệu chưa được lưu.', detail: 'Lưu các thay đổi trước khi thoát?', buttons: ['Lưu', 'Không lưu', 'Huỷ'], defaultId: 0, cancelId: 2, noLink: true });
    if (r === 0) w.webContents.send('menu', 'save-quit');
    if (r === 1) { try { fs.unlinkSync(draftFile()); } catch (err) { /* không có bản nháp */ } allowClose = true; w.close(); }
  });
}
ipcMain.handle('info', async (_e, msg) => {
  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'INFO: ' + String(msg).replace(/\n+/g, ' / ') + '\n'); return true; } await dialog.showMessageBox(win, { type: 'info', buttons: ['Đóng'], message: String(msg) }); return true; });
ipcMain.on('title', (_e, t) => { if (win) win.setTitle(t); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
