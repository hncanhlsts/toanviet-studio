// v1.5: cỡ chữ theo point của Word (mặc định 12), phím tắt mở/đóng, nhận diện công thức Equation và MathType
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};

// ---------------- app.js ----------------
let f = mk('src/app.js');
f.rep("case 'formula': return { latex: '', size: 22, color: '#000000' };", "case 'formula': return { latex: '', size: 16, color: '#000000' }; // 16px = cỡ 12 của Word");
f.rep("const fSt = { size: 22, color: '#000000', bold: false };", "const fSt = { size: 16, color: '#000000', bold: false };\n  // Cỡ chữ hiển thị theo point như Word (12 pt = 16 px trên trang)\n  const toPt = (px) => Math.round(px * 0.75 * 2) / 2, toPx = (pt) => pt / 0.75;");
f.rep(`    const sel = $('#fSize');
    if (![...sel.options].some((o) => +o.value === fSt.size)) { const o = document.createElement('option'); o.value = o.textContent = fSt.size; sel.append(o); }
    sel.value = fSt.size;`, `    const sel = $('#fSize'), pt = toPt(fSt.size);
    if (![...sel.options].some((o) => +o.value === pt)) { const o = document.createElement('option'); o.value = o.textContent = pt; sel.append(o); }
    sel.value = pt;`);
f.rep("$('#fSize').addEventListener('change', (e) => { fSt.size = +e.target.value; syncF(); });", "$('#fSize').addEventListener('change', (e) => { fSt.size = toPx(+e.target.value); syncF(); });");
f.rep("if (st) Object.assign(fSt, { size: Math.round(st.size) || 22,", "if (st) Object.assign(fSt, { size: +st.size || 16,");
// bảng thuộc tính công thức: cỡ chữ theo point
f.rep(`      row(field('size', 'Cỡ chữ', 'num'), field('color', 'Màu', 'color'));
      add(field('bold', 'Chữ đậm', 'chk'));`, `      const szw = mk('div'); szw.appendChild(mk('label', '', 'Cỡ chữ (pt, như Word)'));
      const szi = mk('input'); szi.type = 'number'; szi.step = 0.5; szi.min = 6; szi.value = toPt(o.size);
      szi.oninput = () => { const v = parseFloat(szi.value); if (v >= 4) { o.size = toPx(v); renderObj(o); } };
      szi.onchange = () => commit();
      szw.appendChild(szi);
      row(szw, field('color', 'Màu', 'color'));
      add(field('bold', 'Chữ đậm', 'chk'));`);
f.rep("    const r = await api.office({ action: 'insert', app, target: o.id, data: btoa(bin) });", "    const r = await api.office({ action: 'insert', app, target: o.id, data: btoa(bin), keep: !!(OFFICE && OFFICE.keep) });");
f.rep(`  const OFFICE = api && api.officeMode ? { app: api.officeMode.app, mode: api.officeMode.mode, auto: false, lastOk: false } : null;`,
`  const OFFICE = api && api.officeMode ? { app: api.officeMode.app, mode: api.officeMode.mode, sizePt: api.officeMode.sizePt, auto: false, lastOk: false, keep: false } : null;
  // cỡ công thức mới lấy theo cỡ chữ tại con trỏ trong Word (mặc định 12 pt)
  const officeSize = () => (OFFICE.sizePt >= 5 && OFFICE.sizePt <= 200 ? toPx(OFFICE.sizePt) : 16);`);
f.rep(`      const r = await api.office({ action: 'read', app: OFFICE.app });
      if (r.ok) {`, `      const r = await api.office({ action: 'read', app: OFFICE.app });
      if (r.ok && r.from === 'MathType') {
        // công thức MathType: nhận diện được nhưng không đụng tới, để nguyên cho MathType xử lý
        await api.info('Đối tượng đang chọn là công thức MathType.\\n\\nToanViet không thay đổi gì ở công thức này. Hãy nhấp đúp để sửa bằng MathType như bình thường.');
        return api.quit();
      }
      if (r.ok && r.from === 'WordEq') {
        // công thức Equation của Word: đọc nội dung sang ToanViet, công thức gốc trong tài liệu giữ nguyên
        try {
          const latex = OMML.toLatex(new TextDecoder().decode(Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0))));
          OFFICE.keep = true; OFFICE.auto = true;
          const o = insert('formula', null, { latex, size: officeSize(), x: 60, y: 50 });
          msg('Đã đọc công thức Equation của Word. Công thức gốc được giữ nguyên; bản ToanViet sẽ chèn ngay sau nó.');
          editFormula(o);
          return;
        } catch (e) { msg('Không đọc được công thức Equation: ' + e.message, true); }
      } else if (r.ok) {`);
