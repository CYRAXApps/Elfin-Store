import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, X, Navigation, Search, Check, 
  ChevronRight, Home, Briefcase, Building, 
  Loader2, Zap, Plus, AlertCircle, ArrowLeft, ShieldCheck,
  User, Phone, Edit3, Trash2
} from 'lucide-react';
import { Map, useMap, useMapsLibrary, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { db, auth } from '../firebase';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp 
} from 'firebase/firestore';
import { lookupPincode, isValidPincode, INDIAN_STATES } from '../services/pincodeService';
import { isPincodeServiceable } from '../services/indiaGeographicData';
import { Address } from '../types';

type ModalView = 'list' | 'location_picker' | 'address_form';

interface LocationComponents {
  houseNumber?: string;
  building?: string;
  street?: string;
  subLocality?: string;
  locality?: string;
  subdistrict?: string;
  area: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapViewportProps {
  selectedCoords: { lat: number; lng: number };
  isMapMoving: boolean;
  setIsMapMoving: (val: boolean) => void;
  isReverseGeocoding: boolean;
  isLocating: boolean;
  onCameraSettled: (lat: number, lng: number) => void;
  onUseCurrentLocation: () => void;
}

function GoogleMapViewport({
  selectedCoords,
  isMapMoving,
  setIsMapMoving,
  isReverseGeocoding,
  isLocating,
  onCameraSettled,
  onUseCurrentLocation
}: GoogleMapViewportProps) {
  const map = useMap('delivery-location-map') || useMap();
  const settleTimeoutRef = useRef<any>(null);

  // Sync external coordinate updates (e.g., from Places Autocomplete or GPS) to the map
  useEffect(() => {
    if (map && selectedCoords?.lat && selectedCoords?.lng) {
      const cur = map.getCenter();
      if (!cur || Math.abs(cur.lat() - selectedCoords.lat) > 0.0001 || Math.abs(cur.lng() - selectedCoords.lng) > 0.0001) {
        map.panTo({ lat: selectedCoords.lat, lng: selectedCoords.lng });
      }
    }
  }, [selectedCoords.lat, selectedCoords.lng, map]);

  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    if (!ev.detail?.center) return;
    setIsMapMoving(true);
    const center = ev.detail.center;
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = setTimeout(() => {
      setIsMapMoving(false);
      onCameraSettled(center.lat, center.lng);
    }, 350);
  };

  const handleZoomIn = () => {
    if (map) {
      const z = map.getZoom() || 17;
      map.setZoom(Math.min(z + 1, 21));
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const z = map.getZoom() || 17;
      map.setZoom(Math.max(z - 1, 4));
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 h-[340px] sm:h-[400px]">
      <Map
        id="delivery-location-map"
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: selectedCoords.lat, lng: selectedCoords.lng }}
        defaultZoom={17}
        gestureHandling="greedy"
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onCameraChanged={handleCameraChange}
        onDragstart={() => setIsMapMoving(true)}
      />

      {/* FIXED CENTRAL LOCATION MARKER (Flipkart / Google Maps Delivery Style) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          
          {/* Floating Status Badge over the Needle */}
          <div 
            className={`mb-1 px-3 py-1 rounded-full text-[11px] font-bold shadow-md border transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
              isMapMoving 
                ? 'bg-slate-900 text-white border-slate-800 scale-105' 
                : isReverseGeocoding 
                  ? 'bg-blue-600 text-white border-blue-500 animate-pulse'
                  : 'bg-white/95 text-slate-800 border-slate-200/80 backdrop-blur-xs'
            }`}
          >
            {isMapMoving ? (
              <>
                <Navigation size={11} className="text-blue-400 animate-spin" />
                <span>Pinning exact doorstep...</span>
              </>
            ) : isReverseGeocoding ? (
              <>
                <Loader2 size={11} className="animate-spin text-white" />
                <span>Detecting address...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Deliver to this location</span>
              </>
            )}
          </div>

          {/* The Delivery Needle with Tactile Lift Animation on Drag */}
          <div 
            className={`relative transition-transform duration-200 ease-out origin-bottom ${
              isMapMoving ? '-translate-y-2.5 scale-105' : 'translate-y-0 scale-100'
            }`}
          >
            <div className="relative flex items-center justify-center filter drop-shadow-[0_8px_12px_rgba(37,99,235,0.45)]">
              <svg width="42" height="52" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M21 0C9.402 0 0 9.402 0 21C0 35.5 18.2 49.8 20.1 51.3C20.65 51.75 21.35 51.75 21.9 51.3C23.8 49.8 42 35.5 42 21C42 9.402 32.598 0 21 0Z" 
                  fill="#2563EB" 
                />
                <circle cx="21" cy="20" r="14" fill="white" />
                <circle cx="21" cy="20" r="9" fill="#2563EB" />
                <circle cx="21" cy="20" r="3.5" fill="white" />
              </svg>
            </div>
          </div>

          {/* Ground Target Pulse & Shadow */}
          <div className="relative -mt-1 flex items-center justify-center">
            <div 
              className={`absolute rounded-full border-2 border-blue-500/40 transition-all duration-300 ${
                isMapMoving 
                  ? 'w-10 h-3 scale-125 opacity-20' 
                  : 'w-6 h-2 scale-100 opacity-70 animate-ping'
              }`} 
            />
            <div 
              className={`rounded-full bg-slate-950/40 blur-[1px] transition-all duration-200 ${
                isMapMoving 
                  ? 'w-4 h-1.5 opacity-30 scale-75' 
                  : 'w-6 h-2 opacity-80 scale-100'
              }`} 
            />
          </div>

        </div>
      </div>

      {/* MAP CONTROLS (Top-Right Floating Stack: Current Location, Zoom In, Zoom Out) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Current Location Button */}
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          title="Use Current Location"
          aria-label="Use Current Location"
          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 shadow-md border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 group active:scale-95"
        >
          <Navigation 
            size={18} 
            className={isLocating ? "animate-spin text-blue-600" : "text-slate-700 group-hover:text-blue-600 transition-colors"} 
          />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col rounded-xl bg-white shadow-md border border-slate-200/90 overflow-hidden divide-y divide-slate-100">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
            className="w-10 h-10 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="w-10 h-10 hover:bg-slate-50 text-slate-700 hover:text-blue-600 font-bold text-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          >
            −
          </button>
        </div>
      </div>

