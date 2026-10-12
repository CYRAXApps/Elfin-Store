const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ projectId: 'digital-store-elfin' });
const db = getFirestore();

async function check() {
  const snapshot = await db.collection('orders').get();
  console.log("Total orders:", snapshot.size);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Order ${doc.id} - Status: ${data.status} - User: ${data.userId}`);
  });
}

check().catch(console.error);
