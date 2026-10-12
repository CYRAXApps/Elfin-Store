import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowDownLeft, Check, AlertCircle } from 'lucide-react';

interface StockInModalProps {
  isOpen: boolean;
  preselectedProductId?: string;
  productsList: any[];
  suppliersList: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  preselectedProductId,
  productsList,
  suppliersList,
  onClose,
  onSuccess
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: preselectedProductId || (productsList[0]?.id || ''), quantity: 10, unitCost: productsList[0]?.costPrice || 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedProductId) {
      const p = productsList.find(x => x.id === preselectedProductId);
      setItems([{ productId: preselectedProductId, quantity: 10, unitCost: p?.costPrice || 0 }]);
    } else if (productsList.length > 0 && items.length === 1 && !items[0].productId) {
      setItems([{ productId: productsList[0].id, quantity: 10, unitCost: productsList[0].costPrice || 0 }]);
    }
    if (suppliersList.length > 0 && !supplierId) {
      setSupplierId(suppliersList[0].id);
    }
  }, [preselectedProductId, productsList, suppliersList]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstP = productsList[0];
    setItems([...items, { productId: firstP?.id || '', quantity: 1, unitCost: firstP?.costPrice || 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const cur = updated[index];
    if (field === 'productId') {
      const selectedP = productsList.find(p => p.id === value);
      cur.productId = value;
      if (selectedP && selectedP.costPrice) {
        cur.unitCost = Number(selectedP.costPrice);
      }
    } else if (field === 'quantity') {
      cur.quantity = Math.max(1, parseInt(value || '1', 10));
    } else if (field === 'unitCost') {
      cur.unitCost = Math.max(0, parseFloat(value || '0'));
    }
    setItems(updated);
  };

  const selectedSupplier = suppliersList.find(s => s.id === supplierId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.some(i => !i.productId)) {
      setError('Please select a valid product for all rows.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          supplierName: selectedSupplier?.name || 'General Supplier',
          purchaseRef: purchaseRef || `REC-${Date.now().toString().slice(-6)}`,
          items,
          notes,
          createdBy: 'Admin User'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Stock receiving failed');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error executing stock receiving');
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalCost = items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Stock Receiving (Stock-In)</h2>
              <p className="text-xs text-slate-500">Atomic stock increase & supplier unit cost ledgering</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier & Ref Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                {suppliersList.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name} ({sup.companyName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice / Receiving Ref #</label>
              <input
                type="text"
                placeholder="Enter invoice or reference number"
                value={purchaseRef}
                onChange={(e) => setPurchaseRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Received Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, index) => {
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                      >
                        {productsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">units</span>
                      </div>
                    </div>

                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-[10px] text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cost Price"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                          className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Notes / Quality Check Remarks</label>
            <textarea
              rows={2}
              placeholder="Enter receiving remarks or notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Summary Banner */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Total Units to Receive: </span>
              <span className="font-bold text-slate-900">{totalQuantity}</span>
            </div>
            <div>
              <span className="text-slate-500">Total Supplier Cost: </span>
              <span className="font-bold text-emerald-600 font-mono text-sm">₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Receiving Stock...' : 'Confirm Stock-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
