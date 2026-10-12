import React, { useState } from 'react';
import { Building2, Store, ArrowRight, ShieldCheck, TrendingUp, Truck, Package, CheckCircle2, Award, Users, PhoneCall, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export function PartnerProgramSubView() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || settings.branding?.brandName || 'ELECTRO STORE';
  const [submitted, setSubmitted] = useState(false);
  const [inquiryStoreName, setInquiryStoreName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryStoreName || !phone) return;
    setSubmitting(true);
    // Simulate swift submission & save interest
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3 border border-white/10">
            <Sparkles size={14} className="text-amber-400" />
            <span>Authorized Partner & Retail Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Grow Your Electronics Retail with {storeName}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Join our nationwide network of verified stores, local fulfillment hubs, and official brand partners. Sync inventory in real-time, fulfill local orders, and boost your sales.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/partner/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-98"
            >
              <Store size={16} /> Partner Portal Login
            </Link>
            <a
              href="#apply-partner"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border border-white/20 backdrop-blur-md"
            >
              Apply for Partnership <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>

      {/* Value Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Truck size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Local Hyper-Dispatch</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fulfill orders placed in your city or region with same-day and express dispatch capabilities.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Guaranteed Wholesale Rates</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Direct brand procurement with authentic manufacturer warranties and structured margins.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <ShieldCheck size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Automated Multi-Store ERP</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Real-time stock syncing, automated GST invoicing, barcode scanning, and staff role management.
          </p>
        </div>
      </div>

      {/* Partner Application Form & Direct Access */}
      <div id="apply-partner" className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Left Form: Apply */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Apply for Franchise / Partner Store
              </h2>
              <p className="text-xs text-slate-400">Our commercial onboarding team reviews applications within 24 hours.</p>
            </div>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-emerald-900">Application Received!</h3>
              <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                Thank you, <b>{storeName}</b>. Our Partner Success Manager will reach out to you at <b>{phone}</b> with onboarding details.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs font-bold text-emerald-800 underline hover:text-emerald-900 cursor-pointer"
              >
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Store / Business Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryStoreName}
                    onChange={(e) => setInquiryStoreName(e.target.value)}
                    placeholder="e.g. Apex Tech Solutions"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    City / Operating Region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Bangalore, Delhi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || ''}
                    placeholder="partner@business.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Submit Partnership Application'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Info Box: Partner Portal Link */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-xs border border-slate-700">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Store size={15} /> Existing Partners
            </div>
            <h3 className="text-base font-bold text-white mb-1">Partner Portal Login</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Already an authorized store manager or owner? Access your dedicated inventory management, order dispatch, and earnings analytics panel.
            </p>
            <Link
              to="/partner/login"
              className="w-full py-2.5 px-4 bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              Open Partner Portal <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PhoneCall size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">Partner Helpdesk</p>
              <p className="text-[11px] text-slate-500">Reach out directly via the Partner Portal or Support section.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