      {/* Top-Left Helper Tip */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>Move map to place pin at doorstep</span>
        </div>
      </div>

      {/* Bottom-Left Geocoding Status */}
      {isReverseGeocoding && (
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm text-[11px] font-bold text-blue-700 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin text-blue-600" />
            <span>Updating address...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function HyperlocalLocationModal() {
  const { 
    location, 
    isLocationModalOpen, 
    closeLocationModal, 
    selectAddress,
    selectPincode 
  } = useLocation();

  const { user, firebaseUser, loading: authLoading, getIdToken } = useAuth();
  const { settings } = useSiteSettings();

  const [currentView, setCurrentView] = useState<ModalView>('list');
  
  // Step 1 Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Saved Addresses for Logged-In Customer
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [confirmDeleteAddress, setConfirmDeleteAddress] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Step 2: Location Picker & Map State
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerSearchResults, setPickerSearchResults] = useState<any[]>([]);
  const [isPickerSearching, setIsPickerSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: location.latitude || 12.9716,
    lng: location.longitude || 77.5946
  });
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [locationComponents, setLocationComponents] = useState<LocationComponents>({
    houseNumber: '',
    building: '',
    street: '',
    subLocality: '',
    locality: '',
    subdistrict: '',
    area: location.area || 'Central Area',
    city: location.city || 'Bengaluru',
    district: '',
    state: 'Karnataka',
    pincode: location.pincode || '',
    formattedAddress: location.formattedAddress || 'Bengaluru, Karnataka',
    latitude: location.latitude || 12.9716,
    longitude: location.longitude || 77.5946
  });

  // Step 5: Personal Details & Address Form State + Validation
  const [formState, setFormState] = useState<{
    fullName: string;
    phone: string;
    flat: string;
    area: string;
    landmark: string;
    pincode: string;
    city: string;
    district: string;
    state: string;
    addressType: 'home' | 'work' | 'other';
    customAddressType: string;
  }>({
    fullName: '',
    phone: '',
    flat: '',
    area: '',
    landmark: '',
    pincode: '',
    city: '',
    district: '',
    state: 'Karnataka',
    addressType: 'home',
    customAddressType: ''
  });

  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [pinCheckResult, setPinCheckResult] = useState<{
    status: 'serviceable' | 'unserviceable' | 'invalid';
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Google Maps Libraries & Refs
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const sessionTokenRef = useRef<any>(null);
  const searchDebounceRef = useRef<any>(null);
  const pickerDebounceRef = useRef<any>(null);
  const reverseGeocodeDebounceRef = useRef<any>(null);

  // Reset modal state on open
  useEffect(() => {
    if (isLocationModalOpen) {
      setCurrentView('list');
      setSearchQuery('');
      setSearchResults([]);
      setPickerSearchQuery('');
      setPickerSearchResults([]);
      setGeoError(null);
      setFormError('');
      setInlineErrors({});
      setPinCheckResult(null);
      setEditingAddressId(null);
      setConfirmDeleteAddress(null);
      setSelectedCoords({
        lat: location.latitude || 12.9716,
        lng: location.longitude || 77.5946
      });
    }
  }, [isLocationModalOpen]);

  // Load existing saved addresses for authenticated user
  useEffect(() => {
    if (!user || !user.uid) {
      setSavedAddresses([]);
      setLoadingAddresses(false);
      return;
    }

    setLoadingAddresses(true);

    const loadAddressesFromApi = async () => {
      try {
        const token = await getIdToken();
        const res = await fetch('/api/user/addresses', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
          }
        }
      } catch (apiErr) {
        console.warn('Notice loading addresses via API fallback:', apiErr);
      } finally {
        setLoadingAddresses(false);
      }
    };

    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'users', user.uid, 'addresses'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Address[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            zipCode: data.zipCode || data.postalCode || (data as any).pincode || '',
            postalCode: data.postalCode || data.zipCode || (data as any).pincode || '',
          } as unknown as Address;
        });

        list.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });

