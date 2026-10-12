import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertTriangle, Check, Search, Package, Hash, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface StockAdjustModalProps {
  isOpen: boolean;
  product: any | null;
  productsList?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  product: initialProduct,
  productsList = [],
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any | null>(initialProduct);
  const [productSearch, setProductSearch] = useState('');
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set_exact'>('decrease');
  const [quantity, setQuantity] = useState<number>(1);
  const [exactCount, setExactCount] = useState<number>(0);
  const [reason, setReason] = useState<
    'physical_count' | 'stock_take' | 'damaged' | 'lost' | 'expired' | 'missing' | 'supplier_correction' | 'warehouse_correction' | 'counting_error' | 'correction'
  >('physical_count');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedProduct(initialProduct);
      setError(null);
      setNotes('');
      if (initialProduct) {
        setExactCount(Number(initialProduct.stock) || 0);
      }
      setQuantity(1);
    }
  }, [isOpen, initialProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setExactCount(Number(selectedProduct.stock) || 0);
    }
  }, [selectedProduct]);

  if (!isOpen) return null;

  const currentStock = Number(selectedProduct?.stock) || 0;
  const reservedStock = Number(selectedProduct?.reservedStock) || 0;
  const currentAvailable = Math.max(0, currentStock - reservedStock);

  let calculatedNewStock = currentStock;
  let calculatedDelta = 0;

  if (adjustmentType === 'increase') {
    const qty = Math.max(0, Number(quantity) || 0);
    calculatedNewStock = currentStock + qty;
    calculatedDelta = qty;
  } else if (adjustmentType === 'decrease') {
    const qty = Math.max(0, Number(quantity) || 0);
    calculatedNewStock = currentStock - qty;
    calculatedDelta = -qty;
  } else if (adjustmentType === 'set_exact') {
    const target = Math.max(0, Number(exactCount) || 0);
    calculatedNewStock = target;
    calculatedDelta = target - currentStock;
  }

  const calculatedNewAvailable = Math.max(0, calculatedNewStock - reservedStock);

  const filteredProducts = productSearch.trim()
    ? productsList.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
      ).slice(0, 8)
    : productsList.slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct || !selectedProduct.id) {
      setError('Please select a valid product to perform the inventory adjustment.');
      return;
    }

    if (adjustmentType === 'increase' || adjustmentType === 'decrease') {
      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Adjustment quantity must be a positive integer greater than zero.');
        return;
      }
      if (adjustmentType === 'decrease' && currentStock < qty) {
        setError(`Requested deduction (${qty} units) exceeds current total stock (${currentStock} units). Stock cannot become negative.`);
        return;
      }
    } else if (adjustmentType === 'set_exact') {
      const target = Number(exactCount);
      if (isNaN(target) || target < 0) {
        setError('Exact stock count cannot be negative.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const creatorName = user?.displayName || user?.email || 'Admin Staff';
      const sendQty = adjustmentType === 'set_exact' ? Number(exactCount) : Number(quantity);

      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustmentType,
          quantity: sendQty,
          reason,
          notes,
          createdBy: creatorName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Adjustment failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error executing stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Adjustment & Physical Count</h2>
              <p className="text-xs text-slate-500">Modify stock quantity, write off damaged goods, or set exact counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Selected Product</label>
              {productsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsSearchingProduct(!isSearchingProduct)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  {isSearchingProduct ? 'Done Selecting' : 'Change Product'}
                </button>
              )}
            </div>

            {isSearchingProduct ? (
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product name, SKU, or barcode..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-500">No matching products found</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsSearchingProduct(false);
                        }}
                        className={`p-2 flex items-center justify-between hover:bg-slate-100 rounded cursor-pointer transition-colors ${
                          selectedProduct?.id === p.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div className="text-xs truncate max-w-[280px]">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Stock: {p.stock}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : selectedProduct ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 truncate">{selectedProduct.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">SKU: {selectedProduct.sku || selectedProduct.id}</div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white font-mono font-bold text-slate-900 border border-slate-200 shrink-0 shadow-2xs">
                  Current: {currentStock} units
                </span>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Please select a product to adjust.
              </div>
            )}
          </div>

          {/* Current vs Resulting Stock Math Breakdown */}
          {selectedProduct && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Total</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{currentStock}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reserved</div>
                <div className="text-base font-bold text-blue-600 mt-0.5">{reservedStock}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty Change</div>
                <div className={`text-base font-bold mt-0.5 ${calculatedDelta > 0 ? 'text-emerald-600' : calculatedDelta < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Available</div>
                <div className={`text-base font-bold mt-0.5 ${calculatedNewStock < 0 ? 'text-rose-600' : calculatedNewAvailable <= (selectedProduct.lowStockThreshold || 5) ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {calculatedNewAvailable} units
                </div>
              </div>
            </div>
          )}

          {/* Adjustment Action Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjustment Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  adjustmentType === 'decrease'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Deduct Stock (-)
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  adjustmentType === 'increase'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Add Stock (+)
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('set_exact');
                  setExactCount(currentStock);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  adjustmentType === 'set_exact'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                Set Exact Qty (=)
              </button>
            </div>
          </div>

          {/* Quantity or Exact Count Input */}
          {adjustmentType === 'set_exact' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exact Counted Stock Quantity (Store / Warehouse Physical Audit)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={exactCount}
                  onChange={(e) => setExactCount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  placeholder="e.g. 45"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                System will automatically record an adjustment delta of{' '}
                <span className="font-bold text-slate-800">
                  {calculatedDelta >= 0 ? `+${calculatedDelta}` : calculatedDelta}
                </span>{' '}
                units to match the physical count.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adjustmentType === 'increase' ? 'Units to Add to Stock' : 'Units to Deduct from Stock'}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          )}

          {/* Reason Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium cursor-pointer"
            >
              <option value="physical_count">Physical Stock Count / Warehouse Audit</option>
              <option value="stock_take">Periodic Store Stock-Take Reconciliation</option>
              <option value="damaged">Damaged Stock Write-off</option>
              <option value="lost">Lost / Stolen Stock Deduction</option>
              <option value="expired">Expired / Defective Product Disposal</option>
              <option value="missing">Missing In-Transit Item</option>
              <option value="supplier_correction">Supplier Quantity Discrepancy Correction</option>
              <option value="warehouse_correction">Warehouse Location Transfer Reconciliation</option>
              <option value="counting_error">Manual Counting Error Fix</option>
              <option value="correction">General Inventory Adjustment</option>
            </select>
          </div>

          {/* Reason Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audit Note / Explanation <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Discovered water damage on carton during shelf audit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Audit Attribution Note */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Action will be logged in Immutable Audit Trail by{' '}
              <strong className="text-slate-800">{user?.displayName || user?.email || 'Admin Staff'}</strong>.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedProduct || calculatedNewStock < 0}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer ${
                adjustmentType === 'decrease'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : adjustmentType === 'increase'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Applying...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
