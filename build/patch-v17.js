// v1.7: chuyển đổi hàng loạt công thức trong tài liệu Word giữa MathType / Equation / ToanViet
const fs = require('fs');
const mk = (file) => {
  let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return { rep(a, b) { if (!s.includes(a)) console.log('MISSING in ' + file + ': ' + a.slice(0, 70)); s = s.replace(a, () => b); }, save() { fs.writeFileSync(file, s); } };
};

// ---------------- main.js ----------------
let f = mk('main.js');
f.rep("mode: /^(new|edit|full)$/.test(argVal('--mode')) ? argVal('--mode') : 'new' }", "mode: /^(new|edit|full|convert)$/.test(argVal('--mode')) ? argVal('--mode') : 'new', op: /^(mt2tv|tv2mt|eq2tv|tv2eq)$/.test(argVal('--op')) ? argVal('--op') : '' }");
f.rep("'--tvs-size=' + (parseFloat(argVal('--size')) || 0)]", "'--tvs-size=' + (parseFloat(argVal('--size')) || 0), '--tvs-op=' + office.op]");
f.rep("  if ($act -eq 'insert') {\n    $w = [double]$env:TVS_W; $h = [double]$env:TVS_H", String.raw`  if ($act -eq 'scan') {
    # liệt kê mọi công thức một loại trong tài liệu Word đang mở: ole = MathType, omath = Equation, tvs = ToanViet
    $a = GetApp 'Word.Application'
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $kind = $env:TVS_KIND; $sb = New-Object Text.StringBuilder; $n = 0
    if ($kind -eq 'omath') {
      for ($i = 1; $i -le $doc.OMaths.Count; $i++) {
        try {
          $om = $doc.OMaths.Item($i); $x = $om.Range.WordOpenXML; $mm = [regex]::Match($x, '<m:oMath[ >][\s\S]*?</m:oMath>')
          if ($mm.Success) { $fs = 0; try { $fs = [double]$om.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($mm.Value))); $n++ }
        } catch {}
      }
    } else {
      for ($i = 1; $i -le $doc.InlineShapes.Count; $i++) {
        try {
          $s = $doc.InlineShapes.Item($i); $al = "$($s.AlternativeText)"
          if ($kind -eq 'tvs') { if ($al.StartsWith('TVS1:')) { [void]$sb.AppendLine("$i|0|" + $al.Substring(5)); $n++ } }
          elseif (-not $al.StartsWith('TVS1:')) {
            $pg = ''; try { $pg = "$($s.OLEFormat.ProgID)" } catch {}
            if ($pg -like 'Equation*') {
              $x = $s.Range.WordOpenXML; $mb = [regex]::Match($x, '<pkg:part pkg:name="/word/embeddings/[^"]+"[^>]*>\s*<pkg:binaryData>([\s\S]*?)</pkg:binaryData>')
              if ($mb.Success) { $fs = 0; try { $fs = [double]$s.Range.Font.Size } catch {}; [void]$sb.AppendLine("$i|$fs|" + ($mb.Groups[1].Value -replace '\s', '')); $n++ }
            }
          }
        } catch {}
      }
    }
    [IO.File]::WriteAllText($env:TVS_OUT, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
    "OK:$n"
  } elseif ($act -eq 'apply') {
    # thực hiện chuyển đổi theo tệp việc (mỗi dòng một công thức, chỉ số giảm dần để không lệch thứ tự)
    $a = GetApp 'Word.Application'
    if (-not $a -or $a.Documents.Count -eq 0) { 'ERR:NOAPP'; exit }
    $doc = $a.ActiveDocument; $op = $env:TVS_OP; $n = 0; $xsl = $null
    if ($op -eq 'tv2eq') { $xsl = New-Object System.Xml.Xsl.XslCompiledTransform; $xsl.Load((Join-Path $a.Path 'MML2OMML.XSL')) }
    $pkgA = '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage"><pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part><pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><w:body><w:p>'
    $pkgB = '</w:p></w:body></w:document></pkg:xmlData></pkg:part></pkg:package>'
    $ur = $null; try { $ur = $a.UndoRecord; $ur.StartCustomRecord('ToanViet') } catch {}
    $a.ScreenUpdating = $false
    try {
      foreach ($line in [IO.File]::ReadAllLines($env:TVS_JOB, [Text.Encoding]::UTF8)) {
        if (-not $line) { continue }
        $f = $line.Split('|'); $i = [int]$f[0]
        try {
          if ($op -eq 'mt2tv') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete()
            $p = $doc.InlineShapes.AddPicture($f[1], $false, $true, $r)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]; $n++
          } elseif ($op -eq 'eq2tv') {
            $om = $doc.OMaths.Item($i); $rg = $om.Range; $rg.Collapse(0); $rg.Select(); $sel = $a.Selection; [void]$sel.MoveRight(1, 1)
            $p = $sel.InlineShapes.AddPicture($f[1], $false, $true)
            $p.LockAspectRatio = 0; $p.Width = [double]$f[2]; $p.Height = [double]$f[3]; $p.LockAspectRatio = -1
            $p.AlternativeText = 'TVS1:' + $f[5]; $p.Range.Font.Position = -[int]$f[4]
            $doc.OMaths.Item($i).Range.Delete() | Out-Null; $n++
          } elseif ($op -eq 'tv2eq') {
            $mml = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($f[1]))
            $sw = New-Object IO.StringWriter; $st = New-Object Xml.XmlWriterSettings; $st.OmitXmlDeclaration = $true; $st.ConformanceLevel = 'Fragment'
            $xw = [Xml.XmlWriter]::Create($sw, $st); $xsl.Transform([Xml.XmlReader]::Create((New-Object IO.StringReader $mml)), $xw); $xw.Flush()
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML($pkgA + $sw.ToString() + $pkgB); $n++
          } elseif ($op -eq 'tv2mt') {
            $s = $doc.InlineShapes.Item($i); $r = $s.Range; $s.Delete(); $r.Font.Position = 0
            $r.InsertXML([IO.File]::ReadAllText($f[1], [Text.Encoding]::UTF8)); $n++
          }
        } catch {}
      }
    } finally { $a.ScreenUpdating = $true; try { if ($ur) { $ur.EndCustomRecord() } } catch {} }
    "OK:$n"
  } elseif ($act -eq 'insert') {
    $w = [double]$env:TVS_W; $h = [double]$env:TVS_H`);
