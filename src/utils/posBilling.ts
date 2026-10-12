/**
 * POS Billing & Tax Calculation Engine
 * Synchronized across POS Terminal, Checkout, Order Generation, and Invoicing
 */

export interface PosBillingItem {
  productId: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface PosBillingCalculationOptions {
  items: PosBillingItem[];
  discountType: 'flat' | 'percent';
  discountValue: number;
  maxDiscountPercent?: number;
  gstEnabled?: boolean;
  taxRate?: number;
  pricingMode?: 'exclusive' | 'inclusive';
  sellerState?: string;
  customerState?: string;
}

export interface PosBillingTotals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  isInterState: boolean;
  grandTotal: number;
  effectiveTaxRate: number;
  pricingMode: 'exclusive' | 'inclusive';
  gstEnabled: boolean;
}

/**
 * Standard monetary rounding to 2 decimal places to avoid IEEE-754 floating point drift
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a monetary number into Indian Currency format with clean decimals
 */
export function formatCurrency(amount: number, options?: { showDecimals?: boolean; symbol?: string }): string {
  const symbol = options?.symbol ?? '₹';
  const showDecimals = options?.showDecimals ?? true;
  const num = roundMoney(amount);

  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${symbol}${formatted}`;
}

/**
 * Computes billing totals based on items, store tax configuration, and applied discount
 */
export function calculatePosBillingTotals(options: PosBillingCalculationOptions): PosBillingTotals {
  const {
    items,
    discountType,
    discountValue,
    maxDiscountPercent = 100,
    gstEnabled = true,
    taxRate = 18,
    pricingMode = 'exclusive',
    sellerState = 'Karnataka',
    customerState = 'Karnataka',
  } = options;

  // 1. Calculate Subtotal (selling price × quantity)
  const subtotal = roundMoney(
    items.reduce((sum, item) => {
      const price = Math.max(0, Number(item.unitPrice) || 0);
      const qty = Math.max(0, Number(item.quantity) || 0);
      return sum + price * qty;
    }, 0)
  );

  // 2. Calculate Discount (Respect max discount percent and prevent negative/overflow)
  let discountAmount = 0;
  const safeDiscountVal = Math.max(0, Number(discountValue) || 0);

  if (safeDiscountVal > 0 && subtotal > 0) {
    if (discountType === 'percent') {
      const effectivePercent = Math.min(Math.min(100, maxDiscountPercent), safeDiscountVal);
      discountAmount = roundMoney((subtotal * effectivePercent) / 100);
    } else {
      // Flat amount: ensure it does not exceed subtotal or max discount percentage of subtotal
      const maxAllowedFlat = roundMoney((subtotal * Math.min(100, maxDiscountPercent)) / 100);
      discountAmount = roundMoney(Math.min(subtotal, Math.min(safeDiscountVal, maxAllowedFlat)));
    }
  }

  const effectiveRate = gstEnabled ? Math.max(0, Number(taxRate) || 0) : 0;
  const isInterState =
    customerState.trim().toLowerCase() !== sellerState.trim().toLowerCase();

  let taxableAmount = 0;
  let totalGst = 0;
  let grandTotal = 0;

  if (pricingMode === 'inclusive') {
    // Product prices already include GST
    const netGrossAfterDiscount = roundMoney(Math.max(0, subtotal - discountAmount));

    if (effectiveRate > 0 && gstEnabled) {
      // Base taxable amount = Gross / (1 + TaxRate/100)
      taxableAmount = roundMoney(netGrossAfterDiscount / (1 + effectiveRate / 100));
      totalGst = roundMoney(netGrossAfterDiscount - taxableAmount);
    } else {
      taxableAmount = netGrossAfterDiscount;
      totalGst = 0;
    }
    grandTotal = netGrossAfterDiscount;
  } else {
    // Standard Tax Exclusive (+ GST added on top of taxable subtotal)
    taxableAmount = roundMoney(Math.max(0, subtotal - discountAmount));

    if (effectiveRate > 0 && gstEnabled) {
      totalGst = roundMoney(taxableAmount * (effectiveRate / 100));
      grandTotal = roundMoney(taxableAmount + totalGst);
    } else {
      totalGst = 0;
      grandTotal = taxableAmount;
    }
  }

  // 3. Tax Split (Intra-state CGST + SGST vs Inter-state IGST)
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (totalGst > 0) {
    if (isInterState) {
      igst = totalGst;
    } else {
      cgst = roundMoney(totalGst / 2);
      sgst = roundMoney(totalGst - cgst);
    }
  }

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    totalGst,
    cgst,
    sgst,
    igst,
    isInterState,
    grandTotal,
    effectiveTaxRate: effectiveRate,
    pricingMode,
    gstEnabled,
  };
}
