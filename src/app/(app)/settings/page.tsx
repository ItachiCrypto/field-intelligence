'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import Link from 'next/link';
import { Settings, User, Bell, LogOut, Mail, MessageSquare, Smartphone, Monitor, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          checked ? 'bg-indigo-600' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, company, signOut } = useAuth();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSlack, setNotifSlack] = useState(true);
  const [notifTeams, setNotifTeams] = useState(false);
  const [notifPush, setNotifPush] = useState(false);

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
        <div className="divide-y divide-slate-100">
          <ToggleRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            description="Recevoir les alertes par email"
            checked={notifEmail}
            onChange={setNotifEmail}
          />
          <ToggleRow
            icon={<MessageSquare className="w-4 h-4" />}
            label="Slack"
            description="Recevoir les alertes sur votre canal Slack"
            checked={notifSlack}
            onChange={setNotifSlack}
          />
          <ToggleRow
            icon={<Monitor className="w-4 h-4" />}
            label="Microsoft Teams"
            description="Recevoir les alertes sur Microsoft Teams"
            checked={notifTeams}
            onChange={setNotifTeams}
          />
          <ToggleRow
            icon={<Smartphone className="w-4 h-4" />}
            label="Push mobile"
            description="Notifications push sur votre telephone"
            checked={notifPush}
            onChange={setNotifPush}
          />
        </div>
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
