import Link from 'next/link';
import {
  Sword, DollarSign, Package, BarChart2, TrendingUp, Map,
  CheckCircle, XCircle, ArrowRight, Zap, Shield, Clock,
} from 'lucide-react';
import { HeroAnimation } from '@/components/marketing/hero-animation';
import { RoiSimulator } from '@/components/marketing/roi-simulator';
import { CrmLogos } from '@/components/marketing/crm-logos';

/* ── Reusable heading style ─────────────────────────────── */
function SectionTitle({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`text-3xl sm:text-4xl font-bold text-[#111827] leading-tight ${center ? 'text-center' : ''}`}
      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
    >
      {children}
    </h2>
  );
}

/* ── Features grid data ─────────────────────────────────── */
const FEATURES = [
  {
    icon: <Sword className="w-5 h-5" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    title: 'Radar Concurrentiel',
    desc: 'Qui est actif chez vos clients, dans quelles régions, avec quel argument. En temps réel — pas dans 6 semaines.',
    stat: '12 concurrents détectés',
    statColor: 'text-[#6366F1]',
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-50',
    title: 'Radar Prix',
    desc: 'L\'écart de prix réel perçu sur le terrain par concurrent. Les seuils de résistance réels de vos clients. Pas des suppositions.',
    stat: '−15% écart détecté vs. Acme',
    statColor: 'text-amber-600',
  },
  {
    icon: <Package className="w-5 h-5" />,
    color: 'text-red-600 bg-red-50',
    title: 'Offres Concurrentes',
    desc: 'Chaque bundle, promo, essai gratuit ou condition spéciale détecté en rendez-vous. Avec son impact mesuré sur vos deals.',
    stat: '3 bundles actifs repérés',
    statColor: 'text-red-600',
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    color: 'text-[#059669] bg-emerald-50',
    title: 'Baromètre des Besoins',
    desc: 'Les vrais besoins de vos clients cette semaine — pas ceux d\'une étude de 3 mois. Avec les mots exacts qu\'ils utilisent.',
    stat: '7 besoins émergents',
    statColor: 'text-[#059669]',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    title: 'Deals Gagnés / Perdus',
    desc: 'Pourquoi vous gagnez et pourquoi vous perdez — extrait des verbatims terrain, pas des déclarations biaisées post-deal.',
    stat: '68% taux de closing',
    statColor: 'text-[#6366F1]',
  },
  {
    icon: <Map className="w-5 h-5" />,
    color: 'text-teal-600 bg-teal-50',
    title: 'Analyse Géographique',
    desc: 'Carte de chaleur de la pression concurrentielle et des besoins clients par région et par secteur.',
    stat: 'IDF : zone critique',
    statColor: 'text-teal-600',
  },
];

/* ── Before/After data ──────────────────────────────────── */
const BEFORE = [
  'Vous découvrez qu\'un concurrent est actif chez vos clients… dans leur communiqué de presse',
  'Vos battlecards sont basées sur ce qu\'ils affichent sur leur site — pas sur ce qu\'ils font vraiment',
  'Vous créez des contenus avec votre vocabulaire — pas celui de vos clients',
  'Votre brief produit s\'appuie sur une étude de marché vieille de 6 mois',
  'Vous ne savez pas pourquoi vous perdez des deals sur le pricing',
  'Vous sollicitez les commerciaux pour avoir des retours terrain — et ils n\'ont pas le temps',
];

const AFTER = [
  'Alerte en temps réel dès qu\'un concurrent est mentionné dans un CR terrain',
  'Battlecards générées automatiquement depuis les verbatims clients réels',
  'Nuage de mots du vrai vocabulaire de vos clients — extrait des CR cette semaine',
  'Baromètre des besoins mis à jour en continu depuis 50 CR par semaine',
  'Analyse des motifs de perte avec valeur CA et tendance mensuelle',
  '0 sollicitation des commerciaux — l\'intelligence vient à vous automatiquement',
];

/* ── Testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote:
      'J\'ai découvert qu\'Acme était actif chez 8 de nos clients depuis 6 semaines. Mes commerciaux le savaient. Personne ne me l\'avait dit. Field Intelligence me l\'a dit le lendemain de l\'installation.',
    name: 'Sophie L.',
    role: 'Directrice Marketing',
    company: 'Industrie agroalimentaire',
    initial: 'SL',
    color: 'bg-[#3730A3]',
  },
  {
    quote:
      'Pour la première fois, j\'ai pu présenter au comité de direction une analyse concurrentielle basée sur ce que nos clients disent vraiment — pas sur ce que les concurrents communiquent.',
    name: 'Marc D.',
    role: 'Chef de Produit',
    company: 'Services B2B',
    initial: 'MD',
    color: 'bg-[#059669]',
  },
  {
    quote:
      'Le nuage de mots des besoins clients a complètement changé notre façon d\'écrire nos contenus. On utilisait notre vocabulaire. Pas le leur.',
    name: 'Julie R.',
    role: 'Responsable Marketing',
    company: 'Pharma',
    initial: 'JR',
    color: 'bg-amber-500',
  },
];

/* ─────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0F0F1A] pt-16">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(to right, #6366F1 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3730A3]/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6366F1]/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#A5B4FC] text-sm font-medium">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            Intelligence terrain en temps réel
          </div>

          {/* H1 */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] max-w-4xl"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Votre marketing mérite mieux que la{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#A5B4FC]">
              veille web.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Vos commerciaux entendent chaque jour ce que vos clients pensent vraiment de vos concurrents,
            de vos prix, de vos offres. Field Intelligence capte ces conversations et les transforme
            en intelligence marché pour votre équipe — automatiquement, en temps réel.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/40 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              Voir l&apos;outil en action
            </Link>
            <Link
              href="#roi"
              className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Calculer ce que vous perdez chaque semaine
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Hero animation */}
          <div className="w-full mt-4">
            <HeroAnimation />
          </div>
        </div>

        {/* CRM trust band */}
        <div className="relative z-10 w-full border-t border-slate-800/60 bg-slate-900/40 backdrop-blur-sm py-6">
          <p className="text-center text-xs text-slate-500 mb-4 uppercase tracking-widest font-medium">
            Compatible avec tous vos CRM
          </p>
          <CrmLogos />
        </div>
      </section>

      {/* ── PROBLÈME ─────────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <SectionTitle center>
              Votre marketing travaille avec des données qui ont{' '}
              <span className="text-red-600">6 semaines de retard.</span>
            </SectionTitle>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Pendant ce temps, vos commerciaux savent tout. Et cette information reste dans des CR
              que personne ne lit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🔴',
                title: 'Concurrence',
                heading: 'Vous apprenez les mouvements concurrents trop tard',
                desc: 'Un concurrent est actif chez 12 de vos clients depuis 3 mois. Vos études de marché vous le diront dans 6 mois. Vos commerciaux le savent depuis hier.',
              },
              {
                icon: '🔴',
                title: 'Besoins',
                heading: 'Vos contenus ne parlent pas le langage de vos clients',
                desc: 'Vous créez des campagnes avec les mots de votre service marketing. Vos clients utilisent des termes complètement différents pour décrire leurs problèmes.',
              },
              {
                icon: '🔴',
                title: 'Décisions',
                heading: 'Vos décisions marketing reposent sur des hypothèses',
                desc: 'Pricing, positionnement, roadmap produit — vous décidez sur des études trimestrielles pendant que le terrain change chaque semaine.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-red-100 bg-red-50/40 p-6 space-y-3 hover:border-red-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    {item.title}
                  </span>
                </div>
                <h3
                  className="text-base font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {item.heading}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ─────────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <SectionTitle center>
              Field Intelligence transforme chaque CR en intelligence marché.{' '}
              <span className="text-[#6366F1]">Automatiquement.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
            {/* Connecting line (hidden on mobile) */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-[#6366F1]/40 to-[#6366F1]/40 z-0" />

            {[
              {
                step: '01',
                icon: '📝',
                title: 'La source',
                desc: 'Votre commercial rédige son CR dans son CRM habituel. Il ne change rien. Il ne sait même pas que Field Intelligence tourne.',
                detail: 'Champ texte CRM',
              },
              {
                step: '02',
                icon: '🧠',
                title: 'L\'analyse',
                desc: 'Notre IA lit chaque CR, détecte les signaux concurrentiels, prix, besoins et tendances, et les catégorise en temps réel.',
                detail: 'CONCURRENT · PRIX · OFFRE · BESOIN',
              },
              {
                step: '03',
                icon: '📊',
                title: 'L\'intelligence',
                desc: 'Chaque signal arrive dans votre interface Field Intelligence — trié, priorisé, visualisé. Prêt à actionner.',
                detail: 'Dashboard marketing',
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative z-10 flex flex-col items-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#6366F1]/20 shadow-sm flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-[#6366F1] uppercase tracking-widest">
                  Étape {item.step}
                </div>
                <h3
                  className="text-xl font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{item.desc}</p>
                <div className="px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-xs font-mono text-[#3730A3] font-medium">
                  {item.detail}
                </div>
                {idx < 2 && (
                  <div className="md:hidden text-2xl text-[#6366F1]/40">↓</div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 bg-white rounded-xl border border-slate-200 py-3 px-6 inline-flex items-center gap-3 mx-auto block max-w-xl">
            <CheckCircle className="w-4 h-4 text-[#059669] shrink-0" />
            Zéro action requise de vos commerciaux · Zéro intégration complexe · Zéro formation
          </p>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <SectionTitle center>
              Tout ce que votre marketing cherchait sans jamais pouvoir le trouver.
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 space-y-4 hover:border-[#6366F1]/30 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                    {f.icon}
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${f.statColor}`}>
                    {f.stat}
                  </span>
                </div>
                <h3
                  className="text-base font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                <div className="pt-2 border-t border-slate-100">
                  <Link
                    href="/fonctionnalites"
                    className={`text-xs font-semibold flex items-center gap-1 ${f.statColor} hover:gap-2 transition-all`}
                  >
                    Voir en détail <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANT / APRÈS ────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <SectionTitle center>
              Ce que votre marketing fait aujourd&apos;hui.{' '}
              <span className="text-[#6366F1]">Ce qu&apos;il fera avec Field Intelligence.</span>
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sans */}
            <div className="rounded-2xl border border-red-200 bg-red-50/30 overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span
                  className="font-bold text-red-700 text-sm"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  SANS Field Intelligence
                </span>
              </div>
              <div className="p-6 space-y-3">
                {BEFORE.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avec */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#059669]" />
                <span
                  className="font-bold text-emerald-700 text-sm"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  AVEC Field Intelligence
                </span>
              </div>
              <div className="p-6 space-y-3">
                {AFTER.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI SIMULATOR ────────────────────────────────────── */}
      <section id="roi" className="bg-white py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <SectionTitle center>
              Combien perdez-vous chaque semaine en informations non captées ?
            </SectionTitle>
            <p className="text-slate-500">
              Ajustez les paramètres selon votre équipe pour calculer votre potentiel
            </p>
          </div>
          <RoiSimulator />
          <div className="text-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 text-[#6366F1] font-semibold hover:gap-3 transition-all"
            >
              Voir comment récupérer cette intelligence
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-[#F9FAFB] py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center">
            <SectionTitle center>
              Ce que les responsables marketing disent après 30 jours.
            </SectionTitle>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-3xl text-[#6366F1]/30 font-serif leading-none">&ldquo;</div>
                <p className="text-sm text-slate-700 leading-relaxed italic">{t.quote}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div
                    className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRM COMPATIBILITY ────────────────────────────────── */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <SectionTitle center>
              Votre CRM reste intact. Field Intelligence se connecte en{' '}
              <span className="text-[#6366F1]">20 minutes.</span>
            </SectionTitle>
          </div>

          <CrmLogos />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              {
                icon: <Shield className="w-5 h-5" />,
                text: 'Connexion en lecture seule — vos données restent dans votre CRM',
              },
              {
                icon: <Zap className="w-5 h-5" />,
                text: 'Aucun logiciel à installer sur les postes des commerciaux',
              },
              {
                icon: <Clock className="w-5 h-5" />,
                text: 'Validation DSI non requise dans 80% des cas',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[#F9FAFB] border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#F9FAFB] py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <SectionTitle center>
              Un seul accès. Un seul prix. Jusqu&apos;à 3 utilisateurs inclus.
            </SectionTitle>
          </div>

          {/* Pricing card */}
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#3730A3] blur-sm opacity-30" />
            <div className="relative bg-white rounded-2xl border-2 border-[#6366F1]/20 shadow-xl overflow-hidden">
              {/* Top banner */}
              <div className="bg-gradient-to-r from-[#3730A3] to-[#6366F1] px-8 py-5 text-center">
                <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">
                  ACCÈS MARKETING
                </div>
                <div
                  className="text-5xl font-extrabold text-white"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  199€
                  <span className="text-xl font-normal text-indigo-200">/mois</span>
                </div>
                <p className="text-indigo-200 text-sm mt-1">jusqu&apos;à 3 utilisateurs</p>
              </div>

              {/* Features */}
              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Dashboard temps réel',
                  'Radar Concurrentiel',
                  'Radar Prix & Offres',
                  'Baromètre des Besoins',
                  'Deals Gagnés / Perdus',
                  'Analyse Géographique',
                  'Sentiment Client',
                  'Vocabulaire Client',
                  'Battlecards automatiques',
                  'Compatible tous CRM',
                  'Onboarding inclus',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-8 pb-8 space-y-4">
                <Link
                  href="/auth/signup"
                  className="block w-full py-4 bg-[#3730A3] hover:bg-[#6366F1] text-white font-bold text-base text-center rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                  style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                >
                  Démarrer 30 jours gratuits
                </Link>
                <p className="text-center text-xs text-slate-400">
                  Sans engagement · Sans carte bancaire pour le pilote · Annulation en 1 clic
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400">
            Bientôt disponibles :{' '}
            <span className="text-slate-600 font-medium">
              Accès KAM et Accès Direction Commerciale
            </span>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="bg-[#1E1B4B] py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3730A3]/40 via-transparent to-[#6366F1]/20 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, #6366F1 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            La prochaine information critique sur votre marché est en train d&apos;être écrite dans
            un CR que personne ne lira.
          </h2>

          <p className="text-xl text-indigo-300 font-medium">
            Sauf si vous avez Field Intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#3730A3] font-bold text-base rounded-xl hover:bg-[#F9FAFB] transition-all shadow-2xl shadow-indigo-950/50 hover:scale-105"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              <Zap className="w-5 h-5" />
              Démarrer mon pilote gratuit 30 jours
            </Link>
            <Link
              href="/demo"
              className="text-indigo-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Réserver une démo personnalisée
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
