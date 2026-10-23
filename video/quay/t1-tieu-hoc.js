// Bản 2.8.0 — giáo viên Tiểu học: chọn môn Tiểu học, đặt tính cột dọc, dạng bài trên phiếu, hình minh hoạ,
// mẫu theo bài SGK, trình chiếu (bấm để giải từng bước, hiện đáp án)
(async () => {
  __clear(); await w(300);
  document.documentElement.requestFullscreen = async () => {}; // quay trong cửa sổ cố định 1600×900
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await chonMuc('#modeBadge', 'tieuhoc', 900); await w(1500);
  REC.mark('dat-tinh');
  await chenMau('dtKind', 'ins-dattinh', 'nhan2', 60, 40);
  await typeInto('#props [data-k="expr"]', '346 × 25', 160);
  await window.api.testKeys([K('Tab')]); await w(1200);
  await chenMau('dtKind', 'ins-dattinh', 'chia2', 360, 40); await w(800);
  REC.mark('dang-bai');
  await chenMau('btKind', 'ins-baitap', 'otrong', 40, 300); await w(900);
  await chenMau('btKind', 'ins-baitap', 'sosanh', 40, 470); await w(1200);
  REC.mark('trinh-chieu');
  await clickEl(cmdBtn('present'), 800); await w(1500);
  const dt = document.querySelector('#page .obj.dattinh');
  for (let i = 0; i < 5; i++) { await clickEl(dt, i ? 350 : 800); await w(700); }
  REC.mark('dap-an');
  await clickEl('#presbar [data-p="ans"]', 800); await w(2500);
  await clickEl('#presbar [data-p="exit"]', 800); await w(1200);
  REC.mark('minh-hoa');
  __clear(); await w(500);
  await chenMau('mhKind', 'ins-minhhoa', 'dongho', 40, 30, 480, 200); await w(700);
  await chenMau('mhKind', 'ins-minhhoa', 'phanso2', 40, 250, 420, 200); await w(700);
  await chenMau('mhKind', 'ins-minhhoa', 'sodo_tonghieu', 40, 470, 500, 170); await w(700);
  await chenMau('mhKind', 'ins-minhhoa', 'bdcot', 470, 250, 300, 200); await w(1200);
  REC.mark('mau-bai');
  await clickEl(cmdBtn('mau'), 800); await w(2800);
  await window.api.testKeys([ESC]); await w(800);
  hideCursor(); await w(800);
  REC.mark('het');
  await REC.stop();
})();
