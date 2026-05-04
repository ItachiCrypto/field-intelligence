// @ts-nocheck
// Canonicalisation server-side des noms de concurrents extraits par l'IA.
// Le prompt demande deja a l'IA d'utiliser des noms canoniques mais on
// applique un filet de securite : meme si l'IA renvoie "OneTouch" et "LS"
// pour la meme entite, on les fusionne en un seul concurrent canonique
// avant tout INSERT.
//
// Sources d'aliases :
//   1. La table abbreviations (short -> full)
//   2. Le free-text business_context : on parse les lignes contenant
//      au moins deux "=" (ex. "Lifescan = OneTouch = LS") et on les
//      considere comme un groupe d'aliases. Le canonique est le 1er.

interface AliasEntry {
  short: string;
  full: string;
}

/** Normalise pour comparaison : lowercase + strip diacritiques + trim */
function normKey(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Build a canonical-name resolver from:
 *   - the abbreviations table (short -> full)
 *   - alias-group lines in business_context (e.g. "Lifescan = OneTouch = LS")
 *   - the list of known competitors (treated as already-canonical)
 *
 * Returns a function that maps any input string to its canonical form
 * (or returns the input unchanged if no mapping is known).
 */
export function buildCanonicalResolver(opts: {
  abbreviations?: AliasEntry[];
  businessContext?: string | null;
  knownCompetitors?: string[];
}): (raw: string | null | undefined) => string | null {
  const { abbreviations = [], businessContext, knownCompetitors = [] } = opts;
  const canonOf = new Map<string, string>(); // norm(alias) -> canonical (preserved-case)

  // 1. business_context : lignes "X = Y = Z" — TOUS sont aliases du PREMIER
  if (businessContext) {
    for (const rawLine of businessContext.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      // On ne traite que les lignes avec au moins UN "=" et au moins deux
      // termes non-vides. On ignore les lignes type "PDM : 65%" qui ne sont
      // pas des declarations d'alias (le ":" n'est pas un signe d'egalite).
      if (!line.includes('=')) continue;
      const parts = line
        .split('=')
        .map((p) => p.trim())
        // Strip eventuels prefixes/suffixes inutiles ("- " en debut de bullet,
        // "." de fin de phrase). On garde l'interieur tel quel pour preserver
        // les graphies (espaces, casse).
        .map((p) => p.replace(/^[-*•·\s]+/, '').replace(/[\s.,;]+$/, ''))
        .filter((p) => p.length > 0 && p.length < 80);
      if (parts.length < 2) continue;
      // Heuristique anti-faux-positif : si l'un des "termes" contient un
      // espace ET >= 5 mots, c'est probablement une phrase, pas un alias.
      if (parts.some((p) => p.split(/\s+/).length > 4)) continue;
      const canonical = parts[0];
      for (const alias of parts) {
        const k = normKey(alias);
        if (k && !canonOf.has(k)) {
          canonOf.set(k, canonical);
        }
      }
    }
  }

  // 2. Abbreviations table : (short, full) — short est l'alias, full le canonique.
  for (const { short, full } of abbreviations) {
    if (!short || !full) continue;
    const k = normKey(short);
    if (k && !canonOf.has(k)) {
      canonOf.set(k, full);
    }
    // full -> full pour normaliser la casse si l'IA tape "ONETOUCH"
    const kFull = normKey(full);
    if (kFull && !canonOf.has(kFull)) {
      canonOf.set(kFull, full);
    }
  }

  // 3. Known competitors (already canonical) — auto-map.
  for (const c of knownCompetitors) {
    const k = normKey(c);
    if (k && !canonOf.has(k)) {
      canonOf.set(k, c);
    }
  }

  return (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const k = normKey(raw);
    if (!k) return null;
    const hit = canonOf.get(k);
    if (hit) return hit;
    // Fallback : si une cle stockee est un PREFIXE strict du raw (ex.
    // canon "OneTouch" et raw "OneTouch Verio"), on garde la version
    // longue : raw est plus specifique. Sinon on rend tel quel.
    return raw.trim();
  };
}

/**
 * Apply a resolver to all competitor-name fields of an extraction, mutating
 * the object in place AND deduplicating competitors_mentioned by canonical.
 */
export function canonicalizeExtraction(
  extracted: any,
  resolve: (raw: string | null | undefined) => string | null,
): void {
  if (!extracted) return;

  if (Array.isArray(extracted.signals)) {
    for (const s of extracted.signals) {
      if (s?.competitor_name) s.competitor_name = resolve(s.competitor_name);
    }
  }
  if (Array.isArray(extracted.deals)) {
    for (const d of extracted.deals) {
      if (d?.concurrent_nom) d.concurrent_nom = resolve(d.concurrent_nom);
    }
  }
  if (Array.isArray(extracted.prix_signals)) {
    for (const p of extracted.prix_signals) {
      if (p?.concurrent_nom) p.concurrent_nom = resolve(p.concurrent_nom);
    }
  }
  if (Array.isArray(extracted.competitors_mentioned)) {
    // canonicalize then dedupe by canonical name
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const c of extracted.competitors_mentioned) {
      if (!c?.name) continue;
      const canon = resolve(c.name);
      if (!canon) continue;
      const key = normKey(canon);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push({ ...c, name: canon });
    }
    extracted.competitors_mentioned = deduped;
  }
}
