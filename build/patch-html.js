const fs = require('fs');
let h = fs.readFileSync('src/index.html', 'utf8');
const dlg = `<div id="fxback" hidden></div>
<dialog id="fxdlg">
  <div class="fhead">
    <h2>Chèn công thức</h2>
    <div class="seg" id="fMode"><button type="button" data-m="v">Trực quan</button><button type="button" data-m="l">LaTeX</button></div>
    <label class="finl">Cỡ <select id="fSize"><option>14</option><option>16</option><option>18</option><option>20</option><option>22</option><option>24</option><option>26</option><option>28</option><option>32</option><option>40</option><option>48</option><option>64</option></select></label>
    <button type="button" class="fbtn" id="fBold" title="Chữ đậm"><b>B</b></button>
    <span class="fcols" id="fColors"></span>
  </div>
  <div id="tabs"></div>
  <div id="palette"></div>
  <div class="fpane">
    <div class="fpt"><span id="fPaneT">TRỰC QUAN</span><span id="fVHint">Gõ như MathType: / phân số · ^ mũ · _ chỉ số · \\omega rồi Tab ra ký hiệu · Enter xuống dòng · Ctrl+Enter chèn</span></div>
    <div id="fMathBox"></div>
    <textarea id="fTex" spellcheck="false" hidden></textarea>
    <div class="frow"><div class="seg" id="fTM" title="Đang gõ toán hay gõ chữ tại con trỏ. Đổi qua lại bằng Ctrl+Shift+E"><button type="button" data-m="math">∑ Toán</button><button type="button" data-m="text">Abc Chữ</button></div><input type="text" id="fText" spellcheck="false" autocomplete="off" placeholder="Hoặc gõ chữ ở đây rồi nhấn Enter: chữ vào đúng chỗ con trỏ đang đứng, kể cả ô chú thích"><button type="button" class="fbtn" id="fTextAdd">Thêm chữ</button></div>
    <div class="ferr" id="fPfx"></div>
  </div>
  <div class="fpane">
    <div class="fpt"><span>XEM TRƯỚC</span></div>
    <div id="fPrev"></div>
  </div>
  <div id="fKeyList" hidden></div>
  <div class="frow"><button type="button" class="fbtn" id="fKb">⌨ Bàn phím toán</button><button type="button" class="fbtn" id="fKeys">Phím tắt</button><span style="flex:1"></span><button type="button" class="fbtn" id="fxcancel">Huỷ</button><button type="button" class="fbtn primary" id="fxok">Chèn vào trang</button></div>
</dialog>`;
const a = h.indexOf('<dialog id="fxdlg">'), b = h.indexOf('</dialog>');
if (a < 0 || b < 0) throw new Error('dialog not found');
h = h.slice(0, a) + dlg + h.slice(b + '</dialog>'.length);
fs.writeFileSync('src/index.html', h);

fs.appendFileSync('src/styles.css', `
/* hộp soạn công thức theo thiết kế Bảng vẽ Toán */
#fxback { position: fixed; inset: 0; background: rgba(20, 30, 45, .4); z-index: 49; }
#fxback[hidden] { display: none; }
dialog#fxdlg { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); margin: 0; z-index: 50; width: 940px; max-width: 97vw; max-height: 97vh; overflow-y: auto; padding: 16px 18px; border-radius: 14px; border: 0; }
.fhead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.fhead h2 { font-size: 17px; margin: 0; flex: 1; }
.seg { display: inline-flex; border: 1px solid #c9d1db; border-radius: 7px; overflow: hidden; }
.seg button { border: 0; background: #fff; padding: 6px 12px; font: inherit; font-weight: 600; cursor: pointer; border-radius: 0; }
.seg button + button { border-left: 1px solid #c9d1db; }
.seg button[aria-pressed=true] { background: #0b5cad; color: #fff; }
.finl { display: flex; align-items: center; gap: 6px; color: #4a5868; }
.finl select { padding: 5px 6px; border: 1px solid #c9d1db; border-radius: 7px; font: inherit; }
.fbtn { padding: 7px 13px; border: 1px solid #c9d1db; border-radius: 8px; background: #fff; font: inherit; font-weight: 600; cursor: pointer; }
.fbtn:hover { background: #eef4fb; }
.fbtn[aria-pressed=true] { background: #0b5cad; color: #fff; border-color: #0b5cad; }
.fbtn.primary { background: #0b5cad; color: #fff; border-color: #0b5cad; padding: 8px 18px; }
.fcols { display: inline-flex; gap: 5px; }
.fcols button { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #fff; outline: 1px solid #c9d1db; padding: 0; cursor: pointer; }
.fcols button[aria-pressed=true] { outline: 2.5px solid #0b5cad; }
dialog#fxdlg #tabs { display: flex; flex-wrap: wrap; gap: 2px; padding: 0 0 8px; border-bottom: 1px solid #dde3ea; margin-bottom: 10px; }
dialog#fxdlg #tabs button { border: 0; background: none; padding: 6px 12px; border-radius: 8px; font: inherit; font-weight: 600; color: #4a5868; cursor: pointer; }
dialog#fxdlg #tabs button.on { background: #0b5cad; color: #fff; }
dialog#fxdlg #palette { margin: 0 0 10px; padding: 0; border: 0; height: auto; max-height: 132px; gap: 5px; }
dialog#fxdlg #palette button { min-width: 44px; min-height: 42px; border: 1px solid #d5dbe3; border-radius: 9px; font-size: 15px; }
.fpane { border: 1px solid #c9d1db; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; }
.fpane:focus-within { border-color: #0b5cad; }
.fpt { display: flex; justify-content: space-between; gap: 12px; font-size: 11.5px; color: #4a5868; margin-bottom: 6px; }
.fpt span:first-child { font-weight: 700; letter-spacing: .08em; }
dialog#fxdlg #mf { margin: 0 0 8px; border: 0; padding: 6px 2px; min-height: 76px; font-size: 26px; outline: none; --keyboard-zindex: 200; }
dialog#fxdlg #mf::part(virtual-keyboard-toggle), dialog#fxdlg #mf::part(menu-toggle) { display: none; }
#fTex { width: 100%; min-height: 96px; border: 0; outline: none; resize: vertical; font: 14px Consolas, monospace; }
.frow { display: flex; align-items: center; gap: 8px; }
#fText { flex: 1; padding: 8px 10px; border: 1px solid #c9d1db; border-radius: 8px; font: 14px "Segoe UI", sans-serif; }
.ferr { color: #b45309; font-size: 12.5px; min-height: 0; margin-top: 4px; }
#fPrev { min-height: 70px; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 6px; }
#fPrev .ph { color: #6b7785; }
#fKeyList { display: grid; grid-template-columns: max-content 1fr max-content 1fr; gap: 4px 12px; font-size: 12.5px; margin-bottom: 10px; max-height: 200px; overflow-y: auto; padding: 8px; background: #f7f9fb; border-radius: 8px; }
#fKeyList[hidden] { display: none; }
#fKeyList kbd { background: #fff; border: 1px solid #c9d1db; border-radius: 4px; padding: 1px 6px; font: 12px Consolas, monospace; white-space: nowrap; }
`);
console.log('html+css patched');
