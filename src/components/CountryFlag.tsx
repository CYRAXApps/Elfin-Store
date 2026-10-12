import React from 'react';

interface CountryFlagProps {
  code: string; // ISO 3166-1 alpha-2 (e.g., 'IN', 'US')
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ code, className = 'w-5 h-3.5' }) => {
  const upper = (code || '').toUpperCase();

  switch (upper) {
    case 'IN':
      // India Flag (Saffron, White, Green + Ashoka Chakra)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#FFFFFF" />
          <rect width="24" height="5.33" fill="#FF9933" />
          <rect y="10.67" width="24" height="5.33" fill="#128807" />
          <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.5" />
          <circle cx="12" cy="8" r="0.5" fill="#000080" />
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="12"
              y1="8"
              x2={12 + 2.1 * Math.cos((i * Math.PI) / 6)}
              y2={8 + 2.1 * Math.sin((i * Math.PI) / 6)}
              stroke="#000080"
              strokeWidth="0.25"
            />
          ))}
        </svg>
      );

    case 'US':
      // United States Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#B22234" />
          <rect y="1.23" width="24" height="1.23" fill="#FFFFFF" />
          <rect y="3.69" width="24" height="1.23" fill="#FFFFFF" />
          <rect y="6.15" width="24" height="1.23" fill="#FFFFFF" />
          <rect y="8.61" width="24" height="1.23" fill="#FFFFFF" />
          <rect y="11.07" width="24" height="1.23" fill="#FFFFFF" />
          <rect y="13.53" width="24" height="1.23" fill="#FFFFFF" />
          <rect width="10" height="8.6" fill="#3C3B6E" />
          <circle cx="2.5" cy="2.2" r="0.6" fill="#FFFFFF" />
          <circle cx="5" cy="2.2" r="0.6" fill="#FFFFFF" />
          <circle cx="7.5" cy="2.2" r="0.6" fill="#FFFFFF" />
          <circle cx="3.75" cy="4.3" r="0.6" fill="#FFFFFF" />
          <circle cx="6.25" cy="4.3" r="0.6" fill="#FFFFFF" />
          <circle cx="2.5" cy="6.4" r="0.6" fill="#FFFFFF" />
          <circle cx="5" cy="6.4" r="0.6" fill="#FFFFFF" />
          <circle cx="7.5" cy="6.4" r="0.6" fill="#FFFFFF" />
        </svg>
      );

    case 'GB':
      // United Kingdom Flag (Union Jack)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#012169" />
          <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="0" y1="0" x2="24" y2="16" stroke="#C8102E" strokeWidth="1.2" />
          <line x1="24" y1="0" x2="0" y2="16" stroke="#C8102E" strokeWidth="1.2" />
          <rect x="9.5" width="5" height="16" fill="#FFFFFF" />
          <rect y="5.5" width="24" height="5" fill="#FFFFFF" />
          <rect x="10.5" width="3" height="16" fill="#C8102E" />
          <rect y="6.5" width="24" height="3" fill="#C8102E" />
        </svg>
      );

    case 'AE':
      // UAE Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="5.33" fill="#00732F" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#000000" />
          <rect width="6" height="16" fill="#FF0000" />
        </svg>
      );

    case 'CA':
      // Canada Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="6" height="16" fill="#FF0000" />
          <rect x="6" width="12" height="16" fill="#FFFFFF" />
          <rect x="18" width="6" height="16" fill="#FF0000" />
          <path
            d="M12 4 L12.8 6.5 L15 6 L13.5 8 L15 10.5 L12.5 9.5 L12 12.5 L11.5 9.5 L9 10.5 L10.5 8 L9 6 L11.2 6.5 Z"
            fill="#FF0000"
          />
        </svg>
      );

    case 'AU':
      // Australia Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#00008B" />
          {/* Mini Union Jack canton */}
          <g transform="scale(0.45)">
            <rect width="24" height="16" fill="#012169" />
            <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="3" />
            <rect x="9.5" width="5" height="16" fill="#FFFFFF" />
            <rect y="5.5" width="24" height="5" fill="#FFFFFF" />
            <rect x="10.5" width="3" height="16" fill="#C8102E" />
            <rect y="6.5" width="24" height="3" fill="#C8102E" />
          </g>
          {/* Commonwealth Star */}
          <circle cx="6" cy="12" r="1.3" fill="#FFFFFF" />
          {/* Southern Cross */}
          <circle cx="17" cy="3.5" r="0.7" fill="#FFFFFF" />
          <circle cx="15" cy="7" r="0.7" fill="#FFFFFF" />
          <circle cx="19" cy="8" r="0.7" fill="#FFFFFF" />
          <circle cx="17" cy="13" r="0.7" fill="#FFFFFF" />
          <circle cx="18" cy="9.5" r="0.5" fill="#FFFFFF" />
        </svg>
      );

    case 'SG':
      // Singapore Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="8" fill="#ED2939" />
          <rect y="8" width="24" height="8" fill="#FFFFFF" />
          <circle cx="4.5" cy="4" r="2.2" fill="#FFFFFF" />
          <circle cx="5.2" cy="4" r="2.0" fill="#ED2939" />
          <circle cx="6.5" cy="2.8" r="0.4" fill="#FFFFFF" />
          <circle cx="7.2" cy="3.8" r="0.4" fill="#FFFFFF" />
          <circle cx="6.8" cy="4.8" r="0.4" fill="#FFFFFF" />
          <circle cx="5.8" cy="4.8" r="0.4" fill="#FFFFFF" />
          <circle cx="5.6" cy="3.4" r="0.4" fill="#FFFFFF" />
        </svg>
      );

    case 'DE':
      // Germany Flag (Black, Red, Gold)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="5.33" fill="#000000" />
          <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
          <rect y="10.66" width="24" height="5.34" fill="#FFCE00" />
        </svg>
      );

    case 'FR':
      // France Flag (Blue, White, Red)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="8" height="16" fill="#0055A5" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#EF4135" />
        </svg>
      );

    case 'SA':
      // Saudi Arabia Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#006C35" />
          <path d="M6 10.5 L18 10.5 M7 11.5 L8 9.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
          <text x="12" y="8" fill="#FFFFFF" fontSize="3.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
            السعودية
          </text>
        </svg>
      );

    case 'QA':
      // Qatar Flag (Maroon & White serrated)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#8D1B3D" />
          <path
            d="M0 0 L7 0 L9 1 L7 2 L9 3 L7 4 L9 5 L7 6 L9 7 L7 8 L9 9 L7 10 L9 11 L7 12 L9 13 L7 14 L9 15 L7 16 L0 16 Z"
            fill="#FFFFFF"
          />
        </svg>
      );

    case 'KW':
      // Kuwait Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="5.33" fill="#007A3D" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#CE1126" />
          <polygon points="0,0 6,5.33 6,10.67 0,16" fill="#000000" />
        </svg>
      );

    case 'OM':
      // Oman Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="5.33" fill="#FFFFFF" />
          <rect y="5.33" width="24" height="5.33" fill="#DB161B" />
          <rect y="10.66" width="24" height="5.34" fill="#008000" />
          <rect width="6" height="16" fill="#DB161B" />
        </svg>
      );

    case 'BH':
      // Bahrain Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#CE1126" />
          <polygon points="0,0 6,0 8.5,1.6 6,3.2 8.5,4.8 6,6.4 8.5,8 6,9.6 8.5,11.2 6,12.8 8.5,14.4 6,16 0,16" fill="#FFFFFF" />
        </svg>
      );

    case 'NP':
      // Nepal Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#F1F5F9" opacity="0.2" />
          <polygon points="2,1 14,7 7,7 16,15 2,15" fill="#DC143C" stroke="#003893" strokeWidth="1.2" />
          <circle cx="6" cy="5" r="1.5" fill="#FFFFFF" />
          <circle cx="7" cy="11.5" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'BD':
      // Bangladesh Flag (Dark green with red disc)
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#006A4E" />
          <circle cx="10.5" cy="8" r="4.5" fill="#F42A41" />
        </svg>
      );

    case 'LK':
      // Sri Lanka Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#FFBE29" />
          <rect x="1.5" y="1.5" width="3" height="13" fill="#005A36" />
          <rect x="4.8" y="1.5" width="3" height="13" fill="#EB7400" />
          <rect x="8.5" y="1.5" width="14" height="13" fill="#8D153A" />
          <circle cx="15.5" cy="8" r="3.2" fill="#FFBE29" opacity="0.9" />
        </svg>
      );

    case 'MY':
      // Malaysia Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          {[...Array(14)].map((_, i) => (
            <rect key={i} y={(i * 16) / 14} width="24" height={16 / 14} fill={i % 2 === 0 ? '#CC0000' : '#FFFFFF'} />
          ))}
          <rect width="12" height="9.1" fill="#000066" />
          <circle cx="5" cy="4.5" r="2.8" fill="#FFCC00" />
          <circle cx="5.8" cy="4.5" r="2.5" fill="#000066" />
          <polygon points="8,4.5 9,3.5 8.7,4.8 9.8,4.2 8.6,5.1 9.5,6" fill="#FFCC00" />
        </svg>
      );

    case 'JP':
      // Japan Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#FFFFFF" />
          <circle cx="12" cy="8" r="4.8" fill="#BC002D" />
        </svg>
      );

    case 'KR':
      // South Korea Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#FFFFFF" />
          <circle cx="12" cy="8" r="3.8" fill="#CD2E3A" />
          <path d="M12 4.2 A3.8 3.8 0 0 1 12 11.8 A1.9 1.9 0 0 0 12 8 A1.9 1.9 0 0 1 12 4.2 Z" fill="#0047A0" />
        </svg>
      );

    case 'CN':
      // China Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#DE2910" />
          <polygon points="3.5,2 4,3.5 5.5,3.5 4.3,4.5 4.8,6 3.5,5 2.2,6 2.7,4.5 1.5,3.5 3,3.5" fill="#FFDE00" />
          <circle cx="6.5" cy="2" r="0.5" fill="#FFDE00" />
          <circle cx="7.8" cy="3.2" r="0.5" fill="#FFDE00" />
          <circle cx="7.8" cy="5.2" r="0.5" fill="#FFDE00" />
          <circle cx="6.5" cy="6.4" r="0.5" fill="#FFDE00" />
        </svg>
      );

    case 'BR':
      // Brazil Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#009739" />
          <polygon points="12,1.5 22,8 12,14.5 2,8" fill="#FEDF00" />
          <circle cx="12" cy="8" r="3.2" fill="#002776" />
          <path d="M9 8.5 Q12 6.5 15 8" stroke="#FFFFFF" strokeWidth="0.5" fill="none" />
        </svg>
      );

    case 'ZA':
      // South Africa Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="8" fill="#E03C31" />
          <rect y="8" width="24" height="8" fill="#001489" />
          <polygon points="0,0 8,8 0,16" fill="#000000" />
          <polygon points="0,0 9,8 0,16" fill="none" stroke="#FFB81C" strokeWidth="1" />
          <path d="M0 8 L10 8 L24 8" stroke="#007749" strokeWidth="3" />
          <path d="M0 0 L8 8 L24 8 M0 16 L8 8" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'IT':
      // Italy Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#CE2B37" />
        </svg>
      );

    case 'ES':
      // Spain Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="4" fill="#AA151B" />
          <rect y="4" width="24" height="8" fill="#F1BF00" />
          <rect y="12" width="24" height="4" fill="#AA151B" />
          <circle cx="6" cy="8" r="1.8" fill="#AA151B" opacity="0.85" />
        </svg>
      );

    case 'NL':
      // Netherlands Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="5.33" fill="#AE1C28" />
          <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
          <rect y="10.66" width="24" height="5.34" fill="#21468B" />
        </svg>
      );

    case 'CH':
      // Switzerland Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#FF0000" />
          <rect x="10.5" y="3.5" width="3" height="9" fill="#FFFFFF" />
          <rect x="7.5" y="6.5" width="9" height="3" fill="#FFFFFF" />
        </svg>
      );

    case 'SE':
      // Sweden Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#006AA7" />
          <rect x="6.5" width="3" height="16" fill="#FECC00" />
          <rect y="6.5" width="24" height="3" fill="#FECC00" />
        </svg>
      );

    case 'IE':
      // Ireland Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="8" height="16" fill="#169B62" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#FF883E" />
        </svg>
      );

    case 'NZ':
      // New Zealand Flag
      return (
        <svg viewBox="0 0 24 16" className={`${className} shrink-0 rounded-xs shadow-2xs overflow-hidden`} aria-hidden="true">
          <rect width="24" height="16" fill="#00008B" />
          <g transform="scale(0.45)">
            <rect width="24" height="16" fill="#012169" />
            <line x1="0" y1="0" x2="24" y2="16" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="24" y1="0" x2="0" y2="16" stroke="#FFFFFF" strokeWidth="3" />
            <rect x="9.5" width="5" height="16" fill="#FFFFFF" />
            <rect y="5.5" width="24" height="5" fill="#FFFFFF" />
            <rect x="10.5" width="3" height="16" fill="#C8102E" />
            <rect y="6.5" width="24" height="3" fill="#C8102E" />
          </g>
          {/* Southern cross red stars */}
          <circle cx="17" cy="3.5" r="0.7" fill="#CC0000" stroke="#FFFFFF" strokeWidth="0.3" />
          <circle cx="15" cy="7" r="0.7" fill="#CC0000" stroke="#FFFFFF" strokeWidth="0.3" />
          <circle cx="19" cy="8" r="0.7" fill="#CC0000" stroke="#FFFFFF" strokeWidth="0.3" />
          <circle cx="17" cy="12.5" r="0.7" fill="#CC0000" stroke="#FFFFFF" strokeWidth="0.3" />
        </svg>
      );

    default:
      // Generic globe / flag placeholder
      return (
        <div className={`${className} shrink-0 rounded-xs bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-700 uppercase`}>
          {upper.slice(0, 2) || '🌐'}
        </div>
      );
  }
};
