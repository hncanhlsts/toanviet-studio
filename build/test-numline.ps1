# Chụp thử các mẫu Trục số và Biểu đồ Ven:  powershell -File build\test-numline.ps1 <thư mục ra>
param([string]$Out = $env:TEMP)
$tmp = Join-Path $Out 'nl.png'
function Shot($name, $js) {
  $env:TVS_SHOT_PAGE = '1'
  npx electron . "--shot=$tmp" "--eval=$($js -replace "`r?`n", ' ')" | Select-String 'renderer' | ForEach-Object { $_.Line }
  Copy-Item ($tmp -replace '\.png$', '-after.png') (Join-Path $Out "$name.png") -Force
  Copy-Item ($tmp -replace '\.png$', '-ui.png') (Join-Path $Out "$name-ui.png") -Force
}
Shot 'nl1' @"
(async()=>{ __clear(); let y=20;
for (const k of ['nguyen','huuti','thuc','bpt','bpt2','bpt3']) { const id=__add('numline',k,{x:30,y}); const o=document.querySelector('[data-id='+id+']'); y+=o.offsetHeight+18; }
await new Promise(s=>setTimeout(s,700)); __unselect();
document.querySelectorAll('.obj').forEach(e=>{ const id=e.dataset.id; }); })()
"@
Shot 'nl2' @"
(async()=>{ __clear(); let y=20;
for (const k of ['khoang','giao','hop','hieu']) { const id=__add('numline',k,{x:30,y}); const o=document.querySelector('[data-id='+id+']'); y+=o.offsetHeight+18; }
await new Promise(s=>setTimeout(s,700)); __unselect(); })()
"@
Shot 'venn' @"
(async()=>{ __clear(); const ks=['phantu','mot','con','giao','hop','hieu','bu','roi','ba']; let x=20,y=20,mh=0;
for (const k of ks) { const id=__add('venn',k,{x,y}); const o=document.querySelector('[data-id='+id+']'); mh=Math.max(mh,o.offsetHeight); x+=o.offsetWidth+16; if (x>420) { x=20; y+=mh+16; mh=0; } }
await new Promise(s=>setTimeout(s,700)); __unselect(); })()
"@
Shot 'venn2' @"
(async()=>{ __clear();
__add('venn','phantu',{x:20,y:20});
__add('venn','ba',{x:400,y:20,elements:'A: 1\nB: 2\nC: 3\nAB: 4\nAC: 5\nBC: 6\nABC: 7'});
__add('venn','con',{x:20,y:340,names:'A, B',elements:'A: 1; 3; 5; 7\nB: 2; 4\nngoài: 9'});
__add('venn','hop',{x:400,y:340,style:'hatch',colorful:true,unv:true});
__add('numline','khoang',{x:20,y:640});
await new Promise(s=>setTimeout(s,700)); __unselect(); })()
"@
$env:TVS_SHOT_PAGE = $null
