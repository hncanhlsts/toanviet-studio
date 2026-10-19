// Rà soát hình vẽ theo chương trình từng lớp (test/de-hinh-lop.js): chạy đúng luồng Bài giải AI (fromText → figures),
// rồi kiểm từng đề:
//   1. có / không thêm hình đúng như cần (hình phẳng, hình không gian);
//   2. mọi điểm có tên trong đề đều có trên hình;
//   3. không còn câu dựng hình mà phần mềm chưa hiểu;
//   4. các quan hệ hình học của đề đúng trên hình (vuông góc, thẳng hàng, song song, bằng nhau…);
//   5. không có hai điểm chồng / sát nhau, không có hai chữ đè lên nhau.
// Chạy: node test/kiem-hinh-lop.js [lớp]   (in bảng theo lớp; mã thoát khác 0 nếu có đề chưa đạt)
global.window = global;
require('../src/mathexpr.js');
require('../src/plane.js');
require('../src/space.js');
global.DeHinh = require('../src/dedehinh.js');
const BG = require('../src/baigiai-chuyen.js');
const LIST = require('./de-hinh-lop.js');

const only = process.argv[2] ? +process.argv[2] : null;
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]], len = (v) => Math.hypot(v[0], v[1]), cross = (u, v) => u[0] * v[1] - u[1] * v[0], dot = (u, v) => u[0] * v[0] + u[1] * v[1];
const PN = "[A-Z](?:'{1,2}|_?\\d|_\\{\\d\\})?";
const names = (s) => (s.match(new RegExp(PN, 'g')) || []).map((n) => n.replace(/_\{?(\d)\}?/, '$1'));

