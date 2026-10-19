// Làm rõ ảnh đề bài trước khi nhận chữ (OCR): dùng cho ảnh cắt màn hình (PDF, Word, web), ảnh chụp điện thoại,
// ảnh dán từ Zalo / Messenger (đã nén, nhoè). Chạy trong cửa sổ (canvas), trả về ảnh PNG để gửi cho Tesseract.
//   1. Chuyển xám; ảnh nền tối (chế độ tối của Zalo, Messenger) thì đảo thành chữ đen nền trắng.
//   2. Phóng to chữ nhỏ: ước lượng chiều cao dòng chữ, phóng sao cho chữ cao khoảng 32 điểm ảnh (cỡ Tesseract đọc tốt).
//   3. San phẳng ánh sáng (ảnh chụp có chỗ sáng chỗ tối): chia cho nền đã làm mờ, kéo giãn tương phản.
//   4. Chỉnh nghiêng (ảnh chụp lệch vài độ): thử các góc, chọn góc làm các dòng chữ thẳng hàng ngang nhất.
(function (root) {
  'use strict';

  function grayOf(id) {
    const { data, width: w, height: h } = id, g = new Float32Array(w * h);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) {
      const a = data[i + 3] / 255; // nền trong suốt coi là trắng
      g[j] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) * a + 255 * (1 - a);
    }
    return g;
  }

  // làm mờ hộp (ảnh tích phân) bán kính r
  function boxBlur(g, w, h, r) {
    const I = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += g[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
    const o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        o[y * w + x] = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((y1 - y0) * (x1 - x0));
      }
    }
    return o;
  }

  // chiều cao dòng chữ (điểm ảnh): khoảng cách giữa các dòng có mực theo hàng ngang
  function lineHeight(g, w, h) {
    const rows = new Float32Array(h);
    for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) if (g[y * w + x] < 140) c++; rows[y] = c; }
    const runs = []; let st = -1;
    for (let y = 0; y <= h; y++) { const ink = y < h && rows[y] > Math.max(2, w * 0.004); if (ink && st < 0) st = y; if (!ink && st >= 0) { if (y - st >= 3) runs.push(y - st); st = -1; } }
    if (!runs.length) return 0;
    runs.sort((a, b) => a - b);
    return runs[Math.floor(runs.length / 2)];
  }

  // độ "thẳng hàng" của các dòng chữ khi xoay góc a (độ): phương sai số điểm mực theo hàng
  function skewScore(g, w, h, a) {
    const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), bins = new Float32Array(h * 2 + w);
    const off = w;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (g[y * w + x] < 128) { const yy = Math.round(y * c - x * s) + off; if (yy >= 0 && yy < bins.length) bins[yy]++; }
    let m = 0; for (const b of bins) m += b; m /= bins.length;
    let v = 0; for (const b of bins) v += (b - m) * (b - m);
    return v;
  }

  // ảnh (HTMLImageElement / ImageBitmap / canvas) → { canvas, scale, angle, inverted }
  function prep(img, opt) {
    opt = opt || {};
    const W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height;
    const c0 = document.createElement('canvas'); c0.width = W0; c0.height = H0;
    const x0 = c0.getContext('2d', { willReadFrequently: true }); x0.fillStyle = '#fff'; x0.fillRect(0, 0, W0, H0); x0.drawImage(img, 0, 0);
    let g = grayOf(x0.getImageData(0, 0, W0, H0));
    // 1. nền tối → đảo màu
    let mean = 0; for (const v of g) mean += v; mean /= g.length;
    const inverted = mean < 110;
    if (inverted) for (let i = 0; i < g.length; i++) g[i] = 255 - g[i];
    // góc nghiêng đo trên ảnh gốc (thu nhỏ còn rộng ≤ 900 điểm ảnh cho nhanh); xoay ở bước 4
    let angle = 0;
    if (opt.deskew !== false) {
      const f = Math.max(1, Math.ceil(W0 / 900)), w2 = Math.floor(W0 / f), h2 = Math.floor(H0 / f), gs = new Float32Array(w2 * h2);
      for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) gs[y * w2 + x] = g[(y * f) * W0 + x * f];
      let best = skewScore(gs, w2, h2, 0), bestA = 0;
      for (let a = -6; a <= 6.001; a += 0.5) { const s = skewScore(gs, w2, h2, a); if (s > best * 1.0005) { best = s; bestA = a; } }
      for (let a = bestA - 0.5; a <= bestA + 0.501; a += 0.125) { const s = skewScore(gs, w2, h2, a); if (s > best * 1.0005) { best = s; bestA = a; } }
      angle = Math.abs(bestA) >= 0.25 ? bestA : 0;
    }
    // 2. phóng to theo cỡ chữ
    const lh = lineHeight(g, W0, H0);
    let scale = lh ? 32 / lh : (W0 < 900 ? 2 : 1);
    scale = Math.max(1, Math.min(4, scale));
    if (W0 * scale > 4200) scale = Math.max(1, 4200 / W0);
    const W = Math.round(W0 * scale), H = Math.round(H0 * scale);
    const c1 = document.createElement('canvas'); c1.width = W; c1.height = H;
    const x1 = c1.getContext('2d', { willReadFrequently: true });
    {
      const t = document.createElement('canvas'); t.width = W0; t.height = H0;
      const tx = t.getContext('2d'), id = tx.createImageData(W0, H0);
      for (let i = 0, j = 0; j < g.length; i += 4, j++) { id.data[i] = id.data[i + 1] = id.data[i + 2] = g[j]; id.data[i + 3] = 255; }
      tx.putImageData(id, 0, 0);
      x1.imageSmoothingEnabled = true; x1.imageSmoothingQuality = 'high'; x1.drawImage(t, 0, 0, W, H);
    }
    g = grayOf(x1.getImageData(0, 0, W, H));
    // 3. san phẳng ánh sáng: nền = làm mờ lớn (tối đa giữa ảnh và nền để chữ không làm tối nền), chia cho nền
    if (opt.flatten !== false) {
      const r = Math.max(15, Math.round(Math.min(W, H) / 25));
      const bg = boxBlur(g, W, H, r);
      const bg2 = boxBlur(bg.map((v, i) => Math.max(v, g[i])), W, H, Math.round(r / 2));
      for (let i = 0; i < g.length; i++) { const v = g[i] / Math.max(40, bg2[i]) * 255; g[i] = v > 255 ? 255 : v; }
      // kéo giãn tương phản: điểm tối nhất 2% → 0, sáng nhất → 255
      const hist = new Uint32Array(256); for (const v of g) hist[v | 0]++;
      let lo = 0, acc = 0; while (lo < 255 && (acc += hist[lo]) < g.length * 0.02) lo++;
      for (let i = 0; i < g.length; i++) { const v = (g[i] - lo) * 255 / Math.max(30, 235 - lo); g[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
    }
    // 4. chỉnh nghiêng theo góc đã đo
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const xo = out.getContext('2d');
    const t2 = document.createElement('canvas'); t2.width = W; t2.height = H;
    const id2 = t2.getContext('2d').createImageData(W, H);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) { id2.data[i] = id2.data[i + 1] = id2.data[i + 2] = g[j]; id2.data[i + 3] = 255; }
    t2.getContext('2d').putImageData(id2, 0, 0);
    xo.fillStyle = '#fff'; xo.fillRect(0, 0, W, H);
    if (angle) { xo.translate(W / 2, H / 2); xo.rotate(-angle * Math.PI / 180); xo.translate(-W / 2, -H / 2); }
    xo.drawImage(t2, 0, 0);
    return { canvas: out, scale, angle, inverted, lineHeight: lh };
  }

  const toPng = (canvas) => new Promise((res) => canvas.toBlob((b) => b.arrayBuffer().then((ab) => res(new Uint8Array(ab))), 'image/png'));

  root.OcrAnh = { prep, toPng };
})(this);
