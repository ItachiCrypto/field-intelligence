// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { MOTIF_LABELS, MOTIF_COLORS } from '@/lib/types-v2';
import { REGIONS } from '@/lib/constants';
import type { DealMotif, DealAnalyse } from '@/lib/types-v2';
import { cn, formatDate } from '@/lib/utils';
import { getISOWeekNumber } from '@/lib/date-utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { AbbreviationHighlight } from '@/components/shared/abbreviation-highlight';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, Percent, Plus, Pencil, Trash2, X } from 'lucide-react';

const supabase = createClient();

type ResultatFilter = 'all' | 'gagne' | 'perdu' | 'en_cours';
type MotifFilter = 'all' | DealMotif;

const RESULTAT_OPTIONS: { key: ResultatFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'gagne', label: 'Gagnes' },
  { key: 'perdu', label: 'Perdus' },
  { key: 'en_cours', label: 'En cours' },
];

const ALL_MOTIFS: DealMotif[] = ['prix', 'produit', 'offre', 'timing', 'concurrent', 'relation', 'budget', 'autre'];

const GAGNE_LINE_MOTIFS: DealMotif[] = ['relation', 'produit', 'prix', 'autre'];

const EMPTY_FORM = {
  motif_principal: 'prix' as DealMotif,
  resultat: 'gagne' as 'gagne' | 'perdu',
  concurrent_nom: '',
  client_name: '',
  commercial_name: '',
  region: REGIONS[0] as string,
  verbatim: '',
};

