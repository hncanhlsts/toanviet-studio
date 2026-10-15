# Chụp thử các hình mẫu không gian lớp 11:  powershell -File build\test-space.ps1 <thư mục ra>
param([string]$Out = $env:TEMP)
$tmp = Join-Path $Out 'sp.png'
function Shot($name, $kinds) {
  $env:TVS_SHOT_PAGE = '1'
  $js = "(async()=>{ __clear(); const ks=[$kinds]; ks.forEach((k,i)=>{ __add('space',k,{x:12+(i%3)*262,y:14+Math.floor(i/3)*262,w:250,h:240}); __add('text',null,{x:12+(i%3)*262,y:4+Math.floor(i/3)*262,w:250,size:12,color:'#888',text:k}); }); await new Promise(s=>setTimeout(s,900)); __unselect(); })()"
  npx electron . "--shot=$tmp" "--eval=$js" | Out-Null
  Copy-Item ($tmp -replace '\.png$', '-after.png') (Join-Path $Out "$name.png") -Force
}
Shot 'sp1' "'vitri2dt','dtcatmp','dtssmp','giaotuyen','mpss','thales','chieuss','goc2dt','dtvgmp','dkvg','hai_dt_vgmp','hinh721'"
Shot 'sp2' "'trungtruc','badvg','gocdtmp','haimpvg','nhidien','kcdiemmp','kccheo','hinh717'"
$env:TVS_SHOT_PAGE = $null
