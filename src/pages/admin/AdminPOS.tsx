import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  ScanBarcode, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Clock, 
  Store, 
  ArrowLeft, 
  Percent, 
  Receipt,
  User,
  History,
  Tag,
  X,
  Menu
} from 'lucide-react';
import { subscribeProducts, subscribeCategories } from '../../services/catalogCache';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings, defaultPosSettings, type PosSettings } from '../../context/SiteSettingsContext';
import { Product, Category } from '../../types';
import { ProductCard } from '../../components/ProductCard';
import { 
  PosCartItem, 
  PosCustomer, 
  PosPaymentState 
} from './pos/types';
import { playPosBeep } from './pos/posAudio';
import { PosInvoiceModal } from './pos/PosInvoiceModal';
import { PosCustomerSelector } from './pos/PosCustomerSelector';
import { PosPaymentPanel } from './pos/PosPaymentPanel';
import { PosSalesHistory } from './pos/PosSalesHistory';
import { calculatePosBillingTotals, formatCurrency, roundMoney } from '../../utils/posBilling';

interface AdminPOSProps {
  onBackToAdmin?: () => void;
  initialSubTab?: string;
  forcedStoreId?: string;
}

export const AdminPOS: React.FC<AdminPOSProps> = ({ onBackToAdmin, initialSubTab, forcedStoreId }) => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const posSettings: PosSettings = { ...defaultPosSettings, ...(settings.pos || {}) };

  // Active view: 'terminal' (Counter Billing) | 'history' (Sales History & Returns)
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>(
    initialSubTab === 'history' || initialSubTab === 'sales' 
      ? 'history' 
      : (!initialSubTab && posSettings.defaultPosPage === 'history' ? 'history' : 'terminal')
  );

  useEffect(() => {
    if (initialSubTab === 'history' || initialSubTab === 'sales') {
      setActiveTab('history');
    } else if (initialSubTab === 'counter' || initialSubTab === 'terminal') {
      setActiveTab('terminal');
    }
  }, [initialSubTab]);

  // 1. PRODUCT CATALOG STATE
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // 2. CART STATE
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // 3. BILLING & CUSTOMER STATE
  const allowWalkIn = posSettings.allowWalkInBilling !== false;
  const [customer, setCustomer] = useState<PosCustomer>({
    name: allowWalkIn ? (posSettings.defaultCustomer || 'Walk-in Customer') : '',
    isWalkIn: allowWalkIn,
    state: (settings.tax as any)?.storeState || settings.general?.state || 'West Bengal'
  });
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // 4. PAYMENT STATE (Cash, UPI, Card)
  const defaultPaymentMethod = posSettings.enableCash !== false ? 'cash' : (posSettings.enableUpi !== false ? 'upi' : 'card');
  const [paymentState, setPaymentState] = useState<PosPaymentState>({
    method: defaultPaymentMethod,
    cashTendered: 0,
    referenceNumber: '',
    cardLast4: '',
    cardType: 'Debit Card',
    upiRef: '',
    paymentStatus: 'paid',
    isConfirmed: true
  });

  // 5. SALE & INVOICE STATE
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcodeNotification, setBarcodeNotification] = useState<string | null>(null);
  const submittingRef = useRef<boolean>(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to live products and categories from cache/Firestore
  useEffect(() => {
    const unsubProducts = subscribeProducts((prods) => {
      setProducts(prods);
    });
    const unsubCats = subscribeCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubProducts();
      unsubCats();
    };
  }, []);

  // Keyboard shortcut: F2 to focus search, Esc to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completedOrder) {
        if (e.key === 'Escape') {
          setCompletedOrder(null);
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completedOrder]);

  // Filter products for the PRODUCT LIST
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Exclude inactive / unpublished / draft / archived products
      if (
        (prod as any).isActive === false ||
        (prod as any).isPublished === false ||
        (prod as any).status === 'draft' ||
        (prod as any).status === 'archived' ||
        (prod as any).status === 'inactive'
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const prodCat = (prod.category || '').toLowerCase();
        if (prodCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Stock filter
      const available = Number(prod.stock !== undefined ? prod.stock : (prod.availableStock || 0));
      if (inStockOnly && available <= 0) {
        return false;
      }

      // Search Query filter (matches name, SKU, barcode, brand)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (prod.name || '').toLowerCase().includes(q);
        const matchSku = (prod.sku || '').toLowerCase().includes(q);
        const matchBarcode = (prod.barcode || '').toLowerCase().includes(q);
        const matchBrand = (prod.brand || '').toLowerCase().includes(q);
        return matchName || matchSku || matchBarcode || matchBrand;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, inStockOnly]);

  // 1. PRODUCT: Add product to cart
  const addToCart = (product: Product, qtyToAdd = 1) => {
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;

    // Check if product is active and published
    if (
      (product as any).isActive === false ||
      (product as any).isPublished === false ||
      (product as any).status === 'draft' ||
      (product as any).status === 'archived' ||
      (product as any).status === 'inactive'
    ) {
      playPosBeep('warning', soundEnabled);
      setErrorMessage(`"${product.name}" is unpublished or disabled and cannot be sold.`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    const currentStock = Number(product.stock !== undefined ? product.stock : (product.availableStock || 0));
    const allowOutOfStock = posSettings.allowSellingOutOfStock === true;
    const allowAboveStock = posSettings.allowQuantityAboveStock === true;
    
    if (currentStock <= 0 && !allowOutOfStock) {
      playPosBeep('warning', soundEnabled);
      setErrorMessage(`"${product.name}" is currently out of stock.`);
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = existingItem.quantity + qtyToAdd;

      if (newQty > currentStock && !allowAboveStock) {
        playPosBeep('warning', soundEnabled);
        setErrorMessage(`Cannot add more than available store stock (${currentStock}) for ${product.name}`);
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }

      const updated = [...cart];
      updated[existingIndex] = {
        ...existingItem,
        quantity: newQty
      };
      setCart(updated);
    } else {
      const prodId = product.id || '';
      const newItem: PosCartItem = {
        productId: prodId,
        name: product.name,
        sku: product.sku || prodId.slice(0, 8).toUpperCase(),
        barcode: product.barcode || '',
        image: product.image || (product.images && product.images[0]) || '',
        unitPrice: Number((product as any).sellingPrice || product.price || 0),
        availableStock: currentStock,
        quantity: qtyToAdd,
        discountType: 'flat',
        discountValue: 0,
        discountAmount: 0,
        taxRate: typeof (product as any).taxRate === 'number' ? (product as any).taxRate : (settings.tax?.taxRate ?? 18),
        hsnCode: (product as any).hsnCode || '8517',
        category: product.category,
        brand: product.brand
      };
      setCart([...cart, newItem]);
    }

    playPosBeep('scan', soundEnabled);
  };

  // 1. PRODUCT: Barcode / SKU Direct Enter Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (posSettings.enableBarcodeSkuSearch === false) {
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    
    // Find exact barcode or SKU match first
    const exactMatch = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.sku && p.sku.toLowerCase() === query)
    );

    if (exactMatch) {
      addToCart(exactMatch, 1);
      setBarcodeNotification(`Scanned: ${exactMatch.name}`);
      setTimeout(() => setBarcodeNotification(null), 2500);
      setSearchQuery('');
      return;
    }

    // If single filtered product matches, add it
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
      setBarcodeNotification(`Added: ${filteredProducts[0].name}`);
      setTimeout(() => setBarcodeNotification(null), 2500);
      setSearchQuery('');
      return;
    }

    // No matching product found for scanned barcode / entered SKU
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;
    playPosBeep('warning', soundEnabled);
    setErrorMessage(`No product found matching barcode or SKU: "${searchQuery.trim()}"`);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // 1. PRODUCT: Change quantity in cart
  const updateCartQuantity = (productId: string, delta: number) => {
    const allowAboveStock = posSettings.allowQuantityAboveStock === true;
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) {
              playPosBeep('scan', soundEnabled);
              return null;
            }
            if (nextQty > item.availableStock && !allowAboveStock) {
              playPosBeep('warning', soundEnabled);
              setErrorMessage(`Cannot exceed available store stock (${item.availableStock}) for ${item.name}.`);
              setTimeout(() => setErrorMessage(null), 3000);
              return item;
            }
            playPosBeep('scan', soundEnabled);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[];
    });
  };

  // 1. PRODUCT: Remove product from cart
  const removeCartItem = (productId: string) => {
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    playPosBeep('scan', soundEnabled);
  };

  // 1. PRODUCT: Clear entire cart
  const clearCart = () => {
    if (cart.length === 0) return;
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;
    playPosBeep('scan', soundEnabled);
    setCart([]);
    setDiscountValue(0);
    setConfirmClear(false);
    setPaymentState({
      method: defaultPaymentMethod,
      cashTendered: 0,
      referenceNumber: '',
      cardLast4: '',
      cardType: 'Debit Card',
      upiRef: '',
      paymentStatus: 'paid',
      isConfirmed: true
    });
  };

  // 2. BILLING: Financial Totals & GST Calculations
  const sellerState = (settings.tax as any)?.storeState || settings.general?.state || 'Karnataka';
  const customerState = customer.state || sellerState;
  const gstEnabled = settings.tax?.gstEnabled !== false;
  const storeTaxRate = settings.tax?.taxRate ?? 18;
  const pricingMode: 'exclusive' | 'inclusive' = 
    posSettings.useStoreGstSettings !== false
      ? (settings.tax?.taxDisplay === 'inclusive' ? 'inclusive' : 'exclusive')
      : (posSettings.gstPricingMode || 'exclusive');

  const maxDiscountAllowed = posSettings.allowDiscount !== false ? (posSettings.maxDiscountPercent || 100) : 0;

  const billingTotals = useMemo(() => {
    return calculatePosBillingTotals({
      items: cart.map(item => ({
        productId: item.productId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountAmount: item.discountAmount,
        taxRate: item.taxRate
      })),
      discountType,
      discountValue: posSettings.allowDiscount !== false ? discountValue : 0,
      maxDiscountPercent: maxDiscountAllowed,
      gstEnabled,
      taxRate: storeTaxRate,
      pricingMode,
      sellerState,
      customerState
    });
  }, [
    cart,
    discountType,
    discountValue,
    posSettings.allowDiscount,
    maxDiscountAllowed,
    gstEnabled,
    storeTaxRate,
    pricingMode,
    sellerState,
    customerState
  ]);

  const {
    subtotal,
    discountAmount: billDiscountAmount,
    taxableAmount,
    totalGst,
    cgst,
    sgst,
    igst,
    isInterState,
    grandTotal,
    effectiveTaxRate
  } = billingTotals;

  // Keep cash tendered in sync with grand total for exact cash default
  useEffect(() => {
    if (paymentState.method === 'cash' && (paymentState.cashTendered === 0 || paymentState.cashTendered < grandTotal)) {
      setPaymentState(prev => ({ ...prev, cashTendered: grandTotal, paymentStatus: 'paid', isConfirmed: true }));
    }
  }, [grandTotal, paymentState.method]);

  // 4. SALE: Complete Sale Handler
  const handleCompleteSale = async () => {
    // Prevent double-click / duplicate sale
    if (isSubmitting || submittingRef.current) return;

    setErrorMessage(null);
    const soundEnabled = posSettings.soundFeedbackEnabled !== false;

    // Validate POS enabled in store settings
    if (posSettings.posEnabled === false) {
      playPosBeep('warning', soundEnabled);
      setErrorMessage('POS billing is currently disabled in POS Settings. Please enable it in Store Settings to complete sales.');
      return;
    }

    // Validate cart
    if (cart.length === 0) {
      playPosBeep('warning', soundEnabled);
      setErrorMessage('Cannot complete sale: Cart is empty. Please add products first.');
      return;
    }

    // Validate walk-in billing enabled
    if (posSettings.allowWalkInBilling === false && (customer.isWalkIn || !customer.name || customer.name.trim() === '' || customer.name === 'Walk-in Customer')) {
      playPosBeep('warning', soundEnabled);
      setErrorMessage('Walk-in customer billing is disabled by admin. Please select or register a customer first.');
      return;
    }

    // Validate customer if required
    if (posSettings.customerSelectionOptional === false) {
      const isMissingCustomer = !customer.name || customer.name.trim() === '' || customer.isWalkIn || customer.name === 'Walk-in Customer';
      if (isMissingCustomer) {
        playPosBeep('warning', soundEnabled);
        setErrorMessage('Customer name and contact details are required before completing this sale.');
        return;
      }
    }

    // Validate product availability
    if (posSettings.allowSellingOutOfStock !== true) {
      for (const item of cart) {
        const available = Number(item.availableStock !== undefined ? item.availableStock : ((item as any).stock || 0));
        if (item.quantity > available) {
          playPosBeep('warning', soundEnabled);
          setErrorMessage(`Insufficient stock for "${item.name}". Requested: ${item.quantity}, In store: ${available}.`);
          return;
        }
      }
    }

    // Validate payment status & details
    if (paymentState.paymentStatus === 'failed') {
      playPosBeep('warning', soundEnabled);
      setErrorMessage('Cannot complete sale: Payment is marked as "Failed". Please resolve or change payment method.');
      return;
    }

    if (paymentState.paymentStatus === 'paid') {
      if (paymentState.method === 'cash' && Number(paymentState.cashTendered || 0) < grandTotal) {
        playPosBeep('warning', soundEnabled);
        setErrorMessage(`Cash received (₹${Number(paymentState.cashTendered || 0).toLocaleString('en-IN')}) is less than Grand Total (₹${Number(grandTotal || 0).toLocaleString('en-IN')}).`);
        return;
      }
      if (paymentState.method === 'split') {
        const splitBreakdown = paymentState.splitBreakdown || { cash: 0, upi: 0, card: 0 };
        const splitCash = Number(splitBreakdown.cash) || 0;
        const splitUpi = Number(splitBreakdown.upi) || 0;
        const splitCard = Number(splitBreakdown.card) || 0;
        const splitSum = splitCash + splitUpi + splitCard;
        if (Math.abs(splitSum - grandTotal) > 0.05) {
          playPosBeep('warning', soundEnabled);
          setErrorMessage(`Split payments sum (₹${splitSum.toLocaleString('en-IN')}) does not match Grand Total (₹${grandTotal.toLocaleString('en-IN')}). Remaining: ₹${(grandTotal - splitSum).toLocaleString('en-IN')}.`);
          return;
        }
      }
      if ((paymentState.method === 'upi' || paymentState.method === 'card') && !paymentState.isConfirmed) {
        playPosBeep('warning', soundEnabled);
        setErrorMessage(`Please confirm payment received for ${paymentState.method.toUpperCase()} before completing sale as Paid.`);
        return;
      }
    }

    try {
      submittingRef.current = true;
      setIsSubmitting(true);

      // Re-check stock immediately from the real database before final sale submission
      const validateStockRes = await fetch('/api/admin/pos/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        })
      });

      if (validateStockRes.ok) {
        const stockData = await validateStockRes.json();
        if (!stockData.valid && posSettings.allowSellingOutOfStock !== true) {
          // If stock changed while POS was open, update available stock in cart and notify cashier
          if (Array.isArray(stockData.products)) {
            setCart((prev) =>
              prev.map((cartItem) => {
                const checked = stockData.products.find((p: any) => p.productId === cartItem.productId);
                if (checked && checked.availableStock !== undefined) {
                  return {
                    ...cartItem,
                    availableStock: checked.availableStock,
                    stock: checked.availableStock
                  };
                }
                return cartItem;
              })
            );
          }

          const failingProduct = (stockData.products || []).find((p: any) => !p.isValid);
          const errorMsg = failingProduct?.error || 'Stock changed while POS was open. Updated available quantities are now shown. Please adjust cart.';
          playPosBeep('warning', soundEnabled);
          setErrorMessage(errorMsg);
          submittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare split payment entries if method is split
      const splitBreakdown = paymentState.splitBreakdown || { cash: 0, upi: 0, card: 0 };
      const splitCash = Number(splitBreakdown.cash) || 0;
      const splitUpi = Number(splitBreakdown.upi) || 0;
      const splitCard = Number(splitBreakdown.card) || 0;
      const splitCashTendered = splitBreakdown.cashTendered !== undefined && splitBreakdown.cashTendered > 0 ? splitBreakdown.cashTendered : splitCash;
      const splitCashChange = Math.max(0, splitCashTendered - splitCash);

      const splitEntries: any[] = [];
      if (splitCash > 0) {
        splitEntries.push({
          method: 'cash',
          amount: splitCash,
          cashTendered: splitCashTendered,
          changeGiven: splitCashChange
        });
      }
      if (splitUpi > 0) {
        splitEntries.push({
          method: 'upi',
          amount: splitUpi,
          reference: splitBreakdown.upiRef || ''
        });
      }
      if (splitCard > 0) {
        splitEntries.push({
          method: 'card',
          amount: splitCard,
          cardType: splitBreakdown.cardType || 'Debit Card',
          cardLast4: splitBreakdown.cardLast4 || '',
          reference: splitBreakdown.cardRef || ''
        });
      }

      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          hsnCode: item.hsnCode,
          image: item.image
        })),
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          gstin: customer.gstin,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
          isWalkIn: customer.isWalkIn
        },
        payment: {
          method: paymentState.method,
          amountPaid: paymentState.method === 'cash' ? paymentState.cashTendered : grandTotal,
          changeGiven: paymentState.method === 'cash' ? Math.max(0, paymentState.cashTendered - grandTotal) : (paymentState.method === 'split' ? splitCashChange : 0),
          referenceNumber: paymentState.referenceNumber || paymentState.upiRef || paymentState.cardLast4 || '',
          cardLast4: paymentState.cardLast4,
          cardType: paymentState.cardType,
          upiRef: paymentState.upiRef,
          paymentStatus: paymentState.paymentStatus,
          isConfirmed: paymentState.isConfirmed,
          splitDetails: paymentState.method === 'split' ? splitEntries : null,
          payments: paymentState.method === 'split' ? splitEntries : null
        },
        billDiscountAmount,
        billDiscountPercent: discountType === 'percent' ? discountValue : 0,
        taxConfig: {
          gstEnabled,
          taxRate: storeTaxRate,
          gstin: settings.tax?.gstin || '',
          invoicePrefix: posSettings.invoicePrefix || (settings as any).orders?.invoicePrefix || settings.tax?.invoicePrefix || 'EST-',
          sellerState,
          pricingMode
        },
        cashier: {
          uid: user?.uid || 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1',
          email: user?.email || 'ritamsaha0000@gmail.com',
          name: user?.displayName || (user as any)?.name || 'Ritam Saha'
        }
      };

      const response = await fetch('/api/admin/pos/complete-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to complete sale transaction');
      }

      const result = await response.json();
      playPosBeep('success', soundEnabled);

      // Set completed order to trigger 5. INVOICE modal if configured
      if (posSettings.autoOpenInvoiceAfterSale !== false) {
        setCompletedOrder(result.order);
      }

      // Reset cart and billing form for next transaction if configured
      if (posSettings.autoClearCartAfterSale !== false) {
        setCart([]);
        setDiscountValue(0);
        setCustomer({
          name: allowWalkIn ? (posSettings.defaultCustomer || 'Walk-in Customer') : '',
          isWalkIn: allowWalkIn,
          state: sellerState
        });
        setPaymentState({
          method: defaultPaymentMethod,
          cashTendered: 0,
          referenceNumber: '',
          cardLast4: '',
          cardType: 'Debit Card',
          upiRef: '',
          paymentStatus: 'paid',
          isConfirmed: true
        });
      }
    } catch (err: any) {
      console.error('POS sale execution error:', err);
      playPosBeep('error', soundEnabled);
      setErrorMessage(`Sale Failed: ${err.message || 'Something went wrong.'}`);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-100 text-slate-900 min-h-screen">
      {/* 2. TOP POS BAR - Streamlined, no wasted space */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        {/* Left: Mode Tabs & Back */}
        <div className="flex items-center gap-2 shrink-0">
          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Back to Admin"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'terminal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store size={13} />
              <span>Counter Billing</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={13} />
              <span>Sales History</span>
            </button>
          </div>
        </div>

        {/* Center / Right: Customer Indicator, Cashier Context & Cart Quick-link */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Customer Indicator (clickable to scroll to customer selector) */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pos-customer-selector-container');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
            title="Customer Profile (Click to change)"
          >
            <User size={13} className="text-slate-500" />
            <span className="truncate max-w-[130px]">{customer.name || 'Walk-in Customer'}</span>
          </button>

          {/* Quiet Cashier Context */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Staff: <strong className="text-slate-700">{user?.displayName || (user as any)?.name || 'Ritam Saha'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Terminal 1</span>
          </div>

          {/* Mobile Cart Quick-View Button (Scrolls to Cart) */}
          {activeTab === 'terminal' && cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const cartEl = document.getElementById('pos-cart-section');
                if (cartEl) {
                  cartEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
            >
              <ShoppingCart size={13} />
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              <span className="opacity-75">•</span>
              <span>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
            </button>
          )}
        </div>
      </div>

      {/* POS Disabled Banner */}
      {posSettings.posEnabled === false && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1 text-[11px] font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-900 shrink-0" />
            <span>Notice: POS counter billing is currently disabled in POS Settings.</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'history' ? (
        <main className="p-3 max-w-7xl mx-auto w-full">
          <PosSalesHistory onNewSaleClick={() => setActiveTab('terminal')} />
        </main>
      ) : (
        /* Counter Billing: Clean, fast layout matching user structure */
        <main className="p-3 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* LEFT COLUMN: PRODUCT SEARCH / BARCODE + PRODUCT LIST */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            
            {/* 1. PRODUCT SEARCH / BARCODE & CATEGORY NAVIGATION */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 flex items-center gap-1 pointer-events-none">
                  <Search size={14} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product name, or scan Barcode / SKU..."
                  className="w-full pl-8 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  autoFocus
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer shadow-2xs"
                    title="Scan/Submit"
                  >
                    <ScanBarcode size={11} />
                    <span>Scan</span>
                  </button>
                </div>
              </form>

              {/* Barcode notification */}
              {barcodeNotification && (
                <div className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-semibold flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>{barcodeNotification}</span>
                </div>
              )}

              {/* Category Navigation Chips & In-stock toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-[10px] w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                    const count = products.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase()).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat.name} {count > 0 && <span className="opacity-75 font-normal">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                <label className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 whitespace-nowrap cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            {/* 2. PRODUCT CATALOG (MICRO VIEW) */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Product Catalog</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-blue-200">
                      Micro Grid
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0 rounded-full">
                      {filteredProducts.length}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[680px] lg:max-h-[calc(100vh-200px)] min-h-[400px] pr-0.5">
                {filteredProducts.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
                    <Search size={24} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-[10px]">No products match your search</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1">
                    {filteredProducts.map((product) => {
                      const inCartItem = cart.find(c => c.productId === product.id);
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isPosMode
                          layout="compact"
                          allowSellingOutOfStock={posSettings.allowSellingOutOfStock === true}
                          inCartQuantity={inCartItem ? inCartItem.quantity : 0}
                          onAddToCart={(p) => addToCart(p, 1)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CART -> CUSTOMER -> DISCOUNT + GST -> TOTAL -> CASH / UPI / CARD -> COMPLETE SALE */}
          <div id="pos-cart-section" className="lg:col-span-5 flex flex-col gap-3">
            
            {/* 3. CART */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-600" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Counter Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                  </h2>
                </div>
                {cart.length > 0 && (
                  confirmClear ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                      <span className="text-[11px] font-bold text-slate-500">Clear all?</span>
                      <button
                        type="button"
                        onClick={() => clearCart()}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Yes, Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="text-[11px] font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      title="Clear entire cart"
                    >
                      <Trash2 size={12} />
                      <span>Clear Cart</span>
                    </button>
                  )
                )}
              </div>

              {/* Cart Item List */}
              <div className="flex-1 overflow-y-auto max-h-[340px] lg:max-h-[380px] divide-y divide-slate-100 my-2 pr-0.5">
                {cart.length === 0 ? (
                  <div className="py-4 text-center text-slate-400">
                    <p className="font-bold text-[11px] text-slate-600">Cart is empty</p>
                    <p className="text-[10px] text-slate-400">Search/scan to add items</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const lineTotal = item.unitPrice * item.quantity;
                    const isAtStockLimit = item.quantity >= item.availableStock && !posSettings.allowQuantityAboveStock;

                    return (
                      <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2.5">
                        {/* 1. Product Image */}
                        <div className="w-11 h-11 bg-slate-100 rounded-lg shrink-0 overflow-hidden border border-slate-200/80 flex items-center justify-center relative">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain p-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Store size={18} className="text-slate-300" />
                          )}
                        </div>

                        {/* 2. Product Name, Selling Price, Available Stock */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>₹{Number(item.unitPrice || 0).toLocaleString('en-IN')} each</span>
                            <span className="text-slate-300">•</span>
                            <span className={isAtStockLimit ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                              Stock: {item.availableStock}
                            </span>
                          </div>
                        </div>

                        {/* 3. Quantity Controls (- / qty / +) */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.productId, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs active:scale-95 touch-manipulation"
                            title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center font-mono font-black text-xs text-slate-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.productId, 1)}
                            disabled={isAtStockLimit}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs active:scale-95 touch-manipulation"
                            title={isAtStockLimit ? 'Max available stock reached' : 'Increase quantity'}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* 4. Item Total & Remove Button */}
                        <div className="text-right shrink-0 flex items-center gap-2 min-w-[76px] justify-end">
                          <div className="text-right">
                            <p className="font-mono font-black text-xs text-slate-900">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title={`Remove ${item.name}`}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 4. CUSTOMER SELECTION */}
              <div id="pos-customer-selector-container" className="pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Customer
                  </label>
                  {!allowWalkIn && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Customer Required (Walk-in Disabled)
                    </span>
                  )}
                </div>
                <PosCustomerSelector
                  customer={customer}
                  onChange={(newCust) => setCustomer(newCust)}
                  sellerState={sellerState}
                  allowWalkInBilling={allowWalkIn}
                />
              </div>

              {/* 5. DISCOUNT + GST */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                {/* Discount Input */}
                {posSettings.allowDiscount !== false ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Tag size={13} className="text-slate-400" />
                      Discount:
                    </span>

                    <div className="flex items-center gap-1">
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10.5px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('flat')}
                          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            discountType === 'flat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                            discountType === 'percent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                          }`}
                        >
                          % Off
                        </button>
                      </div>

                      <div className="relative w-20">
                        <input
                          type="number"
                          min="0"
                          value={discountValue === 0 ? '' : discountValue}
                          onChange={(e) => {
                            const raw = parseFloat(e.target.value);
                            if (isNaN(raw) || raw <= 0) {
                              setDiscountValue(0);
                              return;
                            }
                            const maxPercent = posSettings.maxDiscountPercent || 100;
                            if (discountType === 'percent') {
                              if (raw > maxPercent) {
                                setDiscountValue(maxPercent);
                                setErrorMessage(`Maximum allowed discount is ${maxPercent}%.`);
                                setTimeout(() => setErrorMessage(null), 3000);
                              } else {
                                setDiscountValue(raw);
                              }
                            } else {
                              // Flat discount validation
                              const maxFlatAllowed = subtotal > 0 ? (subtotal * (maxPercent / 100)) : 0;
                              if (raw > subtotal) {
                                setDiscountValue(subtotal);
                                setErrorMessage('Flat discount cannot exceed cart subtotal.');
                                setTimeout(() => setErrorMessage(null), 3000);
                              } else if (raw > maxFlatAllowed && maxPercent < 100) {
                                setDiscountValue(maxFlatAllowed);
                                setErrorMessage(`Maximum flat discount allowed is ₹${maxFlatAllowed.toLocaleString('en-IN')} (${maxPercent}%).`);
                                setTimeout(() => setErrorMessage(null), 3000);
                              } else {
                                setDiscountValue(raw);
                              }
                            }
                          }}
                          placeholder="0"
                          className="w-full px-2 py-1 text-xs font-mono font-bold text-right bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Tag size={13} /> Discount:
                    </span>
                    <span className="text-[11px] italic">Disabled in POS Settings</span>
                  </div>
                )}

                {/* 6. BILLING SUMMARY */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2 font-medium text-slate-700">
                  {/* 1. Subtotal */}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* 2. Discount */}
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="flex items-center gap-1">
                      Discount {discountType === 'percent' && discountValue > 0 ? `(${discountValue}%)` : ''}
                    </span>
                    <span className="font-mono font-bold">
                      {billDiscountAmount > 0 ? (
                        `-₹${billDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        '₹0.00'
                      )}
                    </span>
                  </div>

                  {/* 3. GST / Tax */}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>
                      GST / Tax {gstEnabled ? `(${storeTaxRate}%)` : '(Disabled)'}
                      {gstEnabled && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          {pricingMode === 'inclusive' ? '(Price Inclusive)' : isInterState ? '(IGST)' : '(CGST+SGST)'}
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* 4. Grand Total */}
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 font-black text-slate-900">
                    <span className="text-sm">Grand Total</span>
                    <span className="font-mono text-xl text-blue-700 font-black">
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 7. CASH / UPI / CARD PAYMENT PANEL */}
              <div className="pt-2.5 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <PosPaymentPanel
                  grandTotal={grandTotal}
                  paymentState={paymentState}
                  onChange={(newState) => setPaymentState(newState)}
                  upiId={posSettings.upiId || settings.general?.upiId || ''}
                  storeName={settings.general?.storeName || 'ELECTRO STORE'}
                  upiDisplayName={posSettings.upiDisplayName || 'Scan to Pay via UPI'}
                  upiAppsText={posSettings.upiAppsText || 'GPay, PhonePe, Paytm, BHIM'}
                  upiInstructions={posSettings.upiInstructions}
                  upiQrCodeUrl={posSettings.upiQrCodeUrl || ''}
                  upiQrMode={posSettings.upiQrMode || 'dynamic'}
                  enableCash={posSettings.enableCash}
                  enableUpi={posSettings.enableUpi}
                  enableCard={posSettings.enableCard}
                  allowSplitPayment={posSettings.allowSplitPayment !== false}
                  requireConfirmation={posSettings.requirePaymentConfirmation}
                />
              </div>

              {/* ERROR ALERT BANNER */}
              {errorMessage && (
                <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Transaction Error</p>
                      <p className="text-[11px] text-red-700 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* 8. COMPLETE SALE BUTTON */}
              {(() => {
                const effectiveUpiId = posSettings.upiId || settings.general?.upiId || '';
                const isUpiUnconfigured = paymentState.method === 'upi' && !effectiveUpiId.trim() && !posSettings.upiQrCodeUrl?.trim();
                const isCashIncomplete = paymentState.method === 'cash' && paymentState.paymentStatus === 'paid' && paymentState.cashTendered < grandTotal;
                
                // Split calculation checks
                const splitBreakdown = paymentState.splitBreakdown || { cash: 0, upi: 0, card: 0 };
                const splitSum = (Number(splitBreakdown.cash) || 0) + (Number(splitBreakdown.upi) || 0) + (Number(splitBreakdown.card) || 0);
                const isSplitIncomplete = paymentState.method === 'split' && (grandTotal - splitSum) > 0.01;
                const isSplitExcess = paymentState.method === 'split' && (splitSum - grandTotal) > 0.01;

                const isUpiCardUnconfirmed = (paymentState.method === 'upi' || paymentState.method === 'card') && paymentState.paymentStatus === 'paid' && !paymentState.isConfirmed;
                const isPaymentFailed = paymentState.paymentStatus === 'failed';
                const isButtonDisabled = cart.length === 0 || isSubmitting || isCashIncomplete || isSplitIncomplete || isSplitExcess || isUpiCardUnconfirmed || isPaymentFailed || isUpiUnconfigured;

                return (
                  <button
                    type="button"
                    onClick={handleCompleteSale}
                    disabled={isButtonDisabled}
                    className={`w-full mt-3 py-3 px-4 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isButtonDisabled
                        ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                        : isSubmitting
                        ? 'bg-emerald-700 cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing Real Sale...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>
                          {isUpiUnconfigured
                            ? 'Configure UPI in Admin Settings'
                            : isPaymentFailed 
                            ? 'Cannot Complete: Payment Failed' 
                            : isCashIncomplete
                            ? `Enter Cash (₹${grandTotal.toLocaleString('en-IN')})`
                            : isSplitIncomplete
                            ? `Allocate Remaining ₹${(grandTotal - splitSum).toLocaleString('en-IN')}`
                            : isSplitExcess
                            ? `Allocations Exceed Grand Total`
                            : isUpiCardUnconfirmed
                            ? `Confirm ${paymentState.method.toUpperCase()} Payment`
                            : `Complete Sale • ₹${grandTotal.toLocaleString('en-IN')}`}
                        </span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </main>
      )}

      {/* Floating Bottom Cart Bar for Mobile & Small Tablets */}
      {activeTab === 'terminal' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 shadow-xl rounded-2xl bg-slate-900/95 backdrop-blur-md text-white p-3 flex items-center justify-between border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold shadow-2xs">
              <ShoppingCart size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'} in Cart
              </p>
              <p className="text-[11px] font-mono text-emerald-400 font-bold">
                Total: ₹{Math.round(grandTotal).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const cartEl = document.getElementById('pos-cart-section');
              if (cartEl) {
                cartEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-xs active:scale-95 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>View Cart</span>
            <Receipt size={14} />
          </button>
        </div>
      )}

      {/* 9. INVOICE MODAL (View, Print, Share) */}
      {completedOrder && (
        <PosInvoiceModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
          onNewSale={() => {
            setCompletedOrder(null);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};

export default AdminPOS;
