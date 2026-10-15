# Ảnh minh hoạ cho phần Trục số và Biểu đồ Ven. Chạy từ thư mục dự án:  powershell -File huong-dan\shots-tapso.ps1
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
$T = "__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:"

Shot 'truc-so-ui' "(async()=>{$W __clear(); __add('numline','giao',{x:60,y:60}); await w(600);})()"
Shot 'ven-ui' "(async()=>{$W __clear(); __add('venn','phantu',{x:60,y:60,shade:'C ∩ D'}); await w(600);})()"

Shot 'trang-truc-so' @"
(async()=>{$W __clear();
$T'TRỤC SỐ — điểm (lớp 6, 7), tập nghiệm, khoảng – đoạn, giao – hợp (lớp 8, 10)'});
__add('text',null,{x:40,y:70,w:714,text:'Số nguyên và số hữu tỉ trên trục số:'});
__add('numline','nguyen',{x:60,y:100,w:400});
__add('numline','huuti',{x:60,y:185,w:560});
__add('text',null,{x:40,y:275,w:714,text:'Số thực trên trục số (giá trị ở trên, tên điểm ở dưới):'});
__add('numline','thuc',{x:40,y:300,w:700});
__add('text',null,{x:40,y:425,w:714,text:'Tập nghiệm của bất phương trình `$x>4`$, `$-2<x\\le 3`$ và `$x<-1`$ hoặc `$x\\ge 2`$:'});
__add('numline','bpt',{x:60,y:455,w:420,h:62});
__add('numline','bpt2',{x:60,y:520,w:420,h:62});
__add('numline','bpt3',{x:60,y:585,w:420,h:62});
__add('text',null,{x:40,y:665,w:714,text:'Giao của hai tập hợp `$E=[1;+\\infty)`$ và `$F=(-\\infty;3]`$:'});
__add('numline','giao',{x:60,y:695,w:620});
__add('text',null,{x:40,y:900,w:714,text:'Tô đậm phần nghiệm, chấm tròn đặc / rỗng:'});
__add('numline','bpt2',{x:60,y:925,w:420,h:62,style:'bold',colorful:true});
await w(900); __unselect();})()
"@ -Page

Shot 'trang-ven' @"
(async()=>{$W __clear();
$T'BIỂU ĐỒ VEN — phần tử, tập con, giao, hợp, hiệu, phần bù'});
__add('venn','phantu',{x:30,y:80,w:360,h:220});
__add('venn','mot',{x:420,y:80,w:330,h:220,elements:'A: 0; 2; 4; 6; 8\nngoài: 1; 3; 5'});
__add('venn','con',{x:30,y:320,w:360,h:220,elements:'B: 1; 2\nA: 0; 3'});
__add('venn','giao',{x:420,y:320,w:330,h:220});
__add('venn','hieu',{x:30,y:560,w:360,h:220,style:'hatch'});
__add('venn','bu',{x:420,y:560,w:330,h:220});
__add('venn','ba',{x:200,y:800,w:380,h:300,elements:'A: 1\nB: 2\nC: 3\nAB: 4\nAC: 5\nBC: 6\nABC: 7',colorful:true});
await w(900); __unselect();})()
"@ -Page
$env:TVS_SHOT_PAGE = $null
