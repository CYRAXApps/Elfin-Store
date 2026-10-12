const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const regex = /\{req\.inspectionDetails && req\.inspectionDetails\.result === 'rejected' && \([\s\S]*?\}\)/m;

const replacer = `            {req.inspectionDetails && req.inspectionDetails.result === 'rejected' && (
              <div className="mt-3 mb-1 p-3 bg-white rounded-xl border border-rose-100 flex items-start gap-3">
                <XCircle className="text-rose-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-rose-900">Inspection Rejected</p>
                  {req.inspectionDetails.notes && (
                    <p className="text-xs text-rose-700 mt-0.5">{req.inspectionDetails.notes}</p>
                  )}
                </div>
              </div>
            )}
            
            {req.status === 'refunded' && !isReplace && (
              <div className="mt-3 mb-1 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <DollarSign className="text-emerald-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">Refund Processed</p>
                  <p className="text-xs text-emerald-700 mt-0.5">₹{Number(req.refundAmount || 0).toLocaleString('en-IN')} has been refunded successfully.</p>
                  {req.razorpayRefundId && (
                     <p className="text-[10px] text-emerald-600 font-mono mt-1">Ref: {req.razorpayRefundId}</p>
                  )}
                </div>
              </div>
            )}
            
            {(req.status === 'shipped' || req.status === 'delivered') && isReplace && (
              <div className="mt-3 mb-1 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
                <Package className="text-emerald-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">Replacement Shipped</p>
                  <p className="text-xs text-emerald-700 mt-0.5">Your replacement item is on its way.</p>
                </div>
              </div>
            )}`;

code = code.replace(regex, replacer);
fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('Added refund and shipped to order details');
