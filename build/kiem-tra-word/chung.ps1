# Hàm dùng chung cho các kịch bản thử với Word thật. Chỉ làm việc trên tệp thử tự tạo trong thư mục tạm,
# không bao giờ đụng tới tài liệu của người dùng.
$WW = 'C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE'
if (-not (Test-Path $WW)) { $WW = 'C:\Program Files (x86)\Microsoft Office\root\Office16\WINWORD.EXE' }
$proj = Split-Path (Split-Path $PSScriptRoot)
$dir = Join-Path $env:TEMP 'tvs-kiem-tra-word'; New-Item -ItemType Directory -Force $dir | Out-Null
# mã cầu nối Office lấy thẳng từ main.js
& node (Join-Path $PSScriptRoot 'tach-cau-noi.js') (Join-Path $proj 'main.js') (Join-Path $dir 'bridge.ps1')
function NewDocx($file, $text) {
  Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
  if (Test-Path $file) { Remove-Item $file -Force }
  $z = [IO.Compression.ZipFile]::Open($file, 'Create')
  $put = { param($n, $c) $e = $z.CreateEntry($n); $w = New-Object IO.StreamWriter($e.Open(), (New-Object Text.UTF8Encoding $false)); $w.Write($c); $w.Close() }
  & $put '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
  & $put '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  & $put 'word/document.xml' ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>' + $text + '</w:t></w:r></w:p></w:body></w:document>')
  $z.Dispose()
}
$png = Join-Path $dir 'mau.png'
if (-not (Test-Path $png)) {
  Add-Type -AssemblyName System.Drawing
  $bmp = New-Object Drawing.Bitmap 120, 40; $g = [Drawing.Graphics]::FromImage($bmp); $g.Clear([Drawing.Color]::White)
  $g.DrawString('x^2+1', (New-Object Drawing.Font 'Arial', 16), [Drawing.Brushes]::Black, 4, 6); $bmp.Save($png); $g.Dispose(); $bmp.Dispose()
}
# chạy đoạn lệnh với một tài liệu thử (lấy đúng tài liệu theo đường dẫn), trong tiến trình con có giới hạn thời gian
function InWord($file, [scriptblock]$sb, $more = @(), [int]$sec = 120) {
  $j = Start-Job { param($f, $code, $more) Add-Type -AssemblyName Microsoft.VisualBasic; $d = [Microsoft.VisualBasic.Interaction]::GetObject($f); & ([scriptblock]::Create($code)) $d @more } -ArgumentList $file, $sb.ToString(), $more
  if (Wait-Job $j -Timeout $sec) { Receive-Job $j } else { "(Word không trả lời sau $sec giây)"; Stop-Job $j }
  Remove-Job $j -Force
}
function CloseWord($file) { InWord $file { param($d) $a = $d.Application; $d.Close(0); if ($a.Documents.Count -eq 0) { $a.Quit(0) } } | Out-Null }
function OpenWord($file) { $p = Start-Process $WW -ArgumentList '/n', '/q', "`"$file`"" -PassThru; Start-Sleep 9; $p }
function StopWord($p) { Start-Sleep 2; if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } }
# gọi đúng mã cầu nối Office của phần mềm
function Bridge([hashtable]$envs, [int]$sec = 300) {
  $j = Start-Job { param($dir, $envs) foreach ($k in $envs.Keys) { Set-Item ('env:' + $k) $envs[$k] }; & (Join-Path $dir 'bridge.ps1') } -ArgumentList $dir, $envs
  if (Wait-Job $j -Timeout $sec) { (Receive-Job $j) -join ' ' } else { "(cầu nối không trả lời sau $sec giây)"; Stop-Job $j }
  Remove-Job $j -Force
}
$global:KQ = @()
function Check($name, $cond, $info) { if ($cond) { "  ĐẠT  $name" } else { "  LỖI  $name  ($info)" }; $global:KQ += [bool]$cond }
$INS = @{ TVS_ACT = 'insert'; TVS_APP = 'word'; TVS_PNG = $png; TVS_ALT = 'TVS1:e30='; TVS_W = '60'; TVS_H = '20'; TVS_POS = '0'; TVS_SRC = '' }
