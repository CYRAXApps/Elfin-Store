import React from 'react';

export interface PincodeDisplayProps {
  /** The 6-digit postal PIN code */
  pincode?: string | number | null;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to render as a neutral badge with subtle border */
  badge?: boolean;
  /** Whether to display a prefix label like "PIN:" */
  showPrefix?: boolean;
  /** Custom prefix text, defaults to "PIN" */
  prefixText?: string;
  /** Optional delivery status to display alongside the PIN (never colors the PIN itself) */
  status?: 'DELIVERING' | 'EXCLUDED' | 'SERVICEABLE' | 'UNSERVICEABLE' | null;
  /** Optional custom copy or click action */
  onClick?: () => void;
  title?: string;
}

/**
 * Canonical PincodeDisplay Component
 * 
 * Enforces strict, consistent styling across the entire store:
 * 1. Neutral text color (inherits or slate-800) - NEVER blue, purple, red, green.
 * 2. Tabular monospace font for clean alignment of 6 digits.
 * 3. No accidental hyperlink/anchor styling, underlines, or visited-purple tints.
 * 4. Status indicator (delivering/excluded) rendered separately with its own status dot,
 *    keeping the PIN number strictly neutral.
 */
export function PincodeDisplay({
  pincode,
  className = '',
  badge = false,
  showPrefix = false,
  prefixText = 'PIN',
  status = null,
  onClick,
  title,
}: PincodeDisplayProps) {
  if (pincode === undefined || pincode === null || pincode === '') {
    return null;
  }

  // Ensure consistent 6-digit string representation (preserves leading zeroes)
  const rawString = String(pincode).trim();
  const cleanDigits = rawString.replace(/\D/g, '').slice(0, 6);
  const formattedPin = cleanDigits.length === 6 ? cleanDigits : rawString;

  // Base neutral PIN text styling: tabular numbers, monospace, neutral slate, no link styles
  const pinTextClasses = "font-mono font-medium tracking-wider tabular-nums text-slate-800 dark:text-slate-200 not-italic no-underline decoration-transparent select-text";

  // Badge styling if requested: subtle neutral border & background (never colorful)
  const containerClasses = badge
    ? `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs ${onClick ? 'cursor-pointer hover:bg-slate-200/80 transition-colors' : ''} ${className}`
    : `inline-flex items-center gap-1.5 ${onClick ? 'cursor-pointer' : ''} ${className}`;

  return (
    <span
      className={containerClasses}
      onClick={onClick}
      title={title || `PIN Code: ${formattedPin}`}
    >
      {showPrefix && (
        <span className="text-[11px] font-sans font-medium text-slate-500 uppercase tracking-wider select-none">
          {prefixText}:
        </span>
      )}

      {/* The PIN number itself is ALWAYS rendered in neutral tone */}
      <span className={pinTextClasses}>
        {formattedPin}
      </span>

      {/* Status indicator: rendered as an adjacent badge with appropriate status color */}
      {(status === 'DELIVERING' || status === 'SERVICEABLE') && (
        <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Delivering
        </span>
      )}

      {(status === 'EXCLUDED' || status === 'UNSERVICEABLE') && (
        <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Excluded
        </span>
      )}
    </span>
  );
}

export default PincodeDisplay;
