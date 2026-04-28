import Link from 'next/link';
import {
  Sword, DollarSign, Package, BarChart2, TrendingUp, Map,
  ArrowRight, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';
import { HeroAnimation } from '@/components/marketing/hero-animation';
import { RoiSimulator } from '@/components/marketing/roi-simulator';
import { CrmLogos } from '@/components/marketing/crm-logos';

/* ─── Features ───────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Sword className="w-4 h-4" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    title: 'Radar Concurrentiel',
    desc: 'Qui est actif chez vos clients, dans quelle région, avec quel argument. Détecté en temps réel depuis les CR de visite.',
    stat: '12 concurrents cartographiés',
    statColor: 'text-indigo-600',
  },
  {
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Radar Prix',
    desc: "L'écart de prix réel perçu terrain — pas les grilles affichées. Détecté automatiquement depuis vos RDV.",
    stat: '−15% détecté vs. Acme',
    statColor: 'text-amber-600',
  },
  {
    icon: <Package className="w-4 h-4" />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    title: 'Offres Concurrentes',
    desc: "Chaque bundle, essai gratuit ou condition spéciale détectée lors d'un rendez-vous client.",
    stat: '3 bundles actifs repérés',
    statColor: 'text-rose-600',
  },
  {
    icon: <BarChart2 className="w-4 h-4" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Baromètre des Besoins',
    desc: 'Les vrais besoins de vos clients cette semaine, avec leurs mots exacts, non filtrés par un questionnaire.',
    stat: '7 besoins émergents',
    statColor: 'text-emerald-600',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Deals Gagnés / Perdus',
    desc: 'Pourquoi vous gagnez et perdez — depuis les verbatims terrain de vos commerciaux, pas des sondages.',
    stat: '+18% closing identifié',
    statColor: 'text-blue-600',
  },
  {
    icon: <Map className="w-4 h-4" />,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'Cartographie Terrain',
    desc: 'Heatmap de pression concurrentielle et de risque portefeuille par zone géographique.',
    stat: '3 zones critiques IDF',
    statColor: 'text-teal-600',
  },
];

/* ─── Comparison ─────────────────────────────────────────────── */
const COMPARISON = [
  { aspect: 'Fraîcheur',  before: '6 à 12 mois de délai',           after: 'Temps réel' },
  { aspect: 'Source',     before: 'Sondages, panels, cabinets',      after: 'Verbatims de vos RDV' },
  { aspect: 'Coût',       before: '15 000€ – 80 000€ / étude',       after: 'Abonnement mensuel' },
  { aspect: 'Biais',      before: 'Déclaratif, orienté',             after: 'Comportemental, brut' },
  { aspect: 'Couverture', before: 'Échantillon représentatif',        after: '100% de vos RDV' },
  { aspect: 'Format',     before: 'Rapport PDF + réunion',            after: 'Dashboard + alertes push' },
];

/* ─── Testimonials ───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "On avait des battlecards basées sur les comms publiques d'Acme. Avec Field Intelligence, on a découvert 3 offres bundle qu'on ignorait complètement — et nos commerciaux gagnent plus.",
    name: 'C. Martin',
    role: 'Directrice Marketing',
    company: 'Éditeur SaaS B2B, 80M€ ARR',
  },
  {
    quote: "Field Intelligence a remplacé notre réunion mensuelle avec les KAM par un dashboard consulté chaque matin. Le delta de réactivité est énorme.",
    name: 'L. Bernard',
    role: 'Head of Product Marketing',
    company: 'Scale-up industrielle, 40 commerciaux',
  },
  {
    quote: "Pour la première fois, notre brief produit est basé sur ce que les clients disent en RDV — pas sur ce qu'ils répondent à nos sondages.",
    name: 'A. Dupont',
    role: 'VP Marketing',
    company: 'Groupe B2B, 120M€ CA',
  },
];

/* ─── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fi-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fi-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fi-1 { animation: fi-up 0.65s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .fi-2 { animation: fi-up 0.65s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .fi-3 { animation: fi-up 0.65s cubic-bezier(.22,1,.36,1) 0.25s both; }
        .fi-4 { animation: fi-up 0.65s cubic-bezier(.22,1,.36,1) 0.35s both; }
        .fi-5 { animation: fi-up 0.65s cubic-bezier(.22,1,.36,1) 0.48s both; }
        .fi-6 { animation: fi-fade 0.8s cubic-bezier(.22,1,.36,1) 0.55s both; }
      `}</style>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="bg-white pt-14">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12 xl:gap-16 items-center">

            {/* Left */}
            <div className="space-y-6 max-w-xl">
              {/* Badge — pill style matching app filter buttons */}
              <div className="fi-1 inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Intelligence terrain en temps réel
                </span>
              </div>

              {/* Headline */}
              <h1
                className="fi-2 text-slate-900 font-extrabold leading-[1.05] tracking-[-0.03em]"
                style={{
                  fontSize: 'clamp(36px, 6vw, 64px)',
                }}
              >
                Propulsez votre marketing grâce à l&apos;intelligence du terrain.
              </h1>

              {/* Body */}
              <p className="fi-3 text-base text-slate-500 leading-relaxed">
                Vos commerciaux entendent ce que les études de marché ne captent jamais.
                Field Intelligence transforme chaque compte rendu CRM en signal marché
                exploitable — automatiquement.
              </p>

              {/* CTAs — matches app button patterns */}
              <div className="fi-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Démarrer gratuitement <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Voir une démo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats — app KPI card style */}
              <div className="fi-5 flex items-center gap-5 pt-2">
                {[
                  { n: '85%',  label: 'signaux perdus / semaine',   cls: 'text-slate-900' },
                  { n: '2×',   label: 'plus rapide que les études', cls: 'text-indigo-600' },
                  { n: '100%', label: 'de vos RDV analysés',        cls: 'text-slate-900' },
                ].map((stat, i) => (
                  <>
                    {i > 0 && <div key={`sep${i}`} className="w-px h-8 bg-slate-200" />}
                    <div key={stat.n}>
                      <div
                        className={`text-2xl font-bold tabular-nums ${stat.cls}`}
                      >
                        {stat.n}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{stat.label}</div>
                    </div>
                  </>
                ))}
              </div>
            </div>

            {/* Right — animation card, same style as app cards */}
            <div className="fi-6 hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CRM BAND ════════════════════════════════════════ */}
      <section className="bg-slate-50 border-y border-slate-200 px-5 sm:px-8 py-7">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-center text-[11px] text-slate-400 uppercase tracking-widest font-medium">
            Connecté à votre CRM existant
          </p>
          <CrmLogos />
        </div>
      </section>

      {/* ══ PROBLEM ═════════════════════════════════════════ */}
      <section className="bg-white px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-10">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Le problème</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              85% des signaux terrain disparaissent chaque semaine.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                borderColor: 'border-red-500',
                badgeColor: 'text-red-600 bg-red-50 border-red-200',
                title: "L'étude est déjà périmée",
                desc: "6 à 12 mois pour produire. Les concurrents ont bougé. Vous briefez vos équipes avec des données d'hier.",
              },
              {
                n: '02',
                borderColor: 'border-amber-500',
                badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
                title: 'Le CR ne remonte jamais',
                desc: '3 à 5 CR par semaine dans le CRM. Chacun contient des signaux précieux sur la concurrence. Personne ne les lit.',
              },
              {
                n: '03',
                borderColor: 'border-indigo-500',
                badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
                title: 'Vos battlecards sont du vent',
                desc: "Basées sur ce que les concurrents affichent — pas ce qu'ils font sur le terrain. Le décalage se voit dans vos taux de closing.",
              },
            ].map((p) => (
              <div
                key={p.n}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 ${p.borderColor}`}
              >
                <div className="p-6 space-y-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.badgeColor}`}>
                    {p.n}
                  </span>
                  <h3
                    className="text-base font-semibold text-slate-900"
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section className="bg-slate-50 border-t border-slate-200 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="max-w-lg">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              Six radars. Une seule source de vérité.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${f.bg} ${f.color} flex items-center justify-center flex-shrink-0`}>
                    {f.icon}
                  </div>
                  <h3
                    className="text-[14px] font-semibold text-slate-900"
                  >
                    {f.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                <span className={`text-xs font-semibold ${f.statColor}`}>{f.stat}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Voir toutes les fonctionnalités <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER ══════════════════════════════════ */}
      <section className="bg-white border-t border-slate-200 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Avant / Après</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              Le terrain au cœur de votre performance marketing.
            </h2>
          </div>

          {/* Comparison table — app table style */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
              <div className="p-4" />
              <div className="p-4 border-l border-slate-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-slate-500">Étude de marché</span>
              </div>
              <div className="p-4 border-l border-slate-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">Field Intelligence</span>
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-3 ${i < COMPARISON.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="p-4 text-xs font-medium text-slate-400 border-r border-slate-100">
                  {row.aspect}
                </div>
                <div className="p-4 text-sm text-slate-400 line-through border-r border-slate-100">
                  {row.before}
                </div>
                <div className="p-4 text-sm font-medium text-slate-800">
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROI SIMULATOR ════════════════════════════════════ */}
      <section className="bg-slate-50 border-t border-slate-200 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Simulateur</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              Calculez ce que vous perdez chaque semaine.
            </h2>
          </div>
          <RoiSimulator />
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════ */}
      <section className="bg-white border-t border-slate-200 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Témoignages</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              Ce qu&apos;en disent nos clients.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════ */}
      <section id="pricing" className="bg-slate-50 border-t border-slate-200 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">Pricing</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight"
            >
              Simple. Tout inclus.
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
            {/* Badge */}
            <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">
                Tout inclus
              </span>
              <span className="text-xs text-slate-500">Sans engagement</span>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-end gap-1.5">
                  <span
                    className="text-5xl font-extrabold text-slate-900 leading-none tracking-tight"
                  >
                    199€
                  </span>
                  <span className="text-slate-400 text-sm mb-1">/mois</span>
                </div>
                <p className="text-sm text-slate-500 mt-1.5">
                  Utilisateurs illimités · Tous les modules · Support dédié
                </p>
              </div>

              <ul className="space-y-2.5">
                {[
                  '6 modules analytiques complets',
                  "Sync CRM automatique (2 ans d'historique)",
                  'Utilisateurs illimités',
                  'Alertes et notifications configurables',
                  'Export CSV / PDF',
                  'Support dédié sous 24h',
                  'Hébergement Europe · RGPD',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-xs text-slate-400">
                14 jours d&apos;essai gratuit · Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — indigo section ════════════════════════ */}
      <section className="bg-indigo-600 px-5 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2
            className="text-white font-extrabold leading-tight tracking-tight"
            style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
            }}
          >
            Vos commerciaux savent.<br />
            Maintenant votre marketing aussi.
          </h2>

          <p className="text-indigo-200 text-base leading-relaxed">
            Connectez votre CRM en 10 minutes. Premiers signaux dans la journée.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 border border-indigo-400 hover:border-indigo-300 text-indigo-100 hover:text-white text-sm font-medium rounded-lg transition-colors"
            >
              Réserver une démo
            </Link>
          </div>

          <p className="text-indigo-300 text-xs pt-1">
            Pas de carte bancaire · 14 jours d&apos;essai · Support dédié
          </p>
        </div>
      </section>
    </>
  );
}
