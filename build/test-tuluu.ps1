# Kiểm thử tự lưu bản nháp, khôi phục, hỏi khi đóng (dùng thư mục dữ liệu tạm, không đụng dữ liệu thật)
#   powershell -File build\test-tuluu.ps1 -Out <thư mục tạm>
param([string]$Out)
$ud = Join-Path $Out 'ud'; if (Test-Path $ud) { Get-ChildItem $ud -Recurse -File | ForEach-Object { [IO.File]::Delete($_.FullName) } }
$draft = Join-Path $ud 'ban-nhap.json'
$log = Join-Path $Out 'auto.log'
function Run($js, $extra) {
  foreach ($k in $extra.Keys) { if ($k -ne 'args') { [Environment]::SetEnvironmentVariable($k, $extra[$k]) } }
  $env:TVS_USERDATA = $ud; $env:TVS_NO_DEMO = '1'
  $r = npx electron . @($extra.args) "--shot=$Out\t.png" "--eval=$($js -replace "`r?`n", ' ')" 2>$null | Select-String 'OUT|WINDOW-STILL' | ForEach-Object { '   ' + $_.Line }
  foreach ($k in @($extra.Keys) + 'TVS_USERDATA', 'TVS_NO_DEMO') { if ($k -ne 'args') { [Environment]::SetEnvironmentVariable($k, $null) } }
  $r
}
$mk = "__clear(); __add('formula',null,{latex:'a^2+b^2=c^2',x:60,y:60}); document.querySelector('#page .obj').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:5,clientY:5})); window.dispatchEvent(new PointerEvent('pointerup',{})); document.querySelector('[data-cmd=dup]').click();"

# A. tự lưu bản nháp
Run "(async()=>{ $mk window.__saveDraftNow(); await new Promise(s=>setTimeout(s,500)); console.log('OUT A objs='+document.querySelectorAll('#page .obj').length); })()" @{ TVS_DRAFT_TEST = '1'; args = @() }
'A. có bản nháp: ' + (Test-Path $draft) + ', số đối tượng: ' + ((Get-Content $draft -Raw -Encoding UTF8 | ConvertFrom-Json).data | ConvertFrom-Json).Count

# B. mở lại phần mềm: đề nghị khôi phục
if (Test-Path $log) { [IO.File]::Delete($log) }
Run "(async()=>{ await new Promise(s=>setTimeout(s,800)); console.log('OUT B objs='+document.querySelectorAll('#page .obj').length); })()" @{ TVS_DRAFT_TEST = '1'; TVS_AUTO = $log; args = @() }
'B. hộp thoại: ' + ((Get-Content $log -Encoding UTF8) -join ' ')

# C. đóng khi chưa lưu, chọn "Không lưu": phần mềm đóng, bản nháp bị xoá
'C. trước: có bản nháp = ' + (Test-Path $draft)
Run "(async()=>{ $mk await new Promise(s=>setTimeout(s,200)); console.log('OUT C dirty'); })()" @{ TVS_DRAFT_TEST = '1'; TVS_AUTO = $log; TVS_AUTO_CLOSE = 'discard'; args = @() }
'C. sau "Không lưu": có bản nháp = ' + (Test-Path $draft)

# D. đóng khi chưa lưu, chọn "Lưu": ghi vào tệp đang mở, giữ bản .bak
if (Test-Path $draft) { [IO.File]::Delete($draft) }
$doc = Join-Path $Out 'bai.tvs'; [IO.File]::WriteAllText($doc, '{"app":"ToanVietStudio","version":1,"objects":[{"id":"o1","type":"formula","x":60,"y":60,"latex":"x+1","size":16,"color":"#000000"}]}', (New-Object Text.UTF8Encoding $false)); if (Test-Path "$doc.bak") { [IO.File]::Delete("$doc.bak") }
Run "(async()=>{ await new Promise(s=>setTimeout(s,800)); document.querySelector('#page .obj').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:5,clientY:5})); window.dispatchEvent(new PointerEvent('pointerup',{})); document.querySelector('[data-cmd=dup]').click(); await new Promise(s=>setTimeout(s,200)); console.log('OUT D dirty'); })()" @{ TVS_AUTO = $log; TVS_AUTO_CLOSE = 'save'; args = @($doc) }
$after = (Get-Content $doc -Raw -Encoding UTF8 | ConvertFrom-Json).objects.Count
$bak = if (Test-Path "$doc.bak") { (Get-Content "$doc.bak" -Raw -Encoding UTF8 | ConvertFrom-Json).objects.Count } else { 'không có' }
'D. tệp sau "Lưu": ' + $after + ' đối tượng; bản .bak: ' + $bak + ' đối tượng'

# E. đóng khi chưa lưu, chọn "Huỷ": cửa sổ vẫn mở
Run "(async()=>{ $mk await new Promise(s=>setTimeout(s,200)); console.log('OUT E dirty'); })()" @{ TVS_AUTO = $log; TVS_AUTO_CLOSE = 'cancel'; args = @() }
