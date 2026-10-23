// Bản 2.8.0 — Sinh học: sơ đồ lai (đổi kiểu gen), khung Punnett, phả hệ (thêm người, thế hệ tự xếp), công thức di truyền
(async () => {
  __clear(); await w(300);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await chonMuc('#modeBadge', 'sinh', 800); await w(1000);
  REC.mark('lai');
  await chenMon('sodolai', 30, 20, 720, 170); await w(1200);
  await goO('p2', 'AaBb', 220); await w(2500);
  REC.mark('punnett');
  await chenMon('punnett', 30, 210, 420, 270); await w(2000);
  REC.mark('pha-he');
  await chenMon('phahe', 470, 210, 310, 320); await w(1200);
  await themO('dulieu', '\n8 | nam | bệnh | 6+9\n9 | nam |  |', 70); await w(2500);
  REC.mark('cong-thuc');
  await clickEl(cmdBtn('ins-formula'), 800); await w(1200);
  const m = document.getElementById('mf'); m.focus(); m.insert(String.raw`p^{2}AA+2pq\,Aa+q^{2}aa=1`); m.dispatchEvent(new Event('input')); await w(2000);
  await clickEl('#fxok', 700); await w(400); await datCho(40, 560); await w(1500);
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
