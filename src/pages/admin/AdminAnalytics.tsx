import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, DollarSign, Package, Tag, Users, CreditCard, Archive, Truck,
  FileSpreadsheet, FileText, AlertCircle, RefreshCw
} from 'lucide-react';
import { DateRangeFilter, DateFilterState } from './analytics/DateRangeFilter';
import { OverviewTab } from './analytics/OverviewTab';
import { ProductAnalytics } from './analytics/ProductAnalytics';
import { CategoryBrandAnalytics } from './analytics/CategoryBrandAnalytics';
import { CustomerAnalytics } from './analytics/CustomerAnalytics';
import { PaymentAnalyticsView } from './analytics/PaymentAnalyticsView';
import { InventoryAnalytics } from './analytics/InventoryAnalytics';
import { CouponShippingAnalytics } from './analytics/CouponShippingAnalytics';
import { TaxAnalytics } from './analytics/TaxAnalytics';
import { ReportsExport } from './analytics/ReportsExport';

interface AdminAnalyticsProps {
  onNavigateTab?: (tab: string, filterState?: any) => void;
  initialSubTab?: 'overview' | 'sales' | 'products' | 'categories' | 'customers' | 'payments' | 'inventory' | 'coupons_shipping' | 'tax' | 'reports';
  forcedStoreId?: string;
}

export function AdminAnalytics({ onNavigateTab, initialSubTab, forcedStoreId }: AdminAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'categories' | 'customers' | 'payments' | 'inventory' | 'coupons_shipping' | 'tax' | 'reports'>(initialSubTab || 'overview');

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);
  
  const [filter, setFilter] = useState<DateFilterState>({
    rangePreset: 'last_30_days',
    startDate: '',
    endDate: '',
    comparisonPreset: 'previous_period',
    granularity: 'daily'
  });

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        rangePreset: filter.rangePreset,
        startDate: filter.startDate,
        endDate: filter.endDate,
        comparisonPreset: filter.comparisonPreset,
        granularity: filter.granularity
      });

      const res = await fetch(`/api/admin/analytics/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: HTTP ${res.status}`);
      }
      const data = await res.json();
      setAnalyticsData(data);
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error('Error loading admin analytics:', err);
      setError(err?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFilterChange = (updated: Partial<DateFilterState>) => {
    setFilter(prev => ({ ...prev, ...updated }));
  };

  const handleDrilldownNav = (targetTab: string, filterState?: any) => {
    if (onNavigateTab) {
      onNavigateTab(targetTab, filterState);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sales', label: 'Sales & Revenue', icon: DollarSign },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories & Brands', icon: Tag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'inventory', label: 'Inventory', icon: Archive },
    { id: 'coupons_shipping', label: 'Coupons & Shipping', icon: Truck },
    { id: 'tax', label: 'Tax & GST', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports & Export', icon: FileText }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={28} />
            Analytics & Business Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial reconciliation, sales velocity, customer cohorts & inventory intelligence
          </p>
        </div>
      </div>

      {/* Date Range & Comparison Controls */}
      <DateRangeFilter
        filter={filter}
        onChange={handleFilterChange}
        onRefresh={fetchAnalytics}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px bg-white p-1 rounded-xl shadow-xs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton or Content */}
      {loading && !analyticsData ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-3">
          <RefreshCw size={24} className="animate-spin mx-auto text-blue-600" />
          <p className="text-xs font-semibold">Aggregating sales & payment data...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && (
            <OverviewTab data={analyticsData} onNavigateTab={handleDrilldownNav} />
          )}

          {activeTab === 'sales' && (
            <OverviewTab data={analyticsData} onNavigateTab={handleDrilldownNav} />
          )}

          {activeTab === 'products' && (
            <ProductAnalytics
              data={analyticsData}
              onNavigateToProducts={(pId) => handleDrilldownNav('products', { productId: pId })}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryBrandAnalytics
              categories={analyticsData?.categories || []}
              brands={analyticsData?.brands || []}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerAnalytics
              data={analyticsData}
              onNavigateToCustomers={() => handleDrilldownNav('customers')}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentAnalyticsView
              data={analyticsData}
              onNavigateToPayments={() => handleDrilldownNav('payments')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryAnalytics
              data={analyticsData}
              onNavigateToInventory={() => handleDrilldownNav('inventory')}
            />
          )}

          {activeTab === 'coupons_shipping' && (
            <CouponShippingAnalytics
              data={analyticsData}
              onNavigateToCoupons={() => handleDrilldownNav('coupons')}
              onNavigateToOrders={() => handleDrilldownNav('orders')}
            />
          )}

          {activeTab === 'tax' && (
            <TaxAnalytics
              taxData={analyticsData?.tax}
              onExportTaxCSV={() => {
                window.open(`/api/admin/analytics/export?type=tax&rangePreset=${filter.rangePreset}`, '_blank');
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsExport filter={filter} />
          )}
        </div>
      )}
    </div>
  );
}
