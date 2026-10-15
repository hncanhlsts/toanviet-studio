# Ảnh minh hoạ phần Vectơ lớp 10 và hệ trục Oxyz lớp 12. Chạy từ thư mục dự án:  powershell -File huong-dan\shots-vecto.ps1
$img = Join-Path $PSScriptRoot 'img'
$tmp = "$env:TEMP\tvs-guide.png"
function Shot($name, $js) {
  $env:TVS_SHOT_PAGE = '1'
  npx electron . "--shot=$tmp" "--eval=$($js -replace "`r?`n", ' ')" 2>$null | Out-Null
  Copy-Item ($tmp -replace '\.png$', '-after.png') (Join-Path $img "$name.png") -Force
  "$name " + (Get-Item (Join-Path $img "$name.png")).Length
}
function Page($name, $title, $type, $list) {
  Shot $name @"
(async()=>{ __clear();
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'$title'});
const ks=[$list];
ks.forEach((k,i)=>{ const x=30+(i%3)*248, y=80+Math.floor(i/3)*330; __add('$type',k[0],{x,y,w:236,h:262}); __add('text',null,{x,y:y+266,w:236,size:14,align:'center',color:'#555',text:k[1]}); });
await new Promise(s=>setTimeout(s,1000)); __unselect(); })()
"@
}
Page 'trang-vecto10' 'VECTƠ — lớp 10 (Toán), tổng hợp lực (Vật lí)' 'plane' "['vt_khainiem','Vectơ bằng nhau, ngược hướng'],['vt_badiem','Quy tắc ba điểm'],['vt_hbh','Quy tắc hình bình hành'],['vt_hieu','Hiệu hai vectơ'],['vt_tichso','Tích của vectơ với một số'],['vt_trongtam','Trọng tâm tam giác'],['vt_goc','Góc giữa hai vectơ'],['vt_oxy','Toạ độ vectơ trong Oxy'],['vt_hopluc','Hợp lực']"
Page 'trang-oxyz' 'VECTƠ VÀ HỆ TRỤC TOẠ ĐỘ TRONG KHÔNG GIAN — lớp 12' 'space' "['vt_hinhhop','Quy tắc hình hộp'],['vt_tudien','Vectơ trong tứ diện'],['vt_goc3','Góc giữa hai vectơ'],['oxyz_ijk','Hệ trục Oxyz, vectơ đơn vị'],['oxyz_diem','Toạ độ của điểm M'],['oxyz_vecto','Toạ độ của vectơ'],['oxyz_hhcn','Hệ trục gắn với hình hộp'],['oxyz_chop','Hệ trục gắn với hình chóp']"
$env:TVS_SHOT_PAGE = $null