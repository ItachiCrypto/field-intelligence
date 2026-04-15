// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get the access token from the auth cookie
function getAccessToken(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('sb-') && trimmed.includes('-auth-token=')) {
        const value = decodeURIComponent(trimmed.split('=').slice(1).join('='));
        if (value.startsWith('base64-')) {
          const decoded = atob(value.slice(7));
          const parsed = JSON.parse(decoded);
          return parsed.access_token || null;
        }
        const parsed = JSON.parse(value);
        return parsed.access_token || null;
      }
    }
  } catch (e) {
    // Failed to parse auth cookie
  }
  return null;
}

// Generic fetch helper using raw fetch to bypass Supabase client deadlock
async function fetchTable<T>(tableName: string, companyId: string, accessToken: string): Promise<T[]> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&company_id=eq.${companyId}`;
    const resp = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      console.warn(`[data] Failed to fetch ${tableName}: HTTP ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    return data as T[];
  } catch (e) {
    console.error(`[data] Exception fetching ${tableName}:`, e);
    return [];
  }
}

// The main hook
export function useData() {
  const { profile, company } = useAuth();
  const companyId = company?.id ?? null;
  const refreshingRef = useRef(false);

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
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setIsLive(false);
      return;
    }

    // Prevent concurrent refreshes (React StrictMode double-mount)
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    // Retry getting the access token — cookie may not be set yet on initial load
    let accessToken = getAccessToken();
    if (!accessToken) {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 300 * (i + 1)));
        accessToken = getAccessToken();
        if (accessToken) break;
      }
    }
    if (!accessToken) {
      refreshingRef.current = false;
      setIsLive(false);
      return;
    }

    setLoading(true);

    try {
      const [
        signals, accounts, alerts, commercials, competitors, needs,
        prixSignals, dealsAnalyse, offresConcurrentes, commConcurrentes, positionnement,
        geoSectorData, crObjectifs, sentimentPeriodes, sentimentRegions,
        segmentSentiments, territoires, regionProfiles, geoPoints,
        recommandationsIA, dealsCommerciaux, dealCommercialTendance, motifsSentiment,
        tendancePrix, dealTendance, segmentInsights,
      ] = await Promise.all([
        fetchTable('signals', companyId, accessToken),
        fetchTable('accounts', companyId, accessToken),
        fetchTable('alerts', companyId, accessToken),
        fetchTable('commercials', companyId, accessToken),
        fetchTable('competitors', companyId, accessToken),
        fetchTable('needs', companyId, accessToken),
        fetchTable('prix_signals', companyId, accessToken),
        fetchTable('deals_marketing', companyId, accessToken),
        fetchTable('offres_concurrentes', companyId, accessToken),
        fetchTable('comm_concurrentes', companyId, accessToken),
        fetchTable('positionnement', companyId, accessToken),
        fetchTable('geo_sector_data', companyId, accessToken),
        fetchTable('cr_objectifs', companyId, accessToken),
        fetchTable('sentiment_periodes', companyId, accessToken),
        fetchTable('sentiment_regions', companyId, accessToken),
        fetchTable('segment_sentiments', companyId, accessToken),
        fetchTable('territoires', companyId, accessToken),
        fetchTable('region_profiles', companyId, accessToken),
        fetchTable('geo_points', companyId, accessToken),
        fetchTable('recommandations_ia', companyId, accessToken),
        fetchTable('deals_commerciaux', companyId, accessToken),
        fetchTable('deal_commercial_tendance', companyId, accessToken),
        fetchTable('motifs_sentiment', companyId, accessToken),
        fetchTable('tendance_prix', companyId, accessToken),
        fetchTable('deal_tendance', companyId, accessToken),
        fetchTable('segment_insights', companyId, accessToken),
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
        segmentInsights,
        territoires, regionProfiles, geoPoints,
        recommandationsIA, dealsCommerciaux, dealCommercialTendance, motifsSentiment,
      });

      setIsLive(hasLiveData);
    } catch (err) {
      console.error('[data] refresh error:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
      refreshingRef.current = false;
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, isLive, refresh };
}
