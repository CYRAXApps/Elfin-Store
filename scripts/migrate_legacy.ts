import { getDb, FieldValue } from '../serverDb';

async function migrateLegacy() {
  const db = getDb();
  console.log('Migrating legacy documents without deleting data...');

  const legacyRef1 = db.collection('users').doc('usr_p_916297747957');
  const snap1 = await legacyRef1.get();
  if (snap1.exists) {
    await legacyRef1.set({
      migratedTo: 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1',
      isMigrated: true,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Marked users/usr_p_916297747957 as migrated to ZudeiMJXXaUFxFN6sV8ErPplZ7w1');
  }

  const legacyCustRef1 = db.collection('customers').doc('usr_p_916297747957');
  const snapCust1 = await legacyCustRef1.get();
  if (snapCust1.exists) {
    await legacyCustRef1.set({
      migratedTo: 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1',
      isMigrated: true,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Marked customers/usr_p_916297747957 as migrated to ZudeiMJXXaUFxFN6sV8ErPplZ7w1');
  }

  console.log('Migration complete.');
}

migrateLegacy().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
