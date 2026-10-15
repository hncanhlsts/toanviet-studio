# Kiểm thử: công thức ToanViet bị mất "văn bản thay thế" (như khi tài liệu đi qua WPS, Google Docs) vẫn sửa được
# nhờ dữ liệu ghi trong ảnh PNG. Chạy trên BẢN SAO một tài liệu có MathType, khi không có cửa sổ Word nào mở.
#   powershell -File build\test-mat-alt.ps1 -Sample "<tệp .docx có MathType>" -Out <thư mục tạm>
param([string]$Sample, [string]$Out, [string]$Proj = (Split-Path $PSScriptRoot))
New-Item -ItemType Directory -Force $Out | Out-Null
if (Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle }) { 'DỪNG: đang có cửa sổ Word mở'; exit 1 }
$exe = "$Proj\node_modules\electron\dist\electron.exe"; $log = Join-Path $Out 'hop-thoai.log'
function W([scriptblock]$sb, [object[]]$a = @(), [int]$sec = 120) {
  $j = Start-Job -ScriptBlock { param($code, $args2) $w = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application'); $d = $w.ActiveDocument; & ([scriptblock]::Create($code)) $w $d @args2 } -ArgumentList $sb.ToString(), $a
  if (Wait-Job $j -Timeout $sec) { Receive-Job $j } else { "  (Word không trả lời sau $sec giây)"; Stop-Job $j }
  Remove-Job $j -Force
}
function RunApp($argsList) {
  if (Test-Path $log) { [IO.File]::Delete($log) }
  $env:TVS_AUTO = $log; $env:TVS_USERDATA = (Join-Path $Out 'ud')
  $p = Start-Process -FilePath $exe -ArgumentList $argsList -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
  if (-not $p.WaitForExit(300000)) { $p.Kill(); '  (phần mềm không tự đóng)' }
  $env:TVS_AUTO = $null; $env:TVS_USERDATA = $null
  if (Test-Path $log) { Get-Content $log -Encoding UTF8 | ForEach-Object { '  hộp thoại: ' + $_ } }
}
$COUNT = { param($w, $d) $tv = 0; $pic = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { $s = $d.InlineShapes.Item($i); if ("$($s.AlternativeText)".StartsWith('TVS1:')) { $tv++ } elseif ($s.Type -eq 3) { $pic++ } }; "   có văn bản thay thế ToanViet: $tv · ảnh không có văn bản thay thế: $pic · Equation: $($d.OMaths.Count)" }

$copy = Join-Path $Out 'ban-sao.docx'; Copy-Item -LiteralPath $Sample -Destination $copy -Force
$j = Start-Job -ArgumentList $copy { param($f) $w = New-Object -ComObject Word.Application; $w.Visible = $true; $w.DisplayAlerts = 0; [void]$w.Documents.Open($f); $w.WindowState = 2; 'ok' }
[void](Wait-Job $j -Timeout 120); Remove-Job $j -Force; Start-Sleep 2
'1) MathType → ToanViet'; RunApp @('.', '--office=word', '--mode=convert', '--op=mt2tv'); W $COUNT
'2) Xoá văn bản thay thế của mọi hình (giả lập tài liệu đi qua phần mềm khác), lưu rồi mở lại'
W { param($w, $d, $f) for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { $d.InlineShapes.Item($i).AlternativeText = '' }; $d.SaveAs2($f, 16); $d.Close(); [void]$w.Documents.Open($f); 'ok' } @((Join-Path $Out 'mat-alt.docx'))
W $COUNT
'3) Chọn hình thứ 2 rồi mở sửa (như nhấp đúp / Ctrl+Alt+E)'
W { param($w, $d) $n = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { if ($d.InlineShapes.Item($i).Type -eq 3) { $n++; if ($n -eq 2) { $d.InlineShapes.Item($i).Select(); return 'đã chọn' } } } }
$js = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); localStorage.setItem('tvs-insert-eq','0'); await w(3500); const m=document.getElementById('mf'); console.log('READ:'+(m?m.value:'')); m.executeCommand('moveToMathfieldEnd'); m.insert('+1'); m.dispatchEvent(new Event('input')); await w(300); document.getElementById('fxok').click(); await w(9000);})()"
RunApp @('.', '--office=word', '--mode=edit', "--shot=$Out\edit.png", "`"--eval=$js`"")
$rd = Select-String -Path "$log.out" -Pattern 'READ:' -Encoding UTF8 | Select-Object -First 1
'   ' + $(if ($rd) { $rd.Line -replace '^.*READ:', 'đọc được: ' } else { 'KHÔNG đọc được' })
W $COUNT
'4) ToanViet → Equation (tìm cả hình đã mất văn bản thay thế)'; RunApp @('.', '--office=word', '--mode=convert', '--op=tv2eq'); W $COUNT
W { param($w, $d) $d.Close(0); if ($w.Documents.Count -eq 0) { $w.Quit(0) }; '   đã đóng Word thử' }
