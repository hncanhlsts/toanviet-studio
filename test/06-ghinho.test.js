// Hình chưa vẽ đủ: gợi ý cách viết, ghi nhớ cách vẽ giáo viên dạy (src/dedehinh.js: hocMau, setRules, goiY)
nhom('Ghi nhớ cách vẽ và gợi ý sửa câu (dedehinh.js)');
thu('học mẫu: tên điểm thành {1}, {2}… theo thứ tự trong câu gốc', () => {
  const r = DeHinh.hocMau('Lấy điểm E sao cho tứ giác ABEC có hai cạnh đối song song.', 'ABEC là hình bình hành.');
  bang(r.from, 'lấy điểm {1} sao cho tứ giác {2}{3}{1}{4} có hai cạnh đối song song');
  bang(r.to, '{2}{3}{1}{4} là hình bình hành');
  dung(DeHinh.hocMau('Kẻ đường cao.', 'Kẻ đường cao.') === null, 'câu không có tên điểm / không đổi: không học');
});
thu('áp dụng mẫu đã nhớ cho đề khác tên điểm: vẽ được, không còn báo chưa hiểu', () => {
  const de = 'Cho tam giác MNP. Lấy điểm Q sao cho tứ giác MNQP có hai cạnh đối song song.';
  DeHinh.setRules([]);
  const r0 = DeHinh.plane(de);
  dung(r0.tam.some((t) => t.ten === 'Q') && !/Q = hbh/.test(r0.script), 'khi chưa dạy: Q chỉ đặt tạm');
  DeHinh.setRules([DeHinh.hocMau('Lấy điểm E sao cho tứ giác ABEC có hai cạnh đối song song.', 'ABEC là hình bình hành.')]);
  const r1 = DeHinh.plane(de);
  DeHinh.setRules([]);
  dung(/Q = hbh\(P, M, N\)/.test(r1.script), r1.script);
  bang(r1.thieu.length + r1.chuaHieu.length + r1.tam.length, 0);
});
thu('chỉ ra câu chưa hiểu (viết như trong đề: Oz, xOy) và điểm chưa dựng được', () => {
  const r = DeHinh.plane('Cho tam giác ABC. Gọi F là điểm sao cho tứ giác AEFC có hai cạnh đối song song.');
  dung(r.thieu.concat(r.tam).some((t) => t.ten === 'F'), JSON.stringify(r.thieu));
  dung(r.chuaHieu.length === 1 && /AEFC/.test(r.chuaHieu[0]), JSON.stringify(r.chuaHieu));
  const r2 = DeHinh.plane('Cho góc xOy. Vẽ tia Oz sao cho góc xOz gấp đôi góc zOy.');
  dung(r2.chuaHieu.every((c) => !/[XYZ]/.test(c.replace(/[^A-Z]/g, ''))), 'tên tia hiện chữ thường: ' + JSON.stringify(r2.chuaHieu));
});
thu('gợi ý điền đúng vai trò tên điểm trong câu', () => {
  bang(DeHinh.goiY('Qua điểm A thuộc tia Ox, vẽ đường thẳng song song với Oy cắt Oz tại M')[0], 'Qua A kẻ đường thẳng song song với Oy cắt Oz tại M.');
  bang(DeHinh.goiY('kẻ AH vuông góc BC')[0], 'Kẻ AH ⊥ BC tại H.');
  bang(DeHinh.goiY('Gọi F là điểm sao cho tứ giác AEFC có hai cạnh đối song song.')[0], 'AEFC là hình bình hành.');
});
// sửa theo từng điểm: điểm chưa xác định (hoặc vẽ sai) được mô tả lại riêng, các điểm dựng từ nó tự vẽ tiếp
const DE_BX = 'Cho ΔABC nhọn (AB < AC) có D là trung điểm của BC. Trên nửa mặt phẳng bờ BC không chứa điểm A, vẽ tia Bx // AC, Bx cắt tia AD tại E. Trên tia đối của tia AC lấy điểm F sao cho AF = AC. Gọi I là giao điểm của AB và EF. Chứng minh I là trung điểm của EF.';
thu('tia Bx // AC (nửa mặt phẳng bờ BC không chứa A), Bx cắt tia AD tại E; F trên tia đối; I = AB ∩ EF', () => {
  DeHinh.setRules([]);
  const r = DeHinh.plane(DE_BX);
  dung(/E = giao\(B, X, A, D\)/.test(r.script) && /I = giao\(A, B, E, F\)/.test(r.script) && /F = doixung\(C, A\)/.test(r.script), r.script);
  dung(/X = tinhtien\(B, A, C\)/.test(r.script), 'tia Bx ngược phía A so với BC: ' + r.script);
  bang(r.thieu.length + r.chuaHieu.length, 0);
  dung(r.diem.map((d) => d.ten).join() === 'D,E,F,I', JSON.stringify(r.diem));
});
thu('câu mô tả điểm → câu đầy đủ', () => {
  bang(DeHinh.cauDiem('E', 'giao điểm của Bx và AD'), 'E là giao điểm của Bx và AD');
  bang(DeHinh.cauDiem('E', 'E: qua B kẻ đường thẳng song song với AC cắt AD'), 'qua B kẻ đường thẳng song song với AC cắt AD tại E');
  bang(DeHinh.cauDiem('K', 'giao của MN và PQ'), 'K là giao điểm của MN và PQ');
  bang(DeHinh.cauDiem('F', 'trên tia đối của tia AC lấy điểm sao cho AF = AC'), 'trên tia đối của tia AC lấy điểm F sao cho AF = AC');
});
thu('gợi ý mô tả điểm E theo câu đề (Bx cắt tia AD tại E)', () => {
  const g = DeHinh.goiYDiem('E', 'trên nửa mặt phẳng bờ BC không chứa điểm A , vẽ tia Bx ∥ AC , Bx cắt tia AD tại E .');
  bang(g[0], 'giao điểm của Bx và AD');
  dung(g.includes('qua B kẻ đường thẳng song song với AC cắt AD'), JSON.stringify(g));
});
thu('mô tả lại điểm chưa xác định: vẽ được E, điểm I dựng từ E tự vẽ tiếp; ghi nhớ cho đề khác tên điểm', () => {
  DeHinh.setRules([]);
  const de = 'Cho tam giác ABC. Gọi E là điểm sao cho ABEC kì lạ. Gọi I là giao điểm của AE và BC.';
  // E đề không cho cách dựng được: đặt tạm; I dựng từ E vẽ tiếp được ngay
  const r0 = DeHinh.plane(de), tE = r0.tam.find((t) => t.ten === 'E');
  dung(tE && /I = giao\(A, E, B, C\)/.test(r0.script), JSON.stringify(r0.tam) + r0.script);
  tE.cau = [tE.cau];
  DeHinh.setRules([DeHinh.hocDiem(tE.cau[0], 'E', 'ABEC là hình bình hành')]);
  const r1 = DeHinh.plane(de);
  dung(/E = hbh\(/.test(r1.script) && /I = giao\(A, E, B, C\)/.test(r1.script), r1.script);
  bang(r1.thieu.length + r1.tam.length, 0);
  const r2 = DeHinh.plane('Cho tam giác MNP. Gọi Q là điểm sao cho MNQP kì lạ.');
  DeHinh.setRules([]);
  dung(/Q = hbh\(/.test(r2.script), r2.script);
});
thu('mô tả lại điểm vẽ sai: cách mô tả của giáo viên được ưu tiên hơn cách đọc đề', () => {
  DeHinh.setRules([]);
  const r0 = DeHinh.plane(DE_BX), dF = r0.diem.find((d) => d.ten === 'F');
  const R = DeHinh.hocDiem(dF.cau, 'F', 'trung điểm của AC');
  bang(R.diem, 'F');
  DeHinh.setRules([R]);
  const r1 = DeHinh.plane(DE_BX);
  DeHinh.setRules([]);
  dung(/F = trungdiem\(A, C\)/.test(r1.script) && !/F = doixung/.test(r1.script), r1.script);
  dung(/I = giao\(A, B, E, F\)/.test(r1.script), 'I vẫn dựng từ F mới');
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
