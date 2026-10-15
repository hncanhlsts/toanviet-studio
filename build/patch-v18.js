// v1.8: hình học phẳng, tách hai nhóm Hình không gian / Hình phẳng
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};
let f = mk('src/index.html');
f.rep('<script src="solid.js"></script>', '<script src="solid.js"></script>\n<script src="plane.js"></script>');
f.rep(`    </div><span>Hình học không gian</span>
  </div>`, `    </div><span>Hình không gian</span>
  </div>
  <div class="grp">
    <div class="btns">
      <select id="planeKind" title="Chọn hình phẳng mẫu"></select>
      <button data-cmd="ins-plane" title="Chèn hình phẳng đã chọn (sửa được điểm và nét vẽ ở khung Thuộc tính)"><i>△</i>Chèn hình</button>
    </div><span>Hình phẳng</span>
  </div>`);
f.save();

f = mk('src/app.js');
f.rep("      case 'shape': return {", "      case 'plane': return { kind, w: 340, h: 280, script: Plane.scriptOf(kind), labels: true, dots: false, stroke: 1.5, color: '#111111' };\n      case 'shape': return {");
f.rep("        else if (o.type === 'solid') res = Solid.render(o, o.w, o.h);", "        else if (o.type === 'solid') res = Solid.render(o, o.w, o.h);\n        else if (o.type === 'plane') res = Plane.render(o, o.w, o.h);");
f.rep("    'ins-solid': () => { insert('solid', $('#solidKind').value); commit(); },", "    'ins-solid': () => { insert('solid', $('#solidKind').value); commit(); },\n    'ins-plane': () => { insert('plane', $('#planeKind').value); commit(); },");
f.rep("  const sk = $('#solidKind');", `  const pk = $('#planeKind');
  Plane.KINDS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } pk.appendChild(og); });
  const sk = $('#solidKind');`);
f.rep("    } else if (o.type === 'shape') {", `    } else if (o.type === 'plane') {
      const kinds = { __on: (k) => { o.script = Plane.scriptOf(k); } };
      Plane.KINDS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Hình mẫu (chọn lại sẽ thay kịch bản bên dưới)', 'sel', kinds));
      add(field('script', 'Kịch bản dựng hình: điểm và lệnh vẽ, mỗi dòng một ý', 'area', { rows: 13 }));
      add(field('labels', 'Hiện tên điểm', 'chk'));
      add(field('dots', 'Chấm tròn tại mọi điểm', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      h4('Cách viết');
      help('<b>Điểm</b>: <code>A = (1, 2)</code> · <code>M = trungdiem(A, B)</code> · <code>H = chan(A, B, C)</code> (chân đường vuông góc từ A xuống BC) · <code>D = phangiac(A, B, C)</code> (chân phân giác góc A trên BC) · <code>G = trongtam(A, B, C)</code> · <code>tructam</code> · <code>tamnoi</code> · <code>tamngoai</code> · <code>I = giao(A, B, C, D)</code> · <code>N = chia(A, B, 1/3)</code> · <code>doixung(A, O)</code> · <code>doixungtruc(A, B, C)</code> · <code>quay(A, O, 60)</code> · <code>tinhtien(A, B, C)</code> · <code>D = hbh(A, B, C)</code> · <code>tron(O, 3, 45)</code> · <code>tiepdiem(M, O, A, 1)</code>');
      help('<b>Nét vẽ</b>: <code>doan AB CD</code> · <code>netdut AH</code> · <code>dagiac ABCD</code> · <code>duongthang AB</code> · <code>tia OA</code> · <code>vecto AB</code> · <code>duongtron O A</code> hoặc <code>duongtron O 2.5</code> · <code>ngoaitiep ABC</code> · <code>noitiep ABC</code> · <code>cung O A B</code> · <code>quat O A B</code> · <code>to ABC</code> (tô nền)');
      help('<b>Ký hiệu</b>: <code>goc BAC = 60^{\\\\circ}</code> (đỉnh ở giữa; thêm <code>x2</code> để vẽ hai cung) · <code>vuong BAC</code> · <code>bang AB AC = 1</code> (số gạch) · <code>ssong AB CD</code> · <code>ghi AB = 5\\\\,cm</code> · <code>diem M N</code> (chấm điểm) · <code>an P Q</code> (ẩn tên) · <code>nhan A = x</code> (đổi tên hiển thị)');
    } else if (o.type === 'shape') {`);
f.save();

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.8.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v1.8 patched');
