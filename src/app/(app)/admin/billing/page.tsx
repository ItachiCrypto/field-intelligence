// @ts-nocheck
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { PLANS } from '@/lib/stripe/plans';
import {
  CreditCard,
  Check,
  ArrowRight,
  Crown,
  Users,
  Zap,
  Shield,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const PLAN_ORDER = ['free', 'pro', 'enterprise'] as const;

const PLAN_STYLE = {
  free: {
    badge: 'bg-slate-100 text-slate-700',
    icon: <Shield className="w-5 h-5" />,
    ring: 'ring-slate-200',
    accent: 'text-slate-600',
  },
  pro: {
    badge: 'bg-indigo-100 text-indigo-700',
    icon: <Zap className="w-5 h-5" />,
    ring: 'ring-indigo-200',
    accent: 'text-indigo-600',
  },
  enterprise: {
    badge: 'bg-amber-100 text-amber-700',
    icon: <Crown className="w-5 h-5" />,
    ring: 'ring-amber-200',
    accent: 'text-amber-600',
  },
};

function formatPrice(price: number): string {
  if (price === 0) return 'Gratuit';
  return `${price}\u00A0\u20AC`;
}

export default function AdminBillingPage() {
  const { profile, company } = useAuth();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const currentPlanId = company?.plan ?? 'free';
  const currentPlan = PLANS[currentPlanId];
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanId);

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPortal(false);
    }
  }

  async function handleCheckout(priceId: string) {
    setLoadingCheckout(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // silently fail
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Status banner */}
      {status === 'success' && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          Paiement effectue avec succes. Votre abonnement a ete mis a jour.
        </div>
      )}
      {status === 'cancelled' && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700 flex items-center gap-2">
          <CreditCard className="w-4 h-4 shrink-0" />
          Le paiement a ete annule. Aucune modification n'a ete appliquee.
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Facturation & Abonnement
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {company?.name ?? 'Mon entreprise'}
        </p>
      </div>

      {/* Current plan card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${PLAN_STYLE[currentPlanId]?.badge ?? PLAN_STYLE.free.badge}`}
            >
              {PLAN_STYLE[currentPlanId]?.icon ?? PLAN_STYLE.free.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">
                  {currentPlan?.name ?? 'Gratuit'}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_STYLE[currentPlanId]?.badge ?? PLAN_STYLE.free.badge}`}
                >
                  Plan actuel
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {currentPlan?.price === 0
                  ? 'Gratuit'
                  : `${currentPlan?.price}\u00A0\u20AC / mois`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>
              {company?.plan_user_limit != null && currentPlan?.userLimit != null
                ? currentPlan.userLimit >= 999999
                  ? 'Utilisateurs illimites'
                  : `${company.plan_user_limit} / ${currentPlan.userLimit} utilisateurs`
                : '--'}
            </span>
          </div>
        </div>

        {currentPlanId !== 'free' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingPortal ? (
                <span className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Gerer mon abonnement
            </button>
          </div>
        )}
      </div>

      {/* Pricing table */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Choisir un plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const style = PLAN_STYLE[planId];
            const isCurrent = planId === currentPlanId;
            const planIndex = PLAN_ORDER.indexOf(planId);
            const isUpgrade = planIndex > currentPlanIndex;
            const isDowngrade = planIndex < currentPlanIndex;

            return (
              <div
                key={planId}
                className={`relative bg-white rounded-xl border shadow-sm p-6 flex flex-col ${
                  isCurrent
                    ? `border-slate-300 ring-2 ${style.ring}`
                    : 'border-slate-200'
                }`}
              >
                {/* Plan header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.badge}`}
                  >
                    {style.icon}
                  </div>
                  <span className="font-semibold text-slate-900">
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Plan actuel
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-slate-500"> / mois</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                <div className="mt-auto">
                  {isCurrent ? null : isUpgrade ? (
                    <button
                      onClick={() =>
                        plan.stripePriceId &&
                        handleCheckout(plan.stripePriceId)
                      }
                      disabled={loadingCheckout || !plan.stripePriceId}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loadingCheckout ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Passer au {plan.name}
                    </button>
                  ) : isDowngrade ? (
                    <a
                      href="mailto:support@field-intelligence.com"
                      className="w-full inline-flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Contacter le support
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
