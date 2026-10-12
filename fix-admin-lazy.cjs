const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace: const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
// With: import { Admin } from './pages/Admin';
code = code.replace(/const Admin = lazy\(\(\) => import\('\.\/pages\/Admin'\)\.then\(m => \(\{ default: m\.Admin \}\)\)\);/, "import { Admin } from './pages/Admin';");

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed Admin lazy loading");
