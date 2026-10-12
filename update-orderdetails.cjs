const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const regex = /<Link to="\/account\?view=returns"[\s\S]*?View Details\s*<\/Link>/m;
const replacer = `<Link to="/account?view=returns" className="text-xs font-bold text-purple-600 hover:text-purple-700 px-3 py-1.5 bg-white rounded-lg border border-purple-100 shadow-sm cursor-pointer whitespace-nowrap text-center">
                View Details
              </Link>`;

const addPickup = `
            {req.pickupDetails && (
              <div className="mt-3 mb-1 p-3 bg-white rounded-xl border border-purple-100 flex items-start gap-3">
                <Truck className="text-purple-500 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-bold text-purple-900">Pickup Scheduled: {req.pickupDetails.date} ({req.pickupDetails.timeWindow})</p>
                  {(req.pickupDetails.courier || req.pickupDetails.trackingNumber) && (
                    <p className="text-xs text-purple-700 mt-0.5">
                      {req.pickupDetails.courier} {req.pickupDetails.trackingNumber ? \` - \${req.pickupDetails.trackingNumber}\` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {req.inspectionDetails && req.inspectionDetails.result === 'rejected' && (
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
`;

code = code.replace(regex, replacer + addPickup);

fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log("Order details updated");
