// Bộ phân tích biểu thức, định dạng số, bảng biến thiên
nhom('Biểu thức (mathexpr.js)');
thu('tính giá trị', () => {
  const f = MathExpr.compile('x^3 - 3x + 1', ['x']);
  gan(f(2), 3); gan(f(-1), 3);
  gan(MathExpr.compile('sqrt(16) + |-2| + ln(e)', [])(), 7);
  gan(MathExpr.compile('2sin(pi/6)', [])(), 1);
  gan(MathExpr.compile('(2x+1)/(x-1)', ['x'])(3), 3.5);
});
thu('số thập phân dấu phẩy', () => gan(MathExpr.compile('2,5 * 2', [])(), 5));
thu('đạo hàm', () => {
  const d = MathExpr.diff(MathExpr.parse('x^3 - 3x'), 'x');
  gan(MathExpr.evalTree(d, { x: 2 }), 9);
});
thu('ra LaTeX', () => {
  const t = MathExpr.toTex(MathExpr.parse('3/4'));
  dung(/\\d?frac\{3\}\{4\}/.test(t), 'được ' + t);
});

nhom('Định dạng số (numfmt.js)');
thu('phân số, căn, π', () => {
  bang(NumFmt.toTex(0.5), '\\dfrac{1}{2}');
  bang(NumFmt.toTex(Math.sqrt(2)), '\\sqrt{2}');
  bang(NumFmt.toTex(Math.PI / 2), '\\dfrac{\\pi}{2}');
  bang(NumFmt.toTex(-Infinity), '-\\infty');
});
thu('số lẻ dùng dấu phẩy', () => bang(NumFmt.plain(1.25), '1,25'));

nhom('Bảng biến thiên (bbt.js)');
thu('y = x^3 - 3x có hai cực trị tại x = ±1', () => {
  const r = BBT.analyse('x^3 - 3x', '', '', false);
  dung(/-1/.test(r.xrow) && /\b1\b/.test(r.xrow), 'hàng x: ' + r.xrow);
  bang(r.drow.replace(/\s/g, '').split('|').filter((s) => s === '+' || s === '-'), ['+', '-', '+']);
});
thu('xét dấu (x-1)(x+2)/(x-3)', () => {
  const r = BBT.analyse('(x-1)(x+2)/(x-3)', '', '', true);
  dung(/\|\|/.test(r.drow), 'phải có || tại x = 3: ' + r.drow);
});
