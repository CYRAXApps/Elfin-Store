const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export interface ReturnPickupDetails {
  date?: string;
  timeWindow?: string;
  courier?: string;
  trackingNumber?: string;
  pickedUpAt?: any;
}

export interface ReturnInspectionDetails {
  productReceived: boolean;
  productCondition: string;
  accessoriesComplete: boolean;
  packagingCondition: string;
  notes?: string;
  result: 'approved' | 'rejected' | 'pending';
  inspectedAt?: any;
}
`;

code = code.replace("export interface ReturnRequest {", newTypes + "\nexport interface ReturnRequest {");

const toAdd = `  adminNotes?: string;
  pickupDetails?: ReturnPickupDetails;
  inspectionDetails?: ReturnInspectionDetails;
  createdAt: any;`;

code = code.replace("  adminNotes?: string;\n  createdAt: any;", toAdd);

fs.writeFileSync('src/types.ts', code);
console.log('Types updated');
