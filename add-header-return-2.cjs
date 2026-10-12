const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const target = `          </div>
          <div className="flex items-center gap-3 sm:text-right">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">`;

const replacement = `          </div>
          <div className="flex items-center gap-3 sm:text-right">
            {canReturn && (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <RotateCcw size={14} />
                Return / Replace
              </button>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">`;

code = code.replace(target, replacement);

// Also replace the item-level buttons
const targetItem = `                               <button
                                 onClick={() => handleOpenReturnModal(pId)}
                                 className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                 title="Return or replace this item"
                               >
                                 Return
                               </button>`;

const replacementItem = `                               <button
                                 onClick={() => handleOpenReturnModal(pId)}
                                 className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-emerald-200 shadow-sm whitespace-nowrap"
                                 title="Return or replace this item"
                               >
                                 Return / Replace
                               </button>`;
code = code.replace(targetItem, replacementItem);

fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('Added big return button to header and fixed item button');
