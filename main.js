const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage, Menu } = require('electron');
const fs = require('fs');
const path = require('path');

let win;
const shotArg = process.argv.find((a) => a.startsWith('--shot='));
// Chế độ gọi từ add-in Word/PowerPoint: --office=word|ppt --mode=new|edit|full
const argVal = (name) => { const a = process.argv.find((t) => t.startsWith(name + '=')); return a ? a.slice(name.length + 1) : ''; };
const office = /^(word|ppt)$/.test(argVal('--office')) ? { app: argVal('--office'), mode: /^(new|edit|full|convert)$/.test(argVal('--mode')) ? argVal('--mode') : 'new', op: /^(mt2tv|tv2mt|eq2tv|tv2eq|tex2tv|tv2tex)$/.test(argVal('--op')) ? argVal('--op') : '' } : null;

function createWindow() {
  win = new BrowserWindow({
    width: office && office.mode !== 'full' ? 1080 : 1400, height: office && office.mode !== 'full' ? 760 : 900, minWidth: 980, minHeight: 600,
    title: 'ToanViet Studio',
    show: true,
    webPreferences: { additionalArguments: office ? ['--tvs-office=' + office.app, '--tvs-mode=' + office.mode, '--tvs-size=' + (parseFloat(argVal('--size')) || 0), '--tvs-op=' + office.op] : [], preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // mở từ Word/PowerPoint: đưa cửa sổ lên trước để gõ được ngay
  if (office) startBridge(); // khởi động sẵn để lần chèn đầu tiên không phải chờ
  if (office) win.webContents.once('did-finish-load', () => { win.show(); win.focus(); app.focus({ steal: true }); win.webContents.focus(); });
  // mở tệp .tvs khi nhấp đúp trong Explorer
  const fileArg = process.argv.slice(1).find((a) => /\.tvs$/i.test(a) && fs.existsSync(a));
  if (fileArg) win.webContents.once('did-finish-load', () => win.webContents.send('openfile', { file: fileArg, data: fs.readFileSync(fileArg, 'utf8') }));
  const send = (cmd) => () => win.webContents.send('menu', cmd);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Tệp', submenu: [
      { label: 'Mới', accelerator: 'Ctrl+N', click: send('new') },
      { label: 'Mở…', accelerator: 'Ctrl+O', click: send('open') },
      { label: 'Lưu', accelerator: 'Ctrl+S', click: send('save') },
      { label: 'Lưu thành…', accelerator: 'Ctrl+Shift+S', click: send('saveas') },
      { type: 'separator' },
      { label: 'Xuất ảnh PNG…', accelerator: 'Ctrl+E', click: send('png') },
      { label: 'Xuất PDF…', accelerator: 'Ctrl+P', click: send('pdf') },
      { type: 'separator' },
      { label: 'Tài liệu mẫu', click: send('demo') },
      { type: 'separator' },
      { label: 'Thoát', accelerator: 'Ctrl+Q', role: 'quit' },
    ] },
    { label: 'Sửa', submenu: [
      { label: 'Hoàn tác', accelerator: 'Ctrl+Z', click: send('undo') },
      { label: 'Làm lại', accelerator: 'Ctrl+Y', click: send('redo') },
    ] },
    { label: 'Xem', submenu: [
      { label: 'Phóng to', accelerator: 'Ctrl+=', click: send('zoomin') },
      { label: 'Thu nhỏ', accelerator: 'Ctrl+-', click: send('zoomout') },
      { label: '100%', accelerator: 'Ctrl+0', click: send('zoom100') },
      { type: 'separator' },
      { label: 'Toàn màn hình', role: 'togglefullscreen' },
      { label: 'Công cụ lập trình', role: 'toggleDevTools' },
    ] },
    { label: 'Trợ giúp', submenu: [
      { label: 'Hướng dẫn sử dụng (PDF)', accelerator: 'F1', click: () => showGuide('Huong-dan-su-dung-ToanViet-Studio.pdf') },
      { label: 'Hướng dẫn lập kịch bản vẽ hình (PDF)', accelerator: 'Shift+F1', click: () => showGuide('Huong-dan-lap-kich-ban-ve-hinh.pdf') },
      { label: 'Giới thiệu ToanViet Studio', click: showAbout },
    ] },
  ]));

  if (shotArg) {
    win.webContents.on('console-message', (_e, _l, msg) => console.log('[renderer]', msg));
    win.webContents.once('did-finish-load', async () => {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        if (!office) await win.webContents.executeJavaScript('window.__demo()');
        await new Promise((r) => setTimeout(r, 800));
        const buf = await capture(win.webContents, 'page', 1.5);
        fs.writeFileSync(shotArg.slice(7), buf);
        const ev = process.argv.find((a) => a.startsWith('--eval='));
        if (ev) { await win.webContents.executeJavaScript(ev.slice(7)); await new Promise((r) => setTimeout(r, 1200)); }
        fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '.pdf'), await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'none' } }));
        if (process.env.TVS_SHOT_PAGE) fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '-after.png'), await capture(win.webContents, 'page', 1.5));
        const ui = await win.webContents.capturePage();
        fs.writeFileSync(shotArg.slice(7).replace(/\.png$/, '-ui.png'), ui.toPNG());
      } catch (e) { console.log('SHOT ERROR', e); }
      app.quit();
    });
  }
}

