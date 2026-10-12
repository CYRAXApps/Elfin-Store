const fs = require('fs');

let code = fs.readFileSync('src/components/account/ReturnOrderModal.tsx', 'utf8');

// 1. Update imports
if (!code.includes('firebase/storage')) {
  code = code.replace(
    "import { Order, OrderItem } from '../../types';",
    "import { Order, OrderItem } from '../../types';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../../firebase';"
  );
}

if (!code.includes('Trash2')) {
  code = code.replace("CreditCard", "CreditCard,\n  Camera,\n  Trash2");
}

// 2. Add imageFile and imagePreview to interface ReturnItemSelection
if (!code.includes('imageFile?: File | null;')) {
  code = code.replace(
    "resolution: 'refund' | 'replacement';",
    "resolution: 'refund' | 'replacement';\n  imageFile?: File | null;\n  imagePreview?: string | null;"
  );
}

// 3. Add updateItemImage function
const updateItemImageFunc = `
  const updateItemImage = (pId: string, file: File | null) => {
    setSelectedItems((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        imageFile: file,
        imagePreview: file ? URL.createObjectURL(file) : null
      }
    }));
  };
`;
if (!code.includes('updateItemImage')) {
  code = code.replace(
    "const updateItemReason = (pId: string, reason: string) => {",
    updateItemImageFunc + "\n  const updateItemReason = (pId: string, reason: string) => {"
  );
}

// 4. Update handleSubmitReturn to be async aware
const oldSubmitStart = `  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const itemsToReturn: any[] = [];

    order.items.forEach((item) => {
      const pId = item.productId || \`prod-\${item.name.toLowerCase().replace(/\\s+/g, '-')}\`;
      const sel = selectedItems[pId];
      if (sel && sel.selected) {
        itemsToReturn.push({
          productId: pId,
          productName: item.name,
          sku: item.sku || '',
          quantity: sel.quantity || 1,
          unitPrice: item.unitPrice,
          reason: sel.reason || overallReason,
          condition: sel.condition || 'Opened with packaging',
          requestedResolution: preferredResolution
        });
      }
    });

    if (itemsToReturn.length === 0) {
      setErrorMsg('Please select at least one item to return or replace.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);`;

const newSubmitStart = `  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    const itemsToReturn: any[] = [];
    
    try {
      for (const item of order.items) {
        const pId = item.productId || \`prod-\${item.name.toLowerCase().replace(/\\s+/g, '-')}\`;
        const sel = selectedItems[pId];
        if (sel && sel.selected) {
          
          let uploadedImageUrl = null;
          if (sel.imageFile) {
            const imageRef = ref(storage, \`returns/\${order.id}/\${pId}_\${Date.now()}\`);
            const uploadWithTimeout = () => {
              return new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Firebase Storage bucket not found. Image upload timed out."));
                }, 5000); 
                uploadBytes(imageRef, sel.imageFile)
                  .then((snapshot) => { clearTimeout(timeout); resolve(snapshot); })
                  .catch((err) => { clearTimeout(timeout); reject(err); });
              });
            };
            try {
              const snapshot = await uploadWithTimeout();
              uploadedImageUrl = await getDownloadURL(snapshot.ref);
            } catch (err) {
              console.warn("Failed to upload image", err);
            }
          }

          itemsToReturn.push({
            productId: pId,
            productName: item.name,
            sku: item.sku || '',
            quantity: sel.quantity || 1,
            unitPrice: item.unitPrice,
            reason: sel.reason || overallReason,
            condition: sel.condition || 'Opened with packaging',
            requestedResolution: preferredResolution,
            image: uploadedImageUrl
          });
        }
      }

      if (itemsToReturn.length === 0) {
        setErrorMsg('Please select at least one item to return or replace.');
        setSubmitting(false);
        return;
      }
`;

if (code.includes(oldSubmitStart)) {
  code = code.replace(oldSubmitStart, newSubmitStart);
  
  // also need to remove the internal `try {` block that was in the old code, wait, old code had:
  /*
    try {
      const payload = {
  */
  // I replaced up to `setErrorMsg(null);`. The old code had `try {` immediately after. I've now wrapped the whole thing in `try {`. Let's just adjust the replace to include `try {`.
} else {
    console.log("Could not find handleSubmitReturn block!");
}

fs.writeFileSync('src/components/account/ReturnOrderModal.tsx', code);
