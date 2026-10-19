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

    // chuẩn hoá nội dung dán vào rồi tự thêm hình
    function convert(raw) {
      const r = BaiGiai.fromText(raw);
      mergeNotes(r.notes);
      const f = BaiGiai.figures(r.markup);
      mergeNotes(f.notes);
      return f.markup;
    }
    // dựng lại hình sau khi sửa nội dung: bỏ các hình cũ và chữ "(Hình n)" đã thêm, nhận diện lại
    function rebuildFigures(markup) {
      const clean = String(markup).split('\n').filter((l) => !/^#FIG /.test(l) && !/^\[FIG /.test(l)).map((l) => l.replace(/ \(Hình \d+\)(?=[.:;]?\s*$)/, '')).join('\n');
      const f = BaiGiai.figures(clean);
      mergeNotes(f.notes);
      return f;
    }

    function openBaiGiai() {
      notes = {};
      const d = modal('bgdlg', 'Bài giải AI → tài liệu Word');
      d.classList.add('bgdlg');
      const body = d.querySelector('.tvbody');
      body.innerHTML =
        '<p class="bghint">Sao chép bài giải từ ChatGPT, Gemini, Copilot… (nút <b>Sao chép</b> của trang, hoặc bôi đen cả bài rồi <kbd>Ctrl</kbd>+<kbd>C</kbd>), bấm vào ô bên trái rồi nhấn <kbd>Ctrl</kbd>+<kbd>V</kbd>. ' +
        'ToanViet tự bỏ phần thừa, dựng bố cục Câu – Lời giải, đổi ký hiệu theo SGK và <b>tự vẽ hình</b> ở chỗ SGK có hình (miền nghiệm, bảng biến thiên, bảng xét dấu). Không cần tài khoản AI nào.</p>' +
        '<div class="bgrow"><div class="bgcol"><div class="bglab">Nội dung — sửa được <span>#C nhãn câu · #G lời giải · $…$ công thức · $$…$$ công thức riêng dòng · **đậm** · [FIG h1|Hình 1] chỗ đặt hình</span></div>' +
        '<textarea id="bgsrc" spellcheck="false" placeholder="Bấm vào đây rồi dán bài giải (Ctrl+V)…"></textarea></div>' +
        '<div class="bgcol"><div class="bglab">Xem trước</div><div id="bgview" class="bgview"></div></div></div>' +
        '<div id="bgnotes" class="bgnotes"></div>' +
        '<div class="bgfoot"><label>Tiêu đề <input id="bgtitle" placeholder="(không bắt buộc)"></label>' +
        '<label>Cỡ chữ <select id="bgpt"><option>12</option><option>13</option><option>14</option></select></label>' +
        '<span id="bgstat" class="bgstat"></span><button id="bgocr" title="Đọc chữ trong ảnh đề bài (ảnh cắt màn hình, ảnh chụp, ảnh Zalo). Cũng có thể dán ảnh bằng Ctrl+V hoặc kéo thả tệp ảnh vào ô bên trái. Chạy trên máy, không cần mạng.">📷 Đọc đề từ ảnh…</button><input type="file" id="bgocrfile" accept="image/*" multiple hidden><button id="bgfig" title="Sau khi sửa nội dung: nhận diện và vẽ lại các hình">Dựng lại hình</button><button id="bgclear">Xoá</button><button id="bgmake" class="primary">Tạo tài liệu Word</button></div>';
      const src = $('#bgsrc'), view = $('#bgview');
      let tmr = 0;
      const refresh = () => {
        view.innerHTML = previewHtml(src.value);
        const list = BaiGiai.formulas(src.value), errs = list.filter(bad), nfig = Object.keys(figSpecs(src.value)).length;
        const fixed = Object.keys(notes).map((k) => k + (notes[k] > 1 ? ' (' + notes[k] + ')' : ''));
        $('#bgnotes').innerHTML = (list.length ? '<b>' + list.length + ' công thức' + (nfig ? ', ' + nfig + ' hình' : '') + '.</b> ' : '') +
          (errs.length ? '<span class="bgerr">' + errs.length + ' công thức có mã LaTeX lỗi (tô đỏ ở phần xem trước) — sửa trong ô bên trái: ' + errs.slice(0, 3).map((x) => '<code>' + esc(x.slice(0, 40)) + '</code>').join(', ') + '</span> ' : '') +
          (fixed.length ? '<span class="bgfix">Đã làm: ' + esc(fixed.join(' · ')) + '</span>' : '');
      };
      // đọc đề từ ảnh (OCR chạy trên máy): làm rõ ảnh → nhận chữ → sửa lỗi nhận chữ của đề Toán → đưa vào ô như khi dán chữ
      const readImages = async (files) => {
        files = [...files].filter((f) => /^image\//.test(f.type || '') || /\.(png|jpe?g|bmp|webp|gif)$/i.test(f.name || ''));
        if (!files.length) return;
        if (!window.OcrAnh || !window.OcrSua || !api.ocr) { msg('Chức năng đọc ảnh chưa sẵn sàng', true); return; }
        const stat = $('#bgstat'), btn = $('#bgocr'); btn.disabled = true;
        const parts = [], doubt = [];
        try {
          for (let i = 0; i < files.length; i++) {
            stat.textContent = 'Đang đọc chữ trong ảnh' + (files.length > 1 ? ' ' + (i + 1) + '/' + files.length : '') + '…';
            const bmp = await createImageBitmap(files[i]);
            const pr = OcrAnh.prep(bmp), png = await OcrAnh.toPng(pr.canvas);
            const r = await api.ocr(png);
            if (!r.ok) throw new Error(r.error);
            const text = OcrSua.sua(OcrSua.ghep(r.lines));
            if (text) parts.push(text);
            r.lines.forEach((l) => (l.words || []).forEach((w) => { if (w.conf < 55 && /[A-Za-zÀ-ỹĐđ]{2,}/.test(w.text) && doubt.length < 8) doubt.push(w.text); }));
          }
        } catch (err) { stat.textContent = ''; btn.disabled = false; msg('Không đọc được ảnh: ' + err.message, true); return; }
        stat.textContent = ''; btn.disabled = false;
        if (!parts.length) { msg('Không tìm thấy chữ trong ảnh', true); return; }
        const raw = parts.join('\n\n');
        if (!src.value.trim()) src.value = convert(raw);
        else { const r = BaiGiai.fromText(raw); mergeNotes(r.notes); src.setRangeText(r.markup, src.selectionStart, src.selectionEnd, 'end'); }
        notes['đọc đề từ ảnh'] = (notes['đọc đề từ ảnh'] || 0) + files.length;
        if (doubt.length) notes['chữ đọc chưa chắc, xem lại: ' + doubt.join(', ')] = 1;
        refresh();
        msg('Đã đọc chữ từ ảnh — thầy cô xem lại nội dung bên trái trước khi tạo tài liệu');
      };
      $('#bgocr').onclick = () => $('#bgocrfile').click();
      $('#bgocrfile').onchange = (e) => { readImages(e.target.files); e.target.value = ''; };
      src.addEventListener('dragover', (e) => { if ([...e.dataTransfer.items].some((it) => it.kind === 'file')) e.preventDefault(); });
      src.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) { e.preventDefault(); readImages(e.dataTransfer.files); } });
      // dán: ưu tiên bản HTML (giữ đúng mã LaTeX của công thức), không có thì dùng chữ thường; chỉ có ảnh thì đọc chữ trong ảnh
      src.addEventListener('paste', (e) => {
        const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain');
        const imgs = [...e.clipboardData.items].filter((it) => it.kind === 'file' && /^image\//.test(it.type)).map((it) => it.getAsFile()).filter(Boolean);
        if (!text && imgs.length) { e.preventDefault(); readImages(imgs); return; }
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
      $('#bgclear').onclick = () => { src.value = ''; notes = {}; refresh(); src.focus(); };
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
