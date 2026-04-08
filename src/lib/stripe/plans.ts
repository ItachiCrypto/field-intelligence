export type PlanId = 'free' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: 'EUR';
  interval: 'month';
  userLimit: number;
  stripePriceId: string | null;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    userLimit: 3,
    stripePriceId: null,
    features: [
      'Jusqu\u0027a 3 utilisateurs',
      'Toutes les fonctionnalites de base',
      'Support par email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    userLimit: 25,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null,
    features: [
      'Jusqu\u0027a 25 utilisateurs',
      'Toutes les fonctionnalites',
      'Support prioritaire',
      'Exports avances',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Entreprise',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    userLimit: 999999,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? null,
    features: [
      'Utilisateurs illimites',
      'Toutes les fonctionnalites',
      'Support dedie',
      'SSO et integrations custom',
    ],
  },
};

export function getPlanByStripePriceId(priceId: string): Plan | null {
  return Object.values(PLANS).find(p => p.stripePriceId === priceId) ?? null;
}
