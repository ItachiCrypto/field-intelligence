import { Severity } from '@/lib/types';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SeverityIndicator } from './severity-indicator';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function SeverityBadge({ severity, size = 'md', showLabel = true }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      <SeverityIndicator severity={severity} size={size === 'sm' ? 'sm' : 'md'} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export { SeverityIndicator as SeverityDot } from './severity-indicator';
