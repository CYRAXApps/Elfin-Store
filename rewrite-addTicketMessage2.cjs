const fs = require('fs');
let code = fs.readFileSync('serverSupport.ts', 'utf8');

const matchRegex = /export async function addTicketMessage\([\s\S]*?return \{ id: msgRef\.id, success: true \};\n\}/;

const newFunc = `export async function addTicketMessage(adminDb: any, payload: {
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'support_agent';
  message: string;
  attachments?: string[];
  isInternal?: boolean;
}) {
  const db = getFirebaseClientDb();
  if (!db) throw new Error("Client DB not initialized");

  const ticketRef = doc(db, 'support_tickets', payload.ticketId);
  const ticketSnap = await getDoc(ticketRef);

  if (!ticketSnap.exists()) {
    throw new Error('Support ticket not found');
  }

  const ticketData = ticketSnap.data()!;
  const msgRef = doc(collection(db, \`support_tickets/\${payload.ticketId}/messages\`));

  await setDoc(msgRef, {
    id: msgRef.id,
    ticketId: payload.ticketId,
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    message: payload.message,
    attachments: payload.attachments || [],
    isInternal: Boolean(payload.isInternal),
    createdAt: Date.now()
  });

  // Update ticket lastMessageAt & status if needed
  let newStatus = ticketData.status;
  if (payload.senderRole === 'customer') {
    if (newStatus === 'resolved' || newStatus === 'closed') {
      newStatus = 'open';
    }
  }

  await setDoc(ticketRef, {
    ...ticketData,
    status: newStatus,
    updatedAt: Date.now(),
    lastMessageAt: Date.now()
  }, { merge: true });

  return { id: msgRef.id, success: true };
}`;

code = code.replace(matchRegex, newFunc);
fs.writeFileSync('serverSupport.ts', code);
console.log('Done!');
