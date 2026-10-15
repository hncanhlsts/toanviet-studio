const fs = require('fs');
let s = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) console.log('MISSING: ' + a.slice(0, 70)); s = s.replace(a, () => b); };
rep("try { if ($sel.OMaths.Count -ge 1) { $rg = $sel.OMaths.Item(1).Range; $rg.Collapse(0); [void]$rg.Move(1, 1); $rg.Select(); $sel = $a.Selection } else { $sel.Collapse(0) } } catch {}",
  `try {
          if ($sel.OMaths.Count -ge 1) {
            # ra hẳn khỏi vùng công thức (như bấm phím mũi tên phải ở cuối công thức), nếu không ảnh sẽ nằm trong Equation
            $rg = $sel.OMaths.Item(1).Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection
            for ($t = 0; $t -lt 3 -and $sel.OMaths.Count -ge 1; $t++) { [void]$sel.MoveRight(1, 1) }
            if ($sel.OMaths.Count -ge 1) { $sel.EndKey(5) | Out-Null; $sel.TypeParagraph() }
          } else { $sel.Collapse(0) }
        } catch {}`);
rep("        await win.webContents.executeJavaScript('window.__demo()');", "        if (!office) await win.webContents.executeJavaScript('window.__demo()');");
fs.writeFileSync('main.js', s);
console.log('patched');
