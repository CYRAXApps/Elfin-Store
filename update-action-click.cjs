const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const oldActionClick = `  const handleActionClick = (action: string) => {
    if (action === 'pickup_scheduled') {
      setActiveForm('pickup');
    } else if (action === 'inspection') {
      setActiveForm('inspection');
    } else {
      let additionalData: any = {};
      if (action === 'picked_up') {
        additionalData = {
          'pickupDetails.pickedUpAt': new Date().toISOString()
        };
      }
      onUpdateStatus(request.id, action, request.orderId, request.refundAmount, additionalData);
    }
  };`;

const newActionClick = `  const handleActionClick = (action: string) => {
    if (action === 'pickup_scheduled') {
      setActiveForm('pickup');
    } else if (action === 'inspection') {
      setActiveForm('inspection');
    } else if (action === 'refunded') {
      setActiveForm('refund');
    } else {
      let additionalData: any = {};
      if (action === 'picked_up') {
        additionalData = {
          'pickupDetails.pickedUpAt': new Date().toISOString()
        };
      }
      onUpdateStatus(request.id, action, request.orderId, request.refundAmount, additionalData);
    }
  };`;

code = code.replace(oldActionClick, newActionClick);
fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('updated handleActionClick');
