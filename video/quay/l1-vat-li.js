// Bản 2.8.0 — Vật lí: chọn môn, mạch điện theo lưới (thêm linh kiện), dựng ảnh qua thấu kính (đổi d: ảnh thật → ảo),
// đồ thị số liệu (đường thẳng phù hợp), công thức có đơn vị
(async () => {
  __clear(); await w(300);
  const R = String.raw;
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await chonMuc('#modeBadge', 'li', 800); await w(1000);
  REC.mark('mach');
  await chenMon('machsongsong', 40, 20, 340, 260); await w(1000);
  // thêm nhánh thứ ba: bóng đèn song song
  await themO('kichban', '\nP = (0, -2)\nQ = (5, -2)\nday M P\nden P Q = Đ\nday Q N', 70); await w(1500);
  REC.mark('thau-kinh');
  await chenMon('thaukinh', 390, 20, 390, 270); await w(1800);
  await goO('d', '6', 200); await w(2800);
  await goO('d', '25', 200); await w(1000);
  REC.mark('so-lieu');
  await chenMon('sodulieu2', 40, 330, 370, 260); await w(1500);
  await chenMon('sodulieu', 410, 330, 370, 260); await w(1200);
  REC.mark('cong-thuc');
  await clickEl(cmdBtn('ins-formula'), 800); await w(1200);
  const m = document.getElementById('mf'); m.focus(); m.insert(R`P=UI=I^{2}R=\frac{U^{2}}{R}`); m.dispatchEvent(new Event('input')); await w(2200);
  await clickEl('#fxok', 700); await w(400); await datCho(60, 620); await w(1500);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
