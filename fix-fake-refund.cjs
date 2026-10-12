const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

// Replace: const refundId = order.refundDetails?.refundId || order.payment?.refundId || `REF-${order.id.slice(0, 8).toUpperCase()}`;
// With: const refundId = order.refundDetails?.refundId || order.payment?.refundId;
code = code.replace(/const refundId = order\.refundDetails\?\.refundId \|\| order\.payment\?\.refundId \|\| `REF-\$\{order\.id\.slice\(0, 8\)\.toUpperCase\(\)\}`;/g, 'const refundId = order.refundDetails?.refundId || order.payment?.refundId;');

fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log("Removed fake refund ID generation.");
