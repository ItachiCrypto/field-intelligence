'use client';

import { useState, useMemo } from 'react';
import { SIGNALS } from '@/lib/seed-data';
import { SIGNAL_TYPES, REGIONS } from '@/lib/constants';
import { SignalCard } from '@/components/shared/signal-card';
import { SignalType } from '@/lib/types';
import { Activity } from 'lucide-react';

type PeriodFilter = 'all' | 'today' | 'week' | 'month';

const TYPE_OPTIONS: { key: SignalType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'concurrence', label: 'Concurrence' },
  { key: 'besoin', label: 'Besoin' },
  { key: 'prix', label: 'Prix' },
  { key: 'satisfaction', label: 'Satisfaction' },
  { key: 'opportunite', label: 'Opportunite' },
];

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: 'Aujourd\'hui' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return 'Cette semaine';
  return 'Plus ancien';
}

const GROUP_ORDER = ['Aujourd\'hui', 'Hier', 'Cette semaine', 'Plus ancien'];

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function SignalsPage() {
  const [activeType, setActiveType] = useState<SignalType | 'all'>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('all');

  const filtered = useMemo(() => {
    const now = new Date();
    return SIGNALS
      .filter((s) => {
        if (activeType !== 'all' && s.type !== activeType) return false;
        if (activeRegion !== 'all' && s.region !== activeRegion) return false;
        if (activePeriod !== 'all') {
          const diffDays = (now.getTime() - new Date(s.created_at).getTime()) / 86400000;
          if (activePeriod === 'today' && diffDays > 1) return false;
          if (activePeriod === 'week' && diffDays > 7) return false;
          if (activePeriod === 'month' && diffDays > 30) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeType, activeRegion, activePeriod]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const signal of filtered) {
      const group = getDateGroup(signal.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(signal);
    }
    return GROUP_ORDER.filter((g) => groups[g]).map((g) => ({ label: g, signals: groups[g] }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Fil des Signaux</h1>
            <p className="text-sm text-slate-500">
              <span className="tabular-nums">{filtered.length}</span> signaux
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        {/* Type pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Type</span>
          {TYPE_OPTIONS.map((opt) => (
            <PillButton key={opt.key} active={activeType === opt.key} onClick={() => setActiveType(opt.key)}>
              {opt.label}
            </PillButton>
          ))}
        </div>

        {/* Region pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Region</span>
          <PillButton active={activeRegion === 'all'} onClick={() => setActiveRegion('all')}>
            Toutes
          </PillButton>
          {REGIONS.map((region) => (
            <PillButton key={region} active={activeRegion === region} onClick={() => setActiveRegion(region)}>
              {region}
            </PillButton>
          ))}
        </div>

        {/* Period pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Periode</span>
          {PERIOD_OPTIONS.map((opt) => (
            <PillButton key={opt.key} active={activePeriod === opt.key} onClick={() => setActivePeriod(opt.key)}>
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Grouped signals */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">Aucun signal ne correspond aux filtres selectionnes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-slate-700">{group.label}</h2>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 tabular-nums">{group.signals.length}</span>
              </div>
              <div className="space-y-3">
                {group.signals.map((signal) => (
                  <SignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
