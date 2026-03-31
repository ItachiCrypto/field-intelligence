export interface Abbreviation {
  id: string;
  short: string;
  full: string;
  category: 'general' | 'commercial' | 'technique' | 'organisation';
}

const DEFAULT_ABBREVIATIONS: Abbreviation[] = [
  { id: 'ab-1', short: 'CR', full: 'Compte Rendu', category: 'general' },
  { id: 'ab-2', short: 'SAV', full: 'Service Apres-Vente', category: 'commercial' },
  { id: 'ab-3', short: 'KAM', full: 'Key Account Manager', category: 'organisation' },
  { id: 'ab-4', short: 'CA', full: 'Chiffre d\'Affaires', category: 'commercial' },
  { id: 'ab-5', short: 'AO', full: 'Appel d\'Offres', category: 'commercial' },
  { id: 'ab-6', short: 'NPS', full: 'Net Promoter Score', category: 'technique' },
  { id: 'ab-7', short: 'PME', full: 'Petite et Moyenne Entreprise', category: 'organisation' },
  { id: 'ab-8', short: 'ETI', full: 'Entreprise de Taille Intermediaire', category: 'organisation' },
  { id: 'ab-9', short: 'DG', full: 'Directeur General', category: 'organisation' },
  { id: 'ab-10', short: 'DAF', full: 'Directeur Administratif et Financier', category: 'organisation' },
  { id: 'ab-11', short: 'RDV', full: 'Rendez-vous', category: 'general' },
  { id: 'ab-12', short: 'ERP', full: 'Enterprise Resource Planning', category: 'technique' },
  { id: 'ab-13', short: 'CRM', full: 'Customer Relationship Management', category: 'technique' },
  { id: 'ab-14', short: 'ROI', full: 'Retour sur Investissement', category: 'commercial' },
  { id: 'ab-15', short: 'PDG', full: 'President-Directeur General', category: 'organisation' },
  { id: 'ab-16', short: 'IDF', full: 'Ile-de-France', category: 'general' },
  { id: 'ab-17', short: 'BtoB', full: 'Business to Business', category: 'commercial' },
  { id: 'ab-18', short: 'SLA', full: 'Service Level Agreement', category: 'technique' },
  { id: 'ab-19', short: 'TCO', full: 'Total Cost of Ownership', category: 'technique' },
  { id: 'ab-20', short: 'Dirco', full: 'Directeur Commercial', category: 'organisation' },
];

const STORAGE_KEY = 'fi-abbreviations';

export function getAbbreviations(): Abbreviation[] {
  if (typeof window === 'undefined') return DEFAULT_ABBREVIATIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_ABBREVIATIONS;
}

export function saveAbbreviations(abbrs: Abbreviation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(abbrs));
}

export function addAbbreviation(abbr: Omit<Abbreviation, 'id'>): Abbreviation[] {
  const list = getAbbreviations();
  const newAbbr = { ...abbr, id: `ab-${Date.now()}` };
  const updated = [...list, newAbbr];
  saveAbbreviations(updated);
  return updated;
}

export function updateAbbreviation(id: string, data: Partial<Abbreviation>): Abbreviation[] {
  const list = getAbbreviations();
  const updated = list.map(a => a.id === id ? { ...a, ...data } : a);
  saveAbbreviations(updated);
  return updated;
}

export function deleteAbbreviation(id: string): Abbreviation[] {
  const list = getAbbreviations().filter(a => a.id !== id);
  saveAbbreviations(list);
  return list;
}

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  commercial: 'Commercial',
  technique: 'Technique',
  organisation: 'Organisation',
};
