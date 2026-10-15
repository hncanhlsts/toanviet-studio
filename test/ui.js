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
});
delete env.TVS_SHOT_PAGE;
const electron = require('electron'); // đường dẫn tới electron.exe
const r = spawnSync(electron, ['.', '--shot=' + path.join(tmp, 'ui.png'), '--evalfile=' + path.join(__dirname, 'ui-kichban.js')], { cwd: root, env, encoding: 'utf8', timeout: 180000 });
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
if (!/UI-DONE/.test(out)) { fail++; console.log('✘ kịch bản giao diện không chạy hết\n' + out.split(/\r?\n/).filter((l) => /ERROR|Error/.test(l)).slice(0, 5).join('\n')); }
console.log(`\nGiao diện: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
