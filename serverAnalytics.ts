type Firestore = any;

export interface DateRangeQuery {
  rangePreset?: string; // 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year' | 'custom'
  startDate?: string;
  endDate?: string;
  comparisonPreset?: 'previous_period' | 'previous_month' | 'previous_year' | 'none';
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export function parseDateBounds(preset?: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (preset) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_7_days':
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'last_30_days':
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      if (customStart) start = new Date(customStart);
      if (customEnd) end = new Date(customEnd);
      break;
    default:
      // Default to last 30 days
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function getComparisonBounds(start: Date, end: Date, type?: string) {
  if (!type || type === 'none') return null;
  const durationMs = end.getTime() - start.getTime();

  if (type === 'previous_month') {
    const compStart = new Date(start);
    compStart.setMonth(compStart.getMonth() - 1);
    const compEnd = new Date(end);
    compEnd.setMonth(compEnd.getMonth() - 1);
    return { start: compStart, end: compEnd };
  } else if (type === 'previous_year') {
    const compStart = new Date(start);
    compStart.setFullYear(compStart.getFullYear() - 1);
    const compEnd = new Date(end);
    compEnd.setFullYear(compEnd.getFullYear() - 1);
    return { start: compStart, end: compEnd };
  } else {
    // previous_period
    const compEnd = new Date(start.getTime() - 1);
    const compStart = new Date(compEnd.getTime() - durationMs);
    return { start: compStart, end: compEnd };
  }
}

export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0;
    return null; // Represent "N/A" or infinite growth safely, don't show misleading false %
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function safeGetCollection(db: any, colName: string): Promise<any[]> {
  try {
    if (!db || typeof db.collection !== 'function') return [];
    const snap = await db.collection(colName).get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err: any) {
    console.warn(`[Analytics] Non-blocking warning querying Firestore collection '${colName}':`, err?.message || err);
    return [];
  }
}

// Generate realistic fallback store data if Firestore permissions/database fail or are unpopulated
function getFallbackStoreData() {
  const seedProducts = [
    { id: 'prod_1', name: 'MacBook Pro 16 M3 Max', category: 'Laptops', brand: 'Apple', price: 349900, sku: 'LAP-APP-M316', stock: 14 },
    { id: 'prod_2', name: 'iPhone 15 Pro Max 256GB', category: 'Mobiles', brand: 'Apple', price: 159900, sku: 'MOB-APP-15PM', stock: 22 },
    { id: 'prod_3', name: 'Samsung Galaxy S24 Ultra', category: 'Mobiles', brand: 'Samsung', price: 129999, sku: 'MOB-SAM-S24U', stock: 18 },
    { id: 'prod_4', name: 'Sony WH-1000XM5 Headphones', category: 'Audio', brand: 'Sony', price: 29990, sku: 'AUD-SON-XM5', stock: 45 },
    { id: 'prod_5', name: 'LG C3 65-inch OLED 4K TV', category: 'TV & Appliances', brand: 'LG', price: 189990, sku: 'TV-LG-C365', stock: 8 },
    { id: 'prod_6', name: 'Apple Watch Series 9 GPS 45mm', category: 'Wearables', brand: 'Apple', price: 41900, sku: 'WEA-APP-W945', stock: 30 },
    { id: 'prod_7', name: 'Dell XPS 15 Intel i9 32GB', category: 'Laptops', brand: 'Dell', price: 224990, sku: 'LAP-DEL-XPS15', stock: 3 },
    { id: 'prod_8', name: 'Bose QuietComfort Ultra', category: 'Audio', brand: 'Bose', price: 35900, sku: 'AUD-BOS-QCU', stock: 0 },
    { id: 'prod_9', name: 'iPad Pro 12.9 M2 256GB', category: 'Tablets', brand: 'Apple', price: 112900, sku: 'TAB-APP-M212', stock: 19 },
    { id: 'prod_10', name: 'Asus ROG Strix Scar 18', category: 'Laptops', brand: 'Asus', price: 289990, sku: 'LAP-ASU-ROG18', stock: 4 },
    { id: 'prod_11', name: 'Marshall Stanmore III Speaker', category: 'Audio', brand: 'Marshall', price: 31999, sku: 'AUD-MAR-ST3', stock: 12 },
    { id: 'prod_12', name: 'Samsung Odyssey G9 Monitor', category: 'Gaming', brand: 'Samsung', price: 145000, sku: 'GAM-SAM-G9', stock: 7 }
  ];

  return {
    orders: [],
    products: seedProducts,
    users: [],
    payments: [],
    refunds: [],
    coupons: [],
    notifications: []
  };
}

export async function fetchAnalyticsData(db: Firestore, queryParams: DateRangeQuery) {
  const { start, end } = parseDateBounds(queryParams.rangePreset, queryParams.startDate, queryParams.endDate);
  const compBounds = getComparisonBounds(start, end, queryParams.comparisonPreset);

  // Fetch all collections safely from Firestore without throwing PERMISSION_DENIED
  const [ordersSnap, productsSnap, usersSnap, paymentsSnap, refundsSnap, couponsSnap, notificationsSnap] = await Promise.all([
    safeGetCollection(db, 'orders'),
    safeGetCollection(db, 'products'),
    safeGetCollection(db, 'users'),
    safeGetCollection(db, 'payments'),
    safeGetCollection(db, 'payment_refunds'),
    safeGetCollection(db, 'coupons'),
    safeGetCollection(db, 'notifications')
  ]);

  let allOrders = ordersSnap;
  let allProducts = productsSnap;
  let allUsers = usersSnap;
  let allPayments = paymentsSnap;
  let allRefunds = refundsSnap;
  let allCoupons = couponsSnap;
  let allNotifications = notificationsSnap;

  // When store data in Firestore is empty, maintain genuine zero arrays without generating fake data
  // allOrders, allProducts, allUsers, etc. remain authentic empty arrays if database is empty

  // Helper to extract timestamp
  const getDocDate = (doc: any): Date | null => {
    if (!doc) return null;
    if (doc.createdAt?.toDate) return doc.createdAt.toDate();
    if (doc.createdAt?.seconds) return new Date(doc.createdAt.seconds * 1000);
    if (typeof doc.createdAt === 'string' || typeof doc.createdAt === 'number') return new Date(doc.createdAt);
    if (doc.created) return new Date(doc.created * 1000);
    return null;
  };

  // Filter for date bounds
  const filterByRange = (items: any[], s: Date, e: Date) => {
    return items.filter(item => {
      const d = getDocDate(item);
      if (!d) return true; // Include if date missing to avoid dropping legacy items
      return d >= s && d <= e;
    });
  };

  const periodOrders = filterByRange(allOrders, start, end);
  const periodPayments = filterByRange(allPayments, start, end);
  const periodRefunds = filterByRange(allRefunds, start, end);

  // Function to aggregate order & payment metrics
  const aggregateMetrics = (orders: any[], payments: any[], refunds: any[]) => {
    let grossSales = 0;
    let discounts = 0;
    let shipping = 0;
    let tax = 0;
    let productsSold = 0;
    let refundAmount = 0;

    const orderStatusCounts: Record<string, { count: number; value: number }> = {
      pending: { count: 0, value: 0 },
      confirmed: { count: 0, value: 0 },
      processing: { count: 0, value: 0 },
      shipped: { count: 0, value: 0 },
      delivered: { count: 0, value: 0 },
      cancelled: { count: 0, value: 0 },
      returned: { count: 0, value: 0 },
      refunded: { count: 0, value: 0 }
    };

    orders.forEach(o => {
      const st = o.status || 'pending';
      const orderTotal = Number(o.grandTotal || o.totalAmount || 0);
      if (orderStatusCounts[st]) {
        orderStatusCounts[st].count++;
        orderStatusCounts[st].value += orderTotal;
      }

      // Gross sales count non-cancelled & non-returned orders
      if (st !== 'cancelled' && st !== 'returned') {
        const sub = Number(o.subtotal || 0);
        const disc = Number(o.discount || 0);
        const ship = Number(o.shippingCharge || 0);
        const tx = Number(o.tax || 0);

        grossSales += sub;
        discounts += disc;
        shipping += ship;
        tax += tx;

        if (Array.isArray(o.items)) {
          o.items.forEach((it: any) => {
            productsSold += Number(it.quantity || 1);
          });
        }
      }
    });

    refunds.forEach(r => {
      if (r.status === 'processed' || r.status === 'completed' || !r.status) {
        refundAmount += Number(r.refundAmount || r.amount || 0);
      }
    });

    const totalOrders = orders.length;
    const grossRevenue = grossSales - discounts + shipping + tax;
    const netRevenue = grossRevenue - refundAmount;
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    // Payment stats
    let successfulPayments = 0;
    let failedPayments = 0;
    let pendingPayments = 0;
    let authorizedPayments = 0;
    let totalPaymentVolume = 0;
    let successfulPaymentAmount = 0;
    let failedAmount = 0;
    let pendingAmount = 0;

    payments.forEach(p => {
      const amt = Number(p.amount || 0);
      totalPaymentVolume += amt;
      const pst = p.paymentStatus || p.status;
      if (pst === 'captured' || pst === 'successful') {
        successfulPayments++;
        successfulPaymentAmount += amt;
      } else if (pst === 'failed') {
        failedPayments++;
        failedAmount += amt;
      } else if (pst === 'pending') {
        pendingPayments++;
        pendingAmount += amt;
      } else if (pst === 'authorized') {
        authorizedPayments++;
      }
    });

    const applicableAttempts = successfulPayments + failedPayments + pendingPayments;
    const paymentSuccessRate = applicableAttempts > 0 ? (successfulPayments / applicableAttempts) * 100 : 0;

    return {
      grossSales,
      discounts,
      shipping,
      tax,
      grossRevenue,
      netRevenue,
      refundAmount,
      totalOrders,
      avgOrderValue,
      productsSold,
      orderStatusCounts,
      successfulPayments,
      failedPayments,
      pendingPayments,
      authorizedPayments,
      totalPaymentVolume,
      successfulPaymentAmount,
      failedAmount,
      pendingAmount,
      paymentSuccessRate
    };
  };

  const currentMetrics = aggregateMetrics(periodOrders, periodPayments, periodRefunds);

  // Comparison metrics if requested
  let comparisonMetrics: any = null;
  let deltas: any = null;

  if (compBounds) {
    const compOrders = filterByRange(allOrders, compBounds.start, compBounds.end);
    const compPayments = filterByRange(allPayments, compBounds.start, compBounds.end);
    const compRefunds = filterByRange(allRefunds, compBounds.start, compBounds.end);
    comparisonMetrics = aggregateMetrics(compOrders, compPayments, compRefunds);

    deltas = {
      grossRevenue: calculatePercentageChange(currentMetrics.grossRevenue, comparisonMetrics.grossRevenue),
      netRevenue: calculatePercentageChange(currentMetrics.netRevenue, comparisonMetrics.netRevenue),
      totalOrders: calculatePercentageChange(currentMetrics.totalOrders, comparisonMetrics.totalOrders),
      avgOrderValue: calculatePercentageChange(currentMetrics.avgOrderValue, comparisonMetrics.avgOrderValue),
      productsSold: calculatePercentageChange(currentMetrics.productsSold, comparisonMetrics.productsSold),
      successfulPayments: calculatePercentageChange(currentMetrics.successfulPayments, comparisonMetrics.successfulPayments),
      refundAmount: calculatePercentageChange(currentMetrics.refundAmount, comparisonMetrics.refundAmount)
    };
  }

  // --- 1. Product Performance Analysis ---
  const productMap: Record<string, {
    id: string;
    name: string;
    sku: string;
    category: string;
    brand: string;
    unitsSold: number;
    ordersCount: number;
    revenue: number;
    refunded: number;
    netSales: number;
    currentStock: number;
  }> = {};

  // Initialize catalog products
  allProducts.forEach(p => {
    productMap[p.id] = {
      id: p.id,
      name: p.name || 'Unnamed Product',
      sku: p.sku || `SKU-${p.id.substring(0, 6).toUpperCase()}`,
      category: p.category || 'Uncategorized',
      brand: p.brand || 'Generic',
      unitsSold: 0,
      ordersCount: 0,
      revenue: 0,
      refunded: 0,
      netSales: 0,
      currentStock: Number(p.stock ?? (p.inStock ? 10 : 0))
    };
  });

  periodOrders.forEach(o => {
    if (o.status !== 'cancelled' && o.status !== 'returned' && Array.isArray(o.items)) {
      o.items.forEach((it: any) => {
        const pId = it.productId;
        const qty = Number(it.quantity || 1);
        const itemRev = Number(it.totalPrice || (it.unitPrice * qty) || 0);

        if (!productMap[pId]) {
          productMap[pId] = {
            id: pId,
            name: it.name || 'Product',
            sku: it.sku || `SKU-${pId.substring(0, 6).toUpperCase()}`,
            category: 'Uncategorized',
            brand: 'Generic',
            unitsSold: 0,
            ordersCount: 0,
            revenue: 0,
            refunded: 0,
            netSales: 0,
            currentStock: 0
          };
        }

        productMap[pId].unitsSold += qty;
        productMap[pId].ordersCount += 1;
        productMap[pId].revenue += itemRev;
        productMap[pId].netSales += itemRev;
      });
    }
  });

  const productList = Object.values(productMap);
  const bestSellingProducts = [...productList].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10);
  const highestRevenueProducts = [...productList].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const mostOrderedProducts = [...productList].sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 10);
  const lowestSellingProducts = [...productList].filter(p => p.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold).slice(0, 10);
  const productsWithNoSales = productList.filter(p => p.unitsSold === 0);
  const lowStockBestSellers = productList.filter(p => p.unitsSold > 0 && p.currentStock > 0 && p.currentStock <= 5);
  const outOfStockProducts = productList.filter(p => p.currentStock === 0);

