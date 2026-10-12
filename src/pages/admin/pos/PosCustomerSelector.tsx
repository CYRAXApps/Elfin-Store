import React, { useState, useEffect, useRef } from 'react';
import { User, UserPlus, Phone, Mail, Building2, Search, X, Check, ChevronDown } from 'lucide-react';
import { PosCustomer } from './types';

interface PosCustomerSelectorProps {
  customer: PosCustomer;
  onChange: (customer: PosCustomer) => void;
  sellerState?: string;
  allowWalkInBilling?: boolean;
}

export const PosCustomerSelector: React.FC<PosCustomerSelectorProps> = ({
  customer,
  onChange,
  sellerState = 'West Bengal',
  allowWalkInBilling = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'walkin' | 'search' | 'create'>(
    allowWalkInBilling ? (customer.isWalkIn ? 'walkin' : 'search') : 'search'
  );

  useEffect(() => {
    if (!allowWalkInBilling && activeTab === 'walkin') {
      setActiveTab('search');
    }
  }, [allowWalkInBilling, activeTab]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Create state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newState, setNewState] = useState(sellerState);

  const containerRef = useRef<HTMLDivElement>(null);

  // Intelligently prefill fields depending on whether query is phone, email, GSTIN, or name
  const fillCustomerFromQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Reset previous inputs to avoid cross-contamination
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewGstin('');

    // 1. Email check: contains '@' and '.'
    if (trimmed.includes('@') && trimmed.includes('.')) {
      setNewEmail(trimmed);
      return;
    }

    // 2. GSTIN check: 15-character alphanumeric format
    if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(trimmed)) {
      setNewGstin(trimmed.toUpperCase());
      return;
    }

    // 3. Phone check:
    // If it contains letters (e.g. "Riya Saha"), it is definitely a customer name!
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    const digitsOnly = trimmed.replace(/\D/g, '');

    if (!hasLetters && digitsOnly.length >= 7) {
      setNewPhone(trimmed);
      return;
    }

    // 4. Default: Name!
    setNewName(trimmed);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search effect with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/admin/pos/search-customers?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch (err) {
        console.error('Customer search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectWalkIn = () => {
    onChange({
      name: 'Walk-in Customer',
      isWalkIn: true,
      state: sellerState
    });
    setIsOpen(false);
  };

  const selectFoundCustomer = (c: any) => {
    onChange({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      gstin: c.gstin,
      address: c.address,
      city: c.city,
      state: c.state || sellerState,
      isWalkIn: false
    });
    setIsOpen(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onChange({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      gstin: newGstin.trim().toUpperCase(),
      state: newState || sellerState,
      isWalkIn: false
    });

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button / Chip */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          customer.isWalkIn 
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300' 
            : 'bg-blue-50/70 border-blue-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            customer.isWalkIn ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white shadow-sm'
          }`}>
            <User size={14} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 truncate">{customer.name}</span>
              {customer.gstin && (
                <span className="text-[9.5px] px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded">
                  B2B
                </span>
              )}
            </div>
            <span className="text-[10.5px] text-slate-500 font-mono">
              {customer.isWalkIn ? 'Quick Counter Customer' : (customer.phone || customer.email || 'Registered')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <ChevronDown size={15} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in duration-150">
          {/* Header Tabs */}
          <div className={`grid ${allowWalkInBilling ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 mb-3`}>
            {allowWalkInBilling && (
              <button
                type="button"
                onClick={() => setActiveTab('walkin')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'walkin' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Walk-in
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                if (searchQuery.trim()) {
                  fillCustomerFromQuery(searchQuery);
                }
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'hover:text-slate-900'
              }`}
            >
              + New
            </button>
          </div>

          {/* TAB 1: WALKIN */}
          {allowWalkInBilling && activeTab === 'walkin' && (
            <div className="text-center py-3 space-y-2">
              <p className="text-xs text-slate-600">
                Fast 1-click counter sale without recording customer contact details.
              </p>
              <button
                type="button"
                onClick={selectWalkIn}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Set as Walk-in Customer
              </button>
            </div>
          )}

          {/* TAB 2: SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {searching ? (
                  <div className="py-6 text-center text-xs text-slate-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => selectFoundCustomer(c)}
                      className="p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-100 flex items-center justify-between"
                    >
                      <div className="text-xs truncate">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{c.phone || c.email}</p>
                      </div>
                      <Check size={14} className="text-blue-600 shrink-0" />
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No customer found. <button type="button" onClick={() => { setActiveTab('create'); fillCustomerFromQuery(searchQuery); }} className="text-blue-600 underline font-semibold cursor-pointer">Create new?</button>
                  </div>
                ) : (
                  <div className="py-4 text-center text-[11px] text-slate-400">
                    Type 2+ characters to search customer database
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE NEW */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCustomer} className="space-y-2.5">
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="10 digit number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">GSTIN (for B2B)</label>
                  <input
                    type="text"
                    placeholder="15-digit GSTIN"
                    value={newGstin}
                    onChange={(e) => setNewGstin(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-0.5">State</label>
                  <input
                    type="text"
                    placeholder="e.g. West Bengal"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!newName.trim()}
                className="w-full mt-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Apply Customer
              </button>
            </form>
          )}

        </div>
      )}
    </div>
  );
};
