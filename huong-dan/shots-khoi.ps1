$img = Join-Path $PSScriptRoot 'img'
$tmp = "$env:TEMP\tvs-guide.png"
$env:TVS_SHOT_PAGE = $null
$js = "(async()=>{ __clear(); __add('space','k_chop4sa',{x:80,y:60,w:420,h:380}); await new Promise(s=>setTimeout(s,700)); document.querySelector('#props').scrollTop = 0; })()"
npx electron . "--shot=$tmp" "--eval=$js" 2>$null | Out-Null
Copy-Item ($tmp -replace '\.png$', '-ui.png') (Join-Path $img 'khoi-ui.png') -Force
'khoi-ui ' + (Get-Item (Join-Path $img 'khoi-ui.png')).Length