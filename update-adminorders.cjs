const fs = require('fs');
const file = 'src/pages/admin/AdminOrders.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('AdminReturnsManager')) {
  code = code.replace(
    "import { getEffectiveShippingStatus } from './orders/orderUtils';",
    "import { getEffectiveShippingStatus } from './orders/orderUtils';\nimport { AdminReturnsManager } from './AdminReturnsManager';"
  );

  const blockToReplace = `  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Info */}`;

  const newBlock = `  if (filters.statusTab === 'returns') {
    return <AdminReturnsManager />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Title & Quick Info */}`;

  code = code.replace(blockToReplace, newBlock);
  fs.writeFileSync(file, code);
  console.log("Updated AdminOrders.tsx");
} else {
  console.log("Already updated");
}
