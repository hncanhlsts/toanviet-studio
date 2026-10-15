// Bản vá: ghi dữ liệu ToanViet vào ảnh PNG (khối tEXt "ToanViet") để vẫn sửa được khi tài liệu mất "văn bản thay thế";
// đọc lại từ ảnh khi cần; báo lỗi rõ ràng; dọn ký tự lạ khi chuyển MathType / Equation.
//   node build/patch-dulieu-anh.js
const fs = require('fs');
const path = require('path');
const R = (f) => path.join(__dirname, '..', f);
const rep = (file, a, b) => {
  const s = fs.readFileSync(R(file), 'utf8');
  if (s.includes(b)) { console.log('đã có: ' + file + ' · ' + b.slice(0, 50).replace(/\n/g, ' ')); return; }
  if (!s.includes(a)) throw new Error('không thấy mốc trong ' + file + ': ' + a.slice(0, 90));
  fs.writeFileSync(R(file), s.replace(a, () => b));
  console.log('ok: ' + file + ' · ' + a.slice(0, 50).replace(/\n/g, ' '));
};

// ---------- main.js: hàm ghi / đọc khối dữ liệu trong PNG ----------
rep('main.js', "ipcMain.handle('office', async (e, opts) => {", `// Dữ liệu ToanViet ghi thêm vào ảnh PNG (khối tEXt "ToanViet"): khi tài liệu đi qua phần mềm khác (WPS, Google Docs, Zalo…)
// làm mất "văn bản thay thế" của hình thì vẫn đọc lại được công thức từ chính tấm ảnh.
const CRC_T = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function pngWithData(buf, data) {
  if (!data || buf.length < 20 || buf.toString('latin1', buf.length - 8, buf.length - 4) !== 'IEND') return buf;
  const body = Buffer.concat([Buffer.from('tEXtToanViet\\0', 'latin1'), Buffer.from(String(data), 'latin1')]);
  const len = Buffer.alloc(4); len.writeUInt32BE(body.length - 4);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([buf.slice(0, buf.length - 12), len, body, crc, buf.slice(buf.length - 12)]);
}
function pngData(buf) {
  let p = 8;
  while (p + 8 <= buf.length) {
    const n = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8);
    if (type === 'tEXt') { const s = buf.toString('latin1', p + 8, p + 8 + n); if (s.startsWith('ToanViet\\0')) return s.slice(9); }
    if (type === 'IEND') break;
    p += 12 + n;
  }
  return null;
}
ipcMain.handle('office', async (e, opts) => {`);
// chèn vào Word / PowerPoint: ảnh mang theo dữ liệu
rep('main.js', "  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '.png');\n  fs.writeFileSync(file, buf);\n  // kiểm thử: chỉ xuất ảnh",
  "  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '.png');\n  fs.writeFileSync(file, pngWithData(buf, opts.data));\n  // kiểm thử: chỉ xuất ảnh");
rep('main.js', "TVS_SRC: /^(ole|omath)$/.test(opts.source || '') ? opts.source : '', TVS_W:", "TVS_SRC: /^(ole|omath|img)$/.test(opts.source || '') ? opts.source : '', TVS_W:");
// chuyển đổi hàng loạt: ảnh mang theo dữ liệu
rep('main.js', "      j.tmp = j.png;\n", "      j.tmp = j.png;\n      try { fs.writeFileSync(j.png, pngWithData(fs.readFileSync(j.png), j.alt)); } catch (err) { /* vẫn chèn ảnh không kèm dữ liệu */ }\n");
// đọc hình đang chọn: thêm nguồn là ảnh (đọc dữ liệu trong PNG)
rep('main.js', "    const m = out.match(/^OK:(Word|PPT|WordEq|MathType):(.+)$/);\n    if (m) return { ok: true, from: m[1], data: m[2] };",
  `    const m = out.match(/^OK:(Word|PPT|WordEq|MathType|Img):(.+)$/);
    if (m && m[1] === 'Img') {
      const d = pngData(Buffer.from(m[2], 'base64'));
      if (d) return { ok: true, from: 'Word', data: d, src: 'img' };
      return { ok: false, error: 'Hình đang chọn không có dữ liệu ToanViet. Nếu đây là công thức ToanViet, dữ liệu của nó đã bị mất (thường do tài liệu từng được mở, lưu bằng phần mềm khác như WPS, Google Docs) — cần soạn lại công thức này.' };
    }
    if (m) return { ok: true, from: m[1], data: m[2] };`);
