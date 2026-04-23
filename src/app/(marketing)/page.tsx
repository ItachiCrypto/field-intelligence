import Link from 'next/link';
import { HeroAnimation } from '@/components/marketing/hero-animation';
import { RoiSimulator } from '@/components/marketing/roi-simulator';
import { CrmLogos } from '@/components/marketing/crm-logos';

/* ─── Features ───────────────────────────────────────────────── */
const FEATURES = [
  {
    num: 'I',
    title: 'Radar concurrentiel',
    kicker: 'Concurrence',
    desc: "Qui est actif chez vos clients, dans quelle région, avec quel argument. Cartographie vivante construite à partir de chaque verbatim terrain.",
    stat: '12 concurrents cartographiés',
    tone: '#CC3329',
  },
  {
    num: 'II',
    title: 'Veille des prix',
    kicker: 'Pricing',
    desc: "L'écart de prix réel perçu en rendez-vous — pas les grilles affichées. Seuils, dérives, sur-remises signalés automatiquement.",
    stat: '−15% détecté vs. Acme',
    tone: '#D4A017',
  },
  {
    num: 'III',
    title: 'Offres concurrentes',
    kicker: 'Packaging',
    desc: "Chaque bundle, essai gratuit ou condition spéciale dégainée par vos concurrents, détecté dès le prochain RDV.",
    stat: '3 bundles actifs repérés',
    tone: '#7A3B8F',
  },
  {
    num: 'IV',
    title: 'Baromètre des besoins',
    kicker: 'Demand',
    desc: 'Les vrais besoins de vos clients, exprimés cette semaine, avec leurs mots — non filtrés par un questionnaire fermé.',
    stat: '7 besoins émergents',
    tone: '#4A6B3A',
  },
  {
    num: 'V',
    title: 'Deals gagnés & perdus',
    kicker: 'Win/loss',
    desc: "Pourquoi vous gagnez et perdez — à partir des verbatims commerciaux terrain, pas d'enquêtes post-mortem biaisées.",
    stat: '+18% closing identifié',
    tone: '#1A6B7A',
  },
  {
    num: 'VI',
    title: 'Cartographie terrain',
    kicker: 'Geo',
    desc: 'Heatmap de pression concurrentielle et de risque portefeuille, zone par zone, secteur par secteur.',
    stat: '3 zones critiques IDF',
    tone: '#8A4A1F',
  },
];

/* ─── Comparison ─────────────────────────────────────────────── */
const COMPARISON = [
  { aspect: 'Fraîcheur',  before: '6 à 12 mois de délai',          after: 'Temps réel' },
  { aspect: 'Source',     before: 'Sondages, panels, cabinets',     after: 'Verbatims de vos RDV' },
  { aspect: 'Coût',       before: '15 000€ – 80 000€ / étude',      after: 'Abonnement mensuel' },
  { aspect: 'Biais',      before: 'Déclaratif, orienté',            after: 'Comportemental, brut' },
  { aspect: 'Couverture', before: 'Échantillon représentatif',      after: '100% de vos RDV' },
  { aspect: 'Format',     before: 'Rapport PDF + réunion',          after: 'Dashboard + alertes push' },
];

