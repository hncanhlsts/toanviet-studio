# Kiểm thử: MathType có mở được đối tượng do ToanViet ghi ra không (trên tài liệu tạm, mở chỉ đọc)
param([string]$File = "$env:TEMP\tvs-mt\conv-tv2mt.docx", [int]$Pick = 16, [string]$Shot = "$env:TEMP\tvs-mtwin.png")
Add-Type -ReferencedAssemblies System.Drawing @'
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Drawing;
public class WinX {
  delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  public struct RECT { public int L, T, R, B; }
  public static List<string> Titles(uint pid) { var r = new List<string>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) { var t = new StringBuilder(300); GetWindowText(h, t, 300); if (t.Length > 0) r.Add(t.ToString()); } return true; }, IntPtr.Zero); return r; }
  public static bool Shot(IntPtr h, string file) { RECT rc; GetWindowRect(h, out rc); int w = rc.R - rc.L, ht = rc.B - rc.T; if (w <= 0 || ht <= 0) return false; using (var bmp = new Bitmap(w, ht)) { using (var g = Graphics.FromImage(bmp)) { IntPtr dc = g.GetHdc(); PrintWindow(h, dc, 2); g.ReleaseHdc(dc); } bmp.Save(file); } return true; }
}
'@
$w = New-Object -ComObject Word.Application; $w.Visible = $true; $w.DisplayAlerts = 0
$d = $w.Documents.Open($File, $false, $true)
$n = 0; $s = $null
for ($i = 1; $i -le $d.InlineShapes.Count; $i++) { $pg = ''; try { $pg = $d.InlineShapes.Item($i).OLEFormat.ProgID } catch {}; if ($pg -like 'Equation*') { $n++; if ($n -eq $Pick) { $s = $d.InlineShapes.Item($i) } } }
"MathType objects in doc: $n"
try { $s.OLEFormat.DoVerb(0); "DoVerb(open): ok" } catch { "DoVerb(open) error: " + $_.Exception.Message.Split("`n")[0] }
Start-Sleep 5
$mt = Get-Process MathType -ErrorAction SilentlyContinue
foreach ($p in $mt) { "MathType windows: " + (([WinX]::Titles([uint32]$p.Id)) -join ' | '); if ($p.MainWindowHandle -ne 0) { "screenshot: " + [WinX]::Shot($p.MainWindowHandle, $Shot) } }
if (-not $mt) { "MathType did not start" }
$mt | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
Start-Sleep 2
try { $d.Close([ref]0) } catch { "close: " + $_.Exception.Message.Split("`n")[0] }
try { if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) } } catch {}
