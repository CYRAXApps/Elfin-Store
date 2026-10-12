import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { POPULAR_COUNTRY_CODES, CountryDialCode } from '../data/countryDialCodes';

interface CountryCodeSelectorProps {
  selectedCountry: CountryDialCode;
  onSelectCountry: (country: CountryDialCode) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  disabled = false,
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = POPULAR_COUNTRY_CODES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  if (disabled) {
    return (
      <div
        className={`px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg shrink-0 border border-slate-200 flex items-center gap-1.5 select-none ${buttonClassName} ${className}`}
        title={`Fixed Country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        <CountryFlag code={selectedCountry.code} className="w-4 h-3 shadow-2xs" />
        <span className="font-bold text-slate-800 tracking-tight">{selectedCountry.dialCode}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 rounded-lg shrink-0 border border-slate-200 flex items-center gap-1.5 transition-all select-none cursor-pointer ${buttonClassName}`}
        title={`Country code: ${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        <CountryFlag code={selectedCountry.code} className="w-4 h-3 shadow-2xs" />
        <span className="font-bold text-slate-800 tracking-tight">{selectedCountry.dialCode}</span>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 max-h-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-y-auto flex-1 p-1 divide-y divide-slate-50">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching countries found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code && country.dialCode === selectedCountry.dialCode;
                return (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => {
                      onSelectCountry(country);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CountryFlag code={country.code} className="w-4 h-3 shrink-0 shadow-2xs" />
                      <span className="truncate">{country.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold text-slate-500">{country.dialCode}</span>
                      {isSelected && <Check size={13} className="text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
