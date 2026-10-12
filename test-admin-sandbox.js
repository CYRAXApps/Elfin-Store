import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

try {
  const configStr = readFileSync('./firebase-applet-config.json', 'utf8');
  const config = JSON.parse(configStr);
  const app = initializeApp(); // NO projectId!
  const db = getFirestore(app, config.firestoreDatabaseId);

  async function test() {
    try {
      console.log('Testing admin access on sandbox project...');
      const snapshot = await db.collection('orders').limit(1).get();
      console.log('Success! Found ' + snapshot.size + ' orders.');
      process.exit(0);
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  }
  test();
} catch (e) {
  console.error("Init error", e);
}
