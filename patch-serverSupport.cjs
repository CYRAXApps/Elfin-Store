const fs = require('fs');
let code = fs.readFileSync('serverSupport.ts', 'utf8');

const clientImports = `
import { initializeApp as initClient } from 'firebase/app';
import { getFirestore as getClientDb, collection, doc, getDoc, setDoc, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import * as fsLib from 'fs';
import * as pathLib from 'path';

let _clientDb: any = null;
function getFirebaseClientDb() {
  if (_clientDb) return _clientDb;
  try {
    const p = pathLib.join(process.cwd(), 'firebase-applet-config.json');
    const config = JSON.parse(fsLib.readFileSync(p, 'utf8'));
    const app = initClient(config);
    _clientDb = getClientDb(app, config.firestoreDatabaseId);
    return _clientDb;
  } catch (e) {
    console.error('Failed to init client db in backend', e);
    return null;
  }
}
`;

code = code.replace("import { FieldValue } from 'firebase-admin/firestore';", "import { FieldValue } from 'firebase-admin/firestore';" + clientImports);

// Let's rewrite createSupportTicket
code = code.replace(
  /export async function createSupportTicket\([\s\S]*?return \{ success: true, ticket: ticketData \};\n\}/,
  `export async function createSupportTicket(db: any, payload: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  category: string;
  priority?: string;
  subject: string;
  description: string;
  attachments?: string[];
}) {
  let invoiceNumber = '';
  const cDb = getFirebaseClientDb();
  if (payload.orderId && cDb) {
    try {
      const orderDoc = await getDoc(doc(cDb, 'orders', payload.orderId));
      if (orderDoc.exists()) {
        const oData = orderDoc.data();
        invoiceNumber = oData.invoiceNumber || \`EST-\${orderDoc.id.slice(0, 6)}\`;
      }
    } catch (e) {
      console.warn('Order lookup failed for ticket creation:', e);
    }
  }

  const ticketNumber = generateTicketNumber();
  const ticketRef = doc(collection(cDb, 'support_tickets'));
  
  const ticketData = {
    id: ticketRef.id,
    ticketNumber,
    userId: payload.userId,
    customerName: payload.customerName || 'Customer',
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone || '',
    orderId: payload.orderId || null,
    invoiceNumber: invoiceNumber || null,
    category: payload.category || 'general',
    priority: payload.priority || 'medium',
    status: 'open',
    subject: payload.subject,
    description: payload.description,
    attachments: payload.attachments || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastMessageAt: Date.now()
  };

  await setDoc(ticketRef, ticketData);

  return { success: true, ticket: ticketData };
}`
);

fs.writeFileSync('serverSupport.ts', code);
