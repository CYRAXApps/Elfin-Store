import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Plus, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail, 
  Send, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  ExternalLink,
  RotateCcw,
  DollarSign,
  Package,
  Truck,
  X,
  Sparkles
} from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface PartnerTicketMessage {
  id: string;
  sender: 'PARTNER' | 'SUPPORT_AGENT';
  senderName: string;
  message: string;
  timestamp: string;
}

interface PartnerTicket {
  id: string;
  ticketId: string;
  storeId: string;
  storeName: string;
  category: string;
  subCategory?: string;
  orderId?: string;
  sku?: string;
  subject: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: PartnerTicketMessage[];
}

export function PartnerSupport() {
  const { partnerUser, partnerStore } = usePartnerAuth();
  const { settings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'tickets' | 'new_ticket' | 'faqs'>('tickets');
  const [tickets, setTickets] = useState<PartnerTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<PartnerTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // New Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    category: 'Returns & Claims',
    subCategory: 'Wrong item returned by courier',
    orderId: '',
    sku: '',
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    subject: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const fetchTickets = async (isManual = false) => {
    if (!partnerUser?.uid) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/partner/support/tickets', {
        headers: { 'x-partner-uid': partnerUser.uid }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch partner tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [partnerUser?.uid]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      setFormError('Please fill in both subject and detailed description.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/partner/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-uid': partnerUser?.uid || ''
        },
        body: JSON.stringify(ticketForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit support ticket.');
      }

      setFormSuccess(`Ticket #${data.ticket.ticketId} created successfully! Our partner operations desk will review it shortly.`);
      setTicketForm({
        category: 'Returns & Claims',
        subCategory: 'Wrong item returned by courier',
        orderId: '',
        sku: '',
        priority: 'MEDIUM',
        subject: '',
        description: ''
      });
      await fetchTickets();
      setTimeout(() => {
        setActiveTab('tickets');
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/partner/support/tickets/${selectedTicket.ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-uid': partnerUser?.uid || ''
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          senderName: partnerUser?.displayName || 'Partner Owner'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedMsgs = [...(selectedTicket.messages || []), data.message];
        const updatedTicket = { ...selectedTicket, messages: updatedMsgs };
        setSelectedTicket(updatedTicket);
        setTickets(prev => prev.map(t => t.ticketId === selectedTicket.ticketId ? updatedTicket : t));
        setReplyMessage('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const faqsList = [
    {
      q: 'What is Next Day Dispatch standard policy?',
      a: 'Orders received before 4:00 PM must be packed, labeled, and marked Ready to Ship for carrier pickup on the same or next business day. Next Day Dispatch partners receive up to 25% higher product catalog ranking across the storefront.'
    },
    {
      q: 'How do I claim reimbursement for damaged or missing returns?',
      a: 'You can raise a Return & Claim ticket within 7 calendar days of receiving a damaged, empty, or wrong customer return. Ensure you keep the outer packaging and take high-resolution unboxing images or videos for prompt claim approval.'
    },
    {
      q: 'When are payments and settlements credited to my bank account?',
      a: 'Settlements for delivered orders are calculated and released every Tuesday and Friday directly into your verified partner bank account, minus any applicable platform commissions and statutory GST TCS.'
    },
    {
      q: 'How do I download barcoded shipping labels?',
      a: 'Go to Orders -> All Orders tab, locate the order in "Ready to Ship" or "New" status, and click "Download Shipping Label". Print the barcode label clearly and paste it on the top surface of the parcel.'
    },
    {
      q: 'How can I update my warehouse address or GST information?',
      a: 'Navigate to Store Settings in your partner sidebar. Store Owners can edit the operating address, contact phone, and store display name anytime. GSTIN changes require validation by partner operations.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Headphones size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Partner Support & Helpdesk</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Priority assistance for <span className="font-bold text-slate-800">{partnerStore?.storeName}</span> (Store ID: {partnerStore?.storeId})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="Refresh tickets"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('new_ticket')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Raise Support Ticket</span>
          </button>
        </div>
      </div>

      {/* Quick Contact Hotline Cards */}
      {(settings.general?.phone || settings.contact?.phone || settings.general?.whatsappNumber || settings.general?.supportEmail || settings.contact?.supportEmail) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(settings.general?.phone || settings.contact?.phone) && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partner Hotline</p>
                <p className="text-sm font-black text-slate-900">{settings.general?.phone || settings.contact?.phone}</p>
                <p className="text-[10px] text-slate-500">{settings.general?.businessHours || settings.contact?.openingHours || 'Store Operating Hours'}</p>
              </div>
            </div>
          )}

          {(settings.general?.whatsappNumber || settings.contact?.whatsapp) && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Seller Assist</p>
                <p className="text-sm font-black text-slate-900">{settings.general?.whatsappNumber || settings.contact?.whatsapp}</p>
                <p className="text-[10px] text-emerald-600 font-bold">Instant live support for active orders</p>
              </div>
            </div>
          )}

          {(settings.general?.supportEmail || settings.contact?.supportEmail || settings.general?.storeEmail) && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Helpdesk</p>
                <p className="text-sm font-black text-slate-900">{settings.general?.supportEmail || settings.contact?.supportEmail || settings.general?.storeEmail}</p>
                <p className="text-[10px] text-slate-500">Avg. response time &lt; 2 hours</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-5 rounded-t-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={15} />
          <span>My Tickets ({tickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new_ticket')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'new_ticket'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus size={15} />
          <span>Raise New Ticket</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'faqs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle size={15} />
          <span>Help Center & Policies</span>
        </button>
      </div>

      {/* Tab 1: Ticket List */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">Loading support tickets...</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Ticket ID</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr 
                      key={t.ticketId || t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {t.ticketId || t.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{t.category}</span>
                        {t.subCategory && <p className="text-[10px] text-slate-400">{t.subCategory}</p>}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate font-semibold text-slate-900">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Headphones size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Support Tickets Raised Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Have questions regarding orders, courier pickups, returns, or payment settlements? Raise a ticket and get instant updates.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('new_ticket')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Create Your First Ticket
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Raise New Ticket Form */}
      {activeTab === 'new_ticket' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200/80 shadow-xs p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">Create a Partner Support Request</h2>
            <p className="text-xs text-slate-500 mb-6">
              Our dedicated partner operations team responds to all partner queries within standard SLAs.
            </p>

            {formSuccess && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Issue Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Returns & Claims">Returns & Damage Claims</option>
                    <option value="Payments & Settlement">Payments, Settlements & TCS</option>
                    <option value="Orders & Logistics">Orders, Shipping & Courier Pickup</option>
                    <option value="Catalog & Pricing">Product Catalog, SKU & Quality</option>
                    <option value="Account & GST">Partner Account, GST & Outlet Info</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="LOW">Low (General Query)</option>
                    <option value="MEDIUM">Medium (Standard Issue)</option>
                    <option value="HIGH">High (Urgent Dispatch / Settlement Issue)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-109283"
                    value={ticketForm.orderId}
                    onChange={(e) => setTicketForm({ ...ticketForm, orderId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product SKU / Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-TECH-882"
                    value={ticketForm.sku}
                    onChange={(e) => setTicketForm({ ...ticketForm, sku: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue..."
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Detailed Description & Proof Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe what happened in detail, including tracking numbers, dates, or defect specifications..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Help Center & Policy FAQs */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">Partner Operational Knowledgebase</h2>
            <p className="text-xs text-slate-500 mb-6">
              Official seller policies, dispatch deadlines, return claim criteria, and payout cycle terms.
            </p>

            <div className="space-y-3">
              {faqsList.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-900 text-xs">{faq.q}</span>
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Conversation Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-sm">#{selectedTicket.ticketId}</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400">Category: {selectedTicket.category} • Created {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[220px]">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                      msg.sender === 'PARTNER'
                        ? 'ml-auto bg-blue-50 text-blue-900 border border-blue-100'
                        : 'mr-auto bg-slate-100 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-bold text-[11px] text-slate-900">
                        {msg.sender === 'PARTNER' ? 'You (Partner)' : 'ElectroStore Helpdesk'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  {selectedTicket.description}
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Type your message to support desk..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={isSendingReply || !replyMessage.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isSendingReply ? 'Sending...' : 'Send'}</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
