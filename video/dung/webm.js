// Ghi tệp WebM (một luồng hình VP9) từ các gói đã mã hoá của WebCodecs VideoEncoder — không cần ffmpeg.
// Có Duration, SeekHead và Cues để trình phát (trình duyệt, VLC, YouTube) biết độ dài và tua được.
'use strict';
const vint = (n) => { // kích thước dạng EBML, luôn 8 byte cho đơn giản
  const b = Buffer.alloc(8); b[0] = 0x01; let v = BigInt(n);
  for (let i = 7; i >= 1; i--) { b[i] = Number(v & 0xffn); v >>= 8n; }
  return b;
};
const idBuf = (id) => { const h = id.toString(16); return Buffer.from(h.length % 2 ? '0' + h : h, 'hex'); };
const el = (id, data) => { const d = Buffer.isBuffer(data) ? data : Buffer.concat(data); return Buffer.concat([idBuf(id), vint(d.length), d]); };
const uint = (id, v, bytes) => { const b = Buffer.alloc(bytes || 8); let x = BigInt(v); for (let i = b.length - 1; i >= 0; i--) { b[i] = Number(x & 0xffn); x >>= 8n; } return el(id, b); };
const str = (id, s) => el(id, Buffer.from(s, 'utf8'));
const f64 = (id, v) => { const b = Buffer.alloc(8); b.writeDoubleBE(v); return el(id, b); };

class WebmWriter {
  constructor(width, height) { this.w = width; this.h = height; this.clusters = []; this.cur = null; }
  // chunk: { data: Uint8Array, ms: thời điểm (mili giây), key: true/false }
  add(chunk) {
    if (!this.cur || chunk.key || chunk.ms - this.cur.ms > 30000) { this.flush(); this.cur = { ms: chunk.ms, blocks: [] }; }
    const hdr = Buffer.alloc(4); hdr[0] = 0x81; hdr.writeInt16BE(chunk.ms - this.cur.ms, 1); hdr[3] = chunk.key ? 0x80 : 0x00;
    this.cur.blocks.push(el(0xA3, [hdr, Buffer.from(chunk.data)]));
  }
  flush() { if (this.cur) { this.clusters.push({ ms: this.cur.ms, buf: el(0x1F43B675, [uint(0xE7, this.cur.ms, 4)].concat(this.cur.blocks)) }); this.cur = null; } }
  finish(durationMs) {
    this.flush();
    const ebml = el(0x1A45DFA3, [uint(0x4286, 1, 1), uint(0x42F7, 1, 1), uint(0x42F2, 4, 1), uint(0x42F3, 8, 1), str(0x4282, 'webm'), uint(0x4287, 4, 1), uint(0x4285, 2, 1)]);
    const info = el(0x1549A966, [uint(0x2AD7B1, 1000000, 4), str(0x4D80, 'ToanViet Studio'), str(0x5741, 'ToanViet Studio'), f64(0x4489, durationMs)]);
    const tracks = el(0x1654AE6B, [el(0xAE, [uint(0xD7, 1, 1), uint(0x73C5, 1, 1), uint(0x83, 1, 1), str(0x86, 'V_VP9'), el(0xE0, [uint(0xB0, this.w, 2), uint(0xBA, this.h, 2)])])]);
    // SeekHead có kích thước cố định (vị trí ghi 8 byte) nên tính trước được
    const seek = (id, pos) => el(0x4DBB, [el(0x53AB, idBuf(id)), uint(0x53AC, pos, 8)]);
    const seekLen = el(0x114D9B74, [seek(0x1549A966, 0), seek(0x1654AE6B, 0), seek(0x1C53BB6B, 0)]).length;
    const infoPos = seekLen, tracksPos = infoPos + info.length, clPos0 = tracksPos + tracks.length;
    let p = clPos0; const cuePts = [];
    this.clusters.forEach((c) => { cuePts.push(el(0xBB, [uint(0xB3, c.ms, 8), el(0xB7, [uint(0xF7, 1, 1), uint(0xF1, p, 8)])])); p += c.buf.length; });
    const cues = el(0x1C53BB6B, cuePts);
    const seekHead = el(0x114D9B74, [seek(0x1549A966, infoPos), seek(0x1654AE6B, tracksPos), seek(0x1C53BB6B, p)]);
    const body = [seekHead, info, tracks].concat(this.clusters.map((c) => c.buf), [cues]);
    const size = body.reduce((s, b) => s + b.length, 0);
    return Buffer.concat([ebml, idBuf(0x18538067), vint(size)].concat(body));
  }
}
module.exports = { WebmWriter };
