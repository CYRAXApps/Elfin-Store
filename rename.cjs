const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

code = code.replace(/case 'refunded': return 'Mark Refunded';/g, "case 'refunded': return 'Process Refund';");

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Renamed action via cjs');
