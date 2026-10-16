// Chạy kịch bản rà soát giao diện (test/ra-soat.js) trong phần mềm thật, với thư mục dữ liệu tạm:  node test/ra-soat-chay.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-rs-'));
const env = Object.assign({}, process.env, { TVS_USERDATA: path.join(tmp, 'ud'), TVS_AUTO: path.join(tmp, 'auto.log'), TVS_NO_DEMO: '1' });
const r = spawnSync(require('electron'), ['.', '--shot=' + path.join(tmp, 'rs.png'), '--evalfile=' + path.join(__dirname, 'ra-soat.js')], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 600000 });
const out = (r.stdout || '') + (r.stderr || '');
const lines = out.split(/\r?\n/).map((l) => (l.match(/\[renderer\] (RS.*)$/) || [])[1]).filter(Boolean);
lines.forEach((l) => console.log(l));
if (!lines.some((l) => l === 'RS-XONG')) console.log('Kịch bản rà soát chưa chạy hết.\n' + out.split(/\r?\n/).filter((l) => /error|Error/.test(l)).slice(0, 8).join('\n'));
