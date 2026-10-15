// Bản 2.0.2: kèm PDF hướng dẫn vào bộ cài, sửa mô tả kiểu tệp .tvs
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.version = '2.0.2';
p.build.fileAssociations[0].description = 'Tài liệu ToanViet Studio';
if (!p.build.extraResources.some((r) => r.to === 'huong-dan')) p.build.extraResources.push({ from: 'huong-dan', to: 'huong-dan', filter: ['*.pdf'] });
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
console.log(p.version, JSON.stringify(p.build.extraResources));
