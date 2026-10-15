// Bản vá: nhấp đúp tệp .tvslib để nhập vào thư viện.  node build/patch-tvslib.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 60));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};
rep('main.js',
  "  if (fileArg) win.webContents.once('did-finish-load', () => win.webContents.send('openfile', { file: fileArg, data: fs.readFileSync(fileArg, 'utf8') }));",
  "  if (fileArg) win.webContents.once('did-finish-load', () => win.webContents.send('openfile', { file: fileArg, data: fs.readFileSync(fileArg, 'utf8') }));\n  // nhấp đúp gói thư viện .tvslib: nhập vào Thư viện của tôi\n  const libArg = process.argv.slice(1).find((a) => /\\.tvslib$/i.test(a) && fs.existsSync(a));\n  if (libArg) win.webContents.once('did-finish-load', () => win.webContents.send('libfile', { file: path.basename(libArg), data: fs.readFileSync(libArg, 'utf8') }));");
rep('preload.js',
  "  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),",
  "  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),\n  onLibFile: (cb) => ipcRenderer.on('libfile', (_e, r) => cb(r)),");
rep('src/app.js',
  '  if (api) api.onMenu(run);',
  "  if (api) api.onMenu(run);\n  if (api && api.onLibFile) api.onLibFile(async (r) => {\n    try {\n      const d = JSON.parse(r.data);\n      if (d.format !== 'tvslib' || !Array.isArray(d.items)) throw new Error('không phải gói thư viện');\n      const items = await api.lib({ action: 'load' }), have = new Set(items.map((x) => x.id));\n      const add = d.items.filter((it) => it && it.obj && it.obj.type && !have.has(it.id));\n      if (!add.length) { await api.info('Các mục trong gói “' + r.file + '” đều đã có trong thư viện.'); return openLib(); }\n      if (!(await api.confirm('Nhập ' + add.length + ' mục từ gói “' + r.file + '” vào Thư viện của tôi?'))) return;\n      await api.lib({ action: 'save', items: items.concat(add) });\n      openLib();\n    } catch (e) { api.info('Không đọc được gói thư viện “' + r.file + '”: ' + e.message); }\n  });");
