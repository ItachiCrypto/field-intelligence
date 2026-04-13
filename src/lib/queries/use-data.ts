// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';


const supabase = createClient();

// Generic fetch helper - fetches from Supabase if company_id available, otherwise returns seed data
async function fetchTable<T>(tableName: string, companyId: string | null): Promise<T[]> {
  if (!companyId) return [];

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as T[];
  } catch {
    return [];
  }
}

// The main hook
export function useData() {
  const { profile, company } = useAuth();
  const companyId = company?.id ?? null;

  const [data, setData] = useState({
    // V1 data
    signals: [] as any[],
    accounts: [] as any[],
    alerts: [] as any[],
    commercials: [] as any[],
    competitors: [] as any[],
    needs: [] as any[],
    aiRecommendations: {} as Record<string, any>,
    // V2 data
    prixSignals: [] as any[],
    tendancePrix: [] as any[],
    dealsAnalyse: [] as any[],
    dealTendance: [] as any[],
    offresConcurrentes: [] as any[],
    commConcurrentes: [] as any[],
    positionnement: [] as any[],
    geoSectorData: [] as any[],
    crObjectifs: [] as any[],
    sentimentPeriodes: [] as any[],
    sentimentActuelle: null as any,
    sentimentPrecedente: null as any,
    sentimentRegions: [] as any[],
    segmentSentiments: [] as any[],
    segmentInsights: [] as any[],
    territoires: [] as any[],
    regionProfiles: [] as any[],
    geoPoints: [] as any[],
    recommandationsIA: [] as any[],
    dealsCommerciaux: [] as any[],
    dealCommercialTendance: [] as any[],
    motifsSentiment: [] as any[],
  });

  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false); // true when data comes from Supabase

  const refresh = useCallback(async () => {
    if (!companyId) {
      setIsLive(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch all tables in parallel
      const [
        signals, accounts, alerts, commercials, competitors, needs,
        prixSignals, dealsAnalyse, offresConcurrentes, commConcurrentes, positionnement,
        geoSectorData, crObjectifs, sentimentPeriodes, sentimentRegions,
        segmentSentiments, territoires, regionProfiles, geoPoints,
        recommandationsIA, dealsCommerciaux, dealCommercialTendance, motifsSentiment,
        tendancePrix, dealTendance,
      ] = await Promise.all([
        fetchTable('signals', companyId),
        fetchTable('accounts', companyId),
        fetchTable('alerts', companyId),
        fetchTable('commercials', companyId),
        fetchTable('competitors', companyId),
        fetchTable('needs', companyId),
        fetchTable('prix_signals', companyId),
        fetchTable('deals_marketing', companyId),
        fetchTable('offres_concurrentes', companyId),
        fetchTable('comm_concurrentes', companyId),
        fetchTable('positionnement', companyId),
        fetchTable('geo_sector_data', companyId),
        fetchTable('cr_objectifs', companyId),
        fetchTable('sentiment_periodes', companyId),
        fetchTable('sentiment_regions', companyId),
        fetchTable('segment_sentiments', companyId),
        fetchTable('territoires', companyId),
        fetchTable('region_profiles', companyId),
        fetchTable('geo_points', companyId),
        fetchTable('recommandations_ia', companyId),
        fetchTable('deals_commerciaux', companyId),
        fetchTable('deal_commercial_tendance', companyId),
        fetchTable('motifs_sentiment', companyId),
        fetchTable('tendance_prix', companyId),
        fetchTable('deal_tendance', companyId),
      ]);

      const hasLiveData = signals.length > 0 || accounts.length > 0;

      setData({
        signals, accounts, alerts, commercials, competitors, needs,
        aiRecommendations: {},
        prixSignals, tendancePrix, dealsAnalyse, dealTendance,
        offresConcurrentes, commConcurrentes, positionnement,
        geoSectorData, crObjectifs,
        sentimentPeriodes,
        sentimentActuelle: sentimentPeriodes.length > 0 ? sentimentPeriodes[sentimentPeriodes.length - 1] : null,
        sentimentPrecedente: sentimentPeriodes.length > 1 ? sentimentPeriodes[sentimentPeriodes.length - 2] : null,
        sentimentRegions, segmentSentiments,
        segmentInsights: [],
        territoires, regionProfiles, geoPoints,
        recommandationsIA, dealsCommerciaux, dealCommercialTendance, motifsSentiment,
      });

      setIsLive(hasLiveData);
    } catch {
      // Keep seed data on error
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, isLive, refresh };
}
