import React, { useState, useEffect } from 'react';
import { RestockSuggestion } from '../../../types';
import { Lightbulb, AlertTriangle, ArrowRight, ShoppingBag, RefreshCw, CheckCircle } from 'lucide-react';

interface RestockSuggestionsTabProps {
  onOpenStockIn: (productId?: string) => void;
}

export const RestockSuggestionsTab: React.FC<RestockSuggestionsTabProps> = ({ onOpenStockIn }) => {
  const [suggestions, setSuggestions] = useState<RestockSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/restock-suggestions');
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error('Failed to load restock suggestions', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            CRITICAL OUT OF STOCK
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            HIGH RESTOCK PRIORITY
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM ADVISORY
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Explanation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Automated Restock & Velocity Suggestions</h3>
            <button
              onClick={fetchSuggestions}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-calculate Velocity
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Calculated in real-time from 30-day historical order velocity, current reserved stock, and product safety thresholds.
          </p>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">
            Calculating stock velocity and reorder points...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-slate-500 text-xs space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-slate-900 text-sm">Inventory Healthy!</div>
            <p className="text-xs text-slate-500">
              No products are currently critical or breaching low-stock safety thresholds.
            </p>
          </div>
        ) : (
          suggestions.map((s) => (
            <div
              key={s.productId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{s.productName}</h4>
                  <span className="font-mono text-xs text-slate-400">({s.sku})</span>
                  {renderPriorityBadge(s.priority)}
                </div>

                <p className="text-xs text-amber-800 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  Reason: {s.reason}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <div>
                    Category: <span className="text-slate-900 font-medium">{s.category}</span>
                  </div>
                  <div>
                    Current Stock: <span className="text-slate-900 font-bold">{s.currentStock}</span>
                  </div>
                  <div>
                    Available: <span className="text-emerald-600 font-bold">{s.availableStock}</span>
                  </div>
                  <div>
                    30-Day Sales Velocity: <span className="text-blue-600 font-bold">{s.unitsSold30Days} units</span>
                  </div>
                </div>
              </div>

              {/* Action Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 text-center md:text-right space-y-2">
                <div className="text-xs text-slate-500">
                  Recommended Order Qty: <span className="text-emerald-600 font-bold text-sm">{s.recommendedOrderQty} units</span>
                </div>
                <button
                  onClick={() => onOpenStockIn(s.productId)}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Order Stock
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
