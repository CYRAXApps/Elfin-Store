import React, { useEffect, useState } from 'react';
import { 
  X, History, ShoppingBag, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCw, 
  Layers, AlertTriangle, Check, SlidersHorizontal, ArrowRight, RotateCcw, Edit2, Shield 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface ProductDetailDrawerProps {
  isOpen: boolean;
  product: any | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  isOpen,
  product,
  onClose,
  onRefresh
}) => {
  const { user } = useAuth();
  const [detailData, setDetailData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'purchases'>('ledger');

  // Low Stock Threshold edit state
  const [threshold, setThreshold] = useState<number>(5);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdSuccessMsg, setThresholdSuccessMsg] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product?.id) {
      setThreshold(Number(product.lowStockThreshold) || 5);
      setIsEditingThreshold(false);
      setThresholdSuccessMsg(null);
      setThresholdError(null);
      fetchDetail(product.id);
    }
  }, [isOpen, product]);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/products/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDetailData(data);
        if (data?.product?.lowStockThreshold !== undefined) {
          setThreshold(Number(data.product.lowStockThreshold));
        }
      }
    } catch (err) {
      console.error('Failed to load product detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThreshold = async () => {
    if (!product?.id) return;
    setSavingThreshold(true);
    setThresholdError(null);
    setThresholdSuccessMsg(null);

    try {
      const adminName = user?.displayName || user?.email || 'Admin Staff';
      const res = await fetch(`/api/admin/inventory/products/${product.id}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockThreshold: Math.max(0, Number(threshold)),
          adminUser: adminName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update threshold');
      }

      setThresholdSuccessMsg(`Alert threshold updated to ${threshold} units`);
      setIsEditingThreshold(false);
      if (onRefresh) onRefresh();
      setTimeout(() => setThresholdSuccessMsg(null), 3500);
    } catch (err: any) {
      setThresholdError(err.message || 'Error updating threshold');
    } finally {
      setSavingThreshold(false);
    }
  };

  if (!isOpen || !product) return null;

  const renderMovementBadge = (type: string, refType?: string) => {
    if (refType === 'pos_sale' || (type === 'sale' && refType?.includes('pos'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ArrowUpRight className="w-3 h-3" /> POS Sale
        </span>
      );
    }
    if (type === 'sale' || refType === 'online_order') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <ArrowUpRight className="w-3 h-3" /> Online Order
        </span>
      );
    }
    if (type === 'purchase' || refType === 'supplier_stock_in' || refType === 'purchase_order') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownLeft className="w-3 h-3" /> Stock In / Purchase
        </span>
      );
    }
    if (type === 'return' || refType === 'customer_return') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <RotateCcw className="w-3 h-3" /> Customer Return
        </span>
      );
    }
    if (type === 'damaged' || type === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3 h-3" /> Damaged / Write-off
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <SlidersHorizontal className="w-3 h-3" /> Manual Adjustment
      </span>
    );
  };

  const currentAvailable = product.availableStock !== undefined 
    ? product.availableStock 
    : Math.max(0, (Number(product.stock) || 0) - (Number(product.reservedStock) || 0));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white border-l border-slate-200 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                {product.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{product.name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                SKU: {product.sku || 'N/A'} {product.barcode ? `| Barcode: ${product.barcode}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Metrics Grid */}
        <div className="p-5 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Physical Stock</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{product.stock} units</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Reserved in Orders</div>
            <div className="text-base font-bold text-blue-600 mt-0.5">{product.reservedStock || 0} units</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Available for Sale</div>
            <div className={`text-base font-bold mt-0.5 ${currentAvailable <= threshold ? 'text-amber-600' : 'text-emerald-600'}`}>
              {currentAvailable} units
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Unit Cost Price</div>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
              {product.costPrice ? `₹${Number(product.costPrice).toLocaleString('en-IN')}` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Low-Stock Threshold Management Box */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-700">Low Stock Alert Threshold: </span>
              {!isEditingThreshold ? (
                <span className="text-xs font-bold text-amber-700 font-mono ml-1">{threshold} units</span>
              ) : null}
            </div>
          </div>

          {!isEditingThreshold ? (
            <button
              onClick={() => setIsEditingThreshold(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-slate-500" />
              Change Threshold
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={handleSaveThreshold}
                disabled={savingThreshold}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingThreshold ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setThreshold(Number(product.lowStockThreshold) || 5);
                  setIsEditingThreshold(false);
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {thresholdSuccessMsg && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{thresholdSuccessMsg}</span>
          </div>
        )}
        {thresholdError && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{thresholdError}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="px-6 border-b border-slate-100 flex items-center gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movement History ({detailData?.ledgerHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('purchases')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'purchases'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Purchase History ({detailData?.purchaseHistory?.length || 0})
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-medium">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading authoritative stock movements & audit records...
            </div>
          ) : activeSubTab === 'ledger' ? (
            <div className="space-y-3">
              {!detailData?.ledgerHistory || detailData.ledgerHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No stock movements recorded for this product yet.
                </div>
              ) : (
                detailData.ledgerHistory.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {renderMovementBadge(item.type, item.referenceType)}
                        {item.referenceId && (
                          <span className="text-slate-400 font-mono text-[11px]">Ref: {item.referenceId}</span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {new Date(item.createdAt || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-medium">
                      {item.reason}
                      {item.notes && <span className="text-slate-500 block text-[11px] mt-0.5 italic">"{item.notes}"</span>}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        Change:{' '}
                        <span className={`font-bold ${item.quantity > 0 ? 'text-emerald-600' : item.quantity < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity} units
                        </span>
                      </div>
                      <div>
                        Stock:{' '}
                        <span className="text-slate-700 font-semibold">{item.beforeStock}</span> →{' '}
                        <span className="text-blue-600 font-bold">{item.afterStock}</span>
                      </div>
                      <div className="text-slate-500">
                        Staff / User: <span className="text-slate-800 font-semibold">{item.createdBy || 'Admin System'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {!detailData?.purchaseHistory || detailData.purchaseHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No supplier purchase orders recorded for this product yet.
                </div>
              ) : (
                detailData.purchaseHistory.map((po: any) => (
                  <div key={po.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{po.referenceNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.status === 'received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Supplier: <span className="text-slate-800 font-semibold">{po.supplierName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100">
                      <span>Purchase Date: {po.purchaseDate}</span>
                      <span className="text-slate-900 font-mono font-bold">Total: ₹{Number(po.totalCost).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
