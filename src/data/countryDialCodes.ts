export interface CountryDialCode {
  code: string;      // ISO 3166-1 alpha-2 (e.g., 'IN')
  name: string;      // Full country name (e.g., 'India')
  dialCode: string;  // International dial code (e.g., '+91')
  format: string;    // Display placeholder / format (e.g., '98765 43210')
  maxDigits: number; // Maximum phone digits (excluding country code)
  minDigits: number; // Minimum phone digits (excluding country code)
  emoji: string;     // Unicode flag emoji
}

export const POPULAR_COUNTRY_CODES: CountryDialCode[] = [
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    format: '98765 43210',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇮🇳'
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    format: '(555) 000-0000',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇺🇸'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    format: '7911 123456',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇬🇧'
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    format: '50 123 4567',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇦🇪'
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    format: '(555) 000-0000',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇨🇦'
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    format: '412 345 678',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇦🇺'
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    format: '8123 4567',
    maxDigits: 8,
    minDigits: 8,
    emoji: '🇸🇬'
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    format: '151 23456789',
    maxDigits: 11,
    minDigits: 10,
    emoji: '🇩🇪'
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    format: '6 12 34 56 78',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇫🇷'
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    format: '50 123 4567',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇸🇦'
  },
  {
    code: 'QA',
    name: 'Qatar',
    dialCode: '+974',
    format: '3312 3456',
    maxDigits: 8,
    minDigits: 8,
    emoji: '🇶🇦'
  },
  {
    code: 'KW',
    name: 'Kuwait',
    dialCode: '+965',
    format: '9123 4567',
    maxDigits: 8,
    minDigits: 8,
    emoji: '🇰🇼'
  },
  {
    code: 'OM',
    name: 'Oman',
    dialCode: '+968',
    format: '9123 4567',
    maxDigits: 8,
    minDigits: 8,
    emoji: '🇴🇲'
  },
  {
    code: 'BH',
    name: 'Bahrain',
    dialCode: '+973',
    format: '3612 3456',
    maxDigits: 8,
    minDigits: 8,
    emoji: '🇧🇭'
  },
  {
    code: 'NP',
    name: 'Nepal',
    dialCode: '+977',
    format: '984 1234567',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇳🇵'
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    dialCode: '+880',
    format: '1712 345678',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇧🇩'
  },
  {
    code: 'LK',
    name: 'Sri Lanka',
    dialCode: '+94',
    format: '71 234 5678',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇱🇰'
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    format: '12 345 6789',
    maxDigits: 10,
    minDigits: 9,
    emoji: '🇲🇾'
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    format: '90 1234 5678',
    maxDigits: 10,
    minDigits: 10,
    emoji: '🇯🇵'
  },
  {
    code: 'KR',
    name: 'South Korea',
    dialCode: '+82',
    format: '10 1234 5678',
    maxDigits: 10,
    minDigits: 9,
    emoji: '🇰🇷'
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    format: '138 0000 0000',
    maxDigits: 11,
    minDigits: 11,
    emoji: '🇨🇳'
  },
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    format: '11 98765-4321',
    maxDigits: 11,
    minDigits: 10,
    emoji: '🇧🇷'
  },
  {
    code: 'ZA',
    name: 'South Africa',
    dialCode: '+27',
    format: '71 123 4567',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇿🇦'
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    format: '312 345 6789',
    maxDigits: 10,
    minDigits: 9,
    emoji: '🇮🇹'
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    format: '612 34 56 78',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇪🇸'
  },
  {
    code: 'NL',
    name: 'Netherlands',
    dialCode: '+31',
    format: '6 12345678',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇳🇱'
  },
  {
    code: 'CH',
    name: 'Switzerland',
    dialCode: '+41',
    format: '78 123 45 67',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇨🇭'
  },
  {
    code: 'SE',
    name: 'Sweden',
    dialCode: '+46',
    format: '70 123 45 67',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇸🇪'
  },
  {
    code: 'IE',
    name: 'Ireland',
    dialCode: '+353',
    format: '85 123 4567',
    maxDigits: 9,
    minDigits: 9,
    emoji: '🇮🇪'
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    dialCode: '+64',
    format: '21 123 4567',
    maxDigits: 9,
    minDigits: 8,
    emoji: '🇳🇿'
  }
];

export const DEFAULT_COUNTRY: CountryDialCode = POPULAR_COUNTRY_CODES[0]; // India (+91)
