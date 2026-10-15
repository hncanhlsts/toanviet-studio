# Chụp thẻ ToanViet trong Word (mở một tài liệu tạm, không đụng tới tài liệu nào khác)
param([string]$Out = (Join-Path $PSScriptRoot 'img\word-ribbon.png'))
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
Add-Type -ReferencedAssemblies System.Drawing @'
using System; using System.Runtime.InteropServices; using System.Drawing;
public class WShot {
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  public struct RECT { public int L, T, R, B; }
  public static string Shot(IntPtr h, string file, int cropH) { RECT rc; GetWindowRect(h, out rc); int w = rc.R - rc.L, ht = rc.B - rc.T; if (w <= 0 || ht <= 0) return "no rect";
    using (var bmp = new Bitmap(w, ht)) { using (var g = Graphics.FromImage(bmp)) { IntPtr dc = g.GetHdc(); PrintWindow(h, dc, 2); g.ReleaseHdc(dc); }
      int ch = Math.Min(cropH, ht); int y0 = Math.Min(78, ht - 10); ch = Math.Min(cropH, ht - y0); using (var c = bmp.Clone(new Rectangle(0, y0, w, ch), bmp.PixelFormat)) { c.Save(file); } }
    return w + "x" + ht; }
}
'@
$w = New-Object -ComObject Word.Application; $w.Visible = $true; $w.WindowState = 0
$d = $w.Documents.Add(); $w.Left = 40; $w.Top = 40; $w.Width = 900; $w.Height = 640
$w.Selection.Font.Size = 13
$w.Selection.TypeText('Bấm nút trên thẻ ToanViet để chèn công thức, đồ thị, hình vẽ vào đúng chỗ con trỏ.')
Start-Sleep 3
$hwnd = [IntPtr]$w.ActiveWindow.Hwnd
try {
  $root = [Windows.Automation.AutomationElement]::FromHandle($hwnd)
  $cond = New-Object Windows.Automation.AndCondition((New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::NameProperty, 'ToanViet')), (New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ControlTypeProperty, [Windows.Automation.ControlType]::TabItem)))
  $tab = $root.FindFirst([Windows.Automation.TreeScope]::Descendants, $cond)
  if ($tab) { $tab.GetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern).Select(); "tab selected" } else { "tab ToanViet not found" }
} catch { "uia error: " + $_.Exception.Message }
Start-Sleep 2
"shot: " + [WShot]::Shot($hwnd, $Out, 290)
try { if ($min) { $w.CommandBars.ExecuteMso("MinimizeRibbon") } } catch {}
$d.Close([ref]0); if ($w.Documents.Count -eq 0) { $w.Quit([ref]0) }
