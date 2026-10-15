# Kiểm thử một lệnh chuyển đổi trên BẢN SAO của một tài liệu (không đụng tới tài liệu gốc)
param([string]$Proj, [string]$Copy, [string]$Op = 'eq2tv', [string]$Pdf = "$env:TEMP\tvs-doc-test.pdf")
$log = "$env:TEMP\tvs-conv.log"; if (Test-Path $log) { [IO.File]::Delete($log) }
$w = New-Object -ComObject Word.Application; $w.Visible = $true
$d = $w.Documents.Open($Copy)
function Count($d) { $tv = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { if ("$($d.InlineShapes.Item($i).AlternativeText)".StartsWith('TVS1:')) { $tv++ } }; "ToanViet $tv, Equation " + $d.OMaths.Count + ", paragraphs " + $d.Paragraphs.Count }
"before: " + (Count $d)
$env:TVS_AUTO = $log
$sw = [Diagnostics.Stopwatch]::StartNew()
$p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=convert","--op=$Op" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
if (-not $p.WaitForExit(400000)) { $p.Kill(); "app did not exit" }
$env:TVS_AUTO = $null
"time: " + [math]::Round($sw.Elapsed.TotalSeconds, 1) + " s"
if (Test-Path $log) { Get-Content $log -Encoding UTF8 | ForEach-Object { "  $_" } }
"after: " + (Count $d)
$d.ExportAsFixedFormat($Pdf, 17, $false, 0, 3, 1, 1)
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }
