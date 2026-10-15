# Kiểm thử chuyển đổi hàng loạt trên tài liệu tạm (không đụng tới tài liệu thật). Chạy khi không có Word nào đang mở.
param([string]$Proj, [string]$Sample, [string]$Ops = 'mt2tv,eq2tv,tv2eq')
$log = "$env:TEMP\tvs-conv.log"
function RunConvert($op) {
  if (Test-Path $log) { [IO.File]::Delete($log) }
  $env:TVS_AUTO = $log
  $p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=convert","--op=$op" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
  if (-not $p.WaitForExit(240000)) { $p.Kill(); "  app did not exit" }
  $env:TVS_AUTO = $null
  if (Test-Path $log) { Get-Content $log -Encoding UTF8 | ForEach-Object { "  $_" } } else { "  (no dialog log)" }
}
function Count($d) {
  $mt = 0; $tv = 0
  for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { $s = $d.InlineShapes.Item($i); $pg = ''; try { $pg = $s.OLEFormat.ProgID } catch {}; if ($pg -like 'Equation*') { $mt++ }; if ("$($s.AlternativeText)".StartsWith('TVS1:')) { $tv++ } }
  "MathType $mt, ToanViet $tv, Equation " + $d.OMaths.Count + ", paragraphs " + $d.Paragraphs.Count
}
$w = New-Object -ComObject Word.Application; $w.Visible = $true
if ($Ops -match 'mt2tv') {
  $copy = "$env:TEMP\tvs-mt\conv-copy.docx"; Copy-Item -LiteralPath $Sample -Destination $copy -Force
  $d = $w.Documents.Open($copy)
  "mt2tv before: " + (Count $d); RunConvert 'mt2tv'; "mt2tv after:  " + (Count $d)
  $d.SaveAs2("$env:TEMP\tvs-mt\conv-mt2tv.docx"); $d.ExportAsFixedFormat("$env:TEMP\tvs-conv-mt2tv.pdf", 17, $false, 0, 3, 1, 1)
  if ($Ops -match 'tv2mt') { RunConvert 'tv2mt'; "tv2mt after:  " + (Count $d); $d.SaveAs2("$env:TEMP\tvs-mt\conv-tv2mt.docx"); $d.ExportAsFixedFormat("$env:TEMP\tvs-conv-tv2mt.pdf", 17, $false, 0, 3, 1, 1) }
  $d.Close([ref]0)
}
if ($Ops -match 'eq2tv') {
  $d = $w.Documents.Add(); $sel = $w.Selection; $sel.Font.Size = 12
  foreach ($t in @(@("Nghiem ", "x_(1,2)=(-b±√(b^2-4ac))/2a", " cua phuong trinh."), @("Dinh ly ", "a^2+b^2=c^2", " (Pythagore)."), @("Gioi han ", "lim_(x→0) (sin x)/x=1", " va tich phan."))) {
    $sel.TypeText($t[0]); $rg = $sel.Range; $rg.Text = $t[1]; [void]$d.OMaths.Add($rg); $d.OMaths.Item($d.OMaths.Count).BuildUp(); $sel.EndKey(6) | Out-Null; $sel.TypeText($t[2]); $sel.TypeParagraph()
  }
  "eq2tv before: " + (Count $d); RunConvert 'eq2tv'; "eq2tv after:  " + (Count $d)
  $d.ExportAsFixedFormat("$env:TEMP\tvs-conv-eq2tv.pdf", 17)
  if ($Ops -match 'tv2eq') { RunConvert 'tv2eq'; "tv2eq after:  " + (Count $d); "text: " + ($d.Range().Text -replace "`r", ' ¶ '); $d.ExportAsFixedFormat("$env:TEMP\tvs-conv-tv2eq.pdf", 17) }
  $d.Close([ref]0)
}
if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }
