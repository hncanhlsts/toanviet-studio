// Quay một cảnh của video giới thiệu:  node video/quay/chay.js <tên cảnh>   (vd: c1-cong-thuc)
// Chạy phần mềm thật ở chế độ kiểm thử, cửa sổ 1600×900 (16:9), nạp video/quay/ghi.js + video/quay/<tên cảnh>.js.
// Ảnh chụp lưu vào video/khung/<tên cảnh>/ (khung trùng nhau bị bỏ), kèm meta.json (thời điểm, con trỏ, phím tắt, mốc).
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const name = process.argv[2];
if (!name) { console.log('Cách dùng: node video/quay/chay.js <tên cảnh>'); process.exit(1); }
const root = path.join(__dirname, '..', '..');
const out = path.join(__dirname, '..', 'khung', name);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tvs-quay-'));
const script = 'window.__OUT = ' + JSON.stringify(out.replace(/\\/g, '/')) + ';\n' + fs.readFileSync(path.join(__dirname, 'ghi.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, name + '.js'), 'utf8');
fs.writeFileSync(path.join(tmp, 'canh.js'), script);
const env = Object.assign({}, process.env, { TVS_WIN_SIZE: '1600x900', TVS_USERDATA: path.join(tmp, 'ud'), TVS_AUTO: path.join(tmp, 'auto.log'), TVS_NO_DEMO: '1', TVS_DOCX_OUT: path.join(tmp, 'bai-giai.docx') }, JSON.parse(process.env.TVS_QUAY_ENV || '{}'));
// TVS_QUAY_ARGS: tham số thêm (JSON), vd mở như add-in Word gọi: ["--office=word","--mode=new","--wpid=1234"]
const extra = JSON.parse(process.env.TVS_QUAY_ARGS || '[]');
// cửa sổ bị che / nằm nền: Chromium hãm bộ đếm giờ và vẽ (còn ~1 khung mỗi giây) — tắt khi quay
const NO_THROTTLE = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
const r = spawnSync(require('electron'), NO_THROTTLE.concat(['.'], extra, ['--shot=' + path.join(tmp, 'x.png'), '--evalfile=' + path.join(tmp, 'canh.js')]),{ cwd: root, env, encoding: 'utf8', timeout: 900000, maxBuffer: 1 << 28 });
const txt = (r.stdout || '') + (r.stderr || '');
const line = txt.split(/\r?\n/).find((l) => l.includes('REC-META '));
txt.split(/\r?\n/).filter((l) => /\[renderer\] (LOG|ERR)/.test(l) || /Error/.test(l)).slice(0, 40).forEach((l) => console.log(l));
if (!line) { console.log('Không có REC-META — xem nhật ký:\n' + txt.slice(-3000)); process.exit(1); }
const meta = JSON.parse(line.slice(line.indexOf('REC-META ') + 9));
// bỏ khung trùng (giữ khung đầu, các khung sau trỏ về nó)
const seen = new Map(); let kept = 0;
meta.frames = meta.frames.filter((fr) => fs.existsSync(path.join(out, fr.f))).map((fr) => {
  const p = path.join(out, fr.f), h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
  if (seen.has(h)) { fs.unlinkSync(p); return { t: fr.t, f: seen.get(h) }; }
  seen.set(h, fr.f); kept++; return fr;
});
// gộp các khung liên tiếp trỏ cùng một ảnh
meta.frames = meta.frames.filter((fr, i, a) => i === 0 || fr.f !== a[i - 1].f);
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta));
const dur = meta.frames.length ? meta.frames[meta.frames.length - 1].t : 0;
console.log(name + ': ' + kept + ' ảnh khác nhau, dài ' + (dur / 1000).toFixed(1) + ' giây, mốc: ' + meta.marks.map((m) => m.name + '@' + (m.t / 1000).toFixed(1)).join(', '));
fs.rmSync(tmp, { recursive: true, force: true });
