// ToanViet Studio — trang soạn thảo: đối tượng, chọn/kéo/co giãn, thuộc tính, tệp, xuất
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const page = $('#page'), stage = $('#stage'), props = $('#props');
  const api = window.api || null;
  const S = { objs: [], sel: null, zoom: 1, file: null, dirty: false, hist: [], hpos: -1, seq: 1, clip: null };

  MathfieldElement.fontsDirectory = null; // phông đã nạp qua mathlive-fonts.css
  MathfieldElement.soundsDirectory = null;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Dấu đồng dạng kiểu SGK Việt Nam (chữ S nằm ngang, hai đầu cuộn tròn): nét vẽ lấy từ dự án BangVeToan
  const SIM_D = 'M300 370C200 430 75 360 75 245C75 130 200 70 300 135C390 190 390 310 480 365C580 430 705 370 705 255C705 140 580 70 480 130';
  const SIM_TEX = '\\mathrel{\\class{tv-sim}{\\sim}}';
  const simMask = 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 45 720 410"><path transform="translate(0 500) scale(1 -1)" d="' + SIM_D + '" fill="none" stroke="#000" stroke-width="44" stroke-linecap="round"/></svg>') + '")';
  const SIM_CSS = '.tv-sim{position:relative;display:inline-block;min-width:.92em;text-align:center;-webkit-text-fill-color:transparent}' +
    '.tv-sim::after{content:"";position:absolute;left:50%;top:50%;width:.9em;height:.5em;transform:translate(-50%,-50%);background:currentColor;-webkit-mask:' + simMask + ' center/100% 100% no-repeat;mask:' + simMask + ' center/100% 100% no-repeat}' +
    // chữ tiếng Việt trong công thức (\text{...}) dùng Times New Roman để đủ dấu
    // mũ góc, dấu cung (dấu co giãn) phải phủ đúng giữa toàn bộ phần bên dưới
    '.ML__center:has(.ML__stretchy){margin-left:0!important}' +
    '.ML__text{font-family:"Times New Roman",Cambria,serif!important}';
  const addSimCss = (rootNode) => { const st = document.createElement('style'); st.textContent = SIM_CSS; rootNode.appendChild(st); };
  addSimCss(document.head);
  const expandSim = (l) => String(l).replace(/\\dongdang(?![a-zA-Z])/g, SIM_TEX);
  const collapseSim = (l) => String(l).replace(/\\mathrel\{\\class\{tv-sim\}\{\\sim\}\}/g, '\\dongdang ');
  // Công thức nhiều dòng (\displaylines{a \\ b}) dựng thành các dòng canh trái; chỉ tách ở dấu \\ ngoài cùng
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
  const mkCache = new Map();
  function tex(latex, inline) {
    const key = (inline ? 'i' : 'd') + latex;
    if (!mkCache.has(key)) {
      let html;
      try { html = MathLive.convertLatexToMarkup(expandSim(latex), { defaultMode: inline ? 'inline-math' : 'math' }); } catch (e) { html = esc(latex); }
      mkCache.set(key, html);
    }
    return mkCache.get(key);
  }
  function msg(t, err) {
    $('#msg').textContent = t;
    $('#status').classList.toggle('err', !!err);
  }

  // ---------- Mô hình ----------
  const get = (id) => S.objs.find((o) => o.id === id);
  const cur = () => get(S.sel);
  const serialize = () => JSON.stringify(S.objs, (k, v) => (k[0] === '_' ? undefined : v));
  function commit() {
    const snap = serialize();
    if (S.hist[S.hpos] === snap) return;
    S.hist = S.hist.slice(0, S.hpos + 1);
    S.hist.push(snap);
    if (S.hist.length > 120) S.hist.shift();
    S.hpos = S.hist.length - 1;
    S.dirty = true;
    title();
  }
  function restore(i) {
    if (i < 0 || i >= S.hist.length) return;
    S.hpos = i;
    S.objs = JSON.parse(S.hist[i]);
    if (!cur()) S.sel = null;
    S.dirty = true;
    renderAll(); buildProps(); title();
  }
  function title() {
    const name = S.file ? S.file.replace(/^.*[\\/]/, '') : 'Chưa đặt tên';
    if (api) api.setTitle((S.dirty ? '● ' : '') + name + ' — ToanViet Studio');
  }
  function loadDoc(objs, file) {
    S.objs = objs || [];
    S.seq = S.objs.reduce((m, o) => Math.max(m, parseInt(String(o.id).slice(1), 10) || 0), 0) + 1;
    S.sel = null; S.file = file || null;
    S.hist = [serialize()]; S.hpos = 0; S.dirty = false;
    renderAll(); buildProps(); title();
  }

  // ---------- Vẽ đối tượng ----------
  function labelsHtml(labels) {
    return labels.map((l) => {
      const tr = (l.ax === 'l' ? '0' : l.ax === 'r' ? '-100%' : '-50%') + ',-50%';
      return `<span class="lb${l.bg ? ' bg' : ''}" style="left:${Math.round(l.x * 10) / 10}px;top:${Math.round(l.y * 10) / 10}px;font-size:${l.size || 14}px;color:${l.color || '#111'};transform:translate(${tr})">${l.tex !== undefined ? tex(l.tex, true) : esc(l.text)}</span>`;
    }).join('');
  }
  function shapeSvg(o) {
    const w = o.w, h = o.h, sw = o.sw || 1.5;
    const st = `stroke="${o.color || '#111'}" stroke-width="${sw}"${o.dash ? ' stroke-dasharray="7 4"' : ''}`;
    const fill = o.nofill === false ? (o.fill || '#aed6f1') : 'none';
    if (o.kind === 'rect') return `<rect x="0" y="0" width="${w}" height="${h}" fill="${fill}" ${st}/>`;
    if (o.kind === 'ellipse') return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" ${st}/>`;
    const y1 = o.flip ? h : 0, y2 = o.flip ? 0 : h;
    const mk = o.kind === 'arrow' ? `<defs><marker id="sa${o.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="${o.color || '#111'}"/></marker></defs>` : '';
    return `${mk}<line x1="0" y1="${y1}" x2="${w}" y2="${y2}" ${st}${mk ? ` marker-end="url(#sa${o.id})"` : ''}/><line x1="0" y1="${y1}" x2="${w}" y2="${y2}" stroke="transparent" stroke-width="12"/>`;
  }
  function textHtml(o) {
    return String(o.text || '').split('$').map((seg, i) => (i % 2 ? '<span class="ifx" data-i="' + i + '" title="Nhấp đúp để sửa công thức">' + tex(seg, true) + '</span>' : esc(seg))).join('');
  }
  // ---------- Kéo điểm và dựng nhanh (hình phẳng, hình không gian) ----------
  const PT_RE = /^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?)\s*)?\)\s*(#.*)?$/;
  // các điểm cho bằng toạ độ số trong kịch bản: kéo được
  function freePts(o) {
    const out = {}, dim = o.type === 'space' ? 3 : 2;
    String(o.script || '').split('\n').forEach((ln, i) => { const m = ln.trim().match(PT_RE); if (m && (dim === 3) === (m[4] !== undefined)) out[m[1]] = { i, v: [m[2], m[3], m[4]].filter((x) => x !== undefined).map(Number), cm: m[5] || '' }; });
    return out;
  }
  const ptSel = (o) => (S.ptSel && S.ptSel.id === o.id ? S.ptSel.names : []);
  function pointHandles(o, res) {
    const fr = freePts(o), on = ptSel(o);
    return Object.keys(res.pts).map((n) => {
      const p = res.pts[n], k = on.indexOf(n);
      return `<div class="pth${fr[n] ? ' drag' : ''}${k >= 0 ? ' on' : ''}" data-pt="${n}" style="left:${Math.round(p[0])}px;top:${Math.round(p[1])}px" title="${n}${fr[n] ? ' — kéo để di chuyển' : ' — điểm dựng, nhấp để chọn'}">${k >= 0 ? k + 1 : ''}</div>`;
    }).join('');
  }
  function usedNames(o) { const u = new Set(); String(o.script || '').split('\n').forEach((ln) => { const m = ln.trim().match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=/); if (m) u.add(m[1]); }); return u; }
  function freshName(o, pref) {
    const u = usedNames(o);
    for (const c of (pref || '') + 'MNPQHKIEFGTUVXYZRJL') if (!u.has(c)) return c;
    for (let i = 1; ; i++) if (!u.has((pref || 'M') + i)) return (pref || 'M') + i;
  }
  function pointDrag(e, o, el, name) {
    const fr = freePts(o)[name], view = o._res && o._res.view;
    const p0 = { x: e.clientX, y: e.clientY }, start = fr ? fr.v.slice() : null;
    let moved = false;
    if (fr && view) o._view = Object.assign({}, view);
    const fmt = (v) => { const r = Math.round(v * 100) / 100; return String(Object.is(r, -0) ? 0 : r); };
    const mv = (ev) => {
      const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (!fr || !view) return;
      let d;
      if (view.dim === 2) d = [dx / view.sc, -dy / view.sc];
      else {
        const [a, b, c] = view.axes;
        let q;
        if (ev.shiftKey) q = [0, 0, Math.abs(c[1]) > 1e-9 ? dy / c[1] : 0]; // giữ Shift: kéo lên xuống theo trục đứng
        else { const det = a[0] * b[1] - a[1] * b[0]; q = Math.abs(det) < 1e-9 ? [0, 0, 0] : [(dx * b[1] - dy * b[0]) / det, (a[0] * dy - a[1] * dx) / det, 0]; }
        d = view.oxyz ? [-q[1], q[0], q[2]] : q;
      }
      const step = ev.ctrlKey ? 1 : 0.1;
      const nv = start.map((v, k) => Math.round((v + d[k]) / step) * step);
      const L = String(o.script).split('\n');
      L[fr.i] = name + ' = (' + nv.map(fmt).join(', ') + ')' + (fr.cm ? '   ' + fr.cm : '');
      o.script = L.join('\n');
      renderObj(o);
      msg(name + ' = (' + nv.map(fmt).join('; ') + ')' + (view.dim === 3 ? '  — giữ Shift để kéo theo chiều cao' : '') + '  — giữ Ctrl để làm tròn số nguyên');
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      delete o._view;
      if (moved && fr) { renderObj(o); commit(); buildProps(); return; }
      if (!moved) { // nhấp: chọn / bỏ chọn điểm để dựng nhanh
        if (!S.ptSel || S.ptSel.id !== o.id) S.ptSel = { id: o.id, names: [] };
        const k = S.ptSel.names.indexOf(name);
        if (k >= 0) S.ptSel.names.splice(k, 1); else S.ptSel.names.push(name);
        renderObj(o); buildProps();
      }
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    e.preventDefault(); e.stopPropagation();
  }
  function renderObj(o) {
    let el = page.querySelector(`[data-id="${o.id}"]`);
    if (!el) { el = document.createElement('div'); el.dataset.id = o.id; page.appendChild(el); }
    if (el.classList.contains('editing')) return el;
    el.className = 'obj ' + o.type + (S.sel === o.id ? ' sel' : '');
    el.style.cssText = `left:${o.x}px;top:${o.y}px;`;
    o._err = '';
    let html = '';
    try {
      if (o.type === 'formula') {
        html = o.latex ? `<span style="font-size:${o.size}px;color:${o.color || '#000'}">${tex(texOf(o))}</span>` : '<span class="empty">(công thức trống — nhấp đúp để soạn)</span>';
      } else if (o.type === 'text') {
        el.style.cssText += `width:${o.w}px;font-size:${o.size}px;color:${o.color || '#000'};text-align:${o.align || 'left'};font-weight:${o.bold ? 700 : 400};font-style:${o.italic ? 'italic' : 'normal'};`;
        html = textHtml(o);
      } else {
        let res;
        if (o.type === 'graph') res = Graph.renderGraph(o, o.w, o.h);
        else if (o.type === 'region') res = Graph.renderRegion(o, o.w, o.h);
        else if (o.type === 'bbt') res = BBT.render(o, o.w, o.h);
        else if (o.type === 'solid') res = Solid.render(o, o.w, o.h);
        else if (o.type === 'plane') res = Plane.render(o, o.w, o.h);
        else if (o.type === 'space') res = Space.render(o, o.w, o.h);
        else if (o.type === 'sym') res = SGK.render(o, o.w, o.h);
        else if (o.type === 'numline') res = NumLine.render(o, o.w, o.h);
        else if (o.type === 'venn') res = NumLine.renderVenn(o, o.w, o.h);
        else res = { svg: shapeSvg(o), labels: [], errors: [] };
        el.style.cssText += `width:${o.w}px;height:${o.h}px;`;
        html = `<svg width="${o.w}" height="${o.h}" viewBox="0 0 ${o.w} ${o.h}" xmlns="http://www.w3.org/2000/svg">${res.svg}</svg>` + labelsHtml(res.labels);
        o._err = res.errors.join('\n');
        if (res.pts && (o.type === 'plane' || o.type === 'space')) { o._res = res; html += pointHandles(o, res); }
      }
    } catch (e) { o._err = e.message; html = `<span class="empty" style="color:#b03a2e">${esc(e.message)}</span>`; }
    el.innerHTML = html + '<div class="handle"></div>';
    if (S.sel === o.id) { const er = $('#perr'); if (er) er.textContent = o._err; }
    return el;
  }
  function renderAll() {
    page.innerHTML = '';
    S.objs.forEach(renderObj);
  }
  function select(id) {
    if (S.sel === id) return;
    if (S.ptSel && S.ptSel.id !== id) { const old = get(S.ptSel.id); S.ptSel = null; if (old) renderObj(old); }
    S.sel = id;
    page.querySelectorAll('.obj').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
    buildProps();
  }

  // ---------- Tạo đối tượng ----------
  const SOLID_DEFAULTS = {
    chop3: { base: 'deu', apex: 'A', points: 'M = BC', segs: 'AM, SM' },
    chop4: { apex: 'tam', points: 'O = AC', segs: 'AC, BD, SO' },
    tudien: { points: 'G = BCD', segs: 'AG' },
    hop: { b: 3, ch: 3, points: '', segs: "AC'" },
    lapphuong: { points: '', segs: "A'C, BD" },
    langtru3: { base: 'deu', ch: 5, points: '', segs: '' },
    chopcut: { ratio: 0.5, ch: 3, points: '', segs: '' },
    tru: { a: 2, ch: 4 }, non: { a: 2, ch: 4 }, noncut: { a: 2.4, b: 1.2, ch: 3 }, cau: { a: 2 },
  };
  function defaults(type, kind) {
    switch (type) {
      case 'formula': return { latex: '', size: 16, color: '#000000' }; // 16px = cỡ 12 của Word
      case 'text': return { text: 'Nhập văn bản. Gõ công thức giữa hai dấu đô la: $x^2+1$', size: 17, w: 420, color: '#000000', align: 'left' };
      case 'graph': return { w: 360, h: 330, funcs: 'x^3 - 3x', xmin: '-4', xmax: '4', ymin: '-4', ymax: '4', xstep: '1', ystep: '1', grid: true, ticks: true, legend: true, proj: true, points: '', guides: '', shadeA: '', shadeB: '', stroke: 1.8 };
      case 'bbt': return { w: 520, h: 170, expr: 'x^3 - 3x', a: '', b: '', xrow: '', drow: '', frow: '', lx: 'x', ld: "y'", lf: 'y' };
      case 'sign': return { type: 'bbt', signOnly: true, w: 480, h: 76, expr: '(x-1)(x+2)/(x-3)', a: '', b: '', xrow: '', drow: '', frow: '', lx: 'x', ld: 'f(x)', lf: '' };
      case 'region': return { w: 360, h: 360, ineqs: 'x + y <= 4\nx - 2y <= 2\nx >= 0\ny >= 0', style: 'hatch', vertices: true, lineNames: true, xmin: '-2', xmax: '6', ymin: '-2', ymax: '6', xstep: '1', ystep: '1', grid: true, ticks: true };
      case 'solid': return Object.assign({ kind, w: 300, h: 300, a: 4, b: 4, ch: 4, yaw: -18, pitch: 20, labels: true, fill: false, stroke: 1.5, color: '#111111', points: '', segs: '' }, SOLID_DEFAULTS[kind]);
      case 'sym': return Object.assign({ kind, label: '', data: 'ud ud u u u', inner: true, stroke: 1.5, color: '#111111' }, SGK.sizeOf(kind));
      case 'space': return Object.assign({ kind, w: 360, h: 300, script: Space.scriptOf(kind), labels: true, dots: false, stroke: 1.5, color: '#111111', lcolor: '#1a6fc4', yaw: 20, pitch: 20 }, Space.viewOf(kind));
      case 'plane': return { kind, w: 340, h: 280, script: Plane.scriptOf(kind), labels: true, dots: false, stroke: 1.5, color: '#111111' };
      case 'numline': return Object.assign({ kind, color: '#111111', pcolor: '#d62728', ncolor: '#1f77b4', xname: '' }, JSON.parse(JSON.stringify(NumLine.KINDS[kind][1])));
      case 'venn': return Object.assign({ kind, color: '#111111' }, JSON.parse(JSON.stringify(NumLine.VKINDS[kind][1])));
      case 'shape': return { kind, w: kind === 'line' || kind === 'arrow' ? 160 : 140, h: kind === 'line' || kind === 'arrow' ? 60 : 100, color: '#111111', sw: 1.5, dash: false, nofill: true, fill: '#aed6f1', flip: false };
    }
  }
  function autoBBT(o) {
    const r = BBT.analyse(o.expr, o.a, o.b, !!o.signOnly);
    o.xrow = r.xrow; o.drow = r.drow; o.frow = r.frow;
    return r.note;
  }
  function insert(type, kind, extra) {
    const base = defaults(type, kind);
    const n = S.objs.length % 8;
    const o = Object.assign({ id: 'o' + S.seq++, type, x: Math.round(60 + n * 18 + stage.scrollLeft / S.zoom), y: Math.round(50 + n * 18 + stage.scrollTop / S.zoom) }, base, extra || {});
    if (o.type === 'bbt' && !o.xrow) { try { autoBBT(o); } catch (e) { msg(e.message, true); } }
    S.objs.push(o);
    renderObj(o);
    select(o.id);
    return o;
  }

  // ---------- Hộp soạn công thức (theo thiết kế của Bảng vẽ Toán) ----------
  const dlg = $('#fxdlg'), fTex = $('#fTex'), fPrev = $('#fPrev');
  let fxDone = null, fMode = 'v', fTab = 0, pfx = null, fT = 0;
  const fSt = { size: 16, color: '#000000', bold: false };
  // Cỡ chữ hiển thị theo point như Word (12 pt = 16 px trên trang)
  const toPt = (px) => Math.round(px * 0.75 * 2) / 2, toPx = (pt) => pt / 0.75;
  // Phím tắt kiểu MathType. Ctrl+G, Ctrl+T, Ctrl+K là phím mở đầu: bấm xong thả ra rồi gõ tiếp một phím.
  const SC = { f: '\\frac{#@}{#?}', r: '\\sqrt{#?}', h: '#@^{#?}', l: '#@_{#?}', j: '#@_{#?}^{#?}', i: '\\int_{#?}^{#?}#?\\,\\mathrm{d}x', 9: '\\left(#?\\right)', 0: '\\left(#?\\right)', '[': '\\left[#?\\right]',
    'shift+{': '\\left\\{#?\\right\\}', 'shift+i': '\\int#?\\,\\mathrm{d}x', 'shift+e': '\\text{#?}' };
  const GREEK = { a: 'alpha', b: 'beta', g: 'gamma', d: 'delta', e: 'varepsilon', z: 'zeta', h: 'eta', q: 'theta', i: 'iota', k: 'kappa', l: 'lambda', m: 'mu', n: 'nu', x: 'xi', p: 'pi', r: 'rho', s: 'sigma', t: 'tau', u: 'upsilon', f: 'varphi', c: 'chi', y: 'psi', w: 'omega',
    D: 'Delta', G: 'Gamma', L: 'Lambda', S: 'Sigma', W: 'Omega', F: 'Phi', P: 'Pi', Q: 'Theta', Y: 'Psi', X: 'Xi' };
  const TPL = { n: '\\sqrt[#?]{#?}', s: '\\sum_{#?}^{#?}#?', p: '\\prod_{#?}^{#?}#?', l: '\\lim_{#?\\to#?}', '|': '\\left|#?\\right|', a: '\\widehat{#?}', c: '\\overarc{#?}', v: '\\overrightarrow{#?}', o: '\\overline{#?}', u: '\\underbrace{#?}_{#?}',
    h: '\\begin{cases}#?\\\\#?\\end{cases}', m: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}' };
  const SYM = { i: '\\infty', a: '\\to', e: '\\in', t: '\\times', d: '\\partial', p: '\\perp', '.': '\\cdot', '<': '\\le', ',': '\\le', '>': '\\ge', '=': '\\ne', '/': '\\parallel', '+': '\\pm', r: '\\Rightarrow', l: '\\Leftrightarrow', o: '^{\\circ}', s: '\\dongdang' };
  const FKEYS = [['Ctrl+F', 'Phân số'], ['Ctrl+R', 'Căn bậc hai'], ['Ctrl+H', 'Số mũ'], ['Ctrl+L', 'Chỉ số dưới'], ['Ctrl+J', 'Chỉ số trên và dưới'], ['Ctrl+I', 'Tích phân có cận'], ['Ctrl+Shift+I', 'Tích phân không cận'],
    ['Ctrl+9', 'Ngoặc tròn'], ['Ctrl+[', 'Ngoặc vuông'], ['Ctrl+Shift+{', 'Ngoặc nhọn'], ['Ctrl+Shift+E', 'Đổi qua lại giữa gõ toán và gõ chữ'], ['Enter', 'Thêm dòng mới ở cuối công thức'], ['Shift+Enter', 'Thêm hàng cho hệ phương trình, ma trận đang đứng'], ['Ctrl+Shift+Backspace', 'Xoá dòng đang đứng'], ['Ctrl+Enter', 'Chèn công thức'],
    ['Ctrl+T rồi N', 'Căn bậc n'], ['Ctrl+T rồi S', 'Tổng ∑'], ['Ctrl+T rồi P', 'Tích ∏'], ['Ctrl+T rồi L', 'Giới hạn'], ['Ctrl+T rồi |', 'Giá trị tuyệt đối'], ['Ctrl+T rồi A', 'Góc (dấu mũ rộng)'], ['Ctrl+T rồi C', 'Cung'],
    ['Ctrl+T rồi V', 'Vectơ'], ['Ctrl+T rồi O', 'Gạch trên'], ['Ctrl+T rồi U', 'Ngoặc ôm bên dưới kèm chú thích'], ['Ctrl+T rồi H', 'Hệ phương trình'], ['Ctrl+T rồi M', 'Ma trận 2×2'],
    ['Ctrl+G rồi chữ cái', 'Chữ Hy Lạp: a→α, b→β, d→δ, D→Δ, p→π, q→θ, w→ω, f→φ, l→λ…'],
    ['Ctrl+K rồi I', '∞'], ['Ctrl+K rồi A', '→'], ['Ctrl+K rồi E', '∈'], ['Ctrl+K rồi T', '×'], ['Ctrl+K rồi .', 'Dấu nhân chấm'], ['Ctrl+K rồi <  >  =', '≤  ≥  ≠'], ['Ctrl+K rồi P  /', '⊥  ∥'], ['Ctrl+K rồi R  L', '⇒  ⇔'], ['Ctrl+K rồi O', 'Độ °'], ['Ctrl+K rồi S', 'Đồng dạng ∽'],
    ['/  ^  _', 'Gõ thẳng: phân số, mũ, chỉ số'], ['\\tên rồi Tab', 'Ký hiệu theo tên LaTeX, ví dụ \\omega'], ['Tab, phím mũi tên', 'Sang ô trống kế tiếp, ra khỏi ô con']];
  $('#fKeyList').innerHTML = FKEYS.map((k) => '<kbd>' + esc(k[0]) + '</kbd><span>' + esc(k[1]) + '</span>').join('');
  const SCREV = new Map();
  for (const k in SC) SCREV.set(SC[k], 'Ctrl+' + k.replace('shift+', 'Shift+').toUpperCase().replace('SHIFT', 'Shift'));
  for (const k in TPL) if (!SCREV.has(TPL[k])) SCREV.set(TPL[k], 'Ctrl+T rồi ' + k.toUpperCase());
  for (const k in SYM) if (!SCREV.has(SYM[k])) SCREV.set(SYM[k], 'Ctrl+K rồi ' + k.toUpperCase());
  for (const k in GREEK) SCREV.set('\\' + GREEK[k], 'Ctrl+G rồi ' + k);

  const mf = new MathfieldElement();
  mf.id = 'mf';
  $('#fMathBox').append(mf);
  mf.mathVirtualKeyboardPolicy = 'manual';
  mf.macros = Object.assign({}, mf.macros, { dongdang: SIM_TEX });
  mf.inlineShortcuts = Object.assign({}, mf.inlineShortcuts, { dongdang: '\\dongdang' });
  let simInShadow = false;
  const mfVal = () => collapseSim(mf.getValue('latex-expanded')).trim();
  const fxValue = () => (fMode === 'v' ? mfVal() : collapseSim(fTex.value).trim());
  const syncTex = () => { fTex.value = mfVal(); previewF(); };

  // Chữ thường (có dấu tiếng Việt, có khoảng trắng) gõ ở ô riêng rồi đưa vào công thức dưới dạng \text{...}
  function addText() {
    const el = $('#fText'), v = el.value.replace(/[\\{}#~^]/g, '');
    if (!v.trim()) return;
    el.value = '';
    // % & _ $ không nằm được trong \text nên tách ra ngoài thành ký hiệu riêng
    fIns(v.split(/([%&_$])/).map((p) => (!p ? '' : /^[%&_$]$/.test(p) ? '\\' + p : '\\text{' + p + '}')).join(''), true);
  }
  // Gõ chữ ngay tại con trỏ: chuyển ô nhập giữa chế độ toán và chế độ chữ (nhận dấu cách, chữ có dấu)
  function syncTM() { const m = fMode === 'v' && mf.mode === 'text' ? 'text' : 'math'; for (const b of $('#fTM').children) b.setAttribute('aria-pressed', b.dataset.m === m); }
  function setTM(m) {
    if (fMode !== 'v') { $('#fText').focus(); return; }
    mf.focus();
    if (mf.mode !== m) mf.executeCommand(['switchMode', m]);
    syncTM();
  }
  // Enter: xuống dòng mới. Công thức nhiều dòng được giữ dưới dạng \displaylines{dòng 1 \\ dòng 2}
  function newLine() {
    const v = mfVal(), m = /^\s*\\displaylines\{([\s\S]*)\}\s*$/.exec(v), inner = m ? m[1] : (v || '\\placeholder{}');
    mf.setValue('', { silenceNotifications: true });
    mf.insert('\\displaylines{' + inner + '\\\\#?}', { focus: true, selectionMode: 'after' });
    // đưa con trỏ vào ô trống của dòng mới (không nhảy về ô trống còn sót ở các dòng trên)
    try { mf.selection = { ranges: [[mf.lastOffset - 1, mf.lastOffset]], direction: 'forward' }; } catch (e) { mf.executeCommand('moveToMathfieldEnd'); }
    if (mf.mode !== 'math') mf.executeCommand(['switchMode', 'math']);
    syncTex(); syncTM();
  }
  function fIns(t, raw) {
    if (t === '\\text{#?}' && !raw) { setTM(mf.mode === 'text' ? 'math' : 'text'); return; }
    if (fMode === 'v') { mf.focus(); mf.insert(t, { focus: true, selectionMode: t.includes('#?') ? 'placeholder' : 'after' }); fTex.value = mfVal(); }
    else { fTex.setRangeText(t.replace(/#[?@]/g, ''), fTex.selectionStart, fTex.selectionEnd, 'end'); fTex.focus(); }
    previewF();
  }
  function setPfx(p) { pfx = p; $('#fPfx').textContent = p ? 'Ctrl+' + p.toUpperCase() + ': gõ tiếp một phím' + (p === 'g' ? ' chữ cái để ra chữ Hy Lạp' : '') + '…' : ''; }
  mf.addEventListener('input', syncTex);
  mf.addEventListener('mode-change', () => setTimeout(syncTM, 0));
  mf.addEventListener('selection-change', syncTM);
  mf.addEventListener('keydown', (e) => {
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (pfx && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'Shift') return;
      const p = pfx, t = p === 'g' ? (GREEK[e.key] ? '\\' + GREEK[e.key] : null) : p === 't' ? TPL[e.key.toLowerCase()] : SYM[e.key.toLowerCase()];
      setPfx(null); stop();
      if (t) fIns(t);
      return;
    }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) { stop(); newLine(); return; }
    if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey) { stop(); mf.executeCommand('addRowAfter'); syncTex(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Backspace') { stop(); mf.executeCommand('removeRow'); syncTex(); return; }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (e.key === 'Enter') { stop(); closeFx(true); return; }
    if (!e.shiftKey && (key === 'g' || key === 't' || key === 'k')) { stop(); setPfx(key); return; }
    const t = SC[(e.shiftKey ? 'shift+' : '') + key];
    if (t) { stop(); fIns(t); }
  }, true);
  $('#fKb').onclick = () => { const kb = window.mathVirtualKeyboard; if (!kb) return; mf.focus(); if (kb.visible) kb.hide(); else kb.show(); };

  function showTab(ti) {
    fTab = ti;
    const tabs = $('#tabs'), pal = $('#palette');
    [...tabs.children].forEach((b, i) => b.classList.toggle('on', i === ti));
    pal.innerHTML = '';
    const tab = PALETTE[ti];
    let items = tab.items;
    if (tab.grades) {
      // nhóm theo khối lớp: hàng nút Lớp 6 … Lớp 12, nhớ lớp đang dùng
      let g = 0;
      try { g = Math.min(tab.grades.length - 1, Math.max(0, +localStorage.getItem('tvs-grade-' + ti) || 0)); } catch (e) { /* không có bộ nhớ */ }
      const bar = document.createElement('div');
      bar.className = 'gradebar';
      tab.grades.forEach((gr, gi) => {
        const gb = document.createElement('button');
        gb.type = 'button'; gb.textContent = gr.name; gb.className = gi === g ? 'on' : '';
        gb.onmousedown = (e) => e.preventDefault();
        gb.onclick = () => { try { localStorage.setItem('tvs-grade-' + ti, gi); } catch (e) { /* bỏ qua */ } showTab(ti); };
        bar.appendChild(gb);
      });
      pal.appendChild(bar);
      items = tab.grades[g].items;
    }
    pal.classList.toggle('tall', !!tab.grades);
    items.forEach((item) => {
      const code = Array.isArray(item) ? item[1] : item;
      let shown = (Array.isArray(item) ? item[0] : item).replace(/#@|#\?/g, '\\square ');
      if (/^[\^_]/.test(shown)) shown = '\\square ' + shown;
      const b = document.createElement('button');
      b.type = 'button';
      if (tab.wide) b.className = 'wide';
      b.innerHTML = tex(shown, true);
      b.title = (SCREV.has(code) ? SCREV.get(code) + '  ·  ' : '') + code.replace(/#@|#\?/g, '□');
      b.onmousedown = (e) => e.preventDefault(); // giữ con trỏ trong ô công thức
      b.onclick = () => fIns(code);
      pal.appendChild(b);
    });
  }
  PALETTE.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.name; b.onclick = () => showTab(i); $('#tabs').appendChild(b); });

  function previewF() {
    clearTimeout(fT);
    fT = setTimeout(() => {
      const t = fxValue();
      if (!t) { fPrev.innerHTML = '<span class="ph">Công thức sẽ hiện ở đây, đúng như khi nằm trên trang.</span>'; return; }
      fPrev.innerHTML = `<span style="font-size:${fSt.size}px;color:${fSt.color}">${tex(texOf({ latex: t, bold: fSt.bold }))}</span>`;
    }, 120);
  }
  function setFMode(m) {
    fMode = m;
    for (const b of $('#fMode').children) b.setAttribute('aria-pressed', b.dataset.m === m);
    $('#fMathBox').hidden = m !== 'v'; fTex.hidden = m !== 'l'; $('#fVHint').hidden = m !== 'v';
    $('#fPaneT').textContent = m === 'v' ? 'TRỰC QUAN' : 'MÃ LATEX';
    if (m === 'v') { mf.setValue(fTex.value, { silenceNotifications: true }); setTimeout(() => mf.focus(), 30); } else { fTex.value = mfVal(); fTex.focus(); }
    syncTM();
  }
  for (const b of $('#fMode').children) b.onclick = () => setFMode(b.dataset.m);
  fTex.addEventListener('input', previewF);
  fTex.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); closeFx(true); } });
  const FCOL = ['#000000', '#1f3fa8', '#0a73c9', '#c81e1e', '#0f9d58', '#6a2fb5'];
  const fColBtns = FCOL.map((c) => { const b = document.createElement('button'); b.type = 'button'; b.style.background = c; b.title = c; b.onclick = () => { fSt.color = c; syncF(); }; $('#fColors').append(b); return b; });
  function syncF() {
    const sel = $('#fSize'), pt = toPt(fSt.size);
    if (![...sel.options].some((o) => +o.value === pt)) { const o = document.createElement('option'); o.value = o.textContent = pt; sel.append(o); }
    sel.value = pt;
    $('#fBold').setAttribute('aria-pressed', fSt.bold);
    fColBtns.forEach((b, i) => b.setAttribute('aria-pressed', FCOL[i].toLowerCase() === String(fSt.color).toLowerCase()));
    mf.style.color = fSt.color;
    mf.style.fontWeight = fSt.bold ? '700' : '';
    previewF();
  }
  $('#fTextAdd').onclick = addText;
  for (const b of $('#fTM').children) b.onclick = () => setTM(b.dataset.m);
  $('#fText').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addText();
    if (e.ctrlKey || e.metaKey) closeFx(true);
  });
  $('#fSize').addEventListener('change', (e) => { fSt.size = toPx(+e.target.value); syncF(); });
  $('#fBold').onclick = () => { fSt.bold = !fSt.bold; syncF(); };
  $('#fKeys').onclick = () => { $('#fKeyList').hidden = !$('#fKeyList').hidden; };

  // st: {size, color, bold} của công thức đang sửa (bỏ trống khi chèn công thức vào dòng chữ)
  function openFx(latex, done, st, okLabel) {
    fxDone = done;
    if (st) Object.assign(fSt, { size: +st.size || 16, color: st.color || '#000000', bold: !!st.bold });
    fTex.value = latex || '';
    $('#fxok').textContent = okLabel || (latex ? 'Cập nhật' : 'Chèn vào trang');
    $('#fKeyList').hidden = true;
    setPfx(null);
    $('#fxback').hidden = false;
    dlg.show();
    if (!simInShadow && mf.shadowRoot) { addSimCss(mf.shadowRoot); simInShadow = true; }
    showTab(fTab);
    syncF();
    setFMode('v');
  }
  function closeFx(ok) {
    if (!dlg.open) return;
    const v = fxValue();
    dlg.close();
    $('#fxback').hidden = true;
    try { if (window.mathVirtualKeyboard) window.mathVirtualKeyboard.hide(); } catch (e) { /* không có bàn phím ảo */ }
    const d = fxDone; fxDone = null;
    if (d) d(ok ? v : null);
  }
  $('#fxok').onclick = () => closeFx(true);
  $('#fxcancel').onclick = () => closeFx(false);
  $('#fxback').addEventListener('pointerdown', (e) => e.preventDefault());
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); if (pfx) setPfx(null); else closeFx(false); } });

  function editFormula(o, isNew) {
    openFx(o.latex, (v) => {
      if (v !== null) Object.assign(o, { size: fSt.size, color: fSt.color, bold: fSt.bold });
      if (OFFICE && OFFICE.auto) return officeDone(o, v);
      if (v === null || (isNew && !v.trim())) {
        if (isNew) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); }
        return;
      }
      o.latex = v; renderObj(o); buildProps(); commit();
    }, o, OFFICE && OFFICE.auto ? 'Chèn vào ' + officeName() : null);
  }
  function editText(o) {
    const el = page.querySelector(`[data-id="${o.id}"]`);
    el.classList.add('editing');
    el.contentEditable = 'plaintext-only';
    el.textContent = o.text;
    el.focus();
    document.getSelection().selectAllChildren(el);
    let fxAt = -1;
    el.addEventListener('blur', () => {
      o.text = el.innerText.replace(/\n$/, '');
      el.classList.remove('editing');
      el.contentEditable = 'false';
      el.removeEventListener('keydown', onKey);
      if (!o.text.trim() && fxAt < 0) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); commit(); return; }
      renderObj(o); buildProps(); commit();
      if (fxAt >= 0) {
        // Ctrl+M khi đang gõ chữ: chèn công thức đúng vị trí con trỏ
        const at = Math.min(fxAt, o.text.length);
        openFx('', (v) => {
          if (v) { o.text = o.text.slice(0, at) + '$' + v + '$' + o.text.slice(at); renderObj(o); buildProps(); commit(); }
          else if (!o.text.trim()) { S.objs = S.objs.filter((t) => t !== o); S.sel = null; renderAll(); buildProps(); commit(); }
        });
      }
    }, { once: true });
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') el.blur();
      else if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        const sel = document.getSelection();
        if (sel.rangeCount) { const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(el); r.setEnd(sel.focusNode, sel.focusOffset); fxAt = r.toString().length; } else fxAt = el.innerText.length;
        el.blur();
      }
    };
    el.addEventListener('keydown', onKey);
  }

  // ---------- Chuột ----------
  const pagePt = (e) => { const r = page.getBoundingClientRect(); return { x: Math.round((e.clientX - r.left) / S.zoom), y: Math.round((e.clientY - r.top) / S.zoom) }; };
  function newTextAt(p) {
    S.placing = false; page.classList.remove('placing');
    const o = insert('text', null, { x: Math.max(0, p.x - 4), y: Math.max(0, p.y - 14), text: '', w: Math.max(160, Math.min(460, 794 - p.x - 24)) });
    setTimeout(() => editText(o), 0);
  }
  page.addEventListener('pointerdown', (e) => {
    if (S.placing) { e.preventDefault(); e.stopPropagation(); if (document.activeElement) document.activeElement.blur(); newTextAt(pagePt(e)); return; }
    const el = e.target.closest('.obj');
    if (!el) { if (document.activeElement) document.activeElement.blur(); select(null); return; }
    if (el.classList.contains('editing')) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    const o = get(el.dataset.id);
    select(o.id);
    if (e.target.classList.contains('pth')) return pointDrag(e, o, el, e.target.dataset.pt);
    const resizing = e.target.classList.contains('handle');
    const p0 = { x: e.clientX, y: e.clientY }, st = { x: o.x, y: o.y, w: o.w, h: o.h, size: o.size, bw: el.offsetWidth };
    let moved = false;
    const mv = (ev) => {
      const dx = (ev.clientX - p0.x) / S.zoom, dy = (ev.clientY - p0.y) / S.zoom;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      if (!resizing) {
        o.x = Math.round(st.x + dx); o.y = Math.round(st.y + dy);
        el.style.left = o.x + 'px'; el.style.top = o.y + 'px';
        return;
      }
      if (o.type === 'formula') o.size = Math.max(8, Math.min(96, Math.round(st.size * (st.bw + dx) / st.bw)));
      else if (o.type === 'text') o.w = Math.max(60, Math.round(st.w + dx));
      else {
        o.w = Math.max(o.type === 'shape' ? 4 : 80, Math.round(st.w + dx));
        o.h = Math.max(o.type === 'shape' ? 2 : 50, Math.round(st.h + dy));
      }
      renderObj(o);
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      if (moved) { commit(); buildProps(); }
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  });
  page.addEventListener('dblclick', (e) => {
    const el = e.target.closest('.obj');
    if (!el) { newTextAt(pagePt(e)); return; } // nhấp đúp vào chỗ trống: gõ chữ ngay tại đó
    if (el.classList.contains('editing')) return;
    const o = get(el.dataset.id);
    if (o.type === 'formula') editFormula(o);
    else if (o.type === 'text') {
      const fx = e.target.closest('.ifx');
      if (!fx) return editText(o);
      const segs = o.text.split('$'), i = +fx.dataset.i;
      openFx(segs[i], (v) => { if (v === null) return; segs[i] = v; o.text = segs.join('$'); renderObj(o); buildProps(); commit(); });
    }
  });
  stage.addEventListener('pointerdown', (e) => { if (e.target === stage) select(null); });

  // ---------- Bảng thuộc tính ----------
  function buildProps() {
    const o = cur();
    props.innerHTML = '';
    if (!o) {
      props.innerHTML = `<div class="help"><b>Bắt đầu nhanh</b><br>• Bấm <b>Công thức</b> (Ctrl+M) để soạn công thức, nhấp đúp để sửa.<br>• <b>Gõ chữ</b>: nhấp đúp vào chỗ trống bất kỳ trên trang (hoặc bấm <b>Văn bản</b> rồi nhấp vào trang) và gõ tiếng Việt ngay tại đó; <b>Ctrl+M</b> khi đang gõ để chèn công thức tại con trỏ.<br>• <b>Sửa lại công thức</b>: nhấp đúp vào công thức (kể cả công thức nằm trong dòng chữ), hoặc chọn rồi nhấn Enter/F2.<br>• <b>Đồ thị</b>, <b>Biến thiên</b>, <b>Xét dấu</b>, <b>Miền nghiệm</b>: nhập biểu thức ở khung này, hình tự cập nhật.<br>• <b>Hình không gian</b>: chọn loại hình rồi bấm <b>Chèn hình</b>; nét khuất tự vẽ đứt.<br>• Kéo để di chuyển, kéo ô vuông ở góc để co giãn.<br>• <b>Ctrl+C</b> rồi dán vào Word/PowerPoint dưới dạng ảnh nét cao.<br><br><b>Cú pháp biểu thức</b><br><code>x^3-3x+1</code>, <code>(2x+1)/(x-1)</code>, <code>sqrt(x)</code>, <code>|x|</code>, <code>sin x</code>, <code>ln(x)</code>, <code>log(x)</code>, <code>e^x</code>, <code>2^x</code>, <code>pi</code></div>`;
      return;
    }
    const add = (el) => { props.appendChild(el); return el; };
    const mk = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html !== undefined) el.innerHTML = html; return el; };
    const onEdit = (k, v, rebuild) => { o[k] = v; renderObj(o); if (rebuild) buildProps(); };
    function field(k, label, kind, opt) {
      const wrap = mk('div');
      if (kind === 'chk') {
        const l = mk('label', 'chk'); const i = mk('input'); i.type = 'checkbox'; i.checked = !!o[k];
        i.onchange = () => { onEdit(k, i.checked); commit(); };
        l.append(i, label); wrap.appendChild(l); return wrap;
      }
      wrap.appendChild(mk('label', '', label));
      let i;
      if (kind === 'area') { i = mk('textarea'); i.rows = (opt && opt.rows) || 3; i.spellcheck = false; }
      else if (kind === 'sel') { i = mk('select'); for (const key in opt) { const op = mk('option', '', opt[key]); op.value = key; i.appendChild(op); } }
      else { i = mk('input'); i.type = kind === 'num' ? 'number' : kind === 'color' ? 'color' : 'text'; i.spellcheck = false; if (kind === 'num' && opt) i.step = opt; }
      i.value = o[k] === undefined ? '' : o[k];
      i.dataset.k = k;
      const read = () => (kind === 'num' ? (i.value === '' ? 0 : parseFloat(i.value)) : i.value);
      if (kind === 'sel') i.onchange = () => { if (opt.__on) opt.__on(i.value); onEdit(k, i.value, true); commit(); };
      else { i.oninput = () => onEdit(k, read()); i.onchange = () => commit(); }
      wrap.appendChild(i);
      return wrap;
    }
    const row = (...els) => { const r = mk('div', 'row'); els.forEach((e) => r.appendChild(e)); return add(r); };
    const btn = (label, fn, primary) => { const b = mk('button', primary ? 'primary' : '', label); b.onclick = fn; return add(b); };
    const help = (html) => add(mk('div', 'help', html));
    const h4 = (t) => add(mk('h4', '', t));
    // dựng nhanh bằng nút bấm từ các điểm đã chọn trên hình
    const quickEd = (dim) => {
      const sel = ptSel(o), N = sel.length, Q = (t) => t;
      h4('Dựng nhanh');
      help(N ? 'Đã chọn: <b>' + sel.join(', ') + '</b> (theo thứ tự nhấp)' : 'Nhấp vào các chấm tròn trên hình để chọn điểm (nhấp lại để bỏ). Chấm đặc kéo được bằng chuột; chấm rỗng là điểm dựng từ điểm khác.');
      const box = mk('div'); box.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 6px';
      const addLines = (lines) => { o.script = String(o.script || '').replace(/\s*$/, '') + '\n' + lines.join('\n'); S.ptSel = null; renderObj(o); commit(); buildProps(); };
      const B = (label, need, title, fn) => { const b = mk('button', '', label); b.title = title; b.style.cssText = 'width:auto;padding:3px 8px;font-size:12px;margin:0'; const ok = typeof need === 'number' ? N === need : need(N); b.disabled = !ok; b.onclick = () => addLines(fn(sel)); box.appendChild(b); };
      const P = (a) => a.join('');
      B('＋ Điểm mới', () => true, 'Thêm một điểm tự do rồi kéo đến chỗ cần', () => {
        const n = freshName(o, 'M'), v = o._res && o._res.view;
        if (dim === 2) { const x = v ? Math.round(v.cx * 10) / 10 : 0, y = v ? Math.round(v.cy * 10) / 10 : 0; return [n + ' = (' + x + ', ' + y + ')', 'diem ' + n]; }
        return [n + ' = (0, 0, 0)', 'diem ' + n];
      });
      B('Đoạn', 2, 'Nối đoạn thẳng giữa 2 điểm', (a) => ['doan ' + P(a)]);
      if (dim === 3) B('Nét đứt', 2, 'Đoạn nét đứt', (a) => ['netdut ' + P(a)]);
      B('Đường thẳng', 2, 'Đường thẳng qua 2 điểm', (a) => ['duongthang ' + P(a)]);
      B('Vectơ', 2, 'Vectơ từ điểm 1 đến điểm 2', (a) => ['vecto ' + P(a)]);
      B('Trung điểm', 2, 'Trung điểm của 2 điểm đã chọn', (a) => { const n = freshName(o, 'M'); return [n + ' = trungdiem(' + a.join(', ') + ')', 'diem ' + n]; });
      if (dim === 2) B('Đường tròn', 2, 'Đường tròn tâm điểm 1, đi qua điểm 2', (a) => ['duongtron ' + a[0] + ' ' + a[1]]);
      B('Hạ vuông góc', 3, 'Từ điểm 1 hạ vuông góc xuống đường thẳng qua điểm 2 và 3', (a) => { const n = freshName(o, 'H'); return [n + ' = chan(' + a.join(', ') + ')', 'doan ' + a[0] + n, 'vuong ' + a[0] + n + a[2]]; });
      B('Phân giác góc', 3, 'Phân giác của góc tạo bởi 3 điểm, đỉnh là điểm thứ 2 (chọn theo thứ tự X, đỉnh, Y)', (a) => { const n = freshName(o, 'D'); return [n + ' = phangiacgoc(' + a.join(', ') + ')', 'tia ' + a[1] + n, 'an ' + n, 'goc ' + a[0] + a[1] + n + ' ' + n + a[1] + a[2]]; });
      B('Số đo góc', 3, 'Ghi số đo thật của góc (đỉnh là điểm thứ 2)', (a) => ['goc ' + P(a) + ' = ?']);
      B('Góc vuông', 3, 'Ký hiệu góc vuông (đỉnh là điểm thứ 2)', (a) => ['vuong ' + P(a)]);
      B('Trọng tâm', 3, 'Trọng tâm tam giác', (a) => { const n = freshName(o, 'G'); return [n + ' = trongtam(' + a.join(', ') + ')', 'diem ' + n]; });
      B('Hình bình hành', 3, 'Thêm đỉnh thứ tư để được hình bình hành (theo thứ tự đã chọn)', (a) => { const n = freshName(o, 'D'); return [n + ' = hbh(' + a.join(', ') + ')', 'dagiac ' + P(a) + n]; });
      B('Giao điểm', 4, 'Giao điểm của đường thẳng (1,2) và đường thẳng (3,4)', (a) => { const n = freshName(o, 'I'); return [n + ' = giao(' + a.join(', ') + ')', 'diem ' + n]; });
      B('Đánh dấu bằng nhau', 4, 'Gạch đánh dấu đoạn (1,2) bằng đoạn (3,4)', (a) => ['bang ' + a[0] + a[1] + ' ' + a[2] + a[3]]);
      B('Đa giác', (n) => n >= 3, 'Nối các điểm thành đa giác', (a) => ['dagiac ' + P(a)]);
      if (dim === 2) B('Độ dài', 2, 'Ghi độ dài thật của đoạn', (a) => ['ghi ' + P(a) + ' = ?']);
      add(box);
      if (N) { const c = mk('button', '', 'Bỏ chọn'); c.style.cssText = 'padding:2px 8px;font-size:12px;margin-bottom:6px'; c.onclick = () => { S.ptSel = null; renderObj(o); buildProps(); }; add(c); }
    };    // các điểm cho bằng toạ độ số trong kịch bản: hiện thành ô số để sửa nhanh
    const coordEd = (dim) => {
      const RE = /^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?)\s*)?\)\s*(#.*)?$/;
      const rows = [];
      String(o.script || '').split('\n').forEach((ln, i) => { const m = ln.trim().match(RE); if (m && (dim === 3) === (m[4] !== undefined)) rows.push({ i, name: m[1], v: [m[2], m[3], m[4]].filter((x) => x !== undefined).map(Number), cm: m[5] || '' }); });
      if (!rows.length) return;
      h4('Toạ độ các điểm (' + (dim === 3 ? 'x, y, z' : 'x, y') + ')');
      rows.forEach((r) => {
        const wrap = mk('div'); wrap.style.cssText = 'display:flex;gap:4px;align-items:center;margin:2px 0';
        const lb = mk('label', '', r.name); lb.style.cssText = 'width:30px;margin:0;font-weight:600'; wrap.appendChild(lb);
        r.v.forEach((val, k) => {
          const inp = mk('input'); inp.type = 'number'; inp.step = '0.1'; inp.value = val; inp.title = ['x', 'y', 'z'][k]; inp.style.cssText = 'flex:1;min-width:0';
          inp.oninput = () => { const x = parseFloat(inp.value); if (isNaN(x)) return; r.v[k] = x; const L = String(o.script).split('\n'); L[r.i] = r.name + ' = (' + r.v.join(', ') + ')' + (r.cm ? '   ' + r.cm : ''); o.script = L.join('\n'); renderObj(o); const ta = props.querySelector('textarea[data-k="script"]'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wrap.appendChild(inp);
        });
        add(wrap);
      });
    };
    // đổi tên hiển thị của điểm: ghi thành dòng "nhan X = tên mới" trong kịch bản
    const nameEd = () => {
      const lines = String(o.script || '').split('\n'), defs = [], shown = {};
      lines.forEach((ln) => {
        const d = ln.trim().match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=/); if (d && !defs.includes(d[1])) defs.push(d[1]);
        const n = ln.trim().match(/^nhan\s+([A-Z](?:'{1,2}|_?\d)?)\s*=\s*(.*)$/); if (n) shown[n[1]] = n[2].trim();
      });
      if (!defs.length) return;
      h4('Tên hiển thị của điểm');
      const grid = mk('div'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px';
      defs.forEach((nm) => {
        const cell = mk('div'); cell.style.cssText = 'display:flex;align-items:center;gap:3px';
        const lb = mk('label', '', nm); lb.style.cssText = 'margin:0;font-size:11px;color:#667;min-width:18px';
        const inp = mk('input'); inp.type = 'text'; inp.value = shown[nm] !== undefined ? shown[nm] : nm; inp.style.cssText = 'width:100%;min-width:0'; inp.spellcheck = false;
        inp.onchange = () => {
          const v = inp.value.trim(), L = String(o.script).split('\n').filter((ln) => !new RegExp('^\\s*nhan\\s+' + nm.replace(/'/g, "\\'") + '\\s*=').test(ln));
          if (v !== nm) L.push('nhan ' + nm + ' = ' + v);
          o.script = L.join('\n'); renderObj(o); commit(); buildProps();
        };
        cell.append(lb, inp); grid.appendChild(cell);
      });
      add(grid);
      help('Để trống ô để ẩn tên điểm. Tên có thể là LaTeX, ví dụ <code>A\'</code>, <code>O_1</code>.');
    };    const range = () => {
      h4('Hệ trục');
      row(field('xmin', 'x từ'), field('xmax', 'đến'));
      row(field('ymin', 'y từ'), field('ymax', 'đến'));
      row(field('xstep', 'Bước chia x'), field('ystep', 'Bước chia y'));
      add(field('grid', 'Hiện lưới', 'chk')); add(field('ticks', 'Hiện vạch chia và số', 'chk'));
    };

    if (o.type === 'formula') {
      btn('✎ Sửa công thức…', () => editFormula(o), true);
      add(field('latex', 'Mã LaTeX', 'area', { rows: 4 }));
      const szw = mk('div'); szw.appendChild(mk('label', '', 'Cỡ chữ (pt, như Word)'));
      const szi = mk('input'); szi.type = 'number'; szi.step = 0.5; szi.min = 6; szi.value = toPt(o.size);
      szi.oninput = () => { const v = parseFloat(szi.value); if (v >= 4) { o.size = toPx(v); renderObj(o); } };
      szi.onchange = () => commit();
      szw.appendChild(szi);
      row(szw, field('color', 'Màu', 'color'));
      add(field('bold', 'Chữ đậm', 'chk'));
    } else if (o.type === 'text') {
      add(field('text', 'Nội dung (công thức đặt giữa $…$)', 'area', { rows: 6 }));
      btn('∑ Chèn công thức vào văn bản…', () => openFx('', (v) => { if (v) { o.text += (o.text && !/\s$/.test(o.text) ? ' ' : '') + '$' + v + '$'; renderObj(o); buildProps(); commit(); } }));
      row(field('size', 'Cỡ chữ', 'num'), field('color', 'Màu', 'color'));
      add(field('align', 'Căn lề', 'sel', { left: 'Trái', center: 'Giữa', right: 'Phải', justify: 'Đều hai bên' }));
      row(field('bold', 'Đậm', 'chk'), field('italic', 'Nghiêng', 'chk'));
    } else if (o.type === 'graph') {
      add(field('funcs', 'Hàm số y = … (mỗi dòng một hàm)', 'area', { rows: 3 }));
      add(field('legend', 'Hiện công thức hàm số', 'chk'));
      add(field('piTicks', 'Chia trục x theo π/2 (hàm lượng giác)', 'chk'));
      range();
      h4('Điểm, tiệm cận, hình phẳng');
      add(field('points', 'Điểm đánh dấu, vd: A(1; -2)', 'area', { rows: 2 }));
      add(field('proj', 'Vẽ đường gióng xuống hai trục', 'chk'));
      add(field('guides', 'Đường nét đứt, vd: x = 1, y = 2'));
      row(field('shadeA', 'Tô hình phẳng từ x ='), field('shadeB', 'đến x ='));
      help('Hình phẳng giới hạn bởi hàm thứ nhất và hàm thứ hai (hoặc trục Ox nếu chỉ có một hàm).');
      add(field('stroke', 'Độ dày nét', 'num', 0.1));
    } else if (o.type === 'bbt') {
      add(field('expr', o.signOnly ? 'Biểu thức f(x) cần xét dấu' : 'Hàm số y = f(x)'));
      row(field('a', 'Khảo sát từ (trống = −∞)'), field('b', 'đến (trống = +∞)'));
      btn(o.signOnly ? '⚙ Lập bảng xét dấu tự động' : '⚙ Lập bảng biến thiên tự động', () => {
        try { const note = autoBBT(o); renderObj(o); buildProps(); commit(); msg(note || 'Đã lập bảng cho ' + o.expr, !!note); } catch (e) { msg('Lỗi: ' + e.message, true); }
      }, true);
      h4('Chỉnh tay (LaTeX, ngăn cách bằng |)');
      add(field('xrow', 'Hàng x', 'area', { rows: 2 }));
      add(field('drow', o.signOnly ? 'Hàng dấu: dấu | giá trị | dấu …' : "Hàng y': dấu | giá trị | dấu …", 'area', { rows: 2 }));
      if (!o.signOnly) add(field('frow', 'Hàng y: giá trị tại từng cột', 'area', { rows: 3 }));
      row(field('lx', 'Nhãn hàng 1'), field('ld', 'Nhãn hàng 2'), ...(o.signOnly ? [] : [field('lf', 'Nhãn hàng 3')]));
      help('Dấu: <code>+</code> <code>-</code>; <code>x</code> = khoảng không xác định (gạch chéo); <code>||</code> = không xác định tại điểm. Ở hàng y, viết <code>-\\infty || +\\infty</code> cho giới hạn trái || phải. Mũi tên tự vẽ theo dấu của y\'. Có thể dùng tham số, vd <code>\\frac{m}{2}</code>.');
    } else if (o.type === 'region') {
      add(field('ineqs', 'Hệ bất phương trình (mỗi dòng một BPT)', 'area', { rows: 5 }));
      add(field('style', 'Cách thể hiện', 'sel', { hatch: 'Gạch bỏ phần không là nghiệm (kiểu SGK)', fill: 'Tô màu miền nghiệm' }));
      add(field('vertices', 'Ghi toạ độ các đỉnh của miền nghiệm', 'chk'));
      add(field('lineNames', 'Đặt tên đường thẳng d₁, d₂, …', 'chk'));
      help('Dùng <code>&lt;=</code>, <code>&gt;=</code>, <code>&lt;</code>, <code>&gt;</code>. Bất phương trình ngặt được vẽ bằng nét đứt.');
      range();
    } else if (o.type === 'solid') {
      const round = Solid.isRound(o.kind);
      add(field('kind', 'Loại hình', 'sel', Object.assign({ __on: (k) => Object.assign(o, { points: '', segs: '' }, SOLID_DEFAULTS[k]) }, Solid.KINDS)));
      if (round) {
        row(field('a', o.kind === 'noncut' ? 'Bán kính đáy lớn' : 'Bán kính', 'num', 0.1), ...(o.kind === 'noncut' ? [field('b', 'Bán kính đáy nhỏ', 'num', 0.1)] : []));
        if (o.kind !== 'cau') add(field('ch', 'Chiều cao', 'num', 0.1));
        add(field('pitch', 'Góc nhìn từ trên xuống (độ)', 'num'));
      } else {
        const cube = o.kind === 'lapphuong' || o.kind === 'tudien';
        row(field('a', 'Cạnh a', 'num', 0.1), ...(cube || (/chop3|langtru3/.test(o.kind) && o.base === 'deu') ? [] : [field('b', 'Cạnh b', 'num', 0.1)]), ...(cube ? [] : [field('ch', 'Chiều cao', 'num', 0.1)]));
        if (o.kind === 'chop3' || o.kind === 'langtru3') add(field('base', 'Đáy', 'sel', { deu: 'Tam giác đều cạnh a', vuongA: 'Tam giác vuông tại A (AB = a, AC = b)', vuongB: 'Tam giác vuông tại B (BC = a, BA = b)' }));
        if (o.kind === 'chop3' || o.kind === 'chop4') add(field('apex', 'Chân đường cao', 'sel', { tam: 'Tâm đáy (hình chóp đều)', A: 'Đỉnh A (SA ⊥ đáy)', B: 'Đỉnh B (SB ⊥ đáy)' }));
        if (o.kind === 'chopcut') add(field('ratio', 'Tỉ số đáy nhỏ / đáy lớn', 'num', 0.05));
        row(field('yaw', 'Xoay ngang (độ)', 'num'), field('pitch', 'Nhìn từ trên (độ)', 'num'));
        h4('Điểm và đoạn thẳng thêm');
        add(field('points', 'Điểm thêm (mỗi dòng một điểm)', 'area', { rows: 3 }));
        help('<code>M = SA</code>: trung điểm SA · <code>O = AC</code>: tâm đáy · <code>G = ABC</code>: trọng tâm tam giác.');
        add(field('segs', 'Đoạn nối thêm, vd: SO, AC, BM'));
        help('Nét liền / nét đứt được xác định tự động theo góc nhìn.');
      }
      add(field('labels', 'Hiện tên điểm / kích thước', 'chk'));
      add(field('fill', 'Tô nhạt các mặt nhìn thấy', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
    } else if (o.type === 'plane') {
      const kinds = { __on: (k) => { o.script = Plane.scriptOf(k); } };
      Plane.KINDS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Hình mẫu (chọn lại sẽ thay kịch bản bên dưới)', 'sel', kinds));
      const ps = Plane.params(o.script);
      if (ps.length) {
        h4('Thông số (đổi số thì hình và số đo đổi theo)');
        ps.forEach((p) => {
          const wdiv = mk('div'); wdiv.appendChild(mk('label', '', p.label));
          const inp = mk('input'); inp.type = 'number'; inp.step = 'any'; inp.value = p.value;
          inp.oninput = () => { if (inp.value === '' || isNaN(parseFloat(inp.value))) return; o.script = Plane.setParam(o.script, p.name, parseFloat(inp.value)); renderObj(o); const ta = props.querySelector('textarea'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wdiv.appendChild(inp); add(wdiv);
        });
        h4('Kịch bản');
      }
      quickEd(2);
      coordEd(2);
      nameEd();
      const scr = add(field('script', 'Kịch bản dựng hình: điểm và lệnh vẽ, mỗi dòng một ý', 'area', { rows: 13 }));
      scr.querySelector('textarea').addEventListener('change', () => buildProps());
      add(field('labels', 'Hiện tên điểm', 'chk'));
      add(field('dots', 'Chấm tròn tại mọi điểm', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      h4('Cách viết');
      help('<b>Điểm</b>: <code>A = (1, 2)</code> · <code>M = trungdiem(A, B)</code> · <code>H = chan(A, B, C)</code> (chân đường vuông góc từ A xuống BC) · <code>D = phangiac(A, B, C)</code> (<b>đỉnh A viết trước</b>: chân phân giác góc A của tam giác ABC, nằm trên BC) · <code>M = phangiacgoc(D, A, B, D, C)</code> (<b>đỉnh ở giữa</b> như lệnh goc: phân giác góc DAB cắt đường thẳng DC tại M) · <code>G = trongtam(A, B, C)</code> · <code>tructam</code> · <code>tamnoi</code> · <code>tamngoai</code> · <code>I = giao(A, B, C, D)</code> · <code>N = chia(A, B, 1/3)</code> · <code>doixung(A, O)</code> · <code>doixungtruc(A, B, C)</code> · <code>quay(A, O, 60)</code> · <code>tinhtien(A, B, C)</code> · <code>D = hbh(A, B, C)</code> · <code>tron(O, 3, 45)</code> · <code>tiepdiem(M, O, A, 1)</code>');
      help('<b>Nét vẽ</b>: <code>doan AB CD</code> · <code>netdut AH</code> · <code>dagiac ABCD</code> · <code>duongthang AB</code> · <code>tia OA</code> · <code>vecto AB</code> · <code>duongtron O A</code> hoặc <code>duongtron O 2.5</code> · <code>ngoaitiep ABC</code> · <code>noitiep ABC</code> · <code>cung O A B</code> · <code>quat O A B</code> · <code>to ABC</code> (tô nền)');
      help('<b>Vectơ, hệ trục</b>: <code>vecto AB = \\vec{a} do</code> (tên vectơ, màu đỏ; cũng dùng cho <code>doan</code>, <code>duongthang</code>) · <code>truc -1 5 -1 4 luoi</code> (hệ trục Oxy từ x = −1 đến 5, y = −1 đến 4, có lưới). Màu: <code>do</code>, <code>xanh</code>, <code>xanhla</code>, <code>xam</code>, <code>cam</code>, <code>tim</code>.');
      help('<b>Thông số và số đo</b>: dòng <code>so_do = 60  # chú thích</code> tạo một thông số; dùng tên đó trong toạ độ và phép dựng, ví dụ <code>B = quay(A, O, so_do)</code>. Viết <code>goc AOB = ?</code> hoặc <code>ghi AB = ? cm</code> để hình tự ghi số đo thật.');
      help('<b>Ký hiệu</b>: <code>goc BAC = 60^{\\circ}</code> (đỉnh ở giữa; thêm <code>x2</code> để vẽ hai cung) · <code>vuong BAC</code> · <code>bang AB AC = 1</code> (số gạch) · <code>ssong AB CD</code> · <code>ghi AB = 5\\,cm</code> · <code>diem M N</code> (chấm điểm) · <code>an P Q</code> (ẩn tên) · <code>nhan A = x</code> (đổi tên hiển thị)');
    } else if (o.type === 'space') {
      const kinds = { __on: (k) => { o.script = Space.scriptOf(k); Object.assign(o, Space.viewOf(k)); } };
      Space.KINDS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Hình mẫu (chọn lại sẽ thay kịch bản bên dưới)', 'sel', kinds));
      const ps = Space.params(o.script);
      if (ps.length) {
        h4('Thông số (đổi số thì hình đổi theo)');
        ps.forEach((p) => {
          const wdiv = mk('div'); wdiv.appendChild(mk('label', '', p.label));
          const inp = mk('input'); inp.type = 'number'; inp.step = 'any'; inp.value = p.value;
          inp.oninput = () => { if (inp.value === '' || isNaN(parseFloat(inp.value))) return; o.script = Space.setParam(o.script, p.name, parseFloat(inp.value)); renderObj(o); const ta = props.querySelector('textarea'); if (ta) ta.value = o.script; };
          inp.onchange = () => commit();
          wdiv.appendChild(inp); add(wdiv);
        });
      }
      quickEd(3);
      coordEd(3);
      nameEd();
      h4('Góc nhìn');
      add(field('proj', 'Cách chiếu', 'sel', { xien: 'Chiếu xiên như SGK (mặt nằm ngang là hình bình hành)', xoay: 'Xoay tự do' }));
      if (o.proj === 'xoay') row(field('yaw', 'Xoay ngang (độ)', 'num'), field('pitch', 'Nhìn từ trên (độ)', 'num'));
      else row(field('ob', 'Góc xiên (độ)', 'num'), field('ok', 'Tỉ số rút gọn', 'num', 0.05));
      h4('Kịch bản');
      const scr = add(field('script', 'Kịch bản dựng hình (toạ độ x, y, z; z hướng lên)', 'area', { rows: 13 }));
      scr.querySelector('textarea').addEventListener('change', () => buildProps());
      add(field('labels', 'Hiện tên điểm', 'chk'));
      add(field('dots', 'Chấm tròn tại mọi điểm', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'), field('lcolor', 'Màu tên', 'color'));
      h4('Cách viết');
      help('<b>Điểm</b>: <code>A = (1, 2, 0)</code> · <code>trungdiem(A, B)</code> · <code>chia(A, B, 1/3)</code> · <code>trongtam(A, B, C)</code> · <code>tinhtien(M, A, B)</code> (M + vectơ AB) · <code>hbh(A, B, C)</code> · <code>chan(M, A, B)</code> (chân đường vuông góc xuống AB) · <code>chanmp(M, P)</code> (hình chiếu vuông góc lên (P)) · <code>vuonggoc(H, P, 3)</code> (điểm cách H một đoạn 3 trên đường vuông góc với (P)) · <code>giao(A, B, P)</code> (AB cắt (P)) · <code>giao(A, B, C, D)</code> · <code>chieu(M, P, A, B)</code> (chiếu song song theo phương AB) · <code>trenmp(P, 0.3, 0.6)</code> · <code>doixungmp(M, P)</code>');
      help('<b>Mặt phẳng</b>: <code>mp P ngang O 8 5</code> (nằm ngang, tâm O, rộng 8, sâu 5) · <code>mp Q dung O 6 4 30</code> (thẳng đứng, quay 30°) · <code>mp Q nghieng O 6 4 50</code> (nghiêng 50°) · <code>mp R: A B C D</code> (qua các điểm). Thêm <code>lien</code> để cạnh mặt phẳng luôn nét liền. <code>nhanmp P 2</code>: đặt tên ở góc thứ 2 (0 = ẩn). Tên <code>alpha</code>, <code>beta</code> hiện thành α, β.');
      help('<b>Nét vẽ</b>: <code>doan AB</code> · <code>duongthang AB = a do</code> (tên a, màu đỏ) · <code>keo 0.5</code> (kéo dài hai đầu) · <code>tia OA</code> · <code>vecto AB</code> · <code>dagiac ABC</code> · <code>netdut AH</code> / <code>netlien AH</code> (bắt buộc kiểu nét). Phần bị mặt phẳng che <b>tự vẽ nét đứt</b>. Màu: <code>do</code>, <code>xanh</code>, <code>xanhla</code>, <code>den</code>, <code>xam</code>, <code>cam</code>, <code>tim</code>.');
      help('<b>Hệ trục Oxyz (lớp 12)</b>: dòng <code>oxyz</code> để toạ độ điểm theo SGK 12 (Ox hướng về phía người nhìn, Oy sang phải, Oz lên trên) · <code>truc 4 4 4</code> vẽ ba trục · <code>toado M</code> vẽ các đường gióng và ghi toạ độ của M · <code>vecto OM = \\vec{u} do</code>');
      help('<b>Ký hiệu</b>: <code>vuong SHA</code> · <code>goc HAB = \\varphi</code> hoặc <code>= ?</code> (số đo thật) · <code>bang AI IB = 1</code> · <code>ghi MH = ?</code> · <code>diem I M</code> · <code>an X</code> · <code>nhan A1 = A\'</code> · <code>vitri A tren</code> · <code>to P</code>');
    } else if (o.type === 'sym') {
      const kinds = { __on: (k) => Object.assign(o, SGK.sizeOf(k)) };
      SGK.GROUPS.forEach((g) => { for (const k in g[1]) kinds[k] = g[1][k][0]; });
      add(field('kind', 'Ký hiệu', 'sel', kinds));
      if (o.kind === 'oluongtu') { add(field('data', 'Các ô (cách nhau bằng dấu cách)')); help('<code>ud</code>: hai electron ghép đôi · <code>u</code>: một electron · <code>d</code>: một electron quay xuống · <code>-</code>: ô trống. Ví dụ 2p⁴: <code>ud u u</code>'); }
      add(field('label', 'Nhãn phía trên (LaTeX, vd R_1)'));
      add(field('inner', 'Hiện chữ chú thích có sẵn trong hình', 'chk'));
      row(field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu nét', 'color'));
      help('Kéo ô vuông ở góc để co giãn. Ghép các ký hiệu với nút <b>Đoạn</b> để vẽ sơ đồ mạch điện.');
    } else if (o.type === 'numline') {
      const kinds = { __on: (k) => Object.assign(o, JSON.parse(JSON.stringify(NumLine.KINDS[k][1]))) };
      for (const k in NumLine.KINDS) kinds[k] = NumLine.KINDS[k][0];
      add(field('kind', 'Mẫu (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      h4('Tập hợp, bất phương trình (mỗi dòng một trục số)');
      const sets = add(field('sets', '', 'area', { rows: 4 }));
      const nRows = () => String(o.sets || '').split('\n').filter((t) => t.trim()).length;
      let rowsNow = nRows();
      sets.querySelector('textarea').addEventListener('input', () => { const n = nRows(); if (n !== rowsNow && n > 0) { rowsNow = n; o.h = NumLine.rowsH(o.sets); renderObj(o); const hi = props.querySelector('[data-k="h"]'); if (hi) hi.value = o.h; } });
      help('Bất phương trình: <code>x &gt; 4</code> · <code>x &lt;= 3/4</code> · <code>-2 &lt; x &lt;= 3</code> · <code>x &lt; -1 hoặc x &gt;= 2</code> · <code>x != 2</code>.<br>Tập hợp: <code>(-2; 3)</code> · <code>[1; +oo)</code> · <code>(-oo; sqrt(2)]</code> · <code>{1; 2; 5}</code> · <code>R</code>. Đặt tên: <code>E = [1; +oo)</code>, rồi dùng ở dòng sau: <code>E ∩ F</code>, <code>A ∪ B</code>, <code>A \\ B</code>, <code>R \\ A</code> (kết quả tự tính).');
      add(field('style', 'Cách thể hiện', 'sel', { hatch: 'Gạch bỏ phần không thuộc tập, dùng ngoặc [ ( (kiểu SGK)', bold: 'Tô đậm phần thuộc tập, chấm tròn đặc / rỗng' }));
      add(field('rowLabels', 'Ghi tập hợp ở đầu mỗi trục (kèm kết quả phép toán)', 'chk'));
      add(field('colorful', 'Mỗi tập một màu', 'chk'));
      add(field('zero', 'Luôn ghi điểm 0', 'chk'));
      h4('Điểm trên trục số (mỗi dòng một điểm)');
      add(field('points', '', 'area', { rows: 4 }));
      help('<code>A = 7/4</code> · <code>N = -sqrt(2)</code> · <code>-2 1/3</code> (hỗn số) · <code>0,3</code> · <code>4,1(6)</code> (tuần hoàn). Thêm <code>: nhãn LaTeX</code> để tự ghi nhãn, vd <code>M = 1.41 : \\sqrt{2}</code>.');
      add(field('plabel', 'Nhãn điểm', 'sel', { ten: 'Tên điểm ở trên (không tên thì ghi số)', so: 'Giá trị ở trên, tên điểm ở dưới' }));
      h4('Trục số');
      add(field('ticks', 'Vạch chia đơn vị', 'chk'));
      add(field('nums', 'Ghi số dưới vạch chia', 'chk'));
      row(field('step', 'Đơn vị (khoảng giữa hai số)', 'num', 0.5), field('sub', 'Chia mỗi đơn vị thành', 'num', 1));
      row(field('xmin', 'Hiện từ (trống = tự động)'), field('xmax', 'đến'));
      add(field('xname', 'Tên ẩn ở cuối trục (vd x)'));
      row(field('color', 'Màu trục', 'color'), field('pcolor', 'Màu điểm', 'color'), field('ncolor', 'Màu tên', 'color'));
    } else if (o.type === 'venn') {
      const kinds = { __on: (k) => Object.assign(o, JSON.parse(JSON.stringify(NumLine.VKINDS[k][1]))) };
      for (const k in NumLine.VKINDS) kinds[k] = NumLine.VKINDS[k][0];
      add(field('kind', 'Mẫu (chọn lại sẽ thay nội dung bên dưới)', 'sel', kinds));
      add(field('layout', 'Kiểu biểu đồ', 'sel', NumLine.LAYOUTS));
      add(field('names', 'Tên các tập (cách nhau bằng dấu phẩy)'));
      row(field('unv', 'Vẽ tập bao (khung chữ nhật)', 'chk'), field('uname', 'Tên tập bao'));
      h4('Phần tử (mỗi dòng một vùng)');
      add(field('elements', '', 'area', { rows: 4 }));
      help('<code>A: 1; 3; 5</code> chỉ thuộc A · <code>AB: 4; 27</code> thuộc cả A và B · <code>ABC: 0</code> · <code>ngoài: 8; 9</code> ngoài các tập. Phần tử cách nhau bằng dấu <code>;</code>.');
      h4('Tô vùng');
      add(field('shade', 'Biểu thức vùng tô (trống = không tô)'));
      help('<code>A ∩ B</code> · <code>A ∪ B</code> · <code>A \\ B</code> · <code>(A ∪ B) ∩ C</code> · <code>A\'</code> (phần bù) · <code>E \\ A</code>. Gõ được <code>\\cap</code>, <code>\\cup</code>, <code>\\</code>.');
      row(field('style', 'Kiểu tô', 'sel', { fill: 'Tô màu', hatch: 'Gạch chéo' }), field('fill', 'Màu tô', 'color'));
      add(field('colorful', 'Mỗi tập một màu viền', 'chk'));
      row(field('esize', 'Cỡ chữ phần tử', 'num'), field('stroke', 'Độ dày nét', 'num', 0.1), field('color', 'Màu', 'color'));
    } else if (o.type === 'shape') {
      row(field('color', 'Màu nét', 'color'), field('sw', 'Độ dày', 'num', 0.5));
      add(field('dash', 'Nét đứt', 'chk'));
      if (o.kind === 'line' || o.kind === 'arrow') add(field('flip', 'Đảo hướng chéo', 'chk'));
      else { add(field('nofill', 'Không tô nền', 'chk')); add(field('fill', 'Màu nền', 'color')); }
    }
    h4('Vị trí' + (o.w && o.type !== 'formula' ? ' và kích thước' : ''));
    row(field('x', 'X', 'num'), field('y', 'Y', 'num'));
    if (o.type !== 'formula' && o.type !== 'text') row(field('w', 'Rộng', 'num'), field('h', 'Cao', 'num'));
    const er = add(mk('div', 'err')); er.id = 'perr'; er.textContent = o._err || '';
  }

  // ---------- Lệnh ----------
  function setZoom(z) {
    S.zoom = Math.max(0.4, Math.min(3, z));
    page.style.zoom = S.zoom;
    $('#zoomlbl').textContent = Math.round(S.zoom * 100) + '%';
  }
  const fxLatex = () => { const o = cur(); return o && o.type === 'formula' ? o.latex : null; };
  async function confirmDiscard() {
    if (!S.dirty || !S.objs.length) return true;
    return api ? api.confirm('Tài liệu chưa lưu. Bỏ các thay đổi?') : window.confirm('Tài liệu chưa lưu. Bỏ các thay đổi?');
  }
  const CMD = {
    'ins-formula': () => editFormula(insert('formula'), true),
    'ins-text': () => { S.placing = true; page.classList.add('placing'); msg('Nhấp vào vị trí bất kỳ trên trang để gõ chữ (Esc: thôi)'); },
    'ins-graph': () => { insert('graph'); commit(); },
    'ins-bbt': () => { insert('bbt'); commit(); },
    'ins-sign': () => { insert('sign'); commit(); },
    'ins-region': () => { insert('region'); commit(); },
    'ins-solid': () => { const v = $('#solidKind').value; if (v.startsWith('sp:')) insert('space', v.slice(3)); else insert('solid', v); commit(); },
    'ins-plane': () => { insert('plane', $('#planeKind').value); commit(); },
    'ins-sym': () => { insert('sym', $('#symKind').value); commit(); },
    'ins-numline': () => { insert('numline', 'bpt'); commit(); },
    'ins-venn': () => { insert('venn', 'phantu'); commit(); },
    'ins-line': () => { insert('shape', 'line'); commit(); },
    'ins-arrow': () => { insert('shape', 'arrow'); commit(); },
    'ins-rect': () => { insert('shape', 'rect'); commit(); },
    'ins-ellipse': () => { insert('shape', 'ellipse'); commit(); },
    undo: () => restore(S.hpos - 1),
    redo: () => restore(S.hpos + 1),
    del: () => { if (!cur()) return; S.objs = S.objs.filter((o) => o.id !== S.sel); S.sel = null; renderAll(); buildProps(); commit(); },
    dup: () => { const o = cur(); if (!o) return; paste(JSON.parse(JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : v)))); },
    front: () => { const o = cur(); if (!o) return; S.objs = S.objs.filter((t) => t !== o).concat([o]); renderAll(); commit(); },
    back: () => { const o = cur(); if (!o) return; S.objs = [o].concat(S.objs.filter((t) => t !== o)); renderAll(); commit(); },
    copyimg: async () => {
      if (!cur()) return msg('Hãy chọn một đối tượng để sao chép', true);
      if (!api) return;
      try { await api.capture({ target: S.sel, mode: 'clipboard' }); msg('Đã chép ảnh vào bộ nhớ tạm — dán (Ctrl+V) vào Word/PowerPoint'); } catch (e) { msg('Lỗi chép ảnh: ' + e.message, true); }
    },
    copytex: () => { const l = fxLatex(); if (l === null) return msg('Hãy chọn một công thức', true); if (api) api.copyText(multiline(l).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim')); msg('Đã chép mã LaTeX'); },
    copymml: () => {
      const l = fxLatex(); if (l === null) return msg('Hãy chọn một công thức', true);
      const mml = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">' + MathLive.convertLatexToMathMl(multiline(l).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim')) + '</math>';
      if (api) api.copyText(mml);
      msg('Đã chép MathML — trong Word, dán bằng "Chỉ giữ văn bản" (Keep Text Only) để thành công thức');
    },
    png: async () => {
      if (!api) return;
      try { const f = await api.capture({ target: S.sel || 'page', mode: 'file', name: S.sel ? 'hinh' : 'trang' }); if (f) msg('Đã xuất ' + f); } catch (e) { msg('Lỗi xuất ảnh: ' + e.message, true); }
    },
    pdf: async () => { if (!api) return; const z = S.zoom; setZoom(1); try { const f = await api.pdf(); if (f) msg('Đã xuất ' + f); } catch (e) { msg('Lỗi xuất PDF: ' + e.message, true); } setZoom(z); },
    new: async () => { if (await confirmDiscard()) loadDoc([], null); },
    open: async () => {
      if (!api || !(await confirmDiscard())) return;
      const r = await api.open();
      if (!r) return;
      try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); msg('Đã mở ' + r.file); } catch (e) { msg('Tệp không hợp lệ', true); }
    },
    save: async (as) => {
      if (!api) return;
      const data = JSON.stringify({ app: 'ToanVietStudio', version: 1, objects: JSON.parse(serialize()) }, null, 1);
      const f = await api.save(data, as === true ? null : S.file);
      if (f) { S.file = f; S.dirty = false; title(); msg('Đã lưu ' + f); }
    },
    saveas: () => CMD.save(true),
    toword: () => toOffice('word'),
    toppt: () => toOffice('ppt'),
    fromoffice: async () => {
      if (!api) return;
      const r = await api.office({ action: 'read' });
      if (!r.ok) return msg(r.error, true);
      try {
        const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0))));
        o.x = 60; o.y = Math.round(50 + stage.scrollTop / S.zoom);
        paste(o);
        msg('Đã lấy đối tượng từ ' + r.from + '. Sửa xong bấm "Vào ' + r.from + '" để thay cho hình đang chọn.');
        if (o.type === 'formula') editFormula(o);
      } catch (e) { msg('Không đọc được dữ liệu của hình đang chọn', true); }
    },
    zoomin: () => setZoom(S.zoom + 0.1), zoomout: () => setZoom(S.zoom - 0.1), zoom100: () => setZoom(1),
    demo: async () => { if (await confirmDiscard()) window.__demo(); },
  };
  // Lựa chọn 'chèn dạng Equation của Word' (nhớ cho lần sau)
  const eqMode = () => { try { return localStorage.getItem('tvs-insert-eq') === '1'; } catch (e) { return false; } };
  // ToanViet -> MathML để Word đổi sang Equation (dấu đồng dạng đổi thành ký hiệu ∽ chuẩn)
  const toMathML = (o) => '<math xmlns="http://www.w3.org/1998/Math/MathML">' + MathLive.convertLatexToMathMl(multiline(o.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim ')) + '</math>';
  async function toOffice(app) {
    const o = cur();
    if (!o) return msg('Hãy chọn công thức hoặc hình cần chèn', true);
    if (!api) return;
    const name = app === 'word' ? 'Word' : 'PowerPoint';
    msg('Đang chèn vào ' + name + '…');
    const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v)));
    let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); });
    // công thức vào Word dạng Equation gốc (nếu người dùng chọn)
    const asEq = app === 'word' && o.type === 'formula' && eqMode();
    const r = asEq
      ? await api.office({ action: 'inserteq', app, mathml: toMathML(o), source: (OFFICE && OFFICE.source) || '', quick: !!(OFFICE && OFFICE.quitAfter) })
      : await api.office({ action: 'insert', app, target: o.id, data: btoa(bin), source: (OFFICE && OFFICE.source) || '', quick: !!(OFFICE && OFFICE.quitAfter) });
    if (OFFICE) OFFICE.lastOk = r.ok;
    msg(r.ok ? 'Đã chèn vào ' + name + (r.replaced ? ' (thay cho hình đang chọn)' : ' tại vị trí con trỏ') : r.error, !r.ok);
  }
  function paste(o) {
    o.id = 'o' + S.seq++; o.x += 20; o.y += 20;
    S.objs.push(o); renderObj(o); select(o.id); commit();
  }
  const typing = () => {
    const a = document.activeElement;
    return dlg.open || (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable || a.tagName === 'MATH-FIELD'));
  };
  function run(cmd) {
    if ((cmd === 'undo' || cmd === 'redo') && typing()) { document.execCommand(cmd); return; }
    if (dlg.open) return;
    if (CMD[cmd]) CMD[cmd]();
  }
  $('#ribbon').addEventListener('click', (e) => { const b = e.target.closest('button[data-cmd]'); if (b) run(b.dataset.cmd); });
  if (api) api.onMenu(run);
  if (api && api.onOpenFile) api.onOpenFile((r) => { try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); msg('Đã mở ' + r.file); } catch (e) { msg('Tệp không hợp lệ', true); } });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && S.placing) { S.placing = false; page.classList.remove('placing'); msg('Sẵn sàng'); return; }
    if (typing()) return;
    const o = cur(), k = e.key.toLowerCase();
    if (o && e.key === 'F2') { e.preventDefault(); if (o.type === 'formula') editFormula(o); else if (o.type === 'text') editText(o); return; }
    if (e.ctrlKey && k === 'm') { e.preventDefault(); run('ins-formula'); return; }
    if (e.ctrlKey && k === 'v' && S.clip) { e.preventDefault(); paste(JSON.parse(S.clip)); return; }
    if (!o) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); run('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); if (o.type === 'formula') editFormula(o); else if (o.type === 'text') editText(o); }
    else if (e.ctrlKey && k === 'd') { e.preventDefault(); run('dup'); }
    else if (e.ctrlKey && (k === 'c' || k === 'x')) {
      e.preventDefault();
      S.clip = JSON.stringify(o, (key, v) => (key[0] === '_' ? undefined : v));
      if (k === 'x') run('del'); else run('copyimg');
    } else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') o.x -= d; if (e.key === 'ArrowRight') o.x += d;
      if (e.key === 'ArrowUp') o.y -= d; if (e.key === 'ArrowDown') o.y += d;
      renderObj(o); commit();
    }
  });
  stage.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom(S.zoom + (e.deltaY < 0 ? 0.1 : -0.1)); } }, { passive: false });

  $('#credit').onclick = () => { if (api && api.about) api.about(); };
  const yk = $('#symKind');
  SGK.GROUPS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } yk.appendChild(og); });
  const pk = $('#planeKind');
  Plane.KINDS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = k; op.textContent = g[1][k][0]; og.appendChild(op); } pk.appendChild(og); });
  const sk = $('#solidKind');
  Space.KINDS.forEach((g) => { const og = document.createElement('optgroup'); og.label = g[0]; for (const k in g[1]) { const op = document.createElement('option'); op.value = 'sp:' + k; op.textContent = g[1][k][0]; og.appendChild(op); } sk.appendChild(og); });

  // ---------- Chụp ảnh (gọi từ tiến trình chính) ----------
  let savedZoom = 1;
  window.__prepCapture = (target) => new Promise((res) => {
    savedZoom = S.zoom;
    document.body.classList.add('capturing');
    setZoom(1);
    setTimeout(() => {
      const el = target === 'page' ? page : page.querySelector(`[data-id="${target}"]`);
      if (!el) return res(null);
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      res(measureCapture(el, target));
    }, 40);
  });
  // vùng cần chụp của một đối tượng (công thức: cắt sát và tính độ hạ dòng để khớp đường chân chữ trong Word)
  function measureCapture(el, target) {
    {
      const r = el.getBoundingClientRect(), pad = target === 'page' ? 0 : 8;
      let padB = pad, depthPt = 0;
      const o = get(target);
      if (o && o.type === 'formula' && el.firstElementChild) {
        // đo đường chân chữ của công thức, rồi chỉnh lề dưới để phần nằm dưới chân chữ là số nguyên point
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        el.firstElementChild.appendChild(probe);
        const descent = Math.max(0, r.bottom - probe.getBoundingClientRect().top);
        probe.remove();
        depthPt = Math.ceil((descent + 3) * 0.75);
        padB = depthPt / 0.75 - descent;
      }
      const padX = depthPt ? -2 : pad, padT = depthPt ? 1 : pad; // công thức chèn giữa dòng chữ: cắt sát để không hở xa chữ, không đẩy dòng
      return { x: Math.max(0, r.left - padX), y: Math.max(0, r.top - padT), width: r.width + 2 * padX, height: r.height + padT + padB, depthPt };
    }
  }
  // chụp nhiều công thức một lượt (chuyển đổi hàng loạt): đo tất cả rồi tiến trình chính chụp liên tiếp
  window.__prepBatch = (ids) => new Promise((res) => {
    savedZoom = S.zoom;
    document.body.classList.add('capturing');
    setZoom(1); stage.scrollTop = 0; stage.scrollLeft = 0;
    setTimeout(() => res(ids.map((id) => { const el = page.querySelector(`[data-id="${id}"]`); return el ? measureCapture(el, id) : null; })), 40);
  });
  window.__endCapture = () => { document.body.classList.remove('capturing'); setZoom(savedZoom); };

  // Dùng khi chụp ảnh minh hoạ: thêm đối tượng bằng lệnh
  window.__clear = () => loadDoc([], null);
  window.__add = (type, kind, extra) => { const o = insert(type, kind, extra); renderObj(o); return o.id; };
  window.__unselect = () => select(null);

  // ---------- Tài liệu mẫu ----------
  window.__demo = () => {
    S.seq = 1;
    const objs = [];
    const mkObj = (type, kind, extra) => { const o = Object.assign({ id: 'o' + S.seq++, type }, defaults(type, kind), extra); if (o.type === 'bbt') autoBBT(o); objs.push(o); };
    mkObj('text', null, { x: 40, y: 22, w: 714, size: 21, bold: true, align: 'center', color: '#1f3f7a', text: 'KHẢO SÁT HÀM SỐ – MIỀN NGHIỆM – HÌNH KHÔNG GIAN' });
    mkObj('text', null, { x: 40, y: 66, w: 714, text: 'Ví dụ 1. Khảo sát sự biến thiên và vẽ đồ thị hàm số $y=x^{3}-3x$. Ta có $y\'=3x^{2}-3$; $y\'=0\\Leftrightarrow x=\\pm 1$.' });
    mkObj('graph', null, { x: 40, y: 128, w: 320, h: 300, points: 'A(-1; 2)\nB(1; -2)' });
    mkObj('bbt', null, { x: 380, y: 132, w: 374, h: 160 });
    mkObj('formula', null, { x: 384, y: 306, size: 19, latex: '\\int_{-1}^{0}\\left(x^{3}-3x\\right)\\mathrm{d}x=\\left.\\left(\\frac{x^{4}}{4}-\\frac{3x^{2}}{2}\\right)\\right|_{-1}^{0}=\\frac{5}{4}' });
    mkObj('sign', null, { x: 380, y: 360, w: 374, h: 70 });
    mkObj('text', null, { x: 40, y: 440, w: 714, text: 'Ví dụ 2. Hàm số $y=\\dfrac{2x+1}{x-1}$ có tiệm cận đứng $x=1$, tiệm cận ngang $y=2$.' });
    mkObj('bbt', null, { x: 40, y: 494, w: 380, h: 160, expr: '(2x+1)/(x-1)' });
    mkObj('graph', null, { x: 440, y: 478, w: 314, h: 250, funcs: '(2x+1)/(x-1)', xmin: '-5', xmax: '7', ymin: '-4', ymax: '8', xstep: '2', ystep: '2', guides: 'x = 1, y = 2' });
    mkObj('text', null, { x: 40, y: 668, w: 380, text: 'Ví dụ 3. Miền nghiệm của hệ $\\begin{cases}x+y\\le 4\\\\x-2y\\le 2\\\\x\\ge 0,\\ y\\ge 0\\end{cases}$' });
    mkObj('region', null, { x: 40, y: 770, w: 280, h: 280 });
    mkObj('solid', 'chop4', { x: 330, y: 735, w: 210, h: 210 });
    mkObj('solid', 'hop', { x: 545, y: 745, w: 215, h: 190 });
    mkObj('solid', 'tru', { x: 330, y: 945, w: 140, h: 170 });
    mkObj('solid', 'non', { x: 472, y: 945, w: 140, h: 170 });
    mkObj('solid', 'cau', { x: 615, y: 955, w: 145, h: 150 });
    loadDoc(objs, null);
  };

  loadDoc([], null);

  // ---------- Chế độ add-in: mở từ nút ToanViet trong Word / PowerPoint, chèn xong tự đóng ----------
  const OFFICE = api && api.officeMode ? { app: api.officeMode.app, mode: api.officeMode.mode, sizePt: api.officeMode.sizePt, op: api.officeMode.op, auto: false, lastOk: false, source: '' } : null;
  // cỡ công thức mới lấy theo cỡ chữ tại con trỏ trong Word (mặc định 12 pt)
  const officeSize = () => (OFFICE.sizePt >= 5 && OFFICE.sizePt <= 200 ? toPx(OFFICE.sizePt) : 16);
  const officeName = () => (OFFICE.app === 'word' ? 'Word' : 'PowerPoint');
  async function officeInsertAndQuit() {
    if (!cur()) return msg('Hãy chọn (nhấp vào) đối tượng cần chèn vào ' + officeName(), true);
    OFFICE.quitAfter = true; // cho phép ẩn cửa sổ ngay khi đã có ảnh, không chờ Word chèn xong
    await toOffice(OFFICE.app);
    OFFICE.quitAfter = false;
    if (OFFICE.lastOk) api.quit();
  }
  // Công thức soạn xong trong hộp thoại: chèn luôn rồi đóng; huỷ thì đóng
  async function officeDone(o, v) {
    if (v === null || !v.trim()) return api.quit();
    o.latex = v; renderObj(o); select(o.id);
    await officeInsertAndQuit();
    if (!OFFICE.lastOk) { OFFICE.auto = false; buildProps(); } // lỗi: giữ cửa sổ để người dùng thử lại bằng nút trên thanh
  }
  // ---------- Chuyển đổi hàng loạt công thức trong tài liệu Word ----------
  const CONVERT = {
    mt2tv: { kind: 'ole', from: 'MathType', to: 'ToanViet' },
    eq2tv: { kind: 'omath', from: 'Equation', to: 'ToanViet' },
    tv2eq: { kind: 'tvs', from: 'ToanViet', to: 'Equation' },
    tv2mt: { kind: 'tvs', from: 'ToanViet', to: 'MathType' },
    tex2tv: { kind: 'latex', from: 'mã LaTeX', to: 'ToanViet' },
    tv2tex: { kind: 'tvs', from: 'ToanViet', to: 'mã LaTeX' },
  };
  const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const objToB64 = (o) => { const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v))); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
  async function runConvert() {
    const cv = CONVERT[OFFICE.op];
    const veil = document.createElement('div');
    veil.id = 'convveil';
    veil.innerHTML = '<div><b>ToanViet Studio</b><p id="convmsg">Đang tìm công thức ' + (cv ? cv.from : '') + ' trong tài liệu…</p></div>';
    document.body.appendChild(veil);
    const say = (t) => { $('#convmsg').textContent = t; };
    const finish = async (t) => { await api.info(t); api.quit(); };
    if (!cv || OFFICE.app !== 'word') return finish('Chuyển đổi hàng loạt hiện chỉ làm được trong Word.');
    const sc = await api.office({ action: 'scan', app: 'word', kind: cv.kind });
    if (!sc.ok) return finish(sc.error);
    let items = sc.items;
    if (cv.kind === 'tvs') {
      // chỉ công thức mới chuyển được; đồ thị, bảng, hình giữ nguyên
      items = items.map((it) => { try { it.obj = JSON.parse(new TextDecoder().decode(b64ToBytes(it.data))); } catch (e) { it.obj = null; } return it; }).filter((it) => it.obj && it.obj.type === 'formula');
    }
    if (!items.length) return finish('Không tìm thấy công thức ' + cv.from + ' nào trong tài liệu.');
    if (!(await api.confirm('Tìm thấy ' + items.length + ' công thức ' + cv.from + ' trong tài liệu.\n\nChuyển tất cả sang ' + cv.to + '?\n(Sau khi chuyển, bấm Ctrl+Z trong Word nếu muốn hoàn tác.)'))) return api.quit();
    items.sort((a, b) => b.i - a.i);
    const jobs = [];
    let failed = 0, firstErr = '';
    // dựng một đợt công thức xếp dọc trên trang rồi chụp liên tiếp (nhanh hơn nhiều so với từng cái một)
    let batch = [];
    const flush = async () => {
      if (!batch.length) return;
      S.objs = []; S.sel = null; page.innerHTML = '';
      let y = 10;
      const ready = [];
      for (const b of batch) {
        b.o.y = y; S.objs.push(b.o); const el = renderObj(b.o);
        y += Math.ceil(el.offsetHeight) + 24;
        ready.push(b);
        if (y > 1900) { await shoot(ready.splice(0)); S.objs = []; page.innerHTML = ''; y = 10; }
      }
      await shoot(ready);
      batch = [];
    };
    const shoot = async (list) => {
      if (!list.length) return;
      say('Đang dựng công thức ' + (jobs.length + 1) + '–' + (jobs.length + list.length) + ' / ' + items.length + '…');
      const rs = await api.renderBatch(list.map((b) => b.o.id));
      list.forEach((b, n) => { const r = rs[n]; if (!r) { failed++; return; } jobs.push({ i: b.it.i, end: b.it.end, png: r.file, w: r.w, h: r.h, pos: r.depthPt, alt: objToB64(b.o) }); });
    };
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      say('Đang chuẩn bị công thức ' + (k + 1) + ' / ' + items.length + '…');
      try {
        if (OFFICE.op === 'tv2tex') {
          jobs.push({ i: it.i, text: '$' + multiline(it.obj.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim').replace(/\s+/g, ' ').trim() + '$' });
        } else if (OFFICE.op === 'mt2tv' || OFFICE.op === 'eq2tv' || OFFICE.op === 'tex2tv') {
          const raw = b64ToBytes(it.data);
          const latex = OFFICE.op === 'mt2tv' ? MTEF.oleToLatex(raw) : OFFICE.op === 'eq2tv' ? OMML.toLatex(new TextDecoder().decode(raw)) : cleanLatex(new TextDecoder().decode(raw));
          if (!latex.trim()) throw new Error('rỗng');
          const o = { id: 'c' + k, type: 'formula', x: 30, y: 0, latex, size: it.size >= 5 && it.size <= 200 ? toPx(it.size) : 16, color: '#000000' };
          if (tex(texOf(o)).includes('ML__error')) throw new Error('mã LaTeX không hợp lệ');
          batch.push({ o, it });
          if (batch.length >= 40) await flush();
        } else if (OFFICE.op === 'tv2eq') {
          const tx = multiline(it.obj.latex).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim ');
          jobs.push({ i: it.i, mathml: toMathML({ latex: it.obj.latex }) }); void tx;
        } else {
          const r = await mathTypeXml(it.obj);
          jobs.push({ i: it.i, xml: r });
        }
      } catch (e) { failed++; if (!firstErr) firstErr = e.message; }
    }
    await flush();
    if (!jobs.length) return finish('Không chuyển được công thức nào (' + failed + ' công thức gặp lỗi: ' + firstErr + '). Tài liệu không thay đổi.');
    say('Đang ghi ' + jobs.length + ' công thức vào Word…');
    const res = await api.office({ action: 'apply', app: 'word', op: OFFICE.op, jobs });
    if (!res.ok) return finish(res.error);
    const skipped = items.length - res.count;
    return finish('Đã chuyển ' + res.count + ' / ' + items.length + ' công thức ' + cv.from + ' sang ' + cv.to + '.' + (skipped ? '\n\n' + skipped + ' công thức chưa chuyển được và được giữ nguyên.' : '') + '\n\nBấm Ctrl+Z trong Word nếu muốn hoàn tác.');
  }
  // Dọn mã LaTeX lấy từ các trợ lí AI cho hợp với ô soạn ToanViet
  function cleanLatex(t) {
    let s = String(t).replace(/[\r\n\u000b\u00a0]+/g, ' ').replace(/\\(tag|label)\{[^{}]*\}/g, '').replace(/\\(nonumber|notag|displaystyle)\b/g, '').trim();
    s = s.replace(/\\begin\{(equation|gather|displaymath)\*?\}|\\end\{(equation|gather|displaymath)\*?\}/g, '').replace(/\\(begin|end)\{(align|alignat|flalign|eqnarray|split)\*?\}/g, '\\$1{aligned}').trim();
    // nhiều dòng nối bằng \\ mà không nằm trong môi trường nào: đưa về công thức nhiều dòng của ToanViet
    if (/\\\\/.test(s) && !/\\begin\{/.test(s)) s = '\\displaylines{' + s + '}';
    return s;
  }
  // ToanViet -> MathType: sẽ được nạp từ mtef-write.js nếu có
  async function mathTypeXml(obj) {
    if (!window.MTEFW) throw new Error('chưa hỗ trợ');
    S.objs = [Object.assign({ id: 'cmt' }, obj, { x: 60, y: 50 })]; S.sel = null; renderAll();
    const tx = texOf(obj).replace(/\\dongdang(?![a-zA-Z])/g, '\\backsim ');
    window.MTEFW.latexToMtef(tx); // báo lỗi sớm nếu có cấu trúc chưa hỗ trợ, trước khi dựng ảnh
    const r = await api.renderPng('cmt', true);
    return window.MTEFW.wordXml(tx, r, r.b64);
  }

  async function startOffice() {
    if (OFFICE.mode === 'convert') return runConvert();
    document.body.classList.add('office');
    $('#officebar').hidden = false;
    $('#officetxt').textContent = 'Đang soạn cho ' + officeName() + ': Ctrl+Enter chèn và đóng · Esc đóng không chèn.';
    $('#officeins').textContent = 'Chèn vào ' + officeName() + ' và đóng';
    $('#officeins').onclick = officeInsertAndQuit;
    if (OFFICE.app === 'word') { const cb = $('#fEq'); $('#fEqWrap').hidden = false; cb.checked = eqMode(); cb.onchange = () => { try { localStorage.setItem('tvs-insert-eq', cb.checked ? '1' : '0'); } catch (e) { /* bỏ qua */ } }; }
    $('#officecancel').onclick = () => api.quit();
    if (OFFICE.mode === 'edit') {
      const r = await api.office({ action: 'read', app: OFFICE.app });
      if (r.ok && (r.from === 'MathType' || r.from === 'WordEq')) {
        // Công thức MathType hoặc Equation của Word: đọc nội dung sang ToanViet để sửa.
        // Khi bấm chèn, bản ToanViet thay cho công thức gốc; bấm Huỷ thì tài liệu không đổi.
        const kind = r.from === 'MathType' ? 'MathType' : 'Equation';
        try {
          const raw = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
          const latex = r.from === 'MathType' ? MTEF.oleToLatex(raw) : OMML.toLatex(new TextDecoder().decode(raw));
          OFFICE.source = r.from === 'MathType' ? 'ole' : 'omath';
          OFFICE.auto = true;
          const o = insert('formula', null, { latex, size: officeSize(), x: 60, y: 50 });
          msg('Đã mở công thức ' + kind + '. Bấm chèn để thay cho công thức gốc; Esc để giữ nguyên.');
          editFormula(o);
          return;
        } catch (e) {
          await api.info('Không đọc được công thức ' + kind + ' này (' + e.message + ').\n\nCông thức trong tài liệu được giữ nguyên.');
          return api.quit();
        }
      } else if (r.ok) {
        try {
          const o = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0))));
          o.x = 60; o.y = 50;
          paste(o);
          if (o.type === 'formula') { OFFICE.auto = true; editFormula(o); }
          else msg('Sửa xong bấm "Chèn vào ' + officeName() + ' và đóng" để thay cho hình đang chọn.');
          return;
        } catch (e) { /* dữ liệu hỏng: soạn mới */ }
      }
      msg('Chưa chọn công thức ToanViet nào trong ' + officeName() + ' — soạn công thức mới.', true);
    }
    if (OFFICE.mode === 'full') return msg('Dựng đồ thị, bảng hoặc hình rồi bấm "Chèn vào ' + officeName() + ' và đóng".');
    OFFICE.auto = true;
    editFormula(insert('formula', null, { size: officeSize() }), true);
  }
  // Phím tắt ở chế độ add-in (khi không đứng trong hộp soạn): Ctrl+Enter chèn và đóng, Esc đóng không chèn
  if (OFFICE) document.addEventListener('keydown', (e) => {
    if (dlg.open) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); officeInsertAndQuit(); }
    else if (e.key === 'Escape' && !typing() && !S.placing) { e.preventDefault(); api.quit(); }
  });
  if (OFFICE) startOffice();
  else msg('Sẵn sàng — bấm "Công thức" hoặc vào Tệp ▸ Tài liệu mẫu để xem ví dụ');
})();
