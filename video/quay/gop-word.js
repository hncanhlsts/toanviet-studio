// Gộp nhật ký quay cửa sổ Word (video/quay/word.ps1) thành meta.json cùng dạng với các cảnh quay phần mềm:
//   node video/quay/gop-word.js <thư mục cảnh>
// Vào: khung.txt ("thời điểm tệp" mỗi dòng, thời điểm tính bằng mili giây Unix), su-kien.txt (mỗi dòng một JSON có t),
// rong.txt (bề rộng ảnh). Toạ độ con trỏ tính theo điểm ảnh của ảnh chụp.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const rd = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, '') : '');
const frames = rd('khung.txt').split(/\r?\n/).filter(Boolean).map((l) => { const [t, f] = l.trim().split(/\s+/); return { t: +t, f }; });
const evs = rd('su-kien.txt').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
const t0 = frames.length ? frames[0].t : 0;
const seen = new Map(); let kept = 0;
let out = frames.filter((fr) => fs.existsSync(path.join(dir, fr.f))).map((fr) => {
  const p = path.join(dir, fr.f), h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
  if (seen.has(h)) { fs.unlinkSync(p); return { t: fr.t - t0, f: seen.get(h) }; }
  seen.set(h, fr.f); kept++; return { t: fr.t - t0, f: fr.f };
});
out = out.filter((fr, i, a) => i === 0 || fr.f !== a[i - 1].f);
const meta = {
  frames: out,
  cursor: evs.filter((e) => e.k === 'cur').map((e) => ({ t: e.t - t0, x: e.x, y: e.y, down: !!e.down, show: e.show !== false })),
  marks: evs.filter((e) => e.k === 'mark').map((e) => ({ t: e.t - t0, name: e.name })),
  keys: [],
  w: +(rd('rong.txt').trim() || 2400),
  h: 0,
};
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
console.log(path.basename(dir) + ': ' + kept + ' ảnh khác nhau, dài ' + ((out.length ? out[out.length - 1].t : 0) / 1000).toFixed(1) + ' giây, mốc: ' + meta.marks.map((m) => m.name + '@' + (m.t / 1000).toFixed(1)).join(', '));
