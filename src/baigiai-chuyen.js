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
      const b = /^[-*•+]\s+(.*)$/.exec(ln);
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

  // các công thức (khác nhau) có trong nội dung chuẩn
  function formulas(markup) {
    const set = new Set();
    String(markup).split('\n').forEach((ln) => { const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g; let m; while ((m = re.exec(ln))) set.add((m[1] || m[2]).trim()); });
    return [...set];
  }

  const api = { fromText, fromHtml, cleanTex, formulas, TEX_RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BaiGiai = api;
})(this);
