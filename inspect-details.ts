import { getDb } from './serverDb';

async function checkDetails() {
  const db = getDb();

  // Inspect users
  const usersSnap = await db.collection('users').get();
  console.log('--- ALL USERS ---');
  for (const d of usersSnap.docs) {
    console.log(d.id, JSON.stringify(d.data(), null, 2));
  }

  // Inspect customers
  const custSnap = await db.collection('customers').get();
  console.log('--- ALL CUSTOMERS ---');
  for (const d of custSnap.docs) {
    console.log(d.id, JSON.stringify(d.data(), null, 2));
  }

  // Inspect orders
  const ordersSnap = await db.collection('orders').get();
  console.log('--- ALL ORDERS ---');
  for (const d of ordersSnap.docs) {
    const data = d.data();
    console.log(d.id, {
      orderId: data.id || data.orderId,
      customer: data.customer,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress
    });
  }

  // Inspect settings / store / admins
  const adminsSnap = await db.collection('admins').get();
  console.log('--- ALL ADMINS ---', adminsSnap.size);
  for (const d of adminsSnap.docs) {
    console.log(d.id, d.data());
  }

  const settingsSnap = await db.collection('settings').get();
  console.log('--- ALL SETTINGS ---', settingsSnap.size);
  for (const d of settingsSnap.docs) {
    console.log(d.id, d.data());
  }

  process.exit(0);
}

checkDetails().catch(e => {
  console.error(e);
  process.exit(1);
});
