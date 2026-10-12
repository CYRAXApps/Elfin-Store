import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  Send, 
  Lock, 
  Unlock, 
  X, 
  Eye, 
  ShoppingBag, 
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Calendar,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { SupportTicket, SupportTicketMessage, SupportTicketPriority } from '../../../types';
import { 
  formatDate, 
  formatDateTime, 
  getTicketStatusConfig, 
  getTicketPriorityConfig, 
  normalizeTicketStatus, 
  getWhatsAppUrl, 
  getCallUrl, 
  getEmailUrl 
} from './customerUtils';

interface SupportRequestsManagerProps {
  tickets: SupportTicket[];
  loading: boolean;
  onUpdateTicketStatus: (ticketId: string, newStatus: string) => Promise<void>;
  onSendReply: (ticketId: string, message: string, isInternal: boolean) => Promise<void>;
  onViewOrder?: (orderId: string) => void;
  initialSelectedTicketId?: string;
}

export const SupportRequestsManager: React.FC<SupportRequestsManagerProps> = ({
  tickets,
  loading,
  onUpdateTicketStatus,
  onSendReply,
  onViewOrder,
  initialSelectedTicketId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  
  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [conversationMessages, setConversationMessages] = useState<SupportTicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // If initialSelectedTicketId is passed, open it
  useEffect(() => {
    if (initialSelectedTicketId && tickets.length > 0) {
      const match = tickets.find(t => t.id === initialSelectedTicketId);
      if (match) {
        handleOpenTicket(match);
      }
    }
  }, [initialSelectedTicketId, tickets]);

  // Load ticket conversation
  const handleOpenTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    setReplyText('');
    setIsInternalNote(false);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}?isAdmin=true`);
      if (res.ok) {
        const data = await res.json();
        setConversationMessages(data.messages || []);
      } else {
        // Fallback: initial description as first message
        setConversationMessages([
          {
            id: 'initial',
            ticketId: ticket.id,
            senderId: ticket.userId,
            senderName: ticket.customerName,
            senderRole: 'customer',
            message: ticket.description,
            createdAt: ticket.createdAt
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setConversationMessages([
        {
          id: 'initial',
          ticketId: ticket.id,
          senderId: ticket.userId,
          senderName: ticket.customerName,
          senderRole: 'customer',
          message: ticket.description,
          createdAt: ticket.createdAt
        }
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      setUpdatingStatus(true);
      await onUpdateTicketStatus(selectedTicket.id, newStatus);
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      await onSendReply(selectedTicket.id, replyText.trim(), isInternalNote);
      
      // Optimistically add message
      const newMsg: SupportTicketMessage = {
        id: `msg-${Date.now()}`,
        ticketId: selectedTicket.id,
        senderId: 'admin',
        senderName: 'Support Agent (You)',
        senderRole: 'admin',
        message: replyText.trim(),
        isInternal: isInternalNote,
        createdAt: new Date().toISOString()
      };
      setConversationMessages(prev => [...prev, newMsg]);
      setReplyText('');
      
      // If public reply was sent, update local status to in_progress if it was new
      if (!isInternalNote && normalizeTicketStatus(selectedTicket.status) === 'new') {
        setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(tk => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNum = (tk.ticketNumber || '').toLowerCase().includes(q);
        const matchesCust = (tk.customerName || '').toLowerCase().includes(q);
        const matchesEmail = (tk.customerEmail || '').toLowerCase().includes(q);
        const matchesSubj = (tk.subject || '').toLowerCase().includes(q);
        const matchesInv = (tk.invoiceNumber || '').toLowerCase().includes(q);
        if (!matchesNum && !matchesCust && !matchesEmail && !matchesSubj && !matchesInv) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        const norm = normalizeTicketStatus(tk.status);
        if (norm !== statusFilter) return false;
      }

      // Priority
      if (priorityFilter !== 'all') {
        if ((tk.priority || 'medium').toLowerCase() !== priorityFilter) return false;
      }

      // Date
      if (dateFilter !== 'all') {
        const date = tk.createdAt?.toMillis ? new Date(tk.createdAt.toMillis()) : new Date(tk.createdAt || 0);
        const now = new Date();
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7days' && diffDays > 7) return false;
        if (dateFilter === '30days' && diffDays > 30) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, dateFilter]);

  // Counts by workflow status
  const counts = useMemo(() => {
    const c = { new: 0, in_progress: 0, waiting_customer: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => {
      const norm = normalizeTicketStatus(t.status);
      if (c[norm] !== undefined) c[norm]++;
    });
    return c;
  }, [tickets]);

  return (
    <div className="space-y-5">
      {/* Workflow Status Quick-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'new', label: 'New', count: counts.new, color: 'text-blue-700', bg: 'bg-blue-50/70', border: 'border-blue-200' },
          { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: 'text-amber-700', bg: 'bg-amber-50/70', border: 'border-amber-200' },
          { key: 'waiting_customer', label: 'Waiting for Customer', count: counts.waiting_customer, color: 'text-purple-700', bg: 'bg-purple-50/70', border: 'border-purple-200' },
          { key: 'resolved', label: 'Resolved', count: counts.resolved, color: 'text-emerald-700', bg: 'bg-emerald-50/70', border: 'border-emerald-200' },
          { key: 'closed', label: 'Closed', count: counts.closed, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
        ].map((item) => (
          <button
            key={item.key}
            id={`status-card-${item.key}`}
            onClick={() => setStatusFilter(statusFilter === item.key ? 'all' : (item.key as any))}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              statusFilter === item.key 
                ? `${item.bg} ${item.border} ring-2 ring-blue-500 shadow-sm` 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{item.label}</span>
              <span className={`w-2 h-2 rounded-full ${
                item.key === 'new' ? 'bg-blue-500' :
                item.key === 'in_progress' ? 'bg-amber-500' :
                item.key === 'waiting_customer' ? 'bg-purple-500' :
                item.key === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
            </div>
            <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="ticket-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket #, customer, subject, or order #..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Secondary Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Priority Filter */}
            <select
              id="ticket-priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Date Filter */}
            <select
              id="ticket-date-filter"
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'new', label: 'New' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'waiting_customer', label: 'Waiting for Customer' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'closed', label: 'Closed' }
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-ticket-${tab.id}`}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
            <button
              id="clear-ticket-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setDateFilter('all');
              }}
              className="ml-auto text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket List Section */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading support inquiries...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {searchTerm || statusFilter !== 'all'
              ? 'No requests match your search criteria. Try adjusting the filters above.'
              : 'All support tickets submitted by customers will be processed here.'}
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket Number</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                    const stConfig = getTicketStatusConfig(ticket.status);
                    const prConfig = getTicketPriorityConfig(ticket.priority);

                    return (
                      <tr 
                        key={ticket.id} 
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => handleOpenTicket(ticket)}
                      >
                        {/* Ticket Number & Category */}
                        <td className="py-4 px-4 font-bold text-slate-900">
                          <div>
                            <span className="group-hover:text-blue-600 transition-colors">
                              #{ticket.ticketNumber || ticket.id?.slice(0, 8)}
                            </span>
                            {ticket.category && (
                              <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">
                                {ticket.category.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 text-xs">{ticket.customerName || 'Customer'}</p>
                          <p className="text-xs text-slate-500">{ticket.customerEmail}</p>
                        </td>

                        {/* Subject */}
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-900 text-xs line-clamp-1 max-w-xs">
                            {ticket.subject}
                          </p>
                          {ticket.invoiceNumber && (
                            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                              Order #{ticket.invoiceNumber}
                            </p>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatDate(ticket.createdAt)}
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs border ${prConfig.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prConfig.dotColor}`} />
                            {prConfig.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stConfig.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dotColor}`} />
                            {stConfig.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 text-right">
                          <button
                            id={`view-ticket-table-btn-${ticket.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTicket(ticket);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Respond</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="lg:hidden space-y-3">
            {filteredTickets.map((ticket) => {
              const stConfig = getTicketStatusConfig(ticket.status);
              const prConfig = getTicketPriorityConfig(ticket.priority);

              return (
                <div 
                  key={ticket.id}
                  onClick={() => handleOpenTicket(ticket)}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 cursor-pointer hover:border-blue-400 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900">
                        #{ticket.ticketNumber || ticket.id?.slice(0, 8)}
                      </span>
                      <p className="text-xs text-slate-500 font-medium">{ticket.customerName}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${prConfig.badgeClass}`}>
                        {prConfig.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stConfig.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dotColor}`} />
                        {stConfig.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ticket.subject}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ticket.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{formatDate(ticket.createdAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTicket(ticket);
                      }}
                      className="min-h-[44px] px-4 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Request</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* CONVERSATION & DETAILS MODAL */}
      {selectedTicket && (
        <div 
          id="ticket-detail-modal-backdrop"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 lg:p-6 animate-in fade-in duration-200"
        >
          <div 
            id="ticket-detail-modal-card"
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-sm text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    Ticket #{selectedTicket.ticketNumber || selectedTicket.id?.slice(0, 8)}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    getTicketStatusConfig(selectedTicket.status).badgeClass
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getTicketStatusConfig(selectedTicket.status).dotColor}`} />
                    {getTicketStatusConfig(selectedTicket.status).label}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${
                    getTicketPriorityConfig(selectedTicket.priority).badgeClass
                  }`}>
                    {selectedTicket.priority} Priority
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1.5 leading-tight">
                  {selectedTicket.subject}
                </h2>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Information & Order Reference Bar */}
            <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {selectedTicket.customerName}
                </span>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedTicket.customerEmail}
                </span>
                {selectedTicket.customerPhone && (
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedTicket.customerPhone}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.customerPhone && (
                  <a
                    href={getWhatsAppUrl(selectedTicket.customerPhone, selectedTicket.customerName, `Support Ticket #${selectedTicket.ticketNumber}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedTicket.invoiceNumber && onViewOrder && (
                  <button
                    onClick={() => {
                      if (selectedTicket.orderId) onViewOrder(selectedTicket.orderId);
                    }}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Order #{selectedTicket.invoiceNumber}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Workflow Selector Bar */}
            <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 mr-1">Update Status:</span>
                {[
                  { id: 'new', label: 'New' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'waiting_customer', label: 'Waiting for Customer' },
                  { id: 'resolved', label: 'Resolved' },
                  { id: 'closed', label: 'Closed' }
                ].map((st) => {
                  const isCurrent = normalizeTicketStatus(selectedTicket.status) === st.id;
                  return (
                    <button
                      key={st.id}
                      id={`set-ticket-status-${st.id}`}
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(st.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-400">
                Created on {formatDateTime(selectedTicket.createdAt)}
              </span>
            </div>

            {/* Conversation Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {loadingMessages ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500">Loading conversation history...</p>
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-xs font-bold text-slate-900 mb-1">Customer Issue Description:</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isCustomer = msg.senderRole === 'customer';
                  const isInternal = Boolean(msg.isInternal);

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${
                        isInternal 
                          ? 'items-center my-2' 
                          : isCustomer 
                          ? 'items-start mr-12' 
                          : 'items-end ml-12'
                      }`}
                    >
                      {/* Internal Note Banner */}
                      {isInternal ? (
                        <div className="w-full bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 shadow-xs">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            <span>INTERNAL TEAM NOTE (Hidden from Customer)</span>
                            <span className="text-[11px] font-normal text-amber-700 ml-auto">
                              {formatDateTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-amber-950 font-medium whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-2xl shadow-xs max-w-xl ${
                          isCustomer 
                            ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs' 
                            : 'bg-blue-600 text-white rounded-tr-xs'
                        }`}>
                          <div className={`flex items-center justify-between gap-4 mb-1 text-[11px] ${
                            isCustomer ? 'text-slate-400' : 'text-blue-100'
                          }`}>
                            <span className="font-bold">
                              {isCustomer ? (selectedTicket.customerName || 'Customer') : 'ELECTRO STORE Support'}
                            </span>
                            <span>{formatDateTime(msg.createdAt)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Admin Response & Internal Note Form */}
            <form onSubmit={handleSubmitReply} className="p-4 bg-white border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      !isInternalNote 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Public Reply (Sent to Customer)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      isInternalNote 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Internal Note (Only Team Visible)</span>
                  </button>
                </div>

                {isInternalNote && (
                  <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Customer will never see this note
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  id="ticket-reply-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternalNote 
                      ? 'Add an internal note about this issue for the store support team...' 
                      : `Type a response to ${selectedTicket.customerName}...`
                  }
                  rows={3}
                  className={`w-full p-3 rounded-xl text-sm border focus:outline-hidden focus:ring-2 transition-all ${
                    isInternalNote 
                      ? 'bg-amber-50/40 border-amber-200 text-amber-950 focus:ring-amber-500 placeholder:text-amber-800/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {isInternalNote 
                    ? '🔒 Saved only in admin records.' 
                    : 'Customer will receive an email/in-app notification.'}
                </p>
                <button
                  id="send-ticket-reply-btn"
                  type="submit"
                  disabled={!replyText.trim() || sendingReply}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all ${
                    isInternalNote 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReply ? 'Sending...' : isInternalNote ? 'Save Internal Note' : 'Send Public Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
