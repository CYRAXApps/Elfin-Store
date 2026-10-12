const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

code = code.replace(/const isReplace = request.items\?\.\[0\]\?\.requestedResolution === 'replacement';\n\n  const \[activeForm, setActiveForm\] = React\.useState<'none' \| 'pickup' \| 'inspection'>\('none'\);\n/g, '');

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('cleaned duplicates');
