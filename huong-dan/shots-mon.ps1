# Chụp ảnh minh hoạ tính năng mới theo môn (bản 2.8.0) cho tài liệu hướng dẫn. Chạy từ thư mục dự án:
#   powershell -File huong-dan\shots-mon.ps1
$img = Join-Path $PSScriptRoot 'img'; New-Item -ItemType Directory -Force $img | Out-Null
$tmp = "$env:TEMP\tvs-guide.png"
$env:TVS_USERDATA = "$env:TEMP\tvs-guide-ud"; $env:TVS_NO_DEMO = '1'
function Shot($name, $js, [switch]$Page) {
  $j = ($js -replace "`r?`n", ' ')
  if ($Page) { $env:TVS_SHOT_PAGE = '1' } else { $env:TVS_SHOT_PAGE = $null }
  npx electron . "--shot=$tmp" "--eval=$j" 2>$null | Out-Null
  $src = if ($Page) { $tmp -replace '\.png$', '-after.png' } else { $tmp -replace '\.png$', '-ui.png' }
  Copy-Item $src (Join-Path $img "$name.png") -Force
  "$name " + (Get-Item (Join-Path $img "$name.png")).Length
}
$W = "const w=t=>new Promise(s=>setTimeout(s,t)); const tieuDe=(t)=>__add('text',null,{x:40,y:20,w:714,size:20,bold:true,align:'center',color:'#1f3f7a',text:t}); const ghi=(x,y,t)=>__add('text',null,{x:x,y:y,w:360,size:15,bold:true,color:'#1f3f7a',text:t}); const kh=(k,x,y,ww,hh,o)=>__add('khtn',k,Object.assign({x:x,y:y,w:ww,h:hh},o||{}));"

Shot 'moi-toan' -Page @"
(async()=>{$W __clear(); await w(200); window.__run('mon-toan'); await w(100);
tieuDe('TOÁN — thống kê và xác suất (bản 2.8.0)');
ghi(40,64,'1. Bảng tần số');
kh('bangsl',40,92,714,76);
ghi(40,186,'2. Biểu đồ cột kép');
kh('bdcotkep',30,214,370,270);
ghi(410,186,'3. Biểu đồ hình quạt tròn');
kh('bdquat',410,224,350,230);
ghi(40,500,'4. Biểu đồ tần số ghép nhóm, đa giác tần số');
kh('ghepnhom',30,528,370,270,{dagiac:true});
ghi(410,500,'5. Sơ đồ cây xác suất');
kh('sodocay',410,540,350,220);
__unselect(); await w(600);})()
"@

Shot 'moi-ly' -Page @"
(async()=>{$W __clear(); await w(200); window.__run('mon-li'); await w(100);
tieuDe('VẬT LÍ — mạch điện, thấu kính, đồ thị số liệu (bản 2.8.0)');
ghi(40,64,'1. Mạch điện theo lưới');
kh('machdien',40,92,330,280);
ghi(410,64,'2. Hai điện trở song song');
kh('machsongsong',410,92,330,250);
ghi(40,392,'3. Dựng ảnh qua thấu kính hội tụ');
kh('thaukinh',40,420,700,250);
ghi(40,690,'4. Đồ thị v – t');
kh('sodulieu',30,718,370,260);
ghi(410,690,'5. Số liệu thí nghiệm U – I');
kh('sodulieu2',400,718,370,260);
__unselect(); await w(600);})()
"@

Shot 'moi-hoa' -Page @"
(async()=>{$W __clear(); await w(200); window.__run('mon-hoa'); await w(100);
tieuDe('HOÁ HỌC — phương trình, cấu hình electron, cấu tạo (bản 2.8.0)');
ghi(40,64,'1. Phương trình hoá học (tự cân bằng hệ số)');
const pt=['KMnO4 + HCl -> KCl + MnCl2 + Cl2↑ + H2O','Fe2(SO4)3 + NaOH -> Fe(OH)3↓ + Na2SO4','N2 + H2 <=>[t°, xt, p] NH3','CuSO4.5H2O ->[t°] CuSO4 + H2O'];
pt.forEach((s,i)=>__add('formula',null,{x:60,y:100+i*44,size:19,latex:HoaHoc.latex(HoaHoc.vietLai(s,HoaHoc.canBang(s)))}));
ghi(40,290,'2. Cấu hình electron, ô orbital, lớp vỏ (Fe)');
kh('nguyentu',40,318,420,400);
ghi(480,290,'3. Công thức cấu tạo thu gọn');
kh('cautao',470,330,300,160);
kh('cautao2',470,500,300,80);
kh('cautao',470,600,300,170,{ct:'CH3-C(CH3)2-CH=CH2'});
__unselect(); await w(600);})()
"@

Shot 'moi-sinh' -Page @"
(async()=>{$W __clear(); await w(200); window.__run('mon-sinh'); await w(100);
tieuDe('SINH HỌC — sơ đồ lai, khung Punnett, phả hệ (bản 2.8.0)');
ghi(40,64,'1. Sơ đồ lai hai cặp tính trạng');
kh('sodolai',40,92,714,170);
ghi(40,280,'2. Khung Punnett (tô màu theo kiểu hình)');
kh('punnett',40,310,400,260,{kieuhinh:'A | vàng\na | xanh\nB | trơn\nb | nhăn'});
ghi(460,280,'3. Sơ đồ phả hệ tự xếp thế hệ');
kh('phahe',450,310,320,290);
__unselect(); await w(600);})()
"@

# hộp Phương trình hoá học: gõ như viết tay, bấm Cân bằng hệ số
Shot 'moi-phuong-trinh' @"
(async()=>{$W __clear(); await w(200); window.__run('mon-hoa'); await w(200);
window.__run('ptpu'); await w(300);
const s=document.getElementById('ptsrc'); s.value='Cu + HNO3 -> Cu(NO3)2 + NO↑ + H2O'; s.dispatchEvent(new Event('input')); await w(200);
document.getElementById('ptcb').click(); await w(500);})()
"@

# thanh công cụ khi chọn Vật lí, khung Thuộc tính của hình thấu kính
Shot 'moi-chon-mon' @"
(async()=>{$W __clear(); await w(200); window.__run('mon-li'); await w(300);
kh('thaukinh',40,40,520,280); await w(600);})()
"@
$env:TVS_SHOT_PAGE = $null
# đặt lại môn mặc định cho lần chụp sau
npx electron . "--shot=$tmp" "--eval=window.__run('mon-toan')" 2>$null | Out-Null
