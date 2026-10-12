const fs = require('fs');
const file = 'src/pages/admin/AdminReturnsManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const updatedModalComponent = `
function ReturnDetailsModal({ request, onClose, onUpdateStatus, getStatusColor }: { request: ReturnRequest, onClose: () => void, onUpdateStatus: (id: string, s: string) => void, getStatusColor: (s: string) => string }) {
  const isReplace = request.items?.[0]?.requestedResolution === 'replacement';

  const validNextStatuses = (current: string) => {
    // Current statuses might be: requested, approved, pickup_scheduled, picked_up, received, inspection, refund_processing, refunded, rejected, shipped, delivered, closed
    
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
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</h3>
                 <p className="font-bold text-slate-900 text-sm">{request.customerName}</p>
                 <p className="text-xs text-slate-600">{request.customerEmail}</p>
                 <p className="text-xs text-slate-600">{request.customerPhone}</p>
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
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Admin Actions</h3>
              {nextActions.length > 0 ? (
                <div className="space-y-2">
                  {nextActions.map(action => (
                    <button
                      key={action}
                      onClick={() => onUpdateStatus(request.id, action)}
                      className={\`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-between \${
                         action === 'rejected' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }\`}
                    >
                      {getActionLabel(action)} <ChevronRight size={16} />
                    </button>
                  ))}
                  
                  {/* Provide an emergency fallback to Close or Reject if it gets stuck */}
                  {!nextActions.includes('rejected') && !nextActions.includes('closed') && (
                     <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                       <button
                         onClick={() => onUpdateStatus(request.id, 'closed')}
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
            
            {/* Timeline simple visual */}
            <div className="mt-8">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Status Timeline</h3>
               <div className="space-y-3">
                 {/* Normally we'd render the whole flow, but keeping it simple for now */}
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-xs font-bold text-slate-900 capitalize">{request.status.replace(/_/g, ' ')} (Current)</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// Replace the ReturnDetailsModal implementation
const startIndex = code.indexOf('function ReturnDetailsModal');
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + updatedModalComponent;
}

// Update the filters mapping to include the new statuses
const filtersReplacement = `
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {['all', 'requested', 'under_review', 'approved', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'approve_refund', 'refunded', 'approved_replacement', 'shipped', 'delivered', 'rejected', 'closed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={\`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border \${
              statusFilter === status 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }\`}
          >
            {status === 'all' ? 'All Requests' : status.replace(/_/g, ' ').toUpperCase()}
          </button>
        ))}
      </div>
`;
const oldFiltersRegex = /<div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">[\s\S]*?<\/div>/;
code = code.replace(oldFiltersRegex, filtersReplacement);

fs.writeFileSync(file, code);
console.log("Updated AdminReturnsManager actions and status flows.");
