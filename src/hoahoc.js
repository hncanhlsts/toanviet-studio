// Phương trình hoá học: gõ tự nhiên "Fe + HCl -> FeCl2 + H2↑" → công thức đúng cách viết SGK (chỉ số dưới, điện tích,
// mũi tên có điều kiện, ⇌, ↑ ↓), kiểm tra cân bằng (đếm nguyên tố, điện tích hai vế), tự cân bằng hệ số nhỏ nhất.
// Chèn vào trang thành công thức (sửa được, sang Word thành Equation).
(function (root) {
  'use strict';
  // ---------- đọc phương trình ----------
  // mũi tên: -> → = (một chiều), <-> <=> ⇌ (thuận nghịch); điều kiện viết ngay sau mũi tên trong [ ] hoặc ( ): "->[t°, xt]"
  const ARROW = /\s*(<=>|<->|⇌|⇄|-->|->|→|=)\s*(?:\[([^\]]*)\]|\(([^)]*)\))?\s*/;
  function tachVe(s) {
    const t = String(s || '').replace(/\s+/g, ' ').trim(), m = t.match(ARROW);
    if (!m) return { trai: t, phai: '', mui: '', dk: '' };
    return { trai: t.slice(0, m.index), phai: t.slice(m.index + m[0].length), mui: /<|⇌|⇄/.test(m[1]) ? 'thuannghich' : 'mot', dk: (m[2] || m[3] || '').trim() };
  }
  // tách các chất bằng dấu +, bỏ qua dấu + của điện tích (Na^+, Fe^3+)
  function tachChat(ve) {
    const out = [];
    let cur = '';
    for (let i = 0; i < ve.length; i++) {
      const c = ve[i];
      if (c === '+' && !/\^\{?\d*$/.test(cur.trimEnd())) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  // một chất: hệ số, công thức, trạng thái (s, l, g, aq), ↑ ↓
  function docChat(t) {
    const m = String(t).trim().match(/^(\d+(?:\/\d+)?)?\s*(.+?)\s*(\((?:s|l|g|aq|r|k|dd)\))?\s*([↑↓])?$/);
    if (!m) throw new Error('không đọc được "' + t + '"');
    const hs = m[1] ? m[1].split('/') : null;
    return { heso: hs ? +hs[0] / (+hs[1] || 1) : 1, hesoViet: m[1] || '', ct: m[2].replace(/\s/g, ''), tt: m[3] || '', mt: m[4] || '' };
  }
  // đếm nguyên tố trong công thức: Fe2(SO4)3, CuSO4.5H2O, SO4^2-
  function demNguyenTo(ct) {
    const dien = ct.match(/\^\{?(\d*)([+-])\}?$/), than = ct.replace(/\^\{?\d*[+-]\}?$/, '');
    const dem = {};
    const cong = (a, k) => { for (const e in a) dem[e] = (dem[e] || 0) + a[e] * k; };
    than.split(/[.·*]/).forEach((phan, i) => {
      let k = 1, p = phan;
      const hs = p.match(/^(\d+)(?=[A-Z(])/);
      if (i > 0 && hs) { k = +hs[1]; p = p.slice(hs[1].length); }
      const st = [{}];
      let j = 0;
      while (j < p.length) {
        const c = p[j];
        if (c === '(' || c === '[') { st.push({}); j++; continue; }
        if (c === ')' || c === ']') {
          j++;
          let n = ''; while (j < p.length && /\d/.test(p[j])) n += p[j++];
          const top = st.pop(); if (!st.length) throw new Error('ngoặc chưa cân trong ' + ct);
          for (const e in top) st[st.length - 1][e] = (st[st.length - 1][e] || 0) + top[e] * (+n || 1);
          continue;
        }
        const e = p.slice(j).match(/^[A-Z][a-z]?/);
        if (!e) throw new Error('không hiểu "' + p.slice(j) + '" trong ' + ct);
        j += e[0].length;
        let n = ''; while (j < p.length && /\d/.test(p[j])) n += p[j++];
        st[st.length - 1][e[0]] = (st[st.length - 1][e[0]] || 0) + (+n || 1);
      }
      if (st.length !== 1) throw new Error('ngoặc chưa cân trong ' + ct);
      cong(st[0], k);
    });
    return { dem, dien: dien ? (dien[2] === '+' ? 1 : -1) * (+dien[1] || 1) : 0 };
  }
  function doc(s) {
    const v = tachVe(s);
    if (!v.mui) throw new Error('thiếu mũi tên phản ứng (viết -> hoặc ⇌)');
    const trai = tachChat(v.trai).map(docChat), phai = tachChat(v.phai).map(docChat);
    if (!trai.length || !phai.length) throw new Error('mỗi vế cần ít nhất một chất');
    return { trai, phai, mui: v.mui, dk: v.dk };
  }

  // ---------- viết LaTeX kiểu SGK ----------
  const ctTex = (ct) => {
    const dien = ct.match(/\^\{?(\d*)([+-])\}?$/), than = ct.replace(/\^\{?\d*[+-]\}?$/, '');
    const phan = than.split(/[.·*]/).map((p, i) => {
      const hs = i > 0 ? (p.match(/^(\d+)(?=[A-Z(])/) || [])[1] : '';
      const q = hs ? p.slice(hs.length) : p;
      return (hs || '') + '\\mathrm{' + q.replace(/([A-Za-z)\]])(\d+)/g, '$1_{$2}') + '}';
    });
    return phan.join('\\cdot ') + (dien ? '^{' + dien[1] + dien[2] + '}' : '');
  };
  const dkTex = (dk) => dk.split(',').map((x) => x.trim()).filter(Boolean).map((x) => (/^t\s*°$|^t\s*o$|^to$/.test(x) ? 't^{\\circ}' : '\\text{' + x + '}')).join(',\\ ');
  function chatTex(c, heso) {
    const h = heso === undefined ? c.hesoViet : heso > 1 ? String(heso) : '';
    return h + ctTex(c.ct) + (c.tt ? '\\,(\\mathrm{' + c.tt.slice(1, -1) + '})' : '') + (c.mt === '↑' ? '{\\uparrow}' : c.mt === '↓' ? '{\\downarrow}' : ''); // trong ngoặc: dấu + phía sau vẫn là phép cộng
  }
  function latex(s, heso) {
    const p = doc(s), hs = (i) => (heso ? heso[i] : undefined);
    const d = p.dk ? dkTex(p.dk) : '';
    const mui = p.mui === 'thuannghich' ? (d ? '\\overset{' + d + '}{\\rightleftharpoons}' : '\\rightleftharpoons') : '\\xrightarrow{' + d + '}'; // không điều kiện: đối số rỗng (MathLive coi \longrightarrow 2 là mũi tên có chữ 2 ở trên)
    return p.trai.map((c, i) => chatTex(c, hs(i))).join(' + ') + ' ' + mui + ' ' + p.phai.map((c, i) => chatTex(c, hs(i + p.trai.length))).join(' + ');
  }

  // ---------- kiểm tra, tự cân bằng ----------
  function kiemTra(s) {
    const p = doc(s), dem = (ds) => { const t = {}; let q = 0; ds.forEach((c) => { const r = demNguyenTo(c.ct); for (const e in r.dem) t[e] = (t[e] || 0) + r.dem[e] * c.heso; q += r.dien * c.heso; }); return { t, q }; };
    const a = dem(p.trai), b = dem(p.phai), lech = [];
    new Set(Object.keys(a.t).concat(Object.keys(b.t))).forEach((e) => { if ((a.t[e] || 0) !== (b.t[e] || 0)) lech.push(e + ': ' + (a.t[e] || 0) + ' ≠ ' + (b.t[e] || 0)); });
    if (a.q !== b.q) lech.push('điện tích: ' + a.q + ' ≠ ' + b.q);
    const thieu = Object.keys(a.t).filter((e) => !(e in b.t)).concat(Object.keys(b.t).filter((e) => !(e in a.t)));
    return { canBang: !lech.length, lech, thieu };
  }
  // phân số [tử, mẫu]
  const g = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const F = (n, d) => { if (d < 0) { n = -n; d = -d; } const k = g(n, d); return [n / k, d / k]; };
  const fSub = (a, b) => F(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), fMul = (a, b) => F(a[0] * b[0], a[1] * b[1]), fDiv = (a, b) => F(a[0] * b[1], a[1] * b[0]);
  // hệ số nhỏ nhất: nghiệm nguyên dương của ma trận nguyên tố × chất (vế phải mang dấu âm); không duy nhất thì trả về null
  function canBang(s) {
    const p = doc(s), ds = p.trai.concat(p.phai), n = ds.length, rs = ds.map((c) => demNguyenTo(c.ct));
    const ng = [...new Set([].concat(...rs.map((r) => Object.keys(r.dem))))];
    const A = ng.map((e) => rs.map((r, j) => F((r.dem[e] || 0) * (j < p.trai.length ? 1 : -1), 1)));
    if (rs.some((r) => r.dien)) A.push(rs.map((r, j) => F(r.dien * (j < p.trai.length ? 1 : -1), 1)));
    // đưa về dạng bậc thang rút gọn
    const piv = [];
    let row = 0;
    for (let c = 0; c < n && row < A.length; c++) {
      let r = row; while (r < A.length && A[r][c][0] === 0) r++;
      if (r === A.length) continue;
      [A[row], A[r]] = [A[r], A[row]];
      const pv = A[row][c];
      A[row] = A[row].map((x) => fDiv(x, pv));
      for (let k = 0; k < A.length; k++) if (k !== row && A[k][c][0] !== 0) { const f = A[k][c]; A[k] = A[k].map((x, j) => fSub(x, fMul(f, A[row][j]))); }
      piv.push(c); row++;
    }
    const tudo = []; for (let c = 0; c < n; c++) if (!piv.includes(c)) tudo.push(c);
    if (tudo.length !== 1) return null;
    const x = new Array(n).fill(null);
    x[tudo[0]] = F(1, 1);
    piv.forEach((c, i) => { x[c] = F(-A[i][tudo[0]][0], A[i][tudo[0]][1]); });
    const mc = x.reduce((a, v) => (a * v[1]) / g(a, v[1]), 1);
    let v = x.map((q) => (q[0] * mc) / q[1]);
    if (v.every((t) => t < 0)) v = v.map((t) => -t);
    if (v.some((t) => t <= 0)) return null;
    const k = v.reduce((a, t) => g(a, t), 0);
    return v.map((t) => t / k);
  }
  // viết lại phương trình với hệ số mới (giữ chất, trạng thái, mũi tên, điều kiện như người dùng gõ)
  function vietLai(s, heso) {
    const p = doc(s), chat = (c, h) => (h > 1 ? h : '') + c.ct + (c.tt ? c.tt : '') + c.mt;
    const muiGoc = String(s).match(ARROW)[0].trim(); // mũi tên kèm điều kiện, đúng như đã gõ
    return p.trai.map((c, i) => chat(c, heso[i])).join(' + ') + ' ' + muiGoc + ' ' + p.phai.map((c, i) => chat(c, heso[i + p.trai.length])).join(' + ');
  }
  const api = { doc, latex, kiemTra, canBang, vietLai, demNguyenTo };
  root.HoaHoc = api;

  // ---------- Hộp "Phương trình hoá học" ----------
  root.TVM = root.TVM || {};
  root.TVM.hoahoc = function (C) {
    const { $, esc, msg, modal, tex, insert, commit } = C;
    function openPhuongTrinh(goc) {
      const d = modal('ptdlg', 'Phương trình hoá học');
      d.classList.add('kbdlg');
      d.querySelector('.tvbody').innerHTML =
        '<p class="bghint">Gõ phương trình như viết tay: <code>Fe + HCl -> FeCl2 + H2↑</code>. Mũi tên <code>-></code> (thuận nghịch <code><=></code>), điều kiện ngay sau mũi tên trong ngoặc vuông <code>->[t°, xt]</code>, ion <code>SO4^2-</code>, tinh thể ngậm nước <code>CuSO4.5H2O</code>, trạng thái <code>(s) (l) (g) (aq)</code>, khí <code>↑</code> kết tủa <code>↓</code>.</p>' +
        '<textarea id="ptsrc" rows="2" spellcheck="false"></textarea>' +
        '<div class="kbbar"><button type="button" data-k="↑">↑ khí</button><button type="button" data-k="↓">↓ kết tủa</button><button type="button" data-k="->[t°]">→ có t°</button><button type="button" data-k="<=>">⇌</button><span style="flex:1"></span><button type="button" id="ptcb">⚖ Cân bằng hệ số</button></div>' +
        '<div id="ptxem" style="min-height:46px;padding:8px 4px;font-size:20px"></div>' +
        '<div class="kbbar"><span id="ptstat" class="bgstat"></span><button type="button" id="ptok" class="primary">Chèn phương trình</button></div>';
      const src = $('#ptsrc'), xem = $('#ptxem'), stat = $('#ptstat');
      src.value = goc || 'Fe + HCl -> FeCl2 + H2↑';
      const show = () => {
        try {
          xem.innerHTML = tex(latex(src.value), false);
          const k = kiemTra(src.value);
          stat.innerHTML = k.canBang ? '<span style="color:#1d7a3a">✔ Đã cân bằng</span>' : '<span class="bgerr">Chưa cân bằng — ' + esc(k.lech.join('; ')) + (k.thieu.length ? '. Nguyên tố chỉ có ở một vế: ' + esc(k.thieu.join(', ')) : '') + '</span>';
        } catch (e) { xem.innerHTML = ''; stat.innerHTML = '<span class="bgerr">' + esc(e.message) + '</span>'; }
      };
      src.addEventListener('input', show);
      d.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { const s = src.selectionStart, t = src.value; src.value = t.slice(0, s) + b.dataset.k + t.slice(src.selectionEnd); src.focus(); src.selectionStart = src.selectionEnd = s + b.dataset.k.length; show(); }; });
      $('#ptcb').onclick = () => {
        try {
          const h = canBang(src.value);
          if (!h) { msg('Không tự cân bằng được (phương trình có nhiều cách cân bằng hoặc thiếu chất) — cân bằng tay', true); return; }
          src.value = vietLai(src.value, h); show(); msg('Đã cân bằng: hệ số ' + h.join(', '));
        } catch (e) { msg(e.message, true); }
      };
      $('#ptok').onclick = () => {
        try { const l = latex(src.value); insert('formula', null, { latex: l }); commit(); d.close(); msg('Đã chèn phương trình — nhấp đúp để sửa như công thức'); } catch (e) { msg(e.message, true); }
      };
      show();
      d.showModal(); src.focus();
    }
    return { openPhuongTrinh };
  };
})(typeof window !== 'undefined' ? window : globalThis);
