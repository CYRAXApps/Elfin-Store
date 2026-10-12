import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, ShieldCheck, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface SavedPaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking';
  title: string;
  identifier: string; // e.g. user@okhdfcbank or •••• 4242
  isDefault?: boolean;
  addedAt: string;
}

export function CustomerPaymentMethodsSubView() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [upiLabel, setUpiLabel] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadPaymentMethods = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'payment_methods');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && Array.isArray(docSnap.data().methods)) {
          setMethods(docSnap.data().methods);
        } else {
          // Default initial empty list
          setMethods([]);
        }
      } catch (err) {
        console.warn('Notice loading payment methods:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, [user?.uid]);

  const saveMethodsToFirestore = async (updated: SavedPaymentMethod[]) => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'payment_methods');
      await setDoc(docRef, { methods: updated, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Notice saving payment methods:', err);
    }
  };

  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = newUpiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid UPI ID (e.g., yourname@okhdfcbank).' });
      return;
    }

    const newMethod: SavedPaymentMethod = {
      id: `upi_${Date.now()}`,
      type: 'upi',
      title: upiLabel.trim() || 'Personal UPI',
      identifier: cleanUpi,
      isDefault: methods.length === 0,
      addedAt: new Date().toISOString()
    };

    const updated = [...methods, newMethod];
    setMethods(updated);
    await saveMethodsToFirestore(updated);
    setNewUpiId('');
    setUpiLabel('');
    setShowAddUpi(false);
    setStatusMessage({ type: 'success', text: 'UPI ID successfully saved for faster checkout!' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDeleteMethod = async (id: string) => {
    const updated = methods.filter(m => m.id !== id);
    if (updated.length > 0 && !updated.some(m => m.isDefault)) {
      updated[0].isDefault = true;
    }
    setMethods(updated);
    await saveMethodsToFirestore(updated);
    setStatusMessage({ type: 'success', text: 'Payment method removed.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSetDefault = async (id: string) => {
    const updated = methods.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    setMethods(updated);
    await saveMethodsToFirestore(updated);
    setStatusMessage({ type: 'success', text: 'Default payment method updated.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Saved Payment Methods</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your saved UPI accounts and payment shortcuts for rapid, 1-click checkout.
          </p>
        </div>
        <button
          onClick={() => setShowAddUpi(!showAddUpi)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 shrink-0"
        >
          <Plus size={16} />
          <span>Add UPI ID</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {showAddUpi && (
        <form
          onSubmit={handleAddUpi}
          className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-200/80 rounded-2xl space-y-4"
        >
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Smartphone size={18} className="text-blue-600" />
            <span>Link New UPI Virtual Payment Address (VPA)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UPI ID / VPA <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newUpiId}
                onChange={e => setNewUpiId(e.target.value)}
                placeholder="e.g. mobile@paytm or name@okaxis"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Label / Nickname (Optional)
              </label>
              <input
                type="text"
                value={upiLabel}
                onChange={e => setUpiLabel(e.target.value)}
                placeholder="e.g. Google Pay / Primary HDFC"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddUpi(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Save UPI ID
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading payment preferences...</div>
      ) : methods.length === 0 ? (
        <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CreditCard size={22} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">No Saved Payment Methods</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your UPI ID or save your cards during checkout to enable express 1-click payments.
            </p>
          </div>
          <button
            onClick={() => setShowAddUpi(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Add UPI Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map(method => (
            <div
              key={method.id}
              className={`p-4 rounded-2xl border transition-all relative ${
                method.isDefault
                  ? 'bg-blue-50/40 border-blue-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      method.type === 'upi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {method.type === 'upi' ? <Smartphone size={20} /> : <CreditCard size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{method.title}</span>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-600 mt-0.5">{method.identifier}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMethod(method.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove payment method"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {!method.isDefault && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Set as Default
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-900 mb-0.5">RBI & PCI-DSS Compliant Storage</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Card details are tokenized securely through RBI certified payment gateways (Razorpay). Full card credentials, CVVs, and OTPs are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
