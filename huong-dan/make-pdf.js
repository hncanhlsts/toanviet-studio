// Dựng tệp PDF hướng dẫn:  npx electron huong-dan/make-pdf.js [tệp.html tệp.pdf 'tiêu đề chân trang']
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 900, height: 1200 });
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-') && !/make-pdf\.js$/.test(a) && a !== '.');
  const src = args[0] || 'huong-dan.html', outName = args[1] || 'Huong-dan-su-dung-ToanViet-Studio.pdf', foot = args[2] || 'ToanViet Studio — Hướng dẫn sử dụng';
  await win.loadFile(path.join(__dirname, src));
  await new Promise((r) => setTimeout(r, 800));
  const pdf = await win.webContents.printToPDF({
    pageSize: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#6b7785;padding:0 16mm;display:flex;justify-content:space-between;font-family:Segoe UI"><span>' + foot + '</span><span>Trang <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  });
  const out = path.join(__dirname, outName);
  fs.writeFileSync(out, pdf);
  console.log('PDF: ' + out + ' (' + pdf.length + ' bytes)');
  app.quit();
});
