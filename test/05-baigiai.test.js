// Bài giải AI → Word: chuẩn hoá nội dung, tự nhận diện và dựng hình (src/baigiai-chuyen.js, src/dedehinh.js)
nhom('Bài giải AI: chuẩn hoá ký hiệu theo SGK');
thu('khoảng, toạ độ dùng dấu chấm phẩy; số thập phân dấu phẩy; ∅, ⇔, ⫽, góc', () => {
  const t = BaiGiai.fromText('Cho $A=[-4, 2)$, $x = 1.5$, $A \\cap B = \\emptyset \\iff m>1$, $AB \\parallel CD$, $\\angle ABC$.').markup;
  dung(t.includes('[-4;2)') && t.includes('1{,}5') && t.includes('\\varnothing') && t.includes('\\Leftrightarrow') && t.includes('⫽') && t.includes('\\widehat{ABC}'), t);
});
thu('bỏ câu chào của AI, dựng nhãn Câu, Lời giải', () => {
  const t = BaiGiai.fromText('Chắc chắn rồi! Dưới đây là lời giải.\n**Câu 1:** Tính $x$.\n**Lời giải:**\nTa có $x=2$.\nHy vọng giúp ích!').markup;
  bang(t, '#C Câu 1.\nTính $x$.\n#G\nTa có $x=2$.');
});

thu('câu nhỏ a), b), c) không có gạch đầu dòng (cả văn bản lẫn HTML từ trang AI); ý thường giữ gạch đầu dòng', () => {
  const t = BaiGiai.fromText('Cho tam giác $ABC$.\n- a) Chứng minh.\n- **b)** Tính.\n- Một ý thường').markup;
  dung(/^a\) Chứng minh\.$/m.test(t) && /^\*\*b\)\*\* Tính\.$/m.test(t) && /^- Một ý thường$/m.test(t), t);
  const h = BaiGiai.fromText(BaiGiai.fromHtml('<p>Cho tam giác ABC.</p><ul><li><strong>a)</strong> Chứng minh.</li><li><strong>c)</strong> Trên đoạn thẳng AB lấy điểm E.</li></ul>')).markup;
  dung(!/^- /m.test(h) && /^\*\*c\)\*\* Trên đoạn thẳng AB/m.test(h), h);
});

