// Cảnh 1 — Gõ công thức nhanh: phím tắt kiểu MathType, chữ tiếng Việt nhiều dòng, ký hiệu SGK
(async () => {
  __clear(); await w(300);
  for (let i = 0; i < 5; i++) { __run('zoomin'); await w(50); }
  await w(400);
  const page = document.getElementById('page');
  // kéo công thức vừa chèn (đối tượng cuối) tới vị trí (x, y) trên trang
  const place = async (x, y) => {
    const objs = [...page.querySelectorAll('.obj')], el = objs[objs.length - 1], r = el.getBoundingClientRect(), pr = page.getBoundingClientRect(), z = parseFloat(page.style.zoom) || 1;
    const sx = r.x + Math.min(40, r.width / 2), sy = r.y + r.height / 2, cur = (r.x - pr.x) / z, cury = (r.y - pr.y) / z;
    await drag(sx, sy, sx + (x - cur) * z, sy + (y - cury) * z, 900);
  };
  const open = async () => {
    await clickEl(cmdBtn('ins-formula'), 800); await w(600);
    const fs = document.getElementById('fSize'); fs.value = '16'; fs.dispatchEvent(new Event('change', { bubbles: true }));
    hideCursor(); document.getElementById('mf').focus(); await w(300);
  };
  REC.cur = { x: 900, y: 600, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  // công thức nghiệm: Ctrl+F phân số, Ctrl+K + ra ±, Ctrl+R căn, Ctrl+G Shift+D ra Δ
  await open();
  REC.mark('cong-thuc-nghiem');
  await type(['x_', '1,2', TAB, '=', C('F'), '-b', C('K'), '+', C('R'), C('G'), K('D', ['shift'], 'D'), RIGHT, TAB, '2a', TAB], 140);
  await w(1300);
  await clickEl('#fxok', 700); await w(700);
  await place(60, 40); await w(500);
  // hệ phương trình, chữ tiếng Việt, nhiều dòng
  REC.mark('he-phuong-trinh');
  await open();
  await type([C('T'), 'h', 'x+y=5', TAB, 'x-y=1', TAB, '<=>', C('T'), 'h', 'x=3', TAB, 'y=2', TAB, ENTER, CS('E'), 'Vậy hệ có nghiệm ', CS('E'), '(x;y)=(3;2)'], 105);
  await w(1300);
  await clickEl('#fxok', 700); await w(700);
  await place(60, 120); await w(500);
  // ký hiệu SGK: đồng dạng, song song, khoảng
  REC.mark('ky-hieu');
  await open();
  await type([C('G'), K('D', ['shift'], 'D'), 'ABC', C('K'), 's', C('G'), K('D', ['shift'], 'D'), 'MNP', ',   AB//CD', ',   x', C('K'), 'e', '[-4;2)'], 115);
  await w(1300);
  await clickEl('#fxok', 700); await w(700);
  await place(60, 260); await w(400);
  await click(1180, 760, 600); hideCursor(); await w(1500);
  REC.mark('het');
  await REC.stop();
})();
