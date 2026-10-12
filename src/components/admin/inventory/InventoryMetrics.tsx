import React from 'react';
import { InventoryOverviewMetrics } from '../../../types';
import { Package, AlertTriangle, XCircle, CheckCircle, Lock, Warehouse, IndianRupee, RefreshCw, Clock } from 'lucide-react';

interface InventoryMetricsProps {
  metrics: InventoryOverviewMetrics | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectFilter?: (status: string) => void;
}

export const InventoryMetrics: React.FC<InventoryMetricsProps> = ({ 
  metrics, 
  loading, 
  onRefresh,
  onSelectFilter 
}) => {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-24 border border-slate-200 shadow-xs" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Products',
      value: Number(metrics.totalProducts || 0).toLocaleString(),
      sub: `${metrics.totalSKUs || 0} Active SKUs`,
      icon: Package,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      filterStatus: 'all'
    },
    {
      title: 'In Stock',
      value: Number(metrics.inStockCount || 0).toLocaleString(),
      sub: 'Healthy inventory level',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      filterStatus: 'in_stock'
    },
    {
      title: 'Low Stock Alerts',
      value: Number(metrics.lowStockCount || 0).toLocaleString(),
      sub: 'Below alert threshold',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      badge: (metrics.lowStockCount || 0) > 0 ? `${metrics.lowStockCount} Low` : null,
      filterStatus: 'low_stock'
    },
    {
      title: 'Out of Stock',
      value: Number(metrics.outOfStockCount || 0).toLocaleString(),
      sub: 'Needs restock',
      icon: XCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
      badge: (metrics.outOfStockCount || 0) > 0 ? 'Urgent' : null,
      filterStatus: 'out_of_stock'
    },
    {
      title: 'Reserved Stock',
      value: Number(metrics.reservedStockTotal || 0).toLocaleString(),
      sub: 'Locked in pending orders',
      icon: Lock,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50'
    },
    {
      title: 'Available Stock',
      value: Number(metrics.availableStockTotal || 0).toLocaleString(),
      sub: 'Ready for immediate dispatch',
      icon: Warehouse,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50'
    },
    {
      title: 'Stock Valuation',
      value: `₹${Number(metrics.totalStockValue || 0).toLocaleString('en-IN')}`,
      sub: metrics.costValueAvailable ? 'Based on supplier cost price' : 'Estimated cost basis',
      icon: IndianRupee,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50'
    },
    {
      title: 'Recently Updated',
      value: Number(metrics.recentlyUpdatedCount || 0).toLocaleString(),
      sub: 'Stock changes in last 7 days',
      icon: RefreshCw,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      filterStatus: 'recently_updated'
    },
    {
      title: 'Pending Restock',
      value: Number(metrics.pendingRestockCount || 0).toLocaleString(),
      sub: 'Draft POs & Out-of-stock items',
      icon: Clock,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Store Inventory Overview
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Overview
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const isClickable = !!card.filterStatus && !!onSelectFilter;
          return (
            <div
              key={idx}
              onClick={() => {
                if (isClickable && card.filterStatus) {
                  onSelectFilter(card.filterStatus);
                }
              }}
              className={`p-4 bg-white rounded-2xl border border-slate-200 shadow-xs transition-all ${
                isClickable ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 truncate">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-2xl font-bold text-slate-900">{card.value}</span>
                {card.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">{card.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
