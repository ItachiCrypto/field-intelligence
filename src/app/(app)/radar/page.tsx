// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG, REGIONS } from '@/lib/constants';
import { SeverityBadge } from '@/components/shared/severity-badge';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { SignalCard } from '@/components/shared/signal-card';
import { Modal } from '@/components/shared/modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatTrend } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Radar, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2 } from 'lucide-react';

const SEVERITY_OPTIONS = ['vert', 'jaune', 'orange', 'rouge'] as const;

type PeriodFilter = 'all' | 'week' | 'month';

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: 'all', label: 'Toute periode' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

const BAR_COLORS = ['#e11d48', '#f59e0b', '#6366f1', '#10b981'];

export default function RadarPage() {
  const { competitors: COMPETITORS, signals: SIGNALS, refresh } = useAppData();
  const { company } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  // CRUD state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingCompetitor, setDeletingCompetitor] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMentionType, setFormMentionType] = useState('');
  const [formRisk, setFormRisk] = useState<string>('vert');
  const [formIsNew, setFormIsNew] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormMentionType('');
    setFormRisk('vert');
    setFormIsNew(false);
  };

  const openEdit = (comp: any) => {
    setEditingCompetitor(comp);
    setFormName(comp.name);
    setFormMentionType(comp.mention_type || '');
    setFormRisk(comp.risk || 'vert');
    setFormIsNew(comp.is_new ?? false);
    setShowEdit(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('competitors').insert({
      name: formName,
      mention_type: formMentionType,
      risk: formRisk,
      is_new: formIsNew,
      company_id: company?.id,
    });
    setSaving(false);
    setShowCreate(false);
    resetForm();
    refresh();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetitor) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('competitors').update({
      name: formName,
      mention_type: formMentionType,
      risk: formRisk,
      is_new: formIsNew,
    }).eq('id', editingCompetitor.id);
    setSaving(false);
    setShowEdit(false);
    setEditingCompetitor(null);
    resetForm();
    refresh();
  };

  const handleDelete = async () => {
    if (!deletingCompetitor) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('competitors').delete().eq('id', deletingCompetitor.id);
    setSaving(false);
    setShowDelete(false);
    setDeletingCompetitor(null);
    refresh();
  };

  const chartData = useMemo(() => {
    return COMPETITORS.map((c) => ({ name: c.name, mentions: c.mentions }));
  }, []);

  const competitorSignals = useMemo(() => {
    if (!selectedCompetitor) return [];
    const now = new Date();
    return SIGNALS
      .filter((s) => {
        if (s.competitor_name !== selectedCompetitor) return false;
        if (regionFilter !== 'all' && s.region !== regionFilter) return false;
        if (periodFilter !== 'all') {
          const diffDays = (now.getTime() - new Date(s.created_at).getTime()) / 86400000;
          if (periodFilter === 'week' && diffDays > 7) return false;
          if (periodFilter === 'month' && diffDays > 30) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedCompetitor, regionFilter, periodFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Radar Concurrentiel</h1>
            <p className="text-sm text-slate-500">Surveillance des activites concurrentes</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau concurrent
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Periode</span>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriodFilter(opt.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              periodFilter === opt.key
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-1">Region</span>
        <button
          onClick={() => setRegionFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            regionFilter === 'all'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Toutes
        </button>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              regionFilter === r
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Competitor table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Concurrent</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Mentions</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type de signal</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Evolution</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Niveau de risque</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((comp) => {
                const isSelected = selectedCompetitor === comp.name;
                return (
                  <tr
                    key={comp.id}
                    onClick={() => setSelectedCompetitor(isSelected ? null : comp.name)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <SeverityIndicator severity={comp.risk} size="sm" />
                        <span className="font-medium text-slate-900">{comp.name}</span>
                        {comp.is_new && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900 tabular-nums">{comp.mentions}</td>
                    <td className="px-4 py-3 text-slate-600">{comp.mention_type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1">
                        {comp.evolution > 0 ? (
                          <TrendingUp className="w-4 h-4 text-rose-500" />
                        ) : comp.evolution < 0 ? (
                          <TrendingDown className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={`text-sm font-medium tabular-nums ${
                          comp.evolution > 0 ? 'text-rose-600' : comp.evolution < 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {formatTrend(comp.evolution)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SeverityBadge severity={comp.risk} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(comp); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingCompetitor(comp); setShowDelete(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Mentions par concurrent</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value}`, 'Mentions']}
              />
              <Bar dataKey="mentions" radius={[0, 6, 6, 0]} barSize={24}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Selected competitor signals */}
      {selectedCompetitor && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Signaux lies a {selectedCompetitor}
            </h2>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-1.5 tabular-nums">
              {competitorSignals.length}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          {competitorSignals.length > 0 ? (
            competitorSignals.map((s) => <SignalCard key={s.id} signal={s} />)
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              Aucun signal pour ce concurrent avec les filtres actuels.
            </div>
          )}
        </div>
      )}
      {/* Create Modal */}
      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau concurrent">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de mention</label>
              <input type="text" required value={formMentionType} onChange={e => setFormMentionType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Niveau de risque</label>
              <select value={formRisk} onChange={e => setFormRisk(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="form-is-new" checked={formIsNew} onChange={e => setFormIsNew(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="form-is-new" className="text-sm font-medium text-slate-700">Nouveau concurrent</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Creer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditingCompetitor(null); }} title="Modifier le concurrent">
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type de mention</label>
              <input type="text" required value={formMentionType} onChange={e => setFormMentionType(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Niveau de risque</label>
              <select value={formRisk} onChange={e => setFormRisk(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="form-is-new-edit" checked={formIsNew} onChange={e => setFormIsNew(e.target.checked)} className="rounded border-slate-300" />
              <label htmlFor="form-is-new-edit" className="text-sm font-medium text-slate-700">Nouveau concurrent</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowEdit(false); setEditingCompetitor(null); }} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletingCompetitor(null); }}
        onConfirm={handleDelete}
        title="Supprimer le concurrent"
        message={`Voulez-vous vraiment supprimer "${deletingCompetitor?.name}" ? Cette action est irreversible.`}
        loading={saving}
      />
    </div>
  );
}