f.rep("ipcMain.handle('office', async (e, opts) => {\n  const name = opts.app === 'ppt' ? 'PowerPoint' : 'Word';", `// dựng ảnh PNG của một đối tượng ra tệp tạm (dùng khi chuyển đổi hàng loạt)
ipcMain.handle('renderPng', async (e, target) => {
  const scale = 4;
  const buf = await capture(e.sender, target, scale);
  const size = nativeImage.createFromBuffer(buf).getSize();
  const file = path.join(app.getPath('temp'), 'toanviet-' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.png');
  fs.writeFileSync(file, buf);
  return { file, w: size.width * 0.75 / scale, h: size.height * 0.75 / scale, depthPt: capture.depthPt || 0 };
});
ipcMain.handle('office', async (e, opts) => {
  const name = opts.app === 'ppt' ? 'PowerPoint' : 'Word';
  const noApp = 'Chưa mở tài liệu Word nào.';
  if (opts.action === 'scan') {
    const outFile = path.join(app.getPath('temp'), 'toanviet-scan-' + Date.now() + '.txt');
    const out = await runOffice({ TVS_ACT: 'scan', TVS_KIND: opts.kind, TVS_OUT: outFile });
    if (!out.startsWith('OK')) return { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
    const items = fs.readFileSync(outFile, 'utf8').split(/\\r?\\n/).filter(Boolean).map((l) => { const p = l.split('|'); return { i: +p[0], size: parseFloat(p[1]) || 0, data: p[2] }; });
    fs.unlink(outFile, () => {});
    return { ok: true, items };
  }
  if (opts.action === 'apply') {
    const dir = app.getPath('temp');
    const lines = opts.jobs.map((j, k) => {
      if (opts.op === 'tv2eq') return j.i + '|' + Buffer.from(j.mathml, 'utf8').toString('base64');
      if (opts.op === 'tv2mt') { const xf = path.join(dir, 'toanviet-mt-' + Date.now() + '-' + k + '.xml'); fs.writeFileSync(xf, j.xml, 'utf8'); j.tmp = xf; return j.i + '|' + xf; }
      j.tmp = j.png;
      return [j.i, j.png, j.w, j.h, j.pos, j.alt].join('|');
    });
    const jobFile = path.join(dir, 'toanviet-job-' + Date.now() + '.txt');
    fs.writeFileSync(jobFile, lines.join('\\r\\n'), 'utf8');
    const out = await runOffice({ TVS_ACT: 'apply', TVS_OP: opts.op, TVS_JOB: jobFile });
    fs.unlink(jobFile, () => {});
    opts.jobs.forEach((j) => { if (j.tmp) fs.unlink(j.tmp, () => {}); });
    const m = out.match(/^OK:(\\d+)$/);
    return m ? { ok: true, count: +m[1] } : { ok: false, error: out === 'ERR:NOAPP' ? noApp : 'Lỗi Word: ' + out.slice(4) };
  }`);
