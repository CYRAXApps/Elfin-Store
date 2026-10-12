const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const regex = /function ReturnDetailsModal\([\s\S]*$/m;

const newModal = `
function ReturnDetailsModal({ request, onClose, onUpdateStatus, getStatusColor }: { request: ReturnRequest, onClose: () => void, onUpdateStatus: (id: string, s: string, orderId?: string, amount?: number, additionalData?: any) => void, getStatusColor: (s: string) => string }) {
  const isReplace = request.items?.[0]?.requestedResolution === 'replacement';

  const [activeForm, setActiveForm] = React.useState<'none' | 'pickup' | 'inspection'>('none');
  
  // Pickup Form State
  const [pickupDate, setPickupDate] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('');
  const [pickupCourier, setPickupCourier] = React.useState('');
  const [pickupTracking, setPickupTracking] = React.useState('');

  // Inspection Form State
  const [insProductReceived, setInsProductReceived] = React.useState(true);
  const [insCondition, setInsCondition] = React.useState('good');
  const [insAccessories, setInsAccessories] = React.useState(true);
  const [insPackaging, setInsPackaging] = React.useState('good');
  const [insNotes, setInsNotes] = React.useState('');
  const [insResult, setInsResult] = React.useState<'approved' | 'rejected'>('approved');

  const validNextStatuses = (current: string) => {
    if (isReplace) {
      switch(current) {
        case 'requested': return ['approved', 'rejected'];
        case 'approved': return ['pickup_scheduled'];
        case 'pickup_scheduled': return ['picked_up'];
        case 'picked_up': return ['received'];
        case 'received': return ['inspection'];
        case 'inspection': return ['approved_replacement', 'rejected'];
        case 'approved_replacement': return ['shipped'];
        case 'shipped': return ['delivered'];
        case 'delivered': return ['closed'];
        default: return [];
      }
    } else {
      switch(current) {
        case 'requested': return ['approved', 'rejected'];
        case 'approved': return ['pickup_scheduled'];
        case 'pickup_scheduled': return ['picked_up'];
        case 'picked_up': return ['received'];
        case 'received': return ['inspection'];
        case 'inspection': return ['approve_refund', 'rejected'];
        case 'approve_refund': return ['refunded'];
        case 'refunded': return ['closed'];
        default: return [];
      }
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approved': return isReplace ? 'Approve Replacement' : 'Approve Return';
      case 'rejected': return 'Reject Request';
      case 'pickup_scheduled': return 'Schedule Pickup';
      case 'picked_up': return 'Mark Picked Up';
      case 'received': return 'Mark Received';
      case 'inspection': return 'Start Inspection';
      case 'approve_refund': return 'Approve Refund';
      case 'refunded': return 'Mark Refunded';
      case 'approved_replacement': return 'Approve Replacement';
      case 'shipped': return 'Mark Replacement Shipped';
      case 'delivered': return 'Mark Replacement Delivered';
      case 'closed': return 'Close Request';
      default: return action;
    }
  };

  const handleActionClick = (action: string) => {
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
  };

  const submitPickup = () => {
    if (!pickupDate || !pickupTime) {
      alert("Please provide date and time window.");
      return;
    }
    const additionalData = {
      pickupDetails: {
        date: pickupDate,
        timeWindow: pickupTime,
        courier: pickupCourier,
        trackingNumber: pickupTracking
      }
    };
    onUpdateStatus(request.id, 'pickup_scheduled', request.orderId, request.refundAmount, additionalData);
    setActiveForm('none');
  };

  const submitInspection = () => {
    const additionalData = {
      inspectionDetails: {
        productReceived: insProductReceived,
        productCondition: insCondition,
        accessoriesComplete: insAccessories,
        packagingCondition: insPackaging,
        notes: insNotes,
        result: insResult,
        inspectedAt: new Date().toISOString()
      }
    };
    const nextStatus = insResult === 'approved' ? (isReplace ? 'approved_replacement' : 'approve_refund') : 'rejected';
    onUpdateStatus(request.id, nextStatus, request.orderId, request.refundAmount, additionalData);
    setActiveForm('none');
  };

  const nextActions = validNextStatuses(request.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="text-purple-600" size={20} />
              {isReplace ? 'Replacement' : 'Return'} Request: {request.returnNumber || request.id}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase border \${getStatusColor(request.status)}\`}>
                {request.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500">Order: {request.invoiceNumber || request.orderId}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Customer & Order Info */}
            <div className="grid grid-cols-3 gap-4">
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</h3>
                 <p className="font-bold text-slate-900 text-sm">{request.customerName}</p>
                 <p className="text-xs text-slate-600">{request.customerEmail}</p>
                 <p className="text-xs text-slate-600">{request.customerPhone}</p>
               </div>
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Refund Amount</h3>
                 <p className="font-bold text-slate-900 text-sm">₹{Number(request.refundAmount || 0).toLocaleString('en-IN')}</p>
               </div>
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request Date</h3>
                 <p className="font-bold text-slate-900 text-sm">
                   {request.createdAt ? new Date((request.createdAt as any)?.toDate?.() || request.createdAt).toLocaleString() : 'N/A'}
                 </p>
               </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Items to {isReplace ? 'Replace' : 'Return'}</h3>
              <div className="space-y-3">
                {request.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                    {item.image ? (
                       <img src={item.image} alt={item.productName} className="w-16 h-16 object-cover rounded-lg bg-white border border-slate-200" />
                    ) : (
                       <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-300">
                         <Package size={24} />
                       </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm">{item.productName}</h4>
                      <p className="text-xs text-slate-500">Reason: <span className="font-bold text-slate-700">{item.reason || request.overallReason}</span></p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity || 1} • Unit Price: ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {request.comments && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Customer Message</h3>
                <div className="p-4 bg-yellow-50/50 border border-yellow-200 text-yellow-900 text-sm rounded-xl italic">
                  "{request.comments}"
                </div>
              </div>
            )}
            
            {request.pickupDetails && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Pickup Information</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-white text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 block">Date & Time</span>
                      <span className="font-bold">{request.pickupDetails.date} ({request.pickupDetails.timeWindow})</span>
                    </div>
                    {request.pickupDetails.courier && (
                      <div>
                        <span className="text-xs text-slate-500 block">Courier</span>
                        <span className="font-bold">{request.pickupDetails.courier}</span>
                      </div>
                    )}
                    {request.pickupDetails.trackingNumber && (
                      <div>
                        <span className="text-xs text-slate-500 block">Tracking Number</span>
                        <span className="font-bold">{request.pickupDetails.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {request.inspectionDetails && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Inspection Details</h3>
                <div className="p-4 border border-slate-200 rounded-xl bg-white text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <span className="text-xs text-slate-500 block">Product Condition</span>
                       <span className="font-bold capitalize">{request.inspectionDetails.productCondition}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Packaging</span>
                       <span className="font-bold capitalize">{request.inspectionDetails.packagingCondition}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Accessories Included</span>
                       <span className="font-bold">{request.inspectionDetails.accessoriesComplete ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                       <span className="text-xs text-slate-500 block">Result</span>
                       <span className={\`font-bold uppercase \${request.inspectionDetails.result === 'approved' ? 'text-emerald-600' : 'text-rose-600'}\`}>{request.inspectionDetails.result}</span>
                    </div>
                  </div>
                  {request.inspectionDetails.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-500 block">Notes</span>
                      <p className="text-sm">{request.inspectionDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
            
            {activeForm === 'none' && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Admin Actions</h3>
                {nextActions.length > 0 ? (
                  <div className="space-y-2">
                    {nextActions.map(action => (
                      <button
                        key={action}
                        onClick={() => handleActionClick(action)}
                        className={\`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-between \${
                           action === 'rejected' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                        }\`}
                      >
                        {getActionLabel(action)} <ChevronRight size={16} />
                      </button>
                    ))}
                    
                    {!nextActions.includes('rejected') && !nextActions.includes('closed') && (
                       <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                         <button
                           onClick={() => onUpdateStatus(request.id, 'closed', request.orderId, request.refundAmount)}
                           className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                         >
                           Force Close Request
                         </button>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    No pending actions.
                  </div>
                )}
              </div>
            )}

            {activeForm === 'pickup' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={16} /> Schedule Pickup
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pickup Date</label>
                    <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Time Window</label>
                    <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="">Select Time Window</option>
                      <option value="09:00 AM - 01:00 PM">09:00 AM - 01:00 PM</option>
                      <option value="01:00 PM - 05:00 PM">01:00 PM - 05:00 PM</option>
                      <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Courier (Optional)</label>
                    <input type="text" placeholder="e.g. BlueDart" value={pickupCourier} onChange={e => setPickupCourier(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tracking Number (Optional)</label>
                    <input type="text" placeholder="AWB Number" value={pickupTracking} onChange={e => setPickupTracking(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setActiveForm('none')} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50">Cancel</button>
                  <button onClick={submitPickup} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800">Schedule</button>
                </div>
              </div>
            )}

            {activeForm === 'inspection' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Eye size={16} /> Inspection Report
                </h3>
                <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Product Received?</label>
                    <select value={insProductReceived ? 'yes' : 'no'} onChange={e => setInsProductReceived(e.target.value === 'yes')} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Product Condition</label>
                    <select value={insCondition} onChange={e => setInsCondition(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="good">Good / Resalable</option>
                      <option value="used">Used / Open Box</option>
                      <option value="damaged">Damaged / Defective</option>
                      <option value="wrong_item">Wrong Item Returned</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Accessories Complete?</label>
                    <select value={insAccessories ? 'yes' : 'no'} onChange={e => setInsAccessories(e.target.value === 'yes')} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="yes">Yes</option>
                      <option value="no">No (Missing Parts)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Packaging Condition</label>
                    <select value={insPackaging} onChange={e => setInsPackaging(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white">
                      <option value="good">Good (Original intact)</option>
                      <option value="damaged">Damaged Box</option>
                      <option value="missing">No Original Box</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Inspection Notes</label>
                    <textarea value={insNotes} onChange={e => setInsNotes(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Enter findings..."></textarea>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-xs font-bold text-slate-900 mb-2">Final Decision</label>
                    <div className="flex gap-2">
                       <button onClick={() => setInsResult('approved')} className={\`flex-1 py-2 rounded-lg text-sm font-bold border \${insResult === 'approved' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}\`}>Approve</button>
                       <button onClick={() => setInsResult('rejected')} className={\`flex-1 py-2 rounded-lg text-sm font-bold border \${insResult === 'rejected' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}\`}>Reject</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button onClick={() => setActiveForm('none')} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50">Cancel</button>
                  <button onClick={submitInspection} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800">Submit Report</button>
                </div>
              </div>
            )}
            
            {/* Timeline simple visual */}
            <div className="mt-8">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Status Timeline</h3>
               <div className="space-y-0 relative">
                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>
                 {(() => {
                   let allSteps = [];
                   if (isReplace) {
                     allSteps = ['requested', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approved_replacement', 'shipped', 'delivered', 'closed'];
                   } else {
                     allSteps = ['requested', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approve_refund', 'refunded', 'closed'];
                   }
                   
                   // Add rejected or cancelled if it happened
                   if (request.status === 'rejected') allSteps.push('rejected');
                   if (request.status === 'cancelled') allSteps.push('cancelled');

                   const currentIdx = allSteps.indexOf(request.status);
                   const isFailState = ['rejected', 'cancelled'].includes(request.status);
                   
                   return allSteps.map((step, idx) => {
                     const isCompleted = isFailState ? (idx === currentIdx || idx < allSteps.indexOf('rejected')-1) : (idx <= currentIdx);
                     const isCurrent = idx === currentIdx;
                     const isFuture = !isFailState && idx > currentIdx;
                     if (isFailState && !isCurrent && idx > (currentIdx > -1 ? currentIdx : 0) && step !== 'rejected' && step !== 'cancelled') return null;

                     return (
                       <div key={step} className="flex items-center gap-3 relative z-10 py-1.5 bg-white">
                         <div className={\`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 \${
                           isCurrent ? 'border-purple-600 bg-white ring-2 ring-purple-100' :
                           isCompleted ? 'border-purple-500 bg-purple-500' : 
                           'border-slate-200 bg-white'
                         }\`}>
                           {isCompleted && !isCurrent && <Check size={10} className="text-white stroke-[3]" />}
                         </div>
                         <span className={\`text-xs font-bold capitalize \${
                           isCurrent ? 'text-purple-700' :
                           isCompleted ? 'text-slate-700' : 'text-slate-400'
                         }\`}>
                           {step.replace(/_/g, ' ')}
                         </span>
                       </div>
                     );
                   });
                 })()}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

code = code.replace(regex, newModal);
fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Fixed Modal');
