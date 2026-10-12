import React, { useEffect, useMemo } from 'react';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Check, 
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Split,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PosPaymentMethod, PosPaymentState, PosPaymentStatus, PosSplitBreakdown } from './types';

interface PosPaymentPanelProps {
  grandTotal: number;
  paymentState: PosPaymentState;
  onChange: (state: PosPaymentState) => void;
  upiId?: string;
  storeName?: string;
  upiDisplayName?: string;
  upiAppsText?: string;
  upiInstructions?: string;
  upiQrCodeUrl?: string;
  upiQrMode?: 'dynamic' | 'custom';
  enableCash?: boolean;
  enableUpi?: boolean;
  enableCard?: boolean;
  allowSplitPayment?: boolean;
  requireConfirmation?: boolean;
}

export const PosPaymentPanel: React.FC<PosPaymentPanelProps> = ({
  grandTotal,
  paymentState,
  onChange,
  upiId = '',
  storeName = 'ELECTRO STORE',
  upiDisplayName = 'Scan to Pay via UPI',
  upiAppsText = 'GPay, PhonePe, Paytm, BHIM',
  upiInstructions = 'Verify receipt on soundbox, notification, or customer app before confirming.',
  upiQrCodeUrl = '',
  upiQrMode = 'dynamic',
  enableCash = true,
  enableUpi = true,
  enableCard = true,
  allowSplitPayment = true,
  requireConfirmation = false
}) => {
  const method = paymentState.method;

  // Split Breakdown Defaults
  const splitBreakdown: PosSplitBreakdown = useMemo(() => {
    return paymentState.splitBreakdown || {
      cash: 0,
      cashTendered: 0,
      upi: 0,
      upiRef: '',
      card: 0,
      cardLast4: '',
      cardType: 'Debit Card',
      cardRef: ''
    };
  }, [paymentState.splitBreakdown]);

  // Only take enabled payment methods into account for calculations
  const splitCash = enableCash ? (Number(splitBreakdown.cash) || 0) : 0;
  const splitUpi = enableUpi ? (Number(splitBreakdown.upi) || 0) : 0;
  const splitCard = enableCard ? (Number(splitBreakdown.card) || 0) : 0;
  const splitTotalPaid = splitCash + splitUpi + splitCard;
  const splitRemaining = Math.max(0, grandTotal - splitTotalPaid);
  const splitExcess = Math.max(0, splitTotalPaid - grandTotal);
  const isSplitExact = Math.abs(splitTotalPaid - grandTotal) < 0.01 && grandTotal > 0;

  // Cash change calculations for Split Cash portion
  const splitCashTendered = splitBreakdown.cashTendered !== undefined && splitBreakdown.cashTendered > 0 
    ? splitBreakdown.cashTendered 
    : splitCash;
  const splitCashChange = enableCash ? Math.max(0, splitCashTendered - splitCash) : 0;

  // Check if UPI is configured with either a custom QR URL or a store UPI ID
  const isUpiConfigured = Boolean((upiId && upiId.trim()) || (upiQrCodeUrl && upiQrCodeUrl.trim()));

  // Resolve QR code image source for standard UPI
  let qrImgSrc = '';
  if (enableUpi) {
    if (upiQrMode === 'custom' && upiQrCodeUrl && upiQrCodeUrl.trim()) {
      qrImgSrc = upiQrCodeUrl.trim();
    } else if (upiId && upiId.trim()) {
      const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(storeName)}&am=${grandTotal}&cu=INR&tn=CounterBilling`;
      qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiIntentUri)}`;
    } else if (upiQrCodeUrl && upiQrCodeUrl.trim()) {
      qrImgSrc = upiQrCodeUrl.trim();
    }
  }

  // Resolve dynamic QR for Split UPI amount
  let splitUpiQrSrc = '';
  if (enableUpi && splitUpi > 0 && upiId && upiId.trim()) {
    const splitUpiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(storeName)}&am=${splitUpi}&cu=INR&tn=POS-SplitPay`;
    splitUpiQrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(splitUpiIntentUri)}`;
  } else if (enableUpi && upiQrCodeUrl && upiQrCodeUrl.trim()) {
    splitUpiQrSrc = upiQrCodeUrl.trim();
  }

  // Count active methods
  const enabledCount = (enableCash ? 1 : 0) + (enableUpi ? 1 : 0) + (enableCard ? 1 : 0);
  const isSplitAvailable = allowSplitPayment && enabledCount >= 2;

  // Synchronize state and clean up stale values when settings change
  useEffect(() => {
    let needsUpdate = false;
    let nextMethod = method;
    let nextBreakdown: PosSplitBreakdown = { ...splitBreakdown };

    // 1. Ensure current method is allowed
    if (method === 'cash' && !enableCash) {
      nextMethod = enableUpi ? 'upi' : (enableCard ? 'card' : (isSplitAvailable ? 'split' : 'cash'));
      needsUpdate = true;
    } else if (method === 'upi' && !enableUpi) {
      nextMethod = enableCash ? 'cash' : (enableCard ? 'card' : (isSplitAvailable ? 'split' : 'upi'));
      needsUpdate = true;
    } else if (method === 'card' && !enableCard) {
      nextMethod = enableCash ? 'cash' : (enableUpi ? 'upi' : (isSplitAvailable ? 'split' : 'card'));
      needsUpdate = true;
    } else if (method === 'split' && !isSplitAvailable) {
      nextMethod = enableCash ? 'cash' : (enableUpi ? 'upi' : (enableCard ? 'card' : 'cash'));
      needsUpdate = true;
    }

    // 2. Clean up disabled methods from split breakdown to prevent stale allocations
    if (!enableCash && ((nextBreakdown.cash && nextBreakdown.cash > 0) || (nextBreakdown.cashTendered && nextBreakdown.cashTendered > 0))) {
      nextBreakdown.cash = 0;
      nextBreakdown.cashTendered = 0;
      needsUpdate = true;
    }
    if (!enableUpi && ((nextBreakdown.upi && nextBreakdown.upi > 0) || nextBreakdown.upiRef)) {
      nextBreakdown.upi = 0;
      nextBreakdown.upiRef = '';
      needsUpdate = true;
    }
    if (!enableCard && ((nextBreakdown.card && nextBreakdown.card > 0) || nextBreakdown.cardLast4 || nextBreakdown.cardRef)) {
      nextBreakdown.card = 0;
      nextBreakdown.cardLast4 = '';
      nextBreakdown.cardRef = '';
      needsUpdate = true;
    }

    if (needsUpdate) {
      const activeCash = enableCash ? (Number(nextBreakdown.cash) || 0) : 0;
      const activeUpi = enableUpi ? (Number(nextBreakdown.upi) || 0) : 0;
      const activeCard = enableCard ? (Number(nextBreakdown.card) || 0) : 0;
      const sum = activeCash + activeUpi + activeCard;
      const isConfirmed = nextMethod === 'split' 
        ? Math.abs(sum - grandTotal) < 0.01 && grandTotal > 0
        : (nextMethod === 'cash' ? (paymentState.cashTendered >= grandTotal && grandTotal > 0) : false);

      onChange({
        ...paymentState,
        method: nextMethod,
        splitBreakdown: nextBreakdown,
        paymentStatus: isConfirmed ? 'paid' : 'pending',
        isConfirmed
      });
    }
  }, [enableCash, enableUpi, enableCard, allowSplitPayment, isSplitAvailable, method, splitBreakdown, grandTotal]);

  const setMethod = (newMethod: PosPaymentMethod) => {
    let cashTendered = paymentState.cashTendered;
    let paymentStatus = paymentState.paymentStatus;
    let isConfirmed = paymentState.isConfirmed;

    if (newMethod === 'cash') {
      if (cashTendered === 0 || cashTendered < grandTotal) {
        cashTendered = grandTotal;
      }
      paymentStatus = cashTendered >= grandTotal ? 'paid' : 'pending';
      isConfirmed = cashTendered >= grandTotal;
    } else if (newMethod === 'split') {
      const existing = paymentState.splitBreakdown;
      const currentSum = (enableCash ? (existing?.cash || 0) : 0) + 
                         (enableUpi ? (existing?.upi || 0) : 0) + 
                         (enableCard ? (existing?.card || 0) : 0);
      
      let defaultBreakdown: PosSplitBreakdown;
      if (existing && currentSum > 0) {
        defaultBreakdown = {
          cash: enableCash ? (existing.cash || 0) : 0,
          cashTendered: enableCash ? (existing.cashTendered || existing.cash || 0) : 0,
          upi: enableUpi ? (existing.upi || 0) : 0,
          upiRef: enableUpi ? (existing.upiRef || '') : '',
          card: enableCard ? (existing.card || 0) : 0,
          cardLast4: enableCard ? (existing.cardLast4 || '') : '',
          cardType: existing.cardType || 'Debit Card',
          cardRef: enableCard ? (existing.cardRef || '') : ''
        };
      } else {
        const half = Math.round(grandTotal / 2);
        const otherHalf = grandTotal - half;

        if (enableCash && enableUpi) {
          defaultBreakdown = {
            cash: half,
            cashTendered: half,
            upi: otherHalf,
            upiRef: '',
            card: 0,
            cardLast4: '',
            cardType: 'Debit Card',
            cardRef: ''
          };
        } else if (enableCash && enableCard) {
          defaultBreakdown = {
            cash: half,
            cashTendered: half,
            upi: 0,
            upiRef: '',
            card: otherHalf,
            cardLast4: '',
            cardType: 'Debit Card',
            cardRef: ''
          };
        } else if (enableUpi && enableCard) {
          defaultBreakdown = {
            cash: 0,
            cashTendered: 0,
            upi: half,
            upiRef: '',
            card: otherHalf,
            cardLast4: '',
            cardType: 'Debit Card',
            cardRef: ''
          };
        } else {
          defaultBreakdown = {
            cash: enableCash ? grandTotal : 0,
            cashTendered: enableCash ? grandTotal : 0,
            upi: !enableCash && enableUpi ? grandTotal : 0,
            upiRef: '',
            card: !enableCash && !enableUpi && enableCard ? grandTotal : 0,
            cardLast4: '',
            cardType: 'Debit Card',
            cardRef: ''
          };
        }
      }

      const sum = (Number(defaultBreakdown.cash) || 0) + (Number(defaultBreakdown.upi) || 0) + (Number(defaultBreakdown.card) || 0);
      isConfirmed = Math.abs(sum - grandTotal) < 0.01 && grandTotal > 0;
      paymentStatus = isConfirmed ? 'paid' : 'pending';
      onChange({
        ...paymentState,
        method: 'split',
        splitBreakdown: defaultBreakdown,
        paymentStatus,
        isConfirmed
      });
      return;
    } else {
      // For UPI or Card: start as pending until confirmed by cashier
      isConfirmed = false;
      paymentStatus = 'pending';
    }

    onChange({
      ...paymentState,
      method: newMethod,
      cashTendered,
      paymentStatus,
      isConfirmed
    });
  };

  // Cash change calculations
  const cashChange = Math.max(0, paymentState.cashTendered - grandTotal);
  const cashShortage = Math.max(0, grandTotal - paymentState.cashTendered);

  // Handler for cash amount change
  const handleCashChange = (tendered: number) => {
    const isSufficient = tendered >= grandTotal && grandTotal > 0;
    onChange({
      ...paymentState,
      cashTendered: tendered,
      isConfirmed: isSufficient,
      paymentStatus: isSufficient ? 'paid' : 'pending'
    });
  };

  // Handler for confirming UPI / Card payment
  const handleToggleConfirmed = (confirmed: boolean) => {
    onChange({
      ...paymentState,
      isConfirmed: confirmed,
      paymentStatus: confirmed ? 'paid' : 'pending'
    });
  };

  // Handler for split payment field changes
  const updateSplitField = (field: keyof PosSplitBreakdown, value: any) => {
    // If field belongs to a disabled method, do not permit updating
    if ((field === 'cash' || field === 'cashTendered') && !enableCash) return;
    if ((field === 'upi' || field === 'upiRef') && !enableUpi) return;
    if ((field === 'card' || field === 'cardLast4' || field === 'cardType' || field === 'cardRef') && !enableCard) return;

    const nextBreakdown: PosSplitBreakdown = {
      ...splitBreakdown,
      [field]: value
    };
    const effectiveCash = enableCash ? (Number(nextBreakdown.cash) || 0) : 0;
    const effectiveUpi = enableUpi ? (Number(nextBreakdown.upi) || 0) : 0;
    const effectiveCard = enableCard ? (Number(nextBreakdown.card) || 0) : 0;
    const sum = effectiveCash + effectiveUpi + effectiveCard;
    const isComplete = Math.abs(sum - grandTotal) < 0.01 && grandTotal > 0;

    onChange({
      ...paymentState,
      splitBreakdown: nextBreakdown,
      paymentStatus: isComplete ? 'paid' : 'pending',
      isConfirmed: isComplete
    });
  };

  // Quick fill remaining balance for a specific payment method in Split mode
  const handleSplitFillRemaining = (target: 'cash' | 'upi' | 'card') => {
    if (target === 'cash' && !enableCash) return;
    if (target === 'upi' && !enableUpi) return;
    if (target === 'card' && !enableCard) return;

    const otherSum = (target === 'cash' || !enableCash ? 0 : (Number(splitBreakdown.cash) || 0)) +
                     (target === 'upi' || !enableUpi ? 0 : (Number(splitBreakdown.upi) || 0)) +
                     (target === 'card' || !enableCard ? 0 : (Number(splitBreakdown.card) || 0));
    const toFill = Math.max(0, grandTotal - otherSum);

    const nextBreakdown: PosSplitBreakdown = {
      ...splitBreakdown,
      [target]: toFill
    };

    if (target === 'cash') {
      nextBreakdown.cashTendered = toFill;
    }

    const effectiveCash = enableCash ? (Number(nextBreakdown.cash) || 0) : 0;
    const effectiveUpi = enableUpi ? (Number(nextBreakdown.upi) || 0) : 0;
    const effectiveCard = enableCard ? (Number(nextBreakdown.card) || 0) : 0;
    const sum = effectiveCash + effectiveUpi + effectiveCard;
    const isComplete = Math.abs(sum - grandTotal) < 0.01 && grandTotal > 0;

    onChange({
      ...paymentState,
      splitBreakdown: nextBreakdown,
      paymentStatus: isComplete ? 'paid' : 'pending',
      isConfirmed: isComplete
    });
  };

  // Quick Split presets respecting enabled payment methods
  const applyPresetSplit = (preset: 'cash_upi' | 'cash_card' | 'upi_card' | 'all_three' | 'reset') => {
    if (preset === 'reset') {
      const resetBreakdown: PosSplitBreakdown = {
        ...splitBreakdown,
        cash: 0,
        cashTendered: 0,
        upi: 0,
        upiRef: '',
        card: 0,
        cardLast4: '',
        cardType: 'Debit Card',
        cardRef: ''
      };
      onChange({
        ...paymentState,
        splitBreakdown: resetBreakdown,
        paymentStatus: 'pending',
        isConfirmed: false
      });
      return;
    }

    const half = Math.round(grandTotal / 2);
    const otherHalf = grandTotal - half;

    let nextBreakdown: PosSplitBreakdown = {
      cash: 0,
      cashTendered: 0,
      upi: 0,
      upiRef: splitBreakdown.upiRef || '',
      card: 0,
      cardLast4: splitBreakdown.cardLast4 || '',
      cardType: splitBreakdown.cardType || 'Debit Card',
      cardRef: splitBreakdown.cardRef || ''
    };

    if (preset === 'cash_upi' && enableCash && enableUpi) {
      nextBreakdown.cash = half;
      nextBreakdown.cashTendered = half;
      nextBreakdown.upi = otherHalf;
    } else if (preset === 'cash_card' && enableCash && enableCard) {
      nextBreakdown.cash = half;
      nextBreakdown.cashTendered = half;
      nextBreakdown.card = otherHalf;
    } else if (preset === 'upi_card' && enableUpi && enableCard) {
      nextBreakdown.upi = half;
      nextBreakdown.card = otherHalf;
    } else if (preset === 'all_three' && enableCash && enableUpi && enableCard) {
      const oneThird = Math.round(grandTotal / 3);
      nextBreakdown.cash = oneThird;
      nextBreakdown.cashTendered = oneThird;
      nextBreakdown.upi = oneThird;
      nextBreakdown.card = grandTotal - (oneThird * 2);
    } else {
      return;
    }

    const sum = (Number(nextBreakdown.cash) || 0) + (Number(nextBreakdown.upi) || 0) + (Number(nextBreakdown.card) || 0);
    const isComplete = Math.abs(sum - grandTotal) < 0.01 && grandTotal > 0;

    onChange({
      ...paymentState,
      splitBreakdown: nextBreakdown,
      paymentStatus: isComplete ? 'paid' : 'pending',
      isConfirmed: isComplete
    });
  };

  // Handler for explicit status change
  const handleStatusChange = (status: PosPaymentStatus) => {
    if (status === 'paid') {
      if (method === 'cash') {
        const isSufficient = paymentState.cashTendered >= grandTotal;
        onChange({
          ...paymentState,
          paymentStatus: isSufficient ? 'paid' : 'pending',
          isConfirmed: isSufficient
        });
        return;
      }
      if (method === 'split') {
        onChange({
          ...paymentState,
          paymentStatus: isSplitExact ? 'paid' : 'pending',
          isConfirmed: isSplitExact
        });
        return;
      }
      if ((method === 'upi' || method === 'card') && !paymentState.isConfirmed) {
        onChange({
          ...paymentState,
          paymentStatus: 'paid',
          isConfirmed: true
        });
        return;
      }
    }

    onChange({
      ...paymentState,
      paymentStatus: status,
      isConfirmed: status === 'paid'
    });
  };

  const totalActiveTabs = (enableCash ? 1 : 0) + (enableUpi ? 1 : 0) + (enableCard ? 1 : 0) + (isSplitAvailable ? 1 : 0);
  const tabGridClass = totalActiveTabs === 1 ? 'grid-cols-1' :
                       totalActiveTabs === 2 ? 'grid-cols-2' :
                       totalActiveTabs === 3 ? 'grid-cols-3' : 'grid-cols-4';

  const hasMultiplePresets = (enableCash && enableUpi) || (enableCash && enableCard) || (enableUpi && enableCard);

  return (
    <div className="space-y-3">
      {/* Enabled Payment Method Tabs */}
      <div className={`grid ${tabGridClass} gap-1 p-1 bg-slate-100 rounded-xl`}>
        {enableCash && (
          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'cash'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Banknote size={15} />
            <span>Cash</span>
          </button>
        )}

        {enableUpi && (
          <button
            type="button"
            onClick={() => setMethod('upi')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'upi'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <QrCode size={15} />
            <span>UPI</span>
          </button>
        )}

        {enableCard && (
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'card'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard size={15} />
            <span>Card</span>
          </button>
        )}

        {isSplitAvailable && (
          <button
            type="button"
            onClick={() => setMethod('split')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              method === 'split'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Split size={15} />
            <span>Split</span>
          </button>
        )}
      </div>

      {/* METHOD 1: CASH */}
      {method === 'cash' && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Cash Received from Customer</label>
              <button
                type="button"
                onClick={() => handleCashChange(grandTotal)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Exact Cash (₹{Number(grandTotal || 0).toLocaleString('en-IN')})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={paymentState.cashTendered === 0 ? '' : paymentState.cashTendered}
                onChange={(e) => handleCashChange(parseFloat(e.target.value) || 0)}
                placeholder={grandTotal.toString()}
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Real-time Change / Shortage Banner */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Bill Total</span>
              <span className="text-xs font-bold text-slate-900 font-mono">₹{Number(grandTotal || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className={`p-2 rounded-lg border text-center transition-colors ${
              cashChange > 0 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : cashShortage > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <span className="text-[10px] uppercase tracking-wider font-bold block">
                {cashShortage > 0 ? 'Remaining Due' : 'Change to Return'}
              </span>
              <span className="text-sm font-black font-mono">
                ₹{Number(cashShortage > 0 ? cashShortage : cashChange).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 2: UPI */}
      {method === 'upi' && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
          {/* Active Store UPI Configuration Display */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900 block">{upiDisplayName}</span>
              <span className="text-[10.5px] text-slate-500 block">{upiAppsText}</span>
            </div>
            {upiId ? (
              <span className="text-[11px] font-mono bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded border border-purple-200">
                {upiId}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                No Store UPI ID configured
              </span>
            )}
          </div>

          {/* Dynamic UPI Standee / QR Display */}
          {isUpiConfigured ? (
            <div className="flex flex-col items-center justify-center py-2 bg-white rounded-xl border border-purple-100 shadow-2xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs mb-2">
                <img 
                  src={qrImgSrc} 
                  alt="UPI QR Code" 
                  className="w-36 h-36 object-contain"
                  loading="eager"
                />
              </div>
              <p className="text-[11px] text-purple-900 font-black tracking-wide">
                AMOUNT: ₹{Number(grandTotal || 0).toLocaleString('en-IN')}
              </p>
              {upiInstructions && (
                <p className="text-[10px] text-slate-500 text-center px-4 mt-1">
                  {upiInstructions}
                </p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">UPI Payment Not Configured</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Set up your Store UPI ID or QR Code in <strong>Admin → Store Settings → POS Settings</strong>.
                </p>
              </div>
            </div>
          )}

          {/* UTR / Transaction Reference Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              UPI Reference / UTR Number <span className="text-slate-400 font-normal">(Optional for audit)</span>
            </label>
            <input
              type="text"
              value={paymentState.upiRef || ''}
              onChange={(e) => onChange({ ...paymentState, upiRef: e.target.value, referenceNumber: e.target.value })}
              placeholder="e.g. 402918239012 (12-digit UTR)"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Payment Verification Confirmation Box */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleConfirmed(!paymentState.isConfirmed)}
              className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer ${
                paymentState.isConfirmed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={paymentState.isConfirmed ? 'text-emerald-600' : 'text-slate-400'} />
                <div>
                  <span className="text-xs font-bold block">
                    {paymentState.isConfirmed ? 'UPI Payment Received & Verified' : 'Confirm UPI Received on Counter'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {paymentState.isConfirmed ? 'Verified via soundbox/app notification' : 'Click after customer payment succeeds'}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                paymentState.isConfirmed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentState.isConfirmed && <Check size={14} className="stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* METHOD 3: CARD */}
      {method === 'card' && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Card Type</label>
              <select
                value={paymentState.cardType || 'Debit Card'}
                onChange={(e) => onChange({ ...paymentState, cardType: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Corporate Card">Corporate Card</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Last 4 Digits</label>
              <input
                type="text"
                maxLength={4}
                value={paymentState.cardLast4 || ''}
                onChange={(e) => onChange({ ...paymentState, cardLast4: e.target.value.replace(/\D/g, '') })}
                placeholder="4321"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Terminal Auth / Ref Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={paymentState.referenceNumber || ''}
              onChange={(e) => onChange({ ...paymentState, referenceNumber: e.target.value })}
              placeholder="e.g. TXN-998822 (from EDC slip)"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleConfirmed(!paymentState.isConfirmed)}
              className={`w-full p-2.5 rounded-lg border flex items-center justify-between text-left transition-all cursor-pointer ${
                paymentState.isConfirmed
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={paymentState.isConfirmed ? 'text-emerald-600' : 'text-slate-400'} />
                <div>
                  <span className="text-xs font-bold block">
                    {paymentState.isConfirmed ? 'Card Swipe / Tap Confirmed' : 'Confirm EDC Terminal Slip Printed'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {paymentState.isConfirmed ? 'Verified via EDC charge slip' : 'Click after card payment approval'}
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                paymentState.isConfirmed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentState.isConfirmed && <Check size={14} className="stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* METHOD 4: SPLIT PAYMENT (STEP 7) */}
      {method === 'split' && (
        <div className="bg-slate-50 p-3 rounded-xl border border-indigo-200 space-y-3">
          {/* Real-time Split Payment Status Header */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-center p-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Grand Total</span>
              <span className="text-xs font-black text-slate-900 font-mono">
                ₹{Number(grandTotal || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="text-center p-1.5 border-x border-slate-200">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Total Paid</span>
              <span className="text-xs font-black text-indigo-900 font-mono">
                ₹{Number(splitTotalPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className={`text-center p-1.5 rounded-lg transition-colors ${
              isSplitExact 
                ? 'bg-emerald-50 text-emerald-900' 
                : splitRemaining > 0 
                ? 'bg-amber-50 text-amber-900' 
                : 'bg-red-50 text-red-900'
            }`}>
              <span className="text-[10px] uppercase font-bold block">
                {isSplitExact ? 'Balance' : splitRemaining > 0 ? 'Remaining' : 'Excess'}
              </span>
              <span className="text-xs font-black font-mono">
                {isSplitExact ? '₹0' : splitRemaining > 0 ? `₹${Number(splitRemaining || 0).toLocaleString('en-IN')}` : `+₹${Number(splitExcess || 0).toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* Quick Split Presets (only displayed if at least 2 methods are enabled) */}
          {hasMultiplePresets && (
            <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
              <span className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-600" /> Presets:
              </span>
              <div className="flex gap-1 flex-wrap">
                {enableCash && enableUpi && (
                  <button
                    type="button"
                    onClick={() => applyPresetSplit('cash_upi')}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    50% Cash + 50% UPI
                  </button>
                )}
                {enableCash && enableCard && (
                  <button
                    type="button"
                    onClick={() => applyPresetSplit('cash_card')}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    50% Cash + 50% Card
                  </button>
                )}
                {enableUpi && enableCard && (
                  <button
                    type="button"
                    onClick={() => applyPresetSplit('upi_card')}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    50% UPI + 50% Card
                  </button>
                )}
                {enableCash && enableUpi && enableCard && (
                  <button
                    type="button"
                    onClick={() => applyPresetSplit('all_three')}
                    className="px-2 py-0.5 text-[10.5px] font-bold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    3-Way Split
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => applyPresetSplit('reset')}
                  className="px-2 py-0.5 text-[10.5px] font-bold bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* SPLIT BREAKDOWN ENTRIES (Cash, UPI, Card) - Only render enabled methods */}
          <div className="space-y-2.5">
            {/* 1. CASH ENTRY */}
            {enableCash && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                      <Banknote size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Cash Payment</span>
                  </div>
                  {splitRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('cash')}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <span>+ Fill ₹{Number(splitRemaining || 0).toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Cash Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitCash === 0 ? '' : splitCash}
                        onChange={(e) => updateSplitField('cash', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {splitCash > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Cash Note Given <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={splitBreakdown.cashTendered || ''}
                          onChange={(e) => updateSplitField('cashTendered', parseFloat(e.target.value) || 0)}
                          placeholder={splitCash.toString()}
                          className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {splitCash > 0 && splitCashChange > 0 && (
                  <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-800 flex justify-between items-center">
                    <span>Cash Change to Return:</span>
                    <span className="font-mono text-xs">₹{Number(splitCashChange || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. UPI ENTRY */}
            {enableUpi && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[11px]">
                      <QrCode size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-900">UPI Payment</span>
                  </div>
                  {splitRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('upi')}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <span>+ Fill ₹{Number(splitRemaining || 0).toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">UPI Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitUpi === 0 ? '' : splitUpi}
                        onChange={(e) => updateSplitField('upi', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      UPI Reference / UTR <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={splitBreakdown.upiRef || ''}
                      onChange={(e) => updateSplitField('upiRef', e.target.value)}
                      placeholder="12-digit UTR"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                  </div>
                </div>

                {splitUpi > 0 && splitUpiQrSrc && (
                  <div className="flex items-center gap-3 p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                    <img 
                      src={splitUpiQrSrc} 
                      alt="Split UPI QR" 
                      className="w-14 h-14 bg-white p-1 rounded border border-purple-200 shrink-0" 
                    />
                    <div>
                      <span className="text-[10.5px] font-black text-purple-900 block font-mono">
                        SCAN FOR ₹{Number(splitUpi || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {upiId || storeName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. CARD ENTRY */}
            {enableCard && (
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">
                      <CreditCard size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Card Payment</span>
                  </div>
                  {splitRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSplitFillRemaining('card')}
                      className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <span>+ Fill ₹{Number(splitRemaining || 0).toLocaleString('en-IN')}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Card Amount</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitCard === 0 ? '' : splitCard}
                        onChange={(e) => updateSplitField('card', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Card Type</label>
                    <select
                      value={splitBreakdown.cardType || 'Debit Card'}
                      onChange={(e) => updateSplitField('cardType', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="Debit Card">Debit</option>
                      <option value="Credit Card">Credit</option>
                      <option value="Corporate Card">Corp</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={splitBreakdown.cardLast4 || ''}
                      onChange={(e) => updateSplitField('cardLast4', e.target.value.replace(/\D/g, ''))}
                      placeholder="4321"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Split Status Alert */}
          {isSplitExact ? (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span className="font-bold">Total ₹{Number(grandTotal || 0).toLocaleString('en-IN')} fully allocated across payment methods.</span>
            </div>
          ) : splitRemaining > 0 ? (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>Please allocate remaining <strong>₹{Number(splitRemaining || 0).toLocaleString('en-IN')}</strong> to complete sale.</span>
            </div>
          ) : (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-red-600 shrink-0" />
              <span>Total paid exceeds bill by <strong>₹{Number(splitExcess || 0).toLocaleString('en-IN')}</strong>. Please adjust.</span>
            </div>
          )}
        </div>
      )}

      {/* 4 PAYMENT STATUSES: Pending, Paid, Failed, Refunded */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700">Payment Status:</span>
          <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
            paymentState.paymentStatus === 'paid' 
              ? 'bg-emerald-100 text-emerald-800' 
              : paymentState.paymentStatus === 'pending'
              ? 'bg-amber-100 text-amber-800'
              : paymentState.paymentStatus === 'failed'
              ? 'bg-red-100 text-red-800'
              : 'bg-slate-200 text-slate-800'
          }`}>
            {paymentState.paymentStatus}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {/* PAID */}
          <button
            type="button"
            onClick={() => handleStatusChange('paid')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              paymentState.paymentStatus === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>Paid</span>
          </button>

          {/* PENDING */}
          <button
            type="button"
            onClick={() => handleStatusChange('pending')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              paymentState.paymentStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Clock size={12} />
            <span>Pending</span>
          </button>

          {/* FAILED */}
          <button
            type="button"
            onClick={() => handleStatusChange('failed')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              paymentState.paymentStatus === 'failed'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <XCircle size={12} />
            <span>Failed</span>
          </button>

          {/* REFUNDED */}
          <button
            type="button"
            onClick={() => handleStatusChange('refunded')}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              paymentState.paymentStatus === 'refunded'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RotateCcw size={12} />
            <span>Refunded</span>
          </button>
        </div>

        {paymentState.paymentStatus === 'failed' && (
          <p className="text-[10px] text-red-600 font-semibold">
            Payment has failed. Collect payment or switch method before completing sale.
          </p>
        )}
      </div>
    </div>
  );
};
