const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const regex = /\/\/ 1\. Process Inventory[\s\S]*?\/\/ 3\. Update Return Request document/g;
const replacement = `// 3. Update Return Request document`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log("Removed actual refund and inventory processing as requested.");
