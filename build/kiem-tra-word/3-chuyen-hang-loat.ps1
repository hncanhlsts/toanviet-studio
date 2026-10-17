# Lỗi 2.7.5 "vết mờ" sau khi chuyển Equation -> ToanViet cho tài liệu nhiều công thức: công thức nằm quá đáy trang
# trong đợt chụp hàng loạt bị chụp trên nền xám. Chạy ĐÚNG chức năng của phần mềm rồi soi từng ảnh được chèn.
#   -Exe: đường dẫn bản đã cài để thử bản cài (mặc định chạy mã nguồn trong dự án)
param([int]$Rep = 27, [string]$Exe = '')
. (Join-Path $PSScriptRoot 'chung.ps1')
"3. Chuyển hàng loạt Equation -> ToanViet ($(8 * $Rep) công thức)"
$doc = Join-Path $dir 'eq.docx'; NewDocx $doc 'Tai lieu thu'
$p = OpenWord $doc
$tao = InWord $doc {
  param($d, $Rep)
  $eq = { param($t) '<m:oMath>' + $t + '</m:oMath>' }
  $R = { param($t) '<m:r><m:t>' + $t + '</m:t></m:r>' }
  $fr = { param($a, $b) '<m:f><m:num>' + $a + '</m:num><m:den>' + $b + '</m:den></m:f>' }
  $sq = { param($a) '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg/><m:e>' + $a + '</m:e></m:rad>' }
  $sup = { param($a, $b) '<m:sSup><m:e>' + $a + '</m:e><m:sup>' + $b + '</m:sup></m:sSup>' }
  $w = { param($t) '<w:r><w:t xml:space="preserve">' + $t + '</w:t></w:r>' }
  $body = ''
  for ($k = 0; $k -lt $Rep; $k++) {
    $body += '<w:p>' + (& $w 'Cho ') + (& $eq ((& $R 'x+') + (& $fr (& $R '1') (& $R '2')))) + (& $w ' va ') + (& $eq (& $sq (& $R ('x+' + $k)))) + (& $w '.') + '</w:p>'
    $body += '<w:p><m:oMathPara>' + (& $eq ((& $R 'y=') + (& $sup (& $R 'x') (& $R '2')) + (& $R ('-' + $k + 'x+1')))) + '</m:oMathPara></w:p>'
    $body += '<w:p>' + (& $w 'Tinh ') + (& $eq ((& $fr ((& $R 'a+') + (& $sq (& $R 'b'))) (& $R '2c')) + (& $R '=0'))) + '</w:p>'
    $body += '<w:p>' + (& $eq (& $R 'a')) + (& $eq (& $R 'b')) + (& $w ' lien nhau, ') + (& $eq (& $sup (& $R 'e') ((& $R 'x+') + (& $fr (& $R '1') (& $R 'n'))))) + '</w:p>'
    $body += '<w:tbl><w:tr><w:tc><w:p>' + (& $eq (& $R ('k=' + $k))) + '</w:p></w:tc><w:tc><w:p>' + (& $w 'o bang ') + (& $eq (& $fr (& $R '3') (& $R '4'))) + '</w:p></w:tc></w:tr></w:tbl><w:p/>'
  }
  $x = '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage"><pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part><pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body>' + $body + '</w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
  $d.Content.InsertXML($x)
  $d.OMaths.Count
} @($Rep)
"   đã tạo $tao công thức Equation"
# chạy phần mềm ở chế độ chuyển đổi (tự đồng ý hộp thoại), y như bấm nút trên ribbon
$auto = Join-Path $dir 'auto.log'; if (Test-Path $auto) { Remove-Item $auto }
$env:TVS_AUTO = $auto; $env:TVS_USERDATA = Join-Path $dir 'ud'
$sw = [Diagnostics.Stopwatch]::StartNew()
if ($Exe) { $pa = Start-Process -FilePath $Exe -ArgumentList '--office=word', '--mode=convert', '--op=eq2tv' -PassThru }
else { $pa = Start-Process -FilePath (Join-Path $proj 'node_modules\electron\dist\electron.exe') -ArgumentList '.', '--office=word', '--mode=convert', '--op=eq2tv' -PassThru -WorkingDirectory $proj }
if (-not $pa.WaitForExit(900000)) { $pa.Kill(); '   (phần mềm không tự đóng)' }
$env:TVS_AUTO = $null; $env:TVS_USERDATA = $null
"   thời gian chuyển: $([int]$sw.Elapsed.TotalSeconds) giây"
$out = Join-Path $dir 'eq-sau.docx'
$sau = InWord $doc { param($d, $out) "$($d.OMaths.Count)|$($d.InlineShapes.Count)"; $d.SaveAs2($out, 16) } @($out)
CloseWord $out; StopWord $p
$sp = "$sau".Split('|')
Check "chuyển hết: còn 0 Equation, có $tao hình" ($sp[0] -eq '0' -and $sp[1] -eq "$tao") "còn $($sp[0]) Equation, $($sp[1]) hình"
# soi ảnh: điểm ảnh "mờ" (không trắng, không đậm) chiếm nhiều là dấu hiệu nền xám / lớp phủ lọt vào ảnh
Add-Type -AssemblyName System.IO.Compression.FileSystem, System.Drawing
$md = Join-Path $dir 'media'; if (Test-Path $md) { Remove-Item $md -Recurse -Force }; New-Item -ItemType Directory $md | Out-Null
$z = [IO.Compression.ZipFile]::OpenRead($out)
$z.Entries | Where-Object { $_.FullName -like 'word/media/*' } | ForEach-Object { [IO.Compression.ZipFileExtensions]::ExtractToFile($_, (Join-Path $md $_.Name)) }
$z.Dispose()
$bad = 0; $n = 0
foreach ($f in Get-ChildItem $md) {
  $b = New-Object Drawing.Bitmap $f.FullName; $n++
  $tot = 0; $faint = 0
  for ($y = 0; $y -lt $b.Height; $y += 2) { for ($x = 0; $x -lt $b.Width; $x += 2) { $c = $b.GetPixel($x, $y); $tot++; $l = ($c.R + $c.G + $c.B) / 3; if ($c.A -gt 20 -and $l -gt 200 -and $l -lt 252) { $faint++ } } }
  if ($faint / [math]::Max(1, $tot) -gt 0.15) { $bad++ }
  $b.Dispose()
}
Check "không ảnh nào có nền xám / vết mờ ($n ảnh)" ($bad -eq 0) "$bad ảnh bị mờ"
