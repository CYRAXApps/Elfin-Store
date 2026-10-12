export interface PostOfficeInfo {
  name: string;
  branchType?: string;
  deliveryStatus?: string;
  district: string;
  division?: string;
  block?: string;
  state: string;
  circle?: string;
  region?: string;
}

export interface PincodeLookupResponse {
  success: boolean;
  pincode: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  areaOptions?: string[];
  postOffices: PostOfficeInfo[];
  selectedPostOffice?: PostOfficeInfo;
  message?: string;
  error?: string;
  notFound?: boolean;
}

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

// Mapping of alternate/historical state names to standard names
const STATE_MAP: Record<string, string> = {
  'orissa': 'Odisha',
  'uttaranchal': 'Uttarakhand',
  'pondicherry': 'Puducherry',
  'nct of delhi': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  'new delhi': 'Delhi',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman & nicobar': 'Andaman and Nicobar Islands',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  'kashmir': 'Jammu and Kashmir',
  'chattisgarh': 'Chhattisgarh',
  'chhattisgarh': 'Chhattisgarh',
  'tamilnadu': 'Tamil Nadu',
  'tamil nadu': 'Tamil Nadu',
  'west bengal': 'West Bengal',
  'bengal': 'West Bengal',
  'wb': 'West Bengal',
  'karnataka': 'Karnataka',
  'maharashtra': 'Maharashtra',
  'gujarat': 'Gujarat',
  'rajasthan': 'Rajasthan',
  'uttar pradesh': 'Uttar Pradesh',
  'up': 'Uttar Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'mp': 'Madhya Pradesh',
  'bihar': 'Bihar',
  'telangana': 'Telangana',
  'andhra pradesh': 'Andhra Pradesh',
  'ap': 'Andhra Pradesh',
  'kerala': 'Kerala',
  'punjab': 'Punjab',
  'haryana': 'Haryana',
  'assam': 'Assam',
  'jharkhand': 'Jharkhand',
  'himachal pradesh': 'Himachal Pradesh',
  'hp': 'Himachal Pradesh',
  'tripura': 'Tripura',
  'meghalaya': 'Meghalaya',
  'manipur': 'Manipur',
  'nagaland': 'Nagaland',
  'goa': 'Goa',
  'arunachal pradesh': 'Arunachal Pradesh',
  'mizoram': 'Mizoram',
  'sikkim': 'Sikkim',
  'chandigarh': 'Chandigarh',
  'ladakh': 'Ladakh',
  'lakshadweep': 'Lakshadweep'
};

