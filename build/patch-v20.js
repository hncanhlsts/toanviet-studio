// v2.0: chuyển mã LaTeX <-> ToanViet trong Word; chèn nhanh hơn (cầu nối PowerShell chạy sẵn, ẩn cửa sổ ngay khi bấm chèn)
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { get s() { return s; }, set s(v) { s = v; }, rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};

// ---------------- main.js ----------------
let f = mk('main.js');
f.rep("op: /^(mt2tv|tv2mt|eq2tv|tv2eq)$/.test(argVal('--op'))", "op: /^(mt2tv|tv2mt|eq2tv|tv2eq|tex2tv|tv2tex)$/.test(argVal('--op'))");
// quét mã LaTeX trong tài liệu
f.rep("    if ($kind -eq 'omath') {", String.raw`    if ($kind -eq 'latex') {
      # mã LaTeX dán từ các trợ lí AI: $...$, $$...$$, \(...\), \[...\] (kể cả khối $$ hoặc \[ nằm riêng một dòng)
      $rx = New-Object Regex '\$\$(?<a>[^$]+?)\$\$|\\\[(?<b>.+?)\\\]|\\\((?<c>.+?)\\\)|(?<![\\$])\$(?!\s)(?<d>[^$\r\n]{1,400}?)(?<!\s)\$(?![\d$])'
      $trim = [char[]](13, 7, 32, 9, 11, 160)
      $ps = New-Object Collections.ArrayList
      foreach ($p in $doc.Paragraphs) { $r0 = $p.Range; [void]$ps.Add(@($r0.Start, $r0.End, "$($r0.Text)")) }
      $emit = { param($s0, $e0, $tex)
        $fs = 0; try { $fs = [double]$doc.Range($s0, $e0).Font.Size } catch {}
        [void]$sb.AppendLine("$s0|$fs|" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($tex)) + "|$e0") }
      $i = 0
      while ($i -lt $ps.Count) {
        $t = $ps[$i][2]; $tt = $t.Trim($trim)
        if ($tt -eq '$$' -or $tt -eq '\[') {
          $close = '\]'; if ($tt -eq '$$') { $close = '$$' }
          $j = $i + 1; $acc = ''; $found = $false
          while ($j -lt $ps.Count -and $j -le $i + 15) { $t2 = $ps[$j][2].Trim($trim); if ($t2 -eq $close) { $found = $true; break }; $acc += ' ' + $t2; $j++ }
          if ($found -and $acc.Trim()) { & $emit $ps[$i][0] ($ps[$j][1] - 1) $acc.Trim(); $n++; $i = $j + 1; continue }
        }
        foreach ($m in $rx.Matches($t)) {
          $tex = ''; foreach ($g in 'a', 'b', 'c', 'd') { if ($m.Groups[$g].Success) { $tex = $m.Groups[$g].Value } }
          $s0 = $ps[$i][0] + $m.Index; $e0 = $s0 + $m.Length
          if ($tex.Trim() -and "$($doc.Range($s0, $e0).Text)" -eq $m.Value) { & $emit $s0 $e0 $tex.Trim(); $n++ }
        }
        $i++
      }
    } elseif ($kind -eq 'omath') {`);
f.rep("          } elseif ($op -eq 'tv2mt') {", String.raw`          } elseif ($op -eq 'tex2tv') {
            # $f: đầu | ảnh | rộng | cao | hạ dòng | dữ liệu | cuối  (thay đoạn mã LaTeX bằng công thức ToanViet)
            $r = $doc.Range($i, [int]$f[6]); $r.Delete() | Out-Null
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'tv2tex') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertAfter([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))); $n++
          } elseif ($op -eq 'tv2mt') {`);
