import React, { useState } from 'react';
import { ChevronDown, Sliders, Shield } from 'lucide-react';

export interface AdvancedOptionsSectionProps {
  id?: string;
  title?: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AdvancedOptionsSection({
  id = 'advanced-options',
  title = 'Advanced Options',
  description = 'Technical configurations and specialized settings. Recommended for experienced administrators.',
  defaultOpen = false,
  children,
}: AdvancedOptionsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
            <Sliders size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</span>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">Technical</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-200 bg-white space-y-4 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
