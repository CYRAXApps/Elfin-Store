import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, CreditCard, Smartphone, Building, Wallet, ChevronRight, Lock } from 'lucide-react';

interface RazorpaySandboxModalProps {
  isOpen: boolean;
  storeName: string;
  orderId: string;
  amount: number; // in Rupees
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (paymentResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (errorMessage: string) => void;
  onDismiss: () => void;
}

export function RazorpaySandboxModal({
  isOpen,
  storeName,
  orderId,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
  onDismiss
}: RazorpaySandboxModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handlePaySuccess = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const generatedPayId = `pay_${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6)}`;
      const dummySignature = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      onSuccess({
        razorpay_payment_id: generatedPayId,
        razorpay_order_id: orderId,
        razorpay_signature: dummySignature
      });
      setIsSimulating(false);
    }, 800);
  };

  const handlePayFailure = () => {
    setIsSimulating(true);
    setTimeout(() => {
      onFailure('Payment declined by issuer or cancelled by user.');
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Razorpay & Store Branding */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-xs">
              <span className="text-blue-600 font-black text-lg tracking-tighter">₹</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                {storeName}
                <span className="bg-blue-800/80 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-blue-200">
                  Razorpay
                </span>
              </h3>
              <p className="text-[11px] text-blue-100 font-mono mt-0.5">
                Ref: {orderId ? orderId.slice(0, 16) : 'order_checkout'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSimulating}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Close payment window"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Amount to Pay</span>
            <span className="text-xl font-black text-slate-900">
              ₹{Number(amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <span className="block font-medium text-slate-700">{customerName || 'Customer'}</span>
            <span className="font-mono text-[10px] text-slate-400">{customerPhone || customerEmail || '+91 ••••••••••'}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Payment Option
          </p>

          {/* UPI */}
          <button
            type="button"
            onClick={() => setSelectedMethod('upi')}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedMethod === 'upi'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">UPI / QR (Google Pay, PhonePe, Paytm)</p>
                <p className="text-[11px] text-slate-500">Instant transfer via any UPI app</p>
              </div>
            </div>
            <ChevronRight size={16} className={selectedMethod === 'upi' ? 'text-blue-600' : 'text-slate-400'} />
          </button>

          {selectedMethod === 'upi' && (
            <div className="ml-2 pl-4 border-l-2 border-blue-400 space-y-2 py-1 text-xs">
              <label className="block text-[11px] font-semibold text-slate-600">Enter UPI VPA ID</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="username@upi"
              />
            </div>
          )}

          {/* Cards */}
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedMethod === 'card'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Credit / Debit Card</p>
                <p className="text-[11px] text-slate-500">Visa, Mastercard, RuPay, Amex</p>
              </div>
            </div>
            <ChevronRight size={16} className={selectedMethod === 'card' ? 'text-blue-600' : 'text-slate-400'} />
          </button>

          {selectedMethod === 'card' && (
            <div className="ml-2 pl-4 border-l-2 border-blue-400 space-y-2 py-1 text-xs">
              <label className="block text-[11px] font-semibold text-slate-600">Test Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* NetBanking */}
          <button
            type="button"
            onClick={() => setSelectedMethod('netbanking')}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedMethod === 'netbanking'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">NetBanking</p>
                <p className="text-[11px] text-slate-500">All Indian Banks (HDFC, ICICI, SBI, Axis)</p>
              </div>
            </div>
            <ChevronRight size={16} className={selectedMethod === 'netbanking' ? 'text-blue-600' : 'text-slate-400'} />
          </button>

          {/* Wallets */}
          <button
            type="button"
            onClick={() => setSelectedMethod('wallet')}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              selectedMethod === 'wallet'
                ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Wallets</p>
                <p className="text-[11px] text-slate-500">Amazon Pay, Mobikwik, Freecharge</p>
              </div>
            </div>
            <ChevronRight size={16} className={selectedMethod === 'wallet' ? 'text-blue-600' : 'text-slate-400'} />
          </button>
        </div>

        {/* Action Buttons & Security Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
          <button
            type="button"
            onClick={handlePaySuccess}
            disabled={isSimulating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            {isSimulating ? (
              <span>Authorizing payment...</span>
            ) : (
              <>
                <Lock size={15} />
                <span>Complete Payment of ₹{Number(amount || 0).toLocaleString('en-IN')}</span>
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePayFailure}
              disabled={isSimulating}
              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Simulate Failure
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isSimulating}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>256-Bit Encrypted Secure Razorpay Gateway Simulation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
