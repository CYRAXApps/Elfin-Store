import React, { useState } from 'react';
import { CheckSquare, Eye, EyeOff, Trash2, Tag, Layers, X, AlertTriangle } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkPublish: () => Promise<void>;
  onBulkUnpublish: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkCategoryChange: (newCategory: string) => Promise<void>;
  onBulkStockUpdate: (stockQuantity: number) => Promise<void>;
  existingCategories: string[];
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkPublish,
  onBulkUnpublish,
  onBulkDelete,
  onBulkCategoryChange,
  onBulkStockUpdate,
  existingCategories
}: BulkActionsBarProps) {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(existingCategories[0] || '');
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [newStockVal, setNewStockVal] = useState<number>(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleApplyCategory = async () => {
    if (!selectedCategory) return;
    try {
      setLoading(true);
      await onBulkCategoryChange(selectedCategory);
      setShowCategoryDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStock = async () => {
    try {
      setLoading(true);
      await onBulkStockUpdate(Number(newStockVal) || 0);
      setShowStockDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDelete = async () => {
    try {
      setLoading(true);
      await onBulkDelete();
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 flex flex-wrap items-center gap-3 sm:gap-4 border border-slate-700/80 max-w-[95vw] sm:max-w-3xl animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2 border-r border-slate-700 pr-3 sm:pr-4">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="text-xs font-bold text-slate-200 hidden sm:inline">
            {selectedCount === 1 ? 'Product Selected' : 'Products Selected'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Bulk Publish */}
          <button
            type="button"
            disabled={loading}
            onClick={onBulkPublish}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Publish all selected products"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Publish</span>
          </button>

          {/* Bulk Unpublish */}
          <button
            type="button"
            disabled={loading}
            onClick={onBulkUnpublish}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Unpublish selected products"
          >
            <EyeOff size={14} />
            <span className="hidden sm:inline">Unpublish</span>
          </button>

          {/* Bulk Category */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowCategoryDialog(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Change category for selected products"
          >
            <Tag size={14} />
            <span className="hidden md:inline">Set Category</span>
          </button>

          {/* Bulk Stock */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowStockDialog(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Update inventory stock for selected products"
          >
            <Layers size={14} />
            <span className="hidden md:inline">Update Stock</span>
          </button>

          {/* Bulk Delete */}
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Delete selected products"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="ml-auto p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Deselect all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Change Modal */}
      {showCategoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-900">
            <h3 className="text-sm font-bold mb-1">Bulk Change Category</h3>
            <p className="text-xs text-slate-500 mb-4">
              Apply a new category to all {selectedCount} selected products.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Category</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                {existingCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryDialog(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApplyCategory}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {loading ? 'Updating...' : 'Apply Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-900">
            <h3 className="text-sm font-bold mb-1">Bulk Update Stock</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set the stock quantity for all {selectedCount} selected products.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">New Stock Units</label>
              <input
                type="number"
                min={0}
                value={newStockVal}
                onChange={e => setNewStockVal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStockDialog(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApplyStock}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {loading ? 'Updating...' : 'Set Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-black mb-1 text-slate-900">Delete {selectedCount} Products?</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete these <strong>{selectedCount}</strong> products? This will remove them from your store catalog and inventory.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleApplyDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                {loading ? 'Deleting...' : 'Yes, Delete Products'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
