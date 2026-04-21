'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Bell, Search, X, Calendar } from 'lucide-react';
import { useAppData } from '@/lib/data';
import Link from 'next/link';
import { DateRangePicker } from './date-range-picker';
import { useDateRange } from '@/lib/queries/date-range-context';

// Format court type "22 mars 2026" pour l'affichage inline dans la topbar.
function fmtDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function Topbar() {
  const { alerts: ALERTS, signals: SIGNALS, accounts: ACCOUNTS, commercials: COMMERCIALS } = useAppData();
  const { profile } = useAuth();
  const { range } = useDateRange();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const unread = ALERTS.filter(a => a.status === 'nouveau').length;

  // Search results
  const q = searchQuery.toLowerCase().trim();
  const results = q.length >= 2 ? {
    signals: SIGNALS.filter(s => s.content.toLowerCase().includes(q) || s.client_name.toLowerCase().includes(q)).slice(0, 3),
    accounts: ACCOUNTS.filter(a => a.name.toLowerCase().includes(q)).slice(0, 3),
    commercials: COMMERCIALS.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3),
  } : null;

  const hasResults = results && (results.signals.length > 0 || results.accounts.length > 0 || results.commercials.length > 0);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Resume de la plage active : cohérent avec le picker de droite.
          Remplace l'ancien "Semaine X — date du jour" qui etait deconnecté
          du filtre applique. */}
      <div className="inline-flex items-center gap-2 text-[13px] text-slate-500 font-medium">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        {range.unlimited ? (
          <span>Donnees : toutes periodes</span>
        ) : (
          <span>
            Donnees du{' '}
            <span className="text-slate-700">{fmtDate(range.from)}</span>
            {' au '}
            <span className="text-slate-700">{fmtDate(range.to)}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Global date range picker — filtre toutes les pages */}
        <DateRangePicker />

        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher signaux, comptes, commerciaux..."
                  className="w-80 pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                {/* Dropdown */}
                {hasResults && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {results.accounts.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Comptes</div>
                        {results.accounts.map(a => (
                          <Link key={a.id} href={`/account/${a.id}`} className="block px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                            {a.name} <span className="text-slate-400">&middot; {a.region}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {results.signals.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Signaux</div>
                        {results.signals.map(s => (
                          <div key={s.id} className="px-2 py-1.5 text-sm text-slate-700 rounded">
                            <span className="text-slate-500">{s.client_name}</span> &mdash; {s.content.slice(0, 60)}...
                          </div>
                        ))}
                      </div>
                    )}
                    {results.commercials.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Commerciaux</div>
                        {results.commercials.map(c => (
                          <div key={c.id} className="px-2 py-1.5 text-sm text-slate-700 rounded">
                            {c.name} <span className="text-slate-400">&middot; {c.region}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 cursor-pointer">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Rechercher...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
                Ctrl K
              </kbd>
            </button>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
          <Bell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold px-1">
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
