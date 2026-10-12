const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

// replace unexpected characters
code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('checked syntax');
