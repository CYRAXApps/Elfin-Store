/**
 * Canonical PIN Code Service
 * 
 * Provides:
 * 1. Single authoritative Indian postal dataset interface (no fake or mathematically generated PIN codes).
 * 2. Exact 6-digit PIN-code lookup with complete post offices, locality, division, district, state.
 * 3. Individual PIN-level coverage decisions (serviceable/excluded, speed, COD).
 * 4. Cache-safe real-time evaluation with explicit scope bulk actions.
 */

import { lookupPincode, PincodeLookupResponse } from './pincodeService';
import { DeliveryCoverageConfig } from './indiaGeographicData';

export type DeliveryStatusEnum = 'DELIVERING' | 'EXCLUDED';
export type DeliverySpeedEnum = 'SAME_DAY' | 'EXPRESS' | 'STANDARD';

export interface CanonicalPincodeRecord {
  pincode: string; // Exactly 6 numeric digits
  state: string;
  district: string;
  division: string;
  region?: string;
  circle?: string;
  postOfficeNames: string[];
  localityNames: string[];
  deliveryStatus: DeliveryStatusEnum;
  deliverySpeed: DeliverySpeedEnum;
  codEnabled: boolean;
  source: string;
  updatedAt: string;
  transitDays?: number;
  isActive?: boolean;
}

export interface CanonicalLookupResult {
  success: boolean;
  pincode: string;
  notFound?: boolean;
  record?: CanonicalPincodeRecord;
  serviceable?: boolean;
  error?: string;
  message?: string;
}

export interface ServiceabilityEvaluation {
  serviceable: boolean;
  deliveryStatus: DeliveryStatusEnum;
  deliverySpeed: DeliverySpeedEnum;
  deliveryType: 'Standard' | 'Express' | 'SameDay';
  codAvailable: boolean;
  transitDays: number;
  reason?: string;
  pincode: string;
}

/**
 * Validates whether an input is a valid 6-digit Indian PIN code.
 */
export function validateIndianPincode(pin: string | number | null | undefined): {
  isValid: boolean;
  cleanPin: string;
  error?: string;
} {
  if (pin === undefined || pin === null || pin === '') {
    return { isValid: false, cleanPin: '', error: 'Please enter a 6-digit PIN code.' };
  }
  const cleanPin = String(pin).trim().replace(/\D/g, '');
  if (cleanPin.length !== 6) {
    return { isValid: false, cleanPin, error: 'Please enter a valid 6-digit PIN code.' };
  }
  if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return { isValid: false, cleanPin, error: 'PIN code must start with digits 1-9.' };
  }
  return { isValid: true, cleanPin };
}

/**
 * Evaluates whether a 6-digit PIN code is serviceable based on the store's coverage configuration.
 * Coverage is decided at the individual PIN-code level.
 */
export function evaluatePincodeServiceability(
  pincode: string | number,
  coverageConfig?: DeliveryCoverageConfig
): ServiceabilityEvaluation {
  const { isValid, cleanPin, error } = validateIndianPincode(pincode);

  if (!isValid || !cleanPin) {
    return {
      serviceable: false,
      deliveryStatus: 'EXCLUDED',
      deliverySpeed: 'STANDARD',
      deliveryType: 'Standard',
      codAvailable: false,
      transitDays: 3,
      reason: error || 'Please enter a valid 6-digit PIN code.',
      pincode: cleanPin || String(pincode)
    };
  }

  // If no coverage config is supplied, all valid PIN codes are deliverable by default
  if (!coverageConfig) {
    return {
      serviceable: true,
      deliveryStatus: 'DELIVERING',
      deliverySpeed: 'STANDARD',
      deliveryType: 'Standard',
      codAvailable: true,
      transitDays: 3,
      pincode: cleanPin
    };
  }

  const customRule = coverageConfig.pincodeRules?.[cleanPin];

  // 1. Whitelist Mode: Must be explicitly in activePincodes or rule.isActive === true
  if (coverageConfig.mode === 'only_selected') {
    const isExplicitlyActive =
      (customRule && (customRule.deliveryStatus === 'DELIVERING' || customRule.isActive === true)) ||
      (coverageConfig.activePincodes && coverageConfig.activePincodes.includes(cleanPin));

    if (!isExplicitlyActive) {
      return {
        serviceable: false,
        deliveryStatus: 'EXCLUDED',
        deliverySpeed: 'STANDARD',
        deliveryType: 'Standard',
        codAvailable: false,
        transitDays: 3,
        reason: 'Sorry, delivery is currently unavailable for this PIN code.',
        pincode: cleanPin
      };
    }
  } else {
    // 2. Blacklist Mode: All delivering EXCEPT explicitly excluded PIN codes
    const isExplicitlyExcluded =
      (customRule && (customRule.deliveryStatus === 'EXCLUDED' || customRule.isActive === false)) ||
      (coverageConfig.excludedPincodes && coverageConfig.excludedPincodes.includes(cleanPin));

    if (isExplicitlyExcluded) {
      return {
        serviceable: false,
        deliveryStatus: 'EXCLUDED',
        deliverySpeed: 'STANDARD',
        deliveryType: 'Standard',
        codAvailable: false,
        transitDays: 3,
        reason: 'Sorry, delivery is currently unavailable for this PIN code.',
        pincode: cleanPin
      };
    }
  }

  // Parse delivery speed
  let deliverySpeed: DeliverySpeedEnum = 'STANDARD';
  let deliveryType: 'Standard' | 'Express' | 'SameDay' = 'Standard';
  let transitDays = 3;

  if (customRule?.deliverySpeed === 'SAME_DAY' || customRule?.deliveryType === 'SameDay') {
    deliverySpeed = 'SAME_DAY';
    deliveryType = 'SameDay';
    transitDays = 1;
  } else if (customRule?.deliverySpeed === 'EXPRESS' || customRule?.deliveryType === 'Express') {
    deliverySpeed = 'EXPRESS';
    deliveryType = 'Express';
    transitDays = 2;
  }

  if (customRule?.transitDays) {
    transitDays = customRule.transitDays;
  }

  // COD is enabled unless explicitly turned off
  const codAvailable = customRule?.codEnabled !== undefined
    ? customRule.codEnabled
    : (customRule?.codAvailable !== undefined ? customRule.codAvailable : true);

  return {
    serviceable: true,
    deliveryStatus: 'DELIVERING',
    deliverySpeed,
    deliveryType,
    codAvailable,
    transitDays,
    pincode: cleanPin
  };
}

