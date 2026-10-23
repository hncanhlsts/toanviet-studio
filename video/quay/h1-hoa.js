// Bản 2.8.0 — Hoá học: phương trình gõ như viết tay, cân bằng hệ số tự động, chèn thành công thức;
// cấu hình electron (đổi nguyên tố), công thức cấu tạo thu gọn
(async () => {
  __clear(); await w(300);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await chonMuc('#modeBadge', 'hoa', 800); await w(1000);
  REC.mark('pt');
  await clickEl(cmdBtn('ptpu'), 800); await w(800);
  await goO(document.getElementById('ptsrc'), 'KMnO4 + HCl -> KCl + MnCl2 + Cl2↑ + H2O', 70); await w(1800);
  REC.mark('can-bang');
  await clickEl('#ptcb', 800); await w(2400);
  await clickEl('#ptok', 700); await w(400); await datCho(40, 30); await w(800);
  await clickEl(cmdBtn('ptpu'), 800); await w(600);
  await goO(document.getElementById('ptsrc'), 'N2 + H2 <=>[t°, xt, p] NH3', 80); await w(800);
  await clickEl('#ptcb', 700); await w(1500);
  await clickEl('#ptok', 700); await w(400); await datCho(40, 90); await w(800);
  REC.mark('nguyen-tu');
  await chenMon('nguyentu', 30, 160, 420, 420); await w(1200);
  await goO('z', 'Cr', 200); await w(2500);
  REC.mark('cau-tao');
  await chenMon('cautao', 470, 180, 300, 170); await w(800);
  await goO('ct', 'CH3-C(CH3)2-CH=CH2', 90); await w(2200);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
