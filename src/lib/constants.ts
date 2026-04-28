import { UserRole } from './types';

export const REGIONS = ['Nord', 'Sud', 'Est', 'Ouest', 'IDF', 'Sud-Ouest', 'Nord-Est'] as const;

export const SIGNAL_TYPES = {
  concurrence: { label: 'Concurrence', color: 'bg-rose-50 text-rose-700 border-rose-200', iconName: 'Swords' as const },
  besoin: { label: 'Besoin client', color: 'bg-sky-50 text-sky-700 border-sky-200', iconName: 'Lightbulb' as const },
  prix: { label: 'Prix', color: 'bg-amber-50 text-amber-700 border-amber-200', iconName: 'DollarSign' as const },
  satisfaction: { label: 'Satisfaction', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconName: 'ThumbsUp' as const },
  opportunite: { label: 'Opportunite', color: 'bg-violet-50 text-violet-700 border-violet-200', iconName: 'Target' as const },
  echec: { label: 'Echec', color: 'bg-slate-100 text-slate-700 border-slate-300', iconName: 'XCircle' as const },
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

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<UserRole, NavSection[]> = {
  admin: [
    {
      title: 'Administration',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'Utilisateurs', href: '/admin/users', icon: 'Users' },
        { label: 'Facturation', href: '/admin/billing', icon: 'CreditCard' },
        { label: 'Integrations', href: '/admin/integrations', icon: 'Link2' },
      ],
    },
    {
      title: 'KAM',
      items: [
        { label: 'Portefeuille', href: '/portfolio', icon: 'Briefcase' },
        { label: 'Centre d\'Alertes', href: '/alerts', icon: 'Bell' },
      ],
    },
    {
      title: 'Direction Commerciale',
      items: [
        { label: 'Equipe', href: '/team', icon: 'Users' },
        { label: 'Carte Terrain', href: '/heatmap', icon: 'Map' },
        { label: 'Fil des Signaux', href: '/signals', icon: 'Activity' },
        { label: 'Taux Closing', href: '/dir-clos', icon: 'Target' },
        { label: 'Deals Gagnes/Perdus', href: '/dir-lost', icon: 'TrendingDown' },
        { label: 'Carte Territoire', href: '/dir-terr', icon: 'Map' },
        { label: 'Priorisation IA', href: '/dir-prior', icon: 'Brain' },
        { label: 'Pilotage N-1', href: '/dir-n1', icon: 'Gauge' },
        { label: 'Segmentation', href: '/dir-seg', icon: 'PieChart' },
        { label: 'Analyse Geo', href: '/dir-geo', icon: 'MapPin' },
      ],
    },
    {
      title: 'Marketing',
      items: [
        { label: 'Radar Concurrentiel', href: '/radar', icon: 'Radar' },
        { label: 'Barometre Besoins', href: '/barometer', icon: 'BarChart3' },
        { label: 'Radar Prix', href: '/mkt-prix', icon: 'DollarSign' },
        { label: 'Deals Marketing', href: '/mkt-deal', icon: 'TrendingUp' },
        { label: 'Positionnement', href: '/mkt-pos', icon: 'Target' },
        { label: 'Offres Concurrentes', href: '/mkt-offre', icon: 'Package' },
        { label: 'Analyse Geo', href: '/mkt-geo', icon: 'MapPin' },
        { label: 'Comm Concurrentes', href: '/mkt-comm', icon: 'Megaphone' },
        { label: 'Sentiment Client', href: '/mkt-sentiment', icon: 'Smile' },
        { label: 'Segmentation', href: '/mkt-seg', icon: 'PieChart' },
      ],
    },
    {
      items: [
        { label: 'Abbreviations', href: '/abbreviations', icon: 'BookOpen' },
        { label: 'Guide CR', href: '/guide-cr', icon: 'GraduationCap' },
        { label: 'Parametres', href: '/settings', icon: 'Settings' },
      ],
    },
  ],
  marketing: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'Fil des Signaux', href: '/signals', icon: 'Activity' },
      ],
    },
    {
      title: 'Concurrence',
      items: [
        { label: 'Radar Concurrentiel', href: '/radar', icon: 'Radar' },
        { label: 'Offres Concurrentes', href: '/mkt-offre', icon: 'Package' },
        { label: 'Comm Concurrentes', href: '/mkt-comm', icon: 'Megaphone' },
        { label: 'Positionnement', href: '/mkt-pos', icon: 'Target' },
        { label: 'Radar Prix', href: '/mkt-prix', icon: 'DollarSign' },
      ],
    },
    {
      title: 'Analyse',
      items: [
        { label: 'Barometre Besoins', href: '/barometer', icon: 'BarChart3' },
        { label: 'Deals Gagnes/Perdus', href: '/mkt-deal', icon: 'TrendingUp' },
        { label: 'Analyse Geo', href: '/mkt-geo', icon: 'MapPin' },
        { label: 'Sentiment Client', href: '/mkt-sentiment', icon: 'Smile' },
        { label: 'Segmentation', href: '/mkt-seg', icon: 'PieChart' },
      ],
    },
    {
      items: [
        { label: 'Abbreviations', href: '/abbreviations', icon: 'BookOpen' },
        { label: 'Guide CR', href: '/guide-cr', icon: 'GraduationCap' },
        { label: 'Parametres', href: '/settings', icon: 'Settings' },
      ],
    },
  ],
  kam: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'Portefeuille', href: '/portfolio', icon: 'Briefcase' },
        { label: 'Centre d\'Alertes', href: '/alerts', icon: 'Bell' },
        { label: 'Guide CR', href: '/guide-cr', icon: 'GraduationCap' },
        { label: 'Parametres', href: '/settings', icon: 'Settings' },
      ],
    },
  ],
  dirco: [
    {
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        { label: 'Fil des Signaux', href: '/signals', icon: 'Activity' },
      ],
    },
    {
      title: 'Pilotage',
      items: [
        { label: 'Equipe', href: '/team', icon: 'Users' },
        { label: 'Carte Terrain', href: '/heatmap', icon: 'Map' },
        { label: 'Taux Closing', href: '/dir-clos', icon: 'Target' },
        { label: 'Deals Gagnes/Perdus', href: '/dir-lost', icon: 'TrendingDown' },
        { label: 'Carte Territoire', href: '/dir-terr', icon: 'Map' },
        { label: 'Priorisation IA', href: '/dir-prior', icon: 'Brain' },
      ],
    },
    {
      items: [
        { label: 'Abbreviations', href: '/abbreviations', icon: 'BookOpen' },
        { label: 'Guide CR', href: '/guide-cr', icon: 'GraduationCap' },
        { label: 'Parametres', href: '/settings', icon: 'Settings' },
      ],
    },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  marketing: 'Responsable Marketing',
  kam: 'Key Account Manager',
  dirco: 'Directeur Commercial',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-slate-100 text-slate-700',
  marketing: 'bg-indigo-50 text-indigo-700',
  kam: 'bg-teal-50 text-teal-700',
  dirco: 'bg-amber-50 text-amber-700',
};
