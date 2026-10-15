// Ghép phần phân tích MTEF vào src/mtef.js (chạy một lần) và thử trên các tệp .bin
// Dùng: node build/mt-test.js [--merge] <thư mục chứa oleObject*.bin>
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
if (args[0] === '--merge') {
  args.shift();
  let s = fs.readFileSync('src/mtef.js', 'utf8');
  const tail = "\n  root.MTEF = { readOleStream, mtefFromOle };\n})(typeof window !== 'undefined' ? window : globalThis);\n";
  if (!s.includes(tail)) throw new Error('tail not found (đã ghép rồi?)');
  fs.writeFileSync('src/mtef.js', s.replace(tail, fs.readFileSync('build/mtef-parser-part.js', 'utf8')));
  console.log('merged');
}
delete require.cache[require.resolve('../src/mtef.js')];
require('../src/mtef.js');
const dir = args[0];
let ok = 0, bad = 0;
for (const f of fs.readdirSync(dir).filter((n) => /\.bin$/i.test(n)).sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))) {
  try { console.log(f.padEnd(16), globalThis.MTEF.oleToLatex(new Uint8Array(fs.readFileSync(path.join(dir, f))))); ok++; }
  catch (e) { console.log(f.padEnd(16), 'ERR', e.message); bad++; }
}
console.log('ok', ok, 'lỗi', bad);
