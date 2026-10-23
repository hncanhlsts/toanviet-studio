// Bản 2.8.0 — nâng cao: AI viết hình theo môn (khối mã toanviet-mon) → hộp Kịch bản vẽ đúng hình
(async () => {
  __clear(); await w(300);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await clickEl(document.querySelectorAll('[data-cmd="ins-kichban"]')[0], 900); await w(1500);
  REC.mark('dan');
  const src = document.getElementById('kbsrc'), F = '```';
  const T = F + 'toanviet-mon\nloai: thaukinh2\nf: 12\nd: 20\nhv: 4\n' + F;
  await clickEl(src, 700); src.focus();
  for (const ch of T) { src.value += ch; src.dispatchEvent(new Event('input', { bubbles: true })); await w(40); }
  await w(2000);
  REC.mark('chen');
  await clickEl('#kbok', 800); await w(400); await datCho(60, 40, 620, 300); await w(2800);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
