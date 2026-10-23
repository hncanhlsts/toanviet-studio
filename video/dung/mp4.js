// Ghi tệp MP4 từ các gói của WebCodecs — không cần ffmpeg:
//   luồng hình H.264 (VideoEncoder, avc: { format: 'avc' }) và (tuỳ chọn) luồng tiếng AAC-LC (AudioEncoder, aac: { format: 'aac' }).
// Bố cục "faststart": ftyp, moov (chỉ mục) rồi mới tới mdat, để trang mạng xử lý / phát ngay khi tải lên.
// Mỗi khung / gói tiếng là một chunk; không có khung B (bộ mã hoá của Chromium không sinh khung B) nên không cần ctts.
'use strict';
const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; };
const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16BE(v & 0xffff); return b; };
const box = (type, ...parts) => { const body = Buffer.concat(parts.flat()); return Buffer.concat([u32(body.length + 8), Buffer.from(type, 'ascii'), body]); };
const full = (type, ver, flags, ...parts) => box(type, Buffer.from([ver, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255]), ...parts);
const MATRIX = Buffer.concat([0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32));
const toBuf = (d) => Buffer.from(d instanceof ArrayBuffer ? new Uint8Array(d) : new Uint8Array(d.buffer, d.byteOffset, d.byteLength));
// mô tả MPEG-4 (esds): độ dài một byte (mọi phần ở đây < 128 byte)
const desc = (tag, ...parts) => { const body = Buffer.concat(parts.flat()); return Buffer.concat([Buffer.from([tag, body.length]), body]); };

