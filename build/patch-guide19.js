const fs = require('fs');
let s = fs.readFileSync('huong-dan/huong-dan.html', 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 60)); s = s.replace(a, () => b); };
rep('Phiên bản 1.8.0', 'Phiên bản 1.9.0');
rep('ToanVietStudio-Setup-1.8.0.exe', 'ToanVietStudio-Setup-1.9.0.exe');
rep('<li>Ký hiệu và công thức theo lớp 6 – 12</li>', '<li>Ký hiệu và công thức theo lớp 6 – 12 (Toán, Vật lí, Hoá học, Sinh học)</li>');
rep('<h2>5. Ký hiệu và công thức theo lớp 6 – 12</h2>\n<p>Nhóm cuối cùng trong hộp soạn là <b>Theo lớp</b>.', '<h2>5. Ký hiệu và công thức theo lớp 6 – 12</h2>\n<p>Bốn nhóm cuối trong hộp soạn chia theo môn: <b>Toán theo lớp</b>, <b>Vật lí</b>, <b>Hoá học</b>, <b>Sinh học</b>. Ba môn sau có các mục KHTN 6 – 9, Lớp 10, Lớp 11, Lớp 12 với công thức, đơn vị, công thức hoá học, phương trình phản ứng, sơ đồ lai… của từng lớp. Với Toán:');
rep(`  <li>Mỗi hình là một <b>kịch bản</b> ngắn ở khung Thuộc tính, sửa được:`, `  <li><b>Thông số</b>: đầu khung Thuộc tính có các ô số của hình (số đo góc, độ dài cạnh, bán kính, tỉ số…). Đổi số thì hình vẽ lại đúng kích thước và các số đo ghi trên hình đổi theo, nên số đo luôn khớp với hình. Ví dụ góc xOy: nhập 60 thì góc mở đúng 60°.</li>
  <li>Mỗi hình là một <b>kịch bản</b> ngắn ở khung Thuộc tính, sửa được:`);
rep('<h3>Hình vẽ cơ bản</h3>', `<h3>Ký hiệu SGK (Vật lí, Hoá học, Sinh học)</h3>
<ul>
  <li>Chọn trong danh sách <b>Ký hiệu SGK</b> rồi bấm <b>Chèn</b>. Có 44 ký hiệu: mạch điện (điện trở, biến trở, nguồn, bóng đèn, công tắc, ampe kế, vôn kế, tụ điện, cuộn cảm, điốt…), quang học (thấu kính, gương, tia sáng, phản xạ, khúc xạ), cơ học (lò xo, con lắc, mặt phẳng nghiêng, các lực, ròng rọc), hoá học (vòng benzen, ống nghiệm, cốc, bình tam giác, bình cầu, phễu, đèn cồn, ô lượng tử), sinh học (♂, ♀, ký hiệu phả hệ, nhiễm sắc thể, ADN).</li>
  <li>Kéo góc để co giãn; thêm nhãn như <code>R_1</code> ở khung Thuộc tính. Ghép các ký hiệu với nút <b>Đoạn</b> để vẽ sơ đồ mạch điện.</li>
</ul>
<h3>Hình vẽ cơ bản</h3>`);
fs.writeFileSync('huong-dan/huong-dan.html', s);
console.log('guide patched');
