import React, { useState } from 'react';
import { Store, History, SlidersHorizontal } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSearchParams } from 'react-router-dom';
import { AdminPOS } from '../admin/AdminPOS';
import { AdminPosSettings } from '../admin/pos/AdminPosSettings';

export function PartnerPOS() {
  const { partnerStore } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub') || 'counter';

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
        <Store className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store POS billing terminal...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'counter', label: 'Counter Billing', icon: Store },
    { id: 'history', label: 'Sales History', icon: History },
    { id: 'settings', label: 'POS Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Store size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} POS Terminal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Walk-in counter billing, barcode scanning, thermal receipt printing, and sales register for store <code className="text-emerald-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        {/* Sub Navigation Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 self-start sm:self-auto">
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
      {activeTab === 'counter' && (
        <AdminPOS forcedStoreId={partnerStore.storeId} initialSubTab="counter" />
      )}
      {activeTab === 'history' && (
        <AdminPOS forcedStoreId={partnerStore.storeId} initialSubTab="history" />
      )}
      {activeTab === 'settings' && (
        <AdminPosSettings onBackToPos={() => handleTabChange('counter')} />
      )}
    </div>
  );
}