// cầu nối PowerShell chạy sẵn: không phải khởi động PowerShell cho mỗi lần chèn
{
  let s = f.s;
  const a = s.indexOf('function runOffice(env) {'), b = s.indexOf('// dựng ảnh PNG của một đối tượng ra tệp tạm');
  if (a < 0 || b < 0) throw new Error('runOffice not found');
  f.s = s.slice(0, a) + String.raw`// PowerShell được mở một lần và chờ lệnh qua stdin (mỗi lệnh là một dòng JSON mã hoá base64), trả kết quả "@@<base64>"
const PS_LOOP = 'function Invoke-Bridge {\n' + OFFICE_PS.replace(/\bexit\b/g, 'return') + '\n}\n' + [
  "$keys = 'TVS_ACT','TVS_APP','TVS_PNG','TVS_ALT','TVS_W','TVS_H','TVS_POS','TVS_SRC','TVS_KIND','TVS_OUT','TVS_OP','TVS_JOB'",
  'while ($true) {',
  '  $line = [Console]::In.ReadLine(); if ($null -eq $line) { break }; if (-not $line) { continue }',
  "  try { $j = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line)) | ConvertFrom-Json; foreach ($k in $keys) { Set-Item ('env:' + $k) ([string]$j.$k) }; $r = @(Invoke-Bridge) | Select-Object -Last 1 } catch { $r = 'ERR:' + $_.Exception.Message }",
  "  [Console]::Out.WriteLine('@@' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$r))); [Console]::Out.Flush()",
  '}',
].join('\n');
let psProc = null, psBuf = '';
const psWait = [];
function startBridge() {
  if (psProc) return;
  const file = path.join(app.getPath('temp'), 'toanviet-bridge.ps1');
  fs.writeFileSync(file, '﻿' + PS_LOOP, 'utf8');
  const boot = 'Invoke-Expression ([IO.File]::ReadAllText($env:TVS_SCRIPT, [Text.Encoding]::UTF8))';
  psProc = require('child_process').spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(boot, 'utf16le').toString('base64')],
    { env: Object.assign({}, process.env, { TVS_SCRIPT: file }), windowsHide: true });
  psBuf = '';
  psProc.stdout.setEncoding('utf8');
  psProc.stdout.on('data', (d) => {
    psBuf += d;
    let i;
    while ((i = psBuf.indexOf('\n')) >= 0) {
      const line = psBuf.slice(0, i).trim(); psBuf = psBuf.slice(i + 1);
      if (line.startsWith('@@')) { const cb = psWait.shift(); if (cb) cb(Buffer.from(line.slice(2), 'base64').toString('utf8').trim() || 'ERR:'); }
    }
  });
  const dead = () => { psProc = null; psWait.splice(0).forEach((cb) => cb('ERR:Cầu nối với Word/PowerPoint bị ngắt')); };
  psProc.on('exit', dead); psProc.on('error', dead);
}
function runOffice(env) {
  startBridge();
  return new Promise((resolve) => {
    psWait.push(resolve);
    try { psProc.stdin.write(Buffer.from(JSON.stringify(env), 'utf8').toString('base64') + '\n'); } catch (e) { psWait.pop(); resolve('ERR:' + e.message); }
  });
}
app.on('will-quit', () => { try { if (psProc) psProc.kill(); } catch (e) { /* đã thoát */ } });
` + s.slice(b);
}
f.rep("  if (office) win.webContents.once('did-finish-load', () => {", "  if (office) startBridge(); // khởi động sẵn để lần chèn đầu tiên không phải chờ\n  if (office) win.webContents.once('did-finish-load', () => {");
f.rep("return { i: +p[0], size: parseFloat(p[1]) || 0, data: p[2] }; });", "return { i: +p[0], size: parseFloat(p[1]) || 0, data: p[2], end: p[3] !== undefined ? +p[3] : undefined }; });");
f.rep("      j.tmp = j.png;\n      return [j.i, j.png, j.w, j.h, j.pos, j.alt].join('|');", "      if (opts.op === 'tv2tex') return j.i + '|' + Buffer.from(j.text, 'utf8').toString('base64');\n      j.tmp = j.png;\n      return [j.i, j.png, j.w, j.h, j.pos, j.alt, j.end === undefined ? '' : j.end].join('|');");
// chèn: ẩn cửa sổ ngay sau khi chụp ảnh để người dùng trở lại Word tức thì; lỗi thì hiện lại
f.rep("  const out = await runOffice({ TVS_ACT: 'insert', TVS_APP: opts.app,", "  const hideNow = !!office && !!opts.quick && win && !shotArg;\n  if (hideNow) win.hide();\n  const out = await runOffice({ TVS_ACT: 'insert', TVS_APP: opts.app,");
f.rep("  if (out.startsWith('OK')) return { ok: true, replaced: out === 'OK:1' };\n  return { ok: false, error: out === 'ERR:NOAPP' ? 'Chưa mở tài liệu ' + name", "  if (out.startsWith('OK')) return { ok: true, replaced: out === 'OK:1' };\n  if (hideNow) { win.show(); win.focus(); }\n  return { ok: false, error: out === 'ERR:NOAPP' ? 'Chưa mở tài liệu ' + name");
f.save();

// ---------------- app.js ----------------
f = mk('src/app.js');
f.rep("data: btoa(bin), source: (OFFICE && OFFICE.source) || '' });", "data: btoa(bin), source: (OFFICE && OFFICE.source) || '', quick: !!(OFFICE && OFFICE.quitAfter) });");
f.rep(`  async function officeInsertAndQuit() {
    if (!cur()) return msg('Hãy chọn (nhấp vào) đối tượng cần chèn vào ' + officeName(), true);
    await toOffice(OFFICE.app);`, `  async function officeInsertAndQuit() {
    if (!cur()) return msg('Hãy chọn (nhấp vào) đối tượng cần chèn vào ' + officeName(), true);
    OFFICE.quitAfter = true; // cho phép ẩn cửa sổ ngay khi đã có ảnh, không chờ Word chèn xong
    await toOffice(OFFICE.app);
    OFFICE.quitAfter = false;`);
