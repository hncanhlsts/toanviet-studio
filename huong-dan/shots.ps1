# Chụp lại toàn bộ ảnh minh hoạ cho tài liệu hướng dẫn. Chạy từ thư mục dự án:  powershell -File huong-dan\shots.ps1
$img = Join-Path $PSScriptRoot 'img'; New-Item -ItemType Directory -Force $img | Out-Null
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

Shot 'giao-dien' "(async()=>{$W await w(300); document.querySelector('.obj.graph').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:400,clientY:400})); window.dispatchEvent(new PointerEvent('pointerup')); await w(400);})()"

Shot 'hop-soan' @"
(async()=>{$W __clear(); await w(200);
document.querySelector('[data-cmd=ins-formula]').click(); await w(400);
const m=document.getElementById('mf'); m.insert('\\displaylines{\\Delta ABC\\dongdang\\Delta MNP\\\\ \\widehat{ABC}=\\frac{1}{2}\\text{sđ}\\,\\overarc{AmC}=60^{\\circ}}'); m.dispatchEvent(new Event('input')); await w(500);})()
"@

Shot 'phim-tat' @"
(async()=>{$W __clear(); await w(200);
document.querySelector('[data-cmd=ins-formula]').click(); await w(400);
const m=document.getElementById('mf'); m.insert('x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}'); m.dispatchEvent(new Event('input'));
document.getElementById('fKeys').click(); await w(400);})()
"@

function TabShot($name, $tabText, $grade, $latex) {
  Shot $name @"
(async()=>{$W __clear(); await w(200);
document.querySelector('[data-cmd=ins-formula]').click(); await w(400);
[...document.querySelectorAll('#tabs button')].find(b=>b.textContent==='$tabText').click(); await w(200);
document.querySelectorAll('.gradebar button')[$grade].click(); await w(200);
const m=document.getElementById('mf'); m.insert('$latex'); m.dispatchEvent(new Event('input')); await w(500);})()
"@
}
TabShot 'tab-toan' 'Toán theo lớp' 3 'x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}'
TabShot 'tab-ly' 'Vật lí' 2 'I=\\frac{\\mathcal{E}}{R+r}'
TabShot 'tab-hoa' 'Hoá học' 1 '\\overset{0}{\\mathrm{Cu}}\\to\\overset{+2}{\\mathrm{Cu}}+2e'
TabShot 'tab-sinh' 'Sinh học' 3 'p^{2}AA+2pqAa+q^{2}aa=1'

Shot 'thong-so' @"
(async()=>{$W __clear(); await w(200);
__add('plane','goc',{x:30,y:20,w:300,h:240});
__add('plane','goctam',{x:380,y:20,w:330,h:300});
const id=__add('plane','tamgiac',{x:30,y:300,w:330,h:250});
document.getElementById('stage').scrollTop=0; await w(400);})()
"@

Shot 'trang-toan' -Page @"
(async()=>{$W __clear(); await w(200);
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'TOÁN — ví dụ các đối tượng ToanViet tạo được'});
__add('text',null,{x:40,y:70,w:714,text:'Giải hệ phương trình và biện luận theo tham số ' + String.fromCharCode(36) + 'm' + String.fromCharCode(36) + ':'});
__add('formula',null,{x:60,y:104,size:18,latex:'\\displaylines{\\begin{cases}x+y=m\\\\2x-y=1\\end{cases}\\Leftrightarrow\\begin{cases}x=\\frac{m+1}{3}\\\\y=\\frac{2m-1}{3}\\end{cases}\\\\ \\text{Vậy hệ luôn có nghiệm duy nhất với mọi }m\\in\\mathbb{R}.}'});
__add('plane','ngoaitiep',{x:430,y:76,w:300,h:250});
__add('graph',null,{x:40,y:250,w:330,h:300,funcs:'x^2-2x-1\n-x+1',xmin:'-3',xmax:'5',ymin:'-3',ymax:'5',points:'A(-1; 2)\nB(2; -1)',shadeA:'-1',shadeB:'2'});
__add('bbt',null,{x:400,y:350,w:354,h:150,expr:'x^2-2x-1'});
__add('sign',null,{x:400,y:512,w:354,h:66,expr:'(x+1)(x-2)'});
__add('plane','goctam',{x:40,y:580,w:240,h:240});
__add('plane','thales',{x:290,y:600,w:230,h:200});
__add('solid','chop4',{x:530,y:590,w:220,h:220});
__add('region',null,{x:40,y:840,w:260,h:260});
__add('plane','dtluonggiac',{x:320,y:840,w:230,h:230});
__add('solid','non',{x:570,y:840,w:160,h:200});
__unselect(); await w(500);})()
"@

