import React, { useState } from 'react';
import { Users, Building2, MessageSquare, ShieldCheck, HeartHandshake } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { AdminCustomers } from '../admin/AdminCustomers';
import { AdminInquiries } from '../admin/AdminInquiries';

interface PartnerCustomersProps {
  initialSubTab?: string;
}

export function PartnerCustomers({ initialSubTab }: PartnerCustomersProps) {
  const { partnerStore } = usePartnerAuth();
  const [activeTab, setActiveTab] = useState<'customers' | 'inquiries'>(
    initialSubTab === 'support' || initialSubTab === 'inquiries' ? 'inquiries' : 'customers'
  );

  if (!partnerStore?.storeId) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <Users className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Customers & Inquiries</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store patrons, customer order history, loyalty interactions, and customer support tickets for <code className="text-indigo-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>Store Customers</span>
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inquiries'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare size={14} />
            <span>Support & Tickets</span>
          </button>
        </div>
      </div>

      {/* Dynamic Content */}
      {activeTab === 'customers' ? (
        <AdminCustomers forcedStoreId={partnerStore.storeId} />
      ) : (
        <AdminInquiries forcedStoreId={partnerStore.storeId} />
      )}
    </div>
  );
}