f.rep(`    OFFICE.auto = true;
    editFormula(insert('formula'), true);
  }`, `    OFFICE.auto = true;
    editFormula(insert('formula', null, { size: officeSize() }), true);
  }
  // Phím tắt ở chế độ add-in (khi không đứng trong hộp soạn): Ctrl+Enter chèn và đóng, Esc đóng không chèn
  if (OFFICE) document.addEventListener('keydown', (e) => {
    if (dlg.open) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); officeInsertAndQuit(); }
    else if (e.key === 'Escape' && !typing() && !S.placing) { e.preventDefault(); api.quit(); }
  });`);
f.rep("$('#officetxt').textContent = 'Đang soạn cho ' + officeName() + ': chọn đối tượng rồi bấm \"Chèn và đóng\".';", "$('#officetxt').textContent = 'Đang soạn cho ' + officeName() + ': Ctrl+Enter chèn và đóng · Esc đóng không chèn.';");
f.save();

// ---------------- index.html ----------------
f = mk('src/index.html');
f.rep('<option>14</option><option>16</option><option>18</option><option>20</option><option>22</option><option>24</option><option>26</option><option>28</option><option>32</option><option>40</option><option>48</option><option>64</option>',
  '<option>8</option><option>9</option><option>10</option><option>11</option><option>12</option><option>13</option><option>14</option><option>16</option><option>18</option><option>20</option><option>22</option><option>24</option><option>28</option><option>36</option><option>48</option>');
f.rep('<script src="solid.js"></script>', '<script src="solid.js"></script>\n<script src="omml.js"></script>');
f.rep('Enter xuống dòng · Ctrl+Enter chèn</span>', 'Enter xuống dòng · Ctrl+Enter chèn · Esc huỷ</span>');
f.save();

// ---------------- preload.js ----------------
f = mk('preload.js');
f.rep("mode: argVal('--tvs-mode') || 'new' }", "mode: argVal('--tvs-mode') || 'new', sizePt: parseFloat(argVal('--tvs-size')) || 0 }");
f.rep("  quit: () => ipcRenderer.send('quit'),", "  quit: () => ipcRenderer.send('quit'),\n  info: (msg) => ipcRenderer.invoke('info', msg),");
f.save();

// ---------------- main.js ----------------
f = mk('main.js');
f.rep("additionalArguments: office ? ['--tvs-office=' + office.app, '--tvs-mode=' + office.mode] : [],", "additionalArguments: office ? ['--tvs-office=' + office.app, '--tvs-mode=' + office.mode, '--tvs-size=' + (parseFloat(argVal('--size')) || 0)] : [],");
f.rep("  win.loadFile(path.join(__dirname, 'src', 'index.html'));", "  win.loadFile(path.join(__dirname, 'src', 'index.html'));\n  // mở từ Word/PowerPoint: đưa cửa sổ lên trước để gõ được ngay\n  if (office) win.webContents.once('did-finish-load', () => { win.show(); win.focus(); app.focus({ steal: true }); win.webContents.focus(); });");
f.rep("      { label: 'Thoát', role: 'quit' },", "      { label: 'Thoát', accelerator: 'Ctrl+Q', role: 'quit' },");
f.rep("ipcMain.on('quit', () => app.quit());", "ipcMain.on('quit', () => app.quit());\nipcMain.handle('info', async (_e, msg) => { await dialog.showMessageBox(win, { type: 'info', buttons: ['Đóng'], message: String(msg) }); return true; });");
// PowerShell: giữ nguyên công thức gốc khi nguồn là Equation; đọc Equation / nhận diện MathType
f.rep("      $sel = $a.Selection; $rep = 0\n", `      $sel = $a.Selection; $rep = 0
      if ($env:TVS_KEEP -eq '1') {
        # nguồn là công thức Equation của Word: không xoá, đặt con trỏ ngay sau nó
        try { if ($sel.OMaths.Count -ge 1) { $rg = $sel.OMaths.Item(1).Range; $rg.Collapse(0); [void]$rg.Move(1, 1); $rg.Select(); $sel = $a.Selection } else { $sel.Collapse(0) } } catch {}
      }
`);
f.rep('    if ($a -and $a.Documents.Count -gt 0) { try { $sel = $a.Selection; if ($sel.InlineShapes.Count -ge 1) { $r = "$($sel.InlineShapes.Item(1).AlternativeText)" } } catch {} }',
`    $kind = ''; $payload = 'x'
    if ($a -and $a.Documents.Count -gt 0) {
      try {
        $sel = $a.Selection
        if ($sel.InlineShapes.Count -ge 1) {
          $ish = $sel.InlineShapes.Item(1); $r = "$($ish.AlternativeText)"
          if (-not $r.StartsWith('TVS1:')) { $pg = ''; try { $pg = "$($ish.OLEFormat.ProgID)" } catch {}; if ($pg -like 'Equation*') { $kind = 'MathType' } }
        }
        if (-not $r.StartsWith('TVS1:') -and -not $kind -and $sel.OMaths.Count -ge 1) {
          $x = $sel.OMaths.Item(1).Range.WordOpenXML
          $mm = [regex]::Match($x, '<m:oMath[ >][\\s\\S]*?</m:oMath>')
          if ($mm.Success) { $kind = 'WordEq'; $payload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value)) }
        }
      } catch {}
    }
    if ($kind) { "OK:$kind" + ':' + $payload; exit }`);
