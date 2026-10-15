// Chuyển công thức Equation của Word (OMML) sang LaTeX để mở trong ToanViet. Chỉ đọc, không sửa gì trong tài liệu.
(function (root) {
  'use strict';
  const SYM = {
    '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '±': '\\pm ', '∓': '\\mp ', '×': '\\times ', '÷': '\\div ', '⋅': '\\cdot ', '·': '\\cdot ', '∞': '\\infty ', '≈': '\\approx ', '≡': '\\equiv ', '∼': '\\sim ', '∽': '\\dongdang ', '≅': '\\cong ',
    '∈': '\\in ', '∉': '\\notin ', '⊂': '\\subset ', '⊃': '\\supset ', '⊆': '\\subseteq ', '∪': '\\cup ', '∩': '\\cap ', '∅': '\\varnothing ', '∖': '\\setminus ', '∀': '\\forall ', '∃': '\\exists ', '∄': '\\nexists ',
    '→': '\\to ', '←': '\\leftarrow ', '↔': '\\leftrightarrow ', '⇒': '\\Rightarrow ', '⇐': '\\Leftarrow ', '⇔': '\\Leftrightarrow ', '↦': '\\mapsto ', '⟹': '\\Rightarrow ', '⟺': '\\Leftrightarrow ',
    '⊥': '\\perp ', '∥': '\\parallel ', '∦': '\\nparallel ', '∠': '\\angle ', '△': '\\triangle ', '∆': '\\Delta ', '°': '^{\\circ}', '′': "'", '″': "''", '∂': '\\partial ', '∇': '\\nabla ', '…': '\\ldots ', '⋯': '\\cdots ', '⋮': '\\vdots ',
    'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}', 'ℚ': '\\mathbb{Q}', 'ℂ': '\\mathbb{C}', '−': '-', '∗': '*', '∣': '\\mid ', '%': '\\%', '&': '\\&', '#': '\\#', '{': '\\{', '}': '\\}',
    'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ε': '\\varepsilon ', 'ϵ': '\\epsilon ', 'ζ': '\\zeta ', 'η': '\\eta ', 'θ': '\\theta ', 'κ': '\\kappa ', 'λ': '\\lambda ', 'μ': '\\mu ', 'ν': '\\nu ', 'ξ': '\\xi ', 'π': '\\pi ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'τ': '\\tau ', 'φ': '\\varphi ', 'ϕ': '\\phi ', 'χ': '\\chi ', 'ψ': '\\psi ', 'ω': '\\omega ',
    'Γ': '\\Gamma ', 'Δ': '\\Delta ', 'Θ': '\\Theta ', 'Λ': '\\Lambda ', 'Ξ': '\\Xi ', 'Π': '\\Pi ', 'Σ': '\\Sigma ', 'Φ': '\\Phi ', 'Ψ': '\\Psi ', 'Ω': '\\Omega ',
  };
  const NARY = { '∑': '\\sum', '∏': '\\prod', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '⋃': '\\bigcup', '⋂': '\\bigcap' };
  const ACC = { '̂': '\\widehat', '̃': '\\widetilde', '̅': '\\overline', '̄': '\\overline', '⃗': '\\overrightarrow', '̇': '\\dot', '̈': '\\ddot', '̆': '\\breve', '̌': '\\check', '⏜': '\\overarc', '̑': '\\overarc' };
  const FUNCS = ['sin', 'cos', 'tan', 'cot', 'ln', 'log', 'lim', 'max', 'min', 'exp', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh'];
  const DELIM = { '(': '(', ')': ')', '[': '[', ']': ']', '{': '\\{', '}': '\\}', '|': '|', '‖': '\\|', '⟨': '\\langle ', '⟩': '\\rangle ', '⌊': '\\lfloor ', '⌋': '\\rfloor ', '⌈': '\\lceil ', '⌉': '\\rceil ' };

  const kids = (n, name) => [...n.children].filter((c) => !name || c.localName === name);
  const kid = (n, name) => kids(n, name)[0] || null;
  const val = (n, prName, attrEl) => { const pr = n && kid(n, prName); const el = pr && kid(pr, attrEl); return el ? (el.getAttribute('m:val') !== null ? el.getAttribute('m:val') : el.getAttribute('val')) : null; };
  const arg = (n, name) => { const c = kid(n, name); return c ? conv(c) : ''; };
  function text(s, normal) {
    // chữ cái Hy Lạp (Δ, α…) nằm trong khoảng À–ỹ nhưng không phải chữ tiếng Việt
    const vi = s.replace(/[Ͱ-Ͽ]/g, '');
    if (normal || /[À-ỹ]/.test(vi) || /[A-Za-zÀ-ỹ]{2,}\s+[A-Za-zÀ-ỹ]/.test(vi)) return '\\text{' + s.replace(/[\\{}#%&$^_~]/g, '') + '}';
    let out = '';
    for (const ch of s) out += SYM[ch] !== undefined ? SYM[ch] : ch;
    return out;
  }
  function conv(n) {
    let out = '';
    for (const c of n.children) out += one(c);
    return out;
  }
  function one(c) {
    switch (c.localName) {
      case 'r': {
        const t = kids(c, 't').map((x) => x.textContent).join('');
        const rPr = kid(c, 'rPr');
        return text(t, !!(rPr && kid(rPr, 'nor')));
      }
      case 'f': {
        const type = val(c, 'fPr', 'type');
        if (type === 'lin') return arg(c, 'num') + '/' + arg(c, 'den');
        if (type === 'noBar') return '\\binom{' + arg(c, 'num') + '}{' + arg(c, 'den') + '}';
        return '\\frac{' + arg(c, 'num') + '}{' + arg(c, 'den') + '}';
      }
      case 'rad': {
        const deg = arg(c, 'deg');
        return val(c, 'radPr', 'degHide') === '1' || val(c, 'radPr', 'degHide') === 'on' || !deg ? '\\sqrt{' + arg(c, 'e') + '}' : '\\sqrt[' + deg + ']{' + arg(c, 'e') + '}';
      }
      case 'sSup': return grp(arg(c, 'e')) + '^{' + arg(c, 'sup') + '}';
      case 'sSub': return grp(arg(c, 'e')) + '_{' + arg(c, 'sub') + '}';
      case 'sSubSup': return grp(arg(c, 'e')) + '_{' + arg(c, 'sub') + '}^{' + arg(c, 'sup') + '}';
      case 'sPre': return '{}_{' + arg(c, 'sub') + '}^{' + arg(c, 'sup') + '}' + arg(c, 'e');
      case 'd': {
        const b = val(c, 'dPr', 'begChr'), e = val(c, 'dPr', 'endChr'), sep = val(c, 'dPr', 'sepChr');
        const es = kids(c, 'e');
        // ngoặc nhọn một bên ôm nhiều dòng: hệ phương trình
        if (es.length === 1 && kid(es[0], 'eqArr') && es[0].children.length === 1 && (b === '{' || b === '[') && (e === '' || e === null && false)) {
          const rows = kids(kid(es[0], 'eqArr'), 'e').map(conv);
          return b === '{' ? '\\begin{cases}' + rows.join('\\\\') + '\\end{cases}' : '\\left[\\begin{array}{l}' + rows.join('\\\\') + '\\end{array}\\right.';
        }
        const L = b === null ? '(' : b === '' ? '.' : (DELIM[b] || b), R = e === null ? ')' : e === '' ? '.' : (DELIM[e] || e);
        return '\\left' + L + es.map(conv).join(sep === null ? '|' : text(sep)) + '\\right' + R;
      }
      case 'nary': {
        const chr = val(c, 'naryPr', 'chr');
        const op = chr === null ? '\\int' : (NARY[chr] || text(chr));
        const sub = arg(c, 'sub'), sup = arg(c, 'sup');
        return op + (sub ? '_{' + sub + '}' : '') + (sup ? '^{' + sup + '}' : '') + ' ' + arg(c, 'e');
      }
      case 'func': {
        const fn = kid(c, 'fName');
        return fname(fn) + ' ' + arg(c, 'e');
      }
      case 'acc': {
        const chr = val(c, 'accPr', 'chr');
        return (chr === null ? '\\widehat' : (ACC[chr] || '\\widehat')) + '{' + arg(c, 'e') + '}';
      }
      case 'bar': return (val(c, 'barPr', 'pos') === 'top' ? '\\overline' : '\\underline') + '{' + arg(c, 'e') + '}';
      case 'groupChr': {
        const chr = val(c, 'groupChrPr', 'chr'), pos = val(c, 'groupChrPr', 'pos');
        if (chr === '→' || chr === '⃗') return '\\overrightarrow{' + arg(c, 'e') + '}';
        return (pos === 'top' ? '\\overbrace' : '\\underbrace') + '{' + arg(c, 'e') + '}';
      }
      case 'limLow': return limBase(c) + '_{' + arg(c, 'lim') + '}';
      case 'limUpp': return limBase(c) + '^{' + arg(c, 'lim') + '}';
      case 'm': {
        const rows = kids(c, 'mr').map((r) => kids(r, 'e').map(conv).join('&'));
        return '\\begin{matrix}' + rows.join('\\\\') + '\\end{matrix}';
      }
      case 'eqArr': return '\\begin{array}{l}' + kids(c, 'e').map(conv).join('\\\\') + '\\end{array}';
      case 'box': case 'borderBox': case 'phant': return arg(c, 'e');
      case 'e': case 'num': case 'den': case 'sub': case 'sup': case 'deg': case 'lim': case 'fName': case 'oMath': case 'oMathPara': return conv(c);
      default: return ''; // các khối thuộc tính (…Pr), ctrlPr
    }
  }
  const grp = (s) => (s.length > 1 && !/^\\[a-zA-Z]+ ?$/.test(s) && !/^\\left/.test(s) ? '{' + s + '}' : s);
  function fname(fn) {
    if (!fn) return '';
    const plain = fn.textContent.trim();
    if (fn.children.length === 1 && fn.children[0].localName === 'r' && FUNCS.includes(plain)) return '\\' + plain;
    // hàm có chỉ số: log_a, lim_{x→0}, sin^2
    return conv(fn).replace(/^\{?(sin|cos|tan|cot|ln|log|lim|max|min)\}?/, '\\$1');
  }
  function limBase(c) {
    const e = kid(c, 'e'), plain = e ? e.textContent.trim() : '';
    return FUNCS.includes(plain) ? '\\' + plain : '{' + arg(c, 'e') + '}';
  }

  function ommlToLatex(xml) {
    const clean = String(xml).replace(/<\?xml[^>]*\?>/, '')
      .replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, '')
      .replace(/<\/?(?!m:)[A-Za-z0-9]+:[^>]*>/g, '')
      .replace(/\s(?!m:)[A-Za-z0-9]+:[A-Za-z0-9]+="[^"]*"/g, '');
    const doc = new DOMParser().parseFromString('<root xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">' + clean + '</root>', 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Không đọc được công thức Equation');
    return conv(doc.documentElement).replace(/ +/g, ' ').replace(/ (?=[}^_)\]])/g, '').trim();
  }
  root.OMML = { toLatex: ommlToLatex };
})(window);
