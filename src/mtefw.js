// Ghi công thức ToanViet thành đối tượng MathType (Equation.DSMT4) cho Word:
// MathML (từ LaTeX) -> MTEF 5 -> tệp OLE (CFB) -> gói XML để chèn vào Word.
// Chỉ ghi những cấu trúc đã đối chiếu với dữ liệu MathType thật; cấu trúc khác báo "chưa hỗ trợ" để giữ nguyên công thức.
(function (root) {
  'use strict';
  const hex = (s) => s.match(/../g).map((h) => parseInt(h, 16));
  // Phần mở đầu chuẩn của MathType 7 (bảng mã, phông, thiết lập kích thước) lấy từ một công thức thật
  const PRE = hex('050100070444534d543700001357696e416c6c4261736963436f6465506167657300110554696d6573204e657720526f6d616e00110353796d626f6c001105436f7572696572204e65770011044d5420457874726100120008212f458f442f4150f4100f475f4150f21f1e4150f4150f4100f445f425f48f425f4100f4100f435f4100f48f45f42a5f48f48f4100f4100f40f48f417f48f4100f412a5f445f45f45f45f45f410f0c0100010001020202020002000101010003000100040000');
  const COMPOBJ = hex('0100feff030a0000ffffffff03ce020000000000c000000000000046160000004d6174685479706520372e30204571756174696f6e000c0000004d61746854797065204546000f0000004571756174696f6e2e44534d543400f439b271000000000000000000000000');
  const OLE = hex('0100000208000000000000000000000000000000');
  const OBJINFO = hex('000003000400');
  const CLSID = hex('03ce020000000000c000000000000046');

  const SYMPOS = { 0x2b: 0x2b, 0x3d: 0x3d, 0x2212: 0x2d, 0x3c: 0x3c, 0x3e: 0x3e, 0xD7: 0xb4, 0xF7: 0xb8, 0xB1: 0xb1, 0x2264: 0xa3, 0x2265: 0xb3, 0x2260: 0xb9, 0x2248: 0xbb, 0x221E: 0xa5, 0x2208: 0xce, 0x2209: 0xcf, 0x2282: 0xcc, 0x222A: 0xc8, 0x2229: 0xc7,
    0x2192: 0xae, 0x21D2: 0xde, 0x21D4: 0xdb, 0x22A5: 0x5e, 0x2220: 0xd0, 0x2205: 0xc6, 0x2200: 0x22, 0x2203: 0x24, 0x22C5: 0xd7, 0x2261: 0xba, 0x223C: 0x7e, 0x2032: 0xa2, 0xB0: 0xb0, 0x28: 0x28, 0x29: 0x29, 0x5b: 0x5b, 0x5d: 0x5d, 0x7c: 0x7c, 0x2f: 0x2f };
  const GREEK = 'αa βb γg δd εe ζz ηh θq ιi κk λl μm νn ξx πp ρr σs τt υu φj ϕf χc ψy ωw ΓG ΔD ΘQ ΛL ΞX ΠP ΣS ΦF ΨY ΩW'.split(' ').reduce((m, p) => { m[p.codePointAt(0)] = p.charCodeAt(p.length - 1); return m; }, {});
  const FENCES = { '(': [1, ')'], '[': [3, ']'], '{': [2, '}'], '|': [4, '|'] };
  const unsupported = (what) => { throw new Error('chưa hỗ trợ: ' + what); };

  const ch = (code, tf, pos) => (pos === undefined ? [2, 0, tf + 128, code & 255, code >> 8] : [2, 4, tf + 128, code & 255, code >> 8, pos]);
  const line = (items) => [1, 0].concat(items, [0]);
  const NULL_LINE = [1, 1];
  const SPACE = [2, 0, 0x98, 0x02, 0xef];

  function chars(text, kind) {
    let out = [];
    for (const c of text) {
      const code = c.codePointAt(0);
      if (code > 0xFFFF) unsupported('ký tự ' + c);
      if (code === 0x2061 || code === 0x2062 || code === 0x2063 || code === 0x200B) continue;
      if (code === 0xA0 || code === 0x20) { out = out.concat(kind === 'text' ? ch(0x20, 1) : SPACE); continue; }
      if (kind === 'text') out = out.concat(ch(code, 1));
      else if (kind === 'func') out = out.concat(ch(code, 2));
      else if (kind === 'num') out = out.concat(ch(code, 8));
      else if (GREEK[code] !== undefined) out = out.concat(ch(code, code < 0x3b1 ? 5 : 4, GREEK[code]));
      else if (kind === 'var') out = out.concat(ch(code, 3));
      else if (',.:;!?'.includes(c)) out = out.concat(ch(code, 2));
      else { const k = code === 0x2d ? 0x2212 : code === 0x2218 ? 0xB0 : code; out = out.concat(ch(k, 6, SYMPOS[k])); }
    }
    return out;
  }
  const kids = (n) => [...n.childNodes].filter((c) => c.nodeType === 1 || (c.nodeType === 3 && c.textContent.length));
  function seq(nodes) { let out = []; for (const n of nodes) out = out.concat(conv(n)); return out; }
  const script = (sel, sub, sup) => [3, 0, sel, 0, 0, 0x0b].concat(sub, sup, [0, 0x0a]);
  function conv(n) {
    if (n.nodeType === 3) return /^[\s ]+$/.test(n.textContent) ? SPACE : chars(n.textContent, 'var');
    const tag = n.localName, t = n.textContent, c = kids(n);
    switch (tag) {
      case 'math': case 'mrow': case 'mstyle': case 'mpadded': case 'semantics': {
        const first = c[0], last = c[c.length - 1];
        if (c.length >= 2 && first.localName === 'mo' && last.localName === 'mo' && FENCES[first.textContent] && FENCES[first.textContent][1] === last.textContent && tag === 'mrow') {
          const f = FENCES[first.textContent];
          return [3, 0, f[0], 3, 0].concat(line(seq(c.slice(1, -1))), ch(first.textContent.charCodeAt(0), 22), ch(last.textContent.charCodeAt(0), 22), [0]);
        }
        return seq(c);
      }
      case 'mi': return /^[A-Za-z]{2,}$/.test(t) ? chars(t, 'func') : chars(t, 'var');
      case 'mn': return chars(t, 'num');
      case 'mo': return /^[A-Za-z]{2,}$/.test(t) ? chars(t, 'func') : chars(t, 'op');
      case 'mtext': return chars(t, 'text');
      case 'mspace': return SPACE;
      case 'mfrac': return [3, 0, 11, 0, 0].concat(line(conv(c[0])), line(conv(c[1])), [0]);
      case 'msqrt': return [3, 0, 10, 0, 0].concat(line(seq(c)), NULL_LINE, [0]);
      case 'mroot': return [3, 0, 10, 1, 0].concat(line(conv(c[0])), [0x0b], line(conv(c[1])), [0, 0x0a]);
      case 'msup': {
        const s = c[c.length - 1].textContent.replace(/[⁡⁢]/g, '');
        const base = seq(c.slice(0, -1));
        if (/^[′']+$/.test(s)) return base.concat(...[...s].map(() => ch(0x2032, 6, 0xa2)));
        if (s === '∘' || s === '°') return base.concat(ch(0xB0, 6, 0xb0));
        return base.concat(script(28, NULL_LINE, line(conv(c[c.length - 1]))));
      }
      case 'msub': return conv(c[0]).concat(script(27, line(conv(c[1])), NULL_LINE));
      case 'msubsup': return conv(c[0]).concat(script(29, line(conv(c[1])), line(conv(c[2]))));
      case 'mover': {
        const acc = c[1] ? c[1].textContent : '';
        if (acc === 'undefined' || acc === '^' || acc === '̂' || acc === 'ˆ' || acc === '^') return [3, 0, 33, 0, 0].concat(line(conv(c[0])), ch(0x302, 22), [0]);
        return unsupported('dấu phía trên "' + acc + '"');
      }
      default: return unsupported(tag);
    }
  }
  function latexToMtef(latex) {
    const holder = document.createElement('div');
    holder.innerHTML = '<math>' + MathLive.convertLatexToMathMl(latex) + '</math>';
    const body = conv(holder.firstElementChild);
    return Uint8Array.from(PRE.concat([0x0a], line(body), [0]));
  }

  // ---------- Tệp OLE (CFB) tối thiểu: các luồng đều nằm trong mini stream ----------
  function buildOle(mtef) {
    const eqn = new Uint8Array(28 + mtef.length), dv = new DataView(eqn.buffer);
    dv.setUint16(0, 28, true); dv.setUint32(2, 0x00020000, true); dv.setUint16(6, 0xC286, true); dv.setUint32(8, mtef.length, true);
    eqn.set(mtef, 28);
    // thứ tự theo quy tắc CFB: tên ngắn trước, cùng độ dài thì so mã ký tự
    const streams = [['\u0001Ole', Uint8Array.from(OLE)], ['\u0001CompObj', Uint8Array.from(COMPOBJ)], ['\u0003ObjInfo', Uint8Array.from(OBJINFO)], ['Equation Native', eqn]];
    const miniFat = [], miniParts = [];
    let miniSecs = 0;
    streams.forEach((s) => {
      const n = Math.max(1, Math.ceil(s[1].length / 64));
      s.start = miniSecs;
      for (let k = 0; k < n; k++) miniFat.push(k === n - 1 ? 0xFFFFFFFE : miniSecs + k + 1);
      const buf = new Uint8Array(n * 64); buf.set(s[1]); miniParts.push(buf);
      miniSecs += n;
    });
    const miniLen = miniSecs * 64, miniSectors = Math.ceil(miniLen / 512), miniFatSectors = Math.ceil(miniFat.length * 4 / 512);
    // bố trí sector: 0 = FAT, 1-2 = thư mục, tiếp theo miniFAT, rồi mini stream
    const dirStart = 1, dirSectors = 2, mfStart = dirStart + dirSectors, msStart = mfStart + miniFatSectors, total = msStart + miniSectors;
    const out = new Uint8Array(512 * (total + 1)), o = new DataView(out.buffer);
    out.set(hex('d0cf11e0a1b11ae1'), 0);
    o.setUint16(0x18, 0x003E, true); o.setUint16(0x1A, 3, true); o.setUint16(0x1C, 0xFFFE, true); o.setUint16(0x1E, 9, true); o.setUint16(0x20, 6, true);
    o.setUint32(0x2C, 1, true); o.setUint32(0x30, dirStart, true); o.setUint32(0x38, 4096, true); o.setUint32(0x3C, mfStart, true); o.setUint32(0x40, miniFatSectors, true);
    o.setUint32(0x44, 0xFFFFFFFE, true); o.setUint32(0x48, 0, true);
    for (let k = 0; k < 109; k++) o.setUint32(0x4C + 4 * k, k === 0 ? 0 : 0xFFFFFFFF, true);
    const sec = (n) => 512 * (n + 1);
    // FAT
    const fat = new Array(128).fill(0xFFFFFFFF);
    fat[0] = 0xFFFFFFFD;
    const chain = (start, n) => { for (let k = 0; k < n; k++) fat[start + k] = k === n - 1 ? 0xFFFFFFFE : start + k + 1; };
    chain(dirStart, dirSectors); chain(mfStart, miniFatSectors); chain(msStart, miniSectors);
    fat.forEach((v, k) => o.setUint32(sec(0) + 4 * k, v, true));
    // thư mục
    const entry = (idx, name, type, right, child, start, size, clsid) => {
      const p = sec(dirStart) + idx * 128;
      for (let k = 0; k < name.length; k++) o.setUint16(p + 2 * k, name.charCodeAt(k), true);
      o.setUint16(p + 0x40, (name.length + 1) * 2, true);
      out[p + 0x42] = type; out[p + 0x43] = 1;
      o.setUint32(p + 0x44, 0xFFFFFFFF, true); o.setUint32(p + 0x48, right, true); o.setUint32(p + 0x4C, child, true);
      if (clsid) out.set(clsid, p + 0x50);
      o.setUint32(p + 0x74, start, true); o.setUint32(p + 0x78, size, true);
    };
    entry(0, 'Root Entry', 5, 0xFFFFFFFF, 1, msStart, miniLen, CLSID);
    streams.forEach((s, k) => entry(k + 1, s[0], 2, k < streams.length - 1 ? k + 2 : 0xFFFFFFFF, 0xFFFFFFFF, s.start, s[1].length));
    for (let idx = streams.length + 1; idx < dirSectors * 4; idx++) { const p = sec(dirStart) + idx * 128; o.setUint32(p + 0x44, 0xFFFFFFFF, true); o.setUint32(p + 0x48, 0xFFFFFFFF, true); o.setUint32(p + 0x4C, 0xFFFFFFFF, true); }
    // miniFAT + mini stream
    for (let k = 0; k < miniFatSectors * 128; k++) o.setUint32(sec(mfStart) + 4 * k, k < miniFat.length ? miniFat[k] : 0xFFFFFFFF, true);
    let pos = sec(msStart);
    miniParts.forEach((b) => { out.set(b, pos); pos += b.length; });
    return out;
  }

  const b64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
  // Gói XML (flat OPC) để Word chèn một đối tượng MathType kèm ảnh xem trước
  function wordXml(latex, img, pngB64) {
    const ole = buildOle(latexToMtef(latex));
    const w = Math.round(img.w * 100) / 100, h = Math.round(img.h * 100) / 100, id = '_' + (1700000000 + Math.floor(Math.random() * 99999999));
    const P = 'http://schemas.openxmlformats.org/';
    return '<?xml version="1.0" standalone="yes"?><pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">' +
      '<pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="' + P + 'package/2006/relationships"><Relationship Id="rId1" Type="' + P + 'officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships></pkg:xmlData></pkg:part>' +
      '<pkg:part pkg:name="/word/_rels/document.xml.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData><Relationships xmlns="' + P + 'package/2006/relationships"><Relationship Id="rIdTvImg" Type="' + P + 'officeDocument/2006/relationships/image" Target="media/image1.png"/><Relationship Id="rIdTvOle" Type="' + P + 'officeDocument/2006/relationships/oleObject" Target="embeddings/oleObject1.bin"/></Relationships></pkg:xmlData></pkg:part>' +
      '<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData>' +
      '<w:document xmlns:w="' + P + 'wordprocessingml/2006/main" xmlns:r="' + P + 'officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:body><w:p><w:r><w:rPr><w:position w:val="-' + Math.round((img.depthPt || 0) * 2) + '"/></w:rPr>' +
      '<w:object w:dxaOrig="' + Math.round(w * 20) + '" w:dyaOrig="' + Math.round(h * 20) + '"><v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe" filled="f" stroked="f"><v:stroke joinstyle="miter"/><v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/><o:lock v:ext="edit" aspectratio="t"/></v:shapetype>' +
      '<v:shape id="_x0000_i1025" type="#_x0000_t75" style="width:' + w + 'pt;height:' + h + 'pt" o:ole=""><v:imagedata r:id="rIdTvImg" o:title=""/></v:shape>' +
      '<o:OLEObject Type="Embed" ProgID="Equation.DSMT4" ShapeID="_x0000_i1025" DrawAspect="Content" ObjectID="' + id + '" r:id="rIdTvOle"/></w:object></w:r></w:p></w:body></w:document></pkg:xmlData></pkg:part>' +
      '<pkg:part pkg:name="/word/media/image1.png" pkg:contentType="image/png" pkg:compression="store"><pkg:binaryData>' + pngB64 + '</pkg:binaryData></pkg:part>' +
      '<pkg:part pkg:name="/word/embeddings/oleObject1.bin" pkg:contentType="application/vnd.openxmlformats-officedocument.oleObject" pkg:compression="store"><pkg:binaryData>' + b64(ole) + '</pkg:binaryData></pkg:part></pkg:package>';
  }

  root.MTEFW = { latexToMtef, buildOle, wordXml };
})(window);
