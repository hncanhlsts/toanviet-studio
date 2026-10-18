# Add-in trong Word (bản đã cài) khi mở ToanViet phải truyền mã tiến trình Word (--wpid) để chèn đúng phiên.
# Mở Word thử, bấm nút "Công thức mới" trên thẻ ToanViet bằng UI Automation (như người dùng nhấp chuột; không dùng
# SendKeys — phím gửi giả lập đôi khi rơi vào cửa sổ khác), đọc dòng lệnh của ToanViet vừa mở rồi đóng nó.
. (Join-Path $PSScriptRoot 'chung.ps1')
'4. Add-in truyền mã phiên Word cho ToanViet'
$f = Join-Path $dir 'addin.docx'; NewDocx $f 'THU ADD-IN'
$p = OpenWord $f
$cach = BamCongThucMoi $p
$tv = $null; $sw = [Diagnostics.Stopwatch]::StartNew()
while (-not $tv -and $sw.Elapsed.TotalSeconds -lt 30) { Start-Sleep -Milliseconds 300; $tv = Get-CimInstance Win32_Process -Filter "Name='ToanViet Studio.exe'" | Where-Object { $_.CommandLine -like '*--office=word*' } | Select-Object -First 1 }
"   bấm $cach; ToanViet mở sau $([math]::Round($sw.Elapsed.TotalSeconds, 1)) giây"
$cmd = "$($tv.CommandLine)"
Check "ToanViet mở với --wpid=$($p.Id)" ($cmd -like "*--wpid=$($p.Id)*") "dòng lệnh: $cmd"
Get-Process 'ToanViet Studio' -ErrorAction SilentlyContinue | Stop-Process -Force
CloseWord $f; StopWord $p
