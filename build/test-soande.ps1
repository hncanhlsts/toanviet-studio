# Thử xuất đề sang Word (tạo một tài liệu Word mới, kiểm tra rồi đóng không lưu)
param([string]$Proj, [string]$Out)
$js = "(async()=>{ const w=t=>new Promise(s=>setTimeout(s,t)); __clear(); __add('plane','phangiac',{x:60,y:60,w:260,h:200}); await w(300); const el=document.querySelector('#page .obj'); el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:el.getBoundingClientRect().left+3,clientY:el.getBoundingClientRect().top+3})); window.dispatchEvent(new PointerEvent('pointerup',{})); await w(200); document.querySelector('[data-cmd=exam]').click(); await w(400); document.getElementById('exsample').click(); await w(600); const dlg=document.getElementById('examdlg'); dlg.querySelectorAll('.exq')[5].click(); await w(300); [...dlg.querySelectorAll('button')].find(b=>b.textContent.startsWith('Lấy hình')).click(); await w(2500); document.getElementById('exword').click(); await w(15000); console.log('MSG '+document.getElementById('msg').textContent); })()"
$env:TVS_SHOT_PAGE = $null
npx electron . "--shot=$Out\app.png" "--eval=$js" 2>$null | Select-String 'MSG|ERROR' | ForEach-Object { $_.Line }
$w = [Runtime.InteropServices.Marshal]::GetActiveObject('Word.Application')
$d = $w.ActiveDocument
"đoạn: " + $d.Paragraphs.Count + "  công thức Equation: " + $d.OMaths.Count + "  hình: " + $d.InlineShapes.Count + "  số trang: " + $d.ComputeStatistics(2)
"phông: " + $d.Paragraphs.Item(8).Range.Font.Name + " " + $d.Paragraphs.Item(8).Range.Font.Size

$d.ExportAsFixedFormat("$Out\word.pdf", 17)
$d.Close([ref]0)