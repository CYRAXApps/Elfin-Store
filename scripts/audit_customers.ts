import { getDb, getAdminAuth } from '../serverDb';

async function auditData() {
  const db = getDb();
  console.log('=== AUDITING FIRESTORE USERS & CUSTOMERS ===');
  
  const usersSnap = await db.collection('users').get();
  console.log('Total documents in users collection:', usersSnap.size);
  
  const customersSnap = await db.collection('customers').get();
  console.log('Total documents in customers collection:', customersSnap.size);
  
  const usersDocs = usersSnap.docs || [];
  const custDocs = customersSnap.docs || [];

  const usersData: any[] = [];
  const custData: any[] = [];

  usersDocs.forEach((d: any) => usersData.push({ id: d.id, col: 'users', ...d.data() }));
  custDocs.forEach((d: any) => custData.push({ id: d.id, col: 'customers', ...d.data() }));

  const allRecords = [...usersData, ...custData];
  
  console.log('\n--- IDENTIFIED RECORDS ---');
  allRecords.forEach(r => {
    const isPhoneId = r.id.startsWith('usr_p_') || r.id.startsWith('usr_91') || /^\+?\d+$/.test(r.id);
    const isEmailId = r.id.includes('@');
    const isUid = !isPhoneId && !isEmailId;
    const phone = r.phoneNumber || r.phone || 'none';
    const email = r.email || 'none';
    const name = r.displayName || r.fullName || 'none';
    const kind = isPhoneId ? 'PHONE-ID' : (isEmailId ? 'EMAIL-ID' : 'UID');
    console.log(`[${r.col}] ID: ${r.id} | Phone: ${phone} | Email: ${email} | Name: ${name} | Type: ${kind}`);
  });

  // Check for duplicate phones
  const phoneMap = new Map<string, { id: string; col: string }[]>();
  allRecords.forEach(r => {
    const p = r.phoneNumber || r.phone;
    if (p) {
      const ten = String(p).replace(/\D/g, '').slice(-10);
      if (ten.length === 10) {
        if (!phoneMap.has(ten)) phoneMap.set(ten, []);
        phoneMap.get(ten)!.push({ id: r.id, col: r.col });
      }
    }
  });

  console.log('\n--- PHONE MAPPINGS & POTENTIAL DUPLICATES ---');
  for (const [ten, list] of phoneMap.entries()) {
    if (list.length > 1) {
      console.log(`Phone ...${ten} appears in multiple docs:`, JSON.stringify(list));
    }
  }

  // Check orders collection
  const ordersSnap = await db.collection('orders').get();
  console.log('\nTotal orders:', ordersSnap.size);
  const orderUserIds = new Set<string>();
  (ordersSnap.docs || []).forEach((d: any) => {
    const data = d.data();
    if (data.userId) orderUserIds.add(data.userId);
  });
  console.log('Unique userIds on orders:', Array.from(orderUserIds));
}

auditData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
