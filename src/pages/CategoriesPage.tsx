import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { Grid, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export function CategoriesPage() {
  const { categories } = useCategories();
  const { products } = useProducts();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const displayCategories = useMemo(() => {
    const list: { id: string; name: string; image: string; products: any[] }[] = [];
    const dbCategories = (categories || []).filter(c => c.active !== false);
    
    // Categorize products by db categories
    const productsByCategory: Record<string, any[]> = {};
    products.forEach(p => {
        if (p.category) {
            if (!productsByCategory[p.category]) productsByCategory[p.category] = [];
            productsByCategory[p.category].push(p);
        }
    });

    if (dbCategories.length > 0) {
      dbCategories.forEach(c => {
        list.push({
          id: c.id,
          name: c.name,
          image: c.image || '',
          products: productsByCategory[c.name] || []
        });
      });
    } else {
        Object.keys(productsByCategory).forEach(catName => {
            list.push({
                id: catName.toLowerCase().replace(/\s+/g, '-'),
                name: catName,
                image: productsByCategory[catName][0]?.thumbnail || productsByCategory[catName][0]?.image || '',
                products: productsByCategory[catName]
            });
        });
    }
    return list;
  }, [categories, products]);

  const selectedCategory = useMemo(() => 
    displayCategories.find(c => c.id === selectedCategoryId) || displayCategories[0],
    [displayCategories, selectedCategoryId]
  );

  if (displayCategories.length === 0) return <div className="p-8 text-center text-slate-500">No categories available.</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-160px)] flex gap-6">
      {/* Left Sidebar */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-y-auto">
        {displayCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`w-full flex items-center gap-4 p-4 text-left border-b border-slate-50 transition-colors ${
              selectedCategory.id === cat.id ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-600' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                {cat.image ? <img src={getOptimizedImageUrl(cat.image, {width: 100})} alt={cat.name} className="w-full h-full object-cover"/> : <Grid size={24} className="m-auto mt-3 text-slate-400"/>}
            </div>
            <span className="flex-1 text-sm">{cat.name}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="w-2/3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto">
        <h2 className="text-2xl font-black text-slate-900 mb-6">{selectedCategory.name}</h2>
        <div className="grid grid-cols-3 gap-4">
            {selectedCategory.products.slice(0, 9).map(prod => (
                <Link key={prod.id} to={`/product/${prod.id}`} className="group space-y-2">
                    <div className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                        <img src={getOptimizedImageUrl(prod.thumbnail || prod.image, {width: 300})} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 text-center line-clamp-1">{prod.name}</p>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
