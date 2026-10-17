// Ghép tệp Word (.docx) trực tiếp — không cần Word, không cần PowerShell — từ nội dung chuẩn (cú pháp của skill
// "toanviet-loi-giai-sgk": #T, #H1, #H2, #D, #C, #G, #PAGE, - , $$…$$, #TAB…#ENDTAB, $…$, **đậm**) và ảnh công thức ToanViet.
// Mỗi công thức là ảnh PNG kèm dữ liệu "TVS1:…" ở văn bản thay thế (wp:docPr/@descr) và độ hạ dòng (w:position) —
// đúng định dạng add-in ToanViet tự chèn, nên trong Word nhấp đúp (hoặc Ctrl+Alt+E) là mở lại bằng ToanViet để sửa.
// Mô-đun thuần Node (không cần Electron) để kiểm thử được.
const zlib = require('zlib');

// ---------- ZIP tối giản (đủ cho .docx) ----------
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function zip(files) { // files: [{ name, data: Buffer|string }]
  const parts = [], central = [];
  let off = 0;
  for (const f of files) {
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8');
    const comp = zlib.deflateRawSync(data), name = Buffer.from(f.name, 'utf8'), crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(0, 10); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(0, 12); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    central.push(ch, name);
    off += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

// ---------- Nội dung Word ----------
const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const EMU = 12700; // 1 point
const TEXT_W = (21 - 4) / 2.54 * 72; // bề rộng vùng chữ (pt): A4, lề trái / phải 2 cm
const BLUE = '1F3F7A';

/**
 * markup: nội dung chuẩn; formulas: { [latex]: { png: Buffer, w, h, depthPt, alt } }; opts: { pt: 12 }
 * Trả về { buf: Buffer (.docx), missing: [latex chưa có ảnh], count: số công thức đã chèn }
 */
function buildDocx(markup, formulas, opts) {
  const PT = (opts && opts.pt) || 12;
  const media = []; // { name, data }
  const mediaOf = new Map(); // latex -> rId
  const missing = [];
  let docPrId = 1, count = 0;
  const rel = (latex, png) => {
    if (mediaOf.has(latex)) return mediaOf.get(latex);
    const n = media.length + 1, id = 'rIdImg' + n;
    media.push({ name: 'word/media/image' + n + '.png', data: png, id });
    mediaOf.set(latex, id);
    return id;
  };
  const rPr = (o) => {
    let s = '';
    if (o.bold) s += '<w:b/><w:bCs/>';
    if (o.italic) s += '<w:i/><w:iCs/>';
    if (o.color) s += '<w:color w:val="' + o.color + '"/>';
    if (o.size) s += '<w:sz w:val="' + Math.round(o.size * 2) + '"/><w:szCs w:val="' + Math.round(o.size * 2) + '"/>';
    return s ? '<w:rPr>' + s + '</w:rPr>' : '';
  };
  const textRuns = (text, o) => text.split('**').map((seg, k) => (seg ? '<w:r>' + rPr(Object.assign({}, o, { bold: o.bold || k % 2 === 1 })) + '<w:t xml:space="preserve">' + X(seg) + '</w:t></w:r>' : '')).join('');
  const picRun = (latex) => {
    const f = formulas[latex];
    if (!f) { missing.push(latex); return '<w:r><w:t xml:space="preserve">' + X('$' + latex + '$') + '</w:t></w:r>'; }
    let { w, h, depthPt } = f;
    if (w > TEXT_W) { const k = TEXT_W / w; w *= k; h *= k; depthPt *= k; } // quá rộng: thu cho vừa trang
    const id = rel(latex, f.png), n = docPrId++;
    count++;
    const cx = Math.round(w * EMU), cy = Math.round(h * EMU);
    const pos = depthPt ? '<w:rPr><w:position w:val="' + -Math.round(depthPt * 2) + '"/></w:rPr>' : '';
    return '<w:r>' + pos + '<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:effectExtent l="0" t="0" r="0" b="0"/>' +
      '<wp:docPr id="' + n + '" name="ToanViet ' + n + '" descr="' + X(f.alt) + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + n + '" name="toanviet' + n + '.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="' + id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>' +
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  };
  const fill = (text, o) => {
    let s = '', pos = 0;
    const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > pos) s += textRuns(text.slice(pos, m.index), o);
      s += picRun((m[1] || m[2]).trim());
      pos = m.index + m[0].length;
    }
    if (pos < text.length) s += textRuns(text.slice(pos), o);
    return s;
  };
  const para = (inner, p) => {
    p = p || {};
    let pp = '';
    if (p.style) pp += '<w:pStyle w:val="' + p.style + '"/>';
    if (p.keep) pp += '<w:keepNext/>';
    if (p.pageBreak) pp += '<w:pageBreakBefore/>';
    pp += '<w:spacing w:before="' + Math.round((p.before || 0) * 20) + '" w:after="' + Math.round((p.after === undefined ? 4 : p.after) * 20) + '"/>';
    if (p.indent) pp += '<w:ind w:left="' + p.indent + '" w:hanging="' + (p.hanging || 0) + '"/>';
    pp += '<w:jc w:val="' + (p.align || 'both') + '"/>';
    if (p.outline !== undefined) pp += '<w:outlineLvl w:val="' + p.outline + '"/>';
    return '<w:p><w:pPr>' + pp + '</w:pPr>' + inner + '</w:p>';
  };
  const body = [];
  const lines = String(markup).split('\n');
  let firstD = true;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].replace(/\s+$/, '');
    if (!ln || ln.startsWith('%%')) continue;
    if (ln.startsWith('#T ')) body.push(para(fill(ln.slice(3), { bold: true, size: PT + 3, color: BLUE }), { align: 'center', after: 2 }));
    else if (ln.startsWith('#S ')) body.push(para(fill(ln.slice(3), { italic: true }), { align: 'center', after: 10 }));
    else if (ln.startsWith('#H1 ')) body.push(para(fill(ln.slice(4), { bold: true, size: PT + 1, color: BLUE }), { align: 'left', before: 10, after: 6, keep: true, outline: 0 }));
    else if (ln.startsWith('#H2 ')) body.push(para(fill(ln.slice(4), { bold: true, color: BLUE }), { align: 'left', before: 6, after: 3, keep: true, outline: 1 }));
    else if (ln.startsWith('#D ')) { body.push(para(fill(ln.slice(3), { bold: true, size: PT + 1, color: BLUE }), { align: 'center', before: 6, after: 8, keep: true, outline: 1, pageBreak: !firstD })); firstD = false; }
    else if (ln.startsWith('#C ')) body.push(para(fill(ln.slice(3), { bold: true }), { align: 'left', before: 6, after: 2, keep: true }));
    else if (ln.startsWith('#G')) body.push(para(fill(ln.slice(2).trim() || 'Lời giải', { bold: true, color: BLUE }), { align: 'left', before: 2, after: 2, keep: true }));
    else if (ln === '#PAGE') body.push(para('', { pageBreak: true, after: 0 }));
    else if (ln.startsWith('- ')) body.push(para('<w:r><w:t xml:space="preserve">•</w:t></w:r><w:r><w:tab/></w:r>' + fill(ln.slice(2), {}), { indent: 360, hanging: 360 }));
    else if (/^\$\$[^$]+\$\$$/.test(ln)) body.push(para(picRun(ln.slice(2, -2).trim()), { align: 'center', before: 2, after: 6 }));
    else if (ln === '#TAB') {
      const rows = [];
      while (i + 1 < lines.length && lines[i + 1].trim() !== '#ENDTAB') { i++; rows.push(lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|')); }
      i++;
      const ncol = Math.max(...rows.map((r) => r.length), 1);
      const b = '<w:top w:val="single" w:sz="4" w:color="000000"/><w:left w:val="single" w:sz="4" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:color="000000"/><w:right w:val="single" w:sz="4" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:color="000000"/>';
      body.push('<w:tbl><w:tblPr><w:jc w:val="center"/><w:tblBorders>' + b + '</w:tblBorders><w:tblLayout w:type="autofit"/></w:tblPr><w:tblGrid>' + '<w:gridCol/>'.repeat(ncol) + '</w:tblGrid>' +
        rows.map((r, ri) => '<w:tr>' + Array.from({ length: ncol }, (_, ci) => '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>' +
          para(fill((r[ci] || '').trim(), {}), { align: 'center', before: 2, after: 2, keep: ri < rows.length - 1 }) + '</w:tc>').join('') + '</w:tr>').join('') + '</w:tbl>');
      body.push(para('', { after: 2 }));
    } else body.push(para(fill(ln, {})));
  }
  const sect = '<w:sectPr><w:footerReference w:type="default" r:id="rIdFoot"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + NS + '><w:body>' + body.join('') + sect + '</w:body></w:document>';
  const font = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>';
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr>' + font + '<w:sz w:val="' + PT * 2 + '"/><w:szCs w:val="' + PT * 2 + '"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="108" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
  const settings = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="360"/>' +
    '<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>';
  const footer = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
    '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  const docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
    '<Relationship Id="rIdFoot" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
    media.map((m) => '<Relationship Id="' + m.id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + m.name.slice(5) + '"/>').join('') + '</Relationships>';
  const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>' +
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const title = ((String(markup).match(/^#T (.*)$/m) || [])[1] || '').replace(/\$[^$]*\$/g, '').trim();
  const core = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:title>' + X(title) + '</dc:title><dc:creator>ToanViet Studio</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + now + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + now + '</dcterms:modified></cp:coreProperties>';
  const buf = zip([
    { name: '[Content_Types].xml', data: types },
    { name: '_rels/.rels', data: rootRels },
    { name: 'docProps/core.xml', data: core },
    { name: 'word/document.xml', data: documentXml },
    { name: 'word/styles.xml', data: styles },
    { name: 'word/settings.xml', data: settings },
    { name: 'word/footer1.xml', data: footer },
    { name: 'word/_rels/document.xml.rels', data: docRels },
    ...media.map((m) => ({ name: m.name, data: m.data })),
  ]);
  return { buf, missing, count };
}

module.exports = { buildDocx, zip, crc32 };
