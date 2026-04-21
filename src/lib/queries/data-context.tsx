// @ts-nocheck
'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useData } from './use-data';
import {
  filterByDate, filterByWeek, useDateRange,
} from './date-range-context';

type DataContextType = ReturnType<typeof useData>;

const DataContext = createContext<DataContextType | null>(null);

/**
 * Provider donnees + filtrage par plage de dates.
 *
 * `useData()` charge les donnees brutes une seule fois par company. Ce
 * provider applique ensuite le filtre temporel (contexte `DateRange`) sur
 * les tableaux qui ont une colonne date — ce qui garantit que chaque page
 * voit deja les donnees filtrees sans avoir a re-implementer le filtre.
 *
 * Les tables SANS colonne date (agregats, meta, etc.) sont passees telles
 * quelles. Voir le map ci-dessous.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const raw = useData();
  const { range } = useDateRange();

  const filtered = useMemo(() => {
    if (range.unlimited) return raw;

    return {
      ...raw,

      // Tables avec une colonne date "row-level".
      signals: filterByDate(raw.signals, (r) => r.created_at, range),
      alerts: filterByDate(raw.alerts, (r) => r.created_at, range),
      prixSignals: filterByDate(raw.prixSignals, (r) => r.date, range),
      dealsAnalyse: filterByDate(raw.dealsAnalyse, (r) => r.date, range),
      offresConcurrentes: filterByDate(
        raw.offresConcurrentes,
        (r) => r.date_premiere_mention,
        range,
      ),
      commConcurrentes: filterByDate(raw.commConcurrentes, (r) => r.date, range),
      crObjectifs: filterByDate(raw.crObjectifs, (r) => r.date, range),
      dealsCommerciaux: filterByDate(raw.dealsCommerciaux, (r) => r.date, range),
      recommandationsIA: filterByDate(
        raw.recommandationsIA,
        (r) => r.created_at,
        range,
      ),

      // Tables indexees par semaine ISO ("YYYY-SWW").
      tendancePrix: filterByWeek(raw.tendancePrix, (r) => r.semaine, range),
      dealTendance: filterByWeek(raw.dealTendance, (r) => r.semaine, range),
      dealCommercialTendance: filterByWeek(
        raw.dealCommercialTendance,
        (r) => r.semaine,
        range,
      ),

      // Tables NON filtrees (passees brutes) :
      //   - accounts, commercials, competitors, needs : meta ou agregats
      //   - positionnement, geoSectorData : agregats (pas de date row-level)
      //   - sentiment_periodes, sentiment_regions, segment_sentiments,
      //     segment_insights, territoires, region_profiles, geo_points,
      //     motifs_sentiment : vues deja agregees
      //   - abbreviations : referentiel
    };
  }, [raw, range]);

  return <DataContext.Provider value={filtered}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
