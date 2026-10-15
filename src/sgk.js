// Ký hiệu, hình vẽ thường gặp trong SGK Vật lí, Hoá học, Sinh học (vẽ bằng SVG, co giãn được)
(function (root) {
  'use strict';
  const r1 = (v) => Math.round(v * 10) / 10;
  const txt = (x, y, s, size) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Times New Roman, serif" font-size="${size || 22}" fill="COL" stroke="none">${s}</text>`;
  const meter = (ch) => 'P:M0,30H40M80,30H120;C:60,30,20;' + 'T:' + ch;
  // Mỗi ký hiệu: [tên, [rộng, cao], mã vẽ]. Mã vẽ gồm các phần ngăn bởi ";":
  //   P:<path>  nét thường   B:<path> nét đậm   D:<path> nét đứt   F:<path> tô đặc   C:cx,cy,r đường tròn   T:<chữ ở giữa>   S:<svg thô>
  const G = [
    ['Vật lí – Mạch điện', {
      dientro: ['Điện trở', [120, 60], 'P:M0,30H30M90,30H120M30,18H90V42H30Z'],
      bientro: ['Biến trở', [120, 60], 'P:M0,30H30M90,30H120M30,18H90V42H30ZM38,54L84,8M84,8l-10,2M84,8l-2,10'],
      nguon: ['Nguồn điện (pin)', [120, 60], 'P:M0,30H54M66,30H120M54,10V50;B:M66,20V40;S:' + txt(42, 16, '+', 18) + txt(79, 16, '−', 18)],
      bopin: ['Bộ nguồn nhiều pin', [120, 60], 'P:M0,30H38M82,30H120M38,10V50M70,10V50;B:M48,20V40M82,20V40;D:M48,30H70;S:' + txt(28, 16, '+', 18) + txt(94, 16, '−', 18)],
      den: ['Bóng đèn', [120, 60], 'P:M0,30H40M80,30H120M46,16L74,44M74,16L46,44;C:60,30,20'],
      congtacmo: ['Công tắc mở', [120, 60], 'P:M0,30H40M80,30H120M40,30L77,12;F:M40,30m-3,0a3,3 0 1 0 6,0a3,3 0 1 0 -6,0M80,30m-3,0a3,3 0 1 0 6,0a3,3 0 1 0 -6,0'],
      congtacdong: ['Công tắc đóng', [120, 60], 'P:M0,30H120;F:M40,30m-3,0a3,3 0 1 0 6,0a3,3 0 1 0 -6,0M80,30m-3,0a3,3 0 1 0 6,0a3,3 0 1 0 -6,0'],
      ampeke: ['Ampe kế', [120, 60], meter('A')],
      vonke: ['Vôn kế', [120, 60], meter('V')],
      dienke: ['Điện kế', [120, 60], meter('G')],
      tudien: ['Tụ điện', [120, 60], 'P:M0,30H54M66,30H120M54,10V50M66,10V50'],
      cuoncam: ['Cuộn cảm', [120, 60], 'P:M0,30H24a9,9 0 0 1 18,0a9,9 0 0 1 18,0a9,9 0 0 1 18,0a9,9 0 0 1 18,0H120'],
      diot: ['Điốt', [120, 60], 'P:M0,30H45M75,30H120M45,15V45L75,30ZM75,15V45'],
      chuong: ['Chuông điện', [120, 60], 'P:M0,30H44M76,30H120M44,36H76M46,36A14,16 0 0 1 74,36'],
      dongco: ['Động cơ điện', [120, 60], meter('M')],
    }],
    ['Vật lí – Quang học', {
      tkhoitu: ['Thấu kính hội tụ', [200, 120], 'P:M100,10V110M92,20L100,10L108,20M92,100L100,110L108,100M50,56V64M150,56V64;N:M0,60H200', [[100, 72, 'O', -9], [50, 76, 'F'], [150, 76, "F'"]]],
      tkphanki: ['Thấu kính phân kì', [200, 120], 'P:M100,12V108M92,10L100,20L108,10M92,110L100,100L108,110M50,56V64M150,56V64;N:M0,60H200', [[100, 72, 'O', -9], [50, 76, 'F'], [150, 76, "F'"]]],
      guong: ['Gương phẳng', [120, 40], 'P:M5,14H115;N:M10,14l-8,10M22,14l-8,10M34,14l-8,10M46,14l-8,10M58,14l-8,10M70,14l-8,10M82,14l-8,10M94,14l-8,10M106,14l-8,10M115,14l-8,10'],
      tiasang: ['Tia sáng', [120, 30], 'P:M0,15H120M52,9L66,15L52,21'],
      phanxa: ['Phản xạ ánh sáng', [200, 120], 'P:M10,100H190M30,20L100,100L170,20M58,52l9,2M58,52l2,9M142,52l-12,3M142,52l-1,-11;D:M100,100V12;N:M20,100l-8,10M40,100l-8,10M60,100l-8,10M80,100l-8,10M100,100l-8,10M120,100l-8,10M140,100l-8,10M160,100l-8,10M180,100l-8,10', [[100, 5, 'N'], [22, 18, 'S'], [178, 18, 'R'], [100, 112, 'I', 10], [88, 70, 'i'], [112, 70, "i'"]]],
      khucxa: ['Khúc xạ ánh sáng', [200, 140], 'P:M10,70H190M40,10L100,70L135,132M66,36l9,2M66,36l2,9M121,107l-9,-3M121,107l1,-10;D:M100,6V136', [[100, 0, 'N'], [30, 8, 'S'], [144, 132, 'R'], [108, 62, 'I', 4], [88, 42, 'i'], [108, 100, 'r']]],
    }],
    ['Vật lí – Cơ học', {
      loxo: ['Lò xo', [120, 40], 'P:M0,20H14L19,8L29,32L39,8L49,32L59,8L69,32L79,8L89,32L99,8L104,20H120'],
      conlac: ['Con lắc đơn', [120, 130], 'P:M30,12H90M60,12L88,100;C:88,108,8;D:M60,12V118;N:M36,12l8,-8M48,12l8,-8M60,12l8,-8M72,12l8,-8M84,12l8,-8', [[70, 44, '\\alpha'], [84, 52, 'l', 10]]],
      matnghieng: ['Vật trên mặt phẳng nghiêng', [180, 110], 'P:M10,98H170V28ZM86,52l-8,16l32,16l8,-16ZM44,98A34,34 0 0 0 40.5,84.7', [[58, 88, '\\alpha']]],
      vatluc: ['Vật và các lực', [180, 130], 'P:M10,92H170M60,60H120V92H60ZM90,76V124M90,124l-4,-9M90,124l4,-9M90,76V14M90,14l-4,9M90,14l4,9M120,76H166M166,76l-9,-4M166,76l-9,4M60,84H18M18,84l9,-4M18,84l9,4', [[104, 122, '\\vec{P}'], [104, 16, '\\vec{N}'], [160, 62, '\\vec{F}'], [26, 70, '\\vec{F}_{ms}']]],
      rongroc: ['Ròng rọc cố định', [100, 130], 'P:M20,8H80M50,8V34M30,50V118M70,50V104M62,104H78V120H62Z;C:50,50,20;F:M50,50m-3,0a3,3 0 1 0 6,0a3,3 0 1 0 -6,0;N:M26,8l8,-8M38,8l8,-8M50,8l8,-8M62,8l8,-8M74,8l8,-8'],
    }],
    ['Hoá học', {
      benzen: ['Vòng benzen', [100, 100], 'P:M50,8L86.4,29V71L50,92L13.6,71V29Z;C:50,50,24'],
      benzenk: ['Vòng benzen (liên kết đôi xen kẽ)', [100, 100], 'P:M50,8L86.4,29V71L50,92L13.6,71V29ZM79.4,34.5V65.5M50,84L23.2,68.5M23.2,31.5L50,16'],
      ongnghiem: ['Ống nghiệm', [60, 140], 'P:M18,10V112a12,12 0 0 0 24,0V10M12,10H48;N:M18,72H42'],
      coc: ['Cốc thuỷ tinh', [100, 110], 'P:M20,10V94q0,8 8,8H72q8,0 8,-8V10M14,10H86;N:M20,48H80'],
      binhtamgiac: ['Bình tam giác', [100, 120], 'P:M40,10V42L13,104q-3,8 6,8H81q9,0 6,-8L60,42V10M34,10H66;N:M24,82H76'],
      binhcau: ['Bình cầu', [100, 120], 'P:M42,10V48A32,32 0 1 0 58,48V10M36,10H64;N:M21,88H79'],
      pheu: ['Phễu', [100, 110], 'P:M10,10H90L56,58V104L44,96V58Z'],
      dencon: ['Đèn cồn', [100, 110], 'P:M30,104H70q14,0 14,-14q0,-22 -24,-26V52H40V64q-24,4 -24,26q0,14 14,14M42,52V40H58V52M50,40C42,30 46,22 50,10C54,22 58,30 50,40'],
      oluongtu: ['Ô lượng tử (orbital)', [150, 40], ''],
    }],
    ['Sinh học', {
      duc: ['Giới đực ♂', [100, 100], 'P:M62.5,43.5L88,18M88,18H70M88,18V36;C:45,61,25'],
      cai: ['Giới cái ♀', [100, 110], 'P:M50,60V104M34,84H66;C:50,35,25'],
      nam: ['Phả hệ: nam bình thường', [60, 60], 'P:M10,10H50V50H10Z'],
      nu: ['Phả hệ: nữ bình thường', [60, 60], 'C:30,30,21'],
      nambenh: ['Phả hệ: nam bị bệnh', [60, 60], 'F:M10,10H50V50H10Z;P:M10,10H50V50H10Z'],
      nubenh: ['Phả hệ: nữ bị bệnh', [60, 60], 'F:M30,30m-21,0a21,21 0 1 0 42,0a21,21 0 1 0 -42,0;C:30,30,21'],
      honnhan: ['Phả hệ: cặp vợ chồng và con', [160, 130], 'P:M10,10H44V44H10ZM44,27H106M75,27V70M40,70H110M40,70V86M110,70V86M23,86H57V120H23Z;C:127,27,21;C:110,103,17'],
      nst: ['Nhiễm sắc thể kép', [80, 120], 'K:M24,10Q46,60 24,110M56,10Q34,60 56,110;F:M40,60m-6,0a6,6 0 1 0 12,0a6,6 0 1 0 -12,0'],
      adn: ['Mạch kép ADN', [200, 70], 'P:M5,35C30,-10 55,-10 80,35S130,80 155,35S180,-10 195,20M5,35C30,80 55,80 80,35S130,-10 155,35S180,80 195,50;N:M20,19V51M35,10V60M50,10V60M65,19V51M95,19V51M110,10V60M125,10V60M140,19V51M170,19V51M185,13V57'],
    }],
  ];
  const find = (kind) => { for (const g of G) if (g[1][kind]) return g[1][kind]; return null; };

  function render(o, w, h) {
    const def = find(o.kind);
    if (!def) return { svg: '', labels: [], errors: ['Không có ký hiệu ' + o.kind] };
    const col = o.color || '#111', sw = parseFloat(o.stroke) || 1.5;
    let vb = def[1], code = def[2];
    const labels = [];
    let body = '';
    if (o.kind === 'oluongtu') {
      // mỗi ô: "ud" hai electron ghép đôi, "u" một electron, "d" một electron quay xuống, "-" ô trống
      const cells = String(o.data || 'ud ud u u u').trim().split(/\s+/).slice(0, 12);
      vb = [cells.length * 30 + 4, 40];
      cells.forEach((c, i) => {
        const x = 2 + i * 30;
        body += `<path d="M${x},5H${x + 30}V35H${x}Z" fill="none" stroke="${col}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`;
        const up = (cx) => `M${cx},29V11M${cx},11l-3.5,6M${cx},11l3.5,6`, dn = (cx) => `M${cx},11V29M${cx},29l-3.5,-6M${cx},29l3.5,-6`;
        let d = '';
        if (c === 'ud' || c === 'du') d = up(x + 10) + dn(x + 20); else if (c === 'u') d = up(x + 15); else if (c === 'd') d = dn(x + 15);
        if (d) body += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`;
      });
    } else {
      code.split(';').forEach((part) => {
        const t = part[0], v = part.slice(2);
        const st = `stroke="${col}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"`;
        if (t === 'P') body += `<path d="${v}" fill="none" ${st} stroke-width="${sw}"/>`;
        else if (t === 'B') body += `<path d="${v}" fill="none" ${st} stroke-width="${sw * 2.6}"/>`;
        else if (t === 'N') body += `<path d="${v}" fill="none" ${st} stroke-width="${Math.max(0.8, sw * 0.6)}"/>`;
        else if (t === 'D') body += `<path d="${v}" fill="none" ${st} stroke-width="${Math.max(0.8, sw * 0.7)}" stroke-dasharray="5 4"/>`;
        else if (t === 'F') body += `<path d="${v}" fill="${col}" stroke="none"/>`;
        else if (t === 'K') body += `<path d="${v}" fill="none" stroke="${col}" stroke-width="11" stroke-linecap="round"/>`;
        else if (t === 'C') { const a = v.split(','); body += `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" fill="none" ${st} stroke-width="${sw}"/>`; }
        else if (t === 'T') body += txt(60, 37.5, v, 24).replace('COL', col);
        else if (t === 'S') body += v.replace(/COL/g, col);
      });
    }
    // có nhãn phía trên thì dành riêng một dải cho nhãn, không để nhãn đè lên hình
    const top = o.label ? 20 : 0, s = Math.min(w / vb[0], Math.max(8, h - top) / vb[1]), tx = (w - vb[0] * s) / 2, ty = top + (Math.max(8, h - top) - vb[1] * s) / 2;
    if (o.inner !== false && def[3]) def[3].forEach((l) => labels.push({ x: tx + l[0] * s + (l[3] || 0), y: ty + l[1] * s, tex: l[2], size: Math.max(11, Math.min(18, 15 * s)) }));
    if (o.label) labels.push({ x: w / 2, y: 10, tex: o.label, size: 15 });
    return { svg: `<g transform="translate(${r1(tx)},${r1(ty)}) scale(${Math.round(s * 1000) / 1000})">${body}</g>`, labels, errors: [] };
  }
  const sizeOf = (kind) => { const d = find(kind); const vb = d ? d[1] : [120, 60]; const k = vb[0] >= 160 ? 1.3 : 1.2; return { w: Math.round(vb[0] * k), h: Math.round(vb[1] * k) + (kind === 'oluongtu' ? 0 : 0) }; };

  root.SGK = { render, GROUPS: G, sizeOf };
})(window);
