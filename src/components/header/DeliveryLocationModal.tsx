import React, { useState, useEffect } from 'react';
import { MapPin, X, Check, Truck, Zap, Building, Sparkles } from 'lucide-react';
import { useLocation as useHyperlocalLocation } from '../../context/LocationContext';

interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPincode: string;
  currentCity: string;
  onSaveLocation: (pincode: string, city: string) => void;
}

const POPULAR_LOCATIONS = [
  { city: 'Bengaluru', pincode: '560001', state: 'Karnataka', eta: 'Express in 2 hours' },
  { city: 'Mumbai', pincode: '400001', state: 'Maharashtra', eta: 'Same-day Delivery' },
  { city: 'New Delhi', pincode: '110001', state: 'Delhi', eta: 'Same-day Delivery' },
  { city: 'Hyderabad', pincode: '500001', state: 'Telangana', eta: 'Next-day by 12 PM' },
  { city: 'Chennai', pincode: '600001', state: 'Tamil Nadu', eta: 'Next-day Delivery' },
  { city: 'Pune', pincode: '411001', state: 'Maharashtra', eta: 'Express in 4 hours' },
  { city: 'Kolkata', pincode: '700001', state: 'West Bengal', eta: 'Next-day Delivery' },
  { city: 'Ahmedabad', pincode: '380001', state: 'Gujarat', eta: 'Next-day Delivery' },
];

export function DeliveryLocationModal({
  isOpen,
  onClose,
  currentPincode,
  currentCity,
  onSaveLocation,
}: DeliveryLocationModalProps) {
  const { selectPincode } = useHyperlocalLocation();
  const [pinInput, setPinInput] = useState(currentPincode || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPinInput(currentPincode || '');
      setError('');
    }
  }, [isOpen, currentPincode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);
    setError('');

    // Match popular locations or auto-determine city
    const found = POPULAR_LOCATIONS.find((loc) => loc.pincode === clean);
    const resolvedCity = found ? found.city : currentCity || 'Metro Delivery Hub';

    setTimeout(() => {
      setLoading(false);
      selectPincode(clean, resolvedCity);
      onSaveLocation(clean, resolvedCity);
      onClose();
    }, 250);
  };

  const handleSelectPopular = (loc: typeof POPULAR_LOCATIONS[0]) => {
    selectPincode(loc.pincode, loc.city);
    onSaveLocation(loc.pincode, loc.city);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Choose Delivery Location</h3>
              <p className="text-[11px] text-slate-500">Check product availability & fastest delivery speed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close delivery modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* PIN input form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Enter a 6-digit Postal PIN code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    if (error) setError('');
                  }}
                  placeholder="e.g. 560001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                  autoFocus
                />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="submit"
                disabled={loading || pinInput.length !== 6}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </form>

          {/* Current Selection Status */}
          {currentPincode && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <div className="truncate">
                  <span className="font-bold text-slate-900 block truncate">
                    Currently delivering to {currentCity || 'Selected Region'} ({currentPincode})
                  </span>
                  <span className="text-[11px] text-blue-700 flex items-center gap-1 font-medium">
                    <Zap size={11} className="fill-current" /> Express & Next-Day Delivery Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Select Popular Cities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Popular Cities
              </span>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Truck size={12} className="text-emerald-600" /> Fast Dispatch
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {POPULAR_LOCATIONS.map((loc) => {
                const isSelected = currentPincode === loc.pincode;
                return (
                  <button
                    key={loc.pincode}
                    type="button"
                    onClick={() => handleSelectPopular(loc)}
                    className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">{loc.city}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-medium">{loc.pincode}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <Zap size={10} className="fill-current text-amber-500" /> {loc.eta}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" /> Free delivery on all orders over ₹500
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
