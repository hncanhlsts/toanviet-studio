// Chạy rà soát ảnh công thức (test/ra-soat-cong-thuc.js) trong phần mềm thật:  node test/ra-soat-cong-thuc-chay.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-ct-'));
const env = Object.assign({}, process.env, { TVS_USERDATA: path.join(tmp, 'ud'), TVS_AUTO: path.join(tmp, 'auto.log'), TVS_NO_DEMO: '1' });
const r = spawnSync(require('electron'), ['.', '--shot=' + path.join(tmp, 'ct.png'), '--evalfile=' + path.join(__dirname, 'ra-soat-cong-thuc.js')], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 600000 });
const out = (r.stdout || '') + (r.stderr || '');
out.split(/\r?\n/).map((l) => (l.match(/\[renderer\] (CT.*)$/) || [])[1]).filter(Boolean).forEach((l) => console.log(l));
