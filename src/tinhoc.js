// Môn Tin học: mã nguồn tô màu cú pháp, sơ đồ khối thuật toán (SGK), khối lệnh Scratch
// Vẽ bằng SVG vector chuẩn, phóng to thu nhỏ sắc nét, chèn/dán vào Word và PowerPoint không vỡ hình.
(function (root) {
  'use strict';

  const r1 = (v) => Math.round(v * 10) / 10;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FONT = "'Times New Roman', Times, serif";
  const MONO = "Consolas, 'Cascadia Mono', 'Courier New', monospace";
  const FONT_SCRATCH = "Helvetica, Arial, 'DejaVu Sans', sans-serif";

  // ---------------- MÃ NGUỒN (CODE BLOCK) ----------------
  const CODE_LANGS = {
    python: 'Python',
    cpp: 'C++',
    pascal: 'Pascal',
    sql: 'SQL',
    js: 'JavaScript',
    pseudo: 'Mã giả (tiếng Việt)',
    html: 'HTML',
    css: 'CSS',
    text: 'Văn bản thường'
  };

  const W_ = (s) => new Set(s.split(' '));
  const CODE_KW = {
    python: W_('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'),
    cpp: W_('if else for while do return break continue switch case default struct class public private protected const using namespace new delete typedef sizeof static true false nullptr template typename auto operator this include'),
    pascal: W_('program var begin end if then else for to downto do while repeat until function procedure const array of and or not div mod true false uses type record case with in nil'),
    js: W_('var let const function return if else for while do break continue switch case default new delete typeof instanceof in of class extends this true false null undefined try catch finally throw async await import export from'),
    sql: W_('SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER ADD PRIMARY KEY FOREIGN REFERENCES NOT NULL AND OR ORDER BY GROUP HAVING JOIN INNER LEFT RIGHT ON AS DISTINCT LIMIT LIKE IN BETWEEN ASC DESC UNIQUE DEFAULT IS'),
    pseudo: W_('Nhập Xuất In Nếu nếu thì Ngược ngược lại Trong trong khi Khi khi làm Lặp lặp Cho cho từ đến Kết kết thúc Bắt bắt đầu Trả trả về Hàm hàm Thuật toán Đầu vào Đầu ra Bước và hoặc không Gán gán'),
    html: new Set(),
    css: new Set(),
    text: new Set()
  };

  const CODE_TYPES = {
    python: W_('print input int float str len range list dict set tuple abs max min sum sorted round open map filter enumerate zip type bool reversed append'),
    cpp: W_('int long double float char bool void string vector map set pair unsigned signed short cout cin endl std main printf scanf size push_back'),
    pascal: W_('integer real boolean char string longint byte word writeln readln write read length'),
    js: W_('console log Math Number String Array Object parseInt parseFloat document alert window'),
    sql: W_('INT INTEGER TEXT VARCHAR CHAR REAL FLOAT DATE COUNT SUM AVG MIN MAX'),
    pseudo: new Set(),
    html: new Set(),
    css: new Set(),
    text: new Set()
  };

  const CODE_PAL = {
    sang: {
      bg: '#f8f9fa',
      bar: '#edf2f7',
      fg: '#1f2328',
      num: '#8c959f',
      kw: '#cf222e',
      ty: '#8250df',
      fn: '#6639ba',
      str: '#0a3069',
      com: '#57606a',
      pre: '#953800',
      op: '#24292f',
      hl: '#fff3b0',
      border: '#d0d7de'
    },
    toi: {
      bg: '#1e1e1e',
      bar: '#2d2d30',
      fg: '#d4d4d4',
      num: '#858585',
      kw: '#569cd6',
      ty: '#4ec9b0',
      fn: '#dcdcaa',
      str: '#ce9178',
      com: '#6a9955',
      pre: '#c586c0',
      op: '#d4d4d4',
      hl: '#373e2a',
      border: '#3c3c3c'
    }
  };

  function hlSet(s) {
    const r = new Set();
    for (const p of String(s || '').split(/[,;\s]+/)) {
      const m = p.match(/^(\d+)(?:-(\d+))?$/);
      if (m) {
        for (let a = +m[1], b = +(m[2] || m[1]), i = a; i <= b && i - a < 500; i++) r.add(i);
      }
    }
    return r;
  }

  function codeTokens(line, lang, st) {
    const out = [];
    const push = (t, k) => { if (t) out.push([t, k]); };
    let i = 0;
    const n = line.length;
    const ci = lang === 'sql' || lang === 'pseudo' || lang === 'pascal';
    const kw = CODE_KW[lang] || CODE_KW.python;
    const ty = CODE_TYPES[lang] || CODE_TYPES.python;

    if (lang === 'text') { push(line, ''); return out; }

    while (i < n) {
      if (st.block) {
        const end = st.block;
        const j = line.indexOf(end, i);
        if (j < 0) { push(line.slice(i), 'com'); return out; }
        push(line.slice(i, j + end.length), 'com');
        i = j + end.length;
        st.block = null;
        continue;
      }
      const r = line.slice(i);
      const c = line[i];

      // Comment
      if ((lang === 'python' && c === '#') || (lang === 'sql' && r.startsWith('--')) || ((lang === 'cpp' || lang === 'js' || lang === 'pascal' || lang === 'pseudo') && r.startsWith('//'))) {
        push(r, 'com');
        return out;
      }
      if ((lang === 'cpp' || lang === 'js') && r.startsWith('/*')) {
        const j = line.indexOf('*/', i + 2);
        if (j < 0) { push(r, 'com'); st.block = '*/'; return out; }
        push(line.slice(i, j + 2), 'com');
        i = j + 2;
        continue;
      }
      if (lang === 'pascal' && c === '{') {
        const j = line.indexOf('}', i + 1);
        if (j < 0) { push(r, 'com'); st.block = '}'; return out; }
        push(line.slice(i, j + 1), 'com');
        i = j + 1;
        continue;
      }
      if (lang === 'pascal' && r.startsWith('(*')) {
        const j = line.indexOf('*)', i + 2);
        if (j < 0) { push(r, 'com'); st.block = '*)'; return out; }
        push(line.slice(i, j + 2), 'com');
        i = j + 2;
        continue;
      }

      // Python triple quote
      if (lang === 'python' && (r.startsWith('"""') || r.startsWith("'''"))) {
        const q = r.slice(0, 3);
        const j = line.indexOf(q, i + 3);
        if (j < 0) { push(r, 'str'); st.block = q; return out; }
        push(line.slice(i, j + 3), 'str');
        i = j + 3;
        continue;
      }

      // Preprocessor (#include, etc)
      if (lang === 'cpp' && c === '#' && !line.slice(0, i).trim()) {
        push(r, 'pre');
        return out;
      }

      // Strings
      if (c === '"' || c === "'" || (c === '`' && lang === 'js')) {
        let j = i + 1;
        while (j < n && line[j] !== c) {
          if (line[j] === '\\') j++;
          j++;
        }
        push(line.slice(i, j + 1), 'str');
        i = j + 1;
        continue;
      }

      // Numbers
      let m;
      if ((m = r.match(/^\d+(\.\d+)?([eE][+-]?\d+)?/))) {
        push(m[0], 'num');
        i += m[0].length;
        continue;
      }

      // Words (keywords, types, functions, identifiers)
      if ((m = r.match(/^[A-Za-z_À-ỹ][\wÀ-ỹ]*/))) {
        const w = m[0];
        const key = ci ? w.toUpperCase() : w;
        const isKw = ci ? [...kw].some((k) => k.toUpperCase() === key) : kw.has(w);
        const isTy = ci ? [...ty].some((k) => k.toUpperCase() === key) : ty.has(w);
        push(w, isKw ? 'kw' : isTy ? 'ty' : /^\s*\(/.test(line.slice(i + w.length)) ? 'fn' : '');
        i += w.length;
        continue;
      }

      // Whitespace
      if ((m = r.match(/^\s+/))) {
        push(m[0], '');
        i += m[0].length;
        continue;
      }

      // Operators / punctuation
      push(c, 'op');
      i++;
    }
    return out;
  }

  function codeBase(o) {
    const fs = +o.fs || 14;
    const lines = String(o.src || '').replace(/\t/g, '    ').split('\n');
    const cw = fs * 0.6;
    const maxLen = Math.max(8, ...lines.map((l) => l.length));
    const gut = o.num === false ? fs * 0.6 : cw * (String(lines.length).length + 2);
    const bar = o.title ? fs * 2.0 : 0;
    const pad = fs * 0.7;
    const lh = fs * 1.5;
    const W = Math.max(fs * 12, gut + maxLen * cw + pad * 2);
    const H = bar + lines.length * lh + pad * 2;
    return { fs, lines, cw, gut, bar, pad, lh, w: W, h: H };
  }

  function renderCode(o, w, h, out) {
    const b = codeBase(o);
    const P = CODE_PAL[o.th === 'toi' ? 'toi' : 'sang'] || CODE_PAL.sang;
    const hl = hlSet(o.hl);
    const sx = w / b.w, sy = h / b.h;

    out.push(`<g transform="scale(${r1(sx)},${r1(sy)})">`);
    // Thẻ nền bo góc
    out.push(`<rect x="0" y="0" width="${r1(b.w)}" height="${r1(b.h)}" rx="${r1(b.fs * 0.4)}" fill="${P.bg}" stroke="${P.border}" stroke-width="1.2"/>`);

    // Thanh tiêu đề macOS nếu có title
    if (b.bar) {
      const r = r1(b.fs * 0.4);
      out.push(`<path d="M 0,${r} A ${r},${r} 0 0 1 ${r},0 L ${r1(b.w - r)},0 A ${r},${r} 0 0 1 ${r1(b.w)},${r} L ${r1(b.w)},${r1(b.bar)} L 0,${r1(b.bar)} Z" fill="${P.bar}"/>`);
      out.push(`<line x1="0" y1="${r1(b.bar)}" x2="${r1(b.w)}" y2="${r1(b.bar)}" stroke="${P.border}" stroke-width="1"/>`);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((cl, i) => {
        out.push(`<circle cx="${r1(b.fs * (1.0 + i * 0.85))}" cy="${r1(b.bar / 2)}" r="${r1(b.fs * 0.28)}" fill="${cl}"/>`);
      });
      if (o.title) {
        out.push(`<text x="${r1(b.w / 2)}" y="${r1(b.bar / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${r1(b.fs * 0.8)}" fill="${P.num}">${esc(o.title)}</text>`);
      }
    }

    // Từng dòng mã
    const st = {};
    b.lines.forEach((ln, i) => {
      const yMid = b.bar + b.pad + i * b.lh + b.lh / 2;
      const yTop = yMid - b.lh / 2;

      // Tô sáng dòng
      if (hl.has(i + 1)) {
        out.push(`<rect x="1" y="${r1(yTop)}" width="${r1(b.w - 2)}" height="${r1(b.lh)}" fill="${P.hl}"/>`);
        if (o.th !== 'toi') {
          out.push(`<rect x="1" y="${r1(yTop)}" width="${r1(b.fs * 0.22)}" height="${r1(b.lh)}" fill="#e3b341"/>`);
        }
      }

      // Số dòng
      if (o.num !== false) {
        out.push(`<text x="${r1(b.gut - b.cw)}" y="${r1(yMid)}" text-anchor="end" dominant-baseline="central" font-family="${MONO}" font-size="${r1(b.fs)}" fill="${P.num}">${i + 1}</text>`);
      }

      // Tô màu từng từ
      const toks = codeTokens(ln, o.lang || 'python', st);
      let xPos = b.gut + b.pad * 0.4;
      toks.forEach(([text, kd]) => {
        if (!text) return;
        const col = P[kd] || P.fg;
        const weight = kd === 'kw' ? 'bold' : 'normal';
        const style = kd === 'com' ? 'italic' : 'normal';
        out.push(`<text x="${r1(xPos)}" y="${r1(yMid)}" text-anchor="start" dominant-baseline="central" font-family="${MONO}" font-size="${r1(b.fs)}" font-weight="${weight}" font-style="${style}" fill="${col}" xml:space="preserve">${esc(text)}</text>`);
        xPos += text.length * b.cw;
      });
    });

    out.push('</g>');
  }

  // ---------------- SƠ ĐỒ KHỐI THUẬT TOÁN (FLOWCHART SGK) ----------------
  const FK = [
    ['start', 'Bắt đầu'],
    ['io', 'Nhập / xuất'],
    ['proc', 'Xử lý'],
    ['cond', 'Điều kiện'],
    ['sub', 'Chương trình con'],
    ['end', 'Kết thúc']
  ];

  function fnSize(n, fs) {
    const tw = String(n.text || ' ').length * fs * 0.55;
    if (n.k === 'cond') return { w: Math.max(fs * 7.5, tw * 1.5 + fs * 2.2), h: Math.max(fs * 3.4, fs * 2.4 + tw * 0.08) };
    if (n.k === 'io') return { w: Math.max(fs * 7, tw + fs * 3), h: fs * 2.4 };
    return { w: Math.max(fs * 6.5, tw + fs * 2.2), h: fs * 2.4 };
  }

  function fnPort(n, s, side) {
    return side === 't' ? [n.x, n.y - s.h / 2] : side === 'b' ? [n.x, n.y + s.h / 2] : side === 'l' ? [n.x - s.w / 2, n.y] : [n.x + s.w / 2, n.y];
  }

  function fnRoute(f, e, S) {
    const a = f.nodes.find((n) => n.id === e.a), b = f.nodes.find((n) => n.id === e.b);
    if (!a || !b) return null;
    const sa = S[a.id], sb = S[b.id], no = /^(sai|không|no|false)$/i.test(e.t || '');
    const below = b.y - sb.h / 2 > a.y + sa.h / 2 - 1;

    if (below) {
      if (a.k === 'cond' && no) {
        const side = b.x < a.x - 1 ? 'l' : 'r';
        const A = fnPort(a, sa, side), B = fnPort(b, sb, 't');
        return Math.abs(B[0] - A[0]) < 2
          ? [A, [B[0] + (side === 'r' ? sa.w : -sa.w), A[1]], [B[0] + (side === 'r' ? sa.w : -sa.w), B[1] - f.fs], [B[0], B[1] - f.fs], B]
          : [A, [B[0], A[1]], B];
      }
      const A = fnPort(a, sa, 'b'), B = fnPort(b, sb, 't');
      if (Math.abs(A[0] - B[0]) < 2) return [A, B];
      const my = (A[1] + B[1]) / 2;
      return [A, [A[0], my], [B[0], my], B];
    }

    // Nhánh lặp vòng lên: ra cạnh bên, đi lên, vào cạnh bên khối trên
    const left = e.side === 'l' || (!e.side && !(a.k === 'cond' && no));
    const xs = f.nodes.map((n) => left ? n.x - S[n.id].w / 2 : n.x + S[n.id].w / 2).filter((_, i) => {
      const n = f.nodes[i];
      return n.y >= Math.min(a.y, b.y) - 1 && n.y <= Math.max(a.y, b.y) + 1;
    });
    const sx = left ? Math.min(...xs) - f.fs * 1.6 : Math.max(...xs) + f.fs * 1.6;
    const A = a.k === 'cond' ? fnPort(a, sa, left ? 'l' : 'r') : fnPort(a, sa, 'b');
    const B = fnPort(b, sb, left ? 'l' : 'r');
    return a.k === 'cond' ? [A, [sx, A[1]], [sx, B[1]], B] : [A, [A[0], A[1] + f.fs * 0.8], [sx, A[1] + f.fs * 0.8], [sx, B[1]], B];
  }

  function flowBounds(f) {
    const fs = +f.fs || 14;
    const S = {};
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of f.nodes) {
      const s = S[n.id] = fnSize(n, fs);
      x0 = Math.min(x0, n.x - s.w / 2);
      x1 = Math.max(x1, n.x + s.w / 2);
      y0 = Math.min(y0, n.y - s.h / 2);
      y1 = Math.max(y1, n.y + s.h / 2);
    }
    for (const e of f.edges) {
      const r = fnRoute(f, e, S);
      if (r) {
        for (const p of r) {
          x0 = Math.min(x0, p[0] - 6);
          x1 = Math.max(x1, p[0] + 6);
          y0 = Math.min(y0, p[1]);
          y1 = Math.max(y1, p[1]);
        }
      }
    }
    const m = fs * 0.8;
    if (!f.nodes.length) return { S, x: 0, y: 0, w: 100, h: 60 };
    return { S, x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m };
  }

  // Tự động sinh sơ đồ khối từ đoạn mã Python SGK
  function flowFromPython(src) {
    const L = String(src).replace(/\t/g, '    ').split('\n').map((s) => s.replace(/#.*$/, '').replace(/\s+$/, '')).filter((s) => s.trim());
    const ind = (s) => (s.match(/^ */) || [''])[0].length;

    function block(i, lv) {
      const out = [];
      while (i < L.length && ind(L[i]) >= lv) {
        if (ind(L[i]) > lv) { i++; continue; }
        const s = L[i].trim();
        const m = s.match(/^(if|elif|while|for)\s+(.*):$/) || (s === 'else:' ? ['', 'else', ''] : null);
        if (m) {
          const [body, j] = block(i + 1, ind(L[i + 1] || '') > lv ? ind(L[i + 1]) : lv + 4);
          const st = { k: m[1], c: m[2], body };
          i = j;
          if (m[1] === 'if' || m[1] === 'elif') {
            if (i < L.length && ind(L[i]) === lv && /^(elif\s|else:)/.test(L[i].trim())) {
              const [rest, j2] = block2(i, lv);
              st.els = rest;
              i = j2;
            }
          }
          out.push(st);
        } else {
          out.push({ k: 's', s });
          i++;
        }
      }
      return [out, i];
    }

    function block2(i, lv) {
      const s = L[i].trim();
      if (s === 'else:') {
        const [b, j] = block(i + 1, ind(L[i + 1] || '') > lv ? ind(L[i + 1]) : lv + 4);
        return [b, j];
      }
      const m = s.match(/^elif\s+(.*):$/);
      const [b, j] = block(i + 1, ind(L[i + 1] || '') > lv ? ind(L[i + 1]) : lv + 4);
      const st = { k: 'if', c: m ? m[1] : '', body: b };
      let k = j;
      if (k < L.length && ind(L[k]) === lv && /^(elif\s|else:)/.test(L[k].trim())) {
        const [r, k2] = block2(k, lv);
        st.els = r;
        k = k2;
      }
      return [[st], k];
    }

    const pretty = (t) => String(t || '').replace(/\s*==\s*/g, ' = ').replace(/\s*!=\s*/g, ' ≠ ').replace(/\s*<=\s*/g, ' ≤ ').replace(/\s*>=\s*/g, ' ≥ ').replace(/\band\b/g, ' và ').replace(/\bor\b/g, ' hoặc ').replace(/\bnot\b/g, ' không ').replace(/\*\*/g, '^');
    const stmt = (s) => {
      let m;
      if ((m = s.match(/^([\w, ]+?)\s*=\s*(?:int|float|str)?\(?\s*input\s*\((.*)\)\s*\)?$/))) return ['io', 'Nhập ' + m[1].trim()];
      if ((m = s.match(/^print\s*\((.*)\)$/))) return ['io', 'Xuất ' + m[1].replace(/["']/g, '').replace(/\s*,\s*/g, ', ')];
      if ((m = s.match(/^return\s*(.*)$/))) return ['io', 'Trả về ' + m[1]];
      if ((m = s.match(/^([\w\[\]., ]+?)\s*([+\-*/]?)=\s*(.+)$/)) && !/[=!<>]=/.test(s.slice(0, s.indexOf('=') + 1))) {
        return ['proc', m[1].trim() + ' ← ' + (m[2] ? m[1].trim() + ' ' + m[2] + ' ' : '') + pretty(m[3])];
      }
      return ['proc', pretty(s)];
    };

    const f = { nodes: [], edges: [], fs: 14 };
    let id = 0;
    const COLW = 180, ROW = 70;
    const node = (k, text, x, y) => { const n = { id: 'n' + (++id), k, text, x, y }; f.nodes.push(n); return n; };
    const link = (exits, b) => { for (const e of exits) f.edges.push({ a: e.id, b: b.id, t: e.t || '' }); };

    function lay(list, x, y, exits) {
      for (const st of list) {
        if (st.k === 's') {
          const [k, t] = stmt(st.s);
          const n = node(k, t, x, y);
          link(exits, n);
          exits = [{ id: n.id }];
          y += ROW;
          continue;
        }
        if (st.k === 'if') {
          const d = node('cond', pretty(st.c) + '?', x, y);
          link(exits, d);
          const t = lay(st.body, x, y + ROW, [{ id: d.id, t: 'Đúng' }]);
          let ex = t.exits, yy = t.y;
          if (st.els && st.els.length) {
            const r = lay(st.els, x + COLW, y + ROW, [{ id: d.id, t: 'Sai' }]);
            ex = ex.concat(r.exits);
            yy = Math.max(yy, r.y);
          } else {
            ex = ex.concat([{ id: d.id, t: 'Sai' }]);
          }
          exits = ex;
          y = yy;
          continue;
        }
        let init = null, step = null, cond = pretty(st.c);
        if (st.k === 'for') {
          const m = st.c.match(/^(\w+)\s+in\s+range\s*\((.*)\)$/);
          if (m) {
            const a = m[2].split(',').map((s) => s.trim());
            const v = m[1], lo = a.length > 1 ? a[0] : '0', hi = a.length > 1 ? a[1] : a[0], sp = a[2] || '1';
            init = v + ' ← ' + lo;
            cond = v + (sp.trim().startsWith('-') ? ' > ' : ' < ') + hi;
            step = v + ' ← ' + v + ' + ' + sp;
          } else {
            cond = 'Còn ' + st.c.replace(/\s+in\s+/, ' trong ');
          }
        }
        if (init) {
          const n = node('proc', init, x, y);
          link(exits, n);
          exits = [{ id: n.id }];
          y += ROW;
        }
        const d = node('cond', cond + '?', x, y);
        link(exits, d);
        const b = lay(st.body, x, y + ROW, [{ id: d.id, t: 'Đúng' }]);
        let bx = b.exits, by = b.y;
        if (step) {
          const n = node('proc', step, x, by);
          link(bx, n);
          bx = [{ id: n.id }];
          by += ROW;
        }
        for (const e of bx) f.edges.push({ a: e.id, b: d.id, t: e.t || '', side: 'l' });
        exits = [{ id: d.id, t: 'Sai' }];
        y = by;
      }
      return { exits, y };
    }

    const s0 = node('start', 'Bắt đầu', 0, 0);
    const [prog] = block(0, 0);
    const r = lay(prog, 0, ROW, [{ id: s0.id }]);
    const e0 = node('end', 'Kết thúc', 0, r.y);
    link(r.exits, e0);
    return f;
  }

  function renderFlow(o, w, h, out) {
    if (o.code && (!o.nodes || !o.nodes.length || o._lastCode !== o.code)) {
      const gen = flowFromPython(o.code);
      o.nodes = gen.nodes;
      o.edges = gen.edges;
      o._lastCode = o.code;
    }
    if (!o.nodes || !o.nodes.length) {
      o.nodes = [
        { id: 'n1', k: 'start', text: 'Bắt đầu', x: 0, y: 0 },
        { id: 'n2', k: 'io', text: 'Nhập a, b', x: 0, y: 70 },
        { id: 'n3', k: 'proc', text: 'S ← a + b', x: 0, y: 140 },
        { id: 'n4', k: 'io', text: 'Xuất S', x: 0, y: 210 },
        { id: 'n5', k: 'end', text: 'Kết thúc', x: 0, y: 280 }
      ];
      o.edges = [
        { a: 'n1', b: 'n2' },
        { a: 'n2', b: 'n3' },
        { a: 'n3', b: 'n4' },
        { a: 'n4', b: 'n5' }
      ];
    }

    const fs = +o.fs || 14;
    const ink = o.color || '#1f2937';
    const B = flowBounds(o);
    const S = B.S;
    const s = Math.min((w - 20) / B.w, (h - 20) / B.h, 1.6);
    const ox = (w - B.w * s) / 2 - B.x * s;
    const oy = (h - B.h * s) / 2 - B.y * s;

    const col = (n) => ({
      start: '#e8f5e9',
      end: '#ffebee',
      io: '#e3f2fd',
      proc: '#fffde7',
      cond: '#fff3e0',
      sub: '#f3e5f5'
    }[n.k] || '#ffffff');

    out.push(`<g transform="translate(${r1(ox)},${r1(oy)}) scale(${r1(s)})">`);

    // Các đường nối và mũi tên
    for (const e of o.edges) {
      const r = fnRoute(o, e, S);
      if (!r || r.length < 2) continue;
      const pts = r.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ');
      out.push(`<polyline points="${pts}" fill="none" stroke="${ink}" stroke-width="${r1(fs * 0.1)}" stroke-linecap="round" stroke-linejoin="round"/>`);

      // Mũi tên ở đầu đến
      const p = r[r.length - 1], q = r[r.length - 2];
      const an = Math.atan2(p[1] - q[1], p[0] - q[0]);
      const ah = fs * 0.6;
      const p1x = p[0] - ah * Math.cos(an - 0.45), p1y = p[1] - ah * Math.sin(an - 0.45);
      const p2x = p[0] - ah * Math.cos(an + 0.45), p2y = p[1] - ah * Math.sin(an + 0.45);
      out.push(`<polygon points="${r1(p[0])},${r1(p[1])} ${r1(p1x)},${r1(p1y)} ${r1(p2x)},${r1(p2y)}" fill="${ink}"/>`);

      // Nhãn nhánh (Đúng / Sai)
      if (e.t) {
        const a = r[0], b2 = r[1];
        const tx = a[0] + (b2[0] >= a[0] - 1 ? fs * 0.4 : -fs * 0.4);
        const ty = a[1] + (Math.abs(b2[0] - a[0]) < 1 ? fs * 1.1 : -fs * 0.2);
        const anchor = b2[0] > a[0] + 1 ? 'start' : b2[0] < a[0] - 1 ? 'end' : 'start';
        out.push(`<text x="${r1(tx)}" y="${r1(ty)}" text-anchor="${anchor}" font-family="${FONT}" font-style="italic" font-size="${r1(fs * 0.85)}" fill="${ink}">${esc(e.t)}</text>`);
      }
    }

    // Các khối hình
    for (const n of o.nodes) {
      const sn = S[n.id] || fnSize(n, fs);
      const x = n.x - sn.w / 2, y = n.y - sn.h / 2;
      const fill = col(n);
      const sw = r1(fs * 0.1);

      if (n.k === 'start' || n.k === 'end') {
        out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(sn.w)}" height="${r1(sn.h)}" rx="${r1(sn.h / 2)}" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`);
      } else if (n.k === 'io') {
        const d = fs * 0.9;
        out.push(`<polygon points="${r1(x + d)},${r1(y)} ${r1(x + sn.w)},${r1(y)} ${r1(x + sn.w - d)},${r1(y + sn.h)} ${r1(x)},${r1(y + sn.h)}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`);
      } else if (n.k === 'cond') {
        out.push(`<polygon points="${r1(n.x)},${r1(y)} ${r1(x + sn.w)},${r1(n.y)} ${r1(n.x)},${r1(y + sn.h)} ${r1(x)},${r1(n.y)}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`);
      } else if (n.k === 'sub') {
        out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(sn.w)}" height="${r1(sn.h)}" rx="3" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`);
        out.push(`<line x1="${r1(x + fs * 0.5)}" y1="${r1(y)}" x2="${r1(x + fs * 0.5)}" y2="${r1(y + sn.h)}" stroke="${ink}" stroke-width="${sw}"/>`);
        out.push(`<line x1="${r1(x + sn.w - fs * 0.5)}" y1="${r1(y)}" x2="${r1(x + sn.w - fs * 0.5)}" y2="${r1(y + sn.h)}" stroke="${ink}" stroke-width="${sw}"/>`);
      } else {
        // proc (xử lý)
        out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(sn.w)}" height="${r1(sn.h)}" rx="3" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`);
      }

      out.push(`<text x="${r1(n.x)}" y="${r1(n.y)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${r1(fs)}" fill="#1d2230">${esc(n.text || '')}</text>`);
    }

    out.push('</g>');
  }

  // ---------------- KHỐI LỆNH SCRATCH (SCRATCH BLOCKS) ----------------
  const SCRATCH_CAT = {
    events: { fill: '#ffbf00', border: '#d9a300', text: '#ffffff' },
    ctl: { fill: '#ffab19', border: '#d99115', text: '#ffffff' },
    motion: { fill: '#4c97ff', border: '#3373cc', text: '#ffffff' },
    looks: { fill: '#9966ff', border: '#7f4dcc', text: '#ffffff' },
    sound: { fill: '#cf63cf', border: '#b347b3', text: '#ffffff' },
    sensing: { fill: '#5cb1d6', border: '#4392b3', text: '#ffffff' },
    ops: { fill: '#59c059', border: '#449944', text: '#ffffff' },
    vars: { fill: '#ff8c1a', border: '#cc7014', text: '#ffffff' },
    my: { fill: '#ff6680', border: '#d9405b', text: '#ffffff' }
  };

  function parseScratchCategory(line) {
    const s = line.toLowerCase();
    if (/^(when|khi)\b/.test(s)) return 'events';
    if (/^(repeat|lặp|forever|liên tục|if|nếu|else|nếu không|wait|đợi|stop|dừng|end|kết thúc)/.test(s)) return 'ctl';
    if (/^(move|di chuyển|turn|xoay|go to|đi tới|point|hướng|change x|đổi x|set x|đặt x|bounce|bật lại)/.test(s)) return 'motion';
    if (/^(say|nói|think|nghĩ|switch costume|chuyển trang phục|next|show|hiện|hide|ẩn|change size|đổi kích thước)/.test(s)) return 'looks';
    if (/^(play sound|phát âm thanh|start sound|stop all sounds)/.test(s)) return 'sound';
    if (/^(ask|hỏi|touching|đang chạm|key|phím|mouse|chuột)/.test(s)) return 'sensing';
    if (/^(pick random|chọn ngẫu nhiên|join|kết hợp)/.test(s)) return 'ops';
    if (/^(set|đặt|change|thay đổi|show variable|hide variable)/.test(s)) return 'vars';
    return 'motion';
  }

  // Khối puzzle vector path tiêu chuẩn Scratch
  function scratchPuzzlePath(w, h, isHat, hasTabBottom) {
    w = Math.max(80, w);
    h = Math.max(30, h);
    if (isHat) {
      // Khối mũ (When flag clicked): đỉnh vòm cong
      return `M 0,16 C 0,7.2 7.2,0 16,0 C 26,0 36,4 48,12 C 60,20 70,24 80,24 L 92,24 C 100,24 108,18 116,12 C 124,6 132,0 144,0 L ${r1(w - 4)},0 A 4,4 0 0 1 ${r1(w)},4 L ${r1(w)},${r1(h - 4)} A 4,4 0 0 1 ${r1(w - 4)},${r1(h)} ` +
        (hasTabBottom ? `L 28,${r1(h)} L 25,${r1(h + 3)} L 15,${r1(h + 3)} L 12,${r1(h)} ` : '') +
        `L 4,${r1(h)} A 4,4 0 0 1 0,${r1(h - 4)} Z`;
    }
    // Khối chữ nhật thông thường có mộng trên (notch) và mộng dưới (tab)
    return `M 0,4 A 4,4 0 0 1 4,0 L 12,0 L 15,3 L 25,3 L 28,0 L ${r1(w - 4)},0 A 4,4 0 0 1 ${r1(w)},4 L ${r1(w)},${r1(h - 4)} A 4,4 0 0 1 ${r1(w - 4)},${r1(h)} ` +
      (hasTabBottom ? `L 28,${r1(h)} L 25,${r1(h + 3)} L 15,${r1(h + 3)} L 12,${r1(h)} ` : '') +
      `L 4,${r1(h)} A 4,4 0 0 1 0,${r1(h - 4)} Z`;
  }

  // Phân tích các token con bên trong 1 dòng khối lệnh
  function parseScratchLine(line) {
    const tokens = [];
    let rem = line.trim();
    while (rem.length > 0) {
      // Cờ xanh
      let m = rem.match(/^(?:when flag clicked|khi bấm vào cờ xanh|khi nhấn cờ xanh|flag|cờ xanh)/i);
      if (m && tokens.length === 0) {
        tokens.push({ type: 'flag' });
        tokens.push({ type: 'text', val: /khi/i.test(m[0]) ? 'khi bấm vào' : 'when' });
        tokens.push({ type: 'flag_icon' });
        tokens.push({ type: 'text', val: /khi/i.test(m[0]) ? '' : 'clicked' });
        rem = rem.slice(m[0].length).trim();
        continue;
      }
      // Ô nhập tròn (10)
      if (rem.startsWith('(')) {
        const j = rem.indexOf(')');
        if (j > 0) {
          tokens.push({ type: 'num', val: rem.slice(1, j) });
          rem = rem.slice(j + 1).trim();
          continue;
        }
      }
      // Ô chọn hoặc chuỗi [text v]
      if (rem.startsWith('[')) {
        const j = rem.indexOf(']');
        if (j > 0) {
          const inner = rem.slice(1, j);
          tokens.push({ type: inner.endsWith(' v') ? 'dropdown' : 'string', val: inner.replace(/\s+v$/, '') });
          rem = rem.slice(j + 1).trim();
          continue;
        }
      }
      // Ô lục giác điều kiện <cond>
      if (rem.startsWith('<')) {
        const j = rem.lastIndexOf('>');
        if (j > 0) {
          tokens.push({ type: 'bool', val: rem.slice(1, j) });
          rem = rem.slice(j + 1).trim();
          continue;
        }
      }
      // Chữ thường
      const nextSpecial = rem.search(/[(\[<]/);
      if (nextSpecial > 0) {
        tokens.push({ type: 'text', val: rem.slice(0, nextSpecial).trim() });
        rem = rem.slice(nextSpecial).trim();
      } else {
        tokens.push({ type: 'text', val: rem });
        rem = '';
      }
    }
    return tokens.filter((t) => t.val !== '');
  }

  function renderScratch(o, w, h, out) {
    const rawLines = String(o.src || '').split('\n').map((l) => l.trim()).filter((l) => l);
    if (!rawLines.length) {
      rawLines.push('when flag clicked', 'repeat (10)', '  move (10) steps', 'end', 'say [Hoàn thành!] for (2) seconds');
    }

    const fs = 12;
    const blockH = 32;
    let curY = 0;
    let curIndent = 0;
    const renderedBlocks = [];

    rawLines.forEach((line) => {
      const lower = line.toLowerCase();
      const isEnd = lower === 'end' || lower === 'kết thúc';
      const isElse = lower === 'else' || lower === 'nếu không';
      const isCBlock = /^(repeat|lặp|forever|liên tục|if|nếu)\b/.test(lower);
      const isHat = /^(when|khi)\b/.test(lower);

      if (isEnd) {
        curIndent = Math.max(0, curIndent - 16);
        // Khối đáy của C-block
        renderedBlocks.push({
          type: 'bottom_bar',
          indent: curIndent,
          y: curY,
          w: 60,
          h: 14,
          cat: 'ctl'
        });
        curY += 14;
        return;
      }

      if (isElse) {
        const ind = Math.max(0, curIndent - 16);
        renderedBlocks.push({
          type: 'mid_bar',
          indent: ind,
          y: curY,
          w: 80,
          h: 24,
          cat: 'ctl',
          text: lower === 'else' ? 'else' : 'nếu không'
        });
        curY += 24;
        return;
      }

      const catName = parseScratchCategory(line);
      const tokens = parseScratchLine(line);

      // Tính toán chiều rộng khối dựa trên các token
      let estW = 20;
      tokens.forEach((t) => {
        if (t.type === 'text') estW += t.val.length * 7 + 8;
        else if (t.type === 'num' || t.type === 'string') estW += Math.max(22, t.val.length * 7 + 14);
        else if (t.type === 'dropdown') estW += t.val.length * 7 + 22;
        else if (t.type === 'bool') estW += t.val.length * 7 + 20;
        else if (t.type === 'flag_icon') estW += 20;
      });
      estW = Math.max(estW, isHat ? 120 : 70);

      const bh = isHat ? 40 : blockH;
      renderedBlocks.push({
        type: isHat ? 'hat' : 'stack',
        indent: curIndent,
        y: curY,
        w: estW,
        h: bh,
        cat: catName,
        tokens,
        isCBlock
      });

      curY += bh;
      if (isCBlock) curIndent += 16;
    });

    const totalW = Math.max(160, ...renderedBlocks.map((b) => b.indent + b.w)) + 10;
    const totalH = curY + 6;
    const s = Math.min((w - 10) / totalW, (h - 10) / totalH, 1.5);
    const ox = (w - totalW * s) / 2;
    const oy = (h - totalH * s) / 2;

    out.push(`<g transform="translate(${r1(ox)},${r1(oy)}) scale(${r1(s)})">`);

    renderedBlocks.forEach((blk, idx) => {
      const C = SCRATCH_CAT[blk.cat] || SCRATCH_CAT.motion;
      const x = blk.indent;
      const y = blk.y;

      if (blk.type === 'bottom_bar') {
        // Đáy khối C-block
        out.push(`<path d="M ${r1(x)},${r1(y)} L ${r1(x + 40)},${r1(y)} L ${r1(x + 40)},${r1(y + 12)} L 28,${r1(y + 12)} L 25,${r1(y + 15)} L 15,${r1(y + 15)} L 12,${r1(y + 12)} L ${r1(x)},${r1(y + 12)} Z" fill="${C.fill}" stroke="${C.border}" stroke-width="1.2"/>`);
        return;
      }

      if (blk.type === 'mid_bar') {
        // Thanh giữa của if-else
        out.push(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(blk.w)}" height="${r1(blk.h)}" rx="3" fill="${C.fill}" stroke="${C.border}" stroke-width="1.2"/>`);
        out.push(`<text x="${r1(x + 12)}" y="${r1(y + blk.h / 2)}" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs}" fill="#ffffff">${esc(blk.text)}</text>`);
        return;
      }

      const isHat = blk.type === 'hat';
      const hasTab = idx < renderedBlocks.length - 1;
      const pathD = scratchPuzzlePath(blk.w, blk.h, isHat, hasTab);

      out.push(`<g transform="translate(${r1(x)},${r1(y)})">`);
      out.push(`<path d="${pathD}" fill="${C.fill}" stroke="${C.border}" stroke-width="1.2"/>`);

      // Vẽ nội dung các token bên trong khối
      let tX = 12;
      const tY = isHat ? 26 : blk.h / 2;

      blk.tokens.forEach((t) => {
        if (t.type === 'flag_icon') {
          // Biểu tượng lá cờ xanh
          out.push(`<g transform="translate(${r1(tX)},${r1(tY - 7)}) scale(0.85)">`);
          out.push(`<line x1="2" y1="2" x2="2" y2="16" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>`);
          out.push(`<path d="M 2,3 C 6,0 10,6 14,3 L 14,9 C 10,12 6,6 2,9 Z" fill="#40bf4a"/>`);
          out.push(`</g>`);
          tX += 18;
        } else if (t.type === 'text') {
          out.push(`<text x="${r1(tX)}" y="${r1(tY)}" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs}" fill="${C.text}">${esc(t.val)}</text>`);
          tX += t.val.length * 7 + 8;
        } else if (t.type === 'num') {
          // Ô số tròn màu trắng
          const nw = Math.max(22, t.val.length * 7 + 12);
          out.push(`<rect x="${r1(tX)}" y="${r1(tY - 10)}" width="${r1(nw)}" height="20" rx="10" fill="#ffffff" stroke="${C.border}" stroke-width="0.8"/>`);
          out.push(`<text x="${r1(tX + nw / 2)}" y="${r1(tY)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs - 1}" fill="#333333">${esc(t.val)}</text>`);
          tX += nw + 6;
        } else if (t.type === 'string') {
          // Ô chuỗi chữ nhật bo góc màu trắng
          const sw = Math.max(26, t.val.length * 7 + 12);
          out.push(`<rect x="${r1(tX)}" y="${r1(tY - 10)}" width="${r1(sw)}" height="20" rx="4" fill="#ffffff" stroke="${C.border}" stroke-width="0.8"/>`);
          out.push(`<text x="${r1(tX + sw / 2)}" y="${r1(tY)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs - 1}" fill="#333333">${esc(t.val)}</text>`);
          tX += sw + 6;
        } else if (t.type === 'dropdown') {
          // Ô chọn danh sách có mũi tên
          const dw = Math.max(34, t.val.length * 7 + 20);
          out.push(`<rect x="${r1(tX)}" y="${r1(tY - 10)}" width="${r1(dw)}" height="20" rx="4" fill="rgba(0,0,0,0.15)"/>`);
          out.push(`<text x="${r1(tX + 6)}" y="${r1(tY)}" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs - 1}" fill="#ffffff">${esc(t.val)}</text>`);
          out.push(`<polygon points="${r1(tX + dw - 10)},${r1(tY - 2)} ${r1(tX + dw - 4)},${r1(tY - 2)} ${r1(tX + dw - 7)},${r1(tY + 3)}" fill="#ffffff"/>`);
          tX += dw + 6;
        } else if (t.type === 'bool') {
          // Ô điều kiện hình lục giác
          const bw = Math.max(36, t.val.length * 7 + 18);
          out.push(`<polygon points="${r1(tX)},${r1(tY)} ${r1(tX + 6)},${r1(tY - 10)} ${r1(tX + bw - 6)},${r1(tY - 10)} ${r1(tX + bw)},${r1(tY)} ${r1(tX + bw - 6)},${r1(tY + 10)} ${r1(tX + 6)},${r1(tY + 10)}" fill="rgba(0,0,0,0.18)"/>`);
          out.push(`<text x="${r1(tX + bw / 2)}" y="${r1(tY)}" text-anchor="middle" dominant-baseline="central" font-family="${FONT_SCRATCH}" font-weight="bold" font-size="${fs - 1}" fill="#ffffff">${esc(t.val)}</text>`);
          tX += bw + 6;
        }
      });

      out.push(`</g>`);
    });

    out.push('</g>');
  }

  // ---------------- BỘ ĐIỀU PHỐI CHUNG ----------------
  function render(o, w, h) {
    w = w || o.w || 400;
    h = h || o.h || 250;
    const out = [];
    const errs = [];
    const labels = [];

    const ve = o.ve || (o.type === 'flow' ? 'flow' : o.type === 'scratch' ? 'scratch' : 'code');

    try {
      if (ve === 'code') renderCode(o, w, h, out, errs);
      else if (ve === 'flow') renderFlow(o, w, h, out, errs);
      else if (ve === 'scratch') renderScratch(o, w, h, out, errs);
      else errs.push(`Không rõ loại hình Tin học "${ve}"`);
    } catch (e) {
      errs.push(e.message || String(e));
    }

    return { svg: out.join(''), labels, errors: errs };
  }

  const GROUPS = [
    ['Mã nguồn', 'tin', {
      codePython: ['Khối mã Python', { ve: 'code', lang: 'python', src: 'n = int(input("Nhập n: "))\ns = 0\nfor i in range(1, n + 1):\n    s = s + i\nprint("Tổng =", s)', title: 'main.py', th: 'sang', num: true, fs: 14, w: 420, h: 200 }],
      codeCpp: ['Khối mã C++', { ve: 'code', lang: 'cpp', src: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, s = 0;\n    cin >> n;\n    for (int i = 1; i <= n; i++)\n        s += i;\n    cout << "Tổng = " << s << endl;\n    return 0;\n}', title: 'solution.cpp', th: 'sang', num: true, fs: 14, w: 460, h: 240 }],
      codePascal: ['Khối mã Pascal', { ve: 'code', lang: 'pascal', src: "program TinhTong;\nvar n, i, s: integer;\nbegin\n  readln(n);\n  s := 0;\n  for i := 1 to n do\n    s := s + i;\n  writeln('Tong = ', s);\nend.", title: 'bai1.pas', th: 'sang', num: true, fs: 14, w: 420, h: 220 }],
      codeSql: ['Khối truy vấn SQL', { ve: 'code', lang: 'sql', src: 'SELECT MaHS, HoTen, DiemTB\nFROM HocSinh\nWHERE DiemTB >= 8.0\nORDER BY DiemTB DESC;', title: 'query.sql', th: 'sang', num: true, fs: 14, w: 420, h: 170 }],
      codePseudo: ['Mã giả thuật toán', { ve: 'code', lang: 'pseudo', src: 'Bước 1: Nhập n\nBước 2: Gán s ← 0, i ← 1\nBước 3: Trong khi i ≤ n làm\n    s ← s + i\n    i ← i + 1\nBước 4: Xuất s\nBước 5: Kết thúc', title: 'ThuatToan.txt', th: 'sang', num: false, fs: 14, w: 420, h: 180 }]
    }],
    ['Sơ đồ khối', 'tin', {
      flowMau: ['Sơ đồ khối tuần tự (tính tổng)', { ve: 'flow', code: 'a = int(input())\nb = int(input())\ns = a + b\nprint(s)', fs: 14, w: 340, h: 420 }],
      flowReNhanh: ['Sơ đồ khối rẽ nhánh (if - else)', { ve: 'flow', code: 'x = int(input())\nif x > 0:\n    print("Dương")\nelse:\n    print("Không dương")', fs: 14, w: 440, h: 380 }],
      flowLap: ['Sơ đồ khối vòng lặp (while)', { ve: 'flow', code: 's = 0\ni = 1\nwhile i <= n:\n    s = s + i\n    i = i + 1\nprint(s)', fs: 14, w: 380, h: 440 }]
    }],
    ['Khối lệnh Scratch', 'tin', {
      scratchMau: ['Khối Scratch (di chuyển & tính điểm)', { ve: 'scratch', src: 'when flag clicked\nset [diem v] to (0)\nrepeat (10)\n  move (10) steps\n  change [diem v] by (1)\nend\nsay [Hoàn thành!] for (2) seconds', w: 340, h: 220 }],
      scratchReNhanh: ['Khối Scratch rẽ nhánh (nếu - thì)', { ve: 'scratch', src: 'when flag clicked\nif <(diem) > (5)> then\n  say [Đạt] for (2) seconds\nelse\n  say [Chưa đạt] for (2) seconds\nend', w: 340, h: 240 }]
    }]
  ];

  const KINDS = {}, MON = {};
  GROUPS.forEach((g) => {
    for (const k in g[2]) {
      KINDS[k] = g[2][k];
      MON[k] = g[1];
    }
  });

  const FIELDS = {
    code: [
      ['src', 'Đoạn mã nguồn', 'area'],
      ['lang', 'Ngôn ngữ', 'sel', CODE_LANGS],
      ['title', 'Tiêu đề thanh trên (để trống nếu không cần)'],
      ['th', 'Giao diện', 'sel', { sang: 'Sáng (SGK / in ấn)', toi: 'Tối (Dark mode)' }],
      ['hl', 'Dòng làm nổi bật (vd 2, 4-6)'],
      ['num', 'Hiện số dòng', 'chk'],
      ['fs', 'Cỡ chữ', 'num']
    ],
    flow: [
      ['code', 'Sinh tự động từ mã Python (sửa mã rồi bấm ra ngoài)', 'area'],
      ['fs', 'Cỡ chữ', 'num'],
      ['color', 'Màu nét', 'color']
    ],
    scratch: [
      ['src', 'Kịch bản khối Scratch (mỗi dòng một lệnh)', 'area']
    ]
  };

  const HELP = {
    code: 'Hỗ trợ các ngôn ngữ Tin học phổ thông: Python, C++, Pascal, SQL, JavaScript và Mã giả tiếng Việt. Tự động thụt lề, tô màu từ khoá, số dòng và đánh dấu dòng cần chú ý (nhập "2, 4-6" ở ô Dòng làm nổi bật).',
    flow: 'Sơ đồ khối thuật toán chuẩn SGK (ô van bắt đầu/kết thúc, hình bình hành nhập/xuất, hình chữ nhật xử lý, hình thoi điều kiện rẽ nhánh). Có thể nhập trực tiếp đoạn mã Python ngắn để tự động tạo sơ đồ khối!',
    scratch: 'Dựng các khối lệnh ghép Scratch 3 dạng vector sắc nét. Hỗ trợ cả câu lệnh tiếng Anh (when flag clicked, repeat, move...) và tiếng Việt SGK (khi bấm vào cờ xanh, lặp lại, di chuyển...).'
  };

  const fieldUse = (o, key) => true;
  const fieldLabel = (o, key, label) => label;

  const api = {
    render,
    renderCode,
    renderFlow,
    renderScratch,
    codeTokens,
    flowFromPython,
    GROUPS,
    KINDS,
    MON,
    FIELDS,
    HELP,
    fieldUse,
    fieldLabel,
    CODE_LANGS,
    CODE_KW,
    CODE_TYPES,
    CODE_PAL
  };

  root.TinHoc = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
