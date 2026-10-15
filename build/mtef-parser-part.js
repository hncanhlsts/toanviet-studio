
  // ---------- MTEF (phiên bản 5) -> LaTeX ----------
  const SYM = {
    0x2264: '\\le ', 0x2265: '\\ge ', 0x2260: '\\ne ', 0x00B1: '\\pm ', 0x2213: '\\mp ', 0x00D7: '\\times ', 0x00F7: '\\div ', 0x22C5: '\\cdot ', 0x00B7: '\\cdot ', 0x221E: '\\infty ', 0x2248: '\\approx ', 0x2261: '\\equiv ', 0x223C: '\\sim ', 0x223D: '\\dongdang ', 0x2245: '\\cong ', 0x221D: '\\propto ',
    0x2208: '\\in ', 0x2209: '\\notin ', 0x2282: '\\subset ', 0x2283: '\\supset ', 0x2286: '\\subseteq ', 0x2287: '\\supseteq ', 0x222A: '\\cup ', 0x2229: '\\cap ', 0x2205: '\\varnothing ', 0x2216: '\\setminus ', 0x2200: '\\forall ', 0x2203: '\\exists ', 0x2204: '\\nexists ',
    0x2192: '\\to ', 0x2190: '\\leftarrow ', 0x2194: '\\leftrightarrow ', 0x21D2: '\\Rightarrow ', 0x21D0: '\\Leftarrow ', 0x21D4: '\\Leftrightarrow ', 0x21A6: '\\mapsto ', 0x2191: '\\uparrow ', 0x2193: '\\downarrow ', 0x2197: '\\nearrow ', 0x2198: '\\searrow ',
    0x22A5: '\\perp ', 0x2225: '\\parallel ', 0x2226: '\\nparallel ', 0x2220: '\\angle ', 0x25B3: '\\triangle ', 0x0394: '\\Delta ', 0x2206: '\\Delta ', 0x00B0: '^{\\circ}', 0x2218: '\\circ ', 0x2032: "'", 0x2033: "''", 0x2202: '\\partial ', 0x2207: '\\nabla ', 0x2026: '\\ldots ', 0x22EF: '\\cdots ', 0x22EE: '\\vdots ',
    0x211D: '\\mathbb{R}', 0x2115: '\\mathbb{N}', 0x2124: '\\mathbb{Z}', 0x211A: '\\mathbb{Q}', 0x2102: '\\mathbb{C}', 0x2212: '-', 0x2217: '*', 0x2223: '\\mid ', 0x0025: '\\%', 0x0026: '\\&', 0x0023: '\\#', 0x007B: '\\{', 0x007D: '\\}', 0x005C: '\\backslash ', 0x221A: '\\surd ', 0x2234: '\\therefore ', 0x2235: '\\because ', 0x00AC: '\\neg ', 0x2227: '\\wedge ', 0x2228: '\\vee ',
    0x03B1: '\\alpha ', 0x03B2: '\\beta ', 0x03B3: '\\gamma ', 0x03B4: '\\delta ', 0x03B5: '\\varepsilon ', 0x03F5: '\\epsilon ', 0x03B6: '\\zeta ', 0x03B7: '\\eta ', 0x03B8: '\\theta ', 0x03D1: '\\vartheta ', 0x03B9: '\\iota ', 0x03BA: '\\kappa ', 0x03BB: '\\lambda ', 0x03BC: '\\mu ', 0x03BD: '\\nu ', 0x03BE: '\\xi ', 0x03C0: '\\pi ', 0x03C1: '\\rho ', 0x03C3: '\\sigma ', 0x03C4: '\\tau ', 0x03C5: '\\upsilon ', 0x03C6: '\\varphi ', 0x03D5: '\\phi ', 0x03C7: '\\chi ', 0x03C8: '\\psi ', 0x03C9: '\\omega ',
    0x0393: '\\Gamma ', 0x0398: '\\Theta ', 0x039B: '\\Lambda ', 0x039E: '\\Xi ', 0x03A0: '\\Pi ', 0x03A3: '\\Sigma ', 0x03A6: '\\Phi ', 0x03A8: '\\Psi ', 0x03A9: '\\Omega ',
  };
  const BIGOP = { 0x222B: '\\int', 0x222C: '\\iint', 0x222D: '\\iiint', 0x222E: '\\oint', 0x2211: '\\sum', 0x220F: '\\prod', 0x2210: '\\coprod', 0x22C3: '\\bigcup', 0x22C2: '\\bigcap' };
  const OPBYSEL = { 15: '\\int', 16: '\\sum', 17: '\\prod', 18: '\\coprod', 19: '\\bigcup', 20: '\\bigcap', 21: '\\int', 22: '\\sum' };
  const FENCE = { 0x28: '(', 0x29: ')', 0x5B: '[', 0x5D: ']', 0x7B: '\\{', 0x7D: '\\}', 0x7C: '|', 0x2016: '\\|', 0x2225: '\\|', 0x2329: '\\langle ', 0x232A: '\\rangle ', 0x27E8: '\\langle ', 0x27E9: '\\rangle ', 0x3008: '\\langle ', 0x3009: '\\rangle ', 0x230A: '\\lfloor ', 0x230B: '\\rfloor ', 0x2308: '\\lceil ', 0x2309: '\\rceil ' };
  const FUNCS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'ln', 'log', 'lg', 'lim', 'max', 'min', 'exp', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'det', 'gcd', 'deg', 'dim', 'inf', 'sup', 'arg', 'mod'];

  function parseMtef(b) {
    let p = 0;
    const u8 = () => b[p++], u16 = () => { const v = b[p] | (b[p + 1] << 8); p += 2; return v; };
    const cstr = () => { while (p < b.length && b[p] !== 0) p++; p++; };
    const uint = () => { const v = u8(); return v === 255 ? u16() : v; };
    const nudge = () => { const dx = u8(), dy = u8(); if (dx === 128 && dy === 128) p += 4; };
    const ruler = () => { const n = u8(); p += n * 3; };
    function nibbles(count) {
      // mảng kích thước dạng nibble: mỗi phần tử kết thúc bằng nibble 0xF, cuối mảng căn về biên byte
      let half = 0, done = 0;
      while (done < count && p < b.length) {
        const nib = half === 0 ? b[p] >> 4 : b[p] & 15;
        if (half === 1) p++;
        half ^= 1;
        if (nib === 0xF) done++;
      }
      if (half === 1) p++;
    }
    if (u8() !== 5) throw new Error('Chỉ đọc được công thức MathType định dạng MTEF 5');
    p += 4; cstr(); p += 1;
    function list() {
      const out = [];
      while (p < b.length) {
        const tag = u8();
        if (tag === 0) break;
        const node = record(tag);
        if (node) out.push(node);
      }
      return out;
    }
    function record(tag) {
      switch (tag) {
        case 1: { const o = u8(); if (o & 8) nudge(); if (o & 4) p += 2; if (o & 2) { p++; ruler(); } return { t: 'line', items: (o & 1) ? [] : list(), nul: !!(o & 1) }; }
        case 2: {
          const o = u8(); if (o & 8) nudge();
          const tf = u8() - 128; let code = 0;
          if (!(o & 0x20)) code = u16();
          if (o & 0x04) { const fp = u8(); if (o & 0x20) code = fp; }
          if (o & 0x10) { const fp = u16(); if (o & 0x20) code = fp; }
          return { t: 'char', code, tf, emb: (o & 1) ? list().filter((x) => x.t === 'emb').map((x) => x.type) : [] };
        }
        case 3: { const o = u8(); if (o & 8) nudge(); const sel = u8(); let v = u8(); if (v & 0x80) v = (v & 0x7F) | (u8() << 8); const topt = u8(); return { t: 'tmpl', sel, v, topt, items: list() }; }
        case 4: { const o = u8(); if (o & 8) nudge(); p += 2; if (o & 2) { p++; ruler(); } return { t: 'pile', items: list() }; }
        case 5: { const o = u8(); if (o & 8) nudge(); p += 3; const rows = u8(), cols = u8(); p += Math.ceil((rows + 1) / 4) + Math.ceil((cols + 1) / 4); return { t: 'matrix', rows, cols, items: list() }; }
        case 6: { const o = u8(); if (o & 8) nudge(); return { t: 'emb', type: u8() }; }
        case 7: ruler(); return null;
        case 8: uint(); p++; return null;
        case 9: { const s = u8(); if (s === 101) p += 2; else if (s === 100) p += 3; else p += 1; return null; }
        case 10: case 11: case 12: case 13: case 14: return null;
        case 15: uint(); return null;
        case 16: { const o = u8(); p += ((o & 1) ? 4 : 3) * 2; if (o & 4) cstr(); return null; }
        case 17: uint(); cstr(); return null;
        case 18: { p++; nibbles(u8()); nibbles(u8()); const n = u8(); for (let i = 0; i < n; i++) { if (u8() !== 0) p++; } return null; }
        case 19: cstr(); return null;
        default: if (tag >= 100) { const len = uint(); p += len; return null; } throw new Error('Dữ liệu MathType không đọc được (thẻ ' + tag + ' tại ' + (p - 1) + ')');
      }
    }
    return list();
  }

  const lines = (n) => n.items.filter((x) => x.t === 'line' || x.t === 'pile' || x.t === 'matrix');
  function charTex(c) {
    const code = c.code;
    if (c.tf === 24 || (code >= 0xEB00 && code <= 0xEB0F)) return code === 0xEB02 ? '\\,' : code === 0xEB04 ? '\\;' : code === 0xEB05 ? '\\quad ' : '';
    if (code >= 0xE000 && code <= 0xF8FF) return '';
    let s = SYM[code] !== undefined ? SYM[code] : String.fromCharCode(code);
    for (const e of c.emb) {
      if (e === 5) s += "'"; else if (e === 6) s += "''"; else if (e === 18) s += "'''";
      else if (e === 9) s = '\\hat{' + s + '}'; else if (e === 8) s = '\\tilde{' + s + '}'; else if (e === 2) s = '\\dot{' + s + '}'; else if (e === 3) s = '\\ddot{' + s + '}';
      else if (e === 11 || e === 14) s = '\\vec{' + s + '}'; else if (e === 17 || e === 16) s = '\\overline{' + s + '}'; else if (e === 10) s = '\\not ' + s; else if (e === 19) s = '\\overarc{' + s + '}';
    }
    return s;
  }
  function seq(items) {
    let out = '', i = 0;
    while (i < items.length) {
      const n = items[i];
      if (n.t === 'char' && n.tf === 1 && !(n.code >= 0xE000 && n.code <= 0xF8FF)) {
        // cụm chữ thường (kiểu Text): gom lại thành \text{...}
        let s = '';
        while (i < items.length && items[i].t === 'char' && (items[i].tf === 1 || items[i].tf === 24 || (items[i].code >= 0xEB00 && items[i].code <= 0xEB0F)) && !items[i].emb.length) { s += (items[i].tf === 1 ? String.fromCharCode(items[i].code) : ' '); i++; }
        if (!s) { out += charTex(n); i++; continue; }
        out += '\\text{' + s.replace(/[\\{}#%&$^_~]/g, '') + '}';
        continue;
      }
      if (n.t === 'char' && n.tf === 2 && /[A-Za-z]/.test(String.fromCharCode(n.code))) {
        let s = '';
        while (i < items.length && items[i].t === 'char' && items[i].tf === 2 && /[A-Za-z]/.test(String.fromCharCode(items[i].code)) && !items[i].emb.length) { s += String.fromCharCode(items[i].code); i++; }
        if (!s) { out += charTex(n); i++; continue; }
        out += FUNCS.includes(s) ? '\\' + s + ' ' : '\\mathrm{' + s + '}';
        continue;
      }
      out += node(n); i++;
    }
    return out;
  }
  function node(n) {
    if (n.t === 'char') return charTex(n);
    if (n.t === 'line') return seq(n.items);
    if (n.t === 'pile') return '\\begin{array}{l}' + lines(n).map(node).join('\\\\') + '\\end{array}';
    if (n.t === 'matrix') {
      const cells = lines(n).map(node), rows = [];
      for (let r = 0; r < n.rows; r++) rows.push(cells.slice(r * n.cols, (r + 1) * n.cols).join('&'));
      return '\\begin{matrix}' + rows.join('\\\\') + '\\end{matrix}';
    }
    if (n.t === 'tmpl') return tmpl(n);
    return '';
  }
  function tmpl(n) {
    const sl = lines(n), L = (i) => (sl[i] ? node(sl[i]) : ''), chars = n.items.filter((x) => x.t === 'char');
    const s = n.sel, v = n.v;
    if (s <= 9) {
      let l = '.', r = '.';
      const fc = (c) => (c ? (FENCE[c.code] || String.fromCharCode(c.code)) : '.');
      if (s <= 7) {
        const hasL = !!(v & 1), hasR = !!(v & 2);
        if (hasL && hasR) { l = fc(chars[0]); r = fc(chars[1]); } else if (hasL) l = fc(chars[0]); else if (hasR) r = fc(chars[0]);
        else { l = fc(chars[0]); r = fc(chars[1]); }
      } else { l = fc(chars[0]); r = fc(chars[1]); }
      const inner = sl[0];
      const onlyPile = inner && inner.t === 'line' && inner.items.filter((x) => x.t !== 'char' || x.code > 0x20).length === 1 && inner.items.find((x) => x.t === 'pile');
      if (onlyPile && r === '.' && (l === '\\{' || l === '[')) {
        const rows = lines(onlyPile).map(node).join('\\\\');
        return l === '\\{' ? '\\begin{cases}' + rows + '\\end{cases}' : '\\left[\\begin{array}{l}' + rows + '\\end{array}\\right.';
      }
      return '\\left' + l + L(0) + '\\right' + r;
    }
    switch (s) {
      case 10: return v & 1 ? '\\sqrt[' + L(1) + ']{' + L(0) + '}' : '\\sqrt{' + L(0) + '}';
      case 11: return v & 2 ? L(0) + '/' + L(1) : '\\frac{' + L(0) + '}{' + L(1) + '}';
      case 12: return '\\underline{' + L(0) + '}';
      case 13: return '\\overline{' + L(0) + '}';
      case 14: return '\\xrightarrow' + (L(1) ? '[' + L(1) + ']' : '') + '{' + L(0) + '}';
      case 15: case 16: case 17: case 18: case 19: case 20: case 21: case 22: {
        const op = (chars[0] && BIGOP[chars[0].code]) || OPBYSEL[s];
        return op + (L(1) ? '_{' + L(1) + '}' : '') + (L(2) ? '^{' + L(2) + '}' : '') + ' ' + L(0);
      }
      case 23: return L(0).trim() + (L(1) ? '_{' + L(1) + '}' : '') + (L(2) ? '^{' + L(2) + '}' : '') + ' ';
      case 24: case 25: return v & 1 ? '\\overbrace{' + L(0) + '}^{' + L(1) + '}' : '\\underbrace{' + L(0) + '}_{' + L(1) + '}';
      case 26: return L(0);
      case 27: return '_{' + L(0) + '}';
      case 28: return '^{' + (L(1) || L(0)) + '}';
      case 29: return '_{' + L(0) + '}^{' + L(1) + '}';
      case 30: return '\\left\\langle ' + L(0) + '\\middle|' + L(1) + '\\right\\rangle ';
      case 31: return ((v & 1) && (v & 2) ? '\\overleftrightarrow' : (v & 1) ? '\\overleftarrow' : '\\overrightarrow') + '{' + L(0) + '}';
      case 32: return '\\widetilde{' + L(0) + '}';
      case 33: return '\\widehat{' + L(0) + '}';
      case 34: return '\\overarc{' + L(0) + '}';
      case 37: return '\\boxed{' + L(0) + '}';
      default: return L(0);
    }
  }
  function mtefToLatex(bytes) {
    const top = parseMtef(bytes).filter((x) => x.t === 'line' || x.t === 'pile');
    let out;
    if (top.length === 1 && top[0].t === 'pile') out = '\\displaylines{' + lines(top[0]).map(node).join('\\\\ ') + '}';
    else out = top.map(node).join('');
    return out.replace(/ +/g, ' ').replace(/ (?=[}^_)\]'])/g, '').trim();
  }
  const oleToLatex = (bytes) => mtefToLatex(mtefFromOle(bytes));

  root.MTEF = { readOleStream, mtefFromOle, mtefToLatex, oleToLatex, parseMtef };
})(typeof window !== 'undefined' ? window : globalThis);
