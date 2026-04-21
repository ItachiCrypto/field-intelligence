'use client';

/**
 * Contexte global de filtre temporel.
 *
 * Une seule plage de dates est maintenue pour toute l'app. Le picker dans la
 * topbar modifie ce contexte, et `DataProvider` filtre a la volee les tableaux
 * exposes par `useAppData` en fonction de cette plage.
 *
 * Presets disponibles :
 *  - 7d / 30d / 90d : X derniers jours
 *  - 6m / 1y        : 6 mois / 1 an glissants
 *  - all            : toutes les donnees (pas de filtrage)
 *  - custom         : bornes explicites choisies par l'utilisateur
 *
 * Persistance : localStorage 'fi:dateRange'. Quand c'est un preset relatif
 * (7d/30d/90d/6m/1y) on recalcule les bornes au moment du read pour rester
 * "glissant" meme si l'utilisateur revient le lendemain.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';

export type DateRangePreset = '7d' | '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';

export type DateRange = {
  /** borne inferieure, inclusive (00:00:00.000 local) */
  from: Date;
  /** borne superieure, inclusive (23:59:59.999 local) */
  to: Date;
  /** null = pas de filtre (preset 'all') */
  unlimited: boolean;
};

type Stored = {
  preset: DateRangePreset;
  customFromISO?: string;
  customToISO?: string;
};

const LS_KEY = 'fi:dateRange';
const DEFAULT_PRESET: DateRangePreset = '90d';

const PRESET_LABELS: Record<DateRangePreset, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  '6m': '6 derniers mois',
  '1y': '12 derniers mois',
  'all': 'Toutes les donnees',
  'custom': 'Plage personnalisee',
};

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function presetToRange(preset: DateRangePreset, customFrom?: Date, customTo?: Date): DateRange {
  if (preset === 'all') {
    return { from: new Date(0), to: endOfDay(new Date()), unlimited: true };
  }
  if (preset === 'custom' && customFrom && customTo) {
    // Normalise pour que l'ordre soit correct meme si l'utilisateur a inverse.
    const a = startOfDay(customFrom);
    const b = endOfDay(customTo);
    return a.getTime() <= b.getTime()
      ? { from: a, to: b, unlimited: false }
      : { from: startOfDay(customTo), to: endOfDay(customFrom), unlimited: false };
  }
  const now = new Date();
  const to = endOfDay(now);
  const from = new Date(now);
  switch (preset) {
    case '7d': from.setDate(from.getDate() - 6); break;   // 7 jours inclus aujourd'hui
    case '30d': from.setDate(from.getDate() - 29); break;
    case '90d': from.setDate(from.getDate() - 89); break;
    case '6m': from.setMonth(from.getMonth() - 6); break;
    case '1y': from.setFullYear(from.getFullYear() - 1); break;
  }
  return { from: startOfDay(from), to, unlimited: false };
}

function readStored(): Stored {
  if (typeof window === 'undefined') return { preset: DEFAULT_PRESET };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { preset: DEFAULT_PRESET };
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || typeof parsed.preset !== 'string') return { preset: DEFAULT_PRESET };
    return parsed;
  } catch {
    return { preset: DEFAULT_PRESET };
  }
}

function writeStored(s: Stored) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    // quota exceeded / SSR — ignore silently
  }
}

type DateRangeContextType = {
  range: DateRange;
  preset: DateRangePreset;
  setPreset: (p: Exclude<DateRangePreset, 'custom'>) => void;
  setCustomRange: (from: Date, to: Date) => void;
  presetLabel: string;
};

const DateRangeContext = createContext<DateRangeContextType | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored>({ preset: DEFAULT_PRESET });

  // Hydrate depuis localStorage apres mount (evite hydration mismatch).
  useEffect(() => {
    setStored(readStored());
  }, []);

  const range = useMemo(() => {
    const from = stored.customFromISO ? new Date(stored.customFromISO) : undefined;
    const to = stored.customToISO ? new Date(stored.customToISO) : undefined;
    return presetToRange(stored.preset, from, to);
  }, [stored]);

  const setPreset = useCallback((p: Exclude<DateRangePreset, 'custom'>) => {
    const next: Stored = { preset: p };
    setStored(next);
    writeStored(next);
  }, []);

  const setCustomRange = useCallback((from: Date, to: Date) => {
    const next: Stored = {
      preset: 'custom',
      customFromISO: from.toISOString(),
      customToISO: to.toISOString(),
    };
    setStored(next);
    writeStored(next);
  }, []);

  const value = useMemo<DateRangeContextType>(
    () => ({
      range,
      preset: stored.preset,
      setPreset,
      setCustomRange,
      presetLabel: PRESET_LABELS[stored.preset] ?? '',
    }),
    [range, stored.preset, setPreset, setCustomRange],
  );

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange(): DateRangeContextType {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used within DateRangeProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Helpers de filtrage — exportes pour usage dans DataProvider.
// ---------------------------------------------------------------------------

/**
 * Garde les rows dont `getDate(row)` tombe dans la plage. Les rows sans date
 * parseable sont conservees (pour ne pas casser les tables ou la colonne
 * est optionnelle).
 */
export function filterByDate<T>(
  rows: T[] | null | undefined,
  getDate: (row: T) => string | null | undefined,
  range: DateRange,
): T[] {
  if (!rows) return [];
  if (range.unlimited) return rows;
  const min = range.from.getTime();
  const max = range.to.getTime();
  const out: T[] = [];
  for (const row of rows) {
    const raw = getDate(row);
    if (!raw) {
      out.push(row);
      continue;
    }
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) {
      out.push(row);
      continue;
    }
    if (t >= min && t <= max) out.push(row);
  }
  return out;
}

/**
 * Convertit une cle semaine ISO "YYYY-SWW" en Date (lundi de cette semaine UTC).
 * Retourne null si le format est invalide.
 */
export function isoWeekToDate(key: string): Date | null {
  if (!key) return null;
  const m = /^(\d{4})-S(\d{1,2})$/.exec(key);
  if (!m) return null;
  const year = +m[1];
  const week = +m[2];
  // ISO week 1 = semaine contenant le 4 janvier
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7; // lundi=1 … dimanche=7
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - day + 1);
  const result = new Date(week1Monday);
  result.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return result;
}

/**
 * Filtre un tableau de rows indexees par semaine ISO ("YYYY-SWW"). On garde
 * la semaine si le lundi de la semaine tombe dans la plage (la granularite
 * est hebdo, cela reste une approximation acceptable).
 */
export function filterByWeek<T>(
  rows: T[] | null | undefined,
  getWeek: (row: T) => string | null | undefined,
  range: DateRange,
): T[] {
  if (!rows) return [];
  if (range.unlimited) return rows;
  const min = range.from.getTime();
  const max = range.to.getTime();
  const out: T[] = [];
  for (const row of rows) {
    const wk = getWeek(row);
    if (!wk) { out.push(row); continue; }
    const d = isoWeekToDate(wk);
    if (!d) { out.push(row); continue; }
    const t = d.getTime();
    // semaine pertinente si son debut <= fin de plage ET debut + 7j > debut de plage
    const endOfWeek = t + 6 * 86400000;
    if (endOfWeek >= min && t <= max) out.push(row);
  }
  return out;
}
