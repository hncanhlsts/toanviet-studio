// Bản vá: Soạn đề kiểm tra (cấu trúc 2025), xuất sang Word; phông công thức kiểu Times.
//   node build/patch-soande.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 80));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file);
};
const app = fs.readFileSync(path.join(__dirname, 'patch-soande.app.txt'), 'utf8');
const ps = fs.readFileSync(path.join(__dirname, 'patch-soande.ps.txt'), 'utf8');

// ---------- tiến trình chính ----------
rep('main.js', "  } elseif ($act -eq 'inserteq') {\n", ps);
rep('main.js', "  if (opts.action === 'inserteq') {",
  "  if (opts.action === 'buildexam') {\n    const jf = path.join(app.getPath('temp'), 'toanviet-de-' + Date.now() + '.json');\n    fs.writeFileSync(jf, JSON.stringify(opts.job), 'utf8');\n    const out = await runOffice({ TVS_ACT: 'buildexam', TVS_JOB: jf });\n    fs.unlink(jf, () => {});\n    (opts.job.images || []).forEach((im) => fs.unlink(im.file, () => {}));\n    const m = out.match(/^OK:(\\d+)$/);\n    return m ? { ok: true, count: +m[1] } : { ok: false, error: 'Lỗi khi tạo đề trong Word: ' + out.slice(4) };\n  }\n  if (opts.action === 'inserteq') {");
rep('main.js', "      { label: 'Thư viện của tôi…', accelerator: 'Ctrl+L', click: send('lib') },",
  "      { label: 'Thư viện của tôi…', accelerator: 'Ctrl+L', click: send('lib') },\n      { label: 'Soạn đề kiểm tra…', accelerator: 'Ctrl+Shift+D', click: send('exam') },");
rep('main.js', "      { label: 'Toàn màn hình', role: 'togglefullscreen' },",
  "      { label: 'Phông công thức kiểu Times', type: 'checkbox', click: (mi) => win.webContents.send('menu', mi.checked ? 'font-times' : 'font-tex') },\n      { type: 'separator' },\n      { label: 'Toàn màn hình', role: 'togglefullscreen' },");

// ---------- giao diện ----------
rep('src/app.js', '  const CMD = {', app + '  const CMD = {');
rep('src/app.js', "    lib: () => openLib(),", "    lib: () => openLib(),\n    exam: () => openExam(),\n    'font-times': () => setFormulaFont(true),\n    'font-tex': () => setFormulaFont(false),");
// phông công thức kiểu Times (nhớ cho lần sau)
rep('src/app.js', '  const CMD = {', `  function setFormulaFont(times) {
    document.body.classList.toggle('ftimes', !!times);
    try { localStorage.setItem('tvs-font-times', times ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    mkCache.clear(); renderAll(); paintSel();
    msg(times ? 'Công thức dùng phông kiểu Times New Roman (giống chữ trong Word)' : 'Công thức dùng phông mặc định');
  }
  try { if (localStorage.getItem('tvs-font-times') === '1') document.body.classList.add('ftimes'); } catch (e) { /* bỏ qua */ }
  const CMD = {`);
// lưu đề cùng tài liệu
rep('src/app.js', "      const data = JSON.stringify({ app: 'ToanVietStudio', version: 1, objects: JSON.parse(serialize()) }, null, 1);",
  "      const data = JSON.stringify(Object.assign({ app: 'ToanVietStudio', version: 1, objects: JSON.parse(serialize()) }, S.exam && S.exam.qs.length ? { exam: S.exam } : {}), null, 1);");
rep('src/app.js', "    S.sel = null; S.multi = []; S.file = file || null;", "    S.sel = null; S.multi = []; S.exam = null; S.file = file || null;");
rep('src/app.js', "      try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); msg('Đã mở ' + r.file); if (api.draft) api.draft({ action: 'clear' }); } catch (e) { msg('Tệp không hợp lệ', true); }",
  "      try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); if (d.exam) S.exam = d.exam; msg('Đã mở ' + r.file + (d.exam ? ' (có đề kiểm tra ' + d.exam.qs.length + ' câu — Ctrl+Shift+D để mở)' : '')); if (api.draft) api.draft({ action: 'clear' }); } catch (e) { msg('Tệp không hợp lệ', true); }");
rep('src/app.js', "  if (api && api.onOpenFile) api.onOpenFile((r) => { try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); msg('Đã mở ' + r.file); } catch (e) { msg('Tệp không hợp lệ', true); } });",
  "  if (api && api.onOpenFile) api.onOpenFile((r) => { try { const d = JSON.parse(r.data); loadDoc(Array.isArray(d) ? d : d.objects, r.file); if (d.exam) S.exam = d.exam; msg('Đã mở ' + r.file); } catch (e) { msg('Tệp không hợp lệ', true); } });");