Shot 'trang-ly' -Page @"
(async()=>{$W __clear(); await w(200);
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'VẬT LÍ — công thức, sơ đồ mạch điện, quang học, cơ học'});
__add('text',null,{x:40,y:72,w:340,text:'Sơ đồ mạch điện ghép từ ký hiệu SGK và nút Đoạn:'});
const L=(x,y,w2,h2)=>__add('shape','line',{x:x,y:y,w:w2,h:h2});
__add('sym','nguon',{x:110,y:90,w:120,h:80,label:'\\mathcal{E},\\ r'});
__add('sym','congtacdong',{x:230,y:90,w:120,h:80,label:'K'});
__add('sym','dientro',{x:60,y:230,w:120,h:80,label:'R_1'});
__add('sym','den',{x:180,y:230,w:120,h:80,label:'\\text{Đ}'});
__add('sym','ampeke',{x:300,y:250,w:120,h:60});
L(60,140,50,0.5); L(350,140,70,0.5); L(60,140,0.5,140); L(420,140,0.5,140);
__add('formula',null,{x:470,y:100,size:18,latex:'\\displaylines{I=\\frac{\\mathcal{E}}{R_{N}+r}\\\\ U=\\mathcal{E}-Ir\\\\ P=UI=I^{2}R}'});
__add('formula',null,{x:470,y:230,size:18,latex:'x=A\\cos\\left(\\omega t+\\varphi\\right),\\quad T=2\\pi\\sqrt{\\frac{l}{g}}'});
__add('text',null,{x:40,y:350,w:714,text:'Quang học và cơ học:'});
__add('sym','tkhoitu',{x:40,y:390,w:300,h:180});
__add('sym','phanxa',{x:370,y:390,w:240,h:150});
__add('sym','khucxa',{x:600,y:390,w:160,h:150});
__add('sym','vatluc',{x:40,y:600,w:230,h:170});
__add('sym','matnghieng',{x:290,y:610,w:230,h:150});
__add('sym','conlac',{x:550,y:590,w:150,h:170});
__add('formula',null,{x:60,y:800,size:18,latex:'\\vec{F}=m\\vec{a},\\quad F_{ms}=\\mu N,\\quad W_{\\text{đ}}=\\frac{1}{2}mv^{2},\\quad {}_{92}^{235}\\text{U}+{}_{0}^{1}\\text{n}\\to{}_{56}^{141}\\text{Ba}+{}_{36}^{92}\\text{Kr}+3{}_{0}^{1}\\text{n}'});
__unselect(); await w(500);})()
"@

Shot 'trang-hoa' -Page @"
(async()=>{$W __clear(); await w(200);
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'HOÁ HỌC — công thức, phương trình phản ứng, dụng cụ, cấu hình electron'});
__add('formula',null,{x:60,y:80,size:18,latex:'\\displaylines{\\mathrm{2KMnO_4+16HCl\\to 2KCl+2MnCl_2+5Cl_2\\uparrow+8H_2O}\\\\ \\mathrm{CaCO_3\\xrightarrow{t^{\\circ}}CaO+CO_2\\uparrow}\\\\ \\mathrm{N_2+3H_2\\rightleftharpoons 2NH_3}\\qquad\\Delta_{r}H_{298}^{\\circ}=-92\\,\\text{kJ}}'});
__add('formula',null,{x:60,y:210,size:18,latex:'\\overset{0}{\\mathrm{Cu}}+\\overset{+5}{\\mathrm{N}}\\to\\overset{+2}{\\mathrm{Cu}}+\\overset{+2}{\\mathrm{N}}\\qquad K_{C}=\\frac{[\\mathrm{NH_3}]^{2}}{[\\mathrm{N_2}][\\mathrm{H_2}]^{3}}\\qquad\\mathrm{pH}=-\\log[\\mathrm{H^{+}}]'});
__add('text',null,{x:40,y:290,w:714,text:'Cấu hình electron và ô lượng tử của oxygen (Z = 8):'});
__add('formula',null,{x:60,y:326,size:18,latex:'1s^{2}2s^{2}2p^{4}'});
__add('sym','oluongtu',{x:220,y:312,w:36,h:56,data:'ud',label:'1s'});
__add('sym','oluongtu',{x:290,y:312,w:36,h:56,data:'ud',label:'2s'});
__add('sym','oluongtu',{x:360,y:312,w:104,h:56,data:'ud u u',label:'2p'});
__add('text',null,{x:40,y:400,w:714,text:'Dụng cụ thí nghiệm và hợp chất hữu cơ:'});
__add('sym','ongnghiem',{x:60,y:440,w:60,h:150});
__add('sym','coc',{x:150,y:470,w:110,h:120});
__add('sym','binhtamgiac',{x:290,y:450,w:120,h:140});
__add('sym','binhcau',{x:440,y:450,w:120,h:140});
__add('sym','dencon',{x:590,y:470,w:110,h:120});
__add('sym','benzen',{x:60,y:630,w:120,h:120});
__add('sym','benzenk',{x:200,y:630,w:120,h:120});
__add('formula',null,{x:360,y:640,size:18,latex:'\\displaylines{\\mathrm{CH_3COOH+C_2H_5OH\\rightleftharpoons CH_3COOC_2H_5+H_2O}\\\\ \\mathrm{nCH_2{=}CH_2\\xrightarrow{t^{\\circ},\\,p,\\,xt}(-CH_2{-}CH_2-)_n}\\\\ \\mathrm{CH_2{=}CH_2+Br_2\\to CH_2Br{-}CH_2Br}}'});
__unselect(); await w(500);})()
"@

