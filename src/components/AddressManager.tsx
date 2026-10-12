import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { 
  Plus, 
  MapPin, 
  Home, 
  Briefcase, 
  Building,
  Check, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  X, 
  Phone, 
  User, 
  Star,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Address } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  INDIAN_STATES, 
  lookupPincode, 
  isValidPincode 
} from '../services/pincodeService';
import { PincodeDisplay } from './common/PincodeDisplay';

interface AddressManagerProps {
  userId: string;
  selectedAddressId?: string;
  onSelectAddress?: (address: Address) => void;
  selectable?: boolean;
  showHeader?: boolean;
  compactCheckoutMode?: boolean;
  onAddressesLoaded?: (addresses: Address[]) => void;
}

export function AddressManager({ 
  userId, 
  selectedAddressId, 
  onSelectAddress, 
  selectable = false,
  showHeader = true,
  compactCheckoutMode = false,
  onAddressesLoaded
}: AddressManagerProps) {
  const { getIdToken } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // PIN Code Auto-Fill State & Race Condition Prevention
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [pincodeMessage, setPincodeMessage] = useState('');
  const lookupSeqRef = useRef<number>(0);
  const lastFetchedPinRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchDebounceRef = useRef<any>(null);

  const [formState, setFormState] = useState<Partial<Address>>({
    fullName: '',
    phone: '',
    street: '',
    addressLine2: '',
    locality: '',
    postOffice: '',
    city: '',
    district: '',
    state: 'Karnataka',
    zipCode: '',
    postalCode: '',
    country: 'India',
    addressType: 'home',
    isDefault: false
  });

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', userId, 'addresses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Address[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          zipCode: data.zipCode || data.postalCode || (data as any).pincode || '',
          postalCode: data.postalCode || data.zipCode || (data as any).pincode || '',
        } as unknown as Address;
      });

      // Sort: Default address first, then others
      list.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });

      setAddresses(list);
      if (onAddressesLoaded) {
        onAddressesLoaded(list);
      }

      // In selectable mode (checkout), auto-select default or first address if nothing selected
      if (selectable && onSelectAddress && list.length > 0) {
        if (!selectedAddressId || !list.some(a => a.id === selectedAddressId)) {
          const defaultAddr = list.find(a => a.isDefault) || list[0];
          onSelectAddress(defaultAddr);
        } else {
          const current = list.find(a => a.id === selectedAddressId);
          if (current) {
            onSelectAddress(current);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.warn("Notice fetching addresses via snapshot, fetching via API:", error);
      getIdToken().then(token => {
        fetch('/api/user/addresses', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
          .then(r => r.json())
          .then(data => {
            if (data?.success && Array.isArray(data.addresses)) {
              setAddresses(data.addresses);
              if (onAddressesLoaded) onAddressesLoaded(data.addresses);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }).catch(() => setLoading(false));
    });

    return () => unsubscribe();
  }, [userId, selectable, selectedAddressId]);

  const openAddModal = () => {
    // Reset sequence and controllers
    lookupSeqRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    lastFetchedPinRef.current = '';

    setEditingAddress(null);
    setFormState({
      fullName: '',
      phone: '',
      street: '',
      addressLine2: '',
      locality: '',
      postOffice: '',
      city: '',
      district: '',
      state: 'Karnataka',
      zipCode: '',
      postalCode: '',
      country: 'India',
      addressType: 'home',
      isDefault: addresses.length === 0
    });
    setPincodeStatus('idle');
    setPincodeMessage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    lookupSeqRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setEditingAddress(addr);
    const pin = addr.zipCode || addr.postalCode || '';
    lastFetchedPinRef.current = pin;

    setFormState({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      street: addr.street || '',
      addressLine2: addr.addressLine2 || addr.locality || '',
      locality: addr.locality || addr.addressLine2 || '',
      postOffice: addr.postOffice || '',
      city: addr.city || '',
      district: addr.district || '',
      state: addr.state || 'Karnataka',
      zipCode: pin,
      postalCode: pin,
      country: addr.country || 'India',
      addressType: addr.addressType || 'home',
      isDefault: Boolean(addr.isDefault)
    });
    setPincodeStatus('idle');
    setPincodeMessage('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Perform PIN-code lookup with monotonic sequence ID and cancellation
  const fetchLocationByPincode = async (pin: string) => {
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6 || !isValidPincode(cleanPin)) {
      setPincodeStatus('error');
      setPincodeMessage('PIN code not found. Please check the PIN code.');
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentSeq = ++lookupSeqRef.current;
    setPincodeStatus('fetching');
    setPincodeMessage('Looking up address details...');

    try {
      const res = await lookupPincode(cleanPin, controller.signal);

      // Race condition check: only process if this is still the latest request
      if (currentSeq !== lookupSeqRef.current) {
        return;
      }

      if (res.success && res.state) {
        lastFetchedPinRef.current = cleanPin;
        setPincodeStatus('success');
        const districtCity = res.district || res.city || '';
        setPincodeMessage(`Auto-filled: ${districtCity}, ${res.state}`);

        setFormState(prev => ({
          ...prev,
          state: res.state || prev.state || 'Karnataka',
          city: districtCity,
          district: res.district || districtCity
        }));
      } else if (res.notFound) {
        setPincodeStatus('error');
        setPincodeMessage('PIN code not found. Please check the PIN code.');
      } else {
        setPincodeStatus('error');
        setPincodeMessage(res.error || 'Unable to fetch address. Please enter the address manually.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      if (currentSeq === lookupSeqRef.current) {
        setPincodeStatus('error');
        setPincodeMessage('Unable to fetch address. Please enter the address manually.');
      }
    }
  };

  // Handle PIN input change
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormState(prev => ({ 
      ...prev, 
      zipCode: rawVal, 
      postalCode: rawVal
    }));
    if (formError) setFormError('');

    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    if (rawVal.length < 6) {
      setPincodeStatus('idle');
      setPincodeMessage('');
      return;
    }

    // Exactly 6 digits: trigger lookup immediately (or with very slight debounce)
    if (rawVal.length === 6 && isValidPincode(rawVal)) {
      fetchDebounceRef.current = setTimeout(() => {
        fetchLocationByPincode(rawVal);
      }, 150);
    } else {
      setPincodeStatus('error');
      setPincodeMessage('PIN code must be 6 digits and start with 1-9.');
    }
  };

  // Handle PIN input onBlur
  const handlePinBlur = () => {
    const cleanPin = (formState.zipCode || '').trim().replace(/\D/g, '');
    if (cleanPin.length === 6 && isValidPincode(cleanPin) && lastFetchedPinRef.current !== cleanPin && pincodeStatus !== 'fetching') {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
      fetchLocationByPincode(cleanPin);
    }
  };

  const validate = (): string => {
    const fullName = formState.fullName?.trim() || '';
    if (!fullName) return "Full Name is required.";
    if (fullName.length < 2) return "Full Name must be at least 2 characters.";

    const rawPhone = (formState.phone || '').trim().replace(/[\s-]/g, '');
    const cleanPhone = rawPhone.replace(/^\+91|^0/, '');
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      return "Please enter a valid 10-digit mobile number.";
    }

    const cleanPin = (formState.zipCode || '').trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return "Please enter a valid 6-digit PIN code.";
    }

    if (!formState.street?.trim()) {
      return "Flat, House no. is required.";
    }

    if (!formState.addressLine2?.trim() && !formState.locality?.trim()) {
      return "Apartment, Area, Sector, Village is required.";
    }

    if (!formState.city?.trim()) {
      return "City is required.";
    }

    if (!formState.state?.trim()) {
      return "Please select your State.";
    }

    return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const rawPhone = (formState.phone || '').trim().replace(/[\s-]/g, '');
      const cleanPhone = rawPhone.replace(/^\+91|^0/, '');
      const cleanPin = (formState.zipCode || '').trim().replace(/\D/g, '');
      const willBeDefault = Boolean(formState.isDefault) || addresses.length === 0;

      const addressPayload = {
        fullName: formState.fullName!.trim(),
        phone: cleanPhone,
        street: formState.street!.trim(),
        addressLine2: (formState.addressLine2 || formState.locality || '').trim(),
        locality: (formState.locality || formState.addressLine2 || '').trim(),
        postOffice: formState.postOffice?.trim() || '',
        city: formState.city!.trim(),
        district: formState.district?.trim() || '',
        state: formState.state!.trim(),
        zipCode: cleanPin,
        postalCode: cleanPin,
        country: 'India',
        addressType: formState.addressType || 'home',
        isDefault: willBeDefault,
        updatedAt: serverTimestamp()
      };

      let savedViaFirestore = false;
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          if (willBeDefault) {
            const batch = writeBatch(db);
            addresses.forEach(a => {
              if (a.id && (!editingAddress || a.id !== editingAddress.id)) {
                batch.update(doc(db, 'users', userId, 'addresses', a.id), { isDefault: false });
              }
            });
            await batch.commit();
          }

          if (editingAddress?.id) {
            await updateDoc(doc(db, 'users', userId, 'addresses', editingAddress.id), {
              ...addressPayload,
              updatedAt: serverTimestamp()
            });
            if (onSelectAddress && selectable && selectedAddressId === editingAddress.id) {
              onSelectAddress({ id: editingAddress.id, ...addressPayload } as Address);
            }
          } else {
            const newRef = await addDoc(collection(db, 'users', userId, 'addresses'), {
              ...addressPayload,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            if (onSelectAddress && selectable) {
              onSelectAddress({ id: newRef.id, ...addressPayload } as Address);
            }
          }
          savedViaFirestore = true;
        } catch (directErr: any) {
          console.warn('Direct Firestore save attempt failed, using authenticated API route:', directErr?.message || directErr);
        }
      }

      if (!savedViaFirestore) {
        const token = await getIdToken();
        const authToken = token || (userId ? `local-token-${userId}` : null);
        const endpoint = editingAddress?.id ? `/api/user/addresses/${editingAddress.id}` : '/api/user/addresses';
        const method = editingAddress?.id ? 'PUT' : 'POST';

        // Prepare clean plain-JSON payload without Sentinel objects
        const cleanPayload = {
          fullName: addressPayload.fullName,
          phone: addressPayload.phone,
          street: addressPayload.street,
          addressLine2: addressPayload.addressLine2,
          locality: addressPayload.locality,
          postOffice: addressPayload.postOffice,
          city: addressPayload.city,
          district: addressPayload.district,
          state: addressPayload.state,
          zipCode: addressPayload.zipCode,
          postalCode: addressPayload.postalCode,
          country: addressPayload.country,
          addressType: addressPayload.addressType,
          isDefault: willBeDefault
        };

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(cleanPayload)
        });

        const resData = await res.json().catch(() => null);
        if (!res.ok || !resData?.success) {
          throw new Error(resData?.error || 'Failed to save address. Please try again.');
        }

        const savedId = resData.id || editingAddress?.id;
        if (onSelectAddress && selectable && savedId) {
          onSelectAddress({ id: savedId, ...addressPayload } as Address);
        }

        // Refresh addresses list
        fetch('/api/user/addresses', {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        })
          .then(r => r.json())
          .then(data => {
            if (data?.success && Array.isArray(data.addresses)) {
              setAddresses(data.addresses);
              if (onAddressesLoaded) onAddressesLoaded(data.addresses);
            }
          })
          .catch(() => {});
      }

      setIsModalOpen(false);
      setEditingAddress(null);
    } catch (err: any) {
      console.error("Error saving address:", err);
      let msg = err.message || "Failed to save address. Please check your connection.";
      if (msg.includes('PERMISSION_DENIED') || msg.includes('permissions')) {
        msg = "Unable to save address directly. Please check your login session and try again.";
      }
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr: Address, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!userId || !addr.id || addr.isDefault) return;

    setSettingDefaultId(addr.id);

    setAddresses(prev => {
      const updated = prev.map(a => ({
        ...a,
        isDefault: a.id === addr.id
      }));
      updated.sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0));
      return updated;
    });

    try {
      let updatedViaClient = false;
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          const batch = writeBatch(db);
          addresses.forEach(a => {
            if (a.id) {
              const ref = doc(db, 'users', userId, 'addresses', a.id);
              batch.update(ref, { isDefault: a.id === addr.id });
            }
          });
          await batch.commit();
          updatedViaClient = true;
        } catch (directErr) {
          console.warn("Direct set default address failed, using API:", directErr);
        }
      }

      if (!updatedViaClient) {
        const token = await getIdToken();
        const authToken = token || (userId ? `local-token-${userId}` : null);
        await fetch(`/api/user/addresses/${addr.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({ isDefault: true })
        });
      }

      if (onSelectAddress && selectable) {
        onSelectAddress({ ...addr, isDefault: true });
      }
    } catch (err: any) {
      console.error("Error setting default address:", err);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const promptDelete = (addr: Address, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddressToDelete(addr);
  };

  const confirmDeleteAddress = async () => {
    if (!userId || !addressToDelete?.id) return;
    setDeleting(true);
    const deletedId = addressToDelete.id;
    const wasDefault = addressToDelete.isDefault;

    try {
      let deletedViaClient = false;
      if (auth.currentUser && auth.currentUser.uid === userId) {
        try {
          await deleteDoc(doc(db, 'users', userId, 'addresses', deletedId));
          deletedViaClient = true;
        } catch {}
      }

      const token = await getIdToken();
      const authToken = token || (userId ? `local-token-${userId}` : null);

      if (!deletedViaClient) {
        await fetch(`/api/user/addresses/${deletedId}`, {
          method: 'DELETE',
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
      }

      const remaining = addresses.filter(a => a.id !== deletedId);

      if (wasDefault && remaining.length > 0) {
        const nextDefault = remaining[0];
        if (nextDefault.id) {
          if (auth.currentUser && auth.currentUser.uid === userId) {
            try {
              await updateDoc(doc(db, 'users', userId, 'addresses', nextDefault.id), { isDefault: true });
            } catch {}
          }
          await fetch(`/api/user/addresses/${nextDefault.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify({ isDefault: true })
          });

          if (onSelectAddress && selectable) {
            onSelectAddress({ ...nextDefault, isDefault: true });
          }
        }
      } else if (selectable && selectedAddressId === deletedId && onSelectAddress) {
        if (remaining.length > 0) {
          onSelectAddress(remaining[0]);
        }
      }

      setAddressToDelete(null);
    } catch (err: any) {
      console.error("Error deleting address:", err);
      alert("Failed to delete address. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const getAddressTypeIcon = (type?: string) => {
    switch (type) {
      case 'work':
        return <Briefcase size={12} className="text-indigo-600" />;
      case 'other':
        return <Building size={12} className="text-amber-600" />;
      case 'home':
      default:
        return <Home size={12} className="text-blue-600" />;
    }
  };

  const getAddressTypeLabel = (type?: string, customType?: string) => {
    if (type === 'other') return customType || 'Other';
    switch (type) {
      case 'work':
        return 'Work';
      case 'home':
      default:
        return 'Home';
    }
  };

  const containerClasses = selectable
    ? "space-y-3"
    : "bg-white shadow-xs border border-slate-200/80 p-4 sm:p-5 transition-all space-y-4";

  if (loading) {
    return (
      <div className={containerClasses} style={selectable ? undefined : { borderRadius: '12px' }}>
        <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <span>Loading saved addresses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} style={selectable ? undefined : { borderRadius: '12px' }}>
      {/* COMPACT CHECKOUT MODE */}
      {compactCheckoutMode ? (
        <div>
          {addresses.length === 0 ? (
            <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50 space-y-2">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <MapPin size={18} />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No addresses saved yet</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add a delivery address to complete your order.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={13} /> Add New Address
              </button>
            </div>
          ) : isSelectorOpen ? (
            /* ADDRESS SELECTOR LIST */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Select Delivery Address ({addresses.length})</span>
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(false)}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        if (onSelectAddress) onSelectAddress(addr);
                        setIsSelectorOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{addr.fullName}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {getAddressTypeLabel(addr.addressType, addr.customAddressType)}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {addr.formattedAddress || addr.address || `${addr.street || ''}${addr.locality ? `, ${addr.locality}` : ''}, ${addr.city}`}
                        </p>
                        <p className="font-mono text-slate-800 font-medium">{addr.state} - <strong className="font-mono">{addr.zipCode || addr.postalCode}</strong></p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-2xs' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Plus size={13} /> + Add New Address
                </button>
              </div>
            </div>
          ) : (
            /* COMPACT SELECTED ADDRESS CARD */
            (() => {
              const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0];
              return (
                <div className="rounded-xl p-3.5 border border-blue-500/80 bg-blue-50/20 transition-all flex flex-col justify-between">
                  <div>
                    {/* TOP ROW: Badge + Default + Selected Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
                          {getAddressTypeIcon(activeAddress.addressType)}
                          <span>{getAddressTypeLabel(activeAddress.addressType, activeAddress.customAddressType)}</span>
                        </span>
                        {activeAddress.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            Default Address
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        <Check size={12} strokeWidth={2.5} /> Selected
                      </span>
                    </div>

                    {/* CUSTOMER NAME & PHONE */}
                    <div className="mb-1.5 flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{activeAddress.fullName}</span>
                      <span className="text-xs text-slate-600 font-mono font-medium">+91 {activeAddress.phone}</span>
                    </div>

                    {/* ADDRESS DETAILS */}
                    <div className="text-xs text-slate-700 leading-relaxed space-y-0.5">
                      {activeAddress.formattedAddress ? (
                        <p className="font-medium text-slate-800 leading-relaxed">{activeAddress.formattedAddress}</p>
                      ) : (
                        <>
                          <p className="font-medium text-slate-800">{activeAddress.street}</p>
                          {(activeAddress.addressLine2 || activeAddress.locality) && (
                            <p>{activeAddress.addressLine2 || activeAddress.locality}</p>
                          )}
                          <p className="font-medium text-slate-800 pt-0.5">
                            {activeAddress.city}, {activeAddress.state} - <span className="font-mono font-bold text-slate-900">{activeAddress.zipCode || activeAddress.postalCode}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS: Change / Edit / Delete / + Add New */}
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsSelectorOpen(true)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          Change
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        <Plus size={13} /> Add New Address
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={(e) => openEditModal(activeAddress, e)}
                        className="text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => promptDelete(activeAddress, e)}
                        className="text-slate-500 hover:text-rose-600 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ) : (
        <>
      {/* SECTION HEADER (Full header when showHeader is true) */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin size={18} className="text-blue-600 shrink-0" />
                {selectable ? 'Select Delivery Address' : 'My Addresses'}
              </h2>
              {addresses.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {selectable 
                ? 'Choose where you want your items delivered or add a new shipping address.'
                : 'Manage your delivery destinations, set a default address, and update details.'}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Add New Address</span>
          </button>
        </div>
      )}

      {/* COMPACT TOP BAR when showHeader is false */}
      {!showHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Saved Destinations</span>
            {addresses.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <Plus size={13} />
            <span>Add New Address</span>
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {addresses.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center max-w-md mx-auto my-2">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <MapPin size={26} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No addresses saved yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
            Save your home or work address for faster checkout and accurate delivery updates.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} /> Add New Address
          </button>
        </div>
      ) : (
        /* ADDRESS CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {addresses.map((addr) => {
            const isSelected = selectable && selectedAddressId === addr.id;
            const isDefault = Boolean(addr.isDefault);
            const isSettingDefault = settingDefaultId === addr.id;

            return (
              <div
                key={addr.id}
                onClick={() => {
                  if (selectable && onSelectAddress) {
                    onSelectAddress(addr);
                  }
                }}
                className={`relative rounded-2xl p-4 sm:p-4.5 border transition-all flex flex-col justify-between ${
                  selectable ? 'cursor-pointer' : ''
                } ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs'
                    : isDefault
                    ? 'border-emerald-300/80 bg-white hover:border-emerald-400 shadow-2xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  {/* TOP ROW: Address Type Badge & Default Status & Select Radio */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/60">
                        {getAddressTypeIcon(addr.addressType)}
                        <span>{getAddressTypeLabel(addr.addressType, addr.customAddressType)}</span>
                      </span>

                      {isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          Default Address
                        </span>
                      )}
                    </div>

                    {selectable && (
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                            ? 'border-blue-600 bg-blue-600 text-white shadow-2xs' 
                            : 'border-slate-300 bg-white hover:border-slate-400'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    )}
                  </div>

                  {/* CUSTOMER NAME & PHONE */}
                  <div className="space-y-0.5 mb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span>{addr.fullName}</span>
                    </h3>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-800">+91 {addr.phone}</span>
                    </p>
                  </div>

                  {/* ADDRESS DETAILS */}
                  <div className="text-xs text-slate-700 space-y-1 py-1 border-t border-slate-100 leading-relaxed">
                    {addr.formattedAddress ? (
                      <p className="font-medium text-slate-900 leading-relaxed">
                        {addr.formattedAddress}
                      </p>
                    ) : (
                      <>
                        <p className="font-medium text-slate-900">
                          {addr.street}
                        </p>
                        {(addr.addressLine2 || addr.locality) && (
                          <p className="text-slate-700">
                            {addr.addressLine2 || addr.locality}
                          </p>
                        )}
                        <p className="font-medium text-slate-800 pt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{addr.city}</span>
                          <span>, {addr.state} -</span>
                          <PincodeDisplay pincode={addr.zipCode || addr.postalCode} badge />
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* CARD ACTIONS: Set as Default | Edit | Delete */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs gap-2">
                  <div>
                    {!isDefault ? (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(addr, e)}
                        disabled={isSettingDefault}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-blue-200/50 disabled:opacity-50"
                      >
                        <Star size={11} />
                        <span>{isSettingDefault ? 'Setting...' : 'Set as Default'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <Check size={12} /> Primary Destination
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(addr, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Edit this address"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => promptDelete(addr, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Delete this address"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {addressToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 border border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Address?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove the address for{' '}
              <strong className="text-slate-800 font-semibold">{addressToDelete.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="pt-2 flex items-center gap-2 justify-center">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAddress}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ADDRESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border-t sm:border border-slate-200 overflow-hidden max-h-[88dvh] sm:max-h-[85vh] h-auto flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Grab / Drag Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {editingAddress ? 'Update your shipping details' : 'Enter your shipping and delivery details'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingAddress(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain text-xs flex-1 min-h-0">
                {/* Validation Alert */}
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium animate-in fade-in duration-150 text-xs">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. CUSTOMER INFORMATION */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <User size={14} className="text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">Customer Information</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                    {/* Full Name */}
                    <div className="col-span-1">
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.fullName || ''}
                        onChange={(e) => {
                          setFormState({ ...formState, fullName: e.target.value });
                          if (formError) setFormError('');
                        }}
                        placeholder="Enter full name"
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs outline-none focus:border-blue-600 bg-white shadow-2xs"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div className="col-span-1">
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs font-bold">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={formState.phone || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormState({ ...formState, phone: val });
                            if (formError) setFormError('');
                          }}
                          placeholder="Enter mobile number"
                          className="w-full pl-11 pr-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs font-mono outline-none focus:border-blue-600 bg-white shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SHIPPING ADDRESS */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <MapPin size={14} className="text-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">Shipping Address</h4>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      PIN Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formState.zipCode || ''}
                        onChange={handlePinChange}
                        onBlur={handlePinBlur}
                        placeholder="Enter pincode"
                        className="w-full px-3 py-2.5 sm:py-2 pr-9 border border-slate-300 rounded-xl text-sm sm:text-xs font-mono font-bold tracking-wider outline-none focus:border-blue-600 bg-white shadow-2xs"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {pincodeStatus === 'fetching' && (
                          <Loader2 size={15} className="animate-spin text-blue-600" />
                        )}
                        {pincodeStatus === 'success' && (
                          <CheckCircle2 size={15} className="text-emerald-600" />
                        )}
                        {pincodeStatus === 'error' && (
                          <AlertCircle size={15} className="text-amber-500" />
                        )}
                      </div>
                    </div>
                    {pincodeMessage && (
                      <p className={`text-[11px] mt-1 font-medium ${
                        pincodeStatus === 'fetching'
                          ? 'text-blue-600'
                          : pincodeStatus === 'success'
                          ? 'text-emerald-700'
                          : pincodeStatus === 'error'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}>
                        {pincodeMessage}
                      </p>
                    )}
                  </div>

                  {/* Flat, House no. * */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      Flat, House no. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.street || ''}
                      onChange={(e) => {
                        setFormState({ ...formState, street: e.target.value });
                        if (formError) setFormError('');
                      }}
                      placeholder="Enter flat, house no., building name"
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs outline-none focus:border-blue-600 bg-white shadow-2xs"
                    />
                  </div>

                  {/* Apartment, Area, Sector, Village * */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-xs">
                      Apartment, Area, Sector, Village <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.addressLine2 || formState.locality || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormState({ 
                          ...formState, 
                          addressLine2: val,
                          locality: val 
                        });
                        if (formError) setFormError('');
                      }}
                      placeholder="Enter area, street, or landmark"
                      className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs outline-none focus:border-blue-600 bg-white shadow-2xs"
                    />
                  </div>

                  {/* City * and State * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* City * */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.city || ''}
                        onChange={(e) => {
                          setFormState({ ...formState, city: e.target.value });
                          if (formError) setFormError('');
                        }}
                        placeholder="Enter city"
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs outline-none focus:border-blue-600 bg-white shadow-2xs"
                      />
                    </div>

                    {/* State * */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-xs">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formState.state || 'Karnataka'}
                        onChange={(e) => {
                          setFormState({ ...formState, state: e.target.value });
                          if (formError) setFormError('');
                        }}
                        className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm sm:text-xs outline-none focus:border-blue-600 bg-white cursor-pointer shadow-2xs"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Address Type: Home / Work */}
                  <div className="pt-1">
                    <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                      Address Type
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 max-w-xs">
                      {[
                        { id: 'home', label: 'Home', icon: <Home size={15} /> },
                        { id: 'work', label: 'Work', icon: <Briefcase size={15} /> }
                      ].map((item) => {
                        const isSelected = (formState.addressType || 'home') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormState({ ...formState, addressType: item.id as any })}
                            className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className={isSelected ? 'text-blue-600' : 'text-slate-500'}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.isDefault) || addresses.length === 0}
                        disabled={addresses.length === 0}
                        onChange={(e) => setFormState({ ...formState, isDefault: e.target.checked })}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">
                          Make this my default delivery address
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                          {addresses.length === 0
                            ? 'Your first saved address will automatically be set as default.'
                            : 'Any previous default address will automatically be unselected.'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 bg-white shrink-0 pb-[max(0.875rem,calc(env(safe-area-inset-bottom)+0.75rem))] sm:pb-3.5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAddress(null);
                  }}
                  disabled={saving}
                  className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2.5 sm:py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 sm:flex-initial min-h-[42px] px-5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{editingAddress ? 'Update Address' : 'Save Address'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
