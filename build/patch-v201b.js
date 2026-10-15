const fs = require('fs');
let s = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 70)); s = s.replace(a, () => b); };
// chụp hàng loạt: giữ phiên gỡ lỗi mở giữa các lần chụp thay vì mở/đóng cho từng công thức
rep(`  const dbg = wc.debugger;
  dbg.attach('1.3');
  try {
    await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: 1900, height: 2600, deviceScaleFactor: 1, mobile: false });`,
`  const dbg = wc.debugger;
  const fresh = !dbg.isAttached();
  if (fresh) dbg.attach('1.3');
  try {
    if (fresh) await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: 1900, height: 2600, deviceScaleFactor: 1, mobile: false });`);
rep(`    try { await dbg.sendCommand('Emulation.clearDeviceMetricsOverride'); } catch (e) { /* bỏ qua */ }
    dbg.detach();`, `    if (!capture.keep) {
      try { await dbg.sendCommand('Emulation.clearDeviceMetricsOverride'); } catch (e) { /* bỏ qua */ }
      try { dbg.detach(); } catch (e) { /* đã tách */ }
    }`);
rep("ipcMain.handle('renderPng', async (e, target, withData) => {\n  const scale = 4;", "ipcMain.handle('renderPng', async (e, target, withData) => {\n  const scale = 4;\n  capture.keep = true; // đang chuyển đổi hàng loạt");
rep("  if (opts.action === 'apply') {\n    const dir = app.getPath('temp');", "  if (opts.action === 'apply') {\n    if (capture.keep) { capture.keep = false; try { if (e.sender.debugger.isAttached()) { await e.sender.debugger.sendCommand('Emulation.clearDeviceMetricsOverride'); e.sender.debugger.detach(); } } catch (err) { /* bỏ qua */ } }\n    const dir = app.getPath('temp');");
fs.writeFileSync('main.js', s);
console.log('batch capture patched');
