// Thay nhóm "Công thức THPT" bằng nhóm "Theo lớp" (lớp 6 đến 12)
const fs = require('fs');
let s = fs.readFileSync('src/symbols.js', 'utf8');
const a = s.indexOf("  { name: 'Công thức THPT'");
if (a < 0) throw new Error('marker');
const block = String.raw`  // Ký hiệu và công thức theo từng khối lớp (chương trình GDPT 2018)
  { name: 'Theo lớp', grades: [
    { name: 'Lớp 6', items: [
      '\in', '\notin', '\subset', '\mathbb{N}', '\mathbb{N}^{*}', '\mathbb{Z}', '\left\{#?;#?;#?\right\}', 'A=\left\{x\in\mathbb{N}\mid #?\right\}',
      '<', '>', '\le', '\ge', '\ne', '\cdot', ':', ['a\ \vdots\ b', '#?\ \vdots\ #?'], ['a\not\vdots\ b', '#?\not\vdots\ #?'],
      '#@^{#?}', 'a^{m}\cdot a^{n}=a^{m+n}', 'a^{m}:a^{n}=a^{m-n}', '\overline{#?}', ['\overline{abc}', '\overline{#?}'],
      ['\text{ƯCLN}\left(a,b\right)', '\text{ƯCLN}\left(#?,#?\right)'], ['\text{BCNN}\left(a,b\right)', '\text{BCNN}\left(#?,#?\right)'], ['\text{ƯC}\left(a,b\right)', '\text{ƯC}\left(#?,#?\right)'], ['\text{BC}\left(a,b\right)', '\text{BC}\left(#?,#?\right)'], ['\text{Ư}\left(a\right)', '\text{Ư}\left(#?\right)'], ['\text{B}\left(a\right)', '\text{B}\left(#?\right)'],
      '\frac{#@}{#?}', ['1\frac{2}{3}', '#?\frac{#?}{#?}'], '\frac{a}{b}=\frac{c}{d}', '\frac{a}{b}+\frac{c}{d}=\frac{ad+bc}{bd}', '\frac{a}{b}\cdot\frac{c}{d}=\frac{ac}{bd}', '\frac{a}{b}:\frac{c}{d}=\frac{a}{b}\cdot\frac{d}{c}', '\%', '#?\,\%',
      '-#?', '\left(-#?\right)', '\left|#?\right|', ['A\in d', '#?\in #?'], ['A\notin d', '#?\notin #?'], '\widehat{#?}', ['\widehat{xOy}', '\widehat{#?}'], '^{\circ}', ['\widehat{xOy}=60^{\circ}', '\widehat{#?}=#?^{\circ}'],
      '\parallel', '\perp', ['AB=3\,\text{cm}', '#?=#?\,\text{cm}'], '\,\text{cm}^{2}', '\,\text{m}^{2}', '\approx',
    ] },
    { name: 'Lớp 7', items: [
      '\mathbb{Q}', '\mathbb{I}', '\mathbb{R}', '\sqrt{#?}', '\left|#?\right|', '\approx', '\pm',
      ['\left|x\right|=\begin{cases}x&\text{khi }x\ge 0\\-x&\text{khi }x<0\end{cases}', '\left|x\right|=\begin{cases}x&\text{khi }x\ge 0\\-x&\text{khi }x<0\end{cases}'],
      'x^{m}\cdot x^{n}=x^{m+n}', '\left(x^{m}\right)^{n}=x^{mn}', '\left(\frac{x}{y}\right)^{n}=\frac{x^{n}}{y^{n}}',
      '\frac{a}{b}=\frac{c}{d}', 'ad=bc', '\frac{a}{b}=\frac{c}{d}=\frac{a+c}{b+d}=\frac{a-c}{b-d}', '\frac{x}{a}=\frac{y}{b}=\frac{z}{c}', 'y=kx', 'y=\frac{a}{x}',
      'P\left(x\right)', 'A\left(x\right)+B\left(x\right)', '#@^{#?}', 'P\left(A\right)',
      '\widehat{#?}', '^{\circ}', '\widehat{A}+\widehat{B}+\widehat{C}=180^{\circ}', '\perp', '\parallel', ['a\perp b', '#?\perp #?'], ['a\parallel b', '#?\parallel #?'],
      '\Delta #?', '\Delta #?=\Delta #?', ['\Delta ABC=\Delta A\'B\'C\'', '\Delta #?=\Delta #?'], ['\left(\text{c.c.c}\right)', '\left(\text{c.c.c}\right)'], ['\left(\text{c.g.c}\right)', '\left(\text{c.g.c}\right)'], ['\left(\text{g.c.g}\right)', '\left(\text{g.c.g}\right)'],
      ['AB=AC', '#?=#?'], ['\widehat{B}=\widehat{C}', '\widehat{#?}=\widehat{#?}'], ['AB<AC+BC', '#?<#?+#?'], ['GA=\frac{2}{3}AM', '#?=\frac{2}{3}#?'], '\Rightarrow', '\Leftrightarrow',
    ] },
    { name: 'Lớp 8', items: [
      '\left(a+b\right)^{2}=a^{2}+2ab+b^{2}', '\left(a-b\right)^{2}=a^{2}-2ab+b^{2}', 'a^{2}-b^{2}=\left(a-b\right)\left(a+b\right)',
      '\left(a+b\right)^{3}=a^{3}+3a^{2}b+3ab^{2}+b^{3}', '\left(a-b\right)^{3}=a^{3}-3a^{2}b+3ab^{2}-b^{3}', 'a^{3}+b^{3}=\left(a+b\right)\left(a^{2}-ab+b^{2}\right)', 'a^{3}-b^{3}=\left(a-b\right)\left(a^{2}+ab+b^{2}\right)',
      '\frac{#@}{#?}', '\frac{A}{B}=\frac{C}{D}', '\frac{A}{B}=\frac{A\cdot M}{B\cdot M}', '\ne', ['x\ne 1', '#?\ne #?'],
      'ax+b=0', 'x=-\frac{b}{a}', 'y=ax+b', ['a=a\',\ b\ne b\'', "a=a',\\ b\\ne b'"], '\Leftrightarrow', '\Rightarrow',
      ['AB^{2}+AC^{2}=BC^{2}', '#?^{2}+#?^{2}=#?^{2}'], '\frac{AM}{AB}=\frac{AN}{AC}', '\frac{AM}{MB}=\frac{AN}{NC}', ['MN\parallel BC', '#?\parallel #?'], 'MN=\frac{1}{2}BC', '\frac{DB}{DC}=\frac{AB}{AC}',
      '\dongdang', ['\Delta ABC\dongdang\Delta A\'B\'C\'', '\Delta #?\dongdang\Delta #?'], "\\frac{A'B'}{AB}=\\frac{B'C'}{BC}=\\frac{C'A'}{CA}=k", ['\left(\text{g.g}\right)', '\left(\text{g.g}\right)'], ['\left(\text{c.g.c}\right)', '\left(\text{c.g.c}\right)'], ['\left(\text{c.c.c}\right)', '\left(\text{c.c.c}\right)'],
      '\widehat{#?}', '^{\circ}', 'S=\frac{1}{2}ah', 'S=\frac{1}{2}\left(a+b\right)h', 'S=\frac{1}{2}d_{1}d_{2}', 'S_{xq}=p\cdot d', 'V=\frac{1}{3}S\cdot h',
      'P\left(A\right)=\frac{n\left(A\right)}{n\left(\Omega\right)}',
    ] },
    { name: 'Lớp 9', items: [
      '\begin{cases}ax+by=c\\a\'x+b\'y=c\'\end{cases}', '\begin{cases}#?\\#?\end{cases}', '\sqrt{#?}', '\sqrt[3]{#?}', '\sqrt{A^{2}}=\left|A\right|', '\sqrt{AB}=\sqrt{A}\cdot\sqrt{B}', '\sqrt{\frac{A}{B}}=\frac{\sqrt{A}}{\sqrt{B}}', '\frac{A}{\sqrt{B}}=\frac{A\sqrt{B}}{B}',
      'ax^{2}+bx+c=0\ \left(a\ne 0\right)', '\Delta=b^{2}-4ac', "\\Delta'=b'^{2}-ac", 'x_{1,2}=\frac{-b\pm\sqrt{\Delta}}{2a}', "x_{1,2}=\\frac{-b'\\pm\\sqrt{\\Delta'}}{a}", 'x_{1}+x_{2}=-\frac{b}{a};\ x_{1}x_{2}=\frac{c}{a}', 'y=ax^{2}',
      '\le', '\ge', ['a<b\Rightarrow a+c<b+c', 'a<b\Rightarrow a+c<b+c'],
      ['\sin\alpha', '\sin #?'], ['\cos\alpha', '\cos #?'], ['\tan\alpha', '\tan #?'], ['\cot\alpha', '\cot #?'], '\sin\alpha=\frac{\text{cạnh đối}}{\text{cạnh huyền}}', '\tan\alpha=\frac{\sin\alpha}{\cos\alpha}', 'b=a\sin B=a\cos C', 'b=c\tan B=c\cot C',
      ['\left(O;R\right)', '\left(#?;#?\right)'], '\overarc{#?}', ['\text{sđ}\,\overarc{AB}', '\text{sđ}\,\overarc{#?}'], '\widehat{#?}', ['\widehat{AOB}=\text{sđ}\,\overarc{AB}', '\widehat{#?}=\text{sđ}\,\overarc{#?}'], ['\widehat{ACB}=\frac{1}{2}\text{sđ}\,\overarc{AB}', '\widehat{#?}=\frac{1}{2}\text{sđ}\,\overarc{#?}'],
      '^{\circ}', '\perp', 'd<R', 'd=R', 'd>R', 'C=2\pi R', 'l=\frac{\pi Rn}{180}', 'S=\pi R^{2}', 'S_{q}=\frac{\pi R^{2}n}{360}',
      'S_{xq}=2\pi rh', 'V=\pi r^{2}h', 'S_{xq}=\pi rl', 'V=\frac{1}{3}\pi r^{2}h', 'S=4\pi R^{2}', 'V=\frac{4}{3}\pi R^{3}',
    ] },
    { name: 'Lớp 10', items: [
      '\forall', '\exists', '\Rightarrow', '\Leftrightarrow', '\overline{#?}', ['\forall x\in\mathbb{R},', '\forall #?\in #?,'], ['\exists x\in\mathbb{R},', '\exists #?\in #?,'],
      '\in', '\notin', '\subset', '\cup', '\cap', '\setminus', '\varnothing', 'C_{#?}#?', ['C_{\mathbb{R}}A', 'C_{\mathbb{R}}#?'], '\left[#?;#?\right]', '\left(#?;#?\right)', '\left[#?;#?\right)', '\left(#?;#?\right]', '\left(-\infty;#?\right)', '\left(#?;+\infty\right)', '\mathbb{R}\setminus\left\{#?\right\}',
      'ax+by\le c', '\begin{cases}#?\\#?\\#?\end{cases}',
      'a^{2}=b^{2}+c^{2}-2bc\cos A', '\frac{a}{\sin A}=\frac{b}{\sin B}=\frac{c}{\sin C}=2R', 'S=\frac{1}{2}ab\sin C', 'S=\sqrt{p\left(p-a\right)\left(p-b\right)\left(p-c\right)}', 'S=pr=\frac{abc}{4R}',
      '\overrightarrow{#?}', '\vec{#?}', '\left|\overrightarrow{#?}\right|', '\overrightarrow{AB}+\overrightarrow{BC}=\overrightarrow{AC}', '\overrightarrow{0}', 'k\overrightarrow{a}', '\overrightarrow{a}\cdot\overrightarrow{b}=\left|\overrightarrow{a}\right|\left|\overrightarrow{b}\right|\cos\left(\overrightarrow{a},\overrightarrow{b}\right)', '\overrightarrow{a}\cdot\overrightarrow{b}=a_{1}b_{1}+a_{2}b_{2}', '\overrightarrow{AB}=\left(x_{B}-x_{A};y_{B}-y_{A}\right)',
      'y=ax^{2}+bx+c', 'I\left(-\frac{b}{2a};-\frac{\Delta}{4a}\right)', 'f\left(x\right)=ax^{2}+bx+c',
      '\begin{cases}x=x_{0}+at\\y=y_{0}+bt\end{cases}', 'ax+by+c=0', 'd\left(M,\Delta\right)=\frac{\left|ax_{0}+by_{0}+c\right|}{\sqrt{a^{2}+b^{2}}}', '\left(x-a\right)^{2}+\left(y-b\right)^{2}=R^{2}', '\frac{x^{2}}{a^{2}}+\frac{y^{2}}{b^{2}}=1', '\frac{x^{2}}{a^{2}}-\frac{y^{2}}{b^{2}}=1', 'y^{2}=2px',
      'P_{n}=n!', 'A_{n}^{k}=\frac{n!}{\left(n-k\right)!}', 'C_{n}^{k}=\frac{n!}{k!\left(n-k\right)!}', '\left(a+b\right)^{n}=\sum_{k=0}^{n}C_{n}^{k}a^{n-k}b^{k}', 'P\left(A\right)=\frac{n\left(A\right)}{n\left(\Omega\right)}', 'P\left(\overline{A}\right)=1-P\left(A\right)',
      '\overline{x}', 's^{2}', '\overline{x}=\frac{x_{1}+x_{2}+\ldots+x_{n}}{n}', 's^{2}=\frac{1}{n}\sum_{i=1}^{n}\left(x_{i}-\overline{x}\right)^{2}', 'Q_{1}', 'Q_{2}', 'Q_{3}', '\Delta_{Q}=Q_{3}-Q_{1}',
    ] },
    { name: 'Lớp 11', items: [
      ['\alpha\ \text{rad}', '#?\ \text{rad}'], '\pi', '\sin^{2}\alpha+\cos^{2}\alpha=1', '1+\tan^{2}\alpha=\frac{1}{\cos^{2}\alpha}', '\sin\left(a\pm b\right)=\sin a\cos b\pm\cos a\sin b', '\cos\left(a\pm b\right)=\cos a\cos b\mp\sin a\sin b',
      '\sin 2a=2\sin a\cos a', '\cos 2a=\cos^{2}a-\sin^{2}a', '\tan 2a=\frac{2\tan a}{1-\tan^{2}a}', '\cos a\cos b=\frac{1}{2}\left[\cos\left(a-b\right)+\cos\left(a+b\right)\right]', '\sin a+\sin b=2\sin\frac{a+b}{2}\cos\frac{a-b}{2}',
      '\left[\begin{array}{l}x=\alpha+k2\pi\\x=\pi-\alpha+k2\pi\end{array}\right.\ \left(k\in\mathbb{Z}\right)', 'x=\pm\alpha+k2\pi\ \left(k\in\mathbb{Z}\right)', 'x=\alpha+k\pi\ \left(k\in\mathbb{Z}\right)', '\left(k\in\mathbb{Z}\right)',
      '\left(u_{n}\right)', 'u_{n+1}=u_{n}+d', 'u_{n}=u_{1}+\left(n-1\right)d', 'S_{n}=\frac{n\left(u_{1}+u_{n}\right)}{2}', 'u_{n+1}=u_{n}\cdot q', 'u_{n}=u_{1}q^{n-1}', 'S_{n}=\frac{u_{1}\left(1-q^{n}\right)}{1-q}', 'S=\frac{u_{1}}{1-q}',
      '\lim u_{n}', '\lim_{n\to+\infty}u_{n}', '\lim_{x\to x_{0}}f\left(x\right)', '\lim_{x\to x_{0}^{+}}', '\lim_{x\to x_{0}^{-}}', '\lim_{x\to+\infty}', '\lim_{x\to-\infty}', '+\infty', '-\infty',
      'a^{#?}', '\sqrt[n]{#?}', 'a^{\frac{m}{n}}=\sqrt[n]{a^{m}}', '\log_{#?}#?', '\ln #?', '\log #?', '\log_{a}\left(bc\right)=\log_{a}b+\log_{a}c', '\log_{a}b^{\alpha}=\alpha\log_{a}b', '\log_{a}b=\frac{\log_{c}b}{\log_{c}a}', 'a^{x}=b\Leftrightarrow x=\log_{a}b',
      "f'\\left(x_{0}\\right)=\\lim_{x\\to x_{0}}\\frac{f\\left(x\\right)-f\\left(x_{0}\\right)}{x-x_{0}}", "y'", "y''", "\\left(x^{n}\\right)'=nx^{n-1}", "\\left(\\sqrt{x}\\right)'=\\frac{1}{2\\sqrt{x}}", "\\left(uv\\right)'=u'v+uv'", "\\left(\\frac{u}{v}\\right)'=\\frac{u'v-uv'}{v^{2}}", "\\left(\\sin x\\right)'=\\cos x", "\\left(\\cos x\\right)'=-\\sin x", "\\left(e^{x}\\right)'=e^{x}", "\\left(\\ln x\\right)'=\\frac{1}{x}", "y'_{x}=y'_{u}\\cdot u'_{x}",
      ['a\parallel\left(P\right)', '#?\parallel\left(#?\right)'], ['\left(P\right)\parallel\left(Q\right)', '\left(#?\right)\parallel\left(#?\right)'], ['a\perp\left(P\right)', '#?\perp\left(#?\right)'], ['\left(P\right)\perp\left(Q\right)', '\left(#?\right)\perp\left(#?\right)'], ['a\subset\left(P\right)', '#?\subset\left(#?\right)'], ['\left(P\right)\cap\left(Q\right)=d', '\left(#?\right)\cap\left(#?\right)=#?'],
      ['\left(a,\left(P\right)\right)', '\left(#?,\left(#?\right)\right)'], ['\left(\left(P\right),\left(Q\right)\right)', '\left(\left(#?\right),\left(#?\right)\right)'], ['d\left(A,\left(P\right)\right)', 'd\left(#?,\left(#?\right)\right)'], ['d\left(a,b\right)', 'd\left(#?,#?\right)'], ['\left[A,d,B\right]', '\left[#?,#?,#?\right]'], 'V=\frac{1}{3}S\cdot h', 'V=S\cdot h',
      'P\left(A\cup B\right)=P\left(A\right)+P\left(B\right)-P\left(AB\right)', 'P\left(AB\right)=P\left(A\right)\cdot P\left(B\right)',
    ] },
    { name: 'Lớp 12', items: [
      "f'\\left(x\\right)\\ge 0,\\ \\forall x\\in K", "y'=0\\Leftrightarrow", '\max_{\left[a;b\right]}f\left(x\right)', '\min_{\left[a;b\right]}f\left(x\right)', 'y_{\text{CĐ}}', 'y_{\text{CT}}', 'x_{\text{CĐ}}', 'x_{\text{CT}}',
      '\lim_{x\to x_{0}^{+}}f\left(x\right)=+\infty', '\lim_{x\to\pm\infty}f\left(x\right)=y_{0}', '\lim_{x\to\pm\infty}\left[f\left(x\right)-\left(ax+b\right)\right]=0', 'y=\frac{ax+b}{cx+d}', 'y=ax^{3}+bx^{2}+cx+d', 'y=\frac{ax^{2}+bx+c}{mx+n}',
      '\int #?\,\mathrm{d}x', '\int f\left(x\right)\mathrm{d}x=F\left(x\right)+C', '\int x^{\alpha}\mathrm{d}x=\frac{x^{\alpha+1}}{\alpha+1}+C', '\int\frac{1}{x}\mathrm{d}x=\ln\left|x\right|+C', '\int e^{x}\mathrm{d}x=e^{x}+C', '\int\sin x\,\mathrm{d}x=-\cos x+C', '\int\cos x\,\mathrm{d}x=\sin x+C',
      '\int_{#?}^{#?}#?\,\mathrm{d}x', '\int_{a}^{b}f\left(x\right)\mathrm{d}x=F\left(b\right)-F\left(a\right)', '\left.#?\right|_{#?}^{#?}', 'S=\int_{a}^{b}\left|f\left(x\right)-g\left(x\right)\right|\mathrm{d}x', 'V=\pi\int_{a}^{b}f^{2}\left(x\right)\mathrm{d}x', 'V=\int_{a}^{b}S\left(x\right)\mathrm{d}x',
      '\overrightarrow{#?}', '\overrightarrow{a}=\left(a_{1};a_{2};a_{3}\right)', '\overrightarrow{AB}=\left(x_{B}-x_{A};y_{B}-y_{A};z_{B}-z_{A}\right)', '\overrightarrow{a}\cdot\overrightarrow{b}=a_{1}b_{1}+a_{2}b_{2}+a_{3}b_{3}', '\left[\overrightarrow{a},\overrightarrow{b}\right]', '\left|\overrightarrow{a}\right|=\sqrt{a_{1}^{2}+a_{2}^{2}+a_{3}^{2}}', '\cos\left(\overrightarrow{a},\overrightarrow{b}\right)=\frac{\overrightarrow{a}\cdot\overrightarrow{b}}{\left|\overrightarrow{a}\right|\left|\overrightarrow{b}\right|}',
      'Ax+By+Cz+D=0', '\overrightarrow{n}=\left(A;B;C\right)', '\begin{cases}x=x_{0}+at\\y=y_{0}+bt\\z=z_{0}+ct\end{cases}', '\frac{x-x_{0}}{a}=\frac{y-y_{0}}{b}=\frac{z-z_{0}}{c}', '\left(x-a\right)^{2}+\left(y-b\right)^{2}+\left(z-c\right)^{2}=R^{2}',
      'd\left(M,\left(P\right)\right)=\frac{\left|Ax_{0}+By_{0}+Cz_{0}+D\right|}{\sqrt{A^{2}+B^{2}+C^{2}}}', ['\left(Oxy\right)', '\left(Oxy\right)'], ['Oxyz', 'Oxyz'],
      ['P\left(A\mid B\right)', 'P\left(#?\mid #?\right)'], 'P\left(A\mid B\right)=\frac{P\left(AB\right)}{P\left(B\right)}', 'P\left(A\right)=P\left(B\right)P\left(A\mid B\right)+P\left(\overline{B}\right)P\left(A\mid\overline{B}\right)', 'P\left(B\mid A\right)=\frac{P\left(B\right)P\left(A\mid B\right)}{P\left(A\right)}',
      '\overline{x}', 's^{2}', 's', 'R=x_{\max}-x_{\min}', '\Delta_{Q}=Q_{3}-Q_{1}', 's^{2}=\frac{1}{n}\sum_{i=1}^{k}m_{i}\left(x_{i}-\overline{x}\right)^{2}',
    ] },
  ] },
];
`;
// Trong khối trên: chuỗi nháy đơn là LaTeX viết thẳng (\' là dấu phẩy trên), chuỗi nháy kép đã nhân đôi dấu \.
// Chuyển tất cả về chuỗi JS hợp lệ.
const fixed = block.replace(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g, (m, sq, dq) =>
  JSON.stringify(sq !== undefined ? sq.replace(/\\'/g, "'") : dq.replace(/\\\\/g, '\\')));
fs.writeFileSync('src/symbols.js', s.slice(0, a) + fixed);

// app.js: vẽ hàng nút chọn lớp cho nhóm "Theo lớp"
let j = fs.readFileSync('src/app.js', 'utf8').replace(/\r\n/g, '\n');
const rep = (x, y) => { if (!j.includes(x)) console.log('MISSING: ' + x.slice(0, 60)); j = j.replace(x, () => y); };
rep(`    const tab = PALETTE[ti];
    tab.items.forEach((item) => {`, `    const tab = PALETTE[ti];
    let items = tab.items;
    if (tab.grades) {
      // nhóm theo khối lớp: hàng nút Lớp 6 … Lớp 12, nhớ lớp đang dùng
      let g = 0;
      try { g = Math.min(tab.grades.length - 1, Math.max(0, +localStorage.getItem('tvs-grade') || 0)); } catch (e) { /* không có bộ nhớ */ }
      const bar = document.createElement('div');
      bar.className = 'gradebar';
      tab.grades.forEach((gr, gi) => {
        const gb = document.createElement('button');
        gb.type = 'button'; gb.textContent = gr.name; gb.className = gi === g ? 'on' : '';
        gb.onmousedown = (e) => e.preventDefault();
        gb.onclick = () => { try { localStorage.setItem('tvs-grade', gi); } catch (e) { /* bỏ qua */ } showTab(ti); };
        bar.appendChild(gb);
      });
      pal.appendChild(bar);
      items = tab.grades[g].items;
    }
    pal.classList.toggle('tall', !!tab.grades);
    items.forEach((item) => {`);
fs.writeFileSync('src/app.js', j);
fs.appendFileSync('src/styles.css', `
/* nhóm ký hiệu theo khối lớp */
dialog#fxdlg #palette.tall { max-height: 190px; }
.gradebar { flex: 0 0 100%; display: flex; gap: 4px; position: sticky; top: 0; background: #fff; padding-bottom: 4px; z-index: 1; }
dialog#fxdlg #palette .gradebar button { min-width: 0; min-height: 0; padding: 4px 12px; border-radius: 14px; font: 600 12.5px "Segoe UI", sans-serif; color: #33445a; }
dialog#fxdlg #palette .gradebar button.on { background: #e67e22; border-color: #e67e22; color: #fff; }
`);
console.log('grades patched');
