// Cảnh 4 — Hình không gian: chèn hình chóp, xoay bằng chuột (nét khuất tự đứt), dựng nhanh trung điểm, giao điểm
(async () => {
  __clear(); await w(300);
  for (let i = 0; i < 4; i++) { __run('zoomin'); await w(50); }
  await w(300);
  const page = document.getElementById('page');
  const last = () => { const a = [...page.querySelectorAll('.obj')]; return a[a.length - 1]; };
  const qbtn = (t) => [...document.querySelectorAll('#props button')].find((b) => b.textContent.trim() === t && b.offsetParent);
  const pts = () => [...document.querySelectorAll('.pth')].map((e) => e.dataset.pt);
  const pick = async (n) => { await clickEl('.pth[data-pt="' + n + '"]', 600); await w(250); };
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  const sel = document.getElementById('solidKind');
  await clickEl(sel, 900); await w(300);
  sel.value = 'sp:k_chop4sa'; sel.dispatchEvent(new Event('change', { bubbles: true })); await w(500);
  await clickEl(cmdBtn('ins-solid'), 500); await w(1200);
  const r0 = last().getBoundingClientRect(); console.log('LOG rect chop ' + [r0.x, r0.y, r0.width, r0.height].map(Math.round).join(','));
  REC.mark('xoay');
  // xoay hình bằng chuột
  let [rx, ry] = at('.roth');
  await drag(rx, ry, rx - 110, ry + 25, 2200); await w(400);
  [rx, ry] = at('.roth');
  await drag(rx, ry, rx + 150, ry - 20, 2400); await w(600);
  // về góc nhìn SGK
  await dblclick(...at('.roth'), 600); await w(900);
  REC.mark('dung');
  // dựng nhanh: trung điểm của SC
  await pick('S'); await pick('C');
  let before = pts();
  await clickEl(qbtn('Trung điểm'), 700); await w(900);
  const M = pts().find((n) => !before.includes(n));
  // hai đường chéo AC, BD (nét khuất tự đứt) rồi giao điểm của chúng
  await pick('A'); await pick('C'); await clickEl(qbtn('Đoạn'), 600); await w(700);
  await pick('B'); await pick('D'); await clickEl(qbtn('Đoạn'), 600); await w(700);
  await pick('A'); await pick('C'); await pick('B'); await pick('D');
  before = pts();
  await clickEl(qbtn('Giao điểm'), 700); await w(900);
  const O = pts().find((n) => !before.includes(n));
  console.log('LOG diem moi ' + M + ' ' + O);
  // nối đoạn OM
  if (M && O) { await pick(O); await pick(M); await clickEl(qbtn('Đoạn'), 700); await w(900); }
  await click(900, 830, 600); hideCursor(); await w(2000);
  REC.mark('het');
  const r = last().getBoundingClientRect(); console.log('LOG rect chop2 ' + [r.x, r.y, r.width, r.height].map(Math.round).join(','));
  await REC.stop();
})();