f.save();

// ---------------- preload.js ----------------
f = mk('preload.js');
f.rep("sizePt: parseFloat(argVal('--tvs-size')) || 0 }", "sizePt: parseFloat(argVal('--tvs-size')) || 0, op: argVal('--tvs-op') }");
f.rep("  info: (msg) => ipcRenderer.invoke('info', msg),", "  info: (msg) => ipcRenderer.invoke('info', msg),\n  renderPng: (target) => ipcRenderer.invoke('renderPng', target),");
f.save();

// ---------------- app.js ----------------
f = mk('src/app.js');
f.rep("sizePt: api.officeMode.sizePt, auto: false,", "sizePt: api.officeMode.sizePt, op: api.officeMode.op, auto: false,");
f.rep("  async function startOffice() {\n    document.body.classList.add('office');", `  // ---------- Chuyển đổi hàng loạt công thức trong tài liệu Word ----------
  const CONVERT = {
    mt2tv: { kind: 'ole', from: 'MathType', to: 'ToanViet' },
    eq2tv: { kind: 'omath', from: 'Equation', to: 'ToanViet' },
    tv2eq: { kind: 'tvs', from: 'ToanViet', to: 'Equation' },
    tv2mt: { kind: 'tvs', from: 'ToanViet', to: 'MathType' },
  };
  const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const objToB64 = (o) => { const bytes = new TextEncoder().encode(JSON.stringify(o, (k, v) => (k[0] === '_' || k === 'id' ? undefined : v))); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
  async function runConvert() {
    const cv = CONVERT[OFFICE.op];
    const veil = document.createElement('div');
    veil.id = 'convveil';
    veil.innerHTML = '<div><b>ToanViet Studio</b><p id="convmsg">Đang tìm công thức ' + (cv ? cv.from : '') + ' trong tài liệu…</p></div>';
    document.body.appendChild(veil);
    const say = (t) => { $('#convmsg').textContent = t; };
    const finish = async (t) => { await api.info(t); api.quit(); };
    if (!cv || OFFICE.app !== 'word') return finish('Chuyển đổi hàng loạt hiện chỉ làm được trong Word.');
    const sc = await api.office({ action: 'scan', app: 'word', kind: cv.kind });
    if (!sc.ok) return finish(sc.error);
    let items = sc.items;
    if (cv.kind === 'tvs') {
      // chỉ công thức mới chuyển được; đồ thị, bảng, hình giữ nguyên
      items = items.map((it) => { try { it.obj = JSON.parse(new TextDecoder().decode(b64ToBytes(it.data))); } catch (e) { it.obj = null; } return it; }).filter((it) => it.obj && it.obj.type === 'formula');
    }
    if (!items.length) return finish('Không tìm thấy công thức ' + cv.from + ' nào trong tài liệu.');
    if (!(await api.confirm('Tìm thấy ' + items.length + ' công thức ' + cv.from + ' trong tài liệu.\\n\\nChuyển tất cả sang ' + cv.to + '?\\n(Sau khi chuyển, bấm Ctrl+Z trong Word nếu muốn hoàn tác.)'))) return api.quit();
    items.sort((a, b) => b.i - a.i);
    const jobs = [];
    let failed = 0;
    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      say('Đang chuẩn bị công thức ' + (k + 1) + ' / ' + items.length + '…');
      try {
        if (OFFICE.op === 'mt2tv' || OFFICE.op === 'eq2tv') {
          const raw = b64ToBytes(it.data);
          const latex = OFFICE.op === 'mt2tv' ? MTEF.oleToLatex(raw) : OMML.toLatex(new TextDecoder().decode(raw));
          if (!latex.trim()) throw new Error('rỗng');
          const o = { id: 'c' + k, type: 'formula', x: 60, y: 50, latex, size: it.size >= 5 && it.size <= 200 ? toPx(it.size) : 16, color: '#000000' };
          S.objs = [o]; S.sel = null; renderAll();
          const r = await api.renderPng(o.id);
          jobs.push({ i: it.i, png: r.file, w: r.w, h: r.h, pos: r.depthPt, alt: objToB64(o) });
        } else if (OFFICE.op === 'tv2eq') {
          const tx = multiline(it.obj.latex).replace(/\\\\dongdang(?![a-zA-Z])/g, '\\\\backsim ');
          jobs.push({ i: it.i, mathml: '<math xmlns="http://www.w3.org/1998/Math/MathML">' + MathLive.convertLatexToMathMl(tx) + '</math>' });
        } else {
          const r = await mathTypeXml(it.obj);
          jobs.push({ i: it.i, xml: r });
        }
      } catch (e) { failed++; }
    }
    if (!jobs.length) return finish('Không chuyển được công thức nào (' + failed + ' công thức có cấu trúc chưa hỗ trợ). Tài liệu không thay đổi.');
    say('Đang ghi ' + jobs.length + ' công thức vào Word…');
    const res = await api.office({ action: 'apply', app: 'word', op: OFFICE.op, jobs });
    if (!res.ok) return finish(res.error);
    const skipped = items.length - res.count;
    return finish('Đã chuyển ' + res.count + ' / ' + items.length + ' công thức ' + cv.from + ' sang ' + cv.to + '.' + (skipped ? '\\n\\n' + skipped + ' công thức chưa chuyển được và được giữ nguyên.' : '') + '\\n\\nBấm Ctrl+Z trong Word nếu muốn hoàn tác.');
  }
  // ToanViet -> MathType: sẽ được nạp từ mtef-write.js nếu có
  async function mathTypeXml(obj) {
    if (!window.MTEFW) throw new Error('chưa hỗ trợ');
    S.objs = [Object.assign({ id: 'cmt' }, obj, { x: 60, y: 50 })]; S.sel = null; renderAll();
    const r = await api.renderPng('cmt');
    return window.MTEFW.wordXml(texOf(obj), r, await (await fetch(r.file.startsWith('file:') ? r.file : 'file:///' + r.file.replace(/\\\\/g, '/'))).arrayBuffer());
  }

  async function startOffice() {
    if (OFFICE.mode === 'convert') return runConvert();
    document.body.classList.add('office');`);
