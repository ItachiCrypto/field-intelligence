// Tarifs LLM en USD par token. Source : pages tarification publiques des
// fournisseurs (mai 2026). Mettre a jour ici si les tarifs changent — le
// cost_usd persiste avec le tarif au moment du call, donc l'historique
// reste exact meme si on baisse les prix plus tard.

interface PricePerToken {
  input: number;  // $ par token input
  output: number; // $ par token output
}

const PRICING: Record<string, PricePerToken> = {
  // OpenAI
  'gpt-4.1-mini':           { input: 0.40e-6,  output: 1.60e-6  },
  'gpt-4.1':                { input: 2.00e-6,  output: 8.00e-6  },
  'gpt-4o-mini':            { input: 0.15e-6,  output: 0.60e-6  },
  'gpt-4o':                 { input: 2.50e-6,  output: 10.00e-6 },
  'gpt-5-mini':             { input: 0.25e-6,  output: 2.00e-6  },
  'gpt-5':                  { input: 1.25e-6,  output: 10.00e-6 },
  // Anthropic
  'claude-sonnet-4-20250514':       { input: 3.00e-6,  output: 15.00e-6 },
  'claude-sonnet-4-5-20250929':     { input: 3.00e-6,  output: 15.00e-6 },
  'claude-haiku-4-5-20251001':      { input: 1.00e-6,  output: 5.00e-6  },
};

/** Default fallback si le modele est inconnu : tarif gpt-4.1-mini. */
const DEFAULT = PRICING['gpt-4.1-mini'];

export function computeCostUSD(
  modelUsed: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const tier = PRICING[modelUsed] ?? DEFAULT;
  return inputTokens * tier.input + outputTokens * tier.output;
}
