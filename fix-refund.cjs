const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const oldHandle = `  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    if (!confirm(\`Are you sure you want to change the status to \${newStatus.replace(/_/g, ' ').toUpperCase()}?\`)) return;
    try {
      const ref = doc(db, 'return_requests', returnId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'admin'
      });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };`;

const newHandle = `  const handleUpdateStatus = async (returnId: string, newStatus: string, orderId?: string, refundAmount?: number) => {
    if (!confirm(\`Are you sure you want to change the status to \${newStatus.replace(/_/g, ' ').toUpperCase()}?\`)) return;
    try {
      if (newStatus === 'refunded' && orderId) {
        // Execute real refund via API first
        const res = await fetch('/api/admin/orders/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            refundAmount: refundAmount || 0,
            reason: \`Return #\${returnId}\`,
            restoreStock: true,
            returnId
          })
        });
        const data = await res.json();
        if (!data.success && !res.ok) {
           alert(\`Refund failed: \${data.error || 'Gateway error'}\`);
           return;
        }
      }

      const ref = doc(db, 'return_requests', returnId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'admin'
      });
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };`;

code = code.replace(oldHandle, newHandle);

// update the modal props to pass orderId and refundAmount to onUpdateStatus
const oldModalDef = `function ReturnDetailsModal({ request, onClose, onUpdateStatus, getStatusColor }: { request: ReturnRequest, onClose: () => void, onUpdateStatus: (id: string, s: string) => void, getStatusColor: (s: string) => string }) {`;
const newModalDef = `function ReturnDetailsModal({ request, onClose, onUpdateStatus, getStatusColor }: { request: ReturnRequest, onClose: () => void, onUpdateStatus: (id: string, s: string, orderId?: string, amount?: number) => void, getStatusColor: (s: string) => string }) {`;
code = code.replace(oldModalDef, newModalDef);

const oldClick1 = `onClick={() => onUpdateStatus(request.id, action)}`;
const newClick1 = `onClick={() => onUpdateStatus(request.id, action, request.orderId, request.refundAmount)}`;
code = code.replace(oldClick1, newClick1);
code = code.replace(oldClick1, newClick1); // just in case

const oldClick2 = `onClick={() => onUpdateStatus(request.id, 'closed')}`;
const newClick2 = `onClick={() => onUpdateStatus(request.id, 'closed', request.orderId, request.refundAmount)}`;
code = code.replace(oldClick2, newClick2);

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Refund execution logic added.');
