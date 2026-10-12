const fs = require('fs');

let content = fs.readFileSync('src/pages/Account.tsx', 'utf8');

// Insert Desktop
content = content.replace(
  '      {/* Account Settings & Preferences Grid */}',
  `      <DashboardWidgets orders={orders} onNavigateView={navigateToView} />\n\n      {/* Account Settings & Preferences Grid */}`
);

// Insert Mobile
content = content.replace(
  '      {/* 6. Account Settings Card */}',
  `      <DashboardWidgets orders={orders} onNavigateView={navigateToView} />\n\n      {/* 6. Account Settings Card */}`
);

fs.writeFileSync('src/pages/Account.tsx', content);
console.log('Patched Account.tsx');