// Mở tệp PDF hướng dẫn bằng trình xem PDF mặc định của máy
function showGuide(name) {
  const file = [path.join(process.resourcesPath || '', 'huong-dan', name), path.join(__dirname, 'huong-dan', name)].find((f) => fs.existsSync(f));
  if (file) require('electron').shell.openPath(file);
  else dialog.showMessageBox(win, { type: 'info', title: 'Hướng dẫn sử dụng', message: 'Không tìm thấy tệp hướng dẫn.', buttons: ['Đóng'] });
}

function showAbout() {
  dialog.showMessageBox(win, {
    type: 'info', title: 'Giới thiệu', buttons: ['Đóng'],
    message: 'ToanViet Studio ' + app.getVersion(),
    detail: 'Soạn công thức Toán, đồ thị, bảng biến thiên, miền nghiệm và hình không gian cho chương trình Toán phổ thông Việt Nam.\n\n' +
      'Thiết kế bởi: Thầy Hoàng Ngọc Cảnh\nGiáo viên trường THCS - THPT Đinh Thiện Lý\nEmail: canhld@gmail.com\n\n© 2026 Hoàng Ngọc Cảnh. Bảo lưu mọi quyền.',
  });
}
ipcMain.on('about', showAbout);

// Chụp một đối tượng (hoặc cả trang) thành PNG độ phân giải cao
async function capture(wc, target, scale) {
  const dbg = wc.debugger;
  const fresh = !dbg.isAttached();
  if (fresh) dbg.attach('1.3');
  try {
    if (fresh) await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: 1900, height: 2600, deviceScaleFactor: 1, mobile: false });
    const rect = await wc.executeJavaScript(`window.__prepCapture(${JSON.stringify(target)})`);
    if (!rect) throw new Error('Không có gì để xuất');
    capture.depthPt = rect.depthPt || 0;
    const res = await dbg.sendCommand('Page.captureScreenshot', { format: 'png', clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale } });
    return Buffer.from(res.data, 'base64');
  } finally {
    try { await wc.executeJavaScript('window.__endCapture()'); } catch (e) { /* cửa sổ đã đóng */ }
    if (!capture.keep) {
      try { await dbg.sendCommand('Emulation.clearDeviceMetricsOverride'); } catch (e) { /* bỏ qua */ }
      try { dbg.detach(); } catch (e) { /* đã tách */ }
    }
  }
}

ipcMain.handle('capture', async (e, { target, mode, name }) => {
  const buf = await capture(e.sender, target, mode === 'clipboard' ? 2 : 3);
  if (mode === 'clipboard') { clipboard.writeImage(nativeImage.createFromBuffer(buf)); return true; }
  const r = await dialog.showSaveDialog(win, { title: 'Xuất ảnh PNG', defaultPath: (name || 'hinh') + '.png', filters: [{ name: 'Ảnh PNG', extensions: ['png'] }] });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});