// bản nháp tự lưu: gồm cả đề
rep('src/app.js', "    if (!api || !api.draft || !S.dirty || !S.objs.length) return;\n    const data = serialize();",
  "    if (!api || !api.draft || !S.dirty || !(S.objs.length || (S.exam && S.exam.qs.length))) return;\n    const data = S.exam && S.exam.qs.length ? JSON.stringify({ objects: JSON.parse(serialize()), exam: S.exam }) : serialize();");
rep('src/app.js', "    let objs; try { objs = JSON.parse(d.data); } catch (e) { return; }\n    if (!Array.isArray(objs) || !objs.length) return;",
  "    let objs, exam = null; try { objs = JSON.parse(d.data); } catch (e) { return; }\n    if (objs && !Array.isArray(objs)) { exam = objs.exam || null; objs = objs.objects || []; }\n    if (!Array.isArray(objs) || !(objs.length || exam)) return;");
rep('src/app.js', "      loadDoc(objs, d.file || null);\n      S.dirty = true; title();",
  "      loadDoc(objs, d.file || null);\n      if (exam) S.exam = exam;\n      S.dirty = true; title();");
rep('src/app.js', "    if (api && api.setDirty) api.setDirty(S.dirty && S.objs.length > 0);",
  "    if (api && api.setDirty) api.setDirty(S.dirty && (S.objs.length > 0 || !!(S.exam && S.exam.qs.length)));");
// nút trên thanh công cụ
rep('src/index.html', '<button data-cmd="lib" title="Thư viện của tôi: công thức, hình hay dùng (Ctrl+L)"><i>📚</i>Thư viện</button>',
  '<button data-cmd="lib" title="Thư viện của tôi: công thức, hình hay dùng (Ctrl+L)"><i>📚</i>Thư viện</button>\n      <button data-cmd="exam" title="Soạn đề kiểm tra theo cấu trúc 2025 và xuất sang Word (Ctrl+Shift+D)"><i>📝</i>Soạn đề</button>');

const css = R('src/styles.css');
if (!fs.readFileSync(css, 'utf8').includes('.exmain')) fs.appendFileSync(css, `
/* phông công thức kiểu Times */
body.ftimes .ML__mathit { font-family: "Times New Roman", serif !important; font-style: italic; }
body.ftimes .ML__cmr, body.ftimes .ML__mathrm { font-family: "Times New Roman", serif !important; }
/* hộp thoại Soạn đề */
.tvdlg.wide { width: min(1180px, 96vw); }
.exhead summary { cursor: pointer; color: #14407f; margin-bottom: 6px; }
.exgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin-bottom: 8px; }
.exgrid label { display: flex; flex-direction: column; font-size: 12px; color: #4a5868; }
.exgrid input { padding: 5px 7px; border: 1px solid #c9d1db; border-radius: 5px; font: inherit; }
.exmain { display: grid; grid-template-columns: 320px 1fr; gap: 12px; min-height: 420px; }
.exlist { border: 1px solid #dde3ea; border-radius: 6px; overflow: auto; max-height: 56vh; }
.exp { border-bottom: 1px solid #eef1f4; }
.exph { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #f3f7fc; font-size: 12.5px; }
.exph b { color: #14407f; }
.exph button { margin-left: auto; padding: 1px 9px !important; }
.exq { padding: 5px 10px; font-size: 12.5px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exq:hover { background: #f7f9fb; }
.exq.on { background: #e5eefb; }
.exed { display: flex; flex-direction: column; gap: 6px; overflow: auto; max-height: 56vh; }
.exrow { display: flex; align-items: center; gap: 6px; }
.exl { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: #4a5868; }
#exstem { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #c9d1db; border-radius: 5px; font: 14px "Times New Roman", serif; resize: vertical; }
.exo { display: flex; align-items: center; gap: 6px; }
.exo input:not([type=radio]) { flex: 1; padding: 5px 7px; border: 1px solid #c9d1db; border-radius: 5px; font: 14px "Times New Roman", serif; }
.exo label, .exo span { min-width: 40px; font-weight: 600; }
.exfig { max-height: 60px; border: 1px solid #dde3ea; border-radius: 4px; }
.exprev { border: 1px dashed #c9d1db; border-radius: 6px; padding: 8px 10px; font: 16px "Times New Roman", serif; }
.exopts { display: grid; gap: 2px 10px; margin-top: 4px; }
.exopts.c4 { grid-template-columns: repeat(4, 1fr); } .exopts.c2 { grid-template-columns: repeat(2, 1fr); } .exopts.c1 { grid-template-columns: 1fr; }
`);
console.log('xong');
