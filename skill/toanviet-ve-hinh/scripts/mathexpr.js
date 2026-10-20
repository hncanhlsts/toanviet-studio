// Bộ phân tích biểu thức: chuỗi -> cây cú pháp -> hàm số, đạo hàm, LaTeX
(function (root) {
  'use strict';

  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, cot: (t) => 1 / Math.tan(t),
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sqrt: (t) => (t < 0 ? NaN : Math.sqrt(t)), cbrt: Math.cbrt, abs: Math.abs,
    ln: (t) => (t <= 0 ? NaN : Math.log(t)), log: (t) => (t <= 0 ? NaN : Math.log10(t)),
    log2: (t) => (t <= 0 ? NaN : Math.log2(t)), exp: Math.exp,
  };
  const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };

  function tokenize(s) {
    s = s.replace(/−/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt').replace(/,/g, '.');
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        out.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
        i = j; continue;
      }
      if (/[a-zA-Zπ]/.test(c)) {
        let j = i;
        while (j < s.length && /[a-zA-Z0-9π]/.test(s[j])) j++;
        let word = s.slice(i, j);
        // tách chuỗi chữ thành tên hàm / hằng / biến: "xsinx" -> x, sin, x
        while (word.length) {
          let hit = null;
          for (const name of Object.keys(FUNCS).concat(['pi']).sort((a, b) => b.length - a.length)) {
            if (word.toLowerCase().startsWith(name)) { hit = name; break; }
          }
          if (hit) { out.push({ t: hit === 'pi' ? 'id' : 'fn', v: hit }); word = word.slice(hit.length); }
          else if (/[0-9]/.test(word[0])) {
            const m = word.match(/^[0-9]+/)[0];
            out.push({ t: 'num', v: parseFloat(m) }); word = word.slice(m.length);
          } else { out.push({ t: 'id', v: word[0] }); word = word.slice(1); }
        }
        i = j; continue;
      }
      if ('+-*/^()|'.includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error('Ký tự không hợp lệ: ' + c);
    }
    return out;
  }

  function parse(src) {
    const tk = tokenize(String(src));
    let p = 0;
    const peek = () => tk[p];
    const eat = (t) => { if (tk[p] && tk[p].t === t) { p++; return true; } return false; };
    let absDepth = 0;

    function expr() {
      let a = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = tk[p++].t;
        a = { k: op === '+' ? 'add' : 'sub', a, b: term() };
      }
      return a;
    }
    function startsFactor() {
      const t = peek();
      if (!t) return false;
      if (t.t === '|') return absDepth === 0;
      return t.t === 'num' || t.t === 'id' || t.t === 'fn' || t.t === '(';
    }
    function term() {
      let a = unary();
      for (;;) {
        if (eat('*')) a = { k: 'mul', a, b: unary() };
        else if (eat('/')) a = { k: 'div', a, b: unary() };
        else if (startsFactor()) a = { k: 'mul', a, b: power() }; // nhân ngầm: 2x, x(x+1)
        else return a;
      }
    }
    function unary() {
      if (eat('-')) return { k: 'neg', a: unary() };
      if (eat('+')) return unary();
      return power();
    }
    function power() {
      const base = atom();
      if (eat('^')) return { k: 'pow', a: base, b: unary() };
      return base;
    }
    function atom() {
      const t = tk[p++];
      if (!t) throw new Error('Biểu thức chưa hoàn chỉnh');
      if (t.t === 'num') return { k: 'num', v: t.v };
      if (t.t === 'id') {
        if (t.v in CONSTS) return { k: 'const', name: t.v };
        return { k: 'var', name: t.v };
      }
      if (t.t === 'fn') {
        let pw = null;
        if (eat('^')) pw = atom(); // sin^2 x
        let arg;
        if (eat('(')) { arg = expr(); if (!eat(')')) throw new Error('Thiếu dấu )'); }
        else arg = unaryTight();
        const f = { k: 'fn', name: t.v, a: arg };
        return pw ? { k: 'pow', a: f, b: pw } : f;
      }
      if (t.t === '(') { const e = expr(); if (!eat(')')) throw new Error('Thiếu dấu )'); return e; }
      if (t.t === '|') {
        absDepth++; const e = expr(); absDepth--;
        if (!eat('|')) throw new Error('Thiếu dấu |');
        return { k: 'fn', name: 'abs', a: e };
      }
      throw new Error('Cú pháp sai gần "' + t.t + '"');
    }
    // đối số hàm không có ngoặc: sin 2x, ln x
    function unaryTight() {
      if (eat('-')) return { k: 'neg', a: unaryTight() };
      let a = power();
      while (peek() && (peek().t === 'num' || peek().t === 'id')) a = { k: 'mul', a, b: power() };
      return a;
    }
    const tree = expr();
    if (p < tk.length) throw new Error('Thừa ký tự ở cuối biểu thức');
    return tree;
  }

  function ev(n, env) {
    switch (n.k) {
      case 'num': return n.v;
      case 'const': return CONSTS[n.name];
      case 'var': return n.name in env ? env[n.name] : NaN;
      case 'add': return ev(n.a, env) + ev(n.b, env);
      case 'sub': return ev(n.a, env) - ev(n.b, env);
      case 'mul': return ev(n.a, env) * ev(n.b, env);
      case 'div': return ev(n.a, env) / ev(n.b, env);
      case 'neg': return -ev(n.a, env);
      case 'pow': {
        const a = ev(n.a, env), b = ev(n.b, env);
        if (a < 0 && !Number.isInteger(b)) {
          // căn bậc lẻ của số âm: x^(1/3)
          const q = Math.round(1 / b);
          if (Math.abs(1 / b - q) < 1e-12 && q % 2 !== 0) return -Math.pow(-a, b);
          return NaN;
        }
        return Math.pow(a, b);
      }
      case 'fn': return FUNCS[n.name](ev(n.a, env));
    }
    return NaN;
  }

  const num = (v) => ({ k: 'num', v });
  const isNum = (n, v) => n.k === 'num' && (v === undefined || n.v === v);
  const add = (a, b) => (isNum(a, 0) ? b : isNum(b, 0) ? a : { k: 'add', a, b });
  const sub = (a, b) => (isNum(b, 0) ? a : isNum(a, 0) ? { k: 'neg', a: b } : { k: 'sub', a, b });
  const mul = (a, b) => (isNum(a, 0) || isNum(b, 0) ? num(0) : isNum(a, 1) ? b : isNum(b, 1) ? a : { k: 'mul', a, b });
  const div = (a, b) => (isNum(a, 0) ? num(0) : { k: 'div', a, b });
  const pow = (a, b) => (isNum(b, 1) ? a : { k: 'pow', a, b });
  const fn = (name, a) => ({ k: 'fn', name, a });

  function hasVar(n, v) {
    if (n.k === 'var') return n.name === v;
    return (n.a && hasVar(n.a, v)) || (n.b && hasVar(n.b, v)) || false;
  }

  // Đạo hàm tượng trưng theo biến v
  function diff(n, v) {
    switch (n.k) {
      case 'num': case 'const': return num(0);
      case 'var': return num(n.name === v ? 1 : 0);
      case 'add': return add(diff(n.a, v), diff(n.b, v));
      case 'sub': return sub(diff(n.a, v), diff(n.b, v));
      case 'neg': return { k: 'neg', a: diff(n.a, v) };
      case 'mul': return add(mul(diff(n.a, v), n.b), mul(n.a, diff(n.b, v)));
      case 'div': return div(sub(mul(diff(n.a, v), n.b), mul(n.a, diff(n.b, v))), pow(n.b, num(2)));
      case 'pow':
        if (!hasVar(n.b, v)) return mul(mul(n.b, pow(n.a, sub(n.b, num(1)))), diff(n.a, v));
        return mul(n, add(mul(diff(n.b, v), fn('ln', n.a)), div(mul(n.b, diff(n.a, v)), n.a)));
      case 'fn': {
        const u = n.a, du = diff(u, v);
        const d = {
          sin: () => fn('cos', u),
          cos: () => ({ k: 'neg', a: fn('sin', u) }),
          tan: () => div(num(1), pow(fn('cos', u), num(2))),
          cot: () => ({ k: 'neg', a: div(num(1), pow(fn('sin', u), num(2))) }),
          sqrt: () => div(num(1), mul(num(2), fn('sqrt', u))),
          cbrt: () => div(num(1), mul(num(3), pow(fn('cbrt', u), num(2)))),
          abs: () => div(u, fn('abs', u)),
          ln: () => div(num(1), u),
          log: () => div(num(1), mul(u, num(Math.LN10))),
          log2: () => div(num(1), mul(u, num(Math.LN2))),
          exp: () => fn('exp', u),
          asin: () => div(num(1), fn('sqrt', sub(num(1), pow(u, num(2))))),
          acos: () => ({ k: 'neg', a: div(num(1), fn('sqrt', sub(num(1), pow(u, num(2))))) }),
          atan: () => div(num(1), add(num(1), pow(u, num(2)))),
        };
        d.arcsin = d.asin; d.arccos = d.acos; d.arctan = d.atan;
        return mul(d[n.name](), du);
      }
    }
    return num(0);
  }

  // Các biểu thức con quyết định tập xác định: mẫu số (≠0), trong căn (≥0), trong logarit (>0)
  function domainParts(n, out) {
    out = out || { zero: [], nonneg: [], pos: [] };
    if (n.k === 'div') out.zero.push(n.b);
    if (n.k === 'pow' && n.b.k === 'neg') out.zero.push(n.a);
    if (n.k === 'pow' && n.b.k === 'num' && n.b.v < 0) out.zero.push(n.a);
    if (n.k === 'pow' && n.b.k !== 'num' && !hasVar(n.b, 'x') && !Number.isInteger(ev(n.b, {}))) out.nonneg.push(n.a);
    if (n.k === 'pow' && n.b.k === 'num' && !Number.isInteger(n.b.v)) out.nonneg.push(n.a);
    if (n.k === 'fn') {
      if (n.name === 'sqrt') out.nonneg.push(n.a);
      if (n.name === 'ln' || n.name === 'log' || n.name === 'log2') out.pos.push(n.a);
      if (n.name === 'tan') out.zero.push(fn('cos', n.a));
      if (n.name === 'cot') out.zero.push(fn('sin', n.a));
    }
    if (n.a) domainParts(n.a, out);
    if (n.b) domainParts(n.b, out);
    return out;
  }

  const PREC = { add: 1, sub: 1, neg: 2, mul: 3, div: 3, pow: 4 };
  function fmtNum(v) {
    return String(Math.round(v * 1e6) / 1e6).replace('.', '{,}');
  }
  function tex(n, parentPrec) {
    const wrap = (s, pr) => (pr < (parentPrec || 0) ? '\\left(' + s + '\\right)' : s);
    switch (n.k) {
      case 'num': return n.v < 0 ? wrap(fmtNum(n.v), 2) : fmtNum(n.v);
      case 'const': return n.name === 'e' ? 'e' : '\\pi';
      case 'var': return n.name;
      case 'add': return wrap(tex(n.a, 1) + '+' + tex(n.b, 1), 1);
      case 'sub': return wrap(tex(n.a, 1) + '-' + tex(n.b, 2), 1);
      case 'neg': return wrap('-' + tex(n.a, 3), 2);
      case 'mul': {
        const l = tex(n.a, 3), r = tex(n.b, 3);
        const needDot = /^[0-9]/.test(r) || (n.b.k === 'num');
        return wrap(l + (needDot ? '\\cdot ' : ' ') + r, 3);
      }
      case 'div': return '\\dfrac{' + tex(n.a, 0) + '}{' + tex(n.b, 0) + '}';
      case 'pow':
        if (n.a.k === 'fn' && n.a.name !== 'sqrt' && n.a.name !== 'abs' && n.a.name !== 'cbrt') {
          return '\\' + texFn(n.a.name) + '^{' + tex(n.b, 0) + '}' + texArg(n.a.a);
        }
        return tex(n.a, 5) + '^{' + tex(n.b, 0) + '}';
      case 'fn':
        if (n.name === 'sqrt') return '\\sqrt{' + tex(n.a, 0) + '}';
        if (n.name === 'cbrt') return '\\sqrt[3]{' + tex(n.a, 0) + '}';
        if (n.name === 'abs') return '\\left|' + tex(n.a, 0) + '\\right|';
        if (n.name === 'exp') return 'e^{' + tex(n.a, 0) + '}';
        if (n.name === 'log2') return '\\log_{2}' + texArg(n.a);
        return wrap('\\' + texFn(n.name) + texArg(n.a), 3);
    }
    return '';
  }
  function texFn(name) {
    return ({ asin: 'arcsin', acos: 'arccos', atan: 'arctan' })[name] || name;
  }
  function texArg(a) {
    if (a.k === 'var' || a.k === 'num' || a.k === 'const') return ' ' + tex(a, 0);
    return '\\left(' + tex(a, 0) + '\\right)';
  }

  function compile(src, vars) {
    const tree = typeof src === 'string' ? parse(src) : src;
    vars = vars || ['x'];
    const env = {};
    const f = function () {
      for (let i = 0; i < vars.length; i++) env[vars[i]] = arguments[i];
      return ev(tree, env);
    };
    f.tree = tree;
    return f;
  }

  root.MathExpr = { parse, compile, diff, toTex: (n) => tex(n, 0), domainParts, evalTree: ev };
})(typeof window !== 'undefined' ? window : globalThis);
