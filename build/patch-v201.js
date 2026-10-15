const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};
let f = mk('src/omml.js');
// Công thức thật trong Word còn chứa các thẻ định dạng của Word (w:rPr, w14:ligatures…); bỏ hết, chỉ giữ thẻ toán m:
f.rep("    const doc = new DOMParser().parseFromString('<root xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">' + xml.replace(/<\\?xml[^>]*\\?>/, '') + '</root>', 'application/xml');",
  `    const clean = String(xml).replace(/<\\?xml[^>]*\\?>/, '')
      .replace(/<w:rPr>[\\s\\S]*?<\\/w:rPr>/g, '')
      .replace(/<\\/?(?!m:)[A-Za-z0-9]+:[^>]*>/g, '')
      .replace(/\\s(?!m:)[A-Za-z0-9]+:[A-Za-z0-9]+="[^"]*"/g, '');
    const doc = new DOMParser().parseFromString('<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">' + clean + '</root>', 'application/xml');`);
f.save();

f = mk('src/app.js');
f.rep("    let failed = 0;\n    for (let k = 0; k < items.length; k++) {", "    let failed = 0, firstErr = '';\n    for (let k = 0; k < items.length; k++) {");
f.rep("      } catch (e) { failed++; }\n    }\n    if (!jobs.length) return finish('Không chuyển được công thức nào (' + failed + ' công thức có cấu trúc chưa hỗ trợ). Tài liệu không thay đổi.');",
  "      } catch (e) { failed++; if (!firstErr) firstErr = e.message; }\n    }\n    if (!jobs.length) return finish('Không chuyển được công thức nào (' + failed + ' công thức gặp lỗi: ' + firstErr + '). Tài liệu không thay đổi.');");
f.save();
const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '2.0.1';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v2.0.1 patched');
