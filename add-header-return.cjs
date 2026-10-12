const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

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

code = code.replace(/          <\/div>\n          <div className="flex items-center gap-3 sm:text-right">\n            <div>\n              <span className="text-\[10px\] uppercase font-bold text-slate-400 block tracking-wider">/g, replacement);

fs.writeFileSync('src/pages/OrderDetails.tsx', code);
console.log('Added big return button to header');
