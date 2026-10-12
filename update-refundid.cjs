const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const regex = /if \(\!data\.success \&\& \!res\.ok\) \{\s*alert\(\`Refund failed: \$\{data\.error \|\| 'Gateway error'\}\`\);\s*return;\s*\}/m;

const replacement = `if (!data.success && !res.ok) {
           alert(\`Refund failed: \${data.error || 'Gateway error'}\`);
           return;
        }
        if (data.refundId) {
           additionalData = additionalData || {};
           additionalData.razorpayRefundId = data.refundId;
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Added refundId saving');
