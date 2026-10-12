type Firestore = any;
import { getDb, FieldValue } from './serverDb';
import { recordLedgerEntry, recordInventoryAudit, checkAndCreateStockAlert } from './serverInventory';

export interface PosSaleItemInput {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number; // Line discount
  discountPercent?: number;
  taxRate?: number;
  hsnCode?: string;
  image?: string;
}

export interface PosCustomerInput {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isWalkIn?: boolean;
}

export interface PosPaymentInput {
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'split';
  amountPaid: number;
  changeGiven?: number;
  referenceNumber?: string;
  cardLast4?: string;
  cardType?: string;
  upiRef?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded' | 'captured';
  isConfirmed?: boolean;
  splitDetails?: Array<{
    method: 'cash' | 'upi' | 'card' | 'bank_transfer';
    amount: number;
    reference?: string;
  }>;
}

export interface CompletePosSalePayload {
  items: PosSaleItemInput[];
  customer?: PosCustomerInput;
  payment: PosPaymentInput;
  billDiscountPercent?: number;
  billDiscountAmount?: number;
  discountReason?: string;
  taxConfig?: {
    gstEnabled?: boolean;
    taxRate?: number;
    gstin?: string;
    invoicePrefix?: string;
    sellerState?: string;
    pricingMode?: 'exclusive' | 'inclusive';
  };
  cashier?: {
    uid?: string;
    email?: string;
    name?: string;
    role?: string;
  };
  notes?: string;
  heldBillId?: string;
}

/**
 * Executes a POS sale:
 * - Validates stock
 * - Atomically deducts inventory from products
 * - Records inventory ledger movements
 * - Triggers stock alerts
 * - Creates an official order with invoice number
 * - Deletes held bill if applicable
 */
