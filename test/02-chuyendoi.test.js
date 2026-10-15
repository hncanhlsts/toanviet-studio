// Chuyển đổi công thức: Equation (OMML) → LaTeX, LaTeX → MathType (MTEF) → LaTeX
nhom('Equation của Word → LaTeX (omml.js)');
const M = (inner) => '<m:oMath>' + inner + '</m:oMath>';
const R = (t) => '<m:r><m:t>' + t + '</m:t></m:r>';
const norm = (s) => String(s).replace(/\s+/g, '').replace(/\\left|\\right/g, '');
thu('phân số', () => bang(norm(OMML.toLatex(M('<m:f><m:num>' + R('1') + '</m:num><m:den>' + R('2') + '</m:den></m:f>'))), '\\frac{1}{2}'));
thu('căn và số mũ', () => {
  const t = norm(OMML.toLatex(M('<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>' + R('x') + '</m:e></m:rad>' + R('+') + '<m:sSup><m:e>' + R('y') + '</m:e><m:sup>' + R('2') + '</m:sup></m:sSup>')));
  bang(t, '\\sqrt{x}+y^{2}');
});
thu('bỏ qua thẻ định dạng của Word (w:, w14:) — lỗi đã gặp ở bản 2.0.0', () => {
  const xml = M('<m:r><w:rPr><w:rFonts w:ascii="Cambria Math"/><w14:ligatures w14:val="0"/></w:rPr><m:t>a</m:t></m:r>' + R('=') + R('b'));
  bang(norm(OMML.toLatex(xml)), 'a=b');
});

thu('chữ Hy Lạp không bị đọc thành chữ thường (lỗi \\text{Δ})', () => bang(norm(OMML.toLatex(M(R('Δ') + R('ABC')))), '\\DeltaABC'));
thu('tiếng Việt vẫn là chữ', () => dung(/\\text\{/.test(OMML.toLatex(M(R('và'))))));
thu('bỏ ký tự vô hình Word chèn giữa hai phân số (lỗi khi chuyển qua lại Equation)', () => {
  const t = OMML.toLatex(M('<m:f><m:num>' + R('a') + '</m:num><m:den>' + R('b') + '</m:den></m:f>' + R('.⁤') + '<m:f><m:num>' + R('c') + '</m:num><m:den>' + R('d') + '</m:den></m:f>'));
  dung(!/[⁡-⁤]/.test(t), JSON.stringify(t));
});

nhom('LaTeX → MathType → LaTeX (mtefw.js, mtef.js)');
const tron = (tex) => norm(MTEF.oleToLatex(MTEFW.buildOle(MTEFW.latexToMtef(tex))));
const CASES = ['x^2+1', '\\frac{a}{b}', '\\sqrt{x+1}', 'a_{n}', '\\alpha+\\beta', 'x\\le y'];
CASES.forEach((tex) => thu('khứ hồi ' + tex, () => {
  const back = tron(tex);
  dung(back.length > 0, 'rỗng');
  // so sánh bỏ ngoặc nhọn thừa
  const k = (s) => s.replace(/[{}]/g, '').replace(/\\leq?/g, '\\le');
  bang(k(back), k(norm(tex)));
}));

nhom('LaTeX → MathML cho Word (mmlfix.js)');
[['\\widehat{BAC}', '^', 'BAC'], ['\\overarc{AB}', '⏜', 'AB'], ['\\overrightarrow{AB}', '⃗', 'AB'], ['\\overline{AB}', '¯', 'AB'], ['\\widetilde{x}', '~', 'x'], ['\\overleftrightarrow{MN}', '⃡', 'MN'], ['\\vec{u}', '⃗', 'u']].forEach(([tex, ch, base]) => thu(tex + ' có dấu và có thân', () => {
  const m = MmlFix.convert(tex);
  dung(!/undefined/.test(m), 'còn "undefined": ' + m);
  dung(m.includes('<mo>' + ch + '</mo>'), 'thiếu dấu: ' + m);
  dung(m.replace(/<[^>]+>/g, '').replace(/&#\d+;/g, '').replace(ch, '').includes(base), 'mất phần thân: ' + m);
}));
thu('lồng nhau và lẫn công thức khác', () => {
  const m = MmlFix.convert('\\widehat{xOy}+\\frac{\\overline{AB}}{2}=\\overrightarrow{AB}\\cdot\\vec{u}');
  dung(!/undefined|QQ\d+QQ/.test(m), m);
  dung((m.match(/<mover/g) || []).length === 4, 'phải có 4 dấu: ' + m);
});