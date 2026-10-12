import { getDb } from './serverDb';

async function cleanupFirestore() {
  const db = getDb();
  console.log('--- STARTING COMPLETE CUSTOMER & NUMBER/EMAIL CLEANUP ---');

  const ALLOWED_PHONE_10 = '6297747957';
  const ALLOWED_PHONE_PLUS = '+916297747957';
  const ALLOWED_EMAIL = 'ritamsaha0000@gmail.com';
  const OWNER_UID = 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';

  // 1. Completely delete all documents in 'customers' collection and subcollections
  console.log('1. Clearing customers collection...');
  try {
    const custSnap = await db.collection('customers').get();
    for (const docSnap of custSnap.docs) {
      const cid = docSnap.id;
      for (const sub of ['addresses', 'cart', 'wishlist', 'reviews']) {
        try {
          const subSnap = await db.collection(`customers/${cid}/${sub}`).get();
          for (const s of subSnap.docs) {
            await db.collection(`customers/${cid}/${sub}`).doc(s.id).delete();
          }
        } catch (e) {}
      }
      await db.collection('customers').doc(cid).delete();
      console.log(`Deleted customer doc: ${cid}`);
    }
  } catch (err: any) {
    console.error('Error clearing customers:', err.message);
  }

  // 2. Remove non-owner users from 'users' collection
  console.log('2. Removing all customer/non-owner accounts from users collection...');
  try {
    const usersSnap = await db.collection('users').get();
    for (const docSnap of usersSnap.docs) {
      const uid = docSnap.id;
      const data = docSnap.data();
      const email = (data.email || '').trim().toLowerCase();

      if (uid !== OWNER_UID && email !== ALLOWED_EMAIL) {
        // Delete all subcollections
        for (const sub of ['addresses', 'cart', 'wishlist', 'notifications', 'orders', 'reviews']) {
          try {
            const subSnap = await db.collection(`users/${uid}/${sub}`).get();
            for (const s of subSnap.docs) {
              await db.collection(`users/${uid}/${sub}`).doc(s.id).delete();
            }
          } catch (e) {}
        }
        await db.collection('users').doc(uid).delete();
        console.log(`Deleted non-owner user: ${uid} (email: ${email})`);
      }
    }

    // Now update owner user doc to ensure ONLY allowed phone and email
    const ownerRef = db.collection('users').doc(OWNER_UID);
    const ownerSnap = await ownerRef.get();
    if (ownerSnap.exists()) {
      await ownerRef.update({
        phoneNumber: ALLOWED_PHONE_PLUS,
        phone: ALLOWED_PHONE_PLUS,
        email: ALLOWED_EMAIL,
        primaryEmail: ALLOWED_EMAIL,
        altPhone: '',
        alternativePhoneNumber: '',
        displayName: 'Ritam Saha',
        fullName: 'Ritam Saha',
        role: 'owner',
        isPrimaryOwner: true,
        status: 'active',
        isPhoneVerified: true
      });
      console.log('Updated owner user doc with exact phone +916297747957 & email ritamsaha0000@gmail.com');
    }
  } catch (err: any) {
    console.error('Error in users collection cleanup:', err.message);
  }

  // 3. Clear staff collection if any
  console.log('3. Clearing staff collection...');
  try {
    const staffSnap = await db.collection('staff').get();
    for (const sDoc of staffSnap.docs) {
      await db.collection('staff').doc(sDoc.id).delete();
      console.log(`Deleted staff doc: ${sDoc.id}`);
    }
  } catch (err: any) {
    console.error('Error clearing staff:', err.message);
  }

  // 4. Remove all phone OTPs except +916297747957
  console.log('4. Cleaning phone_otps collection...');
  try {
    const otpSnap = await db.collection('phone_otps').get();
    for (const oDoc of otpSnap.docs) {
      if (oDoc.id !== '_916297747957' && !oDoc.id.includes('6297747957')) {
        await db.collection('phone_otps').doc(oDoc.id).delete();
        console.log(`Deleted unused phone_otp doc: ${oDoc.id}`);
      }
    }
  } catch (err: any) {
    console.error('Error cleaning phone_otps:', err.message);
  }

  // 5. Clean orders (delete customer test orders or orders not matching owner)
  console.log('5. Cleaning orders collection...');
  try {
    const ordersSnap = await db.collection('orders').get();
    for (const oDoc of ordersSnap.docs) {
      const oData = oDoc.data();
      const phone = (oData.customerPhone || oData.shippingAddress?.phone || '').replace(/\D/g, '');
      const email = (oData.customerEmail || oData.email || '').trim().toLowerCase();
      const name = (oData.customerName || oData.shippingAddress?.fullName || '').trim().toLowerCase();

      // If order belongs to removed customer or contains other phones/emails, delete it
      if (
        name.includes('riya') ||
        phone.includes('8617445344') ||
        email.includes('ritamsaha5678') ||
        email.includes('cyraxapps') ||
        (phone && !phone.endsWith(ALLOWED_PHONE_10) && phone !== '0000000000') ||
        (email && email !== ALLOWED_EMAIL)
      ) {
        await db.collection('orders').doc(oDoc.id).delete();
        console.log(`Deleted order with unwanted customer/phone/email: ${oDoc.id}`);
      }
    }
  } catch (err: any) {
    console.error('Error cleaning orders:', err.message);
  }

  // 6. Clean customer-related collections: storeCredits, loyaltyAccounts, support_tickets, return_requests, customer_addresses, newsletterSubscribers
  console.log('6. Cleaning auxiliary customer collections...');
  const auxCollections = [
    'customer_addresses',
    'support_tickets',
    'return_requests',
    'newsletterSubscribers',
    'inquiries',
    'loyalty_accounts',
    'loyaltyAccounts',
    'storeCredits',
    'storeCreditTransactions',
    'loyaltyTransactions',
    'notifications'
  ];

  for (const col of auxCollections) {
    try {
      const snap = await db.collection(col).get();
      for (const d of snap.docs) {
        const dData = d.data();
        const dPhone = (dData.phone || dData.phoneNumber || '').replace(/\D/g, '');
        const dEmail = (dData.email || '').trim().toLowerCase();

        // If it's not the owner, delete it
        if (d.id !== OWNER_UID && (dEmail !== ALLOWED_EMAIL || (dPhone && !dPhone.endsWith(ALLOWED_PHONE_10)))) {
          await db.collection(col).doc(d.id).delete();
          console.log(`Deleted from ${col}: ${d.id}`);
        }
      }
    } catch (e: any) {
      console.warn(`Notice on collection ${col}:`, e.message);
    }
  }

  // 7. Update settings/business and settings/admin_profile
  console.log('7. Updating settings documents...');
  try {
    const businessRef = db.collection('settings').doc('business');
    const busSnap = await businessRef.get();
    if (busSnap.exists()) {
      await businessRef.update({
        businessPhone: ALLOWED_PHONE_10,
        supportPhone: '+91 62977 47957',
        businessEmail: ALLOWED_EMAIL,
        supportEmail: ALLOWED_EMAIL
      });
      console.log('Updated settings/business phone and email.');
    }

    const adminProfileRef = db.collection('settings').doc('admin_profile');
    const admSnap = await adminProfileRef.get();
    if (admSnap.exists()) {
      await adminProfileRef.update({
        phoneNumber: ALLOWED_PHONE_10,
        phone: ALLOWED_PHONE_PLUS,
        email: ALLOWED_EMAIL,
        primaryEmail: ALLOWED_EMAIL,
        altPhone: '',
        alternativePhoneNumber: ''
      });
      console.log('Updated settings/admin_profile phone and email.');
    }
  } catch (err: any) {
    console.error('Error updating settings:', err.message);
  }

  console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

cleanupFirestore().catch(e => {
  console.error('Fatal cleanup error:', e);
  process.exit(1);
});
