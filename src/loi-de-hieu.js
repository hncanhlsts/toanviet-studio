// Lỗi kịch bản hình (Plane.loi / Space.loi: "dòng  →  lỗi") viết lại bằng lời thường cho giáo viên, học sinh:
// nói điểm nào không dựng được, vì sao, nên sửa ở đâu. Điểm phụ do bộ đọc đề tạo (Z1, Z2…) không nêu tên mà tả bằng lời.
// Lỗi gốc vẫn giữ nguyên trong kịch bản, kiểm thử, tệp báo lỗi (để tra cứu kỹ thuật).
(function (root) {
  'use strict';
  const PHU = /^Z\d+$/; // điểm phụ của bộ đọc đề (src/dedehinh.js), ẩn trên hình
  const args = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
  // tên một đường thẳng qua hai điểm; có điểm phụ thì tả "đường thẳng kẻ qua B"
  const dt = (a, b) => (PHU.test(b) && !PHU.test(a) ? 'đường thẳng kẻ qua ' + a : PHU.test(a) && !PHU.test(b) ? 'đường thẳng kẻ qua ' + b : 'đường thẳng ' + a + b);
  const CU_PHAP = {
    doan: 'doan AB', duongthang: 'duongthang AB', tia: 'tia AB', dagiac: 'dagiac ABC', goc: 'goc ABC', vuong: 'vuong ABC',
    bang: 'bang AB AC', ghi: 'ghi AB = 5\\,cm', diem: 'diem A', an: 'an A', nhan: 'nhan A = x', duongtron: 'duongtron O A',
    chop: 'chop S ABCD', langtru: 'langtru ABC A1B1C1', tudien: 'tudien ABCD',
  };
  function mot(e) {
    const s = String(e || ''), k = s.indexOf('→');
    if (k < 0) return s;
    const dong = s.slice(0, k).trim(), loi = s.slice(k + 1).trim();
    const def = dong.match(/^([A-Z][A-Za-z0-9']*)\s*=\s*([a-z]+)\((.*)\)\s*$/), ten = (dong.match(/^([A-Z][A-Za-z0-9']*)\s*=/) || [])[1] || '', ham = def ? def[2] : '', a = def ? args(def[3]) : [];
    const kw = (dong.match(/^([a-z]+)\b/) || [])[1] || '';
    const diemKhong = ten ? 'Không dựng được điểm ' + ten + ': ' : 'Không vẽ được «' + dong + '»: ';
    let m;
    if (loi === 'hai đường thẳng song song') {
      if (ham === 'giao' && a.length === 4) return diemKhong + dt(a[0], a[1]) + ' song song với ' + dt(a[2], a[3]) + ' nên hai đường không cắt nhau. Kiểm tra lại đề: có thể viết nhầm tên điểm hoặc nhầm "vuông góc" / "song song".';
      return diemKhong + 'hai đường thẳng song song nên không cắt nhau. Kiểm tra lại đề.';
    }
    if (loi === 'đường thẳng song song với mặt phẳng') return diemKhong + 'đường thẳng song song với mặt phẳng nên không cắt nhau. Kiểm tra lại đề.';
    if (loi === 'phương chiếu song song với mặt phẳng') return diemKhong + 'phương chiếu song song với mặt phẳng nên không chiếu được.';
    if (loi === 'ba điểm thẳng hàng' && new Set(a).size < a.length) return diemKhong + 'có hai điểm trùng nhau (' + a.join(', ') + ') nên không tạo thành tam giác.';
    if (loi === 'ba điểm thẳng hàng') return diemKhong + 'ba điểm ' + a.filter((x) => !PHU.test(x)).slice(0, 3).join(', ') + ' thẳng hàng nên không tạo thành tam giác.';
    if (loi === 'đường thẳng không cắt đường tròn') return diemKhong + 'đường thẳng không cắt đường tròn (khoảng cách từ tâm tới đường thẳng lớn hơn bán kính).';
    if (loi === 'điểm nằm trong đường tròn') return diemKhong + 'điểm ' + (a[0] || '') + ' nằm trong đường tròn nên không kẻ được tiếp tuyến.';
    if (/bất đẳng thức tam giác/.test(loi)) return diemKhong + 'ba độ dài đã cho không tạo thành tam giác (cạnh lớn nhất phải nhỏ hơn tổng hai cạnh còn lại).';
    if (loi === 'tia suy biến' || loi === 'góc suy biến' || loi === 'góc bẹt') return diemKhong + 'hai điểm trùng nhau nên không xác định được tia / góc.';
    if ((m = loi.match(/^chưa có điểm (\S+)/))) return 'Lệnh «' + dong + '» cần điểm ' + m[1] + ' nhưng điểm ' + m[1] + ' chưa được dựng — thường do bước dựng điểm ' + m[1] + ' ở trên bị lỗi, hoặc chưa khai báo điểm ' + m[1] + '.';
    if ((m = loi.match(/^chưa có mặt phẳng (\S+)/))) return 'Lệnh «' + dong + '» dùng mặt phẳng ' + m[1] + ' nhưng mặt phẳng này chưa được khai báo (viết: mp ' + m[1] + ': A B C).';
    if ((m = loi.match(/^không có phép dựng "([^"]*)"/))) return 'Không hiểu cách dựng «' + m[1] + '» ở dòng «' + dong + '». Xem bảng các phép dựng trong hướng dẫn (trungdiem, chan, giao, …).';
    if ((m = loi.match(/^không có lệnh "([^"]*)"/))) return 'Không hiểu lệnh «' + m[1] + '» ở dòng «' + dong + '». Các lệnh vẽ: doan, duongthang, tia, dagiac, goc, vuong, bang, ghi, diem, duongtron…';
    if ((m = loi.match(/^không tính được "([^"]*)"/))) return 'Không tính được giá trị «' + m[1] + '» ở dòng «' + dong + '».';
    if (loi === 'không hiểu') return 'Không hiểu dòng «' + dong + '».';
    if (loi === 'toạ độ cần hai số') return 'Toạ độ điểm ' + ten + ' cần hai số, ví dụ ' + (ten || 'A') + ' = (2, 3).';
    if (/^toạ độ không gian cần ba số/.test(loi)) return 'Toạ độ điểm ' + ten + ' (không gian) cần ba số, ví dụ ' + (ten || 'A') + ' = (2, 3, 0).';
    if (loi === 'thiếu tên điểm') return 'Dòng «' + dong + '» thiếu tên điểm.';
    if (loi === 'góc cần ba điểm, đỉnh ở giữa') return 'Góc ở dòng «' + dong + '» cần ba điểm, đỉnh viết ở giữa (ví dụ goc ABC là góc tại B).';
    if (loi === 'mặt phẳng cần ít nhất 3 điểm') return 'Mặt phẳng ở dòng «' + dong + '» cần ít nhất ba điểm.';
    if (loi === 'hai đáy phải có cùng số đỉnh') return 'Lăng trụ ở dòng «' + dong + '»: hai đáy phải có cùng số đỉnh.';
    if ((m = loi.match(/^viết: (.*)$/))) return 'Sai cách viết ở dòng «' + dong + '». Cách viết đúng: ' + (m[1] || CU_PHAP[kw] || '') + '.';
    if (/P phải là mặt phẳng/.test(loi)) return 'Dòng «' + dong + '»: chỗ tên mặt phẳng phải là một mặt phẳng đã khai báo (mp P: A B C).';
    return 'Dòng «' + dong + '»: ' + loi + '.';
  }
  // cả danh sách lỗi: lỗi gốc trước; các lệnh chỉ hỏng vì thiếu điểm đã báo thì gộp lại (bao đóng bắc cầu trên DAG)
  function dich(errs) {
    const ds = (Array.isArray(errs) ? errs : String(errs || '').split('\n')).filter((x) => String(x).trim());
    const rootOf = {}, goc = [], theo = {};
    ds.forEach((e) => {
      const s = String(e);
      const d = s.match(/^\s*([A-Z][A-Za-z0-9']*)\s*=/);
      const m = s.match(/→\s*chưa có điểm (\S+)/);
      if (d && /→/.test(s) && !m) {
        rootOf[d[1]] = d[1];
      } else if (d && m && rootOf[m[1]]) {
        rootOf[d[1]] = rootOf[m[1]];
      }
    });
    ds.forEach((e) => {
      const s = String(e);
      const m = s.match(/→\s*chưa có điểm (\S+)/);
      if (m && rootOf[m[1]]) {
        const r = rootOf[m[1]];
        theo[r] = (theo[r] || 0) + 1;
        return;
      }
      goc.push(e);
    });
    // lỗi kéo theo ghi ngay sau lỗi gốc
    const out = [];
    goc.forEach((e) => {
      out.push(mot(e));
      const n = (String(e).match(/^\s*([A-Z][A-Za-z0-9']*)\s*=/) || [])[1];
      if (n && theo[n]) out.push('(Vì vậy ' + theo[n] + ' nét vẽ có điểm ' + n + ' cũng chưa vẽ được.)');
    });
    return out;
  }
  const api = { mot, dich };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LoiDeHieu = api;
})(this);
