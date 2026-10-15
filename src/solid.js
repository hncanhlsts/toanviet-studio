// Hình không gian kiểu SGK: nét khuất vẽ đứt, phép chiếu song song
(function (root) {
  'use strict';
  const r1 = (v) => Math.round(v * 10) / 10;
  const num = (v, d) => { const t = parseFloat(String(v).replace(',', '.')); return isFinite(t) ? t : d; };
  const NAME_RE = /[A-Z](?:'{1,2}|_?\d)?/g;

  const KINDS = {
    chop3: 'Hình chóp tam giác S.ABC',
    chop4: 'Hình chóp tứ giác S.ABCD',
    tudien: 'Tứ diện ABCD',
    hop: "Hình hộp chữ nhật ABCD.A'B'C'D'",
    lapphuong: "Hình lập phương ABCD.A'B'C'D'",
    langtru3: "Lăng trụ tam giác ABC.A'B'C'",
    chopcut: "Hình chóp cụt ABCD.A'B'C'D'",
    tru: 'Hình trụ',
    non: 'Hình nón',
    noncut: 'Hình nón cụt',
    cau: 'Hình cầu',
  };

  function triangle(o, a) {
    const b = num(o.b, a);
    if (o.base === 'vuongA') return [[0, 0, 0], [a, 0, 0], [0, b, 0]];
    if (o.base === 'vuongB') return [[0, b, 0], [0, 0, 0], [a, 0, 0]];
    return [[0, 0, 0], [a, 0, 0], [a / 2, a * Math.sqrt(3) / 2, 0]];
  }
  const avg = (ps) => ps.reduce((s, p) => [s[0] + p[0] / ps.length, s[1] + p[1] / ps.length, s[2] + p[2] / ps.length], [0, 0, 0]);

  // Dựng đa diện: đỉnh V, mặt F (cạnh suy ra từ mặt)
  function buildPoly(o) {
    const a = num(o.a, 4), b = num(o.b, a), h = num(o.ch, 4);
    const V = {}, F = [];
    const up = (p, dz) => [p[0], p[1], p[2] + dz];
    if (o.kind === 'chop3' || o.kind === 'tudien') {
      const T = triangle(o.kind === 'tudien' ? {} : o, a);
      const n = o.kind === 'tudien' ? ['B', 'C', 'D', 'A'] : ['A', 'B', 'C', 'S'];
      V[n[0]] = T[0]; V[n[1]] = T[1]; V[n[2]] = T[2];
      const foot = o.kind === 'tudien' ? avg(T) : (o.apex === 'A' ? T[0] : o.apex === 'B' ? T[1] : avg(T));
      V[n[3]] = up(foot, o.kind === 'tudien' ? a * Math.sqrt(2 / 3) : h);
      F.push([n[0], n[1], n[2]], [n[3], n[0], n[1]], [n[3], n[1], n[2]], [n[3], n[2], n[0]]);
    } else if (o.kind === 'chop4') {
      V.A = [0, 0, 0]; V.B = [a, 0, 0]; V.C = [a, b, 0]; V.D = [0, b, 0];
      const foot = o.apex === 'A' ? V.A : o.apex === 'B' ? V.B : [a / 2, b / 2, 0];
      V.S = up(foot, h);
      F.push(['A', 'B', 'C', 'D'], ['S', 'A', 'B'], ['S', 'B', 'C'], ['S', 'C', 'D'], ['S', 'D', 'A']);
    } else if (o.kind === 'hop' || o.kind === 'lapphuong' || o.kind === 'chopcut') {
      const bb = o.kind === 'lapphuong' ? a : b, hh = o.kind === 'lapphuong' ? a : h;
      const k = o.kind === 'chopcut' ? Math.min(0.95, Math.max(0.1, num(o.ratio, 0.5))) : 1;
      const base = { A: [0, 0, 0], B: [a, 0, 0], C: [a, bb, 0], D: [0, bb, 0] };
      const c = [a / 2, bb / 2, 0];
      for (const key in base) {
        V[key] = base[key];
        V[key + "'"] = [c[0] + (base[key][0] - c[0]) * k, c[1] + (base[key][1] - c[1]) * k, hh];
      }
      F.push(['A', 'B', 'C', 'D'], ["A'", "B'", "C'", "D'"], ['A', 'B', "B'", "A'"], ['B', 'C', "C'", "B'"], ['C', 'D', "D'", "C'"], ['D', 'A', "A'", "D'"]);
    } else if (o.kind === 'langtru3') {
      const T = triangle(o, a);
      ['A', 'B', 'C'].forEach((nm, i) => { V[nm] = T[i]; V[nm + "'"] = up(T[i], h); });
      F.push(['A', 'B', 'C'], ["A'", "B'", "C'"], ['A', 'B', "B'", "A'"], ['B', 'C', "C'", "B'"], ['C', 'A', "A'", "C'"]);
    }
    return { V, F };
  }

  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

  function renderPoly(o, w, h) {
    const { V, F } = buildPoly(o);
    const errors = [];
    const yaw = num(o.yaw, 25) * Math.PI / 180, pitch = num(o.pitch, 18) * Math.PI / 180;
    // điểm thêm: "M = SA" (trung điểm), "G = ABC" (trọng tâm), "O = AC"
    const extraPts = [];
    String(o.points || '').split(/[\n;]/).map((s) => s.trim()).filter(Boolean).forEach((line) => {
      const m = line.match(/^([A-Z](?:'{1,2}|_?\d)?)\s*=\s*(.+)$/);
      const names = m ? (m[2].match(NAME_RE) || []) : [];
      if (!m || !names.length || names.some((nm) => !V[nm])) { errors.push('Điểm không hợp lệ: ' + line); return; }
      V[m[1]] = avg(names.map((nm) => V[nm]));
      extraPts.push(m[1]);
    });
    // hướng nhìn và phép chiếu
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const view = [sy * cp, cy * cp, -sp]; // véctơ từ mắt đi vào hình
    const proj = (p) => [p[0] * cy - p[1] * sy, -((p[0] * sy + p[1] * cy) * sp + p[2] * cp)];
    const center = avg(Object.keys(V).filter((k) => !extraPts.includes(k)).map((k) => V[k]));
    const faces = F.map((names) => {
      const p = names.map((nm) => V[nm]);
      let n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
      if (dot(n, sub(p[0], center)) < 0) n = n.map((t) => -t);
      const len = Math.hypot(n[0], n[1], n[2]);
      n = n.map((t) => t / len);
      return { names, n, p0: p[0], front: dot(n, view) < -1e-9 };
    });
    const edges = new Map();
    faces.forEach((f, fi) => f.names.forEach((nm, i) => {
      const key = [nm, f.names[(i + 1) % f.names.length]].sort().join('|');
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push(fi);
    }));
    const onFace = (p, f) => Math.abs(dot(f.n, sub(p, f.p0))) < 1e-7;
    const segVisible = (p, q) => faces.some((f) => f.front && onFace(p, f) && onFace(q, f));
    const segs = [];
    edges.forEach((fis, key) => {
      const [u, v] = key.split('|');
      segs.push({ u, v, vis: fis.some((fi) => faces[fi].front), edge: true });
    });
    String(o.segs || '').split(/[\n,;]/).map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const names = s.match(NAME_RE) || [];
      if (names.length < 2 || names.some((nm) => !V[nm])) { errors.push('Đoạn không hợp lệ: ' + s); return; }
      for (let i = 0; i + 1 < names.length; i++) segs.push({ u: names[i], v: names[i + 1], vis: segVisible(V[names[i]], V[names[i + 1]]) });
    });
    // co giãn vừa khung
    const P2 = {};
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const k in V) { const q = proj(V[k]); P2[k] = q; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const M = 30;
    const sc = Math.min((w - 2 * M) / Math.max(1e-6, x1 - x0), (h - 2 * M) / Math.max(1e-6, y1 - y0));
    const T = (q) => [w / 2 + (q[0] - (x0 + x1) / 2) * sc, h / 2 + (q[1] - (y0 + y1) / 2) * sc];
    for (const k in P2) P2[k] = T(P2[k]);
    const c2 = T(proj(center));
    const parts = [], labels = [];
    const sw = num(o.stroke, 1.5);
    const col = o.color || '#111';
    // mặt tô nhạt (tuỳ chọn)
    if (o.fill) faces.filter((f) => f.front).forEach((f) => {
      parts.push(`<polygon points="${f.names.map((nm) => r1(P2[nm][0]) + ',' + r1(P2[nm][1])).join(' ')}" fill="#aed6f1" fill-opacity="0.28" stroke="none"/>`);
    });
    segs.sort((s, t) => (s.vis ? 1 : 0) - (t.vis ? 1 : 0)).forEach((s) => {
      const p = P2[s.u], q = P2[s.v];
      parts.push(`<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${col}" stroke-width="${s.edge ? sw : sw * 0.85}" stroke-linecap="round"${s.vis ? '' : ' stroke-dasharray="6 4"'}/>`);
    });
    if (o.labels !== false) for (const k in P2) {
      const p = P2[k];
      if (extraPts.includes(k)) parts.push(`<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.4" fill="${col}"/>`);
      // đặt tên điểm vào giữa khoảng trống góc lớn nhất quanh điểm đó, ưu tiên phía xa tâm hình
      const out = Math.atan2(p[1] - c2[1], p[0] - c2[0]);
      const angs = [];
      segs.forEach((s) => {
        const other = s.u === k ? s.v : s.v === k ? s.u : null;
        if (other) angs.push(Math.atan2(P2[other][1] - p[1], P2[other][0] - p[0]));
      });
      // điểm nằm giữa một đoạn (trung điểm, tâm): đoạn đó chắn cả hai phía
      segs.forEach((s) => {
        if (s.u === k || s.v === k) return;
        const a = P2[s.u], b = P2[s.v];
        const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const dt = (p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]);
        const l2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
        if (Math.abs(cr) < 1e-3 * Math.max(1, l2) && dt > 0 && dt < l2) { const t = Math.atan2(b[1] - a[1], b[0] - a[0]); angs.push(t, t + Math.PI); }
      });
      let best = out;
      if (angs.length) {
        const srt = angs.map((t) => ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
        let score = -Infinity;
        srt.forEach((t, i) => {
          const gap = (i + 1 < srt.length ? srt[i + 1] : srt[0] + 2 * Math.PI) - t;
          const mid = t + gap / 2;
          const sc = Math.min(gap, Math.PI) + 0.35 * Math.cos(mid - out);
          if (sc > score) { score = sc; best = mid; }
        });
      }
      labels.push({ x: p[0] + Math.cos(best) * 15, y: p[1] + Math.sin(best) * 15, tex: k, size: 16 });
    }
    return { svg: parts.join(''), labels, errors };
  }

  // ---------- Khối tròn xoay ----------
  function arc(cx, cy, rx, ry, t0, t1) {
    let d = '';
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n;
      d += (i ? 'L' : 'M') + r1(cx + rx * Math.cos(t)) + ',' + r1(cy - ry * Math.sin(t));
    }
    return d;
  }
  function renderRound(o, w, h) {
    const pitch = num(o.pitch, 18) * Math.PI / 180;
    const sp = Math.max(0.05, Math.sin(pitch)), cp = Math.cos(pitch);
    const R = num(o.a, 2), R2 = o.kind === 'noncut' ? Math.min(R * 0.98, num(o.b, 1)) : R, H = num(o.ch, 4);
    const sw = num(o.stroke, 1.5), col = o.color || '#111';
    const M = 30, parts = [], labels = [];
    const S = (d, dash) => parts.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}"${dash ? ' stroke-dasharray="6 4"' : ''}/>`);
    const dot2 = (x, y) => parts.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="2.3" fill="${col}"/>`);
    const lab = o.labels !== false;
    if (o.kind === 'cau') {
      const r = Math.min(w, h) / 2 - M, cx = w / 2, cy = h / 2;
      if (o.fill) parts.push(`<circle cx="${cx}" cy="${cy}" r="${r1(r)}" fill="#aed6f1" fill-opacity="0.28"/>`);
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${r1(r)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`);
      S(arc(cx, cy, r, r * sp, 0, Math.PI), true);
      S(arc(cx, cy, r, r * sp, Math.PI, 2 * Math.PI), false);
      if (lab) {
        S(`M${cx},${cy}L${r1(cx + r)},${cy}`, true);
        dot2(cx, cy);
        labels.push({ x: cx - 10, y: cy - 10, tex: 'O', size: 16 }, { x: cx + r / 2, y: cy - 11, tex: o.rname || 'R', size: 15 });
      }
      return { svg: parts.join(''), labels, errors: [] };
    }
    // kích thước chiếu: bán kính ngang r, bán trục đứng r*sin, chiều cao H*cos
    const totalH = H * cp + (R + (o.kind === 'non' ? 0 : R2)) * sp;
    const sc = Math.min((w - 2 * M) / (2 * R), (h - 2 * M) / totalH);
    const r = R * sc, ry = r * sp, hh = H * cp * sc, cx = w / 2;
    const rt = R2 * sc, ryt = rt * sp;
    const top = (h - totalH * sc) / 2;
    const cyB = top + (o.kind === 'non' ? 0 : ryt) + hh, cyT = cyB - hh;
    if (o.kind === 'tru') {
      if (o.fill) parts.push(`<path d="${arc(cx, cyB, r, ry, Math.PI, 2 * Math.PI)}L${r1(cx + r)},${r1(cyT)}${arc(cx, cyT, r, ry, 0, Math.PI).replace('M', 'L')}Z" fill="#aed6f1" fill-opacity="0.28"/>`);
      S(arc(cx, cyT, r, ry, 0, 2 * Math.PI) + 'Z');
      S(arc(cx, cyB, r, ry, 0, Math.PI), true);
      S(arc(cx, cyB, r, ry, Math.PI, 2 * Math.PI));
      S(`M${r1(cx - r)},${r1(cyT)}V${r1(cyB)}M${r1(cx + r)},${r1(cyT)}V${r1(cyB)}`);
      if (lab) {
        S(`M${cx},${r1(cyT)}V${r1(cyB)}M${cx},${r1(cyB)}H${r1(cx + r)}`, true);
        dot2(cx, cyT); dot2(cx, cyB);
        labels.push({ x: cx - 12, y: cyT - 2, tex: "O'", size: 16 }, { x: cx - 12, y: cyB + 4, tex: 'O', size: 16 },
          { x: cx + r * 0.55, y: cyB - 10, tex: o.rname || 'r', size: 15 }, { x: cx + 10, y: (cyT + cyB) / 2, tex: o.hname || 'h', size: 15 });
      }
    } else {
      // nón / nón cụt: đường sinh tiếp xúc với elip đáy
      const apexH = o.kind === 'non' ? hh : hh * r / Math.max(1e-6, r - rt);
      const t0 = Math.asin(Math.min(1, ry / apexH));
      const bx = r * Math.cos(t0), by = cyB - ry * Math.sin(t0);
      if (o.kind === 'non') {
        const ax = cx, ay = cyB - hh;
        if (o.fill) parts.push(`<path d="M${ax},${r1(ay)}L${r1(cx - bx)},${r1(by)}${arc(cx, cyB, r, ry, Math.PI - t0, 2 * Math.PI + t0).replace('M', 'L')}Z" fill="#aed6f1" fill-opacity="0.28"/>`);
        S(arc(cx, cyB, r, ry, t0, Math.PI - t0), true);
        S(arc(cx, cyB, r, ry, Math.PI - t0, 2 * Math.PI + t0));
        S(`M${r1(cx - bx)},${r1(by)}L${ax},${r1(ay)}L${r1(cx + bx)},${r1(by)}`);
        if (lab) {
          S(`M${cx},${r1(ay)}V${r1(cyB)}M${cx},${r1(cyB)}H${r1(cx + r)}`, true);
          dot2(cx, cyB);
          labels.push({ x: cx, y: ay - 13, tex: 'S', size: 16 }, { x: cx - 12, y: cyB + 4, tex: 'O', size: 16 },
            { x: cx + r * 0.55, y: cyB - 10, tex: o.rname || 'r', size: 15 }, { x: cx + 10, y: (ay + cyB) / 2, tex: o.hname || 'h', size: 15 },
            { x: cx + bx / 2 + 14, y: (ay + by) / 2 - 4, tex: o.lname || 'l', size: 15 });
        }
      } else {
        const tx = rt * Math.cos(t0), ty = cyT - ryt * Math.sin(t0);
        if (o.fill) parts.push(`<path d="M${r1(cx - tx)},${r1(ty)}L${r1(cx - bx)},${r1(by)}${arc(cx, cyB, r, ry, Math.PI - t0, 2 * Math.PI + t0).replace('M', 'L')}L${r1(cx + tx)},${r1(ty)}Z" fill="#aed6f1" fill-opacity="0.28"/>`);
        S(arc(cx, cyT, rt, ryt, 0, 2 * Math.PI) + 'Z');
        S(arc(cx, cyB, r, ry, t0, Math.PI - t0), true);
        S(arc(cx, cyB, r, ry, Math.PI - t0, 2 * Math.PI + t0));
        S(`M${r1(cx - bx)},${r1(by)}L${r1(cx - tx)},${r1(ty)}M${r1(cx + bx)},${r1(by)}L${r1(cx + tx)},${r1(ty)}`);
        if (lab) {
          S(`M${cx},${r1(cyT)}V${r1(cyB)}M${cx},${r1(cyB)}H${r1(cx + r)}M${cx},${r1(cyT)}H${r1(cx + rt)}`, true);
          dot2(cx, cyT); dot2(cx, cyB);
          labels.push({ x: cx - 12, y: cyT - 2, tex: "O'", size: 16 }, { x: cx - 12, y: cyB + 4, tex: 'O', size: 16 },
            { x: cx + r * 0.55, y: cyB - 10, tex: 'R', size: 15 }, { x: cx + rt / 2, y: cyT - 10, tex: 'r', size: 15 }, { x: cx + 10, y: (cyT + cyB) / 2, tex: o.hname || 'h', size: 15 });
        }
      }
    }
    return { svg: parts.join(''), labels, errors: [] };
  }

  const isRound = (k) => ['tru', 'non', 'noncut', 'cau'].includes(k);
  function render(o, w, h) { return isRound(o.kind) ? renderRound(o, w, h) : renderPoly(o, w, h); }

  root.Solid = { render, KINDS, isRound };
})(window);
