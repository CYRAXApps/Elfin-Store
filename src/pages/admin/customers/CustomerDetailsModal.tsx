import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  ShoppingBag, 
  RotateCcw, 
  MessageSquare, 
  CreditCard,
  Award,
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpRight, 
  Send,
  Eye,
  Info,
  DollarSign,
  FileText,
  Save,
  Loader2,
  PlusCircle,
  MinusCircle,
  MoreVertical,
  Copy,
  Check,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getTicketStatusConfig, 
  getReturnStatusConfig,
  getRefundStatusBadge,
  getWhatsAppUrl, 
  getCallUrl, 
  getEmailUrl 
} from './customerUtils';
import { SupportTicket, ReturnRequest, StoreCreditTransaction } from '../../../types';
import { db } from '../../../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityConflict?: boolean;
  identityReviewRequired?: boolean;
  identityReviewReason?: string;
  conflictType?: string;
  conflictDetails?: string;
  conflictingWith?: Array<{
    uid: string;
    docId: string;
    collection: string;
    mobile?: string;
    email?: string;
  }>;
  role?: string;
  status?: 'active' | 'disabled' | 'inactive';
  disabled?: boolean;
  notes?: string;
  createdAt?: any;
  totalOrders: number;
  totalSpent: number;
  storeCredit?: number;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  lastOrderDate?: any;
  lastOrderNumber?: string;
  shippingAddress?: any;
  orders: any[];
  returns: ReturnRequest[];
  tickets: SupportTicket[];
  inquiries?: any[];
}

interface CustomerDetailsModalProps {
  customer: CustomerData | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAccountStatus: (customerId: string, currentDisabled: boolean) => Promise<void>;
  onViewOrder: (order: any) => void;
  onViewReturn: (ret: ReturnRequest) => void;
  onViewTicket: (ticket: SupportTicket) => void;
  onGoToOrders: (customerEmail: string) => void;
  onSaveNotes?: (customerId: string, notes: string) => Promise<void>;
  onCreditAdjusted?: () => void;
  onDeleteCustomer?: (customerId: string) => Promise<void>;
  initialTab?: 'overview' | 'orders' | 'support' | 'returns' | 'store-credit';
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onToggleAccountStatus,
  onViewOrder,
  onViewReturn,
  onViewTicket,
  onGoToOrders,
  onCreditAdjusted,
  onDeleteCustomer,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'support' | 'returns' | 'store-credit'>(initialTab);
  const [customerNotes, setCustomerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [statusActionConfirm, setStatusActionConfirm] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [deleteActionConfirm, setDeleteActionConfirm] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // More menu popover
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Store credit transactions state
  const [transactions, setTransactions] = useState<StoreCreditTransaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('Manual staff adjustment');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustingCredit, setAdjustingCredit] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [currentCreditBalance, setCurrentCreditBalance] = useState(0);

  // Sync state when customer changes
  useEffect(() => {
    if (customer) {
      setCustomerNotes(customer.notes || '');
      setStatusActionConfirm(false);
      setCurrentCreditBalance(customer.storeCredit || 0);
      setActiveTab(initialTab);
    }
  }, [customer, initialTab]);

  // Load transactions when store-credit tab is viewed
  useEffect(() => {
    if (customer && activeTab === 'store-credit') {
      fetchTransactions(customer.id);
    }
  }, [customer?.id, activeTab]);

