import React, { useState, useEffect } from 'react';
import { 
  Search, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  X, 
  Filter, 
  Eye, 
  ShieldCheck, 
  Sliders, 
  Eraser, 
  CheckSquare, 
  Square, 
  Layers, 
  FileText,
  FileCheck
} from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export interface CodebaseItem {
  id: string;
  category: string;
  key: string;
  sourceFile: string;
  lineNumber: number;
  currentValue: string;
  replacementValue: string;
  contextSnippet: string;
  isClearable: boolean;
  description: string;
}

export function CodebaseAuditForm() {
  const { refreshSettings } = useSiteSettings();
  const [items, setItems] = useState<CodebaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [executionReport, setExecutionReport] = useState<{
    success: boolean;
    appliedCount: number;
    updatedFiles: string[];
    verificationScan: { item: string; remainingOccurrences: number }[];
  } | null>(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/codebase-audit');
      if (!res.ok) {
        throw new Error('Failed to fetch codebase audit data from server.');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        // Select all by default
        setSelectedIds(new Set(data.map(i => i.id)));
      }
    } catch (err: any) {
      console.error('Audit fetch error:', err);
      setError(err.message || 'Error loading codebase audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      item.currentValue.toLowerCase().includes(q) ||
      item.replacementValue.toLowerCase().includes(q) ||
      item.sourceFile.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.key.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  const handleReplacementChange = (id: string, val: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, replacementValue: val } : item));
  };

  const handleClearValue = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, replacementValue: '' } : item));
  };

  const handleResetToCurrent = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, replacementValue: item.currentValue } : item));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const itemsToApply = items.filter(i => selectedIds.has(i.id) && i.replacementValue !== i.currentValue);

  const handleApplyChanges = async () => {
    try {
      setApplying(true);
      setError(null);

      const payload = {
        replacements: itemsToApply.map(i => ({
          id: i.id,
          sourceFile: i.sourceFile,
          currentValue: i.currentValue,
          replacementValue: i.replacementValue
        }))
      };

      const res = await fetch('/api/admin/apply-codebase-replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to apply codebase changes.');
      }

      setExecutionReport({
        success: true,
        appliedCount: result.appliedCount || payload.replacements.length,
        updatedFiles: result.updatedFiles || [],
        verificationScan: result.verificationScan || []
      });

      setShowReviewModal(false);
      // Refresh site settings context
      await refreshSettings();
      // Re-fetch codebase audit to verify updated source file states
      await fetchAuditData();
    } catch (err: any) {
      console.error('Apply changes error:', err);
      setError(err.message || 'Failed to update source files.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6" id="codebase-audit-form-container">
      {/* Top Banner & Audit Overview */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCode className="text-blue-600" size={20} /> Codebase Hardcoded Defaults Audit Form
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Source Code Tool
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Scans React/TypeScript components, fallback objects, HTML titles, and server configs for hardcoded default details. Review, edit, or clear values directly in source files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAuditData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Rescan source code files"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Scanning...' : 'Rescan Codebase'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              disabled={itemsToApply.length === 0 || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              <span>Review & Apply Changes ({itemsToApply.length})</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><X size={14} /></button>
          </div>
        )}

        {/* Execution Report Output */}
        {executionReport && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                  Source Code Update & Verification Report
                </h3>
              </div>
              <button 
                onClick={() => setExecutionReport(null)} 
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>

            <p className="text-xs text-emerald-800 font-medium">
              Successfully applied {executionReport.appliedCount} replacement(s) across {executionReport.updatedFiles.length} source file(s).
            </p>

            {executionReport.updatedFiles.length > 0 && (
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 text-xs font-mono space-y-1 text-slate-800">
                <span className="font-bold text-slate-600 font-sans text-[11px] block">Updated Files:</span>
                {executionReport.updatedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <FileCheck size={12} className="text-emerald-600 shrink-0" />
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            )}

            {executionReport.verificationScan.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/80">
                <span className="text-[11px] font-bold text-emerald-900 block mb-1">Post-Update Verification Scan:</span>
                <div className="space-y-1">
                  {executionReport.verificationScan.map((v, i) => (
                    <div key={i} className="text-[11px] flex items-center justify-between text-slate-700 bg-white/60 px-2.5 py-1 rounded">
                      <span className="font-mono">{v.item}</span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${v.remainingOccurrences === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {v.remainingOccurrences === 0 ? 'Verified 0 remaining' : `${v.remainingOccurrences} remaining`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Pills & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword, value, or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Discovered Items Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
            >
              {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} className="text-slate-400" />
              )}
              <span>Select All Discovered ({filteredItems.length})</span>
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {itemsToApply.length} item(s) modified & ready to review
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-bold">Scanning source files across React components, configs, and JSON...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText size={28} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No matching codebase defaults found</p>
            <p className="text-[11px] text-slate-400">Try selecting a different category or clearing your search term.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isChecked = selectedIds.has(item.id);
              const isModified = item.replacementValue !== item.currentValue;

              return (
                <div 
                  key={item.id} 
                  className={`p-4 sm:p-5 transition-colors space-y-3 ${
                    isModified ? 'bg-amber-50/40' : isChecked ? 'bg-blue-50/20' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                      >
                        {isChecked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                            <FileCode size={12} className="text-blue-600" />
                            {item.sourceFile}:{item.lineNumber}
                          </span>
                          {isModified && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Modified
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs shrink-0">
                      {item.isClearable && (
                        <button
                          type="button"
                          onClick={() => handleClearValue(item.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="Clear value to empty string"
                        >
                          <Eraser size={11} /> Clear
                        </button>
                      )}
                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleResetToCurrent(item.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          title="Reset to current hardcoded value"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Current vs Replacement Editable Form Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Current Value in Source Code:
                      </span>
                      <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-xs text-slate-800 border border-slate-200 break-all select-all">
                        {item.currentValue || <span className="italic text-slate-400">&lt;empty&gt;</span>}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                        Replacement Value for Source Code:
                      </span>
                      <input
                        type="text"
                        value={item.replacementValue}
                        onChange={(e) => handleReplacementChange(item.id, e.target.value)}
                        placeholder="Enter replacement string or leave blank to clear"
                        className="w-full p-2 bg-white border border-blue-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Proposed Changes Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} className="text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Review Proposed Source Code Changes</h3>
                  <p className="text-xs text-slate-500">Confirm file replacements before writing to codebase</p>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium">
                The following {itemsToApply.length} hardcoded value(s) will be updated directly inside your source files on disk.
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {itemsToApply.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="font-bold text-slate-800">{item.sourceFile}</span>
                      <span>{item.category}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                      <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-200 break-all">
                        <span className="font-sans font-bold block text-[9px] uppercase text-rose-500">Old:</span>
                        {item.currentValue || '<empty>'}
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 break-all">
                        <span className="font-sans font-bold block text-[9px] uppercase text-emerald-600">New:</span>
                        {item.replacementValue || '<empty string / cleared>'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyChanges}
                disabled={applying}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {applying ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{applying ? 'Updating Source Files...' : 'Confirm & Apply to Source Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
