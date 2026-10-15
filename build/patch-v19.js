// v1.9: hình phẳng theo thông số (số đo luôn khớp với hình), công thức Lí – Hoá – Sinh theo lớp, ký hiệu SGK
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { get s() { return s; }, set s(v) { s = v; }, rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};

// ---------------- plane.js ----------------
let f = mk('src/plane.js');
f.rep("    tiepdiem: (p, o, a, k) =>", `    // đỉnh A của tam giác biết B, C và hai cạnh AB = c, AC = b (A nằm bên trái hướng B -> C)
    dinh: (b, c, lc, lb) => { const d = dist(b, c), x = (lc * lc - lb * lb + d * d) / (2 * d), y2 = lc * lc - x * x; if (y2 < -1e-9) throw new Error('không dựng được: ba cạnh không thoả bất đẳng thức tam giác'); const u = mul(sub(c, b), 1 / d), y = Math.sqrt(Math.max(0, y2)); return [b[0] + u[0] * x - u[1] * y, b[1] + u[1] * x + u[0] * y]; },
    tiepdiem: (p, o, a, k) =>`);
f.rep("    const P = {}, cmds = [], errors = [], hidden = new Set(), relabel = {}, dots = new Set();", `    const P = {}, V = {}, cmds = [], errors = [], hidden = new Set(), relabel = {}, dots = new Set();
    // thay tên thông số bằng giá trị rồi mới tính
    const num = (s) => numOf(String(s).replace(/[a-z_][a-z0-9_]*/gi, (m) => (Object.prototype.hasOwnProperty.call(V, m) ? '(' + V[m] + ')' : m)));
    const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', '{,}');`);
f.rep("        const def = line.match(new RegExp('^(' + NAME + ')\\\\s*=\\\\s*(.+)$'));", "        const vdef = line.match(/^([a-z][a-z0-9_]*)\\s*=\\s*(.+)$/);\n        if (vdef) { V[vdef[1]] = num(vdef[2]); return; }\n        const def = line.match(new RegExp('^(' + NAME + ')\\\\s*=\\\\s*(.+)$'));");
f.rep("P[def[1]] = [numOf(a[0]), numOf(a[1])]; }", "P[def[1]] = [num(a[0]), num(a[1])]; }");
f.rep("(NAME_FULL.test(a) ? pt(a) : numOf(a))", "(NAME_FULL.test(a) ? pt(a) : num(a))");
f.rep("NAME_FULL.test(m[2].trim()) ? dist(c, pt(m[2].trim())) : numOf(m[2]) }); break;", "NAME_FULL.test(m[2].trim()) ? dist(c, pt(m[2].trim())) : num(m[2]) }); break;");
// nhãn "?" = số đo thật
f.rep("            groups().forEach((g) => { if (g.length !== 3) throw new Error('góc cần ba điểm, đỉnh ở giữa'); cmds.push({ k: kw === 'goc' ? 'angle' : 'right', b: g[0], a: g[1], c: g[2], label, n: xm ? +xm[1] : 1 }); });",
  `            groups().forEach((g) => {
              if (g.length !== 3) throw new Error('góc cần ba điểm, đỉnh ở giữa');
              let lb = label;
              if (lb === '?') { const u = sub(pt(g[0]), pt(g[1])), v = sub(pt(g[2]), pt(g[1])); lb = fmt(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v))))) * 180 / Math.PI) + '^{\\\\circ}'; }
              cmds.push({ k: kw === 'goc' ? 'angle' : 'right', b: g[0], a: g[1], c: g[2], label: lb, n: xm ? +xm[1] : 1 });
            });`);
