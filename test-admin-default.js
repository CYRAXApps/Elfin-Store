import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

try {
  const configStr = readFileSync('./firebase-applet-config.json', 'utf8');
  const config = JSON.parse(configStr);
  const app = initializeApp({ projectId: config.projectId });
  const db = getFirestore(app);

  async function test() {
    try {
      console.log('Testing admin access to default db...');
      const snapshot = await db.collection('orders').limit(1).get();
      console.log('Success! Found ' + snapshot.size + ' orders.');
      process.exit(0);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  }
  test();
} catch (e) {
  console.error("Init error", e);
}
