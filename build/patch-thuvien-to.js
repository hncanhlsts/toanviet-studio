// Bản vá: thư viện dùng chung của tổ (thư mục mạng / OneDrive / Google Drive) và cập nhật qua thư mục đó.
//   node build/patch-thuvien-to.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 80));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};

// ---------- mô-đun thư viện: thay hàm openLib ----------
const T = R('src/mod/thuvien.js');
let t = fs.readFileSync(T, 'utf8');
const a = t.indexOf('  async function openLib() {'), b = t.indexOf('  // ---------- Báo lỗi / góp ý ----------');
if (a < 0 || b < 0) throw new Error('không thấy openLib');
if (!t.includes("tab === 'shared'")) {
  t = t.slice(0, a) + fs.readFileSync(path.join(__dirname, 'patch-thuvien-to.txt'), 'utf8') + t.slice(b);
  fs.writeFileSync(T, t);
  console.log('ok: src/mod/thuvien.js');
}

// ---------- tiến trình chính ----------
rep('main.js', '// ---------- Báo lỗi / góp ý: ghi thông tin cần thiết ra Desktop để người dùng tự gửi ----------',
`// ---------- Thư mục dùng chung của tổ: thư viện chung (*.tvslib) và bộ cài bản mới ----------
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
    fs.readdirSync(dir).filter((f) => /\\.tvslib$/i.test(f)).forEach((f) => {
      try { const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); if (d.format !== 'tvslib') throw new Error('không phải gói thư viện'); d.items.forEach((it) => { if (it && it.obj) items.push(Object.assign({}, it, { src: f.replace(/\\.tvslib$/i, '') })); }); } catch (err) { bad.push(f + ': ' + err.message); }
    });
    return { items, bad };
  }
  if (o.action === 'put') {
    // ghi các mục vào tệp của người chia sẻ trong thư mục chung (mục cùng mã thì thay bản mới)
    const name = (String(o.name || 'Chung').replace(/[\\\\/:*?"<>|]/g, '-').trim() || 'Chung');
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
    const found = fs.readdirSync(dir).map((f) => { const m = f.match(/^ToanVietStudio-Setup-(\\d+\\.\\d+\\.\\d+)\\.exe$/i); return m ? { version: m[1], file: path.join(dir, f) } : null; }).filter(Boolean)
      .filter((x) => verCmp(x.version, app.getVersion()) > 0).sort((x, y) => verCmp(y.version, x.version));
    return found[0] || { none: true, current: app.getVersion() };
  }
  if (o.action === 'runUpdate') {
    // chép bộ cài về máy rồi chạy sau khi phần mềm đã đóng (để cài đè được)
    const tmp = path.join(app.getPath('temp'), path.basename(o.file));
    fs.copyFileSync(o.file, tmp);
    pendingInstaller = tmp;
    if (process.env.TVS_UPDATE_TEST) { fs.appendFileSync(process.env.TVS_UPDATE_TEST, 'INSTALLER: ' + tmp + '\\n'); pendingInstaller = null; return tmp; }
    app.quit();
    return tmp;
  }
  return null;
});
app.on('will-quit', () => { if (pendingInstaller) { try { require('child_process').spawn(pendingInstaller, [], { detached: true, stdio: 'ignore' }).unref(); } catch (err) { /* bỏ qua */ } } });
// ---------- Báo lỗi / góp ý: ghi thông tin cần thiết ra Desktop để người dùng tự gửi ----------`);
rep('main.js', "      { label: 'Báo lỗi / góp ý…', click: send('report') },",
  "      { label: 'Kiểm tra bản mới (thư mục dùng chung)…', click: send('update') },\n      { label: 'Báo lỗi / góp ý…', click: send('report') },");
rep('preload.js', "  lib: (o) => ipcRenderer.invoke('lib', o),", "  lib: (o) => ipcRenderer.invoke('lib', o),\n  shared: (o) => ipcRenderer.invoke('shared', o),");

// ---------- giao diện: kiểm tra bản mới ----------
rep('src/app.js', "    report: () => openReport(),", `    report: () => openReport(),
    update: () => checkUpdate(true),`);
rep('src/app.js', '  // nạp các mô-đun (src/mod/*.js) trước lần vẽ đầu tiên', `  // bản mới đặt trong thư mục dùng chung của tổ (tệp ToanVietStudio-Setup-x.y.z.exe)
  async function checkUpdate(manual) {
    if (!api || !api.shared || (api.officeMode && api.officeMode.app)) return;
    const sh = await api.shared({ action: 'get' });
    if (!sh.dir) { if (manual) api.info('Chưa chọn thư mục dùng chung của tổ.\\n\\nMở Thư viện (Ctrl+L) ▸ thẻ "Thư viện tổ" ▸ "Chọn thư mục…". Người phụ trách chép bộ cài bản mới (ToanVietStudio-Setup-x.y.z.exe) vào thư mục đó, các máy sẽ tự thấy bản mới.'); return; }
    if (!sh.ok) { if (manual) api.info('Không mở được thư mục dùng chung: ' + sh.dir); return; }
    const r = await api.shared({ action: 'checkUpdate' });
    if (!r) return;
    if (r.none) { if (manual) api.info('Đang dùng bản mới nhất (' + r.current + ').'); return; }
    if (!(await api.confirm('Đã có ToanViet Studio ' + r.version + ' trong thư mục dùng chung của tổ.\\n\\nCài bản mới ngay? Phần mềm sẽ đóng rồi chạy bộ cài (nếu tài liệu chưa lưu, phần mềm sẽ hỏi trước).'))) return;
    await api.shared({ action: 'runUpdate', file: r.file });
  }
  setTimeout(() => checkUpdate(false), 4000);
  // nạp các mô-đun (src/mod/*.js) trước lần vẽ đầu tiên`);
console.log('xong');