export default function MktDealPage() {
  const { dealsAnalyse: DEALS_ANALYSE, dealTendance: DEAL_TENDANCE, refresh } = useAppData();
  const { company } = useAuth();
  const [resultatFilter, setResultatFilter] = useState<ResultatFilter>('all');
  const [motifFilter, setMotifFilter] = useState<MotifFilter>('all');

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealAnalyse | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM & { resultat: 'gagne'|'perdu'|'en_cours' }>(EMPTY_FORM as any);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingDeal(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(deal: DealAnalyse) {
    setEditingDeal(deal);
    setForm({
      motif_principal: deal.motif_principal,
      resultat: deal.resultat,
      concurrent_nom: deal.concurrent_nom || '',
      client_name: deal.client_name,
      commercial_name: deal.commercial_name,
      region: deal.region,
      verbatim: deal.verbatim,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.client_name.trim() || !form.commercial_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        motif_principal: form.motif_principal,
        resultat: form.resultat,
        concurrent_nom: form.concurrent_nom || null,
        client_name: form.client_name,
        commercial_name: form.commercial_name,
        region: form.region,
        verbatim: form.verbatim,
        company_id: company?.id,
        date: editingDeal?.date || new Date().toISOString().slice(0, 10),
      };
      if (editingDeal) {
        await supabase.from('deals_marketing').update(payload).eq('id', editingDeal.id);
      } else {
        await supabase.from('deals_marketing').insert(payload);
      }
      setShowModal(false);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce deal ?')) return;
    await supabase.from('deals_marketing').delete().eq('id', id);
    refresh();
  }

  const totalDeals = DEALS_ANALYSE.length;
  const gagnes = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'gagne'), [DEALS_ANALYSE]);
  const perdus = useMemo(() => DEALS_ANALYSE.filter((d) => d.resultat === 'perdu'), [DEALS_ANALYSE]);
  const tauxConversion = totalDeals > 0 ? ((gagnes.length / totalDeals) * 100).toFixed(0) : '0';

  // Donut gagnes: % par motif
  const donutGagne = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    gagnes.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    const total = gagnes.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        value: Math.round((count! / total) * 100),
        motif: motif as DealMotif,
      }))
      .sort((a, b) => b.value - a.value);
  }, [gagnes]);

  // Donut perdus: % par motif
  const donutPerdu = useMemo(() => {
    const counts: Partial<Record<DealMotif, number>> = {};
    perdus.forEach((d) => {
      counts[d.motif_principal] = (counts[d.motif_principal] || 0) + 1;
    });
    const total = perdus.length || 1;
    return Object.entries(counts)
      .map(([motif, count]) => ({
        name: MOTIF_LABELS[motif as DealMotif],
        value: Math.round((count! / total) * 100),
        motif: motif as DealMotif,
      }))
      .sort((a, b) => b.value - a.value);
  }, [perdus]);

  // Gagne tendance: compute weekly % from real deals
  const gagneTendance = useMemo(() => {
    if (gagnes.length === 0) return [];
    const weeks: Record<string, Record<string, number>> = {};
    gagnes.forEach((d) => {
      const dt = new Date(d.date);
      const weekNum = getISOWeekNumber(dt);
      const key = `S${weekNum}`;
      if (!weeks[key]) weeks[key] = {};
      weeks[key][d.motif_principal] = (weeks[key][d.motif_principal] || 0) + 1;
    });
    return Object.entries(weeks)
      .sort(([a], [b]) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
      .slice(-4)
      .map(([semaine, counts]) => {
        const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1;
        const row: Record<string, string | number> = { semaine };
        GAGNE_LINE_MOTIFS.forEach(m => {
          row[m] = Math.round(((counts[m] || 0) / total) * 100);
        });
        return row;
      });
  }, [gagnes]);

  // Perdu tendance: compute % from DEAL_TENDANCE
  const perduTendance = useMemo(() => {
    return DEAL_TENDANCE.map((w) => {
      const total = ALL_MOTIFS.reduce((sum, m) => sum + w[m], 0) || 1;
      const row: Record<string, number | string> = { semaine: w.semaine };
      ALL_MOTIFS.forEach((m) => {
        row[m] = Math.round((w[m] / total) * 100);
      });
      return row;
    });
  }, [DEAL_TENDANCE]);

  const perduLineMotifs = useMemo(() => {
    const motifs = new Set<DealMotif>();
    DEAL_TENDANCE.forEach((w) => {
      ALL_MOTIFS.forEach((m) => {
        if (w[m] > 0) motifs.add(m);
      });
    });
    return Array.from(motifs);
  }, [DEAL_TENDANCE]);

  // Filtered table
  const filteredDeals = useMemo(() => {
    return DEALS_ANALYSE
      .filter((d) => resultatFilter === 'all' || d.resultat === resultatFilter)
      .filter((d) => motifFilter === 'all' || d.motif_principal === motifFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [DEALS_ANALYSE, resultatFilter, motifFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Analyse Deals Gagnes / Perdus</h1>
            <p className="text-sm text-slate-500">Repartition en % des motifs extraits des comptes rendus de visite</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau deal
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total deals"
          value={totalDeals}
          icon={<Target className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
        <KpiCard
          label="Gagnes"
          value={gagnes.length}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Perdus"
          value={perdus.length}
          icon={<TrendingDown className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Taux de conversion"
          value={tauxConversion}
          suffix="%"
          icon={<Percent className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-100"
        />
      </div>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Deals gagnes */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals gagnes</h2>

          {/* Donut gagnes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Repartition par motif (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutGagne}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {donutGagne.map((entry) => (
                      <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any) => [`${value}%`, '']) as any}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line chart gagnes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolution hebdo des motifs gagnes (%)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gagneTendance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 60]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any, name: any) => [`${value}%`, MOTIF_LABELS[name as DealMotif] || name]) as any}
                  />
                  {GAGNE_LINE_MOTIFS.map((motif) => (
                    <Line
                      key={motif}
                      type="monotone"
                      dataKey={motif}
                      name={motif}
                      stroke={MOTIF_COLORS[motif]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: MOTIF_COLORS[motif] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{MOTIF_LABELS[value as DealMotif] || value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: Deals perdus */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Deals perdus</h2>

          {/* Donut perdus */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Repartition par motif (%)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutPerdu}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {donutPerdu.map((entry) => (
                      <Cell key={entry.motif} fill={MOTIF_COLORS[entry.motif]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any) => [`${value}%`, '']) as any}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line chart perdus */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Evolution hebdo des motifs perdus (%)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={perduTendance} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="semaine" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    domain={[0, 60]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                    formatter={((value: any, name: any) => [`${value}%`, MOTIF_LABELS[name as DealMotif] || name]) as any}
                  />
                  {perduLineMotifs.map((motif) => (
                    <Line
                      key={motif}
                      type="monotone"
                      dataKey={motif}
                      name={motif}
                      stroke={MOTIF_COLORS[motif]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: MOTIF_COLORS[motif] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-600">{MOTIF_LABELS[value as DealMotif] || value}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Resultat</span>
          {RESULTAT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setResultatFilter(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                resultatFilter === opt.key
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Motif</span>
          <button
            onClick={() => setMotifFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              motifFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            Tous
          </button>
          {ALL_MOTIFS.map((m) => (
            <button
              key={m}
              onClick={() => setMotifFilter(m)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                motifFilter === m
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              )}
              style={motifFilter === m ? { backgroundColor: MOTIF_COLORS[m] } : undefined}
            >
              {MOTIF_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Motif</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Resultat</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Commercial</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Verbatim</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${MOTIF_COLORS[d.motif_principal]}15`,
                        color: MOTIF_COLORS[d.motif_principal],
                      }}
                    >
                      {MOTIF_LABELS[d.motif_principal]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
                      d.resultat === 'gagne'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : d.resultat === 'perdu'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {d.resultat === 'gagne' ? 'Gagne' : d.resultat === 'perdu' ? 'Perdu' : 'En cours'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{d.concurrent_nom || '--'}</td>
                  <td className="px-4 py-3 text-slate-700">{d.client_name}</td>
                  <td className="px-4 py-3 text-slate-700">{d.commercial_name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.region}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    <AbbreviationHighlight text={d.verbatim} className="text-sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDeals.length === 0 && (
          <div className="p-8 text-center text-slate-500">Aucun deal pour les filtres selectionnes.</div>
        )}
      </div>

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingDeal ? 'Modifier le deal' : 'Nouveau deal'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Motif principal</label>
                <select value={form.motif_principal} onChange={e => setForm({...form, motif_principal: e.target.value as DealMotif})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  {ALL_MOTIFS.map(m => <option key={m} value={m}>{MOTIF_LABELS[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resultat</label>
                <select value={form.resultat} onChange={e => setForm({...form, resultat: e.target.value as 'gagne'|'perdu'|'en_cours'})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  <option value="gagne">Gagne</option>
                  <option value="perdu">Perdu</option>
                  <option value="en_cours">En cours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Client</label>
                <input type="text" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Commercial</label>
                <input type="text" value={form.commercial_name} onChange={e => setForm({...form, commercial_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Concurrent (optionnel)</label>
                <input type="text" value={form.concurrent_nom} onChange={e => setForm({...form, concurrent_nom: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Region</label>
                <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Verbatim</label>
              <textarea value={form.verbatim} onChange={e => setForm({...form, verbatim: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
