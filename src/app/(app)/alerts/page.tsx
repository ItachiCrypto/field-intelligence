// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import { SEVERITY_CONFIG } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import { AlertStatus } from '@/lib/types';
import { Bell, CheckCircle2, Clock, AlertTriangle, MessageSquarePlus } from 'lucide-react';

const supabase = createClient();

type TabFilter = 'all' | 'nouveau' | 'en_cours' | 'traite';

const SEVERITY_ORDER: Record<string, number> = { rouge: 0, orange: 1, jaune: 2, vert: 3 };

export default function AlertsPage() {
  const { alerts: ALERTS, refresh } = useAppData();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [alertStatuses, setAlertStatuses] = useState<Record<string, AlertStatus>>(() => {
    const init: Record<string, AlertStatus> = {};
    ALERTS.forEach((a) => { init[a.id] = a.status; });
    return init;
  });

  const getStatus = (a: any): AlertStatus => alertStatuses[a.id] ?? a.status ?? 'nouveau';

  const untreatedCount = useMemo(
    () => ALERTS.filter((a) => getStatus(a) === 'nouveau').length,
    [ALERTS, alertStatuses]
  );
  const treatedCount = useMemo(
    () => ALERTS.filter((a) => getStatus(a) === 'traite').length,
    [ALERTS, alertStatuses]
  );
  const enCoursCount = useMemo(
    () => ALERTS.filter((a) => getStatus(a) === 'en_cours').length,
    [ALERTS, alertStatuses]
  );

  const filteredAlerts = useMemo(() => {
    return ALERTS
      .filter((a) => {
        const status = getStatus(a);
        if (activeTab === 'all') return true;
        return status === activeTab;
      })
      .sort((a, b) => {
        const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [ALERTS, activeTab, alertStatuses]);

  const markTreated = async (alertId: string) => {
    setAlertStatuses((prev) => ({ ...prev, [alertId]: 'traite' }));
    await supabase
      .from('alerts')
      .update({ status: 'traite', treated_at: new Date().toISOString() })
      .eq('id', alertId);
    refresh();
  };

  const TABS: { key: TabFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'nouveau', label: 'Non traitees', count: untreatedCount },
    { key: 'en_cours', label: 'En cours' },
    { key: 'traite', label: 'Traitees' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Centre d&apos;Alertes</h1>
          <p className="text-sm text-slate-500">Gestion et suivi des alertes terrain</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Alertes non traitees"
          value={untreatedCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Traitees ce mois"
          value={treatedCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Temps de reponse moyen"
          value="4h"
          icon={<Clock className="w-5 h-5" />}
          iconColor="text-sky-600 bg-sky-50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
              activeTab === t.key
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-[10px] font-bold px-1 ${
                activeTab === t.key
                  ? 'bg-indigo-200 text-indigo-800'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500">
            Aucune alerte dans cette categorie.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const currentStatus = getStatus(alert);
            const sevConfig = SEVERITY_CONFIG[alert.severity];
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all border-l-4 ${sevConfig.borderLeft} ${
                  currentStatus === 'traite' ? 'opacity-60' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs text-slate-400">{formatRelativeTime(alert.created_at)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs font-medium text-slate-700">{alert.signal.client_name}</span>
                    <SeverityBadge severity={alert.severity} size="sm" showLabel />
                    {currentStatus === 'traite' && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        Traite
                      </span>
                    )}
                    {currentStatus === 'en_cours' && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                        En cours
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 leading-relaxed">
                    <AbbreviationHighlight text={alert.signal.content} />
                  </p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    {currentStatus !== 'traite' && (
                      <button
                        onClick={() => markTreated(alert.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marquer traite
                      </button>
                    )}
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      Ajouter note
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
