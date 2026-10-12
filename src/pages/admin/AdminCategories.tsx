import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { 
  collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { 
  Edit, Trash2, Plus, X, Search, Image as ImageIcon, CheckCircle2, 
  AlertCircle, ArrowUpDown, Tag, Sparkles, Layers, Eye, EyeOff, Star, AlertTriangle
} from 'lucide-react';
import { Category, Product } from '../../types';
import { 
  getCachedCategories, 
  getCachedProducts, 
  subscribeCategories, 
  subscribeProducts 
} from '../../services/catalogCache';

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>(getCachedCategories);
  const [products, setProducts] = useState<Product[]>(getCachedProducts);
  const [loading, setLoading] = useState<boolean>(() => getCachedCategories().length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);
  
  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    order: 0,
    featured: false,
    active: true,
  });

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const showError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  useEffect(() => { 
    const unsubCats = subscribeCategories((cats, isLoaded) => {
      setCategories(cats);
      if (isLoaded) setLoading(false);
    });

    const unsubProds = subscribeProducts((prods) => {
      setProducts(prods);
    });

    return () => {
      unsubCats();
      unsubProds();
    };
  }, []);

  const fetchData = async () => {
    setCategories([...getCachedCategories()]);
    setProducts([...getCachedProducts()]);
  };

  // Compute product counts for each category
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        const catKey = p.category.trim();
        map[catKey] = (map[catKey] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    let result = categories.slice();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));
    return result;
  }, [categories, searchQuery]);

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: cat.description || '',
        image: cat.image || '',
        order: cat.order || 0,
        featured: Boolean(cat.featured),
        active: cat.active !== false,
      });
    } else {
      setEditingCategory(null);
      const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 1;
      setFormData({
        name: '',
        slug: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        order: nextOrder,
        featured: false,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleNameChange = (newName: string) => {
    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        ? newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      const finalSlug = formData.slug.trim() || formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload = {
        name: formData.name.trim(),
        slug: finalSlug,
        description: formData.description.trim(),
        image: formData.image.trim() || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        order: Number(formData.order) || 0,
        featured: Boolean(formData.featured),
        active: Boolean(formData.active),
        updatedAt: serverTimestamp(),
      };

      if (editingCategory?.id) {
        const oldName = editingCategory.name.trim();
        const newName = formData.name.trim();

        await updateDoc(doc(db, 'categories', editingCategory.id), payload);

        // If category name changed, update all products that used the old category name
        if (oldName !== newName) {
          const matchingProducts = products.filter(p => p.category?.trim() === oldName);
          if (matchingProducts.length > 0) {
            const batch = writeBatch(db);
            matchingProducts.forEach(prod => {
              if (prod.id) {
                batch.update(doc(db, 'products', prod.id), {
                  category: newName,
                  updatedAt: serverTimestamp(),
                });
              }
            });
            await batch.commit();
            showNotification(`Updated category "${newName}" and synchronized ${matchingProducts.length} assigned products!`);
          } else {
            showNotification(`Category "${newName}" updated successfully!`);
          }
        } else {
          showNotification(`Category "${newName}" updated successfully!`);
        }
      } else {
        await addDoc(collection(db, 'categories'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showNotification(`Category "${formData.name.trim()}" created successfully!`);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      console.error("Error saving category:", error);
      showError(error.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const nextState = !(cat.active !== false);
      await updateDoc(doc(db, 'categories', cat.id), {
        active: nextState,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Category "${cat.name}" is now ${nextState ? 'Active (Visible)' : 'Hidden'}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showError("Could not update category status.");
    }
  };

  const handleToggleFeatured = async (cat: Category) => {
    try {
      const nextState = !Boolean(cat.featured);
      await updateDoc(doc(db, 'categories', cat.id), {
        featured: nextState,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Category "${cat.name}" is now ${nextState ? 'Featured' : 'Standard'}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showError("Could not update featured flag.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmCat?.id) return;
    try {
      await deleteDoc(doc(db, 'categories', deleteConfirmCat.id));
      showNotification(`Deleted category "${deleteConfirmCat.name}".`);
      setDeleteConfirmCat(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showError("Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-bold shadow-xs animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600" size={24} /> Categories ({categories.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize products into customer-facing departments, navigation bars, and category grids.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories by name, slug, or description..."
          className="w-full text-xs sm:text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Categories Table / Card Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-200">
          Loading categories from database...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Layers size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No categories found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or add a new category above.</p>
          <button 
            onClick={() => handleOpenModal()} 
            className="mt-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Category Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4 text-center">Products</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCategories.map(cat => {
                  const pCount = productCountMap[cat.name.trim()] || 0;
                  const isActive = cat.active !== false;
                  const isFeatured = Boolean(cat.featured);

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        {cat.image ? (
                          <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-100" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{cat.name}</div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{cat.description}</div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        {cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          pCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {pCount} {pCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">
                        {cat.order || 0}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          title={isActive ? "Click to disable" : "Click to enable"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          {isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(cat)}
                          title={isFeatured ? "Remove from featured" : "Mark as featured"}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            isFeatured ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Star size={12} className={isFeatured ? "fill-amber-500 text-amber-500" : ""} />
                          {isFeatured ? 'Featured' : 'Standard'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenModal(cat)} 
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmCat(cat)} 
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative my-8 animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Set the department name, image banner, display order, and visibility.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  required 
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  value={formData.name} 
                  onChange={e => handleNameChange(e.target.value)} 
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug
                </label>
                <input 
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  value={formData.slug} 
                  onChange={e => setFormData({...formData, slug: e.target.value})} 
                  placeholder="Enter URL slug"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea 
                  rows={2}
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    required 
                    type="url" 
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono" 
                    value={formData.image} 
                    onChange={e => setFormData({...formData, image: e.target.value})} 
                    placeholder="Enter image URL"
                  />
                  {formData.image && (
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input 
                    type="number" 
                    min={0}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold" 
                    value={formData.order} 
                    onChange={e => setFormData({...formData, order: Number(e.target.value)})} 
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-slate-800">Active</span>
                    <input 
                      type="checkbox"
                      checked={formData.active}
                      onChange={e => setFormData({...formData, active: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-slate-800">Featured</span>
                    <input 
                      type="checkbox"
                      checked={formData.featured}
                      onChange={e => setFormData({...formData, featured: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Safety Confirmation Dialog */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Delete Category "{deleteConfirmCat.name}"?
            </h3>
            
            {productCountMap[deleteConfirmCat.name.trim()] > 0 ? (
              <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  {productCountMap[deleteConfirmCat.name.trim()]} products are currently tagged with this category!
                </div>
                <p className="text-[11px] text-amber-700">
                  Deleting this category will remove it from category filters and navigation. The assigned products will remain in your catalog but won't belong to an active category.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 my-3">
                This category has 0 assigned products. Are you sure you want to permanently delete it?
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmCat(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
