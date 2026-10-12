import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Boxes, Receipt, Percent } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { AdminAnalytics } from '../admin/AdminAnalytics';

interface PartnerAnalyticsProps {
  initialSubTab?: string;
}

export function PartnerAnalytics({ initialSubTab = 'sales' }: PartnerAnalyticsProps) {
  const { partnerStore } = usePartnerAuth();
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  if (!partnerStore?.storeId) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <BarChart3 className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store analytics & reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Analytics & Reports</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store turnover, sales trends, inventory movement, and GST tax reporting for <code className="text-blue-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        {/* Quick Tab Selector */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 self-start sm:self-auto">
          {[
            { id: 'sales', label: 'Sales Report', icon: DollarSign },
            { id: 'overview', label: 'Orders', icon: ShoppingCart },
            { id: 'inventory', label: 'Stock Movement', icon: Boxes },
            { id: 'tax', label: 'GST & Tax', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Admin-Grade Analytics Engine */}
      <AdminAnalytics 
        forcedStoreId={partnerStore.storeId} 
        initialSubTab={activeSubTab} 
      />
    </div>
  );
}
