// Kiểm tra các hình mẫu không gian dựng không lỗi:  node build/test-space.js
require('../src/mathexpr.js');
require('../src/space.js');
const Sp = globalThis.Space;
let bad = 0;
Sp.KINDS.forEach((g) => { for (const k in g[1]) {
  const r = Sp.render({ id: 't', script: g[1][k][1] }, 360, 300);
  const dashed = (r.svg.match(/stroke-dasharray/g) || []).length;
  console.log(k.padEnd(12), r.errors.length ? 'LỖI ' + r.errors.join(' | ') : 'ok', 'nét đứt:', dashed, 'nhãn:', r.labels.map((l) => l.tex).join(' '));
  if (r.errors.length) bad++;
} });
process.exit(bad ? 1 : 0);
