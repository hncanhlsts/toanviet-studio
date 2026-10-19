// Bài giải AI → nội dung chuẩn: đọc bài giải dán từ ChatGPT, Gemini, Copilot… (HTML hoặc văn bản Markdown/LaTeX),
// bỏ phần thừa của trợ lí AI, dựng bố cục (Câu, Lời giải, ý a) b)…), chuẩn hoá ký hiệu theo SGK Kết nối tri thức.
// Kết quả là nội dung theo cú pháp của skill "toanviet-loi-giai-sgk" (references/markup.md):
//   #T tiêu đề · #H1/#H2 đề mục · #C Câu n. · #G Lời giải · - gạch đầu dòng · $…$ trong dòng · $$…$$ riêng dòng ·
//   #TAB … #ENDTAB bảng (mỗi dòng |ô|ô|) · **chữ đậm**
// Không cần tài khoản AI: mọi quy tắc chạy ngay trong máy. Dùng được cả trong trình duyệt (BaiGiai) và Node (kiểm thử).
(function (root) {
  'use strict';

  // ---------- Quy tắc ----------
  // dòng "xã giao" của trợ lí AI (chỉ bỏ khi cả dòng là chữ, không có công thức)
  const FILLER = /^(chắc chắn rồi|dưới đây là|sau đây là|đây là (lời giải|bài giải|cách giải)|tuyệt vời|rất vui|hy vọng|hi vọng|chúc (bạn|em|các em)|nếu (bạn|em) (cần|muốn|có|thấy)|bạn có muốn|em có muốn|mình sẽ|tôi sẽ|cùng (giải|tìm hiểu|xem)|hãy cùng|ok[,!. ]|được rồi|lưu ý: (tôi|mình) là)/i;
  const CAU = /^(câu|bài|ví dụ|bài tập|câu hỏi|vd)\s*(\d+[a-z]?)\s*([.:)]|\s|$)/i;
  const GIAI = /^(lời giải|giải|bài giải|hướng dẫn giải|hướng dẫn|cách giải)\s*(chi tiết)?\s*[:.]?\s*$/i;
  // quy tắc cho mã LaTeX (theo references/chuan-trinh-bay-sgk.md); mỗi quy tắc có tên để báo người dùng đã sửa gì
  const TEX_RULES = [
    ['song song viết ⫽ như SGK', /\\parallel(?![a-zA-Z])/g, '⫽'],
    ['tam giác viết Δ', /\\triangle\s*(?=[A-Z])/g, '\\Delta '],
    ['đồng dạng kiểu SGK', /(\\Delta\s*[A-Z]{3})\s*\\sim\s*(?=\\Delta)/g, '$1\\dongdang '],
    ['góc viết mũ rộng (\\widehat)', /\\angle\s*\{?([A-Z]{3})\}?/g, '\\widehat{$1}'],
    ['vectơ có mũi tên đủ dài (\\overrightarrow)', /\\vec\s*\{\s*([A-Z]{2})\s*\}/g, '\\overrightarrow{$1}'],
    ['tập rỗng viết ∅ (\\varnothing)', /\\emptyset(?![a-zA-Z])/g, '\\varnothing'],
    ['tương đương viết ⇔', /\\(iff|Longleftrightarrow)(?![a-zA-Z])/g, '\\Leftrightarrow'],
    ['suy ra viết ⇒', /\\(implies|Longrightarrow)(?![a-zA-Z])/g, '\\Rightarrow'],
    ['bỏ \\displaystyle', /\\displaystyle\s*/g, ''],
    ['bỏ đánh số phương trình (\\tag)', /\\tag\*?\{[^{}]*\}/g, ''],
  ];
  // khoảng, đoạn, toạ độ: dấu phẩy → dấu chấm phẩy ([-3, 4) → [-3; 4), A(1, 2) → A(1; 2))
  const TUPLE = /(\\left)?([[(])\s*([^[\](){},;]+?)\s*,\s*([^[\](){},;]+?)(?:\s*,\s*([^[\](){},;]+?))?\s*(\\right)?([\])])/g;
  const DEC = /(^|[^\w.{])(\d+)\.(\d+)(?![\w.])/g; // số thập phân 1.5 → 1{,}5

  function cleanTex(tex, inline, notes) {
    let t = String(tex).replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const note = (k) => { if (notes) notes[k] = (notes[k] || 0) + 1; };
    for (const [name, re, rep] of TEX_RULES) { const t2 = t.replace(re, rep); if (t2 !== t) { note(name); t = t2; } }
    const t3 = t.replace(TUPLE, (m, l, o, a, b, c, r, e) => (l || '') + o + a + ';' + b + (c ? ';' + c : '') + (r || '') + e);
    if (t3 !== t) { note('khoảng, đoạn, toạ độ dùng dấu chấm phẩy'); t = t3; }
    const t4 = t.replace(DEC, '$1$2{,}$3');
    if (t4 !== t) { note('số thập phân dùng dấu phẩy'); t = t4; }
    // phân số trong dòng chữ viết \dfrac cho rõ như SGK (chỉ khi có đúng một phân số, tránh phân số lồng quá to)
    if (inline && (t.match(/\\frac(?![a-z])/g) || []).length === 1) { t = t.replace(/\\frac(?![a-z])/, '\\dfrac'); note('phân số trong dòng viết cỡ lớn (\\dfrac)'); }
    // nhiều dòng nối bằng \\ mà không nằm trong môi trường nào: công thức nhiều dòng
    if (/\\\\/.test(t) && !/\\begin\{/.test(t)) t = '\\displaylines{' + t + '}';
    t = t.replace(/\\begin\{(align|alignat|eqnarray)\*?\}/g, '\\begin{aligned}').replace(/\\end\{(align|alignat|eqnarray)\*?\}/g, '\\end{aligned}')
      .replace(/\\(begin|end)\{(equation|gather)\*?\}/g, '');
    return t.trim();
  }

  // ---------- Văn bản (Markdown + LaTeX) → nội dung chuẩn ----------
  function fromText(input) {
    const notes = {};
    const note = (k, n) => { notes[k] = (notes[k] || 0) + (n || 1); };
    let s = String(input || '').replace(/\r\n?/g, '\n').replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\u00a0/g, ' ');
    // trích dẫn, đánh dấu nguồn của trợ lí AI
    const s0 = s;
    s = s.replace(/\[cite(?:_start|_end)?(?::[^\]]*)?\]/gi, '').replace(/【[^】]*】/g, '').replace(/\[\d+(?:,\s*\d+)*\](?=\s|$|[.,;])/g, '');
    if (s !== s0) note('bỏ đánh dấu trích dẫn của AI ([cite…])');
    // biểu tượng cảm xúc
    const s1 = s; s = s.replace(/\p{Extended_Pictographic}\ufe0f?/gu, ''); if (s !== s1) note('bỏ biểu tượng cảm xúc');
    // khối mã ```…```: bỏ dấu rào, giữ nội dung
    s = s.replace(/^```[a-z]*\s*$/gim, '');
    // \[ … \] và $$ … $$ (có thể nhiều dòng) → một dòng $$…$$ riêng; \( … \) → $…$
    s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, x) => '\n$$' + x.replace(/\s*\n\s*/g, ' ') + '$$\n');
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, x) => '\n$$' + x.replace(/\s*\n\s*/g, ' ') + '$$\n');
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, (m, x) => '$' + x.replace(/\s*\n\s*/g, ' ') + '$');
    const lines = s.split('\n');
    const out = [];
    let first = true;
    for (let i = 0; i < lines.length; i++) {
      let ln = lines[i].trim();
      if (!ln) continue;
      if (/^([-*_]\s*){3,}$/.test(ln)) continue; // đường kẻ ngang Markdown
      // bảng Markdown: các dòng liền nhau bắt đầu bằng |
      if (ln.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          const r = lines[i].trim();
          if (!/^\|?\s*:?-{2,}/.test(r.replace(/^\|\s*/, '')) || /[^\s|:-]/.test(r)) rows.push(r.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim().replace(/^\*\*(.*)\*\*$/, '$1')));
          i++;
        }
        i--;
        if (rows.length) { out.push('#TAB'); rows.forEach((r) => out.push('|' + r.join('|') + '|')); out.push('#ENDTAB'); note('bảng', 0); }
        continue;
      }
      // đề mục Markdown
      let level = 0;
      const h = /^(#{1,6})\s+(.*)$/.exec(ln);
      if (h) { level = h[1].length; ln = h[2].trim(); }
      const plain = ln.replace(/\*\*/g, '').replace(/^\*(.*)\*$/, '$1').trim();
      // câu "xã giao" của AI
      if (!/\$/.test(plain) && FILLER.test(plain)) { note('bỏ câu dẫn / câu chào của AI'); continue; }
      // Lời giải
      if (GIAI.test(plain)) { out.push(/^lời giải$/i.test(plain.replace(/[:.]\s*$/, '')) ? '#G' : '#G ' + plain.replace(/[:.]\s*$/, '')); continue; }
      // Câu n. / Bài n. …: nhãn câu đậm, phần còn lại thành đoạn riêng
      const lnNoBold = ln.replace(/^\*\*(.+?)\*\*\s*/, '$1 ');
      const c = CAU.exec(lnNoBold.replace(/^\*\*/, ''));
      if (c && (level || /^\*\*/.test(ln) || /[.:)]/.test(c[3]))) {
        const body = lnNoBold.replace(/^\*\*/, '');
        const m = /^((?:câu|bài|ví dụ|bài tập|câu hỏi|vd)\s*\d+[a-z]?\s*(?:\([^)]*\))?\s*[.:)]?)\s*(.*)$/i.exec(body);
        out.push('#C ' + m[1].replace(/\*\*/g, '').trim().replace(/\s*[:)]$|(\d[a-z]?)$/i, (x, d) => (d ? d + '.' : '.'))); // "Câu 2:" → "Câu 2." như SGK
        if (m[2].replace(/\*\*/g, '').trim()) out.push(m[2].trim());
        continue;
      }
      if (level) {
        if (level === 1 && first) out.push('#T ' + plain);
        else out.push((level <= 1 ? '#H1 ' : '#H2 ') + plain);
        first = false;
        continue;
      }
      first = false;
      // gạch đầu dòng
      const b = /^[-*•+○◦▪▫]\s+(.*)$/.exec(ln);
      // mục là câu nhỏ "a) …", "**b)** …", "c. …": SGK không đặt gạch đầu dòng trước câu nhỏ
      if (b && /^(\*\*)?\s*[a-zđ]\s*[).](\*\*)?\s/i.test(b[1] + ' ')) { out.push(b[1]); continue; }
      if (b) { out.push('- ' + b[1]); continue; }
      // công thức riêng dòng lẫn trong đoạn: tách ra
      if (/\$\$/.test(ln) && !/^\$\$[^$]+\$\$$/.test(ln)) {
        ln.split(/(\$\$[^$]+\$\$)/).map((x) => x.trim()).filter(Boolean).forEach((x) => out.push(x));
        continue;
      }
      out.push(ln);
    }
    // chuẩn hoá công thức và phần chữ
    const res = out.map((ln) => {
      if (/^#(TAB|ENDTAB)$/.test(ln)) return ln;
      const disp = /^\$\$([^$]+)\$\$$/.exec(ln);
      if (disp) return '$$' + cleanTex(disp[1], false, notes) + '$$';
      return ln.replace(/\$\$([^$]+)\$\$|\$([^$]+)\$/g, (m, d, i2) => (d ? '$$' + cleanTex(d, false, notes) + '$$' : '$' + cleanTex(i2, true, notes) + '$'))
        // *nghiêng* và `mã` của Markdown: bỏ dấu (giữ **đậm** để in đậm)
        .replace(/(^|[^*])\*([^*\s$][^*$]*?)\*(?!\*)/g, '$1$2').replace(/`([^`]+)`/g, '$1');
    });
    delete notes['bảng'];
    return { markup: res.join('\n'), notes };
  }

  // ---------- HTML (dán từ trang web trợ lí AI) → văn bản Markdown + LaTeX ----------
  // Trang ChatGPT, Gemini… vẽ công thức bằng KaTeX / MathJax nhưng vẫn giữ mã LaTeX gốc trong HTML khi sao chép:
  // lấy đúng mã đó (chính xác hơn nhiều so với chữ Unicode như "x² − 4x + 3 ≥ 0").
  function texOfMath(el) {
    const ann = el.querySelector && el.querySelector('annotation[encoding="application/x-tex"], annotation[encoding="TeX"], annotation[encoding="application/x-latex"]');
    if (ann) return ann.textContent;
    for (const a of ['data-math', 'data-latex', 'data-tex', 'alttext', 'data-formula']) { const v = el.getAttribute && el.getAttribute(a); if (v) return v; }
    const sc = el.querySelector && el.querySelector('script[type^="math/tex"]');
    if (sc) return sc.textContent;
    const m = el.querySelector && el.querySelector('math[alttext]');
    if (m) return m.getAttribute('alttext');
    return null;
  }
  function fromHtml(html) {
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const body = doc.body;
    body.querySelectorAll('script:not([type^="math/tex"]), style, button, svg, nav, header, footer').forEach((e) => e.remove());
    // công thức: thay cả khối hiển thị bằng mã LaTeX
    const MATH = '.katex-display, .katex, mjx-container, .MathJax, .MathJax_Display, math, [data-math], [data-latex], [data-tex], .math-block, .math-inline, img.latex, img[alt^="\\\\"]';
    let guard = 0;
    for (;;) {
      const el = body.querySelector(MATH);
      if (!el || guard++ > 5000) break;
      // lấy phần tử ngoài cùng của công thức (vd .katex-display bọc .katex)
      let top = el;
      while (top.parentElement && top.parentElement !== body && top.parentElement.matches(MATH)) top = top.parentElement;
      let tex = texOfMath(top) || (top.tagName === 'IMG' ? top.getAttribute('alt') : null);
      const disp = top.matches('.katex-display, .MathJax_Display, .math-block, [display="block"], mjx-container[display="true"]') || (top.tagName === 'MATH' && top.getAttribute('display') === 'block') || !!top.querySelector('.katex-display, math[display="block"]');
      if (tex == null) tex = top.textContent; // không có mã gốc: giữ chữ đang hiển thị
      const t = doc.createTextNode(disp ? '\n$$' + tex.trim() + '$$\n' : '$' + tex.trim() + '$');
      top.replaceWith(t);
    }
    const BLOCK = /^(P|DIV|SECTION|ARTICLE|BLOCKQUOTE|PRE|UL|OL|TABLE|TBODY|THEAD|H[1-6]|LI|TR|HR)$/;
    const walk = (n) => {
      if (n.nodeType === 3) return n.textContent.replace(/[ \t\r\n]+/g, ' ');
      if (n.nodeType !== 1) return '';
      const tag = n.tagName;
      const kids = () => [...n.childNodes].map(walk).join('');
      if (tag === 'BR') return '\n';
      if (tag === 'HR') return '\n';
      if (/^H[1-6]$/.test(tag)) return '\n' + '#'.repeat(+tag[1]) + ' ' + kids().replace(/\n+/g, ' ').trim() + '\n';
      if (tag === 'STRONG' || tag === 'B') { const k = kids(); return k.trim() ? '**' + k.trim() + '**' + (/\s$/.test(k) ? ' ' : '') : k; }
      if (tag === 'LI') {
        const ol = n.parentElement && n.parentElement.tagName === 'OL';
        const idx = ol ? [...n.parentElement.children].indexOf(n) + (+n.parentElement.getAttribute('start') || 1) : 0;
        return '\n' + (ol ? idx + '. ' : '- ') + kids().replace(/\n+/g, ' ').trim() + '\n';
      }
      if (tag === 'TABLE') {
        return '\n' + [...n.querySelectorAll('tr')].map((tr) => '|' + [...tr.children].map((td) => walk(td).replace(/[\n|]+/g, ' ').trim()).join('|') + '|').join('\n') + '\n';
      }
      if (BLOCK.test(tag)) return '\n' + kids() + '\n';
      return kids();
    };
    return walk(body).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  }

  // các công thức (khác nhau) có trong nội dung chuẩn (bỏ qua dòng khai báo hình #FIG)
  function formulas(markup) {
    const set = new Set();
    String(markup).split('\n').forEach((ln) => { if (/^#FIG /.test(ln)) return; const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g; let m; while ((m = re.exec(ln))) set.add((m[1] || m[2]).trim()); });
    return [...set];
  }

  // ---------- Tự thêm hình ở chỗ SGK có hình (bước 3 của skill) ----------
  // Hình khai báo bằng một dòng "#FIG <khoá> <JSON đối tượng ToanViet>" (không in) và đặt bằng dòng "[FIG <khoá>|Hình n]".
  // LaTeX → biểu thức kiểu ToanViet (x^2 - 3x, (2x+1)/(x-1), sqrt(x)…)
  function texToExpr(t) {
    // giữ dấu xuống dòng \\ của hệ (thành ⏎) trước khi bỏ các khoảng trắng \, \; \  …
    let s = String(t).replace(/\\\\/g, ' ⏎ ').replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\q?quad/g, ' ').replace(/\{,\}/g, '.').replace(/−/g, '-')
      .replace(/\\(cdot|times)(?![a-z])/g, '*').replace(/\\(le|leq|leqslant)(?![a-z])|≤/g, '<=').replace(/\\(ge|geq|geqslant)(?![a-z])|≥/g, '>=')
      .replace(/\\[dt]frac/g, '\\frac').replace(/\\pi(?![a-z])/g, 'pi').replace(/\\infty/g, 'oo').replace(/\\(sin|cos|tan|cot|ln|log)(?![a-z])/g, '$1 ');
    for (let i = 0; i < 30; i++) {
      const s2 = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)')
        .replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\\frac\s*(\d)(\d)/g, '($1/$2)').replace(/\\sqrt\s*(\w)/g, 'sqrt($1)');
      if (s2 === s) break;
      s = s2;
    }
    return s.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  }
  // biểu thức bậc nhất theo x, y → { a, b, c } (a·x + b·y + c); không phải bậc nhất thì null
  function linear(expr) {
    const e = String(expr).replace(/\s+/g, '').replace(/(\d|\))(?=[xy(])/g, '$1*').replace(/([xy])(?=[xy(\d])/g, '$1*').replace(/\)(?=\()/g, ')*').replace(/\^/g, '**');
    if (!/^[0-9xy+\-*/().]+$/.test(e) || !/[xy]/.test(e)) return null;
    let f;
    try { f = new Function('x', 'y', 'return ' + e); f(0, 0); } catch (err) { return null; }
    const c = f(0, 0), a = f(1, 0) - c, b = f(0, 1) - c;
    if (![a, b, c].every(isFinite) || Math.abs(f(2, 3) - (2 * a + 3 * b + c)) > 1e-9 || Math.abs(f(-1.5, 4.25) - (-1.5 * a + 4.25 * b + c)) > 1e-9) return null;
    return { a, b, c };
  }
  const NUM = (v) => { const r = Math.round(v * 1e6) / 1e6; return String(r); };
  // hàm một biến x (cú pháp ToanViet) → hàm JS để tính giá trị (chỉ cho phép số, x, phép toán và hàm toán học quen thuộc)
  function compileFn(expr) {
    let e = String(expr).replace(/\s+/g, '').replace(/\|([^|]+)\|/g, 'abs($1)');
    e = e.replace(/(\d|\))(?=[a-z(])/g, '$1*').replace(/x(?=[a-z\d(])/g, 'x*').replace(/\)(?=\()/g, ')*').replace(/\^/g, '**');
    e = e.replace(/\b(sqrt|sin|cos|tan|abs|exp)\b/g, 'Math.$1').replace(/\bln\b/g, 'Math.log').replace(/\blog\b/g, 'Math.log10').replace(/\bpi\b/g, 'Math.PI').replace(/\be\b/g, 'Math.E');
    if (!/^[0-9x+\-*/(). ]*$/.test(e.replace(/Math\.(sqrt|sin|cos|tan|abs|exp|log10|log|PI|E)/g, ''))) return null;
    try { const f = new Function('x', 'return ' + e); f(0.37); return f; } catch (err) { return null; }
  }
  const niceStep = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
  // a x + b y (op) k → chuỗi kiểu ToanViet "2x - y <= 6"
  function lineStr(a, b, op, k) {
    const term = (co, v, first) => { if (Math.abs(co) < 1e-12) return ''; const sg = co < 0 ? '-' : '+', m = Math.abs(co), t = (Math.abs(m - 1) < 1e-12 ? '' : NUM(m)) + v; return first ? (co < 0 ? '-' : '') + t : ' ' + sg + ' ' + t; };
    let s = term(a, 'x', true); s += term(b, 'y', !s);
    return s + ' ' + op + ' ' + NUM(k);
  }
  function figures(markup) {
    const notes = {};
    const lines = String(markup).split('\n').filter((l) => !/^#FIG /.test(l) && !/^\[FIG /.test(l));
    const out = [], specs = [];
    let fig = 0;
    // chia theo câu / đề mục: mỗi khối xét riêng
    const blocks = [];
    let cur = [];
    lines.forEach((l) => { if (/^#(C|D|H1|H2) /.test(l) && cur.length) { blocks.push(cur); cur = []; } cur.push(l); });
    if (cur.length) blocks.push(cur);
    const mathOf = (l) => { const r = []; const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g; let m; while ((m = re.exec(l))) r.push((m[1] || m[2]).trim()); return r; };
    const addFig = (blk, at, type, props, caption, scale) => {
      fig++;
      const key = 'h' + fig, cap = 'Hình ' + fig;
      specs.push('#FIG ' + key + ' ' + JSON.stringify(Object.assign({ type }, props, { scale })));
      // nhắc tới hình trong đoạn: "… (Hình n)."
      if (at >= 0 && !/\[FIG|^#|^\$\$/.test(blk[at])) blk[at] = blk[at].replace(/([.:;]?)\s*$/, (m, p) => ' (' + cap + ')' + (p || '.'));
      blk.splice(at + 1, 0, '[FIG ' + key + '|' + (caption || cap) + ']');
    };
    for (const blk of blocks) {
      const text = blk.join('\n');
      const f0 = fig;
      // --- miền nghiệm hệ bất phương trình bậc nhất hai ẩn ---
      // (cả khi đề không nói "miền nghiệm" mà cho hệ hai ẩn x, y rồi hỏi GTLN, GTNN… như bài toán tối ưu SGK)
      const sysXY = /\\begin\{cases\}/.test(text) && /x/.test(text) && /y/.test(text) && /GTLN|GTNN|giá trị (?:lớn|nhỏ) nhất|tối ưu|thoả mãn|thỏa mãn|hệ bất phương trình/i.test(text);
      if (/miền nghiệm/i.test(text) || sysXY) {
        const lns = [], ineqs = [], pts = [];
        const fnLetters = new Set((text.match(/([A-Z])\s*\(\s*x\s*[;,]\s*y\s*\)/g) || []).map((s) => s[0]));
        blk.forEach((l) => {
          mathOf(l).forEach((m) => {
            const plain = texToExpr(m);
            // điểm có toạ độ: A(0; 3)
            const pr = /([A-Z])\s*\(\s*(-?[\d.]+)\s*;\s*(-?[\d.]+)\s*\)/g; let pm;
            while ((pm = pr.exec(plain))) if (!fnLetters.has(pm[1])) pts.push([pm[1], +pm[2], +pm[3]]);
            // hệ / các bất phương trình (kể cả trong \begin{cases})
            // "x, y >= 0" → hai bất phương trình x >= 0, y >= 0
            plain.replace(/\\begin\w*|\\end\w*|cases|array|aligned/g, ' ').replace(/(^|⏎|&)\s*x\s*[,;]\s*y\s*(<=|>=|<|>)\s*(-?[\d.]+)/g, '$1 x$2$3 ⏎ y$2$3').split(/⏎|&|,(?![^(]*\))/).forEach((row) => {
              const q = /^([^<>=]+)(<=|>=|<|>)([^<>=]+)$/.exec(row.trim());
              if (!q) return;
              const L = linear(q[1]), R = linear(q[3]) || (isFinite(+q[3]) ? { a: 0, b: 0, c: +q[3] } : null);
              if (L && R && (L.a - R.a || L.b - R.b)) ineqs.push({ a: L.a - R.a, b: L.b - R.b, k: R.c - L.c, op: q[2] });
            });
            // đường thẳng: "d_1: x + y = 3" hoặc phương trình bậc nhất x, y nằm trong câu nói về đường thẳng / trục
            const nm = /^\s*(d_?\{?\d+\}?|d'+|\\Delta(?:_\{?\d+\}?)?)\s*:\s*(.+)$/.exec(plain);
            const eqs = nm ? nm[2] : plain;
            const e = /^([^<>=]+)=([^<>=]+)$/.exec(eqs.trim());
            if (e && (nm || /đường thẳng|trục|bờ|biên/i.test(l))) {
              const L = linear(e[1]), R = linear(e[2]) || (isFinite(+e[2]) ? { a: 0, b: 0, c: +e[2] } : null);
              if (L && R && (L.a - R.a || L.b - R.b)) {
                const name = nm ? nm[1].replace(/^d_?\{?(\d+)\}?$/, 'd_{$1}') : '';
                const ln = { a: L.a - R.a, b: L.b - R.b, k: R.c - L.c, name };
                if (!lns.some((o) => Math.abs(o.a * ln.b - o.b * ln.a) < 1e-9 && Math.abs(o.a * ln.k - o.k * ln.a) < 1e-9 && Math.abs(o.b * ln.k - o.k * ln.b) < 1e-9)) lns.push(ln);
              }
            }
          });
        });
        // đỉnh: điểm nằm trên ít nhất hai đường biên
        const onL = (p, l) => Math.abs(l.a * p[1] + l.b * p[2] - l.k) < 1e-6;
        const verts = pts.filter((p, i) => lns.filter((l) => onL(p, l)).length >= 2 && !pts.slice(0, i).some((q) => q[1] === p[1] && q[2] === p[2]));
        let rows = null, lnames = null;
        if (ineqs.length >= 2) {
          rows = ineqs.map((q) => lineStr(q.a, q.b, q.op, q.k));
          // tên đường thẳng theo lời giải; không có thì d₁, d₂… cho các đường không trùng trục toạ độ
          let nd = 0;
          lnames = ineqs.map((q) => { const l = lns.find((o) => Math.abs(o.a * q.b - o.b * q.a) < 1e-9 && Math.abs(o.a * q.k - o.k * q.a) < 1e-9 && Math.abs(o.b * q.k - o.k * q.b) < 1e-9); return l && l.name ? l.name : ''; });
          if (lnames.every((n) => !n)) lnames = ineqs.map((q) => ((Math.abs(q.a) < 1e-12 || Math.abs(q.b) < 1e-12) && Math.abs(q.k) < 1e-12 ? '' : 'd_{' + (++nd) + '}'));
        } else if (lns.length >= 2 && verts.length >= 2) {
          // chưa có hệ: suy ra chiều mỗi bất phương trình từ các đỉnh của miền (trọng tâm các đỉnh nằm trong miền)
          const cx = verts.reduce((s, p) => s + p[1], 0) / verts.length, cy = verts.reduce((s, p) => s + p[2], 0) / verts.length;
          const strict = /không kể (cả )?bờ/i.test(text);
          rows = lns.map((l) => lineStr(l.a, l.b, (l.a * cx + l.b * cy - l.k >= 0 ? (strict ? '>' : '>=') : (strict ? '<' : '<=')), l.k));
          lnames = lns.map((l) => l.name);
          notes['miền nghiệm: suy ra hệ bất phương trình từ các đường biên và đỉnh trong lời giải'] = 1;
        }
        if (rows) {
          // khung hình bao các đỉnh và giao điểm với trục, có gốc toạ độ
          const xs = [0], ys = [0];
          verts.forEach((p) => { xs.push(p[1]); ys.push(p[2]); });
          // chưa đủ đỉnh (miền không bị chặn, hệ cho sẵn): thêm giao điểm của các đường biên với hai trục
          if (verts.length < 2) {
            // tự tìm đỉnh của miền (giao từng cặp đường biên, thoả mọi bất phương trình): miền bị chặn thì khung gọn quanh các đỉnh
            const bd = ineqs.length ? ineqs : lns, ok = (x, y) => ineqs.every((q) => { const v = q.a * x + q.b * y - q.k; return q.op[0] === '<' ? v <= 1e-7 : v >= -1e-7; });
            const cs = [];
            for (let i = 0; i < bd.length; i++) for (let j = i + 1; j < bd.length; j++) {
              const p = bd[i], r = bd[j], det = p.a * r.b - p.b * r.a;
              if (Math.abs(det) < 1e-12) continue;
              const x = (p.k * r.b - p.b * r.k) / det, y = (p.a * r.k - p.k * r.a) / det;
              if (ok(x, y)) cs.push([x, y]);
            }
            const bounded = cs.length >= 3 && ineqs.length >= 3 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => ineqs.some((q) => (q.op[0] === '<' ? 1 : -1) * (q.a * dx + q.b * dy) > 1e-9));
            if (bounded) cs.forEach((p) => { xs.push(p[0]); ys.push(p[1]); });
            else lns.concat(ineqs).forEach((l) => { if (Math.abs(l.a) > 1e-9) xs.push(l.k / l.a); if (Math.abs(l.b) > 1e-9) ys.push(l.k / l.b); });
          }
          // bước chia "đẹp" (1, 2, 5, 10, 20, 50…) để trục có khoảng 6–10 vạch
          const nice = (x) => { const p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };
          const span = (v) => { const lo = Math.min(...v), hi = Math.max(...v), r = Math.max(hi - lo, 1); const st = r <= 12 ? 1 : nice(r / 6); return { lo: Math.floor(Math.min(lo - r * 0.12, -r * 0.06)), hi: Math.ceil(hi + r * 0.3), st }; };
          const X = span(xs), Y = span(ys);
          const at = blk.findIndex((l) => /miền nghiệm/i.test(l) && !/^#/.test(l));
          addFig(blk, at >= 0 ? at : blk.length - 1, 'region', {
            ineqs: rows.join('\n'), lnames: lnames.join('\n'), vnames: verts.map((p) => p[0] + '(' + NUM(p[1]) + '; ' + NUM(p[2]) + ')').join('\n'),
            style: 'hatch', vertices: true, lineNames: true, grid: false, ticks: true, w: 380, h: 380,
            xmin: String(X.lo), xmax: String(X.hi), ymin: String(Y.lo), ymax: String(Y.hi), xstep: String(X.st), ystep: String(Y.st),
          }, '', 0.82);
          notes['thêm hình miền nghiệm'] = (notes['thêm hình miền nghiệm'] || 0) + 1;
        }
      }
      // --- bảng biến thiên / bảng xét dấu: hàm số trong khối + thay bảng Markdown của AI ---
      for (const [kind, re, type] of [['bảng biến thiên', /bảng biến thiên|lập bảng biến thiên|khảo sát/i, 'bbt'], ['bảng xét dấu', /xét dấu|bảng xét dấu/i, 'sign']]) {
        if (!re.test(blk.join('\n'))) continue;
        let expr = null;
        for (const l of blk) {
          for (const m of mathOf(l)) {
            const f = /^\s*(?:y|f\s*\(\s*x\s*\)|g\s*\(\s*x\s*\))\s*=\s*(.+)$/.exec(m);
            if (f && !/[<>]|\\[lg]e/.test(f[1])) { const ex = texToExpr(f[1]); if (/x/.test(ex) && /^[0-9x+\-*/^(). a-z]+$/.test(ex) && !/[a-wyz]{2,}/.test(ex.replace(/sqrt|sin|cos|tan|cot|ln|log|pi|e/g, ''))) { expr = ex; break; } }
          }
          if (expr) break;
        }
        if (!expr) continue;
        // bảng AI tự kẻ (cột đầu có x, rồi y'/f'(x) hoặc f(x)): thay bằng hình
        let at = -1;
        for (let i = 0; i < blk.length; i++) {
          if (blk[i] !== '#TAB') continue;
          let j = i; while (j < blk.length && blk[j] !== '#ENDTAB') j++;
          const firstCol = blk.slice(i + 1, j).map((r) => (r.replace(/^\|/, '').split('|')[0] || '').replace(/\$/g, '').trim());
          if (firstCol[0] === 'x' && (type === 'bbt' ? firstCol.some((c) => /'|f'|y′/.test(c)) : firstCol.some((c) => /f\s*\(x\)|^y$/.test(c)))) { blk.splice(i, j - i + 1); at = i - 1; notes['thay bảng AI tự kẻ bằng ' + kind + ' ToanViet'] = 1; break; }
        }
        if (at < 0) at = blk.findIndex((l) => re.test(l) && !/^#/.test(l));
        addFig(blk, at >= 0 ? at : blk.length - 1, type, type === 'bbt' ? { expr, w: 520, h: 170 } : { expr, w: 480, h: 76 }, '', type === 'bbt' ? 0.8 : 0.8);
        notes['thêm ' + kind] = (notes['thêm ' + kind] || 0) + 1;
      }
      // --- hình không gian: đọc đề (src/dedehinh.js), vẽ ngay đầu lời giải như SGK ---
      const DH = root.DeHinh || (typeof require === 'function' ? require('./dedehinh.js') : null);
      if (DH && /(?:hình|khối)\s+(?:chóp|lăng trụ|hộp|lập phương|tứ diện|nón|trụ|cầu)(?![a-zà-ỹ])|chóp\s+\$?[A-Z]\s*\.|lăng trụ|lập phương|tứ diện|mặt cầu/i.test(blk.join('\n'))) {
        let sp = null;
        try { sp = DH.space(blk.filter((l) => !/^#(TAB|ENDTAB|FIG)/.test(l)).join('\n')); } catch (err) { sp = null; }
        if (sp && (sp.script || sp.round)) {
          const gi = blk.findIndex((l) => /^#G/.test(l));
          const at = gi >= 0 ? gi : blk.length - 1;
          // khối tròn xoay: không kèm kịch bản → dùng hình mẫu (kind) của phần mềm
          addFig(blk, at, 'space', sp.script ? { kind: sp.kind, script: sp.script, w: 360, h: 320 } : { kind: sp.kind, w: 360, h: 320 }, '', 0.75);
          notes['thêm hình không gian (đọc từ đề)'] = (notes['thêm hình không gian (đọc từ đề)'] || 0) + 1;
          sp.unknown.forEach((u) => { notes['hình không gian — chưa hiểu: "' + u.slice(0, 90) + '"'] = 1; });
        }
      }
      // --- tập hợp trên trục số: khoảng, đoạn có đầu mút là số và các phép ∪, ∩, \, phần bù ---
      {
        // điều kiện một ẩn → kí hiệu khoảng như SGK: "x < 2" → (-\infty;2), "-1 <= x < 3" → [-1;3); không đổi được thì giữ điều kiện
        const toIv = (c) => {
          const s = c.replace(/\s+/g, ''), N = '(-?\\d+(?:[.,]\\d+)?)';
          let m;
          if ((m = new RegExp('^x(<=|<|>=|>)' + N + '$').exec(s))) { const a = m[2].replace(',', '.'); return m[1][0] === '<' ? '(-\\infty;' + a + (m[1] === '<=' ? ']' : ')') : (m[1] === '>=' ? '[' : '(') + a + ';+\\infty)'; }
          if ((m = new RegExp('^' + N + '(<=|<)x(<=|<)' + N + '$').exec(s))) return (m[2] === '<=' ? '[' : '(') + m[1].replace(',', '.') + ';' + m[4].replace(',', '.') + (m[3] === '<=' ? ']' : ')');
          return c;
        };
        const txt = blk.join('\n'), named = [], ops = [];
        blk.forEach((l) => mathOf(l).forEach((m) => {
          let q;
          const re = /([A-Z])\s*=\s*((?:\\left)?[[(][^;[\]()]*;[^;[\]()]*(?:\\right)?[\])])/g;
          while ((q = re.exec(m))) if (!/[a-zA-Z]/.test(q[2].replace(/\\(infty|left|right|d?frac|sqrt)/g, '')) && !named.some((n) => n[0] === q[1])) named.push([q[1], q[1] + '=' + q[2].replace(/\s+/g, '')]);
          // tập viết bằng điều kiện trên ℝ: A = {x ∈ ℝ | x < 2}, {x ∈ ℝ | -1 ≤ x < 3} → dòng "A = x < 2" của trục số
          const rb = /([A-Z])\s*=\s*\\\{\s*x\s*\\in\s*\\mathbb\s*\{?R\}?\s*(?:\\mid|\||:)\s*([^{}]+?)\s*\\\}/g;
          while ((q = rb.exec(m))) { const c = q[2].replace(/\\(?:le|leq|leqslant)(?![a-z])/g, '<=').replace(/\\(?:ge|geq|geqslant)(?![a-z])/g, '>=').replace(/\\ne(?![a-z])/g, '<>').replace(/\s+/g, ' ').trim(); if (/^[-\dx<>=., ]+$/.test(c) && /x/.test(c) && !named.some((n) => n[0] === q[1])) named.push([q[1], q[1] + '=' + toIv(c)]); }
          // biểu thức tập hợp (kể cả có ngoặc): A \cup B, (A \cup B) \cap C, \mathbb{R} \setminus (A \cap B)
          const tk = m.replace(/\\left|\\right/g, '').replace(/\\mathbb\s*\{?R\}?/g, 'ℝ').replace(/\\cup/g, '∪').replace(/\\cap/g, '∩').replace(/\\setminus/g, '∖');
          (tk.match(/[()A-Zℝ∪∩∖\s]+/g) || []).forEach((run) => {
            let s = run.trim().replace(/^[)\s]+|[(\s]+$/g, '');
            while (/^\(/.test(s) && (s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) s = s.slice(1).trim();
            while (/\)$/.test(s) && (s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) s = s.slice(0, -1).trim();
            // phải là biểu thức giữa các tập có tên: có phép toán, ít nhất hai tên, không mở đầu / kết thúc bằng phép toán
            const cmp = s.replace(/\s+/g, '');
            if (!/[∪∩∖]/.test(cmp) || /[A-Z]{2}/.test(cmp) || (cmp.match(/[A-Zℝ]/g) || []).length < 2 || /^[(]*[∪∩∖]|[∪∩∖][)]*$/.test(cmp) || /[∪∩∖][)]|[(][∪∩∖]/.test(cmp)) return;
            const toLx = (x) => x.replace(/ℝ/g, '\\mathbb{R}').replace(/∪/g, '\\cup ').replace(/∩/g, '\\cap ').replace(/∖/g, '\\setminus ').replace(/\s+/g, ' ').trim();
            // biểu thức lồng nhau: dòng trung gian trong ngoặc trước, vd (A ∪ B) ∩ C → thêm dòng A ∪ B
            // "(A ∩ B)" đứng riêng: bỏ cặp ngoặc bao ngoài (cùng dòng với A ∩ B)
            if (/^\(/.test(s) && /\)$/.test(s)) { let d = 0, wrap = true; for (let i2 = 0; i2 < s.length; i2++) { if (s[i2] === '(') d++; else if (s[i2] === ')') d--; if (d === 0 && i2 < s.length - 1) { wrap = false; break; } } if (wrap) s = s.slice(1, -1).trim(); }
            const lx = toLx(s);
            (s.match(/\(([^()]*[∪∩∖][^()]*)\)/g) || []).forEach((g2) => { const inner = toLx(g2.slice(1, -1)); if (inner !== lx && !ops.includes(inner) && !ops.includes('(' + inner + ')')) ops.push(inner); });
            if (!ops.includes(lx)) ops.push(lx);
          });
          const rc = /C_\{?\s*\\mathbb\{?R\}?\s*\}?\s*(\([^()]*\)|[A-Z])/g;
          while ((q = rc.exec(m))) { const s = '\\mathbb{R}\\setminus ' + q[1].replace(/\s+/g, ' '); if (!ops.includes(s)) ops.push(s); }
        }));
        // "phần bù của (tập) $X$ trong $\mathbb{R}$"
        { const rp = /phần bù của\s+(?:tập\s+(?:hợp\s+)?)?\$([^$]+)\$\s+trong\s+\$\\mathbb\s*\{?R\}?\$/g; let q; while ((q = rp.exec(txt))) { const x = q[1].trim(), s = '\\mathbb{R}\\setminus ' + (/^[A-Z]$/.test(x) || /^\(.*\)$/.test(x) ? x : '(' + x + ')'); if (!ops.includes(s)) ops.push(s); } }
        const has = (n) => named.some((x) => x[0] === n);
        const okOps = ops.filter((s) => { const v = s.match(/(?:^|[^a-zA-Z\\{])([A-Z])(?![a-zA-Z])/g) || []; return v.map((x) => x.slice(-1)).every((n) => n === 'R' || has(n)); });
        if (named.length && (okOps.length || /trục số/i.test(txt))) {
          const sets = named.map((n) => n[1]).concat(okOps);
          let at = blk.findIndex((l) => /trục số/i.test(l) && !/^#/.test(l));
          if (at < 0) at = blk.findIndex((l) => !/^#/.test(l) && okOps.length && /\\(cup|cap|setminus)|C_/.test(l));
          addFig(blk, at >= 0 ? at : blk.length - 1, 'numline', { kind: okOps.length ? 'hop' : 'khoang', sets: sets.join('\n'), rowLabels: true, zero: false, colorful: okOps.length > 0, ticks: false, nums: true, style: 'hatch', w: 560, h: sets.length * 62 + 8 }, '', 0.8);
          notes['thêm hình tập hợp trên trục số'] = (notes['thêm hình tập hợp trên trục số'] || 0) + 1;
        }
      }
      // --- tập hợp hữu hạn (liệt kê phần tử): biểu đồ Ven có ghi phần tử, tô phần được hỏi ---
      if (fig === f0) {
        const fin = [];
        blk.forEach((l) => mathOf(l).forEach((m) => {
          const re = /([A-Z])\s*=\s*\\\{([^{}|]*?)\\\}/g; let q;
          while ((q = re.exec(m))) { const it = q[2].split(/[;,]/).map((s) => s.replace(/\\[,;: ]|\s+/g, '').replace(/\{,\}/g, ',')).filter(Boolean); if (it.length && it.length <= 12 && !fin.some((f) => f[0] === q[1])) fin.push([q[1], it]); }
        }));
        if (fin.length >= 2) {
          // tập bao (E, U, X chứa mọi tập khác)
          const uIdx = fin.findIndex((f) => /[EUX]/.test(f[0]) && fin.every((g) => g === f || g[1].every((x) => f[1].includes(x))));
          const uni = uIdx >= 0 ? fin[uIdx] : null, sets = fin.filter((f) => f !== uni).slice(0, 3);
          if (sets.length >= 2) {
            const names = sets.map((s) => s[0]);
            const all = [...new Set([].concat(...sets.map((s) => s[1]), uni ? uni[1] : []))];
            const reg = {};
            all.forEach((x) => { const k = names.filter((n, i) => sets[i][1].includes(x)).join('') || 'ngoài'; (reg[k] = reg[k] || []).push(x); });
            const disjoint = sets.length === 2 && !reg[names.join('')];
            const sub = sets.length === 2 && (sets[1][1].every((x) => sets[0][1].includes(x)));
            const layout = sets.length === 3 ? 'ba' : disjoint ? 'roi' : sub ? 'con' : 'hai';
            // vùng được hỏi: phần bù trong tập bao, hoặc phép toán đầu tiên giữa các tập này
            const sym = (s) => s.replace(/\\cup/g, '∪').replace(/\\cap/g, '∩').replace(/\\setminus/g, '∖').replace(/\\left|\\right|\s+/g, ' ').replace(/\s+/g, ' ').trim();
            let shade = '';
            const cpl = /phần bù của\s+(?:tập\s+(?:hợp\s+)?)?\$([^$]+)\$\s+trong\s+\$([A-Z])\$/.exec(text);
            if (cpl && uni && cpl[2] === uni[0]) shade = uni[0] + ' ∖ (' + sym(cpl[1]) + ')';
            else { const op = blk.map((l) => mathOf(l).map((m) => (/^[\sA-Z()\\a-z]+$/.test(m) && /\\(cup|cap|setminus)/.test(m) ? m : '')).find(Boolean)).find(Boolean); if (op) shade = sym(op); }
            const at = blk.findIndex((l) => !/^#/.test(l) && /\\(cup|cap|setminus)|phần bù/.test(l));
            addFig(blk, at >= 0 ? at : blk.length - 1, 'venn', {
              kind: 'phantu', layout, names: names.join(', '), elements: Object.keys(reg).map((k) => k + ': ' + reg[k].join('; ')).join('\n'),
              shade, unv: !!uni, uname: uni ? uni[0] : 'U', style: 'fill', w: sets.length === 3 ? 340 : 360, h: sets.length === 3 ? 300 : 230,
            }, '', 0.8);
            notes['thêm biểu đồ Ven'] = (notes['thêm biểu đồ Ven'] || 0) + 1;
          }
        }
      }
      // --- đồ thị hàm số ---
      if (/(vẽ|phác hoạ|phác họa|biểu diễn)\s+(đồ thị|parabol)|đồ thị (của )?(các )?hàm số/i.test(blk.join('\n'))) {
        const funcs = [];
        for (const l of blk) for (const m of mathOf(l)) {
          const f = /^\s*(?:y|[fgh]\s*\(\s*x\s*\))\s*=\s*(.+)$/.exec(m);
          if (f && !/[<>]|\\[lg]e/.test(f[1])) { const ex = texToExpr(f[1]); const fn = /x/.test(ex) && compileFn(ex); if (fn && !funcs.some((u) => u.ex === ex)) funcs.push({ ex, fn }); }
        }
        if (funcs.length && funcs.length <= 3) {
          // khung: bao các nghiệm, cực trị (tìm số) và gốc toạ độ
          const xs = [0];
          funcs.forEach(({ fn }) => {
            let pv = fn(-10), pd = fn(-9.99) - pv;
            for (let x = -9.99; x <= 10; x += 0.01) {
              const v = fn(x), d = v - pv;
              if (isFinite(v) && isFinite(pv)) { if (v === 0 || (v > 0) !== (pv > 0)) xs.push(x); if ((d > 0) !== (pd > 0) && Math.abs(d) < 1) xs.push(x); }
              pv = v; pd = d;
            }
          });
          const pts = [];
          blk.forEach((l) => mathOf(l).forEach((m) => { const re = /([A-Z])\s*\(\s*(-?[\d.]+)\s*;\s*(-?[\d.]+)\s*\)/g; let q; const p = texToExpr(m); while ((q = re.exec(p))) { const X = +q[2], Y = +q[3]; if (funcs.some(({ fn }) => Math.abs(fn(X) - Y) < 1e-6) && !pts.some((r) => r[0] === q[1])) { pts.push([q[1], X, Y]); xs.push(X); } } }));
          let lo = Math.min(...xs), hi = Math.max(...xs);
          if (hi - lo < 4) { const c = (lo + hi) / 2; lo = c - 2; hi = c + 2; }
          lo = Math.floor(lo - 1.2); hi = Math.ceil(hi + 1.2);
          // trục y theo các điểm đặc biệt (nghiệm, cực trị, giao với trục tung, điểm có tên) như SGK chọn khung
          const ys = [0];
          funcs.forEach(({ fn }) => xs.forEach((x) => { const v = fn(x); if (isFinite(v) && Math.abs(v) < 1e4) ys.push(v); }));
          pts.forEach((p) => ys.push(p[2]));
          let ylo = Math.min(...ys), yhi = Math.max(...ys);
          if (yhi - ylo < 4) { const c = (ylo + yhi) / 2; ylo = c - 2; yhi = c + 2; }
          ylo = Math.floor(ylo - 1); yhi = Math.ceil(yhi + 2);
          const xst = hi - lo <= 12 ? 1 : niceStep((hi - lo) / 8), yst = yhi - ylo <= 12 ? 1 : niceStep((yhi - ylo) / 8);
          let at = blk.findIndex((l) => /đồ thị/i.test(l) && !/^#/.test(l));
          addFig(blk, at >= 0 ? at : blk.length - 1, 'graph', {
            funcs: funcs.map((u) => u.ex).join('\n'), xmin: String(lo), xmax: String(hi), ymin: String(ylo), ymax: String(yhi), xstep: String(xst), ystep: String(yst),
            points: pts.map((p) => p[0] + '(' + NUM(p[1]) + '; ' + NUM(p[2]) + ')').join('\n'), grid: false, ticks: true, legend: true, proj: true, w: 380, h: 360,
          }, '', 0.8);
          notes['thêm đồ thị'] = (notes['thêm đồ thị'] || 0) + 1;
        }
      }
      // --- hình phẳng: đọc đề (src/dedehinh.js), vẽ ngay đầu lời giải; chỉ khi câu chưa có hình nào khác ---
      if (fig === f0 && DH && DH.plane && /tam giác|hình vuông|hình chữ nhật|hình bình hành|hình thoi|hình thang|tứ giác|đường tròn|thẳng hàng|nằm giữa|tia\s|đường thẳng|đường trung trực|kề bù|đối đỉnh|O\s*xy|góc\s+(?:(?:nhọn|tù|vuông|bẹt)\s+)?\$?[a-z][A-Z][a-z]|đoạn thẳng|\\Delta\s*[A-Z]{3}|[Δ∆]\s*[A-Z]{3}|△|lục giác|tọa độ|toạ độ/.test(text) && !/(?:hình|khối)\s+(?:chóp|lăng trụ|hộp|lập phương|tứ diện|nón|trụ|cầu)(?![a-zà-ỹ])|chóp\s+\$?[A-Z]\s*\.|lăng trụ|lập phương|tứ diện|mặt cầu|miền nghiệm|đồ thị (?:của )?hàm số/i.test(text)) {
        let pl = null;
        try { pl = DH.plane(blk.filter((l) => !/^#(TAB|ENDTAB|FIG)/.test(l)).join('\n')); } catch (err) { pl = null; }
        if (pl && pl.script) {
          const gi = blk.findIndex((l) => /^#G/.test(l));
          addFig(blk, gi >= 0 ? gi : blk.length - 1, 'plane', { kind: pl.kind, script: pl.script, w: 340, h: 300 }, '', 0.75);
          notes['thêm hình phẳng (đọc từ đề)'] = (notes['thêm hình phẳng (đọc từ đề)'] || 0) + 1;
          pl.unknown.forEach((u) => { notes['hình phẳng — chưa hiểu: "' + u.slice(0, 90) + '"'] = 1; });
        }
      }
      out.push(...blk);
    }
    return { markup: (specs.length ? specs.join('\n') + '\n' : '') + out.join('\n'), notes, count: fig };
  }

  const api = { fromText, fromHtml, cleanTex, formulas, figures, texToExpr, linear, TEX_RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BaiGiai = api;
})(this);
