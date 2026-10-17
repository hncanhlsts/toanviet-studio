# Lỗi 2.7.5 "bấm chèn mà trang Word không có gì": máy có một phiên Word chạy ngầm (không cửa sổ) đăng kí trước,
# GetActiveObject trả về phiên đó nên công thức bị chèn vào tài liệu vô hình.
. (Join-Path $PSScriptRoot 'chung.ps1')
'1. Phiên Word chạy ngầm + phiên người dùng đang xem'
$an = Join-Path $dir 'an.docx'; $hien = Join-Path $dir 'hien.docx'
NewDocx $an 'TAI LIEU CHAY NGAM'; NewDocx $hien 'TAI LIEU DANG XEM'
$p1 = OpenWord $an
InWord $an { param($d) $d.Application.Visible = $false } | Out-Null
$p2 = OpenWord $hien
$sh = New-Object -ComObject WScript.Shell; [void]$sh.AppActivate($PID); Start-Sleep 2
$r = Bridge $INS 60
$nAn = InWord $an { param($d) $d.InlineShapes.Count }; $nHien = InWord $hien { param($d) $d.InlineShapes.Count }
Check 'chèn vào tài liệu đang xem, không vào phiên ngầm' ($r -like 'OK*' -and "$nHien" -eq '1' -and "$nAn" -eq '0') "kết quả $r, đang xem $nHien, ngầm $nAn"
CloseWord $hien; StopWord $p2
'   Chỉ còn phiên ngầm'
$r = Bridge $INS 60; $nAn = InWord $an { param($d) $d.InlineShapes.Count }
Check 'chỉ có phiên ngầm: báo lỗi, không chèn' ($r -like '*TVSHIDDEN*' -and "$nAn" -eq '0') "kết quả $r, ngầm $nAn"
InWord $an { param($d) $d.Application.Visible = $true } | Out-Null
CloseWord $an; StopWord $p1
