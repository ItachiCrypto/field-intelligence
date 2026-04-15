// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { Severity } from '@/lib/types';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import { Map, AlertTriangle, Activity, MapPin } from 'lucide-react';

interface RegionData {
  region: string;
  totalSignals: number;
  bySeverity: Record<Severity, number>;
  dominantSeverity: Severity;
  commercialCount: number;
  topAlert: any | null;
}

export default function HeatmapPage() {
  const { signals: SIGNALS, alerts: ALERTS, commercials: COMMERCIALS } = useAppData();
  const regionData = useMemo(() => {
    const regionMap: Record<string, { signals: typeof SIGNALS; alerts: typeof ALERTS }> = {};

    // Index des signaux par id pour lookup rapide de la region via signal_id
    const signalById: Record<string, (typeof SIGNALS)[number]> = {};
    SIGNALS.forEach((s) => {
      signalById[s.id] = s;
      if (!regionMap[s.region]) regionMap[s.region] = { signals: [], alerts: [] };
      regionMap[s.region].signals.push(s);
    });

    ALERTS.forEach((a) => {
      // Region : d'abord via signal_id (JOIN client), sinon colonne directe alert.region
      const region = (a.signal_id && signalById[a.signal_id]?.region) || a.region;
      if (!region) return;
      if (!regionMap[region]) regionMap[region] = { signals: [], alerts: [] };
      regionMap[region].alerts.push(a);
    });

    const commercialsByRegion: Record<string, number> = {};
    COMMERCIALS.forEach((c) => {
      commercialsByRegion[c.region] = (commercialsByRegion[c.region] || 0) + 1;
    });

    const result: RegionData[] = [];
    const sevOrder: Record<Severity, number> = { rouge: 0, orange: 1, jaune: 2, vert: 3 };

    Object.entries(regionMap).forEach(([region, data]) => {
      const bySeverity: Record<Severity, number> = { rouge: 0, orange: 0, jaune: 0, vert: 0 };
      data.signals.forEach((s) => bySeverity[s.severity]++);

      let dominantSeverity: Severity = 'vert';
      if (bySeverity.rouge > 0) dominantSeverity = 'rouge';
      else if (bySeverity.orange > 0) dominantSeverity = 'orange';
      else if (bySeverity.jaune > 0) dominantSeverity = 'jaune';

      const topAlert = data.alerts
        .sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity])[0] || null;

      result.push({
        region,
        totalSignals: data.signals.length,
        bySeverity,
        dominantSeverity,
        commercialCount: commercialsByRegion[region] || 0,
        topAlert,
      });
    });

    return result.sort((a, b) => b.totalSignals - a.totalSignals);
  }, [SIGNALS, ALERTS, COMMERCIALS]);

  const totalRegions = regionData.length;
  const mostActive = regionData[0]?.region || (regionData.length > 0 ? 'Non assignee' : '-');
  const totalAlerts = ALERTS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
          <Map className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Carte Thermique Terrain</h1>
          <p className="text-sm text-slate-500">Densite des signaux par region</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Regions actives"
          value={totalRegions}
          icon={<MapPin className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-50"
        />
        <KpiCard
          label="Region la plus active"
          value={mostActive}
          icon={<Activity className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Total alertes"
          value={totalAlerts}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Region cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {regionData.map((rd) => {
          const sevConfig = SEVERITY_CONFIG[rd.dominantSeverity];
          const total = rd.totalSignals;

          return (
            <div
              key={rd.region}
              className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4 ${sevConfig.borderLeft}`}
            >
              <div className="p-5">
                {/* Region name and count */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">{rd.region || 'Non assignee'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700 tabular-nums">{rd.totalSignals} signaux</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500 tabular-nums">{rd.commercialCount} commerciaux</span>
                  </div>
                </div>

                {/* Severity distribution bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-3">
                  {(['rouge', 'orange', 'jaune', 'vert'] as Severity[]).map((sev) => {
                    const count = rd.bySeverity[sev];
                    if (count === 0) return null;
                    const widthPct = (count / total) * 100;
                    return (
                      <div
                        key={sev}
                        className={SEVERITY_CONFIG[sev].color}
                        style={{ width: `${widthPct}%` }}
                        title={`${SEVERITY_CONFIG[sev].label}: ${count}`}
                      />
                    );
                  })}
                </div>

                {/* Severity counts */}
                <div className="flex items-center gap-3 mb-3">
                  {(['rouge', 'orange', 'jaune', 'vert'] as Severity[]).map((sev) => (
                    rd.bySeverity[sev] > 0 && (
                      <span key={sev} className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <SeverityIndicator severity={sev} size="sm" />
                        <span className="tabular-nums font-medium">{rd.bySeverity[sev]}</span>
                      </span>
                    )
                  ))}
                </div>

                {/* Top alert */}
                {rd.topAlert && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        <AbbreviationHighlight text={rd.topAlert.signal?.content || rd.topAlert.content || ''} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
