// Móc kiểm thử / chụp ảnh tài liệu hướng dẫn (chỉ dùng khi chạy với --shot)
const fs = require('fs');
let a = fs.readFileSync('src/app.js', 'utf8').replace(/\r\n/g, '\n');
if (!a.includes('window.__add')) {
  const mark = '  // ---------- Tài liệu mẫu ----------';
  if (!a.includes(mark)) throw new Error('mark not found');
  a = a.replace(mark, () => `  // Dùng khi chụp ảnh minh hoạ: thêm đối tượng bằng lệnh
  window.__clear = () => loadDoc([], null);
  window.__add = (type, kind, extra) => { const o = insert(type, kind, extra); renderObj(o); return o.id; };
  window.__unselect = () => select(null);

` + mark);
  fs.writeFileSync('src/app.js', a);
}
let m = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
if (!m.includes("-after.png")) {
  const x = "        const ui = await win.webContents.capturePage();";
  if (!m.includes(x)) throw new Error('shot anchor not found');
  m = m.replace(x, () => "        if (process.env.TVS_SHOT_PAGE) fs.writeFileSync(shotArg.slice(7).replace(/\\.png$/, '-after.png'), await capture(win.webContents, 'page', 1.5));\n" + x);
  fs.writeFileSync('main.js', m);
}
console.log('hooks ok');
