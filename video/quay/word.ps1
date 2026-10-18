# Quay các cảnh có Word thật cho video giới thiệu. Chỉ dùng tài liệu thử tự tạo trong thư mục tạm, không đụng tài liệu của người dùng;
# dừng ngay nếu đang có cửa sổ Word / PowerPoint mở.
#   powershell -File video\quay\word.ps1 -Canh c7   → chèn công thức từ Word, nhấp đúp sửa, chuyển Equation → ToanViet
#   powershell -File video\quay\word.ps1 -Canh c8   → mở tài liệu Bài giải AI vừa tạo (video\khung\bai-giai-ai.docx), cuộn xem
# Phần mềm được mở với ĐÚNG tham số add-in ToanViet truyền khi bấm nút / nhấp đúp (--office=word --mode=… --wpid=…),
# chạy ở chế độ kiểm thử để quay được cửa sổ. Ảnh cửa sổ Word: video\khung\<cảnh>-word (thanh tiêu đề không đưa vào video).
param([ValidateSet('c7', 'c8')][string]$Canh = 'c7')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\..\build\kiem-tra-word\chung.ps1')
$vis = @(Get-Process WINWORD, POWERPNT -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 })
if ($vis.Count) { 'Đang có cửa sổ Word / PowerPoint mở — hãy đóng rồi chạy lại.'; exit 2 }

$code = @'
using System; using System.Runtime.InteropServices; using System.Drawing;
public static class Cap {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  public struct RECT { public int L, T, R, B; }
  public static int[] Rect(IntPtr h) { RECT r; GetWindowRect(h, out r); return new int[] { r.L, r.T, r.R, r.B }; }
  public static Bitmap Shot(IntPtr h) { RECT r; GetWindowRect(h, out r); Bitmap b = new Bitmap(r.R - r.L, r.B - r.T); using (Graphics g = Graphics.FromImage(b)) { IntPtr dc = g.GetHdc(); PrintWindow(h, dc, 2); g.ReleaseHdc(dc); } return b; }
}
'@
Add-Type -AssemblyName System.Drawing, UIAutomationClient, UIAutomationTypes, Microsoft.VisualBasic
Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
[void][Cap]::SetProcessDPIAware()

$out = Join-Path $proj "video\khung\$Canh-word"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force $out | Out-Null
$evf = Join-Path $out 'su-kien.txt'
function Now { [DateTimeOffset]::Now.ToUnixTimeMilliseconds() }
function Ev([hashtable]$h) { $h.t = Now; [IO.File]::AppendAllText($evf, ($h | ConvertTo-Json -Compress) + "`n") }
function Mark($n) { Ev @{ k = 'mark'; name = $n }; "   mốc $n" }
$script:cx = 1500; $script:cy = 900
function MoveTo($x, $y, $ms = 700) {
  $n = [Math]::Max(2, [int]($ms / 30)); $x0 = $script:cx; $y0 = $script:cy
  for ($i = 1; $i -le $n; $i++) {
    $k = $i / $n; $e = if ($k -lt 0.5) { 2 * $k * $k } else { 1 - [Math]::Pow(-2 * $k + 2, 2) / 2 }
    $script:cx = $x0 + ($x - $x0) * $e; $script:cy = $y0 + ($y - $y0) * $e
    Ev @{ k = 'cur'; x = [int]$script:cx; y = [int]$script:cy }; Start-Sleep -Milliseconds 30
  }
}
function Press($x, $y, $times = 1) { for ($i = 0; $i -lt $times; $i++) { Ev @{ k = 'cur'; x = [int]$x; y = [int]$y; down = $true }; Start-Sleep -Milliseconds 120; Ev @{ k = 'cur'; x = [int]$x; y = [int]$y }; Start-Sleep -Milliseconds 90 } }
function HideCur { Ev @{ k = 'cur'; x = [int]$script:cx; y = [int]$script:cy; show = $false } }
$A = [Windows.Automation.AutomationElement]
function FindEl($root, $name, $type) {
  $c = New-Object Windows.Automation.AndCondition (New-Object Windows.Automation.PropertyCondition($A::ControlTypeProperty, $type)), (New-Object Windows.Automation.PropertyCondition($A::NameProperty, $name))
  $root.FindFirst([Windows.Automation.TreeScope]::Descendants, $c)
}
# tâm phần tử, tính theo ảnh chụp cửa sổ
function Center($el) { $b = $el.Current.BoundingRectangle; $wr = [Cap]::Rect($script:hw); @(($b.X + $b.Width / 2 - $wr[0]), ($b.Y + $b.Height / 2 - $wr[1])) }
function RangeCenter($rg) { $l = 0; $t = 0; $w = 0; $h = 0; $script:app.ActiveWindow.GetPoint([ref]$l, [ref]$t, [ref]$w, [ref]$h, $rg); $wr = [Cap]::Rect($script:hw); @(($l + $w / 2 - $wr[0]), ($t + $h / 2 - $wr[1])) }
# chạy phần mềm (chế độ kiểm thử) với tham số như add-in truyền, quay cửa sổ của nó thành cảnh $name
function Quay($name, [string[]]$a) {
  $env:TVS_QUAY_ARGS = '["' + ($a -join '","') + '"]'
  & node (Join-Path $proj 'video\quay\chay.js') $name | ForEach-Object { "   $_" }
  $env:TVS_QUAY_ARGS = $null
}

