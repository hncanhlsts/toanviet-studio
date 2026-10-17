function Invoke-Bridge {

$ErrorActionPreference = 'Stop'
function GetApp($n) { try { [Runtime.InteropServices.Marshal]::GetActiveObject($n) } catch { $null } }
# Tìm đúng Word / PowerPoint người dùng đang xem. GetActiveObject trả về phiên đăng kí ĐẦU TIÊN với Windows — có thể là
# một phiên chạy ngầm, không có cửa sổ (Word đóng chưa hết, phần mềm khác mở Word để xử lí tệp…): công thức sẽ bị chèn
# vào tài liệu vô hình đó. Vì vậy lấy đối tượng qua cửa sổ đang hiển thị: ưu tiên phiên đã mở ToanViet (TVS_WPID),
# rồi đến cửa sổ Word nằm trên cùng; không bao giờ chèn vào phiên ẩn.
$tvsWinCs = @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class TvsWin {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, EnumProc f, IntPtr l);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("oleacc.dll")] static extern int AccessibleObjectFromWindow(IntPtr h, uint id, ref Guid iid, [MarshalAs(UnmanagedType.IDispatch)] out object o);
  static string Cls(IntPtr h) { StringBuilder s = new StringBuilder(256); GetClassName(h, s, 256); return s.ToString(); }
  // cửa sổ khung (frame) hiển thị đầu tiên theo thứ tự trên-xuống, trong tiến trình pid (0: bất kì), lấy đối tượng Office của cửa sổ con
  public static object Find(string frame, string child, int pid) {
    object found = null;
    EnumWindows(delegate (IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h) || Cls(h) != frame) return true;
      uint p; GetWindowThreadProcessId(h, out p);
      if (pid > 0 && p != (uint)pid) return true;
      IntPtr c = IntPtr.Zero;
      EnumChildWindows(h, delegate (IntPtr hc, IntPtr l2) { if (Cls(hc) == child) { c = hc; return false; } return true; }, IntPtr.Zero);
      if (c == IntPtr.Zero) return true;
      Guid g = new Guid("00020400-0000-0000-C000-000000000046"); object o;
      if (AccessibleObjectFromWindow(c, 0xFFFFFFF0, ref g, out o) == 0 && o != null) { found = o; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
'@
function WinApp($frame, $child) {
  if (-not ('TvsWin' -as [type])) { try { Add-Type -TypeDefinition $tvsWinCs -ErrorAction Stop } catch { return $null } }
  $pid0 = 0; [void][int]::TryParse("$env:TVS_WPID", [ref]$pid0)
  foreach ($q in @($pid0, 0)) {
    if ($q -lt 0) { continue }
    try { $w = [TvsWin]::Find($frame, $child, $q); if ($w) { return $w.Application } } catch {}
    if ($pid0 -eq 0) { break }
  }
  $null
}
# Word đang hiển thị (không có thì thử GetActiveObject; phiên tìm được mà không hiển thị thì báo lỗi, không chèn)
function WordApp {
  $a = WinApp 'OpusApp' '_WwG'
  if (-not $a) { $a = GetApp 'Word.Application' }
  if ($a) { $v = $true; try { $v = [bool]$a.Visible } catch {}; if (-not $v) { throw 'TVSHIDDEN' } }
  $a
}
function PptApp {
  $a = WinApp 'PPTFrameClass' 'mdiClass'
  if (-not $a) { $a = GetApp 'PowerPoint.Application' }
  $a
}
$pkgA = '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage"><pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part><pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p>'
$pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
# dữ liệu ToanViet ghi trong ảnh PNG (khối tEXt "ToanViet") của một hình trong dòng
function PngTvs($shape) {
  try {
    $mb = [regex]::Match($shape.Range.WordOpenXML, '<pkg:part pkg:name="/word/media/[^"]+\.png"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
    if (-not $mb.Success) { return $null }
    $b = [Convert]::FromBase64String(($mb.Groups[1].Value -replace '\s', '')); $p = 8
    while ($p + 8 -le $b.Length) {
      $n = ([int]$b[$p] -shl 24) -bor ([int]$b[$p + 1] -shl 16) -bor ([int]$b[$p + 2] -shl 8) -bor [int]$b[$p + 3]
      $t = [Text.Encoding]::ASCII.GetString($b, $p + 4, 4)
      if ($t -eq 'tEXt') { $s = [Text.Encoding]::GetEncoding(28591).GetString($b, $p + 8, $n); if ($s.StartsWith('ToanViet' + [char]0)) { return $s.Substring(9) } }
      if ($t -eq 'IEND') { break }
      $p += 12 + $n
    }
  } catch {}
  $null
}
# MathML -> OMML bằng bộ chuyển của chính Word (nạp một lần)
function MmlToOmml($a, $mml) {
  if (-not $global:TvsXsl) { $global:TvsXsl = New-Object System.Xml.Xsl.XslCompiledTransform; $global:TvsXsl.Load((Join-Path $a.Path 'MML2OMML.XSL')) }
  $sw = New-Object IO.StringWriter; $st = New-Object Xml.XmlWriterSettings; $st.OmitXmlDeclaration = $true; $st.ConformanceLevel = 'Fragment'
  $xw = [Xml.XmlWriter]::Create($sw, $st); $global:TvsXsl.Transform([Xml.XmlReader]::Create((New-Object IO.StringReader $mml)), $xw); $xw.Flush()
  $sw.ToString()
}
try {
  $act = $env:TVS_ACT; $appn = $env:TVS_APP; $png = $env:TVS_PNG; $alt = $env:TVS_ALT
  $lm = "$($ExecutionContext.SessionState.LanguageMode)"
  if ($act -eq 'diag') {
    # Trợ giúp ▸ Kiểm tra kết nối: thông tin để tìm nguyên nhân khi không chèn được vào Word trên máy người dùng
    $o = @("PowerShell $($PSVersionTable.PSVersion) · chế độ ngôn ngữ: $lm · chính sách chạy script: $(try { Get-ExecutionPolicy } catch { '?' })")
    if ($lm -ne 'FullLanguage') { $o += 'LỖI: PowerShell bị giới hạn (Constrained Language Mode) — không điều khiển được Word.' }
    $okType = $false; try { [void](WinApp 'TvsKhongCo' 'TvsKhongCo'); $okType = [bool]('TvsWin' -as [type]) } catch {}
    $o += "Bộ tìm cửa sổ Office: $(if ($okType) { 'được' } else { 'KHÔNG nạp được (Add-Type bị chặn)' })"
    $w = $null; try { $w = WinApp 'OpusApp' '_WwG' } catch {}
    if ($w) { $o += "Word đang mở: $($w.Name) $($w.Version) (bản $($w.Build)) · tài liệu đang hoạt động: $(try { $w.ActiveDocument.Name } catch { '-' })" } else { $o += 'Word: không thấy cửa sổ Word nào đang mở tài liệu' }
    $g = GetApp 'Word.Application'
    if ($g) { $o += "Phiên Word đăng kí với Windows: $(if ($g.Visible) { 'đang hiển thị' } else { 'CHẠY NGẦM (không cửa sổ)' }), $($g.Documents.Count) tài liệu" }
    $pp = $null; try { $pp = WinApp 'PPTFrameClass' 'mdiClass' } catch {}
    $o += "PowerPoint: $(if ($pp) { "$($pp.Name) $($pp.Version)" } else { 'không thấy cửa sổ' })"
    'OK:' + ($o -join '|'); return
  }
  # PowerShell bị giới hạn (chính sách bảo mật / phần mềm quản lí máy): mọi lệnh điều khiển Office đều bị chặn
  if ($lm -ne 'FullLanguage') { 'ERR:TVSCLM'; return }
  if ($act -eq 'warm') {
    # nạp sẵn bộ tìm cửa sổ; mở từ Word thì xoá dòng "ToanViet Studio đang mở…" trên thanh trạng thái của Word
    [void](WinApp 'TvsKhongCo' 'TvsKhongCo')
    if ($appn -eq 'word' -and $env:TVS_WPID) { try { $a0 = WinApp 'OpusApp' '_WwG'; if ($a0) { $a0.StatusBar = $false } } catch {} }
    "OK:PowerShell $($PSVersionTable.PSVersion), $lm, bộ tìm cửa sổ $(if ('TvsWin' -as [type]) { 'đã nạp' } else { 'KHÔNG nạp được' })"; return
  }
  if ($act -eq 'scan') {
    # liệt kê mọi công thức một loại trong tài liệu Word đang mở: ole = MathType, omath = Equation, tvs = ToanViet
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; return }
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
          if ($kind -eq 'tvs') {
            if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine("$i|0|" + $al.Substring(5)); $n++ }
            elseif ($s.Type -eq 3) { $d0 = PngTvs $s; if ($d0) { [void]$sb.AppendLine("$i|0|" + $d0); $n++ } }
          }
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
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; return }
    $doc = $a.ActiveDocument; $op = $env:TVS_OP; $n = 0; $xsl = $null
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
            $om = MmlToOmml $a $mml
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML($pkgA + $om + $pkgB); $n++
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
  } elseif ($act -eq 'buildexam') {
    # dựng đề kiểm tra thành một tài liệu Word mới: chữ thường + công thức Equation, hình chèn sau theo chỗ đánh dấu
    $a = $null; try { $a = WordApp } catch {}
    if (-not $a) { $a = New-Object -ComObject Word.Application }
    $a.Visible = $true
    $job = [IO.File]::ReadAllText($env:TVS_JOB, [Text.Encoding]::UTF8) | ConvertFrom-Json
    $doc = $a.Documents.Add()
    $pg = $doc.PageSetup; $pg.TopMargin = 56.7; $pg.BottomMargin = 56.7; $pg.LeftMargin = 56.7; $pg.RightMargin = 56.7
    $st = $doc.Styles.Item(-1); $st.Font.Name = 'Times New Roman'; $st.Font.Size = 12
    $st.ParagraphFormat.SpaceBefore = 0; $st.ParagraphFormat.SpaceAfter = 0; $st.ParagraphFormat.LineSpacingRule = 0
    $sb = New-Object Text.StringBuilder; $np = 0
    foreach ($bk in $job.blocks) {
      $ppr = ''
      if ($bk.pageBreak) { $ppr += '<w:pageBreakBefore/>' }
      if ($bk.tabs) { $ppr += '<w:tabs>' + (($bk.tabs | ForEach-Object { '<w:tab w:val="left" w:pos="' + [int]$_ + '"/>' }) -join '') + '</w:tabs>' }
      $ppr += '<w:spacing w:before="' + ([int]$bk.before * 20) + '" w:after="' + ([int]$bk.after * 20) + '" w:line="276" w:lineRule="auto"/>'
      if ($bk.indent) { $ppr += '<w:ind w:left="' + [int]$bk.indent + '"/>' }
      if ($bk.align -eq 'center') { $ppr += '<w:jc w:val="center"/>' } elseif ($bk.justify) { $ppr += '<w:jc w:val="both"/>' }
      [void]$sb.Append('<w:p><w:pPr>' + $ppr + '</w:pPr>')
      foreach ($sg in $bk.segs) {
        if ($sg.m) { [void]$sb.Append((MmlToOmml $a ([string]$sg.m))); continue }
        $rpr = ''; if ($sg.b -or $bk.bold) { $rpr += '<w:b/>' }; if ($bk.italic) { $rpr += '<w:i/>' }
        $parts = ([string]$sg.t).Split([char]9)
        for ($i = 0; $i -lt $parts.Length; $i++) {
          if ($i -gt 0) { [void]$sb.Append('<w:r><w:rPr>' + $rpr + '</w:rPr><w:tab/></w:r>') }
          if ($parts[$i]) { [void]$sb.Append('<w:r><w:rPr>' + $rpr + '</w:rPr><w:t xml:space="preserve">' + [Security.SecurityElement]::Escape($parts[$i]) + '</w:t></w:r>') }
        }
      }
      [void]$sb.Append('</w:p>'); $np++
    }
    $head = $pkgA.Replace('<w:body><w:p>', '<w:body>'); $tail = $pkgB.Replace('</w:p></w:body>', '</w:body>')
    $doc.Content.InsertXML($head + $sb.ToString() + $tail)
    foreach ($im in $job.images) {
      $rg = $doc.Content
      if ($rg.Find.Execute([string]$im.key)) {
        $rg.Text = ''
        $p = $doc.InlineShapes.AddPicture([string]$im.file, $false, $true, $rg)
        $p.LockAspectRatio = 0; $p.Width = [double]$im.w; $p.Height = [double]$im.h; $p.LockAspectRatio = -1
      }
    }
    try { $doc.Range(0, 0).Select(); $a.Activate() } catch {}
    "OK:$np"
  } elseif ($act -eq 'inserteq') {
    # chèn công thức dạng Equation gốc của Word (OMML) tại con trỏ, hoặc thay cho công thức đang sửa
    $a = WordApp
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; return }
    $om = MmlToOmml $a ([IO.File]::ReadAllText($env:TVS_JOB, [Text.Encoding]::UTF8))
    $sel = $a.Selection; $rep = 0; $r = $null
    try {
      if ($env:TVS_SRC -eq 'omath' -and $sel.OMaths.Count -ge 1) { $r = $sel.OMaths.Item(1).Range; $rep = 1 }
      elseif ($sel.InlineShapes.Count -ge 1) {
        $s = $sel.InlineShapes.Item(1); $pg = ''; try { $pg = "$($s.OLEFormat.ProgID)" } catch {}
        if ($env:TVS_SRC -eq 'ole' -or "$($s.AlternativeText)".StartsWith('TVS1:') -or $pg -like 'Equation*') { $r = $s.Range; $s.Delete(); $r.Font.Position = 0; $rep = 1 }
      }
    } catch {}
    if (-not $r) { $r = $sel.Range }
    $doc = $a.ActiveDocument; $fs = 0; try { $fs = [double]$r.Font.Size } catch {}; if (-not ($fs -gt 0)) { try { $fs = [double]$sel.Font.Size } catch {} }
    $s0 = $r.Start; $len0 = $doc.Content.End
    $r.InsertXML($pkgA + $om + $pkgB)
    # công thức vừa chèn nằm từ s0 đến s0 + (độ dài tăng thêm): cho cùng cỡ chữ với dòng, rồi đưa con trỏ ra sau nó
    $e0 = $s0 + ($doc.Content.End - $len0); $nr = $doc.Range($s0, $e0)
    try { if ($fs -gt 0) { $nr.Font.Size = $fs } } catch {}
    # đưa con trỏ ra khỏi vùng công thức (giống cách chèn ảnh sau công thức Equation): đến cuối vùng rồi sang phải một lần
    try { if ($nr.OMaths.Count -ge 1) { $z = $nr.OMaths.Item($nr.OMaths.Count).Range; $z.Collapse(0); $z.Select(); [void]$a.Selection.MoveRight(1, 1) } else { $doc.Range($e0, $e0).Select() }; $a.Selection.Font.Position = 0 } catch {}
    try { $a.Activate() } catch {}
    "OK:$rep"
  } elseif ($act -eq 'insert') {    $w = [double]$env:TVS_W; $h = [double]$env:TVS_H
    if ($appn -eq 'word') {
      $a = WordApp
      if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; return }
      $sel = $a.Selection; $rep = 0
      $omOld = $null
      if ($env:TVS_SRC -eq 'ole' -or $env:TVS_SRC -eq 'img') {
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
      $a = PptApp
      if (-not $a -or $a.Presentations.Count -eq 0) { 'ERR:NOAPP'; return }
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
    $a = $null; if ($appn -eq 'word') { $a = WordApp } elseif ($appn -ne 'ppt') { try { $a = WordApp } catch { $a = $null } }
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
          } elseif ($ish.Type -eq 3) {
            # ảnh thường (không còn văn bản thay thế): gửi ảnh để tìm dữ liệu ToanViet ghi trong PNG
            $x = $ish.Range.WordOpenXML
            $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/media/[^"]+\.png"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
            if ($mb.Success) { $kind = 'Img'; $payload = ($mb.Groups[1].Value -replace '\s', '') }
          } }
        }
        if (-not $r.StartsWith('TVS1:') -and -not $kind -and $sel.OMaths.Count -ge 1) {
          $x = $sel.OMaths.Item(1).Range.WordOpenXML
          $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $kind = 'WordEq'; $payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value)) }
        }
      } catch {}
    }
    if ($kind) { "OK:$kind" + ':' + $payload; return }
    if (-not $r.StartsWith('TVS1:') -and $appn -ne 'word') {
      $from = 'PPT'
      $a = PptApp
      if ($a -and $a.Presentations.Count -gt 0) { try { $w2 = $a.ActiveWindow; if ($w2.Selection.Type -eq 2) { $r = "$($w2.Selection.ShapeRange.Item(1).AlternativeText)" } } catch {} }
    }
    if ($r.StartsWith('TVS1:')) { "OK:$from" + ':' + $r.Substring(5) } else { 'ERR:NOSEL' }
  }
} catch { 'ERR:' + $_.Exception.Message }

}
$keys = 'TVS_ACT','TVS_APP','TVS_PNG','TVS_ALT','TVS_W','TVS_H','TVS_POS','TVS_SRC','TVS_KIND','TVS_OUT','TVS_OP','TVS_JOB','TVS_WPID'
while ($true) {
  $line = [Console]::In.ReadLine(); if ($null -eq $line) { break }; if (-not $line) { continue }
  try { $j = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line)) | ConvertFrom-Json; foreach ($k in $keys) { Set-Item ('env:' + $k) ([string]$j.$k) }; $r = @(Invoke-Bridge) | Select-Object -Last 1 } catch { $r = 'ERR:' + $_.Exception.Message }
  [Console]::Out.WriteLine('@@' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes([string]$r))); [Console]::Out.Flush()
}