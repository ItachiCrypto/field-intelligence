// @ts-nocheck
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { SIGNAL_TYPES, REGIONS } from '@/lib/constants';
import { SignalCard } from '@/components/shared/signal-card';
import { Modal } from '@/components/shared/modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SignalForm } from '@/components/forms/signal-form';
import { SignalType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Activity, Plus, Pencil, Trash2, Share2, FileText, Mail, Loader2 } from 'lucide-react';

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
  const { signals: SIGNALS, refresh } = useAppData();
  const { company } = useAuth();
  const supabase = createClient();

  const [activeType, setActiveType] = useState<SignalType | 'all'>('all');
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSignal, setDeletingSignal] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);
  const [sharingSignal, setSharingSignal] = useState<any>(null);
  const [viewingSourceOf, setViewingSourceOf] = useState<any>(null);

  const handleCreate = async (data: any) => {
    setCrudLoading(true);
    try {
      await supabase.from('signals').insert({ ...data, company_id: company?.id });
      await refresh();
      setShowCreateModal(false);
    } finally {
      setCrudLoading(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingSignal) return;
    setCrudLoading(true);
    try {
      await supabase.from('signals').update(data).eq('id', editingSignal.id);
      await refresh();
      setShowEditModal(false);
      setEditingSignal(null);
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSignal) return;
    setCrudLoading(true);
    try {
      await supabase.from('signals').delete().eq('id', deletingSignal.id);
      await refresh();
      setShowDeleteConfirm(false);
      setDeletingSignal(null);
    } finally {
      setCrudLoading(false);
    }
  };

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
  }, [SIGNALS, activeType, activeRegion, activePeriod]);

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau signal
        </button>
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
                  <div key={signal.id} className="group relative">
                    <SignalCard signal={signal} />
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {signal.source_report_id && (
                        <button
                          onClick={() => setViewingSourceOf(signal)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-colors shadow-sm"
                          title="Voir le CR source"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setSharingSignal(signal)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 transition-colors shadow-sm"
                        title="Partager avec un collegue"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setEditingSignal(signal); setShowEditModal(true); }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingSignal(signal); setShowDeleteConfirm(true); }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouveau signal" maxWidth="max-w-2xl">
        <SignalForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={crudLoading}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingSignal(null); }}
        title="Modifier le signal"
        maxWidth="max-w-2xl"
      >
        {editingSignal && (
          <SignalForm
            signal={editingSignal}
            onSubmit={handleEdit}
            onCancel={() => { setShowEditModal(false); setEditingSignal(null); }}
            loading={crudLoading}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingSignal(null); }}
        onConfirm={handleDelete}
        title="Supprimer le signal"
        message={`Voulez-vous vraiment supprimer le signal "${deletingSignal?.title}" ? Cette action est irreversible.`}
        loading={crudLoading}
      />

      {/* Share signal */}
      <Modal
        open={!!sharingSignal}
        onClose={() => setSharingSignal(null)}
        title="Partager ce signal"
        maxWidth="max-w-lg"
      >
        {sharingSignal && <ShareSignalForm signal={sharingSignal} onClose={() => setSharingSignal(null)} />}
      </Modal>

      {/* View source CR */}
      <Modal
        open={!!viewingSourceOf}
        onClose={() => setViewingSourceOf(null)}
        title="Compte rendu source"
        maxWidth="max-w-3xl"
      >
        {viewingSourceOf && <SourceReportView sourceReportId={viewingSourceOf.source_report_id} />}
      </Modal>
    </div>
  );
}

function ShareSignalForm({ signal, onClose }: { signal: any; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const signalSummary = [
    `Type : ${signal.type}`,
    signal.severity ? `Severite : ${signal.severity}` : null,
    signal.client_name ? `Client : ${signal.client_name}` : null,
    signal.region ? `Region : ${signal.region}` : null,
    signal.competitor_name ? `Concurrent : ${signal.competitor_name}` : null,
    '',
    signal.title ? `Titre : ${signal.title}` : null,
    signal.content ? `\nContenu :\n${signal.content}` : null,
  ].filter(Boolean).join('\n');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      setError('Email invalide');
      return;
    }
    const subject = `Signal terrain${signal.client_name ? ' - ' + signal.client_name : ''}`;
    const body = [
      note ? note + '\n\n---\n' : '',
      signalSummary,
      '\n---\nPartage depuis Field Intelligence',
    ].join('');
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email du collegue</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="collegue@entreprise.com"
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Note (optionnelle)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Quelques mots pour contextualiser l'envoi..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">
        {signalSummary}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
        <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <Mail className="w-4 h-4" />
          Partager par email
        </button>
      </div>
    </form>
  );
}

function SourceReportView({ sourceReportId }: { sourceReportId: string }) {
  const supabase = createClient();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('raw_visit_reports')
        .select('id, external_id, subject, content_text, commercial_name, commercial_email, client_name, visit_date, synced_at')
        .eq('id', sourceReportId)
        .single();
      if (!mounted) return;
      if (err) setError(err.message);
      else setReport(data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [sourceReportId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Chargement du CR source...
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-rose-600">Erreur : {error}</p>;
  }
  if (!report) {
    return <p className="text-sm text-slate-500 italic">CR source introuvable.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-500 uppercase tracking-wider font-medium">Client</p>
          <p className="text-slate-800 font-medium">{report.client_name || '--'}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider font-medium">Commercial</p>
          <p className="text-slate-800 font-medium">{report.commercial_name || '--'}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider font-medium">Date visite</p>
          <p className="text-slate-800 tabular-nums">{report.visit_date ? formatDate(report.visit_date) : '--'}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider font-medium">Source externe</p>
          <p className="text-slate-800 font-mono text-[11px]">{report.external_id || '--'}</p>
        </div>
      </div>
      {report.subject && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Sujet</p>
          <p className="text-sm text-slate-800 font-medium">{report.subject}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Contenu du CR</p>
        <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto">
          {report.content_text || <span className="italic text-slate-400">Aucun contenu.</span>}
        </div>
      </div>
    </div>
  );
}
