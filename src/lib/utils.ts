import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Severity } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K€`;
  return `${value}€`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTrend(value: number): string {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return 'stable';
}

export function severityToNumber(s: Severity): number {
  const map: Record<Severity, number> = { rouge: 3, orange: 2, jaune: 1, vert: 0 };
  return map[s];
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 70) return 'rouge';
  if (score >= 40) return 'orange';
  if (score >= 20) return 'jaune';
  return 'vert';
}

export function qualityScoreToSeverity(score: number): Severity {
  if (score >= 80) return 'vert';
  if (score >= 60) return 'jaune';
  if (score >= 40) return 'orange';
  return 'rouge';
}
