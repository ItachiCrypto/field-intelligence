import { UserRole } from './types';

export const REGIONS = ['Nord', 'Sud', 'Est', 'Ouest', 'IDF', 'Sud-Ouest', 'Nord-Est'] as const;

export const SIGNAL_TYPES = {
  concurrence: { label: 'Concurrence', color: 'bg-rose-50 text-rose-700 border-rose-200', iconName: 'Swords' as const },
  besoin: { label: 'Besoin client', color: 'bg-sky-50 text-sky-700 border-sky-200', iconName: 'Lightbulb' as const },
  prix: { label: 'Prix', color: 'bg-amber-50 text-amber-700 border-amber-200', iconName: 'DollarSign' as const },
  satisfaction: { label: 'Satisfaction', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconName: 'ThumbsUp' as const },
  opportunite: { label: 'Opportunite', color: 'bg-violet-50 text-violet-700 border-violet-200', iconName: 'Target' as const },
} as const;

export const SEVERITY_CONFIG = {
  rouge: { label: 'Critique', hex: '#e11d48', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', borderLeft: 'border-l-rose-500' },
  orange: { label: 'Eleve', hex: '#f59e0b', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', borderLeft: 'border-l-amber-500' },
  jaune: { label: 'Modere', hex: '#eab308', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', borderLeft: 'border-l-yellow-500' },
  vert: { label: 'Faible', hex: '#10b981', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', borderLeft: 'border-l-emerald-500' },
} as const;

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  marketing: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Radar Concurrentiel', href: '/radar', icon: 'Radar' },
    { label: 'Barometre Besoins', href: '/barometer', icon: 'BarChart3' },
    { label: 'Fil des Signaux', href: '/signals', icon: 'Activity' },
    { label: 'Radar Prix', href: '/mkt-prix', icon: 'DollarSign' },
    { label: 'Deals Gagnes/Perdus', href: '/mkt-deal', icon: 'TrendingUp' },
    { label: 'Positionnement', href: '/mkt-pos', icon: 'Target' },
    { label: 'Offres Concurrentes', href: '/mkt-offre', icon: 'Package' },
    { label: 'Analyse Geo', href: '/mkt-geo', icon: 'MapPin' },
    { label: 'Comm Concurrentes', href: '/mkt-comm', icon: 'Megaphone' },
    { label: 'Abbreviations', href: '/abbreviations', icon: 'BookOpen' },
    { label: 'Parametres', href: '/settings', icon: 'Settings' },
  ],
  kam: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Portefeuille', href: '/portfolio', icon: 'Briefcase' },
    { label: 'Centre d\'Alertes', href: '/alerts', icon: 'Bell' },
    { label: 'Parametres', href: '/settings', icon: 'Settings' },
  ],
  dirco: [
    { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Equipe', href: '/team', icon: 'Users' },
    { label: 'Carte Terrain', href: '/heatmap', icon: 'Map' },
    { label: 'Fil des Signaux', href: '/signals', icon: 'Activity' },
    { label: 'Taux Closing', href: '/dir-clos', icon: 'Target' },
    { label: 'Evolution Clients', href: '/dir-n1', icon: 'GitCompare' },
    { label: 'Segmentation', href: '/dir-seg', icon: 'PieChart' },
    { label: 'Deals Perdus', href: '/dir-lost', icon: 'TrendingDown' },
    { label: 'Carte Territoire', href: '/dir-terr', icon: 'Map' },
    { label: 'Heatmap Geo', href: '/dir-geo', icon: 'MapPin' },
    { label: 'Priorisation IA', href: '/dir-prior', icon: 'Brain' },
    { label: 'Abbreviations', href: '/abbreviations', icon: 'BookOpen' },
    { label: 'Parametres', href: '/settings', icon: 'Settings' },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  marketing: 'Responsable Marketing',
  kam: 'Key Account Manager',
  dirco: 'Directeur Commercial',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  marketing: 'bg-indigo-50 text-indigo-700',
  kam: 'bg-teal-50 text-teal-700',
  dirco: 'bg-amber-50 text-amber-700',
};
