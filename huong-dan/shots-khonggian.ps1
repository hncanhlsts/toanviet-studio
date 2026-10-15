# Ảnh minh hoạ phần Hình không gian lớp 11. Chạy từ thư mục dự án:  powershell -File huong-dan\shots-khonggian.ps1
$img = Join-Path $PSScriptRoot 'img'
$tmp = "$env:TEMP\tvs-guide.png"
function Shot($name, $js, [switch]$Page) {
  $j = ($js -replace "`r?`n", ' ')
  if ($Page) { $env:TVS_SHOT_PAGE = '1' } else { $env:TVS_SHOT_PAGE = $null }
  npx electron . "--shot=$tmp" "--eval=$j" 2>$null | Out-Null
  $src = if ($Page) { $tmp -replace '\.png$', '-after.png' } else { $tmp -replace '\.png$', '-ui.png' }
  Copy-Item $src (Join-Path $img "$name.png") -Force
  "$name " + (Get-Item (Join-Path $img "$name.png")).Length
}
$W = "const w=t=>new Promise(s=>setTimeout(s,t));"
Shot 'khong-gian-ui' "(async()=>{$W __clear(); __add('space','gocdtmp',{x:80,y:60,w:440,h:340}); await w(700);})()"
Shot 'trang-khong-gian' @"
(async()=>{$W __clear();
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'HÌNH KHÔNG GIAN LỚP 11 — quan hệ song song, quan hệ vuông góc'});
const ks=[['dtvgmp','Đường thẳng vuông góc với mặt phẳng'],['hai_dt_vgmp','Hai đường thẳng cùng vuông góc với (P)'],['hinh721','Đường thẳng qua O song song với b'],['trungtruc','Mặt phẳng trung trực của AB'],['haimpvg','Hai mặt phẳng vuông góc'],['hinh717','Δ vuông góc với a và b'],['giaotuyen','Giao tuyến của hai mặt phẳng'],['thales','Định lí Thalès trong không gian'],['nhidien','Góc nhị diện']];
ks.forEach((k,i)=>{ const x=30+(i%3)*248, y=80+Math.floor(i/3)*330; __add('space',k[0],{x,y,w:236,h:270}); __add('text',null,{x,y:y+272,w:236,size:14,align:'center',color:'#555',text:k[1]}); });
await w(1000); __unselect();})()
"@ -Page
$env:TVS_SHOT_PAGE = $null
