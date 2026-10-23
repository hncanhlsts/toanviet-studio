// Đóng gói skill Claude "toanviet-ve-hinh":  node build/dong-goi-skill.js   (kiểm tra đã cập nhật chưa: --kiem-tra)
// - references/kich-ban-hinh.md: lời nhắc vẽ hình (src/loi-nhac-ai.js — cùng nội dung với nút "Chép lời nhắc vẽ hình cho AI")
// - scripts/plane.js, space.js, mathexpr.js, baigiai-chuyen.js: bộ dựng hình và bộ đọc kịch bản của phần mềm (scripts/kiem-tra.js kiểm tra y như ToanViet)
// - skill/toanviet-ve-hinh.zip: gói để tải lên Claude (Cài đặt → Năng lực → Skills) hoặc giải nén vào ~/.claude/skills
// Gói .zip chỉ tạo lại khi nội dung skill đổi (không sinh thay đổi thừa trong kho).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'skill', 'toanviet-ve-hinh');
const zip = path.join(root, 'skill', 'toanviet-ve-hinh.zip');
const check = process.argv.includes('--kiem-tra');
const want = {
  'references/kich-ban-hinh.md': require(path.join(root, 'src', 'loi-nhac-ai.js')).text(),
  'scripts/plane.js': fs.readFileSync(path.join(root, 'src', 'plane.js'), 'utf8'),
  'scripts/mathexpr.js': fs.readFileSync(path.join(root, 'src', 'mathexpr.js'), 'utf8'),
  'scripts/space.js': fs.readFileSync(path.join(root, 'src', 'space.js'), 'utf8'),
  'scripts/baigiai-chuyen.js': fs.readFileSync(path.join(root, 'src', 'baigiai-chuyen.js'), 'utf8'),
  // biểu đồ, sơ đồ theo môn (khối ```toanviet-mon) và ký hiệu linh kiện của mạch điện
  'scripts/khtn.js': fs.readFileSync(path.join(root, 'src', 'khtn.js'), 'utf8'),
  'scripts/sgk.js': fs.readFileSync(path.join(root, 'src', 'sgk.js'), 'utf8'),
};
const stale = Object.keys(want).filter((k) => { const f = path.join(dir, k); return !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== want[k]; });
if (check) {
  if (stale.length || !fs.existsSync(zip)) { console.log('✘ skill toanviet-ve-hinh chưa cập nhật (' + (stale.join(', ') || 'thiếu .zip') + ') — chạy: node build/dong-goi-skill.js'); process.exit(1); }
  console.log('✔ skill toanviet-ve-hinh khớp với src/loi-nhac-ai.js, src/plane.js');
  process.exit(0);
}
stale.forEach((k) => { const f = path.join(dir, k); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, want[k]); });
const newest = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((t, e) => Math.max(t, e.isDirectory() ? newest(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).mtimeMs), 0);
if (!stale.length && fs.existsSync(zip) && fs.statSync(zip).mtimeMs >= newest(dir)) { console.log('Skill không đổi: giữ ' + path.relative(root, zip)); process.exit(0); }
if (fs.existsSync(zip)) fs.unlinkSync(zip);
// nén bằng tar.exe của Windows (đường dẫn trong gói dùng dấu /, mở được trên mọi máy); thư mục gốc trong gói: toanviet-ve-hinh/
execFileSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', zip, '-C', path.join(root, 'skill'), 'toanviet-ve-hinh'], { stdio: 'inherit' });
console.log('Đã tạo ' + path.relative(root, zip));