f.rep("const m = out.match(/^OK:(Word|PPT):(.+)$/);", "const m = out.match(/^OK:(Word|PPT|WordEq|MathType):(.+)$/);");
f.rep("TVS_POS: String(capture.depthPt || 0),", "TVS_POS: String(capture.depthPt || 0), TVS_KEEP: opts.keep ? '1' : '0',");
f.save();

// ---------------- add-in COM ----------------
f = mk('office-addin/ToanVietAddin.cs');
f.rep('using System.Diagnostics;', 'using System.Diagnostics;\nusing System.Globalization;');
f.rep('        private object appRef; // giữ tham chiếu để sự kiện nhấp đúp không bị thu hồi', `        private object appRef; // giữ tham chiếu để sự kiện nhấp đúp không bị thu hồi

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
        }`);
f.rep(`                else ((Word.ApplicationEvents4_Event)Application).WindowBeforeDoubleClick += WordDoubleClick;
            }
            catch { }`, `                else ((Word.ApplicationEvents4_Event)Application).WindowBeforeDoubleClick += WordDoubleClick;
            }
            catch { }
            try { hookProc = KeyHook; hook = SetWindowsHookEx(2 /* WH_KEYBOARD */, hookProc, IntPtr.Zero, GetCurrentThreadId()); } catch { }`);
f.rep('public void OnDisconnection(int RemoveMode, ref Array custom) { }', 'public void OnDisconnection(int RemoveMode, ref Array custom) { try { if (hook != IntPtr.Zero) { UnhookWindowsHookEx(hook); hook = IntPtr.Zero; } } catch { } }');
f.rep('label=\\"Công thức mới\\" size=\\"large\\"', 'label=\\"Công thức mới\\" keytip=\\"Q\\" size=\\"large\\"');
f.rep('Bấm Chèn thì công thức vào đúng chỗ con trỏ và phần mềm tự đóng.', 'Phím tắt: Ctrl+Alt+Q. Trong phần mềm: Ctrl+Enter chèn và tự đóng, Esc đóng không chèn.');
f.rep('rồi bấm nút này để mở lại và sửa.', 'rồi bấm nút này (hoặc Ctrl+Alt+E, hoặc nhấp đúp) để mở lại và sửa. Công thức Equation của Word cũng đọc được; công thức MathType được giữ nguyên.');
f.rep('để dựng hình rồi chèn vào tài liệu.', 'để dựng hình rồi chèn vào tài liệu. Phím tắt: Ctrl+Alt+G.');
f.rep('                Process.Start(new ProcessStartInfo(exe, "--office=" + host + " --mode=" + mode) { UseShellExecute = false });', `                // cỡ chữ tại con trỏ trong Word để công thức mới khớp với dòng văn bản
                string extra = "";
                if (host == "word")
                {
                    try { float fs = ((Word.Application)appRef).Selection.Font.Size; if (fs >= 5 && fs <= 200) extra = " --size=" + fs.ToString(CultureInfo.InvariantCulture); } catch { }
                }
                Process.Start(new ProcessStartInfo(exe, "--office=" + host + " --mode=" + mode + extra) { UseShellExecute = false });`);
f.save();

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.5.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v1.5 patched');
