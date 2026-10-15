const fs = require('fs');
let h = fs.readFileSync('src/index.html', 'utf8').replace(/\r\n/g, '\n');
const a = h.indexOf('  <div class="grp">\n    <div class="btns">\n      <select id="solidKind"');
const endMark = '</div><span>Ký hiệu SGK (Lí, Hoá, Sinh)</span>\n  </div>';
const b = h.indexOf(endMark);
if (a < 0 || b < 0) throw new Error('ribbon groups not found');
h = h.slice(0, a) + `  <div class="grp">
    <div class="stack">
      <div><label>Hình không gian</label><select id="solidKind" title="Chọn hình không gian"></select><button data-cmd="ins-solid" title="Chèn hình không gian đã chọn">Chèn</button></div>
      <div><label>Hình phẳng</label><select id="planeKind" title="Chọn hình phẳng mẫu (đổi được thông số ở khung Thuộc tính)"></select><button data-cmd="ins-plane" title="Chèn hình phẳng đã chọn">Chèn</button></div>
      <div><label>Ký hiệu SGK</label><select id="symKind" title="Ký hiệu, hình vẽ thường gặp trong SGK Vật lí, Hoá học, Sinh học"></select><button data-cmd="ins-sym" title="Chèn ký hiệu đã chọn">Chèn</button></div>
    </div><span>Hình học và ký hiệu Lí – Hoá – Sinh</span>
  </div>` + h.slice(b + endMark.length);
fs.writeFileSync('src/index.html', h);
fs.appendFileSync('src/styles.css', `
/* ba danh sách hình xếp chồng cho gọn thanh công cụ */
.stack { display: flex; flex-direction: column; gap: 2px; }
.stack > div { display: flex; align-items: center; gap: 4px; }
.stack label { width: 92px; font-size: 11px; color: #4a5868; text-align: right; }
#ribbon .stack select { height: 21px; width: 210px; max-width: 210px; font: 11.5px "Segoe UI", sans-serif; align-self: auto; }
#ribbon .stack button { flex-direction: row; min-width: 0; height: 21px; padding: 0 8px; font-size: 11.5px; border-color: #b7cdee; background: #fff; color: #1f5fbf; }
`);
console.log('ribbon compacted');
