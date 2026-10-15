# Kiểm tra PDF: dựng từng trang thành PNG bằng Windows.Data.Pdf
param([string]$Out, [string]$Pdf = (Join-Path $PSScriptRoot 'Huong-dan-su-dung-ToanViet-Studio.pdf'), [int]$Width = 900)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
$asTaskA = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1
function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(); $t.Result }
$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Pdf)) ([Windows.Storage.StorageFile])
$doc = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
"pages: " + $doc.PageCount
for ($i = 0; $i -lt $doc.PageCount; $i++) {
  $page = $doc.GetPage($i)
  $ms = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $opt = New-Object Windows.Data.Pdf.PdfPageRenderOptions; $opt.DestinationWidth = $Width
  $asTaskA.Invoke($null, @($page.RenderToStreamAsync($ms, $opt))).Wait()
  $s = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($ms.GetInputStreamAt(0))
  $fs = [IO.File]::Create((Join-Path $Out ('p{0:00}.png' -f ($i + 1)))); $s.CopyTo($fs); $fs.Close(); $page.Dispose()
}
