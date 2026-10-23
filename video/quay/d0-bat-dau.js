// Bản 2.8.0 — bắt đầu: chọn môn (thanh công cụ đổi theo môn), giao diện cơ bản cho thầy cô mới làm quen
(async () => {
  __clear(); await w(300);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau'); await w(1800);
  REC.mark('chon-mon');
  for (const m of ['li', 'hoa', 'sinh', 'tieuhoc', 'toan']) { REC.mark('mon-' + m); await chonMuc('#modeBadge', m, 800); await w(2200); }
  REC.mark('co-ban');
  await clickEl('#uiBadge', 800); await w(3000);
  await clickEl('#uiBadge', 700); await w(1800);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
