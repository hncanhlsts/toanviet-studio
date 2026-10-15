# Đo tốc độ chuyển đổi hàng loạt trên tài liệu Word tạm: 60 đoạn mã LaTeX -> ToanViet
param([string]$Proj, [int]$N = 60)
$log = "$env:TEMP\tvs-speed2.log"; if (Test-Path $log) { [IO.File]::Delete($log) }
$w = New-Object -ComObject Word.Application; $w.Visible = $true
$d = $w.Documents.Add(); $sel = $w.Selection
for ($k = 1; $k -le $N; $k++) { $sel.TypeText("Câu $k`: tính `$\frac{x^{$k}+1}{\sqrt{x+$k}}$ và `$\int_0^{$k} t^2\,dt$."); $sel.TypeParagraph() }
$env:TVS_AUTO = $log
$t0 = Get-Date
$p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=convert","--op=tex2tv" -PassThru -WorkingDirectory $Proj
if (-not $p.WaitForExit(600000)) { $p.Kill(); "app did not exit" }
$sec = [math]::Round(((Get-Date) - $t0).TotalSeconds, 1)
$env:TVS_AUTO = $null
$tv = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { if ("$($d.InlineShapes.Item($i).AlternativeText)".StartsWith('TVS1:')) { $tv++ } }
"formulas: " + (2 * $N) + "  converted pictures: $tv  time: $sec s  (" + [math]::Round($sec / (2 * $N), 3) + " s / công thức)"
if (Test-Path $log) { Get-Content $log -Encoding UTF8 }
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }