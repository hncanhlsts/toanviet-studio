// Căn công thức theo đường chân chữ của dòng trong Word (hạ ảnh xuống đúng phần nằm dưới chân chữ, như MathType)
const fs = require('fs');
const rep = (s, a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 60)); return s.replace(a, () => b); };

let a = fs.readFileSync('src/app.js', 'utf8').replace(/\r\n/g, '\n');
a = rep(a, `      const r = el.getBoundingClientRect(), pad = target === 'page' ? 0 : 8;
      res({ x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad), width: r.width + 2 * pad, height: r.height + 2 * pad });`,
`      const r = el.getBoundingClientRect(), pad = target === 'page' ? 0 : 8;
      let padB = pad, depthPt = 0;
      const o = get(target);
      if (o && o.type === 'formula' && el.firstElementChild) {
        // đo đường chân chữ của công thức, rồi chỉnh lề dưới để phần nằm dưới chân chữ là số nguyên point
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        el.firstElementChild.appendChild(probe);
        const descent = Math.max(0, r.bottom - probe.getBoundingClientRect().top);
        probe.remove();
        depthPt = Math.ceil((descent + 3) * 0.75);
        padB = depthPt / 0.75 - descent;
      }
      res({ x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad), width: r.width + 2 * pad, height: r.height + pad + padB, depthPt });`);
fs.writeFileSync('src/app.js', a);

let m = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
m = rep(m, "    if (!rect) throw new Error('Không có gì để xuất');", "    if (!rect) throw new Error('Không có gì để xuất');\n    capture.depthPt = rect.depthPt || 0;");
m = rep(m, "TVS_ALT: 'TVS1:' + opts.data,", "TVS_ALT: 'TVS1:' + opts.data, TVS_POS: String(capture.depthPt || 0),");
m = rep(m, "      $p.AlternativeText = $alt\n", "      $p.AlternativeText = $alt\n      # hạ công thức xuống để đường chân chữ của nó trùng với dòng văn bản; chữ gõ tiếp theo trở lại bình thường\n      try { $p.Range.Font.Position = -[int]$env:TVS_POS; $sel.Font.Position = 0 } catch {}\n");
fs.writeFileSync('main.js', m);
const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.4.1';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('baseline patched');
