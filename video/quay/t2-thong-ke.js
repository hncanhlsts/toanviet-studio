// Bản 2.8.0 — Toán: thống kê và xác suất (bảng tần số, biểu đồ cột kép, hình quạt, ghép nhóm có đa giác tần số, sơ đồ cây)
(async () => {
  __clear(); await w(300);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await chonMuc('#modeBadge', 'toan', 800); await w(800);
  REC.mark('bang');
  await chenMon('bangsl', 40, 20, 714, 76); await w(800);
  REC.mark('cot');
  await chenMon('bdcotkep', 30, 110, 380, 280); await w(600);
  await themO('dulieu', '\nTin học | 6 | 9', 90); await w(1200);
  REC.mark('quat');
  await chenMon('bdquat', 420, 130, 350, 230); await w(1200);
  REC.mark('ghep');
  await chenMon('ghepnhom', 30, 410, 380, 270); await w(500);
  const cb = [...document.querySelectorAll('#props label.chk')].find((l) => /đa giác/.test(l.textContent));
  if (cb) await clickEl(cb.querySelector('input'), 700);
  await w(1400);
  REC.mark('cay');
  await chenMon('sodocay', 420, 420, 350, 230); await w(2200);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
