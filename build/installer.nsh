; Đăng ký add-in COM ToanViet cho Word và PowerPoint (cho cả máy, cần quyền quản trị khi cài)
!define TV_CLSID "{5E0B6C2A-3D1F-4B7E-9C84-7A2F1D6E0B93}"

!macro tvRegCom
  WriteRegStr HKLM "Software\Classes\ToanViet.OfficeAddin" "" "ToanViet Office Add-in"
  WriteRegStr HKLM "Software\Classes\ToanViet.OfficeAddin\CLSID" "" "${TV_CLSID}"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}" "" "ToanViet.Connect"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\ProgId" "" "ToanViet.OfficeAddin"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\Implemented Categories\{62C8FE65-4EBB-45e7-B440-6E39B2CDBF29}" "" ""
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "" "mscoree.dll"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "ThreadingModel" "Both"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "Class" "ToanViet.Connect"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "Assembly" "ToanVietAddin, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "RuntimeVersion" "v4.0.30319"
  WriteRegStr HKLM "Software\Classes\CLSID\${TV_CLSID}\InprocServer32" "CodeBase" "file:///$INSTDIR\resources\addin\ToanVietAddin.dll"
!macroend

!macro tvUnregCom
  DeleteRegKey HKLM "Software\Classes\ToanViet.OfficeAddin"
  DeleteRegKey HKLM "Software\Classes\CLSID\${TV_CLSID}"
!macroend

!macro tvRegHost HOST
  WriteRegStr HKLM "Software\Microsoft\Office\${HOST}\Addins\ToanViet.OfficeAddin" "FriendlyName" "ToanViet Studio"
  WriteRegStr HKLM "Software\Microsoft\Office\${HOST}\Addins\ToanViet.OfficeAddin" "Description" "Soan cong thuc Toan, do thi, hinh khong gian bang ToanViet Studio"
  WriteRegDWORD HKLM "Software\Microsoft\Office\${HOST}\Addins\ToanViet.OfficeAddin" "LoadBehavior" 3
!macroend

!macro customInstall
  SetRegView 64
  !insertmacro tvRegCom
  SetRegView 32
  !insertmacro tvRegCom
  !insertmacro tvRegHost "Word"
  !insertmacro tvRegHost "PowerPoint"
  SetRegView 64
  !insertmacro tvRegHost "Word"
  !insertmacro tvRegHost "PowerPoint"
!macroend

!macro customUnInstall
  SetRegView 64
  !insertmacro tvUnregCom
  SetRegView 32
  !insertmacro tvUnregCom
  DeleteRegKey HKLM "Software\Microsoft\Office\Word\Addins\ToanViet.OfficeAddin"
  DeleteRegKey HKLM "Software\Microsoft\Office\PowerPoint\Addins\ToanViet.OfficeAddin"
  SetRegView 64
  DeleteRegKey HKLM "Software\Microsoft\Office\Word\Addins\ToanViet.OfficeAddin"
  DeleteRegKey HKLM "Software\Microsoft\Office\PowerPoint\Addins\ToanViet.OfficeAddin"
!macroend