f.rep("cmds.push({ k: 'len', a: n[0], b: n[1], label }); break; }", "let lb = label; if (lb[0] === '?') { const unit = lb.slice(1).trim(); lb = fmt(dist(pt(n[0]), pt(n[1]))) + (unit ? '\\\\,\\\\text{' + unit + '}' : ''); } cmds.push({ k: 'len', a: n[0], b: n[1], label: lb }); break; }");
// thay toàn bộ khối hình mẫu
{
  let s = f.s;
  const a = s.indexOf('  // Hình mẫu theo chương trình GDPT 2018'), b = s.indexOf('  const scriptOf');
  if (a < 0 || b < 0) throw new Error('KINDS block not found');
  let kinds = fs.readFileSync('build/plane-kinds.txt', 'utf8').replace(/\r\n/g, '\n').replace("const S = (t) => String.raw(t).trim();", "const S = (t) => String.raw(t).replace(/^\\n/, '');");
  f.s = s.slice(0, a) + kinds + s.slice(b);
}
f.rep("  root.Plane = { render, KINDS, scriptOf };", `  // Thông số trong kịch bản: các dòng "ten = số  # chú thích"
  const PARAM = /^([a-z][a-z0-9_]*)\\s*=\\s*(-?\\d+(?:\\.\\d+)?)\\s*(?:#\\s*(.*))?$/;
  function params(script) {
    const out = [];
    String(script || '').split('\\n').forEach((line, i) => { const m = line.trim().match(PARAM); if (m) out.push({ name: m[1], value: parseFloat(m[2]), label: (m[3] || m[1]).trim(), line: i }); });
    return out;
  }
  function setParam(script, name, value) {
    return String(script || '').split('\\n').map((line) => { const m = line.trim().match(PARAM); return m && m[1] === name ? name + ' = ' + value + (m[3] ? '   # ' + m[3] : '') : line; }).join('\\n');
  }

  root.Plane = { render, KINDS, scriptOf, params, setParam };`);
f.save();

// ---------------- symbols.js: thêm Vật lí, Hoá học, Sinh học ----------------
{
  let s = fs.readFileSync('src/symbols.js', 'utf8').replace(/\r\n/g, '\n');
  s = s.replace("{ name: 'Theo lớp', grades: [", "{ name: 'Toán theo lớp', grades: [");
  const end = s.lastIndexOf('];');
  if (end < 0) throw new Error('symbols end not found');
  let block = fs.readFileSync('build/subjects.txt', 'utf8').replace(/\r\n/g, '\n').replace('m_{nước}', 'm_{\\text{nước}}');
  // chuỗi nháy đơn là LaTeX viết thẳng (\' là dấu phẩy trên) -> chuỗi JS hợp lệ
  block = block.replace(/'((?:[^'\\\n]|\\.)*)'/g, (m, sq) => JSON.stringify(sq.replace(/\\'/g, "'")));
  fs.writeFileSync('src/symbols.js', s.slice(0, end) + block + '];\n');
}

// ---------------- index.html ----------------
f = mk('src/index.html');
f.rep('<script src="plane.js"></script>', '<script src="plane.js"></script>\n<script src="sgk.js"></script>');
f.rep(`    </div><span>Hình phẳng</span>
  </div>`, `    </div><span>Hình phẳng</span>
  </div>
  <div class="grp">
    <div class="btns">
      <select id="symKind" title="Ký hiệu, hình vẽ thường gặp trong SGK Vật lí, Hoá học, Sinh học"></select>
      <button data-cmd="ins-sym" title="Chèn ký hiệu đã chọn"><i>⊗</i>Chèn</button>
    </div><span>Ký hiệu SGK (Lí, Hoá, Sinh)</span>
  </div>`);
f.save();

// ---------------- app.js ----------------
f = mk('src/app.js');
f.rep("      case 'plane': return {", "      case 'sym': return Object.assign({ kind, label: '', data: 'ud ud u u u', inner: true, stroke: 1.5, color: '#111111' }, SGK.sizeOf(kind));\n      case 'plane': return {");
f.rep("        else if (o.type === 'plane') res = Plane.render(o, o.w, o.h);", "        else if (o.type === 'plane') res = Plane.render(o, o.w, o.h);\n        else if (o.type === 'sym') res = SGK.render(o, o.w, o.h);");
f.rep("    'ins-plane': () => { insert('plane', $('#planeKind').value); commit(); },", "    'ins-plane': () => { insert('plane', $('#planeKind').value); commit(); },\n    'ins-sym': () => { insert('sym', $('#symKind').value); commit(); },");
f.rep("  const pk = $('#planeKind');", `  const yk = $('#symKind');
  SGK.GROUPS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } yk.appendChild(og); });
  const pk = $('#planeKind');`);