/**
 * Exact PIN Code Lookup against the authoritative India Post dataset.
 * Does NOT infer or generate fake records.
 */
export async function lookupExactCanonicalPincode(
  pincode: string | number,
  coverageConfig?: DeliveryCoverageConfig,
  signal?: AbortSignal
): Promise<CanonicalLookupResult> {
  const { isValid, cleanPin, error } = validateIndianPincode(pincode);

  if (!isValid || !cleanPin) {
    return {
      success: false,
      pincode: cleanPin || String(pincode),
      notFound: false,
      error: error || 'Please enter a valid 6-digit PIN code.'
    };
  }

  try {
    const rawLookup: PincodeLookupResponse = await lookupPincode(cleanPin, signal);

    if (!rawLookup.success || rawLookup.notFound || !rawLookup.postOffices || rawLookup.postOffices.length === 0) {
      return {
        success: false,
        pincode: cleanPin,
        notFound: true,
        error: 'PIN code not found.'
      };
    }

    const firstPo = rawLookup.selectedPostOffice || rawLookup.postOffices[0];
    const postOfficeNames = Array.from(new Set(rawLookup.postOffices.map((po) => po.name).filter(Boolean)));
    const localityNames = Array.from(
      new Set(
        rawLookup.postOffices
          .map((po) => po.block || (po as any).locality || '')
          .concat(rawLookup.areaOptions || [])
          .filter((loc) => Boolean(loc) && loc.toUpperCase() !== 'NA')
      )
    );

    // Evaluate coverage against store settings
    const evalResult = evaluatePincodeServiceability(cleanPin, coverageConfig);

    const canonicalRecord: CanonicalPincodeRecord = {
      pincode: cleanPin,
      state: firstPo.state || rawLookup.state || 'India',
      district: firstPo.district || rawLookup.district || rawLookup.city || '',
      division: firstPo.division || rawLookup.district || 'Division Area',
      region: firstPo.region || '',
      circle: firstPo.circle || '',
      postOfficeNames,
      localityNames: localityNames.length > 0 ? localityNames : postOfficeNames,
      deliveryStatus: evalResult.deliveryStatus,
      deliverySpeed: evalResult.deliverySpeed,
      codEnabled: evalResult.codAvailable,
      source: 'IndiaPost',
      updatedAt: new Date().toISOString(),
      transitDays: evalResult.transitDays,
      isActive: evalResult.serviceable
    };

    return {
      success: true,
      pincode: cleanPin,
      record: canonicalRecord,
      serviceable: evalResult.serviceable,
      message: evalResult.serviceable
        ? `Delivering to ${canonicalRecord.district}, ${canonicalRecord.state} (${evalResult.deliveryType} Delivery)`
        : `Sorry, delivery is currently unavailable for this PIN code.`
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    return {
      success: false,
      pincode: cleanPin,
      error: 'Unable to verify PIN code with postal network. Please retry.'
    };
  }
}
