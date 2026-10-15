const fs = require('fs');
let s = fs.readFileSync('src/app.js', 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 70)); s = s.replace(a, () => b); };
// 1) thay cả khối hộp soạn công thức
const a = s.indexOf('  // ---------- Hộp soạn công thức ----------'), b = s.indexOf('  function editFormula(o, isNew) {');
if (a < 0 || b < 0) throw new Error('markers');
s = s.slice(0, a) + fs.readFileSync('build/fx-section.js', 'utf8').replace(/\r\n/g, '\n') + s.slice(b);
// 2) nhiều dòng + chữ đậm khi dựng
rep('  const mkCache = new Map();', String.raw`  // Công thức nhiều dòng (\displaylines{a \\ b}) dựng thành các dòng canh trái; chỉ tách ở dấu \\ ngoài cùng
  function multiline(latex) {
    const m = /^\s*\\displaylines\{([\s\S]*)\}\s*$/.exec(latex);
    if (!m) return latex;
    const rows = [], t = m[1];
    let d = 0, cur = '';
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === '\\') {
        if (t[i + 1] === '\\' && d === 0) { rows.push(cur); cur = ''; i++; continue; }
        if (t.startsWith('\\begin', i)) d++; else if (t.startsWith('\\end', i)) d--;
        cur += ch + (t[i + 1] || ''); i++; continue;
      }
      if (ch === '{') d++; else if (ch === '}') d--;
      cur += ch;
    }
    rows.push(cur);
    return '\\begin{aligned}' + rows.map((r) => '&' + r).join('\\\\') + '\\end{aligned}';
  }
  const texOf = (o) => { const t = multiline(o.latex); return o.bold ? '\\boldsymbol{' + t + '}' : t; };
  const mkCache = new Map();`);
rep('${tex(o.latex)}</span>', '${tex(texOf(o))}</span>');
rep(`    openFx(o.latex, (v) => {
      if (OFFICE && OFFICE.auto) return officeDone(o, v);`, `    openFx(o.latex, (v) => {
      if (v !== null) Object.assign(o, { size: fSt.size, color: fSt.color, bold: fSt.bold });
      if (OFFICE && OFFICE.auto) return officeDone(o, v);`);
rep('      o.latex = v; renderObj(o); buildProps(); commit();\n    });\n  }', "      o.latex = v; renderObj(o); buildProps(); commit();\n    }, o, OFFICE && OFFICE.auto ? 'Chèn vào ' + officeName() : null);\n  }");
rep("      row(field('size', 'Cỡ chữ', 'num'), field('color', 'Màu', 'color'));\n    } else if (o.type === 'text') {", "      row(field('size', 'Cỡ chữ', 'num'), field('color', 'Màu', 'color'));\n      add(field('bold', 'Chữ đậm', 'chk'));\n    } else if (o.type === 'text') {");
rep(String.raw`api.copyText(l.replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim'))`, String.raw`api.copyText(multiline(l).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim'))`);
rep('MathLive.convertLatexToMathMl(l.replace(', 'MathLive.convertLatexToMathMl(multiline(l).replace(');
fs.writeFileSync('src/app.js', s);
console.log('patched');