class Mp4Writer {
  constructor(width, height, fps) { this.w = width; this.h = height; this.fps = fps; this.samples = []; this.avcC = null; this.lastTs = -1; this.audio = null; }
  // chunk: { data: Uint8Array, key: bool, ts: micro giây }; desc: avcC (decoderConfig.description) của gói đầu
  add(chunk, d) {
    if (d && !this.avcC) this.avcC = toBuf(d);
    if (chunk.ts <= this.lastTs) throw new Error('gói hình không theo thứ tự thời gian (có khung B?)');
    this.lastTs = chunk.ts;
    this.samples.push({ data: Buffer.from(chunk.data), key: chunk.key });
  }
  // luồng tiếng AAC: rate (Hz), ch (số kênh); mỗi gói 1024 mẫu; d: AudioSpecificConfig (decoderConfig.description) của gói đầu
  addAudio(data, rate, ch, d) {
    if (!this.audio) this.audio = { rate, ch, asc: null, samples: [] };
    if (d && !this.audio.asc) this.audio.asc = toBuf(d);
    this.audio.samples.push(Buffer.from(data));
  }
  finish() {
    if (!this.avcC) throw new Error('thiếu avcC từ bộ mã hoá');
    const A = this.audio && this.audio.samples.length ? this.audio : null;
    if (A && !A.asc) throw new Error('thiếu AudioSpecificConfig từ bộ mã hoá tiếng');
    const n = this.samples.length, scale = this.fps * 1000, delta = 1000, durMs = Math.round(n * 1000 / this.fps);
    const ftyp = box('ftyp', Buffer.from('isom'), u32(512), Buffer.from('isomiso2avc1mp41'));
    const avc1 = box('avc1', Buffer.alloc(6), u16(1), Buffer.alloc(16), u16(this.w), u16(this.h), u32(0x00480000), u32(0x00480000), u32(0), u16(1),
      Buffer.alloc(32), u16(0x0018), u16(0xffff), box('avcC', this.avcC), box('pasp', u32(1), u32(1)));
    const keys = []; this.samples.forEach((s, i) => { if (s.key) keys.push(i + 1); });
    const dinf = () => box('dinf', full('dref', 0, 0, u32(1), full('url ', 0, 1)));
    const build = (vOff, aOff) => {
      const stbl = box('stbl',
        full('stsd', 0, 0, u32(1), avc1),
        full('stts', 0, 0, u32(1), u32(n), u32(delta)),
        full('stss', 0, 0, u32(keys.length), keys.map(u32)),
        full('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
        full('stsz', 0, 0, u32(0), u32(n), this.samples.map((s) => u32(s.data.length))),
        full('stco', 0, 0, u32(n), vOff.map(u32)));
      const minf = box('minf', full('vmhd', 0, 1, Buffer.alloc(8)), dinf(), stbl);
      const mdia = box('mdia',
        full('mdhd', 0, 0, u32(0), u32(0), u32(scale), u32(n * delta), u16(0x55c4), u16(0)),
        full('hdlr', 0, 0, u32(0), Buffer.from('vide'), Buffer.alloc(12), Buffer.from('ToanViet Studio\0', 'utf8')),
        minf);
      const tkhd = full('tkhd', 0, 3, u32(0), u32(0), u32(1), u32(0), u32(durMs), Buffer.alloc(8), u16(0), u16(0), u16(0), u16(0), MATRIX, u32(this.w << 16), u32(this.h << 16));
      const traks = [box('trak', tkhd, mdia)];
      if (A) {
        const an = A.samples.length, aDur = an * 1024, aMs = Math.round(aDur * 1000 / A.rate);
        const esds = full('esds', 0, 0, desc(3, u16(2), Buffer.from([0]),
          desc(4, Buffer.from([0x40, 0x15, 0, 0, 0]), u32(192000), u32(192000), desc(5, A.asc)),
          desc(6, Buffer.from([2]))));
        const mp4a = box('mp4a', Buffer.alloc(6), u16(1), Buffer.alloc(8), u16(A.ch), u16(16), u16(0), u16(0), u32(A.rate << 16), esds);
        const astbl = box('stbl',
          full('stsd', 0, 0, u32(1), mp4a),
          full('stts', 0, 0, u32(1), u32(an), u32(1024)),
          full('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
          full('stsz', 0, 0, u32(0), u32(an), A.samples.map((s) => u32(s.length))),
          full('stco', 0, 0, u32(an), aOff.map(u32)));
        const aminf = box('minf', full('smhd', 0, 0, u16(0), u16(0)), dinf(), astbl);
        const amdia = box('mdia',
          full('mdhd', 0, 0, u32(0), u32(0), u32(A.rate), u32(aDur), u16(0x55c4), u16(0)),
          full('hdlr', 0, 0, u32(0), Buffer.from('soun'), Buffer.alloc(12), Buffer.from('ToanViet Studio\0', 'utf8')),
          aminf);
        const atkhd = full('tkhd', 0, 3, u32(0), u32(0), u32(2), u32(0), u32(aMs), Buffer.alloc(8), u16(0), u16(1), u16(0x0100), u16(0), MATRIX, u32(0), u32(0));
        traks.push(box('trak', atkhd, amdia));
      }
      const mvhd = full('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(durMs), u32(0x00010000), u16(0x0100), Buffer.alloc(10), MATRIX, Buffer.alloc(24), u32(A ? 3 : 2));
      return box('moov', mvhd, ...traks);
    };
    // kích thước moov không phụ thuộc giá trị offset → dựng hai lần
    const aS = A ? A.samples : [];
    const moovLen = build(this.samples.map(() => 0), aS.map(() => 0)).length;
    let off = ftyp.length + moovLen + 8;
    const vOff = this.samples.map((s) => { const o = off; off += s.data.length; return o; });
    const aOff = aS.map((s) => { const o = off; off += s.length; return o; });
    const moov = build(vOff, aOff);
    const mdatLen = off - (ftyp.length + moovLen);
    return Buffer.concat([ftyp, moov, u32(mdatLen), Buffer.from('mdat')].concat(this.samples.map((s) => s.data), aS));
  }
}
module.exports = { Mp4Writer };
