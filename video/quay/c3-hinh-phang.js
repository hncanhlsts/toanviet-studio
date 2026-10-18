// Cảnh 3 — Hình phẳng: chọn mẫu, kéo đỉnh bằng chuột (hình tự vẽ lại), đổi số đo góc, ký hiệu góc đúng quy ước SGK
(async () => {
  __clear(); await w(300);
  for (let i = 0; i < 2; i++) { __run('zoomin'); await w(50); }
  await w(300);
  const page = document.getElementById('page');
  const last = () => { const a = [...page.querySelectorAll('.obj')]; return a[a.length - 1]; };
  const place = async (x, y) => {
    const el = last(), r = el.getBoundingClientRect(), pr = page.getBoundingClientRect(), z = parseFloat(page.style.zoom) || 1;
    const sx = r.x + r.width * 0.15, sy = r.y + r.height * 0.85;
    await drag(sx, sy, sx + (x - (r.x - pr.x) / z) * z, sy + (y - (r.y - pr.y) / z) * z, 800);
  };
  const choose = async (kind) => {
    const sel = document.getElementById('planeKind');
    await clickEl(sel, 900); await w(300);
    sel.value = kind; sel.dispatchEvent(new Event('change', { bubbles: true })); await w(500);
    await clickEl(cmdBtn('ins-plane'), 500); await w(800);
  };
  const logRect = (name) => { const r = last().getBoundingClientRect(); console.log('LOG rect ' + name + ' ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',')); };
  REC.cur = { x: 900, y: 500, down: false, show: false };
  await REC.start();
  REC.mark('bat-dau');
  await choose('duongcao');
  await place(20, 20); await w(400);
  logRect('duongcao');
  REC.mark('keo');
  // kéo đỉnh A: đường cao, trực tâm, góc vuông vẽ lại theo
  let [ax, ay] = at('.pth[data-pt="A"]');
  await drag(ax, ay, ax - 85, ay + 10, 1500); await w(500);
  [ax, ay] = at('.pth[data-pt="A"]');
  await drag(ax, ay, ax + 150, ay - 15, 1900); await w(800);
  REC.mark('goc');
  // tam giác biết một cạnh, hai góc: các góc khác nhau có ký hiệu khác nhau
  await choose('tamgiacgoc');
  await place(400, 20); await w(400);
  logRect('tamgiacgoc');
  REC.mark('so-do');
  const inGoc = [...document.querySelectorAll('#props input')].find((e) => /Góc B/.test((e.closest('label,div') || {}).textContent || ''));
  await clickEl(inGoc, 800); inGoc.select(); await w(300);
  for (const ch of '70') { await window.api.testKeys([ch]); await w(350); }
  await window.api.testKeys([K('Tab')]); await w(1500);
  REC.mark('phan-giac');
  // tia phân giác: hai góc bằng nhau cùng ký hiệu, cung lệch nhau
  await choose('tcphangiac');
  await place(210, 330); await w(400);
  logRect('tcphangiac');
  await click(1200, 140, 600); hideCursor(); await w(2000);
  REC.mark('het');
  const pr = page.getBoundingClientRect(); console.log('LOG page ' + [pr.x, pr.y, pr.width].map(Math.round).join(','));
  await REC.stop();
})();
