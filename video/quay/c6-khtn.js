// Cảnh 6 — Vật lí, Hoá học, Sinh học: ghép sơ đồ mạch điện từ ký hiệu, công thức theo môn (thẻ Vật lí / Hoá học / Sinh học),
// phương trình phản ứng có điều kiện, ô lượng tử, dụng cụ thí nghiệm, sơ đồ lai, phả hệ
(async () => {
  __clear(); await w(300);
  for (let i = 0; i < 2; i++) { __run('zoomin'); await w(50); }
  await w(300);
  const R = String.raw;
  const add = async (type, kind, props, ms) => { __add(type, kind, props); __unselect(); await w(ms || 450); };
  const L = (x, y, w2, h2) => add('shape', 'line', { x, y, w: w2, h: h2 }, 150);
  // mở hộp soạn, chọn thẻ môn, đưa công thức vào rồi chèn
  const formula = async (tab, grade, latex, x, y) => {
    await clickEl(cmdBtn('ins-formula'), 800); await w(500);
    const tb = [...document.querySelectorAll('#tabs button')].find((b) => b.textContent === tab);
    await clickEl(tb, 600); await w(400);
    const g = document.querySelectorAll('.gradebar button')[grade]; if (g) { await clickEl(g, 500); await w(400); }
    const fs = document.getElementById('fSize'); fs.value = '18'; fs.dispatchEvent(new Event('change', { bubbles: true }));
    const m = document.getElementById('mf'); m.focus(); m.insert(latex); m.dispatchEvent(new Event('input')); await w(1600);
    await clickEl('#fxok', 600); await w(500);
    // đặt vào chỗ bằng ô X, Y của khung Thuộc tính
    for (const [k, v] of [['x', x], ['y', y]]) {
      const e = document.querySelector('#props [data-k="' + k + '"], #props #' + k);
      if (e) { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    await w(200); __unselect(); await w(500);
  };
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  // ---------- Vật lí ----------
  REC.mark('ly');
  await add('text', null, { x: 40, y: 20, w: 714, size: 20, bold: true, align: 'center', color: '#1f3f7a', text: 'VẬT LÍ — sơ đồ mạch điện ghép từ ký hiệu SGK' }, 600);
  await add('sym', 'nguon', { x: 110, y: 80, w: 120, h: 80, label: R`\mathcal{E},\ r` });
  await add('sym', 'congtacdong', { x: 230, y: 80, w: 120, h: 80, label: 'K' });
  await add('sym', 'dientro', { x: 60, y: 220, w: 120, h: 80, label: 'R_1' });
  await add('sym', 'den', { x: 180, y: 220, w: 120, h: 80, label: R`\text{Đ}` });
  await add('sym', 'ampeke', { x: 300, y: 240, w: 120, h: 60 });
  await L(60, 130, 50, 0.5); await L(350, 130, 70, 0.5); await L(60, 130, 0.5, 140); await L(420, 130, 0.5, 140);
  await w(600);
  await formula('Vật lí', 2, R`I=\frac{\mathcal{E}}{R_{N}+r}`, 480, 110);
  await add('sym', 'tkhoitu', { x: 470, y: 200, w: 280, h: 170 }, 1800);
  REC.mark('hoa');
  // ---------- Hoá học ----------
  __clear(); await w(400);
  await add('text', null, { x: 40, y: 20, w: 714, size: 20, bold: true, align: 'center', color: '#1f3f7a', text: 'HOÁ HỌC — phương trình phản ứng, cấu hình electron, dụng cụ' }, 600);
  await formula('Hoá học', 1, R`\mathrm{CaCO_3\xrightarrow{t^{\circ}}CaO+CO_2\uparrow}`, 60, 70);
  await formula('Hoá học', 1, R`\overset{0}{\mathrm{Cu}}+\overset{+5}{\mathrm{N}}\to\overset{+2}{\mathrm{Cu}}+\overset{+2}{\mathrm{N}},\qquad\mathrm{SO_4^{2-}},\ \mathrm{Fe^{3+}}`, 60, 130);
  await add('formula', null, { x: 60, y: 210, size: 18, latex: '1s^{2}2s^{2}2p^{4}' }, 300);
  await add('sym', 'oluongtu', { x: 230, y: 196, w: 36, h: 56, data: 'ud', label: '1s' }, 300);
  await add('sym', 'oluongtu', { x: 300, y: 196, w: 36, h: 56, data: 'ud', label: '2s' }, 300);
  await add('sym', 'oluongtu', { x: 370, y: 196, w: 104, h: 56, data: 'ud u u', label: '2p' }, 500);
  await add('sym', 'ongnghiem', { x: 70, y: 290, w: 60, h: 150 }, 300);
  await add('sym', 'binhtamgiac', { x: 170, y: 300, w: 120, h: 140 }, 300);
  await add('sym', 'dencon', { x: 320, y: 320, w: 110, h: 120 }, 300);
  await add('sym', 'benzen', { x: 480, y: 310, w: 120, h: 120 }, 1800);
  REC.mark('sinh');
  // ---------- Sinh học ----------
  __clear(); await w(400);
  await add('text', null, { x: 40, y: 20, w: 714, size: 20, bold: true, align: 'center', color: '#1f3f7a', text: 'SINH HỌC — sơ đồ lai, phả hệ, di truyền quần thể' }, 600);
  await formula('Sinh học', 3, R`\displaylines{P:\quad\text{♂}\,AA\times\text{♀}\,aa\\ G_{P}:\quad A\qquad\quad a\\ F_{1}:\quad 100\%\,Aa}`, 60, 70);
  await add('formula', null, { x: 60, y: 196, size: 24, latex: R`\displaylines{F_{1}\times F_{1}:\quad Aa\times Aa\\ F_{2}:\quad 1AA:2Aa:1aa}` }, 500);
  await add('sym', 'honnhan', { x: 430, y: 80, w: 220, h: 180 }, 500);
  await add('formula', null, { x: 60, y: 330, size: 18, latex: R`p^{2}AA+2pqAa+q^{2}aa=1,\qquad \frac{AB}{ab}\times\frac{ab}{ab}` }, 500);
  await add('sym', 'adn', { x: 420, y: 300, w: 300, h: 105 }, 2200);
  hideCursor();
  REC.mark('het');
  await REC.stop();
})();
