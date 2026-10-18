// Cảnh 2 — Bảng biến thiên, bảng xét dấu, đồ thị, miền nghiệm: nhập hàm số, hình tự lập theo đúng mẫu SGK
(async () => {
  __clear(); await w(300);
  const page = document.getElementById('page');
  const last = () => { const a = [...page.querySelectorAll('.obj')]; return a[a.length - 1]; };
  const place = async (x, y) => {
    const el = last(), r = el.getBoundingClientRect(), pr = page.getBoundingClientRect(), z = parseFloat(page.style.zoom) || 1;
    const sx = r.x + 30, sy = r.y + 20;
    await drag(sx, sy, sx + (x - (r.x - pr.x) / z) * z, sy + (y - (r.y - pr.y) / z) * z, 800);
  };
  const logRect = (name) => { const r = last().getBoundingClientRect(); console.log('LOG rect ' + name + ' ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',')); };
  // nút Lập bảng … tự động trong khung Thuộc tính
  const autoBtn = () => [...document.querySelectorAll('#props button')].find((b) => /tự động/.test(b.textContent) && b.offsetParent);
  REC.cur = { x: 700, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  // bảng biến thiên
  await clickEl(cmdBtn('ins-bbt'), 900); await w(800);
  REC.mark('bbt-go');
  await typeInto('#props [data-k="expr"], #props #expr', 'x^3 - 3x^2 + 2', 160);
  await w(400); await clickEl(autoBtn(), 700);
  await w(1500); logRect('bbt');
  REC.mark('xet-dau');
  await clickEl(cmdBtn('ins-sign'), 900); await w(700);
  await place(60, 250); await w(300);
  await typeInto('#props [data-k="expr"], #props #expr', '-x^2 + 2x + 3', 160);
  await w(400); await clickEl(autoBtn(), 700);
  await w(1500); logRect('sign');
  REC.mark('do-thi');
  await clickEl(cmdBtn('ins-graph'), 900); await w(700);
  await place(40, 360); await w(300);
  await typeInto('#props [data-k="funcs"], #props #funcs', 'x^2 - 4x + 3', 160);
  await w(500);
  await typeInto('#props [data-k="points"], #props #points', 'I(2; -1)', 160);
  await w(1500); logRect('graph');
  REC.mark('mien-nghiem');
  await clickEl(cmdBtn('ins-region'), 900); await w(700);
  await place(420, 360); await w(500);
  // ô hệ bất phương trình: gõ cả hệ, mỗi dòng một bất phương trình
  const ta = document.querySelector('#props [data-k="ineqs"], #props #ineqs');
  await clickEl(ta); ta.select(); await window.api.testKeys([K('Backspace')]); await w(150);
  for (const [i, l] of ['x + 2y <= 8', 'x + y <= 5', 'x >= 0', 'y >= 0'].entries()) { await type([l], 90); if (i < 3) await window.api.testKeys([K('Enter', [], String.fromCharCode(13))]); await w(150); }
  await w(1200); logRect('region');
  await click(1150, 120, 600); hideCursor(); await w(1800);
  REC.mark('het');
  const pr = page.getBoundingClientRect(); console.log('LOG page ' + [pr.x, pr.y, pr.width].map(Math.round).join(','));
  await REC.stop();
})();
