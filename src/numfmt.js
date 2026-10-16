// Nhận dạng giá trị đẹp (phân số, căn, bội của π) và chuyển sang LaTeX
(function (root) {
  'use strict';
  const EPS = 1e-7;
  const near = (a, b) => Math.abs(a - b) < EPS * Math.max(1, Math.abs(a));

  function asFraction(v, maxDen) {
    for (let q = 1; q <= (maxDen || 60); q++) {
      const p = Math.round(v * q);
      if (near(p / q, v)) return [p, q];
    }
    return null;
  }
  function fracTex(p, q) {
    if (q === 1) return String(p);
    return (p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(p) + '}{' + q + '}';
  }
  // r * sym  (r hữu tỉ, sym là LaTeX của √n hoặc π)
  function scaledTex(p, q, sym) {
    const sign = p < 0 ? '-' : '';
    const a = Math.abs(p);
    if (q === 1) return sign + (a === 1 ? '' : a) + sym;
    return sign + '\\dfrac{' + (a === 1 ? '' : a) + sym + '}{' + q + '}';
  }
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];

  function toTex(v) {
    if (v === Infinity) return '+\\infty';
    if (v === -Infinity) return '-\\infty';
    if (!isFinite(v)) return '';
    if (Math.abs(v) < 1e-9) return '0';
    let f = asFraction(v, 60);
    if (f) return fracTex(f[0], f[1]);
    for (const n of SQF) {
      f = asFraction(v / Math.sqrt(n), 12);
      if (f && f[0] !== 0) return scaledTex(f[0], f[1], '\\sqrt{' + n + '}');
    }
    f = asFraction(v / Math.PI, 12);
    if (f && f[0] !== 0) return scaledTex(f[0], f[1], '\\pi');
    // (a ± b√n)/c
    for (const n of SQF) {
      const s = Math.sqrt(n);
      for (let c = 1; c <= 6; c++) {
        for (let b = 1; b <= 4; b++) {
          for (const sg of [1, -1]) {
            const a = v * c - sg * b * s;
            const ar = Math.round(a);
            if (ar !== 0 && Math.abs(a - ar) < 1e-7) {
              const top = ar + (sg > 0 ? '+' : '-') + (b === 1 ? '' : b) + '\\sqrt{' + n + '}';
              return c === 1 ? top : '\\dfrac{' + top + '}{' + c + '}';
            }
          }
        }
      }
    }
    f = asFraction(v / Math.E, 6);
    if (f && f[0] !== 0) return scaledTex(f[0], f[1], 'e');
    f = asFraction(v * Math.E, 6);
    if (f && f[0] !== 0) return (f[0] < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f[0]) + '}{' + (f[1] === 1 ? '' : f[1]) + 'e}';
    return (Math.round(v * 100) / 100).toString().replace('.', '{,}');
  }

  function plain(v) {
    // số trên trục toạ độ: dấu trừ thật (−), không dùng dấu gạch nối, như sách
    return (Math.round(v * 1000) / 1000).toString().replace('.', ',').replace('-', '−');
  }
  root.NumFmt = { toTex, plain, asFraction };
})(typeof window !== 'undefined' ? window : globalThis);