  // --- 2. Category & Brand Performance ---
  const categoryMap: Record<string, { category: string; orders: number; unitsSold: number; grossSales: number; discount: number; refunds: number; netSales: number }> = {};
  const brandMap: Record<string, { brand: string; productsCount: number; unitsSold: number; orders: number; revenue: number; refunds: number; netSales: number }> = {};

  productList.forEach(p => {
    // Brand catalog count
    if (!brandMap[p.brand]) {
      brandMap[p.brand] = { brand: p.brand, productsCount: 0, unitsSold: 0, orders: 0, revenue: 0, refunds: 0, netSales: 0 };
    }
    brandMap[p.brand].productsCount++;
    brandMap[p.brand].unitsSold += p.unitsSold;
    brandMap[p.brand].orders += p.ordersCount;
    brandMap[p.brand].revenue += p.revenue;
    brandMap[p.brand].refunds += p.refunded;
    brandMap[p.brand].netSales += p.netSales;

    // Category count
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { category: p.category, orders: 0, unitsSold: 0, grossSales: 0, discount: 0, refunds: 0, netSales: 0 };
    }
    categoryMap[p.category].orders += p.ordersCount;
    categoryMap[p.category].unitsSold += p.unitsSold;
    categoryMap[p.category].grossSales += p.revenue;
    categoryMap[p.category].refunds += p.refunded;
    categoryMap[p.category].netSales += p.netSales;
  });

  // --- 3. Customer Analytics ---
  const userOrderStats: Record<string, { userId: string; name: string; email: string; totalSpend: number; orderCount: number; firstOrderDate: Date; lastOrderDate: Date }> = {};

  allOrders.forEach(o => {
    const uid = o.userId || 'guest';
    const d = getDocDate(o) || new Date();
    const orderTotal = Number(o.grandTotal || o.totalAmount || 0);
    const custName = o.shippingAddress?.fullName || 'Customer';
    const custEmail = o.shippingAddress?.email || 'N/A';

    if (!userOrderStats[uid]) {
      userOrderStats[uid] = {
        userId: uid,
        name: custName,
        email: custEmail,
        totalSpend: 0,
        orderCount: 0,
        firstOrderDate: d,
        lastOrderDate: d
      };
    }

    if (o.status !== 'cancelled' && o.status !== 'returned') {
      userOrderStats[uid].totalSpend += orderTotal;
    }
    userOrderStats[uid].orderCount += 1;
    if (d < userOrderStats[uid].firstOrderDate) userOrderStats[uid].firstOrderDate = d;
    if (d > userOrderStats[uid].lastOrderDate) userOrderStats[uid].lastOrderDate = d;
  });

  const customerList = Object.values(userOrderStats);
  const actualCustomerUsers = allUsers.filter(u => {
    if (
      u.id === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' ||
      u.isPrimaryOwner ||
      u.role === 'admin' ||
      u.role === 'owner' ||
      u.role === 'manager' ||
      u.role === 'staff' ||
      (u.email && u.email.toLowerCase().trim() === 'ritamsaha0000@gmail.com')
    ) {
      return false;
    }
    return u.role === 'customer' || !u.role;
  });
  const totalCustomers = actualCustomerUsers.length || customerList.length;
  const customersWithOrders = customerList.length;
  const returningCustomersCount = customerList.filter(c => c.orderCount > 1).length;
  const newCustomersCount = customerList.filter(c => c.firstOrderDate >= start && c.firstOrderDate <= end).length;

  const totalCustomerSpend = customerList.reduce((acc, c) => acc + c.totalSpend, 0);
  const avgCustomerSpend = customersWithOrders > 0 ? totalCustomerSpend / customersWithOrders : 0;
  const avgOrdersPerCustomer = customersWithOrders > 0 ? periodOrders.length / customersWithOrders : 0;

  const topCustomersBySpend = [...customerList].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10).map(c => ({
    name: c.name,
    emailMasked: c.email !== 'N/A' ? `${c.email.substring(0, 3)}***@${c.email.split('@')[1] || 'com'}` : 'Privacy Protected',
    totalSpend: c.totalSpend,
    orderCount: c.orderCount,
    aov: c.orderCount > 0 ? c.totalSpend / c.orderCount : 0
  }));

  // --- 4. Payment Method Analytics ---
  const paymentMethodMap: Record<string, { count: number; amount: number }> = {
    'UPI': { count: 0, amount: 0 },
    'Cards': { count: 0, amount: 0 },
    'Net Banking': { count: 0, amount: 0 },
    'Wallet': { count: 0, amount: 0 },
    'Other': { count: 0, amount: 0 }
  };

  let hasPaymentMethodData = false;
  periodPayments.forEach(p => {
    const rawMethod = (p.paymentMethod || p.method || '').toLowerCase();
    const amt = Number(p.amount || 0);

    if (rawMethod) {
      hasPaymentMethodData = true;
      if (rawMethod.includes('upi')) {
        paymentMethodMap['UPI'].count++;
        paymentMethodMap['UPI'].amount += amt;
      } else if (rawMethod.includes('card') || rawMethod.includes('credit') || rawMethod.includes('debit')) {
        paymentMethodMap['Cards'].count++;
        paymentMethodMap['Cards'].amount += amt;
      } else if (rawMethod.includes('netbanking') || rawMethod.includes('bank')) {
        paymentMethodMap['Net Banking'].count++;
        paymentMethodMap['Net Banking'].amount += amt;
      } else if (rawMethod.includes('wallet')) {
        paymentMethodMap['Wallet'].count++;
        paymentMethodMap['Wallet'].amount += amt;
      } else {
        paymentMethodMap['Other'].count++;
        paymentMethodMap['Other'].amount += amt;
      }
    }
  });

  // --- 5. Inventory Valuation & Metrics ---
  const totalSKUs = allProducts.length;
  let inStockSKUs = 0;
  let lowStockSKUs = 0;
  let outOfStockSKUs = 0;
  let totalInventoryValue = 0;

  allProducts.forEach(p => {
    const st = Number(p.stock ?? (p.inStock ? 10 : 0));
    const pr = Number(p.price || 0);
    totalInventoryValue += st * pr;

    if (st === 0) outOfStockSKUs++;
    else if (st <= 5) lowStockSKUs++;
    else inStockSKUs++;
  });

  const deadStockProducts = productList.filter(p => p.unitsSold === 0 && p.currentStock > 0);

  // --- 6. Coupon Analytics ---
  const couponUsageMap: Record<string, { coupon: string; uses: number; orders: number; discountGiven: number; revenue: number; status: string }> = {};

  periodOrders.forEach(o => {
    if (o.couponCode) {
      const code = o.couponCode.toUpperCase();
      const disc = Number(o.discount || 0);
      const rev = Number(o.grandTotal || o.totalAmount || 0);

      if (!couponUsageMap[code]) {
        const cMaster = allCoupons.find((c: any) => c.code?.toUpperCase() === code);
        couponUsageMap[code] = {
          coupon: code,
          uses: 0,
          orders: 0,
          discountGiven: 0,
          revenue: 0,
          status: cMaster?.status || 'Active'
        };
      }
      couponUsageMap[code].uses++;
      couponUsageMap[code].orders++;
      couponUsageMap[code].discountGiven += disc;
      couponUsageMap[code].revenue += rev;
    }
  });

  const couponList = Object.values(couponUsageMap);
  const totalCouponsUsed = couponList.reduce((acc, c) => acc + c.uses, 0);
  const totalDiscountGiven = couponList.reduce((acc, c) => acc + c.discountGiven, 0);
  const totalCouponRevenue = couponList.reduce((acc, c) => acc + c.revenue, 0);

  // --- 7. Shipping Analytics ---
  let shippingCollected = 0;
  let freeShippingOrders = 0;
  let paidShippingOrders = 0;
  let shippedOrdersCount = 0;
  let deliveredOrdersCount = 0;
  let pendingShipmentCount = 0;
  const carrierMap: Record<string, number> = {};

  periodOrders.forEach(o => {
    const shipFee = Number(o.shippingCharge || 0);
    shippingCollected += shipFee;
    if (shipFee === 0) freeShippingOrders++;
    else paidShippingOrders++;

    const st = o.status;
    if (st === 'shipped' || st === 'out_for_delivery') shippedOrdersCount++;
    else if (st === 'delivered') deliveredOrdersCount++;
    else if (st === 'confirmed' || st === 'processing' || st === 'pending') pendingShipmentCount++;

    if (o.carrier) {
      carrierMap[o.carrier] = (carrierMap[o.carrier] || 0) + 1;
    }
  });

  const avgShippingCharge = periodOrders.length > 0 ? shippingCollected / periodOrders.length : 0;

  // --- 8. Tax / GST Analytics ---
  let taxableSales = 0;
  let totalTaxCollected = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  periodOrders.forEach(o => {
    if (o.status !== 'cancelled' && o.status !== 'returned') {
      const sub = Number(o.subtotal || 0);
      const disc = Number(o.discount || 0);
      const tx = Number(o.tax || 0);

      taxableSales += Math.max(0, sub - disc);
      totalTaxCollected += tx;

      // GST split logic: If state matches seller state or intrastate
      const destState = (o.shippingAddress?.state || '').toLowerCase();
      if (destState.includes('maharashtra') || destState.includes('home') || !destState) {
        cgstAmount += tx * 0.5;
        sgstAmount += tx * 0.5;
      } else {
        igstAmount += tx;
      }
    }
  });

  // --- 9. Financial Reconciliation & Mismatches ---
  const reconciliationMismatches: any[] = [];
  periodOrders.forEach(o => {
    const orderAmt = Number(o.grandTotal || o.totalAmount || 0);
    const payment = periodPayments.find(p => p.orderId === o.id || p.razorpayOrderId === o.payment?.razorpayOrderId);
    const isPaidInOrder = o.payment?.paymentStatus === 'captured' || o.status === 'confirmed' || o.status === 'delivered';

    if (isPaidInOrder && payment && payment.paymentStatus !== 'captured') {
      reconciliationMismatches.push({
        id: `mismatch_${o.id}`,
        type: 'UNCAPTURED_PAYMENT',
        severity: 'HIGH',
        orderId: o.id,
        message: `Order #${o.id} marked confirmed/paid, but payment status is ${payment.paymentStatus}`
      });
    }

    if (payment && Math.abs(payment.amount - orderAmt) > 1) {
      reconciliationMismatches.push({
        id: `mismatch_amt_${o.id}`,
        type: 'AMOUNT_MISMATCH',
        severity: 'MEDIUM',
        orderId: o.id,
        message: `Order #${o.id} total (₹${orderAmt}) differs from payment captured (₹${payment.amount})`
      });
    }
  });

  // --- 10. Business Health Alerts ---
  const healthAlerts: any[] = [];
  if (currentMetrics.paymentSuccessRate < 80 && currentMetrics.successfulPayments + currentMetrics.failedPayments > 5) {
    healthAlerts.push({
      id: 'alert_payment_failure',
      title: 'High Payment Failure Rate',
      type: 'warning',
      message: `Payment success rate is currently ${currentMetrics.paymentSuccessRate.toFixed(1)}%. Inspect Razorpay logs in Payment Center.`
    });
  }

  if (lowStockBestSellers.length > 0) {
    healthAlerts.push({
      id: 'alert_low_stock_bestsellers',
      title: 'Low Stock on Best Sellers',
      type: 'error',
      message: `${lowStockBestSellers.length} top-performing product(s) have 5 or fewer units remaining in stock.`
    });
  }

  if (currentMetrics.orderStatusCounts.processing?.count > 3) {
    healthAlerts.push({
      id: 'alert_orders_stuck',
      title: 'Orders Pending Processing',
      type: 'info',
      message: `${currentMetrics.orderStatusCounts.processing.count} order(s) are awaiting dispatch in Processing state.`
    });
  }

  if (reconciliationMismatches.length > 0) {
    healthAlerts.push({
      id: 'alert_reconciliation',
      title: 'Financial Reconciliation Warnings',
      type: 'warning',
      message: `${reconciliationMismatches.length} order/payment discrepancy mismatch(es) detected.`
    });
  }

  // --- 11. Time-series Sales Chart Data ---
  const timeSeriesMap: Record<string, { date: string; revenue: number; orders: number; productsSold: number; avgOrderValue: number; successfulPayments: number; failedPayments: number }> = {};

  periodOrders.forEach(o => {
    const d = getDocDate(o);
    if (!d) return;

    let key = d.toISOString().split('T')[0]; // YYYY-MM-DD
    if (queryParams.granularity === 'monthly') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!timeSeriesMap[key]) {
      timeSeriesMap[key] = { date: key, revenue: 0, orders: 0, productsSold: 0, avgOrderValue: 0, successfulPayments: 0, failedPayments: 0 };
    }

    const orderAmt = Number(o.grandTotal || o.totalAmount || 0);
    timeSeriesMap[key].orders += 1;

    if (o.status !== 'cancelled' && o.status !== 'returned') {
      timeSeriesMap[key].revenue += orderAmt;
      if (Array.isArray(o.items)) {
        o.items.forEach((it: any) => {
          timeSeriesMap[key].productsSold += Number(it.quantity || 1);
        });
      }
    }
  });

  periodPayments.forEach(p => {
    const d = getDocDate(p);
    if (!d) return;
    let key = d.toISOString().split('T')[0];
    if (queryParams.granularity === 'monthly') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!timeSeriesMap[key]) {
      timeSeriesMap[key] = { date: key, revenue: 0, orders: 0, productsSold: 0, avgOrderValue: 0, successfulPayments: 0, failedPayments: 0 };
    }
    if (p.paymentStatus === 'captured' || p.status === 'captured') {
      timeSeriesMap[key].successfulPayments += 1;
    } else if (p.paymentStatus === 'failed' || p.status === 'failed') {
      timeSeriesMap[key].failedPayments += 1;
    }
  });

  const salesTimeSeries = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date)).map(item => ({
    ...item,
    avgOrderValue: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0
  }));

  return {
    range: {
      preset: queryParams.rangePreset || 'last_30_days',
      start: start.toISOString(),
      end: end.toISOString(),
      comparisonPreset: queryParams.comparisonPreset || 'none'
    },
    lastUpdated: new Date().toISOString(),
    metrics: currentMetrics,
    comparison: comparisonMetrics,
    deltas,
    salesTimeSeries,
    products: {
      bestSelling: bestSellingProducts,
      highestRevenue: highestRevenueProducts,
      mostOrdered: mostOrderedProducts,
      lowestSelling: lowestSellingProducts,
      noSales: productsWithNoSales,
      lowStockBestSellers,
      outOfStock: outOfStockProducts,
      allProducts: productList
    },
    categories: Object.values(categoryMap),
    brands: Object.values(brandMap),
    customers: {
      totalCustomers,
      newCustomers: newCustomersCount,
      returningCustomers: returningCustomersCount,
      customersWithOrders,
      avgCustomerSpend: Math.round(avgCustomerSpend),
      avgOrdersPerCustomer: Number(avgOrdersPerCustomer.toFixed(2)),
      topCustomers: topCustomersBySpend
    },
    payments: {
      metrics: {
        successful: currentMetrics.successfulPayments,
        failed: currentMetrics.failedPayments,
        pending: currentMetrics.pendingPayments,
        authorized: currentMetrics.authorizedPayments,
        successRate: Number(currentMetrics.paymentSuccessRate.toFixed(1)),
        totalVolume: currentMetrics.totalPaymentVolume,
        successfulAmount: currentMetrics.successfulPaymentAmount,
        failedAmount: currentMetrics.failedAmount,
        pendingAmount: currentMetrics.pendingAmount,
        refundAmount: currentMetrics.refundAmount
      },
      hasMethodData: hasPaymentMethodData,
      methodsBreakdown: paymentMethodMap
    },
    inventory: {
      totalSKUs,
      inStockSKUs,
      lowStockSKUs,
      outOfStockSKUs,
      totalInventoryValue,
      deadStockProducts
    },
    coupons: {
      totalCouponsUsed,
      totalDiscountGiven,
      totalCouponRevenue,
      couponList
    },
    shipping: {
      shippingCollected,
      freeShippingOrders,
      paidShippingOrders,
      avgShippingCharge: Math.round(avgShippingCharge),
      shippedOrdersCount,
      deliveredOrdersCount,
      pendingShipmentCount,
      carrierDistribution: carrierMap
    },
    tax: {
      taxableSales: Math.round(taxableSales),
      totalTaxCollected: Math.round(totalTaxCollected),
      cgstAmount: Math.round(cgstAmount),
      sgstAmount: Math.round(sgstAmount),
      igstAmount: Math.round(igstAmount)
    },
    reconciliationMismatches,
    healthAlerts,
    rawOrders: allOrders,
    rawPayments: allPayments
  };
}
