import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

try {
  const configStr = readFileSync('./firebase-applet-config.json', 'utf8');
  const config = JSON.parse(configStr);
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);

  async function test() {
    try {
      console.log('Testing client access to /users/123...');
      const snapshot = await getDoc(doc(db, 'users', '123'));
      console.log('Success! Exists: ' + snapshot.exists());
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
