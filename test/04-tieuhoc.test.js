// Toán Tiểu học: đặt tính theo cột, các dạng bài trên phiếu
nhom('Đặt tính (tieuhoc.js)');
thu('cộng, trừ, nhân có nhớ', () => {
  bang(TieuHoc.ketQua('356 + 278'), '634');
  bang(TieuHoc.ketQua('125 + 348 + 207'), '680');
  bang(TieuHoc.ketQua('732 - 458'), '274');
  bang(TieuHoc.ketQua('1 234 × 3'), '3702');
  bang(TieuHoc.ketQua('236 x 47'), '11092');
  bang(TieuHoc.ketQua('258 * 203'), '52374');
  bang(TieuHoc.ketQua('1324 x 20'), '26480');
});
thu('số thập phân: thẳng dấu phẩy khi cộng trừ, đếm chữ số thập phân khi nhân', () => {
  bang(TieuHoc.ketQua('45,08 + 24,9'), '69,98');
  bang(TieuHoc.ketQua('12,5 - 3,75'), '8,75');
  bang(TieuHoc.ketQua('6,4 × 4,8'), '30,72');
});
thu('chia kiểu Việt Nam: hết, có dư, chia tiếp ra phần thập phân', () => {
  bang(TieuHoc.ketQua('648 : 3'), '216 dư 0');
  bang(TieuHoc.ketQua('237 : 5'), '47 dư 2');
  bang(TieuHoc.ketQua('4536 : 12', { kieuchia: 'gon' }), '378 dư 0');
  bang(TieuHoc.ketQua('4520 : 4'), '1130 dư 0');
  bang(TieuHoc.ketQua('27 : 4', { thapphan: 2 }), '6,75 dư 0');
  bang(TieuHoc.ketQua('3 : 4', { thapphan: 2 }), '0,75 dư 0');
  bang(TieuHoc.ketQua('8,4 : 4'), '2,1 dư 0');
  bang(TieuHoc.ketQua('23,56 : 6,2'), '3,8 dư 0');
});
thu('báo lỗi dễ hiểu', () => {
  const err = (e) => { try { TieuHoc.renderDatTinh({ expr: e, size: 24 }); return ''; } catch (x) { return x.message; } };
  dung(/lớn hơn/.test(err('45 - 78')), err('45 - 78'));
  dung(/cho 0/.test(err('45 : 0')), err('45 : 0'));
  dung(/Viết phép tính/.test(err('abc')), err('abc'));
});
thu('chế độ bài tập: để trống, ô trống, giấu chữ số; đáp án màu đỏ', () => {
  const red = (o) => (TieuHoc.renderDatTinh(Object.assign({ size: 24, acolor: '#d62728' }, o)).svg.match(/fill="#d62728"[^>]*>\d</g) || []).length;
  bang(red({ expr: '356 + 278', an: 'none', dapan: true }), 0);
  bang(red({ expr: '356 + 278', an: 'kq', dapan: true }), 3);
  bang(red({ expr: '356 + 278', an: 'ngaunhien', nan: 4, dapan: true }), 4);
  const s = TieuHoc.renderDatTinh({ expr: '356 + 278', size: 24, an: 'otrong' }).svg;
  bang((s.match(/<rect/g) || []).length, 3, 'số ô trống');
});
thu('mọi mẫu đặt tính vẽ không lỗi và giữ đúng ảnh chuẩn', () => {
  const bad = [];
  for (const k in TieuHoc.DT_KINDS) {
    try { const r = TieuHoc.renderDatTinh(Object.assign({ size: 24 }, TieuHoc.DT_KINDS[k][1])); anh('dattinh/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); }
  }
  bang(bad, []);
});

nhom('Dạng bài tiểu học');
thu('Số?: tự tìm số trong ô trống', () => {
  bang(TieuHoc.solveBlank('5 + [] = 12'), 7);
  bang(TieuHoc.solveBlank('[] - 7 = 8'), 15);
  bang(TieuHoc.solveBlank('6 x [] = 42'), 7);
  bang(TieuHoc.solveBlank('36 : [] = 4'), 9);
  bang(TieuHoc.solveBlank('[] : 5 = 2,5'), 12.5);
});
thu('tính biểu thức viết kiểu tiểu học', () => {
  bang(TieuHoc.evalExpr('4 x 6'), 24);
  bang(TieuHoc.evalExpr('48 : 6'), 8);
  bang(TieuHoc.evalExpr('1 000'), 1000);
  bang(TieuHoc.evalExpr('12,5'), 12.5);
  bang(TieuHoc.evalExpr('3/4'), 0.75);
  dung(isNaN(TieuHoc.evalExpr('alert(1)')), 'không được chạy mã lạ');
  bang(TieuHoc.fmtNum(12500), '12 500');
  bang(TieuHoc.fmtNum(2.5), '2,5');
});
thu('điền dấu, Đúng / Sai, khoanh: đáp án tự tính', () => {
  const h = (kind, text, extra) => TieuHoc.renderBaiTap(Object.assign({ kind, text, dapan: true, size: 20 }, extra)).html;
  const sos = h('sosanh', '345 (?) 354\n27 + 8 (?) 35\n3/4 (?) 2/4');
  bang((sos.match(/th-ans[^>]*>([^<]*)</g) || []).map((x) => x.replace(/.*>|<$/g, '')), ['&lt;', '=', '&gt;']);
  const ds = h('dungsai', 'a) 45 + 37 = 82\nb) 63 - 28 = 45\nc) Hình vuông có 4 cạnh [Đ]');
  bang((ds.match(/th-ans[^>]*>([^<]*)</g) || []).map((x) => x.replace(/.*>|<$/g, '')), ['Đ', 'S', 'Đ']);
  const kh = h('khoanh', 'Câu hỏi?\n10\n*20\n30');
  dung(/th-letter on[^>]*>B\./.test(kh), 'phải khoanh B');
});
thu('nối: vế phải được xáo, đáp án nối đúng cặp', () => {
  const r = TieuHoc.renderBaiTap({ kind: 'noi', text: '8 x 7 | 56\n63 : 9 | 7\n45 + 18 | 63', seed: 3, dapan: true });
  bang(r.errors, []);
  bang((r.html.match(/<line/g) || []).length, 3);
});
thu('máy tính mũi tên tự tính các ô', () => {
  const r = TieuHoc.renderBaiTap({ kind: 'maytinh', text: '12 -> +5 -> [] -> x2 -> []', dapan: true });
  bang((r.html.match(/th-ans[^>]*>([^<]*)</g) || []).map((x) => x.replace(/.*>|<$/g, '')), ['17', '34']);
});
thu('mọi mẫu dạng bài vẽ không lỗi và giữ đúng ảnh chuẩn', () => {
  const bad = [];
  for (const k in TieuHoc.BT_KINDS) {
    const r = TieuHoc.renderBaiTap(Object.assign({ kind: k, size: 20, w: 640, dapan: true }, TieuHoc.BT_KINDS[k][1]));
    if (r.errors.length) bad.push(k + ': ' + r.errors[0]);
    try { anh('baitap/' + k, { svg: r.html, labels: [] }); } catch (e) { bad.push(k + ': ' + e.message); }
  }
  bang(bad, []);
});
