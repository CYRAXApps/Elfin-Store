import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, DollarSign, FileText, ChevronDown, ChevronUp, Check, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, doc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: (customerId: string) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded
}) => {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('');
  
  // Advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialStoreCredit, setInitialStoreCredit] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter the customer full name.');
      return;
    }

    if (!cleanMobile || cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      // Check if a customer with this phone number already exists
      const existingPhoneQuery = query(collection(db, 'users'), where('phoneNumber', '==', cleanMobile));
      const existingPhoneSnap = await getDocs(existingPhoneQuery);
      if (!existingPhoneSnap.empty) {
        const existing = existingPhoneSnap.docs[0];
        setError(`A customer with mobile number ${cleanMobile} already exists (Firebase UID: ${existing.id}). Cannot create duplicate customer record.`);
        setSubmitting(false);
        return;
      }

      if (cleanEmail) {
        const existingEmailQuery = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const existingEmailSnap = await getDocs(existingEmailQuery);
        if (!existingEmailSnap.empty) {
          const existing = existingEmailSnap.docs[0];
          setError(`A customer with email ${cleanEmail} already exists (Firebase UID: ${existing.id}). Cannot create duplicate customer record.`);
          setSubmitting(false);
          return;
        }
      }

      // 1. Create User Document in Firestore
      const newUserId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newUserData: any = {
        id: newUserId,
        uid: newUserId,
        name: cleanName,
        displayName: cleanName,
        phone: cleanMobile,
        phoneNumber: cleanMobile,
        email: cleanEmail || '',
        role: 'customer',
        status: 'active',
        disabled: false,
        notes: adminNotes.trim(),
        adminNotes: adminNotes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (addressLine.trim() || city.trim() || pincode.trim()) {
        newUserData.shippingAddress = {
          fullName: cleanName,
          phoneNumber: cleanMobile,
          addressLine1: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: 'India'
        };
      }

      // Dual-write to both users and customers collections
      await Promise.all([
        setDoc(doc(db, 'users', newUserId), newUserData),
        setDoc(doc(db, 'customers', newUserId), newUserData)
      ]);

      // 2. If initial store credit is provided, call adjustment API
      const creditAmount = Number(initialStoreCredit);
      if (creditAmount && creditAmount > 0) {
        try {
          await fetch('/api/admin/store-credit/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: newUserId,
              amount: creditAmount,
              reason: 'Account Opening Bonus / Initial Balance',
              adminEmail: 'Admin',
              userName: cleanName,
              userEmail: cleanEmail || ''
            })
          });
        } catch (creditErr) {
          console.warn('Initial store credit adjustment notice:', creditErr);
        }
      }

      // Reset form
      setFullName('');
      setMobile('');
      setEmail('');
      setAddressLine('');
      setCity('');
      setState('West Bengal');
      setPincode('');
      setInitialStoreCredit('');
      setAdminNotes('');
      setShowAdvanced(false);

      if (onCustomerAdded) {
        onCustomerAdded(newUserId);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      setError(err?.message || 'Failed to create customer record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="add-customer-modal-backdrop" 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="add-customer-modal-card" 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Add New Customer</h3>
              <p className="text-xs text-slate-500">Create a registered store customer account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="add-customer-name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Customer's Full Name"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Mobile & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="add-customer-mobile-input"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="add-customer-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Address Information <span className="text-slate-400 font-normal">(Optional)</span>
            </span>

            <div>
              <input
                id="add-customer-address-input"
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Street Address / Flat / Building"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                id="add-customer-city-input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <input
                id="add-customer-state-input"
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <input
                id="add-customer-pincode-input"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Collapsible Advanced Options */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>Advanced Options (Store Credit & Notes)</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Initial Store Credit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
                    <input
                      id="add-customer-credit-input"
                      type="number"
                      min="0"
                      step="1"
                      value={initialStoreCredit}
                      onChange={(e) => setInitialStoreCredit(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Admin Notes
                  </label>
                  <textarea
                    id="add-customer-notes-input"
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Private staff notes about this customer..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-customer-btn"
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating Customer...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
