import React from 'react';
import { Boxes, Building2 } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { AdminInventory } from '../admin/AdminInventory';

export function PartnerInventory() {
  const { partnerUser, partnerStore } = usePartnerAuth();

  if (!partnerStore?.storeId) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center">
        <Boxes className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Boxes size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Inventory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track stock levels, record inward stock receiving, execute stock adjustments, and review audit ledgers for store <code className="text-amber-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 self-start sm:self-auto">
          Inventory Scoped: {partnerStore.storeId}
        </span>
      </div>

      {/* Embedded Admin-Grade Inventory Management */}
      <AdminInventory forcedStoreId={partnerStore.storeId} partnerUid={partnerUser?.uid} />
    </div>
  );
}
