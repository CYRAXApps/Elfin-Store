const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

code = code.replace(/            \)\}\n\}\n               <\/div>/, '            )}\n               </div>');
fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('Fixed syntax error 5');