f.rep("    tv2mt: { kind: 'tvs', from: 'ToanViet', to: 'MathType' },", "    tv2mt: { kind: 'tvs', from: 'ToanViet', to: 'MathType' },\n    tex2tv: { kind: 'latex', from: 'mã LaTeX', to: 'ToanViet' },\n    tv2tex: { kind: 'tvs', from: 'ToanViet', to: 'mã LaTeX' },");
f.rep("        if (OFFICE.op === 'mt2tv' || OFFICE.op === 'eq2tv') {\n          const raw = b64ToBytes(it.data);\n          const latex = OFFICE.op === 'mt2tv' ? MTEF.oleToLatex(raw) : OMML.toLatex(new TextDecoder().decode(raw));",
  "        if (OFFICE.op === 'tv2tex') {\n          jobs.push({ i: it.i, text: '$' + multiline(it.obj.latex).replace(/\\\\dongdang(?![a-zA-Z])/g, '\\\\backsim').replace(/\\s+/g, ' ').trim() + '$' });\n        } else if (OFFICE.op === 'mt2tv' || OFFICE.op === 'eq2tv' || OFFICE.op === 'tex2tv') {\n          const raw = b64ToBytes(it.data);\n          const latex = OFFICE.op === 'mt2tv' ? MTEF.oleToLatex(raw) : OFFICE.op === 'eq2tv' ? OMML.toLatex(new TextDecoder().decode(raw)) : cleanLatex(new TextDecoder().decode(raw));");
f.rep("          const o = { id: 'c' + k, type: 'formula', x: 60, y: 50, latex, size: it.size >= 5 && it.size <= 200 ? toPx(it.size) : 16, color: '#000000' };",
  "          const o = { id: 'c' + k, type: 'formula', x: 60, y: 50, latex, size: it.size >= 5 && it.size <= 200 ? toPx(it.size) : 16, color: '#000000' };\n          if (tex(texOf(o)).includes('ML__error')) throw new Error('mã LaTeX không hợp lệ');");
f.rep("jobs.push({ i: it.i, png: r.file, w: r.w, h: r.h, pos: r.depthPt, alt: objToB64(o) });", "jobs.push({ i: it.i, end: it.end, png: r.file, w: r.w, h: r.h, pos: r.depthPt, alt: objToB64(o) });");
f.rep("  // ToanViet -> MathType: sẽ được nạp từ mtef-write.js nếu có", `  // Dọn mã LaTeX lấy từ các trợ lí AI cho hợp với ô soạn ToanViet
  function cleanLatex(t) {
    let s = String(t).replace(/[\\r\\n\\u000b\\u00a0]+/g, ' ').replace(/\\\\(tag|label)\\{[^{}]*\\}/g, '').replace(/\\\\(nonumber|notag|displaystyle)\\b/g, '').trim();
    s = s.replace(/\\\\begin\\{(equation|gather|displaymath)\\*?\\}|\\\\end\\{(equation|gather|displaymath)\\*?\\}/g, '').replace(/\\\\(begin|end)\\{(align|alignat|flalign|eqnarray|split)\\*?\\}/g, '\\\\$1{aligned}').trim();
    // nhiều dòng nối bằng \\\\ mà không nằm trong môi trường nào: đưa về công thức nhiều dòng của ToanViet
    if (/\\\\\\\\/.test(s) && !/\\\\begin\\{/.test(s)) s = '\\\\displaylines{' + s + '}';
    return s;
  }
  // ToanViet -> MathType: sẽ được nạp từ mtef-write.js nếu có`);
f.save();

// ---------------- add-in COM: thêm hai nút LaTeX ----------------
f = mk('office-addin/ToanVietAddin.cs');
f.rep('                "</group>";\n            return "<customUI', `                "<button id=\\"tvTex2Tv\\" label=\\"LaTeX → ToanViet\\" imageMso=\\"EquationInsertGallery\\" onAction=\\"OnTex2Tv\\" screentip=\\"Chuyển mã LaTeX trong tài liệu sang công thức ToanViet\\" supertip=\\"Dành cho nội dung dán từ các trợ lí AI: mọi đoạn $...$, $$...$$, \\\\(...\\\\), \\\\[...\\\\] được thay bằng công thức ToanViet. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "<button id=\\"tvTv2Tex\\" label=\\"ToanViet → LaTeX\\" imageMso=\\"EquationOptions\\" onAction=\\"OnTv2Tex\\" screentip=\\"Chuyển toàn bộ công thức ToanViet thành mã LaTeX\\" supertip=\\"Thay mọi công thức ToanViet trong tài liệu bằng mã LaTeX đặt giữa hai dấu $. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "</group>";
            return "<customUI`);
f.rep('        public void OnTv2Eq(object control) { Launch("convert", " --op=tv2eq"); }', '        public void OnTv2Eq(object control) { Launch("convert", " --op=tv2eq"); }\n        public void OnTex2Tv(object control) { Launch("convert", " --op=tex2tv"); }\n        public void OnTv2Tex(object control) { Launch("convert", " --op=tv2tex"); }');
f.save();

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '2.0.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v2.0 patched');
