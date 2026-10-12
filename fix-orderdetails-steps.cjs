const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const oldStepsBlock = `        let steps = [
          { label: 'Return Requested', key: 'requested', complete: true },
          { label: 'Under Review', key: 'under_review', complete: ['under_review','approved','pickup_scheduled','received','inspected','refund_processing','completed','refunded'].includes(req.status) },
          { label: 'Approved', key: 'approved', complete: ['approved','pickup_scheduled','received','inspected','refund_processing','completed','refunded'].includes(req.status) },
          { label: 'Pickup Scheduled', key: 'pickup_scheduled', complete: ['pickup_scheduled','received','inspected','refund_processing','completed','refunded'].includes(req.status) },
          { label: 'Received', key: 'received', complete: ['received','inspected','refund_processing','completed','refunded'].includes(req.status) },
          { label: 'Inspection', key: 'inspected', complete: ['inspected','refund_processing','completed','refunded'].includes(req.status) },
          { label: isReplace ? 'Replacement Processing' : 'Refund Processing', key: 'refund_processing', complete: ['refund_processing','completed','refunded'].includes(req.status) },
          { label: isReplace ? 'Replaced' : 'Refunded', key: 'completed', complete: ['completed','refunded'].includes(req.status) }
        ];`;

const newStepsBlock = `        let steps = [];
        if (isReplace) {
          steps = [
            { label: 'Requested', key: 'requested', complete: true },
            { label: 'Approved', key: 'approved', complete: ['approved','pickup_scheduled','picked_up','received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Picked Up', key: 'picked_up', complete: ['picked_up','received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Received', key: 'received', complete: ['received','inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Inspection', key: 'inspection', complete: ['inspection','approved_replacement','shipped','delivered','closed'].includes(req.status) },
            { label: 'Shipped', key: 'shipped', complete: ['shipped','delivered','closed'].includes(req.status) },
            { label: 'Delivered', key: 'delivered', complete: ['delivered','closed'].includes(req.status) }
          ];
        } else {
          steps = [
            { label: 'Requested', key: 'requested', complete: true },
            { label: 'Approved', key: 'approved', complete: ['approved','pickup_scheduled','picked_up','received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Picked Up', key: 'picked_up', complete: ['picked_up','received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Received', key: 'received', complete: ['received','inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Inspection', key: 'inspection', complete: ['inspection','approve_refund','refunded','closed'].includes(req.status) },
            { label: 'Refunded', key: 'refunded', complete: ['approve_refund','refunded','closed'].includes(req.status) }
          ];
        }`;

code = code.replace(oldStepsBlock, newStepsBlock);
fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('OrderDetails steps updated');
