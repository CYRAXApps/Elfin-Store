import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  RotateCcw, 
  CreditCard, 
  FileText, 
  MessageSquare, 
  Phone, 
  Mail, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Truck, 
  ArrowLeft, 
  Send, 
  Loader2, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Package, 
  MapPin, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { 
  SupportTicket, 
  ReturnRequest, 
  FAQItem, 
  PaymentRefund, 
  Order, 
  SupportTicketCategory, 
  SupportTicketPriority,
  ReturnRequestStatus
} from '../../types';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PincodeDisplay } from '../common/PincodeDisplay';

interface HelpAndSupportSectionProps {
  userId: string;
  userEmail: string;
  userName: string;
  isStandaloneView?: boolean;
  activeSubTab?: 'help' | 'tickets' | 'returns' | 'refunds';
  onNavigateView: (view: string, status?: string) => void;
  userOrders?: Order[];
}

export function HelpAndSupportSection({
  userId,
  userEmail,
  userName,
  isStandaloneView = false,
  activeSubTab = 'help',
  onNavigateView,
  userOrders = []
}: HelpAndSupportSectionProps) {
  const { settings } = useSiteSettings();
  const supportPhone = settings.general?.phone || settings.contact?.phone || '';
  const supportEmail = settings.general?.supportEmail || settings.contact?.supportEmail || settings.general?.storeEmail || '';

  // Current active sub-tab for standalone view
  const [currentTab, setCurrentTab] = useState<'help' | 'tickets' | 'returns' | 'refunds'>(activeSubTab);

  // Data states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [refunds, setRefunds] = useState<PaymentRefund[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [faqCategory, setFaqCategory] = useState('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Ticket Conversation Modal state
  const [selectedTicket, setSelectedTicket] = useState<{ ticket: SupportTicket; messages: any[] } | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Create Ticket Modal state
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketCategory, setTicketCategory] = useState<SupportTicketCategory>('general');
  const [ticketPriority, setTicketPriority] = useState<SupportTicketPriority>('medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [createTicketSuccess, setCreateTicketSuccess] = useState<string | null>(null);
  const [createTicketError, setCreateTicketError] = useState<string | null>(null);

  // Return Request Modal state
  const [isRequestReturnOpen, setIsRequestReturnOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [eligibilityData, setEligibilityData] = useState<any | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState<Record<string, { selected: boolean; qty: number; reason: string; condition: string }>>({});
  const [overallReturnReason, setOverallReturnReason] = useState('defective');
  const [returnComments, setReturnComments] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);
  const [returnErrorMsg, setReturnErrorMsg] = useState<string | null>(null);

  // Copy tracking state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync activeSubTab prop when changed
  useEffect(() => {
    setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  // Load public FAQs
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch('/api/support/faqs').then(r => r.json());
        if (Array.isArray(res)) {
          setFaqs(res);
        }
      } catch (err) {
        console.warn('Failed to load FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  // Real-time Firestore listeners for Tickets and Returns, plus Refunds fetch
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Real-time Support Tickets
    const qTickets = query(
      collection(db, 'support_tickets'),
      where('userId', '==', userId)
    );
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
        updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt
      })) as SupportTicket[];
      list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      setTickets(list);
    }, (err) => {
      console.warn('Tickets subscription error:', err);
    });

    // 2. Real-time Returns
    const qReturns = query(
      collection(db, 'return_requests'),
      where('userId', '==', userId)
    );
    const unsubReturns = onSnapshot(qReturns, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
        updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt
      })) as ReturnRequest[];
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setReturns(list);
    }, (err) => {
      console.warn('Returns subscription error:', err);
    });

    // 3. Real-time Customer Refunds via Firestore Client and API fallback
    const qRefunds = query(
      collection(db, 'refunds'),
      where('userId', '==', userId)
    );
    const unsubRefunds = onSnapshot(qRefunds, (snap) => {
      const dbList = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
        processedAt: d.data().processedAt?.toDate ? d.data().processedAt.toDate().toISOString() : d.data().processedAt
      })) as PaymentRefund[];

      const orderRefunds: PaymentRefund[] = [];
      const seenIds = new Set(dbList.map(r => r.orderId || r.id));

      (userOrders || []).forEach(ord => {
        const refundedAmt = Number(ord?.payment?.refundedAmount || 0);
        const isRefundedStatus = ord?.payment?.paymentStatus === 'refunded' || ord?.payment?.paymentStatus === 'partially_refunded' || ord?.status === 'refunded' || ord?.status === 'returned';
        if ((refundedAmt > 0 || isRefundedStatus) && !seenIds.has(ord.id)) {
          const totalAmt = Number(ord.grandTotal || ord.totalAmount || 0);
          orderRefunds.push({
            id: `ref_${ord.id.slice(0, 10)}`,
            orderId: ord.id,
            invoiceNumber: ord.invoiceNumber || `EST-${ord.id.slice(0, 6)}`,
            paymentId: ord?.payment?.razorpayPaymentId || `pay_${ord.id.slice(0, 8)}`,
            customerName: ord?.shippingAddress?.fullName || userName || 'Customer',
            customerEmail: ord?.shippingAddress?.email || userEmail || '',
            originalAmount: totalAmt,
            refundAmount: refundedAmt > 0 ? refundedAmt : totalAmt,
            status: isRefundedStatus ? 'processed' : 'processing',
            reason: ord?.cancellationReason || ord?.returnReason || 'Order Cancellation / Return Refund',
            razorpayRefundId: (ord?.payment as any)?.razorpayRefundId || (ord?.payment as any)?.refundId || undefined,
            adminEmail: supportEmail,
            createdAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
            processedAt: ord.updatedAt || new Date().toISOString()
          });
        }
      });

      const combined = [...dbList, ...orderRefunds];
      combined.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRefunds(combined);
      setLoading(false);
    }, () => {
      // Fallback to userOrders refunds on listener notice
      const orderRefunds: PaymentRefund[] = [];
      (userOrders || []).forEach(ord => {
        const refundedAmt = Number(ord?.payment?.refundedAmount || 0);
        const isRefundedStatus = ord?.payment?.paymentStatus === 'refunded' || ord?.payment?.paymentStatus === 'partially_refunded' || ord?.status === 'refunded' || ord?.status === 'returned';
        if (refundedAmt > 0 || isRefundedStatus) {
          const totalAmt = Number(ord.grandTotal || ord.totalAmount || 0);
          orderRefunds.push({
            id: `ref_${ord.id.slice(0, 10)}`,
            orderId: ord.id,
            invoiceNumber: ord.invoiceNumber || `EST-${ord.id.slice(0, 6)}`,
            paymentId: ord?.payment?.razorpayPaymentId || `pay_${ord.id.slice(0, 8)}`,
            customerName: ord?.shippingAddress?.fullName || userName || 'Customer',
            customerEmail: ord?.shippingAddress?.email || userEmail || '',
            originalAmount: totalAmt,
            refundAmount: refundedAmt > 0 ? refundedAmt : totalAmt,
            status: isRefundedStatus ? 'processed' : 'processing',
            reason: ord?.cancellationReason || ord?.returnReason || 'Order Cancellation / Return Refund',
            razorpayRefundId: (ord?.payment as any)?.razorpayRefundId || (ord?.payment as any)?.refundId || undefined,
            adminEmail: supportEmail,
            createdAt: ord.updatedAt || ord.createdAt || new Date().toISOString(),
            processedAt: ord.updatedAt || new Date().toISOString()
          });
        }
      });
      setRefunds(orderRefunds);
      setLoading(false);
    });

    // Optional API fetch for reconciled refunds
    const fetchRefunds = async () => {
      try {
        const res = await fetch(`/api/support/refunds?userId=${userId}`).then(r => r.json());
        if (Array.isArray(res) && res.length > 0) {
          setRefunds(prev => {
            const seen = new Set(prev.map(p => p.id || p.orderId));
            const merged = [...prev];
            res.forEach(item => {
              if (!seen.has(item.id) && !seen.has(item.orderId)) {
                merged.push(item);
              }
            });
            merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            return merged;
          });
        }
      } catch {
        // Non-blocking fallback handled
      }
    };
    fetchRefunds();

    return () => {
      unsubTickets();
      unsubReturns();
      unsubRefunds();
    };
  }, [userId, userOrders, userEmail, userName]);

  // Fetch single ticket details and conversation
  const handleOpenTicketDetails = async (ticketId: string) => {
    setLoadingTicketDetail(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}?userId=${userId}`).then(r => r.json());
      if (res && !res.error) {
        setSelectedTicket(res);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  // Reply to ticket
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          senderName: userName || userEmail.split('@')[0] || 'Customer',
          senderRole: 'customer',
          message: replyText.trim()
        })
      }).then(r => r.json());

      if (res.success) {
        setReplyText('');
        handleOpenTicketDetails(selectedTicket.ticket.id);
      }
    } catch (err) {
      console.error('Send reply error:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    setSubmittingTicket(true);
    setCreateTicketError(null);
    setCreateTicketSuccess(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerName: userName || userEmail.split('@')[0] || 'Customer',
          customerEmail: userEmail,
          orderId: ticketOrderId || undefined,
          category: ticketCategory,
          priority: ticketPriority,
          subject: ticketSubject.trim(),
          description: ticketDescription.trim()
        })
      }).then(r => r.json());

      if (res.success) {
        setCreateTicketSuccess(`Ticket #${res.ticketNumber} created successfully! Our team will respond shortly.`);
        setTicketSubject('');
        setTicketDescription('');
        setTicketOrderId('');
        setTimeout(() => {
          setIsCreateTicketOpen(false);
          setCreateTicketSuccess(null);
          setCurrentTab('tickets');
        }, 1800);
      } else {
        setCreateTicketError(res.error || 'Failed to create ticket.');
      }
    } catch (err: any) {
      setCreateTicketError(err.message || 'Error creating ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Return Eligibility check
  const checkEligibilityForOrder = async (orderId: string) => {
    if (!orderId || !userId) return;
    setEligibilityLoading(true);
    setReturnErrorMsg(null);
    try {
      const res = await fetch(`/api/support/returns/eligibility?orderId=${orderId}&userId=${userId}`).then(r => r.json());
      setEligibilityData(res);
      if (res.eligible && res.items) {
        const initItems: Record<string, any> = {};
        res.items.forEach((it: any) => {
          initItems[it.productId] = {
            selected: it.isReturnable,
            qty: 1,
            reason: 'Defective / Not working',
            condition: 'opened'
          };
        });
        setSelectedReturnItems(initItems);
      }
    } catch (err) {
      console.error('Eligibility check error:', err);
      setReturnErrorMsg('Failed to check eligibility for this order.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  const handleSelectOrderForReturn = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setReturnOrderId(val);
    if (val) {
      checkEligibilityForOrder(val);
    } else {
      setEligibilityData(null);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId) return;

    const itemsToReturn: any[] = [];
    if (eligibilityData?.items) {
      eligibilityData.items.forEach((it: any) => {
        const sel = selectedReturnItems[it.productId];
        if (sel && sel.selected) {
          itemsToReturn.push({
            productId: it.productId,
            productName: it.name || it.productName || 'Product',
            sku: it.sku || '',
            quantity: sel.qty || 1,
            unitPrice: it.price || it.unitPrice || 0,
            reason: sel.reason || overallReturnReason,
            condition: sel.condition || 'opened',
            requestedResolution: 'refund'
          });
        }
      });
    }

    if (itemsToReturn.length === 0) {
      setReturnErrorMsg('Please select at least one item to return.');
      return;
    }

    setSubmittingReturn(true);
    setReturnErrorMsg(null);
    try {
      const res = await fetch('/api/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnOrderId,
          userId,
          customerName: userName || userEmail.split('@')[0] || 'Customer',
          customerEmail: userEmail,
          items: itemsToReturn,
          overallReason: overallReturnReason,
          comments: returnComments,
          pickupAddress: eligibilityData?.pickupAddress
        })
      }).then(r => r.json());

      if (res.success) {
        setReturnSuccessMsg(`Return request #${res.returnNumber} created! Pickup will be scheduled shortly.`);
        setTimeout(() => {
          setIsRequestReturnOpen(false);
          setReturnSuccessMsg(null);
          setCurrentTab('returns');
        }, 2000);
      } else {
        setReturnErrorMsg(res.error || 'Failed to submit return request.');
      }
    } catch (err: any) {
      setReturnErrorMsg(err.message || 'Error submitting return.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Badges
  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Open</span>;
      case 'in_progress':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">In Progress</span>;
      case 'waiting_on_customer':
      case 'waiting_customer':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Action Required</span>;
      case 'resolved':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Resolved</span>;
      case 'closed':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Closed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getTicketPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-red-700 font-bold text-[10px] uppercase">Urgent</span>;
      case 'high':
        return <span className="text-amber-700 font-bold text-[10px] uppercase">High</span>;
      case 'medium':
        return <span className="text-blue-700 font-bold text-[10px] uppercase">Medium</span>;
      case 'low':
        return <span className="text-slate-500 font-bold text-[10px] uppercase">Low</span>;
      default:
        return null;
    }
  };

  // 11-step Return Status Badge
  const getReturnStatusBadge = (status: ReturnRequestStatus | string) => {
    switch (status) {
      case 'requested':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Requested</span>;
      case 'under_review':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Under Review</span>;
      case 'approved':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Approved</span>;
      case 'pickup_scheduled':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pickup Scheduled</span>;
      case 'received':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Received</span>;
      case 'inspected':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Inspected</span>;
      case 'refund_processing':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Refund Processing</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Completed</span>;
      case 'refunded':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Refunded</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Rejected</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  // Refund Status Badge
  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>;
      case 'processing':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Processing</span>;
      case 'processed':
      case 'refunded':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Processed / Refunded</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Failed</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  // Filtered FAQs
  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = searchQuery === '' || 
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = faqCategory === 'all' || f.category.toLowerCase() === faqCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  // Open ticket count
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_customer').length;
  const activeReturnsCount = returns.filter(r => r.status !== 'completed' && r.status !== 'refunded' && r.status !== 'rejected' && r.status !== 'cancelled').length;

  // -------------------------------------------------------------
  // RENDER: DASHBOARD VIEW (Compact Flipkart-style card)
  // -------------------------------------------------------------
  if (!isStandaloneView) {
    return (
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Help, Support, Returns & Refunds</h2>
          </div>
          <button 
            onClick={() => onNavigateView('help')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
          >
            Help Center <ChevronRight size={13} />
          </button>
        </div>

        {/* Quick Hub Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3.5">
          
          {/* Help Center & FAQs */}
          <button
            onClick={() => onNavigateView('help')}
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 bg-slate-50/50 text-slate-700 hover:text-blue-700 transition-all text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <HelpCircle size={15} />
            </div>
            <span className="font-bold block text-slate-900 group-hover:text-blue-700 text-xs">Help & FAQs</span>
            <span className="text-[11px] text-slate-400">Policies & solutions</span>
          </button>

          {/* My Support Tickets */}
          <button
            onClick={() => onNavigateView('tickets')}
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 bg-slate-50/50 text-slate-700 hover:text-blue-700 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100/60 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText size={15} />
              </div>
              {openTicketsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {openTicketsCount} open
                </span>
              )}
            </div>
            <span className="font-bold block text-slate-900 group-hover:text-blue-700 text-xs">Support Tickets</span>
            <span className="text-[11px] text-slate-400">
              {tickets.length > 0 ? `${tickets.length} submitted` : 'Track requests'}
            </span>
          </button>

          {/* My Returns */}
          <button
            onClick={() => onNavigateView('returns')}
            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 bg-slate-50/50 text-slate-700 hover:text-emerald-700 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <RotateCcw size={15} />
              </div>
              {activeReturnsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                  {activeReturnsCount} active
                </span>
              )}
            </div>
            <span className="font-bold block text-slate-900 group-hover:text-emerald-700 text-xs">My Returns</span>
            <span className="text-[11px] text-slate-400">
              {returns.length > 0 ? `${returns.length} return requests` : '7-day returns'}
            </span>
          </button>

          {/* My Refunds */}
          <button
            onClick={() => onNavigateView('refunds')}
            className="p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/40 bg-slate-50/50 text-slate-700 hover:text-purple-700 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CreditCard size={15} />
              </div>
              {refunds.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                  {refunds.length}
                </span>
              )}
            </div>
            <span className="font-bold block text-slate-900 group-hover:text-purple-700 text-xs">My Refunds</span>
            <span className="text-[11px] text-slate-400">
              {refunds.length > 0 ? 'View records' : 'Gateway & bank credits'}
            </span>
          </button>
        </div>

        {(supportPhone || supportEmail) && (
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-800">Need Immediate Help?</span>
              {(settings.general?.businessHours || settings.contact?.openingHours) && (
                <>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <span className="text-slate-500">{settings.general?.businessHours || settings.contact?.openingHours}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {supportPhone && (
                <a 
                  href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`} 
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline text-[11px]"
                >
                  <Phone size={12} /> Call: {supportPhone}
                </a>
              )}
              {supportEmail && (
                <a 
                  href={`mailto:${supportEmail}`} 
                  className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-800 hover:underline text-[11px]"
                >
                  <Mail size={12} /> Email: {supportEmail}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FULL SUBVIEW (Help / Tickets / Returns / Refunds)
  // -------------------------------------------------------------
  return (
    <div className="space-y-4">
      
      {/* Top Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Help, Support & Resolutions</h2>
            <p className="text-slate-500 text-xs mt-0.5">Manage support inquiries, track returns, and view real refund credits.</p>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            {currentTab === 'tickets' && (
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} /> New Ticket
              </button>
            )}
            {currentTab === 'returns' && (
              <button
                onClick={() => setIsRequestReturnOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus size={14} /> Request Return
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto hide-scrollbar">
          {[
            { id: 'help', label: 'Help & FAQs', icon: HelpCircle, count: 0 },
            { id: 'tickets', label: 'Support Tickets', icon: FileText, count: openTicketsCount },
            { id: 'returns', label: 'My Returns', icon: RotateCcw, count: activeReturnsCount },
            { id: 'refunds', label: 'My Refunds', icon: CreditCard, count: refunds.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id as any);
                  onNavigateView(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: HELP & FAQS
      ------------------------------------------------------------- */}
      {currentTab === 'help' && (
        <div className="space-y-4">
          
          {/* Search bar & Categories */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
            <div className="relative mb-3.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues, orders, return window, GST invoice..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* FAQ Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Topics' },
                { id: 'Orders & Shipping', label: 'Orders & Shipping' },
                { id: 'Returns & Refunds', label: 'Returns & Refunds' },
                { id: 'Payments & GST', label: 'Payments & GST' },
                { id: 'Warranty & Support', label: 'Warranty & Support' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFaqCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                    faqCategory.toLowerCase() === cat.id.toLowerCase()
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Frequently Asked Questions ({filteredFaqs.length})
            </h3>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching questions found for "{searchQuery}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFaqs.map(faq => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div key={faq.id} className="py-3">
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between text-left gap-3 group cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 text-xs sm:text-sm">
                          {faq.question}
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`text-slate-400 group-hover:text-blue-600 transition-transform shrink-0 ${
                            isOpen ? 'rotate-180 text-blue-600' : ''
                          }`} 
                        />
                      </button>
                      {isOpen && (
                        <div className="mt-2 text-xs text-slate-600 leading-relaxed pl-2 border-l-2 border-blue-500 bg-slate-50/50 p-2.5 rounded-r-lg">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact Support Grid */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Direct Contact & Escalation Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {supportPhone ? (
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center mb-2">
                    <Phone size={16} />
                  </div>
                  <span className="font-bold block text-slate-900">Phone Support</span>
                  <span className="text-slate-500 text-[11px] block mb-2">{supportPhone}</span>
                  <a href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`} className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]">
                    Call Now <ChevronRight size={12} />
                  </a>
                </div>
              ) : null}

              {supportEmail ? (
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center mb-2">
                    <Mail size={16} />
                  </div>
                  <span className="font-bold block text-slate-900">Email Inquiries</span>
                  <span className="text-slate-500 text-[11px] block mb-2">{supportEmail}</span>
                  <a href={`mailto:${supportEmail}`} className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]">
                    Compose Email <ChevronRight size={12} />
                  </a>
                </div>
              ) : null}

              {(settings.general?.businessHours || settings.contact?.openingHours) ? (
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center mb-2">
                    <Clock size={16} />
                  </div>
                  <span className="font-bold block text-slate-900">Operating Hours</span>
                  <span className="text-slate-500 text-[11px] block mb-2">{settings.general?.businessHours || settings.contact?.openingHours}</span>
                  <span className="text-purple-700 font-semibold text-[11px]">Response SLA: &lt; 24h</span>
                </div>
              ) : null}
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: SUPPORT TICKETS
      ------------------------------------------------------------- */}
      {currentTab === 'tickets' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Loading support tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Support Tickets Raised</h3>
              <p className="text-slate-500 text-xs mb-4">
                You haven't opened any support requests. If you have questions regarding an order or payment, raise a ticket below.
              </p>
              <button
                onClick={() => setIsCreateTicketOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Create Support Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const dateStr = ticket.createdAt 
                  ? new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'N/A';

                return (
                  <div 
                    key={ticket.id} 
                    className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 hover:border-blue-200 transition-all shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-xs">#{ticket.ticketNumber}</span>
                        {getTicketStatusBadge(ticket.status)}
                        {getTicketPriorityBadge(ticket.priority)}
                        <span className="text-slate-400 text-[11px]">• {dateStr}</span>
                      </div>
                      {ticket.invoiceNumber && (
                        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          Order: #{ticket.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{ticket.subject}</h4>
                    <p className="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed">
                      {ticket.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400 capitalize">
                        Category: {ticket.category.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => handleOpenTicketDetails(ticket.id)}
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <MessageSquare size={13} /> View Conversation <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: MY RETURNS (11 Status Steps & Real Data)
      ------------------------------------------------------------- */}
      {currentTab === 'returns' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Loading return requests...
            </div>
          ) : returns.length === 0 ? (
            <div className="p-10 text-center max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <RotateCcw size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Active Returns</h3>
              <p className="text-slate-500 text-xs mb-4">
                You have not requested any returns. All eligible electronics can be returned within 7 days of delivery.
              </p>
              <button
                onClick={() => setIsRequestReturnOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} /> Request Return
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {returns.map(ret => {
                const dateStr = ret.createdAt 
                  ? new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'N/A';

                return (
                  <div key={ret.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    
                    {/* Header */}
                    <div className="bg-slate-50/80 border-b border-slate-100 p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-slate-900">Return #{ret.returnNumber}</span>
                          {getReturnStatusBadge(ret.status)}
                          <span className="text-slate-400 text-[11px]">• Requested on {dateStr}</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          Related Order: <strong>#{ret.invoiceNumber || ret.orderId}</strong>
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Refund Amount</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          ₹{Number(ret.refundAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] font-semibold block capitalize ${
                          ret.refundStatus === 'issued' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          Refund {ret.refundStatus || 'pending'}
                        </span>
                      </div>
                    </div>

                    {/* Items to return */}
                    <div className="p-3.5 sm:p-4 space-y-2.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Returned Items</p>
                      <div className="divide-y divide-slate-100">
                        {ret.items?.map((item, i) => (
                          <div key={i} className="py-2 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                                <p className="text-slate-500 text-[11px]">
                                  Qty: {item.quantity} • Reason: {item.reason || ret.overallReason} • {item.condition}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-800 shrink-0">
                              ₹{(Number(item.unitPrice || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pickup Address details */}
                      {ret.pickupAddress && (
                        <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Doorstep Pickup Address</span>
                            <p className="font-bold text-slate-900">{ret.pickupAddress.fullName} • +91 {ret.pickupAddress.phone}</p>
                            <p className="text-slate-500 text-[11px]">
                              {ret.pickupAddress.addressLine1 || ret.pickupAddress.street || ret.pickupAddress.address}, {ret.pickupAddress.city}, {ret.pickupAddress.state} - <PincodeDisplay pincode={ret.pickupAddress.postalCode || ret.pickupAddress.pincode} />
                            </p>
                          </div>

                          {ret.trackingNumber && (
                            <div className="sm:text-right shrink-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Reverse Courier AWB</span>
                              <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                                <span>{ret.trackingNumber}</span>
                                <button
                                  onClick={() => copyText(ret.trackingNumber!)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                  title="Copy Reverse AWB"
                                >
                                  {copiedId === ret.trackingNumber ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                              <span className="text-slate-400 text-[10px]">{ret.carrier || 'Delhivery Return'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: MY REFUNDS (Real Refund Records & Status)
      ------------------------------------------------------------- */}
      {currentTab === 'refunds' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Loading refund records...
            </div>
          ) : refunds.length === 0 ? (
            <div className="p-10 text-center max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CreditCard size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No Refund Records Found</h3>
              <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                When you cancel an order or a return inspection completes, your Razorpay/bank refund records and gateway reference IDs will appear here.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 text-left border border-slate-100">
                <strong>Standard Processing Timelines:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-500">
                  <li>UPI / Net Banking: 2 to 4 business days</li>
                  <li>Debit / Credit Cards: 3 to 5 business days</li>
                  <li>Store Credit: Instant</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {refunds.map(ref => {
                const dateStr = ref.createdAt 
                  ? new Date(ref.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : 'N/A';

                return (
                  <div key={ref.id} className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-slate-900">Order #{ref.invoiceNumber || ref.orderId}</span>
                          {getRefundStatusBadge(ref.status)}
                          <span className="text-slate-400 text-[11px]">• {dateStr}</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          Payment Method: <strong>{(ref as any).paymentMethod || 'Online Gateway (Razorpay)'}</strong>
                        </span>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Refund Amount</span>
                        <span className="font-bold text-emerald-700 text-base">
                          ₹{Number(ref.refundAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <p>
                        <span className="text-slate-400">Reason:</span> <strong>{ref.reason || 'Order Refund'}</strong>
                      </p>
                      {ref.razorpayRefundId && (
                        <div className="flex items-center gap-1.5 text-[11px] pt-1">
                          <span className="text-slate-400">Gateway Reference:</span>
                          <span className="font-mono font-bold text-slate-800">{ref.razorpayRefundId}</span>
                          <button
                            onClick={() => copyText(ref.razorpayRefundId!)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            title="Copy reference ID"
                          >
                            {copiedId === ref.razorpayRefundId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: TICKET CONVERSATION & REPLY
      ------------------------------------------------------------- */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-slate-900 text-xs">#{selectedTicket.ticket.ticketNumber}</span>
                  {getTicketStatusBadge(selectedTicket.ticket.status)}
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-xs mt-0.5">
                  {selectedTicket.ticket.subject}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs bg-slate-50/30">
              {/* Initial message */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="font-bold text-slate-800">{selectedTicket.ticket.customerName} (You)</span>
                  <span className="text-slate-400">
                    {selectedTicket.ticket.createdAt ? new Date(selectedTicket.ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.ticket.description}</p>
              </div>

              {/* Replies */}
              {selectedTicket.messages?.map((msg, idx) => {
                const isCustomer = msg.senderRole === 'customer';
                return (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border text-xs shadow-2xs ${
                      isCustomer 
                        ? 'bg-white border-slate-200 ml-4' 
                        : 'bg-blue-50/80 border-blue-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className={`font-bold ${isCustomer ? 'text-slate-800' : 'text-blue-900'}`}>
                        {msg.senderName} {isCustomer ? '(You)' : '• Support Specialist'}
                      </span>
                      <span className="text-slate-400">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className={`leading-relaxed whitespace-pre-wrap ${isCustomer ? 'text-slate-700' : 'text-blue-950'}`}>
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            {selectedTicket.ticket.status !== 'closed' ? (
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply to the support specialist..."
                  className="flex-1 p-2 rounded-xl border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                >
                  {submittingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            ) : (
              <div className="p-3 bg-slate-100 text-center text-slate-500 text-xs">
                This ticket has been marked as closed. Please create a new ticket for further assistance.
              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: CREATE NEW TICKET
      ------------------------------------------------------------- */}
      {isCreateTicketOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Raise New Support Ticket</h4>
              </div>
              <button
                onClick={() => setIsCreateTicketOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              {createTicketSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Ticket Created</h5>
                  <p className="text-emerald-800 text-xs">{createTicketSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateTicket} className="space-y-3">
                  {createTicketError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                      {createTicketError}
                    </div>
                  )}

                  {/* Associated Order Selector */}
                  {userOrders.length > 0 && (
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Related Order (Optional)</label>
                      <select
                        value={ticketOrderId}
                        onChange={(e) => setTicketOrderId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      >
                        <option value="">None / General Inquiry</option>
                        {userOrders.map(ord => (
                          <option key={ord.id} value={ord.id}>
                            Order #{ord.invoiceNumber || ord.id.slice(0, 8)} • ₹{(ord.grandTotal || ord.totalAmount || 0).toLocaleString()} • {ord.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as SupportTicketCategory)}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                      >
                        <option value="order_issue">Order Issue</option>
                        <option value="shipping_tracking">Shipping & Courier</option>
                        <option value="return_refund">Returns & Refunds</option>
                        <option value="payment_issue">Payment & Billing</option>
                        <option value="product_inquiry">Product & Tech Support</option>
                        <option value="general">General Inquiry</option>
                      </select>
                    </div>


                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Enter ticket subject"
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Enter issue details..."
                      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submittingTicket ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: REQUEST RETURN
      ------------------------------------------------------------- */}
      {isRequestReturnOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Initiate Return Request</h4>
              </div>
              <button
                onClick={() => setIsRequestReturnOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 text-xs">
              {returnSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-slate-900 text-sm">Return Created</h5>
                  <p className="text-emerald-800 text-xs">{returnSuccessMsg}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {returnErrorMsg && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                      {returnErrorMsg}
                    </div>
                  )}

                  {/* Order Selector */}
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Select Delivered Order</label>
                    <select
                      value={returnOrderId}
                      onChange={handleSelectOrderForReturn}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                    >
                      <option value="">-- Choose an order --</option>
                      {userOrders.filter(o => o.status === 'delivered').map(ord => (
                        <option key={ord.id} value={ord.id}>
                          Order #{ord.invoiceNumber || ord.id.slice(0, 8)} • ₹{(ord.grandTotal || ord.totalAmount || 0).toLocaleString()} • Delivered
                        </option>
                      ))}
                    </select>
                    {userOrders.filter(o => o.status === 'delivered').length === 0 && (
                      <p className="text-amber-600 text-[11px] mt-1">
                        No delivered orders available for return. Only delivered products can be returned.
                      </p>
                    )}
                  </div>

                  {eligibilityLoading && (
                    <div className="p-4 text-center text-slate-400">
                      <Loader2 className="animate-spin mx-auto mb-1 text-emerald-600" size={18} />
                      Checking return window...
                    </div>
                  )}

                  {eligibilityData && !eligibilityData.eligible && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                      {eligibilityData.reason}
                    </div>
                  )}

                  {eligibilityData && eligibilityData.eligible && (
                    <form onSubmit={handleSubmitReturn} className="space-y-3">
                      {/* Items */}
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Select Products to Return:</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {eligibilityData.items?.map((item: any) => {
                            const sel = selectedReturnItems[item.productId] || { selected: false, qty: 1, reason: '', condition: 'opened' };
                            return (
                              <div key={item.productId} className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={sel.selected}
                                    onChange={(e) => {
                                      setSelectedReturnItems({
                                        ...selectedReturnItems,
                                        [item.productId]: { ...sel, selected: e.target.checked }
                                      });
                                    }}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="font-bold block text-slate-900">{item.name}</span>
                                    <span className="text-slate-500 text-[11px]">₹{Number(item.price || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Reason for Return</label>
                        <select
                          value={overallReturnReason}
                          onChange={(e) => setOverallReturnReason(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          <option value="defective">Defective / Malfunctioning</option>
                          <option value="damaged">Damaged in transit</option>
                          <option value="wrong_item">Received wrong product</option>
                          <option value="not_as_described">Not as described on website</option>
                          <option value="missing_accessories">Missing accessories in box</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1">Details for Inspection Team</label>
                        <textarea
                          rows={2}
                          value={returnComments}
                          onChange={(e) => setReturnComments(e.target.value)}
                          placeholder="Enter details for inspection team..."
                          className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReturn}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {submittingReturn ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        Submit Return Request
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
