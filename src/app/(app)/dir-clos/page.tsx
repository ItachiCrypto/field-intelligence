// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { ObjectifType, OBJECTIF_LABELS } from '@/lib/types-v2';
import type { CRObjectif } from '@/lib/types-v2';
import { REGIONS } from '@/lib/constants';
import { KpiCard } from '@/components/shared/kpi-card';
import { cn, formatDate } from '@/lib/utils';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { FileText, CheckCircle, XCircle, Target, Plus, Pencil, Trash2, X } from 'lucide-react';

const supabase = createClient();

const OBJECTIF_TYPE_COLORS: Record<ObjectifType, string> = {
  signature: '#6366f1',
  sell_out: '#0ea5e9',
  sell_in: '#8b5cf6',
  formation: '#f59e0b',
  decouverte: '#10b981',
  fidelisation: '#64748b',
};

const BADGE_STYLES: Record<ObjectifType, string> = {
  signature: 'bg-indigo-50 text-indigo-700',
  sell_out: 'bg-sky-50 text-sky-700',
  sell_in: 'bg-violet-50 text-violet-700',
  formation: 'bg-amber-50 text-amber-700',
  decouverte: 'bg-emerald-50 text-emerald-700',
  fidelisation: 'bg-slate-100 text-slate-700',
};

type FilterType = 'tous' | ObjectifType;

const EMPTY_CR_FORM = {
  commercial_name: '',
  client_name: '',
  objectif_type: 'signature' as ObjectifType,
  resultat: 'atteint' as 'atteint' | 'non_atteint',
  cause_echec: '',
  facteur_reussite: '',
  region: REGIONS[0] as string,
  date: new Date().toISOString().slice(0, 10),
};

