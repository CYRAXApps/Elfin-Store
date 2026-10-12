const fs = require('fs');
let code = fs.readFileSync('serverSupport.ts', 'utf8');

const matchRegex = /export async function getTicketDetailAndMessages\([\s\S]*?return \{ ticket: ticketData, messages \};\n\}/;

const newFunc = `export async function getTicketDetailAndMessages(adminDb: any, ticketId: string, userId?: string, isAdmin: boolean = false) {
  const db = getFirebaseClientDb();
  if (!db) throw new Error("Client DB not initialized");

  const ticketRef = doc(db, 'support_tickets', ticketId);
  const ticketSnap = await getDoc(ticketRef);

  if (!ticketSnap.exists()) {
    throw new Error('Support ticket not found');
  }

  const ticketData = ticketSnap.data()!;

  // Access check
  if (!isAdmin && userId && ticketData.userId !== userId) {
    throw new Error('Access denied to this ticket');
  }

  const msgsSnap = await getDocs(collection(db, \`support_tickets/\${ticketId}/messages\`));
  const messages: any[] = [];

  msgsSnap.forEach(doc => {
    const m = doc.data();
    if (m.isInternal && !isAdmin) {
      return; // Skip internal notes for customer
    }
    messages.push({
      ...m,
      id: doc.id,
      createdAt: m.createdAt
    });
  });

  messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  return { ticket: ticketData, messages };
}`;

code = code.replace(matchRegex, newFunc);
fs.writeFileSync('serverSupport.ts', code);
console.log('Done!');
