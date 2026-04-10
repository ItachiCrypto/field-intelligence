// @ts-nocheck
import type { ExtractedCRData } from './types';

export function buildExtractionPrompt(
  crText: string,
  knownCompetitors: string[],
  knownAbbreviations: { short: string; full: string }[],
): string {
  const competitorsList = knownCompetitors.length > 0
    ? `Concurrents connus de cette entreprise : ${knownCompetitors.join(', ')}`
    : 'Aucun concurrent connu.';

  const abbrList = knownAbbreviations.length > 0
    ? `Abbreviations : ${knownAbbreviations.map(a => `${a.short}=${a.full}`).join(', ')}`
    : '';

  return `Vous etes un expert en analyse de comptes rendus de visite commerciale francais.
Analysez ce compte-rendu et extrayez TOUTES les informations structurees en JSON strict.

${competitorsList}
${abbrList}

COMPTE-RENDU:
"""
${crText}
"""

Extrayez en JSON strict (pas de texte avant/apres, uniquement le JSON) :

{
  "signals": [
    {
      "type": "concurrence|besoin|prix|satisfaction|opportunite",
      "severity": "rouge|orange|jaune|vert",
      "title": "titre court du signal",
      "content": "description du signal",
      "competitor_name": "nom du concurrent ou null",
      "price_delta": "ecart prix en % ou null"
    }
  ],
  "deals": [
    {
      "view": "marketing|commercial",
      "motif": "prix|produit|offre|timing|concurrent|relation|budget|autre",
      "resultat": "gagne|perdu|en_cours",
      "concurrent_nom": "nom ou null",
      "verbatim": "extrait du CR"
    }
  ],
  "prix_signals": [
    {
      "concurrent_nom": "nom",
      "ecart_pct": 12,
      "ecart_type": "inferieur|superieur",
      "verbatim": "extrait"
    }
  ],
  "objectifs": [
    {
      "type": "signature|sell_out|sell_in|formation|decouverte|fidelisation",
      "resultat": "atteint|non_atteint",
      "cause_echec": "si non atteint, la cause",
      "facteur_reussite": "si atteint, le facteur cle"
    }
  ],
  "sentiment": "positif|negatif|neutre|interesse",
  "needs": [
    { "label": "besoin identifie", "trend": "up|down|stable|new" }
  ],
  "competitors_mentioned": [
    { "name": "nom", "mention_type": "description courte de la mention" }
  ]
}

Regles :
- Soyez conservateur : n'inventez pas d'information absente du CR
- Si aucun signal d'un type, retournez un tableau vide
- Les prix doivent etre en pourcentage (ecart_pct est un nombre, pas une string)
- Le sentiment est une evaluation globale du ton du CR
- Chaque deal detecte doit avoir un verbatim extrait directement du CR`;
}

export function parseExtractionResponse(responseText: string): ExtractedCRData | null {
  try {
    // Find JSON in the response (Claude might add text around it)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ExtractedCRData;
  } catch {
    return null;
  }
}
