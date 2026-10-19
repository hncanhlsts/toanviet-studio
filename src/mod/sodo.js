// Sơ đồ, sơ đồ tư duy trên trang: ô chữ (bo góc, elip, thoi, chữ nhật — gõ chữ và công thức $…$ bên trong),
// đường nối tự bám theo ô (thẳng, cong, gấp khúc; mũi tên một / hai đầu / không), thêm nhánh (Tab), mẫu sơ đồ tư duy.
// Đường nối là đối tượng 'shape' kind 'conn': { from, to } là id hai ô (hoặc p1, p2 khi đầu mút tự do);
// toạ độ, kích thước của đường nối tính lại từ hai ô mỗi khi vẽ — kéo ô thì đường nối chạy theo.
(function (root) {
  'use strict';
  root.TVM = root.TVM || {};
  root.TVM.sodo = function (C) {
    const { S, get, renderObj, commit, select, setSel, buildProps, msg, insert, elOf } = C;
    const CLOSED = ['rect', 'ellipse', 'box', 'diamond'];
    const isConn = (o) => o && o.type === 'shape' && o.kind === 'conn';
    const BRANCH = ['#e67e22', '#2e86c1', '#28b463', '#af7ac5', '#e74c3c', '#17a589'];

    // khung của một đối tượng trên trang (hình: theo dữ liệu; chữ, công thức…: theo phần tử đã vẽ)
    function box(o) {
      if (o.type === 'shape' && o.w && !isConn(o)) return { x: o.x, y: o.y, w: o.w, h: o.h };
      const el = elOf(o.id);
      return { x: o.x, y: o.y, w: el ? el.offsetWidth : (o.w || 80), h: el ? el.offsetHeight : (o.h || 30) };
    }
    const center = (o) => { const b = box(o); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
    // điểm trên viền ô theo hướng tới điểm q (chữ nhật, bo góc: viền hình chữ nhật; elip; thoi), lùi ra ngoài 2 điểm ảnh
    function edge(o, q) {
      const b = box(o), cx = b.x + b.w / 2, cy = b.y + b.h / 2, dx = q.x - cx, dy = q.y - cy, a = b.w / 2, bb = b.h / 2;
      if (!dx && !dy) return { x: cx, y: cy };
      let t;
      if (o.kind === 'ellipse') t = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (bb * bb));
      else if (o.kind === 'diamond') t = 1 / (Math.abs(dx) / a + Math.abs(dy) / bb);
      else t = Math.min(dx ? a / Math.abs(dx) : Infinity, dy ? bb / Math.abs(dy) : Infinity);
      t = Math.min(t, 1);
      const L = Math.hypot(dx, dy), g = 2 / L;
      return { x: cx + dx * (t + g), y: cy + dy * (t + g) };
    }
    function ends(c) {
      const A = c.from ? get(c.from) : null, B = c.to ? get(c.to) : null;
      const q1 = A ? center(A) : c.p1 || { x: c.x, y: c.y }, q2 = B ? center(B) : c.p2 || { x: c.x + 120, y: c.y + 40 };
      return [A ? edge(A, q2) : q1, B ? edge(B, q1) : q2];
    }
    // tính lại khung của đường nối và trả về hình SVG (toạ độ trong khung)
    function connSvg(c) {
      const [p1, p2] = ends(c), dx = p2.x - p1.x, dy = p2.y - p1.y, horiz = Math.abs(dx) >= Math.abs(dy);
      let pts, d;
      if (c.style === 'cong') {
        const c1 = horiz ? { x: p1.x + dx / 2, y: p1.y } : { x: p1.x, y: p1.y + dy / 2 }, c2 = horiz ? { x: p2.x - dx / 2, y: p2.y } : { x: p2.x, y: p2.y - dy / 2 };
        pts = [p1, c1, c2, p2];
      } else if (c.style === 'gap') {
        const m = horiz ? [{ x: p1.x + dx / 2, y: p1.y }, { x: p1.x + dx / 2, y: p2.y }] : [{ x: p1.x, y: p1.y + dy / 2 }, { x: p2.x, y: p1.y + dy / 2 }];
        pts = [p1, m[0], m[1], p2];
      } else pts = [p1, p2];
      const pad = 12, x0 = Math.min(...pts.map((p) => p.x)) - pad, y0 = Math.min(...pts.map((p) => p.y)) - pad;
      c.x = Math.round(x0); c.y = Math.round(y0);
      c.w = Math.round(Math.max(...pts.map((p) => p.x)) + pad - x0); c.h = Math.round(Math.max(...pts.map((p) => p.y)) + pad - y0);
      const L = (p) => (p.x - c.x).toFixed(1) + ',' + (p.y - c.y).toFixed(1);
      if (c.style === 'cong') d = 'M' + L(pts[0]) + ' C' + L(pts[1]) + ' ' + L(pts[2]) + ' ' + L(pts[3]);
      else d = 'M' + pts.map(L).join(' L');
      const col = c.color || '#111', sw = c.sw || 1.5, head = c.head || 'end';
      const mk = (id, rev) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="${rev ? 'auto-start-reverse' : 'auto'}"><path d="M0,1.5 L10,5 L0,8.5 L2.5,5 z" fill="${col}"/></marker>`;
      const defs = head === 'none' ? '' : `<defs>${mk('ce' + c.id)}${head === 'both' ? mk('cs' + c.id, true) : ''}</defs>`;
      return `${defs}<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"${c.dash ? ' stroke-dasharray="7 4"' : ''}${head !== 'none' ? ` marker-end="url(#ce${c.id})"` : ''}${head === 'both' ? ` marker-start="url(#cs${c.id})"` : ''}/>` +
        `<path d="${d}" fill="none" stroke="transparent" stroke-width="12"/>`;
    }
    // vẽ lại các đường nối gắn với các đối tượng đã đổi (kéo, đổi cỡ, sửa chữ)
    function refreshConns(ids) {
      const set = new Set(ids);
      S.objs.filter((o) => isConn(o) && (set.has(o.from) || set.has(o.to))).forEach((o) => renderObj(o));
    }
    const refreshAll = () => S.objs.filter(isConn).forEach((o) => renderObj(o));
    // đưa đường nối xuống dưới cùng (nằm dưới các ô)
    function toBack(o) { const i = S.objs.indexOf(o); if (i > 0) { S.objs.splice(i, 1); S.objs.unshift(o); const el = elOf(o.id); if (el && el.parentNode) el.parentNode.insertBefore(el, el.parentNode.firstChild); } }

    function connect(a, b, extra) {
      const c = insert('shape', 'conn', Object.assign({ from: a.id, to: b.id, style: 'cong', head: 'end', color: a.color || '#555555', sw: 2 }, extra || {}));
      toBack(c); renderObj(c);
      return c;
    }
    // nối các đối tượng đang chọn theo thứ tự chọn: ô đầu → các ô còn lại
    function connectSelected() {
      const ids = (S.multi && S.multi.length ? S.multi : []).filter((id) => !isConn(get(id)));
      if (ids.length < 2) { msg('Chọn ô đầu, giữ Ctrl rồi chọn thêm ô cần nối (2 ô trở lên) rồi bấm Nối', true); return; }
      const a = get(ids[0]); let last = null;
      ids.slice(1).forEach((id) => { last = connect(a, get(id)); });
      commit(); select(last.id); buildProps();
      msg('Đã nối ' + (ids.length - 1) + ' đường; kéo ô thì đường nối chạy theo');
    }
    // thêm nhánh: ô con mới cạnh ô đang chọn (về phía ngoài so với ô cha của nó) và đường nối cong
    function addBranch(o) {
      if (!o || isConn(o)) { msg('Chọn một ô rồi bấm Thêm nhánh (hoặc phím Tab)', true); return; }
      const b = box(o), parentConn = S.objs.find((c) => isConn(c) && c.to === o.id), par = parentConn && get(parentConn.from);
      const kids = S.objs.filter((c) => isConn(c) && c.from === o.id).map((c) => get(c.to)).filter(Boolean);
      let dir = 1;
      if (par) dir = center(o).x >= center(par).x ? 1 : -1;
      else dir = kids.filter((k) => center(k).x > center(o).x).length <= kids.filter((k) => center(k).x < center(o).x).length ? 1 : -1;
      const side = kids.filter((k) => (center(k).x - center(o).x) * dir > 0);
      const w = 150, h = 46, PW = 794; // khổ trang A4 (điểm ảnh)
      let x = dir > 0 ? b.x + b.w + 60 : b.x - 60 - w;
      let y = side.length ? Math.max(...side.map((k) => box(k).y + box(k).h)) + 16 : b.y + b.h / 2 - h / 2 - (par ? 0 : 60);
      // hết chỗ ngang trên trang: nhánh mọc xuống dưới ô, lệch dần theo số nhánh đã có
      if (x < 6 || x + w > PW - 6) {
        const below = kids.filter((k) => box(k).y > b.y + b.h);
        x = Math.max(6, Math.min(PW - w - 6, b.x + b.w / 2 - w / 2 + (below.length % 2 ? 1 : -1) * Math.ceil(below.length / 2) * (w + 14)));
        y = b.y + b.h + 50 + Math.floor(below.length / 4) * (h + 20);
      }
      // không đè lên ô đã có: dời dần xuống dưới đến khi trống
      const hitAny = (X, Y) => S.objs.some((q) => !isConn(q) && q.id !== o.id && (() => { const k = box(q); return X < k.x + k.w + 10 && X + w + 10 > k.x && Y < k.y + k.h + 10 && Y + h + 10 > k.y; })());
      for (let t = 0; t < 30 && hitAny(x, y); t++) y += h / 2 + 8;
      const col = o.branch || (par ? o.color : BRANCH[kids.length % BRANCH.length]) || '#2e86c1';
      const n = insert('shape', 'box', { x: Math.round(x), y: Math.round(y), w, h, text: 'Ý mới', branch: col, fill: '#ffffff', nofill: false, color: col, sw: 1.8, tsize: 15 });
      connect(o, n, { color: col, head: 'none', sw: 2 }); // nhánh sơ đồ tư duy: đường cong không mũi tên
      setSel([n.id], n.id); commit(); buildProps();
      return n;
    }
    // mẫu sơ đồ tư duy: chủ đề ở giữa và bốn nhánh
    function mindmap() {
      const x0 = 260, y0 = 300;
      const root0 = insert('shape', 'ellipse', { x: x0, y: y0, w: 200, h: 84, text: 'Chủ đề', bold: true, nofill: false, fill: '#fdebd0', color: '#ca6f1e', sw: 2.2, tsize: 19 });
      const pos = [[-1, -1], [1, -1], [-1, 1], [1, 1]], made = [];
      pos.forEach(([sx, sy], i) => {
        const col = BRANCH[i], w = 160, h = 48;
        const n = insert('shape', 'box', { x: x0 + 100 + sx * 230 - w / 2, y: y0 + 42 + sy * 110 - h / 2, w, h, text: 'Nhánh ' + (i + 1), branch: col, color: col, nofill: false, fill: '#ffffff', sw: 1.8, tsize: 16 });
        made.push(n);
        connect(root0, n, { color: col, sw: 2.4, head: 'none' });
      });
      setSel([root0.id], root0.id); commit(); buildProps();
      msg('Sơ đồ tư duy: nhấp đúp vào ô để sửa chữ; chọn một ô rồi bấm Tab để thêm nhánh con; kéo ô thì đường nối chạy theo');
      return root0;
    }
    return { isConn, connSvg, refreshConns, refreshAll, connect, connectSelected, addBranch, mindmap, CLOSED };
  };
})(this);
