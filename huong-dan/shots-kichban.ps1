# Ảnh ví dụ cho "Hướng dẫn lập kịch bản vẽ hình". Chạy từ thư mục dự án:  powershell -File huong-dan\shots-kichban.ps1
Add-Type -AssemblyName System.Drawing
$img = Join-Path $PSScriptRoot 'img'
$tmp = "$env:TEMP\tvs-kb.png"
$js = @'
(async()=>{ __clear();
const E = [
 ['plane','vd-diem',`A = (1, 4)\nB = (0, 0)\nC = (5, 0)\ndagiac ABC`],
 ['plane','vd-dung',`A = (2.2, 4.4)\nB = (0, 0)\nC = (7.5, 0)\ndagiac ABC\nH = chan(A, B, C)\nM = trungdiem(B, C)\nD = phangiac(A, B, C)\ndoan AH AM AD\nvuong AHC\nbang BM MC = 1\ngoc BAD DAC`],
 ['plane','vd-thongso',`a = 6        # Cạnh BC\ngoc_b = 55   # Góc B (độ)\nc = 4        # Cạnh AB\nB = (0, 0)\nC = (a, 0)\nA = tron(B, c, goc_b)\ndagiac ABC\ngoc CBA = ?\nghi AB = ? cm\nghi BC = ? cm`],
 ['plane','vd-sai',`a = 5.6\nb = 3.4\ngoc = 65\nD = (0, 0)\nC = (a, 0)\nA = tron(D, b, goc)\nB = hbh(A, D, C)\ndagiac ABCD\nM = phangiac(B, D, C)\nN = phangiac(D, A, B)\ndoan AM NC\ngoc DAM MAB = ?\ndiem M N`],
 ['plane','vd-dung-hbh',`a = 5.6\nb = 3.4\ngoc = 65\nD = (0, 0)\nC = (a, 0)\nA = tron(D, b, goc)\nB = hbh(A, D, C)\ndagiac ABCD\nM = phangiacgoc(D, A, B, D, C)\nN = phangiacgoc(B, C, D, A, B)\ndoan AM CN\ngoc DAM MAB = ?\ngoc BCN NCD = ?\ndiem M N`],
 ['plane','vd-tron',`r = 2.5      # Bán kính\nO = (0, 0)\nE = (r, 0)\nM = (6, 0)\nA = tiepdiem(M, O, r, 1)\nB = tiepdiem(M, O, r, 2)\nduongtron O E\ndoan MA MB OA OB OM\nvuong OAM\nvuong OBM\nan E\ndiem O`],
 ['plane','vd-bienhinh',`O = (0, 0)\nA = (3, 0.4)\nB = (4.2, 2)\nC = (2, 2.4)\nA1 = quay(A, O, 90)\nB1 = quay(B, O, 90)\nC1 = quay(C, O, 90)\ndagiac ABC\ndoan A1B1 B1C1 C1A1 do\nnetdut OA OA1\ngoc AOA1 = ?\nnhan A1 = A'\nnhan B1 = B'\nnhan C1 = C'\ndiem O`],
 ['plane','vd-vecto',`truc -1 5 -1 4 luoi\nO = (0, 0)\nA = (1, 1)\nB = (4, 3)\nvecto AB = \\overrightarrow{AB} xanh\nvecto OA = \\vec{a} do\nan O`],
 ['space','vd-chop',`a = 4   # Cạnh đáy\nh = 4   # SA\nA = (0, 0, 0)\nB = (a, 0, 0)\nD = (0, a, 0)\nC = (a, a, 0)\nS = (0, 0, h)\ndoan AB BC SA SB SC\nnetdut AD DC SD\nvuong SAB\nvuong SAD`],
 ['space','vd-mp',`O = (0, 0, 0)\nmp P ngang O 8 5\nA = (-0.8, 0.4, 2.6)\nB = (0.9, -0.3, -1.6)\nM = giao(A, B, P)\nduongthang AB = d do\ndiem M\nan O A B`],
 ['space','vd-oxyz',`oxyz\ntruc 4 4.5 4\nO = (0, 0, 0)\nM = (2, 3, 2.5)\ntoado M\nvecto OM = \\vec{u} do`],
];
E.forEach((e,i)=>{ const x=20+(i%3)*258, y=20+Math.floor(i/3)*272; __add(e[0], e[0]==='plane'?'phangiac':'dtcatmp', {x,y,w:248,h:256,script:e[2]}); });
await new Promise(s=>setTimeout(s,1200)); __unselect(); })()
'@
$env:TVS_SHOT_PAGE = '1'
npx electron . "--shot=$tmp" "--eval=$($js -replace "`r?`n", ' ')" 2>$null | Out-Null
$env:TVS_SHOT_PAGE = $null
$names = 'vd-diem','vd-dung','vd-thongso','vd-sai','vd-dung-hbh','vd-tron','vd-bienhinh','vd-vecto','vd-chop','vd-mp','vd-oxyz'
if (-not (Test-Path ($tmp -replace '\.png$', '-after.png'))) { throw 'không chụp được trang' }
$src = [Drawing.Image]::FromFile(($tmp -replace '\.png$', '-after.png'))
$k = $src.Width / 794
for ($i = 0; $i -lt $names.Count; $i++) {
  $x = 20 + ($i % 3) * 258; $y = 20 + [Math]::Floor($i / 3) * 272
  $r = New-Object Drawing.Rectangle ([int]($x * $k)), ([int]($y * $k)), ([int](248 * $k)), ([int](256 * $k))
  $bmp = New-Object Drawing.Bitmap $r.Width, $r.Height
  $g = [Drawing.Graphics]::FromImage($bmp); $g.DrawImage($src, (New-Object Drawing.Rectangle 0, 0, $r.Width, $r.Height), $r, [Drawing.GraphicsUnit]::Pixel); $g.Dispose()
  $bmp.Save((Join-Path $img ($names[$i] + '.png'))); $bmp.Dispose()
}
$src.Dispose()
Copy-Item ($tmp -replace '\.png$', '-after.png') (Join-Path $env:TEMP 'tvs-kb-all.png') -Force
'ok ' + $names.Count