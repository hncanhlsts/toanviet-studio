# Hai cửa sổ Word cùng mở: chèn đúng phiên đã gọi ToanViet (mã tiến trình TVS_WPID do add-in truyền),
# không có mã thì chèn vào cửa sổ Word nằm trên cùng.
. (Join-Path $PSScriptRoot 'chung.ps1')
'2. Hai cửa sổ Word cùng mở'
$f1 = Join-Path $dir 'w1.docx'; $f2 = Join-Path $dir 'w2.docx'; NewDocx $f1 'MOT'; NewDocx $f2 'HAI'
$p1 = OpenWord $f1; $p2 = OpenWord $f2
$e = $INS.Clone(); $e.TVS_WPID = "$($p1.Id)"
$r = Bridge $e 60
$n1 = InWord $f1 { param($d) $d.InlineShapes.Count }; $n2 = InWord $f2 { param($d) $d.InlineShapes.Count }
Check 'có mã phiên: chèn vào đúng Word đã mở ToanViet (cửa sổ 1, dù cửa sổ 2 nằm trên)' ($r -like 'OK*' -and "$n1" -eq '1' -and "$n2" -eq '0') "kết quả $r, cửa sổ 1 = $n1, cửa sổ 2 = $n2"
$r = Bridge $INS 60
$n2b = InWord $f2 { param($d) $d.InlineShapes.Count }
Check 'không có mã phiên: chèn vào cửa sổ Word trên cùng' ($r -like 'OK*' -and "$n2b" -eq '1') "kết quả $r, cửa sổ 2 = $n2b"
CloseWord $f1; CloseWord $f2; StopWord $p1; StopWord $p2
