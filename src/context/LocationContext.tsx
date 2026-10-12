import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { StoreInfo } from '../types';
import { useStores } from '../hooks/useStores';
import { getCachedStore } from '../services/catalogCache';
import { useAuth } from './AuthContext';
import { useSiteSettings } from './SiteSettingsContext';
import { isPincodeServiceable } from '../services/indiaGeographicData';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, onSnapshot } from 'firebase/firestore';

export interface HyperlocalLocation {
  city: string;
  pincode: string;
  area: string;
  formattedAddress: string;
  deliveryTime: string;
  distanceKm: number;
  selectedStoreId: string;
  latitude?: number;
  longitude?: number;
  addressId?: string;
  addressName?: string;
  addressType?: 'home' | 'work' | 'other';
  receiverName?: string;
  phone?: string;
  landmark?: string;
  state?: string;
}

export interface PopularCityOption {
  name: string;
  state: string;
  defaultPincode: string;
  defaultArea: string;
  defaultStoreId: string;
}

export interface LocationServiceability {
  serviceable: boolean;
  deliveryType: 'Standard' | 'Express' | 'SameDay';
  codAvailable: boolean;
  transitDays: number;
  reason?: string;
  status: 'serviceable' | 'unserviceable' | 'invalid' | 'unknown';
}

export const POPULAR_CITIES: PopularCityOption[] = [
  { name: 'Bengaluru', state: 'Karnataka', defaultPincode: '560034', defaultArea: 'Koramangala 4th Block', defaultStoreId: 'main-store' },
  { name: 'Mumbai', state: 'Maharashtra', defaultPincode: '400050', defaultArea: 'Bandra West', defaultStoreId: 'main-store' },
  { name: 'Delhi NCR', state: 'Delhi', defaultPincode: '110001', defaultArea: 'Connaught Place', defaultStoreId: 'main-store' },
  { name: 'Kolkata', state: 'West Bengal', defaultPincode: '700091', defaultArea: 'Salt Lake Sector V', defaultStoreId: 'main-store' },
  { name: 'Hyderabad', state: 'Telangana', defaultPincode: '500081', defaultArea: 'Hitec City, Madhapur', defaultStoreId: 'main-store' },
  { name: 'Chennai', state: 'Tamil Nadu', defaultPincode: '600018', defaultArea: 'T. Nagar', defaultStoreId: 'main-store' },
  { name: 'Pune', state: 'Maharashtra', defaultPincode: '411014', defaultArea: 'Viman Nagar', defaultStoreId: 'main-store' },
  { name: 'Ahmedabad', state: 'Gujarat', defaultPincode: '380015', defaultArea: 'SG Highway', defaultStoreId: 'main-store' }
];

const DEFAULT_LOCATION: HyperlocalLocation = {
  city: 'Bengaluru',
  pincode: '560034',
  area: 'Koramangala',
  formattedAddress: 'Koramangala, Bengaluru - 560034',
  deliveryTime: '15-25 Mins',
  distanceKm: 1.4,
  selectedStoreId: 'main-store',
  latitude: 12.9352,
  longitude: 77.6245
};

export interface SelectAddressPayload {
  id?: string;
  city: string;
  postalCode?: string;
  zipCode?: string;
  locality?: string;
  street?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  addressName?: string;
  addressType?: 'home' | 'work' | 'other';
  customAddressType?: string;
  fullName?: string;
  phone?: string;
  landmark?: string;
}

