// Thêm xử lý nhấp đúp vào hình ToanViet trong Word / PowerPoint cho add-in COM
const fs = require('fs');
const f = 'office-addin/ToanVietAddin.cs';
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 60)); s = s.replace(a, () => b); };
rep('using System.Runtime.InteropServices;', 'using System.Runtime.InteropServices;\nusing Word = Microsoft.Office.Interop.Word;\nusing PowerPoint = Microsoft.Office.Interop.PowerPoint;');
rep('        private string host = "word";', '        private string host = "word";\n        private object appRef; // giữ tham chiếu để sự kiện nhấp đúp không bị thu hồi');
rep(`                host = name != null && name.IndexOf("PowerPoint", StringComparison.OrdinalIgnoreCase) >= 0 ? "ppt" : "word";
            }
            catch { }`, `                host = name != null && name.IndexOf("PowerPoint", StringComparison.OrdinalIgnoreCase) >= 0 ? "ppt" : "word";
            }
            catch { }
            // Nhấp đúp vào công thức / hình ToanViet: mở lại để sửa (như MathType)
            try
            {
                appRef = Application;
                if (host == "ppt") ((PowerPoint.EApplication_Event)Application).WindowBeforeDoubleClick += PptDoubleClick;
                else ((Word.ApplicationEvents4_Event)Application).WindowBeforeDoubleClick += WordDoubleClick;
            }
            catch { }`);
rep('        public void OnNew(object control) { Launch("new"); }', `        private static bool IsOurs(string alt) { return alt != null && alt.StartsWith("TVS1:", StringComparison.Ordinal); }

        private void WordDoubleClick(Word.Selection Sel, ref bool Cancel)
        {
            try
            {
                string alt = null;
                if (Sel.InlineShapes.Count == 1) alt = Sel.InlineShapes[1].AlternativeText;
                else if (Sel.Type == Word.WdSelectionType.wdSelectionShape && Sel.ShapeRange.Count == 1) alt = Sel.ShapeRange[1].AlternativeText;
                if (IsOurs(alt)) { Cancel = true; Launch("edit"); }
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

        public void OnNew(object control) { Launch("new"); }`);
fs.writeFileSync(f, s);
console.log('addin patched');
