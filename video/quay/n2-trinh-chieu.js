// Bản 2.8.0 — nâng cao: trình chiếu dựng hình từng nét (Shift+F5); lỗi hình báo bằng lời thường
(async () => {
  __clear(); await w(300);
  document.documentElement.requestFullscreen = async () => {}; // quay trong cửa sổ cố định 1600×900
  __add('text', null, { x: 60, y: 30, w: 680, size: 20, text: 'Cho tam giác ABC có ba góc nhọn, các đường cao BE, CF cắt nhau tại H.' });
  __add('plane', 'tamgiac', { x: 160, y: 110, w: 460, h: 380, script: 'A = (1.6, 4.2)\nB = (0, 0)\nC = (5, 0)\ndagiac ABC\nE = chan(B, A, C)\nF = chan(C, A, B)\ndoan BE\ndoan CF\nvuong BEC\nvuong CFB\nH = giao(B, E, C, F)\nduongthang AH' });
  window.__unselect(); await w(400);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  __run('present-step'); REC.keys.push({ t: Math.round(REC.now()), label: 'Shift + F5' }); await w(1500);
  REC.mark('tung-net');
  for (let i = 0; i < 9; i++) { await window.api.testKeys([RIGHT]); REC.keys.push({ t: Math.round(REC.now()), label: '→' }); await w(1100); }
  await w(800);
  await clickEl('#presbar [data-p="exit"]', 800); await w(1000);
  REC.mark('loi');
  await clickEl(document.querySelector('#page .obj.plane'), 700); await w(600);
  // một dòng viết sai quan hệ (đường song song): khung Thuộc tính báo bằng lời
  await themO('script', '\nZ1 = (6.6, 4.2)\nD = giao(A, Z1, B, C)\nan Z1', 60); await w(600);
  const pe = document.getElementById('perr'); pe.scrollIntoView({ block: 'center' }); await w(400);
  hideCursor(); await w(4600); // con trỏ không che dòng báo lỗi
  hideCursor(); REC.mark('het');
  await REC.stop();
})();