// PowerShell: nguồn là ảnh không có văn bản thay thế
rep('main.js', `            if ($mb.Success) { $payload = ($mb.Groups[1].Value -replace '\\s', '') }
          } }`, `            if ($mb.Success) { $payload = ($mb.Groups[1].Value -replace '\\s', '') }
          } elseif ($ish.Type -eq 3) {
            # ảnh thường (không còn văn bản thay thế): gửi ảnh để tìm dữ liệu ToanViet ghi trong PNG
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/media/[^"]+\\.png"[^>]*>\\s*<pkg:binaryData>([\\s\\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $kind = 'Img'; $payload = ($mb.Groups[1].Value -replace '\\s', '') }
          } }`);
rep('main.js', "      if ($env:TVS_SRC -eq 'ole') {", "      if ($env:TVS_SRC -eq 'ole' -or $env:TVS_SRC -eq 'img') {");
// quét công thức ToanViet để chuyển đổi: cả ảnh đã mất văn bản thay thế nhưng còn dữ liệu trong PNG
rep('main.js', "          if ($kind -eq 'tvs') { if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine(\"$i|0|\" + $al.Substring(5)); $n++ } }",
  `          if ($kind -eq 'tvs') {
            if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine("$i|0|" + $al.Substring(5)); $n++ }
            elseif ($s.Type -eq 3) { $d0 = PngTvs $s; if ($d0) { [void]$sb.AppendLine("$i|0|" + $d0); $n++ } }
          }`);
rep('main.js', "$pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'", `$pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
# dữ liệu ToanViet ghi trong ảnh PNG (khối tEXt "ToanViet") của một hình trong dòng
function PngTvs($shape) {
  try {
    $mb = [regex]::Match($shape.Range.WordOpenXML, '<pkg:part pkg:name="/word/media/[^"]+\\.png"[^>]*>\\s*<pkg:binaryData>([\\s\\S]*?)</pkg:binaryData>')
    if (-not $mb.Success) { return $null }
    $b = [Convert]::FromBase64String(($mb.Groups[1].Value -replace '\\s', '')); $p = 8
    while ($p + 8 -le $b.Length) {
      $n = ([int]$b[$p] -shl 24) -bor ([int]$b[$p + 1] -shl 16) -bor ([int]$b[$p + 2] -shl 8) -bor [int]$b[$p + 3]
      $t = [Text.Encoding]::ASCII.GetString($b, $p + 4, 4)
      if ($t -eq 'tEXt') { $s = [Text.Encoding]::GetEncoding(28591).GetString($b, $p + 8, $n); if ($s.StartsWith("ToanViet\`0")) { return $s.Substring(9) } }
      if ($t -eq 'IEND') { break }
      $p += 12 + $n
    }
  } catch {}
  $null
}`);

// ---------- app.js: nguồn là ảnh; dữ liệu hỏng thì báo rõ ----------
rep('src/app.js', "      } else if (r.ok) {\n        try {\n          const o = JSON.parse(", "      } else if (r.ok) {\n        if (r.src === 'img') OFFICE.source = 'img';\n        try {\n          const o = JSON.parse(");
rep('src/app.js', "        } catch (e) { /* dữ liệu hỏng: soạn mới */ }\n      }\n      msg('Chưa chọn công thức ToanViet nào trong ' + officeName() + ' — soạn công thức mới.', true);",
  `        } catch (e) {
          await api.info('Không đọc được dữ liệu của hình ToanViet đang chọn (dữ liệu bị hỏng). Hình trong tài liệu được giữ nguyên.\\n\\nThầy cô có thể soạn lại công thức mới, rồi xoá hình cũ.');
        }
      } else if (r.error && !/Hãy chọn/.test(r.error)) {
        await api.info(r.error);
      }
      msg('Chưa chọn công thức ToanViet nào trong ' + officeName() + ' — soạn công thức mới.', true);`);
// ---------- MathType, Equation: dấu gạch ngang dùng làm dấu trừ; ký tự vô hình ----------
rep('src/mtef.js', '  const oleToLatex = (bytes) => mtefToLatex(mtefFromOle(bytes));', "  // gõ dấu gạch ngang (–) thay cho dấu trừ là thói quen phổ biến trong MathType: đưa về dấu trừ\n  const oleToLatex = (bytes) => mtefToLatex(mtefFromOle(bytes)).replace(/[\\u2013\\u2212]/g, '-');");
rep('src/omml.js', '  root.OMML = { toLatex: ommlToLatex };', "  // bỏ các ký tự vô hình (U+2061–2064: áp dụng hàm, nhân ẩn, dấu phẩy ẩn, cộng ẩn) mà Word chèn khi chuyển công thức\n  root.OMML = { toLatex: (x) => ommlToLatex(x).replace(/[\\u2061-\\u2064]/g, '') };");
console.log('xong');
