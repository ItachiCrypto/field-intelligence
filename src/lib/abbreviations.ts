// Types et labels pour les abbreviations — la donnee vient de la table Supabase
// `abbreviations` via useAppData() ou createClient() directement dans la page d'admin.

export interface Abbreviation {
  id: string;
  short: string;
  full: string;
  category: 'general' | 'commercial' | 'technique' | 'organisation';
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  commercial: 'Commercial',
  technique: 'Technique',
  organisation: 'Organisation',
};