        setSavedAddresses(list);
        setLoadingAddresses(false);
      }, (err) => {
        console.warn("Could not load user addresses via onSnapshot, using API fallback:", err);
        loadAddressesFromApi();
      });
    } catch {
      loadAddressesFromApi();
    }

    return () => unsubscribe();
  }, [user]);

  // Step 1: Search input debounce (Google Places Autocomplete + Geocoding)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const queryTrim = searchQuery.trim();

      if (/^\d{6}$/.test(queryTrim)) {
        try {
          const pinRes = await lookupPincode(queryTrim);
          if (pinRes.success && pinRes.state) {
            const locName = pinRes.locality || pinRes.city || 'Area';
            const cityName = pinRes.city || pinRes.district || '';
            const disp = `${locName}, ${cityName}, ${pinRes.state} - ${queryTrim}, India`;
            setSearchResults([{
              displayName: disp,
              formattedAddress: disp,
              city: cityName,
              district: pinRes.district || '',
              state: pinRes.state || '',
              pincode: queryTrim,
              locality: locName,
              area: locName,
              street: '',
              lat: 20.5937,
              lon: 78.9629
            }]);
            setIsSearching(false);
            return;
          }
        } catch {}
      }

      // 1. Google Places Autocomplete Suggestions
      if (placesLib?.AutocompleteSuggestion) {
        try {
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }
          const resp = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: queryTrim,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['in']
          });
          if (resp?.suggestions && resp.suggestions.length > 0) {
            const mapped = resp.suggestions.map((s: any) => ({
              isGoogleSuggestion: true,
              rawSuggestion: s,
              displayName: s.placePrediction?.text?.toString() || s.placePrediction?.mainText?.toString() || '',
              mainText: s.placePrediction?.mainText?.toString() || '',
              secondaryText: s.placePrediction?.secondaryText?.toString() || '',
              placeId: s.placePrediction?.placeId,
              locality: s.placePrediction?.mainText?.toString() || '',
              formattedAddress: s.placePrediction?.text?.toString() || ''
            }));
            setSearchResults(mapped);
            setIsSearching(false);
            return;
          }
        } catch (e) {
          console.warn('Google Places suggestion error:', e);
        }
      }

      // 2. Google-backed Geocoding search endpoint fallback
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(queryTrim)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            setSearchResults(data.results);
          } else {
            setSearchResults([]);
          }
        }
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery, placesLib]);

  // Step 2: Location Picker Search debounce (Google Places Autocomplete + Geocoding)
  useEffect(() => {
    if (!pickerSearchQuery || pickerSearchQuery.trim().length < 2) {
      setPickerSearchResults([]);
      setIsPickerSearching(false);
      return;
    }

    clearTimeout(pickerDebounceRef.current);
    pickerDebounceRef.current = setTimeout(async () => {
      setIsPickerSearching(true);
      const queryTrim = pickerSearchQuery.trim();

      // 1. Google Places Autocomplete Suggestions
      if (placesLib?.AutocompleteSuggestion) {
        try {
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
          }
          const resp = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: queryTrim,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['in']
          });
          if (resp?.suggestions && resp.suggestions.length > 0) {
            const mapped = resp.suggestions.map((s: any) => ({
              isGoogleSuggestion: true,
              rawSuggestion: s,
              displayName: s.placePrediction?.text?.toString() || s.placePrediction?.mainText?.toString() || '',
              mainText: s.placePrediction?.mainText?.toString() || '',
              secondaryText: s.placePrediction?.secondaryText?.toString() || '',
              placeId: s.placePrediction?.placeId,
              locality: s.placePrediction?.mainText?.toString() || '',
              formattedAddress: s.placePrediction?.text?.toString() || ''
            }));
            setPickerSearchResults(mapped);
            setIsPickerSearching(false);
            return;
          }
        } catch (e) {
          console.warn('Picker Google Places suggestion error:', e);
        }
      }

      // 2. Google-backed Geocoding search endpoint fallback
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(queryTrim)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            setPickerSearchResults(data.results);
          } else {
            setPickerSearchResults([]);
          }
        }
      } catch (err) {
        console.warn('Picker search error:', err);
      } finally {
        setIsPickerSearching(false);
      }
    }, 300);

    return () => clearTimeout(pickerDebounceRef.current);
  }, [pickerSearchQuery, placesLib]);

  // Prevent background page / body scroll when the location modal is open
  useEffect(() => {
    if (!isLocationModalOpen) return;

    // Save previous styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalTouchAction = document.body.style.touchAction;
    const scrollY = window.scrollY;

    // Completely lock document & body from scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';

    return () => {
      // Restore previous styles seamlessly
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.touchAction = originalTouchAction;
      window.scrollTo(0, scrollY);
    };
  }, [isLocationModalOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isLocationModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteAddress) {
          setConfirmDeleteAddress(null);
        } else {
          closeLocationModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocationModalOpen, closeLocationModal, confirmDeleteAddress]);

  // Helper to reverse geocode coordinates and update location components
  const reverseGeocodeCoords = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    setGeoError(null);

    // 1. Client-side Google Geocoder if geocodingLib is loaded
    if (geocodingLib?.Geocoder) {
      try {
        const geocoder = new geocodingLib.Geocoder();
        const gRes = await geocoder.geocode({ location: { lat, lng } });
        if (gRes.results && gRes.results[0]) {
          const resObj = gRes.results[0];
          const comps = resObj.address_components || [];
          let houseNumber = '';
          let building = '';
          let street = '';
          let subLocality = '';
          let locality = '';
          let city = '';
          let district = '';
          let state = 'Karnataka';
          let pincode = '';
          let country = 'India';

          for (const comp of comps) {
            const types = comp.types || [];
            if (types.includes('street_number')) houseNumber = comp.long_name;
            if (types.includes('premise') || types.includes('subpremise') || types.includes('point_of_interest') || types.includes('establishment')) {
              if (!building) building = comp.long_name;
            }
            if (types.includes('route')) street = comp.long_name;
            if (types.includes('sublocality_level_1') || types.includes('sublocality')) locality = comp.long_name;
            if (types.includes('sublocality_level_2') || types.includes('sublocality_level_3') || types.includes('neighborhood')) subLocality = comp.long_name;
            if (types.includes('locality')) city = comp.long_name;
            else if (!city && (types.includes('administrative_area_level_2') || types.includes('postal_town'))) city = comp.long_name;
            if (types.includes('administrative_area_level_2')) district = comp.long_name;
            if (types.includes('administrative_area_level_1')) state = comp.long_name;
            if (types.includes('postal_code')) pincode = comp.long_name.replace(/\D/g, '').slice(0, 6);
            if (types.includes('country')) country = comp.long_name;
          }

          if (/^Bangalore/i.test(city)) city = 'Bengaluru';
          else if (/^Calcutta/i.test(city)) city = 'Kolkata';
          else if (/^Bombay/i.test(city)) city = 'Mumbai';
          else if (/^Madras/i.test(city)) city = 'Chennai';

          const areaParts = [building, street, subLocality, locality].filter(Boolean).filter((item, idx, arr) => arr.indexOf(item) === idx);
          const area = areaParts.join(', ') || locality || subLocality || city || 'Area';

          setLocationComponents({
            houseNumber,
            building,
            street,
            subLocality,
            locality,
            subdistrict: '',
            area,
            city: city || 'Bengaluru',
            district,
            state: state || 'Karnataka',
            pincode,
            formattedAddress: resObj.formatted_address || `${area}, ${city}${pincode ? ` - ${pincode}` : ''}, India`,
            latitude: lat,
            longitude: lng
          });
          setIsReverseGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('Google client reverse geocode notice:', err);
      }
    }

    // 2. Server proxy backed by Google Geocoding API
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const geoData = await res.json();
        if (geoData.success) {
          const detectedPin = (geoData.pincode || '').replace(/\D/g, '').slice(0, 6);
          const detectedCity = geoData.city || 'Bengaluru';
          const detectedState = geoData.state || 'Karnataka';
          const detectedArea = geoData.area || geoData.locality || geoData.street || detectedCity;

          setLocationComponents({
            houseNumber: geoData.houseNumber || '',
            building: geoData.building || '',
            street: geoData.street || '',
            subLocality: geoData.subLocality || '',
            locality: geoData.locality || '',
            subdistrict: geoData.subdistrict || '',
            area: detectedArea,
            city: detectedCity,
            district: geoData.district || '',
            state: detectedState,
            pincode: detectedPin,
            formattedAddress: geoData.formattedAddress || `${detectedArea}, ${detectedCity}${detectedPin ? ` - ${detectedPin}` : ''}, India`,
            latitude: lat,
            longitude: lng
          });
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Unified Google Place / Search Result Selector
  const handleSelectSuggestion = async (result: any) => {
    if (result.isGoogleSuggestion && result.rawSuggestion?.placePrediction) {
      try {
        const place = result.rawSuggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['location', 'addressComponents', 'formattedAddress', 'displayName']
        });
        if (sessionTokenRef.current) {
          sessionTokenRef.current = null;
        }
        const lat = place.location?.lat();
        const lng = place.location?.lng();

        if (lat != null && lng != null) {
          const comps = place.addressComponents || [];
          let houseNumber = '';
          let building = '';
          let street = '';
          let subLocality = '';
          let locality = '';
          let city = '';
          let district = '';
          let state = 'Karnataka';
          let pincode = '';
          let country = 'India';

          for (const comp of comps) {
            const types = comp.types || [];
            if (types.includes('street_number')) houseNumber = comp.longText || comp.shortText || '';
            if (types.includes('premise') || types.includes('point_of_interest') || types.includes('establishment')) {
              if (!building) building = comp.longText || '';
            }
            if (types.includes('route')) street = comp.longText || '';
            if (types.includes('sublocality_level_1') || types.includes('sublocality')) locality = comp.longText || '';
            if (types.includes('sublocality_level_2') || types.includes('neighborhood')) subLocality = comp.longText || '';
            if (types.includes('locality')) city = comp.longText || '';
            else if (!city && types.includes('administrative_area_level_2')) city = comp.longText || '';
            if (types.includes('administrative_area_level_2')) district = comp.longText || '';
            if (types.includes('administrative_area_level_1')) state = comp.longText || '';
            if (types.includes('postal_code')) pincode = (comp.longText || '').replace(/\D/g, '').slice(0, 6);
            if (types.includes('country')) country = comp.longText || 'India';
          }

          if (/^Bangalore/i.test(city)) city = 'Bengaluru';
          else if (/^Calcutta/i.test(city)) city = 'Kolkata';
          else if (/^Bombay/i.test(city)) city = 'Mumbai';
          else if (/^Madras/i.test(city)) city = 'Chennai';

          const areaParts = [building, street, subLocality, locality].filter(Boolean).filter((item, idx, arr) => arr.indexOf(item) === idx);
          const area = areaParts.join(', ') || locality || result.mainText || city || 'Area';
          const formatted = place.formattedAddress || `${area}, ${city}${pincode ? ` - ${pincode}` : ''}, India`;

          setSelectedCoords({ lat, lng });
          setLocationComponents({
            houseNumber,
            building,
            street,
            subLocality,
            locality,
            subdistrict: '',
            area,
            city: city || 'Bengaluru',
            district,
            state: state || 'Karnataka',
            pincode,
            formattedAddress: formatted,
            latitude: lat,
            longitude: lng
          });
          setCurrentView('location_picker');
          return;
        }
      } catch (err) {
        console.warn('Error fetching Google Place details:', err);
      }
    }

    const lat = result.lat || 12.9716;
    const lng = result.lon || result.lng || 77.5946;
    setSelectedCoords({ lat, lng });

    const pin = (result.pincode || '').replace(/\D/g, '').slice(0, 6);
    const city = result.city || 'Bengaluru';
    const state = result.state || 'Karnataka';
    const area = result.area || result.locality || result.street || city;
    const formatted = result.formattedAddress || result.displayName || `${area}, ${city}${pin ? ` - ${pin}` : ''}, India`;

    setLocationComponents({
      houseNumber: result.houseNumber || '',
      building: result.building || '',
      street: result.street || '',
      subLocality: result.subLocality || '',
      locality: result.locality || '',
      subdistrict: result.subdistrict || '',
      area,
      city,
      district: result.district || '',
      state,
      pincode: pin,
      formattedAddress: formatted,
      latitude: lat,
      longitude: lng
    });

    setCurrentView('location_picker');
  };

  // "Use Current Location" in Location Picker (smoothly moves map to GPS coordinates and reverse geocodes)
  const handleUseCurrentLocationInPicker = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });
        reverseGeocodeCoords(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError('Location permission denied. Please search your area or enter PIN code.');
        } else if (err.code === 2) {
          setGeoError('GPS position unavailable. Please search your area or PIN code.');
        } else {
          setGeoError('Location request timed out. Please search your area or PIN code.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Step 1: "Use Current Location" handler
  const handleStep1UseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedCoords({ lat: latitude, lng: longitude });
        reverseGeocodeCoords(latitude, longitude);
        setIsLocating(false);
        setCurrentView('location_picker');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError('Location permission denied. Please search your area or enter PIN code below.');
        } else if (err.code === 2) {
          setGeoError('GPS position unavailable. Please search your area or PIN code below.');
        } else {
          setGeoError('Location request timed out. Please search your area or PIN code below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Step 1: Search Result Select
  const handleStep1SelectSearchResult = (result: any) => {
    setSearchQuery('');
    setSearchResults([]);
    handleSelectSuggestion(result);
  };

  // Step 2: Picker Search Result Select
  const handlePickerSelectSearchResult = (result: any) => {
    setPickerSearchQuery('');
    setPickerSearchResults([]);
    handleSelectSuggestion(result);
  };

  // Step 3 Section 3: Select Saved Address (Immediately makes it active & re-runs PIN serviceability)
  const handleSelectSavedAddress = (addr: Address) => {
    selectAddress({
      id: addr.id,
      city: addr.city,
      postalCode: addr.postalCode || addr.zipCode,
      zipCode: addr.zipCode || addr.postalCode,
      locality: addr.locality,
      street: addr.street || addr.addressLine1,
      state: addr.state,
      latitude: (addr as any).latitude,
      longitude: (addr as any).longitude,
      formattedAddress: addr.formattedAddress || addr.address,
      addressName: addr.addressType === 'work' ? 'Work' : addr.addressType === 'other' ? (addr.customAddressType || 'Other') : 'Home',
      addressType: (addr.addressType as any) || 'home',
      customAddressType: addr.customAddressType,
      fullName: addr.fullName,
      phone: addr.phone,
      landmark: addr.landmark
    });
    closeLocationModal();
  };

  // Step 3 Section 5: Edit Address Action
  const handleEditSavedAddress = (addr: Address) => {
    setEditingAddressId(addr.id || null);

    const flatVal = addr.addressLine1 || addr.street?.split(',')?.[0] || addr.street || '';
    const areaVal = addr.locality || addr.addressLine2 || '';
    const cleanPhone = (addr.phone || '').replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10);
    const cleanPin = (addr.postalCode || addr.zipCode || '').trim().replace(/\D/g, '').slice(0, 6);

    setFormState({
      fullName: addr.fullName || '',
      phone: cleanPhone,
      flat: flatVal,
      area: areaVal,
      landmark: addr.landmark || '',
      pincode: cleanPin,
      city: addr.city || '',
      district: addr.district || '',
      state: addr.state || 'Karnataka',
      addressType: (addr.addressType as any) || 'home',
      customAddressType: addr.customAddressType || ''
    });

    const lat = (addr as any).latitude || location.latitude || 12.9716;
    const lng = (addr as any).longitude || location.longitude || 77.5946;

    setSelectedCoords({ lat, lng });

    setLocationComponents({
      houseNumber: flatVal,
      building: addr.landmark || '',
      street: addr.street || '',
      subLocality: '',
      locality: addr.locality || '',
      area: areaVal,
      city: addr.city || '',
      district: addr.district || '',
      state: addr.state || 'Karnataka',
      pincode: cleanPin,
      formattedAddress: addr.formattedAddress || addr.address || `${flatVal ? `${flatVal}, ` : ''}${areaVal}, ${addr.city}`,
      latitude: lat,
      longitude: lng
    });

    // Check serviceability of saved PIN immediately
    if (cleanPin.length === 6 && isValidPincode(cleanPin)) {
      const cov = isPincodeServiceable(cleanPin, settings.shipping?.deliveryCoverage);
      if (cov.serviceable) {
        setPinCheckResult({ status: 'serviceable', message: `Delivery available (${cov.deliveryType} Delivery)` });
      } else {
        setPinCheckResult({ status: 'unserviceable', message: cov.reason || `Delivery unavailable for PIN ${cleanPin}` });
      }
    } else {
      setPinCheckResult(null);
    }

    setInlineErrors({});
    setFormError('');
    setCurrentView('address_form');
  };

  // Step 3 Section 6: Delete Saved Address
  const handleDeleteSavedAddress = async (addr: Address) => {
    if (!user || !user.uid || !addr.id) return;
    setDeletingId(addr.id);
    try {
      let deletedViaClient = false;
      if (auth.currentUser && auth.currentUser.uid === user.uid) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'addresses', addr.id));
          deletedViaClient = true;
        } catch {}
      }

      if (!deletedViaClient) {
        const token = await getIdToken();
        await fetch(`/api/user/addresses/${addr.id}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      }

      setSavedAddresses(prev => prev.filter(a => a.id !== addr.id));
      setConfirmDeleteAddress(null);

      // If the deleted address was active, automatically select another saved address if available
      const wasActive = location.addressId === addr.id || 
        (!location.addressId && location.pincode === (addr.postalCode || addr.zipCode));

      if (wasActive) {
        const remaining = savedAddresses.filter(a => a.id !== addr.id);
        if (remaining.length > 0) {
          const nextActive = remaining[0];
          handleSelectSavedAddress(nextActive);
        } else {
          // Clear active address safely to default city
          selectPincode('560001', 'Bengaluru', 'Central Bengaluru', 'Karnataka');
        }
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Transition from Location Confirmation to Personal Details Form
  const handleConfirmLocationAndContinue = () => {
    setEditingAddressId(null);
    const rawAuthPhone = user?.phoneNumber || firebaseUser?.phoneNumber || '';
    const cleanAuthPhone = rawAuthPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10);
    const detectedPin = (locationComponents.pincode || '').replace(/\D/g, '').slice(0, 6);

    setFormState({
      fullName: user?.displayName || firebaseUser?.displayName || '',
      phone: cleanAuthPhone,
      flat: locationComponents.houseNumber || '',
      area: locationComponents.area || locationComponents.locality || locationComponents.subLocality || locationComponents.street || '',
      landmark: locationComponents.building && locationComponents.building !== locationComponents.street && locationComponents.building !== locationComponents.houseNumber ? locationComponents.building : '',
      pincode: detectedPin,
      city: locationComponents.city || '',
      district: locationComponents.district || '',
      state: locationComponents.state || 'Karnataka',
      addressType: 'home',
      customAddressType: ''
    });

    if (detectedPin.length === 6 && isValidPincode(detectedPin)) {
      const cov = isPincodeServiceable(detectedPin, settings.shipping?.deliveryCoverage);
      if (cov.serviceable) {
        setPinCheckResult({ status: 'serviceable', message: `Delivery available (${cov.deliveryType} Delivery)` });
      } else {
        setPinCheckResult({ status: 'unserviceable', message: cov.reason || `Delivery unavailable for PIN ${detectedPin}` });
      }
    } else {
      setPinCheckResult(null);
    }

    setInlineErrors({});
    setFormError('');
    setCurrentView('address_form');
  };

  // Real-time phone number handling: rejects non-digits and allows up to 10 digits
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setFormState(prev => ({ ...prev, phone: clean }));
    if (inlineErrors.phone) {
      setInlineErrors(prev => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const handlePhoneBlur = () => {
    const clean = formState.phone.trim();
    if (!clean) {
      setInlineErrors(prev => ({ ...prev, phone: 'Mobile number is required.' }));
    } else if (clean.length !== 10 || !/^[6-9]\d{9}$/.test(clean)) {
      setInlineErrors(prev => ({ ...prev, phone: 'Please enter a valid 10-digit Indian mobile number.' }));
    }
  };

  // Real-time PIN handling with automatic delivery-serviceability verification
  const handlePinChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setFormState(prev => ({ ...prev, pincode: clean }));

    if (inlineErrors.pincode) {
      setInlineErrors(prev => {
        const next = { ...prev };
        delete next.pincode;
        return next;
      });
    }

    if (clean.length === 6) {
      if (!isValidPincode(clean)) {
        setPinCheckResult({ status: 'invalid', message: 'PIN code must start with 1-9 and be 6 digits.' });
        setInlineErrors(prev => ({ ...prev, pincode: 'Please enter a valid 6-digit Indian PIN code.' }));
      } else {
        const coverage = isPincodeServiceable(clean, settings.shipping?.deliveryCoverage);
        if (coverage.serviceable) {
          setPinCheckResult({
            status: 'serviceable',
            message: `Delivery available (${coverage.deliveryType} Delivery)`
          });
        } else {
          setPinCheckResult({
            status: 'unserviceable',
            message: coverage.reason || `Delivery is currently unavailable to PIN code ${clean}.`
          });
          setInlineErrors(prev => ({ ...prev, pincode: coverage.reason || `Delivery is currently unavailable for PIN code ${clean}.` }));
        }

        // Try looking up geographic area/city if blank
        try {
          const lookup = await lookupPincode(clean);
          if (lookup.success && lookup.state) {
            setFormState(prev => ({
              ...prev,
              city: prev.city || lookup.city || lookup.district || '',
              district: prev.district || lookup.district || '',
              state: prev.state || lookup.state || 'Karnataka'
            }));
          }
        } catch (e) {
          // ignore lookup error
        }
      }
    } else {
      setPinCheckResult(null);
    }
  };

  // Final "Save Address" Handler with strict validations and friendly error handling
  const handleFinalSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const errors: Record<string, string> = {};

    const cleanFullName = formState.fullName.trim();
    if (!cleanFullName) {
      errors.fullName = 'Full Name is required.';
    } else if (cleanFullName.length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters.';
    }

    const cleanPhone = formState.phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      errors.phone = 'Mobile Number is required.';
    } else if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    const cleanFlat = formState.flat.trim();
    if (!cleanFlat) {
      errors.flat = 'Flat / House / Building is required.';
    }

    const cleanArea = formState.area.trim();
    if (!cleanArea) {
      errors.area = 'Area / Locality is required.';
    }

    const cleanPin = formState.pincode.trim().replace(/\D/g, '').slice(0, 6);
    if (!cleanPin) {
      errors.pincode = 'PIN Code is required.';
    } else if (cleanPin.length !== 6 || !isValidPincode(cleanPin)) {
      errors.pincode = 'Please enter a valid 6-digit Indian PIN code.';
    } else {
      const coverage = isPincodeServiceable(cleanPin, settings.shipping?.deliveryCoverage);
      if (!coverage.serviceable) {
        errors.pincode = coverage.reason || `Delivery is currently unavailable for PIN code ${cleanPin}.`;
      }
    }

    const cleanCity = formState.city.trim();
    if (!cleanCity) {
      errors.city = 'City is required.';
    }

    const cleanState = formState.state.trim();
    if (!cleanState) {
      errors.state = 'State is required.';
    }

    if (formState.addressType === 'other' && !formState.customAddressType.trim()) {
      errors.customAddressType = 'Please enter address name (e.g. Studio, Parents\' Home).';
    }

    if (Object.keys(errors).length > 0) {
      setInlineErrors(errors);
      setFormError('Please fill in all required fields correctly before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const addrParts: string[] = [];
      const seen = new Set<string>();
      const add = (val?: string) => {
        if (!val) return;
        const clean = val.replace(/^[,\s-]+|[,\s-]+$/g, '').trim();
        if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') return;
        const l = clean.toLowerCase();
        if (seen.has(l) || Array.from(seen).some(s => s === l || (s.length > 3 && l.includes(s)))) return;
        seen.add(l);
        addrParts.push(clean);
      };

      add(cleanFlat);
      add(cleanArea);
      if (formState.landmark.trim()) add(`Near ${formState.landmark.trim()}`);
      add(cleanCity);
      if (formState.district.trim() && formState.district.trim().toLowerCase() !== cleanCity.toLowerCase()) {
        add(formState.district.trim());
      }
      add(`${cleanState} - ${cleanPin}`);
      add('India');

      const completeAddress = addrParts.join(', ');

      let savedId: string | undefined = editingAddressId || undefined;

      // Check auth initialization timing
      if (authLoading) {
        await new Promise(r => setTimeout(r, 400));
      }

      // Authoritative authenticated customer check
      const activeCustomer = user || (firebaseUser ? { uid: firebaseUser.uid, displayName: firebaseUser.displayName, phoneNumber: firebaseUser.phoneNumber } : null);
      if (!activeCustomer || !activeCustomer.uid) {
        setFormError('Please ensure you are logged in to save an address to your account.');
        setIsSaving(false);
        return;
      }

      const addressPayload: Partial<Address> = {
        fullName: cleanFullName,
        phone: cleanPhone,
        street: `${cleanFlat}, ${cleanArea}`,
        addressLine1: cleanFlat,
        addressLine2: cleanArea,
        address: completeAddress,
        formattedAddress: completeAddress,
        locality: cleanArea,
        city: cleanCity,
        district: formState.district.trim() || '',
        state: cleanState,
        postalCode: cleanPin,
        zipCode: cleanPin,
        pincode: cleanPin,
        country: 'India',
        landmark: formState.landmark.trim(),
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        addressType: formState.addressType,
        customAddressType: formState.addressType === 'other' ? formState.customAddressType.trim() : '',
        updatedAt: serverTimestamp(),
      };

      let savedSuccessfully = false;

      // 1. Try direct Firestore write if Firebase Auth user is signed in with matching UID
      if (auth.currentUser && auth.currentUser.uid === activeCustomer.uid) {
        try {
          if (editingAddressId) {
            await updateDoc(doc(db, 'users', activeCustomer.uid, 'addresses', editingAddressId), addressPayload);
          } else {
            (addressPayload as any).isDefault = savedAddresses.length === 0;
            (addressPayload as any).createdAt = serverTimestamp();
            const docRef = await addDoc(collection(db, 'users', activeCustomer.uid, 'addresses'), addressPayload);
            savedId = docRef.id;
          }
          savedSuccessfully = true;
        } catch (directWriteErr: any) {
          console.warn('Direct Firestore write notice, falling back to authenticated API route:', directWriteErr?.message || directWriteErr);
        }
      }

      // 2. Authoritative fallback through backend API with verified Bearer token
      if (!savedSuccessfully) {
        const token = await getIdToken();
        const authToken = token || (activeCustomer.uid ? `local-token-${activeCustomer.uid}` : null);
        const endpoint = editingAddressId ? `/api/user/addresses/${editingAddressId}` : '/api/user/addresses';
        const method = editingAddressId ? 'PUT' : 'POST';

        const cleanApiPayload = {
          fullName: cleanFullName,
          phone: cleanPhone,
          flatHouseBuilding: cleanFlat,
          areaStreetSector: cleanArea,
          street: `${cleanFlat}, ${cleanArea}`,
          locality: cleanArea,
          city: cleanCity,
          district: formState.district.trim() || '',
          state: cleanState,
          postalCode: cleanPin,
          zipCode: cleanPin,
          pincode: cleanPin,
          country: 'India',
          landmark: formState.landmark.trim(),
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lng,
          addressType: formState.addressType,
          customAddressType: formState.addressType === 'other' ? formState.customAddressType.trim() : '',
          isDefault: editingAddressId ? undefined : (savedAddresses.length === 0)
        };

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(cleanApiPayload)
        });

        const resData = await res.json().catch(() => null);
        if (!res.ok || !resData?.success) {
          if (res.status === 401) {
            throw new Error('Please ensure you are logged in to save an address.');
          }
          throw new Error(resData?.error || 'Failed to save address. Please try again.');
        }

        savedId = resData.id || editingAddressId || undefined;
        savedSuccessfully = true;
      }

      // Update active delivery location
      selectAddress({
        id: savedId,
        city: cleanCity,
        postalCode: cleanPin,
        zipCode: cleanPin,
        locality: cleanArea,
        street: `${cleanFlat}, ${cleanArea}`,
        state: cleanState,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        formattedAddress: completeAddress,
        addressName: formState.addressType === 'work' ? 'Work' : formState.addressType === 'other' ? (formState.customAddressType.trim() || 'Other') : 'Home',
        addressType: formState.addressType,
        customAddressType: formState.customAddressType.trim(),
        fullName: cleanFullName,
        phone: cleanPhone,
        landmark: formState.landmark.trim()
      });

      closeLocationModal();
    } catch (err: any) {
      console.error('Error saving address:', err);
      let friendlyMsg = 'Failed to save address. Please check your internet connection and try again.';
      if (err?.message?.includes('logged in')) {
        friendlyMsg = user ? 'Unable to verify login session. Please try again.' : 'Unable to save address. Please ensure you are logged in.';
      } else if (err?.code === 'unavailable' || err?.message?.toLowerCase().includes('network')) {
        friendlyMsg = 'Network connection issue. Please check your internet connection and try again.';
      } else if (err?.message && !err.message.includes('Firebase') && !err.message.includes('firestore')) {
        friendlyMsg = err.message;
      }
      setFormError(friendlyMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLocationModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={closeLocationModal}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div 
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col h-[94dvh] sm:h-auto max-h-[96dvh] sm:max-h-[88vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overscroll-contain relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Fixed Header (Always visible above all scrolling layers, safe-area aware) */}
        <div className="sticky top-0 z-30 pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-3 px-4 sm:px-5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs shrink-0 flex flex-col gap-2">
          {/* Mobile Swipe / Drag Handle Indicator */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden shrink-0 -mt-0.5" />

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentView === 'location_picker' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView('list');
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 z-40 active:scale-95"
                  aria-label="Back to location list"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : currentView === 'address_form' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView(editingAddressId ? 'list' : 'location_picker');
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 z-40 active:scale-95"
                  aria-label="Back"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                  <MapPin size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1 pr-1">
                <h2 id="location-modal-title" className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                  <span className="truncate">
                    {currentView === 'location_picker' 
                      ? 'Add delivery address' 
                      : currentView === 'address_form' 
                      ? (editingAddressId ? 'Edit delivery address' : 'Add delivery address')
                      : 'Choose Delivery Location'}
                  </span>
                  {currentView !== 'list' && (
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {currentView === 'location_picker' ? 'STEP 2: MAP' : (editingAddressId ? 'Edit' : 'Step 2: Details')}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {currentView === 'location_picker'
                    ? 'Search or adjust pin on the map to pinpoint your location'
                    : currentView === 'address_form'
                    ? (editingAddressId ? 'Update your saved delivery address details' : 'Enter your address details and contact information')
                    : 'Select your active delivery address or add a new one'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLocationModal();
              }}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 z-40 active:scale-95"
              aria-label="Close delivery location modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Location Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4 flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
          {/* =========================================================================
              VIEW 1: SAVED ADDRESSES + ACTIVE DELIVERY ADDRESS (STEP 3)
              ========================================================================= */}
          {currentView === 'list' && (
            <div className="space-y-4">
              {/* 1. Search Location Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search area, street, locality or PIN code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Real Search Suggestions Dropdown */}
              {isSearching ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 size={15} className="animate-spin text-blue-600" />
                  <span>Searching locations across India...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden">
                  <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Location Suggestions
                  </div>
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleStep1SelectSearchResult(res)}
                      className="p-3.5 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-start gap-3 text-left border-b border-slate-100 last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900">{res.locality || res.street || res.city || 'Area'}</p>
                          {res.pincode && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                              PIN: {res.pincode}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words font-medium">
                          {res.formattedAddress || res.displayName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-600">
                  <p className="font-bold text-slate-800">No matching locations found for "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try searching with your 6-digit PIN code or area name.</p>
                </div>
              ) : null}

              {/* 2. "Use Current Location" (GPS) Button */}
              <button
                type="button"
                onClick={handleStep1UseCurrentLocation}
                disabled={isLocating}
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-between shadow-md shadow-blue-600/20 transition-all cursor-pointer group disabled:opacity-75"
              >
                <div className="flex items-center gap-3 text-left min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Navigation size={18} className={isLocating ? "animate-spin text-white" : "text-white"} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm block truncate">
                      {isLocating ? 'Detecting your device location...' : 'Use Current Location'}
                    </span>
                    <span className="text-[11px] text-blue-100 block truncate">
                      Using GPS • Tap to detect location on map
                    </span>
                  </div>
                </div>

                <ChevronRight size={18} className="text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
              </button>

              {/* GPS / Geolocation Error Message */}
              {geoError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{geoError}</span>
                </div>
              )}

              {/* 3. "+ Add New Address" Button (Opens Step 2 flow) */}
              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setCurrentView('location_picker');
                }}
                className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 transition-all flex items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Plus size={20} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                      + Add New Address
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      Select location on map & enter address details
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>

              {/* 4. SAVED ADDRESSES SECTION (Section 1, 2, 5, 6, 7) */}
              {user && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Home size={13} className="text-blue-600" /> Saved Delivery Addresses
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {savedAddresses.length} {savedAddresses.length === 1 ? 'Address' : 'Addresses'}
                    </span>
                  </div>

                  {loadingAddresses ? (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin text-blue-600" />
                      <span>Loading saved locations...</span>
                    </div>
                  ) : savedAddresses.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tap "+ Add New Address" above to save your Home, Work, or Custom address.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {savedAddresses.map((addr) => {
                        const isSelected = location.addressId === addr.id || 
                          (!location.addressId && location.pincode === (addr.postalCode || addr.zipCode));
                        
                        const labelText = addr.addressType === 'work'
                          ? 'Work'
                          : addr.addressType === 'other' && addr.customAddressType
                          ? addr.customAddressType
                          : (addr.addressType ? addr.addressType.charAt(0).toUpperCase() + addr.addressType.slice(1) : 'Home');

                        const fullAddrText = addr.formattedAddress || addr.address || [
                          addr.street || addr.addressLine1,
                          addr.addressLine2,
                          addr.locality,
                          addr.city,
                          addr.district && addr.district.toLowerCase() !== addr.city.toLowerCase() ? addr.district : '',
                          `${addr.state || ''}${addr.postalCode || addr.zipCode ? ` - ${addr.postalCode || addr.zipCode}` : ''}`,
                          addr.country || 'India'
                        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');

                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-3 text-left ${
                              isSelected
                                ? 'border-2 border-blue-600 bg-blue-50/70 shadow-xs'
                                : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {addr.addressType === 'work' ? (
                                  <Briefcase size={16} />
                                ) : addr.addressType === 'other' ? (
                                  <Building size={16} />
                                ) : (
                                  <Home size={16} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isSelected ? (
                                    <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Check size={12} strokeWidth={3} /> Delivering to {labelText}
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                      {labelText}
                                    </span>
                                  )}
                                  {addr.isDefault && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                      Default
                                    </span>
                                  )}
                                </div>

                                <div className="pt-0.5">
                                  <span className="text-xs font-black text-slate-900 block truncate">
                                    {addr.fullName || 'Customer'}
                                  </span>
                                  <p className="text-xs text-slate-700 leading-relaxed break-words font-medium mt-0.5">
                                    {fullAddrText}
                                  </p>
                                </div>

                                {addr.phone && (
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1 text-slate-600 font-mono font-medium">
                                      <Phone size={11} className="text-slate-400" />
                                      +91 {addr.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions: Deliver Here button (when not selected), Edit, Delete */}
                            <div className="flex items-center gap-1 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              {!isSelected && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectSavedAddress(addr)}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Deliver Here
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleEditSavedAddress(addr)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Edit address"
                                aria-label="Edit address"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAddress(addr)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                title="Delete address"
                                aria-label="Delete address"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Active Location Display for Guest Users */}
              {!user && location.pincode && (
                <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-900 block truncate">
                        {location.city} ({location.pincode})
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {location.area || 'Active Delivery Zone'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 2: STEP 2 — LOCATION SELECTION + MAP SELECTOR
              ========================================================================= */}
          {currentView === 'location_picker' && (
            <div className="space-y-4">
              {/* Search Location Input on Map Screen */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search area, locality, street or PIN code"
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white transition-colors"
                />
                {pickerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPickerSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Map Search Suggestions Dropdown */}
              {isPickerSearching ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span>Searching locations...</span>
                </div>
              ) : pickerSearchResults.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                  {pickerSearchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePickerSelectSearchResult(res)}
                      className="p-3 hover:bg-blue-50/70 cursor-pointer transition-colors flex items-start gap-2.5 text-left"
                    >
                      <MapPin size={15} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {res.locality || res.street || res.city || 'Area'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {res.formattedAddress || res.displayName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {geoError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-amber-600" />
                  <span>{geoError}</span>
                </div>
              )}

              {/* =========================================================================
                  GOOGLE MAPS INTERACTIVE VIEWPORT WITH FIXED CENTRAL PIN
                  Map moves underneath while the delivery pin stays precisely fixed
                  ========================================================================= */}
              <GoogleMapViewport
                selectedCoords={selectedCoords}
                isMapMoving={isMapMoving}
                setIsMapMoving={setIsMapMoving}
                isReverseGeocoding={isReverseGeocoding}
                isLocating={isLocating}
                onCameraSettled={(lat, lng) => {
                  setSelectedCoords({ lat, lng });
                  reverseGeocodeCoords(lat, lng);
                }}
                onUseCurrentLocation={handleUseCurrentLocationInPicker}
              />

              {/* =========================================================================
                  ADDRESS PREVIEW CARD OVER / BELOW THE MAP (Section 6)
                  ========================================================================= */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={16} className="text-blue-600 shrink-0" />
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {locationComponents.locality || locationComponents.area || locationComponents.city || 'Selected Location'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {locationComponents.formattedAddress || 'Locating address details...'}
                    </p>
                  </div>
                  {locationComponents.pincode && (
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg shadow-2xs shrink-0">
                      PIN: {locationComponents.pincode}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="truncate">
                    <span className="text-slate-400">Area:</span> <strong className="text-slate-800 font-semibold">{locationComponents.area || '—'}</strong>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400">City:</span> <strong className="text-slate-800 font-semibold">{locationComponents.city || '—'}</strong>
                  </div>
                  <div className="truncate hidden sm:block">
                    <span className="text-slate-400">State:</span> <strong className="text-slate-800 font-semibold">{locationComponents.state || '—'}</strong>
                  </div>
                </div>

                {!locationComponents.houseNumber && (
                  <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-100 rounded-lg p-2 font-medium">
                    ℹ️ Flat / House / Building details can be entered in the next step.
                  </p>
                )}

                {/* Actions: Cancel or Confirm Location (Proceeds to Step 2 Details) */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('list')}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 min-h-[44px] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLocationAndContinue}
                    disabled={isReverseGeocoding && !locationComponents.formattedAddress}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] active:scale-[0.99]"
                  >
                    <span>Confirm Location</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: STEP 5 — PERSONAL DETAILS & ADDRESS DETAILS FORM
              ========================================================================= */}
          {currentView === 'address_form' && (
            <form onSubmit={handleFinalSaveAddress} className="space-y-4">
              {/* Confirmed / Detected Location Summary Card */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-blue-600/20">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                        {editingAddressId ? 'Saved Location' : 'Detected Location'}
                      </span>
                      {locationComponents.pincode && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-blue-100/80 text-blue-800 rounded">
                          PIN: {locationComponents.pincode}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 leading-snug break-words">
                      {locationComponents.formattedAddress}
                    </p>
                    {!locationComponents.houseNumber && !editingAddressId && (
                      <p className="text-[11px] text-blue-700 font-medium pt-0.5">
                        Please provide Flat / House / Building details below.
                      </p>
                    )}
                  </div>
                </div>

                {!editingAddressId && (
                  <button
                    type="button"
                    onClick={() => setCurrentView('location_picker')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold shrink-0 cursor-pointer pt-0.5 flex items-center gap-1 hover:underline"
                  >
                    <span>Change on Map</span>
                  </button>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Personal Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formState.fullName}
                      onChange={(e) => {
                        setFormState(prev => ({ ...prev, fullName: e.target.value }));
                        if (inlineErrors.fullName) {
                          setInlineErrors(prev => {
                            const n = { ...prev };
                            delete n.fullName;
                            return n;
                          });
                        }
                      }}
                      onBlur={() => {
                        const clean = formState.fullName.trim();
                        if (!clean) {
                          setInlineErrors(prev => ({ ...prev, fullName: 'Full Name is required.' }));
                        } else if (clean.length < 2) {
                          setInlineErrors(prev => ({ ...prev, fullName: 'Full Name must be at least 2 characters.' }));
                        }
                      }}
                      className={`w-full pl-9 pr-3 py-2 border rounded-xl text-xs outline-none transition-colors bg-white ${
                        inlineErrors.fullName
                          ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {inlineErrors.fullName && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.fullName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[11px] font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formState.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      className={`w-full pl-11 pr-3 py-2 border rounded-xl text-xs font-mono outline-none transition-colors bg-white ${
                        inlineErrors.phone
                          ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {inlineErrors.phone && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Flat / House & Area / Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    Flat / House / Building <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Royal Palms, Block B"
                    value={formState.flat}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, flat: e.target.value }));
                      if (inlineErrors.flat) {
                        setInlineErrors(prev => {
                          const n = { ...prev };
                          delete n.flat;
                          return n;
                        });
                      }
                    }}
                    onBlur={() => {
                      if (!formState.flat.trim()) {
                        setInlineErrors(prev => ({ ...prev, flat: 'Flat / House / Building is required.' }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors bg-white ${
                      inlineErrors.flat
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {inlineErrors.flat && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.flat}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    Area / Locality <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Koramangala 4th Block"
                    value={formState.area}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, area: e.target.value }));
                      if (inlineErrors.area) {
                        setInlineErrors(prev => {
                          const n = { ...prev };
                          delete n.area;
                          return n;
                        });
                      }
                    }}
                    onBlur={() => {
                      if (!formState.area.trim()) {
                        setInlineErrors(prev => ({ ...prev, area: 'Area / Locality is required.' }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors bg-white ${
                      inlineErrors.area
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {inlineErrors.area && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.area}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Landmark (Optional) */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">
                  Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Sony Signal / Opposite Metro Station"
                  value={formState.landmark}
                  onChange={(e) => setFormState(prev => ({ ...prev, landmark: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 bg-white"
                />
              </div>

              {/* 4. PIN Code, City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="560034"
                    value={formState.pincode}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition-colors bg-white ${
                      inlineErrors.pincode
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {pinCheckResult && (
                    <div className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${
                      pinCheckResult.status === 'serviceable' 
                        ? 'text-emerald-700' 
                        : 'text-rose-600'
                    }`}>
                      {pinCheckResult.status === 'serviceable' ? (
                        <Check size={12} className="shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle size={12} className="shrink-0 text-rose-600" />
                      )}
                      <span className="truncate">{pinCheckResult.message}</span>
                    </div>
                  )}
                  {inlineErrors.pincode && !pinCheckResult && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.pincode}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bengaluru"
                    value={formState.city}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, city: e.target.value }));
                      if (inlineErrors.city) {
                        setInlineErrors(prev => {
                          const n = { ...prev };
                          delete n.city;
                          return n;
                        });
                      }
                    }}
                    onBlur={() => {
                      if (!formState.city.trim()) {
                        setInlineErrors(prev => ({ ...prev, city: 'City is required.' }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-medium outline-none transition-colors bg-white ${
                      inlineErrors.city
                        ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {inlineErrors.city && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.city}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formState.state}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, state: e.target.value }));
                      if (inlineErrors.state) {
                        setInlineErrors(prev => {
                          const n = { ...prev };
                          delete n.state;
                          return n;
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-blue-600 bg-white cursor-pointer truncate"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {inlineErrors.state && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{inlineErrors.state}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Address Type: "Save address as" (Home, Work, Other) */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">
                  Save address as <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, addressType: 'home' }))}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formState.addressType === 'home'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Home size={14} /> Home
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, addressType: 'work' }))}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formState.addressType === 'work'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase size={14} /> Work
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, addressType: 'other' }))}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formState.addressType === 'other'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building size={14} /> Other
                  </button>
                </div>

                {/* Custom Name Field when 'Other' is selected */}
                {formState.addressType === 'other' && (
                  <div className="mt-2.5 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Enter address name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Parents' Home, Office 2, Studio"
                      value={formState.customAddressType}
                      onChange={(e) => {
                        setFormState(prev => ({ ...prev, customAddressType: e.target.value }));
                        if (inlineErrors.customAddressType) {
                          setInlineErrors(prev => {
                            const n = { ...prev };
                            delete n.customAddressType;
                            return n;
                          });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors bg-white ${
                        inlineErrors.customAddressType
                          ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                          : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                    {inlineErrors.customAddressType && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{inlineErrors.customAddressType}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Cancel and Save Address (Clearly visible & accessible) */}
              <div className="pt-4 pb-2 mt-6 border-t border-slate-200 flex items-center gap-3 bg-white">
                <button
                  type="button"
                  onClick={() => setCurrentView(editingAddressId ? 'list' : 'location_picker')}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[44px] active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] active:scale-[0.99]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer (Step 1 List View) */}
        {currentView === 'list' && (
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <span className="text-[11px] text-slate-500 truncate">
                Active: <strong className="text-slate-900">{location.city} ({location.pincode})</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={closeLocationModal}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Delete Address Confirmation Dialog (Section 6) */}
      {confirmDeleteAddress && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmDeleteAddress(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Delete this address?</h4>
                <p className="text-xs text-slate-500 truncate">
                  {confirmDeleteAddress.addressType === 'other' ? confirmDeleteAddress.customAddressType || 'Other' : confirmDeleteAddress.addressType?.toUpperCase()} · {confirmDeleteAddress.city} ({confirmDeleteAddress.postalCode || confirmDeleteAddress.zipCode})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this address? If this address is currently active, another saved address will automatically be selected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteAddress(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteAddress.id}
                onClick={() => handleDeleteSavedAddress(confirmDeleteAddress)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingId === confirmDeleteAddress.id && <Loader2 size={13} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
