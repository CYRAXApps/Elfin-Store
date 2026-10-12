import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageSquare, RotateCcw, Search, Plus, ChevronRight, ChevronDown, 
  Clock, AlertCircle, CheckCircle2, ShieldCheck, FileText, ArrowLeft, Send, 
  Box, Truck, RefreshCw, X, ExternalLink, ThumbsUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SupportTicket, ReturnRequest, FAQItem, HelpArticle, SupportSettings } from '../types';

export function SupportCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'help';
  const prefilledOrderId = searchParams.get('orderId') || '';

  const [activeTab, setActiveTab] = useState<'help' | 'tickets' | 'returns'>(
    initialTab === 'tickets' ? 'tickets' : initialTab === 'returns' ? 'returns' : 'help'
  );

  // Data states
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Modal / Form states
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(prefilledOrderId ? true : false);
  const [isRequestReturnOpen, setIsRequestReturnOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ ticket: SupportTicket; messages: any[] } | null>(null);

  // Ticket Form state
  const [ticketCategory, setTicketCategory] = useState('order_issue');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketOrderId, setTicketOrderId] = useState(prefilledOrderId);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState('');

  // Ticket Reply state
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // User Orders for Return / Ticket selector
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Return Request Form state
  const [returnOrderId, setReturnOrderId] = useState(prefilledOrderId);
  const [eligibilityData, setEligibilityData] = useState<any | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState<Record<string, { selected: boolean; qty: number; reason: string; condition: string }>>({});
  const [overallReturnReason, setOverallReturnReason] = useState('defective');
  const [returnComments, setReturnComments] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  useEffect(() => {
    fetchPublicSupportData();
    if (user) {
      fetchUserData();
      fetchUserOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPublicSupportData = async () => {
    try {
      const [faqsRes, articlesRes, settingsRes] = await Promise.all([
        fetch('/api/support/faqs').then(r => r.json()),
        fetch('/api/support/articles').then(r => r.json()),
        fetch('/api/support/settings').then(r => r.json())
      ]);
      setFaqs(Array.isArray(faqsRes) ? faqsRes : []);
      setArticles(Array.isArray(articlesRes) ? articlesRes : []);
      if (!settingsRes.error) setSettings(settingsRes);
    } catch (err) {
      console.error('Failed to load public support data:', err);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ticketsRes, returnsRes] = await Promise.all([
        fetch(`/api/support/tickets?userId=${user.uid}`).then(r => r.json()),
        fetch(`/api/support/returns?userId=${user.uid}`).then(r => r.json())
      ]);
      setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);
      setReturns(Array.isArray(returnsRes) ? returnsRes : []);
    } catch (err) {
      console.error('Failed to load user support data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    if (!user) return;
    try {
      // Fetch user's orders for order dropdown
      const res = await fetch(`/api/support/faqs`); // placeholder check
      // Fetch orders from Firestore or endpoint
      // Using client order fetch if available or API
    } catch (e) {
      console.warn('Orders fetch error:', e);
    }
  };

  const handleFetchTicketDetail = async (ticketId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}?userId=${user.uid}`).then(r => r.json());
      if (!res.error) {
        setSelectedTicket(res);
      }
    } catch (e) {
      console.error('Failed to load ticket detail:', e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || !user) return;

    setReplySubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: user.displayName || user.email || 'Customer',
          senderRole: 'customer',
          message: replyText
        })
      }).then(r => r.json());

      if (res.success) {
        setReplyText('');
        handleFetchTicketDetail(selectedTicket.ticket.id);
        fetchUserData();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          customerName: user.displayName || user.email?.split('@')[0] || 'Customer',
          customerEmail: user.email,
          orderId: ticketOrderId || undefined,
          category: ticketCategory,
          priority: ticketPriority,
          subject: ticketSubject,
          description: ticketDescription
        })
      }).then(r => r.json());

      if (res.success) {
        setTicketSuccessMsg(`Ticket #${res.ticketNumber} created successfully! Our team will respond shortly.`);
        setTicketSubject('');
        setTicketDescription('');
        fetchUserData();
        setTimeout(() => {
          setIsCreateTicketOpen(false);
          setTicketSuccessMsg('');
          setActiveTab('tickets');
        }, 2000);
      }
    } catch (err) {
      console.error('Create ticket error:', err);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const checkEligibilityForOrder = async (orderId: string) => {
    if (!orderId || !user) return;
    setEligibilityLoading(true);
    try {
      const res = await fetch(`/api/support/returns/eligibility?orderId=${orderId}&userId=${user.uid}`).then(r => r.json());
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
    if (!user || !returnOrderId) return;

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
      alert('Please select at least one item to return.');
      return;
    }

    setReturnSubmitting(true);
    try {
      const res = await fetch('/api/support/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: returnOrderId,
          userId: user.uid,
          customerName: user.displayName || user.email?.split('@')[0] || 'Customer',
          customerEmail: user.email,
          items: itemsToReturn,
          overallReason: overallReturnReason,
          comments: returnComments,
          pickupAddress: eligibilityData?.pickupAddress
        })
      }).then(r => r.json());

      if (res.success) {
        setReturnSuccessMsg(`Return request #${res.returnNumber} created! Pickup will be arranged shortly.`);
        fetchUserData();
        setTimeout(() => {
          setIsRequestReturnOpen(false);
          setReturnSuccessMsg('');
          setActiveTab('returns');
        }, 2000);
      } else {
        alert(res.error || 'Failed to submit return request.');
      }
    } catch (err) {
      console.error('Submit return error:', err);
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Filtered FAQs
  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = searchQuery === '' || 
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtered Articles
  const filteredArticles = articles.filter(a => {
    const matchesSearch = searchQuery === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Open</span>;
      case 'in_progress':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">In Progress</span>;
      case 'waiting_on_customer':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Action Required</span>;
      case 'resolved':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Resolved</span>;
      case 'closed':
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">Closed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getReturnStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Requested</span>;
      case 'approved':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Approved</span>;
      case 'pickup_scheduled':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pickup Scheduled</span>;
      case 'received':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Received at Hub</span>;
      case 'inspected':
        return <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Quality Inspected</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Refund Issued</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-4 pb-8 font-sans">
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-8 sm:p-12 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-3xl relative z-10">
            <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 uppercase tracking-wider mb-4">
              <ShieldCheck size={14} /> 24/7 Customer Care & Assistance
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
              How can we help you today?
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
              Search our help library, submit or track support tickets, or request a hassle-free product return with certified warranty coverage.
            </p>

            {/* Global Search Bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, order tracking, return policies..." 
                className="w-full bg-white text-slate-900 pl-12 pr-4 py-4 rounded-xl shadow-lg outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => setActiveTab('help')}
            className={`p-6 rounded-xl border text-left transition-all bg-white shadow-sm hover:shadow-md flex items-start gap-4 ${activeTab === 'help' ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'}`}
          >
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 shrink-0">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Help Center & FAQs</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Browse knowledge base articles and common order questions.</p>
            </div>
          </button>

          <button 
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              setActiveTab('tickets');
            }}
            className={`p-6 rounded-xl border text-left transition-all bg-white shadow-sm hover:shadow-md flex items-start gap-4 ${activeTab === 'tickets' ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'}`}
          >
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 mb-1">Support Tickets</h3>
                {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Communicate directly with our customer engineering team.</p>
            </div>
          </button>

          <button 
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              setActiveTab('returns');
            }}
            className={`p-6 rounded-xl border text-left transition-all bg-white shadow-sm hover:shadow-md flex items-start gap-4 ${activeTab === 'returns' ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200'}`}
          >
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 shrink-0">
              <RotateCcw size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Returns & Refunds</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Submit a return request within 7 days of delivery for refund.</p>
            </div>
          </button>
        </div>

        {/* Tab 1: Help Center & Knowledge Base */}
        {activeTab === 'help' && (
          <div className="space-y-8">
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                All Categories
              </button>
              {['Orders & Shipping', 'Returns & Refunds', 'Payments & GST', 'Warranty & Repairs', 'General Support'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Help Articles Grid */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Featured Help Guides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredArticles.map(article => (
                  <div 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md mb-3 inline-block">
                        {article.category}
                      </span>
                      <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                        {article.summary || article.content.slice(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium border-t border-slate-100 pt-3">
                      <span>Read article</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform text-blue-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-600" /> Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {filteredFaqs.map(faq => (
                  <div key={faq.id} className="border border-slate-200 rounded-xl overflow-hidden transition-all">
                    <button 
                      onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                      className="w-full p-4 sm:p-5 text-left font-semibold text-slate-900 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-100/80 transition-colors"
                    >
                      <span className="text-sm sm:text-base">{faq.question}</span>
                      <ChevronDown size={18} className={`text-slate-400 transition-transform ${openFaqId === faq.id ? 'rotate-180 text-blue-600' : ''}`} />
                    </button>
                    {openFaqId === faq.id && (
                      <div className="p-4 sm:p-5 bg-white border-t border-slate-200 text-sm text-slate-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: My Support Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
                <p className="text-xs text-slate-500">Track and respond to your active inquiries with our customer support team.</p>
              </div>
              <button 
                onClick={() => setIsCreateTicketOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={16} /> Create Support Ticket
              </button>
            </div>

            {/* Tickets Table / List */}
            {tickets.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No Support Tickets Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">You haven't opened any support tickets yet. Need help with an order or product?</p>
                <button 
                  onClick={() => setIsCreateTicketOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {tickets.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleFetchTicketDetail(t.id)}
                      className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{t.ticketNumber}</span>
                          {getStatusBadge(t.status)}
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {t.category.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{t.subject}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                        <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Return Requests */}
        {activeTab === 'returns' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Return & Replacement Requests</h2>
                <p className="text-xs text-slate-500">Track pickup status, inspection, and refund clearance for returned products.</p>
              </div>
              <button 
                onClick={() => setIsRequestReturnOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <RotateCcw size={16} /> Request Item Return
              </button>
            </div>

            {/* Returns List */}
            {returns.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <RotateCcw size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No Active Return Requests</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">Products purchased within the last 7 days of delivery are eligible for returns or replacements.</p>
                <button 
                  onClick={() => setIsRequestReturnOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold inline-flex items-center gap-2"
                >
                  <RotateCcw size={16} /> Request Order Return
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map(ret => (
                  <div key={ret.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-bold text-sm text-slate-900">{ret.returnNumber}</span>
                          {getReturnStatusBadge(ret.status)}
                        </div>
                        <p className="text-xs text-slate-500">Order Ref: <span className="font-bold text-slate-700">#{ret.invoiceNumber || ret.orderId}</span></p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Refund Amount</span>
                        <span className="text-base font-black text-slate-900">₹{Number(ret.refundAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Progress Pipeline */}
                    <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between text-xs overflow-x-auto gap-2">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Request Submitted
                      </div>
                      <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      <div className={`flex items-center gap-2 font-medium ${['approved', 'pickup_scheduled', 'received', 'inspected', 'completed'].includes(ret.status) ? 'text-slate-800' : 'text-slate-400'}`}>
                        <Truck size={16} className={['approved', 'pickup_scheduled'].includes(ret.status) ? 'text-blue-500' : ''} /> Doorstep Pickup
                      </div>
                      <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      <div className={`flex items-center gap-2 font-medium ${['received', 'inspected', 'completed'].includes(ret.status) ? 'text-slate-800' : 'text-slate-400'}`}>
                        <Box size={16} className={ret.status === 'inspected' ? 'text-teal-500' : ''} /> Hub Inspection
                      </div>
                      <ChevronRight size={14} className="text-slate-300 shrink-0" />
                      <div className={`flex items-center gap-2 font-medium ${ret.status === 'completed' ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        <RefreshCw size={16} className={ret.status === 'completed' ? 'text-emerald-500' : ''} /> Refund Issued
                      </div>
                    </div>

                    {/* Return Items List */}
                    <div className="divide-y divide-slate-100 text-xs">
                      {(ret.items || []).map((it, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-800">{it.productName}</p>
                            <p className="text-slate-500">Qty: {it.quantity} &bull; Reason: {it.reason}</p>
                          </div>
                          <span className="font-semibold text-slate-700">₹{Number(Number(it.unitPrice || 0) * Number(it.quantity || 1)).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Article Detail Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto relative shadow-2xl">
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md mb-3 inline-block">
                {selectedArticle.category}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedArticle.title}</h2>
              <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
                {selectedArticle.content}
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
                <span>Was this article helpful?</span>
                <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition-colors">
                  <ThumbsUp size={14} /> Yes ({selectedArticle.helpfulCount || 12})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ticket Detail View Drawer */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
            <div className="bg-white max-w-2xl w-full h-full flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-400">{selectedTicket.ticket.ticketNumber}</span>
                    {getStatusBadge(selectedTicket.ticket.status)}
                  </div>
                  <h3 className="font-bold text-base line-clamp-1">{selectedTicket.ticket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white p-2 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {/* Conversation Messages Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-xs text-slate-700">
                  <p className="font-bold text-slate-900 mb-1">Ticket Information</p>
                  <p>Category: <span className="font-semibold">{selectedTicket.ticket.category}</span></p>
                  {selectedTicket.ticket.invoiceNumber && (
                    <p>Order Reference: <span className="font-bold">#{selectedTicket.ticket.invoiceNumber}</span></p>
                  )}
                </div>

                {(selectedTicket.messages || []).map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.senderRole === 'customer' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{msg.senderName} ({msg.senderRole})</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div 
                      className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.senderRole === 'customer' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response or question..." 
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={replySubmitting || !replyText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Send size={16} /> Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Support Ticket */}
        {isCreateTicketOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
              <button 
                onClick={() => setIsCreateTicketOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Create Support Ticket</h2>
              <p className="text-xs text-slate-500 mb-6">Describe your issue and our technical team will assist you.</p>

              {ticketSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {ticketSuccessMsg}
                </div>
              )}

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category</label>
                  <select 
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="order_issue">Order Issue / Delay</option>
                    <option value="shipping_tracking">Shipping & Tracking Inquiry</option>
                    <option value="return_refund">Returns & Refund Status</option>
                    <option value="product_inquiry">Product Compatibility & Warranty</option>
                    <option value="payment_issue">Payment & GST Invoice Issue</option>
                    <option value="technical">Website Technical Issue</option>
                    <option value="general">General Support</option>
                  </select>
                </div>



                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Enter ticket subject"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea 
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    rows={4}
                    placeholder="Enter ticket details..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {ticketSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Return */}
        {isRequestReturnOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsRequestReturnOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-slate-900 mb-1">Request Product Return</h2>
              <p className="text-xs text-slate-500 mb-6">Select your delivered order and specify the return reasons.</p>

              {returnSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} /> {returnSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Order Reference ID</label>
                  <input 
                    type="text" 
                    value={returnOrderId}
                    onChange={(e) => {
                      setReturnOrderId(e.target.value);
                      if (e.target.value) checkEligibilityForOrder(e.target.value);
                    }}
                    placeholder="Enter order ID or invoice number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {eligibilityLoading && (
                  <p className="text-xs text-blue-600 font-semibold animate-pulse">Checking return eligibility...</p>
                )}

                {eligibilityData && !eligibilityData.eligible && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" /> {eligibilityData.reason}
                  </div>
                )}

                {eligibilityData && eligibilityData.eligible && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>Order is Eligible for Return</span>
                      <span>{eligibilityData.daysRemaining} Days Remaining</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Select Items to Return</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {eligibilityData.items?.map((it: any) => (
                          <div key={it.productId} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs bg-slate-50">
                            <div>
                              <p className="font-bold text-slate-900">{it.name || it.productName}</p>
                              <p className="text-slate-500">₹{Number(it.price || it.unitPrice || 0).toLocaleString('en-IN')} &bull; {it.isReturnable ? 'Returnable' : 'Non-returnable category'}</p>
                            </div>
                            <input 
                              type="checkbox"
                              disabled={!it.isReturnable}
                              checked={selectedReturnItems[it.productId]?.selected || false}
                              onChange={(e) => {
                                setSelectedReturnItems({
                                  ...selectedReturnItems,
                                  [it.productId]: {
                                    ...selectedReturnItems[it.productId],
                                    selected: e.target.checked
                                  }
                                });
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Return</label>
                      <select 
                        value={overallReturnReason}
                        onChange={(e) => setOverallReturnReason(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold outline-none"
                      >
                        <option value="defective">Defective or Product Not Working</option>
                        <option value="damaged">Item Damaged During Shipment</option>
                        <option value="wrong_item">Received Wrong Product</option>
                        <option value="missing_accessories">Missing Included Accessories / Cable</option>
                        <option value="performance">Performance Not as Expected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes / Comments</label>
                      <textarea 
                        value={returnComments}
                        onChange={(e) => setReturnComments(e.target.value)}
                        rows={2}
                        placeholder="Enter return details or defect notes..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                      ></textarea>
                    </div>
                  </>
                )}

                <button 
                  type="submit"
                  disabled={returnSubmitting || !eligibilityData?.eligible}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {returnSubmitting ? 'Submitting Return Request...' : 'Submit Return Request'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
