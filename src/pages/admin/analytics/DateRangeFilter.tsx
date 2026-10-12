import React from 'react';
import { Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export interface DateFilterState {
  rangePreset: string;
  startDate: string;
  endDate: string;
  comparisonPreset: 'previous_period' | 'previous_month' | 'previous_year' | 'none';
  granularity: 'daily' | 'weekly' | 'monthly';
}

interface DateRangeFilterProps {
  filter: DateFilterState;
  onChange: (updated: Partial<DateFilterState>) => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: string | null;
}

export function DateRangeFilter({ filter, onChange, onRefresh, loading, lastUpdated }: DateRangeFilterProps) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar size={14} /> Date Range:
          </span>
          {[
            { label: 'Today', value: 'today' },
            { label: 'Yesterday', value: 'yesterday' },
            { label: 'Last 7 Days', value: 'last_7_days' },
            { label: 'Last 30 Days', value: 'last_30_days' },
            { label: 'This Month', value: 'this_month' },
            { label: 'Last Month', value: 'last_month' },
            { label: 'This Year', value: 'this_year' },
            { label: 'Custom', value: 'custom' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => onChange({ rangePreset: p.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter.rangePreset === p.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Refresh Button & Timestamp */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} /> Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Custom Date Pickers & Comparison Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
        {filter.rangePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={filter.startDate}
              onChange={e => onChange({ startDate: e.target.value })}
              className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={e => onChange({ endDate: e.target.value })}
              className="px-2 py-1 border border-slate-300 rounded text-xs text-slate-800"
            />
          </div>
        )}

        {/* Comparison Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Compare with:</span>
          <select
            value={filter.comparisonPreset}
            onChange={e => onChange({ comparisonPreset: e.target.value as any })}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="none">No Comparison</option>
            <option value="previous_period">Previous Period</option>
            <option value="previous_month">Previous Month</option>
            <option value="previous_year">Previous Year</option>
          </select>
        </div>

        {/* Chart Granularity */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Group By:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as const).map(g => (
              <button
                key={g}
                onClick={() => onChange({ granularity: g })}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                  filter.granularity === g ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
