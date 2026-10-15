// Tách các khối lớn trong src/app.js thành mô-đun riêng (src/mod/*.js).
//   node build/tach-mo-dun.js         (chạy thử: chỉ in ra kế hoạch)
//   node build/tach-mo-dun.js --ghi   (ghi tệp)
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', 'src', 'app.js');
const write = process.argv.includes('--ghi');
let lines = fs.readFileSync(F, 'utf8').split('\n');

// các khối: [tên mô-đun, dòng tiêu đề bắt đầu, dòng tiêu đề / mốc kết thúc (không gồm), mô tả]
const MODS = [
  ['chonnhieu', '  // ---------- Chọn nhiều đối tượng, nhóm ----------', '  function renderAll() {', 'Chọn nhiều đối tượng, khung chọn, bắt dính, nhóm, căn thẳng hàng'],
  ['keodiem', '  // ---------- Kéo điểm và dựng nhanh (hình phẳng, hình không gian) ----------', '  function renderObj(o) {', 'Kéo điểm (toạ độ, thông số), chọn điểm / mặt phẳng, xoay hình không gian'],
  ['thuvien', '  // ---------- Thư viện của tôi ----------', '  // ---------- Soạn đề kiểm tra (cấu trúc 2025) và xuất sang Word ----------', 'Thư viện của tôi, báo lỗi / góp ý'],
  ['soande', '  // ---------- Soạn đề kiểm tra (cấu trúc 2025) và xuất sang Word ----------', '  function setFormulaFont(times) {', 'Soạn đề kiểm tra theo cấu trúc 2025, xuất sang Word'],
];
const CALL_AT = '  loadDoc([], null);';   // gọi các mô-đun ngay trước lần vẽ đầu tiên

const idx = (s) => { const i = lines.indexOf(s); if (i < 0) throw new Error('không thấy mốc: ' + s); return i; };
// tên khai báo ở cấp ngoài cùng của IIFE (thụt 2 dấu cách)
function declared(ls) {
  const out = new Map();
  ls.forEach((l, i) => {
    let m = l.match(/^  (?:async )?function\s+([A-Za-z_$][\w$]*)/); if (m) { out.set(m[1], { i, kind: 'function' }); return; }
    m = l.match(/^  (const|let|var)\s+\{([^}]*)\}\s*=/); if (m) { m[2].split(',').forEach((p) => { const n = p.split(':').pop().trim(); if (n) out.set(n, { i, kind: m[1] }); }); return; }
    m = l.match(/^  (const|let|var)\s+(.*)$/);
    if (m) {
      // nhiều tên trong một dòng: a = 1, b = 2  (chỉ lấy tên ở mức ngoặc 0)
      let d = 0, cur = '', parts = [];
      for (const ch of m[2]) { if ('([{'.includes(ch)) d++; if (')]}'.includes(ch)) d--; if (ch === ',' && d === 0) { parts.push(cur); cur = ''; } else cur += ch; }
      parts.push(cur);
      parts.forEach((p) => { const n = (p.match(/^\s*([A-Za-z_$][\w$]*)\s*=/) || [])[1]; if (n) out.set(n, { i, kind: m[1] }); });
    }
  });
  return out;
}
const uses = (text, name) => new RegExp('(^|[^\\w$.])' + name.replace(/\$/g, '\\$') + '(?![\\w$])', 'm').test(text);

// khoảng dòng của từng mô-đun
const ranges = MODS.map(([name, a, b, title]) => { const s = idx(a), e = idx(b); return { name, s, e, title }; }).sort((x, y) => x.s - y.s);
const all = declared(lines);
const plan = ranges.map((r) => {
  const body = lines.slice(r.s, r.e);
  const own = declared(body);
  const rest = lines.slice(0, r.s).concat(lines.slice(r.e)).join('\n');
  const bodyText = body.join('\n');
  const imports = [...all.keys()].filter((n) => !own.has(n) && uses(bodyText, n));
  const exports = [...own.keys()].filter((n) => uses(rest, n));
  return Object.assign(r, { body, own, imports, exports });
});
// các tên một mô-đun lấy từ mô-đun khác phải được tạo trước (thứ tự gọi theo thứ tự trong tệp)
const order = ['chonnhieu', 'keodiem', 'thuvien', 'soande'];
const callLine = idx(CALL_AT);
let problems = [];
plan.forEach((p) => {
  p.imports.forEach((n) => {
    const d = all.get(n);
    const fromMod = plan.find((q) => q !== p && q.own.has(n));
    if (fromMod) { if (order.indexOf(fromMod.name) > order.indexOf(p.name)) problems.push(p.name + ' dùng ' + n + ' của ' + fromMod.name + ' (gọi sau)'); return; }
    if (d.kind === 'let') problems.push(p.name + ' dùng biến let ' + n + ' (giá trị có thể đổi)');
    if (d.kind !== 'function' && d.i > callLine) problems.push(p.name + ' dùng ' + n + ' khai báo sau chỗ gọi');
  });
  console.log('== ' + p.name + ' (' + (p.e - p.s) + ' dòng)\n  nhập: ' + p.imports.join(', ') + '\n  xuất: ' + p.exports.join(', '));
});
if (problems.length) { console.log('VẤN ĐỀ:\n  ' + problems.join('\n  ')); process.exit(1); }
if (!write) { console.log('chạy thử xong (thêm --ghi để ghi tệp)'); process.exit(0); }

// ghi mô-đun
fs.mkdirSync(path.join(__dirname, '..', 'src', 'mod'), { recursive: true });
plan.forEach((p) => {
  const txt = `// ${p.title} — tách từ app.js; nhận các hàm, biến dùng chung qua đối số C.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.${p.name} = function (C) {
    const { ${p.imports.join(', ')} } = C;
${p.body.join('\n')}
    return { ${p.exports.join(', ')} };
  };
})(window);
`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'mod', p.name + '.js'), txt);
});
// bỏ các khối khỏi app.js (từ dưới lên), khai báo tên xuất bằng let, gán khi gọi mô-đun
[...plan].sort((x, y) => y.s - x.s).forEach((p) => {
  lines.splice(p.s, p.e - p.s, `  // ---------- ${p.title}: src/mod/${p.name}.js ----------`, `  let ${p.exports.join(', ')};`);
});
const call = order.map((n) => { const p = plan.find((q) => q.name === n); return `  ({ ${p.exports.join(', ')} } = TVM.${n}({ ${p.imports.join(', ')} }));`; });
const ci = lines.indexOf(CALL_AT);
lines.splice(ci, 0, '  // nạp các mô-đun (src/mod/*.js) trước lần vẽ đầu tiên', ...call, '');
fs.writeFileSync(F, lines.join('\n'));
// thêm thẻ script
const H = path.join(__dirname, '..', 'src', 'index.html');
let h = fs.readFileSync(H, 'utf8');
if (!h.includes('mod/chonnhieu.js')) h = h.replace('<script src="app.js"></script>', order.map((n) => `<script src="mod/${n}.js"></script>`).join('\n') + '\n<script src="app.js"></script>');
fs.writeFileSync(H, h);
console.log('đã ghi');
