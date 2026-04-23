import Link from 'next/link';
import {
  Sword, DollarSign, Package, BarChart2, TrendingUp, Map,
  ArrowRight, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';
import { HeroAnimation } from '@/components/marketing/hero-animation';
import { RoiSimulator } from '@/components/marketing/roi-simulator';
import { CrmLogos } from '@/components/marketing/crm-logos';

/* ─── Design tokens — cohérent avec l'app (indigo family) ──── */
const BG       = '#06090F';
const BG_RAISED = '#0D1117';
const BORDER   = 'rgba(255,255,255,0.07)';
const INDIGO   = '#6366F1';
const INDIGO_DIM = 'rgba(99,102,241,0.12)';

/* ─── Dot grid ─────────────────────────────────────────────── */
function DotGrid({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity,
      }}
      aria-hidden="true"
    />
  );
}

/* ─── Section chrome ────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="inline-block w-4 h-px" style={{ background: INDIGO }} />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: INDIGO }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.12] tracking-[-0.03em] ${className}`}
      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
    >
      {children}
    </h2>
  );
}

/* ─── Features ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Sword className="w-4 h-4" />,
    accentColor: '#818CF8',
    title: 'Radar Concurrentiel',
    desc: 'Qui est actif chez vos clients, dans quelle région, avec quel argument. En temps réel depuis les CR de visite.',
    stat: '12 concurrents cartographiés',
  },
  {
    icon: <DollarSign className="w-4 h-4" />,
    accentColor: '#6366F1',
    title: 'Radar Prix',
    desc: "L'écart de prix réel perçu terrain — pas les grilles affichées. Détecté automatiquement.",
    stat: '−15% détecté vs. Acme',
  },
  {
    icon: <Package className="w-4 h-4" />,
    accentColor: '#F87171',
    title: 'Offres Concurrentes',
    desc: "Chaque bundle, essai gratuit ou condition spéciale détectée lors d'un RDV client.",
    stat: '3 bundles actifs repérés',
  },
  {
    icon: <BarChart2 className="w-4 h-4" />,
    accentColor: '#34D399',
    title: 'Baromètre des Besoins',
    desc: 'Les vrais besoins de vos clients cette semaine, avec leurs mots exacts, non filtrés.',
    stat: '7 besoins émergents',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    accentColor: '#60A5FA',
    title: 'Deals Gagnés / Perdus',
    desc: 'Pourquoi vous gagnez et perdez — depuis les verbatims terrain de vos commerciaux.',
    stat: '+18% closing identifié',
  },
  {
    icon: <Map className="w-4 h-4" />,
    accentColor: '#2DD4BF',
    title: 'Cartographie Terrain',
    desc: 'Heatmap de pression concurrentielle et de risque portefeuille par zone géographique.',
    stat: '3 zones critiques IDF',
  },
];

/* ─── Comparison ────────────────────────────────────────────── */
const COMPARISON = [
  { aspect: 'Fraîcheur',  before: '6 à 12 mois de délai de production',    after: 'Signal terrain en temps réel' },
  { aspect: 'Source',     before: 'Sondages, panels, cabinets coûteux',     after: 'Verbatims de vos propres RDV' },
  { aspect: 'Coût',       before: '15 000€ – 80 000€ par étude',            after: 'Abonnement mensuel prévisible' },
  { aspect: 'Biais',      before: 'Déclaratif, questions orientées',         after: 'Comportemental, non sollicité' },
  { aspect: 'Couverture', before: 'Échantillon représentatif',               after: '100% de vos RDV analysés' },
  { aspect: 'Format',     before: 'Rapport PDF + réunion de restitution',    after: 'Dashboard filtrable + alertes push' },
];

