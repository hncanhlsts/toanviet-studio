// Bài giải AI → tài liệu Word: dán bài giải từ ChatGPT, Gemini, Copilot… → bỏ phần thừa, dựng bố cục, chuẩn hoá ký hiệu
// theo SGK, tự thêm hình ở chỗ SGK có hình (miền nghiệm, bảng biến thiên, bảng xét dấu — src/baigiai-chuyen.js) → xem
// trước, sửa → tạo tệp Word mới: chữ Times New Roman, mọi công thức và hình là đối tượng ToanViet (nhấp đúp trong Word
// để sửa bằng add-in). Không cần tài khoản AI.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.baigiai = function (C) {
    const { $, page, api, S, esc, msg, modal, tex, renderObj, renderAll, toPx, defaults } = C;
    let notes = {};
    const mergeNotes = (n) => { for (const k in n) notes[k] = (notes[k] || 0) + n[k]; };
    // dữ liệu ToanViet ghi kèm ảnh (giống lúc chèn công thức vào Word)
    const objToB64 = (o) => { const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v))); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
    const bad = (latex) => /ML__error/.test(tex(latex, false));

    // ---------- Hình: dòng "#FIG <khoá> <JSON>" khai báo, dòng "[FIG <khoá>|Hình n]" đặt hình ----------
    const figSpecs = (markup) => {
      const o = {};
      String(markup).split('\n').forEach((l) => { const m = /^#FIG (\S+) (\{.*\})\s*$/.exec(l); if (m) { try { o[m[1]] = JSON.parse(m[2]); } catch (err) { o[m[1]] = null; } } });
      return o;
    };
    const figObj = (key, spec) => { const o = Object.assign({}, defaults(spec.type, spec.kind), spec, { id: 'bgfig_' + key, x: 20, y: 20 }); delete o.scale; return o; };
    // xem trước: dựng hình bằng chính bộ máy ToanViet rồi chép sang khung xem trước
    const figCache = new Map();
    function figHtml(key, spec) {
      if (!spec) return '<div class="pv-fig bgbad">Khai báo hình ' + esc(key) + ' bị lỗi (dòng #FIG)</div>';
      const ck = JSON.stringify(spec);
      if (!figCache.has(ck)) {
        const o = figObj(key, spec), el = renderObj(o);
        const err = o._err ? '<div class="bgerr">' + esc(o._err.split('\n')[0]) + '</div>' : '';
        figCache.set(ck, err + el.outerHTML.replace(/ style="[^"]*"/, ' style="position:relative;left:0;top:0;display:inline-block"'));
        el.remove();
      }
      return '<div class="pv-fig">' + figCache.get(ck) + '</div>';
    }

    // ---------- Xem trước ----------
    function fillHtml(text) {
      let s = '', pos = 0;
      const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
      let m;
      const txt = (t) => esc(t).split('**').map((x, k) => (k % 2 ? '<b>' + x + '</b>' : x)).join('');
      while ((m = re.exec(text))) {
        if (m.index > pos) s += txt(text.slice(pos, m.index));
        const l = (m[1] || m[2]).trim();
        s += '<span class="bgf' + (bad(l) ? ' bgbad' : '') + '" title="' + esc(l) + '">' + tex(l, false) + '</span>';
        pos = m.index + m[0].length;
      }
      return s + txt(text.slice(pos));
    }
    function previewHtml(markup) {
      const L = String(markup).split('\n'), out = [], specs = figSpecs(markup);
      for (let i = 0; i < L.length; i++) {
        const ln = L[i].trim();
        if (!ln || ln.startsWith('%%') || ln.startsWith('#FIG ')) continue;
        const fg = /^\[FIG ([^|\]]+)(?:\|([^\]]*))?\]$/.exec(ln);
        if (fg) { out.push(figHtml(fg[1].trim(), specs[fg[1].trim()]) + (fg[2] ? '<div class="pv-cap">' + fillHtml(fg[2]) + '</div>' : '')); continue; }
        const tag = /^#(T|S|H1|H2|D|C) (.*)$/.exec(ln);
        if (tag) { out.push('<div class="pv-' + tag[1].toLowerCase() + '">' + fillHtml(tag[2]) + '</div>'); continue; }
        if (/^#G/.test(ln)) { out.push('<div class="pv-g">' + fillHtml(ln.slice(2).trim() || 'Lời giải') + '</div>'); continue; }
        if (ln === '#PAGE') { out.push('<hr class="pv-page">'); continue; }
        if (ln === '#TAB') {
          const rows = [];
          while (i + 1 < L.length && L[i + 1].trim() !== '#ENDTAB') { i++; rows.push(L[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|')); }
          i++;
          out.push('<table class="pv-tab">' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + fillHtml(c.trim()) + '</td>').join('') + '</tr>').join('') + '</table>');
          continue;
        }
        if (/^\$\$[^$]+\$\$$/.test(ln)) { out.push('<div class="pv-eq">' + fillHtml(ln) + '</div>'); continue; }
        if (ln.startsWith('- ')) { out.push('<div class="pv-li">• ' + fillHtml(ln.slice(2)) + '</div>'); continue; }
        out.push('<div class="pv-p">' + fillHtml(ln) + '</div>');
      }
      return out.join('') || '<div class="bgempty">Phần xem trước hiện ở đây sau khi dán bài giải.</div>';
    }

    // ---------- Cách vẽ giáo viên đã dạy (ghi nhớ trên máy) ----------
    // Mỗi mục: { from, to, goc, moi } — câu gốc phần mềm chưa hiểu và câu giáo viên viết lại, tên điểm thay bằng {1}, {2}…
    const KEY = 'tvs-cach-ve';
    const loadRules = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (err) { return []; } };
    const saveRules = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (err) { /* bỏ qua */ } if (window.DeHinh && DeHinh.setRules) DeHinh.setRules(list); };
    if (window.DeHinh && DeHinh.setRules) DeHinh.setRules(loadRules());
    let loi = []; // hình chưa vẽ đủ của lần dựng hình gần nhất

    // chuẩn hoá nội dung dán vào rồi tự thêm hình
    function convert(raw) {
      const r = BaiGiai.fromText(raw);
      mergeNotes(r.notes);
      const f = BaiGiai.figures(r.markup);
      mergeNotes(f.notes);
      loi = f.loi || [];
      return f.markup;
    }
    // dựng lại hình sau khi sửa nội dung: bỏ các hình cũ và chữ "(Hình n)" đã thêm, nhận diện lại
    function rebuildFigures(markup) {
      const clean = String(markup).split('\n').filter((l) => !/^#FIG /.test(l) && !/^\[FIG /.test(l)).map((l) => l.replace(/ \(Hình \d+\)(?=[.:;]?\s*$)/, '')).join('\n');
      const f = BaiGiai.figures(clean);
      mergeNotes(f.notes);
      loi = f.loi || [];
      return f;
    }
    // khung "Hình chưa vẽ đủ": sửa theo TỪNG ĐIỂM — điểm chưa dựng được (hoặc vẽ sai) có ô mô tả riêng ("E là: giao điểm của Bx và AD");
    // vẽ được điểm đó thì các điểm dựng từ nó (I là giao của AB và EF) tự vẽ tiếp; cách mô tả được ghi nhớ cho câu đề cùng dạng
    let kid = 0;
    const diemRow = (ten, cau) => {
      const id = 'bgd' + (kid++), gy = (window.DeHinh && DeHinh.goiYDiem) ? DeHinh.goiYDiem(ten, cau) : [];
      return '<div class="bgdrow" data-ten="' + esc(ten) + '" data-cau="' + esc(cau) + '">' +
        (cau ? '<div class="bglgoc">Đề: ' + esc(cau) + '</div>' : '') +
        (gy.length ? '<div class="bglgy">Gợi ý: ' + gy.map((g) => '<button type="button" class="bgchip" data-for="' + id + '">' + esc(g) + '</button>').join('') + '</div>' : '') +
        '<div class="bglin"><label for="' + id + '"><b>' + esc(ten) + '</b> là:</label><input id="' + id + '" placeholder="mô tả điểm ' + esc(ten) + ', ví dụ: ' + esc(gy[0] || 'giao điểm của AB và CD') + '" spellcheck="false">' +
        '<button type="button" class="primary bgdok" data-for="' + id + '">Vẽ điểm ' + esc(ten) + ' và ghi nhớ</button></div></div>';
    };
    const nhacTen = (c, n) => new RegExp('(?<![A-Za-z])' + n + "(?![a-z'])").test(c);
    function loiHtml() {
      const rules = loadRules();
      let h = '', k = 0;
      kid = 0;
      const sai = loi.filter((L) => !L.du);
      if (sai.length) {
        h += '<div class="bgloi"><b>Hình chưa vẽ đủ</b> — mô tả lại <b>từng điểm</b> chưa xác định (bấm một gợi ý để điền), rồi bấm <b>Vẽ điểm … và ghi nhớ</b>. Vẽ được điểm đó thì các điểm dựng từ nó tự vẽ tiếp; lần sau gặp câu cùng dạng (tên điểm khác), ToanViet tự vẽ đúng.';
        sai.forEach((L) => {
          h += '<div class="bgloic">' + esc(L.cau || 'Hình') + ' <span>(hình ' + esc(L.loai) + ')</span></div>';
          const th = L.thieu || [], ten = th.map((t) => t.ten);
          th.forEach((t) => {
            const cho = (t.can || []).filter((c) => ten.includes(c));
            if (cho.length) h += '<div class="bgcho">Điểm <b>' + esc(t.ten) + '</b> sẽ tự vẽ khi có ' + cho.map((c) => '<b>' + esc(c) + '</b>').join(', ') + '</div>';
            else h += '<div class="bgthieu">Chưa xác định được điểm <b>' + esc(t.ten) + '</b>' + (t.can && t.can.length ? ' (cần ' + esc(t.can.join(', ')) + ')' : '') + '</div>' + diemRow(t.ten, (t.cau || [])[0] || '');
          });
          // câu chưa hiểu không nói tới điểm nào đang thiếu (hình không gian, câu chỉ vẽ đoạn…): viết lại cả câu
          (L.chuaHieu || []).filter((c) => !ten.some((n) => nhacTen(c, n))).forEach((c) => {
            const id = 'bgl' + (k++), gy = (window.DeHinh && DeHinh.goiY) ? DeHinh.goiY(c) : [];
            h += '<div class="bglrow" data-goc="' + esc(c) + '"><div class="bglgoc">Câu chưa hiểu: ' + esc(c) + '</div>' +
              (gy.length ? '<div class="bglgy">Gợi ý: ' + gy.map((g) => '<button type="button" class="bgchip" data-for="' + id + '">' + esc(g) + '</button>').join('') + '</div>' : '') +
              '<div class="bglin"><input id="' + id + '" value="' + esc(c) + '" spellcheck="false"><button type="button" class="primary bglok" data-for="' + id + '">Vẽ lại và ghi nhớ</button></div></div>';
          });
        });
        h += '</div>';
      }
      // hình đã vẽ nhưng có điểm sai vị trí: chọn điểm rồi mô tả lại
      const co = loi.filter((L) => (L.diem || []).length);
      if (co.length) {
        h += '<details class="bgsua"><summary>Có điểm vẽ sai vị trí? Chọn điểm rồi mô tả lại</summary>';
        co.forEach((L) => {
          h += (co.length > 1 ? '<div class="bgloic">' + esc(L.cau || 'Hình') + '</div>' : '') + '<div class="bgsdiem">Điểm: ' + L.diem.map((d) => '<button type="button" class="bgpick" data-ten="' + esc(d.ten) + '" data-cau="' + esc(d.cau) + '">' + esc(d.ten) + '</button>').join('') + '</div><div class="bgsrow"></div>';
        });
        h += '</details>';
      }
      if (rules.length) h += '<details class="bgnho"><summary>Cách vẽ đã ghi nhớ (' + rules.length + ')</summary>' + rules.map((r, i) => '<div class="bgnhor"><span><s>' + esc(r.goc) + '</s> → ' + (r.diem ? 'điểm <b>' + esc(r.diem) + '</b>: ' : '') + esc(r.moi) + '</span><button type="button" class="bgdel" data-i="' + i + '" title="Xoá cách vẽ này">✕</button></div>').join('') + '</details>';
      return h;
    }

    function openBaiGiai() {
      notes = {}; loi = [];
      const d = modal('bgdlg', 'Bài giải AI → tài liệu Word');
      d.classList.add('bgdlg');
      const body = d.querySelector('.tvbody');
      body.innerHTML =
        '<p class="bghint">Sao chép bài giải từ ChatGPT, Gemini, Copilot… (nút <b>Sao chép</b> của trang, hoặc bôi đen cả bài rồi <kbd>Ctrl</kbd>+<kbd>C</kbd>), bấm vào ô bên trái rồi nhấn <kbd>Ctrl</kbd>+<kbd>V</kbd>. ' +
        'ToanViet tự bỏ phần thừa, dựng bố cục Câu – Lời giải, đổi ký hiệu theo SGK và <b>tự vẽ hình</b> ở chỗ SGK có hình (miền nghiệm, bảng biến thiên, bảng xét dấu). Không cần tài khoản AI nào.</p>' +
        '<div class="bgrow"><div class="bgcol"><div class="bglab">Nội dung — sửa được <span>#C nhãn câu · #G lời giải · $…$ công thức · $$…$$ công thức riêng dòng · **đậm** · [FIG h1|Hình 1] chỗ đặt hình</span></div>' +
        '<textarea id="bgsrc" spellcheck="false" placeholder="Bấm vào đây rồi dán bài giải (Ctrl+V)…"></textarea></div>' +
        '<div class="bgcol"><div class="bglab">Xem trước</div><div id="bgview" class="bgview"></div></div></div>' +
        '<div id="bgnotes" class="bgnotes"></div><div id="bgloi"></div>' +
        '<div class="bgfoot"><label>Tiêu đề <input id="bgtitle" placeholder="(không bắt buộc)"></label>' +
        '<label>Cỡ chữ <select id="bgpt"><option>12</option><option>13</option><option>14</option></select></label>' +
        '<span id="bgstat" class="bgstat"></span><button id="bgfig" title="Sau khi sửa nội dung: nhận diện và vẽ lại các hình">Dựng lại hình</button><button id="bgclear">Xoá</button><button id="bgmake" class="primary">Tạo tài liệu Word</button></div>';
      const src = $('#bgsrc'), view = $('#bgview');
      let tmr = 0;
      const refresh = () => {
        view.innerHTML = previewHtml(src.value);
        const list = BaiGiai.formulas(src.value), errs = list.filter(bad), nfig = Object.keys(figSpecs(src.value)).length;
        const fixed = Object.keys(notes).map((k) => k + (notes[k] > 1 ? ' (' + notes[k] + ')' : ''));
        $('#bgnotes').innerHTML = (list.length ? '<b>' + list.length + ' công thức' + (nfig ? ', ' + nfig + ' hình' : '') + '.</b> ' : '') +
          (errs.length ? '<span class="bgerr">' + errs.length + ' công thức có mã LaTeX lỗi (tô đỏ ở phần xem trước) — sửa trong ô bên trái: ' + errs.slice(0, 3).map((x) => '<code>' + esc(x.slice(0, 40)) + '</code>').join(', ') + '</span> ' : '') +
          (fixed.length ? '<span class="bgfix">Đã làm: ' + esc(fixed.join(' · ').replace(/ · hình (?:phẳng|không gian) — chưa hiểu: "[^"]*"/g, '')) + '</span>' : '');
        $('#bgloi').innerHTML = loiHtml();
      };
      // gợi ý: bấm để điền vào ô viết lại; Vẽ lại và ghi nhớ: học mẫu (câu gốc → câu viết lại), dựng lại hình
      $('#bgloi').addEventListener('click', (e) => {
        const chip = e.target.closest('.bgchip'), ok = e.target.closest('.bglok'), del = e.target.closest('.bgdel');
        if (chip) { const i = $('#' + chip.dataset.for); i.value = chip.textContent; i.focus(); return; }
        // chọn điểm vẽ sai: hiện ô mô tả riêng cho điểm đó
        const pick = e.target.closest('.bgpick'), dok = e.target.closest('.bgdok');
        if (pick) {
          const box = pick.parentNode.nextElementSibling;
          pick.parentNode.querySelectorAll('.bgpick').forEach((b) => b.classList.toggle('on', b === pick));
          box.innerHTML = diemRow(pick.dataset.ten, pick.dataset.cau);
          const inp = box.querySelector('input'); if (inp) inp.focus();
          return;
        }
        // Vẽ điểm … và ghi nhớ: học cách vẽ điểm (câu đề gốc + mô tả điểm), dựng lại hình
        if (dok) {
          const row = dok.closest('.bgdrow'), ten = row.dataset.ten, cau = row.dataset.cau, moTa = $('#' + dok.dataset.for).value.trim();
          if (!moTa) { msg('Hãy mô tả điểm ' + ten + ' (hoặc bấm một gợi ý) trước khi bấm Vẽ', true); return; }
          const r = DeHinh.hocDiem(cau, ten, moTa);
          if (!r) { msg('Chưa ghi nhớ được cách vẽ điểm ' + ten, true); return; }
          const list = loadRules().filter((x) => !(x.from === r.from && x.diem === ten)); list.push(r); saveRules(list);
          const f = rebuildFigures(src.value); src.value = f.markup;
          // mô tả vẫn chưa vẽ được điểm: bỏ cách vẽ vừa học, báo để thử cách khác
          const nm = DeHinh.norm(r.moi).replace(/[.;]\s*$/, '').trim();
          const still = loi.some((L) => (L.thieu || []).some((t) => t.ten === ten) || (L.chuaHieu || []).some((c) => DeHinh.norm(c).replace(/[.;]\s*$/, '').trim() === nm));
          if (still) { saveRules(list.filter((x) => x !== r)); const f2 = rebuildFigures(src.value); src.value = f2.markup; refresh(); msg('Chưa vẽ được điểm ' + ten + ' theo mô tả "' + r.moi + '" — thử một gợi ý khác', true); return; }
          refresh();
          const con = [].concat(...loi.map((L) => (L.thieu || []).map((t) => t.ten)));
          msg('Đã vẽ điểm ' + ten + ' và ghi nhớ' + (con.length ? ' — còn điểm ' + con.join(', ') + ' chưa xác định' : ''));
          return;
        }
        if (del) { const list = loadRules(); list.splice(+del.dataset.i, 1); saveRules(list); const f = rebuildFigures(src.value); src.value = f.markup; refresh(); msg('Đã xoá cách vẽ đã ghi nhớ'); return; }
        if (!ok) return;
        const row = ok.closest('.bglrow'), goc = row.dataset.goc, moi = $('#' + ok.dataset.for).value.trim();
        if (!moi || moi === goc) { msg('Hãy viết lại câu (hoặc bấm một gợi ý) trước khi bấm Vẽ lại', true); return; }
        const r = DeHinh.hocMau(goc, moi);
        if (!r) { msg('Câu viết lại cần có tên điểm như câu gốc', true); return; }
        const list = loadRules().filter((x) => x.from !== r.from || x.diem); list.push(r); saveRules(list);
        const f = rebuildFigures(src.value); src.value = f.markup;
        // câu viết lại vẫn chưa hiểu: bỏ mẫu vừa học, báo để sửa tiếp
        const still = loi.some((L) => (L.chuaHieu || []).some((c) => DeHinh.norm(c).replace(/[.;]\s*$/, '') === r.moi));
        if (still) { saveRules(list.filter((x) => x !== r)); const f2 = rebuildFigures(src.value); src.value = f2.markup; refresh(); msg('Câu viết lại vẫn chưa hiểu — thử một gợi ý khác', true); return; }
        refresh();
        msg('Đã vẽ lại và ghi nhớ: lần sau câu cùng dạng sẽ tự vẽ đúng');
      });
      $('#bgloi').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); const b = e.target.parentNode.querySelector('.bglok, .bgdok'); if (b) b.click(); } });
      // dán: ưu tiên bản HTML (giữ đúng mã LaTeX của công thức), không có thì dùng chữ thường
      src.addEventListener('paste', (e) => {
        const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain');
        if (!html && !text) return;
        e.preventDefault();
        let raw = text;
        try { if (html && /<(p|div|span|h\d|li|math|annotation|table)\b/i.test(html)) raw = BaiGiai.fromHtml(html); } catch (err) { raw = text; }
        if (!src.value.trim()) src.value = convert(raw);
        else { const r = BaiGiai.fromText(raw); mergeNotes(r.notes); src.setRangeText(r.markup, src.selectionStart, src.selectionEnd, 'end'); }
        refresh();
      });
      src.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(refresh, 300); });
      $('#bgfig').onclick = () => { const f = rebuildFigures(src.value); src.value = f.markup; refresh(); msg(f.count ? 'Đã dựng ' + f.count + ' hình' : 'Không nhận ra chỗ nào cần hình (miền nghiệm, bảng biến thiên, bảng xét dấu)'); };
      $('#bgclear').onclick = () => { src.value = ''; notes = {}; loi = []; refresh(); src.focus(); };
      $('#bgmake').onclick = () => make(src.value);
      refresh();
      d.showModal();
      src.focus();
    }

    // ---------- Tạo tài liệu Word ----------
    async function make(text) {
      let markup = String(text || '').trim();
      if (!markup) { msg('Hãy dán bài giải vào ô bên trái', true); return null; }
      const title = $('#bgtitle') && $('#bgtitle').value ? $('#bgtitle').value.trim() : '';
      if (title && !/^#T /m.test(markup)) markup = '#T ' + title + '\n' + markup;
      const pt = +($('#bgpt') || {}).value || 12;
      const list = BaiGiai.formulas(markup).filter((l) => !bad(l));
      const specs = figSpecs(markup);
      const btn = $('#bgmake'), stat = $('#bgstat');
      const say = (t) => { if (stat) stat.textContent = t; };
      if (btn) btn.disabled = true;
      const out = [], figs = [];
      // dựng ảnh: tạm thay trang bằng các đối tượng cần chụp, rồi trả trang về như cũ
      const saved = S.objs, savedSel = S.sel;
      try {
        S.objs = []; S.sel = null; page.innerHTML = '';
        // công thức: xếp dọc trong phạm vi trang giấy, chụp từng đợt
        let y = 10, batch = [];
        const shoot = async () => {
          if (!batch.length) return;
          say('Đang dựng công thức ' + (out.length + 1) + '–' + (out.length + batch.length) + ' / ' + list.length + '…');
          const rs = await api.renderBatch(batch.map((b) => b.o.id));
          batch.forEach((b, n) => { const r = rs[n]; if (r) out.push({ latex: b.latex, file: r.file, w: r.w, h: r.h, depthPt: r.depthPt, alt: 'TVS1:' + objToB64(b.o) }); });
          batch = []; S.objs = []; page.innerHTML = ''; y = 10;
        };
        for (let k = 0; k < list.length; k++) {
          const o = { id: 'bg' + k, type: 'formula', x: 30, y, latex: list[k], size: toPx(pt), color: '#000000' };
          S.objs.push(o);
          const el = renderObj(o);
          y += Math.ceil(el.offsetHeight) + 24;
          batch.push({ o, latex: list[k] });
          if (y > page.clientHeight - 60) await shoot();
        }
        await shoot();
        // hình: từng hình một
        for (const key of Object.keys(specs)) {
          if (!specs[key]) continue;
          say('Đang vẽ ' + key.replace(/^h/, 'Hình ') + '…');
          const o = figObj(key, specs[key]);
          S.objs = [o]; page.innerHTML = ''; renderObj(o);
          const r = await api.renderPng(o.id, false, false);
          if (r) figs.push({ key, file: r.file, w: r.w, h: r.h, alt: 'TVS1:' + objToB64(o), scale: specs[key].scale || 0.8 });
        }
      } finally { S.objs = saved; S.sel = savedSel; renderAll(); if (btn) btn.disabled = false; }
      say('Đang ghép tệp Word…');
      const r = await api.makeDocx({ markup, formulas: out, figures: figs, pt, name: title || 'Loi-giai' });
      say('');
      if (r.ok) msg('Đã tạo ' + r.file + ' — ' + r.count + ' công thức, hình ToanViet' + (r.missing.length ? '; ' + r.missing.length + ' mục lỗi giữ dạng chữ' : '') + '. Nhấp đúp trong Word để sửa bằng ToanViet.');
      else if (!r.canceled) msg(r.error || 'Không tạo được tài liệu Word', true);
      return r;
    }

    return { openBaiGiai, makeBaiGiai: make };
  };
})(window);
