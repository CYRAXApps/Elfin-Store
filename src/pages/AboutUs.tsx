import React from 'react';
import { ShieldCheck, Truck, Clock, Award, Users, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function AboutUs() {
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ELECTRO STORE';

  return (
    <div className="container mx-auto px-3 sm:px-4 max-w-6xl pt-4 pb-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
          About {storeName}
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
          Pioneering the Future of Smart Consumer Electronics
        </h1>
        <p className="text-slate-500 text-sm sm:text-base mt-4 leading-relaxed">
          Founded with a mission to bring genuine, cutting-edge technology to your fingertips with uncompromised quality, certified brand warranties, and lightning-fast fulfillment.
        </p>
      </div>

      {/* Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Award size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">100% Authentic Products</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct partnerships with top global manufacturers ensure every smartphone, audio device, and PC comes with full manufacturer warranty and GST tax invoices.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Truck size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Express Insured Delivery</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our nationwide logistics network provides real-time carrier tracking, secure packaging, and free delivery on eligible orders above ₹500.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-start">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Secure Transactions</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            256-bit SSL encrypted checkout powered by Razorpay supporting instant UPI, cards, NetBanking, and automated verified order processing.
          </p>
        </div>
      </div>

      {/* Story & Commitment */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-16">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Our Commitment</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 mb-4">Crafted for Tech Enthusiasts, by Tech Enthusiasts</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            From flagship smartphones and ultra-thin laptops to studio headphones and smart home gear, our catalogue is handpicked and constantly refreshed to bring you the best value and performance.
          </p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs transition-colors">
            Explore Full Catalogue <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
