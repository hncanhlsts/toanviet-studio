# Thử chèn công thức dạng Equation vào tài liệu Word tạm (không đụng tài liệu khác)
param([string]$Proj)
$env:TVS_AUTO = "$env:TEMP\tvs-eq-auto.log"; if (Test-Path $env:TVS_AUTO) { [IO.File]::Delete($env:TVS_AUTO) }
$w = New-Object -ComObject Word.Application; $w.Visible = $true
$d = $w.Documents.Add(); $sel = $w.Selection; $sel.Font.Size = 14
$sel.TypeText('Nghiệm là ')
function Run($latex, $eq) {
  $js = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); localStorage.setItem('tvs-insert-eq','$eq'); await w(2200); const m=document.getElementById('mf'); m.insert('$latex'); m.dispatchEvent(new Event('input')); await w(300); console.log('EQ:'+document.getElementById('fEq').checked+' visible:'+!document.getElementById('fEqWrap').hidden); document.getElementById('fxok').click(); await w(8000);})()"
  $p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=new","--size=14","--shot=$env:TEMP\tvs-eq.png","`"--eval=$js`"" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$env:TEMP\tvs-eq.log" -RedirectStandardError "$env:TEMP\tvs-eq.err"
  if (-not $p.WaitForExit(60000)) { $p.Kill(); "  app did not exit" }
  Select-String -Path "$env:TEMP\tvs-eq.log" -Pattern 'EQ:' | ForEach-Object { '  ' + $_.Line }
}
Run 'x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}' '1'
$w.Selection.TypeText(' và tam giác ')
Run '\\Delta ABC\\dongdang\\Delta MNP' '1'
$w.Selection.TypeText(' xong.')
"OMaths: " + $d.OMaths.Count + "  pictures: " + $d.InlineShapes.Count + "  paragraphs: " + $d.Paragraphs.Count
for ($i = 1; $i -le $d.OMaths.Count; $i++) { "  eq$i type=" + $d.OMaths.Item($i).Type + " (1 = nằm trong dòng chữ)" }
for ($i = 1; $i -le $d.OMaths.Count; $i++) { "  eq$i size=" + $d.OMaths.Item($i).Range.Font.Size + " text=" + $d.OMaths.Item($i).Range.Text }
"para text: " + ($d.Range().Text -replace "`r", ' ¶ ')
# sửa lại công thức thứ nhất: đặt con trỏ vào trong rồi mở chế độ sửa, chèn dạng ảnh (eq=0) để thử thay thế
$d.OMaths.Item(1).Range.Select(); $w.Selection.Collapse(1); $w.Selection.MoveRight(1, 1) | Out-Null
$js2 = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); localStorage.setItem('tvs-insert-eq','1'); await w(3000); const m=document.getElementById('mf'); console.log('READ:'+m.value); m.insert('+1'); m.dispatchEvent(new Event('input')); await w(300); document.getElementById('fxok').click(); await w(8000);})()"
$p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=edit","--shot=$env:TEMP\tvs-eq2.png","`"--eval=$js2`"" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$env:TEMP\tvs-eq2.log" -RedirectStandardError "$env:TEMP\tvs-eq2.err"
if (-not $p.WaitForExit(60000)) { $p.Kill(); "  edit: app did not exit" }
Select-String -Path "$env:TEMP\tvs-eq2.log" -Pattern 'READ:' | ForEach-Object { '  ' + $_.Line }
"after edit OMaths: " + $d.OMaths.Count + "  first: " + $d.OMaths.Item(1).Range.Text
if (Test-Path $env:TVS_AUTO) { 'dialogs: ' + ((Get-Content $env:TVS_AUTO -Encoding UTF8) -join ' / ') }
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }