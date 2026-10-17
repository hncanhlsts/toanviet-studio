// Chạy kịch bản thử "Bài giải AI → Word" (test/baigiai-kichban.js) trong phần mềm thật:  node test/baigiai-chay.js [tệp.docx]
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-bg-'));
const out = process.argv[2] || path.join(tmp, 'bai-giai.docx');
const env = Object.assign({}, process.env, { TVS_USERDATA: path.join(tmp, 'ud'), TVS_AUTO: path.join(tmp, 'auto.log'), TVS_NO_DEMO: '1', TVS_DOCX_OUT: out });
const r = spawnSync(require('electron'), ['.', '--shot=' + path.join(tmp, 'bg.png'), '--evalfile=' + path.join(__dirname, 'baigiai-kichban.js')], { cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 300000 });
const txt = (r.stdout || '') + (r.stderr || '');
let inBody = false;
txt.split(/\r?\n/).forEach((l) => {
  const m = l.match(/\[renderer\] (.*)$/);
  if (m && /^BG/.test(m[1])) { inBody = m[1] === 'BG-NOIDUNG'; console.log(m[1]); return; }
  if (inBody && !/\[renderer\]/.test(l)) console.log('   ' + l);
});
console.log('Tệp Word: ' + out + (fs.existsSync(out) ? ' (' + fs.statSync(out).size + ' byte)' : ' (CHƯA CÓ)'));
