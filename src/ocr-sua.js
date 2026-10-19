// Sửa lỗi nhận chữ (OCR) cho đề Toán tiếng Việt: Tesseract đọc nhầm những chỗ đặc thù của đề Toán
// (ΔABC → AABC, ⊥ → L, // → Il, tên điểm I ↔ l ↔ 1, O ↔ 0, A' mất dấu phẩy, dấu tiếng Việt…). Bộ quy tắc được đo
// bằng test/ocr-chay.js trên các đề trong test/de-hinh-lop.js vẽ thành ảnh nhiều kiểu.
(function (root) {
  'use strict';

  // ghép các dòng nhận được thành đoạn: bỏ dòng rác (nét hình vẽ đọc thành chữ: ít chữ cái, độ tin cậy thấp),
  // nối dòng bị ngắt giữa câu, giữ xuống dòng trước câu mới / câu nhỏ a) b) c)
  function ghep(lines) {
    const keep = (lines || []).filter((l) => {
      const t = String(l.text || '').trim(); if (!t) return false;
      // dòng rác: ít chữ cái so với độ dài (nét hình, kí hiệu lẻ), hoặc độ tin cậy rất thấp
      const letters = (t.match(/[A-Za-zÀ-ỹĐđ]/g) || []).length, words = t.split(/\s+/).filter((x) => /[a-zà-ỹđ]{2,}/i.test(x)).length;
      if (l.conf < 25) return false;
      // tỉ lệ "từ có nghĩa": từ trong từ điển, tên điểm / tia / góc, số, kí hiệu — dòng rác (vệt bẩn, nét hình) rất thấp
      const TD = root.OcrTuDien || { uni: {} }, toks = t.split(/\s+/).filter(Boolean);
      const good = toks.filter((x) => { const c = x.replace(/^[(\[]+|[,.;:)\]]+$/g, ''); return TD.uni[c.toLowerCase()] || /^[A-Z]{1,4}'{0,2}$/.test(c) || /^[a-z][A-Z][a-z]$|^[A-Z][a-z]$/.test(c) || /^[-+]?\d+(?:[.,]\d+)?°?$/.test(c) || /^[=⊥∥∈∽≠<>≤≥°+\-−/√]+$/.test(c) || /^(?:cm|dm|mm|m|Δ[A-Z]{3})$/.test(c); }).length;
      if (toks.length >= 3 && good / toks.length < 0.4) return false;
      if (words >= 2 && letters >= 0.5 * t.replace(/\s/g, '').length) return true;
      return words >= 1 && letters >= 6 && l.conf >= 55;
    });
    let out = '';
    keep.forEach((l) => {
      const t = l.text.trim();
      if (!out) out = t;
      else if (/^(?:[a-dA-D]\)|Câu\s+\d|Bài\s+\d|\d+[.)]\s)/.test(t) || /[.:?]$/.test(out) && /^[A-ZÀ-ỸĐ]/.test(t) && /^(?:Cho|Gọi|Trên|Kẻ|Vẽ|Lấy|Chứng|Tính|Từ|Qua|Đường|Hai|Tia|Biết|Xét)/.test(t)) out += '\n' + t;
      else out += (/-$/.test(out) ? '' : ' ') + t;
    });
    return out;
  }

  // âm tiết tiếng Việt đúng cấu tạo (phụ âm đầu + vần + phụ âm cuối): từ như vậy không bị đổi sang từ khác mặt chữ
  // khi không có ngữ cảnh rõ ("các", "kéo", "xuống" không bị đổi thành "của", "kẻ", "xưởng")
  const AM = /^(?:ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdđghklmnprstvx])?(?:[aăâeêioôơuưy]{1,3})(?:ch|ng|nh|[cmnpt])?$/;
  const amTiet = (w) => AM.test(w.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC').toLowerCase());
  // so hai cách đặt dấu thanh (toạ / tọa): bỏ dấu thanh, giữ chữ
  const boDau = (w) => w.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC');
  const thanh = (w) => (w.normalize('NFD').match(/[̣̀́̃̉]/) || [''])[0];
  // ---- khôi phục dấu tiếng Việt theo từ điển lời văn đề Toán (src/ocr-tudien.js) ----
  const strip = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  let IDX = null, DEL = null;
  function index() {
    const TD = root.OcrTuDien || (typeof require === 'function' ? require('./ocr-tudien.js') : { uni: {}, bi: {} });
    IDX = {}; DEL = {};
    Object.keys(TD.uni).forEach((w) => {
      const s = strip(w); (IDX[s] = IDX[s] || []).push(w);
      // biến thể xoá một chữ (tìm từ lệch một chữ: "ta" ↔ "tia", "trng" ↔ "trung")
      for (let i = 0; i < s.length; i++) { const d = s.slice(0, i) + s.slice(i + 1); (DEL[d] = DEL[d] || new Set()).add(w); }
      (DEL[s] = DEL[s] || new Set()).add(w);
    });
    return TD;
  }
  function near(s) {
    // từ trong từ điển cách s một phép xoá / thêm / thay một chữ (so trên dạng bỏ dấu)
    const out = new Set();
    (DEL[s] || []).forEach((w) => out.add(w));
    for (let i = 0; i < s.length; i++) (DEL[s.slice(0, i) + s.slice(i + 1)] || []).forEach((w) => { const t = strip(w); if (Math.abs(t.length - s.length) <= 1) out.add(w); });
    return [...out];
  }
  function dau(text) {
    const TD = IDX ? (root.OcrTuDien || require('./ocr-tudien.js')) : index();
    const toks = String(text).split(/([^A-Za-zÀ-ỹĐđ]+)/);
    const low = toks.map((t) => t.toLowerCase());
    const isWord = (i) => i >= 0 && i < toks.length && /^[A-Za-zÀ-ỹĐđ]+$/.test(toks[i]);
    const prevW = (i) => { for (let j = i - 1; j >= 0; j--) { if (isWord(j)) return low[j]; if (/[.;:()]/.test(toks[j])) return '^'; } return '^'; };
    const atStart = (i) => { for (let j = i - 1; j >= 0; j--) { if (/[.;:?!\n]/.test(toks[j])) return true; if (/\S/.test(toks[j])) return false; } return true; };
    const nextW = (i) => { for (let j = i + 1; j < toks.length; j++) { if (isWord(j)) return low[j]; if (/[.;:,()]/.test(toks[j])) return ''; } return ''; };
    const lg = (x) => Math.log(1 + (x || 0));
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!isWord(i) || t.length < 2) continue;
      // tên điểm (AB, MNP), tên tia (Ox, Ay), tên góc (xOy, mOn): có chữ hoa ở giữa — không sửa
      if (/.[A-ZĐ]/.test(t) || /^[A-Z][a-z]$/.test(t)) continue;
      if (i > 0 && /\d\s*$/.test(toks[i - 1])) continue; // đơn vị sau số (cm, độ): để bước kí hiệu sửa
      const w = low[i], s = strip(w), p = prevW(i), n = nextW(i);
      const ctx = (c) => lg(TD.bi[p + ' ' + c]) + lg(TD.bi[c + ' ' + n]);
      const same = IDX[s] || [], cands = new Set(same);
      // từ lệch một chữ ("bai" ↔ "hai", "bình hình" ↔ "bình hành"); mất 1–2 chữ đầu ("ung điểm" ↔ "trung điểm").
      // Từ hai chữ cái (tên đường thẳng xy…) chỉ khôi phục dấu, không đổi chữ.
      if (s.length >= 3) near(s).forEach((c) => cands.add(c));
      if (s.length >= 2) Object.keys(TD.uni).forEach((c) => { const sc2 = strip(c); if (sc2.length > s.length && sc2.length - s.length <= 2 && sc2.endsWith(s) && ctx(c) >= 1.6) cands.add(c); });
      if (!cands.size) continue;
      let best = w, bestSc = -1e9;
      cands.forEach((c) => {
        const exact = strip(c) === s;
        let sc = 0.6 * lg(TD.uni[c]) + 2.2 * ctx(c) + (c === w ? 1.2 : 0) - (exact ? 0 : 2.6);
        // từ khác mặt chữ chỉ được chọn khi có ngữ cảnh ủng hộ (cặp từ đã gặp)
        if (!exact && ctx(c) === 0) sc -= 5;
        if (sc > bestSc) { bestSc = sc; best = c; }
      });
      // từ gốc có trong từ điển: chỉ đổi khi lựa chọn khác hợp ngữ cảnh rõ hơn hẳn (khác mặt chữ thì càng phải rõ hơn);
      // từ gốc không có trong từ điển nhưng đúng cấu tạo âm tiết tiếng Việt: đổi khác mặt chữ chỉ khi ngữ cảnh rất rõ
      if (best !== w && TD.uni[w] && ctx(best) - ctx(w) < (strip(best) === s ? 1.4 : 2.5)) best = w;
      if (best !== w && !TD.uni[w] && strip(best) !== s && amTiet(w) && ctx(best) < 2.2) best = w;
      // cách bỏ dấu cũ / mới (toạ ↔ tọa, hoà ↔ hòa): giữ như gốc
      if (best !== w && boDau(best) === boDau(w) && thanh(best) === thanh(w)) best = w;
      if (best !== w) { toks[i] = t[0] !== t[0].toLowerCase() && atStart(i) ? best[0].toUpperCase() + best.slice(1) : best; low[i] = best; }
    }
    return toks.join('');
  }
  // hai lượt: lượt sau xét mỗi từ theo các từ bên cạnh đã sửa ở lượt trước
  const dau2 = (text) => dau(dau(text));

  // ---- kí hiệu, tên điểm, đơn vị: lỗi nhận chữ đặc thù của đề Toán ----
  function kyhieu(s) {
    return s
      // tên điểm viết hoa có dấu (À, Á, Ê…) đứng riêng: bỏ dấu
      .replace(/(^|[\s,(])([ÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ])(?=[\s,.;:)]|$)/g, (m, a, c) => a + strip(c))
      // độ: 60”, 60º, 60o, 60* sau số đo góc
      .replace(/(\d)\s*[”"'º˚°*]+(?=[\s.,;:)]|$)/g, '$1°').replace(/(\d)\s*o(?=[\s.,;:)]|$)/g, '$1°')
      // đơn vị cm, dm, mm
      .replace(/(\d)\s*(?:cím|crn|cn|em|cin|cmm|c\s?m)(?=[\s.,;:)]|$)/g, '$1 cm')
      // tên tia sau O / A: Ov, O:, Oỵ → Oy; Ox giữ; "tia O x" → "tia Ox"
      .replace(/(tia|góc|và)\s+([A-Z])\s*[vỵýỳ:;](?=[\s.,;:)]|$)/g, '$1 $2y').replace(/(?<![A-Za-z])([A-Z])[vỵ](?=\s+(?:và|,)|[.,;]|$)/g, '$1y')
      // vuông góc ⊥: AH L BC, AH 1 BC, AH | BC (giữa hai tên đoạn)
      .replace(/(?<![A-Za-z])([A-Z]{2})\s*[L1|Ⅰ⊥]\s*(?=[A-Z]{2}(?![a-z])|\()/g, '$1 ⊥ ')
      // song song: AB // CD đọc thành Il, ll, II, || , /
      .replace(/(?<![A-Za-z])([A-Z]{2})\s*(?:\/\/|Il|lI|ll|II|\|\||\/l|l\/|ǁ|∥|\/)\s*(?=[A-Z]{2}(?![a-z]))/g, '$1 // ')
      // tam giác: ΔABC đọc thành AABC, 4ABC, △ABC, ∆ABC (4 chữ hoa không phải tên tứ giác)
      .replace(/(^|[^A-Za-zÀ-ỹ])([A4△∆])([A-Z]{3})(?![A-Za-z'])/g, (m, a, d, n3, off, str) => {
        if (d === 'A') {
          // "AABC", "AMNP": chỉ coi là ΔABC khi không phải tên tứ giác (không có từ chỉ tứ giác đứng trước, tên 4 chữ
          // không xuất hiện ở chỗ khác) và có dấu hiệu tam giác: theo sau là cân / vuông / nhọn / đều / tù / có / nội tiếp
          const before = str.slice(Math.max(0, off - 32), off + a.length), after = str.slice(off + m.length, off + m.length + 14);
          if (/(tứ giác|hình (?:vuông|chữ nhật|bình hành|thoi|thang)|chữ nhật|chóp|lăng trụ|hộp|lập phương|tứ diện|mặt phẳng|[A-Z]\.)\s*\(?\s*$/i.test(before)) return m;
          if (/^\.[A-Z]/.test(str.slice(off + m.length))) return m; // ABCD.A'B'C'D' (lăng trụ, hình hộp)
          if (str.split(d + n3).length > 2) return m;
          if (!(n3[0] === 'A' || /^\s*(?:cân|vuông|nhọn|đều|tù|có|nội tiếp|,|\.|=|∽|~|-|và)/.test(after) || /(?:minh|xét|có|và|=|∽)\s*$/.test(before))) return m;
        }
        return a + 'Δ' + n3;
      })
      // chữ I hoa (tên điểm) đọc thành l thường hoặc số 1 khi đứng riêng sau "điểm", "tại", "là"
      .replace(/\b(điểm|tại|là|tâm|và)\s+[l1|](?=[\s,.;:)]|$)/g, '$1 I')
      // chữ O hoa đọc thành số 0 khi là tên điểm: "tâm 0", "(0)", "tại 0"
      .replace(/\b(tâm|tại|điểm|đường tròn)\s+0(?=[\s,.;:)]|$)/g, '$1 O').replace(/\(\s*0\s*([;)])/g, '(O$1')
      // dấu phẩy trên tên điểm (A') đọc thành ’ ` ´
      .replace(/([A-Z])[’`´‘]/g, "$1'");
  }

  // sửa trước khi khôi phục dấu: đơn vị sau số, dấu chấm / phẩy giữa tên điểm, "ta Ox" → "tia Ox"
  function truoc(s) {
    return s
      .replace(/(\d)\s*(?:cím|crn|cn|em|cin|cmm|c\s?m|tìm|ẻm|êm)(?=[\s.,;:)]|$)/g, '$1 cm')
      .replace(/(?<![A-Za-z])([A-Z]'?)\.\s+(?=[A-Z]'?(?:[.,]\s|\s+(?:và|thẳng|là|lần|cùng|không|theo)))/g, '$1, ')
      .replace(/(?<![A-Za-zÀ-ỹ])([Tt])a\s+(?=[A-Z][a-z]?(?![A-Za-zÀ-ỹ])|đối|phân giác)/g, '$1ia ');
  }

  // tên điểm đọc sai: "bờ" (BC), "mi" (MI), "MINP" (MNP), "MIP" (MP), "VỊN" (MN) — đối chiếu với các tên điểm
  // xuất hiện ở chỗ khác trong cùng đề; chỉ sửa ở chỗ cần tên điểm (sau "cạnh", "đoạn", "cắt", "tại", "của"…)
  function tenDiem(s) {
    const known = new Set(s.match(/(?<![A-Za-zÀ-ỹ])[A-Z]{2,4}(?![A-Za-zÀ-ỹ'])/g) || []);
    const cnt = {}; (s.match(/(?<![A-Za-zÀ-ỹ])[A-Z]{2,4}(?![A-Za-zÀ-ỹ'])/g) || []).forEach((k) => { cnt[k] = (cnt[k] || 0) + 1; });
    const ham = (a, b) => { if (a.length !== b.length) return 9; let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; };
    const KEY = '(?:cạnh|đoạn thẳng|đoạn|đường thẳng|đường cao|trung tuyến|tia|dây|của|với|cắt|tại|trên|thuộc|và|góc|tam giác|vuông góc với|song song với)';
    // chữ thường / có dấu ở chỗ tên điểm
    s = s.replace(new RegExp('(' + KEY + '\\s+)([A-Za-zÀ-ỹĐđ]{2,3})(?=[\\s,.;:)]|$)', 'g'), (m, k, t) => {
      if (/^[A-Z]+$/.test(t)) return m;
      const U = strip(t).toUpperCase();
      if (!/^[A-Z]+$/.test(U)) return m;
      if (known.has(U)) return k + U;
      const c = [...known].filter((x) => ham(x, U) === 1);
      return c.length === 1 ? k + c[0] : m;
    });
    // "bờ" ở chỗ tên điểm (không phải "nửa mặt phẳng bờ AB"): Tesseract hay đọc "BC" thành "bờ"
    s = s.replace(new RegExp('(' + KEY + '\\s+)bờ(?!\\s+[A-Z]{2})(?=[\\s,.;:)]|$)', 'g'), '$1BC');
    // tên điểm viết hoa bị thêm dấu (BẮC → BAC), không phải chữ in hoa tiếng Việt có trong từ điển (BÀI, CÂU, ĐỀ)
    const TD = root.OcrTuDien || { uni: {} };
    s = s.replace(/(?<![A-Za-zÀ-ỹ])([A-ZÀ-ỸĐ]{2,4})(?![A-Za-zÀ-ỹ'])/g, (m, t) => {
      if (/^[A-Z]+$/.test(t) || t.includes('Đ') || TD.uni[t.toLowerCase()]) return m;
      const u = strip(t); return /^[A-Z]+$/.test(u) ? u : m;
    });
    // tên góc, tên tia bị chèn chữ (mềOn → mOn): bỏ một chữ thì thành tên đã gặp
    const angles = new Set(s.match(/(?<![A-Za-zÀ-ỹ])[a-z][A-Z][a-z](?![A-Za-zÀ-ỹ])/g) || []);
    s = s.replace(/(?<![A-Za-zÀ-ỹ])([a-zà-ỹ]{1,2}[A-Z][a-zà-ỹ]{1,2})(?![A-Za-zÀ-ỹ])/g, (m, t) => {
      if (angles.has(t)) return m;
      for (let i = 0; i < t.length; i++) { const u = t.slice(0, i) + t.slice(i + 1); if (angles.has(u)) return u; }
      return m;
    });
    // chữ hoa thừa chữ I (MINP → MNP, MIP → MP) khi bản bỏ I là tên đã gặp và bản có I chỉ xuất hiện một lần
    s = s.replace(/(?<![A-Za-zÀ-ỹ])([A-Z]{3,5})(?![A-Za-zÀ-ỹ'])/g, (m, t) => {
      if (cnt[t] > 1 || !/I/.test(t.slice(1))) return m;
      for (let i = 1; i < t.length; i++) if (t[i] === 'I') { const u = t.slice(0, i) + t.slice(i + 1); if (known.has(u) && u !== t) return u; }
      return m;
    });
    return s;
  }
  function kyhieu2(s) {
    return s
      // ⊥ đọc thành +: "AH + BC tại H", "kẻ AH + BC" (không phải tổng vectơ: không có chữ vectơ, dấu = trong vế câu)
      .replace(/(?<!vectơ\s?)(?<![A-Za-z])([A-Z]{2})\s*\+\s*([A-Z]{2}|\([A-Z']+\))(?=\s*(?:tại|\(|,|\.|;|và|$))/g, (m, a, b, off, str) => {
        const cl = str.slice(Math.max(0, str.lastIndexOf('.', off) + 1), str.indexOf('.', off) < 0 ? undefined : str.indexOf('.', off));
        return /vectơ|=|→/.test(cl) ? m : a + ' ⊥ ' + b;
      })
      .replace(/€/g, '∈')
      // dấu = đọc thành z, ~ : "AB z5 cm", "8C=z 3", "MD ~ MA" (giữa hai tên đoạn, không phải hai tam giác)
      .replace(/(?<![A-Za-z])8([A-Z])(?=\s*(?:=|z\s?\d))/g, 'B$1')
      .replace(/(?<![A-Za-z])([A-Z]{2})\s*(?:=\s*z|z\s*=|z)\s*(?=\d)/g, '$1 = ')
      .replace(/(?<![A-Za-zΔ])([A-Z]{2})\s*~\s*(?=[A-Z]{2}(?![A-Za-z]))/g, '$1 = ')
      // tên tia viết thường đầu (ot, oy) sau "tia": Ot, Oy
      .replace(/(\btia\s+)o([a-z])(?=[\s,.;:)]|$)/g, '$1O$2')
      // hai tam giác đồng dạng: ΔHBA - ΔABC, ΔHBA ~ ΔABC
      .replace(/(Δ[A-Z]{3})\s*[-~∼]\s*(?=Δ[A-Z]{3})/g, '$1 ∽ ')
      // đường tròn (O, R) → (O; R)
      .replace(/\(\s*([A-Z]'?)\s*,\s*(R|r|\d+(?:[,.]\d+)?\s*(?:cm)?)\s*\)/g, '($1; $2)')
      // căn: a√2 đọc thành av2, aV3
      .replace(/(?<![A-Za-zÀ-ỹ])(a|\d+)[vV](\d)(?![\d])/g, '$1√$2')
      // toạ độ mất ngoặc mở: B3; -1) → B(3; -1)
      .replace(/(?<![A-Za-zÀ-ỹ(])([A-Z])\s?(-?\d+(?:[,.]\d+)?)\s*;\s*(-?\d+(?:[,.]\d+)?)\s*\)/g, '$1($2; $3)')
      // số 8 đọc thành $ trước đơn vị
      .replace(/(^|[\s=(])\$(?=\s*(?:cm|dm|mm|m\b|,|\.|°))/g, '$18')
      // chữ I đọc thành 1, l, ] trong ngoặc tên điểm: (1 thuộc NP), (không trùng M, ])
      .replace(/\((?:1|l)\s+(thuộc|là|nằm|khác|∈)/g, '(I $1').replace(/,\s*[\]|]\s*\)/g, ', I)')
      .replace(/Ñ/g, 'N');
  }

  function sua(t) {
    let s = String(t || '').replace(/[ \t]+/g, ' ');
    s = truoc(s);
    s = dau2(s);
    s = kyhieu(s);
    s = kyhieu2(s);
    s = tenDiem(s);
    return s.replace(/[ \t]+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
  }

  root.OcrSua = { ghep, sua };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.OcrSua;
})(typeof window !== 'undefined' ? window : globalThis);
