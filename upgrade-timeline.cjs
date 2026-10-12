const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminReturnsManager.tsx', 'utf8');

const oldTimeline = `            {/* Timeline simple visual */}
            <div className="mt-8">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Status Timeline</h3>
               <div className="space-y-3">
                 {/* Normally we'd render the whole flow, but keeping it simple for now */}
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-xs font-bold text-slate-900 capitalize">{request.status.replace(/_/g, ' ')} (Current)</span>
                 </div>
               </div>
            </div>`;

const newTimeline = `            {/* Timeline simple visual */}
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
            </div>`;

code = code.replace(oldTimeline, newTimeline);
fs.writeFileSync('src/pages/admin/AdminReturnsManager.tsx', code);
console.log('Timeline updated');
