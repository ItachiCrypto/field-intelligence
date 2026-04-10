'use client';

import { useAuth } from '@/lib/auth-context';
import { CreditCard } from 'lucide-react';

export default function AdminBillingPage() {
  const { company } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Facturation</h1>
        <p className="text-sm text-slate-500 mt-1">{company?.name ?? 'Mon entreprise'}</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">La facturation Stripe sera configuree prochainement.</p>
        <p className="text-xs text-slate-400 mt-2">Plan actuel : {company?.plan ?? 'free'}</p>
      </div>
    </div>
  );
}