interface LocationContextType {
  location: HyperlocalLocation;
  serviceability: LocationServiceability | null;
  isLocationModalOpen: boolean;
  isLocating: boolean;
  locationError: string | null;
  activeStore: StoreInfo | undefined;
  nearbyStores: Array<StoreInfo & { distanceKm: number; deliveryMinutes: number; isDelivering: boolean }>;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  setLocationData: (data: Partial<HyperlocalLocation>) => void;
  selectCity: (city: PopularCityOption) => void;
  selectStore: (storeId: string) => void;
  selectPincode: (pincode: string, city: string, area?: string, state?: string) => void;
  selectAddress: (address: SelectAddressPayload) => void;
  detectGPSLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'electro_hyperlocal_location';

export function LocationProvider({ children }: { children: ReactNode }) {
  const { stores } = useStores();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [location, setLocation] = useState<HyperlocalLocation>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_LOCATION, ...parsed };
      }
      // Check legacy localStorage keys if available
      const legPin = localStorage.getItem('electro_user_pincode');
      const legCity = localStorage.getItem('electro_user_city');
      if (legPin || legCity) {
        return {
          ...DEFAULT_LOCATION,
          city: legCity || DEFAULT_LOCATION.city,
          pincode: legPin || DEFAULT_LOCATION.pincode,
          formattedAddress: `${legCity || DEFAULT_LOCATION.city} - ${legPin || DEFAULT_LOCATION.pincode}`
        };
      }
    } catch (e) {
      console.warn('Could not read saved location:', e);
    }
    return DEFAULT_LOCATION;
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(location));
      if (location.pincode) localStorage.setItem('electro_user_pincode', location.pincode);
      if (location.city) localStorage.setItem('electro_user_city', location.city);
    } catch (e) {
      console.warn('Could not save location:', e);
    }
  }, [location]);

  const activeStore = useMemo(() => {
    return getCachedStore(location.selectedStoreId) || stores.find(s => s.storeId === location.selectedStoreId) || stores[0];
  }, [location.selectedStoreId, stores]);

  // Calculate dynamic distances for all stores based on selected location
  const nearbyStores = useMemo(() => {
    const baseStores = stores.length > 0 ? stores : [
      {
        storeId: 'main-store',
        storeName: 'ELECTRO Flagship Superhub',
        status: 'ACTIVE',
        description: 'Main Hyperlocal Warehouse & Express Delivery Station',
        city: location.city,
        state: 'Local Zone'
      }
    ];

    return baseStores.map((st, index) => {
      // Deterministic pseudo-distance based on store index / selected store
      const isSelected = st.storeId === location.selectedStoreId;
      const baseDist = isSelected ? 1.2 : (1.5 + (index * 1.3));
      const dist = Math.round(baseDist * 10) / 10;
      const mins = Math.max(15, Math.round(dist * 12));

      return {
        ...st,
        distanceKm: dist,
        deliveryMinutes: mins,
        isDelivering: st.status === 'ACTIVE'
      };
    });
  }, [stores, location.selectedStoreId, location.city]);

  const openLocationModal = useCallback(() => {
    setLocationError(null);
    setIsLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
    setLocationError(null);
  }, []);

  const setLocationData = useCallback((data: Partial<HyperlocalLocation>) => {
    setLocation(prev => {
      const updated = { ...prev, ...data };
      if (data.area || data.city || data.pincode) {
        const areaStr = data.area || prev.area;
        const cityStr = data.city || prev.city;
        const pinStr = data.pincode || prev.pincode;
        updated.formattedAddress = `${areaStr}, ${cityStr}${pinStr ? ` - ${pinStr}` : ''}`;
      }
      return updated;
    });
  }, []);

  const selectCity = useCallback((cityOption: PopularCityOption) => {
    setLocation(prev => ({
      ...prev,
      city: cityOption.name,
      pincode: cityOption.defaultPincode,
      area: cityOption.defaultArea,
      formattedAddress: `${cityOption.defaultArea}, ${cityOption.name} - ${cityOption.defaultPincode}`,
      selectedStoreId: cityOption.defaultStoreId || prev.selectedStoreId,
      deliveryTime: '15-25 Mins',
      distanceKm: 1.2
    }));
  }, []);

  const selectStore = useCallback((storeId: string) => {
    const targetStore = stores.find(s => s.storeId === storeId);
    setLocation(prev => ({
      ...prev,
      selectedStoreId: storeId,
      city: targetStore?.city || prev.city,
      distanceKm: 1.2,
      deliveryTime: '15-25 Mins'
    }));
  }, [stores]);

  const detectGPSLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          
          try {
            const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
            if (res.ok) {
              const geoData = await res.json();
              if (geoData.success) {
                const detectedPin = (geoData.pincode || '').replace(/\D/g, '').slice(0, 6);
                const detectedCity = geoData.city || 'Bengaluru';
                const detectedArea = geoData.area || geoData.locality || geoData.subLocality || geoData.street || detectedCity;
                const formatted = geoData.formattedAddress || `${detectedArea}, ${detectedCity}${detectedPin ? ` - ${detectedPin}` : ''}, India`;

                setLocation(prev => ({
                  ...prev,
                  latitude,
                  longitude,
                  pincode: detectedPin || prev.pincode,
                  city: detectedCity,
                  area: detectedArea,
                  formattedAddress: formatted,
                  deliveryTime: '15-20 Mins',
                  distanceKm: 0.9
                }));

                setIsLocating(false);
                setIsLocationModalOpen(false);
                resolve();
                return;
              }
            }
          } catch (e) {
            console.warn('Reverse geocode in detectGPSLocation notice:', e);
          }

          // Fallback if reverse geocode failed
          setLocation(prev => ({
            ...prev,
            latitude,
            longitude,
            deliveryTime: '15-20 Mins',
            distanceKm: 0.9
          }));

          setIsLocating(false);
          setIsLocationModalOpen(false);
          resolve();
        },
        (err) => {
          console.warn('Geolocation permission or lookup notice:', err.message);
          setIsLocating(false);
          setLocationError('Could not get precise GPS. Please search your area or enter PIN code.');
          resolve();
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }, []);

  const selectPincode = useCallback((pincode: string, city: string, area?: string, state?: string) => {
    setLocation(prev => {
      const cleanPin = pincode.trim();
      const cleanCity = city.trim();
      const cleanArea = area?.trim() || cleanCity;
      return {
        ...prev,
        pincode: cleanPin,
        city: cleanCity,
        area: cleanArea,
        formattedAddress: area ? `${cleanArea}, ${cleanCity} - ${cleanPin}` : `${cleanCity} - ${cleanPin}`,
        addressId: undefined,
        deliveryTime: '15-25 Mins',
        distanceKm: 1.2
      };
    });
  }, []);

  const selectAddress = useCallback((address: SelectAddressPayload) => {
    const pin = (address.postalCode || address.zipCode || '').trim().replace(/\D/g, '').slice(0, 6);
    const city = (address.city || '').trim();
    const area = (address.locality || address.street || '').trim();
    const addrName = address.addressName || 
      (address.addressType === 'work' 
        ? 'Work' 
        : address.addressType === 'other' 
        ? (address.customAddressType || 'Other') 
        : (address.addressType ? 'Home' : ''));

    let resolvedFormatted = address.formattedAddress?.trim();
    if (!resolvedFormatted) {
      const parts = [address.street, address.locality, city, address.state].filter(Boolean);
      resolvedFormatted = parts.length > 0 ? `${parts.join(', ')}${pin ? ` - ${pin}` : ''}` : `${city}${pin ? ` - ${pin}` : ''}`;
    }

    setLocation(prev => ({
      ...prev,
      pincode: pin || prev.pincode,
      city: city || prev.city,
      area: area || city || prev.area,
      formattedAddress: resolvedFormatted || prev.formattedAddress,
      addressId: address.id,
      addressName: addrName || prev.addressName,
      addressType: address.addressType || prev.addressType,
      receiverName: address.fullName || prev.receiverName,
      phone: address.phone || prev.phone,
      landmark: address.landmark || prev.landmark,
      state: address.state || prev.state,
      latitude: address.latitude ?? prev.latitude,
      longitude: address.longitude ?? prev.longitude,
      deliveryTime: 'Express Delivery',
      distanceKm: 1.2
    }));

    // For logged-in customers, persist activeAddressId to Firestore (primary database)
    if (user && user.uid && address.id) {
      setDoc(doc(db, 'users', user.uid), { activeAddressId: address.id }, { merge: true }).catch(err => {
        console.warn('Could not persist activeAddressId to Firestore:', err);
      });
    }
  }, [user]);

  // Restore and sync active delivery address for logged-in customer from Firestore
  useEffect(() => {
    if (!user || !user.uid) {
      // Safely clear customer-specific active address state on logout
      setLocation(prev => {
        if (!prev.addressId && !prev.receiverName && !prev.addressName) return prev;
        return {
          ...prev,
          addressId: undefined,
          addressName: undefined,
          addressType: undefined,
          receiverName: undefined,
          phone: undefined
        };
      });
      return;
    }

    // Customer is logged in: listen to their saved addresses in Firestore
    const q = query(collection(db, 'users', user.uid, 'addresses'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const addressesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      if (addressesList.length === 0) return;

      // Check if user has an activeAddressId saved in their profile doc
      let targetAddress: any = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const activeId = userDoc.exists() ? userDoc.data()?.activeAddressId : null;
        if (activeId) {
          targetAddress = addressesList.find(a => a.id === activeId);
        }
      } catch (err) {
        console.warn('Error reading user activeAddressId:', err);
      }

      // If activeId wasn't found or doc doesn't have it, check for isDefault
      if (!targetAddress) {
        targetAddress = addressesList.find(a => a.isDefault) || addressesList[0];
      }

      if (targetAddress) {
        const pin = (targetAddress.postalCode || targetAddress.zipCode || '').trim().replace(/\D/g, '').slice(0, 6);
        const city = (targetAddress.city || '').trim();
        const area = (targetAddress.locality || targetAddress.street || '').trim();
        const addrName = targetAddress.addressType === 'work' 
          ? 'Work' 
          : targetAddress.addressType === 'other' 
          ? (targetAddress.customAddressType || 'Other') 
          : 'Home';

        setLocation(prev => ({
          ...prev,
          pincode: pin || prev.pincode,
          city: city || prev.city,
          area: area || city || prev.area,
          formattedAddress: targetAddress.formattedAddress || targetAddress.address || prev.formattedAddress,
          addressId: targetAddress.id,
          addressName: addrName,
          addressType: targetAddress.addressType || 'home',
          receiverName: targetAddress.fullName,
          phone: targetAddress.phone,
          landmark: targetAddress.landmark,
          state: targetAddress.state,
          latitude: targetAddress.latitude ?? prev.latitude,
          longitude: targetAddress.longitude ?? prev.longitude
        }));
      }
    }, (err) => {
      console.warn('Error listening to user addresses in LocationContext:', err);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Unified canonical delivery serviceability check for the active location PIN
  const serviceability = useMemo<LocationServiceability | null>(() => {
    const pin = (location.pincode || '').trim();
    if (!pin) return null;
    if (pin.length !== 6 || !/^[1-9][0-9]{5}$/.test(pin)) {
      return {
        serviceable: false,
        deliveryType: 'Standard',
        codAvailable: false,
        transitDays: 3,
        reason: 'Please enter a valid 6-digit Indian PIN code.',
        status: 'invalid'
      };
    }
    const res = isPincodeServiceable(pin, settings.shipping?.deliveryCoverage);
    return {
      serviceable: res.serviceable,
      deliveryType: res.deliveryType,
      codAvailable: res.codAvailable,
      transitDays: res.transitDays,
      reason: res.reason,
      status: res.serviceable ? 'serviceable' : 'unserviceable'
    };
  }, [location.pincode, settings.shipping?.deliveryCoverage]);

  const value = useMemo(() => ({
    location,
    serviceability,
    isLocationModalOpen,
    isLocating,
    locationError,
    activeStore,
    nearbyStores,
    openLocationModal,
    closeLocationModal,
    setLocationData,
    selectCity,
    selectStore,
    selectPincode,
    selectAddress,
    detectGPSLocation
  }), [
    location,
    serviceability,
    isLocationModalOpen,
    isLocating,
    locationError,
    activeStore,
    nearbyStores,
    openLocationModal,
    closeLocationModal,
    setLocationData,
    selectCity,
    selectStore,
    selectPincode,
    selectAddress,
    detectGPSLocation
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export const useHyperlocalLocation = useLocation;
