# Chèn công thức ĐI QUA CHÍNH PHẦN MỀM (không gọi tắt vào cầu nối): mở 2 Word, chạy ToanViet với mã phiên của Word 1
# (như add-in truyền), ra lệnh chèn, kiểm tra công thức vào đúng Word 1. Chạy 2 lần: bình thường, và giả lập máy cấm
# chạy tệp .ps1 (ToanViet phải tự chuyển sang cách dự phòng).   -Exe: bản đã cài (mặc định: mã nguồn trong dự án)
param([string]$Exe = '')
. (Join-Path $PSScriptRoot 'chung.ps1')
'7. Chèn qua phần mềm (mã phiên Word, cách chạy cầu nối)'
$ev = Join-Path $dir 'chen.js'
Set-Content $ev -Encoding UTF8 -Value @'
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  await w(1500);
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  __clear(); await w(100);
  const id = __add('formula', null, { latex: 'x^2+1', x: 60, y: 60, size: 16 }); await w(300);
  const r = await window.api.office({ action: 'insert', app: 'word', target: id, data: 'e30=', source: '' });
  console.log('KQ: ' + JSON.stringify(r));
})();
'@
foreach ($loi in @('', '1')) {
  $f1 = Join-Path $dir 'p1.docx'; $f2 = Join-Path $dir 'p2.docx'; NewDocx $f1 'MOT'; NewDocx $f2 'HAI'
  $p1 = OpenWord $f1; $p2 = OpenWord $f2 # cửa sổ 2 nằm trên cùng
  $env:TVS_USERDATA = Join-Path $dir 'ud'; $env:TVS_NO_DEMO = '1'; $env:TVS_TEST_PS_FILE_FAIL = $loi
  $a = @('--office=word', '--mode=full', "--wpid=$($p1.Id)", "--shot=$(Join-Path $dir 'chen.png')", "--evalfile=$ev")
  $o = Join-Path $dir 'chen.out'
  if ($Exe) { $pa = Start-Process $Exe -ArgumentList $a -PassThru -RedirectStandardOutput $o }
  else { $pa = Start-Process (Join-Path $proj 'node_modules\electron\dist\electron.exe') -ArgumentList (@('.') + $a) -PassThru -WorkingDirectory $proj -RedirectStandardOutput $o }
  if (-not $pa.WaitForExit(120000)) { $pa.Kill() }
  $env:TVS_USERDATA = $null; $env:TVS_NO_DEMO = $null; $env:TVS_TEST_PS_FILE_FAIL = $null
  $kq = (Get-Content $o -Encoding UTF8 | Where-Object { $_ -match 'KQ: ' } | Select-Object -Last 1) -replace '.*KQ: ', ''
  $n1 = InWord $f1 { param($d) $d.InlineShapes.Count }; $n2 = InWord $f2 { param($d) $d.InlineShapes.Count }
  $ten = if ($loi) { 'giả lập máy cấm chạy tệp .ps1 (dùng cách dự phòng)' } else { 'bình thường' }
  Check "$ten`: công thức vào đúng Word đã mở ToanViet" ($kq -like '*"ok":true*' -and "$n1" -eq '1' -and "$n2" -eq '0') "kết quả $kq, Word 1 = $n1, Word 2 = $n2"
  CloseWord $f1; CloseWord $f2; StopWord $p1; StopWord $p2
}
