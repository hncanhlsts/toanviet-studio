// Cảnh 7b — nhấp đúp công thức trong Word: ToanViet mở đúng công thức đó; sửa rồi bấm cập nhật. Chạy bởi video/quay/word.ps1.
(async () => {
  for (let i = 0; i < 40 && !(document.getElementById('mf').getValue() || '').length; i++) await w(200);
  await w(800);
  REC.cur = { x: 700, y: 650, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  const mf = document.getElementById('mf'); mf.focus(); await w(300);
  console.log('LOG ma cu: ' + mf.getValue());
  await type([K('End'), CS('E'), ', với ', CS('E'), C('G'), K('D', ['shift'], 'D'), '=b^2', RIGHT, '-4ac'], 150);
  await w(1300);
  const [x, y] = at('#fxok');
  console.log('LOG nut: ' + document.getElementById('fxok').textContent);
  await moveTo(x, y, 700); await w(250);
  REC.cur.down = true; curLog(); await w(250);
  REC.mark('het');
  await REC.stop();
  await window.api.testMouse([{ t: 'move', x, y }, { t: 'down', x, y }, { t: 'up', x, y }]);
  await w(8000);
})();
