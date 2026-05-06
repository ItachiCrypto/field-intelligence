'use client';

import { useState, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CRDetailModal } from './cr-detail-modal';

interface CRReferenceProps {
  /** UUIDs des raw_visit_reports a afficher dans le modal au clic. */
  reportIds: Array<string | null | undefined>;
  /**
   * Optional override label. By default :
   *  - "1 CR" if 1 unique id
   *  - "N CRs" if multiple
   *  - hidden if 0 ids
   */
  label?: string;
  /** Phrase contextuelle au-dessus de la liste dans le modal (ex: "Verbatims du concurrent X"). */
  contextLabel?: string;
  /** Variant tailwind pour adapter le rendu au contexte (rose/emerald/...). */
  variant?: 'default' | 'rose' | 'emerald' | 'indigo' | 'amber' | 'minimal';
  /** Taille du bouton. */
  size?: 'xs' | 'sm';
  /** Optional custom child override (ex: render an icon-only button). */
  children?: ReactNode;
}

const VARIANTS: Record<NonNullable<CRReferenceProps['variant']>, string> = {
  default:  'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  rose:     'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  emerald:  'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  indigo:   'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  amber:    'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  minimal:  'bg-transparent text-slate-500 border-transparent hover:text-indigo-700 hover:bg-indigo-50',
};

const SIZES: Record<NonNullable<CRReferenceProps['size']>, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  sm: 'text-xs px-2 py-0.5 gap-1',
};

/**
 * Trigger button to open a CRDetailModal showing one or several source CRs.
 * Renders nothing if no ids are provided. Stops event propagation so it can
 * be safely embedded inside other clickable rows / cards.
 */
export function CRReference({
  reportIds,
  label,
  contextLabel,
  variant = 'minimal',
  size = 'xs',
  children,
}: CRReferenceProps) {
  const [open, setOpen] = useState(false);
  const ids = Array.from(
    new Set(
      (reportIds || [])
        .filter((x): x is string => typeof x === 'string' && x.length > 0),
    ),
  );
  if (ids.length === 0) return null;

  const defaultLabel = `${ids.length} CR${ids.length > 1 ? 's' : ''}`;
  const displayLabel = label ?? defaultLabel;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className={cn(
          'inline-flex items-center rounded-full border font-medium transition-colors',
          VARIANTS[variant],
          SIZES[size],
        )}
        title={`Voir ${defaultLabel}`}
      >
        {children ?? (
          <>
            <FileText className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            {displayLabel}
          </>
        )}
      </button>
      {open && (
        <CRDetailModal
          reportIds={ids}
          contextLabel={contextLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
