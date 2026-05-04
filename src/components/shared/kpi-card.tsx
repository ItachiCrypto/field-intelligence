import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { InfoPopover } from './info-popover';

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  /** when true, a positive change is bad (rose) and negative is good (emerald) */
  invertChange?: boolean;
  suffix?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  /** Optional info content shown via a (?) icon next to the label. */
  info?: ReactNode;
}

export function KpiCard({ label, value, change, invertChange, suffix, icon, iconColor = 'text-slate-600 bg-slate-50', info }: KpiCardProps) {
  const goodUp = !invertChange;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          {info && <InfoPopover ariaLabel={`Explications : ${label}`}>{info}</InfoPopover>}
        </div>
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl',
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-2xl font-bold text-slate-900 tabular-nums">
          {value}
          {suffix && <span className="text-base font-semibold text-slate-500 ml-0.5">{suffix}</span>}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium mb-0.5',
              change > 0 && (goodUp ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'),
              change < 0 && (goodUp ? 'text-rose-700 bg-rose-50' : 'text-emerald-700 bg-emerald-50'),
              change === 0 && 'text-slate-500 bg-slate-50'
            )}
          >
            {change > 0 && <ArrowUpRight className="w-3 h-3" />}
            {change < 0 && <ArrowDownRight className="w-3 h-3" />}
            {change === 0 && <Minus className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
    </div>
  );
}
