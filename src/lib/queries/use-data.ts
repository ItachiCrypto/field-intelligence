// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

// Import ALL seed data as fallbacks
import { SIGNALS as SEED_SIGNALS, ACCOUNTS as SEED_ACCOUNTS, ALERTS as SEED_ALERTS, COMMERCIALS as SEED_COMMERCIALS, COMPETITORS as SEED_COMPETITORS, NEEDS as SEED_NEEDS, AI_RECOMMENDATIONS as SEED_AI_RECOMMENDATIONS, DEMO_USERS } from '@/lib/seed-data';
import { PRIX_SIGNALS as SEED_PRIX_SIGNALS, TENDANCE_PRIX as SEED_TENDANCE_PRIX, DEALS_ANALYSE as SEED_DEALS, DEAL_TENDANCE as SEED_DEAL_TENDANCE, OFFRES_CONCURRENTES as SEED_OFFRES, COMM_CONCURRENTES as SEED_COMM, POSITIONNEMENT as SEED_POS, GEO_SECTOR_DATA as SEED_GEO_SECTOR, CR_OBJECTIFS as SEED_CR_OBJECTIFS, SENTIMENT_PERIODES as SEED_SENTIMENT_PERIODES, SENTIMENT_PERIODE_ACTUELLE as SEED_SENTIMENT_ACTUELLE, SENTIMENT_PERIODE_PRECEDENTE as SEED_SENTIMENT_PRECEDENTE, SENTIMENT_REGIONS as SEED_SENTIMENT_REGIONS, SEGMENT_SENTIMENTS as SEED_SEGMENT_SENTIMENTS, SEGMENT_INSIGHTS as SEED_SEGMENT_INSIGHTS, TERRITOIRES as SEED_TERRITOIRES, REGION_PROFILES as SEED_REGION_PROFILES, GEO_POINTS as SEED_GEO_POINTS, RECOMMANDATIONS_IA as SEED_RECOMMANDATIONS_IA, DEALS_COMMERCIAUX as SEED_DEALS_COMMERCIAUX, DEAL_COMMERCIAL_TENDANCE as SEED_DEAL_COMMERCIAL_TENDANCE, MOTIFS_SENTIMENT as SEED_MOTIFS_SENTIMENT } from '@/lib/seed-data-v2';

const supabase = createClient();

// Generic fetch helper - fetches from Supabase if company_id available, otherwise returns seed data
async function fetchTable<T>(tableName: string, companyId: string | null, seedData: T[]): Promise<T[]> {
  if (!companyId) return seedData;

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return seedData;
    return data as T[];
  } catch {
    return seedData;
  }
}

// The main hook
export function useData() {
  const { profile, company } = useAuth();
  const companyId = company?.id ?? null;

  const [data, setData] = useState({
    // V1 data
    signals: SEED_SIGNALS,
    accounts: SEED_ACCOUNTS,
    alerts: SEED_ALERTS,
    commercials: SEED_COMMERCIALS,
    competitors: SEED_COMPETITORS,
    needs: SEED_NEEDS,
    aiRecommendations: SEED_AI_RECOMMENDATIONS,
    // V2 data
    prixSignals: SEED_PRIX_SIGNALS,
    tendancePrix: SEED_TENDANCE_PRIX,
    dealsAnalyse: SEED_DEALS,
    dealTendance: SEED_DEAL_TENDANCE,
    offresConcurrentes: SEED_OFFRES,
    commConcurrentes: SEED_COMM,
    positionnement: SEED_POS,
    geoSectorData: SEED_GEO_SECTOR,
    crObjectifs: SEED_CR_OBJECTIFS,
    sentimentPeriodes: SEED_SENTIMENT_PERIODES,
    sentimentActuelle: SEED_SENTIMENT_ACTUELLE,
    sentimentPrecedente: SEED_SENTIMENT_PRECEDENTE,
    sentimentRegions: SEED_SENTIMENT_REGIONS,
    segmentSentiments: SEED_SEGMENT_SENTIMENTS,
    segmentInsights: SEED_SEGMENT_INSIGHTS,
    territoires: SEED_TERRITOIRES,
    regionProfiles: SEED_REGION_PROFILES,
    geoPoints: SEED_GEO_POINTS,
    recommandationsIA: SEED_RECOMMANDATIONS_IA,
    dealsCommerciaux: SEED_DEALS_COMMERCIAUX,
    dealCommercialTendance: SEED_DEAL_COMMERCIAL_TENDANCE,
    motifsSentiment: SEED_MOTIFS_SENTIMENT,
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
        fetchTable('signals', companyId, SEED_SIGNALS),
        fetchTable('accounts', companyId, SEED_ACCOUNTS),
        fetchTable('alerts', companyId, SEED_ALERTS),
        fetchTable('commercials', companyId, SEED_COMMERCIALS),
        fetchTable('competitors', companyId, SEED_COMPETITORS),
        fetchTable('needs', companyId, SEED_NEEDS),
        fetchTable('prix_signals', companyId, SEED_PRIX_SIGNALS),
        fetchTable('deals_marketing', companyId, SEED_DEALS),
        fetchTable('offres_concurrentes', companyId, SEED_OFFRES),
        fetchTable('comm_concurrentes', companyId, SEED_COMM),
        fetchTable('positionnement', companyId, SEED_POS),
        fetchTable('geo_sector_data', companyId, SEED_GEO_SECTOR),
        fetchTable('cr_objectifs', companyId, SEED_CR_OBJECTIFS),
        fetchTable('sentiment_periodes', companyId, SEED_SENTIMENT_PERIODES),
        fetchTable('sentiment_regions', companyId, SEED_SENTIMENT_REGIONS),
        fetchTable('segment_sentiments', companyId, SEED_SEGMENT_SENTIMENTS),
        fetchTable('territoires', companyId, SEED_TERRITOIRES),
        fetchTable('region_profiles', companyId, SEED_REGION_PROFILES),
        fetchTable('geo_points', companyId, SEED_GEO_POINTS),
        fetchTable('recommandations_ia', companyId, SEED_RECOMMANDATIONS_IA),
        fetchTable('deals_commerciaux', companyId, SEED_DEALS_COMMERCIAUX),
        fetchTable('deal_commercial_tendance', companyId, SEED_DEAL_COMMERCIAL_TENDANCE),
        fetchTable('motifs_sentiment', companyId, SEED_MOTIFS_SENTIMENT),
        fetchTable('tendance_prix', companyId, SEED_TENDANCE_PRIX),
        fetchTable('deal_tendance', companyId, SEED_DEAL_TENDANCE),
      ]);

      // Check if ANY Supabase table returned real data (not fallback)
      const hasLiveData = signals !== SEED_SIGNALS || accounts !== SEED_ACCOUNTS;

      setData({
        signals, accounts, alerts, commercials, competitors, needs,
        aiRecommendations: SEED_AI_RECOMMENDATIONS, // This is a Record, keep seed
        prixSignals, tendancePrix, dealsAnalyse, dealTendance,
        offresConcurrentes, commConcurrentes, positionnement,
        geoSectorData, crObjectifs,
        sentimentPeriodes,
        sentimentActuelle: sentimentPeriodes.length > 0 ? sentimentPeriodes[sentimentPeriodes.length - 1] : SEED_SENTIMENT_ACTUELLE,
        sentimentPrecedente: sentimentPeriodes.length > 1 ? sentimentPeriodes[sentimentPeriodes.length - 2] : SEED_SENTIMENT_PRECEDENTE,
        sentimentRegions, segmentSentiments,
        segmentInsights: SEED_SEGMENT_INSIGHTS, // Static text, keep seed
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
