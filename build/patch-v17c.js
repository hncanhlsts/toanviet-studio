const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};
let f = mk('src/index.html');
f.rep('<script src="mtef.js"></script>', '<script src="mtef.js"></script>\n<script src="mtefw.js"></script>');
f.save();

f = mk('main.js');
f.rep("ipcMain.handle('renderPng', async (e, target) => {", "ipcMain.handle('renderPng', async (e, target, withData) => {");
f.rep("  return { file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: capture.depthPt || 0 };", "  const res = { file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: capture.depthPt || 0 };\n  if (withData) { res.b64 = buf.toString('base64'); fs.unlink(file, () => {}); }\n  return res;");
f.save();

f = mk('preload.js');
f.rep("renderPng: (target) => ipcRenderer.invoke('renderPng', target),", "renderPng: (target, withData) => ipcRenderer.invoke('renderPng', target, !!withData),");
f.save();

f = mk('src/app.js');
f.rep(`    const r = await api.renderPng('cmt');
    return window.MTEFW.wordXml(texOf(obj), r, await (await fetch(r.file.startsWith('file:') ? r.file : 'file:///' + r.file.replace(/\\\\/g, '/'))).arrayBuffer());`,
`    const tx = texOf(obj).replace(/\\\\dongdang(?![a-zA-Z])/g, '\\\\backsim ');
    window.MTEFW.latexToMtef(tx); // báo lỗi sớm nếu có cấu trúc chưa hỗ trợ, trước khi dựng ảnh
    const r = await api.renderPng('cmt', true);
    return window.MTEFW.wordXml(tx, r, r.b64);`);
// ảnh công thức gọn hơn: bỏ lề thừa quanh công thức khi chèn vào dòng chữ
f.rep("const padX = depthPt ? 2 : pad; // công thức chèn giữa dòng chữ: lề ngang hẹp để không hở xa chữ\n      res({ x: Math.max(0, r.left - padX), y: Math.max(0, r.top - pad), width: r.width + 2 * padX, height: r.height + pad + padB, depthPt });",
  "const padX = depthPt ? -2 : pad, padT = depthPt ? 1 : pad; // công thức chèn giữa dòng chữ: cắt sát để không hở xa chữ, không đẩy dòng\n      res({ x: Math.max(0, r.left - padX), y: Math.max(0, r.top - padT), width: r.width + 2 * padX, height: r.height + padT + padB, depthPt });");
f.save();
console.log('v1.7c patched');
