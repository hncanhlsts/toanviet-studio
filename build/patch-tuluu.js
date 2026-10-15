// Bản vá: hỏi trước khi đóng khi chưa lưu, tự lưu bản nháp, khôi phục sau khi phần mềm bị tắt đột ngột,
// giữ một bản sao .bak khi lưu đè.  node build/patch-tuluu.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 70));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};

// ---------- tiến trình chính ----------
rep('main.js', "ipcMain.on('quit', () => app.quit());",
`// ---------- Đóng khi chưa lưu, tự lưu bản nháp ----------
let docDirty = false, allowClose = false;
const draftFile = () => path.join(app.getPath('userData'), 'ban-nhap.json');
ipcMain.on('dirty', (_e, v) => { docDirty = !!v; });
ipcMain.on('quit', () => { allowClose = true; app.quit(); });
// lưu bản nháp (data = null: xoá bản nháp). Không ghi khi đang chạy kiểm thử / chụp ảnh hay mở từ Word.
ipcMain.handle('draft', (_e, o) => {
  if (shotArg || office) return null;
  if (o.action === 'write') { fs.mkdirSync(path.dirname(draftFile()), { recursive: true }); const tmp = draftFile() + '.tmp'; fs.writeFileSync(tmp, JSON.stringify({ time: Date.now(), file: o.file || null, data: o.data }), 'utf8'); fs.renameSync(tmp, draftFile()); return true; }
  if (o.action === 'clear') { try { fs.unlinkSync(draftFile()); } catch (err) { /* không có bản nháp */ } return true; }
  if (o.action === 'read') { try { return JSON.parse(fs.readFileSync(draftFile(), 'utf8')); } catch (err) { return null; } }
  return null;
});
// hộp thoại khi đóng cửa sổ mà tài liệu chưa lưu
function guardClose(w) {
  w.on('close', (e) => {
    if (allowClose || !docDirty || shotArg || office || process.env.TVS_AUTO) return;
    e.preventDefault();
    const r = dialog.showMessageBoxSync(w, { type: 'warning', title: 'ToanViet Studio', message: 'Tài liệu chưa được lưu.', detail: 'Lưu các thay đổi trước khi thoát?', buttons: ['Lưu', 'Không lưu', 'Huỷ'], defaultId: 0, cancelId: 2, noLink: true });
    if (r === 0) w.webContents.send('menu', 'save-quit');
    if (r === 1) { try { fs.unlinkSync(draftFile()); } catch (err) { /* không có bản nháp */ } allowClose = true; w.close(); }
  });
}`);
rep('main.js', "  win.loadFile(path.join(__dirname, 'src', 'index.html'));",
  "  win.loadFile(path.join(__dirname, 'src', 'index.html'));\n  guardClose(win);");
// giữ bản trước khi lưu đè
rep('main.js', "  fs.writeFileSync(file, data, 'utf8');\n  return file;",
  "  // giữ bản trước của tệp thành .bak, phòng khi lưu nhầm\n  try { if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak'); } catch (err) { /* bỏ qua */ }\n  const tmp = file + '.tmp';\n  fs.writeFileSync(tmp, data, 'utf8');\n  fs.renameSync(tmp, file);\n  return file;");

// ---------- cầu nối ----------
rep('preload.js', "  setTitle: (t) => ipcRenderer.send('title', t),",
  "  setTitle: (t) => ipcRenderer.send('title', t),\n  setDirty: (v) => ipcRenderer.send('dirty', !!v),\n  draft: (o) => ipcRenderer.invoke('draft', o),");

// ---------- giao diện ----------
rep('src/app.js', "    if (api) api.setTitle((S.dirty ? '● ' : '') + name + ' — ToanViet Studio');",
  "    if (api) api.setTitle((S.dirty ? '● ' : '') + name + ' — ToanViet Studio');\n    if (api && api.setDirty) api.setDirty(S.dirty && S.objs.length > 0);");
rep('src/app.js', "      if (f) { S.file = f; S.dirty = false; title(); msg('Đã lưu ' + f); }\n    },",
  "      if (f) { S.file = f; S.dirty = false; title(); msg('Đã lưu ' + f); if (api.draft) api.draft({ action: 'clear' }); }\n      return !!f;\n    },\n    'save-quit': async () => { if (await CMD.save()) api.quit(); },");
rep('src/app.js', "    new: async () => { if (await confirmDiscard()) loadDoc([], null); },",
  "    new: async () => { if (await confirmDiscard()) { loadDoc([], null); if (api && api.draft) api.draft({ action: 'clear' }); } },");
// tự lưu bản nháp mỗi 60 giây khi có thay đổi; khởi động: đề nghị khôi phục
rep('src/app.js', "  loadDoc([], null);\n",
`  loadDoc([], null);

  // ---------- Tự lưu bản nháp và khôi phục ----------
  let draftSig = '';
  const saveDraft = () => {
    if (!api || !api.draft || !S.dirty || !S.objs.length) return;
    const data = serialize();
    if (data === draftSig) return;
    draftSig = data;
    api.draft({ action: 'write', data, file: S.file });
  };
  setInterval(saveDraft, 60000);
  window.addEventListener('blur', saveDraft); // chuyển sang cửa sổ khác: lưu ngay bản nháp
  window.__saveDraftNow = saveDraft;
  (async () => {
    if (!api || !api.draft || (api.officeMode && api.officeMode.app)) return;
    const d = await api.draft({ action: 'read' });
    if (!d || !d.data) return;
    let objs; try { objs = JSON.parse(d.data); } catch (e) { return; }
    if (!Array.isArray(objs) || !objs.length) return;
    const when = new Date(d.time).toLocaleString('vi-VN');
    const ok = await api.confirm('Lần trước ToanViet Studio đã đóng khi tài liệu chưa được lưu' + (d.file ? ' (' + d.file.replace(/^.*[\\\\/]/, '') + ')' : '') + '.\\n\\nBản nháp tự lưu lúc ' + when + ' có ' + objs.length + ' đối tượng.\\n\\nKhôi phục bản nháp này?');
    if (ok) {
      loadDoc(objs, d.file || null);
      S.dirty = true; title();
      msg('Đã khôi phục bản nháp lúc ' + when + '. Nhớ bấm Lưu (Ctrl+S).');
    } else api.draft({ action: 'clear' });
  })();
`);
