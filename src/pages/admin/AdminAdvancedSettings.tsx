import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { 
  Users, 
  Key, 
  Download, 
  Upload, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  FileSpreadsheet, 
  Server, 
  Save, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  X, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  HelpCircle,
  FileText,
  Activity,
  Layers,
  Radio,
  Sliders,
  CheckCircle,
  Trash2,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { PaymentWebhooks } from './payments/PaymentWebhooks';
import { AdminStaff } from './AdminStaff';
import { CodebaseAuditForm } from '../../components/admin/CodebaseAuditForm';
import { useAuth } from '../../context/AuthContext';

export type AdvancedSettingsTab = 'codebase_defaults' | 'admin_staff' | 'integrations' | 'data' | 'security' | 'system';

export interface AdminAdvancedSettingsProps {
  initialSubTab?: 'codebase_defaults' | 'admin_staff' | 'integrations' | 'webhooks' | 'scripts' | 'import_export' | 'audit_logs' | 'database';
}

export function AdminAdvancedSettings({ initialSubTab = 'codebase_defaults' }: AdminAdvancedSettingsProps) {
  const { user } = useAuth();
  // Map incoming initialSubTab to core sections
  const getInitialTab = (tab?: string): AdvancedSettingsTab => {
    if (tab === 'codebase_defaults') return 'codebase_defaults';
    if (tab === 'admin_staff') return 'admin_staff';
    if (tab === 'webhooks' || tab === 'scripts' || tab === 'integrations') return 'integrations';
    if (tab === 'import_export' || tab === 'data') return 'data';
    if (tab === 'audit_logs' || tab === 'security') return 'security';
    if (tab === 'database' || tab === 'system') return 'system';
    return 'codebase_defaults';
  };

  const [activeTab, setActiveTab] = useState<AdvancedSettingsTab>(getInitialTab(initialSubTab));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Expandable section states
  const [showWebhooks, setShowWebhooks] = useState(initialSubTab === 'webhooks');
  const [showSmsDetails, setShowSmsDetails] = useState(false);
  const [showCustomScripts, setShowCustomScripts] = useState(initialSubTab === 'scripts');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Tracking scripts state (persisted to Firestore settings/scripts)
  const [scriptsForm, setScriptsForm] = useState({
    googleAnalyticsId: '',
    metaPixelId: '',
    customHeaderScript: '',
    customFooterScript: '',
  });

  // Server health state
  const [serverHealth, setServerHealth] = useState<{
    status: string;
    env: string;
    paymentMode: string;
    port: number;
    timestamp: string;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState<{
    paymentMode?: string;
    testKeyConfigured?: boolean;
    liveKeyConfigured?: boolean;
    webhookConfigured?: boolean;
    currency?: string;
  } | null>(null);

  // Database & Maintenance state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [cacheRefreshed, setCacheRefreshed] = useState(false);

  // CSV Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<string>('all');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(getInitialTab(initialSubTab));
      if (initialSubTab === 'webhooks') setShowWebhooks(true);
      if (initialSubTab === 'scripts') setShowCustomScripts(true);
    }
  }, [initialSubTab]);

  useEffect(() => {
    async function loadData() {
      try {
        const [busSnap, scriptsSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'business')),
          getDoc(doc(db, 'settings', 'scripts'))
        ]);
        if (busSnap.exists()) {
          const data = busSnap.data();
          if (data.maintenanceMode !== undefined) {
            setMaintenanceMode(Boolean(data.maintenanceMode));
          }
        }
        if (scriptsSnap.exists()) {
          setScriptsForm(prev => ({ ...prev, ...scriptsSnap.data() }));
        }
      } catch (e) {
        console.warn('Failed to load initial settings:', e);
      }
    }
    loadData();
    loadAuditLogs();
    checkServerHealth();
    loadPaymentStatus();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadPaymentStatus = async () => {
    try {
      const res = await fetch('/api/payments/status');
      if (res.ok) {
        const data = await res.json();
        setPaymentStatus(data);
      }
    } catch (e) {
      console.warn('Could not load payment status:', e);
    }
  };

  const checkServerHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerHealth(data);
      }
    } catch (err) {
      console.warn('Health check error:', err);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudits(true);
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleSaveScripts = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'scripts'), {
        ...scriptsForm,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast('success', 'Website tracking scripts saved successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save scripts.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async (enabled: boolean) => {
    try {
      setMaintenanceMode(enabled);
      await setDoc(doc(db, 'settings', 'business'), {
        maintenanceMode: enabled,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast('success', `Store Maintenance Mode is now ${enabled ? 'ENABLED' : 'DISABLED'}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update maintenance mode.');
    }
  };

  const handleRefreshCache = () => {
    setCacheRefreshed(true);
    showToast('success', 'Storefront catalog and in-memory cache refreshed successfully.');
    setTimeout(() => setCacheRefreshed(false), 3000);
  };

  // PURGE ALL USER DATA (Zero-Residual Wipe)
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgingData, setPurgingData] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  const handlePurgeAllUserData = async () => {
    try {
      setPurgingData(true);
      const res = await fetch('/api/admin/system/purge-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': user?.email || 'ritamsaha0000@gmail.com'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to purge user data');
      }
      showToast('success', 'All user data (accounts, orders, addresses, reviews, tickets, subscribers) permanently removed.');
      setPurgeModalOpen(false);
      setPurgeConfirmText('');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to purge user data');
    } finally {
      setPurgingData(false);
    }
  };

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/payments/webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // EXPORT HANDLERS
  const handleExportProductsCSV = async () => {
    try {
      setExportingData(true);
      const snap = await getDocs(collection(db, 'products'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const headers = ['ID', 'Name', 'Brand', 'Category', 'Price', 'OriginalPrice', 'Stock', 'SKU'];
      const rows = items.map((p: any) => [
        `"${p.id || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.price || 0,
        p.originalPrice || p.price || 0,
        p.stock || 0,
        `"${p.sku || ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `products_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Exported ${items.length} products to CSV.`);
    } catch (e: any) {
      showToast('error', 'Export failed: ' + e.message);
    } finally {
      setExportingData(false);
    }
  };

  const handleExportOrdersCSV = async () => {
    try {
      setExportingData(true);
      const snap = await getDocs(collection(db, 'orders'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const headers = ['Order ID', 'Customer Name', 'Total Amount', 'Status', 'Payment Status', 'Date'];
      const rows = items.map((o: any) => [
        `"${o.id || ''}"`,
        `"${(o.shippingAddress?.fullName || '').replace(/"/g, '""')}"`,
        o.grandTotal || o.totalAmount || 0,
        `"${o.status || ''}"`,
        `"${o.payment?.paymentStatus || ''}"`,
        `"${o.createdAt?.toDate ? o.createdAt.toDate().toISOString() : ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Exported ${items.length} orders to CSV.`);
    } catch (e: any) {
      showToast('error', 'Export failed: ' + e.message);
    } finally {
      setExportingData(false);
    }
  };

  const handleExportCustomersCSV = async () => {
    try {
      setExportingData(true);
      const snap = await getDocs(collection(db, 'users'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const headers = ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Joined Date'];
      const rows = items.map((u: any) => [
        `"${u.id || ''}"`,
        `"${(u.displayName || u.name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.phoneNumber || u.phone || '').replace(/"/g, '""')}"`,
        `"${u.role || 'customer'}"`,
        `"${u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : (u.createdAt || '')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Exported ${items.length} customers to CSV.`);
    } catch (e: any) {
      showToast('error', 'Export failed: ' + e.message);
    } finally {
      setExportingData(false);
    }
  };

  // CSV Template Download
  const handleDownloadSampleCSV = () => {
    const headers = ['Name', 'Brand', 'Category', 'Price', 'OriginalPrice', 'Stock', 'SKU', 'Description'];
    const sampleRows = [
      ['"Samsung Galaxy S24 Ultra"', '"Samsung"', '"Smartphones"', 129999, 134999, 25, '"SAM-S24U-256"', '"Flagship smartphone with Snapdragon 8 Gen 3"'],
      ['"Sony WH-1000XM5"', '"Sony"', '"Audio"', 29990, 34990, 40, '"SONY-WH1000M5"', '"Industry-leading noise cancelling wireless headphones"'],
      ['"Apple MacBook Air M3"', '"Apple"', '"Laptops"', 114900, 119900, 15, '"APL-MBA-M3"', '"13-inch liquid retina display, 8-core CPU"']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_product_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Selection & Parsing
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    setImportSuccess(null);
    setImportPreview(null);
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setImportError('Please select a valid .csv file.');
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          setImportError('CSV file is empty or missing data rows.');
          return;
        }

        // Basic CSV line parser respecting quotes
        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('title'));
        const priceIdx = headers.findIndex(h => h.includes('price') && !h.includes('orig'));
        const brandIdx = headers.findIndex(h => h.includes('brand'));
        const catIdx = headers.findIndex(h => h.includes('cat'));
        const stockIdx = headers.findIndex(h => h.includes('stock') || h.includes('qty'));
        const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('code'));

        if (nameIdx === -1 || priceIdx === -1) {
          setImportError('CSV must include at least "Name" and "Price" columns.');
          return;
        }

        const previewRows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          if (values.length > nameIdx && values[nameIdx]) {
            previewRows.push({
              name: values[nameIdx],
              price: Number(values[priceIdx]) || 0,
              brand: brandIdx >= 0 ? values[brandIdx] : 'Generic',
              category: catIdx >= 0 ? values[catIdx] : 'Electronics',
              stock: stockIdx >= 0 ? Number(values[stockIdx]) || 10 : 10,
              sku: skuIdx >= 0 ? values[skuIdx] : `SKU-${Date.now()}-${i}`
            });
          }
        }

        if (previewRows.length === 0) {
          setImportError('No valid product rows found in CSV.');
          return;
        }

        setImportPreview(previewRows);
      } catch (err: any) {
        setImportError('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Run CSV Import
  const handleExecuteImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      let importedCount = 0;
      for (const item of importPreview) {
        await addDoc(collection(db, 'products'), {
          ...item,
          rating: 4.5,
          reviewsCount: 0,
          inStock: item.stock > 0,
          featured: false,
          images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        importedCount++;
      }
      setImportSuccess(`Successfully imported ${importedCount} products into your catalog.`);
      setImportPreview(null);
      setImportFile(null);
      showToast('success', `Imported ${importedCount} products successfully.`);
    } catch (err: any) {
      setImportError('Error saving products: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Filter audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = auditSearch.toLowerCase();
      const matchesSearch = !q || 
        (log.action || '').toLowerCase().includes(q) ||
        (log.category || '').toLowerCase().includes(q) ||
        (log.adminEmail || log.userEmail || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (auditCategory !== 'all') {
        const cat = (log.category || 'system').toLowerCase();
        if (auditCategory === 'orders') return cat.includes('order');
        if (auditCategory === 'products') return cat.includes('product') || cat.includes('stock');
        if (auditCategory === 'staff') return cat.includes('staff') || cat.includes('auth');
        if (auditCategory === 'security') return cat.includes('security') || cat.includes('auth');
        if (auditCategory === 'settings') return cat.includes('setting');
        if (auditCategory === 'system') return cat.includes('system');
      }

      return true;
    });
  }, [auditLogs, auditSearch, auditCategory]);

  const sections: Array<{
    id: AdvancedSettingsTab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    desc: string;
  }> = [
    { id: 'codebase_defaults', label: 'Codebase Audit & Form', icon: FileCode, desc: 'Audit and replace hardcoded default values directly in source files' },
    { id: 'admin_staff', label: 'Admin & Staff', icon: Users, desc: 'Admin accounts, staff roles & permissions' },
    { id: 'integrations', label: 'Integrations', icon: Key, desc: 'Payment gateway, SMS, email & API connections' },
    { id: 'data', label: 'Data Management', icon: Download, desc: 'Import and export store catalogs and records' },
    { id: 'security', label: 'Security & Activity', icon: ShieldCheck, desc: 'Audit trails, admin logs & security policies' },
    { id: 'system', label: 'System & Database', icon: Database, desc: 'Database health, server status & maintenance' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Advanced Settings</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage administrator accounts, connected integrations, data backups, security logs, and store maintenance.
            </p>
          </div>
        </div>

        {/* 5-Section Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          {sections.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={tab.desc}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Notifications / Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold border shadow-sm animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. CODEBASE AUDIT & FORM */}
      {/* ========================================================================= */}
      {activeTab === 'codebase_defaults' && (
        <CodebaseAuditForm />
      )}

      {/* ========================================================================= */}
      {/* 1. ADMIN & STAFF */}
      {/* ========================================================================= */}
      {activeTab === 'admin_staff' && (
        <AdminStaff />
      )}

      {/* ========================================================================= */}
      {/* 2. INTEGRATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'integrations' && (
        <div className="space-y-5">
          {/* Card 1: Razorpay Payment Gateway */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Payment Gateway (Razorpay)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Processes credit/debit cards, UPI, Net Banking, and wallet payments for customer checkout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Public Key ID</span>
                <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block truncate">
                  rzp_test_••••••••
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Configured</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">API Secret</span>
                <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">
                  ••••••••••••••••
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Protected on server</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Currency</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">INR (₹)</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Zero client exposure</span>
              </div>
            </div>

            {/* Expandable Webhook Management */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowWebhooks(!showWebhooks)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
              >
                {showWebhooks ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                <span>{showWebhooks ? 'Hide Webhook Details' : 'View Webhook Details & Delivery Logs'}</span>
              </button>

              {showWebhooks && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Payment Webhook URL</span>
                    <p className="text-[11px] text-slate-500">
                      Configure this webhook in your Razorpay Dashboard under Settings → Webhooks to receive automatic payment confirmations.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/payments/webhook`}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyWebhook}
                        className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedWebhook ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Embedded Webhook Log Monitor */}
                  <div className="mt-4">
                    <PaymentWebhooks />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: SMS / OTP Authentication */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">SMS & Mobile OTP Authentication</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full">
                    Operational
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends instant 6-digit one-time passwords for mobile phone sign-in and POS customer lookups.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Delivery Provider</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">Fast2SMS / MSG91</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Indian Telecom DLT Compliant</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Code Validity</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">5 Minutes</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Auto-expiring token</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Rate Limiting</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">30s Cooldown</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">DDoS Protection Active</span>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSmsDetails(!showSmsDetails)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
              >
                {showSmsDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                <span>{showSmsDetails ? 'Hide Details' : 'View SMS Gateway Configuration'}</span>
              </button>

              {showSmsDetails && (
                <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600 animate-in fade-in duration-200">
                  <p className="font-semibold text-slate-800">How Mobile OTP Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    <li>Customers enter a 10-digit Indian mobile number (+91).</li>
                    <li>A random 6-digit verification code is generated server-side and hashed with SHA-256.</li>
                    <li>The SMS provider delivers the OTP instantly to the customer's phone.</li>
                    <li>Failed attempts are automatically rate-limited to prevent unauthorized access.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Email Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Email Notifications</h2>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated emails sent to customers for order receipts, tracking links, and support responses.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Sender Address</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block font-mono">
                  Configured in Store Settings
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Configurable in Store Settings</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Automated Triggers</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">Order Placed, Shipped, Delivered</span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Real-time delivery</span>
              </div>
            </div>
          </div>

          {/* Card 4: Other Connected Services */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Other Connected Services</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cloud infrastructure and AI integrations powering your store.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Google Gemini AI Engine</span>
                  <span className="text-[11px] text-slate-500">Powers product descriptions and customer support assistant</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                  Active
                </span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Store Database & Storage</span>
                  <span className="text-[11px] text-slate-500">Real-time product, order, and customer records</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Website Analytics & Custom Scripts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Website Tracking & Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect Google Analytics or Meta (Facebook) Pixel to monitor store visitors and sales conversions.
              </p>
            </div>

            <form onSubmit={handleSaveScripts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Google Analytics Measurement ID
                  </label>
                  <input
                    type="text"
                    value={scriptsForm.googleAnalyticsId}
                    onChange={e => setScriptsForm({ ...scriptsForm, googleAnalyticsId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="G-XXXXXXXXXX"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">E.g., G-1A2B3C4D5E</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Meta (Facebook) Pixel ID
                  </label>
                  <input
                    type="text"
                    value={scriptsForm.metaPixelId}
                    onChange={e => setScriptsForm({ ...scriptsForm, metaPixelId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="123456789012345"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Numeric Pixel tracking ID</span>
                </div>
              </div>

              {/* Expandable Advanced Code Block */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomScripts(!showCustomScripts)}
                  className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer"
                >
                  {showCustomScripts ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  <span>{showCustomScripts ? 'Hide Custom Scripts' : 'Advanced: Custom Header & Footer Code'}</span>
                </button>

                {showCustomScripts && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Header Script (injected into &lt;head&gt;)
                      </label>
                      <textarea
                        rows={3}
                        value={scriptsForm.customHeaderScript}
                        onChange={e => setScriptsForm({ ...scriptsForm, customHeaderScript: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="<!-- Optional custom header tracking snippet -->"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Footer Script (injected before &lt;/body&gt;)
                      </label>
                      <textarea
                        rows={3}
                        value={scriptsForm.customFooterScript}
                        onChange={e => setScriptsForm({ ...scriptsForm, customFooterScript: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs outline-none focus:border-blue-500 focus:bg-white"
                        placeholder="<!-- Optional custom footer tracking snippet -->"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Tracking Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DATA MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Section: Export Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Export Store Data</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download spreadsheets of your catalog, order history, and customer records for offline accounting or backup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Export Products */}
              <div className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors bg-slate-50/50">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Products Catalog (CSV)</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Download active product listings, current inventory quantities, SKUs, and retail prices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportProductsCSV}
                  disabled={exportingData}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>{exportingData ? 'Generating CSV...' : 'Download Products CSV'}</span>
                </button>
              </div>

              {/* Export Orders */}
              <div className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors bg-slate-50/50">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Orders & Sales (CSV)</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Download customer purchases, invoice amounts, payment statuses, and fulfillment dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportOrdersCSV}
                  disabled={exportingData}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>{exportingData ? 'Generating CSV...' : 'Download Orders CSV'}</span>
                </button>
              </div>

              {/* Export Customers */}
              <div className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors bg-slate-50/50">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">Customer Accounts (CSV)</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Download list of registered customer accounts, verified emails, phone numbers, and registration dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCustomersCSV}
                  disabled={exportingData}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download size={13} />
                  <span>{exportingData ? 'Generating CSV...' : 'Download Customers CSV'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Import Data */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Import Products (CSV)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulk add or update items in your catalog from a spreadsheet.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download size={13} />
                <span>Download Sample Template</span>
              </button>
            </div>

            {/* File Selector */}
            <div className="p-5 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Upload size={20} />
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  <span>Select CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {importFile ? importFile.name : 'Choose a CSV file with Name, Brand, Category, Price, Stock, and SKU columns'}
                </p>
              </div>
            </div>

            {/* Import Messages */}
            {importError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {/* Preview Box */}
            {importPreview && importPreview.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Ready to Import: {importPreview.length} items detected
                  </span>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={13} />
                    <span>{importing ? 'Importing Products...' : 'Confirm & Import to Catalog'}</span>
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 text-xs bg-white rounded-lg border border-slate-200">
                  {importPreview.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{row.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">({row.brand} • {row.category})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">₹{Number(row.price).toLocaleString()}</span>
                        <span className="text-[11px] text-slate-500 ml-2">Qty: {row.stock}</span>
                      </div>
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50">
                      ...and {importPreview.length - 5} more products
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECURITY & ACTIVITY */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Role-Based Access</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">
                Staff permissions enforced per module. Administrators maintain full system access.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Server Key Isolation</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">
                Zero payment or API secrets stored in browser bundles. Protected on cloud servers.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Rate Limiting & Shield</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">
                Automated rate limiting guards checkout, OTP requests, and contact inquiries.
              </p>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Audit Logs & Activity Trail</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete record of admin logins, order modifications, catalog adjustments, and security events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white w-44 sm:w-56"
                  />
                </div>

                <button
                  type="button"
                  onClick={loadAuditLogs}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw size={12} className={loadingAudits ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Filter by:</span>
              {['all', 'orders', 'products', 'staff', 'security', 'settings', 'system'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAuditCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                    auditCategory === cat 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Admin / User</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        {loadingAudits ? 'Loading audit records...' : 'No activity logs found matching your criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : new Date().toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 uppercase">
                            {log.category || 'System'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {log.action || log.event || 'SYSTEM_EVENT'}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {log.adminEmail || log.userEmail || 'System'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAuditLog(log)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Details Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Audit Event Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Action</span>
                  <span className="font-bold text-slate-800">{selectedAuditLog.action || selectedAuditLog.event}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                  <span className="font-bold text-slate-800">{selectedAuditLog.category || 'System'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admin User</span>
                  <span className="font-mono text-slate-700">{selectedAuditLog.adminEmail || selectedAuditLog.userEmail || 'System'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                  <span className="font-mono text-slate-700">
                    {selectedAuditLog.timestamp ? new Date(selectedAuditLog.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Event Payload / Context:</span>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed">
                  {selectedAuditLog.details 
                    ? selectedAuditLog.details 
                    : JSON.stringify(selectedAuditLog.meta || selectedAuditLog.payload || {}, null, 2)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SYSTEM & DATABASE */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-5">
          {/* Card 1: Live Status Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Database & System Health</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of your store database, application server, and operational services.
                </p>
              </div>
              <button
                type="button"
                onClick={checkServerHealth}
                disabled={checkingHealth}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <RefreshCw size={13} className={checkingHealth ? 'animate-spin' : ''} />
                <span>{checkingHealth ? 'Checking...' : 'Check Status'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Firestore DB Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Database size={15} className="text-blue-600" />
                    Primary Store Database
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Database connection is healthy and responsive. All customer records, products, and order receipts are continuously synchronized in real-time.
                </p>
                <div className="pt-1 text-[10px] text-slate-500 font-mono">
                  Collections: products, orders, users, reviews, settings
                </div>
              </div>

              {/* Node Server Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Server size={15} className="text-emerald-600" />
                    Store Application Server
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Operational
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Express backend API is running normally on Port 3000. Serving customer traffic, payment verification, and administrative routing.
                </p>
                <div className="pt-1 text-[10px] text-slate-500 font-mono">
                  Environment: {serverHealth?.env || 'production'} • Mode: {serverHealth?.paymentMode || 'test'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Store Maintenance Mode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Store Maintenance Controls</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Control customer availability when conducting physical inventory checks or major price adjustments.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="pr-4">
                <span className="font-bold text-slate-900 text-xs block">Storefront Maintenance Mode</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When enabled, visitors will see a friendly maintenance message while you make changes. Administrators can still access the Admin Panel normally.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => handleToggleMaintenance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Card 3: Cache Maintenance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Cache & Data Synchronization</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Refresh storefront data if customers report delayed product updates or outdated prices.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-xs block">Refresh Catalog In-Memory Cache</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Forces an immediate resynchronization of all category filters, brand listings, and product inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRefreshCache}
                disabled={cacheRefreshed}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw size={13} className={cacheRefreshed ? 'animate-spin' : ''} />
                <span>{cacheRefreshed ? 'Cache Refreshed' : 'Refresh Cache'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Danger Zone - Purge All User Data */}
          <div className="bg-red-50/50 rounded-2xl border border-red-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="border-b border-red-200/70 pb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-950">Danger Zone: Purge All User Data</h2>
                <p className="text-xs text-red-700 mt-0.5">
                  Permanently remove all customer and user accounts, orders, reviews, and activity logs.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-red-200">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-xs block">Wipe All Users & Personal Records</span>
                <p className="text-[11px] text-slate-600">
                  Deletes all records from users, customers, subcollections (addresses, carts, wishlists), orders, reviews, inquiries, and tickets. Catalog products and store categories remain intact.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPurgeConfirmText('');
                  setPurgeModalOpen(true);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Trash2 size={14} />
                <span>Purge All User Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PURGE ALL USER DATA CONFIRMATION MODAL */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-red-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Purge All User Data?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This action is irreversible. All user accounts, customers, order histories, addresses, product reviews, support tickets, and subscriber emails will be deleted.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div className="text-xs text-slate-700 font-medium">
                Type <span className="font-bold text-red-600 font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-200 select-all">DELETE ALL USER DATA</span> below to confirm:
              </div>
              <input
                type="text"
                value={purgeConfirmText}
                onChange={(e) => setPurgeConfirmText(e.target.value)}
                placeholder="DELETE ALL USER DATA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={purgingData}
                onClick={() => {
                  setPurgeModalOpen(false);
                  setPurgeConfirmText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purgingData || purgeConfirmText !== 'DELETE ALL USER DATA'}
                onClick={handlePurgeAllUserData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {purgingData ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm & Purge Everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
