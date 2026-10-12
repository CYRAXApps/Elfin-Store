const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

code = code.replace(/import \{ DollarSign, db \} from '\.\.\/\.\.\/firebase';/g, "import { db } from '../../firebase';");
code = code.replace(/import \{ DollarSign, \n  collection, /g, "import { \n  collection, ");
code = code.replace(/import \{ DollarSign, \n  RefreshCw, /g, "import { DollarSign, \n  RefreshCw, ");
code = code.replace(/import \{ DollarSign, ReturnRequest \} from '\.\.\/\.\.\/types';/g, "import { ReturnRequest } from '../../types';");
code = code.replace(/import \{ DollarSign, useAuth \} from '\.\.\/\.\.\/context\/AuthContext';/g, "import { useAuth } from '../../context/AuthContext';");

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('fixed imports properly');
