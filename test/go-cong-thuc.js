// Gõ thử công thức bằng phím thật (vai người dùng). Mỗi tình huống: mở hộp soạn mới, gõ, đọc mã LaTeX thu được.
// In "GO: tên | mong đợi | thu được | ĐÚNG/SAI". Chạy: node test/go-cong-thuc-chay.js
(async () => {
  const w = (t) => new Promise((s) => setTimeout(s, t));
  const B = String.fromCharCode(92);
  const K = (key, mods, ch) => ({ key, mods: mods || [], char: ch });
  const C = (k) => K(k, ['control']), CS = (k) => K(k, ['control', 'shift']);
  const TAB = K('Tab'), STAB = K('Tab', ['shift']), ENTER = K('Enter'), SENTER = K('Enter', ['shift']), BS = K('Backspace'), RIGHT = K('Right'), LEFT = K('Left');
  // [tên, chuỗi phím, mong đợi (LaTeX sau khi bỏ khoảng trắng) hoặc hàm kiểm tra]
  const T = [
    ['mũ rồi cộng tiếp (ra khỏi mũ bằng →)', ['x^2', RIGHT, '+1'], 'x^{2}+1'],
    ['mũ rồi gõ + ngay (như MathType: + vẫn trong mũ?)', ['x^2+1'], null],
    ['phân số gõ / rồi → ra ngoài', ['1/2', RIGHT, '+x'], B + 'frac{1}{2}+x'],
    ['Ctrl+F, Tab sang mẫu, Tab ra ngoài', [C('F'), '3', TAB, '4', TAB, '+1'], B + 'frac{3}{4}+1'],
    ['Ctrl+R căn rồi Tab ra ngoài', [C('R'), 'x', TAB, '+1'], B + 'sqrt{x}+1'],
    ['gõ sqrt', ['sqrt', 'x', TAB, '+1'], B + 'sqrt{x}+1'],
    ['gõ \\omega rồi phím cách', [B + 'omega '], B + 'omega'],
    ['<= >= != ->', ['a<=b>=c!=d->e'], (v) => v.includes(B + 'le') && v.includes(B + 'ge') && v.includes(B + 'ne') && /\\(to|rightarrow)/.test(v)],
    ['chỉ số x_1, Tab ra ngoài', ['x_1', TAB, '+x_2'], 'x_{1}+x_{2}'],
    ['số thập phân 2,5', ['2,5+3,7'], (v) => /2\{,\}5|2,5/.test(v)],
    ['Ctrl+Shift+E gõ chữ tiếng Việt rồi về toán', [CS('E'), 'Cho tam giác ', CS('E'), 'ABC'], (v) => v.includes(B + 'text{Cho tam giác') && /ABC$/.test(v)],
    ['gõ chữ tiếng Việt ngay trong ô toán: tự chuyển sang chữ', ['x=1 và'], (v) => v.includes(B + 'text{và') && !v.includes('v' + B + 'text')],
    ['Enter xuống dòng', ['x=1', ENTER, 'y=2'], (v) => v.startsWith(B + 'displaylines{') && v.includes('x=1') && v.includes('y=2')],
    ['Ctrl+G a ra alpha', [C('G'), 'a'], B + 'alpha'],
    ['Ctrl+G Shift+D ra Delta', [C('G'), K('D', ['shift'], 'D')], B + 'Delta'],
    ['60 độ: Ctrl+K o', ['60', C('K'), 'o'], '60^{' + B + 'circ}'],
    ['đồng dạng: Ctrl+K s', ['A', C('K'), 's', 'B'], (v) => v.includes(B + 'dongdang')],
    ['song song: Ctrl+K /', ['a', C('K'), '/', 'b'], (v) => v === 'a⫽b' || v === 'a' + B + 'sslashb'],
    ['gõ hai dấu // ra song song', ['AB//CD'], (v) => v === 'AB⫽CD' || v === 'AB' + B + 'sslashCD'],
    ['ngoặc tròn tự đóng', ['(x+1)^2'], null],
    ['ngoặc vuông, nhọn: [a;b)', ['[a;b)'], null],
    ['dấu * (nhân)', ['2*3'], null],
    ['pi, oo, in', ['pi+oo'], (v) => v.includes(B + 'pi') && v.includes(B + 'infty')],
    ['sin x, lim, log, ln', ['sin x+log_2', TAB, 'x+ln x'], (v) => v.includes(B + 'sin') && v.includes(B + 'log') && v.includes(B + 'ln')],
    ['trị tuyệt đối |x|', ['|x-1|'], null],
    ['đạo hàm y\'', ["y'=2x"], null],
    ['%', ['50%'], null],
    ['Backspace xoá phân số rỗng', ['1/2', BS, BS, BS], null],
    ['Ctrl+T rồi H: hệ phương trình, Shift+Enter thêm dòng', [C('T'), 'h', 'x+y=1', TAB, 'x-y=3', SENTER, 'z=0'], (v) => v.includes('cases') && v.includes('z=0')],
    ['Ctrl+Z hoàn tác trong ô soạn', ['abc', C('Z')], null],
    ['=> và <=> (⇔ như sách)', ['p=>q<=>r'], (v) => v.includes(B + 'Rightarrow') && v.includes(B + 'Leftrightarrow') && !v.includes('Long')],
    ['x2 (chữ rồi số)', ['x2+y3'], null],
    ['hỗn số 2 1/3', ['2 1/3'], '2' + B + 'frac{1}{3}'],
    ['góc ABC: Ctrl+T A', [C('T'), 'a', 'ABC', TAB, '=60', C('K'), 'o'], B + 'widehat{ABC}=60^{' + B + 'circ}'],
    ['vectơ AB: Ctrl+T V', [C('T'), 'v', 'AB', TAB, '+', C('T'), 'v', 'BC'], B + 'overrightarrow{AB}+' + B + 'overrightarrow{BC}'],
    ['Shift+Tab về ô trước', [C('F'), '1', TAB, '2', STAB, '0'], B + 'frac{10}{2}'],
    ['Ctrl+A rồi gõ đè', ['abc', C('A'), 'x'], 'x'],
    ['dán mã LaTeX bằng Ctrl+V', [C('V')], B + 'frac{1}{2}+' + B + 'sqrt{3}', 'dan'],
    ['Esc bằng phím thật: đóng hộp, không chuyển sang mã LaTeX', ['x+1', K('Escape')], null, 'esc'],
  ];
  // so sánh không phụ thuộc khoảng trắng (trừ khoảng trắng trong \text{…}) và ngoặc nhọn của mũ / chỉ số một ký tự (x^2 = x^{2})
  const norm = (v) => String(v).replace(/\\text\{[^{}]*\}|\s+/g, (m) => (m[0] === '\\' ? m : '')).replace(/([\^_])\{([^{}])\}/g, '$1$2');
  let pass = 0, fail = 0;
  for (const [name, keys, exp, kind] of T) {
    __clear(); await w(60);
    if (kind === 'dan') await window.api.copyText('$' + B + 'frac{1}{2}+' + B + 'sqrt{3}$');
    __run('ins-formula'); await w(450);
    const mf = document.getElementById('mf'), tx = document.getElementById('fTex');
    mf.focus(); await w(60);
    await window.api.testKeys(keys); await w(250);
    if (kind === 'esc') {
      const ok = !document.getElementById('fxdlg').open && mf.mode !== 'latex';
      console.log('GO: ' + name + ' | hộp còn mở=' + document.getElementById('fxdlg').open + ', chế độ=' + mf.mode + ' | ' + (ok ? 'ĐÚNG' : 'SAI'));
      if (ok) pass++; else fail++;
      if (document.getElementById('fxdlg').open) document.getElementById('fxcancel').click();
      await w(80); continue;
    }
    const v = norm(tx.value || mf.getValue('latex-expanded'));
    let ok = null;
    if (typeof exp === 'string') ok = v === norm(exp);
    else if (typeof exp === 'function') ok = !!exp(v);
    console.log('GO: ' + name + ' | mong đợi: ' + (typeof exp === 'string' ? exp : exp ? '(kiểm tra riêng)' : '(xem)') + ' | thu được: ' + v + ' | ' + (ok === null ? 'XEM' : ok ? 'ĐÚNG' : 'SAI'));
    if (ok === true) pass++; else if (ok === false) fail++;
    document.getElementById('fxcancel').click(); await w(80);
  }
  console.log('GO-TONG ' + pass + ' đúng, ' + fail + ' sai');
})();
