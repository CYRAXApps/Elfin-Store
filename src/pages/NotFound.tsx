import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="container mx-auto px-3 sm:px-4 pt-4 pb-20 text-center max-w-xl">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-black">
          404
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-8 leading-relaxed">
          The page or product you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Home size={14} /> Back to Homepage
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <ShoppingBag size={14} /> Explore Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
