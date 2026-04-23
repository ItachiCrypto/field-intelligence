import Link from 'next/link';
import {
  Sword, DollarSign, Package, BarChart2, TrendingUp, Map,
  ArrowRight, CheckCircle, XCircle, Zap, ChevronRight,
} from 'lucide-react';
import { HeroAnimation } from '@/components/marketing/hero-animation';
import { RoiSimulator } from '@/components/marketing/roi-simulator';
import { CrmLogos } from '@/components/marketing/crm-logos';

/* ── Grain overlay ─────────────────────────────────────────── */
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

function Grain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.035]"
      style={{ backgroundImage: GRAIN_SVG, backgroundRepeat: 'repeat', backgroundSize: '300px 300px' }}
      aria-hidden="true"
    />
  );
}

/* ── Section heading ───────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-semibold text-[#6366F1] uppercase tracking-[0.15em] mb-4">
      {children}
    </span>
  );
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-[-0.03em] ${className}`}
      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
    >
      {children}
    </h2>
  );
}

/* ── Features bento data ───────────────────────────────────── */
const FEATURES = [
  {
    icon: <Sword className="w-4 h-4" />,
    color: '#818CF8',
    title: 'Radar Concurrentiel',
    desc: 'Qui est actif chez vos clients, dans quelle région, avec quel argument. En temps réel.',
    stat: '12 concurrents cartographiés',
    wide: true,
  },
  {
    icon: <DollarSign className="w-4 h-4" />,
    color: '#FB923C',
    title: 'Radar Prix',
    desc: 'L\'écart de prix réel perçu terrain — pas les grilles affichées.',
    stat: '−15% détecté vs. Acme',
    wide: false,
  },
  {
    icon: <Package className="w-4 h-4" />,
    color: '#F87171',
    title: 'Offres Concurrentes',
    desc: 'Chaque bundle, essai gratuit ou condition spéciale détectée en RDV.',
    stat: '3 bundles actifs repérés',
    wide: false,
  },
  {
    icon: <BarChart2 className="w-4 h-4" />,
    color: '#34D399',
    title: 'Baromètre des Besoins',
    desc: 'Les vrais besoins de vos clients cette semaine, avec leurs mots exacts.',
    stat: '7 besoins émergents',
    wide: false,
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    color: '#818CF8',
    title: 'Deals Gagnés / Perdus',
    desc: 'Pourquoi vous gagnez et perdez — depuis les verbatims terrain.',
    stat: '+18% closing identifié',
    wide: false,
  },
  {
    icon: <Map className="w-4 h-4" />,
    color: '#2DD4BF',
    title: 'Cartographie Terrain',
    desc: 'Heatmap de pression concurrentielle et de risque portefeuille par zone.',
    stat: '3 zones critiques IDF',
    wide: true,
  },
];

/* ── Before / After data ───────────────────────────────────── */
const COMPARISON = [
  { aspect: 'Fraîcheur', before: 'Étude de marché : 6-12 mois', after: 'Signal terrain : temps réel' },
  { aspect: 'Source', before: 'Sondages, panels, cabinets', after: 'Verbatims de vos propres RDV' },
  { aspect: 'Coût', before: '15 000€ – 80 000€ par étude', after: 'Abonnement mensuel fixe' },
  { aspect: 'Biais', before: 'Déclaratif, questions orientées', after: 'Comportemental, non sollicité' },
  { aspect: 'Couverture', before: 'Échantillon représentatif', after: '100% de vos RDV clients' },
  { aspect: 'Format', before: 'Rapport PDF + réunion', after: 'Dashboard filtrable + alertes' },
];

