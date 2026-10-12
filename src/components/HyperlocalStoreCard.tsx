import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, MapPin, Clock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { StoreInfo } from '../types';

interface HyperlocalStoreCardProps {
  key?: React.Key;
  store: StoreInfo & { distanceKm?: number; deliveryMinutes?: number };
}

export function HyperlocalStoreCard({ store }: HyperlocalStoreCardProps) {
  const storeId = store.storeId || 'main-store';
  const isMain = storeId === 'main-store';
  const distance = store.distanceKm || (isMain ? 1.2 : 2.4);
  const deliveryMins = store.deliveryMinutes || Math.max(15, Math.round(distance * 12));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden shadow-2xs">
      {/* Top Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

      <div>
        {/* Header: Store Avatar & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0 group-hover:scale-105 transition-transform">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                store.storeName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified Seller
                </span>
                {isMain && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-full">
                    Flagship Hub
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-1">
                {store.storeName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-1 rounded-xl shrink-0">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-amber-800">4.9</span>
          </div>
        </div>

        {/* Description / Address */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {store.description || 'Certified consumer electronics, express delivery fulfillment & warranty support.'}
        </p>

        {/* Metrics Pill Grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <Clock size={13} className="text-blue-600 shrink-0" />
            <span>⚡ {deliveryMins} Mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
            <MapPin size={13} className="text-emerald-600 shrink-0" />
            <span>{distance} km away</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <Link
        to={`/store/${storeId}`}
        className="w-full py-2.5 px-4 bg-slate-900 group-hover:bg-blue-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
      >
        <span>Browse Store Products</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
