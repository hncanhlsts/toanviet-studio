// In cấu trúc MTEF của một tệp oleObject*.bin để đối chiếu khi viết bộ ghi MTEF
const fs = require('fs');
require('../src/mtef.js');
const M = globalThis.MTEF;
for (const file of process.argv.slice(2)) {
  const mtef = M.mtefFromOle(new Uint8Array(fs.readFileSync(file)));
  console.log('==', file.replace(/^.*[\\/]/, ''), '=>', M.mtefToLatex(mtef));
  // phần mở đầu: từ đầu tới bản ghi LINE/PILE đầu tiên ở cấp cao nhất
  let p = 5; while (mtef[p] !== 0) p++; p += 2;
  console.log('header', Buffer.from(mtef.subarray(0, p)).toString('hex'));
  console.log('all   ', Buffer.from(mtef).toString('hex'));
  const show = (n, d) => {
    const pad = '  '.repeat(d);
    if (n.t === 'char') console.log(pad + 'CHAR tf=' + n.tf + ' code=0x' + n.code.toString(16) + ' ' + JSON.stringify(String.fromCharCode(n.code)) + (n.emb.length ? ' emb=' + n.emb : ''));
    else if (n.t === 'tmpl') { console.log(pad + 'TMPL sel=' + n.sel + ' var=' + n.v + ' opt=' + n.topt); n.items.forEach((x) => show(x, d + 1)); }
    else { console.log(pad + n.t.toUpperCase() + (n.nul ? ' (null)' : '') + (n.t === 'matrix' ? ' ' + n.rows + 'x' + n.cols : '')); (n.items || []).forEach((x) => show(x, d + 1)); }
  };
  M.parseMtef(mtef).forEach((n) => show(n, 0));
}
