import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Banknote, ShieldCheck, Zap, 
  Smartphone, Wallet, Lock, CheckCircle2, AlertTriangle, KeyRound 
} from 'lucide-react';
import { SettingItemCard } from '../SettingItemCard';
import { SettingToggleCard } from '../SettingToggleCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';

interface PaymentSettingsSectionProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
}

export function PaymentSettingsSection({ settings, onUpdateField, onBatchUpdate }: PaymentSettingsSectionProps) {
  const payments = settings.payments || {
    onlinePaymentEnabled: true,
    codEnabled: true,
    codExtraCharge: 0,
    paymentMethods: {
      upi: true,
      cards: true,
      netbanking: true,
      wallets: true,
    },
    environment: 'test' as const,
    razorpayKeyId: '',
  };

  // Local draft states
  const [codFee, setCodFee] = useState<number>(payments.codExtraCharge || 0);
  const [methods, setMethods] = useState({
    upi: payments.paymentMethods?.upi !== false,
    cards: payments.paymentMethods?.cards !== false,
    netbanking: payments.paymentMethods?.netbanking !== false,
    wallets: payments.paymentMethods?.wallets !== false,
  });
  const [environment, setEnvironment] = useState<'test' | 'live'>(payments.environment || 'test');

  // Advanced states (masked)
  const [keyId, setKeyId] = useState(payments.razorpayKeyId || '');

  // Synchronize local states when settings update
  useEffect(() => {
    if (settings.payments) {
      setCodFee(settings.payments.codExtraCharge || 0);
      setMethods({
        upi: settings.payments.paymentMethods?.upi !== false,
        cards: settings.payments.paymentMethods?.cards !== false,
        netbanking: settings.payments.paymentMethods?.netbanking !== false,
        wallets: settings.payments.paymentMethods?.wallets !== false,
      });
      setEnvironment(settings.payments.environment || 'test');
      setKeyId(settings.payments.razorpayKeyId || '');
    }
  }, [settings.payments]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <CreditCard size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Methods & Gateways</h2>
            <p className="text-xs text-slate-500">
              Control accepted customer payment methods, cash on delivery options, and sandbox test status.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Online Payment */}
      <SettingToggleCard
        id="enable-online-payment"
        name="Online Payments (Razorpay Gateway)"
        explanation="Accept digital payments directly from customers via UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and NetBanking."
        enabled={payments.onlinePaymentEnabled !== false}
        enabledLabel="Online Payments Active"
        disabledLabel="Online Payments Disabled"
        icon={CreditCard}
        onToggle={async (newVal) => {
          await onBatchUpdate({
            payments: {
              ...payments,
              onlinePaymentEnabled: newVal,
            },
          });
        }}
      />

      {/* 2. Cash on Delivery (COD) */}
      <SettingToggleCard
        id="enable-cod"
        name="Cash on Delivery (COD)"
        explanation="Allow customers to pay in cash or via delivery agent QR code upon package delivery."
        enabled={payments.codEnabled !== false}
        enabledLabel={payments.codExtraCharge > 0 ? `COD Active (+₹${payments.codExtraCharge})` : 'COD Active (Free)'}
        disabledLabel="COD Disabled"
        icon={Banknote}
        onToggle={async (newVal) => {
          await onBatchUpdate({
            payments: {
              ...payments,
              codEnabled: newVal,
            },
          });
        }}
        hasCustomConfig={true}
        onSaveConfig={async () => {
          await onBatchUpdate({
            payments: {
              ...payments,
              codExtraCharge: Number(codFee),
            },
          });
        }}
        onCancelConfig={() => setCodFee(payments.codExtraCharge || 0)}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Optional COD Handling Fee (INR ₹)</label>
          <div className="relative max-w-xs">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min={0}
              step={10}
              value={codFee}
              onChange={(e) => setCodFee(Number(e.target.value))}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Set to 0 for free Cash on Delivery. Any positive amount will be shown as a COD convenience fee at checkout.
          </p>
        </div>
      </SettingToggleCard>

      {/* 3. Accepted Payment Methods */}
      <SettingItemCard
        id="payment-methods"
        name="Accepted Payment Instruments"
        explanation="Choose which payment options are displayed to customers during online checkout."
        icon={Wallet}
        currentDisplay={
          <span className="text-slate-800 font-medium">
            {[
              payments.paymentMethods?.upi !== false && 'UPI',
              payments.paymentMethods?.cards !== false && 'Cards',
              payments.paymentMethods?.netbanking !== false && 'NetBanking',
              payments.paymentMethods?.wallets !== false && 'Wallets',
            ]
              .filter(Boolean)
              .join(', ') || 'None selected'}
          </span>
        }
        onSave={async () => {
          await onBatchUpdate({
            payments: {
              ...payments,
              paymentMethods: methods,
            },
          });
        }}
        onCancel={() =>
          setMethods({
            upi: payments.paymentMethods?.upi !== false,
            cards: payments.paymentMethods?.cards !== false,
            netbanking: payments.paymentMethods?.netbanking !== false,
            wallets: payments.paymentMethods?.wallets !== false,
          })
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Toggle accepted customer payment instruments:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={methods.upi}
                onChange={(e) => setMethods({ ...methods, upi: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Smartphone size={14} className="text-blue-600" /> Instant UPI
                </span>
                <span className="text-[11px] text-slate-500 truncate block">GPay, PhonePe, Paytm, BHIM & QR</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={methods.cards}
                onChange={(e) => setMethods({ ...methods, cards: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <CreditCard size={14} className="text-indigo-600" /> Credit & Debit Cards
                </span>
                <span className="text-[11px] text-slate-500 truncate block">Visa, Mastercard, RuPay, Maestro</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={methods.netbanking}
                onChange={(e) => setMethods({ ...methods, netbanking: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> NetBanking
                </span>
                <span className="text-[11px] text-slate-500 truncate block">50+ major Indian public & private banks</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={methods.wallets}
                onChange={(e) => setMethods({ ...methods, wallets: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <Wallet size={14} className="text-amber-600" /> Digital Wallets
                </span>
                <span className="text-[11px] text-slate-500 truncate block">Mobikwik, Freecharge, Airtel Money</span>
              </div>
            </label>
          </div>
        </div>
      </SettingItemCard>

      {/* 4. Test / Live Status */}
      <SettingItemCard
        id="payment-status"
        name="Payment Environment (Test vs. Live Status)"
        explanation="Toggle between safe test sandbox (using mock test cards) and production live transactions."
        icon={Zap}
        currentDisplay={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Active
          </span>
        }
        onSave={async () => {
          await onBatchUpdate({
            payments: {
              ...payments,
              environment,
            },
          });
        }}
        onCancel={() => setEnvironment(payments.environment || 'test')}
      >
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Select Operating Environment</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                environment === 'test'
                  ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="envMode"
                checked={environment === 'test'}
                onChange={() => setEnvironment('test')}
                className="mt-0.5 text-amber-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  🟡 Test Mode (Sandbox)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Allows simulating test orders without charging actual money. Perfect for verifying checkout flows.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                environment === 'live'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="envMode"
                checked={environment === 'live'}
                onChange={() => setEnvironment('live')}
                className="mt-0.5 text-emerald-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  🟢 Live Production Mode
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Accepts real customer cards, UPI apps, and deposits actual funds into your registered bank account.
                </span>
              </div>
            </label>
          </div>
        </div>
      </SettingItemCard>

      {/* 5. Advanced Settings (Technical Razorpay Configuration) */}
      <AdvancedOptionsSection
        id="advanced-payment-options"
        title="Advanced Payment Gateway Options"
        description="Technical gateway configuration and secure server integration. Secret keys are never exposed in browser code."
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <Lock size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Security Standard Enforced:</span>
              <span>
                Razorpay Secret Keys and Webhook Secrets are securely preserved inside server-side environment variables (`process.env.RAZORPAY_KEY_SECRET`). Client-side code never has access to raw private secrets.
              </span>
            </div>
          </div>

          <SettingItemCard
            id="razorpay-key-id"
            name="Razorpay Public Key ID"
            explanation="Public merchant key ID used to initialize customer checkout popups on the browser storefront."
            icon={KeyRound}
            currentDisplay={
              <span className="font-mono text-xs font-bold text-slate-800">
                {payments.razorpayKeyId ? `${payments.razorpayKeyId.slice(0, 12)}••••••` : 'Not configured'}
              </span>
            }
            onSave={async () => {
              if (!keyId.trim()) throw new Error('Razorpay Key ID cannot be empty.');
              await onBatchUpdate({
                payments: {
                  ...payments,
                  razorpayKeyId: keyId.trim(),
                },
              });
            }}
            onCancel={() => setKeyId(payments.razorpayKeyId || '')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Client-Side Razorpay Key ID</label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                placeholder="rzp_test_... or rzp_live_..."
              />
              <p className="text-[11px] text-slate-400">
                Found in your Razorpay Dashboard under Settings → API Keys.
              </p>
            </div>
          </SettingItemCard>

          {/* Webhook Status Info */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">Webhook Signature Verification</span>
              <p className="text-[11px] text-slate-500">Listens securely at endpoint <code>/api/webhooks/razorpay</code></p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold shrink-0 self-start sm:self-auto">
              <CheckCircle2 size={15} />
              <span>HMAC-SHA256 Active</span>
            </div>
          </div>
        </div>
      </AdvancedOptionsSection>
    </div>
  );
}
