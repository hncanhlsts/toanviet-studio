// Add-in COM cho Word / PowerPoint: thêm thẻ "ToanViet" trên ribbon, bấm nút thì mở ToanViet Studio.
// Phần mềm tự chèn kết quả vào tài liệu rồi đóng lại (kiểu MathType).
// Biên dịch (nhúng kiểu Office, không cần thư viện ngoài khi chạy):
//   csc /target:library /platform:anycpu /out:ToanVietAddin.dll /link:<GAC>Microsoft.Office.Interop.Word.dll /link:<GAC>Microsoft.Office.Interop.PowerPoint.dll /link:<GAC>office.dll /r:System.Windows.Forms.dll ToanVietAddin.cs
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using Word = Microsoft.Office.Interop.Word;
using PowerPoint = Microsoft.Office.Interop.PowerPoint;

[assembly: AssemblyTitle("ToanViet Office Add-in")]
[assembly: AssemblyVersion("1.0.0.0")]

namespace ToanViet
{
    [ComImport, Guid("B65AD801-ABAF-11D0-BB8B-00A0C90F2744"), InterfaceType(ComInterfaceType.InterfaceIsDual)]
    public interface IDTExtensibility2
    {
        [DispId(1)] void OnConnection([In, MarshalAs(UnmanagedType.IDispatch)] object Application, [In] int ConnectMode, [In, MarshalAs(UnmanagedType.IDispatch)] object AddInInst, [In, MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_VARIANT)] ref Array custom);
        [DispId(2)] void OnDisconnection([In] int RemoveMode, [In, MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_VARIANT)] ref Array custom);
        [DispId(3)] void OnAddInsUpdate([In, MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_VARIANT)] ref Array custom);
        [DispId(4)] void OnStartupComplete([In, MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_VARIANT)] ref Array custom);
        [DispId(5)] void OnBeginShutdown([In, MarshalAs(UnmanagedType.SafeArray, SafeArraySubType = VarEnum.VT_VARIANT)] ref Array custom);
    }

    [ComImport, Guid("000C0396-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsDual)]
    public interface IRibbonExtensibility
    {
        [DispId(1)] string GetCustomUI([In] string RibbonID);
    }

    [ComVisible(true), Guid("5E0B6C2A-3D1F-4B7E-9C84-7A2F1D6E0B93"), ProgId("ToanViet.OfficeAddin"), ClassInterface(ClassInterfaceType.AutoDispatch)]
    public class Connect : IDTExtensibility2, IRibbonExtensibility
    {
        private string host = "word";
        private object appRef; // giữ tham chiếu để sự kiện nhấp đúp không bị thu hồi

        // Phím tắt trong Word / PowerPoint: Ctrl+Alt+Q công thức mới, Ctrl+Alt+E sửa đối tượng đang chọn, Ctrl+Alt+G đồ thị/bảng/hình
        private delegate IntPtr HookProc(int code, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] private static extern IntPtr SetWindowsHookEx(int idHook, HookProc proc, IntPtr hMod, uint threadId);
        [DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr hook);
        [DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr hook, int code, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] private static extern short GetKeyState(int vk);
        [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
        private HookProc hookProc;
        private IntPtr hook = IntPtr.Zero;
        private DateTime lastHot = DateTime.MinValue;

        private IntPtr KeyHook(int code, IntPtr wParam, IntPtr lParam)
        {
            try
            {
                if (code >= 0 && (lParam.ToInt64() & 0x80000000L) == 0 && GetKeyState(0x11) < 0 && GetKeyState(0x12) < 0 && GetKeyState(0x10) >= 0)
                {
                    int vk = wParam.ToInt32();
                    string mode = vk == 0x51 ? "new" : vk == 0x45 ? "edit" : vk == 0x47 ? "full" : null;
                    if (mode != null)
                    {
                        if ((DateTime.Now - lastHot).TotalMilliseconds > 700) { lastHot = DateTime.Now; Launch(mode); }
                        return (IntPtr)1; // không chuyển phím này cho Word nữa
                    }
                }
            }
            catch { }
            return CallNextHookEx(hook, code, wParam, lParam);
        }

        public void OnConnection(object Application, int ConnectMode, object AddInInst, ref Array custom)
        {
            try
            {
                string name = (string)Application.GetType().InvokeMember("Name", BindingFlags.GetProperty, null, Application, null);
                host = name != null && name.IndexOf("PowerPoint", StringComparison.OrdinalIgnoreCase) >= 0 ? "ppt" : "word";
            }
            catch { }
            // Nhấp đúp vào công thức / hình ToanViet: mở lại để sửa (như MathType)
            try
            {
                appRef = Application;
                if (host == "ppt") ((PowerPoint.EApplication_Event)Application).WindowBeforeDoubleClick += PptDoubleClick;
                else ((Word.ApplicationEvents4_Event)Application).WindowBeforeDoubleClick += WordDoubleClick;
            }
            catch { }
            try { hookProc = KeyHook; hook = SetWindowsHookEx(2 /* WH_KEYBOARD */, hookProc, IntPtr.Zero, GetCurrentThreadId()); } catch { }
        }
        public void OnDisconnection(int RemoveMode, ref Array custom) { try { if (hook != IntPtr.Zero) { UnhookWindowsHookEx(hook); hook = IntPtr.Zero; } } catch { } }
        public void OnAddInsUpdate(ref Array custom) { }
        public void OnStartupComplete(ref Array custom) { }
        public void OnBeginShutdown(ref Array custom) { }

        public string GetCustomUI(string RibbonID)
        {
            bool ppt = RibbonID != null && RibbonID.IndexOf("PowerPoint", StringComparison.OrdinalIgnoreCase) >= 0;
            if (ppt) host = "ppt";
            string edit = "<button id=\"{0}\" label=\"Sửa bằng ToanViet\" imageMso=\"EquationInsertGallery\" onAction=\"OnEdit\"/>";
            string menus = ppt
                ? "<contextMenu idMso=\"ContextMenuPicture\">" + string.Format(edit, "tvCtxPic") + "</contextMenu>"
                : "<contextMenu idMso=\"ContextMenuInlinePicture\">" + string.Format(edit, "tvCtxInline") + "</contextMenu>" +
                  "<contextMenu idMso=\"ContextMenuPicture\">" + string.Format(edit, "tvCtxPic") + "</contextMenu>";
            string conv = ppt ? "" :
                "<group id=\"tvConv\" label=\"Thống nhất định dạng công thức\">" +
                "<button id=\"tvMt2Tv\" label=\"MathType → ToanViet\" imageMso=\"EquationInsertGallery\" onAction=\"OnMt2Tv\" screentip=\"Chuyển toàn bộ công thức MathType sang ToanViet\" supertip=\"Tìm mọi công thức MathType trong tài liệu và thay bằng công thức ToanViet tương ứng. Hoàn tác bằng Ctrl+Z.\"/>" +
                "<button id=\"tvTv2Mt\" label=\"ToanViet → MathType\" imageMso=\"EquationOptions\" onAction=\"OnTv2Mt\" screentip=\"Chuyển toàn bộ công thức ToanViet sang MathType\" supertip=\"Thay mọi công thức ToanViet trong tài liệu bằng đối tượng MathType. Hoàn tác bằng Ctrl+Z.\"/>" +
                "<button id=\"tvEq2Tv\" label=\"Equation → ToanViet\" imageMso=\"EquationInsertGallery\" onAction=\"OnEq2Tv\" screentip=\"Chuyển toàn bộ công thức Equation của Word sang ToanViet\" supertip=\"Tìm mọi công thức Equation trong tài liệu và thay bằng công thức ToanViet tương ứng. Hoàn tác bằng Ctrl+Z.\"/>" +
                "<button id=\"tvTv2Eq\" label=\"ToanViet → Equation\" imageMso=\"EquationOptions\" onAction=\"OnTv2Eq\" screentip=\"Chuyển toàn bộ công thức ToanViet sang Equation của Word\" supertip=\"Thay mọi công thức ToanViet trong tài liệu bằng công thức Equation của Word. Hoàn tác bằng Ctrl+Z.\"/>" +
                "<button id=\"tvTex2Tv\" label=\"LaTeX → ToanViet\" imageMso=\"EquationInsertGallery\" onAction=\"OnTex2Tv\" screentip=\"Chuyển mã LaTeX trong tài liệu sang công thức ToanViet\" supertip=\"Dành cho nội dung dán từ các trợ lí AI: mọi đoạn $...$, $$...$$, \\(...\\), \\[...\\] được thay bằng công thức ToanViet. Hoàn tác bằng Ctrl+Z.\"/>" +
                "<button id=\"tvTv2Tex\" label=\"ToanViet → LaTeX\" imageMso=\"EquationOptions\" onAction=\"OnTv2Tex\" screentip=\"Chuyển toàn bộ công thức ToanViet thành mã LaTeX\" supertip=\"Thay mọi công thức ToanViet trong tài liệu bằng mã LaTeX đặt giữa hai dấu $. Hoàn tác bằng Ctrl+Z.\"/>" +
                "</group>";
            return "<customUI xmlns=\"http://schemas.microsoft.com/office/2009/07/customui\"><ribbon><tabs>" +
                "<tab id=\"tvTab\" label=\"ToanViet\"><group id=\"tvGroup\" label=\"ToanViet Studio\">" +
                "<button id=\"tvNew\" label=\"Công thức mới\" keytip=\"Q\" size=\"large\" imageMso=\"EquationInsertGallery\" onAction=\"OnNew\" screentip=\"Công thức mới (Ctrl+Alt+Q)\" supertip=\"Mở ToanViet Studio để soạn công thức. Ctrl+Enter chèn và tự đóng, Esc đóng không chèn. Sửa công thức đã có: nhấp đúp vào nó hoặc bấm Ctrl+Alt+E.\"/>" +
                "<button id=\"tvFull\" label=\"Đồ thị, bảng, hình\" size=\"large\" imageMso=\"ChartInsert\" onAction=\"OnFull\" screentip=\"Đồ thị, bảng biến thiên, miền nghiệm, hình không gian (Ctrl+Alt+G)\" supertip=\"Mở đầy đủ ToanViet Studio để dựng hình rồi chèn vào tài liệu.\"/>" +
                "</group>" + conv + "</tab></tabs></ribbon><contextMenus>" + menus + "</contextMenus></customUI>";
        }

        private static bool IsOurs(string alt) { return alt != null && alt.StartsWith("TVS1:", StringComparison.Ordinal); }

        private void WordDoubleClick(Word.Selection Sel, ref bool Cancel)
        {
            try
            {
                string alt = null;
                bool ours = false;
                if (Sel.InlineShapes.Count == 1)
                {
                    Word.InlineShape ish = Sel.InlineShapes[1];
                    alt = ish.AlternativeText;
                    ours = IsOurs(alt);
                }
                else if (Sel.Type == Word.WdSelectionType.wdSelectionShape && Sel.ShapeRange.Count == 1) ours = IsOurs(Sel.ShapeRange[1].AlternativeText);
                if (ours) { Cancel = true; Launch("edit"); }
            }
            catch { }
        }

        private void PptDoubleClick(PowerPoint.Selection Sel, ref bool Cancel)
        {
            try
            {
                if (Sel.Type == PowerPoint.PpSelectionType.ppSelectionShapes && Sel.ShapeRange.Count == 1 && IsOurs(Sel.ShapeRange[1].AlternativeText)) { Cancel = true; Launch("edit"); }
            }
            catch { }
        }

        public void OnNew(object control) { Launch("new"); }
        public void OnMt2Tv(object control) { Launch("convert", " --op=mt2tv"); }
        public void OnTv2Mt(object control) { Launch("convert", " --op=tv2mt"); }
        public void OnEq2Tv(object control) { Launch("convert", " --op=eq2tv"); }
        public void OnTv2Eq(object control) { Launch("convert", " --op=tv2eq"); }
        public void OnTex2Tv(object control) { Launch("convert", " --op=tex2tv"); }
        public void OnTv2Tex(object control) { Launch("convert", " --op=tv2tex"); }
        public void OnEdit(object control) { Launch("edit"); }
        public void OnFull(object control) { Launch("full"); }

        private void Launch(string mode) { Launch(mode, ""); }
        private void Launch(string mode, string more)
        {
            try
            {
                // DLL nằm ở <thư mục cài>\resources\addin, chương trình ở <thư mục cài>
                string dir = Path.GetDirectoryName(new Uri(Assembly.GetExecutingAssembly().CodeBase).LocalPath);
                string exe = Path.GetFullPath(Path.Combine(dir, "..", "..", "ToanViet Studio.exe"));
                if (!File.Exists(exe)) { System.Windows.Forms.MessageBox.Show("Không tìm thấy ToanViet Studio:\n" + exe, "ToanViet"); return; }
                // cỡ chữ tại con trỏ trong Word để công thức mới khớp với dòng văn bản
                string extra = "";
                if (host == "word")
                {
                    try { float fs = ((Word.Application)appRef).Selection.Font.Size; if (fs >= 5 && fs <= 200) extra = " --size=" + fs.ToString(CultureInfo.InvariantCulture); } catch { }
                    // báo ngay trên thanh trạng thái của Word: lần đầu mở máy, ToanViet có thể cần vài giây để khởi động
                    try { ((Word.Application)appRef).StatusBar = mode == "edit" ? "ToanViet Studio đang mở công thức để sửa…" : mode == "convert" ? "ToanViet Studio đang chuyển đổi công thức…" : "ToanViet Studio đang mở…"; } catch { }
                }
                Process.Start(new ProcessStartInfo(exe, "--office=" + host + " --mode=" + mode + extra + more) { UseShellExecute = false });
            }
            catch (Exception ex) { System.Windows.Forms.MessageBox.Show(ex.Message, "ToanViet"); }
        }
    }
}
