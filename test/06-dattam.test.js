// Hình chưa vẽ đủ: chỉ ra câu chưa hiểu / điểm chưa dựng được; điểm đề không cho đủ vị trí được đặt tạm ở chỗ hợp lý (src/dedehinh.js)
nhom('Câu chưa hiểu, điểm chưa dựng được, đặt tạm điểm (dedehinh.js)');
thu('chỉ ra câu chưa hiểu (viết như trong đề: Oz, xOy) và điểm chưa dựng được', () => {
  const r = DeHinh.plane('Cho tam giác ABC. Gọi F là điểm sao cho tứ giác AEFC có hai cạnh đối song song.');
  dung(r.thieu.concat(r.tam).some((t) => t.ten === 'F'), JSON.stringify(r.thieu));
  dung(r.chuaHieu.length === 1 && /AEFC/.test(r.chuaHieu[0]), JSON.stringify(r.chuaHieu));
  const r2 = DeHinh.plane('Cho góc xOy. Vẽ tia Oz sao cho góc xOz gấp đôi góc zOy.');
  dung(r2.chuaHieu.every((c) => !/[XYZ]/.test(c.replace(/[^A-Z]/g, ''))), 'tên tia hiện chữ thường: ' + JSON.stringify(r2.chuaHieu));
});
const DE_BX = 'Cho ΔABC nhọn (AB < AC) có D là trung điểm của BC. Trên nửa mặt phẳng bờ BC không chứa điểm A, vẽ tia Bx // AC, Bx cắt tia AD tại E. Trên tia đối của tia AC lấy điểm F sao cho AF = AC. Gọi I là giao điểm của AB và EF. Chứng minh I là trung điểm của EF.';
thu('tia Bx // AC (nửa mặt phẳng bờ BC không chứa A), Bx cắt tia AD tại E; F trên tia đối; I = AB ∩ EF', () => {
  const r = DeHinh.plane(DE_BX);
  dung(/E = giao\(B, X, A, D\)/.test(r.script) && /I = giao\(A, B, E, F\)/.test(r.script) && /F = doixung\(C, A\)/.test(r.script), r.script);
  dung(/X = tinhtien\(B, A, C\)/.test(r.script), 'tia Bx ngược phía A so với BC: ' + r.script);
  bang(r.thieu.length + r.chuaHieu.length, 0);
  dung(r.diem.map((d) => d.ten).join() === 'D,E,F,I', JSON.stringify(r.diem));
});
thu('điểm đề không cho cách dựng: đặt tạm, điểm dựng từ nó vẽ tiếp được ngay', () => {
  const r0 = DeHinh.plane('Cho tam giác ABC. Gọi E là điểm sao cho ABEC kì lạ. Gọi I là giao điểm của AE và BC.');
  dung(r0.tam.some((t) => t.ten === 'E') && /I = giao\(A, E, B, C\)/.test(r0.script), JSON.stringify(r0.tam) + r0.script);
});
// điểm đề không cho đủ vị trí: đặt tạm ở vị trí hợp lý (trên đường đề nói nó thuộc / chân vuông góc / chỗ trống) để vẽ tiếp
thu('A, B theo thứ tự thuộc Ox, Oy sao cho OA = OB; AH ⊥ Oy, BK ⊥ Ox; M = AH ∩ BK (đề thầy gửi 20/10)', () => {
  const r = DeHinh.plane(String.raw`Cho $\widehat{xOy}$. Lấy các điểm $A, B$ theo thứ tự thuộc $Ox$ và $Oy$ sao cho $OA = OB$. Vẽ $AH \perp Oy \, (H \in Oy)$, vẽ $BK \perp Ox \, (K \in Ox)$. Gọi $M$ là giao điểm của $AH$ và $BK$. Chứng minh rằng: a) $\Delta OAH = \Delta OBK$ b) $OM$ là tia phân giác của $\widehat{xOy}$.`);
  dung(/B = dat\(O, Y, O, A\)/.test(r.script) && /H = chan\(A, O, Y\)/.test(r.script) && /K = chan\(B, O, X\)/.test(r.script) && /M = giao\(A, H, B, K\)/.test(r.script), r.script);
  bang(r.thieu.length + r.chuaHieu.length + r.tam.length, 0);
});
thu('đặt tạm: điểm ∈ tia (A ∈ Ox), chân vuông góc chưa đọc được (AH vuông góc Oy), điểm tự do (D ở ngoài tam giác)', () => {
  const r = DeHinh.plane('Cho góc xOy, điểm A ∈ Ox. Kẻ AH vuông góc Oy tại H.');
  dung(/A = chia\(O, X, 0\.6\)/.test(r.script) && /H = chan\(A, O, Y\)/.test(r.script), r.script);
  bang(r.tam.map((t) => t.ten).join(), 'A,H');
  const r2 = DeHinh.plane('Cho tam giác ABC và điểm D ở phía ngoài tam giác. Gọi M là trung điểm của AD.');
  dung(/D = \(-?[\d.]+, -?[\d.]+\)/.test(r2.script) && /M = trungdiem\(A, D\)/.test(r2.script), r2.script);
  bang(r2.thieu.length, 0);
  dung(r2.tam[0].ten === 'D' && /chỗ trống/.test(r2.tam[0].cach), JSON.stringify(r2.tam));
});
thu('nhiều điểm đặt tạm ở chỗ trống: không đặt trùng nhau', () => {
  const r = DeHinh.plane('Cho tam giác ABC và hai điểm D, E ở phía ngoài tam giác. Gọi M là trung điểm của DE.');
  const P = Plane.points(r.script);
  dung(P.D && P.E && Math.hypot(P.D[0] - P.E[0], P.D[1] - P.E[1]) > 1, r.script);
});