ipcMain.handle('pdf', async (e) => {
  const r = await dialog.showSaveDialog(win, { title: 'Xuất PDF', defaultPath: 'tai-lieu.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled) return false;
  const buf = await e.sender.printToPDF({ pageSize: 'A4', printBackground: true, margins: { marginType: 'none' } });
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});
ipcMain.handle('save', async (_e, { data, file }) => {
  if (!file) {
    const r = await dialog.showSaveDialog(win, { title: 'Lưu tài liệu', defaultPath: 'tai-lieu.tvs', filters: [{ name: 'ToanViet Studio', extensions: ['tvs'] }] });
    if (r.canceled) return null;
    file = r.filePath;
  }
  fs.writeFileSync(file, data, 'utf8');
  return file;
});
ipcMain.handle('open', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Mở tài liệu', properties: ['openFile'], filters: [{ name: 'ToanViet Studio', extensions: ['tvs', 'json'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  return { file: r.filePaths[0], data: fs.readFileSync(r.filePaths[0], 'utf8') };
});
ipcMain.handle('copyText', (_e, t) => { clipboard.writeText(String(t)); return true; });
ipcMain.handle('confirm', async (_e, msg) => {
  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'CONFIRM: ' + String(msg).replace(/\n+/g, ' / ') + '\n'); return true; }
  const r = await dialog.showMessageBox(win, { type: 'question', buttons: ['Đồng ý', 'Huỷ'], defaultId: 0, cancelId: 1, message: msg });
  return r.response === 0;
});
// ---------- Cầu nối Word / PowerPoint (COM): chèn hình kèm dữ liệu để lấy về sửa lại ----------
const OFFICE_PS = String.raw`
$ErrorActionPreference = 'Stop'
function GetApp($n) { try { [Runtime.InteropServices.Marshal]::GetActiveObject($n) } catch { $null } }
try {
  $act = $env:TVS_ACT; $appn = $env:TVS_APP; $png = $env:TVS_PNG; $alt = $env:TVS_ALT
  if ($act -eq 'scan') {
    # liệt kê mọi công thức một loại trong tài liệu Word đang mở: ole = MathType, omath = Equation, tvs = ToanViet
    $a = GetApp 'Word.Application'
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $kind = $env:TVS_KIND; $sb = New-Object Text.StringBuilder; $n = 0
    if ($kind -eq 'latex') {
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
    } elseif ($kind -eq 'omath') {
      for ($i = 1; $i -le $doc.OMaths.Count; $i++) {
        try {
          $om = $doc.OMaths.Item($i); $x = $om.Range.WordOpenXML; $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $fs = 0; try { $fs = [double]$om.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value))); $n++ }
        } catch {}
      }
    } else {
      for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
        try {
          $s = $doc.InlineShapes.Item($i); $al = "$($s.AlternativeText)"
          if ($kind -eq 'tvs') { if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine("$i|0|" + $al.Substring(5)); $n++ } }
          elseif (-not $al.StartsWith('TVS1:')) {
            $pg = ''; try { $pg = "$($s.OLEFormat.ProgID)" } catch {}
            if ($pg -like 'Equation*') {
              $x = $s.Range.WordOpenXML; $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
              if ($mb.Success) { $fs = 0; try { $fs = [double]$s.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + ($mb.Groups[1].Value -replace '\s', '')); $n++ }
            }
          }
        } catch {}
      }
    }
    [IO.File]::WriteAllText($env:TVS_OUT, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
    "OK:$n"
  } elseif ($act -eq 'apply') {
    # thực hiện chuyển đổi theo tệp việc (mỗi dòng một công thức, chỉ số giảm dần để không lệch thứ tự)
    $a = GetApp 'Word.Application'
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $op = $env:TVS_OP; $n = 0; $xsl = $null
    if ($op -eq 'tv2eq') { $xsl = New-Object System.Xml.Xsl.XslCompiledTransform; $xsl.Load((Join-Path $a.Path 'MML2OMML.XSL')) }
    $pkgA = '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage"><pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part><pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p>'
    $pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
    $ur = $null; try { $ur = $a.UndoRecord; $ur.StartCustomRecord('ToanViet') } catch {}
    $a.ScreenUpdating = $false
    # tắt "cắt dán thông minh" trong lúc thay thế để Word không tự xoá dấu cách cạnh công thức
    $scp = $true; try { $scp = $a.Options.SmartCutPaste; $a.Options.SmartCutPaste = $false } catch {}
    try {
      foreach ($line in [IO.File]::ReadAllLines($env:TVS_JOB, [Text.Encoding]::UTF8)) {
        if (-not $line) { continue }
        $f = $line.Split('|'); $i = [int]$f[0]
        try {
          if ($op -eq 'mt2tv') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete()
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'eq2tv') {
            $om = $doc.OMaths.Item($i); $rg = $om.Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection; [void]$sel.MoveRight(1, 1)
            $p = $sel.InlineShapes.AddPicture($f[1], $false, $true)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]
            $doc.OMaths.Item($i).Range.Delete() | Out-Null; $n++
          } elseif ($op -eq 'tv2eq') {
            $mml = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))
            $sw = New-Object IO.StringWriter; $st = New-Object Xml.XmlWriterSettings; $st.OmitXmlDeclaration = $true; $st.ConformanceLevel = 'Fragment'
            $xw = [Xml.XmlWriter]::Create($sw, $st); $xsl.Transform([Xml.XmlReader]::Create((New-Object IO.StringReader $mml)), $xw); $xw.Flush()
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML($pkgA + $sw.ToString() + $pkgB); $n++
          } elseif ($op -eq 'tex2tv') {
            # $f: đầu | ảnh | rộng | cao | hạ dòng | dữ liệu | cuối  (thay đoạn mã LaTeX bằng công thức ToanViet)
            $r = $doc.Range($i, [int]$f[6]); $r.Delete() | Out-Null
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'tv2tex') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertAfter([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))); $n++
          } elseif ($op -eq 'tv2mt') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML([IO.File]::ReadAllText($f[1], [Text.Encoding]::UTF8)); $n++
          }
        } catch {}
      }
    } finally { $a.ScreenUpdating = $true; try { $a.Options.SmartCutPaste = $scp } catch {}; try { if ($ur) { $ur.EndCustomRecord() } } catch {} }
    "OK:$n"
  } elseif ($act -eq 'insert') {
    $w = [double]$env:TVS_W; $h = [double]$env:TVS_H
    if ($appn -eq 'word') {
      $a = GetApp 'Word.Application'
      if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
      $sel = $a.Selection; $rep = 0
      $omOld = $null
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
      if ($sel.InlineShapes.Count -eq 1 -and "$($sel.InlineShapes.Item(1).AlternativeText)".StartsWith('TVS1:')) { $sel.InlineShapes.Item(1).Delete(); $rep = 1 }
      $p = $sel.InlineShapes.AddPicture($png, $false, $true)
      $p.LockAspectRatio = 0; $p.Width = $w; $p.Height = $h; $p.LockAspectRatio = -1
      $p.AlternativeText = $alt
      # hạ công thức xuống để đường chân chữ của nó trùng với dòng văn bản; chữ gõ tiếp theo trở lại bình thường
      try { $p.Range.Font.Position = -[int]$env:TVS_POS; $sel.Font.Position = 0 } catch {}
      if ($omOld) { try { $omOld.Range.Delete() | Out-Null; $rep = 1 } catch {} }
      try { $a.Activate() } catch {}
      "OK:$rep"
    } else {
      $a = GetApp 'PowerPoint.Application'
      if (-not $a -or $a.Presentations.Count -eq 0) { 'ERR:NOAPP'; exit }
      $win = $a.ActiveWindow; $slide = $win.View.Slide; $left = $null; $rep = 0
      try { if ($win.Selection.Type -eq 2) { $s = $win.Selection.ShapeRange.Item(1); if ("$($s.AlternativeText)".StartsWith('TVS1:')) { $left = $s.Left; $top = $s.Top; $s.Delete(); $rep = 1 } } } catch {}
      if ($null -eq $left) { $ps = $a.ActivePresentation.PageSetup; $left = ($ps.SlideWidth - $w) / 2; $top = ($ps.SlideHeight - $h) / 2 }
      $s = $slide.Shapes.AddPicture($png, 0, -1, $left, $top, $w, $h)
      $s.AlternativeText = $alt; $s.Select()
      try { $a.Activate() } catch {}
      "OK:$rep"
    }
  } else {
    $r = ''; $from = 'Word'
    $a = $null; if ($appn -ne 'ppt') { $a = GetApp 'Word.Application' }
    $kind = ''; $payload = 'x'
    if ($a -and $a.Documents.Count -gt 0) {
      try {
        $sel = $a.Selection
        if ($sel.InlineShapes.Count -ge 1) {
          $ish = $sel.InlineShapes.Item(1); $r = "$($ish.AlternativeText)"
          if (-not $r.StartsWith('TVS1:')) { $pg = ''; try { $pg = "$($ish.OLEFormat.ProgID)" } catch {}; if ($pg -like 'Equation*') {
            $kind = 'MathType'
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $payload = ($mb.Groups[1].Value -replace '\s', '') }
          } }
        }
        if (-not $r.StartsWith('TVS1:') -and -not $kind -and $sel.OMaths.Count -ge 1) {
          $x = $sel.OMaths.Item(1).Range.WordOpenXML
          $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $kind = 'WordEq'; $payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value)) }
        }
      } catch {}
    }
    if ($kind) { "OK:$kind" + ':' + $payload; exit }
    if (-not $r.StartsWith('TVS1:') -and $appn -ne 'word') {
      $from = 'PPT'
      $a = GetApp 'PowerPoint.Application'
      if ($a -and $a.Presentations.Count -gt 0) { try { $w2 = $a.ActiveWindow; if ($w2.Selection.Type -eq 2) { $r = "$($w2.Selection.ShapeRange.Item(1).AlternativeText)" } } catch {} }
    }
    if ($r.StartsWith('TVS1:')) { "OK:$from" + ':' + $r.Substring(5) } else { 'ERR:NOSEL' }
  }
} catch { 'ERR:' + $_.Exception.Message }
`;
// PowerShell được mở một lần và chờ lệnh qua stdin (mỗi lệnh là một dòng JSON mã hoá base64), trả kết quả "@@<base64>"
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
// dựng ảnh PNG của một đối tượng ra tệp tạm (dùng khi chuyển đổi hàng loạt)
ipcMain.handle('renderPng', async (e, target, withData) => {
  const scale = 4;
  capture.keep = true; // đang chuyển đổi hàng loạt
  const buf = await capture(e.sender, target, scale);
  const size = nativeImage.createFromBuffer(buf).getSize();
  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.png');
  fs.writeFileSync(file, buf);
  const res = { file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: capture.depthPt || 0 };
  if (withData) { res.b64 = buf.toString('base64'); fs.unlink(file, () => {}); }
  return res;
});
ipcMain.handle('office', async (e, opts) => {
  const name = opts.app === 'ppt' ? 'PowerPoint' : 'Word';
  const noApp = 'Chưa mở tài liệu Word nào.';
  if (opts.action === 'scan') {
    const outFile = path.join(app.getPath('temp'), 'toanviet-scan-' + Date.now() + '.txt');
    const out = await runOffice({ TVS_ACT: 'scan', TVS_KIND: opts.kind, TVS_OUT: outFile });
    if (!out.startsWith('OK')) return { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
    const items = fs.readFileSync(outFile, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => { const p = l.split('|'); return { i: +p[0], size: parseFloat(p[1]) || 0, data: p[2], end: p[3] !== undefined ? +p[3] : undefined }; });
    fs.unlink(outFile, () => {});
    return { ok: true, items };
  }
  if (opts.action === 'apply') {
    if (capture.keep) { capture.keep = false; try { if (e.sender.debugger.isAttached()) { await e.sender.debugger.sendCommand('Emulation.clearDeviceMetricsOverride'); e.sender.debugger.detach(); } } catch (err) { /* bỏ qua */ } }
    const dir = app.getPath('temp');
    const lines = opts.jobs.map((j, k) => {
      if (opts.op === 'tv2eq') return j.i + '|' + Buffer.from(j.mathml, 'utf8').toString('base64');
      if (opts.op === 'tv2mt') { const xf = path.join(dir, 'toanviet-mt-' + Date.now() + '-' + k + '.xml'); fs.writeFileSync(xf, j.xml, 'utf8'); j.tmp = xf; return j.i + '|' + xf; }
      if (opts.op === 'tv2tex') return j.i + '|' + Buffer.from(j.text, 'utf8').toString('base64');
      j.tmp = j.png;
      return [j.i, j.png, j.w, j.h, j.pos, j.alt, j.end === undefined ? '' : j.end].join('|');
    });
    const jobFile = path.join(dir, 'toanviet-job-' + Date.now() + '.txt');
    fs.writeFileSync(jobFile, lines.join('\r\n'), 'utf8');
    const out = await runOffice({ TVS_ACT: 'apply', TVS_OP: opts.op, TVS_JOB: jobFile });
    fs.unlink(jobFile, () => {});
    opts.jobs.forEach((j) => { if (j.tmp) fs.unlink(j.tmp, () => {}); });
    const m = out.match(/^OK:(\d+)$/);
    return m ? { ok: true, count: +m[1] } : { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
  }
  if (opts.action === 'read') {
    const out = await runOffice({ TVS_ACT: 'read', TVS_APP: opts.app || '' });
    const m = out.match(/^OK:(Word|PPT|WordEq|MathType):(.+)$/);
    if (m) return { ok: true, from: m[1], data: m[2] };
    return { ok: false, error: out === 'ERR:NOSEL' ? 'Hãy chọn (nhấp vào) một hình ToanViet trong Word hoặc PowerPoint trước' : 'Lỗi: ' + out.slice(4) };
  }
  const scale = 4;
  const buf = await capture(e.sender, opts.target, scale);
  const size = nativeImage.createFromBuffer(buf).getSize();
  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '.png');
  fs.writeFileSync(file, buf);
  // kiểm thử: chỉ xuất ảnh và độ hạ dòng ra tệp, không đụng tới Word / PowerPoint
  if (process.env.TVS_DEBUG_PNG) { fs.copyFileSync(file, process.env.TVS_DEBUG_PNG); fs.writeFileSync(process.env.TVS_DEBUG_PNG + '.txt', size.width + ' ' + size.height + ' ' + (capture.depthPt || 0)); return { ok: true, replaced: false }; }
  const k = (opts.app === 'ppt' ? 2 : 1) * 0.75 / scale; // px ảnh -> point; trên trang chiếu phóng gấp đôi
  const hideNow = !!office && !!opts.quick && win && !shotArg;
  if (hideNow) win.hide();
  const out = await runOffice({ TVS_ACT: 'insert', TVS_APP: opts.app, TVS_PNG: file, TVS_ALT: 'TVS1:' + opts.data, TVS_POS: String(capture.depthPt || 0), TVS_SRC: /^(ole|omath)$/.test(opts.source || '') ? opts.source : '', TVS_W: String(size.width * k), TVS_H: String(size.height * k) });
  fs.unlink(file, () => {});
  if (out.startsWith('OK')) return { ok: true, replaced: out === 'OK:1' };
  if (hideNow) { win.show(); win.focus(); }
  return { ok: false, error: out === 'ERR:NOAPP' ? 'Chưa mở tài liệu ' + name + ' nào. Hãy mở ' + name + ' và đặt con trỏ vào chỗ cần chèn.' : 'Lỗi ' + name + ': ' + out.slice(4) };
});
ipcMain.on('quit', () => app.quit());
ipcMain.handle('info', async (_e, msg) => {
  if (process.env.TVS_AUTO) { fs.appendFileSync(process.env.TVS_AUTO, 'INFO: ' + String(msg).replace(/\n+/g, ' / ') + '\n'); return true; } await dialog.showMessageBox(win, { type: 'info', buttons: ['Đóng'], message: String(msg) }); return true; });
ipcMain.on('title', (_e, t) => { if (win) win.setTitle(t); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
