const fs = require('fs');
let content = fs.readFileSync('src/components/account/DashboardWidgets.tsx', 'utf8');

content = content.replace(
  "                    <button key={i} onClick={() => onNavigateView('reviews')} className=\"text-slate-300 hover:text-amber-400 transition-colors\">",
  "                    <Link key={i} to={`/product/${item.productId}?tab=reviews`} className=\"text-slate-300 hover:text-amber-400 transition-colors\">"
);
content = content.replace(
  "                    </button>",
  "                    </Link>"
);

fs.writeFileSync('src/components/account/DashboardWidgets.tsx', content);
console.log('Patched DashboardWidgets');