f.save();

fs.appendFileSync('src/styles.css', `
/* màn chờ khi chuyển đổi hàng loạt */
#convveil { position: fixed; inset: 0; z-index: 300; background: #f7f9fb; display: flex; align-items: center; justify-content: center; }
#convveil > div { text-align: center; font-size: 15px; }
#convveil b { font-size: 20px; color: #1f5fbf; }
`);

// ---------------- add-in COM: ribbon mới ----------------
f = mk('office-addin/ToanVietAddin.cs');
{
  let s = fs.readFileSync('office-addin/ToanVietAddin.cs', 'utf8').replace(/\r\n/g, '\n');
  const a = s.indexOf('            return "<customUI xmlns='), b = s.indexOf('        public void OnNew(object control)');
  const c = s.lastIndexOf('        private static bool IsOurs', b);
  if (a < 0 || b < 0 || c < 0) throw new Error('ribbon block not found');
  const ribbon = `            string conv = ppt ? "" :
                "<group id=\\"tvConv\\" label=\\"Thống nhất định dạng công thức\\">" +
                "<button id=\\"tvMt2Tv\\" label=\\"MathType → ToanViet\\" imageMso=\\"EquationInsertGallery\\" onAction=\\"OnMt2Tv\\" screentip=\\"Chuyển toàn bộ công thức MathType sang ToanViet\\" supertip=\\"Tìm mọi công thức MathType trong tài liệu và thay bằng công thức ToanViet tương ứng. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "<button id=\\"tvTv2Mt\\" label=\\"ToanViet → MathType\\" imageMso=\\"EquationOptions\\" onAction=\\"OnTv2Mt\\" screentip=\\"Chuyển toàn bộ công thức ToanViet sang MathType\\" supertip=\\"Thay mọi công thức ToanViet trong tài liệu bằng đối tượng MathType. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "<button id=\\"tvEq2Tv\\" label=\\"Equation → ToanViet\\" imageMso=\\"EquationInsertGallery\\" onAction=\\"OnEq2Tv\\" screentip=\\"Chuyển toàn bộ công thức Equation của Word sang ToanViet\\" supertip=\\"Tìm mọi công thức Equation trong tài liệu và thay bằng công thức ToanViet tương ứng. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "<button id=\\"tvTv2Eq\\" label=\\"ToanViet → Equation\\" imageMso=\\"EquationOptions\\" onAction=\\"OnTv2Eq\\" screentip=\\"Chuyển toàn bộ công thức ToanViet sang Equation của Word\\" supertip=\\"Thay mọi công thức ToanViet trong tài liệu bằng công thức Equation của Word. Hoàn tác bằng Ctrl+Z.\\"/>" +
                "</group>";
            return "<customUI xmlns=\\"http://schemas.microsoft.com/office/2009/07/customui\\"><ribbon><tabs>" +
                "<tab id=\\"tvTab\\" label=\\"ToanViet\\"><group id=\\"tvGroup\\" label=\\"ToanViet Studio\\">" +
                "<button id=\\"tvNew\\" label=\\"Công thức mới\\" keytip=\\"Q\\" size=\\"large\\" imageMso=\\"EquationInsertGallery\\" onAction=\\"OnNew\\" screentip=\\"Công thức mới (Ctrl+Alt+Q)\\" supertip=\\"Mở ToanViet Studio để soạn công thức. Ctrl+Enter chèn và tự đóng, Esc đóng không chèn. Sửa công thức đã có: nhấp đúp vào nó hoặc bấm Ctrl+Alt+E.\\"/>" +
                "<button id=\\"tvFull\\" label=\\"Đồ thị, bảng, hình\\" size=\\"large\\" imageMso=\\"ChartInsert\\" onAction=\\"OnFull\\" screentip=\\"Đồ thị, bảng biến thiên, miền nghiệm, hình không gian (Ctrl+Alt+G)\\" supertip=\\"Mở đầy đủ ToanViet Studio để dựng hình rồi chèn vào tài liệu.\\"/>" +
                "</group>" + conv + "</tab></tabs></ribbon><contextMenus>" + menus + "</contextMenus></customUI>";
        }

`;
  s = s.slice(0, a) + ribbon + s.slice(c);
  s = s.replace('        public void OnNew(object control) { Launch("new"); }', () => '        public void OnNew(object control) { Launch("new"); }\n        public void OnMt2Tv(object control) { Launch("convert", " --op=mt2tv"); }\n        public void OnTv2Mt(object control) { Launch("convert", " --op=tv2mt"); }\n        public void OnEq2Tv(object control) { Launch("convert", " --op=eq2tv"); }\n        public void OnTv2Eq(object control) { Launch("convert", " --op=tv2eq"); }');
  s = s.replace('        private void Launch(string mode)\n        {', () => '        private void Launch(string mode) { Launch(mode, ""); }\n        private void Launch(string mode, string more)\n        {');
  s = s.replace('"--office=" + host + " --mode=" + mode + extra)', () => '"--office=" + host + " --mode=" + mode + extra + more)');
  fs.writeFileSync('office-addin/ToanVietAddin.cs', s);
}

const pk = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pk.version = '1.7.0';
fs.writeFileSync('package.json', JSON.stringify(pk, null, 2));
console.log('v1.7 patched');