# ---------- mở Word với tài liệu thử ----------
$doc = Join-Path $dir "video-$Canh.docx"
if ($Canh -eq 'c8') { Copy-Item (Join-Path $proj 'video\khung\bai-giai-ai.docx') $doc -Force } else { NewDocx $doc ' ' }
$p = Start-Process $WW -ArgumentList '/n', '/q', "`"$doc`"" -PassThru
for ($i = 0; $i -lt 60 -and (Get-Process -Id $p.Id).MainWindowHandle -eq 0; $i++) { Start-Sleep -Milliseconds 500 }
Start-Sleep 4
$d = [Microsoft.VisualBasic.Interaction]::GetObject($doc)
$script:app = $d.Application
$script:hw = (Get-Process -Id $p.Id).MainWindowHandle
if ($Canh -eq 'c7') {
  $d.Content.InsertXML([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'word-noidung.xml'), [Text.Encoding]::UTF8))
  $d.Content.Font.Name = 'Times New Roman'; $d.Content.Font.Size = 13
  $d.Paragraphs.Item(1).Range.Font.Size = 15
  $d.Saved = $true
}
$app.WindowState = 0
[void][Cap]::ShowWindow($hw, 9)
[void][Cap]::SetWindowPos($hw, [IntPtr]::Zero, 0, 0, 2400, 1350, 0x40)
$app.ActiveWindow.View.Zoom.Percentage = $(if ($Canh -eq 'c7') { 150 } else { 130 })
[void][Cap]::SetForegroundWindow($hw)
if ($Canh -eq 'c7') { $d.Paragraphs.Item(4).Range.Select(); $app.Selection.Collapse(1) } else { $d.Range(0, 0).Select() }
Start-Sleep 2

# ---------- quay cửa sổ Word (tiến trình riêng, chụp liên tục) ----------
$stop = Join-Path $out 'dung.txt'
$job = Start-Job -ArgumentList ([int64]$hw), $out, $stop, $code -ScriptBlock {
  param($hw, $out, $stop, $code)
  Add-Type -AssemblyName System.Drawing
  Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing
  [void][Cap]::SetProcessDPIAware()
  $enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality, [long]92)
  $list = Join-Path $out 'khung.txt'; $i = 0
  while (-not (Test-Path $stop)) {
    $t = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $b = [Cap]::Shot([IntPtr]$hw)
    if ($i -eq 0) { [IO.File]::WriteAllText((Join-Path $out 'rong.txt'), [string]$b.Width) }
    $f = '{0:D5}.jpg' -f $i
    $b.Save((Join-Path $out $f), $enc, $ep); $b.Dispose()
    [IO.File]::AppendAllText($list, "$t $f`n"); $i++
    Start-Sleep -Milliseconds 20
  }
}
Start-Sleep 2
Mark 'bat-dau'
$win = $A::FromHandle($hw)

