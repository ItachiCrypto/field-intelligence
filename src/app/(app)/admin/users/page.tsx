'use client';

import { useAuth } from '@/lib/auth-context';
import { Users, Plus } from 'lucide-react';

export default function AdminUsersPage() {
  const { profile, company } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-slate-500 mt-1">{company?.name ?? 'Mon entreprise'}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer">
          <Plus className="w-4 h-4" />
          Inviter un utilisateur
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">La gestion des utilisateurs sera disponible avec l'integration Stripe.</p>
      </div>
    </div>
  );
}
