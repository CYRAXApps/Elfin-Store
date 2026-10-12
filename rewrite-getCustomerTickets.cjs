const fs = require('fs');
let code = fs.readFileSync('serverSupport.ts', 'utf8');

const matchRegex = /export async function getCustomerTickets\([\s\S]*?return list\.sort\(\(a, b\) => b\.updatedAt \- a\.updatedAt\);\n\}/;

const newFunc = `export async function getCustomerTickets(adminDb: any, userId: string) {
  const db = getFirebaseClientDb();
  if (!db) return [];

  try {
    const q = query(collection(db, 'support_tickets'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(doc => {
      list.push(doc.data());
    });
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error('Error fetching tickets client SDK fallback:', e);
    return [];
  }
}`;

code = code.replace(matchRegex, newFunc);
fs.writeFileSync('serverSupport.ts', code);
console.log('Done!');