export async function completePosSale(db: any, payload: CompletePosSalePayload) {
  const { items, customer, payment, billDiscountAmount = 0, cashier, notes, heldBillId } = payload;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Cannot complete sale with an empty cart.');
  }

  // 1. Compute financial totals & GST breakdown
  let subtotal = 0;
  let itemsDiscountTotal = 0;

  const sanitizedOrderItems = items.map((i) => {
    const qty = Number(i.quantity);
    const price = Number(i.unitPrice);
    const lineDiscount = Number(i.discountAmount) || 0;
    const lineSubtotal = qty * price;
    const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);

    subtotal += lineSubtotal;
    itemsDiscountTotal += lineDiscount;

    return {
      productId: i.productId,
      name: i.name,
      image: i.image || '',
      quantity: qty,
      unitPrice: price,
      totalPrice: lineTaxable,
      sku: i.sku || i.productId.slice(0, 8).toUpperCase(),
      barcode: i.barcode || '',
      hsnCode: i.hsnCode || '8517',
      taxRate: typeof i.taxRate === 'number' ? i.taxRate : (payload.taxConfig?.taxRate ?? 18),
      discount: lineDiscount
    };
  });

  const totalDiscount = Math.round((itemsDiscountTotal + (Number(billDiscountAmount) || 0)) * 100) / 100;
  const gstEnabled = payload.taxConfig?.gstEnabled !== false;
  const pricingMode = payload.taxConfig?.pricingMode || 'exclusive';
  const defaultRate = gstEnabled ? (payload.taxConfig?.taxRate ?? 18) : 0;
  const sellerState = payload.taxConfig?.sellerState || 'Karnataka';
  const customerState = customer?.state || sellerState;
  const isInterState = customerState.trim().toLowerCase() !== sellerState.trim().toLowerCase();

  let taxableAmount = 0;
  let totalTax = 0;
  let grandTotal = 0;

  if (pricingMode === 'inclusive') {
    const netGross = Math.round(Math.max(0, subtotal - totalDiscount) * 100) / 100;
    if (defaultRate > 0 && gstEnabled) {
      taxableAmount = Math.round((netGross / (1 + defaultRate / 100)) * 100) / 100;
      totalTax = Math.round((netGross - taxableAmount) * 100) / 100;
    } else {
      taxableAmount = netGross;
      totalTax = 0;
    }
    grandTotal = netGross;
  } else {
    taxableAmount = Math.round(Math.max(0, subtotal - totalDiscount) * 100) / 100;
    if (defaultRate > 0 && gstEnabled) {
      totalTax = Math.round((taxableAmount * (defaultRate / 100)) * 100) / 100;
      grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;
    } else {
      totalTax = 0;
      grandTotal = taxableAmount;
    }
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (totalTax > 0) {
    if (isInterState) {
      igst = totalTax;
    } else {
      cgst = Math.round((totalTax / 2) * 100) / 100;
      sgst = Math.round((totalTax - cgst) * 100) / 100;
    }
  }

  // Validate payment details
  const normalizedPaymentStatus: 'paid' | 'pending' | 'failed' | 'refunded' = 
    payment.paymentStatus === 'pending' ? 'pending' :
    payment.paymentStatus === 'failed' ? 'failed' :
    payment.paymentStatus === 'refunded' ? 'refunded' : 'paid';

  if (normalizedPaymentStatus === 'failed') {
    throw new Error('Cannot complete sale with payment status "Failed". Please resolve payment before completing sale.');
  }

  if (normalizedPaymentStatus === 'paid') {
    if (payment.method === 'cash') {
      const tendered = Number(payment.amountPaid) || 0;
      if (tendered < grandTotal) {
        throw new Error(`Insufficient cash received: ₹${tendered.toLocaleString('en-IN')}. Grand total is ₹${grandTotal.toLocaleString('en-IN')}.`);
      }
    } else if (payment.method === 'split') {
      const splitItems = payment.splitDetails || (payment as any).payments || [];
      if (!Array.isArray(splitItems) || splitItems.length === 0) {
        throw new Error('Split payment breakdown entries are required for split payment method.');
      }
      const splitTotal = splitItems.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      if (Math.abs(splitTotal - grandTotal) > 0.05) {
        throw new Error(`Split payment sum (₹${splitTotal.toLocaleString('en-IN')}) does not match Grand Total (₹${grandTotal.toLocaleString('en-IN')}).`);
      }
      for (const part of splitItems) {
        if (part.method === 'cash') {
          const cashTendered = Number(part.cashTendered !== undefined ? part.cashTendered : part.amount) || 0;
          if (cashTendered < Number(part.amount)) {
            throw new Error(`Insufficient cash received for cash portion: Received ₹${cashTendered.toLocaleString('en-IN')}, required ₹${Number(part.amount).toLocaleString('en-IN')}.`);
          }
        }
      }
    }
  }

  // 2. Customer History Resolution
  // If customer was selected, link to existing account; if Walk-in, do not create unnecessary user accounts
  let customerId = 'walk-in-customer';
  const customerName = customer?.name?.trim() || 'Walk-in Customer';
  const customerPhone = customer?.phone?.trim() || '';
  const customerEmail = customer?.email?.trim() || '';

  if (customer && !customer.isWalkIn) {
    if (customer.id) {
      customerId = customer.id;
    } else if (customerPhone || customerEmail) {
      try {
        let userQuerySnap: any = null;
        if (customerPhone) {
          userQuerySnap = await db.collection('users').where('phoneNumber', '==', customerPhone).limit(1).get();
        }
        if ((!userQuerySnap || userQuerySnap.empty) && customerEmail) {
          userQuerySnap = await db.collection('users').where('email', '==', customerEmail).limit(1).get();
        }
        if (userQuerySnap && !userQuerySnap.empty) {
          customerId = userQuerySnap.docs[0].id;
        }
      } catch (findErr) {
        console.warn('Customer lookup note:', findErr);
      }
    }
  }

  // 3. Generate Sequential/Standardized Invoice Number
  const prefix = payload.taxConfig?.invoicePrefix || 'EST-';
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `${prefix}POS-${todayStr}-${randomSuffix}`;
  const orderId = `pos_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const now = new Date();
  const orderData = {
    id: orderId,
    invoiceNumber,
    userId: customerId,
    orderSource: 'pos',
    customerName,
    customerEmail,
    customerPhone,
    status: 'delivered', // Store counter sales are fulfilled on the spot
    shippingStatus: 'delivered',
    shippingMethod: 'Counter Handover / Store Pickup',
    items: sanitizedOrderItems,
    subtotal,
    discount: totalDiscount,
    couponCode: payload.discountReason || null,
    taxableAmount,
    tax: totalTax,
    cgst,
    sgst,
    igst,
    shippingCharge: 0,
    grandTotal,
    totalAmount: grandTotal,
    shippingAddress: {
      fullName: customerName,
      phone: customerPhone || '+91-0000000000',
      street: customer?.address || 'Direct Store Counter Counter 01',
      city: customer?.city || 'Local Store',
      state: customerState,
      zipCode: customer?.pincode || '000000',
      country: 'India',
      isDefault: true
    },
    billingAddress: {
      fullName: customerName,
      phone: customerPhone || '+91-0000000000',
      street: customer?.address || 'Direct Store Counter Counter 01',
      city: customer?.city || 'Local Store',
      state: customerState,
      zipCode: customer?.pincode || '000000',
      country: 'India',
      isDefault: true
    },
    buyerDetails: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      gstin: customer?.gstin || ''
    },
    sellerDetails: {
      businessName: 'ELECTRO STORE / R.S TRADERS',
      businessAddress: '123 Tech Park, Electronic City, Bengaluru, Karnataka 560100',
      businessPhone: '+91 (800) 123-4567',
      businessEmail: 'pos@electrostore.com',
      gstin: payload.taxConfig?.gstin || '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F'
    },
    payment: {
      provider: `pos_${payment.method}`,
      paymentMethod: payment.method,
      paymentStatus: normalizedPaymentStatus,
      isConfirmed: normalizedPaymentStatus === 'paid',
      amountPaid: Number(payment.amountPaid) || grandTotal,
      changeGiven: Number(payment.changeGiven) || 0,
      referenceNumber: payment.referenceNumber || payment.upiRef || payment.cardLast4 || '',
      cardLast4: payment.cardLast4 || '',
      cardType: payment.cardType || '',
      upiRef: payment.upiRef || '',
      splitDetails: payment.splitDetails || (payment as any).payments || null,
      payments: payment.splitDetails || (payment as any).payments || null,
      verifiedAt: now.toISOString()
    },
    cashier: {
      uid: cashier?.uid || 'admin',
      name: cashier?.name || 'Cashier 01',
      email: cashier?.email || 'admin@electrostore.com',
      role: cashier?.role || 'cashier'
    },
    notes: notes || '',
    posMetadata: {
      terminalId: 'POS-TERM-01',
      counter: 'Main Counter',
      shiftDate: now.toISOString().slice(0, 10),
      isOfflineBill: false
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    deliveredAt: FieldValue.serverTimestamp()
  };

  // 4. ATOMIC TRANSACTION: Stock Validation, Inventory Deduction, and Order Creation
  // Guarantees sale/inventory consistency: either both succeed or nothing is changed
  const committedItems: Array<{ item: PosSaleItemInput; beforeStock: number; nextStock: number; currentData: any }> = [];

  await db.runTransaction(async (transaction: any) => {
    const plannedUpdates: Array<{ docRef: any; item: PosSaleItemInput; beforeStock: number; nextStock: number; nextAvailable: number; currentData: any }> = [];

    // Phase A: Read and Validate all products
    for (const item of items) {
      if (!item.productId) {
        throw new Error('Item missing productId.');
      }
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) {
        throw new Error(`Invalid quantity for "${item.name}". Must be at least 1.`);
      }

      const docRef = db.collection('products').doc(item.productId);
      const snap = await transaction.get(docRef);

      if (!snap.exists) {
        throw new Error(`Product "${item.name}" (ID: ${item.productId}) was not found in catalog.`);
      }

      const pData = snap.data() || {};

      if (
        pData.isActive === false ||
        pData.isPublished === false ||
        pData.status === 'draft' ||
        pData.status === 'archived' ||
        pData.status === 'inactive'
      ) {
        throw new Error(`Product "${pData.name || item.name}" is disabled/unpublished and cannot be sold.`);
      }

      const currentStock = Number(pData.stock !== undefined ? pData.stock : (pData.availableStock || 0));

      if (currentStock <= 0) {
        throw new Error(`Product "${pData.name || item.name}" is out of stock (Available stock: 0).`);
      }

      if (currentStock < qty) {
        throw new Error(
          `Insufficient stock for "${pData.name || item.name}". Requested: ${qty}, Available in store: ${currentStock}`
        );
      }

      const nextStock = Math.max(0, currentStock - qty);
      const reserved = Number(pData.reservedStock) || 0;
      const nextAvailable = Math.max(0, nextStock - reserved);

      plannedUpdates.push({
        docRef,
        item,
        beforeStock: currentStock,
        nextStock,
        nextAvailable,
        currentData: pData
      });
    }

    // Phase B: Execute Atomic Deductions & Order Creation
    for (const p of plannedUpdates) {
      transaction.update(p.docRef, {
        stock: p.nextStock,
        availableStock: p.nextAvailable,
        inStock: p.nextStock > 0,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Save Order into 'orders' collection
    const orderDocRef = db.collection('orders').doc(orderId);
    transaction.set(orderDocRef, orderData);

    // Delete held bill if applicable
    if (heldBillId) {
      const heldRef = db.collection('pos_held_bills').doc(heldBillId);
      transaction.delete(heldRef);
    }

    plannedUpdates.forEach(p => {
      committedItems.push({
        item: p.item,
        beforeStock: p.beforeStock,
        nextStock: p.nextStock,
        currentData: p.currentData
      });
    });
  });

  // 5. Post-Commit: Record Inventory Ledger & Audits
  const cashierIdentifier = cashier?.name || cashier?.email || 'Store Cashier';
  for (const c of committedItems) {
    try {
      await recordLedgerEntry(db, {
        productId: c.item.productId,
        productName: c.currentData.name || c.item.name,
        sku: c.currentData.sku || c.item.sku || 'N/A',
        type: 'sale',
        quantity: -(Number(c.item.quantity) || 1),
        beforeStock: c.beforeStock,
        afterStock: c.nextStock,
        referenceType: 'pos_sale',
        referenceId: invoiceNumber,
        reason: `POS Counter Billing (${invoiceNumber})`,
        unitCost: c.currentData.costPrice || undefined,
        createdBy: cashierIdentifier,
        notes: `POS Sale to ${customerName} • Payment: ${payment.method.toUpperCase()} (${normalizedPaymentStatus})`
      });

      // Stock alert trigger
      await checkAndCreateStockAlert(db, { id: c.item.productId, ...c.currentData }, c.nextStock);
    } catch (ledgerErr) {
      console.warn('Ledger entry record notice:', ledgerErr);
    }
  }

  // Audit record
  try {
    await recordInventoryAudit(db, {
      action: 'POS_SALE_COMPLETED',
      adminEmail: cashier?.email || 'cashier@electrostore.com',
      reference: invoiceNumber,
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      details: `POS Sale completed: Invoice ${invoiceNumber}. Total: ₹${grandTotal}, Paid via: ${payment.method}`
    });
  } catch (auditErr) {
    console.warn('Audit record notice:', auditErr);
  }

  // 7. If this sale was fulfilling a held bill, remove it from pos_held_bills
  if (heldBillId) {
    try {
      await db.collection('pos_held_bills').doc(heldBillId).delete();
    } catch (e) {
      console.warn('Held bill delete note:', e);
    }
  }

  return {
    success: true,
    orderId,
    invoiceNumber,
    order: {
      ...orderData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  };
}

/**
 * Manages Held Bills:
 * Allows cashier to park a bill when customer needs more time
 */
export async function holdCurrentBill(db: any, payload: {
  items: PosSaleItemInput[];
  customer?: PosCustomerInput;
  discountAmount?: number;
  notes?: string;
  cashier?: { uid?: string; name?: string; email?: string };
}) {
  const billId = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const billData = {
    id: billId,
    items: payload.items || [],
    customer: payload.customer || { name: 'Walk-in Customer' },
    discountAmount: payload.discountAmount || 0,
    notes: payload.notes || '',
    itemsCount: (payload.items || []).reduce((sum, i) => sum + i.quantity, 0),
    totalEstimate: (payload.items || []).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) - (payload.discountAmount || 0),
    heldAt: new Date().toISOString(),
    cashier: payload.cashier || { name: 'Cashier' }
  };

  await db.collection('pos_held_bills').doc(billId).set(billData);
  return billData;
}

export async function getHeldBills(db: any) {
  try {
    const snap = await db.collection('pos_held_bills').orderBy('heldAt', 'desc').limit(20).get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // If index or ordering issue, fall back without orderBy
    const snap = await db.collection('pos_held_bills').limit(20).get();
    const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return docs.sort((a: any, b: any) => (b.heldAt || '').localeCompare(a.heldAt || ''));
  }
}

export async function deleteHeldBill(db: any, id: string) {
  await db.collection('pos_held_bills').doc(id).delete();
  return { success: true, id };
}

/**
 * Searches customers for POS counter autocomplete
 */
export async function searchPosCustomers(db: any, queryStr: string) {
  if (!queryStr || queryStr.trim().length < 2) return [];
  const q = queryStr.trim().toLowerCase();

  try {
    const snap = await db.collection('users').limit(50).get();
    const matches: any[] = [];

    snap.docs.forEach((d: any) => {
      const u = d.data();
      const name = (u.displayName || u.name || '').toLowerCase();
      const phone = (u.phoneNumber || u.phone || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      if (name.includes(q) || phone.includes(q) || email.includes(q)) {
        matches.push({
          id: d.id,
          name: u.displayName || u.name || 'Customer',
          phone: u.phoneNumber || u.phone || '',
          email: u.email || '',
          gstin: u.gstin || '',
          address: u.address || (u.addresses && u.addresses[0]?.street) || '',
          city: u.city || (u.addresses && u.addresses[0]?.city) || '',
          state: u.state || (u.addresses && u.addresses[0]?.state) || ''
        });
      }
    });

    return matches.slice(0, 10);
  } catch (err: any) {
    console.error('POS search customers error:', err);
    return [];
  }
}

/**
 * Validates stock immediately before checkout from real database
 */
export async function validatePosStock(db: any, items: Array<{ productId: string; quantity: number }>) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: true, products: [] };
  }

  const results: any[] = [];
  let allValid = true;

  for (const item of items) {
    if (!item.productId) continue;
    try {
      const docRef = db.collection('products').doc(item.productId);
      const snap = await docRef.get();
      if (!snap.exists) {
        allValid = false;
        results.push({
          productId: item.productId,
          name: 'Item',
          availableStock: 0,
          requestedQty: item.quantity,
          isValid: false,
          error: 'Product not found in store database.'
        });
        continue;
      }

      const pData = snap.data() || {};
      const isUnpublished =
        pData.isActive === false ||
        pData.isPublished === false ||
        pData.status === 'draft' ||
        pData.status === 'archived' ||
        pData.status === 'inactive';

      if (isUnpublished) {
        allValid = false;
        results.push({
          productId: item.productId,
          name: pData.name || 'Product',
          availableStock: 0,
          requestedQty: item.quantity,
          isValid: false,
          error: `Product "${pData.name || 'Item'}" is disabled/unpublished and cannot be sold.`
        });
        continue;
      }

      const currentStock = Number(pData.stock !== undefined ? pData.stock : (pData.availableStock || 0));
      const requestedQty = Number(item.quantity) || 1;
      const isOutOfStock = currentStock <= 0;
      const isInsufficient = currentStock < requestedQty;
      const isValid = !isOutOfStock && !isInsufficient;

      if (!isValid) allValid = false;

      results.push({
        productId: item.productId,
        name: pData.name || 'Product',
        availableStock: Math.max(0, currentStock),
        requestedQty,
        isValid,
        error: isOutOfStock
          ? `Product "${pData.name}" is out of stock (Stock: 0).`
          : isInsufficient
            ? `Insufficient stock for "${pData.name}". Available in store: ${currentStock}, requested in cart: ${requestedQty}.`
            : undefined
      });
    } catch (e: any) {
      console.warn('Validate item stock error:', e);
    }
  }

  return { valid: allValid, products: results };
}

/**
 * Fetches recent POS counter sales for audit/history
 */
export async function getPosRecentSales(db: any, limitCount = 150) {
  try {
    let orders: any[] = [];
    
    // 1. First try querying directly by orderSource == 'pos'
    try {
      const posSnap = await db.collection('orders')
        .where('orderSource', '==', 'pos')
        .limit(limitCount)
        .get();
      
      if (!posSnap.empty) {
        orders = posSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      }
    } catch (qErr) {
      console.warn('POS where query fallback:', qErr);
    }

    // 2. If empty or where query not indexed yet, fetch recent orders and filter
    if (orders.length === 0) {
      const snap = await db.collection('orders')
        .limit(limitCount)
        .get();

      orders = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() }))
        .filter((o: any) => o.orderSource === 'pos' || o.id?.startsWith('pos_ord_') || (o.invoiceNumber && o.invoiceNumber.includes('POS')));
    }

    // Sort newest sales first
    return orders.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (err) {
    console.warn('Recent POS sales fallback:', err);
    return [];
  }
}
