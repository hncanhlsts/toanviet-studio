const fs = require('fs');
let s = fs.readFileSync('main.js', 'utf8').replace(/\r\n/g, '\n');
const a = `            for ($t = 0; $t -lt 3 -and $sel.OMaths.Count -ge 1; $t++) { [void]$sel.MoveRight(1, 1) }
            if ($sel.OMaths.Count -ge 1) { $sel.EndKey(5) | Out-Null; $sel.TypeParagraph() }`;
if (!s.includes(a)) throw new Error('missing');
s = s.replace(a, () => '            [void]$sel.MoveRight(1, 1) # một lần là đủ; Word vẫn báo OMaths.Count = 1 dù con trỏ đã ở ngoài');
fs.writeFileSync('main.js', s);
console.log('patched');
