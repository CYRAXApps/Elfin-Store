import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard = memo(function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link 
      to={`/shop?category=${category.name}`}
      className="flex flex-col items-center gap-2 sm:gap-3 group min-w-[76px] sm:min-w-[120px] cursor-pointer"
    >
      <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden group-hover:shadow-lg group-hover:border-blue-400 transition-all duration-300">
        {(() => {
          const optCatImg = getOptimizedImageUrl(category.image, { width: 180, quality: 80 });
          if (optCatImg) {
            return (
              <img 
                src={optCatImg} 
                alt={category.name} 
                loading="lazy"
                decoding="async"
                width={112}
                height={112}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out p-1 sm:p-0" 
              />
            );
          }
          return <div className="w-full h-full bg-slate-100 text-slate-300 flex items-center justify-center font-bold text-xs">IMG</div>;
        })()}
      </div>
      <h3 className="font-bold text-[10px] sm:text-sm text-slate-700 text-center group-hover:text-blue-600 transition-colors leading-tight">{category.name}</h3>
    </Link>
  );
});

