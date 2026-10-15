# Đo thời gian từ lúc bấm chèn tới lúc phần mềm thoát (tài liệu Word tạm)
param([string]$Proj, [string]$Exe = '')
$w = New-Object -ComObject Word.Application; $w.Visible = $true
$d = $w.Documents.Add(); $w.Selection.TypeText('Do toc do: ')
$js = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); await w(2500); const m=document.getElementById('mf'); m.insert('x^2+y^2=z^2'); m.dispatchEvent(new Event('input')); await w(300); console.log('CLICK:'+Date.now()); document.getElementById('fxok').click(); await w(20000);})()"
foreach ($run in 1..3) {
  $log = "$env:TEMP\tvs-speed$run.log"
  if ($Exe) { $p = Start-Process -FilePath $Exe -ArgumentList "--office=word","--mode=new","--size=12","--shot=$env:TEMP\tvs-speed.png","`"--eval=$js`"" -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err" }
  else { $p = Start-Process -FilePath "$Proj\node_modules\electron\dist\electron.exe" -ArgumentList ".","--office=word","--mode=new","--size=12","--shot=$env:TEMP\tvs-speed.png","`"--eval=$js`"" -PassThru -WorkingDirectory $Proj -RedirectStandardOutput $log -RedirectStandardError "$log.err" }
  if (-not $p.WaitForExit(60000)) { $p.Kill(); "run ${run}: app did not exit"; continue }
  $exit = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $m = Select-String -Path $log -Pattern 'CLICK:(\d+)' | Select-Object -First 1
  if ($m) { "run ${run}: " + ($exit - [int64]$m.Matches[0].Groups[1].Value) + " ms from Insert to exit; pictures in doc: " + $d.InlineShapes.Count } else { "run ${run}: no click logged" }
}
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }
