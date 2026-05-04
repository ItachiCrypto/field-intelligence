'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoPopoverProps {
  /** Content rendered inside the popover panel. Keep it < ~400px tall. */
  children: ReactNode;
  /** Override the trigger icon size (default 14px). */
  iconSize?: number;
  /** Tailwind classes for the popover panel — default is right-aligned w-80. */
  panelClassName?: string;
  /** Aria label for the trigger button. */
  ariaLabel?: string;
}

/**
 * Click-toggled info popover. Used to surface explanations on KPI cards and
 * other compact UI where a tooltip would be too short. The panel anchors to
 * the trigger; clicking outside or pressing Escape closes it.
 */
export function InfoPopover({
  children,
  iconSize = 14,
  panelClassName,
  ariaLabel = "Plus d'informations",
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <Info style={{ width: iconSize, height: iconSize }} />
      </button>
      {open && (
        <div
          role="dialog"
          className={cn(
            // Default panel: 320px, right-aligned to the trigger, drop shadow.
            'absolute right-0 top-7 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5',
            panelClassName,
          )}
        >
          <div className="flex items-start justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Explications
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 -mr-1 -mt-0.5"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-4 pb-4 text-xs text-slate-700 leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}