export default function DirClosPage() {
  const { crObjectifs: CR_OBJECTIFS, refresh } = useAppData();
  const { company } = useAuth();
  const [filter, setFilter] = useState<FilterType>('tous');

  // CRUD state
  const [showModal, setShowModal] = useState(false);
  const [editingCr, setEditingCr] = useState<CRObjectif | null>(null);
  const [form, setForm] = useState(EMPTY_CR_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingCr(null);
    setForm(EMPTY_CR_FORM);
    setShowModal(true);
  }

  function openEdit(cr: CRObjectif) {
    setEditingCr(cr);
    setForm({
      commercial_name: cr.commercial_name,
      client_name: cr.client_name,
      objectif_type: cr.objectif_type,
      resultat: cr.resultat,
      cause_echec: cr.cause_echec || '',
      facteur_reussite: cr.facteur_reussite || '',
      region: cr.region,
      date: cr.date,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.commercial_name.trim() || !form.client_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        commercial_name: form.commercial_name,
        client_name: form.client_name,
        objectif_type: form.objectif_type,
        resultat: form.resultat,
        cause_echec: form.resultat === 'non_atteint' ? form.cause_echec || null : null,
        facteur_reussite: form.resultat === 'atteint' ? form.facteur_reussite || null : null,
        region: form.region,
        date: form.date,
        company_id: company?.id,
      };
      if (editingCr) {
        await supabase.from('cr_objectifs').update(payload).eq('id', editingCr.id);
      } else {
        await supabase.from('cr_objectifs').insert(payload);
      }
      setShowModal(false);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce CR ?')) return;
    await supabase.from('cr_objectifs').delete().eq('id', id);
    refresh();
  }

  const filtered = useMemo(
    () => filter === 'tous' ? CR_OBJECTIFS : CR_OBJECTIFS.filter(cr => cr.objectif_type === filter),
    [CR_OBJECTIFS, filter],
  );

  const kpis = useMemo(() => {
    const total = CR_OBJECTIFS.length;
    const atteints = CR_OBJECTIFS.filter(cr => cr.resultat === 'atteint').length;
    const nonAtteints = total - atteints;
    const taux = total > 0 ? Math.round((atteints / total) * 100) : 0;
    return { total, atteints, nonAtteints, taux };
  }, [CR_OBJECTIFS]);

  // Bar chart: taux de reussite par commercial
  const barData = useMemo(() => {
    const grouped: Record<string, { atteint: number; total: number }> = {};
    for (const cr of filtered) {
      if (!grouped[cr.commercial_name]) grouped[cr.commercial_name] = { atteint: 0, total: 0 };
      grouped[cr.commercial_name].total++;
      if (cr.resultat === 'atteint') grouped[cr.commercial_name].atteint++;
    }
    return Object.entries(grouped)
      .map(([name, { atteint, total }]) => ({
        name,
        taux: Math.round((atteint / total) * 100),
        atteint,
        total,
      }))
      .sort((a, b) => b.taux - a.taux);
  }, [filtered]);

  // Donut chart: repartition par type d'objectif
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      counts[cr.objectif_type] = (counts[cr.objectif_type] || 0) + 1;
    }
    return Object.entries(counts).map(([type, count]) => ({
      name: OBJECTIF_LABELS[type as ObjectifType],
      value: count,
      type: type as ObjectifType,
    }));
  }, [CR_OBJECTIFS]);

  // Causes de non-atteinte
  const causesData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      if (cr.resultat === 'non_atteint' && cr.cause_echec) {
        counts[cr.cause_echec] = (counts[cr.cause_echec] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([cause, count]) => ({ name: cause, count }))
      .sort((a, b) => b.count - a.count);
  }, [CR_OBJECTIFS]);

  // Facteurs de reussite
  const facteursData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cr of CR_OBJECTIFS) {
      if (cr.resultat === 'atteint' && cr.facteur_reussite) {
        counts[cr.facteur_reussite] = (counts[cr.facteur_reussite] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([facteur, count]) => ({ name: facteur, count }))
      .sort((a, b) => b.count - a.count);
  }, [CR_OBJECTIFS]);

  // Table rows sorted by date desc
  const tableRows = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'tous', label: 'Tous' },
    ...Object.entries(OBJECTIF_LABELS).map(([k, v]) => ({ key: k as ObjectifType, label: v })),
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Taux d'Atteinte des Objectifs</h1>
          <p className="text-sm text-slate-500 mt-1">Resultats par objectif de visite depuis les CR</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau CR
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Objectifs analyses"
          value={kpis.total}
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <KpiCard
          label="Objectifs atteints"
          value={kpis.atteints}
          suffix={`(${kpis.taux}%)`}
          icon={<CheckCircle className="w-5 h-5" />}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          label="Non atteints"
          value={kpis.nonAtteints}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="text-rose-600 bg-rose-50"
        />
        <KpiCard
          label="Taux reussite global"
          value={kpis.taux}
          suffix="%"
          icon={<Target className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === opt.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Taux de reussite par commercial</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 12 }} width={75} />
              <Tooltip
                formatter={((value: any) => [`${value}%`, 'Taux']) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <Bar dataKey="taux" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {barData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.taux >= 70 ? '#10b981' : entry.taux >= 50 ? '#f59e0b' : '#f43f5e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> &ge;70%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> &ge;50%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> &lt;50%</span>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Repartition par type d'objectif</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={OBJECTIF_TYPE_COLORS[entry.type]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: any) => [value, 'CR']) as any}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: '#64748b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Causes & Facteurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Causes de non-atteinte */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-700">Causes de non-atteinte</h2>
          </div>
          {causesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={causesData.length * 52 + 20}>
              <BarChart data={causesData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={({ x, y, payload }: any) => { const text = payload.value?.length > 25 ? payload.value.slice(0, 25) + '…' : payload.value; return <text x={x} y={y} dy={4} textAnchor="end" fill="#334155" fontSize={11}>{text}</text>; }} width={160} />
                <Tooltip
                  formatter={((value: any) => [value, 'CR']) as any}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Aucune cause renseignee.</p>
          )}
        </div>

        {/* Facteurs de reussite */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-700">Facteurs de reussite</h2>
          </div>
          {facteursData.length > 0 ? (
            <ResponsiveContainer width="100%" height={facteursData.length * 52 + 20}>
              <BarChart data={facteursData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={({ x, y, payload }: any) => { const text = payload.value?.length > 25 ? payload.value.slice(0, 25) + '…' : payload.value; return <text x={x} y={y} dy={4} textAnchor="end" fill="#334155" fontSize={11}>{text}</text>; }} width={160} />
                <Tooltip
                  formatter={((value: any) => [value, 'CR']) as any}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Aucun facteur renseigne.</p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Commercial</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Type objectif</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Resultat</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Client</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Region</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Detail</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(cr => (
                <tr key={cr.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{cr.commercial_name}</td>
                  <td className="py-3 px-4">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', BADGE_STYLES[cr.objectif_type])}>
                      {OBJECTIF_LABELS[cr.objectif_type]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        cr.resultat === 'atteint'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700',
                      )}
                    >
                      {cr.resultat === 'atteint'
                        ? <CheckCircle className="w-3 h-3" />
                        : <XCircle className="w-3 h-3" />}
                      {cr.resultat === 'atteint' ? 'Atteint' : 'Non atteint'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{cr.client_name}</td>
                  <td className="py-3 px-4 text-slate-500 tabular-nums">{formatDate(cr.date)}</td>
                  <td className="py-3 px-4 text-slate-500">{cr.region}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs max-w-[200px]">
                    {cr.resultat === 'non_atteint' && cr.cause_echec && (
                      <span className="text-rose-600">{cr.cause_echec}</span>
                    )}
                    {cr.resultat === 'atteint' && cr.facteur_reussite && (
                      <span className="text-emerald-600">{cr.facteur_reussite}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cr)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cr.id)} className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{editingCr ? 'Modifier le CR' : 'Nouveau CR'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Commercial</label>
                <input type="text" value={form.commercial_name} onChange={e => setForm({...form, commercial_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Client</label>
                <input type="text" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type d'objectif</label>
                <select value={form.objectif_type} onChange={e => setForm({...form, objectif_type: e.target.value as ObjectifType})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  {Object.entries(OBJECTIF_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Resultat</label>
                <select value={form.resultat} onChange={e => setForm({...form, resultat: e.target.value as 'atteint'|'non_atteint'})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  <option value="atteint">Atteint</option>
                  <option value="non_atteint">Non atteint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Region</label>
                <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            </div>
            {form.resultat === 'non_atteint' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Cause d'echec</label>
                <input type="text" value={form.cause_echec} onChange={e => setForm({...form, cause_echec: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            )}
            {form.resultat === 'atteint' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Facteur de reussite</label>
                <input type="text" value={form.facteur_reussite} onChange={e => setForm({...form, facteur_reussite: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            )}
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
