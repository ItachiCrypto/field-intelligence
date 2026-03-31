'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { NAV_BY_ROLE, ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Radar, BarChart3, Activity, Settings,
  Briefcase, Bell, Users, Map, LogOut, BookOpen, Zap,
  DollarSign, TrendingUp, Target, Package, MapPin, Megaphone,
  GitCompare, PieChart, TrendingDown, Brain,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Radar, BarChart3, Activity, Settings,
  Briefcase, Bell, Users, Map, BookOpen,
  DollarSign, TrendingUp, Target, Package, MapPin, Megaphone,
  GitCompare, PieChart, TrendingDown, Brain,
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role];

  return (
    <aside className="flex flex-col w-60 bg-white border-r border-slate-200 h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">Field Intelligence</h1>
            <span className={cn('inline-block mt-0.5 px-1.5 py-0 rounded text-[10px] font-medium', ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = ICON_MAP[item.icon] || LayoutDashboard;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-[18px] h-[18px]', active ? 'text-indigo-600' : '')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-slate-800 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
          </div>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer" title="Deconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
