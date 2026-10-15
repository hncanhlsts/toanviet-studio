// Thử nghiệm: lấy MTEF từ các đối tượng OLE trong một tệp .docx đã giải nén sẵn
// Dùng: node build/mt-extract.js <thư mục chứa oleObject*.bin> <thư mục xuất>
const fs = require('fs'), path = require('path');
require('../src/mtef.js');
const [dir, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(dir).filter((n) => /\.bin$/i.test(n)).sort()) {
  try {
    const mtef = globalThis.MTEF.mtefFromOle(new Uint8Array(fs.readFileSync(path.join(dir, f))));
    fs.writeFileSync(path.join(out, f.replace(/\.bin$/i, '.mtef')), Buffer.from(mtef));
    console.log(f, mtef.length, 'bytes; header', [...mtef.subarray(0, 12)].map((b) => b.toString(16).padStart(2, '0')).join(' '));
  } catch (e) { console.log(f, 'ERR', e.message); }
}
