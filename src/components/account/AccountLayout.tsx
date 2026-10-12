import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import { AccountSidebar } from './AccountSidebar';

interface AccountLayoutProps {
  children?: React.ReactNode;
  activeView?: string;
  title?: string;
}

export function AccountLayout({ children, activeView: propsActiveView, title }: AccountLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active view from props or current URL
  const activeView = useMemo(() => {
    if (propsActiveView) return propsActiveView;
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view') || searchParams.get('tab');
    
    if (location.pathname === '/orders') return 'orders';
    if (location.pathname === '/wishlist') return 'wishlist';
    if (location.pathname === '/notifications') return 'notifications';
    if (location.pathname === '/help' || location.pathname === '/support') return 'help';
    
    if (viewParam) return viewParam;
    return 'dashboard';
  }, [propsActiveView, location.pathname, location.search]);

  // LOGGED-OUT STATE
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-220px)] bg-slate-50/60 flex flex-col justify-center items-center py-6 sm:py-10 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center my-auto">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/80 shadow-2xs">
            <User size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Account Sign In</h1>
          <p className="text-slate-500 text-xs mt-1.5 mb-6 leading-relaxed max-w-xs mx-auto">
            Please sign in to access your orders, saved delivery addresses, GST tax billing, and support requests.
          </p>
          <Link 
            to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3.5 px-5 rounded-xl font-bold text-sm transition-all inline-flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
          >
            Sign In to Account
          </Link>
          <div className="mt-4 text-xs text-slate-500 font-medium">
            Don't have an account? <Link to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="text-blue-600 font-bold hover:underline">Register now</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-7xl pt-4 pb-16 min-h-[75vh]">
      
      {/* MOBILE VIEW (< lg) */}
      <div className="block lg:hidden">
        {activeView !== 'dashboard' && (
          <div className="mb-4">
            <button
              onClick={() => navigate('/account')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 active:text-blue-600 py-2 px-3 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer min-h-[40px]"
            >
              <ArrowLeft size={15} /> Back to My Account
            </button>
          </div>
        )}
        {children}
      </div>

      {/* DESKTOP VIEW (>= lg): Two-Column Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
        {/* Left Column: Persistent Sticky Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 sticky top-24">
          <AccountSidebar activeView={activeView} />
        </div>

        {/* Right Column: Active Content */}
        <div className="lg:col-span-8 xl:col-span-9 min-w-0">
          {activeView !== 'dashboard' && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => navigate('/account')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:border-blue-200 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Account Overview
              </button>
              <span className="text-xs text-slate-400 capitalize">
                Account &rarr; {(title || activeView).replace('-', ' ')}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
