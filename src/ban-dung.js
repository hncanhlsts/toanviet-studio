// Số bản dựng: bản chỉ sửa lỗi giữ nguyên số phiên bản (2.7.9) nhưng tăng "buildNumber" trong package.json.
// electron-builder ghi số này vào phần cuối phiên bản tệp của bộ cài (2.7.9.N), nên bản cập nhật trong thư mục tổ vẫn
// được nhận ra dù tên tệp ToanVietStudio-Setup-2.7.9.exe không đổi.
(function (root) {
  'use strict';
  // VS_FIXEDFILEINFO trong tài nguyên của tệp .exe: chữ ký 0xFEEF04BD, sau đó 4 byte (phiên bản cấu trúc),
  // dwFileVersionMS (major.minor), dwFileVersionLS (patch.revision)
  const SIG = [0xbd, 0x04, 0xef, 0xfe];
  function docPhienBan(buf) {
    for (let i = 0; i + 16 <= buf.length; i++) {
      if (buf[i] !== SIG[0] || buf[i + 1] !== SIG[1] || buf[i + 2] !== SIG[2] || buf[i + 3] !== SIG[3]) continue;
      const u32 = (k) => (buf[k] | (buf[k + 1] << 8) | (buf[k + 2] << 16) | (buf[k + 3] << 24)) >>> 0;
      const ms = u32(i + 8), ls = u32(i + 12);
      return [ms >>> 16, ms & 0xffff, ls >>> 16, ls & 0xffff];
    }
    return null;
  }
  // số bản dựng của bộ cài (tài nguyên nằm ở đầu tệp, đọc 1 MB là đủ); không đọc được thì 0
  function cuaBoCai(file) {
    try {
      const fs = require('fs'), fd = fs.openSync(file, 'r'), buf = Buffer.alloc(1 << 20);
      const n = fs.readSync(fd, buf, 0, buf.length, 0); fs.closeSync(fd);
      const v = docPhienBan(buf.subarray(0, n));
      return v ? v[3] : 0;
    } catch (e) { return 0; }
  }
  // "2.7.9" + bản dựng 2 → "2.7.9 (bản dựng 2)"; bản dựng 0 chỉ ghi số phiên bản
  const nhan = (ver, ban) => ver + (ban > 0 ? ' (bản dựng ' + ban + ')' : '');
  const api = { docPhienBan, cuaBoCai, nhan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BanDung = api;
})(this);
