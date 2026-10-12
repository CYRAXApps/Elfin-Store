const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const anchor = `<h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request Date</h3>`;
if (code.includes(anchor) && !code.includes('Total Refund Amount')) {
  code = code.replace(
    anchor,
    `<h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Refund Amount</h3>
                 <p className="font-bold text-slate-900 text-sm">₹{Number(request.refundAmount || 0).toLocaleString('en-IN')}</p>
               </div>
               <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Request Date</h3>`
  );
  
  // Need to adjust grid-cols-2 to grid-cols-3
  code = code.replace(`<div className="grid grid-cols-2 gap-4">`, `<div className="grid grid-cols-3 gap-4">`);
  
  fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
  console.log('Added refund amount display');
}
