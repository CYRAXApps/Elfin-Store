import { getDb } from '../serverDb';

const PRIMARY_OWNER_UID = 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';
const PRIMARY_OWNER_EMAIL = 'ritamsaha0000@gmail.com';
const PRIMARY_OWNER_PHONE = '8617445344';

function isProtectedAdmin(docId: string, data: any): boolean {
  if (docId === PRIMARY_OWNER_UID) return true;
  if (data) {
    const role = (data.role || '').toLowerCase();
    if (role === 'admin' || role === 'owner' || role === 'manager' || role === 'staff') return true;
    if (data.isPrimaryOwner === true) return true;
    if (data.isAdmin === true) return true;

    const email = (data.email || '').toLowerCase().trim();
    if (email === PRIMARY_OWNER_EMAIL || email.endsWith('@electrostore.com') || email.startsWith('admin@')) return true;

    const phone = (data.phoneNumber || data.phone || '').replace(/\D/g, '');
    if (phone.endsWith(PRIMARY_OWNER_PHONE)) return true;
  }
  return false;
}

async function purgeCustomersOnly() {
  const db = getDb();
  console.log('=== STARTING PURGE OF CUSTOMERS ONLY (PRESERVING ADMINS) ===');

  let deletedCustomersCount = 0;
  let deletedUsersCount = 0;
  let preservedAdminsCount = 0;

  // 1. Purge from 'customers' collection
  const customersSnap = await db.collection('customers').get();
  console.log(`Checking ${customersSnap.size} documents in 'customers'...`);

  for (const docSnap of customersSnap.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();

    if (isProtectedAdmin(docId, data)) {
      console.log(`[PRESERVED ADMIN] in 'customers': ID: ${docId}, email: ${data.email}, role: ${data.role}`);
      preservedAdminsCount++;
      continue;
    }

    // Delete subcollections for customer
    const subcols = ['addresses', 'cart', 'wishlist', 'reviews'];
    for (const sub of subcols) {
      try {
        const subSnap = await db.collection('customers').doc(docId).collection(sub).get();
        if (subSnap && subSnap.docs) {
          for (const subDoc of subSnap.docs) {
            await db.collection('customers').doc(docId).collection(sub).doc(subDoc.id).delete();
          }
        }
      } catch (subErr) {
        // ignore
      }
    }

    // Delete customer doc
    await db.collection('customers').doc(docId).delete();
    console.log(`[DELETED CUSTOMER] from 'customers': ID: ${docId}, phone: ${data.phoneNumber || data.phone}, email: ${data.email}`);
    deletedCustomersCount++;
  }

  // 2. Purge from 'users' collection
  const usersSnap = await db.collection('users').get();
  console.log(`\nChecking ${usersSnap.size} documents in 'users'...`);

  for (const docSnap of usersSnap.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();

    if (isProtectedAdmin(docId, data)) {
      console.log(`[PRESERVED ADMIN] in 'users': ID: ${docId}, email: ${data.email}, role: ${data.role}`);
      continue;
    }

    // Delete subcollections for customer
    const subcols = ['addresses', 'cart', 'wishlist', 'reviews'];
    for (const sub of subcols) {
      try {
        const subSnap = await db.collection('users').doc(docId).collection(sub).get();
        if (subSnap && subSnap.docs) {
          for (const subDoc of subSnap.docs) {
            await db.collection('users').doc(docId).collection(sub).doc(subDoc.id).delete();
          }
        }
      } catch (subErr) {
        // ignore
      }
    }

    // Delete customer doc
    await db.collection('users').doc(docId).delete();
    console.log(`[DELETED CUSTOMER] from 'users': ID: ${docId}, phone: ${data.phoneNumber || data.phone}, email: ${data.email}`);
    deletedUsersCount++;
  }

  // 3. Purge non-admin phone_otps
  const otpsSnap = await db.collection('phone_otps').get();
  console.log(`\nChecking ${otpsSnap.size} OTP audit logs...`);
  for (const docSnap of otpsSnap.docs) {
    const docId = docSnap.id;
    const data = docSnap.data();
    const phone = (data.phoneNumber || docId).replace(/\D/g, '');
    if (!phone.endsWith(PRIMARY_OWNER_PHONE)) {
      await db.collection('phone_otps').doc(docId).delete();
      console.log(`[DELETED OTP LOG] for customer phone: ${docId}`);
    } else {
      console.log(`[PRESERVED OTP LOG] for admin phone: ${docId}`);
    }
  }

  console.log('\n=== PURGE COMPLETED SUCCESSFULLY ===');
  console.log(`Deleted Customers: ${deletedCustomersCount} from customers, ${deletedUsersCount} from users`);
  console.log(`Preserved Admins/Owners: ${preservedAdminsCount}`);
}

purgeCustomersOnly().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