// thông số của hình phẳng thành ô nhập
f.rep("      add(field('script', 'Kịch bản dựng hình: điểm và lệnh vẽ, mỗi dòng một ý', 'area', { rows: 13 }));", `      const ps = Plane.params(o.script);
      if (ps.length) {
        h4('Thông số (đổi số thì hình và số đo đổi theo)');
        ps.forEach((p) => {
          const wdiv = mk('div'); wdiv.appendChild(mk('label', '', p.label));
          const inp = mk('input'); inp.type = 'number'; inp.step = 'any'; inp.value = p.value;
          inp.oninput = () => { if (inp.value === '' || isNaN(parseFloat(inp.value))) return; o.script = Plane.setParam(o.script, p.name, parseFloat(inp.value)); renderObj(o); const ta = props.querySelector('textarea'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wdiv.appendChild(inp); add(wdiv);
        });
        h4('Kịch bản');
      }
      const scr = add(field('script', 'Kịch bản dựng hình: điểm và lệnh vẽ, mỗi dòng một ý', 'area', { rows: 13 }));
      scr.querySelector('textarea').addEventListener('change', () => buildProps());`);
f.rep("      help('<b>Ký hiệu</b>: <code>goc BAC = 60^{\\\\circ}</code>", "      help('<b>Thông số và số đo</b>: dòng <code>so_do = 60  # chú thích</code> tạo một thông số; dùng tên đó trong toạ độ và phép dựng, ví dụ <code>B = quay(A, O, so_do)</code>. Viết <code>goc AOB = ?</code> hoặc <code>ghi AB = ? cm</code> để hình tự ghi số đo thật.');\n      help('<b>Ký hiệu</b>: <code>goc BAC = 60^{\\\\circ}</code>");
f.rep("    } else if (o.type === 'shape') {", `    } else if (o.type === 'sym') {
      const kinds = { __on: (k) => Object.assign(o, SGK.sizeOf(k)) };
      SGK.GROUPS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Ký hiệu', 'sel', kinds));
      if (o.kind === 'oluongtu') { add(field('data', 'Các ô (cách nhau bằng dấu cách)')); help('<code>ud</code>: hai electron ghép đôi · <code>u</code>: một electron · <code>d</code>: một electron quay xuống · <code>-</code>: ô trống. Ví dụ 2p⁴: <code>ud u u</code>'); }
      add(field('label', 'Nhãn phía trên (LaTeX, vd R_1)'));
      add(field('inner', 'Hiện chữ chú thích có sẵn trong hình', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      help('Kéo ô vuông ở góc để co giãn. Ghép các ký hiệu với nút <b>Đoạn</b> để vẽ sơ đồ mạch điện.');
    } else if (o.type === 'shape') {`);
// nhóm theo lớp: nhớ lớp riêng cho từng môn
f.rep("try { g = Math.min(tab.grades.length - 1, Math.max(0, +localStorage.getItem('tvs-grade') || 0)); }", "try { g = Math.min(tab.grades.length - 1, Math.max(0, +localStorage.getItem('tvs-grade-' + ti) || 0)); }");
f.rep("gb.onclick = () => { try { localStorage.setItem('tvs-grade', gi); }", "gb.onclick = () => { try { localStorage.setItem('tvs-grade-' + ti, gi); }");
f.save();

fs.appendFileSync('src/styles.css', `
/* danh sách ký hiệu SGK */
#symKind { align-self: center; height: 28px; max-width: 200px; font: inherit; }
`);
const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.9.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v1.9 patched');
