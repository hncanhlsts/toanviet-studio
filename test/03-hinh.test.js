// Hình phẳng, hình không gian, trục số, biểu đồ Ven, ký hiệu SGK, đồ thị
const ANG = (P, a, o, b) => { const u = [P[a][0] - P[o][0], P[a][1] - P[o][1]], v = [P[b][0] - P[o][0], P[b][1] - P[o][1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)) * 180 / Math.PI; };
const deg = (labels, i) => parseFloat(String(labels.filter((l) => /circ/.test(l.tex || ''))[i].tex).replace('{,}', '.'));

nhom('Hình phẳng (plane.js)');
thu('phangiacgoc: phân giác trong hình bình hành chia đôi góc', () => {
  const r = Plane.render({ id: 't', script: Plane.scriptOf('hbhphangiac') }, 360, 300);
  bang(r.errors, []);
  gan(deg(r.labels, 0), deg(r.labels, 1), 0.01, 'góc DAM và MAB');
  gan(deg(r.labels, 2), deg(r.labels, 3), 0.01, 'góc BCN và NCD');
});
thu('phangiac(A, B, C): đỉnh viết trước', () => {
  const r = Plane.render({ id: 't', script: 'A = (1, 4)\nB = (0, 0)\nC = (6, 0)\nD = phangiac(A, B, C)\ndoan AD\ngoc BAD DAC = ?' }, 300, 300);
  gan(deg(r.labels, 0), deg(r.labels, 1), 0.01);
});
thu('thông số: đổi số thì số đo đổi theo', () => {
  const s = Plane.setParam(Plane.scriptOf('goc'), 'so_do', 120);
  dung(Plane.params(s).some((p) => p.value === 120), 'không đổi được thông số');
});
thu('báo lỗi rõ ràng khi dùng điểm chưa có', () => {
  const r = Plane.render({ id: 't', script: 'A = (0, 0)\ndoan AB' }, 300, 300);
  dung(r.errors.length === 1 && /chưa có điểm B/.test(r.errors[0]), r.errors.join());
});
thu('mọi hình mẫu dựng không lỗi và giữ đúng ảnh chuẩn', () => {
  const bad = [];
  Plane.KINDS.forEach((g) => { for (const k in g[1]) {
    const r = Plane.render({ id: 't', script: g[1][k][1] }, 360, 300);
    if (r.errors.length) bad.push(k + ': ' + r.errors[0]);
    try { anh('plane/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); }
  } });
  bang(bad, []);
});

nhom('Hình không gian (space.js)');
thu('mọi hình mẫu dựng không lỗi và giữ đúng ảnh chuẩn', () => {
  const bad = [];
  Space.KINDS.forEach((g) => { for (const k in g[1]) {
    const r = Space.render(Object.assign({ id: 't', script: g[1][k][1] }, Space.viewOf(k)), 360, 300);
    if (r.errors.length) bad.push(k + ': ' + r.errors[0]);
    try { anh('space/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); }
  } });
  bang(bad, []);
});
thu('khối chóp tự vẽ cạnh khuất', () => {
  const r = Space.render(Object.assign({ id: 't', script: Space.scriptOf('k_chop4sa') }, Space.viewOf('k_chop4sa')), 360, 300);
  dung((r.svg.match(/stroke-dasharray/g) || []).length >= 3, 'phải có ít nhất 3 cạnh khuất');
});
thu('đường thẳng xuyên mặt phẳng: phần dưới nét đứt', () => {
  const r = Space.render({ id: 't', script: Space.scriptOf('dtcatmp') }, 360, 300);
  dung(/stroke-dasharray/.test(r.svg));
});
thu('toạ độ Oxyz: toado M ghi đúng các toạ độ', () => {
  const r = Space.render({ id: 't', script: 'oxyz\ntruc 4 4 4\nO = (0, 0, 0)\nM = (2, 3, 2.5)\ntoado M' }, 360, 300);
  const t = r.labels.map((l) => l.tex);
  dung(t.includes('2') && t.includes('3') && t.includes('2{,}5'), t.join(' '));
});

nhom('Trục số, biểu đồ Ven (numline.js)');
thu('tập nghiệm và phép toán tập hợp', () => {
  const env = {};
  NumLine.parseRow('E = [1; +oo)', env); NumLine.parseRow('F = (-oo; 3]', env);
  dung(/\\lbrack\s*1;\\,3\\rbrack/.test(NumLine.parseRow('E ∩ F', env).label), 'E ∩ F phải là [1; 3]');
  dung(/\\varnothing/.test(NumLine.parseRow('[1; 2] ∩ [3; 4]', {}).label));
  const h = NumLine.parseRow('x < -1 hoặc x >= 2', {}).P;
  bang(h.gaps.map(Number), [1, 0, 1]); bang(h.pin.map(Number), [0, 1]);
});
thu('đọc số: hỗn số, tuần hoàn, căn', () => {
  gan(NumLine.num('-2 1/3').v, -7 / 3); gan(NumLine.num('4,1(6)').v, 25 / 6, 1e-9); gan(NumLine.num('-sqrt(2)').v, -Math.SQRT2);
});
thu('mọi mẫu trục số và Ven giữ đúng ảnh chuẩn', () => {
  const bad = [];
  for (const k in NumLine.KINDS) { const r = NumLine.render(Object.assign({ id: 't' }, NumLine.KINDS[k][1]), 480, 160); if (r.errors.length) bad.push(k + ': ' + r.errors[0]); try { anh('numline/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); } }
  for (const k in NumLine.VKINDS) { const r = NumLine.renderVenn(Object.assign({ id: 't' }, NumLine.VKINDS[k][1]), 360, 240); if (r.errors.length) bad.push(k + ': ' + r.errors[0]); try { anh('venn/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); } }
  bang(bad, []);
});

nhom('Ký hiệu SGK, đồ thị');
thu('mọi ký hiệu SGK vẽ được', () => {
  const bad = [];
  SGK.GROUPS.forEach((g) => { for (const k in g[1]) { const s = SGK.sizeOf(k); const r = SGK.render({ id: 't', kind: k, label: 'R_1', inner: true, data: 'ud u -' }, s.w, s.h); if (r.errors && r.errors.length) bad.push(k); try { anh('sgk/' + k, r); } catch (e) { bad.push(k + ': ' + e.message); } } });
  bang(bad, []);
});
thu('đồ thị và miền nghiệm không lỗi', () => {
  const g = Graph.renderGraph({ id: 't', funcs: 'x^3 - 3x\n(2x+1)/(x-1)', xmin: '-4', xmax: '4', ymin: '-4', ymax: '4', xstep: '1', ystep: '1', grid: true, ticks: true }, 360, 330);
  bang(g.errors, []);
  const m = Graph.renderRegion({ id: 't', ineqs: 'x + y <= 4\nx >= 0\ny >= 0', style: 'hatch', xmin: '-1', xmax: '5', ymin: '-1', ymax: '5', xstep: '1', ystep: '1' }, 360, 360);
  bang(m.errors, []);
});
