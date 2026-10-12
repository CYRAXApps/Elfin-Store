import React, { useState, useEffect } from 'react';
import { InventoryOverviewMetrics } from '../../types';
import { InventoryMetrics } from '../../components/admin/inventory/InventoryMetrics';
import { InventoryTable } from '../../components/admin/inventory/InventoryTable';
import { StockInModal } from '../../components/admin/inventory/StockInModal';
import { StockAdjustModal } from '../../components/admin/inventory/StockAdjustModal';
import { ProductDetailDrawer } from '../../components/admin/inventory/ProductDetailDrawer';
import { SuppliersTab } from '../../components/admin/inventory/SuppliersTab';
import { PurchasesTab } from '../../components/admin/inventory/PurchasesTab';
import { LedgerTab } from '../../components/admin/inventory/LedgerTab';
import { RestockSuggestionsTab } from '../../components/admin/inventory/RestockSuggestionsTab';
import { InventoryReportsTab } from '../../components/admin/inventory/InventoryReportsTab';
import { ProcessReturnModal } from '../../components/admin/inventory/ProcessReturnModal';
import { Package, ArrowDownLeft, Building2, ShoppingBag, History, Lightbulb, FileText, AlertCircle } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export interface AdminInventoryProps {
  forcedStoreId?: string;
  partnerUid?: string;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({ forcedStoreId, partnerUid }) => {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'purchases' | 'ledger' | 'suggestions' | 'reports'>('products');
  const [storeFilter, setStoreFilter] = useState<string>(forcedStoreId || 'all');
  const [storesList, setStoresList] = useState<{ storeId: string; storeName: string }[]>([]);
  const [metrics, setMetrics] = useState<InventoryOverviewMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Products Table Data
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [queryParams, setQueryParams] = useState<any>({ page: 1, limit: 15, search: '', stockStatus: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 1 });

  // Categories & Brands
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Suppliers & Purchases Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Modal States
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState<string | undefined>(undefined);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedAdjustProduct, setSelectedAdjustProduct] = useState<any | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any | null>(null);

  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedReturnProduct, setSelectedReturnProduct] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/stores')
      .then(res => res.ok ? res.json() : { stores: [] })
      .then(data => {
        if (Array.isArray(data.stores)) {
          setStoresList(data.stores.map((s: any) => ({ storeId: s.storeId, storeName: s.storeName })));
        }
      })
      .catch(() => {});
  }, []);

  const activeStore = forcedStoreId || storeFilter;

  useEffect(() => {
    fetchMetrics();
    fetchSuppliersAndPurchases();
  }, [activeStore]);

  useEffect(() => {
    fetchProducts();
  }, [queryParams, activeStore]);

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    if (partnerUid) {
      headers['x-partner-uid'] = partnerUid;
    }
    return headers;
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const url = activeStore && activeStore !== 'all'
        ? `/api/admin/inventory/overview?storeId=${activeStore}`
        : '/api/admin/inventory/overview';
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory overview metrics', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const query = new URLSearchParams({
        page: (queryParams.page || 1).toString(),
        limit: (queryParams.limit || 15).toString(),
        search: queryParams.search || '',
        stockStatus: queryParams.stockStatus || 'all',
        category: queryParams.category || 'all',
        brand: queryParams.brand || 'all',
        sortBy: queryParams.sortBy || 'name',
        sortOrder: queryParams.sortOrder || 'asc'
      });

      if (activeStore && activeStore !== 'all') {
        query.set('storeId', activeStore);
      }

      const res = await fetch(`/api/admin/inventory/products?${query.toString()}`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.items || []);
        setPagination(data.pagination || { page: 1, limit: 15, totalCount: 0, totalPages: 1 });

        // Extract categories and brands
        const cats = Array.from(new Set((data.items || []).map((x: any) => x.category))).filter(Boolean) as string[];
        const brs = Array.from(new Set((data.items || []).map((x: any) => x.brand))).filter(Boolean) as string[];
        if (cats.length > 0) setCategories(cats);
        if (brs.length > 0) setBrands(brs);
      }
    } catch (err) {
      console.error('Failed to fetch inventory products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchSuppliersAndPurchases = async () => {
    setLoadingSuppliers(true);
    setLoadingPurchases(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch('/api/admin/inventory/suppliers'),
        fetch('/api/admin/inventory/purchases')
      ]);

      if (sRes.ok) {
        const sData = await sRes.json();
        setSuppliers(sData || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPurchases(pData || []);
      }
    } catch (err) {
      console.error('Failed to load suppliers or purchases', err);
    } finally {
      setLoadingSuppliers(false);
      setLoadingPurchases(false);
    }
  };

  const handleOpenStockIn = (productId?: string) => {
    setStockInProductId(productId);
    setIsStockInOpen(true);
  };

  const handleOpenAdjust = (product: any) => {
    setSelectedAdjustProduct(product);
    setIsAdjustOpen(true);
  };

  const handleOpenDetail = (product: any) => {
    setSelectedDetailProduct(product);
    setIsDetailOpen(true);
  };

  const handleOpenProcessReturn = (product: any) => {
    setSelectedReturnProduct(product);
    setIsReturnOpen(true);
  };

  const handleRefreshAll = () => {
    fetchMetrics();
    fetchProducts();
    fetchSuppliersAndPurchases();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="text-slate-800" size={24} />
              Inventory Operations
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
              {products.length || 0} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Monitor warehouse stock, manage purchase orders, track inward stock-in, and review movement ledgers.
          </p>
        </div>

        {/* Store Selector */}
        <div>
          {forcedStoreId ? (
            <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <span>Store Scope: <code className="font-mono text-blue-600">{forcedStoreId}</code></span>
            </div>
          ) : (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Stores</option>
              <option value="main-store">{storeName} (Main Store)</option>
              {storesList.map(s => (
                <option key={s.storeId} value={s.storeId}>{s.storeName} ({s.storeId})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Metrics Banner */}
      <InventoryMetrics
        metrics={metrics}
        loading={loadingMetrics}
        onRefresh={fetchMetrics}
        onSelectFilter={(status) => {
          setActiveTab('products');
          setQueryParams((prev: any) => ({ ...prev, stockStatus: status, page: 1 }));
        }}
      />

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className={`w-4 h-4 ${activeTab === 'products' ? 'text-white' : 'text-slate-500'}`} />
          Products & Stock Levels
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className={`w-4 h-4 ${activeTab === 'suppliers' ? 'text-white' : 'text-slate-500'}`} />
          Suppliers ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'purchases'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className={`w-4 h-4 ${activeTab === 'purchases' ? 'text-white' : 'text-slate-500'}`} />
          Purchase Orders ({purchases.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'ledger' ? 'text-white' : 'text-slate-500'}`} />
          Movement Ledger
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'suggestions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lightbulb className={`w-4 h-4 ${activeTab === 'suggestions' ? 'text-white' : 'text-amber-500'}`} />
          Restock Suggestions
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-slate-500'}`} />
          Valuation & Reports
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'products' && (
        <InventoryTable
          products={products}
          categories={categories}
          brands={brands}
          loading={loadingProducts}
          pagination={pagination}
          currentStockStatus={queryParams.stockStatus || 'all'}
          onQueryChange={(newParams) => setQueryParams({ ...queryParams, ...newParams })}
          onOpenStockIn={handleOpenStockIn}
          onOpenAdjust={handleOpenAdjust}
          onOpenDetail={handleOpenDetail}
          onOpenProcessReturn={handleOpenProcessReturn}
          onRefreshTable={handleRefreshAll}
        />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTab
          suppliers={suppliers}
          loading={loadingSuppliers}
          onRefresh={fetchSuppliersAndPurchases}
        />
      )}

      {activeTab === 'purchases' && (
        <PurchasesTab
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          loading={loadingPurchases}
          onRefresh={handleRefreshAll}
          onOpenStockIn={() => handleOpenStockIn()}
        />
      )}

      {activeTab === 'ledger' && (
        <LedgerTab />
      )}

      {activeTab === 'suggestions' && (
        <RestockSuggestionsTab
          onOpenStockIn={handleOpenStockIn}
        />
      )}

      {activeTab === 'reports' && (
        <InventoryReportsTab />
      )}

      {/* Modals & Drawers */}
      <StockInModal
        isOpen={isStockInOpen}
        preselectedProductId={stockInProductId}
        productsList={products}
        suppliersList={suppliers}
        onClose={() => setIsStockInOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <StockAdjustModal
        isOpen={isAdjustOpen}
        product={selectedAdjustProduct}
        productsList={products}
        onClose={() => {
          setIsAdjustOpen(false);
          setSelectedAdjustProduct(null);
        }}
        onSuccess={handleRefreshAll}
      />

      <ProductDetailDrawer
        isOpen={isDetailOpen}
        product={selectedDetailProduct}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetailProduct(null);
        }}
        onRefresh={handleRefreshAll}
      />

      <ProcessReturnModal
        isOpen={isReturnOpen}
        product={selectedReturnProduct}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  );
};
