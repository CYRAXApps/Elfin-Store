import React, { useState } from 'react';
import { ShoppingCart, RotateCcw, Truck, FileText, CreditCard } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSearchParams } from 'react-router-dom';
import { AdminOrders } from '../admin/AdminOrders';
import { AdminInvoices } from '../admin/AdminInvoices';
import { ShippingDashboard } from '../admin/shipping/ShippingDashboard';
import { AdminPayments } from '../admin/AdminPayments';

export function PartnerOrders() {
  const { partnerStore } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub') || 'all_orders';

  const [activeTab, setActiveTab] = useState<string>(subParam);

  React.useEffect(() => {
    if (subParam) {
      setActiveTab(subParam);
    }
  }, [subParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ sub: tabId });
  };

  if (!partnerStore?.storeId) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <ShoppingCart className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store orders...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'all_orders', label: 'All Orders', icon: ShoppingCart },
    { id: 'orders_returns', label: 'Returns & Replacements', icon: RotateCcw },
    { id: 'orders_shipping', label: 'Shipping & Logistics', icon: Truck },
    { id: 'orders_invoices', label: 'Invoices', icon: FileText },
    { id: 'orders_payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Orders & Fulfillment</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fulfill local customer orders, update tracking, issue GST invoices, and process refunds for store <code className="text-emerald-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        {/* Sub Navigation Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 self-start lg:self-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Module Rendering */}
      {activeTab === 'all_orders' && (
        <AdminOrders forcedStoreId={partnerStore.storeId} initialStatusFilter="all" />
      )}
      {activeTab === 'orders_returns' && (
        <AdminOrders forcedStoreId={partnerStore.storeId} initialStatusFilter="returns" />
      )}
      {activeTab === 'orders_shipping' && (
        <ShippingDashboard />
      )}
      {activeTab === 'orders_invoices' && (
        <AdminInvoices />
      )}
      {activeTab === 'orders_payments' && (
        <AdminPayments />
      )}
    </div>
  );
}
