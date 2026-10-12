import { FieldValue } from './serverDb';
type Firestore = any;
import express from 'express';

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

// Helper to safely execute Firestore collection queries
export async function safeGetCollection(db: any, colName: string): Promise<any[]> {
  try {
    if (!db || typeof db.collection !== 'function') return [];
    const snap = await db.collection(colName).get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err: any) {
    console.warn(`[Inventory] Warning reading collection '${colName}':`, err?.message || err);
    return [];
  }
}

// Helper to write an immutable ledger record
export async function recordLedgerEntry(db: Firestore, entry: {
  productId: string;
  productName?: string;
  sku?: string;
  type: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  referenceType?: string;
  referenceId?: string;
  reason: string;
  unitCost?: number;
  locationId?: string;
  createdBy?: string;
  notes?: string;
}) {
  try {
    const id = `ledg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ledgerRef = db.collection('inventory_ledger').doc(id);
    const data = {
      id,
      productId: entry.productId,
      productName: entry.productName || 'Unknown Product',
      sku: entry.sku || 'N/A',
      type: entry.type,
      quantity: Number(entry.quantity) || 0,
      beforeStock: Number(entry.beforeStock) || 0,
      afterStock: Number(entry.afterStock) || 0,
      referenceType: entry.referenceType || 'manual',
      referenceId: entry.referenceId || '',
      reason: entry.reason || 'Inventory movement',
      unitCost: typeof entry.unitCost === 'number' ? entry.unitCost : null,
      locationId: entry.locationId || 'WH-MAIN-01',
      createdBy: entry.createdBy || 'Admin System',
      notes: entry.notes || '',
      createdAt: new Date().toISOString()
    };
    await ledgerRef.set(data);
    return data;
  } catch (err: any) {
    console.error('[Inventory Ledger Error]:', err?.message || err);
    return null;
  }
}

// Audit logger for sensitive inventory actions
export async function recordInventoryAudit(db: Firestore, audit: {
  action: string;
  adminEmail?: string;
  productId?: string;
  quantity?: number;
  reference?: string;
  details?: string;
}) {
  try {
    const id = `inv_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.collection('inventory_audit').doc(id).set({
      id,
      action: audit.action,
      adminEmail: audit.adminEmail || 'admin@electrostore.com',
      productId: audit.productId || null,
      quantity: audit.quantity || 0,
      reference: audit.reference || null,
      details: audit.details || '',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Non-blocking
  }
}

// Low / Out of stock notification creator
export async function checkAndCreateStockAlert(db: Firestore, product: any, availableStock: number) {
  try {
    const lowThreshold = Number(product.lowStockThreshold) || 5;
    if (availableStock <= lowThreshold) {
      const isOutOfStock = availableStock <= 0;
      const type = 'stock';
      const title = isOutOfStock 
        ? `Out of Stock: ${product.name}` 
        : `Low Stock Alert: ${product.name}`;
      const message = isOutOfStock 
        ? `Product "${product.name}" (SKU: ${product.sku || product.id}) is now completely OUT OF STOCK.`
        : `Product "${product.name}" (SKU: ${product.sku || product.id}) is low on stock (${availableStock} units remaining, threshold: ${lowThreshold}).`;

      // Check if alert was created recently (within last 24h) to avoid spam
      const recentAlerts = await db.collection('notifications')
        .where('type', '==', 'stock')
        .where('metadata.productId', '==', product.id)
        .limit(1)
        .get();

      let isDuplicate = false;
      if (!recentAlerts.empty) {
        const lastAlert = recentAlerts.docs[0].data();
        const createdTime = lastAlert.createdAt?.toDate ? lastAlert.createdAt.toDate().getTime() : new Date(lastAlert.createdAt || 0).getTime();
        if (Date.now() - createdTime < 24 * 60 * 60 * 1000) {
          isDuplicate = true;
        }
      }

      if (!isDuplicate) {
        const notifId = `notif_stock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.collection('notifications').doc(notifId).set({
          id: notifId,
          userId: 'admin',
          type,
          channel: 'in_app',
          recipient: 'admin@electrostore.com',
          title,
          message,
          read: false,
          metadata: {
            productId: product.id,
            sku: product.sku || '',
            availableStock,
            lowStockThreshold: lowThreshold
          },
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    // Non-blocking
  }
}

// 1. Overview Metrics Handler
export async function getInventoryOverview(db: Firestore, storeIdFilter?: string) {
  let products = await safeGetCollection(db, 'products');
  let purchases = await safeGetCollection(db, 'purchases');

  if (storeIdFilter && storeIdFilter !== 'all') {
    products = products.filter(p => (p.storeId || 'main-store') === storeIdFilter);
  }

  const totalProducts = products.length;
  let totalSKUs = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let reservedStockTotal = 0;
  let availableStockTotal = 0;
  let totalStockValue = 0;
  let costValueAvailable = false;
  let recentlyUpdatedCount = 0;

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  products.forEach(p => {
    if (p.sku) totalSKUs++;
    const stock = Number(p.stock) || 0;
    const reserved = Number(p.reservedStock) || 0;
    const avail = Math.max(0, stock - reserved);
    const lowThreshold = Number(p.lowStockThreshold) || 5;

    reservedStockTotal += reserved;
    availableStockTotal += avail;

    if (p.costPrice && Number(p.costPrice) > 0) {
      costValueAvailable = true;
      totalStockValue += stock * Number(p.costPrice);
    }

    if (avail <= 0) {
      outOfStockCount++;
    } else if (avail <= lowThreshold) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    const updatedAt = p.updatedAt?.toDate ? p.updatedAt.toDate().getTime() : new Date(p.updatedAt || 0).getTime();
    if (updatedAt && now - updatedAt < sevenDaysMs) {
      recentlyUpdatedCount++;
    }
  });

  const pendingRestockCount = purchases.filter(p => p.status === 'draft').length + outOfStockCount;

  return {
    totalProducts,
    totalSKUs: totalSKUs || totalProducts,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    reservedStockTotal,
    availableStockTotal,
    totalStockValue: Math.round(totalStockValue),
    costValueAvailable,
    recentlyUpdatedCount,
    pendingRestockCount
  };
}

// 2. Paginated Products Table Handler
export async function getInventoryProducts(db: Firestore, query: any, storeIdFilter?: string) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || '15', 10)));
  const search = (query.search || '').trim().toLowerCase();
  const category = (query.category || '').trim().toLowerCase();
  const brand = (query.brand || '').trim().toLowerCase();
  const stockStatus = (query.stockStatus || 'all').trim().toLowerCase();
  const sortBy = query.sortBy || 'name';
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
  const targetStoreId = storeIdFilter || query.storeId;

  let rawProducts = await safeGetCollection(db, 'products');

  if (targetStoreId && targetStoreId !== 'all') {
    rawProducts = rawProducts.filter(p => (p.storeId || 'main-store') === targetStoreId);
  }

  let filtered = rawProducts.map(p => {
    const stock = Number(p.stock) || 0;
    const reservedStock = Number(p.reservedStock) || 0;
    const availableStock = Math.max(0, stock - reservedStock);
    const lowStockThreshold = Number(p.lowStockThreshold) || 5;
    
    let computedStatus = 'in_stock';
    if (p.inStock === false) {
      computedStatus = 'inactive';
    } else if (availableStock <= 0) {
      computedStatus = 'out_of_stock';
    } else if (availableStock <= lowStockThreshold) {
      computedStatus = 'low_stock';
    }

    return {
      id: p.id,
      name: p.name || 'Unnamed Product',
      sku: p.sku || `SKU-${p.id?.substring(0, 6).toUpperCase()}`,
      category: p.category || 'General',
      brand: p.brand || 'Generic',
      stock,
      reservedStock,
      availableStock,
      lowStockThreshold,
      costPrice: p.costPrice || null,
      price: p.price || 0,
      image: p.image || '',
      barcode: p.barcode || p.sku || '',
      locationId: p.locationId || 'WH-MAIN-01',
      stockStatus: computedStatus,
      updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt?.seconds ? p.updatedAt.seconds * 1000 : Date.now()).toISOString()) : new Date().toISOString()
    };
  });

  // Apply Search
  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.barcode.toLowerCase().includes(search)
    );
  }

  // Apply Category
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category.toLowerCase() === category);
  }

  // Apply Brand
  if (brand && brand !== 'all') {
    filtered = filtered.filter(p => p.brand.toLowerCase() === brand);
  }

  // Apply Stock Status
  if (stockStatus && stockStatus !== 'all') {
    if (stockStatus === 'recently_updated') {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      filtered = filtered.filter(p => {
        const u = new Date(p.updatedAt || 0).getTime();
        return u && (now - u < sevenDaysMs);
      });
    } else {
      filtered = filtered.filter(p => p.stockStatus === stockStatus);
    }
  }

  // Sorting
  filtered.sort((a, b) => {
    let valA: any = a[sortBy as keyof typeof a];
    let valB: any = b[sortBy as keyof typeof b];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toString().toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages
    }
  };
}

// 3. Product Inventory Detail & Ledger History
export async function getProductInventoryDetail(db: Firestore, productId: string) {
  const prodDoc = await db.collection('products').doc(productId).get();
  if (!prodDoc.exists) {
    throw new Error('Product not found');
  }

  const p = prodDoc.data() || {};
  const stock = Number(p.stock) || 0;
  const reservedStock = Number(p.reservedStock) || 0;
  const availableStock = Math.max(0, stock - reservedStock);
  const lowStockThreshold = Number(p.lowStockThreshold) || 5;

  const allLedger = await safeGetCollection(db, 'inventory_ledger');
  const productLedger = allLedger
    .filter(l => l.productId === productId || (p.sku && l.sku === p.sku))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const allPurchases = await safeGetCollection(db, 'purchases');
  const purchaseHistory = allPurchases.filter(pu => 
    pu.items && pu.items.some((it: any) => it.productId === productId || (p.sku && it.sku === p.sku))
  );

  return {
    product: {
      id: prodDoc.id,
      name: p.name,
      sku: p.sku || `SKU-${prodDoc.id.substring(0, 6).toUpperCase()}`,
      category: p.category,
      brand: p.brand,
      stock,
      reservedStock,
      availableStock,
      lowStockThreshold,
      costPrice: p.costPrice || null,
      price: p.price,
      barcode: p.barcode || p.sku || '',
      locationId: p.locationId || 'WH-MAIN-01',
      image: p.image,
      updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt?.seconds ? p.updatedAt.seconds * 1000 : Date.now()).toISOString()) : new Date().toISOString()
    },
    ledgerHistory: productLedger,
    purchaseHistory
  };
}

// 4. Stock-In / Purchase Receiving (Atomic)
export async function recordStockIn(db: Firestore, body: {
  supplierId?: string;
  supplierName?: string;
  purchaseRef?: string;
  items: Array<{
    productId: string;
    sku?: string;
    quantity: number;
    unitCost: number;
    notes?: string;
  }>;
  notes?: string;
  createdBy?: string;
}) {
  if (!body.items || body.items.length === 0) {
    throw new Error('At least one item is required for stock receiving');
  }

  const adminUser = body.createdBy || 'Admin System';
  const supplier = body.supplierName || 'General Supplier';
  const refNum = body.purchaseRef || `REC-${Date.now().toString().slice(-6)}`;

  const results: any[] = [];

  for (const item of body.items) {
    const qty = Number(item.quantity);
    const uCost = Number(item.unitCost) || 0;

    if (qty <= 0) {
      throw new Error(`Quantity for item ${item.productId} must be greater than zero`);
    }

    const prodRef = db.collection('products').doc(item.productId);
    
    let updatedProduct: any = null;

    await db.runTransaction(async (t) => {
      const snap = await t.get(prodRef);
      if (!snap.exists) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const pData = snap.data() || {};
      const prodStoreId = pData.storeId || 'main-store';
      if ((body as any).partnerStoreId && prodStoreId !== (body as any).partnerStoreId) {
        throw new Error('Unauthorized: Product belongs to another store.');
      }

      const beforeStock = Number(pData.stock) || 0;
      const afterStock = beforeStock + qty;

      t.update(prodRef, {
        stock: afterStock,
        costPrice: uCost,
        inStock: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      updatedProduct = {
        id: snap.id,
        name: pData.name || 'Product',
        sku: pData.sku || item.sku || 'N/A',
        beforeStock,
        afterStock,
        costPrice: uCost
      };
    });

    // Write ledger entry
    await recordLedgerEntry(db, {
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      sku: updatedProduct.sku,
      type: 'purchase',
      quantity: qty,
      beforeStock: updatedProduct.beforeStock,
      afterStock: updatedProduct.afterStock,
      referenceType: 'purchase',
      referenceId: refNum,
      reason: `Stock In from Supplier (${supplier})`,
      unitCost: uCost,
      createdBy: adminUser,
      notes: item.notes || body.notes || ''
    });

    results.push(updatedProduct);
  }

  // Record audit entry
  await recordInventoryAudit(db, {
    action: 'STOCK_IN_CONFIRMED',
    adminEmail: adminUser,
    reference: refNum,
    details: `Received stock for ${results.length} SKU(s) from ${supplier}`
  });

  return { success: true, referenceNumber: refNum, itemsUpdated: results };
}

// 5. Stock Adjustment (Manual / Damaged / Lost / Expired / Set Exact Count)
export async function adjustStock(db: Firestore, body: {
  productId: string;
  adjustmentType: 'increase' | 'decrease' | 'set_exact';
  quantity: number;
  reason: 'physical_count' | 'damaged' | 'lost' | 'expired' | 'missing' | 'supplier_correction' | 'warehouse_correction' | 'counting_error' | 'stock_take' | 'correction';
  notes?: string;
  createdBy?: string;
}) {
  const isSetExact = body.adjustmentType === 'set_exact';
  const qty = Number(body.quantity);

  if (isNaN(qty) || (!isSetExact && qty <= 0) || (isSetExact && qty < 0)) {
    throw new Error(isSetExact ? 'Exact stock quantity cannot be negative.' : 'Adjustment quantity must be greater than zero.');
  }

  const prodRef = db.collection('products').doc(body.productId);
  const adminUser = body.createdBy || 'Admin System';

  let updatedProduct: any = null;
  let quantityDelta = 0;

  await db.runTransaction(async (t) => {
    const snap = await t.get(prodRef);
    if (!snap.exists) {
      throw new Error('Product not found in catalog');
    }
    const pData = snap.data() || {};
    const prodStoreId = pData.storeId || 'main-store';
    if ((body as any).partnerStoreId && prodStoreId !== (body as any).partnerStoreId) {
      throw new Error('Unauthorized: Product belongs to another store.');
    }

    const beforeStock = Number(pData.stock) || 0;
    
    let afterStock = beforeStock;
    if (body.adjustmentType === 'increase') {
      afterStock = beforeStock + qty;
      quantityDelta = qty;
    } else if (body.adjustmentType === 'decrease') {
      if (beforeStock < qty) {
        throw new Error(`Cannot decrease stock below 0. Current stock is ${beforeStock}, requested deduction is ${qty}.`);
      }
      afterStock = beforeStock - qty;
      quantityDelta = -qty;
    } else if (body.adjustmentType === 'set_exact') {
      afterStock = Math.max(0, Math.round(qty));
      quantityDelta = afterStock - beforeStock;
    }

    const reserved = Number(pData.reservedStock) || 0;
    const availableStock = Math.max(0, afterStock - reserved);

    t.update(prodRef, {
      stock: afterStock,
      availableStock,
      inStock: afterStock > 0,
      updatedAt: FieldValue.serverTimestamp()
    });

    updatedProduct = {
      id: snap.id,
      name: pData.name || 'Product',
      sku: pData.sku || 'N/A',
      beforeStock,
      afterStock,
      availableStock,
      reservedStock: reserved,
      costPrice: pData.costPrice || null,
      lowStockThreshold: pData.lowStockThreshold || 5
    };
  });

  let ledgerType = 'adjustment';
  if (body.reason === 'damaged') ledgerType = 'damaged';
  else if (body.reason === 'expired') ledgerType = 'expired';
  else if (body.reason === 'lost' || body.reason === 'missing') ledgerType = 'manual_correction';

  const ledgerReasonMap: Record<string, string> = {
    physical_count: 'Physical Stock Count Audit',
    damaged: 'Damaged Inventory Write-off',
    lost: 'Lost Inventory Deduction',
    expired: 'Expired Product Disposal',
    missing: 'Missing Inventory Correction',
    supplier_correction: 'Supplier Quantity Reconciliation',
    warehouse_correction: 'Warehouse Location Transfer Adjustment',
    counting_error: 'Stock Count Error Correction',
    stock_take: 'Store Stock-Take Adjustment',
    correction: 'Inventory Adjustment'
  };

  const adjId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Record immutable movement ledger entry
  await recordLedgerEntry(db, {
    productId: updatedProduct.id,
    productName: updatedProduct.name,
    sku: updatedProduct.sku,
    type: ledgerType,
    quantity: quantityDelta,
    beforeStock: updatedProduct.beforeStock,
    afterStock: updatedProduct.afterStock,
    referenceType: 'adjustment',
    referenceId: adjId,
    reason: ledgerReasonMap[body.reason] || body.reason,
    unitCost: updatedProduct.costPrice,
    createdBy: adminUser,
    notes: isSetExact 
      ? `Set exact stock to ${updatedProduct.afterStock} (Change: ${quantityDelta >= 0 ? '+' : ''}${quantityDelta}). ${body.notes || ''}`.trim()
      : body.notes || ''
  });

  // Check and create stock alert if now low/out-of-stock
  await checkAndCreateStockAlert(db, updatedProduct, updatedProduct.availableStock);

  // Record audit security log
  await recordInventoryAudit(db, {
    action: `STOCK_ADJUSTMENT_${body.adjustmentType.toUpperCase()}`,
    adminEmail: adminUser,
    productId: updatedProduct.id,
    quantity: quantityDelta,
    details: isSetExact 
      ? `Exact count set to ${updatedProduct.afterStock} from ${updatedProduct.beforeStock} (Delta: ${quantityDelta}). Reason: ${body.reason}. Notes: ${body.notes || 'None'}`
      : `Adjustment of ${body.adjustmentType} ${qty} units (Stock: ${updatedProduct.beforeStock} → ${updatedProduct.afterStock}). Reason: ${body.reason}. Notes: ${body.notes || 'None'}`
  });

  return {
    success: true,
    adjustmentId: adjId,
    product: updatedProduct,
    quantityDelta
  };
}

// Update Product Low-Stock Threshold
export async function updateProductStockThreshold(db: Firestore, productId: string, threshold: number, adminUser: string = 'Admin System') {
  const cleanThreshold = Math.max(0, Math.round(Number(threshold) || 0));
  const prodRef = db.collection('products').doc(productId);
  const snap = await prodRef.get();
  if (!snap.exists) {
    throw new Error('Product not found in catalog');
  }
  const pData = snap.data() || {};
  const oldThreshold = pData.lowStockThreshold !== undefined ? pData.lowStockThreshold : 5;

  await prodRef.update({
    lowStockThreshold: cleanThreshold,
    updatedAt: FieldValue.serverTimestamp()
  });

  const currentStock = Number(pData.stock) || 0;
  const reserved = Number(pData.reservedStock) || 0;
  const available = Math.max(0, currentStock - reserved);
  await checkAndCreateStockAlert(db, { ...pData, id: productId, lowStockThreshold: cleanThreshold }, available);

  await recordInventoryAudit(db, {
    action: 'LOW_STOCK_THRESHOLD_UPDATED',
    adminEmail: adminUser,
    productId,
    details: `Low-stock threshold updated from ${oldThreshold} to ${cleanThreshold} units for "${pData.name || productId}"`
  });

  return {
    success: true,
    productId,
    name: pData.name || 'Product',
    lowStockThreshold: cleanThreshold,
    previousThreshold: oldThreshold
  };
}

// 6. Customer Returns Stock Disposition
export async function processCustomerReturnStock(db: Firestore, body: {
  orderId: string;
  productId: string;
  quantity: number;
  disposition: 'restock' | 'damaged' | 'rejected';
  notes?: string;
  createdBy?: string;
}) {
  const qty = Number(body.quantity);
  if (qty <= 0) {
    throw new Error('Return quantity must be greater than zero');
  }

  const prodRef = db.collection('products').doc(body.productId);
  const adminUser = body.createdBy || 'Admin System';

  if (body.disposition === 'rejected') {
    await recordInventoryAudit(db, {
      action: 'RETURN_STOCK_REJECTED',
      adminEmail: adminUser,
      productId: body.productId,
      quantity: qty,
      reference: body.orderId,
      details: `Physical return inspected and rejected for restocking. ${body.notes || ''}`
    });
    return { success: true, message: 'Return inspected and rejected. Sellable stock unchanged.' };
  }

  let updatedProduct: any = null;

  if (body.disposition === 'restock') {
    await db.runTransaction(async (t) => {
      const snap = await t.get(prodRef);
      if (!snap.exists) {
        throw new Error('Product not found');
      }
      const pData = snap.data() || {};
      const beforeStock = Number(pData.stock) || 0;
      const afterStock = beforeStock + qty;

      t.update(prodRef, {
        stock: afterStock,
        inStock: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      updatedProduct = {
        id: snap.id,
        name: pData.name || 'Product',
        sku: pData.sku || 'N/A',
        beforeStock,
        afterStock,
        costPrice: pData.costPrice || null
      };
    });

    await recordLedgerEntry(db, {
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      sku: updatedProduct.sku,
      type: 'return',
      quantity: qty,
      beforeStock: updatedProduct.beforeStock,
      afterStock: updatedProduct.afterStock,
      referenceType: 'return',
      referenceId: body.orderId,
      reason: 'Customer Return - Restocked to sellable inventory',
      unitCost: updatedProduct.costPrice,
      createdBy: adminUser,
      notes: body.notes || ''
    });
  } else if (body.disposition === 'damaged') {
    // Record as damaged inventory without increasing sellable stock
    const snap = await prodRef.get();
    const pData = snap.exists ? snap.data() : {};
    const curStock = Number(pData?.stock) || 0;

    await recordLedgerEntry(db, {
      productId: body.productId,
      productName: pData?.name || 'Product',
      sku: pData?.sku || 'N/A',
      type: 'damaged',
      quantity: 0,
      beforeStock: curStock,
      afterStock: curStock,
      referenceType: 'return',
      referenceId: body.orderId,
      reason: 'Customer Return - Marked as damaged (Not sellable)',
      unitCost: pData?.costPrice || null,
      createdBy: adminUser,
      notes: body.notes || ''
    });
  }

  await recordInventoryAudit(db, {
    action: `RETURN_STOCK_PROCESSED_${body.disposition.toUpperCase()}`,
    adminEmail: adminUser,
    productId: body.productId,
    quantity: qty,
    reference: body.orderId,
    details: `Disposition: ${body.disposition}. Notes: ${body.notes || 'None'}`
  });

  return { success: true, disposition: body.disposition, product: updatedProduct };
}

// 7. Restock Suggestions Generator
export async function getRestockSuggestions(db: Firestore) {
  const products = await safeGetCollection(db, 'products');
  const orders = await safeGetCollection(db, 'orders');

  // Calculate 30-day sales per product SKU
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const salesMap: Record<string, number> = {};

  orders.forEach(o => {
    const oTime = o.createdAt ? (typeof o.createdAt === 'string' ? new Date(o.createdAt).getTime() : (o.createdAt.seconds ? o.createdAt.seconds * 1000 : 0)) : 0;
    if (now - oTime <= thirtyDaysMs && o.status !== 'cancelled' && o.status !== 'returned') {
      (o.items || []).forEach((it: any) => {
        const pId = it.productId || it.id;
        salesMap[pId] = (salesMap[pId] || 0) + (Number(it.quantity) || 1);
      });
    }
  });

  const suggestions: any[] = [];

  products.forEach(p => {
    const stock = Number(p.stock) || 0;
    const reserved = Number(p.reservedStock) || 0;
    const avail = Math.max(0, stock - reserved);
    const lowThreshold = Number(p.lowStockThreshold) || 5;
    const unitsSold = salesMap[p.id] || 0;

    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | null = null;
    let reason = '';

    if (avail <= 0) {
      priority = 'CRITICAL';
      reason = 'Completely out of stock';
    } else if (avail <= lowThreshold) {
      if (unitsSold > 5) {
        priority = 'HIGH';
        reason = `Low stock (${avail} remaining) with high recent sales velocity (${unitsSold} sold in 30 days)`;
      } else {
        priority = 'MEDIUM';
        reason = `Stock (${avail}) reached low stock threshold (${lowThreshold})`;
      }
    } else if (unitsSold > avail) {
      priority = 'HIGH';
      reason = `Projected stockout within weeks (30-day sales velocity ${unitsSold} > current stock ${avail})`;
    }

    if (priority) {
      const recQty = Math.max(10, Math.ceil(unitsSold * 1.5) || lowThreshold * 3);
      suggestions.push({
        productId: p.id,
        productName: p.name || 'Product',
        sku: p.sku || `SKU-${p.id.substring(0, 6).toUpperCase()}`,
        category: p.category || 'General',
        brand: p.brand || 'Generic',
        currentStock: stock,
        reservedStock: reserved,
        availableStock: avail,
        lowStockThreshold: lowThreshold,
        unitsSold30Days: unitsSold,
        recommendedOrderQty: recQty,
        priority,
        reason
      });
    }
  });

  suggestions.sort((a, b) => {
    const pRank = { CRITICAL: 3, HIGH: 2, MEDIUM: 1 };
    return pRank[b.priority as keyof typeof pRank] - pRank[a.priority as keyof typeof pRank];
  });

  return suggestions;
}

// 8. Inventory Valuation & Reports
export async function getInventoryReports(db: Firestore, reportType: string) {
  const products = await safeGetCollection(db, 'products');
  const suppliers = await safeGetCollection(db, 'suppliers');
  const purchases = await safeGetCollection(db, 'purchases');
  const ledger = await safeGetCollection(db, 'inventory_ledger');

  if (reportType === 'valuation') {
    let totalRetailVal = 0;
    let totalCostVal = 0;
    let costValCount = 0;

    const items = products.map(p => {
      const stock = Number(p.stock) || 0;
      const price = Number(p.price) || 0;
      const costPrice = p.costPrice ? Number(p.costPrice) : null;

      totalRetailVal += stock * price;
      if (costPrice !== null) {
        totalCostVal += stock * costPrice;
        costValCount++;
      }

      return {
        id: p.id,
        name: p.name,
        sku: p.sku || 'N/A',
        category: p.category,
        brand: p.brand,
        stock,
        retailPrice: price,
        costPrice: costPrice !== null ? costPrice : 'Cost data unavailable',
        totalRetailValue: stock * price,
        totalCostValue: costPrice !== null ? stock * costPrice : 'N/A'
      };
    });

    return {
      totalProducts: products.length,
      totalRetailValuation: Math.round(totalRetailVal),
      totalCostValuation: Math.round(totalCostVal),
      costDataCoverage: `${costValCount}/${products.length} Products with recorded cost`,
      items
    };
  } else if (reportType === 'damaged') {
    const damagedEntries = ledger.filter(l => l.type === 'damaged' || l.reason?.toLowerCase().includes('damaged'));
    return {
      totalDamagedEvents: damagedEntries.length,
      entries: damagedEntries
    };
  } else if (reportType === 'returns') {
    const returnEntries = ledger.filter(l => l.type === 'return' || l.referenceType === 'return');
    return {
      totalReturnEvents: returnEntries.length,
      entries: returnEntries
    };
  } else if (reportType === 'suppliers') {
    const supplierMap: Record<string, any> = {};
    suppliers.forEach(s => {
      supplierMap[s.id] = {
        ...s,
        totalPurchasesCount: 0,
        totalPurchaseValue: 0,
        totalUnitsReceived: 0,
        lastPurchaseDate: null
      };
    });

    purchases.forEach(pu => {
      if (pu.supplierId && supplierMap[pu.supplierId]) {
        supplierMap[pu.supplierId].totalPurchasesCount++;
        supplierMap[pu.supplierId].totalPurchaseValue += Number(pu.totalCost) || 0;
        supplierMap[pu.supplierId].totalUnitsReceived += Number(pu.totalItems) || 0;
        if (!supplierMap[pu.supplierId].lastPurchaseDate || pu.purchaseDate > supplierMap[pu.supplierId].lastPurchaseDate) {
          supplierMap[pu.supplierId].lastPurchaseDate = pu.purchaseDate;
        }
      }
    });

    return {
      totalSuppliers: suppliers.length,
      suppliers: Object.values(supplierMap)
    };
  }

  // Default: Ledger summary
  return {
    totalEntries: ledger.length,
    recentEntries: ledger.slice(0, 100)
  };
}

// 9. Seed Suppliers
function getFallbackSuppliers() {
  return [];
}

// Suppliers API Handlers
export async function getSuppliers(db: Firestore) {
  const list = await safeGetCollection(db, 'suppliers');
  return list;
}

export async function createSupplier(db: Firestore, body: any) {
  if (!body.name || !body.phone || !body.email) {
    throw new Error('Supplier Name, Phone, and Email are required');
  }

  const id = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const data = {
    id,
    name: body.name.trim(),
    companyName: body.companyName || body.name,
    phone: body.phone.trim(),
    email: body.email.trim(),
    address: body.address || '',
    gstin: body.gstin ? body.gstin.toUpperCase().trim() : '',
    notes: body.notes || '',
    status: body.status === 'inactive' ? 'inactive' : 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('suppliers').doc(id).set(data);
  await recordInventoryAudit(db, {
    action: 'SUPPLIER_CREATED',
    reference: id,
    details: `Created supplier ${data.name} (${data.companyName})`
  });

  return data;
}

export async function updateSupplier(db: Firestore, id: string, body: any) {
  const docRef = db.collection('suppliers').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Supplier not found');
  }

  const updated = {
    ...snap.data(),
    ...body,
    updatedAt: new Date().toISOString()
  };

  await docRef.set(updated, { merge: true });
  await recordInventoryAudit(db, {
    action: 'SUPPLIER_UPDATED',
    reference: id,
    details: `Updated supplier details for ${updated.name}`
  });

  return updated;
}

export async function deleteSupplier(db: Firestore, id: string) {
  await db.collection('suppliers').doc(id).delete();
  await recordInventoryAudit(db, {
    action: 'SUPPLIER_DELETED',
    reference: id
  });
  return { success: true };
}

// Purchases API Handlers
export async function getPurchases(db: Firestore) {
  const purchases = await safeGetCollection(db, 'purchases');
  return purchases.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function createPurchaseOrder(db: Firestore, body: any) {
  if (!body.supplierId || !body.items || body.items.length === 0) {
    throw new Error('Supplier and at least one line item are required');
  }

  const id = `po_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const refNum = body.referenceNumber || `PO-2026-${Date.now().toString().slice(-5)}`;
  const status = body.status === 'received' ? 'received' : 'draft';
  const adminUser = body.createdBy || 'Admin System';

  let totalItems = 0;
  let totalCost = 0;

  const sanitizedItems = (body.items || []).map((it: any) => {
    const qty = Number(it.quantity) || 1;
    const uCost = Number(it.unitCost) || 0;
    const itemTotal = qty * uCost;

    totalItems += qty;
    totalCost += itemTotal;

    return {
      productId: it.productId,
      productName: it.productName || 'Product',
      sku: it.sku || 'N/A',
      quantity: qty,
      unitCost: uCost,
      totalCost: itemTotal,
      notes: it.notes || ''
    };
  });

  const poData = {
    id,
    supplierId: body.supplierId,
    supplierName: body.supplierName || 'Supplier',
    referenceNumber: refNum,
    purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
    items: sanitizedItems,
    totalItems,
    totalCost: Math.round(totalCost),
    status,
    createdBy: adminUser,
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    receivedAt: status === 'received' ? new Date().toISOString() : null
  };

  await db.collection('purchases').doc(id).set(poData);

  // CRITICAL: Stock is ONLY affected when purchase status is Received!
  if (status === 'received') {
    await recordStockIn(db, {
      supplierId: poData.supplierId,
      supplierName: poData.supplierName,
      purchaseRef: poData.referenceNumber,
      items: poData.items,
      notes: poData.notes,
      createdBy: adminUser
    });
  }

  await recordInventoryAudit(db, {
    action: `PURCHASE_ORDER_CREATED_${status.toUpperCase()}`,
    adminEmail: adminUser,
    reference: poData.referenceNumber,
    details: `Created PO with ${totalItems} items totaling ₹${totalCost.toLocaleString()} (Status: ${status})`
  });

  return poData;
}

export async function updatePurchaseStatus(db: Firestore, id: string, newStatus: 'received' | 'cancelled', adminUser: string = 'Admin System') {
  const docRef = db.collection('purchases').doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error('Purchase order not found');
  }

  const po = snap.data() as any;
  if (po.status === 'received') {
    throw new Error('Cannot modify a purchase order that has already been received');
  }

  if (po.status === 'cancelled') {
    throw new Error('Cannot modify a cancelled purchase order');
  }

  const now = new Date().toISOString();

  await docRef.update({
    status: newStatus,
    updatedAt: now,
    receivedAt: newStatus === 'received' ? now : null
  });

  // If transitioning to received, atomically receive stock!
  if (newStatus === 'received') {
    await recordStockIn(db, {
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      purchaseRef: po.referenceNumber,
      items: po.items,
      notes: po.notes,
      createdBy: adminUser
    });
  }

  await recordInventoryAudit(db, {
    action: `PURCHASE_ORDER_STATUS_CHANGED_${newStatus.toUpperCase()}`,
    adminEmail: adminUser,
    reference: po.referenceNumber,
    details: `Purchase Order ${po.referenceNumber} status changed to ${newStatus}`
  });

  return { success: true, id, status: newStatus };
}

// Ledger Query Helper
export async function getInventoryLedgerList(db: Firestore, query: any) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || '20', 10)));
  const search = (query.search || '').trim().toLowerCase();
  const typeFilter = (query.type || 'all').trim().toLowerCase();

  const ledger = await safeGetCollection(db, 'inventory_ledger');

  let filtered = ledger.filter(l => {
    if (typeFilter !== 'all' && l.type?.toLowerCase() !== typeFilter) {
      return false;
    }
    if (search) {
      const pName = (l.productName || '').toLowerCase();
      const sku = (l.sku || '').toLowerCase();
      const reason = (l.reason || '').toLowerCase();
      const refId = (l.referenceId || '').toLowerCase();
      return pName.includes(search) || sku.includes(search) || reason.includes(search) || refId.includes(search);
    }
    return true;
  });

  filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages
    }
  };
}

