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

thu('câu nhỏ a), b), c) và ý liệt kê của AI không có dấu đầu dòng (cả văn bản lẫn HTML từ trang AI)', () => {
  const t = BaiGiai.fromText('Cho tam giác $ABC$.\n- a) Chứng minh.\n- **b)** Tính.\n- Một ý thường\n• Ý có chấm tròn\n    * Ý con').markup;
  dung(/^a\) Chứng minh\.$/m.test(t) && /^\*\*b\)\*\* Tính\.$/m.test(t) && /^Một ý thường$/m.test(t) && /^Ý có chấm tròn$/m.test(t) && /^Ý con$/m.test(t) && !/^- /m.test(t), t);
  // danh sách lồng nhau như Gemini: "Xét … có:" rồi các ý con — mỗi ý một dòng, không dồn thành "có: - … - …"
  const g = BaiGiai.fromText(BaiGiai.fromHtml('<ul><li><p>Vì $AH \\perp BE$ nên $AM \\parallel IN$.</p></li><li><p>Xét $\\Delta ABE$ và $\\Delta AID$ có:</p><ul><li><p>$\\widehat{BAE} = \\widehat{IAD} = 90^\\circ$ (hai góc đối đỉnh)</p></li><li><p>$AB = AC$</p></li></ul></li></ul>')).markup;
  dung(/^Vì \$AH/m.test(g) && /^Xét \$\\Delta ABE\$ và \$\\Delta AID\$ có:$/m.test(g) && /^\$\\widehat\{BAE\}/m.test(g) && /^\$AB = AC\$$/m.test(g) && !/ - /.test(g) && !/^- /m.test(g), g);
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

thu('đề cương: hệ hai ẩn hỏi GTLN (không có chữ "miền nghiệm") vẫn vẽ miền nghiệm; "x, y ≥ 0" tách hai bất phương trình', () => {
  const f = figOf('#C Câu 2.\nTìm GTLN của $F = 4x + 3y$ biết $(x;y)$ thỏa mãn $\\begin{cases} x + 2y \\le 6 \\\\ 2x + y \\le 6 \\\\ x, y \\ge 0 \\end{cases}$.', 'region');
  bang(f && f.ineqs, 'x + 2y <= 6\n2x + y <= 6\nx >= 0\ny >= 0');
  dung(f && +f.xmax <= 5 && +f.ymax <= 5, f && JSON.stringify(f));
});
thu('đề cương: tập viết bằng điều kiện thành khoảng; biểu thức có ngoặc và phần bù trong ℝ', () => {
  const a = figOf('#C Câu 1.\nCho $A = \\{x \\in \\mathbb{R} \\mid x < 2\\}$ và $B = [-1; 5]$. Tìm $A \\cap B$ và $B \\setminus A$.', 'numline');
  dung(a && /A=\(-\\infty;2\)/.test(a.sets) && /B \\setminus A/.test(a.sets), a && a.sets);
  const b = figOf('#C Câu 1.\nCho $A = (1; 4), B = [2; 6], C = (3; 8]$. Xác định tập hợp $(A \\cup B) \\cap C$.', 'numline');
  dung(b && /\(A \\cup B\) \\cap C/.test(b.sets), b && b.sets);
  const c = figOf('#C Câu 1.\nCho $A = (-\\infty; 1]$ và $B = (-2; +\\infty)$. Tìm phần bù của tập $(A \\cap B)$ trong $\\mathbb{R}$.', 'numline');
  dung(c && /\\mathbb\{R\}\\setminus \(A \\cap B\)/.test(c.sets), c && c.sets);
});
thu('đề cương: tập hữu hạn → biểu đồ Ven có phần tử, tô phần bù trong E', () => {
  const v = figOf('#C Câu 1.\nCho $E = \\{1; 2; 3; 4; 5; 6\\}$, $A = \\{1; 3; 5\\}$, $B = \\{2; 3; 4\\}$. Tìm phần bù của tập hợp $A \\cup B$ trong $E$.', 'venn');
  dung(v && v.unv && v.uname === 'E' && /AB: 3/.test(v.elements) && /ngoài: 6/.test(v.elements) && v.shade === 'E ∖ (A ∪ B)', v && JSON.stringify(v));
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
thu('từ khoá hình không gian: khối chóp, chóp S.ABCD, khối lập phương, hình nón, mặt cầu', () => {
  const kindOf = (s) => { const r = BaiGiai.figures(s); const m = /"type":"space","kind":"(\w+)"/.exec(r.markup); return m ? m[1] : ''; };
  const got = [kindOf('#C Câu 1.\nCho khối chóp $S.ABC$ có $SA\\perp (ABC)$.'), kindOf('#C Câu 2.\nCho chóp $S.ABCD$ có đáy là hình vuông.'), kindOf("#C Câu 3.\nCho khối lập phương $ABCD.A'B'C'D'$ cạnh $a$."), kindOf('#C Câu 4.\nCho hình nón có bán kính đáy $r=3$.'), kindOf('#C Câu 5.\nMột mặt cầu có bán kính 5 cm.'), kindOf('#C Câu 6.\nTính đạo hàm của hàm số $y=x^2$.')];
  bang(got.join(','), 'k_chop3sa,k_chop4sa,k_lapphuong,k_non,k_cau,');
});

nhom('Đọc đề hình phẳng (src/dedehinh.js)');
DE_HINH_PHANG.forEach(([ten, de, exp]) => thu(ten, () => {
  const r = DeHinh.plane(de);
  dung(!!r, 'không nhận ra hình');
  const L = r.script.split('\n');
  const miss = exp.has.filter((h) => !L.some((l) => l.trim() === h || l.includes(h)));
  dung(!miss.length, 'thiếu: ' + miss.join(' | ') + '\n' + r.script);
  const thua = (exp.not || []).filter((h) => L.some((l) => l.trim().startsWith(h)));
  dung(!thua.length, 'thừa: ' + thua.join(' | ') + '\n' + r.script);
  // điểm phải được chấm / không được chấm trên hình vẽ thật (bộ vẽ tự chấm điểm nằm một mình, không chấm giao điểm)
  if (exp.cham || exp.khongcham) {
    const svg = Plane.render({ script: r.script, labels: true }, 340, 300), S = svg.pts;
    const dotted = (n) => S[n] && new RegExp('<circle cx="' + (Math.round(S[n][0] * 10) / 10) + '" cy="' + (Math.round(S[n][1] * 10) / 10) + '" r="2.4"').test(svg.svg);
    (exp.cham || []).forEach((n) => dung(dotted(n), 'điểm ' + n + ' phải được chấm'));
    (exp.khongcham || []).forEach((n) => dung(!dotted(n), 'điểm ' + n + ' là giao điểm, không chấm'));
  }
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
