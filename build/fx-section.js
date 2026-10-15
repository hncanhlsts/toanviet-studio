  // ---------- Hộp soạn công thức (theo thiết kế của Bảng vẽ Toán) ----------
  const dlg = $('#fxdlg'), fTex = $('#fTex'), fPrev = $('#fPrev');
  let fxDone = null, fMode = 'v', fTab = 0, pfx = null, fT = 0;
  const fSt = { size: 22, color: '#000000', bold: false };
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
    mf.insert('\\displaylines{' + inner + '\\\\#?}', { focus: true, selectionMode: 'placeholder' });
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
    tab.items.forEach((item) => {
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
    const sel = $('#fSize');
    if (![...sel.options].some((o) => +o.value === fSt.size)) { const o = document.createElement('option'); o.value = o.textContent = fSt.size; sel.append(o); }
    sel.value = fSt.size;
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
  $('#fSize').addEventListener('change', (e) => { fSt.size = +e.target.value; syncF(); });
  $('#fBold').onclick = () => { fSt.bold = !fSt.bold; syncF(); };
  $('#fKeys').onclick = () => { $('#fKeyList').hidden = !$('#fKeyList').hidden; };

  // st: {size, color, bold} của công thức đang sửa (bỏ trống khi chèn công thức vào dòng chữ)
  function openFx(latex, done, st, okLabel) {
    fxDone = done;
    if (st) Object.assign(fSt, { size: Math.round(st.size) || 22, color: st.color || '#000000', bold: !!st.bold });
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

