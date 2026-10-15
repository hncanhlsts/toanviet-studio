// Kiểm tra nhanh bộ đọc tập hợp của trục số:  node build/test-numline.js
require('../src/mathexpr.js');
require('../src/numfmt.js');
require('../src/numline.js');
const N = globalThis.NumLine;
const env = {};
const rows = ['x > 4', 'x >= 7', 'x <= 3/4', '-2 < x <= 3', 'x < -1 hoặc x >= 2', 'x ≠ 2', '[1; +oo)', '(-oo; 3]',
  'E = [1; +oo)', 'F = (-oo; 3]', 'E ∩ F', 'A = (-2; 1]', 'B = [0; 4)', 'A ∪ B', 'A \\ B', 'R ∖ A', '{1; 2; 5}', '[1; 2] ∩ [3; 4]', '(-oo; sqrt(2))'];
for (const r of rows) {
  try { const x = N.parseRow(r, env); console.log(r.padEnd(22), '|', x.label, '|', x.P.ps.map((p) => p.tex).join(' '), x.P.gaps.map(Number).join(''), x.P.pin.map(Number).join(''), x.parts ? 'parts=' + x.parts.length : ''); }
  catch (e) { console.log(r.padEnd(22), 'LỖI', e.message); }
}
for (const s of ['-2 1/3', '-sqrt(2)', '-3/5', '0,3', '4,1(6)', '2 1/3']) { const n = N.num(s); console.log(s, n.v.toFixed(4), n.tex); }
