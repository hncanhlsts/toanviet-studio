// LaTeX -> MathML cho Word (Equation). MathLive chuyển sai một số lệnh hay dùng trong Toán Việt Nam:
// \widehat, \overarc, \widetilde ra "undefined"; \overrightarrow, \overleftrightarrow, \underbrace mất phần thân;
// \overline ra rỗng. Các lệnh này được tự dựng MathML rồi ghép vào kết quả của MathLive.
(function (root) {
  'use strict';
  // lệnh -> [thẻ MathML, kí tự dấu]
  const ACC = {
    widehat: ['mover', '^'], hat: ['mover', '^'], overarc: ['mover', '⏜'], wideparen: ['mover', '⏜'], widetilde: ['mover', '~'],
    overrightarrow: ['mover', '⃗'], vec: ['mover', '⃗'], overleftrightarrow: ['mover', '⃡'], overleftarrow: ['mover', '⃖'],
    overline: ['mover', '¯'], bar: ['mover', '¯'], underline: ['munder', '_'], underbrace: ['munder', '⏟'], overbrace: ['mover', '⏞'],
  };
  const NAMES = Object.keys(ACC).sort((a, b) => b.length - a.length);
  // đối số trong ngoặc nhọn bắt đầu tại s[i] === '{'
  function group(s, i) {
    let d = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === '\\') { j++; continue; }
      if (s[j] === '{') d++;
      else if (s[j] === '}') { d--; if (d === 0) return [s.slice(i + 1, j), j + 1]; }
    }
    return null;
  }
  function inner(latex) {
    const parts = [];
    let out = '', i = 0;
    while (i < latex.length) {
      if (latex[i] === '\\') {
        const name = NAMES.find((n) => latex.startsWith(n, i + 1) && !/[a-zA-Z]/.test(latex[i + 1 + n.length] || ''));
        if (name) {
          let k = i + 1 + name.length;
          while (latex[k] === ' ') k++;
          let arg, next;
          if (latex[k] === '{') { const g = group(latex, k); if (g) { arg = g[0]; next = g[1]; } }
          else if (latex[k]) { arg = latex[k] === '\\' ? (latex.slice(k).match(/^\\[a-zA-Z]+/) || [latex[k]])[0] : latex[k]; next = k + arg.length; }
          if (arg !== undefined) {
            const [tag, ch] = ACC[name];
            const body = inner(arg);
            parts.push('<' + tag + ' accent' + (tag === 'munder' ? 'under' : '') + '="true"><mrow>' + body + '</mrow><mo>' + ch + '</mo></' + tag + '>');
            out += '\\text{QQ' + (parts.length - 1) + 'QQ}';
            i = next;
            continue;
          }
        }
        // giữ nguyên các lệnh khác (kể cả \\, \{ …)
        const m = latex.slice(i).match(/^\\([a-zA-Z]+|.)/);
        out += m[0]; i += m[0].length;
        continue;
      }
      out += latex[i++];
    }
    let mml = root.MathLive.convertLatexToMathMl(out);
    mml = mml.replace(/<mtext[^>]*>QQ(\d+)QQ<\/mtext>/g, (m, n) => parts[+n]);
    return mml.replace(/<mo>undefined<\/mo>/g, '<mo>^</mo>');
  }
  // LaTeX (đã đổi \dongdang thành \backsim) -> phần tử <math>
  const convert = (latex) => '<math xmlns="http://www.w3.org/1998/Math/MathML">' + inner(String(latex || '')) + '</math>';
  root.MmlFix = { convert, inner };
})(typeof window !== 'undefined' ? window : globalThis);
