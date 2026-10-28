// Bài giải AI → tài liệu Word: dán bài giải từ ChatGPT, Gemini, Copilot… → bỏ phần thừa, dựng bố cục, chuẩn hoá ký hiệu
// theo SGK, tự thêm hình ở chỗ SGK có hình (miền nghiệm, bảng biến thiên, bảng xét dấu — src/baigiai-chuyen.js) → xem
// trước, sửa → tạo tệp Word mới: chữ Times New Roman, mọi công thức và hình là đối tượng ToanViet (nhấp đúp trong Word
// để sửa bằng add-in). Không cần tài khoản AI.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.baigiai = function (C) {
    const { $, page, api, S, esc, msg, modal, tex, renderObj, renderAll, toPx, defaults } = C;
    // lỗi kịch bản hình viết bằng lời thường (src/loi-de-hieu.js); lệnh chép cho AI vẫn dùng lỗi gốc
    const deHieu = (er) => (root.LoiDeHieu ? root.LoiDeHieu.dich(er) : [].concat(er));
    let notes = {};
    let tongCau = 0; // chế độ chuyển đề: số câu AI báo ở dòng cuối "Tổng số câu: n"
    let phan = { co: new Set(), tong: 0 }; // đề AI chép thành nhiều phần: dòng "[[PHẦN k/N – trang …]]"
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
        const err = o._err ? '<div class="bgerr">' + esc(deHieu(o._err.split('\n'))[0]) + '</div>' : '';
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
      // giữ hình kịch bản ToanViet do AI viết (#FIG tvN)
      const clean = String(markup).split('\n').filter((l) => /^#FIG tv\d+ |^\[FIG tv\d+\|/.test(l) || (!/^#FIG /.test(l) && !/^\[FIG /.test(l))).map((l) => l.replace(/ \(Hình \d+\)(?=[.:;]?\s*$)/, '')).join('\n');
      const f = BaiGiai.figures(clean);
      mergeNotes(f.notes);
      loi = f.loi || [];
      return f;
    }
    // chép chữ vào bộ nhớ tạm (dán cho trợ lí AI)
    const chep = async (t) => {
      try { await navigator.clipboard.writeText(t); }
      catch (err) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
    };
    window.TVSChep = chep;
    // nhờ AI dựng hình cho một câu: chép lệnh (lời nhắc + đề, không cần lời giải), dán khối mã ```toanviet AI trả về
    const aiRow = (L) => (L.key && L.de ? '<div class="bgai" data-key="' + esc(L.key) + '" data-de="' + esc(L.de) + '">' +
      '<button type="button" class="bgaicopy">🤖 Chép lệnh nhờ AI dựng hình câu này</button> <span>dán cho ChatGPT / Gemini… — AI chỉ trả về khối hình (không giải bài); chép khối đó dán vào ô dưới:</span>' +
      '<div class="bglin"><textarea class="bgaiin" rows="2" spellcheck="false" placeholder="Dán câu trả lời của AI (khối mã ```toanviet … ```, hoặc bấm Copy ở khối mã rồi dán)"></textarea><button type="button" class="primary bgaiok">Dùng hình này</button></div></div>' : '');
    // khung hình chưa vẽ đủ: báo gọn câu nào, điểm nào (chưa dựng được / đặt tạm) — kèm nhờ AI dựng hình câu đó
    function loiHtml() {
      let h = '';
      const sai = loi.filter((L) => !L.du);
      if (sai.length) {
        h += '<div class="bgloi"><b>Hình chưa vẽ đủ ý đề</b> — ToanViet đã vẽ phần đọc được (điểm đề chưa cho đủ vị trí được đặt tạm ở chỗ hợp lý). Muốn hình đúng hẳn: nhờ AI dựng hình câu đó.';
        sai.forEach((L) => {
          const ds = [], th = (L.thieu || []).map((t) => t.ten), tm = (L.tam || []).map((t) => t.ten);
          if (L.loiKB) ds.push('kịch bản AI viết bị lỗi: ' + deHieu(L.loiKB.split('; ')).join(' '));
          if (th.length) ds.push('chưa dựng được điểm ' + th.join(', '));
          if (tm.length) ds.push('đặt tạm điểm ' + tm.join(', '));
          if (!th.length && !tm.length && (L.chuaHieu || []).length) ds.push('chưa hiểu: ' + L.chuaHieu.map((c) => '“' + c + '”').join('; '));
          h += '<div class="bgloic">' + esc(L.cau || 'Hình') + ' <span>(hình ' + esc(L.loai) + ')</span> — ' + esc(ds.join(' · ')) + '</div>' + aiRow(L);
        });
        h += '</div>';
      }
      // hình đã vẽ đủ mà chưa đúng ý: nhờ AI dựng lại cả hình
      const tot = loi.filter((L) => L.du && L.key);
      if (tot.length) h += '<details class="bgsua"><summary>Hình chưa đúng ý? Nhờ AI dựng hình</summary>' + tot.map((L) => (tot.length > 1 ? '<div class="bgloic">' + esc(L.cau || 'Hình') + '</div>' : '') + aiRow(L)).join('') + '</details>';
      return h;
    }


    // mode "de": chuyển đề PDF / ảnh chụp sang Word — AI (ChatGPT, Gemini…) đọc tệp, chép nguyên văn đề theo lời nhắc
    // LoiNhacAI.chepDe(); ToanViet đối chiếu số câu, tô vàng chỗ AI ghi [KHÔNG RÕ: …], [HÌNH: …]
    // mode "md": như "de", mở ngay hộp chọn tệp Markdown (Tệp ▸ Mở tệp Markdown → tài liệu Word)
    function openBaiGiai(mode) {
      notes = {}; loi = []; tongCau = 0; phan = { co: new Set(), tong: 0 };
      const deMode = mode === 'de' || mode === 'md';
      const d = modal('bgdlg', deMode ? 'Chuyển đề PDF / ảnh → tài liệu Word' : 'Bài giải AI → tài liệu Word');
      d.classList.add('bgdlg');
      const body = d.querySelector('.tvbody');
      body.innerHTML = (deMode
        ? '<p class="bghint"><b>Nhờ AI đọc đề:</b> ① Bấm <button type="button" id="bgchepde" class="bgnhac">📋 Chép lời nhắc chép đề cho AI</button> ' +
          '② Mở ChatGPT, Gemini hoặc Claude, đính kèm tệp PDF hoặc ảnh chụp đề, dán lời nhắc (<kbd>Ctrl</kbd>+<kbd>V</kbd>) rồi gửi. AI tạo tệp Markdown (đề dài: nhiều tệp theo trang, nhắn "tiếp" để AI làm phần sau). ' +
          '③ Tải các tệp về rồi bấm <button type="button" id="bgmomd" class="bgnhac">📂 Mở tệp Markdown…</button> (chọn cùng lúc nhiều tệp, hoặc kéo thả tệp vào ô bên trái); AI không tạo được tệp thì chép câu trả lời, bấm vào ô bên trái, nhấn <kbd>Ctrl</kbd>+<kbd>V</kbd> (nhiều phần: dán lần lượt). ' +
          'AI chỉ chép đề, không giải; công thức thành công thức ToanViet, hình thành hình ToanViet sửa được. ToanViet ghép các phần, đối chiếu số câu và <mark class="bgkr">tô vàng</mark> chỗ AI đọc không rõ để thầy cô dò lại với đề gốc. Lưu ý: tệp đề được gửi tới trang AI thầy cô chọn.</p>'
        : '<p class="bghint">Sao chép bài giải từ ChatGPT, Gemini, Copilot… (nút <b>Sao chép</b> của trang, hoặc bôi đen cả bài rồi <kbd>Ctrl</kbd>+<kbd>C</kbd>), bấm vào ô bên trái rồi nhấn <kbd>Ctrl</kbd>+<kbd>V</kbd>. ' +
        'ToanViet tự bỏ phần thừa, dựng bố cục Câu – Lời giải, đổi ký hiệu theo SGK và <b>tự vẽ hình</b> ở chỗ SGK có hình (miền nghiệm, bảng biến thiên, bảng xét dấu). Không cần tài khoản AI nào. ' +
        'Hình chưa đúng ý đề: bấm <button type="button" id="bgnhac" class="bgnhac">📋 Chép lời nhắc vẽ hình cho AI</button> — lệnh gắn sẵn đề đang có trong ô, chỉ nhờ AI vẽ hình (không giải); dán cho ChatGPT / Gemini, rồi chép câu trả lời (các khối mã <b>```toanviet</b>) dán vào ô bên trái: hình từng câu được thay. Có đề dạng PDF / ảnh chụp: <button type="button" id="bgsangde" class="bgnhac">📄 Chuyển đề PDF / ảnh</button></p>') +
        '<div class="bgrow"><div class="bgcol"><div class="bglab">Nội dung — sửa được <span>#C nhãn câu · #G lời giải · $…$ công thức · $$…$$ công thức riêng dòng · **đậm** · [FIG h1|Hình 1] chỗ đặt hình</span></div>' +
        '<textarea id="bgsrc" spellcheck="false" placeholder="Bấm vào đây rồi dán bài giải (Ctrl+V)…"></textarea></div>' +
        '<div class="bgcol"><div class="bglab">Xem trước</div><div id="bgview" class="bgview"></div></div></div>' +
        '<div id="bgnotes" class="bgnotes"></div><div id="bgloi"></div>' +
        '<div class="bgfoot"><label>Tiêu đề <input id="bgtitle" placeholder="(không bắt buộc)"></label>' +
        '<label>Cỡ chữ <select id="bgpt"><option>12</option><option>13</option><option>14</option></select></label>' +
        '<span id="bgstat" class="bgstat"></span><button id="bgfig" title="Sau khi sửa nội dung: nhận diện và vẽ lại các hình">Dựng lại hình</button><button id="bgclear">Xoá</button><button id="bgmake" class="primary">Tạo tài liệu Word</button></div>';
      const src = $('#bgsrc'), view = $('#bgview');
      // chép lời nhắc vẽ hình (src/loi-nhac-ai.js) vào bộ nhớ tạm để dán cho ChatGPT, Gemini, Copilot…
      // chép lệnh nhờ AI dựng hình, gắn sẵn đề đang có trong ô (không cần lời giải); ô trống: chỉ chép lời nhắc
      if ($('#bgnhac')) $('#bgnhac').onclick = () => {
        if (!window.LoiNhacAI) return;
        const de = deCaBai(src.value);
        if (de) chep(LoiNhacAI.nhoDung(de)).then(() => msg('Đã chép lệnh kèm đề — dán (Ctrl+V) cho ChatGPT / Gemini; chép câu trả lời (các khối hình) rồi dán vào ô bên trái: hình từng câu được thay'));
        else chep(LoiNhacAI.text()).then(() => msg('Đã chép lời nhắc vẽ hình — dán (Ctrl+V) vào đầu cuộc trò chuyện với AI, rồi gửi đề bài'));
      };
      if ($('#bgchepde')) $('#bgchepde').onclick = () => { if (window.LoiNhacAI) chep(LoiNhacAI.chepDe()).then(() => msg('Đã chép lời nhắc — đính kèm tệp PDF / ảnh đề cho ChatGPT, Gemini hoặc Claude, dán lời nhắc (Ctrl+V) rồi gửi')); };
      if ($('#bgsangde')) $('#bgsangde').onclick = () => { d.close(); openBaiGiai('de'); };
      let tmr = 0;
      // dòng "[[PHẦN k/N – trang …]]" đầu mỗi phần (nhìn thấy được cả khi chép từ trang AI): nhớ phần đã có để báo
      // phần còn thiếu, bỏ khỏi nội dung trước khi chuyển đổi
      const PHAN = /^[ \t]*(?:\*\*)?\[\[\s*PH[ẦA]N\s*(\d+)\s*\/\s*(\d+)[^\]\n]*\]\](?:\*\*)?[ \t]*$\n?/gim;
      const layPhan = (raw) => String(raw).replace(PHAN, (m0, k, n) => { phan.co.add(+k); phan.tong = Math.max(phan.tong, +n); return ''; });
      // ghép nhiều phần / nhiều tệp: theo số phần ghi trong tệp, không có thì theo tên tệp (de-phan-2 trước de-phan-10)
      const soPhan = (t) => { const m = /\[\[\s*PH[ẦA]N\s*(\d+)\s*\//i.exec(t); return m ? +m[1] : null; };
      const napTep = (ds) => {
        if (!ds || !ds.length) return;
        const xs = ds.map((f) => ({ name: f.name, text: String(f.text).replace(/^\ufeff/, ''), k: soPhan(f.text) }))
          .sort((a, b) => (a.k !== null && b.k !== null ? a.k - b.k : a.name.localeCompare(b.name, 'vi', { numeric: true })));
        themVao(xs.map((x) => x.text).join('\n\n'));
        msg('Đã mở ' + xs.length + ' tệp' + (xs.length > 1 ? ' (ghép theo thứ tự: ' + xs.map((x) => x.name).join(', ') + ')' : ''));
      };
      const moTep = async () => { if (api && api.openMd) napTep(await api.openMd()); };
      if ($('#bgmomd')) $('#bgmomd').onclick = moTep;
      src.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
      src.addEventListener('drop', async (e) => {
        const fs0 = [...((e.dataTransfer && e.dataTransfer.files) || [])].filter((f) => /\.(md|markdown|txt)$/i.test(f.name));
        if (!fs0.length) return;
        e.preventDefault();
        napTep(await Promise.all(fs0.map(async (f) => ({ name: f.name, text: await f.text() }))));
      });
      // dòng cuối AI ghi "Tổng số câu: n": nhớ số câu để đối chiếu, bỏ khỏi nội dung
      const layTong = () => {
        const re = /^[ \t]*(?:\*\*)?Tổng số câu(?:\*\*)?\s*:?\s*(\d+)\s*\.?[ \t]*$\n?/im, m = re.exec(src.value);
        if (m) { tongCau = +m[1]; src.value = src.value.replace(re, '').replace(/\n+$/, ''); }
      };
      // đối chiếu đề: số câu, chỗ không rõ, hình AI không vẽ lại được
      const doiChieu = () => {
        const v = src.value, soCau = (v.match(/^#C /gm) || []).length, kr = (v.match(/\[KHÔNG RÕ:/g) || []).length, hm = (v.match(/\[HÌNH:/g) || []).length;
        let h = '';
        if (phan.tong) {
          const thieu = []; for (let k = 1; k <= phan.tong; k++) if (!phan.co.has(k)) thieu.push(k);
          h += thieu.length ? '<span class="bgerr">Đề có ' + phan.tong + ' phần, còn thiếu phần ' + thieu.join(', ') + ' — nhắn AI "tiếp" rồi mở (hoặc dán) phần còn lại.</span> ' : '<span class="bgfix">Đủ ' + phan.tong + ' phần.</span> ';
        }
        // chỗ nối hai phần: một câu bị chép hai lần liền nhau
        const nhan = v.split('\n').filter((l) => /^#C /.test(l)), lap = nhan.filter((l, i) => i && l === nhan[i - 1]);
        if (lap.length) h += '<span class="bgerr">' + lap.map((l) => l.slice(3).replace(/\.$/, '')).join(', ') + ' lặp lại liền nhau (chỗ nối hai phần?) — xoá bản thừa.</span> ';
        if (tongCau) h += tongCau === soCau ? '<span class="bgfix">Đủ ' + soCau + ' câu như AI báo.</span> ' : '<span class="bgerr">AI báo đề có ' + tongCau + ' câu, ToanViet nhận ra ' + soCau + ' câu — dò lại câu bị thiếu hoặc nhãn câu viết sai.</span> ';
        if (kr) h += '<span class="bgerr">' + kr + ' chỗ AI đọc không rõ (tô vàng) — dò với đề gốc rồi sửa trong ô bên trái.</span> ';
        if (hm) h += '<span class="bgerr">' + hm + ' hình AI không vẽ lại được (tô vàng) — chèn ảnh vào tài liệu Word sau.</span> ';
        return h;
      };
      // tô vàng "[KHÔNG RÕ: …]", "[HÌNH: …]" ở phần xem trước: đánh dấu đầu / cuối bằng kí tự ẩn trước khi dựng (bên trong
      // có thể có công thức $…$, dấu ] của công thức không tính), dựng xong thay bằng thẻ <mark>
      const danhDau = (v) => v.split('\n').map((ln) => {
        let out = '', i = 0, toan = false;
        while (i < ln.length) {
          if (ln[i] === '$') toan = !toan;
          if (!toan && /^\[(?:KHÔNG RÕ|HÌNH):/.test(ln.slice(i))) {
            let j = i + 1, t2 = false;
            while (j < ln.length && (t2 || ln[j] !== ']')) { if (ln[j] === '$') t2 = !t2; j++; }
            if (j < ln.length) { out += '\u2063' + ln.slice(i, j + 1) + '\u2064'; i = j + 1; continue; }
          }
          out += ln[i++];
        }
        return out;
      }).join('\n');
      const refresh = () => {
        layTong();
        view.innerHTML = previewHtml(danhDau(src.value)).replace(/\u2063/g, '<mark class="bgkr">').replace(/\u2064/g, '</mark>');
        const list = BaiGiai.formulas(src.value), errs = list.filter(bad), nfig = Object.keys(figSpecs(src.value)).length;
        const fixed = Object.keys(notes).map((k) => k + (notes[k] > 1 ? ' (' + notes[k] + ')' : ''));
        $('#bgnotes').innerHTML = (list.length ? '<b>' + list.length + ' công thức' + (nfig ? ', ' + nfig + ' hình' : '') + '.</b> ' : '') +
          (errs.length ? '<span class="bgerr">' + errs.length + ' công thức có mã LaTeX lỗi (tô đỏ ở phần xem trước) — sửa trong ô bên trái: ' + errs.slice(0, 3).map((x) => '<code>' + esc(x.slice(0, 40)) + '</code>').join(', ') + '</span> ' : '') +
          doiChieu() + (fixed.length ? '<span class="bgfix">Đã làm: ' + esc(fixed.join(' · ').replace(/ · hình (?:phẳng|không gian) — chưa hiểu: "[^"]*"/g, '')) + '</span>' : '');
        $('#bgloi').innerHTML = loiHtml();
      };
      // nhờ AI dựng hình: chép lệnh; dán khối AI trả về → thay hình của câu đó bằng hình theo kịch bản
      $('#bgloi').addEventListener('click', (e) => {
        const aiCopy = e.target.closest('.bgaicopy'), aiOk = e.target.closest('.bgaiok');
        if (aiCopy) { chep(LoiNhacAI.nhoDung(aiCopy.closest('.bgai').dataset.de)).then(() => msg('Đã chép lệnh nhờ AI dựng hình — dán (Ctrl+V) cho ChatGPT / Gemini, rồi chép khối hình AI trả về vào ô bên dưới')); return; }
        if (aiOk) {
          const box = aiOk.closest('.bgai'), key = box.dataset.key, sp = BaiGiai.docKhoi(box.querySelector('.bgaiin').value)[0];
          if (!sp) { msg('Chưa thấy kịch bản hình (khối mã ```toanviet) — dán đúng phần AI trả về', true); return; }
          const er = BaiGiai.loiKhoi(sp);
          if (er.length) { msg('Kịch bản AI viết còn lỗi: ' + deHieu(er)[0] + ' — nhờ AI sửa lại', true); return; }
          // dòng đặt hình "[FIG key|…]" nằm trong câu (dòng khai báo "#FIG hN" của hình tự đọc đề nằm ở đầu nội dung)
          const L0 = src.value.split('\n'), i = L0.findIndex((l) => l.startsWith('[FIG ' + key + '|'));
          const c = cauCua(L0).find((x) => i >= x.start && i < x.end);
          if (!c) { msg('Không tìm thấy chỗ đặt hình của câu này — bấm Dựng lại hình rồi thử lại', true); return; }
          thayHinh(L0, c, sp);
          const f = rebuildFigures(L0.join('\n')); src.value = f.markup; refresh();
          msg('Đã thay bằng hình AI dựng theo kịch bản');
          return;
        }
      });
      // các câu trong nội dung: "#C Câu 2." … tới câu sau (không có nhãn câu: cả bài là một câu)
      function cauCua(L0) {
        const out = [];
        L0.forEach((l, i) => { const m = /^#C\s+(.*)$/.exec(l); if (m) { if (out.length) out[out.length - 1].end = i; out.push({ nhan: m[1], so: ((/(\d+[a-z]?)/i.exec(m[1]) || [])[1] || '').toLowerCase(), start: i, end: L0.length }); } });
        return out.length ? out : [{ nhan: '', so: '', start: 0, end: L0.length }];
      }
      // đặt hình theo kịch bản cho một câu: thay hình đang có (tự đọc đề hoặc kịch bản cũ), chưa có thì đặt trước Lời giải
      function thayHinh(L0, c, sp) {
        const n = 1 + Math.max(0, ...L0.map((l) => { const m = /^#FIG tv(\d+) /.exec(l); return m ? +m[1] : 0; }));
        let i = L0.findIndex((l, k) => k >= c.start && k < c.end && /^#FIG tv\d+ /.test(l));
        if (i >= 0) { L0[i] = L0[i].replace(/^(#FIG tv\d+ ).*$/, (m0, p) => p + JSON.stringify(sp)); return; }
        i = L0.findIndex((l, k) => k >= c.start && k < c.end && /^\[FIG /.test(l));
        if (i >= 0) { L0.splice(i, 1, '#FIG tv' + n + ' ' + JSON.stringify(sp), '[FIG tv' + n + '|Hình]'); return; }
        const g = L0.findIndex((l, k) => k > c.start && k < c.end && /^#G/.test(l));
        L0.splice(g >= 0 ? g : c.end, 0, '#FIG tv' + n + ' ' + JSON.stringify(sp), '[FIG tv' + n + '|Hình]');
      }
      // đề của cả nội dung (bỏ lời giải, dòng hình): để gắn kèm lệnh nhờ AI dựng hình
      function deCaBai(markup) {
        const out = []; let giai = false;
        String(markup).split('\n').forEach((l) => {
          if (/^#C\s/.test(l)) { giai = false; out.push('', l.replace(/^#C\s+/, '')); return; }
          if (/^#G/.test(l)) { giai = true; return; }
          if (/^#(H1|H2|D)\s/.test(l)) giai = false;
          if (giai || /^#FIG |^\[FIG |^#(TAB|ENDTAB|T|PAGE)\b/.test(l)) return;
          out.push(l.replace(/^#\w+\s+/, '').replace(/ \(Hình \d+\)(?=[.:;]?\s*$)/, ''));
        });
        return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      }
      // câu trả lời AI chỉ gồm các khối hình (kèm "Câu n."): đặt hình cho từng câu, giữ nguyên đề đang có
      function ganKhoi(raw) {
        const t = String(raw).normalize('NFC').replace(/\r\n?/g, '\n');
        const ks = BaiGiai.khoiCau(t);
        // phần còn lại (ngoài các khối, nhãn câu, lời dẫn ngắn của AI) gần như trống: đây là câu trả lời chỉ có hình
        let du = t; ks.slice().sort((a, b) => b.start - a.start).forEach((k) => { du = du.slice(0, k.start) + du.slice(k.end); });
        du = du.replace(/(?:c[âa]u|b[àa]i)\s*\d+[a-z]?\s*[.:)]?/gi, '').replace(/[`*#\s.:,-]+/g, '');
        if (!ks.length || du.length > 120) return false;
        const L0 = src.value.split('\n'), cs = cauCua(L0), coHinh = cs.filter((c) => L0.slice(c.start, c.end).some((l) => /^\[FIG /.test(l)));
        const loi2 = [];
        // đặt từ câu cuối lên (chèn dòng không làm lệch vị trí câu phía trên)
        const viec = ks.map((k, i) => ({ k, c: k.so ? cs.find((c) => c.so === k.so) : (ks.length === coHinh.length ? coHinh[i] : ks.length === cs.length ? cs[i] : null) }));
        viec.filter((v) => v.c).sort((a, b) => b.c.start - a.c.start).forEach((v) => { const er = BaiGiai.loiKhoi(v.k.sp); if (er.length) loi2.push((v.c.nhan || 'Hình') + ': ' + deHieu(er)[0]); else thayHinh(L0, v.c, v.k.sp); });
        const f = rebuildFigures(L0.join('\n')); src.value = f.markup; refresh();
        const khong = viec.filter((v) => !v.c).length;
        msg('Đã đặt ' + (viec.length - khong - loi2.length) + ' hình theo kịch bản AI' + (khong ? '; ' + khong + ' khối không rõ của câu nào (ghi "Câu n." trên khối)' : '') + (loi2.length ? '; lỗi: ' + loi2.join(' · ') : ''), !!(khong || loi2.length));
        return true;
      }
      // thêm nội dung AI chép (dán hoặc mở tệp): ô trống thì dựng mới, có rồi thì nối vào chỗ con trỏ;
      // hình kịch bản của phần nối thêm đánh số tiếp (tv1, tv2… của phần sau không trùng phần trước)
      function themVao(raw) {
        raw = layPhan(raw);
        if (!src.value.trim()) src.value = convert(raw);
        else {
          const r = BaiGiai.fromText(raw); mergeNotes(r.notes);
          const n0 = Math.max(0, ...src.value.split('\n').map((l) => { const m = /^#FIG tv(\d+) /.exec(l); return m ? +m[1] : 0; }));
          const mk = n0 ? r.markup.replace(/^(#FIG|\[FIG) tv(\d+)/gm, (m0, p, k) => p + ' tv' + (+k + n0)) : r.markup;
          // nối vào giữa: phần chèn đứng thành dòng riêng, không dính vào dòng trước / sau
          const a = src.selectionStart, b = src.selectionEnd;
          src.setRangeText((a > 0 && src.value[a - 1] !== '\n' ? '\n' : '') + mk + (b < src.value.length && src.value[b] !== '\n' ? '\n' : ''), a, b, 'end');
        }
        refresh();
      }
      // dán: ưu tiên bản HTML (giữ đúng mã LaTeX của công thức), không có thì dùng chữ thường
      src.addEventListener('paste', (e) => {
        const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain');
        if (!html && !text) return;
        e.preventDefault();
        let raw = text;
        try { if (html && /<(p|div|span|h\d|li|math|annotation|table)\b/i.test(html)) raw = BaiGiai.fromHtml(html); } catch (err) { raw = text; }
        // câu trả lời AI chỉ có các khối hình: đặt vào từng câu (phần đề nối thêm "[[PHẦN k/N…]]" thì không phải)
        if (src.value.trim() && !soPhan(raw) && ganKhoi(raw)) return;
        themVao(raw);
      });
      src.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(refresh, 300); });
      $('#bgfig').onclick = () => { const f = rebuildFigures(src.value); src.value = f.markup; refresh(); msg(f.count ? 'Đã dựng ' + f.count + ' hình' : 'Không nhận ra chỗ nào cần hình (miền nghiệm, bảng biến thiên, bảng xét dấu)'); };
      $('#bgclear').onclick = () => { src.value = ''; notes = {}; loi = []; tongCau = 0; phan = { co: new Set(), tong: 0 }; refresh(); src.focus(); };
      $('#bgmake').onclick = async () => {
        const kr = (src.value.match(/\[KHÔNG RÕ:/g) || []).length;
        if (kr) { const q = 'Còn ' + kr + ' chỗ AI đọc không rõ ([KHÔNG RÕ: …]). Vẫn tạo tài liệu Word?'; if (!(await (api && api.confirm ? api.confirm(q) : window.confirm(q)))) return; }
        make(src.value);
      };
      refresh();
      d.showModal();
      src.focus();
      if (mode === 'md') moTep();
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

    // ---------- Chèn hình theo kịch bản (nút "Kịch bản" cạnh Hình phẳng / Hình không gian) ----------
    // dán khối mã ```toanviet / ```toanviet-khonggian AI trả về (hoặc các dòng kịch bản) → chèn đúng hình đó;
    // chưa có kịch bản: nhập đề, chép lệnh nhờ AI dựng hình (không cần lời giải)
    function openKichBan() {
      const d = modal('kbdlg', 'Chèn hình theo kịch bản');
      d.classList.add('kbdlg');
      d.querySelector('.tvbody').innerHTML =
        '<p class="bghint"><b>1.</b> Chưa có kịch bản: nhập (hoặc dán) đề bài, bấm <b>Chép lệnh nhờ AI dựng hình</b>, dán cho ChatGPT / Gemini / Copilot. AI chỉ trả về khối hình, không giải bài.</p>' +
        '<textarea id="kbde" rows="3" spellcheck="false" placeholder="Đề bài (ví dụ: Cho hình chóp S.ABCD có đáy là hình vuông, SA ⊥ (ABCD)…)"></textarea>' +
        '<div class="kbbar"><button type="button" id="kbchep">🤖 Chép lệnh nhờ AI dựng hình</button></div>' +
        '<p class="bghint"><b>2.</b> Dán câu trả lời của AI (khối mã <b>```toanviet</b> / <b>```toanviet-khonggian</b>, hoặc bấm Copy ở khối mã rồi dán) — hoặc tự viết các dòng kịch bản:</p>' +
        '<textarea id="kbsrc" rows="10" spellcheck="false" placeholder="```toanviet\nB = (0, 0)\nC = (6, 0)\nA = (2.3, 3.8)\ndagiac ABC\nM = trungdiem(B, C)\ndoan AM\n[/HÌNH TOANVIET]"></textarea>' +
        '<div class="kbbar"><span id="kbstat" class="bgstat"></span><button type="button" id="kbok" class="primary">Chèn hình</button></div>';
      const src = $('#kbsrc'), stat = $('#kbstat');
      const doc = () => BaiGiai.docKhoi(src.value)[0]; // phẳng / không gian: theo thẻ hoặc toạ độ ba số
      const show = () => {
        const sp = doc();
        if (!src.value.trim()) { stat.textContent = ''; return; }
        if (!sp) { stat.innerHTML = '<span class="bgerr">Chưa thấy kịch bản hình</span>'; return; }
        const er = BaiGiai.loiKhoi(sp);
        stat.innerHTML = (sp.type === 'khtn' ? esc(KhoaHoc.KINDS[sp.kind][0]) : (sp.type === 'space' ? 'Hình không gian' : 'Hình phẳng') + ', ' + sp.script.split('\n').length + ' dòng') + (er.length ? ' — <span class="bgerr" title="' + esc(er.join('\n')) + '">' + esc(deHieu(er).join(' ')) + '</span>' : ' — không có lỗi');
      };
      src.addEventListener('input', show);
      $('#kbchep').onclick = () => {
        const de = $('#kbde').value.trim();
        if (!de) { msg('Nhập đề bài trước khi chép lệnh', true); $('#kbde').focus(); return; }
        window.TVSChep(LoiNhacAI.nhoDung(de)).then(() => msg('Đã chép lệnh — dán (Ctrl+V) cho ChatGPT / Gemini, rồi dán khối hình AI trả về vào ô thứ hai'));
      };
      $('#kbok').onclick = () => {
        const sp = doc();
        if (!sp) { msg('Chưa thấy kịch bản hình — dán khối mã ```toanviet AI trả về', true); return; }
        const er = BaiGiai.loiKhoi(sp);
        if (er.length) { msg('Kịch bản còn lỗi: ' + deHieu(er)[0], true); return; }
        // hình theo môn (```toanviet-mon): mọi trường của mẫu; hình học: kịch bản
        if (sp.type === 'khtn') { const o = Object.assign({}, sp); delete o.type; delete o.scale; C.insert('khtn', sp.kind, o); } else C.insert(sp.type, sp.kind, { script: sp.script, w: sp.w, h: sp.h });
        C.commit();
        d.close();
        msg('Đã chèn ' + (sp.type === 'khtn' ? KhoaHoc.KINDS[sp.kind][0].toLowerCase() : sp.type === 'space' ? 'hình không gian' : 'hình phẳng') + ' theo kịch bản — sửa tiếp ở khung Thuộc tính');
      };
      d.showModal();
      $('#kbde').focus();
    }
    window.__kichban = { open: openKichBan }; // kiểm thử

    return { openBaiGiai, makeBaiGiai: make, openKichBan };
  };
})(window);
