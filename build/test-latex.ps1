# Kiểm thử trên tài liệu tạm: mã LaTeX <-> ToanViet, và đo thời gian từ lúc bấm chèn tới lúc phần mềm thoát
param([string]$Proj)
$log = "$env:TEMP\tvs-conv.log"
function RunConvert($op) {
  if (Test-Path $log) { [IO.File]::Delete($log) }
  $env:TVS_AUTO = $log
  $p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=convert","--op=$op" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
  if (-not $p.WaitForExit(180000)) { $p.Kill(); "  app did not exit" }
  $env:TVS_AUTO = $null
  if (Test-Path $log) { Get-Content $log -Encoding UTF8 | ForEach-Object { "  $_" } } else { "  (no dialog log)" }
}
function Count($d) {
  $tv = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { if ("$($d.InlineShapes.Item($i).AlternativeText)".StartsWith('TVS1:')) { $tv++ } }
  "ToanViet $tv, paragraphs " + $d.Paragraphs.Count
}
$w = New-Object -ComObject Word.Application; $w.Visible = $true
$d = $w.Documents.Add(); $sel = $w.Selection; $sel.Font.Size = 12
$sel.TypeText('Nghiệm của phương trình là $x_{1,2}=\frac{-b\pm\sqrt{\Delta}}{2a}$ với $\Delta=b^2-4ac$.'); $sel.TypeParagraph()
$sel.TypeText('Định lí Pythagore: \(a^2+b^2=c^2\), còn \[\int_0^1 x^2\,dx=\frac{1}{3}\] là một tích phân.'); $sel.TypeParagraph()
$sel.TypeText('Khối công thức riêng dòng:'); $sel.TypeParagraph()
$sel.TypeText('$$'); $sel.TypeParagraph(); $sel.TypeText('\sum_{k=1}^{n} k = \frac{n(n+1)}{2}'); $sel.TypeParagraph(); $sel.TypeText('$$'); $sel.TypeParagraph()
$sel.TypeText('Giá vé là $5 và $10, không phải công thức.'); $sel.TypeParagraph()
"before: " + (Count $d)
RunConvert 'tex2tv'
"after tex2tv: " + (Count $d)
"text: " + ($d.Range().Text -replace "`r", ' ¶ ')
$d.ExportAsFixedFormat("$env:TEMP\tvs-tex2tv.pdf", 17)
RunConvert 'tv2tex'
"after tv2tex: " + (Count $d)
"text: " + ($d.Range().Text -replace "`r", ' ¶ ')
# --- đo thời gian chèn một công thức mới
$sel = $w.Selection; $sel.EndKey(6) | Out-Null; $sel.TypeText('Do toc do: ')
$js = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); await w(2500); const m=document.getElementById('mf'); m.insert('x^2+y^2=z^2'); m.dispatchEvent(new Event('input')); await w(300); require=undefined; console.log('CLICK:'+Date.now()); document.getElementById('fxok').click(); await w(20000);})()"
$t0 = Get-Date
$p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=new","--size=12","--shot=$env:TEMP\tvs-speed.png","`"--eval=$js`"" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$env:TEMP\tvs-speed.log" -RedirectStandardError "$env:TEMP\tvs-speed.err"
if (-not $p.WaitForExit(60000)) { $p.Kill(); "speed test: app did not exit" }
$exit = [int64]($p.ExitTime.ToUniversalTime() - [datetime]::SpecifyKind([datetime]"1970-01-01", "Utc")).TotalMilliseconds
$click = 0; $m = Select-String -Path "$env:TEMP\tvs-speed.log" -Pattern 'CLICK:(\d+)' | Select-Object -First 1; if ($m) { $click = [int64]$m.Matches[0].Groups[1].Value }
if ($click) { "insert speed: " + ($exit - $click) + " ms from pressing Insert to app exit" }
"pictures after speed test: " + (Count $d)
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }
