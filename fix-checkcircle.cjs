const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

code = code.replace(/<CheckCircle size=\{14\}/g, '<CheckCircle2 size={14}');

fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('Fixed CheckCircle');
