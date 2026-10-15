# Sao lưu mã nguồn thành tệp nén (dùng khi chưa có Git):  powershell -File build\sao-luu.ps1
$root = Split-Path $PSScriptRoot -Parent
$ver = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
$dst = Join-Path (Split-Path $root -Parent) 'ToanVietStudio-luu-tru\ma-nguon'
New-Item -ItemType Directory -Force $dst | Out-Null
$zip = Join-Path $dst ("ToanVietStudio-" + $ver + "-" + (Get-Date -Format 'yyyyMMdd-HHmm') + ".zip")
$items = 'src', 'test', 'build', 'huong-dan', 'office-addin', 'main.js', 'preload.js', 'package.json', 'package-lock.json', 'README.md', '.gitignore' | ForEach-Object { Join-Path $root $_ } | Where-Object { Test-Path $_ }
Compress-Archive -Path $items -DestinationPath $zip -Force
"Đã sao lưu: $zip (" + [math]::Round((Get-Item $zip).Length / 1MB, 1) + " MB)"