Shot 'trang-sinh' -Page @"
(async()=>{$W __clear(); await w(200);
__add('text',null,{x:40,y:24,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:'SINH HỌC — sơ đồ lai, phả hệ, di truyền quần thể'});
__add('text',null,{x:40,y:72,w:340,text:'Sơ đồ lai một cặp tính trạng:'});
__add('formula',null,{x:60,y:106,size:18,latex:'\\displaylines{P:\\quad\\text{♂}\\,AA\\times\\text{♀}\\,aa\\\\ G_{P}:\\quad A\\qquad\\quad a\\\\ F_{1}:\\quad 100\\%\\,Aa\\\\ F_{1}\\times F_{1}:\\quad Aa\\times Aa\\\\ F_{2}:\\quad 1AA:2Aa:1aa}'});
__add('text',null,{x:420,y:72,w:330,text:'Sơ đồ phả hệ (ghép từ ký hiệu SGK):'});
__add('sym','honnhan',{x:430,y:106,w:220,h:180});
__add('sym','nam',{x:680,y:110,w:36,h:36}); __add('text',null,{x:720,y:116,w:60,size:13,text:'Nam'});
__add('sym','nu',{x:680,y:156,w:36,h:36}); __add('text',null,{x:720,y:162,w:60,size:13,text:'Nữ'});
__add('sym','nambenh',{x:680,y:202,w:36,h:36}); __add('text',null,{x:720,y:208,w:70,size:13,text:'Bị bệnh'});
__add('text',null,{x:40,y:310,w:714,text:'Di truyền liên kết, hoán vị gen và di truyền quần thể:'});
__add('formula',null,{x:60,y:346,size:18,latex:'\\frac{AB}{ab}\\times\\frac{ab}{ab},\\qquad X^{A}X^{a}\\times X^{A}Y,\\qquad f=\\frac{\\text{số giao tử hoán vị}}{\\text{tổng số giao tử}}\\cdot 100\\%'});
__add('formula',null,{x:60,y:420,size:18,latex:'p+q=1,\\qquad p^{2}AA+2pqAa+q^{2}aa=1,\\qquad H=2A+3G,\\qquad L=\\frac{N}{2}\\times 3{,}4\\,\\text{Å}'});
__add('text',null,{x:40,y:480,w:714,text:'Quang hợp, hô hấp và các ký hiệu khác:'});
__add('formula',null,{x:60,y:516,size:17,latex:'\\mathrm{6CO_2+6H_2O\\xrightarrow[\\text{diệp lục}]{\\text{ánh sáng}}C_6H_{12}O_6+6O_2}'});
__add('sym','adn',{x:60,y:590,w:300,h:105});
__add('sym','nst',{x:400,y:580,w:80,h:120});
__add('sym','duc',{x:520,y:590,w:90,h:90});
__add('sym','cai',{x:640,y:585,w:90,h:100});
__unselect(); await w(500);})()
"@
$env:TVS_SHOT_PAGE = $null
