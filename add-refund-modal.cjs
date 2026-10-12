const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const submitInspection = `  const submitInspection = () => {
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
  };`;

const submitRefundCode = `
  const [isRefunding, setIsRefunding] = React.useState(false);

  const submitRefund = async () => {
    if (isRefunding) return;
    setIsRefunding(true);
    try {
      await onUpdateStatus(request.id, 'refunded', request.orderId, request.refundAmount);
      setActiveForm('none');
    } finally {
      setIsRefunding(false);
    }
  };
`;

code = code.replace(submitInspection, submitInspection + '\\n' + submitRefundCode);

const refundForm = `
            {activeForm === 'refund' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign size={16} /> Process Refund
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Original Order Total</span>
                       <span className="font-bold">₹{Number(order?.payment?.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Already Refunded</span>
                       <span className="font-bold text-rose-600">₹{Number(order?.payment?.refundedAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-sm">
                       <span className="text-slate-900 font-bold">Current Refund Amount</span>
                       <span className="font-bold text-emerald-600">₹{Number(request.refundAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Refund Method</label>
                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold">
                       {order?.payment?.provider === 'razorpay' ? 'Razorpay (Original Source)' : 'Original Payment Source'}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex gap-2">
                     <AlertCircle size={14} className="shrink-0 mt-0.5" />
                     <p>This action will initiate a real refund via the payment gateway. Please verify the amount.</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button onClick={() => setActiveForm('none')} disabled={isRefunding} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                  <button onClick={submitRefund} disabled={isRefunding} className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isRefunding ? <RefreshCw size={16} className="animate-spin" /> : 'Confirm Refund'}
                  </button>
                </div>
              </div>
            )}
`;

const inspectionRegex = /\{activeForm === 'inspection' && \([\s\S]*?\}\)/m;
code = code.replace(inspectionRegex, match => match + '\\n' + refundForm);

// Add DollarSign import
if (!code.includes('DollarSign')) {
  code = code.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { DollarSign, $1 } from 'lucide-react';");
}

fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Added refund form');
