// v1.6: sửa trực tiếp công thức MathType và Equation của Word (đọc sang ToanViet, chèn lại thì thay cho công thức gốc)
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};

let f = mk('src/mtef.js');
f.rep("    return out.replace(/ +/g, ' ').replace(/ (?=[}^_)\\]'])/g, '').trim();", "    return out.replace(/\\\\text\\{\\s*\\}/g, '').replace(/ +/g, ' ').replace(/ (?=[}^_)\\]'])/g, '').trim();");
f.save();

f = mk('src/index.html');
f.rep('<script src="omml.js"></script>', '<script src="omml.js"></script>\n<script src="mtef.js"></script>');
f.save();

f = mk('src/app.js');
f.rep("data: btoa(bin), keep: !!(OFFICE && OFFICE.keep) });", "data: btoa(bin), source: (OFFICE && OFFICE.source) || '' });");
f.rep("auto: false, lastOk: false, keep: false } : null;", "auto: false, lastOk: false, source: '' } : null;");
const a1 = "      if (r.ok && r.from === 'MathType') {";
const a2 = "      } else if (r.ok) {";
{
  let s = fs.readFileSync('src/app.js', 'utf8'); // chỉ để kiểm tra
}
f.save();
let s = fs.readFileSync('src/app.js', 'utf8');
const i1 = s.indexOf(a1), i2 = s.indexOf(a2, i1);
if (i1 < 0 || i2 < 0) throw new Error('edit block not found');
s = s.slice(0, i1) + `      if (r.ok && (r.from === 'MathType' || r.from === 'WordEq')) {
        // Công thức MathType hoặc Equation của Word: đọc nội dung sang ToanViet để sửa.
        // Khi bấm chèn, bản ToanViet thay cho công thức gốc; bấm Huỷ thì tài liệu không đổi.
        const kind = r.from === 'MathType' ? 'MathType' : 'Equation';
        try {
          const raw = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
          const latex = r.from === 'MathType' ? MTEF.oleToLatex(raw) : OMML.toLatex(new TextDecoder().decode(raw));
          OFFICE.source = r.from === 'MathType' ? 'ole' : 'omath';
          OFFICE.auto = true;
          const o = insert('formula', null, { latex, size: officeSize(), x: 60, y: 50 });
          msg('Đã mở công thức ' + kind + '. Bấm chèn để thay cho công thức gốc; Esc để giữ nguyên.');
          editFormula(o);
          return;
        } catch (e) {
          await api.info('Không đọc được công thức ' + kind + ' này (' + e.message + ').\\n\\nCông thức trong tài liệu được giữ nguyên.');
          return api.quit();
        }
` + s.slice(i2);
fs.writeFileSync('src/app.js', s);

f = mk('main.js');
f.rep("TVS_KEEP: opts.keep ? '1' : '0',", "TVS_SRC: /^(ole|omath)$/.test(opts.source || '') ? opts.source : '',");
// chèn: thay cho công thức gốc
{
  let m = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
  const b1 = m.indexOf("      if ($env:TVS_KEEP -eq '1') {"), b2 = m.indexOf("      if ($sel.InlineShapes.Count -eq 1 -and", b1);
  if (b1 < 0 || b2 < 0) throw new Error('keep block not found');
  m = m.slice(0, b1) + `      $omOld = $null
      if ($env:TVS_SRC -eq 'ole') {
        # nguồn là công thức MathType đang chọn: xoá đối tượng gốc, ảnh ToanViet vào đúng chỗ đó
        try { if ($sel.InlineShapes.Count -ge 1) { $sel.InlineShapes.Item(1).Delete(); $rep = 1 } } catch {}
      } elseif ($env:TVS_SRC -eq 'omath') {
        # nguồn là công thức Equation của Word: ra khỏi vùng công thức, chèn ảnh ngay sau rồi mới xoá công thức gốc
        try {
          if ($sel.OMaths.Count -ge 1) {
            $omOld = $sel.OMaths.Item(1)
            $rg = $omOld.Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection
            [void]$sel.MoveRight(1, 1) # một lần là đủ; Word vẫn báo OMaths.Count = 1 dù con trỏ đã ở ngoài
          }
        } catch {}
      }
` + m.slice(b2);
  const c1 = "      try { $p.Range.Font.Position = -[int]$env:TVS_POS; $sel.Font.Position = 0 } catch {}\n";
  if (!m.includes(c1)) throw new Error('position line not found');
  m = m.replace(c1, () => c1 + "      if ($omOld) { try { $omOld.Range.Delete() | Out-Null; $rep = 1 } catch {} }\n");
  // đọc: lấy dữ liệu OLE của công thức MathType
  const d1 = "if ($pg -like 'Equation*') { $kind = 'MathType' } }";
  if (!m.includes(d1)) throw new Error('mathtype detect not found');
  m = m.replace(d1, () => `if ($pg -like 'Equation*') {
            $kind = 'MathType'
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\\s*<pkg:binaryData>([\\s\\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $payload = ($mb.Groups[1].Value -replace '\\s', '') }
          } }`);
  fs.writeFileSync('main.js', m);
}

f = mk('office-addin/ToanVietAddin.cs');
f.rep('Công thức Equation của Word cũng đọc được; công thức MathType được giữ nguyên.', 'Công thức MathType và Equation của Word cũng mở được để sửa: bấm chèn thì thay cho công thức gốc.');
f.save();

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.6.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v1.6 patched');
