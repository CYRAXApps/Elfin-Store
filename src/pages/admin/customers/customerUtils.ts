import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  XCircle, 
  RefreshCw, 
  Package, 
  Truck, 
  CheckCircle,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { SupportTicketStatus, SupportTicketPriority, ReturnRequestStatus } from '../../../types';

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  try {
    let d: Date;
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (timestamp?._seconds) {
      d = new Date(timestamp._seconds * 1000);
    } else if (timestamp?.toMillis && typeof timestamp.toMillis === 'function') {
      d = new Date(timestamp.toMillis());
    } else {
      d = new Date(timestamp);
    }
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(timestamp: any): string {
  if (!timestamp) return '—';
  try {
    let d: Date;
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (timestamp?._seconds) {
      d = new Date(timestamp._seconds * 1000);
    } else if (timestamp?.toMillis && typeof timestamp.toMillis === 'function') {
      d = new Date(timestamp.toMillis());
    } else {
      d = new Date(timestamp);
    }
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '—';
  }
}

// ----------------------------------------------------------------------
// SUPPORT TICKET WORKFLOW CONFIG
// Workflow: New -> In Progress -> Waiting for Customer -> Resolved -> Closed
// ----------------------------------------------------------------------

export type NormalizedTicketStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export function normalizeTicketStatus(st: SupportTicketStatus | string | undefined): NormalizedTicketStatus {
  if (!st) return 'new';
  const s = st.toLowerCase().trim();
  if (s === 'open' || s === 'new') return 'new';
  if (s === 'in_progress' || s === 'processing') return 'in_progress';
  if (s === 'waiting_on_customer' || s === 'waiting_customer') return 'waiting_customer';
  if (s === 'resolved') return 'resolved';
  if (s === 'closed') return 'closed';
  return 'new';
}

export interface StatusConfig {
  label: string;
  badgeClass: string;
  borderClass: string;
  dotColor: string;
  description: string;
}

export function getTicketStatusConfig(status: SupportTicketStatus | string | undefined): StatusConfig {
  const norm = normalizeTicketStatus(status);
  switch (norm) {
    case 'new':
      return {
        label: 'New',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        borderClass: 'border-blue-500',
        dotColor: 'bg-blue-500',
        description: 'Customer inquiry received, waiting for initial agent response.'
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        borderClass: 'border-amber-500',
        dotColor: 'bg-amber-500',
        description: 'Support agent is currently reviewing and investigating the issue.'
      };
    case 'waiting_customer':
      return {
        label: 'Waiting for Customer',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        borderClass: 'border-purple-500',
        dotColor: 'bg-purple-500',
        description: 'Response sent; waiting for customer reply or required details.'
      };
    case 'resolved':
      return {
        label: 'Resolved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        borderClass: 'border-emerald-500',
        dotColor: 'bg-emerald-500',
        description: 'Issue has been satisfactorily solved for the customer.'
      };
    case 'closed':
      return {
        label: 'Closed',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        borderClass: 'border-slate-400',
        dotColor: 'bg-slate-400',
        description: 'Ticket completed and archived.'
      };
    default:
      return {
        label: 'New',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        borderClass: 'border-blue-500',
        dotColor: 'bg-blue-500',
        description: 'Customer inquiry received.'
      };
  }
}

export function getTicketPriorityConfig(priority: SupportTicketPriority | string | undefined) {
  const p = (priority || 'medium').toLowerCase();
  switch (p) {
    case 'urgent':
      return {
        label: 'Urgent',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
        dotColor: 'bg-rose-600'
      };
    case 'high':
      return {
        label: 'High',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-bold',
        dotColor: 'bg-orange-500'
      };
    case 'medium':
      return {
        label: 'Medium',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
        dotColor: 'bg-amber-500'
      };
    case 'low':
    default:
      return {
        label: 'Low',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200 font-medium',
        dotColor: 'bg-slate-400'
      };
  }
}

// ----------------------------------------------------------------------
// RETURNS WORKFLOW CONFIG
// Workflow: Return Requested -> Under Review -> Approved -> Item Received -> Refund Processing -> Refunded
// Also support: Rejected, Cancelled
// ----------------------------------------------------------------------

export type NormalizedReturnStatus = 
  | 'requested' 
  | 'under_review' 
  | 'approved' 
  | 'received' 
  | 'refund_processing' 
  | 'refunded' 
  | 'rejected' 
  | 'cancelled';

export function normalizeReturnStatus(st: ReturnRequestStatus | string | undefined): NormalizedReturnStatus {
  if (!st) return 'requested';
  const s = st.toLowerCase().trim();
  if (s === 'requested') return 'requested';
  if (s === 'under_review' || s === 'in_review') return 'under_review';
  if (s === 'approved' || s === 'pickup_scheduled') return 'approved';
  if (s === 'received' || s === 'inspected') return 'received';
  if (s === 'refund_processing') return 'refund_processing';
  if (s === 'refunded' || s === 'completed') return 'refunded';
  if (s === 'rejected') return 'rejected';
  if (s === 'cancelled') return 'cancelled';
  return 'requested';
}

export function getReturnStatusConfig(status: ReturnRequestStatus | string | undefined): StatusConfig {
  const norm = normalizeReturnStatus(status);
  switch (norm) {
    case 'requested':
      return {
        label: 'Return Requested',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        borderClass: 'border-blue-500',
        dotColor: 'bg-blue-500',
        description: 'Customer has submitted a return request for inspection.'
      };
    case 'under_review':
      return {
        label: 'Under Review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        borderClass: 'border-amber-500',
        dotColor: 'bg-amber-500',
        description: 'Support team is checking return eligibility and policy windows.'
      };
    case 'approved':
      return {
        label: 'Approved',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        borderClass: 'border-emerald-500',
        dotColor: 'bg-emerald-500',
        description: 'Return approved; customer is returning package to warehouse.'
      };
    case 'received':
      return {
        label: 'Item Received',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        borderClass: 'border-indigo-500',
        dotColor: 'bg-indigo-500',
        description: 'Item arrived at warehouse and inspected.'
      };
    case 'refund_processing':
      return {
        label: 'Refund Processing',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        borderClass: 'border-violet-500',
        dotColor: 'bg-violet-500',
        description: 'Refund initiation in progress with Razorpay payment gateway.'
      };
    case 'refunded':
      return {
        label: 'Refunded',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
        borderClass: 'border-emerald-600',
        dotColor: 'bg-emerald-600',
        description: 'Refund successfully completed and verified by payment system.'
      };
    case 'rejected':
      return {
        label: 'Rejected',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        borderClass: 'border-rose-500',
        dotColor: 'bg-rose-500',
        description: 'Return request rejected after inspection or policy check.'
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        borderClass: 'border-slate-400',
        dotColor: 'bg-slate-400',
        description: 'Return request was cancelled by customer or store admin.'
      };
    default:
      return {
        label: 'Return Requested',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        borderClass: 'border-blue-500',
        dotColor: 'bg-blue-500',
        description: 'Return request submitted.'
      };
  }
}

export function getRefundStatusBadge(refundStatus: string | undefined, orderPaymentStatus?: string) {
  const s = (refundStatus || orderPaymentStatus || 'pending').toLowerCase();
  if (s === 'issued' || s === 'refunded') {
    return {
      label: 'Refund Confirmed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }
  if (s === 'processing' || s === 'refund_processing') {
    return {
      label: 'Processing',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  }
  if (s === 'partially_refunded') {
    return {
      label: 'Partially Refunded',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  }
  if (s === 'rejected' || s === 'failed') {
    return {
      label: 'Refund Failed',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }
  return {
    label: 'Pending Refund',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
  };
}

// ----------------------------------------------------------------------
// REAL COMMUNICATION LINKS BUILDERS
// ----------------------------------------------------------------------

export function getCleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export function getWhatsAppUrl(phone?: string, customerName?: string, context?: string): string {
  const digits = getCleanPhoneNumber(phone);
  if (!digits) return '';
  // Ensure Indian country code prefix if 10 digits
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;
  const greeting = customerName ? `Hello ${customerName}, ` : 'Hello, ';
  const message = `${greeting}this is ELECTRO STORE Support regarding your ${context || 'order'}.`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export function getCallUrl(phone?: string): string {
  const digits = getCleanPhoneNumber(phone);
  if (!digits) return '';
  return `tel:${digits.length === 10 ? `+91${digits}` : `+${digits}`}`;
}

export function getEmailUrl(email?: string, subject?: string): string {
  if (!email) return '';
  return `mailto:${email}?subject=${encodeURIComponent(subject || 'ELECTRO STORE Customer Support')}`;
}
