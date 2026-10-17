# Bấm "Công thức mới" (Ctrl+Alt+Q) trong Word như người dùng (bản đã cài): ToanViet phải hiện cửa sổ,
# xoá dòng "ToanViet Studio đang mở…" trên thanh trạng thái Word, và ghi nhật ký khởi động.
. (Join-Path $PSScriptRoot 'chung.ps1')
'6. Mở ToanViet từ Word'
$f = Join-Path $dir 'mo.docx'; NewDocx $f 'THU MO TOANVIET'
$log = Join-Path $env:APPDATA 'ToanViet Studio\khoi-dong.log'
$n0 = 0; if (Test-Path $log) { $n0 = @(Get-Content $log -Encoding UTF8).Count }
$p = OpenWord $f
$sh = New-Object -ComObject WScript.Shell
[void]$sh.AppActivate($p.Id); Start-Sleep 2
$sh.SendKeys('^%q')
$t = 0; $sw = [Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt 40) { Start-Sleep -Milliseconds 300; if (Get-Process 'ToanViet Studio' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }) { $t = $sw.Elapsed.TotalSeconds; break } }
Check "cửa sổ ToanViet hiện (sau $([math]::Round($t, 1)) giây)" ($t -gt 0) 'không thấy cửa sổ trong 40 giây'
Start-Sleep 4
$sb = InWord $f { param($d) "$($d.Application.StatusBar)" }
Check 'dòng "đang mở…" trên Word đã được xoá' (-not ("$sb" -like '*ToanViet*')) "thanh trạng thái: $sb"
$moi = @(); if (Test-Path $log) { $moi = @(Get-Content $log -Encoding UTF8 | Select-Object -Skip $n0) }
$moi | ForEach-Object { "   nhật ký: $_" }
Check 'nhật ký ghi lúc mở và lúc cửa sổ sẵn sàng' (($moi -join ' ') -like '*Mở ToanViet*' -and ($moi -join ' ') -like '*sẵn sàng*') "$($moi.Count) dòng mới"
Get-Process 'ToanViet Studio' -ErrorAction SilentlyContinue | Stop-Process -Force
CloseWord $f; StopWord $p
