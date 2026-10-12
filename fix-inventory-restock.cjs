const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const oldHandle = /const handleUpdateStatus = async \([\s\S]*?if \(loading\) {/m;

const newHandle = `  const handleUpdateStatus = async (returnId: string, newStatus: string, orderId?: string, refundAmount?: number, additionalData?: any) => {
    if (!['pickup_scheduled', 'inspection'].includes(newStatus)) {
      if (!confirm(\`Are you sure you want to change the status to \${newStatus.replace(/_/g, ' ').toUpperCase()}?\`)) return;
    }
    
    try {
      // 1. Process Inventory if inspection is completed
      if (additionalData?.inspectionDetails) {
        const result = additionalData.inspectionDetails.result; // approved or rejected
        const condition = additionalData.inspectionDetails.productCondition; // good, used, damaged, wrong_item
        
        let disposition = 'rejected';
        if (result === 'approved') {
          disposition = condition === 'good' ? 'restock' : 'damaged';
        }

        // find the request to get items
        const currentReq = returns.find(r => r.id === returnId);
        if (currentReq && currentReq.items) {
          for (const item of currentReq.items) {
             try {
               await fetch('/api/admin/inventory/returns/process', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   orderId: currentReq.orderId,
                   productId: item.productId,
                   quantity: item.quantity || 1,
                   disposition: disposition,
                   notes: \`Return \${currentReq.returnNumber} Inspection: \${additionalData.inspectionDetails.notes || condition}\`,
                   createdBy: user?.email || user?.uid || 'Admin'
                 })
               });
             } catch(e) {
               console.error("Inventory update error:", e);
             }
          }
        }
      }

      // 2. Process Refund if marking as refunded
      if (newStatus === 'refunded' && orderId) {
        // Execute real refund via API first
        const res = await fetch('/api/admin/payments/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            refundAmount: refundAmount || 0,
            reason: \`Return #\${returnId}\`,
            restoreStock: false, // We already handled inventory explicitly above!
            returnId
          })
        });
        const data = await res.json();
        if (!data.success && !res.ok) {
           alert(\`Refund failed: \${data.error || 'Gateway error'}\`);
           return;
        }
      }

      // 3. Update Return Request document
      const ref = doc(db, 'return_requests', returnId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.uid || 'admin'
      };
      
      if (additionalData) {
        Object.assign(updateData, additionalData);
      }

      await updateDoc(ref, updateData);
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  if (loading) {`;

code = code.replace(oldHandle, newHandle);
fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Fixed inventory restock logic');
