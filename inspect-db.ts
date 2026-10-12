import { getDb } from './serverDb';

async function run() {
  const db = getDb();
  console.log("Checking Firestore collections...");
  const collections = [
    'customers',
    'users',
    'staff',
    'orders',
    'support_tickets',
    'phone_otps',
    'customer_addresses',
    'reviews',
    'notifications',
    'loyalty_accounts',
    'site_settings',
    'cms_settings',
    'store_settings',
    'invoices'
  ];

  for (const c of collections) {
    try {
      const snap = await db.collection(c).get();
      console.log(`COLLECTION [${c}]: ${snap.size} docs`);
      for (const d of snap.docs) {
        const data = d.data();
        console.log(`  - doc ${d.id}: email=${data.email}, phone=${data.phoneNumber || data.phone || data.mobile}, role=${data.role}, name=${data.name || data.displayName || data.fullName}`);
      }
    } catch (e: any) {
      console.log(`Error reading collection ${c}:`, e.message);
    }
  }
  process.exit(0);
}

run().catch(err => {
  console.error("Run error:", err);
  process.exit(1);
});
