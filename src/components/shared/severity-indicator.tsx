import { Severity } from '@/lib/types';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 6,
  md: 8,
  lg: 10,
} as const;

interface SeverityIndicatorProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SeverityIndicator({ severity, size = 'md', className }: SeverityIndicatorProps) {
  const diameter = SIZES[size];
  const radius = diameter / 2;

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      className={cn('inline-block shrink-0', className)}
      aria-label={SEVERITY_CONFIG[severity].label}
    >
      <circle cx={radius} cy={radius} r={radius} fill={SEVERITY_CONFIG[severity].hex} />
    </svg>
  );
}

export const SeverityDot = SeverityIndicator;
