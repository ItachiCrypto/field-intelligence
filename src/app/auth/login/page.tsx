'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { BarChart3, Target, TrendingUp, Zap, ArrowRight } from 'lucide-react';

const PROFILES: { role: UserRole; icon: React.ElementType; title: string; subtitle: string; accent: string; iconBg: string }[] = [
  {
    role: 'marketing',
    icon: BarChart3,
    title: 'Responsable Marketing',
    subtitle: 'Intelligence concurrentielle et veille marche',
    accent: 'border-indigo-200 hover:border-indigo-400 hover:shadow-md',
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    role: 'kam',
    icon: Target,
    title: 'Key Account Manager',
    subtitle: 'Gestion grands comptes et alertes terrain',
    accent: 'border-teal-200 hover:border-teal-400 hover:shadow-md',
    iconBg: 'bg-teal-50 text-teal-600',
  },
  {
    role: 'dirco',
    icon: TrendingUp,
    title: 'Directeur Commercial',
    subtitle: 'Pilotage et management de l\'equipe terrain',
    accent: 'border-amber-200 hover:border-amber-400 hover:shadow-md',
    iconBg: 'bg-amber-50 text-amber-600',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (role: UserRole) => {
    login(role);
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-1 items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Field Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Selectionnez votre profil pour acceder a la demo</p>
        </div>

        {/* Profile cards */}
        <div className="space-y-3">
          {PROFILES.map(({ role, icon: Icon, title, subtitle, accent, iconBg }) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className={`group w-full flex items-center gap-4 p-4 bg-white rounded-xl border ${accent} shadow-sm transition-all duration-200 cursor-pointer text-left`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-8">
          Version demo &middot; Donnees fictives &middot; Mars 2026
        </p>
      </div>
    </div>
  );
}
