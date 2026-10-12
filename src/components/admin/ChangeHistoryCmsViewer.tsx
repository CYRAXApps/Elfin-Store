import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { History, Search, Download, Trash2, Filter, Clock, User, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

interface AuditHistoryRecord {
  id: string;
  adminEmail: string;
  action: 'Draft Saved' | 'Published Live' | 'Draft Reverted' | 'Settings Reset';
  module: string;
  summary: string;
  timestamp: any;
  dateStr?: string;
}

export function ChangeHistoryCmsViewer() {
  const [historyLogs, setHistoryLogs] = useState<AuditHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Listen to siteSettingsHistory collection in Firestore
    const q = query(
      collection(db, 'siteSettingsHistory'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const records: AuditHistoryRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          records.push({
            id: docSnap.id,
            adminEmail: data.adminEmail || data.admin || 'admin',
            action: data.action || 'Draft Saved',
            module: data.module || 'All Website Control',
            summary: data.summary || 'Site configuration updated',
            timestamp: data.timestamp,
            dateStr: (() => {
              try {
                if (typeof data.timestamp?.toDate === 'function') {
                  return data.timestamp.toDate()?.toLocaleString('en-IN') || new Date().toLocaleString('en-IN');
                }
                if (data.timestamp?.seconds) {
                  return new Date(data.timestamp.seconds * 1000).toLocaleString('en-IN');
                }
                if (data.timestamp) {
                  return new Date(data.timestamp).toLocaleString('en-IN');
                }
                return new Date().toLocaleString('en-IN');
              } catch {
                return new Date().toLocaleString('en-IN');
              }
            })(),
          });
        });
        setHistoryLogs(records);
        setLoading(false);
      },
      (err) => {
        console.warn('Error reading siteSettingsHistory:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filteredLogs = historyLogs.filter((log) => {
    if (filterModule !== 'all' && log.module.toLowerCase() !== filterModule.toLowerCase()) return false;
    if (filterAction !== 'all' && log.action.toLowerCase() !== filterAction.toLowerCase()) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchEmail = log.adminEmail.toLowerCase().includes(term);
      const matchSummary = log.summary.toLowerCase().includes(term);
      const matchModule = log.module.toLowerCase().includes(term);
      if (!matchEmail && !matchSummary && !matchModule) return false;
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cms_change_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Admin Email', 'Action', 'Module', 'Summary', 'Timestamp'];
    const rows = historyLogs.map((log) => [
      log.id,
      `"${log.adminEmail}"`,
      `"${log.action}"`,
      `"${log.module}"`,
      `"${log.summary.replace(/"/g, '""')}"`,
      `"${log.dateStr || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cms_change_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear the change history audit trail?')) return;
    setIsClearing(true);
    try {
      const snap = await getDocs(collection(db, 'siteSettingsHistory'));
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(doc(db, 'siteSettingsHistory', docSnap.id)));
      await Promise.all(deletePromises);
    } catch (e) {
      console.error('Failed to clear history:', e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="text-blue-600" size={20} />
            <span>CMS Change History & Audit Trail</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Real-time audit log of all administrator saves, live publish events, draft updates, and rollbacks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={isClearing || historyLogs.length === 0}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Trash2 size={14} /> {isClearing ? 'Clearing...' : 'Clear Log'}
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by admin email, action, or summary..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="all">All Actions</option>
            <option value="draft saved">Draft Saved</option>
            <option value="published live">Published Live</option>
            <option value="draft reverted">Draft Reverted</option>
          </select>

          {/* Module Filter */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="all">All Modules</option>
            <option value="banners & popups">Banners & Popups</option>
            <option value="notifications">Notifications</option>
            <option value="maintenance mode">Maintenance Mode</option>
            <option value="regional settings">Regional Settings</option>
            <option value="integrations">Integrations</option>
            <option value="advanced settings">Advanced Settings</option>
            <option value="seo control">SEO Control</option>
            <option value="store policies">Store Policies</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw size={18} className="animate-spin text-blue-600" />
          <span className="text-xs font-bold">Loading change history...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
          <Layers className="mx-auto text-slate-300 mb-3" size={36} />
          <h3 className="text-sm font-bold text-slate-700">No Change History Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchTerm || filterModule !== 'all' || filterAction !== 'all'
              ? 'No logs match your filter criteria.'
              : 'Audit history entries will automatically appear here whenever settings are saved or published.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isPublish = log.action.toLowerCase().includes('publish');
            const isSave = log.action.toLowerCase().includes('save') || log.action.toLowerCase().includes('draft');
            const isRevert = log.action.toLowerCase().includes('revert') || log.action.toLowerCase().includes('reset');

            return (
              <div
                key={log.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isPublish
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRevert
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{log.module}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">{log.summary}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-slate-400" />
                    <span className="font-mono text-[11px] text-slate-600">{log.adminEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[11px] text-slate-500">{log.dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
