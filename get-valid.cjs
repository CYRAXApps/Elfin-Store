import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = JSON.parse(require('fs').readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const products = await getDocs(query(collection(db, 'products'), limit(1)));
  const orders = await getDocs(query(collection(db, 'orders'), limit(1)));
  
  console.log('Product ID:', products.docs[0]?.id);
  console.log('Order ID:', orders.docs[0]?.id);
}
run();