if ($Canh -eq 'c7') {
  # 1. bấm thẻ ToanViet rồi nút Công thức mới
  Start-Sleep 1.5
  $tab = FindEl $win 'ToanViet' ([Windows.Automation.ControlType]::TabItem)
  if ($tab) { $c = Center $tab; MoveTo $c[0] $c[1] 900; Press $c[0] $c[1]; try { $tab.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Select() } catch {} }
  Start-Sleep 1.2
  $btn = FindEl $win 'Công thức mới' ([Windows.Automation.ControlType]::Button)
  if ($btn) { $c = Center $btn; MoveTo $c[0] $c[1] 800; Press $c[0] $c[1] }
  Mark 'bam-nut'
  HideCur
  $app.StatusBar = 'ToanViet Studio đang mở…'
  Quay 'c7-chen' @('--office=word', '--mode=new', "--wpid=$($p.Id)", '--size=13')
  Start-Sleep 1.5
  Mark 'chen-xong'
  Start-Sleep 2.5
  # 2. nhấp đúp công thức vừa chèn để sửa
  if ($d.InlineShapes.Count -ge 1) {
    $sh = $d.InlineShapes.Item(1)
    $c = RangeCenter $sh.Range
    MoveTo $c[0] $c[1] 1000; Start-Sleep -Milliseconds 300; Press $c[0] $c[1] 2
    $sh.Select()
    Mark 'nhap-dup'
    HideCur
    Quay 'c7-sua' @('--office=word', '--mode=edit', "--wpid=$($p.Id)", '--size=13')
    Start-Sleep 1.5
    Mark 'sua-xong'
    Start-Sleep 2.5
  } else { '   (không thấy công thức đã chèn)' }
  # 3. chuyển các công thức Equation của tài liệu cũ sang ToanViet
  $menu = FindEl $win 'Thống nhất định dạng công thức' ([Windows.Automation.ControlType]::MenuItem)
  if (-not $menu) { $menu = FindEl $win 'Thống nhất định dạng công thức' ([Windows.Automation.ControlType]::Button) }
  if (-not $menu) { $menu = FindEl $win 'Thống nhất định dạng công thức' ([Windows.Automation.ControlType]::SplitButton) }
  if ($menu) { $c = Center $menu; MoveTo $c[0] $c[1] 1000; Press $c[0] $c[1] } else { '   (không thấy nút Thống nhất định dạng công thức)' }
  Mark 'chuyen'
  HideCur
  $ud = Join-Path $dir 'ud-video'
  $env:TVS_AUTO = Join-Path $dir 'auto-video.log'; $env:TVS_USERDATA = $ud
  $pa = Start-Process -FilePath (Join-Path $proj 'node_modules\electron\dist\electron.exe') -ArgumentList '.', '--office=word', '--mode=convert', '--op=eq2tv', "--wpid=$($p.Id)" -PassThru -WorkingDirectory $proj
  if (-not $pa.WaitForExit(300000)) { $pa.Kill(); '   (phần mềm chuyển đổi không tự đóng)' }
  $env:TVS_AUTO = $null; $env:TVS_USERDATA = $null
  Start-Sleep 1
  Mark 'chuyen-xong'
  "   sau chuyển đổi: $($d.OMaths.Count) Equation, $($d.InlineShapes.Count) công thức ToanViet"
  Start-Sleep 3
} else {
  # tài liệu Bài giải AI: cuộn từ đầu tới cuối
  Start-Sleep 2.5
  Mark 'cuon'
  for ($i = 0; $i -lt 46; $i++) { $app.ActiveWindow.SmallScroll(1) | Out-Null; Start-Sleep -Milliseconds 140 }
  Start-Sleep 2
}
Mark 'het'
Start-Sleep 1
Set-Content $stop '1'
Wait-Job $job -Timeout 30 | Out-Null; Receive-Job $job; Remove-Job $job -Force
try { $d.Close(0) } catch {}
try { if ($app.Documents.Count -eq 0) { $app.Quit(0) } } catch {}
Start-Sleep 2
if (-not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
& node (Join-Path $proj 'video\quay\gop-word.js') $out
