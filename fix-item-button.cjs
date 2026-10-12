const fs = require('fs');
let code = fs.readFileSync('src/pages/OrderDetails.tsx', 'utf8');

const regex = /<button\s+onClick=\{\(\) => handleOpenReturnModal\(pId\)\}\s+className="px-2\.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-\[11px\] font-bold transition-colors cursor-pointer"\s+title="Return or replace this item"\s*>\s*Return\s*<\/button>/g;

const replacer = `<button
                                 onClick={() => handleOpenReturnModal(pId)}
                                 className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-emerald-200 shadow-sm whitespace-nowrap"
                                 title="Return or replace this item"
                               >
                                 Return / Replace
                               </button>`;

const newCode = code.replace(regex, replacer);
fs.writeFileSync('src/pages/OrderDetails.tsx', newCode);
console.log('Fixed item return button.');
