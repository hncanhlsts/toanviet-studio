# Kiểm thử vòng chuyển đổi trên BẢN SAO của một tài liệu Word (tài liệu gốc không bị mở, không bị sửa).
# Chạy khi không có Word nào đang mở:  powershell -File build\test-chuyendoi.ps1 -Sample "<tệp .docx có MathType>" -Out <thư mục tạm>
# Mỗi thao tác với Word chạy trong một tiến trình con có giới hạn thời gian (tránh treo khi Word bận).
param([string]$Sample, [string]$Out, [string]$Proj = (Split-Path $PSScriptRoot), [int]$EditCount = 2)
$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force $Out | Out-Null
if (Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle }) { 'DỪNG: đang có cửa sổ Word mở. Hãy đóng Word rồi chạy lại.'; exit 1 }
$exe = "$Proj\node_modules\electron\dist\electron.exe"
$log = Join-Path $Out 'hop-thoai.log'
$ud = Join-Path $Out 'ud'
# chạy một đoạn lệnh với Word đang mở (lấy qua GetActiveObject) trong tiến trình con
function W([scriptblock]$sb, [object[]]$a = @(), [int]$sec = 120) {
  $j = Start-Job -ScriptBlock { param($code, $args2) $w = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application'); $d = $w.ActiveDocument; & ([scriptblock]::Create($code)) $w $d @args2 } -ArgumentList $sb.ToString(), $a
  if (Wait-Job $j -Timeout $sec) { Receive-Job $j } else { "  (Word không trả lời sau $sec giây)"; Stop-Job $j }
  Remove-Job $j -Force
}
function RunApp($argsList) {
  if (Test-Path $log) { [IO.File]::Delete($log) }
  $env:TVS_AUTO = $log; $env:TVS_USERDATA = $ud
  $p = Start-Process -FilePath $exe -ArgumentList $argsList -PassThru -WorkingDirectory $Proj -RedirectStandardOutput "$log.out" -RedirectStandardError "$log.err"
  if (-not $p.WaitForExit(300000)) { $p.Kill(); '  (phần mềm không tự đóng)' }
  $env:TVS_AUTO = $null; $env:TVS_USERDATA = $null
  if (Test-Path $log) { Get-Content $log -Encoding UTF8 | ForEach-Object { '  hộp thoại: ' + $_ } }
}
function Convert1($op) { RunApp @('.', '--office=word', '--mode=convert', "--op=$op") }
$COUNT = {
  param($w, $d)
  $mt = 0; $tv = 0
  for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { $s = $d.InlineShapes.Item($i); $pg = ''; try { $pg = $s.OLEFormat.ProgID } catch {}; if ($pg -like 'Equation*') { $mt++ }; if ("$($s.AlternativeText)".StartsWith('TVS1:')) { $tv++ } }
  "   MathType $mt · ToanViet $tv · Equation $($d.OMaths.Count)"
}
# đọc dữ liệu ToanViet trong từng hình (giống hệt cách phần mềm đọc khi nhấp đúp để sửa)
$CHECK = {
  param($w, $d, $tag, $out)
  $ok = 0; $bad = @(); $lat = @()
  for ($i = 1; $i -le $d.InlineShapes.Count; $i++) {
    $al = "$($d.InlineShapes.Item($i).AlternativeText)"
    if (-not $al.StartsWith('TVS1:')) { continue }
    try { $o = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($al.Substring(5))) | ConvertFrom-Json; if ($o.type -eq 'formula' -and "$($o.latex)".Trim()) { $ok++; $lat += $o.latex } else { $bad += "#$i rỗng" } }
    catch { $bad += "#$i (độ dài $($al.Length)): $($_.Exception.Message.Split("`n")[0])" }
  }
  "   [$tag] đọc lại được $ok hình ToanViet; hỏng $($bad.Count)"
  $bad | Select-Object -First 5 | ForEach-Object { '     ' + $_ }
  [IO.File]::WriteAllLines((Join-Path $out "latex-$tag.txt"), [string[]]$lat, (New-Object Text.UTF8Encoding $false))
}
# mở một hình ToanViet để sửa như khi nhấp đúp: đọc công thức, thêm "+1", chèn lại
function EditOne($k) {
  $r = W { param($w, $d, $k) $n = 0; for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { if ("$($d.InlineShapes.Item($i).AlternativeText)".StartsWith('TVS1:')) { $n++; if ($n -eq $k) { $d.InlineShapes.Item($i).Select(); return 'ok' } } }; 'none' } @($k)
  if ($r -ne 'ok') { "   sửa hình thứ ${k}: không có hình"; return }
  $js = "(async()=>{const w=t=>new Promise(s=>setTimeout(s,t)); localStorage.setItem('tvs-insert-eq','0'); await w(3500); const m=document.getElementById('mf'); console.log('READ:'+(m?m.value:'(không có ô soạn)')); m.executeCommand('moveToMathfieldEnd'); m.insert('+1'); m.dispatchEvent(new Event('input')); await w(300); document.getElementById('fxok').click(); await w(9000);})()"
  RunApp @('.', '--office=word', '--mode=edit', "--shot=$Out\edit$k.png", "`"--eval=$js`"")
  $rd = Select-String -Path "$log.out" -Pattern 'READ:' -Encoding UTF8 | Select-Object -First 1
  "   sửa hình thứ ${k}: " + $(if ($rd) { $rd.Line -replace '^.*READ:', 'đọc được ' } else { 'KHÔNG đọc được' })
}

$copy = Join-Path $Out 'ban-sao.docx'; Copy-Item -LiteralPath $Sample -Destination $copy -Force
$j = Start-Job -ArgumentList $copy { param($f) $w = New-Object -ComObject Word.Application; $w.Visible = $true; $w.DisplayAlerts = 0; [void]$w.Documents.Open($f); $w.WindowState = 2; 'ok' }
[void](Wait-Job $j -Timeout 120); Remove-Job $j -Force
Start-Sleep 2
'1) Tài liệu gốc (bản sao)'; W $COUNT
'2) MathType → ToanViet'; Convert1 'mt2tv'; W $COUNT; W $CHECK @('mt2tv', $Out)
'3) Mở sửa công thức ToanViet vừa chuyển (như nhấp đúp)'
foreach ($k in 1..$EditCount) { EditOne $k }
W $CHECK @('sau-sua', $Out)
'4) Lưu, đóng, mở lại tệp rồi đọc lại dữ liệu'
W { param($w, $d, $f) $d.SaveAs2($f, 16); $d.Close(); [void]$w.Documents.Open($f); '   đã lưu và mở lại' } @((Join-Path $Out 'sau-mt2tv.docx'))
W $CHECK @('mo-lai', $Out)
'5) ToanViet → Equation của Word'; Convert1 'tv2eq'; W $COUNT
'6) Equation → ToanViet'; Convert1 'eq2tv'; W $COUNT; W $CHECK @('eq2tv', $Out)
'7) ToanViet → MathType'; Convert1 'tv2mt'; W $COUNT
W { param($w, $d, $f) $d.SaveAs2($f, 16); '   đã lưu ' + $f } @((Join-Path $Out 'sau-tv2mt.docx'))
'8) MathType (do ToanViet ghi) → ToanViet lần nữa'; Convert1 'mt2tv'; W $COUNT; W $CHECK @('vong2', $Out)
W { param($w, $d) $d.Close(0); if ($w.Documents.Count -eq 0) { $w.Quit(0) }; '   đã đóng Word thử' }
