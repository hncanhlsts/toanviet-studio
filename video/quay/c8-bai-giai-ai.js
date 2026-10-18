// Cảnh 8 — Bài giải AI → tài liệu Word: dán lời giải (chép từ trợ lí AI) bằng Ctrl+V, phần mềm bỏ phần thừa, chuẩn hoá ký hiệu,
// tự đọc đề để vẽ hình phẳng, hình không gian; bấm "Tạo tài liệu Word" (tệp ra ở TVS_DOCX_OUT để quay cảnh Word tiếp theo)
(async () => {
  __clear(); await w(300);
  const txt = await (await fetch('../video/quay/bai-giai-ai-mau.txt')).text();
  await window.api.copyText(txt);
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await clickEl(cmdBtn('baigiai'), 900); await w(900);
  REC.mark('dan');
  await clickEl('#bgsrc', 700); await w(300);
  await type([C('V')], 200); await w(2500);
  REC.mark('xem');
  // cuộn phần xem trước để thấy hình tự vẽ
  const v = document.getElementById('bgview');
  const [vx, vy] = at(v);
  await moveTo(vx, vy, 600);
  for (let i = 0; i < 26; i++) { await window.api.testMouse([{ t: 'wheel', x: vx, y: vy, dy: -60 }]); await w(120); }
  await w(1200);
  REC.mark('tao');
  document.getElementById('bgtitle').focus();
  await typeInto('#bgtitle', 'Lời giải bài tập', 90); await w(400);
  await clickEl('#bgmake', 800);
  REC.mark('tao-bam');
  // chờ phần mềm dựng xong tệp Word (lúc chụp ảnh công thức, trang tạm thay đổi — khi dựng video bỏ đoạn này)
  const stat = document.getElementById('bgstat'), btn = document.getElementById('bgmake');
  for (let i = 0; i < 40 && !stat.textContent && !btn.disabled; i++) await w(100);
  for (let i = 0; i < 240 && (stat.textContent || btn.disabled); i++) await w(250);
  REC.mark('tao-xong');
  await w(2500);
  hideCursor();
  REC.mark('het');
  await REC.stop();
})();
