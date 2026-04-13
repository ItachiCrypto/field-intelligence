// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/lib/data';
import { SEVERITY_CONFIG, REGIONS } from '@/lib/constants';
import { formatCurrency, formatRelativeTime, scoreToSeverity } from '@/lib/utils';
import { SeverityIndicator } from '@/components/shared/severity-indicator';
import { Modal } from '@/components/shared/modal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, Search, Plus, Pencil, Trash2 } from 'lucide-react';

const SEVERITY_OPTIONS = ['vert', 'jaune', 'orange', 'rouge'] as const;

export default function PortfolioPage() {
  const { accounts: ACCOUNTS, refresh } = useAppData();
  const { company } = useAuth();
  const [search, setSearch] = useState('');

  // CRUD state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formRegion, setFormRegion] = useState(REGIONS[0]);
  const [formCaAnnual, setFormCaAnnual] = useState(0);
  const [formHealth, setFormHealth] = useState<string>('vert');

  const resetForm = () => {
    setFormName('');
    setFormSector('');
    setFormRegion(REGIONS[0]);
    setFormCaAnnual(0);
    setFormHealth('vert');
  };

  const openEdit = (account: any) => {
    setEditingAccount(account);
    setFormName(account.name);
    setFormSector(account.sector || '');
    setFormRegion(account.region || REGIONS[0]);
    setFormCaAnnual(account.ca_annual || 0);
    setFormHealth(account.health || 'vert');
    setShowEdit(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('accounts').insert({
      name: formName,
      sector: formSector,
      region: formRegion,
      ca_annual: formCaAnnual,
      health: formHealth,
      company_id: company?.id,
    });
    setSaving(false);
    setShowCreate(false);
    resetForm();
    refresh();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('accounts').update({
      name: formName,
      sector: formSector,
      region: formRegion,
      ca_annual: formCaAnnual,
      health: formHealth,
    }).eq('id', editingAccount.id);
    setSaving(false);
    setShowEdit(false);
    setEditingAccount(null);
    resetForm();
    refresh();
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('accounts').delete().eq('id', deletingAccount.id);
    setSaving(false);
    setShowDelete(false);
    setDeletingAccount(null);
    refresh();
  };

  const sortedAccounts = useMemo(() => {
    return [...ACCOUNTS]
      .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.risk_score - a.risk_score);
  }, [ACCOUNTS, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Portefeuille Comptes</h1>
            <p className="text-sm text-slate-500">
              <span className="tabular-nums">{sortedAccounts.length}</span> comptes
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowCreate(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau compte
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un compte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Compte</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Secteur</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Region</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">CA annuel</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Signaux actifs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Dernier RDV</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Score risque</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map((account) => {
                const severity = scoreToSeverity(account.risk_score);
                const sevConfig = SEVERITY_CONFIG[severity];
                return (
                  <tr
                    key={account.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <SeverityIndicator severity={account.health} size="sm" />
                        <Link
                          href={`/account/${account.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-700 hover:underline decoration-indigo-300 underline-offset-2"
                        >
                          {account.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{account.sector}</td>
                    <td className="px-4 py-3 text-slate-600">{account.region}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">{formatCurrency(account.ca_annual)}</td>
                    <td className="px-4 py-3 text-center">
                      {account.active_signals > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold tabular-nums px-1.5">
                          {account.active_signals}
                        </span>
                      ) : (
                        <span className="text-slate-400 tabular-nums">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm">{formatRelativeTime(account.last_rdv)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${sevConfig.bg} ${sevConfig.text} border ${sevConfig.border}`}>
                        {account.risk_score}
                        {account.risk_trend !== 0 && (
                          <span className={account.risk_trend > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {account.risk_trend > 0 ? '+' : ''}{account.risk_trend}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(account)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setDeletingAccount(account); setShowDelete(true); }}
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
        {sortedAccounts.length === 0 && (
          <div className="p-12 text-center text-slate-500">Aucun compte ne correspond a la recherche.</div>
        )}
      </div>
      {/* Create Modal */}
      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau compte">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secteur</label>
              <input type="text" required value={formSector} onChange={e => setFormSector(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CA annuel</label>
              <input type="number" required value={formCaAnnual} onChange={e => setFormCaAnnual(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sante</label>
              <select value={formHealth} onChange={e => setFormHealth(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
              </select>
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
        <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditingAccount(null); }} title="Modifier le compte">
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secteur</label>
              <input type="text" required value={formSector} onChange={e => setFormSector(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CA annuel</label>
              <input type="number" required value={formCaAnnual} onChange={e => setFormCaAnnual(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sante</label>
              <select value={formHealth} onChange={e => setFormHealth(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowEdit(false); setEditingAccount(null); }} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">Enregistrer</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletingAccount(null); }}
        onConfirm={handleDelete}
        title="Supprimer le compte"
        message={`Voulez-vous vraiment supprimer le compte "${deletingAccount?.name}" ? Cette action est irreversible.`}
        loading={saving}
      />
    </div>
  );
}