/* ─── Testimonials ──────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "On avait des battlecards basées sur les comms publiques d'Acme. Avec Field Intelligence, on a découvert 3 offres bundle qu'on ignorait — et nos commerciaux gagnent plus.",
    name: 'C. Martin',
    role: 'Directrice Marketing',
    company: 'Éditeur SaaS B2B, 80M€ ARR',
    featured: true,
  },
  {
    quote: "Field Intelligence a remplacé notre réunion mensuelle avec les KAM par un dashboard consulté chaque matin. Le delta de réactivité est énorme.",
    name: 'L. Bernard',
    role: 'Head of Product Marketing',
    company: 'Scale-up industrielle, 40 commerciaux',
    featured: false,
  },
  {
    quote: "Pour la première fois, notre brief produit est basé sur ce que les clients disent en RDV — pas sur ce qu'ils répondent à nos sondages.",
    name: 'A. Dupont',
    role: 'VP Marketing',
    company: 'Groupe B2B, 120M€ CA',
    featured: false,
  },
];

/* ─── Page ──────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fi-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fi-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .fi-1 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .fi-2 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.17s both; }
        .fi-3 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.29s both; }
        .fi-4 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.41s both; }
        .fi-5 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.55s both; }
        .fi-6 { animation: fi-fade 0.9s cubic-bezier(.22,1,.36,1) 0.65s both; }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative min-h-[100svh] flex items-center px-5 sm:px-8 pt-24 pb-20 overflow-hidden"
        style={{ background: BG }}
      >
        <DotGrid />

        {/* Indigo glow — upper right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-5%',
            right: '-8%',
            width: '55%',
            paddingBottom: '45%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-14 xl:gap-20 items-center">

            {/* Left */}
            <div className="space-y-8 max-w-2xl">
              {/* Badge */}
              <div
                className="fi-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]"
                style={{
                  border: `1px solid rgba(99,102,241,0.30)`,
                  background: 'rgba(99,102,241,0.08)',
                  color: '#818CF8',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: INDIGO }} />
                Intelligence terrain en temps réel
              </div>

              {/* Headline — Syne bold, cohérent avec l'app */}
              <h1
                className="fi-2 text-white font-extrabold leading-[1.0] tracking-[-0.04em]"
                style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontSize: 'clamp(44px, 7.5vw, 96px)',
                }}
              >
                Votre marketing<br />
                mérite mieux<br />
                <span style={{ color: INDIGO }}>que la veille web.</span>
              </h1>

              {/* Body */}
              <p
                className="fi-3 text-[16px] leading-[1.8] max-w-lg"
                style={{ color: 'rgba(255,255,255,0.42)' }}
              >
                Vos commerciaux entendent ce que les études de marché ne captent jamais.
                Field Intelligence transforme chaque compte rendu CRM en signal marché
                exploitable — automatiquement.
              </p>

              {/* CTAs — style cohérent avec app (indigo primary) */}
              <div className="fi-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold text-white transition-colors"
                  style={{ background: INDIGO }}
                >
                  Démarrer gratuitement <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] font-medium transition-colors"
                  style={{
                    border: `1px solid rgba(255,255,255,0.10)`,
                    color: 'rgba(255,255,255,0.50)',
                  }}
                >
                  Voir une démo <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats strip */}
              <div className="fi-5 flex items-center gap-6 pt-1">
                {[
                  { n: '85%',  label: 'signaux perdus / semaine',  highlight: false },
                  { n: '2×',   label: 'plus rapide que les études', highlight: true  },
                  { n: '100%', label: 'de vos RDV analysés',       highlight: false },
                ].map((stat, i) => (
                  <>
                    {i > 0 && (
                      <div
                        key={`sep-${i}`}
                        className="w-px h-10 flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.07)' }}
                      />
                    )}
                    <div key={stat.n}>
                      <span
                        className="block text-[24px] font-bold tabular-nums"
                        style={{
                          fontFamily: 'var(--font-syne), sans-serif',
                          color: stat.highlight ? '#818CF8' : 'rgba(255,255,255,0.88)',
                        }}
                      >
                        {stat.n}
                      </span>
                      <span
                        className="text-[11px] leading-tight"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {stat.label}
                      </span>
                    </div>
                  </>
                ))}
              </div>
            </div>

            {/* Right — hero animation */}
            <div className="fi-6 hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CRM TRUST BAND ════════════════════════════════════ */}
      <section
        className="px-5 sm:px-8 py-8"
        style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: BG }}
      >
        <div className="max-w-4xl mx-auto space-y-5">
          <p
            className="text-center text-[11px] uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            Connecté à votre CRM existant
          </p>
          <CrmLogos />
        </div>
      </section>

      {/* ══ PROBLEM ═══════════════════════════════════════════ */}
      <section
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG }}
      >
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="max-w-2xl mb-14">
            <SectionLabel>Le problème</SectionLabel>
            <SectionTitle>
              85% des signaux terrain{' '}
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>disparaissent chaque semaine.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                accentColor: '#F87171',
                title: "L'étude est déjà périmée",
                desc: "6 à 12 mois pour produire. Les concurrents ont bougé. Vous briefez vos équipes avec des données d'hier.",
              },
              {
                n: '02',
                accentColor: '#FBBF24',
                title: 'Le CR ne remonte jamais',
                desc: '3 à 5 CR par semaine dans le CRM. Chacun contient des signaux priceless sur la concurrence et les prix. Personne ne les lit.',
              },
              {
                n: '03',
                accentColor: INDIGO,
                title: 'Vos battlecards sont du vent',
                desc: "Basées sur ce que les concurrents affichent — pas ce qu'ils font sur le terrain. Le décalage se voit dans vos taux de closing.",
              },
            ].map((p) => (
              <div
                key={p.n}
                className="overflow-hidden"
                style={{
                  background: BG_RAISED,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '12px',
                }}
              >
                <div style={{ height: 2, background: p.accentColor }} />
                <div className="p-6 space-y-4">
                  <span
                    className="text-[11px] font-bold font-mono tracking-widest"
                    style={{ color: p.accentColor }}
                  >
                    {p.n}
                  </span>
                  <h3
                    className="text-[15px] font-bold text-white leading-snug"
                    style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                  >
                    {p.title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG_RAISED, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          <div className="max-w-xl">
            <SectionLabel>Fonctionnalités</SectionLabel>
            <SectionTitle>
              Six radars.{' '}
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>Une seule source de vérité.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="overflow-hidden hover:border-white/[0.14] transition-colors duration-200"
                style={{
                  background: BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '10px',
                }}
              >
                <div style={{ height: 2, background: f.accentColor }} />
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${f.accentColor}18`,
                        color: f.accentColor,
                      }}
                    >
                      {f.icon}
                    </div>
                    <h3
                      className="text-[14px] font-bold text-white"
                      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                    >
                      {f.title}
                    </h3>
                  </div>
                  <p
                    className="text-[13px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    {f.desc}
                  </p>
                  <div
                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-md"
                    style={{
                      background: `${f.accentColor}12`,
                      border: `1px solid ${f.accentColor}20`,
                      color: f.accentColor,
                    }}
                  >
                    {f.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 text-[13px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Voir toutes les fonctionnalités <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER ════════════════════════════════════ */}
      <section
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-1">
            <SectionLabel>Avant / Après</SectionLabel>
            <SectionTitle className="text-center">
              Ce n&apos;est pas une étude de marché{' '}
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>améliorée.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-4 items-stretch">
            {/* Avant */}
            <div
              className="overflow-hidden"
              style={{
                background: 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.12)',
                borderRadius: '12px',
              }}
            >
              <div
                className="px-5 py-3.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(239,68,68,0.10)' }}
              >
                <XCircle className="w-4 h-4" style={{ color: 'rgba(239,68,68,0.65)' }} />
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(239,68,68,0.55)', fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  Étude de marché
                </span>
              </div>
              <ul>
                {COMPARISON.map((row, i) => (
                  <li
                    key={row.aspect}
                    className="px-5 py-3.5 flex items-start gap-3"
                    style={i > 0 ? { borderTop: '1px solid rgba(239,68,68,0.07)' } : {}}
                  >
                    <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'rgba(239,68,68,0.40)' }} />
                    <div>
                      <span
                        className="block text-[10px] uppercase tracking-wider mb-0.5"
                        style={{ color: 'rgba(255,255,255,0.20)' }}
                      >
                        {row.aspect}
                      </span>
                      <span
                        className="text-[13px] line-through"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {row.before}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* VS */}
            <div className="hidden md:flex items-center justify-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{
                  background: BG_RAISED,
                  border: `1px solid ${BORDER}`,
                  color: 'rgba(255,255,255,0.28)',
                  fontFamily: 'var(--font-syne), sans-serif',
                }}
              >
                VS
              </div>
            </div>

            {/* Après */}
            <div
              className="overflow-hidden mt-4 md:mt-0"
              style={{
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '12px',
              }}
            >
              <div
                className="px-5 py-3.5 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.10)' }}
              >
                <CheckCircle className="w-4 h-4" style={{ color: '#818CF8' }} />
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: '#818CF8', fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  Field Intelligence
                </span>
              </div>
              <ul>
                {COMPARISON.map((row, i) => (
                  <li
                    key={row.aspect}
                    className="px-5 py-3.5 flex items-start gap-3"
                    style={i > 0 ? { borderTop: '1px solid rgba(99,102,241,0.07)' } : {}}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#818CF8' }} />
                    <div>
                      <span
                        className="block text-[10px] uppercase tracking-wider mb-0.5"
                        style={{ color: 'rgba(255,255,255,0.20)' }}
                      >
                        {row.aspect}
                      </span>
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: '#a5b4fc' }}
                      >
                        {row.after}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ROI SIMULATOR ═════════════════════════════════════ */}
      <section
        id="simulator"
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG_RAISED, borderTop: `1px solid ${BORDER}` }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 500,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-1">
            <SectionLabel>Simulateur</SectionLabel>
            <SectionTitle className="text-center">
              Calculez ce que vous{' '}
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>perdez chaque semaine.</span>
            </SectionTitle>
          </div>
          <RoiSimulator />
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
      <section
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG, borderTop: `1px solid ${BORDER}` }}
      >
        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          <div className="text-center">
            <SectionLabel>Témoignages</SectionLabel>
            <SectionTitle className="text-center">
              Ce qu&apos;en disent{' '}
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>nos clients.</span>
            </SectionTitle>
          </div>

          {/* Featured */}
          <div
            className="p-8 sm:p-10"
            style={{
              background: BG_RAISED,
              border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${INDIGO}`,
              borderRadius: '12px',
            }}
          >
            <p
              className="text-[16px] sm:text-[18px] leading-[1.8] italic max-w-3xl"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              &ldquo;{TESTIMONIALS[0].quote}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                style={{ background: INDIGO_DIM, border: `1px solid rgba(99,102,241,0.28)`, color: '#818CF8' }}
              >
                {TESTIMONIALS[0].name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white">{TESTIMONIALS[0].name}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {TESTIMONIALS[0].role} · {TESTIMONIALS[0].company}
                </div>
              </div>
            </div>
          </div>

          {/* 2 smaller */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <div
                key={i}
                className="p-6 flex flex-col gap-5"
                style={{
                  background: BG_RAISED,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '12px',
                }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} style={{ color: '#818CF8', fontSize: 13 }}>★</span>
                  ))}
                </div>
                <p
                  className="text-[13px] leading-[1.75] flex-1 italic"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div
                  className="flex items-center gap-3 pt-4"
                  style={{ borderTop: `1px solid ${BORDER}` }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: INDIGO_DIM, border: `1px solid rgba(99,102,241,0.22)`, color: '#818CF8' }}
                  >
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">{t.name}</div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════ */}
      <section
        id="pricing"
        className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG_RAISED, borderTop: `1px solid ${BORDER}` }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 480,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-md mx-auto space-y-8">
          <div className="text-center space-y-1">
            <SectionLabel>Pricing</SectionLabel>
            <SectionTitle className="text-center">
              Simple.{' '}
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>Tout inclus.</span>
            </SectionTitle>
          </div>

          <div
            className="overflow-hidden"
            style={{
              background: BG,
              border: `1px solid rgba(99,102,241,0.30)`,
              borderRadius: '14px',
              boxShadow: '0 0 60px rgba(99,102,241,0.06)',
            }}
          >
            <div
              className="px-8 py-3 flex items-center justify-between"
              style={{
                borderBottom: `1px solid rgba(99,102,241,0.12)`,
                background: 'rgba(99,102,241,0.06)',
              }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: '#818CF8', fontFamily: 'var(--font-syne), sans-serif' }}
              >
                Tout inclus
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Sans engagement
              </span>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <div className="flex items-end gap-2">
                  <span
                    className="font-extrabold text-white leading-none tracking-[-0.04em]"
                    style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 60 }}
                  >
                    199€
                  </span>
                  <span className="mb-1.5 text-[14px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    /mois
                  </span>
                </div>
                <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  Utilisateurs illimités · Tous les modules · Support dédié
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  '6 modules analytiques complets',
                  "Sync CRM automatique (2 ans d'historique)",
                  'Utilisateurs illimités',
                  'Alertes et notifications configurables',
                  'Export CSV / PDF',
                  'Support dédié sous 24h',
                  'Hébergement Europe · RGPD',
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[13px]"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: INDIGO }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Primary CTA — indigo, matching app's bg-indigo-600 */}
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-[14px] text-white transition-colors"
                style={{ background: INDIGO }}
              >
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                14 jours d&apos;essai gratuit · Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════ */}
      <section
        className="relative py-28 sm:py-36 px-5 sm:px-8 overflow-hidden"
        style={{ background: BG, borderTop: `1px solid ${BORDER}` }}
      >
        <DotGrid opacity={0.4} />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 700,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 65%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <h2
            className="text-white font-extrabold leading-[1.05] tracking-[-0.04em]"
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 'clamp(36px, 6vw, 72px)',
            }}
          >
            Vos commerciaux savent.<br />
            <span style={{ color: '#818CF8' }}>Maintenant votre marketing aussi.</span>
          </h2>

          <p
            className="text-[16px] leading-[1.8] max-w-lg mx-auto"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            Connectez votre CRM en 10 minutes. Premiers signaux dans la journée.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-[14px] text-white transition-colors"
              style={{ background: INDIGO }}
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-[14px] font-medium transition-colors"
              style={{
                border: `1px solid rgba(255,255,255,0.11)`,
                color: 'rgba(255,255,255,0.50)',
              }}
            >
              Réserver une démo
            </Link>
          </div>

          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Pas de carte bancaire · 14 jours d&apos;essai · Support dédié
          </p>
        </div>
      </section>
    </>
  );
}