export function normalizeStateName(rawState?: string): string {
  if (!rawState) return '';
  const cleaned = rawState.trim();
  const lower = cleaned.toLowerCase();

  if (STATE_MAP[lower]) {
    return STATE_MAP[lower];
  }

  const directMatch = INDIAN_STATES.find(s => s.toLowerCase() === lower);
  if (directMatch) return directMatch;

  const partialMatch = INDIAN_STATES.find(s => 
    s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  return cleaned;
}

/**
 * Extract clean city name from raw district.
 * Strictly uses the District name for all Indian PIN codes.
 * Does not use Postal Division or Post Office.
 */
export function extractCleanCity(primaryPo: any, allPo: any[] = []): string {
  if (!primaryPo) return '';

  const rawDistrict = (primaryPo.District || primaryPo.district || '').trim();

  if (rawDistrict && rawDistrict.toUpperCase() !== 'NA') {
    let cleanDist = rawDistrict;
    if (/^Bangalore/i.test(cleanDist)) return 'Bengaluru';
    if (/^Calcutta/i.test(cleanDist)) return 'Kolkata';
    if (/^Bombay/i.test(cleanDist)) return 'Mumbai';
    if (/^Madras/i.test(cleanDist)) return 'Chennai';
    if (/^Cochin/i.test(cleanDist)) return 'Kochi';
    if (/^Poona/i.test(cleanDist)) return 'Pune';
    if (/^Baroda/i.test(cleanDist)) return 'Vadodara';
    if (/^Trivandrum/i.test(cleanDist)) return 'Thiruvananthapuram';
    return cleanDist;
  }

  return rawDistrict || '';
}

/**
 * Extract clean Area name for "Apartment, Area, Sector, Village" field.
 * Priority:
 * 1. locality/area
 * 2. post office name
 * 3. village
 * 4. sub-district
 * 5. district
 */
export function extractCleanArea(primaryPo: any): string {
  if (!primaryPo) return '';

  const rawName = (primaryPo.Name || primaryPo.name || '').trim();
  const cleanName = rawName
    .replace(/\s*S\.O\s*$/i, '')
    .replace(/\s*B\.O\s*$/i, '')
    .replace(/\s*H\.O\s*$/i, '')
    .replace(/\s*G\.P\.O\.\s*$/i, '')
    .replace(/\s*Branch\s*$/i, '')
    .trim();

  if (cleanName && cleanName.length > 1) {
    return cleanName;
  }

  const rawBlock = (primaryPo.Block || primaryPo.block || '').trim();
  if (rawBlock && rawBlock.toUpperCase() !== 'NA') {
    return rawBlock;
  }

  return cleanName || rawName;
}

// In-memory client cache to prevent repetitive network lookups
const clientPincodeCache = new Map<string, PincodeLookupResponse>();

/**
 * Validates a 6-digit Indian PIN code format.
 * Must be exactly 6 numeric digits, starting with 1-9.
 */
export function isValidPincode(pin: string): boolean {
  if (!pin) return false;
  const clean = pin.trim().replace(/\D/g, '');
  return clean.length === 6 && /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Look up location information for a 6-digit Indian PIN code.
 * Checks client memory cache, tries the backend proxy endpoint,
 * and falls back to the public postal API with robust parsing and error reporting.
 */
export async function lookupPincode(pincode: string, signal?: AbortSignal): Promise<PincodeLookupResponse> {
  const cleanPin = (pincode || '').trim().replace(/\D/g, '');

  if (!cleanPin || cleanPin.length !== 6) {
    return {
      success: false,
      pincode: cleanPin,
      postOffices: [],
      error: 'Please enter a valid 6-digit PIN code.'
    };
  }

  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return {
      success: false,
      pincode: cleanPin,
      postOffices: [],
      error: 'PIN code must be 6 digits and start with 1-9.'
    };
  }

  // Check client memory cache
  if (clientPincodeCache.has(cleanPin)) {
    return clientPincodeCache.get(cleanPin)!;
  }

  // Try 1: Call our server proxy endpoint
  try {
    const fetchSignal = signal || (AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined);
    const res = await fetch(`/api/pincode/${cleanPin}`, {
      headers: { 'Accept': 'application/json' },
      signal: fetchSignal
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.state) {
        const result: PincodeLookupResponse = {
          success: true,
          pincode: cleanPin,
          state: normalizeStateName(data.state),
          district: data.district || '',
          city: data.city || data.district || '',
          locality: data.locality || '',
          areaOptions: Array.isArray(data.areaOptions) ? data.areaOptions : (data.locality ? [data.locality] : []),
          postOffices: Array.isArray(data.postOffices) ? data.postOffices : [],
          selectedPostOffice: data.selectedPostOffice || (data.postOffices && data.postOffices[0]),
          message: data.message || `Address located: ${data.city || data.district}, ${data.state}`
        };
        clientPincodeCache.set(cleanPin, result);
        return result;
      } else if (data.notFound || (data.error && data.error.includes('not found'))) {
        const notFoundResult: PincodeLookupResponse = {
          success: false,
          pincode: cleanPin,
          notFound: true,
          postOffices: [],
          error: 'PIN code not found. Please check the PIN code.'
        };
        return notFoundResult;
      }
    }
  } catch (serverErr: any) {
    if (serverErr?.name === 'AbortError') {
      throw serverErr;
    }
    // Proceed to direct postal API fallback
  }

  // Try 2: Direct public postal API fallback
  try {
    const fetchSignal = signal || (AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined);
    const directRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: fetchSignal
    });

    if (!directRes.ok) {
      throw new Error(`Postal API responded with HTTP ${directRes.status}`);
    }

    const payload = await directRes.json();
    if (!Array.isArray(payload) || payload.length === 0) {
      throw new Error('Invalid response format');
    }

    const firstEntry = payload[0];
    if (firstEntry.Status !== 'Success' || !Array.isArray(firstEntry.PostOffice) || firstEntry.PostOffice.length === 0) {
      return {
        success: false,
        pincode: cleanPin,
        notFound: true,
        postOffices: [],
        error: 'PIN code not found. Please check the PIN code.'
      };
    }

    const rawPostOffices = firstEntry.PostOffice;
    const postOffices: PostOfficeInfo[] = rawPostOffices.map((po: any) => ({
      name: (po.Name || '').trim(),
      branchType: po.BranchType || '',
      deliveryStatus: po.DeliveryStatus || '',
      district: (po.District || '').trim(),
      division: po.Division || '',
      block: po.Block || '',
      state: normalizeStateName(po.State || ''),
      circle: po.Circle || '',
      region: po.Region || ''
    }));

    // Pick best matching primary post office: prefer Delivery Head Office or Delivery Sub Office
    const primaryPo = 
      rawPostOffices.find((p: any) => p.DeliveryStatus === 'Delivery' && /Head/i.test(p.BranchType)) ||
      rawPostOffices.find((p: any) => p.DeliveryStatus === 'Delivery') ||
      rawPostOffices[0];

    const normalizedState = normalizeStateName(primaryPo.State || rawPostOffices[0]?.State);
    const city = extractCleanCity(primaryPo, rawPostOffices);
    const area = extractCleanArea(primaryPo);

    // Extract distinct area options
    const areaSet = new Set<string>();
    if (area) areaSet.add(area);
    rawPostOffices.forEach((p: any) => {
      const a = extractCleanArea(p);
      if (a) areaSet.add(a);
    });
    const areaOptions = Array.from(areaSet);

    const result: PincodeLookupResponse = {
      success: true,
      pincode: cleanPin,
      state: normalizedState,
      district: primaryPo.District || '',
      city: city || primaryPo.District || '',
      locality: area,
      areaOptions,
      postOffices,
      selectedPostOffice: {
        name: primaryPo.Name || '',
        branchType: primaryPo.BranchType || '',
        deliveryStatus: primaryPo.DeliveryStatus || '',
        district: primaryPo.District || '',
        state: normalizedState
      },
      message: `Address located: ${city || primaryPo.District}, ${normalizedState}`
    };

    clientPincodeCache.set(cleanPin, result);
    return result;
  } catch (networkErr: any) {
    if (networkErr?.name === 'AbortError') {
      throw networkErr;
    }
    console.warn('Postal API lookup failed:', networkErr);
    return {
      success: false,
      pincode: cleanPin,
      postOffices: [],
      error: 'Unable to fetch address. Please enter the address manually.'
    };
  }
}

/**
 * Cleanly formats a full Indian address with all available components:
 * House/Flat/Building, Street/Road, Area/Locality, Post Office, City, District, State, PIN Code, Landmark.
 */
export function formatFullAddressString(addr?: {
  fullName?: string;
  phone?: string;
  street?: string;
  addressLine2?: string;
  locality?: string;
  postOffice?: string;
  city?: string;
  district?: string;
  state?: string;
  zipCode?: string;
  postalCode?: string;
  landmark?: string;
}): string {
  if (!addr) return '';
  const parts: string[] = [];
  if (addr.street) parts.push(addr.street);
  if (addr.addressLine2) parts.push(addr.addressLine2);
  if (addr.locality && addr.locality !== addr.addressLine2) parts.push(addr.locality);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  const pin = addr.zipCode || addr.postalCode;
  if (pin) parts.push(pin);
  if (addr.landmark) parts.push(`(Landmark: ${addr.landmark})`);
  return parts.filter(Boolean).join(', ');
}
