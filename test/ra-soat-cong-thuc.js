// Rà soát ảnh công thức (đúng đường chèn vào Word): dựng mọi mẫu trong bảng ký hiệu và các công thức hay gặp,
// chụp như khi chèn, đo khoảng trắng trên / dưới / trái / phải. In "CT: ..." cho từng công thức bất thường.
// Chạy: node test/ra-soat-cong-thuc-chay.js
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  const list = [];
  const seen = new Set();
  const push = (tex, where) => { const t = String(tex).replace(/#@/g, '{a}').replace(/#\?/g, '{x}').trim(); if (!t || seen.has(t)) return; seen.add(t); list.push({ tex: t, where }); };
  const walk = (it, where) => {
    if (typeof it === 'string') push(it, where);
    else if (Array.isArray(it)) { if (it.length === 2 && typeof it[0] === 'string' && typeof it[1] === 'string') { push(it[0], where); push(it[1], where); } else it.forEach((x) => walk(x, where)); }
    else if (it && typeof it === 'object') { const nm = it.name || it.label || where; Object.keys(it).forEach((k) => { if (k !== 'name' && k !== 'label') walk(it[k], nm); }); }
  };
  walk(window.PALETTE, '');
  // công thức hay gặp trong SGK (đối chiếu cách trình bày)
  [
    'x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}', '\\overrightarrow{AB}+\\overrightarrow{BC}=\\overrightarrow{AC}', '\\widehat{ABC}=60^{\\circ}', '\\vec{u}=\\left(1;2\\right)',
    '\\int_{0}^{1}x^{2}\\mathrm{d}x=\\frac{1}{3}', '\\lim_{x\\to 0}\\frac{\\sin x}{x}=1', '\\sum_{k=1}^{n}k=\\frac{n\\left(n+1\\right)}{2}', 'y\'=3x^{2}-3',
    '\\begin{cases}x+y=3\\\\x-y=1\\end{cases}', '\\left[\\begin{array}{l}x=1\\\\x=2\\end{array}\\right.', '\\log_{2}8=3', 'e^{x}', 'a^{n}\\cdot a^{m}=a^{n+m}',
    '\\Delta ABC\\dongdang\\Delta MNP', 'AB⫽CD', '\\overline{abc}', '\\sqrt[3]{8}=2', '2\\frac{1}{3}', 'S=\\pi r^{2}', '\\left|x-1\\right|<2', '\\text{sđ}\\,\\overarc{AB}=80^{\\circ}',
    'x\\in\\left[1;2\\right)', 'C_{n}^{k}=\\frac{n!}{k!\\left(n-k\\right)!}', '\\displaylines{x+y=1\\\\x-y=2}', 'f\\left(x\\right)=x^{3}-3x', '\\mathbb{R}\\setminus\\left\\{1\\right\\}',
    'v=\\frac{s}{t}', 'F=ma', 'I=\\frac{U}{R}', '2H_{2}+O_{2}\\xrightarrow{t^{\\circ}}2H_{2}O', 'x', 'a+b', '1', 'A', 'y', 'g', '-', '=',
  ].forEach((t) => push(t, 'SGK'));
  const out = [];
  let k = 0;
  for (const it of list) {
    k++;
    __clear(); await w(5);
    let id;
    try { id = __add('formula', null, { latex: it.tex, x: 60, y: 60, size: 16 }); } catch (e) { out.push('CT: LỖI DỰNG | ' + it.where + ' | ' + it.tex + ' | ' + e.message); continue; }
    await w(15);
    const el = document.querySelector('[data-id="' + id + '"]');
    if (el && el.querySelector('.ML__error')) { out.push('CT: LỖI LATEX | ' + it.where + ' | ' + it.tex); continue; }
    let r;
    try { r = await window.api.renderPng(id, true, k === list.length); } catch (e) { out.push('CT: LỖI CHỤP | ' + it.where + ' | ' + it.tex + ' | ' + e.message); continue; }
    const img = new Image(); img.src = 'data:image/png;base64,' + r.b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    const ink = (x, y) => { const i = (y * W + x) * 4; return d[i + 3] > 40 && (d[i] + d[i + 1] + d[i + 2]) / 3 < 200; };
    let top = -1, bot = -1, left = W, right = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ink(x, y)) { if (top < 0) top = y; bot = y; if (x < left) left = x; if (x > right) right = x; }
    if (top < 0) { out.push('CT: ẢNH TRỐNG | ' + it.where + ' | ' + it.tex); continue; }
    const S = 4; // tỉ lệ chụp
    const tb = (top / S), bb = ((H - 1 - bot) / S), inkH = (bot - top + 1) / S;
    // ảnh phải cắt sát nét chữ (lề 1,5px): khoảng trắng trên hoặc dưới quá 2,9px là lỗi (làm giãn dòng trong Word).
    // Phía dưới được dư tới 1 point vì độ hạ dòng là số nguyên point; công thức nằm hẳn trên chân chữ (°, −) thì
    // phải chừa xuống tới chân chữ (độ hạ dòng 0) nên không tính.
    if (bb > 2.9 && r.depthPt > 0) out.push('CT: DƯỚI ' + bb.toFixed(1) + 'px / cao ' + (H / S).toFixed(1) + 'px | ' + it.where + ' | ' + it.tex);
    if (tb > 2.9) out.push('CT: TRÊN ' + tb.toFixed(1) + 'px / cao ' + (H / S).toFixed(1) + 'px (nét ' + inkH.toFixed(1) + ', dưới ' + bb.toFixed(1) + ') | ' + it.where + ' | ' + it.tex);
  }
  console.log('CT-TONG ' + list.length + ' công thức, ' + out.length + ' bất thường');
  out.forEach((s) => console.log(s));
  console.log('CT-XONG');
})();
