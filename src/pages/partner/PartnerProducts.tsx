import React, { useState } from 'react';
import { Package, Tag, Bookmark, Boxes, Star, Plus } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSearchParams } from 'react-router-dom';
import { AdminProducts } from '../admin/AdminProducts';
import { AdminCategories } from '../admin/AdminCategories';
import { AdminBrands } from '../admin/AdminBrands';
import { AdminInventory } from '../admin/AdminInventory';
import { AdminReviews } from '../admin/AdminReviews';

export function PartnerProducts() {
  const { partnerStore, partnerUser } = usePartnerAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const subParam = searchParams.get('sub') || 'products_list';

  const [activeTab, setActiveTab] = useState<string>(subParam);

  // Sync state if URL sub parameter changes
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
        <Package className="mx-auto text-slate-400 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-600">Loading store product catalog...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'products_list', label: 'Products Catalog', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'brands', label: 'Brands', icon: Bookmark },
    { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
  ];

  return (
    <div className="space-y-6">
      {/* Partner Store Header Card with Tab Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Package size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Products</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage product catalog, pricing, SKU inventory, images, and publishing status for store <code className="text-blue-600 font-mono font-bold">"{partnerStore.storeId}"</code>.
          </p>
        </div>

        {/* Sub Navigation Pills (Admin style) */}
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
                    ? 'bg-white text-blue-600 shadow-xs'
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
      {activeTab === 'products_list' && (
        <AdminProducts forcedStoreId={partnerStore.storeId} />
      )}
      {activeTab === 'categories' && <AdminCategories />}
      {activeTab === 'brands' && <AdminBrands />}
      {activeTab === 'inventory' && (
        <AdminInventory forcedStoreId={partnerStore.storeId} partnerUid={partnerUser?.uid} />
      )}
      {activeTab === 'reviews' && (
        <AdminReviews />
      )}
    </div>
  );
}
