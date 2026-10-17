# Xem bằng mắt: công thức ToanViet trong dòng chữ Word (đứng đúng chân chữ, không giãn dòng, hệ "hoặc" không thừa khoảng trống).
# Tạo tài liệu có mã LaTeX, chuyển bằng chức năng LaTeX -> ToanViet, xuất PDF để xem.  -Exe: bản đã cài
param([string]$Exe = '')
. (Join-Path $PSScriptRoot 'chung.ps1')
'5. Công thức trong dòng chữ Word'
$doc = Join-Path $dir 'dong-chu.docx'
$texts = @(
  'b) Ta có $A=[-4;2)$ và $B=(m-1;m+5]$. Hai tập hợp không có phần tử chung khi $B$ nằm hoàn toàn bên trái hoặc hoàn toàn bên phải $A$ trên trục số. Vì $-4\in A$ và $m+5\in B$, còn $2\notin A$ và $m-1\notin B$ nên',
  '$$A\cap B=\varnothing\Leftrightarrow\left[\begin{array}{l}m+5<-4\\m-1\ge 2\end{array}\right.\Leftrightarrow\left[\begin{array}{l}m<-9\\m\ge 3.\end{array}\right.$$',
  'Hệ $\left\{\begin{array}{l}x+y=3\\x-y=1\end{array}\right.$ có nghiệm $x=2$, $y=1$; phân số $\frac{1}{2}$, căn $\sqrt{x+1}$, mũ $x^{2}$, chỉ số $a_{n}$, vectơ $\overrightarrow{AB}$, góc $\widehat{ABC}=60^{\circ}$ trong cùng một dòng chữ để xem khoảng cách dòng.'
)
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
if (Test-Path $doc) { Remove-Item $doc -Force }
$z = [IO.Compression.ZipFile]::Open($doc, 'Create')
$put = { param($n, $c) $e = $z.CreateEntry($n); $w = New-Object IO.StreamWriter($e.Open(), (New-Object Text.UTF8Encoding $false)); $w.Write($c); $w.Close() }
& $put '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
& $put '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
$ps = ($texts | ForEach-Object { '<w:p><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/>' + $(if ($_.StartsWith('$$')) { '<w:jc w:val="center"/>' }) + '</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="26"/></w:rPr><w:t xml:space="preserve">' + [Security.SecurityElement]::Escape($_) + '</w:t></w:r></w:p>' }) -join ''
& $put 'word/document.xml' ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + $ps + '</w:body></w:document>')
$z.Dispose()
$p = OpenWord $doc
$auto = Join-Path $dir 'auto5.log'; if (Test-Path $auto) { Remove-Item $auto }
$env:TVS_AUTO = $auto; $env:TVS_USERDATA = Join-Path $dir 'ud'
if ($Exe) { $pa = Start-Process -FilePath $Exe -ArgumentList '--office=word', '--mode=convert', '--op=tex2tv' -PassThru }
else { $pa = Start-Process -FilePath (Join-Path $proj 'node_modules\electron\dist\electron.exe') -ArgumentList '.', '--office=word', '--mode=convert', '--op=tex2tv' -PassThru -WorkingDirectory $proj }
if (-not $pa.WaitForExit(300000)) { $pa.Kill() }
$env:TVS_AUTO = $null; $env:TVS_USERDATA = $null
if (Test-Path $auto) { Get-Content $auto -Encoding UTF8 | ForEach-Object { '   ' + $_ } }
$pdf = Join-Path $dir 'dong-chu.pdf'
InWord $doc { param($d, $pdf) "   $($d.InlineShapes.Count) hình"; $d.ExportAsFixedFormat($pdf, 17) } @($pdf)
CloseWord $doc; StopWord $p
"   PDF: $pdf"
