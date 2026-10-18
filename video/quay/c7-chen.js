// Cảnh 7a — mở từ Word (nút Công thức mới): gõ công thức rồi bấm "Chèn vào Word". Chạy bởi video/quay/word.ps1.
(async () => {
  await w(1200);
  REC.cur = { x: 700, y: 650, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  const mf = document.getElementById('mf'); mf.focus(); await w(400);
  await type(['x_', '1,2', TAB, '=', C('F'), '-b', C('K'), '+', C('R'), C('G'), K('D', ['shift'], 'D'), RIGHT, TAB, '2a', TAB], 140);
  await w(1200);
  const [x, y] = at('#fxok');
  await moveTo(x, y, 700); await w(250);
  REC.cur.down = true; curLog(); await w(250);
  REC.mark('het');
  await REC.stop();
  // bấm thật sau khi đã dừng quay (cửa sổ đóng lại khi chèn xong)
  await window.api.testMouse([{ t: 'move', x, y }, { t: 'down', x, y }, { t: 'up', x, y }]);
  await w(8000);
})();
