const fs = require('fs');
let s = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 70)); s = s.replace(a, () => b); };
// kiểm thử tự động: TVS_AUTO=1 thì các hộp hỏi/báo tự trả lời và ghi nội dung ra tệp
rep("ipcMain.handle('info', async (_e, msg) => {", "ipcMain.handle('info', async (_e, msg) => {\n  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'INFO: ' + String(msg).replace(/\\n+/g, ' / ') + '\\n'); return true; }");
rep("ipcMain.handle('confirm', async (_e, msg) => {", "ipcMain.handle('confirm', async (_e, msg) => {\n  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'CONFIRM: ' + String(msg).replace(/\\n+/g, ' / ') + '\\n'); return true; }");
fs.writeFileSync('main.js', s);
console.log('ok');
