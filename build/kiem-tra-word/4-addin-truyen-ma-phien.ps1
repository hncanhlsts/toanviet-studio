# Add-in trong Word (bản đã cài) khi mở ToanViet phải truyền mã tiến trình Word (--wpid) để chèn đúng phiên.
# Mở Word thử, bấm Ctrl+Alt+Q như người dùng, đọc dòng lệnh của ToanViet vừa mở rồi đóng nó.
. (Join-Path $PSScriptRoot 'chung.ps1')
'4. Add-in truyền mã phiên Word cho ToanViet'
$f = Join-Path $dir 'addin.docx'; NewDocx $f 'THU ADD-IN'
$p = OpenWord $f
$sh = New-Object -ComObject WScript.Shell
[void]$sh.AppActivate($p.Id); Start-Sleep 2
$sh.SendKeys('^%q'); Start-Sleep 8
$tv = Get-CimInstance Win32_Process -Filter "Name='ToanViet Studio.exe'" | Where-Object { $_.CommandLine -like '*--office=word*' } | Select-Object -First 1
$cmd = "$($tv.CommandLine)"
Check "ToanViet mở với --wpid=$($p.Id)" ($cmd -like "*--wpid=$($p.Id)*") "dòng lệnh: $cmd"
Get-Process 'ToanViet Studio' -ErrorAction SilentlyContinue | Stop-Process -Force
CloseWord $f; StopWord $p