/* ── Testimonials ──────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: 'On avait des battlecards Salesforce basées sur leur comms publiques. Avec Field Intelligence, on a découvert 3 offres bundle qu\'on ignorait complètement.',
    name: 'C. Martin',
    role: 'Directrice Marketing',
    company: 'Éditeur SaaS B2B, 80M€ ARR',
  },
  {
    quote: 'Field Intelligence a remplacé notre point mensuel avec les KAM par un dashboard qu\'on consulte chaque matin. Le delta de réactivité est énorme.',
    name: 'L. Bernard',
    role: 'Head of Product Marketing',
    company: 'Scale-up industrielle, 40 commerciaux',
  },
  {
    quote: 'Pour la première fois, notre brief produit est basé sur ce que les clients disent réellement en RDV — pas sur ce qu\'ils répondent à nos sondages.',
    name: 'A. Dupont',
    role: 'VP Marketing',
    company: 'Groupe B2B, 120M€ CA',
  },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .anim-1 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.1s both; }
        .anim-2 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.22s both; }
        .anim-3 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.34s both; }
        .anim-4 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.46s both; }
        .anim-5 { animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.62s both; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden bg-[#0A0A0A]">
        <Grain />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-x-0 top-[20%] h-px bg-white/[0.04]" />
          <div className="absolute inset-x-0 bottom-[20%] h-px bg-white/[0.04]" />
          <div className="absolute inset-y-0 left-[15%] w-px bg-white/[0.03]" />
          <div className="absolute inset-y-0 right-[15%] w-px bg-white/[0.03]" />
        </div>

        {/* Glow orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.13) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          {/* Chip */}
          <div className="anim-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-[12px] text-white/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
            Intelligence terrain en temps réel
          </div>

          {/* Title */}
          <h1
            className="anim-2 text-[clamp(44px,8vw,96px)] font-extrabold text-white leading-[1.0] tracking-[-0.04em]"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Votre marketing<br />
            mérite mieux<br />
            <span className="text-[#6366F1]">que la veille web.</span>
          </h1>

          {/* Subtitle */}
          <p className="anim-3 text-[17px] text-white/45 max-w-xl mx-auto leading-relaxed">
            Vos commerciaux entendent chaque jour ce que vos clients pensent de vos concurrents, de vos prix, de vos offres. Field Intelligence capte ces conversations et les transforme en intelligence marché — automatiquement.
          </p>

          {/* CTAs */}
          <div className="anim-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] text-[14px] font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#simulator"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium text-white/50 hover:text-white transition-colors"
            >
              Calculer ce que vous perdez <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Animation */}
          <div className="anim-5">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* ── CRM TRUST BAND ───────────────────────────────────── */}
      <section className="border-y border-white/[0.06] py-8 px-5 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-center text-[12px] text-white/20 uppercase tracking-widest">
            Connecté à votre CRM existant
          </p>
          <CrmLogos />
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 px-5 overflow-hidden bg-[#0A0A0A]">
        <Grain />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="max-w-2xl mb-16">
            <SectionLabel>Le problème</SectionLabel>
            <SectionTitle>
              85% des signaux terrain<br />
              <span className="text-white/30">disparaissent chaque semaine.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                color: 'text-red-400',
                bg: 'bg-red-500/[0.08]',
                border: 'border-red-500/[0.12]',
                title: 'L\'étude est déjà périmée',
                desc: '6 à 12 mois pour produire. Les concurrents ont bougé. Vous briefez vos équipes avec des données d\'hier.',
              },
              {
                n: '02',
                color: 'text-amber-400',
                bg: 'bg-amber-500/[0.08]',
                border: 'border-amber-500/[0.12]',
                title: 'Le CR ne remonte jamais',
                desc: '3 à 5 CR par semaine dans le CRM. Chacun contient des signaux priceless sur la concurrence et les prix. Personne ne les lit.',
              },
              {
                n: '03',
                color: 'text-[#818CF8]',
                bg: 'bg-[#6366F1]/[0.08]',
                border: 'border-[#6366F1]/[0.12]',
                title: 'Vos battlecards sont du vent',
                desc: 'Basées sur ce que les concurrents affichent — pas ce qu\'ils font sur le terrain. Le décalage se voit dans vos taux de closing.',
              },
            ].map((p) => (
              <div
                key={p.n}
                className={`rounded-2xl border ${p.border} ${p.bg} p-6 space-y-4`}
              >
                <span className={`text-[11px] font-bold ${p.color} font-mono tracking-widest`}>{p.n}</span>
                <h3
                  className="text-[17px] font-bold text-white leading-snug"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {p.title}
                </h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ──────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 overflow-hidden bg-[#0D0D0D]">
        <Grain />
        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          <div className="max-w-2xl">
            <SectionLabel>Fonctionnalités</SectionLabel>
            <SectionTitle>
              Six modules.<br />
              <span className="text-white/30">Une seule source de vérité.</span>
            </SectionTitle>
          </div>

          {/* Bento: row 1 — wide + narrow + narrow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wide card */}
            <div className="md:col-span-2 rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors group">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06]"
                  style={{ color: FEATURES[0].color }}
                >
                  {FEATURES[0].icon}
                </div>
                <h3
                  className="text-[16px] font-bold text-white"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {FEATURES[0].title}
                </h3>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[0].desc}</p>
              <div
                className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]"
                style={{ color: FEATURES[0].color }}
              >
                {FEATURES[0].stat}
              </div>
            </div>
            {/* Narrow */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: FEATURES[1].color }}>
                  {FEATURES[1].icon}
                </div>
                <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>{FEATURES[1].title}</h3>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[1].desc}</p>
              <div className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]" style={{ color: FEATURES[1].color }}>{FEATURES[1].stat}</div>
            </div>
          </div>

          {/* Row 2 — narrow + narrow + wide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: FEATURES[2].color }}>{FEATURES[2].icon}</div>
                <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>{FEATURES[2].title}</h3>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[2].desc}</p>
              <div className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]" style={{ color: FEATURES[2].color }}>{FEATURES[2].stat}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: FEATURES[3].color }}>{FEATURES[3].icon}</div>
                <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>{FEATURES[3].title}</h3>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[3].desc}</p>
              <div className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]" style={{ color: FEATURES[3].color }}>{FEATURES[3].stat}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: FEATURES[4].color }}>{FEATURES[4].icon}</div>
                <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>{FEATURES[4].title}</h3>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[4].desc}</p>
              <div className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]" style={{ color: FEATURES[4].color }}>{FEATURES[4].stat}</div>
            </div>
          </div>

          {/* Row 3 — full wide */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 space-y-5 hover:border-[#6366F1]/30 transition-colors">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: FEATURES[5].color }}>{FEATURES[5].icon}</div>
                  <h3 className="text-[16px] font-bold text-white" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>{FEATURES[5].title}</h3>
                </div>
                <p className="text-[13px] text-white/40 leading-relaxed">{FEATURES[5].desc}</p>
                <div className="inline-block text-[12px] font-medium px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]" style={{ color: FEATURES[5].color }}>{FEATURES[5].stat}</div>
              </div>
              {/* Mini geo visual */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center justify-center min-h-[100px]">
                <div className="space-y-2 w-full max-w-xs">
                  {[['Île-de-France', 91, '#F87171'], ['PACA', 74, '#FB923C'], ['Auvergne-Rhône', 58, '#818CF8'], ['Grand Est', 34, '#34D399']].map(([region, pct, color]) => (
                    <div key={region as string} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-white/30">{region as string}</span>
                        <span style={{ color: color as string }}>{pct as number}%</span>
                      </div>
                      <div className="h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color as string }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors"
            >
              Voir toutes les fonctionnalités <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ──────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 overflow-hidden bg-[#0A0A0A]">
        <Grain />
        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <SectionLabel>Avant / Après</SectionLabel>
            <SectionTitle className="text-center">
              Ce n&apos;est pas une étude<br />
              <span className="text-white/30">de marché améliorée.</span>
            </SectionTitle>
          </div>

          <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-white/[0.07] bg-white/[0.02]">
              <div className="p-4 text-[11px] font-semibold text-white/20 uppercase tracking-widest" />
              <div className="p-4 border-l border-white/[0.07] flex items-center gap-2 text-[12px] font-medium text-white/30">
                <XCircle className="w-3.5 h-3.5 text-red-400/70" />
                Étude de marché
              </div>
              <div className="p-4 border-l border-white/[0.07] flex items-center gap-2 text-[12px] font-semibold text-[#818CF8]">
                <CheckCircle className="w-3.5 h-3.5 text-[#6366F1]" />
                Field Intelligence
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-3 ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
              >
                <div className="p-4 text-[12px] font-medium text-white/25 border-r border-white/[0.07]">
                  {row.aspect}
                </div>
                <div className="p-4 text-[13px] text-white/30 border-r border-white/[0.07]">
                  {row.before}
                </div>
                <div className="p-4 text-[13px] font-medium text-emerald-400">
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI SIMULATOR ───────────────────────────────────── */}
      <section id="simulator" className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 bg-[#0D0D0D] overflow-hidden">
        <Grain />
        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <SectionLabel>Simulateur</SectionLabel>
            <SectionTitle className="text-center">
              Calculez ce que vous<br />
              <span className="text-white/30">perdez chaque semaine.</span>
            </SectionTitle>
          </div>
          <RoiSimulator />
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 overflow-hidden bg-[#0A0A0A]">
        <Grain />
        <div className="relative z-10 max-w-5xl mx-auto space-y-12">
          <div className="text-center">
            <SectionLabel>Témoignages</SectionLabel>
            <SectionTitle className="text-center">
              Ce qu&apos;en disent<br />
              <span className="text-white/30">nos clients.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-7 flex flex-col gap-6">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} className="text-[#6366F1] text-sm">★</span>
                  ))}
                </div>
                <p className="text-[13px] text-white/50 leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8] text-[11px] font-bold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">{t.name}</div>
                    <div className="text-[11px] text-white/30">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 bg-[#0D0D0D] overflow-hidden">
        <Grain />

        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-lg mx-auto space-y-8">
          <div className="text-center space-y-2">
            <SectionLabel>Pricing</SectionLabel>
            <SectionTitle className="text-center">
              Simple.<br />
              <span className="text-white/30">Tout inclus.</span>
            </SectionTitle>
          </div>

          <div className="rounded-2xl border border-[#6366F1]/25 bg-[#111111] overflow-hidden">
            {/* Top badge */}
            <div className="px-8 py-3 border-b border-white/[0.06] bg-[#6366F1]/[0.08] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#818CF8] uppercase tracking-widest">Tout inclus</span>
              <span className="text-[11px] text-white/30">Sans engagement</span>
            </div>

            <div className="p-8 space-y-8">
              {/* Price */}
              <div>
                <div className="flex items-end gap-2">
                  <span
                    className="text-[64px] font-extrabold text-white leading-none tracking-[-0.04em]"
                    style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                  >
                    199€
                  </span>
                  <span className="text-white/30 text-[14px] mb-2">/mois</span>
                </div>
                <p className="text-[13px] text-white/35 mt-1">Utilisateurs illimités · Tous les modules · Support dédié</p>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {[
                  '6 modules analytiques complets',
                  'Sync CRM automatique (2 ans d\'historique)',
                  'Utilisateurs illimités',
                  'Alertes et notifications configurables',
                  'Export CSV / PDF',
                  'Support dédié sous 24h',
                  'Hébergement Europe · RGPD',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[13px] text-white/60">
                    <CheckCircle className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/auth/signup"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-[#0A0A0A] font-semibold text-[14px] hover:bg-white/90 transition-colors"
              >
                Démarrer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-center text-[11px] text-white/20">
                14 jours d&apos;essai gratuit · Pas de carte bancaire requise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] py-24 sm:py-32 px-5 overflow-hidden bg-[#0A0A0A]">
        <Grain />

        {/* Big glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 65%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-[12px] text-white/50">
            <Zap className="w-3 h-3 text-[#6366F1]" />
            Connectez votre CRM en 10 minutes
          </div>

          <h2
            className="text-[clamp(36px,6vw,72px)] font-extrabold text-white leading-[1.05] tracking-[-0.04em]"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Vos commerciaux savent.<br />
            <span className="text-white/25">Maintenant votre marketing aussi.</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A0A] font-semibold text-[14px] rounded-lg hover:bg-white/90 transition-colors"
            >
              Démarrer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 font-medium text-[14px] rounded-lg transition-colors"
            >
              Voir une démo
            </Link>
          </div>

          <p className="text-[12px] text-white/20">
            Pas de carte bancaire · 14 jours d&apos;essai · Support dédié
          </p>
        </div>
      </section>
    </>
  );
}
