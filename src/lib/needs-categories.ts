// Auto-categorisation des besoins clients exprimes dans les CRs.
// Classification deterministe par patterns de mots-cles sur le label.
// Les categories sont concues pour qu'un responsable marketing voie
// d'un coup d'oeil quels TYPES de demandes remontent du terrain :
// formation, outils de comm, demos, SAV, digital, etc.
//
// L'ordre des categories est important : on prend la PREMIERE qui matche.
// Les patterns les plus specifiques en premier.

export type NeedCategory =
  | 'formation'
  | 'comm_pos'      // PLV, brochures, outils point de vente
  | 'demo'          // demonstrateurs, echantillons, factices
  | 'service'       // SAV, support, livraison, logistique
  | 'digital'       // app, logiciel, integration data
  | 'documentation' // carnets, fiches patient, guides cliniques
  | 'animation'     // operations terrain, evenements
  | 'commercial'    // arguments, accompagnement vente, pricing
  | 'autre';

interface CategoryRule {
  id: NeedCategory;
  label: string;
  description: string;
  /** color: tailwind class for the badge background+border */
  badgeClass: string;
  /** chart color (hex) for charts */
  hex: string;
  patterns: RegExp[];
}

// Order matters : the first match wins.
export const NEED_CATEGORIES: CategoryRule[] = [
  {
    id: 'formation',
    label: 'Formation',
    description: 'Demandes de formation produit ou métier',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    hex: '#6366f1',
    patterns: [
      /\bformation\b/i,
      /\bformer\b/i,
      /\bsensibilisation\b/i,
      /\baccompagnement\s+(produit|metier|technique|equipe)/i,
      /\b(seance|session)\s+(soir|equipe)/i,
    ],
  },
  {
    id: 'comm_pos',
    label: 'PLV / Outils comm',
    description: 'Supports point de vente : PLV, présentoirs, packaging',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    hex: '#8b5cf6',
    patterns: [
      /\bPLV\b/i,
      /\bpresentoir(s)?\b/i,
      /\bstop[\s-]?rayon\b/i,
      /\baffich(e|age)\b/i,
      /\blineaire\b/i,
      /\bvitrine\b/i,
      /\bmerchandising\b/i,
      /\bpackaging\b/i,
      /\bpoint\s+de\s+vente\b/i,
    ],
  },
  {
    id: 'demo',
    label: 'Démos / Échantillons',
    description: 'Démonstrateurs, échantillons, kits de test',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    hex: '#f59e0b',
    patterns: [
      /\bdemo(nstrate(ur|urs)|nstration)?\b/i,
      /\bechantillon(s|nage)?\b/i,
      /\bspecimen(s)?\b/i,
      /\bfactice(s)?\b/i,
      /\bessai(s)?\s+(gratuit|patient|terrain)/i,
      /\btest(s)?\s+patient/i,
      /\bkit(s)?\s+de\s+(demarrage|demo|test)/i,
    ],
  },
  {
    id: 'service',
    label: 'SAV / Logistique',
    description: 'Service après-vente, livraison, support, sécurité d\'utilisation',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    hex: '#10b981',
    patterns: [
      /\bSAV\b/i,
      /\blivraison\b/i,
      /\blogistique\b/i,
      /\bservice\s+(client|technique|apres)/i,
      /\breactivit(e|y)\b/i,
      /\bdelai\b/i,
      /\brassurer\s+sur\s+la\s+(douleur|securite)/i,
      /\bsecurit(e|y)\s+(d['' ]?injection|aiguille)/i,
      /\bDASRI\b/i,
      /\bcollecte\b/i,
    ],
  },
  {
    id: 'digital',
    label: 'Digital / Data',
    description: 'Applications, logiciels, intégration de données',
    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    hex: '#06b6d4',
    patterns: [
      /\bapp(lication)?\s+mobile/i,
      /\bmysugr\b/i,
      /\bbluetooth\b/i,
      /\bconnect(e|ee|ed|ivite)\b/i,
      /\bdiabconnect\b/i,
      /\bLGO\b/i,
      /\blogiciel\b/i,
      /\bsoftware\b/i,
      /\binterop(erabilite)?\b/i,
      /\bdata\b/i,
      /\bsmart\s*pix\b/i,
      /\bparametrage\b/i,
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'Carnets de suivi, fiches patient, données cliniques',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    hex: '#0ea5e9',
    patterns: [
      /\bcarnet(s)?\b/i,
      /\bfiche(s)?\s+(patient|produit)/i,
      /\bbrochure(s)?\b/i,
      /\bdocumentation\b/i,
      /\bargumentaire\b/i,
      /\bdonnees?\s+cliniques?\b/i,
      /\betudes?\s+cliniques?\b/i,
      /\bsupport(s)?\s+(papier|patient|etudiant)/i,
      /\beducation\s+therapeutique\b/i,
    ],
  },
  {
    id: 'animation',
    label: 'Animation / Évent',
    description: 'Animations en officine, opérations terrain, événements',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    hex: '#ec4899',
    patterns: [
      /\banimation(s)?\b/i,
      /\boperation(s)?\s+(commerciale|terrain)/i,
      /\bevenement\b/i,
      /\bramadan\b/i,
      /\bdepistage\b/i,
      /\bcampagne\b/i,
    ],
  },
  {
    id: 'commercial',
    label: 'Outils commercial',
    description: 'Arguments de vente, accompagnement deal, pricing',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    hex: '#e11d48',
    patterns: [
      /\bargument(s|aire)?\b/i,
      /\baccompagnement\s+(senior|patient|vente)/i,
      /\bnegociat\w+/i,
      /\boffre\s+special/i,
      /\bremise\b/i,
      /\bprix\s+(competitif|d[''  ]?appel)/i,
    ],
  },
];

export function categorizeNeed(label: string | null | undefined): NeedCategory {
  const text = (label || '').trim();
  if (!text) return 'autre';
  for (const rule of NEED_CATEGORIES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) return rule.id;
    }
  }
  return 'autre';
}

export function getCategoryConfig(id: NeedCategory): CategoryRule {
  return (
    NEED_CATEGORIES.find((c) => c.id === id) ?? {
      id: 'autre',
      label: 'Autre',
      description: 'Besoins non classés',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      hex: '#64748b',
      patterns: [],
    }
  );
}
