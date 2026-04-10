// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import {
  Users, Plus, Trash2, Mail, Shield, Crown,
  BarChart3, Target, UserCheck, AlertTriangle, X,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  marketing: 'Marketing',
  kam: 'KAM',
  dirco: 'Directeur Commercial',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-slate-100 text-slate-700',
  marketing: 'bg-indigo-50 text-indigo-700',
  kam: 'bg-teal-50 text-teal-700',
  dirco: 'bg-amber-50 text-amber-700',
};

const ROLE_ICONS: Record<string, typeof Shield> = {
  admin: Crown,
  marketing: BarChart3,
  kam: Target,
  dirco: UserCheck,
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : '??';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  const { profile, company } = useAuth();
  const supabase = createClient();

  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('marketing');
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const planLimit = company?.plan_user_limit ?? 5;
  const userCount = users.length;
  const limitReached = userCount >= planLimit;

  // --- Data fetching ---

  async function fetchUsers() {
    if (!company?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true });
    setUsers(data ?? []);
  }

  async function fetchInvitations() {
    if (!company?.id) return;
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', company.id)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });
    setInvitations(data ?? []);
  }

  useEffect(() => {
    if (!company?.id) return;
    setLoading(true);
    Promise.all([fetchUsers(), fetchInvitations()]).finally(() => setLoading(false));
  }, [company?.id]);

  // --- Actions ---

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!company?.id || !inviteEmail.trim()) return;
    setInviting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const token = crypto.randomUUID();
    const { error } = await supabase.from('invitations').insert({
      company_id: company.id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      setErrorMsg("Erreur lors de l'envoi de l'invitation.");
    } else {
      setSuccessMsg(`Invitation envoyee a ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('marketing');
      await fetchInvitations();
    }
    setInviting(false);
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
  }

  async function handleDeleteUser(userId: string) {
    setDeleting(true);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function handleCancelInvitation(invitationId: string) {
    await supabase.from('invitations').delete().eq('id', invitationId);
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  }

  // --- Guard ---

  if (!profile || !company) return null;

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">{company.name}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-700">
          <Users className="w-4 h-4" />
          {userCount} / {planLimit} utilisateurs
        </span>
      </div>

      {/* Success / Error banners */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
          <UserCheck className="w-4 h-4 shrink-0" />
          {successMsg}
          <button onClick={() => setSuccessMsg('')} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          Inviter un utilisateur
        </h2>
        {limitReached ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Limite atteinte &mdash;{' '}
              <a href="/admin/billing" className="underline font-medium hover:text-amber-900">
                Passez au plan superieur
              </a>
            </span>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="invite-email" className="block text-xs font-medium text-slate-500 mb-1">
                Adresse email
              </label>
              <input
                id="invite-email"
                type="email"
                required
                placeholder="collaborateur@entreprise.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="w-48">
              <label htmlFor="invite-role" className="block text-xs font-medium text-slate-500 mb-1">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="marketing">Marketing</option>
                <option value="kam">KAM</option>
                <option value="dirco">Directeur Commercial</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {inviting ? 'Envoi...' : 'Inviter'}
            </button>
          </form>
        )}
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            Membres de l'equipe
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">Aucun utilisateur</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Membre depuis</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => {
                const RoleIcon = ROLE_ICONS[user.role] ?? Shield;
                const isCurrentUser = user.id === profile.id;
                const isAdmin = user.role === 'admin';
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {getInitials(user.name, user.email)}
                        </div>
                        <span className="font-medium text-slate-900">
                          {user.name || user.email?.split('@')[0]}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">(vous)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {user.created_at ? formatDate(user.created_at) : '--'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isAdmin && !isCurrentUser && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending invitations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            Invitations en attente
          </h2>
        </div>
        {invitations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Aucune invitation en attente
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Expire le</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 text-slate-700">{inv.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[inv.role] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {ROLE_LABELS[inv.role] ?? inv.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {inv.expires_at ? formatDate(inv.expires_at) : '--'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Supprimer l'utilisateur</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cette action est irreversible.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Voulez-vous vraiment supprimer{' '}
              <span className="font-medium text-slate-900">
                {deleteTarget.name || deleteTarget.email}
              </span>{' '}
              de l'equipe ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteUser(deleteTarget.id)}
                disabled={deleting}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