nhom('Bài giải AI: tự thêm hình ở chỗ SGK có hình');
const figOf = (md, type) => { const r = BaiGiai.figures(md); const l = r.markup.split('\n').find((x) => x.startsWith('#FIG ') && x.includes('"type":"' + type + '"')); return l ? JSON.parse(l.replace(/^#FIG \S+ /, '')) : null; };
thu('miền nghiệm: suy ra hệ từ đường biên và đỉnh, giữ tên đỉnh', () => {
  const md = '#C Câu 1.\nĐường thẳng $d_1: x + y = 3$. Đường thẳng $d_2: 2x - y = 6$. Đường thẳng $d_3: y = 4$. Đường thẳng $x = 0$ là trục tung.\nĐiểm $A(0; 3)$, $B(0; 4)$, $C(5; 4)$, $D(3; 0)$.\nMiền nghiệm của hệ là miền tứ giác $ABCD$ kể cả bờ.';
  const f = figOf(md, 'region');
  bang(f && f.ineqs, 'x + y >= 3\n2x - y <= 6\ny <= 4\nx >= 0');
  dung(f && /C\(5; 4\)/.test(f.vnames), f && f.vnames);
});
thu('miền nghiệm: hệ cho sẵn trong lời giải', () => { const f = figOf('#C Câu 1.\nBiểu diễn miền nghiệm của hệ $\\begin{cases} x\\ge 0 \\\\ y \\ge 0 \\\\ x+y\\le 150 \\end{cases}$.', 'region'); bang(f && f.ineqs, 'x >= 0\ny >= 0\nx + y <= 150'); });
thu('bảng biến thiên thay bảng AI tự kẻ', () => { const r = BaiGiai.figures('#C Câu 1.\nLập bảng biến thiên của hàm số $y=x^3-3x$.\n#TAB\n|x|-∞|1|+∞|\n|y\'||0||\n#ENDTAB'); dung(/"type":"bbt","expr":"x\^3-3x"/.test(r.markup) && !r.markup.includes('#TAB'), r.markup); });
thu('bảng xét dấu', () => { const f = figOf('#C Câu 1.\nXét dấu tam thức $f(x)=-x^2+2x+1$.', 'sign'); bang(f && f.expr, '-x^2+2x+1'); });
thu('tập hợp trên trục số: các phép ∪, ∩, \\, phần bù; bỏ qua tập có tham số', () => {
  const f = figOf('#C Câu 1.\nCho $A=[-3;4)$, $B=(1;+\\infty)$, $C=(m;m+1]$. Tìm $A\\cup B$, $A\\cap B$, $C_{\\mathbb{R}}A$.', 'numline');
  dung(f && /A=\[-3;4\)/.test(f.sets) && /A\\cup B/.test(f.sets) && /mathbb\{R\}\\setminus A/.test(f.sets) && !/C=/.test(f.sets), f && f.sets);
});
thu('đồ thị: hàm số, khung gọn, điểm có tên nằm trên đồ thị', () => {
  const f = figOf('#C Câu 1.\nVẽ đồ thị hàm số $y=x^2-4x+3$. Đỉnh $I(2; -1)$, cắt trục hoành tại $A(1; 0)$, điểm $K(5; 5)$.', 'graph');
  dung(f && f.funcs === 'x^2-4x+3' && /I\(2; -1\)/.test(f.points) && !/K\(/.test(f.points) && +f.ymin >= -3 && +f.ymax <= 6, f && JSON.stringify(f));
});

nhom('Đọc đề hình không gian (src/dedehinh.js)');
DE_KHONG_GIAN.forEach(([ten, de, exp]) => thu(ten, () => {
  const r = DeHinh.space(de);
  dung(!!r, 'không nhận ra khối');
  const L = r.script.split('\n');
  const miss = exp.has.filter((h) => !L.some((l) => l.trim() === h || l.includes(h)));
  dung(!miss.length, 'thiếu: ' + miss.join(' | ') + '\n' + r.script);
  const o = Object.assign({ id: 'dk' }, Space.viewOf(r.kind), { script: r.script });
  const res = Space.render(o, 360, 320);
  dung(!res.errors.length, 'vẽ lỗi: ' + res.errors.join('; '));
}));
thu('đề không có khối không gian: không vẽ', () => dung(DeHinh.space('Cho tam giác ABC vuông tại A.') === null));

nhom('Đọc đề hình phẳng (src/dedehinh.js)');
DE_HINH_PHANG.forEach(([ten, de, exp]) => thu(ten, () => {
  const r = DeHinh.plane(de);
  dung(!!r, 'không nhận ra hình');
  const L = r.script.split('\n');
  const miss = exp.has.filter((h) => !L.some((l) => l.trim() === h || l.includes(h)));
  dung(!miss.length, 'thiếu: ' + miss.join(' | ') + '\n' + r.script);
  const thua = (exp.not || []).filter((h) => L.some((l) => l.trim().startsWith(h)));
  dung(!thua.length, 'thừa: ' + thua.join(' | ') + '\n' + r.script);
  const res = Plane.render({ id: 'dp', script: r.script, labels: true }, 340, 300);
  dung(!res.errors.length, 'vẽ lỗi: ' + res.errors.join('; '));
}));
thu('đề không có hình phẳng: không vẽ', () => dung(DeHinh.plane('Giải phương trình $x^2 - 5x + 6 = 0$.') === null));
thu('tam giác chỉ được nhắc qua (không phải câu dựng đề): không vẽ', () => dung(DeHinh.plane('Ta có $\\Delta ABC \\backsim \\Delta MNP$ nên $\\widehat{ABC} = 60^\\circ$.') === null));
thu('chỉ ghi lên hình độ dài cho trong đề, không ghi kết quả của lời giải', () => {
  const s = DeHinh.plane('Cho tam giác $ABC$ vuông tại $A$ có $AB = 3$ cm, $AC = 4$ cm.\n#G\nTa có $BC = 5$ cm.').script;
  dung(/ghi AB = 3/.test(s) && !/ghi BC/.test(s) && /C = \(5, 0\)|B = \(0, 3\)/.test(s), s);
});
thu('Bài giải AI: hình phẳng đặt ngay đầu lời giải; câu đã có hình khác (miền nghiệm trong Oxy) thì không thêm', () => {
  const r = BaiGiai.figures('#C Câu 1.\nCho tam giác $ABC$ vuông tại $A$, đường cao $AH$. Chứng minh $AH^2 = HB \\cdot HC$.\n#G\nXét hai tam giác $HBA$ và $HAC$.');
  dung(/^#G\n\[FIG h1\|Hình 1\]/m.test(r.markup) && /"type":"plane"/.test(r.markup) && /H = chan\(A, B, C\)/.test(r.markup), r.markup);
  const r2 = BaiGiai.figures('#C Câu 1.\nTrong mặt phẳng Oxy, biểu diễn miền nghiệm của hệ $\\begin{cases} x\\ge 0 \\\\ y \\ge 0 \\\\ x+y\\le 4 \\end{cases}$. Các đỉnh $O(0; 0)$, $A(4; 0)$, $B(0; 4)$.');
  dung(!/"type":"plane"/.test(r2.markup), r2.markup);
});
