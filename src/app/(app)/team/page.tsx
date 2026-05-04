// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG, REGIONS } from '@/lib/constants';
import { qualityScoreToSeverity, cn } from '@/lib/utils';
import { KpiCard } from '@/components/shared/kpi-card';
import { QualityScoreInfo } from '@/components/shared/quality-score-info';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { Modal } from '@/components/shared/modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Users, ChevronUp, ChevronDown, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, GraduationCap, Plus, Pencil, Trash2 } from 'lucide-react';

type SortKey = 'name' | 'region' | 'cr_week' | 'cr_total' | 'quality_score' | 'useful_signals' | 'quality_trend';
type SortDir = 'asc' | 'desc';

export default function TeamPage() {
  const { commercials: COMMERCIALS, rawReportsCount, refresh } = useAppData();
  const { company } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>('quality_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // CRUD state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCommercial, setEditingCommercial] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingCommercial, setDeletingCommercial] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRegion, setFormRegion] = useState(REGIONS[0]);
  const [formQualityScore, setFormQualityScore] = useState(50);
  const [formQualityTrend, setFormQualityTrend] = useState(0);

  const resetForm = () => {
    setFormName('');
    setFormRegion(REGIONS[0]);
    setFormQualityScore(50);
    setFormQualityTrend(0);
  };

  const openEdit = (c: any) => {
    setEditingCommercial(c);
    setFormName(c.name);
    setFormRegion(c.region || REGIONS[0]);
    setFormQualityScore(c.quality_score ?? 50);
    setFormQualityTrend(c.quality_trend ?? 0);
    setShowEdit(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('commercials').insert({
      name: formName,
      region: formRegion,
      quality_score: formQualityScore,
      quality_trend: formQualityTrend,
      company_id: company?.id,
    });
    setSaving(false);
    setShowCreate(false);
    resetForm();
    refresh();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommercial) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('commercials').update({
      name: formName,
      region: formRegion,
      quality_score: formQualityScore,
      quality_trend: formQualityTrend,
    }).eq('id', editingCommercial.id);
    setSaving(false);
    setShowEdit(false);
    setEditingCommercial(null);
    resetForm();
    refresh();
  };

  const handleDelete = async () => {
    if (!deletingCommercial) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('commercials').delete().eq('id', deletingCommercial.id);
    setSaving(false);
    setShowDelete(false);
    setDeletingCommercial(null);
    refresh();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...COMMERCIALS].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [COMMERCIALS, sortKey, sortDir]);

  const avgScore = COMMERCIALS.length > 0 ? Math.round(COMMERCIALS.reduce((s, c) => s + c.quality_score, 0) / COMMERCIALS.length) : 0;
  // Source de verite : raw_visit_reports (tous les CRs ingeres), pas la somme
  // des cr_total par commercial (qui peut manquer des CRs sans commercial matche).
  const totalCRAllTime = rawReportsCount || COMMERCIALS.reduce((s, c) => s + (c.cr_total || 0), 0);
  const totalCRWeek = COMMERCIALS.reduce((s, c) => s + (c.cr_week || 0), 0);
  const coachingCount = COMMERCIALS.filter((c) => c.quality_trend < -5).length;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="w-3.5 h-3.5 inline-block" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 inline text-indigo-600" />
      : <ChevronDown className="w-3.5 h-3.5 inline text-indigo-600" />;
  };

  const ColHeader = ({ col, label, align }: { col: SortKey; label: string; align?: string }) => (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none transition-colors',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      )}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Suivi Equipe Commerciale</h1>
            <p className="text-sm text-slate-500">
              <span className="tabular-nums">{COMMERCIALS.length}</span> commerciaux actifs
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau commercial
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Commerciaux"
          value={COMMERCIALS.length}
          icon={<Users className="w-5 h-5" />}
          iconColor="text-slate-600 bg-slate-50"
        />
        <KpiCard
          label="Score qualite moyen"
          value={avgScore}
          suffix="%"
          info={<QualityScoreInfo />}
        />
        <KpiCard
          label="CR analyses (total)"
          value={totalCRAllTime}
          suffix={totalCRWeek > 0 ? ` (${totalCRWeek} sem.)` : ''}
        />
        <KpiCard
          label="Coaching recommande"
          value={coachingCount}
          icon={<GraduationCap className="w-5 h-5" />}
          iconColor="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <ColHeader col="name" label="Nom" />
                <ColHeader col="region" label="Region" />
                <ColHeader col="cr_total" label="CR total" align="center" />
                <ColHeader col="cr_week" label="CR semaine" align="center" />
                <ColHeader col="quality_score" label="Score qualite" align="center" />
                <ColHeader col="useful_signals" label="Signaux utiles" align="center" />
                <ColHeader col="quality_trend" label="Tendance" align="center" />
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const severity = qualityScoreToSeverity(c.quality_score);
                const sevConfig = SEVERITY_CONFIG[severity];
                const needsCoaching = c.quality_trend < -5;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b border-slate-100 transition-colors',
                      needsCoaching ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-slate-50/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium text-slate-900">{c.name}</span>
                        {needsCoaching && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.region}</td>
                    <td className="px-4 py-3 text-center text-slate-900 tabular-nums font-semibold">{c.cr_total || 0}</td>
                    <td className="px-4 py-3 text-center text-slate-700 tabular-nums">{c.cr_week || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums border',
                        sevConfig.bg, sevConfig.text, sevConfig.border
                      )}>
                        <SeverityIndicator severity={severity} size="sm" />
                        {c.quality_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-900 tabular-nums">{c.useful_signals || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                        c.quality_trend > 0 ? 'text-emerald-600' : c.quality_trend < 0 ? 'text-rose-600' : 'text-slate-400'
                      )}>
                        {c.quality_trend > 0 && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {c.quality_trend < 0 && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {c.quality_trend === 0 && <Minus className="w-3.5 h-3.5" />}
                        {c.quality_trend > 0 ? '+' : ''}{c.quality_trend}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeletingCommercial(c); setShowDelete(true); }}
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
      {/* Create Modal */}
      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau commercial">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Score qualite (0-100)</label>
              <input type="number" required min={0} max={100} value={formQualityScore} onChange={e => setFormQualityScore(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tendance qualite</label>
              <input type="number" required value={formQualityTrend} onChange={e => setFormQualityTrend(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
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
        <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditingCommercial(null); }} title="Modifier le commercial">
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Score qualite (0-100)</label>
              <input type="number" required min={0} max={100} value={formQualityScore} onChange={e => setFormQualityScore(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tendance qualite</label>
              <input type="number" required value={formQualityTrend} onChange={e => setFormQualityTrend(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowEdit(false); setEditingCommercial(null); }} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletingCommercial(null); }}
        onConfirm={handleDelete}
        title="Supprimer le commercial"
        message={`Voulez-vous vraiment supprimer "${deletingCommercial?.name}" ? Cette action est irreversible.`}
        loading={saving}
      />
    </div>
  );
}