// điểm có tên trong đề: chữ in hoa trong công thức $…$, bỏ tên hệ trục (Oxy, Oxyz), bán kính R, \sin B → B vẫn là điểm
function pointNames(de) {
  const out = new Set();
  // đề chép dạng chữ thường (không có $…$): tên điểm là các cụm chữ in hoa đứng riêng (MNP, MI, K), bỏ chữ đầu câu
  if (!/\$/.test(de)) {
    (de.replace(/([A-Z])_\{?(\d)\}?/g, '$1$2').replace(/O\s*xyz?/g, ' ').replace(/\(\s*[A-Z]'?\s*;[^)]*\)/g, ' ').match(/(?<![A-Za-zÀ-ỹĐđ])[A-Z]+'*\d?(?![a-zà-ỹđ'])/g) || []).forEach((w) => names(w).forEach((n) => out.add(n)));
    out.delete('R');
    return [...out];
  }
  (de.match(/\$[^$]*\$/g) || []).forEach((m) => {
    let s = m.slice(1, -1)
      .replace(/\\(?:widehat|hat|overline|overrightarrow|vec|text|mathrm)\s*\{([^{}]*)\}/g, ' $1 ')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/O\s*xyz?/g, ' ')
      .replace(/\(\s*([A-Z]'?)\s*;\s*[^)]*\)/g, ' $1 ') // (O; R), (O; 5 cm): chỉ lấy tâm
      .replace(/\(\s*-?[\d.,]+\s*(?:;\s*-?[\d.,]+\s*){1,2}\)/g, ' '); // toạ độ
    s = s.replace(/[A-Z]\s*\(\s*-?[\d.,]+/g, (x) => x[0] + ' ');
    names(s).forEach((n) => out.add(n));
  });
  ['R'].forEach((n) => out.delete(n));
  return [...out];
}

function check(P, rel) {
  const [k, ...a] = rel.split(/\s+/);
  const pts = (s) => names(s).map((n) => P[n]);
  const need = a.flatMap(names).filter((n) => !P[n]);
  if (need.length) return 'thiếu điểm ' + need.join(', ');
  const tol = 1e-3;
  if (k === 'vg') { const [A, B, C] = pts(a[0]); const u = sub(A, B), v = sub(C, B); return Math.abs(dot(u, v)) / (len(u) * len(v)) < 1e-3 ? '' : 'góc ' + a[0] + ' không vuông'; }
  if (k === 'th') { const [A, B, C] = pts(a[0]); const u = sub(B, A), v = sub(C, A); return Math.abs(cross(u, v)) / (len(u) * len(v) || 1) < tol ? '' : a[0] + ' không thẳng hàng'; }
  if (k === 'giua') { const [A, B, C] = pts(a[0]); const u = sub(B, A), v = sub(C, A), t = dot(u, v) / dot(v, v); return Math.abs(cross(u, v)) / (len(u) * len(v) || 1) < tol && t > 0.02 && t < 0.98 ? '' : names(a[0])[1] + ' không nằm giữa ' + names(a[0])[0] + ' và ' + names(a[0])[2]; }
  if (k === 'ss') { const [A, B] = pts(a[0]), [C, D] = pts(a[1]); const u = sub(B, A), v = sub(D, C); return Math.abs(cross(u, v)) / (len(u) * len(v)) < tol ? '' : a[0] + ' không song song ' + a[1]; }
  if (k === 'bn') { const [A, B] = pts(a[0]), [C, D] = pts(a[1]); const x = len(sub(B, A)), y = len(sub(D, C)); return Math.abs(x - y) / Math.max(x, y) < tol ? '' : a[0] + ' ≠ ' + a[1]; }
  if (k === 'tl') { const [A, B] = pts(a[0]), [C, D] = pts(a[1]); const x = len(sub(B, A)), y = len(sub(D, C)); return Math.abs(x / y - +a[2]) < 0.01 ? '' : a[0] + ' : ' + a[1] + ' = ' + (x / y).toFixed(3) + ' (cần ' + a[2] + ')'; }
  if (k === 'tron') { const O = P[names(a[0])[0]], ns = a.slice(1).flatMap(names), d = ns.map((n) => len(sub(P[n], O))); return d.every((x) => Math.abs(x - d[0]) / d[0] < tol) ? '' : ns.join(', ') + ' không cùng nằm trên đường tròn tâm ' + a[0]; }
  if (k === 'pg') { const ang = (s) => { const [A, B, C] = pts(s); const u = sub(A, B), v = sub(C, B); return Math.acos(dot(u, v) / (len(u) * len(v))); }; return Math.abs(ang(a[0]) - ang(a[1])) < 1e-3 ? '' : 'góc ' + a[0] + ' ≠ góc ' + a[1]; }
  return 'không rõ quan hệ ' + k;
}

function figuresOf(de) {
  const r = BG.fromText('**Bài 1**\n' + de + '\n');
  const g = BG.figures(r.markup);
  const figs = g.markup.split('\n').filter((l) => /^#FIG /.test(l)).map((l) => JSON.parse(l.replace(/^#FIG \S+ /, '')));
  return { figs, notes: Object.keys(g.notes) };
}

// kiểm một đề: trả về danh sách lỗi và kịch bản hình
function checkOne(de, o, full) {
  const errs = [], warns = [];
  let figs = [], notes = [];
  try { ({ figs, notes } = figuresOf(full || de)); } catch (e) { errs.push('lỗi chạy: ' + e.message); }
  const pl = figs.find((f) => f.type === 'plane'), sp = figs.find((f) => f.type === 'space');
  if (o.hinh === false && (pl || sp)) errs.push('không cần hình nhưng đã vẽ ' + (pl ? 'hình phẳng' : 'hình không gian'));
  if (o.hinh === 'phang' && !pl) errs.push('cần hình phẳng nhưng chưa vẽ' + (sp ? ' (đã vẽ hình không gian)' : ''));
  if (o.hinh === 'khonggian' && !sp) errs.push('cần hình không gian nhưng chưa vẽ' + (pl ? ' (đã vẽ hình phẳng)' : ''));
  notes.filter((n) => /chưa hiểu/.test(n)).forEach((n) => errs.push(n));
  const want = pointNames(de).filter((n) => !(o.bo || []).includes(n));
  if (pl && o.hinh !== false) {
    const r = Plane.render({ script: pl.script, labels: true }, 340, 300);
    (r.errors || []).forEach((e) => errs.push('lỗi hình: ' + e));
    const shown = new Set(r.labels.flatMap((l) => String(l.tex).replace(/\s+/g, '').split('\\equiv')));
    const P = Plane.points(pl.script);
    const miss = want.filter((n) => !shown.has(n) && !shown.has(n.replace(/(\d)$/, '_{$1}')) && !shown.has(n.replace(/(\d)$/, '_$1')));
    if (miss.length) errs.push('thiếu điểm trên hình: ' + miss.join(', '));
    (o.dung || []).forEach((rel) => { const e = check(P, rel); if (e) errs.push('sai: ' + e); });
    // điểm sát nhau (toạ độ màn hình), chữ đè nhau
    const S = r.pts || {}, vis = want.filter((n) => S[n]);
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
      const d = len(sub(S[vis[i]], S[vis[j]]));
      if (d < 0.5) warns.push('đề cho ' + vis[i] + ' và ' + vis[j] + ' là cùng một điểm (ghi chung nhãn ' + vis[i] + ' ≡ ' + vis[j] + ')');
      else if (d < 12) errs.push('điểm ' + vis[i] + ', ' + vis[j] + ' sát nhau (' + d.toFixed(0) + ' px)');
    }
    const box = (l) => { const w = String(l.tex).replace(/[{}_\\]/g, '').length * l.size * 0.55 + 2, h = l.size * 0.9; return [l.x - w / 2, l.y - h / 2, l.x + w / 2, l.y + h / 2]; };
    const L = r.labels.filter((l) => /^[A-Za-z]'*(?:_\{?\d\}?)?$/.test(String(l.tex)));
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = box(L[i]), b = box(L[j]);
      const ov = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      if (ov > 0.25 * (a[2] - a[0]) * (a[3] - a[1])) errs.push('chữ ' + L[i].tex + ' và ' + L[j].tex + ' đè nhau');
    }
  }
  if (sp && sp.script && o.hinh !== false) {
    const P = Space.points(sp.script), alias = {};
    sp.script.split('\n').forEach((l) => { const m = /^nhan\s+(\S+)\s*=\s*(.+)$/.exec(l.trim()); if (m) alias[m[2].replace(/[_{}]/g, '')] = m[1]; });
    const miss = want.filter((n) => !P[n] && !P[alias[n]]);
    if (miss.length) errs.push('thiếu điểm trên hình: ' + miss.join(', '));
  }
  return { errs, warns, script: pl ? pl.script : sp ? sp.script || '(' + sp.kind + ')' : '' };
}

// đề chép từ trang web / tin nhắn thường không có $…$: đổi đề mẫu sang dạng chữ thường như người dùng hay chép
function plain(de) {
  return de.replace(/\\(?:widehat|hat)\s*\{([^{}]*)\}/g, 'góc $1').replace(/\\overrightarrow\s*\{([^{}]*)\}/g, 'vectơ $1')
    .replace(/\\vec\s*\{?0\}?/g, '0').replace(/\\vec\s*\{([^{}]*)\}/g, '$1').replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\perp/g, '⊥').replace(/\\parallel/g, '//').replace(/\\Delta\s*/g, 'Δ').replace(/\^\\circ/g, '°').replace(/\\in\b/g, '∈')
    .replace(/\\ne\b/g, '≠').replace(/\\cdot/g, '.').replace(/\\backsim/g, '∽').replace(/\\sqrt\{([^{}]*)\}/g, '√$1').replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\$/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/\s+/g, ' ').trim();
}

const rows = [];
LIST.forEach(([lop, cd, de, o], idx) => {
  if (only && lop !== only) return;
  const r = checkOne(de, o);
  rows.push({ idx, lop, cd, ok: !r.errs.length, errs: r.errs, warns: r.warns, script: r.script });
});
LIST.forEach(([lop, cd, de, o], idx) => {
  if ((only && lop !== only) || !/\$/.test(de)) return;
  const p = plain(de), r = checkOne(p, o);
  rows.push({ idx, lop: 'Lớp ' + lop + ' — đề chép dạng chữ (không có $)', cd: cd + (r.errs.length ? '\n      đề: ' + p : ''), ok: !r.errs.length, errs: r.errs, warns: r.warns, script: r.script });
});
// các bộ đề đã có (đề thầy gửi, đề cương, đề thử): cùng các tiêu chí, hình nào có thì phải đủ điểm, không chèn sát
if (!only) {
  const GEO = /tam giác|tứ giác|hình (?:vuông|chữ nhật|bình hành|thoi|thang|chóp|lăng trụ|hộp|lập phương)|đường tròn|tứ diện|thẳng hàng|tia\s|góc\s+\$?[a-z][A-Z][a-z]/;
  const sets = [['đề hình phẳng mẫu', require('./de-hinh-phang.js').map((x) => [x[0], x[1]])]];
  const fs = require('fs'), path = require('path');
  fs.readdirSync(__dirname).filter((f) => /^baigiai-.*\.txt$/.test(f)).forEach((f) => {
    const txt = fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r/g, '');
    const parts = txt.split(/\n(?=\s*\**\s*(?:Bài|Câu)\s*\d+)/).filter((b) => /^\s*\**\s*(?:Bài|Câu)\s*\d+/.test(b));
    sets.push([f, (parts.length ? parts : [txt]).map((b) => [b.split('\n')[0].replace(/\*/g, '').slice(0, 40), b.split(/\n\s*\**\s*(?:Lời giải|Giải|Hướng dẫn)/)[0], b])]);
  });
  sets.forEach(([name, items]) => items.forEach(([ten, de, full], k) => {
    if (!GEO.test(de) || /O\s*xyz/.test(de)) return;
    // bài toạ độ, miền nghiệm, đồ thị: hình không bắt buộc (bài chỉ có điểm toạ độ thì không vẽ), nhưng đã vẽ thì phải đạt
    const hinh = /hình (?:chóp|lăng trụ|hộp|lập phương)|tứ diện|khối|hình (?:trụ|nón|cầu)|mặt cầu/.test(de) ? 'khonggian' : /O\s*xy|tọa độ|toạ độ|đồ thị|miền nghiệm/.test(de) ? undefined : 'phang';
    const r = checkOne(de, { hinh }, full);
    rows.push({ idx: k, lop: name, cd: ten, ok: !r.errs.length, errs: r.errs, warns: r.warns, script: r.script });
  }));
}

const verbose = process.argv.includes('-v');
let bad = 0;
[...new Set(rows.map((r) => r.lop))].forEach((lop) => {
  const rs = rows.filter((r) => r.lop === lop), ok = rs.filter((r) => r.ok).length;
  console.log('\n== ' + (typeof lop === 'number' ? 'Lớp ' + lop : lop) + ': ' + ok + '/' + rs.length + ' dạng đạt');
  rs.forEach((r) => {
    console.log((r.ok ? '  ✔ ' : '  ✘ ') + '#' + r.idx + ' ' + r.cd + (r.ok ? '' : '\n      - ' + r.errs.join('\n      - ')) + (r.warns && r.warns.length ? '\n      ⚠ ' + r.warns.join('\n      ⚠ ') : ''));
    if (!r.ok) bad++;
    if (!r.ok && verbose && r.script) console.log(r.script.replace(/^/gm, '      | '));
  });
});
console.log('\nTổng: ' + (rows.length - bad) + '/' + rows.length + ' dạng đạt');
process.exitCode = bad ? 1 : 0;
