# Chụp thử các mẫu vectơ lớp 10 (Hình phẳng) và lớp 12 (Hình không gian):  powershell -File build\test-vecto.ps1 <thư mục ra>
param([string]$Out = $env:TEMP)
$tmp = Join-Path $Out 'vt.png'
function Shot($name, $type, $kinds) {
  $env:TVS_SHOT_PAGE = '1'
  $js = "(async()=>{ __clear(); const ks=[$kinds]; ks.forEach((k,i)=>{ __add('$type',k,{x:12+(i%3)*262,y:18+Math.floor(i/3)*262,w:250,h:236}); __add('text',null,{x:12+(i%3)*262,y:2+Math.floor(i/3)*262,w:250,size:12,color:'#888',text:k}); }); await new Promise(s=>setTimeout(s,900)); __unselect(); })()"
  npx electron . "--shot=$tmp" "--eval=$js" | Out-Null
  Copy-Item ($tmp -replace '\.png$', '-after.png') (Join-Path $Out "$name.png") -Force
}
Shot 'vt10' 'plane' "'vt_khainiem','vt_badiem','vt_hbh','vt_hieu','vt_tichso','vt_trongtam','vt_goc','vt_oxy','vt_hai_diem','vt_hopluc'"
Shot 'vt12' 'space' "'vt_hinhhop','vt_tudien','vt_goc3','oxyz_ijk','oxyz_diem','oxyz_vecto','oxyz_hhcn','oxyz_chop'"
$env:TVS_SHOT_PAGE = $null
