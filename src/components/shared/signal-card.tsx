import { Signal, SignalType } from '@/lib/types';
import { SIGNAL_TYPES, SEVERITY_CONFIG } from '@/lib/constants';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  Swords,
  Lightbulb,
  DollarSign,
  ThumbsUp,
  Target,
  TrendingDown,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Swords,
  Lightbulb,
  DollarSign,
  ThumbsUp,
  Target,
  XCircle,
};

function getSignalIcon(type: SignalType): LucideIcon {
  const iconName = SIGNAL_TYPES[type].iconName;
  return ICON_MAP[iconName] ?? Target;
}

interface SignalCardProps {
  signal: Signal;
  compact?: boolean;
}

export function SignalCard({ signal, compact = false }: SignalCardProps) {
  const typeConfig = SIGNAL_TYPES[signal.type];
  const sevConfig = SEVERITY_CONFIG[signal.severity];
  const Icon = getSignalIcon(signal.type);

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4',
        sevConfig.borderLeft
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs mb-2">
          <span className="text-slate-400">{formatRelativeTime(signal.created_at)}</span>
          <span className="text-slate-300">&#183;</span>
          <span className="font-medium text-slate-700">{signal.client_name}</span>
          <span className="text-slate-300">&#183;</span>
          <span className="text-slate-500">
            {signal.commercial_name} - {signal.region}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 leading-relaxed">{signal.content}</p>

        {/* Footer */}
        {!compact && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
                typeConfig.color
              )}
            >
              <Icon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            {signal.competitor_name && (
              <span className="text-xs text-slate-500">
                vs <span className="font-medium text-slate-600">{signal.competitor_name}</span>
              </span>
            )}
            {signal.price_delta !== undefined && signal.price_delta !== 0 && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  signal.price_delta < 0 ? 'text-rose-600' : 'text-emerald-600'
                )}
              >
                <TrendingDown className="w-3 h-3" />
                {signal.price_delta > 0 ? '+' : ''}{signal.price_delta}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
