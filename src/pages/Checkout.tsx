import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useCart, useShopActions } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, updateDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { CheckCircle2, ShoppingBag, ShieldCheck, Truck, Percent, FileText, Tag, ArrowRight, AlertCircle, Sparkles, User, MapPin, Loader2, Home, Briefcase, Package } from 'lucide-react';
import { Address, ShippingSettings } from '../types';
import { AddressManager } from '../components/AddressManager';
import { InvoiceModal } from '../components/InvoiceModal';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLocation as useHyperlocalLocation } from '../context/LocationContext';
import { lookupPincode, isValidPincode, INDIAN_STATES } from '../services/pincodeService';
import { isPincodeServiceable } from '../services/indiaGeographicData';
import { isProductInStock, getProductAvailableStock, validateCartStock } from '../utils/stockUtils';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';
import { RazorpaySandboxModal } from '../components/RazorpaySandboxModal';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function Checkout() {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  const { cart, cartTotal } = useCart();
  const { removeOutOfStockItems } = useShopActions();
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();
  const { location: deliveryLocation, setLocationData, openLocationModal, selectAddress } = useHyperlocalLocation();

  const stockValidation = validateCartStock(cart);
  const hasOutOfStockItems = !stockValidation.isValid;

  const checkoutSettings = settings.checkoutSettings || {
    checkoutTitle: 'Secure Checkout',
    checkoutSubtitle: 'Review shipping destination, delivery method, and payment summary.',
    guestCheckoutEnabled: true,
    loginRequired: false,
    couponFieldEnabled: true,
    couponPlaceholder: 'Enter coupon code',
    shippingAddressFields: {
      landmarkRequired: false,
      phoneRequired: true,
      stateRequired: true,
      cityRequired: true,
    },
    showBillingAddress: true,
    sameAsShippingOption: true,
    showOrderNotes: true,
    termsAcceptanceRequired: true,
    termsText: "I agree to the Terms of Service, Privacy Policy, and GST Tax Invoicing terms.",
    termsUrl: '/terms',
    showInvoiceInfo: true,
    showGstinField: true,
    showOrderSummary: true,
    showItemImages: true,
    showShippingOptions: true,
    shippingSectionTitle: 'Delivery & Shipping Speed',
    showPaymentMethods: true,
    razorpayTitle: 'Razorpay Secure Gateway',
    razorpayDescription: 'Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking & Wallets',
    placeOrderButtonText: 'PAY VIA RAZORPAY',
    successTitle: 'Thank You for Your Order!',
    successSubtitle: 'Order Confirmed & Payment Verified',
    successMessage: "Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice.",
    successButtonText: 'Track Order Status',
  };

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const addressSectionRef = useRef<HTMLDivElement | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [gstin, setGstin] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChangeAddressClick = () => {
    if (addressSectionRef.current) {
      addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Guest Address State when not logged in
  const [guestAddress, setGuestAddress] = useState<Address>({
    fullName: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    state: 'Karnataka',
    postalCode: '',
    country: 'India',
    addressType: 'home',
    isDefault: false
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [guestPinLoading, setGuestPinLoading] = useState(false);
  const [guestPinMsg, setGuestPinMsg] = useState('');
  const guestLookupSeqRef = useRef<number>(0);
  const guestAbortControllerRef = useRef<AbortController | null>(null);
  const guestLastFetchedPinRef = useRef<string>('');

  // Sync selected address changes back to LocationContext
  const handleSelectAddress = (addr: Address) => {
    setSelectedAddress(addr);
    selectAddress({
      id: addr.id,
      city: addr.city,
      postalCode: addr.postalCode || (addr as any).zipCode,
      zipCode: (addr as any).zipCode || addr.postalCode,
      locality: addr.locality,
      street: addr.street || (addr as any).addressLine1,
      state: addr.state,
      latitude: (addr as any).latitude,
      longitude: (addr as any).longitude,
      formattedAddress: addr.formattedAddress || addr.address,
      addressName: addr.addressType === 'work' ? 'Work' : addr.addressType === 'other' ? (addr.customAddressType || 'Other') : 'Home',
      addressType: (addr.addressType as any) || 'home',
      fullName: addr.fullName,
      phone: addr.phone,
      landmark: addr.landmark
    });
  };

  // Automatically sync selected address with global active delivery location
  useEffect(() => {
    if (user && savedAddresses.length > 0) {
      if (deliveryLocation?.addressId) {
        const matched = savedAddresses.find(a => a.id === deliveryLocation.addressId);
        if (matched) {
          setSelectedAddress(matched);
          return;
        }
      }
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      if (defaultAddr && (!selectedAddress || !savedAddresses.some(a => a.id === selectedAddress.id))) {
        setSelectedAddress(defaultAddr);
        if (!deliveryLocation?.addressId) {
          handleSelectAddress(defaultAddr);
        }
      }
    }
  }, [user, savedAddresses, deliveryLocation?.addressId]);

  // Pre-fill guest address from global deliveryLocation if guest
  useEffect(() => {
    if (!user && deliveryLocation?.pincode && deliveryLocation.pincode.length === 6 && !guestAddress.postalCode) {
      const pin = deliveryLocation.pincode;
      const initialGuestAddr = {
        ...guestAddress,
        postalCode: pin,
        zipCode: pin,
        city: deliveryLocation.city || guestAddress.city,
        street: deliveryLocation.formattedAddress || deliveryLocation.area || guestAddress.street,
        fullName: deliveryLocation.receiverName || guestAddress.fullName,
        phone: deliveryLocation.phone || guestAddress.phone
      };
      setGuestAddress(initialGuestAddr);
      setSelectedAddress(initialGuestAddr);
      fetchGuestLocationByPincode(pin);
    }
  }, [user, deliveryLocation?.pincode]);

  const fetchGuestLocationByPincode = async (rawVal: string) => {
    if (!rawVal || rawVal.length !== 6 || !isValidPincode(rawVal)) {
      setGuestPinMsg('PIN code not found. Please check the PIN code.');
      return;
    }

    if (guestAbortControllerRef.current) {
      guestAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    guestAbortControllerRef.current = controller;
    const currentSeq = ++guestLookupSeqRef.current;

    setGuestPinLoading(true);
    setGuestPinMsg('Looking up address details...');

    try {
      const res = await lookupPincode(rawVal, controller.signal);
      if (currentSeq !== guestLookupSeqRef.current) return;

      if (res.success && res.state) {
        guestLastFetchedPinRef.current = rawVal;
        const districtCity = res.district || res.city || '';
        const coverage = isPincodeServiceable(rawVal, settings.shipping?.deliveryCoverage);
        
        if (!coverage.serviceable) {
          setGuestPinMsg('Sorry, delivery is currently unavailable for this PIN code.');
        } else {
          setGuestPinMsg(`✓ Delivering to ${districtCity}, ${res.state} (${coverage.deliveryType} Delivery • Est. ${coverage.transitDays}d)`);
        }

        const autoFilled = {
          ...guestAddress,
          state: res.state || guestAddress.state || 'Karnataka',
          city: districtCity,
          district: res.district || districtCity
        };
        setGuestAddress(autoFilled);
        setSelectedAddress(autoFilled);
      } else if (res.notFound) {
        setGuestPinMsg('Please enter a valid 6-digit PIN code.');
      } else {
        setGuestPinMsg('Please enter a valid 6-digit PIN code.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (currentSeq === guestLookupSeqRef.current) {
        setGuestPinMsg('Please enter a valid 6-digit PIN code.');
      }
    } finally {
      if (currentSeq === guestLookupSeqRef.current) {
        setGuestPinLoading(false);
      }
    }
  };

  const handleGuestPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    const updated = { ...guestAddress, postalCode: rawVal, zipCode: rawVal };
    setGuestAddress(updated);
    setSelectedAddress(updated);

    if (rawVal.length < 6) {
      setGuestPinMsg('');
      return;
    }

    if (rawVal.length === 6 && isValidPincode(rawVal)) {
      fetchGuestLocationByPincode(rawVal);
    } else {
      setGuestPinMsg('Please enter a valid 6-digit PIN code.');
    }
  };

  const handleGuestPinBlur = () => {
    const rawVal = (guestAddress.postalCode || '').trim().replace(/\D/g, '');
    if (rawVal.length === 6 && isValidPincode(rawVal) && guestLastFetchedPinRef.current !== rawVal && !guestPinLoading) {
      fetchGuestLocationByPincode(rawVal);
    }
  };

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    shippingEnabled: true,
    freeShippingEnabled: true,
    freeShippingThreshold: 500,
    defaultShippingCharge: 50,
    minDeliveryDays: 3,
    maxDeliveryDays: 5
  });

  const paymentConfig = settings.payments || {
    onlinePaymentEnabled: true,
    codEnabled: true,
    codExtraCharge: 0,
    paymentMethods: { upi: true, cards: true, netbanking: true, wallets: true },
    environment: 'test',
  };

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>(
    paymentConfig.onlinePaymentEnabled !== false ? 'online' : 'cod'
  );

  const selectedPin = (selectedAddress?.postalCode || (selectedAddress as any)?.zipCode || '').trim();
  const pinCoverage = useMemo(() => {
    if (!selectedPin || selectedPin.length !== 6) return null;
    return isPincodeServiceable(selectedPin, settings.shipping?.deliveryCoverage);
  }, [selectedPin, settings.shipping?.deliveryCoverage]);

  const isPinUnserviceable = Boolean(selectedPin && pinCoverage && !pinCoverage.serviceable);
  const isCodBlockedForPin = Boolean(pinCoverage && pinCoverage.codAvailable === false);

  // If COD is blocked for this PIN, automatically fallback to online payment (unless PIN is completely unserviceable)
  useEffect(() => {
    if (isCodBlockedForPin && paymentMethod === 'cod' && paymentConfig.onlinePaymentEnabled !== false && !isPinUnserviceable) {
      setPaymentMethod('online');
    }
  }, [isCodBlockedForPin, paymentMethod, paymentConfig.onlinePaymentEnabled, isPinUnserviceable]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sandboxModalState, setSandboxModalState] = useState<{
    isOpen: boolean;
    orderId: string;
    amount: number;
    invoiceNumber: string;
  } | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Sync settings with priority to SiteSettingsContext
  useEffect(() => {
    if (settings.shipping) {
      setShippingSettings({
        shippingEnabled: settings.shipping.shippingEnabled !== false,
        freeShippingEnabled: settings.shipping.freeShippingEnabled !== false,
        freeShippingThreshold: settings.shipping.freeShippingThreshold ?? 500,
        defaultShippingCharge: settings.shipping.defaultShippingCharge ?? 50,
        minDeliveryDays: settings.shipping.minDeliveryDays ?? 3,
        maxDeliveryDays: settings.shipping.maxDeliveryDays ?? 5,
      });
      return;
    }
    // Fallback to legacy settings/shipping doc
    async function fetchSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'shipping'));
        if (snap.exists()) {
          setShippingSettings(snap.data() as ShippingSettings);
        }
      } catch (err) {
        console.warn('Using default shipping settings:', err);
      }
    }
    fetchSettings();
  }, [settings.shipping]);

  // Auto-apply coupon passed from Cart page URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCoupon = urlParams.get('coupon');
    if (paramCoupon && !appliedCoupon && cartTotal > 0) {
      setCouponCode(paramCoupon.toUpperCase());
      (async () => {
        try {
          const cleanCode = paramCoupon.trim().toUpperCase();
          const snap = await getDoc(doc(db, 'coupons', cleanCode));
          if (snap.exists()) {
            const cData = snap.data();
            if (cData.isActive !== false && (!cData.minPurchase || cartTotal >= cData.minPurchase)) {
              setAppliedCoupon({
                code: cleanCode,
                discountType: cData.discountType || 'percentage',
                discountValue: cData.discountValue || 10,
                maxDiscount: cData.maxDiscount,
                minPurchase: cData.minPurchase
              });
            }
          }
        } catch (e) {
          console.error('Error auto-applying coupon from URL:', e);
        }
      })();
    }
  }, [cartTotal]);

  if (cart.length === 0 && !completedOrder) {
    return <Navigate to="/cart" replace />;
  }

  // Store status
  const isStoreClosed = settings.general?.storeStatus === 'closed';
  const storeClosedMsg = settings.notifications?.storeClosedMsg || 'Our store is temporarily closed for orders. Please check back soon.';

  // Tax config from persisted SiteSettings
  const taxConfig = {
    gstEnabled: settings.tax?.gstEnabled ?? true,
    taxRate: settings.tax?.taxRate ?? 18,
    invoicePrefix: settings.tax?.invoicePrefix || 'EST-2026-',
    gstin: settings.tax?.gstin || settings.contact?.gstin || '',
  };

  const isGstEnabled = taxConfig.gstEnabled !== false && Number(taxConfig.taxRate ?? 18) > 0;
  const configuredGstRate = isGstEnabled ? Number(taxConfig.taxRate ?? 18) : 0;

  // Calculate Discounts, Tax and Shipping
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage' || appliedCoupon.type === 'percentage') {
      const val = appliedCoupon.discountValue ?? appliedCoupon.value ?? 0;
      discountAmount = Math.round((cartTotal * (val / 100)) * 100) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else {
      const val = appliedCoupon.discountValue ?? appliedCoupon.value ?? 0;
      discountAmount = Math.min(val, cartTotal);
    }
  }

  const taxableAmount = Math.max(0, cartTotal - discountAmount);
  const gstRate = isGstEnabled ? configuredGstRate / 100 : 0;
  const calculatedTax = isGstEnabled ? Math.round((taxableAmount * gstRate) * 100) / 100 : 0;

  const isFreeShipping = shippingSettings.freeShippingEnabled && taxableAmount >= shippingSettings.freeShippingThreshold;
  const shippingCharge = isFreeShipping || !shippingSettings.shippingEnabled ? 0 : shippingSettings.defaultShippingCharge;
  const codFee = paymentMethod === 'cod' ? (paymentConfig.codExtraCharge || 0) : 0;
  const grandTotal = Math.round((taxableAmount + calculatedTax + shippingCharge + codFee) * 100) / 100;

  const freeShippingDifference = Math.max(0, shippingSettings.freeShippingThreshold - taxableAmount);
  const freeShippingProgress = Math.min(100, Math.round((taxableAmount / shippingSettings.freeShippingThreshold) * 100));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const cleanCode = couponCode.trim().toUpperCase();
      // First check server coupon validator
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, cartTotal })
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        // Fall back to Firestore coupon check
        const snap = await getDoc(doc(db, 'coupons', cleanCode));
        if (snap.exists()) {
          const cData = snap.data();
          if (cData.minPurchase && cartTotal < cData.minPurchase) {
            setCouponError(`Minimum order value of ₹${Number(cData.minPurchase || 0).toLocaleString()} required.`);
            setAppliedCoupon(null);
          } else {
            setAppliedCoupon({
              code: cleanCode,
              discountType: cData.discountType || 'percentage',
              discountValue: cData.discountValue || 10,
              maxDiscount: cData.maxDiscount
            });
            setCouponError('');
          }
        } else {
          setCouponError('Invalid or expired coupon code.');
          setAppliedCoupon(null);
        }
      }
    } catch (err: any) {
      setCouponError('Failed to validate coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Live cart and stock validator before placing order
  const validateCheckoutBeforeOrder = async (): Promise<{ isValid: boolean; error?: string; orderItems?: any[] }> => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return { isValid: false, error: 'Please sign in to place your order.' };
    }

    if (!selectedAddress) {
      return { isValid: false, error: 'Please add or select a delivery address before placing your order.' };
    }

    const destPin = (selectedAddress.postalCode || (selectedAddress as any).zipCode || '').trim();
    if (!destPin || destPin.length !== 6) {
      return { isValid: false, error: 'Please enter a valid 6-digit PIN code.' };
    }

    const coverageCheck = isPincodeServiceable(destPin, settings.shipping?.deliveryCoverage);
    if (!coverageCheck.serviceable) {
      return { isValid: false, error: `Sorry, delivery is currently unavailable for PIN code ${destPin}.` };
    }

    if (paymentMethod === 'cod' && coverageCheck.codAvailable === false) {
      return { isValid: false, error: 'Cash on Delivery is unavailable for this PIN code. Please select Online Payment.' };
    }

    if (isStoreClosed) {
      return { isValid: false, error: 'Our store is currently closed for new orders. Please check back soon.' };
    }

    if (hasOutOfStockItems) {
      return { isValid: false, error: 'Cannot place order: One or more items in your cart are out of stock. Please remove them before proceeding.' };
    }

    if (checkoutSettings.termsAcceptanceRequired !== false && !termsAccepted) {
      return { isValid: false, error: 'Please accept the Terms of Service & Privacy Policy to proceed.' };
    }

    // Live parallel Firestore stock verification against realtime database
    try {
      const stockDocs = await Promise.all(
        cart.map(item => getDoc(doc(db, 'products', item.product.id)).catch(stkErr => {
          console.warn('Real-time stock check warning:', stkErr);
          return null;
        }))
      );

      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const prodDoc = stockDocs[i];
        if (prodDoc && prodDoc.exists()) {
          const pData = prodDoc.data();
          const stock = typeof pData.stock === 'number' ? pData.stock : (pData.stock !== undefined ? Number(pData.stock) : undefined);
          const inStock = pData.inStock !== false && (stock === undefined || stock > 0);

          if (!inStock || (stock !== undefined && stock <= 0)) {
            return { isValid: false, error: `Cannot place order: "${pData.name || item.product.name}" is out of stock and cannot be ordered.` };
          }

          if (stock !== undefined && item.quantity > stock) {
            return { isValid: false, error: `Cannot place order: Insufficient stock for "${pData.name || item.product.name}". Only ${stock} units available, but ${item.quantity} in your cart.` };
          }
        }
      }
    } catch (stkCheckErr: any) {
      console.warn('Stock pre-check note:', stkCheckErr);
    }

    const orderItems = cart.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      image: i.product.image || '',
      quantity: i.quantity,
      unitPrice: i.product.price,
      totalPrice: i.product.price * i.quantity,
      sku: i.product.sku || `SKU-${i.product.id.slice(0, 6).toUpperCase()}`,
      hsnCode: i.product.hsnCode || '8517',
      taxRate: taxConfig.taxRate || 18
    }));

    return { isValid: true, orderItems };
  };

  // Helper to clear user cart in Firestore after confirmed order
  const clearUserCart = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      cart.forEach(item => {
        const itemRef = doc(db, 'users', user.uid, 'cart', item.product.id);
        batch.delete(itemRef);
      });
      await batch.commit();
    } catch (cartErr) {
      console.warn('Cart clear note:', cartErr);
    }
  };

  // 1. CASH ON DELIVERY (COD) ORDER FLOW
  const handleCodOrder = async () => {
    if (isProcessing) return;
    setPaymentError(null);

    const validation = await validateCheckoutBeforeOrder();
    if (!validation.isValid || !validation.orderItems) {
      setPaymentError(validation.error || 'Please check your checkout details.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Placing Cash on Delivery Order...');

    try {
      const codRes = await fetch('/api/orders/create-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.uid,
          items: validation.orderItems,
          shippingAddress: selectedAddress,
          billingAddress: sameAsShipping ? selectedAddress : billingAddress,
          couponCode: appliedCoupon?.code || couponCode.trim(),
          orderNotes,
          gstin
        })
      });

      const codData = await codRes.json();

      if (!codRes.ok || !codData.success) {
        throw new Error(codData.error || 'Failed to place COD order. Please try again.');
      }

      const confirmedOrder = codData.order || { id: codData.orderId };

      // Clear user cart only after confirmed order creation
      await clearUserCart();

      // Dispatch customer in-app confirmation notification
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: user!.uid,
          orderId: confirmedOrder.id || codData.orderId,
          orderNumber: confirmedOrder.invoiceNumber || `COD-${Date.now().toString().slice(-6)}`,
          type: 'order',
          channel: 'in_app',
          recipient: selectedAddress?.email || user!.email || 'customer',
          subject: `COD Order Confirmed: #${confirmedOrder.invoiceNumber || codData.orderId}`,
          title: `Order Confirmed (#${confirmedOrder.invoiceNumber || codData.orderId})`,
          message: `Your Cash on Delivery order of ₹${Number(confirmedOrder.grandTotal || grandTotal || 0).toLocaleString('en-IN')} has been confirmed! Payment is due upon package delivery.`,
          templateId: 'order_confirmation',
          status: 'sent',
          provider: 'firestore_realtime',
          attemptCount: 1,
          read: false,
          createdAt: serverTimestamp(),
          sentAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (notifErr) {
        console.warn('Notification dispatch note:', notifErr);
      }

      setCompletedOrder(confirmedOrder);
      setIsProcessing(false);

      // Navigate immediately to the Order Confirmed page with full state
      navigate(`/orders/${confirmedOrder.id || codData.orderId}`, {
        replace: true,
        state: {
          newlyPlaced: true,
          orderId: confirmedOrder.id || codData.orderId,
          paymentMethod: 'cod',
          invoiceNumber: confirmedOrder.invoiceNumber
        }
      });

    } catch (err: any) {
      console.error('COD order creation error:', err);
      setPaymentError(err.message || 'Failed to place COD order. Please check your connection and try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // 2. ONLINE RAZORPAY PAYMENT FLOW
  const handleOnlinePayment = async () => {
    if (isProcessing) return;
    setPaymentError(null);

    const validation = await validateCheckoutBeforeOrder();
    if (!validation.isValid || !validation.orderItems) {
      setPaymentError(validation.error || 'Please check your checkout details.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Preparing secure payment gateway...');

    try {
      const idToken = await getIdToken();

      // Initiate Razorpay Order on authoritative backend (DO NOT create confirmed order yet)
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          items: validation.orderItems,
          subtotal: cartTotal,
          discount: discountAmount,
          tax: calculatedTax,
          shippingCharge,
          grandTotal,
          shippingAddress: selectedAddress,
          billingAddress: sameAsShipping ? selectedAddress : billingAddress,
          couponCode: appliedCoupon?.code || couponCode.trim(),
          paymentMethod: 'online'
        })
      });

      const orderInitData = await response.json();

      if (!response.ok || !orderInitData.id) {
        throw new Error(orderInitData.error || 'Unable to initiate online payment. Please try again.');
      }

      setProcessingStatus('Opening Razorpay Checkout...');

      // Load Razorpay JS SDK
      const rzpLoaded = await loadRazorpay();

      const rzpKey = orderInitData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';
      const isPlaceholderKey = !rzpKey || rzpKey === 'rzp_test_placeholder' || rzpKey === 'rzp_test_electrostore';

      // Function to verify and finalize order after successful payment response
      const finalizeOnlineOrder = async (paymentRes: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setProcessingStatus('Verifying payment & confirming order...');

        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: paymentRes.razorpay_payment_id,
              razorpay_order_id: paymentRes.razorpay_order_id || orderInitData.id,
              razorpay_signature: paymentRes.razorpay_signature,
              userId: user!.uid,
              items: validation.orderItems,
              shippingAddress: selectedAddress,
              billingAddress: sameAsShipping ? selectedAddress : billingAddress,
              couponCode: appliedCoupon?.code || couponCode.trim(),
              orderNotes,
              gstin
            })
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed. Please contact support if your account was charged.');
          }

          const confirmedOrder = verifyData.order || { id: verifyData.orderId };

          // Clear user cart only after payment is verified and order confirmed
          await clearUserCart();

          setCompletedOrder(confirmedOrder);
          setIsProcessing(false);
          setProcessingStatus('');

          // Navigate immediately to the Order Confirmed page
          navigate(`/orders/${confirmedOrder.id || verifyData.orderId}`, {
            replace: true,
            state: {
              newlyPlaced: true,
              orderId: confirmedOrder.id || verifyData.orderId,
              paymentMethod: 'online',
              invoiceNumber: confirmedOrder.invoiceNumber
            }
          });

        } catch (verifyErr: any) {
          console.error('Payment verification error:', verifyErr);
          setPaymentError(verifyErr.message || 'Payment verification failed. Please contact support if your account was debited.');
          setIsProcessing(false);
          setProcessingStatus('');
        }
      };

      // If Razorpay SDK loaded and valid key is present, launch official Razorpay Checkout
      if (rzpLoaded && typeof (window as any).Razorpay === 'function' && !isPlaceholderKey) {
        try {
          const options = {
            key: rzpKey,
            amount: orderInitData.amount,
            currency: orderInitData.currency || 'INR',
            name: storeName,
            description: `Order Payment (${orderInitData.invoiceNumber || 'EST-ORD'})`,
            order_id: orderInitData.id.startsWith('order_') && !orderInitData.id.startsWith('order_test_') ? orderInitData.id : undefined,
            handler: async function (paymentRes: any) {
              await finalizeOnlineOrder({
                razorpay_payment_id: paymentRes.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_order_id: paymentRes.razorpay_order_id || orderInitData.id,
                razorpay_signature: paymentRes.razorpay_signature || 'sig_verified'
              });
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
                setProcessingStatus('');
                setPaymentError('Payment was not completed. Your order has not been placed.');
              }
            },
            prefill: {
              name: selectedAddress?.fullName || user?.displayName || '',
              email: user?.email || selectedAddress?.email || '',
              contact: selectedAddress?.phone || ''
            },
            theme: {
              color: "#2563eb"
            }
          };

          const rzpInstance = new (window as any).Razorpay(options);

          rzpInstance.on('payment.failed', function (failResp: any) {
            setIsProcessing(false);
            setProcessingStatus('');
            setPaymentError(`Payment was unsuccessful: ${failResp?.error?.description || 'Transaction declined'}. Your order has not been placed.`);
          });

          rzpInstance.open();
          return;
        } catch (rzpOpenErr) {
          console.warn('Razorpay SDK modal open notice, fallback to secure sandbox modal:', rzpOpenErr);
        }
      }

      // Fallback / Sandbox Interactive Gateway Modal
      setSandboxModalState({
        isOpen: true,
        orderId: orderInitData.id,
        amount: orderInitData.grandTotal || grandTotal,
        invoiceNumber: orderInitData.invoiceNumber || 'EST-ORD'
      });
      setProcessingStatus('Awaiting payment authorization in Razorpay gateway...');

    } catch (err: any) {
      console.error('Online order initiation error:', err);
      setPaymentError(err.message || 'Unable to open payment. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Main Action Router
  const handlePlaceOrder = () => {
    if (paymentMethod === 'cod') {
      handleCodOrder();
    } else {
      handleOnlinePayment();
    }
  };

  // Order Success Screen
  if (completedOrder) {
    return (
      <div className="container mx-auto px-3 sm:px-4 pt-4 pb-16 text-center max-w-3xl">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 ring-8 ring-emerald-50/50">
            <CheckCircle2 size={48} />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
            {checkoutSettings.successSubtitle || 'Order Confirmed & Payment Verified'}
          </span>
          <h2 className="text-3xl font-black text-slate-900 mb-2">
            {checkoutSettings.successTitle || 'Thank You for Your Order!'}
          </h2>
          <p className="text-slate-500 text-sm max-w-md mb-8">
            {checkoutSettings.successMessage && !checkoutSettings.successMessage.includes('GST')
              ? checkoutSettings.successMessage
              : (isGstEnabled
                  ? (checkoutSettings.successMessage || "Your payment was successfully processed. We've dispatched your order confirmation and official GST tax invoice.")
                  : "Your payment was successfully processed. We've dispatched your order confirmation and invoice receipt.")}
          </p>

          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Invoice Number</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{completedOrder.invoiceNumber || 'EST-2026-CONFIRMED'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">{isGstEnabled ? 'Total Paid (Inc. GST)' : 'Total Paid'}</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">₹{Number(completedOrder.grandTotal || grandTotal || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Delivery To</p>
              <p className="font-semibold text-slate-800 mt-0.5">{completedOrder.shippingAddress?.fullName}</p>
              <p className="text-slate-500">{completedOrder.shippingAddress?.city}, {completedOrder.shippingAddress?.state}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase text-[10px]">Estimated Delivery</p>
              <p className="font-semibold text-slate-800 mt-0.5">{completedOrder.estimatedDelivery || '3 - 5 Business Days'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
            >
              <FileText size={18} /> {isGstEnabled ? 'View / Print GST Invoice' : 'View / Print Invoice'}
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              {checkoutSettings.successButtonText || 'Track Order Status'} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {showInvoiceModal && (
          <InvoiceModal
            order={completedOrder}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}
      </div>
    );
  }

  // Check login requirement
  if (checkoutSettings.loginRequired && !user) {
    return (
      <div className="container mx-auto px-3 sm:px-4 pt-4 pb-20 text-center max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Required for Checkout</h2>
          <p className="text-slate-500 text-sm mb-6">Please sign in to your account or register to complete your purchase securely.</p>
          <button
            onClick={() => navigate('/login?redirect=/checkout')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-7xl pt-3 pb-28 lg:pb-10">
      {/* 1. CHECKOUT HEADER & PROGRESS INDICATOR */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-blue-600 shrink-0" />
              <span>Secure Checkout</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your delivery address, delivery option and payment method.
            </p>
          </div>

          {/* Compact Step Progress Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-bold shrink-0 self-start sm:self-auto py-1">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              !selectedAddress || isPinUnserviceable
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
              <span>Address</span>
            </div>
            <span className="text-slate-300 font-normal">→</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              !isPinUnserviceable && selectedAddress
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 bg-slate-100'
            }`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
              <span>Delivery</span>
            </div>
            <span className="text-slate-300 font-normal">→</span>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              !isPinUnserviceable && selectedAddress
                ? 'text-blue-700 bg-blue-50 border border-blue-200'
                : 'text-slate-400 bg-slate-100'
            }`}>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
              <span>Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Addresses, Delivery & Payment */}
        <div className="flex-1 w-full space-y-5">
          
          {/* 2. FREE DELIVERY / BENEFIT BANNER */}
          {!isPinUnserviceable && shippingSettings.freeShippingEnabled && (
            <div className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-3 ${
              isFreeShipping
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-blue-50/80 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">🚚</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate">
                    {isFreeShipping ? 'FREE delivery unlocked' : `Add ₹${Number(freeShippingDifference || 0).toLocaleString()} more for FREE delivery`}
                  </p>
                  <p className="text-[11px] opacity-85 truncate">
                    {isFreeShipping
                      ? 'Your order qualifies for free standard delivery.'
                      : `Orders above ₹${shippingSettings.freeShippingThreshold} qualify for free delivery.`}
                  </p>
                </div>
              </div>
              {!isFreeShipping && (
                <div className="w-20 sm:w-24 shrink-0 text-right">
                  <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-blue-700 mt-0.5">{freeShippingProgress}%</p>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Address Selection */}
          <div ref={addressSectionRef} className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={17} className="text-blue-600 shrink-0" /> Shipping Address
                </h3>
                {selectedAddress && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deliver to <strong className="text-slate-800">{selectedAddress.fullName || 'Customer'}</strong> · <span className="font-mono">{selectedPin || ''}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={openLocationModal}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2.5 py-1 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Change Location
              </button>
            </div>

            {user ? (
              <AddressManager
                userId={user.uid}
                selectedAddressId={selectedAddress?.id || deliveryLocation?.addressId}
                onSelectAddress={handleSelectAddress}
                selectable={true}
                compactCheckoutMode={true}
                onAddressesLoaded={(list) => setSavedAddresses(list)}
              />
            ) : (
              /* Guest Checkout Address Form */
              <div className="space-y-4 text-xs">
                {/* 1. CUSTOMER INFORMATION */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <User size={14} className="text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs tracking-tight">Customer information</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Full Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={guestAddress.fullName}
                        onChange={(e) => {
                          const updated = { ...guestAddress, fullName: e.target.value };
                          setGuestAddress(updated);
                          setSelectedAddress(updated);
                        }}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-[11px] font-bold">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={guestAddress.phone}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                            const updated = { ...guestAddress, phone: clean };
                            setGuestAddress(updated);
                            setSelectedAddress(updated);
                          }}
                          placeholder="Enter mobile number"
                          className="w-full pl-11 pr-3 py-2 border border-slate-300 rounded-xl font-mono outline-none focus:border-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SHIPPING ADDRESS */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <MapPin size={14} className="text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs tracking-tight">Shipping Address</h4>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={guestAddress.postalCode}
                        onChange={handleGuestPinChange}
                        onBlur={handleGuestPinBlur}
                        placeholder="Enter pincode"
                        className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl font-mono text-xs font-bold tracking-wider outline-none focus:border-blue-600 bg-white shadow-2xs"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {guestPinLoading && (
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                        )}
                      </div>
                    </div>
                    {guestPinMsg && (
                      <p className={`text-[11px] mt-1 font-medium ${
                        guestPinLoading ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {guestPinMsg}
                      </p>
                    )}
                  </div>

                  {/* Flat, House no. * */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Flat, House no. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestAddress.street}
                      onChange={(e) => {
                        const updated = { ...guestAddress, street: e.target.value };
                        setGuestAddress(updated);
                        setSelectedAddress(updated);
                      }}
                      placeholder="Enter flat, house no., building name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white text-xs shadow-2xs"
                    />
                  </div>

                  {/* Apartment, Area, Sector, Village * */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Apartment, Area, Sector, Village <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestAddress.addressLine2 || guestAddress.locality || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { 
                          ...guestAddress, 
                          addressLine2: val,
                          locality: val 
                        };
                        setGuestAddress(updated);
                        setSelectedAddress(updated);
                      }}
                      placeholder="Enter area, street, or landmark"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white text-xs shadow-2xs"
                    />
                  </div>

                  {/* City * and State * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={guestAddress.city}
                        onChange={(e) => {
                          const updated = { ...guestAddress, city: e.target.value };
                          setGuestAddress(updated);
                          setSelectedAddress(updated);
                        }}
                        placeholder="Enter city"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white text-xs shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={guestAddress.state || 'Karnataka'}
                        onChange={(e) => {
                          const updated = { ...guestAddress, state: e.target.value };
                          setGuestAddress(updated);
                          setSelectedAddress(updated);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:border-blue-600 bg-white text-xs shadow-2xs cursor-pointer"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address Type */}
                  <div className="pt-1">
                    <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                      Address Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                      {[
                        { id: 'home', label: 'Home', icon: <Home size={15} /> },
                        { id: 'work', label: 'Work', icon: <Briefcase size={15} /> }
                      ].map((item) => {
                        const isSelected = (guestAddress.addressType || 'home') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const updated = { ...guestAddress, addressType: item.id as any };
                              setGuestAddress(updated);
                              setSelectedAddress(updated);
                            }}
                            className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className={isSelected ? 'text-blue-600' : 'text-slate-500'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Serviceability Banner for Selected Address */}
            {isPinUnserviceable && (
              <div className="mt-3.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-rose-900">Delivery unavailable</h4>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      Sorry, we currently don't deliver to PIN <strong className="font-mono font-bold text-rose-900">{selectedPin}</strong>.
                    </p>
                  </div>
                </div>
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={handleChangeAddressClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <MapPin size={12} />
                    <span>Change Delivery Address</span>
                  </button>
                </div>
              </div>
            )}

            {!isPinUnserviceable && selectedPin && pinCoverage && pinCoverage.serviceable && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Delivering to PIN <strong className="font-mono font-bold">{selectedPin}</strong> · Standard Delivery · Estimated {pinCoverage.transitDays || shippingSettings.minDeliveryDays} days</span>
                </div>
                {pinCoverage.codAvailable === false && (
                  <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded shrink-0">
                    Prepaid Only
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Delivery Speed & Carrier Info - HIDE when unserviceable */}
          {!isPinUnserviceable && checkoutSettings.showShippingOptions !== false && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Truck size={17} className="text-blue-600" />
                <span>{checkoutSettings.shippingSectionTitle || 'Delivery'}</span>
              </h3>
              
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚚</span>
                  <div>
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">Standard Delivery</p>
                    <p className="text-[11px] text-slate-500">
                      Estimated delivery: <strong>{shippingSettings.minDeliveryDays}–{shippingSettings.maxDeliveryDays} business days</strong>
                    </p>
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  {shippingCharge === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingCharge}`}
                </span>
              </div>
            </div>
          )}

          {/* Section 3: Secure Payment Gateways - HIDE completely when unserviceable */}
          {!isPinUnserviceable && checkoutSettings.showPaymentMethods !== false && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck size={17} className="text-blue-600" />
                <span>Payment Method</span>
              </h3>

              <div className="space-y-2.5">
                {/* Online Payment Option */}
                {paymentConfig.onlinePaymentEnabled !== false && (
                  <label
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3.5 rounded-xl border-2 block transition-all cursor-pointer ${
                      paymentMethod === 'online'
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            Online Payment
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            UPI · Cards · NetBanking · Wallets
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Razorpay Secure Checkout · Instant confirmation
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">
                        Recommended
                      </span>
                    </div>
                  </label>
                )}

                {/* Cash on Delivery Option */}
                {paymentConfig.codEnabled !== false && !isCodBlockedForPin && (
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-xl border-2 block transition-all cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            Cash on Delivery
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pay when your order is delivered
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                        {paymentConfig.codExtraCharge > 0 ? `+₹${paymentConfig.codExtraCharge} COD Fee` : 'Free COD'}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Order Summary & Action */}
        {checkoutSettings.showOrderSummary !== false && (
          <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-20">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
              
              {/* Order Summary Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Package size={17} className="text-blue-600" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Items List (Compact) */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => {
                  const itemInStock = isProductInStock(item.product);
                  const availableStock = getProductAvailableStock(item.product);
                  const isOutOfStock = !itemInStock || availableStock <= 0;

                  return (
                    <div key={item.product.id} className={`flex items-center gap-3 text-xs ${isOutOfStock ? 'bg-rose-50/70 p-2 rounded-xl border border-rose-200' : ''}`}>
                      {checkoutSettings.showItemImages !== false && (
                        <div className="w-12 h-12 bg-slate-100 rounded-lg p-0 border border-slate-200/90 shrink-0 flex items-center justify-center relative overflow-hidden">
                          {(() => {
                            const optCheckImg = getOptimizedImageUrl(item.product.image, { width: 120, quality: 80 });
                            if (optCheckImg) {
                              return (
                                <img 
                                  src={optCheckImg} 
                                  alt={item.product.name} 
                                  loading="lazy"
                                  decoding="async"
                                  width={48}
                                  height={48}
                                  referrerPolicy="no-referrer" 
                                  className={`w-full h-full object-cover mix-blend-multiply ${isOutOfStock ? 'opacity-40 grayscale' : ''}`} 
                                />
                              );
                            }
                            return <ShoppingBag size={14} className="text-slate-300" />;
                          })()}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                              <span className="text-[7px] font-black text-white uppercase text-center leading-tight">Out</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                        {isOutOfStock ? (
                          <span className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 mt-0.5">
                            <AlertCircle size={10} /> OUT OF STOCK
                          </span>
                        ) : (
                          <p className="text-slate-400">Qty: {item.quantity} × ₹{Number(item.product?.price || 0).toLocaleString()}</p>
                        )}
                      </div>
                      <p className={`font-bold ${isOutOfStock ? 'line-through text-slate-400' : 'text-slate-900'}`}>₹{Number(Number(item.product?.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</p>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section (Compact) */}
              {checkoutSettings.couponFieldEnabled !== false && (
                <div className="pt-2 border-t border-slate-100">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={checkoutSettings.couponPlaceholder || "Enter coupon code"}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono uppercase outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </form>

                  {appliedCoupon && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700 flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag size={12} /> Applied: {appliedCoupon.code} (-₹{Number(discountAmount || 0).toLocaleString()})
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {couponError}
                    </p>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Items Gross Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{Number(cartTotal || 0).toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount:</span>
                    <span>-₹{Number(discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                {/* Tax Row: Only rendered when GST is enabled, completely omitted when GST is disabled */}
                {isGstEnabled && checkoutSettings.showInvoiceInfo !== false && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Estimated GST Tax ({configuredGstRate}%):
                    </span>
                    <span className="font-semibold text-slate-900">
                      ₹{Number(calculatedTax || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Handling:</span>
                  <span className="font-semibold text-slate-900">
                    {shippingCharge === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingCharge}`}
                  </span>
                </div>

                {paymentMethod === 'cod' && codFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cash on Delivery Handling Fee:</span>
                    <span className="font-semibold text-slate-900">₹{codFee}</span>
                  </div>
                )}

                <div className="border-t-2 border-slate-900 pt-2.5 mt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Payable:</span>
                  <span className="text-xl font-black text-blue-600">₹{Number(grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Store Closed Warning */}
              {isStoreClosed && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Notice: </strong>{storeClosedMsg}
                </div>
              )}

              {/* Delivery Unserviceable Warning */}
              {isPinUnserviceable && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-900">
                  <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Delivery unavailable for PIN {selectedPin}</strong>
                    <span className="text-[11px] text-rose-700 block mt-0.5">
                      This address cannot be delivered to. Please select or add a different delivery address to continue.
                    </span>
                  </div>
                </div>
              )}

              {/* Out of Stock Warning */}
              {hasOutOfStockItems && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-xs text-rose-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Items Unavailable</strong>
                      <span className="text-[11px] text-rose-700">
                        One or more items in your cart are currently out of stock. You cannot complete this purchase until they are removed.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => removeOutOfStockItems()}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove Out of Stock Items
                    </button>
                    <Link
                      to="/cart"
                      className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
                    >
                      Go to Cart
                    </Link>
                  </div>
                </div>
              )}

              {/* Payment Error / Cancellation Notice */}
              {paymentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2 text-xs text-rose-900 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Checkout Notice</strong>
                      <span className="text-[11px] text-rose-700 block mt-0.5">{paymentError}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentError(null)}
                    className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Terms Checkbox - HIDE when unserviceable */}
              {!isPinUnserviceable && checkoutSettings.termsAcceptanceRequired !== false && (
                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>
                    {isGstEnabled
                      ? (checkoutSettings.termsText || 'I agree to the Terms of Service, Privacy Policy, and GST Tax Invoicing terms.')
                      : (checkoutSettings.termsText
                          ? checkoutSettings.termsText.replace(/,\s*and\s+GST\s+Tax\s+Invoicing\s+terms/i, ' and applicable terms')
                          : 'I agree to the Terms of Service, Privacy Policy and applicable terms.')}
                  </span>
                </label>
              )}

              {/* Place Order or Change Delivery Address CTA */}
              {isPinUnserviceable ? (
                <button
                  type="button"
                  onClick={handleChangeAddressClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin size={16} />
                  <span>{user && savedAddresses.length > 1 ? 'Select Another Address' : 'Change Delivery Address'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing || isStoreClosed || (checkoutSettings.termsAcceptanceRequired !== false && !termsAccepted) || hasOutOfStockItems}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  {hasOutOfStockItems ? (
                    'REMOVE OUT OF STOCK ITEMS TO PROCEED'
                  ) : isStoreClosed ? (
                    'STORE TEMPORARILY CLOSED'
                  ) : isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {processingStatus || 'PROCESSING ORDER...'}
                    </span>
                  ) : paymentMethod === 'cod' ? (
                    `PLACE ORDER · ₹${Number(grandTotal || 0).toLocaleString('en-IN')}`
                  ) : (
                    `${checkoutSettings.placeOrderButtonText || 'PAY VIA RAZORPAY'} · ₹${Number(grandTotal || 0).toLocaleString('en-IN')}`
                  )}
                </button>
              )}

              <p className="text-[10px] text-center text-slate-400">
                {isGstEnabled
                  ? '100% Safe & Secure Payments · Official GST Tax Invoice Included'
                  : '100% Safe & Secure Payments'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 11. MOBILE STICKY BOTTOM CHECKOUT BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                ₹{Number(grandTotal || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {isPinUnserviceable ? (
              <button
                type="button"
                onClick={handleChangeAddressClick}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin size={14} />
                <span>{user && savedAddresses.length > 1 ? 'Select Address' : 'Change Address'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing || isStoreClosed || (checkoutSettings.termsAcceptanceRequired !== false && !termsAccepted) || hasOutOfStockItems}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" />
                    <span>{paymentMethod === 'cod' ? 'Placing...' : 'Processing...'}</span>
                  </span>
                ) : paymentMethod === 'cod' ? (
                  <span>PLACE ORDER</span>
                ) : (
                  <span>PAY NOW</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 12. RAZORPAY SANDBOX TEST MODAL (when SDK is in sandbox simulation) */}
      {sandboxModalState && (
        <RazorpaySandboxModal
          isOpen={sandboxModalState.isOpen}
          storeName={storeName}
          orderId={sandboxModalState.orderId}
          amount={sandboxModalState.amount}
          customerName={selectedAddress?.fullName || user?.displayName || 'Valued Customer'}
          customerEmail={user?.email || selectedAddress?.email || ''}
          customerPhone={selectedAddress?.phone || ''}
          onSuccess={async (paymentRes) => {
            setSandboxModalState(null);
            setProcessingStatus('Verifying payment & confirming order...');
            try {
              const validation = await validateCheckoutBeforeOrder();
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_order_id: paymentRes.razorpay_order_id || sandboxModalState.orderId,
                  razorpay_signature: paymentRes.razorpay_signature,
                  userId: user!.uid,
                  items: validation.orderItems,
                  shippingAddress: selectedAddress,
                  billingAddress: sameAsShipping ? selectedAddress : billingAddress,
                  couponCode: appliedCoupon?.code || couponCode.trim(),
                  orderNotes,
                  gstin
                })
              });

              const verifyData = await verifyRes.json();

              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment verification failed.');
              }

              const confirmedOrder = verifyData.order || { id: verifyData.orderId };
              await clearUserCart();

              setCompletedOrder(confirmedOrder);
              setIsProcessing(false);
              setProcessingStatus('');

              navigate(`/orders/${confirmedOrder.id || verifyData.orderId}`, {
                replace: true,
                state: {
                  newlyPlaced: true,
                  orderId: confirmedOrder.id || verifyData.orderId,
                  paymentMethod: 'online',
                  invoiceNumber: confirmedOrder.invoiceNumber
                }
              });
            } catch (verifyErr: any) {
              setPaymentError(verifyErr.message || 'Payment verification failed. Please contact support.');
              setIsProcessing(false);
              setProcessingStatus('');
            }
          }}
          onFailure={(errorMsg) => {
            setSandboxModalState(null);
            setIsProcessing(false);
            setProcessingStatus('');
            setPaymentError(`Payment was unsuccessful: ${errorMsg}. Your order has not been placed.`);
          }}
          onDismiss={() => {
            setSandboxModalState(null);
            setIsProcessing(false);
            setProcessingStatus('');
            setPaymentError('Payment was not completed. Your order has not been placed.');
          }}
        />
      )}
    </div>
  );
}
