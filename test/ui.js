// Chạy kiểm thử giao diện (test/ui-kichban.js) trong phần mềm thật, với thư mục dữ liệu tạm:
//   node test/ui.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.join(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-ui-'));
const env = Object.assign({}, process.env, {
  TVS_USERDATA: path.join(tmp, 'ud'), TVS_REPORT_DIR: tmp, TVS_AUTO: path.join(tmp, 'auto.log'), TVS_NO_DEMO: '1',
  TVS_SHARED_DIR: path.join(tmp, 'to'), TVS_UPDATE_TEST: path.join(tmp, 'update.log'),
});
delete env.TVS_SHOT_PAGE;
// thư mục dùng chung giả, có sẵn một "bộ cài" bản 99.0.0 (tệp giả) để thử phát hiện bản mới
fs.mkdirSync(path.join(tmp, 'to')); fs.writeFileSync(path.join(tmp, 'to', 'ToanVietStudio-Setup-99.0.0.exe'), 'gia');
const electron = require('electron'); // đường dẫn tới electron.exe
const r = spawnSync(electron, ['.', '--shot=' + path.join(tmp, 'ui.png'), '--evalfile=' + path.join(__dirname, 'ui-kichban.js')], { cwd: root, env, encoding: 'utf8', timeout: 300000 }); // kịch bản dài (~2,5 phút)
const out = (r.stdout || '') + (r.stderr || '');
let pass = 0, fail = 0;
out.split(/\r?\n/).forEach((l) => {
  const m = l.match(/\[renderer\] ((✔|✘).*)$/);
  if (m) console.log(m[1]);
  const d = l.match(/UI-DONE (\d+) (\d+)/);
  if (d) { pass = +d[1]; fail = +d[2]; }
});
// tệp báo lỗi phải được tạo trong thư mục tạm
const rep = fs.readdirSync(tmp).filter((f) => /^BaoLoi-ToanViet-.*\.txt$/.test(f));
if (rep.length && /chưa có điểm C/.test(fs.readFileSync(path.join(tmp, rep[0]), 'utf8'))) { pass++; console.log('✔ tệp báo lỗi ghi đúng lỗi của đối tượng'); } else { fail++; console.log('✘ tệp báo lỗi không có hoặc thiếu nội dung'); }
const shf = path.join(tmp, 'to', 'ThuVien-Thầy A.tvslib');
if (fs.existsSync(shf) && JSON.parse(fs.readFileSync(shf, 'utf8')).items.length === 1) { pass++; console.log('✔ tệp thư viện tổ được ghi vào thư mục chung'); } else { fail++; console.log('✘ không thấy tệp thư viện tổ'); }
const upl = path.join(tmp, 'update.log');
if (fs.existsSync(upl) && /ToanVietStudio-Setup-99\.0\.0\.exe/.test(fs.readFileSync(upl, 'utf8'))) { pass++; console.log('✔ phát hiện bản 99.0.0 và chép bộ cài ra máy'); } else { fail++; console.log('✘ không phát hiện bản mới'); }
if (!/UI-DONE/.test(out)) { fail++; console.log('✘ kịch bản giao diện không chạy hết\n' + out.split(/\r?\n/).filter((l) => /ERROR|Error/.test(l)).slice(0, 5).join('\n')); }
console.log(`\nGiao diện: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
