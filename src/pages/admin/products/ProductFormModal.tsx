import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon, 
  Plus, Trash2, ArrowUp, ArrowDown, Check, AlertCircle, Eye, EyeOff, Tag, Package, Truck, Globe, Shield, HelpCircle
} from 'lucide-react';
import { Product } from '../../../types';
import { useSiteSettings } from '../../../context/SiteSettingsContext';

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>, isPublishAction: boolean) => Promise<void>;
  editingProduct: Product | null;
  existingCategories: string[];
  existingBrands: string[];
  forcedStoreId?: string;
  availableStores?: { storeId: string; storeName: string }[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  existingCategories,
  existingBrands,
  forcedStoreId,
  availableStores = []
}: ProductFormModalProps) {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';
  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState<string>('main-store');
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');

  // Pricing
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // Inventory
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState<number | ''>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  // Images
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState('');

  // Product Details
  const [specsList, setSpecsList] = useState<{ key: string; value: string }[]>([
    { key: 'Warranty', value: '1 Year' },
    { key: 'Color', value: 'Black' }
  ]);
  const [featuresList, setFeaturesList] = useState<string[]>([
    'High performance and durability',
    'Certified authentic manufacturer product'
  ]);
  const [warranty, setWarranty] = useState('1 Year Brand Warranty');
  const [weight, setWeight] = useState('250g');
  const [dimensions, setDimensions] = useState('15 x 8 x 2 cm');

  // Shipping
  const [shippingRequired, setShippingRequired] = useState(true);
  const [shippingClass, setShippingClass] = useState('standard');

  // Publishing
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // Collapsed Advanced Options (SEO & Technical)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('');

  // Validation & UI State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load product when opened
  useEffect(() => {
    if (!isOpen) return;

    setValidationError(null);
    setShowAdvancedOptions(false);

    if (editingProduct) {
      setSelectedStoreId(editingProduct.storeId || forcedStoreId || 'main-store');
      setName(editingProduct.name || '');
      setShortDescription(editingProduct.shortDescription || '');
      setDescription(editingProduct.description || '');
      
      const cat = editingProduct.category || '';
      if (existingCategories.includes(cat)) {
        setCategory(cat);
        setCustomCategory('');
      } else {
        setCategory('__custom__');
        setCustomCategory(cat);
      }

      const br = editingProduct.brand || '';
      if (existingBrands.includes(br)) {
        setBrand(br);
        setCustomBrand('');
      } else {
        setBrand('__custom__');
        setCustomBrand(br);
      }

      setPrice(editingProduct.price ?? '');
      setOriginalPrice(editingProduct.originalPrice ?? '');
      setDiscountPercentage(editingProduct.discountPercentage || 0);

      setSku(editingProduct.sku || '');
      setStock(editingProduct.stock !== undefined ? editingProduct.stock : (editingProduct.inStock ? 10 : 0));
      setLowStockThreshold(editingProduct.lowStockThreshold ?? 5);

      setMainImage(editingProduct.image || '');
      setAdditionalImages(editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images.filter(img => img !== editingProduct.image) : []);

      // Specifications
      if (editingProduct.specifications && typeof editingProduct.specifications === 'object') {
        const specs = Object.entries(editingProduct.specifications).map(([k, v]) => ({ key: k, value: String(v) }));
        setSpecsList(specs.length > 0 ? specs : [{ key: '', value: '' }]);
      } else {
        setSpecsList([{ key: 'Warranty', value: '1 Year' }]);
      }

      // Features
      if (Array.isArray(editingProduct.features) && editingProduct.features.length > 0) {
        setFeaturesList(editingProduct.features);
      } else {
        setFeaturesList(['100% genuine product with official manufacturer warranty']);
      }

      setWarranty(editingProduct.warranty || '1 Year Brand Warranty');
      setWeight(typeof editingProduct.weight === 'string' ? editingProduct.weight : editingProduct.weight ? `${editingProduct.weight}g` : '250g');
      setDimensions(editingProduct.dimensions || '15 x 8 x 2 cm');

      setShippingRequired(editingProduct.shippingRequired !== false);
      setShippingClass(editingProduct.shippingClass || 'standard');

      setIsPublished(editingProduct.isPublished !== false);
      setIsFeatured(Boolean(editingProduct.isFeatured));
      setIsBestSeller(Boolean(editingProduct.isBestSeller));
      setIsNewArrival(Boolean(editingProduct.isNewArrival));

      setSeoTitle(editingProduct.seoTitle || '');
      setSeoDescription(editingProduct.seoDescription || '');
      setSeoSlug(editingProduct.seoSlug || '');
      setBarcode(editingProduct.barcode || '');
      setHsnCode(editingProduct.hsnCode || '');
    } else {
      // New Product Defaults
      setSelectedStoreId(forcedStoreId || 'main-store');
      setName('');
      setShortDescription('');
      setDescription('');
      setCategory(existingCategories[0] || 'Audio');
      setCustomCategory('');
      setBrand(existingBrands[0] || 'Apple');
      setCustomBrand('');

      setPrice('');
      setOriginalPrice('');
      setDiscountPercentage(0);

      setSku(`ELEC-${Math.floor(1000 + Math.random() * 9000)}`);
      setStock(10);
      setLowStockThreshold(5);

      setMainImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80');
      setAdditionalImages([]);
      setNewImageInput('');

      setSpecsList([
        { key: 'Warranty', value: '1 Year Brand Warranty' },
        { key: 'Color', value: 'Matte Black' },
        { key: 'Connectivity', value: 'Bluetooth 5.3' }
      ]);
      setFeaturesList([
        'Premium high-fidelity audio engineering',
        'Long-lasting battery life with ultra-fast charging',
        'Ergonomic comfort designed for all-day use'
      ]);
      setWarranty('1 Year Brand Warranty');
      setWeight('250g');
      setDimensions('18 x 16 x 4 cm');

      setShippingRequired(true);
      setShippingClass('standard');

      setIsPublished(true);
      setIsFeatured(false);
      setIsBestSeller(false);
      setIsNewArrival(true);

      setSeoTitle('');
      setSeoDescription('');
      setSeoSlug('');
      setBarcode('');
      setHsnCode('85183000');
    }
  }, [isOpen, editingProduct]);

  // Automatically compute discount percentage when price or originalPrice changes
  const handlePriceChange = (val: number | '') => {
    setPrice(val);
    if (typeof val === 'number' && typeof originalPrice === 'number' && originalPrice > val && originalPrice > 0) {
      const discount = Math.round(((originalPrice - val) / originalPrice) * 100);
      setDiscountPercentage(discount);
    } else {
      setDiscountPercentage(0);
    }
  };

  const handleOriginalPriceChange = (val: number | '') => {
    setOriginalPrice(val);
    if (typeof price === 'number' && typeof val === 'number' && val > price && val > 0) {
      const discount = Math.round(((val - price) / val) * 100);
      setDiscountPercentage(discount);
    } else {
      setDiscountPercentage(0);
    }
  };

  // Image actions
  const handleAddImage = () => {
    if (!newImageInput.trim()) return;
    if (!mainImage) {
      setMainImage(newImageInput.trim());
    } else {
      setAdditionalImages(prev => [...prev, newImageInput.trim()]);
    }
    setNewImageInput('');
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetAsMainImage = (index: number) => {
    const selected = additionalImages[index];
    const oldMain = mainImage;
    setMainImage(selected);
    setAdditionalImages(prev => {
      const next = [...prev];
      if (oldMain) {
        next[index] = oldMain;
      } else {
        next.splice(index, 1);
      }
      return next;
    });
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    setAdditionalImages(prev => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Specs actions
  const handleAddSpec = () => {
    setSpecsList(prev => [...prev, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setSpecsList(prev => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setSpecsList(prev => prev.filter((_, i) => i !== index));
  };

  // Features actions
  const handleAddFeature = () => {
    setFeaturesList(prev => [...prev, '']);
  };

  const handleFeatureChange = (index: number, val: string) => {
    setFeaturesList(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesList(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setValidationError("Product name is required.");
      return false;
    }
    const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setValidationError("Please select or enter a category.");
      return false;
    }
    const finalBrand = brand === '__custom__' ? customBrand.trim() : brand.trim();
    if (!finalBrand) {
      setValidationError("Please specify the brand.");
      return false;
    }
    if (price === '' || isNaN(Number(price)) || Number(price) <= 0) {
      setValidationError("Selling price is required and must be greater than 0.");
      return false;
    }
    if (stock === '' || isNaN(Number(stock)) || Number(stock) < 0) {
      setValidationError("Stock quantity is required (must be 0 or more).");
      return false;
    }
    if (!mainImage.trim()) {
      setValidationError("Main product image URL is required.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleFormSubmit = async (e: React.FormEvent, publishState: boolean) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();
      const finalBrand = brand === '__custom__' ? customBrand.trim() : brand.trim();

      // Convert specs list to object
      const specificationsObject: Record<string, string> = {};
      specsList.forEach(item => {
        if (item.key.trim() && item.value.trim()) {
          specificationsObject[item.key.trim()] = item.value.trim();
        }
      });

      // Filter non-empty features
      const filteredFeatures = featuresList.map(f => f.trim()).filter(Boolean);

      const numPrice = Number(price);
      const numOriginal = originalPrice !== '' ? Number(originalPrice) : numPrice;
      const numStock = Number(stock);
      const numDiscount = discountPercentage || (numOriginal > numPrice ? Math.round(((numOriginal - numPrice) / numOriginal) * 100) : 0);

      const allImages = [mainImage.trim(), ...additionalImages.map(img => img.trim()).filter(Boolean)];

      const payload: Partial<Product> = {
        storeId: forcedStoreId || selectedStoreId || editingProduct?.storeId || 'main-store',
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        description: description.trim() || name.trim(),
        category: finalCategory,
        brand: finalBrand,
        price: numPrice,
        originalPrice: numOriginal,
        discountPercentage: numDiscount,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        stock: numStock,
        inStock: numStock > 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        image: mainImage.trim(),
        images: allImages,
        specifications: specificationsObject,
        features: filteredFeatures,
        warranty: warranty.trim(),
        weight: weight.trim(),
        dimensions: dimensions.trim(),
        shippingRequired,
        shippingClass,
        isPublished: publishState,
        status: publishState ? 'published' : 'draft',
        isFeatured,
        isBestSeller,
        isNewArrival,
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || shortDescription.trim() || name.trim(),
        seoSlug: seoSlug.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        barcode: barcode.trim(),
        hsnCode: hsnCode.trim(),
      };

      await onSave(payload, publishState);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Compute live stock status
  const currentStockNum = stock === '' ? 0 : Number(stock);
  const stockThresholdNum = Number(lowStockThreshold) || 5;
  const isOutOfStock = currentStockNum <= 0;
  const isLowStock = currentStockNum > 0 && currentStockNum <= stockThresholdNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                editingProduct ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </span>
              {editingProduct && (
                <span className="text-xs font-mono text-slate-400">ID: {editingProduct.id?.slice(0, 8)}...</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1 tracking-tight">
              {editingProduct ? (editingProduct.name || 'Edit Product') : 'Create Store Product'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in essential product details below. Clear, friendly inputs ready for your storefront.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Validation Notice Banner */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-bold shrink-0">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => handleFormSubmit(e, isPublished)} className="p-5 sm:p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* 1. BASIC INFORMATION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Store Ownership Assignment */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Ownership <span className="text-rose-500">*</span>
                </label>
                {forcedStoreId ? (
                  <div className="px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>Assigned to Store: <code className="font-mono text-blue-600">{forcedStoreId}</code></span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">Store Locked</span>
                  </div>
                ) : (
                  <select
                    value={selectedStoreId}
                    onChange={e => setSelectedStoreId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="main-store">{storeName} (Main Store)</option>
                    {availableStores.map(s => (
                      <option key={s.storeId} value={s.storeId}>{s.storeName} ({s.storeId})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Enter product name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">+ Enter Custom Category</option>
                </select>
                {category === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter category name"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <select
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                >
                  {existingBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="__custom__">+ Enter Custom Brand</option>
                </select>
                {brand === '__custom__' && (
                  <input
                    type="text"
                    placeholder="Enter brand name"
                    value={customBrand}
                    onChange={e => setCustomBrand(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Summary (Subtitle for cards)
                </label>
                <input 
                  type="text"
                  placeholder="Enter short summary"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Description <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Enter product description..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* 2. PRICING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Pricing</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input 
                    type="number"
                    required
                    min={1}
                    placeholder="Enter selling price"
                    value={price}
                    onChange={e => handlePriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">What customers actually pay.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Original / Compare Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input 
                    type="number"
                    min={1}
                    placeholder="Enter compare price"
                    value={originalPrice}
                    onChange={e => handleOriginalPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Crossed-out MRP reference price.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Calculated Discount
                </label>
                <div className="flex items-center gap-2 h-10 px-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Tag size={15} className="text-emerald-600" />
                  <span className="text-xs font-black text-emerald-800">
                    {discountPercentage > 0 ? `${discountPercentage}% OFF` : 'No Discount'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Auto-calculated from selling and MRP.</span>
              </div>
            </div>
          </div>

          {/* 3. INVENTORY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Inventory & Stock</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input 
                  type="text"
                  placeholder="Enter SKU"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  required
                  min={0}
                  placeholder="Enter stock quantity"
                  value={stock}
                  onChange={e => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Low Stock Alert Level
                </label>
                <input 
                  type="number"
                  min={1}
                  placeholder="Enter low stock threshold"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(Number(e.target.value) || 5)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Storefront Stock Status
                </label>
                <div className="h-9 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                    isOutOfStock
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : isLowStock
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${currentStockNum})` : `In Stock (${currentStockNum})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. IMAGES */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Product Images</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Main Image URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    required
                    placeholder="Enter main image URL"
                    value={mainImage}
                    onChange={e => setMainImage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                  {mainImage && (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={mainImage} alt="" className="max-h-full max-w-full object-contain" onError={e => e.currentTarget.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images Gallery */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Gallery Images
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    placeholder="Enter additional image URL"
                    value={newImageInput}
                    onChange={e => setNewImageInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddImage(); } }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add Image
                  </button>
                </div>

                {/* Thumbnails preview with reorder and set as main */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {additionalImages.map((imgUrl, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-xl relative group">
                        <div className="w-full h-24 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden mb-2">
                          <img src={imgUrl} alt="" className="max-h-full max-w-full object-contain" onError={e => e.currentTarget.style.display = 'none'} />
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                              title="Move left"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'down')}
                              disabled={idx === additionalImages.length - 1}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                              title="Move right"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetAsMainImage(idx)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            Set Main
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdditionalImage(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. PRODUCT DETAILS (Specs & Features without JSON) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Product Details & Specifications</h3>
            </div>

            {/* Visual Key-Value Specifications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Key Specifications Table
                </label>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Specification Row
                </button>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {specsList.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Enter specification name"
                      value={spec.key}
                      onChange={e => handleSpecChange(i, 'key', e.target.value)}
                      className="w-1/3 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text"
                      placeholder="Enter specification value"
                      value={spec.value}
                      onChange={e => handleSpecChange(i, 'value', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet Points / Key Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Key Highlight Features (Bullet points)
                </label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add Feature Bullet
                </button>
              </div>

              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {featuresList.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-blue-600 text-xs font-bold">•</span>
                    <input 
                      type="text"
                      placeholder="Enter highlight feature"
                      value={feat}
                      onChange={e => handleFeatureChange(i, e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Specs: Warranty, Weight, Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Official Warranty</label>
                <input 
                  type="text"
                  placeholder="Enter warranty details"
                  value={warranty}
                  onChange={e => setWarranty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Package Weight</label>
                <input 
                  type="text"
                  placeholder="Enter weight"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Dimensions (L x W x H)</label>
                <input 
                  type="text"
                  placeholder="Enter dimensions"
                  value={dimensions}
                  onChange={e => setDimensions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 6. SHIPPING */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                6
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Shipping Settings</h3>
            </div>

            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={shippingRequired}
                  onChange={e => setShippingRequired(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <span>Physical Delivery Required (Generates shipping label)</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-600">Shipping Class:</span>
                <select
                  value={shippingClass}
                  onChange={e => setShippingClass(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="standard">Standard Free/Paid Delivery</option>
                  <option value="express">Express Priority Delivery</option>
                  <option value="heavy">Heavy / Fragile Electronics</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7. PUBLISHING & VISIBILITY */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                7
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Storefront Publishing & Badges</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Catalog Visibility</span>
                  <span className="text-[11px] text-slate-500">
                    {isPublished ? 'Live on storefront and accessible in search' : 'Draft / Hidden from store visitors'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPublished 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>{isPublished ? 'Published' : 'Draft'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Promotional Badges</span>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isFeatured}
                      onChange={e => setIsFeatured(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={e => setIsBestSeller(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Best Seller</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={e => setIsNewArrival(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 8. ADVANCED OPTIONS (SEO, BARCODE, TECHNICAL) - COLLAPSED BY DEFAULT */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600" />
                <span>Advanced Options (Search Engine SEO, Barcode, HSN Tax Code)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px]">{showAdvancedOptions ? 'Hide' : 'Expand'}</span>
                {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showAdvancedOptions && (
              <div className="p-5 bg-white border-t border-slate-200 space-y-4">
                <p className="text-xs text-slate-500">
                  Optional technical settings used for Google search rankings and GST invoices.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SEO Meta Title</label>
                    <input 
                      type="text"
                      placeholder="Enter SEO meta title"
                      value={seoTitle}
                      onChange={e => setSeoTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug / Handle</label>
                    <input 
                      type="text"
                      placeholder="Enter URL slug"
                      value={seoSlug}
                      onChange={e => setSeoSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">SEO Meta Description</label>
                    <textarea 
                      rows={2}
                      placeholder="Enter SEO meta description"
                      value={seoDescription}
                      onChange={e => setSeoDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Barcode / EAN / UPC</label>
                    <input 
                      type="text"
                      placeholder="Enter barcode / EAN / UPC"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HSN Tax Code</label>
                    <input 
                      type="text"
                      placeholder="Enter HSN tax code"
                      value={hsnCode}
                      onChange={e => setHsnCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-xs text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="w-full sm:w-auto flex items-center gap-3">
              {/* Save as Draft Button */}
              <button 
                type="button" 
                onClick={(e) => handleFormSubmit(e as any, false)}
                disabled={saving}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>

              {/* Publish Button */}
              <button 
                type="button" 
                onClick={(e) => handleFormSubmit(e as any, true)}
                disabled={saving}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={16} />
                <span>{saving ? 'Saving...' : (editingProduct ? 'Save & Publish Live' : 'Publish Product')}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
