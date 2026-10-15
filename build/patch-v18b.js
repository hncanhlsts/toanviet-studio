const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};
let f = mk('src/plane.js');
// tên đặt ở đầu tia / đường thẳng: nét còn kéo dài qua điểm đó nên chắn cả hai phía
f.rep("        segs.push([c.a, c.b]);", "        segs.push([c.a, c.b, c.k]);");
f.rep("        if (other) { angs.push(Math.atan2(S[other][1] - p[1], S[other][0] - p[0])); return; }",
  "        if (other) { const t0 = Math.atan2(S[other][1] - p[1], S[other][0] - p[0]); angs.push(t0); if (s[2] === 'line' || (s[2] === 'ray' && s[1] === k)) angs.push(t0 + Math.PI); return; }");
// nhãn ghi trên cạnh: lùi xa hơn khi chữ dài và cạnh gần thẳng đứng
f.rep("        labels.push({ x: m[0] + nrm[0] * 13, y: m[1] + nrm[1] * 13, tex: c.label, size: 13 });",
  "        const tl = c.label.replace(/\\\\[a-zA-Z]+/g, '').replace(/[{}\\\\,^_]/g, '').length, off = 13 + Math.abs(nrm[0]) * tl * 3.3;\n        labels.push({ x: m[0] + nrm[0] * off, y: m[1] + nrm[1] * off, tex: c.label, size: 13 });");
// hai tam giác đặt xa nhau hơn để tên điểm không chồng
f.rep("A' = (7.4, 3.4)\\nB' = (6, 0)\\nC' = (10.4, 0)", "A' = (8.6, 3.4)\\nB' = (7.2, 0)\\nC' = (11.6, 0)");
f.rep("A' = (8.1, 2.52)\\nB' = (7, 0)\\nC' = (10.36, 0)", "A' = (9.1, 2.52)\\nB' = (8, 0)\\nC' = (11.36, 0)");
f.save();

fs.appendFileSync('src/styles.css', `
/* danh sách hình phẳng trên thanh công cụ */
#planeKind { align-self: center; height: 28px; max-width: 230px; font: inherit; }
`);

// hướng dẫn sử dụng: bổ sung hình phẳng
f = mk('huong-dan/huong-dan.html');
f.rep('<h3>Hình vẽ cơ bản</h3>', `<h3>Hình phẳng</h3>
<ul>
  <li>Chọn hình mẫu trong danh sách <b>Hình phẳng</b> rồi bấm <b>Chèn hình</b>. Có 39 mẫu theo chương trình 2018: đoạn thẳng và trung điểm, góc, tia phân giác, góc kề bù, đối đỉnh, hai đường thẳng song song; các loại tam giác, trung tuyến, đường cao, phân giác, trung trực, tam giác bằng nhau và đồng dạng, Thalès, đường trung bình; các tứ giác, lục giác đều; đường tròn, tiếp tuyến, góc nội tiếp, tứ giác nội tiếp, hình quạt; vectơ, đường tròn lượng giác.</li>
  <li>Mỗi hình là một <b>kịch bản</b> ngắn ở khung Thuộc tính, sửa được: đổi toạ độ điểm, thêm điểm và nét vẽ. Ví dụ <code>M = trungdiem(B, C)</code>, <code>D = phangiac(A, B, C)</code>, <code>doan AM</code>, <code>goc BAC = 60^{\\circ}</code>, <code>vuong AHB</code>, <code>bang AB AC</code>. Danh sách đầy đủ các phép dựng và lệnh vẽ nằm ngay dưới ô kịch bản.</li>
</ul>
<h3>Hình vẽ cơ bản</h3>`);
f.rep('Phiên bản 1.7.0', 'Phiên bản 1.8.0');
f.rep('ToanVietStudio-Setup-1.7.0.exe', 'ToanVietStudio-Setup-1.8.0.exe');
f.rep('<li>Văn bản, đồ thị, bảng biến thiên, miền nghiệm, hình không gian</li>', '<li>Văn bản, đồ thị, bảng biến thiên, miền nghiệm, hình phẳng, hình không gian</li>');
f.save();
console.log('v1.8b patched');
