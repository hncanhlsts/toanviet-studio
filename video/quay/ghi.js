// Bộ ghi hình dùng chung cho các cảnh quay video giới thiệu (nạp trước kịch bản cảnh, chạy trong phần mềm ở chế độ kiểm thử).
// Chụp cửa sổ liên tục thành ảnh JPEG, ghi lại vị trí con trỏ chuột (vẽ thêm khi dựng video) và các mốc thời gian.
// Thư mục ảnh: window.__OUT (do video/quay/chay.js đặt). Kết quả in ra dòng "REC-META {json}".
/* global __OUT */
const w = (t) => new Promise((s) => setTimeout(s, t));
const B = String.fromCharCode(92);
const K = (key, mods, ch) => ({ key, mods: mods || [], char: ch });
const C = (k) => K(k, ['control']), CS = (k) => K(k, ['control', 'shift']);
const TAB = K('Tab'), ENTER = K('Enter'), SENTER = K('Enter', ['shift']), RIGHT = K('Right'), ESC = K('Escape');
const REC = { on: false, t0: 0, frames: [], cursor: [], marks: [], keys: [], cur: { x: 800, y: 500, down: false, show: false } };
REC.now = () => performance.now() - REC.t0;
REC.loop = async () => {
  while (REC.on) {
    const t = REC.now(), f = String(REC.frames.length).padStart(5, '0') + '.jpg';
    await window.api.testShot(__OUT + '/' + f);
    REC.frames.push({ t: Math.round(t), f });
    await w(15);
  }
};
REC.start = async () => { REC.t0 = performance.now(); REC.on = true; REC.done = REC.loop(); await w(300); };
REC.stop = async () => { await w(400); REC.on = false; await REC.done; console.log('REC-META ' + JSON.stringify({ frames: REC.frames, cursor: REC.cursor, marks: REC.marks, keys: REC.keys, w: innerWidth, h: innerHeight })); };
// mốc thời gian (để canh phụ đề khi dựng): REC.mark('ten')
REC.mark = (name) => REC.marks.push({ t: Math.round(REC.now()), name });
const curLog = () => REC.cursor.push({ t: Math.round(REC.now()), x: Math.round(REC.cur.x), y: Math.round(REC.cur.y), down: REC.cur.down, show: REC.cur.show });
// di con trỏ (mượt, có gia tốc) đến (x, y) trong ms mili giây; drag: giữ chuột trái (kéo thật)
async function moveTo(x, y, ms, drag) {
  const x0 = REC.cur.x, y0 = REC.cur.y, n = Math.max(2, Math.round((ms || 600) / 30));
  REC.cur.show = true;
  for (let i = 1; i <= n; i++) {
    const k = i / n, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    REC.cur.x = x0 + (x - x0) * e; REC.cur.y = y0 + (y - y0) * e; curLog();
    if (drag) await window.api.testMouse([{ t: 'move', x: REC.cur.x, y: REC.cur.y, drag: true }]);
    await w(30);
  }
}
async function click(x, y, ms) { await moveTo(x, y, ms); await w(150); REC.cur.down = true; curLog(); await window.api.testMouse([{ t: 'move', x, y }, { t: 'down', x, y }, { t: 'up', x, y }]); await w(140); REC.cur.down = false; curLog(); await w(150); }
async function dblclick(x, y, ms) { await moveTo(x, y, ms); await w(150); REC.cur.down = true; curLog(); await window.api.testMouse([{ t: 'move', x, y }, { t: 'dbl', x, y }]); await w(140); REC.cur.down = false; curLog(); await w(150); }
async function drag(x1, y1, x2, y2, ms) {
  await moveTo(x1, y1, 500); await w(150);
  REC.cur.down = true; curLog(); await window.api.testMouse([{ t: 'move', x: x1, y: y1 }, { t: 'down', x: x1, y: y1, wait: 60 }]);
  await moveTo(x2, y2, ms || 1200, true);
  await window.api.testMouse([{ t: 'up', x: x2, y: y2 }]); REC.cur.down = false; curLog(); await w(200);
}
const hideCursor = () => { REC.cur.show = false; curLog(); };
// tâm của phần tử (toạ độ trong cửa sổ)
const at = (sel) => { const e = typeof sel === 'string' ? document.querySelector(sel) : sel; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
const clickEl = async (sel, ms) => { const [x, y] = at(sel); await click(x, y, ms); };
const cmdBtn = (cmd) => document.querySelector('[data-cmd="' + cmd + '"]');
// gõ phím thật, chậm vừa đủ để người xem theo dõi; phím tắt được ghi lại để hiện khung phím khi dựng
async function type(seq, per) {
  for (const it of seq) {
    if (typeof it === 'string') { for (const ch of it) { await window.api.testKeys([ch]); await w(per || 110); } }
    else {
      const label = (it.mods || []).map((m) => ({ control: 'Ctrl', shift: 'Shift', alt: 'Alt' }[m] || m)).concat(it.label || it.key).join(' + ');
      if ((it.mods || []).length || it.show) REC.keys.push({ t: Math.round(REC.now()), label });
      await window.api.testKeys([it]); await w((per || 110) * 3);
    }
  }
}
// đặt nội dung một ô nhập (như người dùng gõ): xoá rồi gõ từng ký tự
async function typeInto(sel, text, per) {
  const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
  await clickEl(e); e.select && e.select(); await w(150);
  await window.api.testKeys([K('Backspace')]); await w(120);
  await type([text], per);
}
