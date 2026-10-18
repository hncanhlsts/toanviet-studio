// Cảnh 5 — Tiểu học: chuyển chế độ Tiểu học, đặt tính cột dọc, sơ đồ đoạn thẳng (tổng – hiệu), sơ đồ chuyển động
(async () => {
  __clear(); await w(300);
  for (let i = 0; i < 1; i++) { __run('zoomin'); await w(50); }
  await w(300);
  const page = document.getElementById('page');
  const last = () => { const a = [...page.querySelectorAll('.obj')]; return a[a.length - 1]; };
  const place = async (x, y) => {
    const el = last(), r = el.getBoundingClientRect(), pr = page.getBoundingClientRect(), z = parseFloat(page.style.zoom) || 1;
    const sx = r.x + Math.min(40, r.width / 3), sy = r.y + Math.min(30, r.height / 3);
    await drag(sx, sy, sx + (x - (r.x - pr.x) / z) * z, sy + (y - (r.y - pr.y) / z) * z, 800);
  };
  const choose = async (selId, cmd, kind) => {
    const sel = document.getElementById(selId);
    await clickEl(sel, 800); await w(300);
    sel.value = kind; sel.dispatchEvent(new Event('change', { bubbles: true })); await w(400);
    await clickEl(cmdBtn(cmd), 500); await w(800);
  };
  const logRect = (name) => { const r = last().getBoundingClientRect(); console.log('LOG rect ' + name + ' ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',')); };
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  // chuyển sang chế độ Tiểu học (nút ở góc phải thanh trạng thái)
  await clickEl('#modeBadge', 1000); await w(1200);
  REC.mark('dat-tinh');
  await choose('dtKind', 'ins-dattinh', 'nhan2');
  await place(40, 30); await w(300);
  await typeInto('#props [data-k="expr"], #props #expr', '346 × 25', 170);
  await window.api.testKeys([K('Tab')]); await w(1200);
  logRect('nhan');
  await choose('dtKind', 'ins-dattinh', 'chia2');
  await place(330, 30); await w(1000);
  logRect('chia');
  REC.mark('so-do');
  await choose('mhKind', 'ins-minhhoa', 'sodo_tonghieu');
  await place(40, 270); await w(1000);
  logRect('tonghieu');
  REC.mark('chuyen-dong');
  await choose('mhKind', 'ins-minhhoa', 'chuyendong');
  await place(40, 465); await w(1000);
  logRect('chuyendong');
  await click(1150, 830, 600); hideCursor(); await w(2000);
  REC.mark('het');
  const pr = page.getBoundingClientRect(); console.log('LOG page ' + [pr.x, pr.y, pr.width].map(Math.round).join(','));
  await REC.stop();
})();
