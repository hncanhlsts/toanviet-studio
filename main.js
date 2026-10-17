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

function createWindow() {
  win = new BrowserWindow({
    width: office && office.mode !== 'full' ? 1080 : 1400, height: office && office.mode !== 'full' ? 760 : 900, minWidth: 980, minHeight: 600,
    title: 'ToanViet Studio',
    show: true,
    webPreferences: { additionalArguments: office ? ['--tvs-office=' + office.app, '--tvs-mode=' + office.mode, '--tvs-size=' + (parseFloat(argVal('--size')) || 0), '--tvs-op=' + office.op] : [], preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  guardClose(win);
  // mở từ Word/PowerPoint: đưa cửa sổ lên trước để gõ được ngay
  if (office) runOffice({ TVS_ACT: 'warm' }); // khởi động sẵn cầu nối để lần chèn đầu tiên không phải chờ
  if (office) win.webContents.once('did-finish-load', () => { win.show(); win.focus(); app.focus({ steal: true }); win.webContents.focus(); });
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
      { label: 'Giới thiệu ToanViet Studio', click: showAbout },
    ] },
  ]));

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
// ---------- Cầu nối Word / PowerPoint (COM): chèn hình kèm dữ liệu để lấy về sửa lại ----------
const OFFICE_PS = String.raw`
$ErrorActionPreference = 'Stop'
function GetApp($n) { try { [Runtime.InteropServices.Marshal]::GetActiveObject($n) } catch { $null } }
# Tìm đúng Word / PowerPoint người dùng đang xem. GetActiveObject trả về phiên đăng kí ĐẦU TIÊN với Windows — có thể là
# một phiên chạy ngầm, không có cửa sổ (Word đóng chưa hết, phần mềm khác mở Word để xử lí tệp…): công thức sẽ bị chèn
# vào tài liệu vô hình đó. Vì vậy lấy đối tượng qua cửa sổ đang hiển thị: ưu tiên phiên đã mở ToanViet (TVS_WPID),
# rồi đến cửa sổ Word nằm trên cùng; không bao giờ chèn vào phiên ẩn.
$tvsWinCs = @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class TvsWin {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("oleacc.dll")] static extern int AccessibleObjectFromWindow(IntPtr h, uint id, ref Guid iid, [MarshalAs(UnmanagedType.IDispatch)] out object o);
  static string Cls(IntPtr h) { StringBuilder s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  // cửa sổ khung (frame) hiển thị đầu tiên theo thứ tự trên-xuống, trong tiến trình pid (0: bất kì), lấy đối tượng Office của cửa sổ con
  public static object Find(string frame, string child, int pid) {
    object found = null;
    EnumWindows(delegate (IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h) || Cls(h) != frame) return true;
      uint p; GetWindowThreadProcessId(h, out p);
      if (pid > 0 && p != (uint)pid) return true;
      IntPtr c = IntPtr.Zero;
      EnumChildWindows(h, delegate (IntPtr hc, IntPtr l2) { if (Cls(hc) == child) { c = hc; return false; } return true; }, IntPtr.Zero);
      if (c == IntPtr.Zero) return true;
      Guid g = new Guid("00020400-0000-0000-C000-000000000046"); object o;
      if (AccessibleObjectFromWindow(c, 0xFFFFFFF0, ref g, out o) == 0 && o != null) { found = o; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
'@
function WinApp($frame, $child) {
  if (-not ('TvsWin' -as [type])) { try { Add-Type -TypeDefinition $tvsWinCs -ErrorAction Stop } catch { return $null } }
  $pid0 = 0; [void][int]::TryParse("$env:TVS_WPID", [ref]$pid0)
  foreach ($q in @($pid0, 0)) {
    if ($q -lt 0) { continue }
    try { $w = [TvsWin]::Find($frame, $child, $q); if ($w) { return $w.Application } } catch {}
    if ($pid0 -eq 0) { break }
  }
  $null
}
# Word đang hiển thị (không có thì thử GetActiveObject; phiên tìm được mà không hiển thị thì báo lỗi, không chèn)
function WordApp {
  $a = WinApp 'OpusApp' '_WwG'
  if (-not $a) { $a = GetApp 'Word.Application' }
  if ($a) { $v = $true; try { $v = [bool]$a.Visible } catch {}; if (-not $v) { throw 'TVSHIDDEN' } }
  $a
}
function PptApp {
  $a = WinApp 'PPTFrameClass' 'mdiClass'
  if (-not $a) { $a = GetApp 'PowerPoint.Application' }
  $a
}
$pkgA = '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage"><pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part><pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p>'
$pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
# dữ liệu ToanViet ghi trong ảnh PNG (khối tEXt "ToanViet") của một hình trong dòng
function PngTvs($shape) {
  try {
    $mb = [regex]::Match($shape.Range.WordOpenXML, '<pkg:part pkg:name="/word/media/[^"]+\.png"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
    if (-not $mb.Success) { return $null }
    $b = [Convert]::FromBase64String(($mb.Groups[1].Value -replace '\s', '')); $p = 8
    while ($p + 8 -le $b.Length) {
      $n = ([int]$b[$p] -shl 24) -bor ([int]$b[$p + 1] -shl 16) -bor ([int]$b[$p + 2] -shl 8) -bor [int]$b[$p + 3]
      $t = [Text.Encoding]::ASCII.GetString($b, $p + 4, 4)
      if ($t -eq 'tEXt') { $s = [Text.Encoding]::GetEncoding(28591).GetString($b, $p + 8, $n); if ($s.StartsWith('ToanViet' + [char]0)) { return $s.Substring(9) } }
      if ($t -eq 'IEND') { break }
      $p += 12 + $n
    }
  } catch {}
  $null
}
# MathML -> OMML bằng bộ chuyển của chính Word (nạp một lần)
function MmlToOmml($a, $mml) {
  if (-not $global:TvsXsl) { $global:TvsXsl = New-Object System.Xml.Xsl.XslCompiledTransform; $global:TvsXsl.Load((Join-Path $a.Path 'MML2OMML.XSL')) }
  $sw = New-Object IO.StringWriter; $st = New-Object Xml.XmlWriterSettings; $st.OmitXmlDeclaration = $true; $st.ConformanceLevel = 'Fragment'
  $xw = [Xml.XmlWriter]::Create($sw, $st); $global:TvsXsl.Transform([Xml.XmlReader]::Create((New-Object IO.StringReader $mml)), $xw); $xw.Flush()
  $sw.ToString()
}
try {
  $act = $env:TVS_ACT; $appn = $env:TVS_APP; $png = $env:TVS_PNG; $alt = $env:TVS_ALT
  if ($act -eq 'warm') { [void](WinApp 'TvsKhongCo' 'TvsKhongCo'); 'OK'; exit } # nạp sẵn bộ tìm cửa sổ
  if ($act -eq 'scan') {
    # liệt kê mọi công thức một loại trong tài liệu Word đang mở: ole = MathType, omath = Equation, tvs = ToanViet
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $kind = $env:TVS_KIND; $sb = New-Object Text.StringBuilder; $n = 0
    if ($kind -eq 'latex') {
      # mã LaTeX dán từ các trợ lí AI: $...$, $$...$$, \(...\), \[...\] (kể cả khối $$ hoặc \[ nằm riêng một dòng)
      $rx = New-Object Regex '\$\$(?<a>[^$]+?)\$\$|\\\[(?<b>.+?)\\\]|\\\((?<c>.+?)\\\)|(?<![\\$])\$(?!\s)(?<d>[^$\r\n]{1,400}?)(?<!\s)\$(?![\d$])'
      $trim = [char[]](13, 7, 32, 9, 11, 160)
      $ps = New-Object Collections.ArrayList
      foreach ($p in $doc.Paragraphs) { $r0 = $p.Range; [void]$ps.Add(@($r0.Start, $r0.End, "$($r0.Text)")) }
      $emit = { param($s0, $e0, $tex)
        $fs = 0; try { $fs = [double]$doc.Range($s0, $e0).Font.Size } catch {}
        [void]$sb.AppendLine("$s0|$fs|" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($tex)) + "|$e0") }
      $i = 0
      while ($i -lt $ps.Count) {
        $t = $ps[$i][2]; $tt = $t.Trim($trim)
        if ($tt -eq '$$' -or $tt -eq '\[') {
          $close = '\]'; if ($tt -eq '$$') { $close = '$$' }
          $j = $i + 1; $acc = ''; $found = $false
          while ($j -lt $ps.Count -and $j -le $i + 15) { $t2 = $ps[$j][2].Trim($trim); if ($t2 -eq $close) { $found = $true; break }; $acc += ' ' + $t2; $j++ }
          if ($found -and $acc.Trim()) { & $emit $ps[$i][0] ($ps[$j][1] - 1) $acc.Trim(); $n++; $i = $j + 1; continue }
        }
        foreach ($m in $rx.Matches($t)) {
          $tex = ''; foreach ($g in 'a', 'b', 'c', 'd') { if ($m.Groups[$g].Success) { $tex = $m.Groups[$g].Value } }
          $s0 = $ps[$i][0] + $m.Index; $e0 = $s0 + $m.Length
          if ($tex.Trim() -and "$($doc.Range($s0, $e0).Text)" -eq $m.Value) { & $emit $s0 $e0 $tex.Trim(); $n++ }
        }
        $i++
      }
    } elseif ($kind -eq 'omath') {
      for ($i = 1; $i -le $doc.OMaths.Count; $i++) {
        try {
          $om = $doc.OMaths.Item($i); $x = $om.Range.WordOpenXML; $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $fs = 0; try { $fs = [double]$om.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value))); $n++ }
        } catch {}
      }
    } else {
      for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
        try {
          $s = $doc.InlineShapes.Item($i); $al = "$($s.AlternativeText)"
          if ($kind -eq 'tvs') {
            if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine("$i|0|" + $al.Substring(5)); $n++ }
            elseif ($s.Type -eq 3) { $d0 = PngTvs $s; if ($d0) { [void]$sb.AppendLine("$i|0|" + $d0); $n++ } }
          }
          elseif (-not $al.StartsWith('TVS1:')) {
            $pg = ''; try { $pg = "$($s.OLEFormat.ProgID)" } catch {}
            if ($pg -like 'Equation*') {
              $x = $s.Range.WordOpenXML; $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
              if ($mb.Success) { $fs = 0; try { $fs = [double]$s.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + ($mb.Groups[1].Value -replace '\s', '')); $n++ }
            }
          }
        } catch {}
      }
    }
    [IO.File]::WriteAllText($env:TVS_OUT, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
    "OK:$n"
  } elseif ($act -eq 'apply') {
    # thực hiện chuyển đổi theo tệp việc (mỗi dòng một công thức, chỉ số giảm dần để không lệch thứ tự)
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $op = $env:TVS_OP; $n = 0; $xsl = $null
    $ur = $null; try { $ur = $a.UndoRecord; $ur.StartCustomRecord('ToanViet') } catch {}
    $a.ScreenUpdating = $false
    # tắt "cắt dán thông minh" trong lúc thay thế để Word không tự xoá dấu cách cạnh công thức
    $scp = $true; try { $scp = $a.Options.SmartCutPaste; $a.Options.SmartCutPaste = $false } catch {}
    try {
      foreach ($line in [IO.File]::ReadAllLines($env:TVS_JOB, [Text.Encoding]::UTF8)) {
        if (-not $line) { continue }
        $f = $line.Split('|'); $i = [int]$f[0]
        try {
          if ($op -eq 'mt2tv') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete()
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'eq2tv') {
            $om = $doc.OMaths.Item($i); $rg = $om.Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection; [void]$sel.MoveRight(1, 1)
            $p = $sel.InlineShapes.AddPicture($f[1], $false, $true)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]
            $doc.OMaths.Item($i).Range.Delete() | Out-Null; $n++
          } elseif ($op -eq 'tv2eq') {
            $mml = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))
            $om = MmlToOmml $a $mml
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML($pkgA + $om + $pkgB); $n++
          } elseif ($op -eq 'tex2tv') {
            # $f: đầu | ảnh | rộng | cao | hạ dòng | dữ liệu | cuối  (thay đoạn mã LaTeX bằng công thức ToanViet)
            $r = $doc.Range($i, [int]$f[6]); $r.Delete() | Out-Null
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'tv2tex') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertAfter([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))); $n++
          } elseif ($op -eq 'tv2mt') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML([IO.File]::ReadAllText($f[1], [Text.Encoding]::UTF8)); $n++
          }
        } catch {}
      }
    } finally { $a.ScreenUpdating = $true; try { $a.Options.SmartCutPaste = $scp } catch {}; try { if ($ur) { $ur.EndCustomRecord() } } catch {} }
    "OK:$n"
  } elseif ($act -eq 'buildexam') {
    # dựng đề kiểm tra thành một tài liệu Word mới: chữ thường + công thức Equation, hình chèn sau theo chỗ đánh dấu
    $a = $null; try { $a = WordApp } catch {}
    if (-not $a) { $a = New-Object -ComObject Word.Application }
    $a.Visible = $true
    $job = [IO.File]::ReadAllText($env:TVS_JOB, [Text.Encoding]::UTF8) | ConvertFrom-Json
    $doc = $a.Documents.Add()
    $pg = $doc.PageSetup; $pg.TopMargin = 56.7; $pg.BottomMargin = 56.7; $pg.LeftMargin = 56.7; $pg.RightMargin = 56.7
    $st = $doc.Styles.Item(-1); $st.Font.Name = 'Times New Roman'; $st.Font.Size = 12
    $st.ParagraphFormat.SpaceBefore = 0; $st.ParagraphFormat.SpaceAfter = 0; $st.ParagraphFormat.LineSpacingRule = 0
    $sb = New-Object Text.StringBuilder; $np = 0
    foreach ($bk in $job.blocks) {
      $ppr = ''
      if ($bk.pageBreak) { $ppr += '<w:pageBreakBefore/>' }
      if ($bk.tabs) { $ppr += '<w:tabs>' + (($bk.tabs | ForEach-Object { '<w:tab w:val="left" w:pos="' + [int]$_ + '"/>' }) -join '') + '</w:tabs>' }
      $ppr += '<w:spacing w:before="' + ([int]$bk.before * 20) + '" w:after="' + ([int]$bk.after * 20) + '" w:line="276" w:lineRule="auto"/>'
      if ($bk.indent) { $ppr += '<w:ind w:left="' + [int]$bk.indent + '"/>' }
      if ($bk.align -eq 'center') { $ppr += '<w:jc w:val="center"/>' } elseif ($bk.justify) { $ppr += '<w:jc w:val="both"/>' }
      [void]$sb.Append('<w:p><w:pPr>' + $ppr + '</w:pPr>')
      foreach ($sg in $bk.segs) {
        if ($sg.m) { [void]$sb.Append((MmlToOmml $a ([string]$sg.m))); continue }
        $rpr = ''; if ($sg.b -or $bk.bold) { $rpr += '<w:b/>' }; if ($bk.italic) { $rpr += '<w:i/>' }
        $parts = ([string]$sg.t).Split([char]9)
        for ($i = 0; $i -lt $parts.Length; $i++) {
          if ($i -gt 0) { [void]$sb.Append('<w:r><w:rPr>' + $rpr + '</w:rPr><w:tab/></w:r>') }
          if ($parts[$i]) { [void]$sb.Append('<w:r><w:rPr>' + $rpr + '</w:rPr><w:t xml:space="preserve">' + [Security.SecurityElement]::Escape($parts[$i]) + '</w:t></w:r>') }
        }
      }
      [void]$sb.Append('</w:p>'); $np++
    }
    $head = $pkgA.Replace('<w:body><w:p>', '<w:body>'); $tail = $pkgB.Replace('</w:p></w:body>', '</w:body>')
    $doc.Content.InsertXML($head + $sb.ToString() + $tail)
    foreach ($im in $job.images) {
      $rg = $doc.Content
      if ($rg.Find.Execute([string]$im.key)) {
        $rg.Text = ''
        $p = $doc.InlineShapes.AddPicture([string]$im.file, $false, $true, $rg)
        $p.LockAspectRatio = 0; $p.Width = [double]$im.w; $p.Height = [double]$im.h; $p.LockAspectRatio = -1
      }
    }
    try { $doc.Range(0, 0).Select(); $a.Activate() } catch {}
    "OK:$np"
  } elseif ($act -eq 'inserteq') {
    # chèn công thức dạng Equation gốc của Word (OMML) tại con trỏ, hoặc thay cho công thức đang sửa
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $om = MmlToOmml $a ([IO.File]::ReadAllText($env:TVS_JOB, [Text.Encoding]::UTF8))
    $sel = $a.Selection; $rep = 0; $r = $null
    try {
      if ($env:TVS_SRC -eq 'omath' -and $sel.OMaths.Count -ge 1) { $r = $sel.OMaths.Item(1).Range; $rep = 1 }
      elseif ($sel.InlineShapes.Count -ge 1) {
        $s = $sel.InlineShapes.Item(1); $pg = ''; try { $pg = "$($s.OLEFormat.ProgID)" } catch {}
        if ($env:TVS_SRC -eq 'ole' -or "$($s.AlternativeText)".StartsWith('TVS1:') -or $pg -like 'Equation*') { $r = $s.Range; $s.Delete(); $r.Font.Position = 0; $rep = 1 }
      }
    } catch {}
    if (-not $r) { $r = $sel.Range }
    $doc = $a.ActiveDocument; $fs = 0; try { $fs = [double]$r.Font.Size } catch {}; if (-not ($fs -gt 0)) { try { $fs = [double]$sel.Font.Size } catch {} }
    $s0 = $r.Start; $len0 = $doc.Content.End
    $r.InsertXML($pkgA + $om + $pkgB)
    # công thức vừa chèn nằm từ s0 đến s0 + (độ dài tăng thêm): cho cùng cỡ chữ với dòng, rồi đưa con trỏ ra sau nó
    $e0 = $s0 + ($doc.Content.End - $len0); $nr = $doc.Range($s0, $e0)
    try { if ($fs -gt 0) { $nr.Font.Size = $fs } } catch {}
    # đưa con trỏ ra khỏi vùng công thức (giống cách chèn ảnh sau công thức Equation): đến cuối vùng rồi sang phải một lần
    try { if ($nr.OMaths.Count -ge 1) { $z = $nr.OMaths.Item($nr.OMaths.Count).Range; $z.Collapse(0); $z.Select(); [void]$a.Selection.MoveRight(1, 1) } else { $doc.Range($e0, $e0).Select() }; $a.Selection.Font.Position = 0 } catch {}
    try { $a.Activate() } catch {}
    "OK:$rep"
  } elseif ($act -eq 'insert') {    $w = [double]$env:TVS_W; $h = [double]$env:TVS_H
    if ($appn -eq 'word') {
      $a = WordApp
      if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
      $sel = $a.Selection; $rep = 0
      $omOld = $null
      if ($env:TVS_SRC -eq 'ole' -or $env:TVS_SRC -eq 'img') {
        # nguồn là công thức MathType đang chọn: xoá đối tượng gốc, ảnh ToanViet vào đúng chỗ đó
        try { if ($sel.InlineShapes.Count -ge 1) { $sel.InlineShapes.Item(1).Delete(); $rep = 1 } } catch {}
      } elseif ($env:TVS_SRC -eq 'omath') {
        # nguồn là công thức Equation của Word: ra khỏi vùng công thức, chèn ảnh ngay sau rồi mới xoá công thức gốc
        try {
          if ($sel.OMaths.Count -ge 1) {
            $omOld = $sel.OMaths.Item(1)
            $rg = $omOld.Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection
            [void]$sel.MoveRight(1, 1) # một lần là đủ; Word vẫn báo OMaths.Count = 1 dù con trỏ đã ở ngoài
          }
        } catch {}
      }
      if ($sel.InlineShapes.Count -eq 1 -and "$($sel.InlineShapes.Item(1).AlternativeText)".StartsWith('TVS1:')) { $sel.InlineShapes.Item(1).Delete(); $rep = 1 }
      $p = $sel.InlineShapes.AddPicture($png, $false, $true)
      $p.LockAspectRatio = 0; $p.Width = $w; $p.Height = $h; $p.LockAspectRatio = -1
      $p.AlternativeText = $alt
      # hạ công thức xuống để đường chân chữ của nó trùng với dòng văn bản; chữ gõ tiếp theo trở lại bình thường
      try { $p.Range.Font.Position = -[int]$env:TVS_POS; $sel.Font.Position = 0 } catch {}
      if ($omOld) { try { $omOld.Range.Delete() | Out-Null; $rep = 1 } catch {} }
      try { $a.Activate() } catch {}
      "OK:$rep"
    } else {
      $a = PptApp
      if (-not $a -or $a.Presentations.Count -eq 0) { 'ERR:NOAPP'; exit }
      $win = $a.ActiveWindow; $slide = $win.View.Slide; $left = $null; $rep = 0
      try { if ($win.Selection.Type -eq 2) { $s = $win.Selection.ShapeRange.Item(1); if ("$($s.AlternativeText)".StartsWith('TVS1:')) { $left = $s.Left; $top = $s.Top; $s.Delete(); $rep = 1 } } } catch {}
      if ($null -eq $left) { $ps = $a.ActivePresentation.PageSetup; $left = ($ps.SlideWidth - $w) / 2; $top = ($ps.SlideHeight - $h) / 2 }
      $s = $slide.Shapes.AddPicture($png, 0, -1, $left, $top, $w, $h)
      $s.AlternativeText = $alt; $s.Select()
      try { $a.Activate() } catch {}
      "OK:$rep"
    }
  } else {
    $r = ''; $from = 'Word'
    $a = $null; if ($appn -eq 'word') { $a = WordApp } elseif ($appn -ne 'ppt') { try { $a = WordApp } catch { $a = $null } }
    $kind = ''; $payload = 'x'
    if ($a -and $a.Documents.Count -gt 0) {
      try {
        $sel = $a.Selection
        if ($sel.InlineShapes.Count -ge 1) {
          $ish = $sel.InlineShapes.Item(1); $r = "$($ish.AlternativeText)"
          if (-not $r.StartsWith('TVS1:')) { $pg = ''; try { $pg = "$($ish.OLEFormat.ProgID)" } catch {}; if ($pg -like 'Equation*') {
            $kind = 'MathType'
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $payload = ($mb.Groups[1].Value -replace '\s', '') }
          } elseif ($ish.Type -eq 3) {
            # ảnh thường (không còn văn bản thay thế): gửi ảnh để tìm dữ liệu ToanViet ghi trong PNG
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/media/[^"]+\.png"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $kind = 'Img'; $payload = ($mb.Groups[1].Value -replace '\s', '') }
          } }
        }
        if (-not $r.StartsWith('TVS1:') -and -not $kind -and $sel.OMaths.Count -ge 1) {
          $x = $sel.OMaths.Item(1).Range.WordOpenXML
          $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $kind = 'WordEq'; $payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value)) }
        }
      } catch {}
    }
    if ($kind) { "OK:$kind" + ':' + $payload; exit }
    if (-not $r.StartsWith('TVS1:') -and $appn -ne 'word') {
      $from = 'PPT'
      $a = PptApp
      if ($a -and $a.Presentations.Count -gt 0) { try { $w2 = $a.ActiveWindow; if ($w2.Selection.Type -eq 2) { $r = "$($w2.Selection.ShapeRange.Item(1).AlternativeText)" } } catch {} }
    }
    if ($r.StartsWith('TVS1:')) { "OK:$from" + ':' + $r.Substring(5) } else { 'ERR:NOSEL' }
  }
} catch { 'ERR:' + $_.Exception.Message }
`;
// PowerShell được mở một lần và chờ lệnh qua stdin (mỗi lệnh là một dòng JSON mã hoá base64), trả kết quả "@@<base64>"
const PS_LOOP = 'function Invoke-Bridge {\n' + OFFICE_PS.replace(/\bexit\b/g, 'return') + '\n}\n' + [
  "$keys = 'TVS_ACT','TVS_APP','TVS_PNG','TVS_ALT','TVS_W','TVS_H','TVS_POS','TVS_SRC','TVS_KIND','TVS_OUT','TVS_OP','TVS_JOB','TVS_WPID'",
  'while ($true) {',
  '  $line = [Console]::In.ReadLine(); if ($null -eq $line) { break }; if (-not $line) { continue }',
  "  try { $j = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line)) | ConvertFrom-Json; foreach ($k in $keys) { Set-Item ('env:' + $k) ([string]$j.$k) }; $r = @(Invoke-Bridge) | Select-Object -Last 1 } catch { $r = 'ERR:' + $_.Exception.Message }",
  "  [Console]::Out.WriteLine('@@' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$r))); [Console]::Out.Flush()",
  '}',
].join('\n');
let psProc = null, psBuf = '';
const psWait = [];
function startBridge() {
  if (psProc) return;
  const file = path.join(app.getPath('temp'), 'toanviet-bridge.ps1');
  fs.writeFileSync(file, '﻿' + PS_LOOP, 'utf8');
  const boot = 'Invoke-Expression ([IO.File]::ReadAllText($env:TVS_SCRIPT, [Text.Encoding]::UTF8))';
  psProc = require('child_process').spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(boot, 'utf16le').toString('base64')],
    { env: Object.assign({}, process.env, { TVS_SCRIPT: file }), windowsHide: true });
  psBuf = '';
  psProc.stdout.setEncoding('utf8');
  psProc.stdout.on('data', (d) => {
    psBuf += d;
    let i;
    while ((i = psBuf.indexOf('\n')) >= 0) {
      const line = psBuf.slice(0, i).trim(); psBuf = psBuf.slice(i + 1);
      if (line.startsWith('@@')) { const cb = psWait.shift(); if (cb) cb(Buffer.from(line.slice(2), 'base64').toString('utf8').trim() || 'ERR:'); }
    }
  });
  const dead = () => { psProc = null; psWait.splice(0).forEach((cb) => cb('ERR:Cầu nối với Word/PowerPoint bị ngắt')); };
  psProc.on('exit', dead); psProc.on('error', dead);
}
// tiến trình Word đã mở ToanViet (add-in truyền vào): chèn đúng vào phiên đó
const wordPid = /^d+$/.test(argVal('--wpid')) ? argVal('--wpid') : '';
const HIDDEN_MSG = 'Máy đang có một phiên Word chạy ngầm (không có cửa sổ). ToanViet không chèn vào đó để công thức không bị mất. Hãy lưu và đóng Word, bấm Ctrl+Shift+Esc mở Task Manager, kết thúc mọi mục "Microsoft Word" còn lại, rồi mở lại tài liệu và chèn lại.';
function runOffice(env) {
  startBridge();
  env = Object.assign({ TVS_WPID: wordPid }, env);
  return new Promise((done) => {
    const resolve = (out) => done(/TVSHIDDEN/.test(out) ? 'ERR:' + HIDDEN_MSG : out);
    psWait.push(resolve);
    try { psProc.stdin.write(Buffer.from(JSON.stringify(env), 'utf8').toString('base64') + '\n'); } catch (e) { psWait.pop(); resolve('ERR:' + e.message); }
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
  fs.writeFileSync(String(file), img.toPNG());
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
