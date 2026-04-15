'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import Link from 'next/link';
import { Settings, User, Bell, LogOut, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { profile, company, signOut } = useAuth();

  if (!profile) return null;

  const displayName = profile.name || profile.email;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Parametres</h1>
          <p className="text-sm text-slate-500">Configuration du compte et preferences</p>
        </div>
      </div>

      {/* User profile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Profil utilisateur</h2>
        </div>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500">{profile.email}</p>
            {company && (
              <p className="text-xs text-slate-400 mt-0.5">{company.name}</p>
            )}
            <span className={cn(
              'inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border',
              ROLE_COLORS[profile.role],
              profile.role === 'marketing' ? 'border-indigo-200' : profile.role === 'kam' ? 'border-teal-200' : 'border-amber-200'
            )}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Notifications</h2>
        </div>
        <p className="text-sm text-slate-500">
          Les preferences de notification seront disponibles prochainement.
        </p>
      </div>

      {/* Abbreviations link */}
      <Link
        href="/abbreviations"
        className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <div>
            <p className="text-sm font-medium text-slate-900">Glossaire des abbreviations</p>
            <p className="text-xs text-slate-500">Consulter et gerer les abbreviations metier</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
      </Link>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-rose-700 uppercase tracking-wider">Zone dangereuse</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">Se deconnecter de votre session Field Intelligence.</p>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Se deconnecter
        </button>
      </div>
    </div>
  );
}
