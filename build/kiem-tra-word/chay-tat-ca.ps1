# Kiểm tra với Word THẬT trước khi phát hành (bổ sung cho npm test). Cần đóng mọi cửa sổ Word trước khi chạy.
#   powershell -File build\kiem-tra-word\chay-tat-ca.ps1            (thử mã nguồn trong dự án)
#   powershell -File build\kiem-tra-word\chay-tat-ca.ps1 -Exe "C:\Program Files\ToanViet Studio\ToanViet Studio.exe"   (thử bản đã cài)
param([string]$Exe = '', [int]$Rep = 27)
if (Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }) { 'DỪNG: đang có cửa sổ Word mở. Hãy lưu, đóng Word rồi chạy lại.'; exit 1 }
$all = @()
foreach ($s in '1-phien-word-ngam.ps1', '2-chon-dung-phien.ps1') { & (Join-Path $PSScriptRoot $s); $all += $global:KQ }
& (Join-Path $PSScriptRoot '3-chuyen-hang-loat.ps1') -Rep $Rep -Exe $Exe; $all += $global:KQ
# add-in truyền mã phiên Word: chỉ thử được với bản đã cài (add-in nạp từ thư mục cài)
if ($Exe) { foreach ($s in '4-addin-truyen-ma-phien.ps1', '6-mo-tu-word.ps1') { & (Join-Path $PSScriptRoot $s); $all += $global:KQ } }
$ok = ($all | Where-Object { $_ }).Count
"Kiểm tra với Word: $ok / $($all.Count) đạt"
if ($ok -ne $all.Count) { exit 1 }
