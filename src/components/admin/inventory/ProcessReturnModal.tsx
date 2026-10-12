import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, Check } from 'lucide-react';

interface ProcessReturnModalProps {
  isOpen: boolean;
  product: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProcessReturnModal: React.FC<ProcessReturnModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess
}) => {
  const [orderId, setOrderId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [disposition, setDisposition] = useState<'restock' | 'damaged' | 'rejected'>('restock');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId.trim()) {
      setError('Order Number / Reference ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/inventory/returns/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: product.id,
          quantity: Number(quantity),
          disposition,
          notes,
          createdBy: 'Admin User'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error processing return stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Process Customer Return Stock</h2>
              <p className="text-xs text-slate-500">{product.name} ({product.sku})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Order # / Return Reference</label>
            <input
              type="text"
              required
              placeholder="Enter order or return reference"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Returned Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Physical Stock Disposition</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="restock">Restock to Sellable Inventory (+Stock & Ledger)</option>
              <option value="damaged">Mark as Damaged / Defective (No Sellable Stock Increase)</option>
              <option value="rejected">Reject Return (Keep in Customer Possession)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Notes</label>
            <textarea
              rows={2}
              placeholder="Enter inspection notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {submitting ? 'Processing...' : 'Confirm Return Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
