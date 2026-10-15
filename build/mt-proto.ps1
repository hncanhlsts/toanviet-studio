param([string]$Translator = 'Texvc.tdl', [string]$MtefB64 = '')
$ErrorActionPreference = 'Stop'
Add-Type @'
using System; using System.Runtime.InteropServices; using System.Text;
public static class MT6 {
  const string D = @"C:\Program Files (x86)\MathType\System\64\MT6.dll";
  [DllImport(D)] public static extern int MTAPIConnect(short mode, short timeout);
  [DllImport(D)] public static extern int MTAPIDisconnect();
  [DllImport(D)] public static extern int MTXFormReset();
  [DllImport(D, CharSet = CharSet.Ansi)] public static extern int MTXFormSetTranslator(ushort options, string name);
  [DllImport(D)] public static extern int MTXFormEqn(short src, short srcFmt, IntPtr srcData, int srcLen, short dst, short dstFmt, IntPtr dstData, int dstLen, IntPtr dstPath, IntPtr dims);
  [DllImport(D)] public static extern int MTXFormGetStatus(short index);
}
'@
# MTEF tối thiểu cho "x" nếu không truyền dữ liệu
if ($MtefB64) { $mtef = [Convert]::FromBase64String($MtefB64) }
else { $mtef = [byte[]](5,1,0,6,0) + [Text.Encoding]::ASCII.GetBytes('DSMT6') + [byte[]](0,0, 1,0, 2,0,0x83,0x78,0, 0, 0) }
$M = [Runtime.InteropServices.Marshal]
$dims = $M::AllocHGlobal(64); $src = $M::AllocHGlobal($mtef.Length + 16); $M::Copy($mtef, 0, $src, $mtef.Length)
$out = $M::AllocHGlobal(65536); for ($i = 0; $i -lt 65536; $i += 8) { $M::WriteInt64($out, $i, 0) }
"connect: " + [MT6]::MTAPIConnect(1, 30)
"reset: " + [MT6]::MTXFormReset()
"translator: " + [MT6]::MTXFormSetTranslator(0, $Translator)
$r = [MT6]::MTXFormEqn(-3, 4, $src, $mtef.Length, -3, 7, $out, 65536, [IntPtr]::Zero, $dims)
"mtef->text: $r"
"TEXT: " + $M::PtrToStringAnsi($out)
"disconnect: " + [MT6]::MTAPIDisconnect()
