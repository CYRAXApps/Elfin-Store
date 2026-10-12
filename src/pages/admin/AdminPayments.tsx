import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  LayoutDashboard, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  Building2, 
  FileSpreadsheet, 
  Scale, 
  Webhook, 
  Settings, 
  Activity,
  Layers
} from 'lucide-react';
import { PaymentDashboard } from './payments/PaymentDashboard';
import { PaymentTransactions } from './payments/PaymentTransactions';
import { RazorpayOrders } from './payments/RazorpayOrders';
import { PaymentFilteredViews } from './payments/PaymentFilteredViews';
import { PaymentRefunds } from './payments/PaymentRefunds';
import { PaymentSettlements } from './payments/PaymentSettlements';
import { PaymentReports } from './payments/PaymentReports';
import { PaymentReconciliation } from './payments/PaymentReconciliation';
import { PaymentWebhooks } from './payments/PaymentWebhooks';
import { PaymentSettings } from './payments/PaymentSettings';
import { PaymentLogs } from './payments/PaymentLogs';

interface AdminPaymentsProps {
  activeSubTab?: string;
  initialStatusFilter?: string;
  onNavigateTab?: (tab: string, params?: any) => void;
}

export function AdminPayments({ 
  activeSubTab = 'transactions', 
  initialStatusFilter = 'all', 
  onNavigateTab 
}: AdminPaymentsProps) {
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'transactions');
  const [currentStatusFilter, setCurrentStatusFilter] = useState(initialStatusFilter || 'all');

  useEffect(() => {
    if (activeSubTab) {
      const cleanTab = activeSubTab.replace('payments-', '');
      setCurrentTab(cleanTab);
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (initialStatusFilter) {
      setCurrentStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const handleTabChange = (tab: string, statusFilter?: string) => {
    setCurrentTab(tab);
    if (statusFilter) {
      setCurrentStatusFilter(statusFilter);
    }
    if (onNavigateTab) {
      onNavigateTab(`payments-${tab}`, statusFilter ? { initialStatusFilter: statusFilter } : undefined);
    }
  };

  const navItems = [
    { id: 'transactions', label: 'All Transactions', icon: CreditCard, statusFilter: 'all' },
    { id: 'successful', label: 'Successful', icon: CheckCircle2, statusFilter: 'successful' },
    { id: 'pending', label: 'Pending', icon: Clock, statusFilter: 'pending' },
    { id: 'failed', label: 'Failed', icon: AlertCircle, statusFilter: 'failed' },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw, statusFilter: 'refunded' },
    { id: 'dashboard', label: 'Overview & Metrics', icon: LayoutDashboard },
    { id: 'razorpay-orders', label: 'Razorpay Gateway', icon: FileText },
    { id: 'settlements', label: 'Settlements', icon: Building2 },
    { id: 'reconciliation', label: 'Reconciliation', icon: Scale },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'settings', label: 'Gateway Settings', icon: Settings },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Sub-Navigation Tab Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || 
              (currentTab === 'transactions' && item.statusFilter && currentStatusFilter === item.statusFilter);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.statusFilter && (item.id === 'transactions' || item.id === 'successful' || item.id === 'pending' || item.id === 'failed' || item.id === 'refunds')) {
                    handleTabChange('transactions', item.statusFilter);
                  } else {
                    handleTabChange(item.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content View */}
      <div>
        {currentTab === 'transactions' && (
          <PaymentTransactions 
            initialStatusFilter={currentStatusFilter} 
            onNavigateTab={onNavigateTab} 
          />
        )}
        {currentTab === 'successful' && (
          <PaymentTransactions 
            initialStatusFilter="successful" 
            onNavigateTab={onNavigateTab} 
          />
        )}
        {currentTab === 'pending' && (
          <PaymentTransactions 
            initialStatusFilter="pending" 
            onNavigateTab={onNavigateTab} 
          />
        )}
        {currentTab === 'failed' && (
          <PaymentTransactions 
            initialStatusFilter="failed" 
            onNavigateTab={onNavigateTab} 
          />
        )}
        {currentTab === 'dashboard' && (
          <PaymentDashboard onNavigateTab={(tab) => handleTabChange(tab)} />
        )}
        {currentTab === 'razorpay-orders' && (
          <RazorpayOrders />
        )}
        {currentTab === 'refunds' && (
          <PaymentRefunds />
        )}
        {currentTab === 'settlements' && (
          <PaymentSettlements />
        )}
        {currentTab === 'reports' && (
          <PaymentReports />
        )}
        {currentTab === 'reconciliation' && (
          <PaymentReconciliation />
        )}
        {currentTab === 'webhooks' && (
          <PaymentWebhooks />
        )}
        {currentTab === 'settings' && (
          <PaymentSettings />
        )}
        {currentTab === 'logs' && (
          <PaymentLogs />
        )}
      </div>
    </div>
  );
}
