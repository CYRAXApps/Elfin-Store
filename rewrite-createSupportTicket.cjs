const fs = require('fs');

let code = fs.readFileSync('serverSupport.ts', 'utf8');

const clientImports = `
import { initializeApp as initClientApp } from 'firebase/app';
import { getFirestore as getClientDb, collection, doc, getDoc, setDoc, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import * as fsLib from 'fs';
import * as pathLib from 'path';

let _clientDb: any = null;
function getFirebaseClientDb() {
  if (_clientDb) return _clientDb;
  try {
    const p = pathLib.join(process.cwd(), 'firebase-applet-config.json');
    const config = JSON.parse(fsLib.readFileSync(p, 'utf8'));
    const app = initClientApp(config);
    _clientDb = getClientDb(app, config.firestoreDatabaseId);
    return _clientDb;
  } catch (e) {
    console.error('Failed to init client db in backend', e);
    return null;
  }
}
`;

if (!code.includes('import { initializeApp as initClientApp }')) {
  code = code.replace("import { FieldValue } from 'firebase-admin/firestore';", "import { FieldValue } from 'firebase-admin/firestore';\n" + clientImports);
}

const matchRegex = /export async function createSupportTicket\([\s\S]*?return \{ id: ticketRef\.id, ticketNumber, success: true \};\n\}/;

const newFunc = `export async function createSupportTicket(adminDb: any, payload: {
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
  const db = getFirebaseClientDb();
  if (!db) throw new Error("Client DB not initialized");

  let invoiceNumber = '';
  if (payload.orderId) {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', payload.orderId));
      if (orderDoc.exists()) {
        const oData = orderDoc.data();
        invoiceNumber = oData.invoiceNumber || \`EST-\${orderDoc.id.slice(0, 6)}\`;
      }
    } catch (e) {
      console.warn('Order lookup failed for ticket creation:', e);
    }
  }

  const rand = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = \`EST-TKT-\${rand}\`;
  const ticketRef = doc(collection(db, 'support_tickets'));
  
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

  const initialMsgRef = doc(collection(db, \`support_tickets/\${ticketRef.id}/messages\`));
  await setDoc(initialMsgRef, {
    id: initialMsgRef.id,
    ticketId: ticketRef.id,
    senderId: payload.userId,
    senderName: payload.customerName || 'Customer',
    senderRole: 'customer',
    message: payload.description,
    attachments: payload.attachments || [],
    isInternal: false,
    createdAt: Date.now()
  });

  return { id: ticketRef.id, ticketNumber, success: true };
}`;

code = code.replace(matchRegex, newFunc);

fs.writeFileSync('serverSupport.ts', code);
console.log('Done!');
