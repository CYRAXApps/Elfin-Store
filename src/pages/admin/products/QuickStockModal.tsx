import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Package, SlidersHorizontal, Plus, Minus, Hash, RotateCcw } from 'lucide-react';
import { Product } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

interface QuickStockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStock: number) => void;
}

export function QuickStockModal({
  product,
  isOpen,
  onClose,
  onSuccess
}: QuickStockModalProps) {
  const { user } = useAuth();
  const [adjustmentMode, setAdjustmentMode] = useState<'set' | 'increase' | 'decrease'>('set');
  const [amount, setAmount] = useState<number | ''>(0);
  const [reason, setReason] = useState<string>('physical_count');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStock = product?.stock !== undefined ? product.stock : (product?.inStock ? 10 : 0);

  useEffect(() => {
    if (product && isOpen) {
      setError(null);
      setAdjustmentMode('set');
      setAmount(currentStock);
      setReason('physical_count');
      setNotes('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Calculate projected new stock
  let calculatedNewStock = currentStock;
  const numAmount = typeof amount === 'number' ? amount : 0;
  if (adjustmentMode === 'set') {
    calculatedNewStock = Math.max(0, numAmount);
  } else if (adjustmentMode === 'increase') {
    calculatedNewStock = currentStock + Math.max(0, numAmount);
  } else if (adjustmentMode === 'decrease') {
    calculatedNewStock = Math.max(0, currentStock - Math.max(0, numAmount));
  }

  const delta = calculatedNewStock - currentStock;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    if (adjustmentMode === 'decrease' && numAmount > currentStock) {
      setError(`Cannot decrease by ${numAmount} units. Current stock is only ${currentStock}.`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const creatorName = user?.displayName || user?.email || 'Admin Staff';
      const adjustmentTypePayload = adjustmentMode === 'set' ? 'set_exact' : adjustmentMode;
      const sendQty = adjustmentMode === 'set' ? calculatedNewStock : numAmount;

      // Execute via server inventory adjust endpoint
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          adjustmentType: adjustmentTypePayload,
          quantity: sendQty,
          reason,
          notes: notes.trim() || `Quick stock update via product list (${reason})`,
          createdBy: creatorName
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update stock on server');
      }

      onSuccess(calculatedNewStock);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save stock adjustment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
              {product.image ? (
                <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <Package size={18} className="text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{product.name}</h3>
              <p className="text-[11px] text-slate-500">
                SKU: <span className="font-mono font-bold text-slate-700">{product.sku || 'N/A'}</span> • Current: <span className="font-bold text-slate-900">{currentStock}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-4 space-y-4 text-xs">
          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Adjustment Action</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentMode('set');
                  setAmount(currentStock);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adjustmentMode === 'set' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Set Exact
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentMode('increase');
                  setAmount(1);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adjustmentMode === 'increase' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Increase
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentMode('decrease');
                  setAmount(1);
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adjustmentMode === 'decrease' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Decrease
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {adjustmentMode === 'set' ? 'New Exact Quantity' : adjustmentMode === 'increase' ? 'Add Quantity (+)' : 'Deduct Quantity (-)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                required
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Adjustment Reason <span className="text-rose-500">*</span></label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="physical_count">Physical Stock Count / Audit</option>
              <option value="supplier_correction">Supplier Restock / Received</option>
              <option value="damaged">Damaged or Defective Items</option>
              <option value="lost">Lost or Missing Stock</option>
              <option value="expired">Expired Goods</option>
              <option value="counting_error">Manual Correction</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Optional Notes</label>
            <input
              type="text"
              placeholder="e.g., Shelf count verification"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Outcome Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Stock Result:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 line-through">{currentStock}</span>
              <span className="text-slate-400">&rarr;</span>
              <span className="font-black text-slate-900 text-sm">{calculatedNewStock} units</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                delta > 0 ? 'bg-emerald-100 text-emerald-800' : delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {delta > 0 ? `+${delta}` : delta}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{saving ? 'Updating...' : 'Save Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
