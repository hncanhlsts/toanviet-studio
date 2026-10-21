// Quy tắc vẽ hình lớp 7 (src/dedehinh.js): cách diễn đạt thường gặp trong đề tam giác bằng nhau, cân, đều, đường đồng quy.
// Đề tự soạn (không chép sách); mỗi đề đo quan hệ hình học thật trên hình dựng được.
nhom('Quy tắc vẽ hình lớp 7: cách diễn đạt trong đề → hình đúng quan hệ');
const L7 = (() => {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = (u) => Math.hypot(u[0], u[1]), cr = (u, v) => u[0] * v[1] - u[1] * v[0], dt = (u, v) => u[0] * v[0] + u[1] * v[1];
  const ve = (de) => { const r = DeHinh.plane(de); dung(r, 'không dựng được: ' + de); const e = Plane.loi(r.script); dung(!e.length, e.join('; ') + '\n' + r.script); return { r, P: Plane.points(r.script) }; };
  const d = (P, a, b) => len(sub(P[a], P[b]));
  const goc = (P, a, o, c) => { const u = sub(P[a], P[o]), v = sub(P[c], P[o]); return Math.acos(dt(u, v) / len(u) / len(v)) * 180 / Math.PI; };
  const thang = (P, a, b, c) => Math.abs(cr(sub(P[b], P[a]), sub(P[c], P[a]))) / d(P, a, b) / d(P, a, c) < 1e-6;
  const giua = (P, a, m, b) => thang(P, a, m, b) && Math.abs(d(P, a, m) + d(P, m, b) - d(P, a, b)) < 1e-6;
  const phia = (P, u, v, a, b) => Math.sign(cr(sub(P[v], P[u]), sub(P[a], P[u]))) * Math.sign(cr(sub(P[v], P[u]), sub(P[b], P[u])));
  const gan = (x, y, e) => Math.abs(x - y) < (e || 1e-6);
  return { ve, d, goc, thang, giua, phia, gan };
})();
thu('"tia đối CB" (không chữ tia), "cắt nhau ở", "trên BC lấy" (không chữ cạnh), M ∈ BC', () => {
  const { P, r } = L7.ve('Cho tam giác PQR cân tại P. Trên QR lấy điểm S, tia đối RQ lấy điểm T sao cho QS = RT. Các đường thẳng PS và PT cắt nhau ở P. Lấy U ∈ PQ sao cho PU = PS.');
  dung(L7.giua(P, 'Q', 'S', 'R') && L7.giua(P, 'Q', 'R', 'T') && L7.gan(L7.d(P, 'Q', 'S'), L7.d(P, 'R', 'T')), r.script);
  dung(L7.giua(P, 'P', 'U', 'Q') && L7.gan(L7.d(P, 'P', 'U'), L7.d(P, 'P', 'S')), 'U trên PQ, PU = PS');
});
thu('vẽ ra phía ngoài: đoạn vuông góc và bằng; tam giác đều; tam giác vuông cân (kiểu đứng sau tên)', () => {
  let { P } = L7.ve('Cho tam giác KLM nhọn. Vẽ ra phía ngoài tam giác đó hai đoạn thẳng KP vuông góc và bằng KL, KQ vuông góc và bằng KM.');
  dung(L7.gan(L7.goc(P, 'P', 'K', 'L'), 90) && L7.gan(L7.d(P, 'K', 'P'), L7.d(P, 'K', 'L')) && L7.phia(P, 'K', 'L', 'P', 'M') < 0, 'P ngoài, KP ⊥ KL, KP = KL');
  dung(L7.gan(L7.goc(P, 'Q', 'K', 'M'), 90) && L7.phia(P, 'K', 'M', 'Q', 'L') < 0, 'Q ngoài');
  ({ P } = L7.ve('Cho tam giác KLM. Dựng bên ngoài tam giác KLM các tam giác đều KLP và KMQ.'));
  dung(L7.gan(L7.d(P, 'K', 'P'), L7.d(P, 'K', 'L')) && L7.gan(L7.d(P, 'L', 'P'), L7.d(P, 'K', 'L')) && L7.phia(P, 'K', 'L', 'P', 'M') < 0 && L7.phia(P, 'K', 'M', 'Q', 'L') < 0, 'hai tam giác đều ở ngoài');
  ({ P } = L7.ve('Cho tam giác KLM. Vẽ ra phía ngoài tam giác đó các tam giác KLP và MKQ vuông cân ở K.'));
  dung(L7.gan(L7.goc(P, 'L', 'K', 'P'), 90) && L7.gan(L7.d(P, 'K', 'P'), L7.d(P, 'K', 'L')) && L7.phia(P, 'K', 'L', 'P', 'M') < 0, 'vuông cân ở ngoài');
});
thu('nửa mặt phẳng "bờ … không chứa", "chứa … bờ …", "còn lại" với "vẽ Ax ⊥ AB và AD = AB"', () => {
  let { P } = L7.ve('Cho tam giác DEF nhọn. Trên nửa mặt phẳng bờ DE không chứa F vẽ Dx ⊥ DE và DG = DE. Trên nửa mặt phẳng chứa E bờ DF, vẽ DK ⊥ DF và DK = DF.');
  dung(L7.phia(P, 'D', 'E', 'G', 'F') < 0 && L7.gan(L7.goc(P, 'G', 'D', 'E'), 90) && L7.gan(L7.d(P, 'D', 'G'), L7.d(P, 'D', 'E')), 'G khác phía F');
  dung(L7.phia(P, 'D', 'F', 'K', 'E') > 0 && L7.gan(L7.d(P, 'D', 'K'), L7.d(P, 'D', 'F')), 'K cùng phía E');
  ({ P } = L7.ve('Cho tam giác DEF có đường cao DH. Trên nửa mặt phẳng bờ DH chứa E dựng DM ⊥ DE, DM = DE. Trên nửa mặt phẳng còn lại dựng DN ⊥ DF, DN = DF.'));
  dung(L7.phia(P, 'D', 'H', 'M', 'E') > 0 && L7.phia(P, 'D', 'H', 'N', 'E') < 0, '"nửa mặt phẳng còn lại"');
});
thu('đường trung trực cắt cạnh (theo thứ tự ở), giao hai trung trực bất kì, giao điểm các đường phân giác của nhiều tam giác', () => {
  let { P } = L7.ve('Cho tam giác UVW cân tại U. Các đường trung trực của UV và UW cắt cạnh VW theo thứ tự ở P và Q, hai trung trực cắt nhau ở R.');
  dung(L7.gan(L7.d(P, 'P', 'U'), L7.d(P, 'P', 'V')) && L7.giua(P, 'V', 'P', 'W') && L7.gan(L7.d(P, 'Q', 'U'), L7.d(P, 'Q', 'W')) && L7.gan(L7.d(P, 'R', 'U'), L7.d(P, 'R', 'V')) && L7.gan(L7.d(P, 'R', 'U'), L7.d(P, 'R', 'W')), 'P, Q trên cạnh; R tâm');
  ({ P } = L7.ve('Cho tam giác UVW nhọn có UV < UW. Trên UW lấy T sao cho WT = UV. Hai đường trung trực của VT và UW cắt nhau tại K.'));
  dung(L7.gan(L7.d(P, 'K', 'V'), L7.d(P, 'K', 'T')) && L7.gan(L7.d(P, 'K', 'U'), L7.d(P, 'K', 'W')), 'K cách đều V, T và U, W');
  ({ P } = L7.ve('Cho tam giác UVW vuông tại U, đường cao UH. Gọi I, J theo thứ tự là giao điểm của các đường phân giác của tam giác UVH, UWH.'));
  dung(L7.gan(L7.goc(P, 'U', 'V', 'I'), L7.goc(P, 'I', 'V', 'H')) && L7.gan(L7.goc(P, 'U', 'W', 'J'), L7.goc(P, 'J', 'W', 'H')), 'I, J là tâm nội tiếp');
});
thu('phân giác góc ngoài, chia ba đoạn, "Ox là đường trung trực của MN", điểm trên tia phân giác của góc đó', () => {
  let { P } = L7.ve('Cho tam giác GHK. Các đường phân giác góc ngoài tại H và K cắt nhau ở L.');
  dung(L7.gan(L7.d(P, 'L', 'H') * 0, 0) && L7.phia(P, 'H', 'K', 'L', 'G') < 0, 'L khác phía G (tâm bàng tiếp)');
  ({ P } = L7.ve('Cho tam giác GHK cân tại G. Trên cạnh HK lấy điểm P, Q sao cho HP = PQ = QK.'));
  dung(L7.gan(L7.d(P, 'H', 'P'), L7.d(P, 'P', 'Q')) && L7.gan(L7.d(P, 'P', 'Q'), L7.d(P, 'Q', 'K')), 'chia ba');
  ({ P } = L7.ve('Cho góc xOy nhọn. Điểm A nằm trong góc đó. Vẽ B sao cho Ox là đường trung trực của AB.'));
  dung(L7.gan(L7.d(P, 'O', 'A'), L7.d(P, 'O', 'B')) && L7.goc(P, 'A', 'O', 'B') > 1, 'B đối xứng A qua Ox');
  ({ P } = L7.ve('Cho góc xOy. Trên tia phân giác của góc đó lấy điểm N. Từ N hạ NE ⊥ Ox, NF ⊥ Oy.'));
  dung(L7.gan(L7.d(P, 'N', 'E'), L7.d(P, 'N', 'F')) && L7.gan(L7.goc(P, 'N', 'E', 'O'), 90), 'N trên phân giác, NE = NF');
});
thu('"từ trung điểm M của BC kẻ đường thẳng vuông góc với tia phân giác của góc A …", "từ D trên AB kẻ … song song", "đường thẳng vuông góc với BC tại B cắt …"', () => {
  let { P } = L7.ve('Cho tam giác RST có RS < RT. Từ trung điểm M của ST kẻ đường thẳng vuông góc với tia phân giác của góc R cắt tia này tại N, cắt tia RS tại E, cắt tia RT tại F.');
  dung(L7.gan(L7.d(P, 'M', 'S'), L7.d(P, 'M', 'T')) && L7.gan(L7.d(P, 'R', 'E'), L7.d(P, 'R', 'F')) && L7.thang(P, 'E', 'M', 'F') && L7.gan(L7.goc(P, 'R', 'N', 'M'), 90), 'RE = RF');
  ({ P } = L7.ve('Cho tam giác RST cân tại R. Từ D trên RS kẻ đường thẳng song song ST cắt RT tại E.'));
  dung(L7.giua(P, 'R', 'D', 'S') && L7.giua(P, 'R', 'E', 'T') && L7.gan(L7.d(P, 'R', 'D'), L7.d(P, 'R', 'E')), 'DE ∥ ST');
  ({ P } = L7.ve('Cho tam giác RST vuông tại R. Kẻ RH ⊥ ST. Đường thẳng vuông góc với RS tại S cắt đường thẳng RH tại D.'));
  dung(L7.gan(L7.goc(P, 'R', 'S', 'D'), 90) && L7.thang(P, 'R', 'H', 'D'), 'D trên RH, SD ⊥ RS');
});
thu('góc tù, "góc B = góc C = 45°", điểm cho bằng góc (một góc trên đoạn, hai góc ở hai đỉnh), độ dài bằng số, d và d\'', () => {
  let { P } = L7.ve('Cho tam giác ABC cân tại A, góc A tù. Trên BC lấy D.');
  dung(L7.goc(P, 'B', 'A', 'C') > 100, 'góc A tù');
  ({ P } = L7.ve('Cho tam giác ABC có góc B = góc C = 45°. Điểm E nằm trong tam giác ABC sao cho góc EAC = góc ECA = 20°.'));
  dung(L7.gan(L7.goc(P, 'A', 'B', 'C'), 45) && L7.gan(L7.goc(P, 'E', 'A', 'C'), 20) && L7.gan(L7.goc(P, 'E', 'C', 'A'), 20), 'E bằng hai góc');
  ({ P } = L7.ve('Cho tam giác ABC vuông tại A có góc B = 50°. Trên cạnh AC lấy điểm D sao cho góc DBC = 20°.'));
  dung(L7.gan(L7.goc(P, 'D', 'B', 'C'), 20) && L7.giua(P, 'A', 'D', 'C'), 'D bằng góc');
  ({ P } = L7.ve('Cho tam giác ABC vuông tại A có AB = 5, AC = 7. Trên cạnh BC lấy điểm D sao cho CD = 3. Trên AC lấy K, trên tia đối của AB lấy I sao cho AK = AI = 2 cm.'));
  dung(L7.gan(L7.d(P, 'C', 'D'), 3) && L7.gan(L7.d(P, 'A', 'K'), 2) && L7.gan(L7.d(P, 'A', 'I'), 2), 'độ dài bằng số');
  ({ P } = L7.ve("Cho tam giác ABC cân tại A. Kẻ đường thẳng d ⊥ AB tại B, d' ⊥ AC tại C, d và d' cắt nhau tại D."));
  dung(L7.gan(L7.goc(P, 'A', 'B', 'D'), 90) && L7.gan(L7.goc(P, 'A', 'C', 'D'), 90), "D = d ∩ d'");
});