/* ─── Testimonials ───────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      "On avait des battlecards basées sur les comms publiques d'Acme. Avec Field Intelligence, on a découvert 3 offres bundle qu'on ignorait complètement — et nos commerciaux gagnent plus.",
    name: 'C. Martin',
    role: 'Directrice Marketing',
    company: 'Éditeur SaaS B2B · 80M€ ARR',
  },
  {
    quote:
      'Field Intelligence a remplacé notre réunion mensuelle avec les KAM par un dashboard consulté chaque matin. Le delta de réactivité est énorme.',
    name: 'L. Bernard',
    role: 'Head of Product Marketing',
    company: 'Scale-up industrielle · 40 commerciaux',
  },
  {
    quote:
      "Pour la première fois, notre brief produit est basé sur ce que les clients disent en RDV — pas sur ce qu'ils répondent à nos sondages.",
    name: 'A. Dupont',
    role: 'VP Marketing',
    company: 'Groupe B2B · 120M€ CA',
  },
];

/* ─── Tiny atoms ─────────────────────────────────────────────── */
function SectionKicker({ num, label }: { num: string; label: string }) {
  return (
    <div
      className="flex items-center gap-3 text-[10.5px] tracking-[0.18em] uppercase mb-5"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'rgba(26, 21, 16, 0.55)',
      }}
    >
      <span
        className="tabular-nums"
        style={{ color: '#CC3329', fontWeight: 600 }}
      >
        §{num}
      </span>
      <span
        className="h-px w-8"
        style={{ background: 'rgba(26, 21, 16, 0.3)' }}
      />
      <span>{label}</span>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fi-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fi-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fi-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .fi-1 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
        .fi-2 { animation: fi-up 0.8s cubic-bezier(.22,1,.36,1) 0.18s both; }
        .fi-3 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.34s both; }
        .fi-4 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.48s both; }
        .fi-5 { animation: fi-up 0.7s cubic-bezier(.22,1,.36,1) 0.62s both; }
        .fi-6 { animation: fi-fade 0.9s cubic-bezier(.22,1,.36,1) 0.3s both; }
        .fi-marquee { animation: fi-marquee 42s linear infinite; }
      `}</style>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative pt-24 sm:pt-28">
        {/* Top dateline strip */}
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div
            className="flex items-center justify-between py-4 border-t"
            style={{ borderColor: 'rgba(26, 21, 16, 0.2)' }}
          >
            <div
              className="flex items-center gap-4 text-[10.5px] tracking-[0.16em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(26, 21, 16, 0.6)',
              }}
            >
              <span style={{ color: '#CC3329', fontWeight: 600 }}>№ 001</span>
              <span style={{ opacity: 0.4 }}>—</span>
              <span>Paris · terrain vif</span>
              <span className="hidden sm:inline" style={{ opacity: 0.4 }}>—</span>
              <span className="hidden sm:inline">Printemps MMXXVI</span>
            </div>
            <div
              className="hidden md:flex items-center gap-2 text-[10.5px] tracking-[0.16em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(26, 21, 16, 0.6)',
              }}
            >
              <span>B2B · SaaS · Industrie</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-10 sm:pt-14 pb-20 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-14 xl:gap-20 items-start">
            {/* Left — editorial headline */}
            <div className="space-y-10">
              {/* Eyebrow */}
              <div
                className="fi-1 flex items-baseline gap-3 text-[11px] tracking-[0.2em] uppercase"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(26, 21, 16, 0.65)',
                }}
              >
                <span
                  className="inline-flex items-center gap-2 px-2.5 py-1"
                  style={{
                    background: '#CC3329',
                    color: '#F4EFE6',
                    borderRadius: 1,
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                  }}
                >
                  À la une
                </span>
                <span>Intelligence terrain · en continu</span>
              </div>

              {/* Monumental headline */}
              <h1
                className="fi-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(48px, 8.2vw, 132px)',
                  lineHeight: 0.9,
                  letterSpacing: '-0.045em',
                  color: '#1A1510',
                }}
              >
                <span>Votre marketing</span>
                <br />
                <span>mérite&nbsp;mieux</span>
                <br />
                <span
                  style={{
                    fontStyle: 'italic',
                    fontWeight: 400,
                  }}
                >
                  que&nbsp;la&nbsp;veille{' '}
                </span>
                <span
                  style={{
                    fontStyle: 'italic',
                    fontWeight: 400,
                    background: 'linear-gradient(180deg, transparent 62%, rgba(204, 51, 41, 0.35) 62%, rgba(204, 51, 41, 0.35) 92%, transparent 92%)',
                    padding: '0 0.1em',
                  }}
                >
                  web.
                </span>
              </h1>

              {/* Drop-cap lede */}
              <div className="fi-3 grid grid-cols-[auto_1fr] gap-5 max-w-[640px] pt-2">
                <span
                  className="leading-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 84,
                    letterSpacing: '-0.05em',
                    color: '#CC3329',
                    marginTop: -4,
                  }}
                >
                  V
                </span>
                <p
                  className="text-[17px] sm:text-[18.5px] leading-[1.55]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    color: 'rgba(26, 21, 16, 0.85)',
                    letterSpacing: '-0.005em',
                  }}
                >
                  os commerciaux entendent, chaque semaine, ce que les études de marché
                  ne captent jamais. Field Intelligence transforme{' '}
                  <em style={{ fontStyle: 'italic', fontWeight: 500 }}>
                    chaque compte rendu CRM
                  </em>{' '}
                  en signal marché exploitable — sans interroger personne, sans attendre.
                </p>
              </div>

              {/* CTAs */}
              <div className="fi-4 flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/auth/signup"
                  className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: '#1A1510',
                    color: '#F4EFE6',
                    borderRadius: 2,
                    boxShadow: '4px 4px 0 rgba(26, 21, 16, 0.15)',
                  }}
                >
                  <span
                    className="text-[14px]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    S&apos;abonner gratuitement
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-9 h-9"
                    style={{ background: '#CC3329', borderRadius: 2 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M1 7h12m0 0L8 2M13 7L8 12"
                        stroke="#F4EFE6"
                        strokeWidth="1.6"
                        strokeLinecap="square"
                      />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/demo"
                  className="group inline-flex items-center gap-2 px-5 py-3.5 transition-all hover:bg-[rgba(26,21,16,0.04)]"
                  style={{
                    border: '1px solid rgba(26, 21, 16, 0.4)',
                    color: '#1A1510',
                    borderRadius: 2,
                  }}
                >
                  <span
                    className="text-[13.5px] group-hover:italic transition-all"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    Lire la démo
                  </span>
                  <span
                    className="group-hover:translate-x-0.5 transition-transform"
                    style={{ color: 'rgba(26, 21, 16, 0.5)' }}
                  >
                    →
                  </span>
                </Link>
              </div>

              {/* Stats — horizontal rule */}
              <div
                className="fi-5 grid grid-cols-3 pt-8"
                style={{
                  borderTop: '2px solid #1A1510',
                  borderBottom: '1px solid rgba(26, 21, 16, 0.15)',
                }}
              >
                {[
                  { n: '85%', label: 'signaux perdus', sub: '/ semaine' },
                  { n: '2×', label: 'plus rapide', sub: 'que les études' },
                  { n: '100%', label: 'des RDV', sub: 'analysés' },
                ].map((stat, i) => (
                  <div
                    key={stat.n}
                    className={`py-5 px-3 sm:px-5 ${i > 0 ? 'border-l' : ''}`}
                    style={{ borderColor: 'rgba(26, 21, 16, 0.15)' }}
                  >
                    <div
                      className="tabular-nums leading-none"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 'clamp(32px, 4vw, 48px)',
                        letterSpacing: '-0.04em',
                        color: i === 1 ? '#CC3329' : '#1A1510',
                      }}
                    >
                      {stat.n}
                    </div>
                    <div
                      className="text-[11px] tracking-[0.14em] uppercase mt-2"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(26, 21, 16, 0.65)',
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(26, 21, 16, 0.4)',
                      }}
                    >
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — animation */}
            <div className="fi-6 hidden lg:block lg:pt-10">
              <HeroAnimation />
            </div>

            {/* Mobile animation */}
            <div className="fi-6 lg:hidden">
              <HeroAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* ══ TICKER / CRM BAND ════════════════════════════════ */}
      <section
        style={{
          background: '#1A1510',
          color: '#F4EFE6',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4 overflow-hidden">
          <div className="flex items-center gap-6 whitespace-nowrap fi-marquee">
            {Array.from({ length: 2 }).map((_, loop) => (
              <div key={loop} className="flex items-center gap-6 flex-shrink-0">
                {[
                  'Salesforce · synchro live',
                  'HubSpot · sans friction',
                  '100% RDV analysés',
                  'Pipedrive · natif',
                  'Zéro double-saisie',
                  'Dynamics 365 · Microsoft',
                  'Lecture seule · RGPD',
                  'Zoho · 2 ans historique',
                  'Premier signal en 24h',
                  'Monday · bientôt',
                ].map((txt, i) => (
                  <div key={`${loop}-${i}`} className="flex items-center gap-6">
                    <span
                      className="text-[11px] tracking-[0.18em] uppercase"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(244, 239, 230, 0.75)',
                      }}
                    >
                      {txt}
                    </span>
                    <span
                      className="text-[8px]"
                      style={{ color: '#CC3329' }}
                    >
                      ●
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          className="border-t"
          style={{ borderColor: 'rgba(244, 239, 230, 0.15)' }}
        >
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-6">
            <div
              className="text-center text-[11px] tracking-[0.2em] uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'rgba(244, 239, 230, 0.55)',
              }}
            >
              Connecté à votre CRM existant
            </div>
            <div
              style={{
                background: '#F4EFE6',
                borderRadius: 2,
                padding: '28px 20px',
              }}
            >
              <CrmLogos />
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROBLEM ═════════════════════════════════════════ */}
      <section className="px-6 lg:px-10 py-24 sm:py-32">
        <div className="max-w-[1400px] mx-auto">
          <SectionKicker num="01" label="Le problème" />

          {/* Giant pull quote */}
          <h2
            className="max-w-[1100px]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(36px, 5.5vw, 84px)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: '#1A1510',
            }}
          >
            <span
              style={{
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#CC3329',
              }}
            >
              85%
            </span>{' '}
            des signaux terrain{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
              disparaissent
            </span>{' '}
            chaque semaine.
          </h2>

          <p
            className="max-w-[560px] mt-8 text-[16px] leading-[1.6]"
            style={{
              color: 'rgba(26, 21, 16, 0.7)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Trois causes. Toutes connues. Toutes documentées. Aucune résolue par la
            pile logicielle actuelle du marketing B2B.
          </p>

          {/* Three causes — modular grid with rules */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 mt-14"
            style={{ borderTop: '2px solid #1A1510' }}
          >
            {[
              {
                n: '01',
                title: "L'étude est déjà périmée",
                desc: "6 à 12 mois pour produire. Les concurrents ont bougé. Vous briefez vos équipes avec des données d'hier.",
                tone: '#CC3329',
              },
              {
                n: '02',
                title: 'Le CR ne remonte jamais',
                desc: '3 à 5 CR par semaine dans le CRM. Chacun contient des signaux précieux sur la concurrence. Personne ne les lit.',
                tone: '#D4A017',
              },
              {
                n: '03',
                title: 'Vos battlecards sont du vent',
                desc: "Basées sur ce que les concurrents affichent — pas ce qu'ils font sur le terrain. Le décalage se voit dans vos taux de closing.",
                tone: '#7A3B8F',
              },
            ].map((p, i) => (
              <article
                key={p.n}
                className={`p-8 sm:p-10 ${i > 0 ? 'md:border-l' : ''} border-b md:border-b-0`}
                style={{
                  borderColor: 'rgba(26, 21, 16, 0.2)',
                  borderBottomColor: 'rgba(26, 21, 16, 0.2)',
                }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 52,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      color: p.tone,
                    }}
                  >
                    {p.n}
                  </span>
                  <span
                    className="h-8 w-px"
                    style={{ background: 'rgba(26, 21, 16, 0.3)' }}
                  />
                  <span
                    className="text-[10px] tracking-[0.18em] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(26, 21, 16, 0.55)',
                    }}
                  >
                    Cause
                  </span>
                </div>
                <h3
                  className="text-[22px] sm:text-[26px] leading-[1.15] mb-4"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#1A1510',
                  }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-[15px] leading-[1.6]"
                  style={{
                    color: 'rgba(26, 21, 16, 0.7)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {p.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section
        className="px-6 lg:px-10 py-24 sm:py-32"
        style={{
          borderTop: '2px solid #1A1510',
          background: 'rgba(26, 21, 16, 0.025)',
        }}
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <SectionKicker num="02" label="Sommaire éditorial" />
              <h2
                className="max-w-[900px]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 'clamp(36px, 5.5vw, 80px)',
                  lineHeight: 0.98,
                  letterSpacing: '-0.035em',
                  color: '#1A1510',
                }}
              >
                Six rubriques.{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
                  Une seule
                </span>{' '}
                source de vérité.
              </h2>
            </div>
            <p
              className="lg:max-w-[340px] text-[15px] leading-[1.6]"
              style={{
                color: 'rgba(26, 21, 16, 0.7)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Chaque module lit vos CR en continu et publie des rubriques indépendantes,
              consultables comme un journal. Alertes push sur les urgences.
            </p>
          </div>

          {/* Editorial grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              borderTop: '2px solid #1A1510',
              borderLeft: '1px solid rgba(26, 21, 16, 0.2)',
            }}
          >
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="relative p-7 lg:p-8 group transition-colors"
                style={{
                  borderRight: '1px solid rgba(26, 21, 16, 0.2)',
                  borderBottom: '1px solid rgba(26, 21, 16, 0.2)',
                }}
              >
                <div className="flex items-baseline justify-between mb-6">
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: 38,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      color: f.tone,
                    }}
                  >
                    {f.num}
                  </span>
                  <span
                    className="text-[10px] tracking-[0.18em] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(26, 21, 16, 0.5)',
                    }}
                  >
                    {f.kicker}
                  </span>
                </div>

                <h3
                  className="text-[22px] leading-[1.15] mb-4"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: '#1A1510',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-[14.5px] leading-[1.6] mb-5"
                  style={{
                    color: 'rgba(26, 21, 16, 0.7)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {f.desc}
                </p>

                <div
                  className="flex items-center gap-2 pt-4"
                  style={{ borderTop: '1px solid rgba(26, 21, 16, 0.12)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: f.tone }}
                  />
                  <span
                    className="text-[11.5px] tracking-[0.04em]"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: f.tone,
                      fontWeight: 600,
                    }}
                  >
                    {f.stat}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/fonctionnalites"
              className="inline-flex items-baseline gap-2 hover:italic transition-all"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 500,
                color: '#1A1510',
                letterSpacing: '-0.01em',
                borderBottom: '1px solid #1A1510',
              }}
            >
              Consulter le sommaire complet
              <span style={{ color: '#CC3329' }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BEFORE / AFTER ══════════════════════════════════ */}
      <section
        className="px-6 lg:px-10 py-24 sm:py-32"
        style={{ borderTop: '2px solid #1A1510' }}
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionKicker num="03" label="Avant · après" />

          <h2
            className="max-w-[900px]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(36px, 5.5vw, 80px)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: '#1A1510',
            }}
          >
            Ce n&apos;est pas{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
              une étude de marché
            </span>{' '}
            améliorée.
          </h2>

          {/* Comparison table — newspaper style */}
          <div
            className="mt-14"
            style={{
              background: '#FBFAF6',
              border: '1px solid #1A1510',
              boxShadow: '8px 8px 0 #1A1510',
              borderRadius: 2,
            }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-[1fr_1.3fr_1.3fr] border-b"
              style={{
                background: '#1A1510',
                color: '#F4EFE6',
                borderColor: '#1A1510',
              }}
            >
              <div
                className="p-4 text-[10px] tracking-[0.18em] uppercase"
                style={{ fontFamily: 'var(--font-mono)', opacity: 0.6 }}
              >
                Dimension
              </div>
              <div
                className="p-4 text-[10px] tracking-[0.18em] uppercase flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderLeft: '1px solid rgba(244, 239, 230, 0.15)',
                  opacity: 0.75,
                }}
              >
                <span>Jadis — Étude</span>
              </div>
              <div
                className="p-4 text-[10px] tracking-[0.18em] uppercase flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderLeft: '1px solid rgba(244, 239, 230, 0.15)',
                  color: '#CC3329',
                  fontWeight: 600,
                }}
              >
                <span>→ Field Intelligence</span>
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-[1fr_1.3fr_1.3fr] ${
                  i < COMPARISON.length - 1 ? 'border-b' : ''
                }`}
                style={{ borderColor: 'rgba(26, 21, 16, 0.1)' }}
              >
                <div
                  className="p-5 text-[11px] tracking-[0.14em] uppercase"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(26, 21, 16, 0.55)',
                    borderRight: '1px solid rgba(26, 21, 16, 0.1)',
                  }}
                >
                  {row.aspect}
                </div>
                <div
                  className="p-5 text-[15px]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: 'rgba(26, 21, 16, 0.45)',
                    textDecoration: 'line-through',
                    textDecorationColor: 'rgba(204, 51, 41, 0.55)',
                    borderRight: '1px solid rgba(26, 21, 16, 0.1)',
                  }}
                >
                  {row.before}
                </div>
                <div
                  className="p-5 text-[15.5px]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: '#1A1510',
                  }}
                >
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROI SIMULATOR ════════════════════════════════════ */}
      <section
        className="px-6 lg:px-10 py-24 sm:py-32"
        style={{
          borderTop: '2px solid #1A1510',
          background: 'rgba(26, 21, 16, 0.025)',
        }}
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionKicker num="04" label="Simulateur économique" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <h2
              className="max-w-[700px]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(36px, 5.2vw, 76px)',
                lineHeight: 0.98,
                letterSpacing: '-0.035em',
                color: '#1A1510',
              }}
            >
              Calculez ce que vous{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#CC3329' }}>
                perdez
              </span>{' '}
              chaque semaine.
            </h2>
            <p
              className="max-w-[320px] text-[14.5px] leading-[1.6]"
              style={{
                color: 'rgba(26, 21, 16, 0.65)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Trois curseurs. Zéro formulaire. Résultats actualisés en direct sur la
              base des benchmarks B2B observés.
            </p>
          </div>

          <RoiSimulator />
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════ */}
      <section
        className="px-6 lg:px-10 py-24 sm:py-32"
        style={{ borderTop: '2px solid #1A1510' }}
      >
        <div className="max-w-[1400px] mx-auto">
          <SectionKicker num="05" label="Tribune des lecteurs" />

          <h2
            className="max-w-[900px] mb-14"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(36px, 5.2vw, 76px)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: '#1A1510',
            }}
          >
            Ce qu&apos;en disent{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
              celles et ceux
            </span>{' '}
            qui lisent.
          </h2>

          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{
              borderTop: '2px solid #1A1510',
              borderLeft: '1px solid rgba(26, 21, 16, 0.2)',
            }}
          >
            {TESTIMONIALS.map((t, i) => (
              <article
                key={i}
                className="p-8 lg:p-10 flex flex-col gap-6"
                style={{
                  borderRight: '1px solid rgba(26, 21, 16, 0.2)',
                  borderBottom: '1px solid rgba(26, 21, 16, 0.2)',
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className="leading-none"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 72,
                      color: '#CC3329',
                      marginTop: -8,
                    }}
                  >
                    &ldquo;
                  </span>
                  <span
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(26, 21, 16, 0.45)',
                    }}
                  >
                    Témoignage
                  </span>
                </div>

                <p
                  className="text-[17px] leading-[1.5] flex-1"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    letterSpacing: '-0.005em',
                    color: '#1A1510',
                  }}
                >
                  {t.quote}
                </p>

                <div
                  className="pt-5 flex items-center gap-3"
                  style={{ borderTop: '1px solid rgba(26, 21, 16, 0.15)' }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center text-[11px] tabular-nums"
                    style={{
                      background: '#1A1510',
                      color: '#F4EFE6',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div
                      className="text-[14px]"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontWeight: 500,
                        color: '#1A1510',
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="text-[10.5px] tracking-[0.08em] uppercase"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(26, 21, 16, 0.55)',
                      }}
                    >
                      {t.role} · {t.company}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════ */}
      <section
        id="pricing"
        className="px-6 lg:px-10 py-24 sm:py-32"
        style={{
          borderTop: '2px solid #1A1510',
          background: 'rgba(26, 21, 16, 0.025)',
        }}
      >
        <div className="max-w-[1100px] mx-auto">
          <SectionKicker num="06" label="Abonnement" />

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-20 items-start">
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 'clamp(36px, 5.2vw, 78px)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.035em',
                  color: '#1A1510',
                }}
              >
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Simple.</span>
                <br />
                Tout inclus.
                <br />
                <span style={{ color: '#CC3329' }}>Sans engagement.</span>
              </h2>
              <p
                className="mt-6 text-[16px] leading-[1.6] max-w-[420px]"
                style={{
                  color: 'rgba(26, 21, 16, 0.7)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Un seul plan, toutes les rubriques. Utilisateurs illimités.
                Résiliable à tout moment. Fabriqué et hébergé en Europe.
              </p>
            </div>

            {/* Pricing ticket */}
            <div
              style={{
                background: '#FBFAF6',
                border: '1px solid #1A1510',
                boxShadow: '10px 10px 0 #1A1510',
                borderRadius: 2,
              }}
            >
              {/* Header strip */}
              <div
                className="px-6 py-3 flex items-center justify-between"
                style={{
                  background: '#1A1510',
                  color: '#F4EFE6',
                }}
              >
                <span
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                >
                  Plan unique
                </span>
                <span
                  className="text-[10px] tracking-[0.14em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)', opacity: 0.65 }}
                >
                  N° 2026-001
                </span>
              </div>

              <div className="p-8 space-y-8">
                {/* Price */}
                <div
                  className="pb-8"
                  style={{ borderBottom: '1px solid rgba(26, 21, 16, 0.15)' }}
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className="tabular-nums leading-none"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 96,
                        letterSpacing: '-0.055em',
                        color: '#1A1510',
                      }}
                    >
                      199
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 500,
                        fontSize: 32,
                        color: '#CC3329',
                      }}
                    >
                      €
                    </span>
                    <span
                      className="ml-2 text-[13px]"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'rgba(26, 21, 16, 0.5)',
                      }}
                    >
                      / mois
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[13px]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      color: 'rgba(26, 21, 16, 0.6)',
                    }}
                  >
                    Utilisateurs illimités · tous les modules · support dédié.
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {[
                    '6 rubriques analytiques complètes',
                    "Synchronisation CRM · 2 ans d'historique",
                    'Utilisateurs illimités',
                    'Alertes push configurables',
                    'Export CSV / PDF',
                    'Support dédié sous 24h',
                    'Hébergement Europe · RGPD',
                  ].map((f) => (
                    <li
                      key={f}
                      className="flex items-baseline gap-3 text-[14px]"
                      style={{
                        color: 'rgba(26, 21, 16, 0.85)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-4 flex justify-center text-[11px]"
                        style={{ color: '#CC3329', fontWeight: 700 }}
                      >
                        ✕
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup"
                  className="group flex items-center justify-between gap-3 w-full pl-5 pr-2 py-2.5 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: '#1A1510',
                    color: '#F4EFE6',
                    borderRadius: 2,
                  }}
                >
                  <span
                    className="text-[14px]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                    }}
                  >
                    Démarrer l&apos;abonnement
                  </span>
                  <span
                    className="inline-flex items-center justify-center w-9 h-9"
                    style={{ background: '#CC3329', borderRadius: 2 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path
                        d="M1 6.5h11m0 0L7 1.5M12 6.5L7 11.5"
                        stroke="#F4EFE6"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </span>
                </Link>

                <p
                  className="text-center text-[11px]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(26, 21, 16, 0.5)',
                    letterSpacing: '0.04em',
                  }}
                >
                  14 jours d&apos;essai · sans carte bancaire
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-6 lg:px-10 py-28 sm:py-40"
        style={{
          background: '#1A1510',
          color: '#F4EFE6',
        }}
      >
        {/* Decorative giant italic word */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(220px, 36vw, 580px)',
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            color: '#F4EFE6',
          }}
        >
          Maintenant.
        </div>

        <div className="max-w-[1100px] mx-auto relative z-10">
          <SectionKicker num="07" label="À suivre" />
        </div>

        <div className="max-w-[1100px] mx-auto text-center relative z-10 space-y-10">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(40px, 7vw, 112px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
            }}
          >
            Vos commerciaux savent.
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#CC3329' }}>
              Maintenant,
            </span>{' '}
            <span>votre marketing aussi.</span>
          </h2>

          <p
            className="max-w-[520px] mx-auto text-[17px] leading-[1.55]"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: 'rgba(244, 239, 230, 0.75)',
            }}
          >
            Connectez votre CRM en dix minutes. Premiers signaux publiés dans la journée.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-3 pl-6 pr-2 py-2 transition-transform hover:-translate-y-0.5"
              style={{
                background: '#F4EFE6',
                color: '#1A1510',
                borderRadius: 2,
              }}
            >
              <span
                className="text-[14px]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                }}
              >
                S&apos;abonner gratuitement
              </span>
              <span
                className="inline-flex items-center justify-center w-9 h-9"
                style={{ background: '#CC3329', borderRadius: 2 }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M1 6.5h11m0 0L7 1.5M12 6.5L7 11.5"
                    stroke="#F4EFE6"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </span>
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-5 py-3.5 transition-colors"
              style={{
                border: '1px solid rgba(244, 239, 230, 0.35)',
                color: '#F4EFE6',
                borderRadius: 2,
              }}
            >
              <span
                className="text-[13.5px]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Réserver une démo
              </span>
            </Link>
          </div>

          <p
            className="text-[10.5px] tracking-[0.18em] uppercase pt-4"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'rgba(244, 239, 230, 0.5)',
            }}
          >
            Sans carte · 14 jours d&apos;essai · Support dédié
          </p>
        </div>
      </section>
    </>
  );
}
