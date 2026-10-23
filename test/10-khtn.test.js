// Hình theo môn (src/khtn.js), phương trình hoá học (src/hoahoc.js), dựng hình từng nét khi trình chiếu (plane.js),
// khối ```toanviet-mon của AI (baigiai-chuyen.js)
nhom('Hình theo môn: thống kê, Vật lí, Hoá học, Sinh học; phương trình hoá học; dựng hình từng nét');
thu('mọi mẫu dựng được, không lỗi', () => {
  Object.keys(KhoaHoc.KINDS).forEach((k) => {
    const d = KhoaHoc.KINDS[k][1], r = KhoaHoc.render(Object.assign({ kind: k }, d), d.w, d.h);
    dung(!r.errors.length && r.svg.length > 100, k + ': ' + r.errors.join('; '));
  });
});
thu('cấu hình electron: Fe, Cr, Cu (ngoại lệ bán bão hoà, bão hoà), Cl', () => {
  const ch = (z) => KhoaHoc.cauHinh(z).slice().sort((a, b) => a.n - b.n || 'spd'.indexOf(a.l) - 'spd'.indexOf(b.l)).map((x) => x.n + x.l + x.e).join(' ');
  bang(ch(26), '1s2 2s2 2p6 3s2 3p6 3d6 4s2');
  bang(ch(24), '1s2 2s2 2p6 3s2 3p6 3d5 4s1');
  bang(ch(29), '1s2 2s2 2p6 3s2 3p6 3d10 4s1');
  bang(ch(17), '1s2 2s2 2p6 3s2 3p5');
});
thu('sơ đồ lai: AaBb × aabb → 1 : 1 : 1 : 1; Aa × Aa → 1AA : 2Aa : 1aa', () => {
  const r = KhoaHoc.laiF1({ p1: 'AaBb', p2: 'aabb' });
  bang(Object.keys(r.kg).length, 4); dung(Object.values(r.kg).every((v) => v === 1), JSON.stringify(r.kg));
  const r2 = KhoaHoc.laiF1({ p1: 'Aa', p2: 'Aa' });
  bang(r2.kg, { AA: 1, Aa: 2, aa: 1 });
  dung(KhoaHoc.render({ ve: 'sodolai', p1: 'Aab', p2: 'aa' }, 400, 200).errors.length === 1, 'kiểu gen sai báo lỗi');
});
thu('thấu kính hội tụ f = 10, d = 25 → d\' = 16,67 cm, ảnh thật; phân kì f = 12, d = 20 → ảnh ảo 7,5 cm', () => {
  const t = (o) => KhoaHoc.render(Object.assign({}, KhoaHoc.KINDS.thaukinh[1], o), 520, 280).svg;
  dung(/d' = 16,67 cm/.test(t({})) && /Ảnh thật, ngược chiều, nhỏ hơn vật/.test(t({})), 'hội tụ');
  dung(/d' = 7,5 cm/.test(t({ loai: 'phanki', f: 12, d: 20 })) && /Ảnh ảo, cùng chiều/.test(t({ loai: 'phanki', f: 12, d: 20 })), 'phân kì');
  dung(/vô cực/.test(t({ d: 10 })), 'vật ở tiêu điểm');
});
thu('mạch điện: linh kiện lạ, nút chưa có báo lỗi; chỗ ba dây gặp nhau có chấm nối', () => {
  const r = KhoaHoc.render({ ve: 'machdien', kichban: 'A = (0, 0)\nB = (2, 0)\nC = (2, 2)\nday A B\nday B C\ndientro B (4,0) = R\nfoo A B\nday A Q' }, 300, 200);
  bang(r.errors.length, 2);
  dung(/không có linh kiện "foo"/.test(r.errors[0]) && /chưa có nút Q/.test(r.errors[1]), r.errors.join(' | '));
  dung((r.svg.match(/<circle [^>]*r="3.2"/g) || []).length === 1, 'một chấm nối tại B');
});
thu('sơ đồ cây: nhánh con thụt một tầng, xác suất đường đi nhân theo nhánh (phân số rút gọn)', () => {
  const r = KhoaHoc.render({ ve: 'caySoDo', dulieu: 'A | 1/2\n- B | 1/3\n- C | 2/3\nD | 1/2', tich: true }, 400, 200);
  dung(!r.errors.length && r.labels.some((l) => /AB\}:\\ \\tfrac\{1\}\{6\}/.test(l.tex)) && r.labels.some((l) => /AC\}:\\ \\tfrac\{1\}\{3\}/.test(l.tex)), r.labels.map((l) => l.tex).join(' | '));
  dung(/thụt vào quá một tầng/.test(KhoaHoc.render({ ve: 'caySoDo', dulieu: '-- B | 1' }, 300, 200).errors[0]), 'thụt sai tầng');
});
thu('phả hệ: thế hệ tự tính, vợ / chồng lấy vào xếp cùng thế hệ, bố mẹ chưa có báo lỗi', () => {
  const r = KhoaHoc.render(Object.assign({}, KhoaHoc.KINDS.phahe[1]), 460, 300);
  dung(!r.errors.length && /<text[^>]*>III<\/text>/.test(r.svg) && !/<text[^>]*>IV<\/text>/.test(r.svg), 'ba thế hệ');
  dung(/chưa có bố \/ mẹ "9"/.test(KhoaHoc.render({ ve: 'phahe', dulieu: '1 | nam | | 9+2\n2 | nữ | |' }, 300, 200).errors[0]), 'bố mẹ chưa có');
});
thu('phương trình hoá học: viết LaTeX kiểu SGK, kiểm tra và tự cân bằng (cả oxi hoá – khử, ion, ngậm nước)', () => {
  const cb = (s) => HoaHoc.canBang(s).join(',');
  bang(cb('Al + O2 ->[t°] Al2O3'), '4,3,2');
  bang(cb('KMnO4 + HCl -> KCl + MnCl2 + Cl2↑ + H2O'), '2,16,2,2,5,8');
  bang(cb('Cu + HNO3 -> Cu(NO3)2 + NO↑ + H2O'), '3,8,3,2,4');
  bang(cb('CuSO4.5H2O ->[t°] CuSO4 + H2O'), '1,1,5');
  bang(HoaHoc.latex('2Al + 3Cl2 ->[t°] 2AlCl3'), '2\\mathrm{Al} + 3\\mathrm{Cl_{2}} \\xrightarrow{t^{\\circ}} 2\\mathrm{AlCl_{3}}');
  bang(HoaHoc.latex('Ba^2+ + SO4^2- -> BaSO4↓'), '\\mathrm{Ba}^{2+} + \\mathrm{SO_{4}}^{2-} \\xrightarrow{} \\mathrm{BaSO_{4}}{\\downarrow}');
  // hệ số ngay sau mũi tên không bị đẩy lên trên mũi tên (lỗi \longrightarrow 2 của MathLive)
  const mk = MathLive.convertLatexToMarkup(HoaHoc.latex('Fe + 2HCl -> 2FeCl2 + H2'));
  dung(!/ML__error/.test(mk) && /2/.test(mk), 'MathLive');
  dung(/rightleftharpoons/.test(HoaHoc.latex('N2 + 3H2 <=>[t°, xt] 2NH3')), 'thuận nghịch');
  const k = HoaHoc.kiemTra('Fe + HCl -> FeCl2 + H2');
  dung(!k.canBang && k.lech.some((x) => /^H: 1 ≠ 2/.test(x)), k.lech.join('; '));
  dung(HoaHoc.kiemTra('Fe + 2HCl -> FeCl2 + H2↑').canBang, 'đã cân bằng');
  bang(HoaHoc.vietLai('Fe + HCl -> FeCl2 + H2↑', [1, 2, 1, 1]), 'Fe + 2HCl -> FeCl2 + H2↑');
  // công thức chèn vào trang dựng được bằng MathLive (không có lỗi LaTeX)
  dung(!/ML__error/.test(MathLive.convertLatexToMarkup(HoaHoc.latex('N2 + 3H2 <=>[t°, xt] 2NH3'))), 'MathLive hiểu được');
});
thu('dựng hình từng nét: o._buoc nét đầu, điểm chưa có nét không ghi tên; khung nhìn giữ nguyên', () => {
  const sc = 'A = (0, 0)\nB = (4, 0)\nC = (1, 3)\ndoan AB\ndoan BC\ndoan CA';
  bang(Plane.soBuoc(sc), 3);
  const full = Plane.render({ id: 't', script: sc }, 300, 240), mot = Plane.render({ id: 't', script: sc, _buoc: 1 }, 300, 240);
  bang((mot.svg.match(/<line /g) || []).length, 1);
  dung(mot.labels.some((l) => l.tex === 'A') && !mot.labels.some((l) => l.tex === 'C'), mot.labels.map((l) => l.tex).join());
  bang(JSON.stringify(mot.view), JSON.stringify(full.view));
});
thu('khối ```toanviet-mon của AI: đọc mẫu, trường nhiều dòng, số, có / không; mẫu lạ bỏ qua', () => {
  const t = 'Câu 2.\n```toanviet-mon\nloai: bdcot\ntieude: Điểm thi\ndulieu:\nAn | 7\nBình | 9\nhienso: khong\nw: 400\n```';
  const ks = BaiGiai.khoiCau(t);
  bang(ks.length, 1); bang(ks[0].so, '2');
  const sp = ks[0].sp;
  dung(sp.type === 'khtn' && sp.kind === 'bdcot' && sp.dulieu === 'An | 7\nBình | 9' && sp.hienso === false && sp.w === 400 && sp.tieude === 'Điểm thi', JSON.stringify(sp));
  bang(BaiGiai.loiKhoi(sp), []);
  bang(BaiGiai.khoiCau('```toanviet-mon\nloai: khongco\n```').length, 0);
  const md = BaiGiai.fromText('Câu 1. Vẽ biểu đồ.\n\n```toanviet-mon\nloai: bdquat\ndulieu:\nA | 30\nB | 70\n```\n');
  dung(/^#FIG tv1 \{"type":"khtn"/m.test(md.markup), md.markup);
});
