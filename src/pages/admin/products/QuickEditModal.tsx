import React, { useState, useEffect } from 'react';
import { X, Check, Eye, EyeOff, AlertCircle, Tag, Package } from 'lucide-react';
import { Product } from '../../../types';

interface QuickEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Product>) => Promise<void>;
  existingCategories: string[];
  existingBrands: string[];
}

export function QuickEditModal({
  product,
  isOpen,
  onClose,
  onSave,
  existingCategories,
  existingBrands
}: QuickEditModalProps) {
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product && isOpen) {
      setError(null);
      setPrice(product.price ?? '');
      setStock(product.stock !== undefined ? product.stock : (product.inStock ? 10 : 0));
      setCategory(product.category || existingCategories[0] || 'General');
      setBrand(product.brand || existingBrands[0] || 'Standard');
      setIsPublished((product as any).isPublished !== false);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price === '' || Number(price) <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      setError("Stock quantity must be 0 or more.");
      return;
    }
    if (!category.trim()) {
      setError("Please select a category.");
      return;
    }
    if (!brand.trim()) {
      setError("Please specify a brand.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(product.id!, {
        price: Number(price),
        stock: Number(stock),
        inStock: Number(stock) > 0,
        category: category.trim(),
        brand: brand.trim(),
        isPublished,
        status: isPublished ? 'published' : 'draft',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
              <p className="text-[11px] text-slate-500">Quick Edit Product Values</p>
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

        <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Selling Price (₹)</label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Stock Units</label>
              <input
                type="number"
                required
                min={0}
                value={stock}
                onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Brand</label>
              <input
                type="text"
                required
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Storefront Status:</span>
            <button
              type="button"
              onClick={() => setIsPublished(!isPublished)}
              className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isPublished ? 'Live on Store' : 'Draft / Hidden'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={14} />
              <span>{saving ? 'Saving...' : 'Update Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