  const fetchTransactions = async (userId: string) => {
    setLoadingTxs(true);
    try {
      const res = await fetch(`/api/admin/store-credit/transactions?userId=${encodeURIComponent(userId)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data || []);
      }
    } catch (err) {
      console.warn('Failed to load store credit transactions:', err);
    } finally {
      setLoadingTxs(false);
    }
  };

  if (!isOpen || !customer) return null;

  const isDisabled = customer.disabled || customer.status === 'disabled';
  const whatsappUrl = getWhatsAppUrl(customer.phone, customer.name);
  const callUrl = getCallUrl(customer.phone);
  const mailUrl = getEmailUrl(customer.email, customer.name);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const noteUpdates = {
        notes: customerNotes,
        adminNotes: customerNotes,
        updatedAt: new Date().toISOString()
      };
      await Promise.all([
        setDoc(doc(db, 'users', customer.id), noteUpdates, { merge: true }),
        setDoc(doc(db, 'customers', customer.id), noteUpdates, { merge: true })
      ]);
      customer.notes = customerNotes;
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save customer notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggle = async () => {
    try {
      setIsTogglingStatus(true);
      await onToggleAccountStatus(customer.id, isDisabled);
      setStatusActionConfirm(false);
      setShowMoreMenu(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleAdjustCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    const amountVal = Number(adjustAmount);
    if (!amountVal || amountVal <= 0) {
      setAdjustError('Please enter a valid credit amount greater than 0.');
      return;
    }

    setAdjustingCredit(true);
    try {
      const signedAmount = adjustType === 'add' ? amountVal : -amountVal;
      const res = await fetch('/api/admin/store-credit/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customer.id,
          amount: signedAmount,
          reason: adjustReason,
          note: adjustNote,
          adminEmail: 'Admin',
          userName: customer.name,
          userEmail: customer.email
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to adjust credit');
      }

      const result = await res.json();
      setCurrentCreditBalance(result.newBalance ?? (currentCreditBalance + signedAmount));
      customer.storeCredit = result.newBalance ?? (currentCreditBalance + signedAmount);
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustNote('');
      fetchTransactions(customer.id);
      if (onCreditAdjusted) onCreditAdjusted();
    } catch (err: any) {
      setAdjustError(err.message || 'Error processing credit adjustment');
    } finally {
      setAdjustingCredit(false);
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = async () => {
    if (!customer) return;
    try {
      setIsDeletingCustomer(true);
      if (onDeleteCustomer) {
        await onDeleteCustomer(customer.id);
      } else {
        const res = await fetch(`/api/admin/customers/${customer.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to delete customer');
        }
      }
      setDeleteActionConfirm(false);
      onClose();
    } catch (err: any) {
      alert(`Could not delete customer: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const totalSupportCount = customer.tickets.length + (customer.inquiries?.length || 0);

  return (
    <div 
      id="customer-details-modal-backdrop" 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      <div 
        id="customer-details-modal-card" 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shadow-2xs shrink-0 ${
              isDisabled ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
            }`}>
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
                  {customer.name || 'Unnamed Customer'}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isDisabled 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {isDisabled ? 'Disabled' : 'Active'}
                </span>

                {customer.identityConflict && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    Identity Conflict
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email || 'No email'}</span>
                  {customer.emailVerified ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Email Verified</span>
                  ) : customer.email ? (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">Unverified</span>
                  ) : null}
                </span>
                {customer.phone && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer.phone}</span>
                      {customer.phoneVerified !== false ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Phone Verified</span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">Unverified</span>
                      )}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Firebase UID:</span>
                <code className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 select-all font-semibold">
                  {customer.id}
                </code>
                <button
                  type="button"
                  onClick={() => copyText(customer.id, 'uid')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Copy permanent Firebase UID"
                >
                  {copiedField === 'uid' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            id="customer-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Ribbon: View Orders | Contact/Support | View Returns | View Store Credit | More */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Orders */}
            <button
              id="action-view-orders-btn"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'orders' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Orders ({customer.orders.length})</span>
            </button>

            {/* Contact / Support Shortcuts */}
            <div className="flex items-center gap-1">
              {customer.phone && (
                <>
                  <a
                    id="action-whatsapp-link"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                    title="Send WhatsApp message"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    id="action-call-link"
                    href={callUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
                    title="Call customer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </>
              )}
              {customer.email && (
                <a
                  id="action-email-link"
                  href={mailUrl}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
                  title="Send email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              )}
            </div>

            {/* View Returns */}
            <button
              id="action-view-returns-btn"
              onClick={() => setActiveTab('returns')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'returns' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Returns ({customer.returns.length})</span>
            </button>

            {/* View Store Credit */}
            <button
              id="action-view-credit-btn"
              onClick={() => setActiveTab('store-credit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'store-credit' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Credit ({formatCurrency(currentCreditBalance)})</span>
            </button>
          </div>

          {/* "More" Dropdown Menu */}
          <div className="relative">
            <button
              id="customer-more-menu-btn"
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <MoreVertical className="w-4 h-4" />
              <span>More</span>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => copyText(customer.id, 'id')}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Customer ID</span>
                  </span>
                  {copiedField === 'id' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                {customer.email && (
                  <button
                    type="button"
                    onClick={() => copyText(customer.email, 'email')}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Email</span>
                    </span>
                    {copiedField === 'email' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setStatusActionConfirm(true);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left font-bold flex items-center gap-2 cursor-pointer ${
                    isDisabled ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  {isDisabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>{isDisabled ? 'Re-enable Account' : 'Disable Account'}</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setDeleteActionConfirm(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left font-bold flex items-center gap-2 cursor-pointer text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Customer</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Customer Confirmation Banner (if triggered) */}
        {deleteActionConfirm && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Are you sure you want to permanently delete this customer and all associated data?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              >
                {isDeletingCustomer ? 'Deleting...' : 'Yes, Delete Completely'}
              </button>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={() => setDeleteActionConfirm(false)}
                className="px-2 py-1 text-slate-600 hover:text-slate-800 cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Account Status Confirmation Banner (if triggered) */}
        {statusActionConfirm && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs animate-in fade-in">
            <span className="text-amber-800 font-semibold">
              {isDisabled ? 'Are you sure you want to re-enable this customer account?' : 'Are you sure you want to disable this customer account?'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isTogglingStatus}
                onClick={handleToggle}
                className={`px-3 py-1 text-white text-xs font-bold rounded-lg cursor-pointer ${
                  isDisabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isTogglingStatus ? 'Updating...' : 'Yes, Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setStatusActionConfirm(false)}
                className="px-2 py-1 text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Identity Conflict & Review Required Diagnostic Banner */}
        {(customer.identityConflict || customer.identityReviewRequired) && (
          <div className="mx-6 my-3 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-amber-950">
                  {customer.identityReviewRequired ? 'Identity Review Required' : 'Identity Conflict Detected'}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 font-mono text-[10px] font-bold">
                  {customer.conflictType || (customer.identityReviewRequired ? 'IDENTITY_REVIEW_REQUIRED' : 'IDENTITY_CONFLICT')}
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed font-medium">
                {customer.identityReviewReason || customer.conflictDetails || 'This customer profile shares active credentials with another account or requires manual verification.'}
              </p>
              {customer.conflictingWith && customer.conflictingWith.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200/80 space-y-1.5">
                  <p className="font-semibold text-amber-900 text-[11px]">Conflicting Account Reference(s):</p>
                  {customer.conflictingWith.map((cw, idx) => (
                    <div key={idx} className="font-mono text-[11px] bg-white/90 p-2 rounded-lg border border-amber-200 flex flex-wrap gap-x-4 gap-y-1 text-amber-950">
                      <span><strong className="font-sans text-slate-500">UID:</strong> {cw.uid}</span>
                      {cw.mobile && <span><strong className="font-sans text-slate-500">Phone:</strong> {cw.mobile}</span>}
                      {cw.email && <span><strong className="font-sans text-slate-500">Email:</strong> {cw.email}</span>}
                      <span><strong className="font-sans text-slate-500">Source:</strong> {cw.collection}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-amber-700 font-medium italic mt-1">
                Notice: Automatic merging is disabled to protect orders, rewards, and personal data. Records are safely preserved for administrator review.
              </p>
            </div>
          </div>
        )}

        {/* Simple 5 Tabs: Overview | Orders | Support | Returns | Store Credit */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'orders', label: `Orders (${customer.orders.length})`, icon: ShoppingBag },
            { id: 'support', label: `Support (${totalSupportCount})`, icon: MessageSquare },
            { id: 'returns', label: `Returns (${customer.returns.length})`, icon: RotateCcw },
            { id: 'store-credit', label: `Store Credit (${formatCurrency(currentCreditBalance)})`, icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isTabActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Metric Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Orders</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{customer.orders.length}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Spent</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(customer.totalSpent)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">Store Credit</p>
                  <p className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(currentCreditBalance)}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
                  <p className="text-[11px] text-purple-700 font-bold uppercase tracking-wider">Loyalty Tier</p>
                  <p className="text-base font-black text-purple-900 mt-1">
                    {customer.loyaltyTier || 'Standard'} ({customer.loyaltyPoints || 0} pts)
                  </p>
                </div>
              </div>

              {/* Information Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Contact & Registration Information */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Details</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Full Name</span>
                      <span className="font-bold text-slate-900">{customer.name || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Mobile Number</span>
                      <span className="font-bold text-slate-900">{customer.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Email Address</span>
                      <span className="font-bold text-slate-900">{customer.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Customer Since</span>
                      <span className="font-bold text-slate-900">{formatDate(customer.createdAt)}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Account Status</span>
                      <span className={`font-bold ${isDisabled ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDisabled ? 'Disabled (Access Blocked)' : 'Active (Good Standing)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purchase & Activity Summary */}
                <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Order Summary</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Last Order Date</span>
                      <span className="font-bold text-slate-900">{formatDate(customer.lastOrderDate)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Last Order ID</span>
                      <span className="font-bold text-slate-900">
                        {customer.lastOrderNumber ? `#${customer.lastOrderNumber}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Average Order Value</span>
                      <span className="font-bold text-slate-900">
                        {customer.orders.length > 0
                          ? formatCurrency(customer.totalSpent / customer.orders.length)
                          : '₹0'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500 font-medium">Returns Recorded</span>
                      <span className="font-bold text-slate-900">{customer.returns.length} return request(s)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Addresses */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Addresses on File
                </h3>
                {customer.shippingAddress ? (
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {customer.shippingAddress.fullName && <span className="font-bold text-slate-900">{customer.shippingAddress.fullName}<br /></span>}
                    {customer.shippingAddress.addressLine1 || customer.shippingAddress.street}<br />
                    {customer.shippingAddress.city}, {customer.shippingAddress.state} - <PincodeDisplay pincode={customer.shippingAddress.postalCode || customer.shippingAddress.pincode} /><br />
                    Phone: {customer.shippingAddress.phoneNumber || customer.phone || '—'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No saved delivery address recorded yet.</p>
                )}
              </div>

              {/* Internal Admin Customer Notes */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Internal Staff Notes</span>
                  </h3>
                  {notesSavedSuccess && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Notes Saved</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Private notes for preferences, VIP handling, packaging requests, or communication notes.
                </p>
                <textarea
                  id="customer-admin-notes-textarea"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Add private staff notes about this customer..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all resize-y"
                />
                <div className="flex justify-end">
                  <button
                    id="save-customer-notes-btn"
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveNotes}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    {savingNotes ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3" />
                        <span>Save Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Orders Placed by {customer.name} ({customer.orders.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    onGoToOrders(customer.email);
                    onClose();
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Orders Page</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(customer.orders || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No orders placed by this customer yet.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Order ID / Date</th>
                        <th className="py-2.5 px-3">Items</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(customer.orders || []).map((order: any) => {
                        const orderNum = order.orderNumber || order.invoiceNumber || order.id?.slice(0, 8);
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-medium">
                              <span className="font-bold text-blue-600 block">#{orderNum}</span>
                              <span className="text-slate-400 text-[11px]">{formatDate(order.createdAt)}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {order.items?.length || 1} item(s)
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {formatCurrency(order.grandTotal || order.totalAmount || 0)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="capitalize text-slate-700 font-medium">
                                {order.paymentMethod || 'Online'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                                order.status === 'delivered' || order.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {order.status || 'Processing'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onViewOrder(order)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                View Order
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Customer Support & Inquiry History ({totalSupportCount})
                </h3>
              </div>

              {totalSupportCount === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No support tickets or inquiries logged for this customer.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Request ID</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {/* Tickets */}
                      {(customer.tickets || []).map((tk: SupportTicket) => {
                        const statusConfig = getTicketStatusConfig(tk.status);
                        return (
                          <tr key={`tk-${tk.id}`} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                              #{tk.ticketNumber || tk.id.slice(0, 8)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 capitalize">
                              {tk.category || 'Support Ticket'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                              {tk.subject}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeClass}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {formatDate(tk.createdAt)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onViewTicket(tk)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                View Ticket
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Inquiries if present */}
                      {(customer.inquiries || []).map((inq: any) => (
                        <tr key={`inq-${inq.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                            #{inq.inquiryId || inq.id.slice(0, 8)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            General Inquiry
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate">
                            {inq.subject || 'Website Inquiry'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                              {inq.status || 'new'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {formatDate(inq.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="text-slate-400 text-xs italic">Logged in Support</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RETURNS & REFUNDS */}
          {activeTab === 'returns' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Return & Replacement Requests ({(customer.returns || []).length})
                </h3>
              </div>

              {(customer.returns || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <RotateCcw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No returns or replacement requests recorded for this customer.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Return ID</th>
                        <th className="py-2.5 px-3">Order</th>
                        <th className="py-2.5 px-3">Product Item</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(customer.returns || []).map((ret: ReturnRequest) => {
                        const statusConfig = getReturnStatusConfig(ret.status);
                        const firstItem: any = ret.items?.[0];
                        const productTitle = firstItem?.productName || firstItem?.productTitle || 'Item';
                        const orderRef = (ret as any).orderNumber || ret.orderId?.slice(0, 8) || 'Order';
                        return (
                          <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                              #{ret.returnNumber || ret.id.slice(0, 8)}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              #{orderRef}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 max-w-[180px] truncate">
                              {productTitle} {ret.items && ret.items.length > 1 && `(+${ret.items.length - 1} more)`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate">
                              {ret.overallReason || ret.items?.[0]?.reason || 'Return request'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeClass}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onViewReturn(ret)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                View Return
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STORE CREDIT */}
          {activeTab === 'store-credit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Balance Card with Quick Adjust Action */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Available Store Credit Balance
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(currentCreditBalance)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Account
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Store credit can be redeemed during checkout or applied to POS counter orders.
                  </p>
                </div>

                <button
                  id="adjust-store-credit-btn"
                  type="button"
                  onClick={() => setShowAdjustModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Adjust Store Credit</span>
                </button>
              </div>

              {/* Adjust Credit Inline Modal / Drawer */}
              {showAdjustModal && (
                <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-md space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Adjust Customer Store Credit
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAdjustModal(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {adjustError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {adjustError}
                    </div>
                  )}

                  <form onSubmit={handleAdjustCredit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType('add')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          adjustType === 'add'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add Credit (+)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType('deduct')}
                        className={`py-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          adjustType === 'deduct'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>Deduct Credit (-)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Adjustment Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="adjust-amount-input"
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Reason for Adjustment <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Manual staff adjustment">Manual Staff Adjustment</option>
                          <option value="Goodwill gesture / Compensation">Goodwill Gesture / Compensation</option>
                          <option value="Return / Refund Credit">Return / Refund Credit</option>
                          <option value="Promotional bonus">Promotional Bonus</option>
                          <option value="Correction of mistaken deduction">Correction of mistaken deduction</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Staff Note / Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder="e.g. Approved by Store Manager for order #ORD-1002"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAdjustModal(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={adjustingCredit}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                      >
                        {adjustingCredit ? 'Processing...' : 'Confirm Adjustment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Transaction History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Store Credit Transaction History
                </h4>

                {loadingTxs ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1.5 text-blue-600" />
                    <span>Loading transaction ledger...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No store credit transactions recorded for this customer.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Balance After</th>
                          <th className="py-2.5 px-3">Reason / Reference</th>
                          <th className="py-2.5 px-3 text-right">Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {transactions.map((tx) => {
                          const isPositive = tx.amount > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                                {formatDateTime(tx.createdAt)}
                              </td>
                              <td className="py-2.5 px-3 capitalize font-semibold text-slate-700">
                                {tx.type?.replace('_', ' ') || 'Adjustment'}
                              </td>
                              <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                                  {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                {formatCurrency(tx.balanceAfter)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                                {tx.reason || tx.note || '—'}
                                {tx.orderId && <span className="text-blue-600 ml-1">#{tx.orderId.slice(0, 8)}</span>}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                                {tx.adminEmail || 'Admin'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
