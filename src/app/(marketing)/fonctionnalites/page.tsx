import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sword, DollarSign, Package, BarChart2, TrendingUp, Map,
  MessageSquare, Target, Users, Zap, ArrowRight, CheckCircle,
  Eye, Bell, RefreshCw, Filter, Download, Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fonctionnalités — Field Intelligence',
  description:
    'Radar concurrentiel, analyse prix, besoins clients, deals gagnés/perdus, cartographie terrain — toutes les fonctionnalités de Field Intelligence.',
};

function SectionTitle({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`text-3xl sm:text-4xl font-bold text-[#111827] leading-tight ${center ? 'text-center' : ''}`}
    >
      {children}
    </h2>
  );
}

const MODULES = [
  {
    id: 'concurrent',
    icon: <Sword className="w-6 h-6" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    accentColor: '#6366F1',
    title: 'Radar Concurrentiel',
    tagline: 'Qui est actif, où, avec quoi',
    description:
      'Chaque mention d\'un concurrent dans un CR de visite est capturée, classifiée et agrégée. Vous obtenez une vue en temps réel de la pression concurrentielle chez vos clients — par concurrent, par région, par type de mention.',
    features: [
      'Détection automatique des noms de concurrents dans les verbatims terrain',
      'Classification par type : prix, bundle, relation, argument technique, démo…',
      'Timeline de présence par concurrent et par compte client',
      'Score de risque par compte (actif + convainçant vs. actif + rejeté)',
      'Alertes automatiques quand un concurrent est signalé plusieurs fois sur une zone',
    ],
    kpi: '12 concurrents détectés en moyenne par équipe de 15',
  },
  {
    id: 'prix',
    icon: <DollarSign className="w-6 h-6" />,
    color: 'text-amber-600 bg-amber-50',
    accentColor: '#D97706',
    title: 'Radar Prix',
    tagline: 'L\'écart réel, pas l\'affiché',
    description:
      'Les prix que vos concurrents proposent réellement chez vos clients sont rarement ceux de leurs grilles tarifaires. Field Intelligence extrait les fourchettes de prix mentionnées dans les CR — avec le contexte (qui, à qui, dans quelle situation) qui rend la donnée actionnable.',
    features: [
      'Extraction des fourchettes de prix et remises mentionnées',
      'Mapping par concurrent et par segment client',
      'Identification des seuils de résistance prix côté client',
      'Détection des écarts entre votre positionnement et la perception terrain',
      'Évolution temporelle : la pression prix augmente-t-elle ?',
    ],
    kpi: 'Écarts de −8% à −22% détectés vs. grilles affichées',
  },
  {
    id: 'offres',
    icon: <Package className="w-6 h-6" />,
    color: 'text-red-600 bg-red-50',
    accentColor: '#DC2626',
    title: 'Offres Concurrentes',
    tagline: 'Ce qu\'ils font vraiment sur le terrain',
    description:
      'Bundles, périodes d\'essai, conditions spéciales, partenariats — tout ce que vos concurrents proposent en rendez-vous et qui n\'apparaît nulle part dans leur communication publique. Détecté, structuré, mise à disposition de vos équipes product et marketing.',
    features: [
      'Détection des bundles, offres combinées, essais gratuits',
      'Identification des partenariats commerciaux mentionnés',
      'Extraction des durées d\'engagement et conditions spéciales',
      'Impact des offres sur vos deals : corrélation avec les pertes',
      'Alertes sur les nouvelles offres détectées',
    ],
    kpi: '3 bundles actifs détectés avant diffusion publique en moyenne',
  },
  {
    id: 'besoins',
    icon: <BarChart2 className="w-6 h-6" />,
    color: 'text-[#059669] bg-emerald-50',
    accentColor: '#059669',
    title: 'Baromètre des Besoins',
    tagline: 'Les vrais besoins, avec les vrais mots',
    description:
      'Ce que vos clients demandent cette semaine sur le terrain — pas dans une étude de satisfaction réalisée 3 mois après. Avec les formulations exactes qu\'ils utilisent. Pour alimenter votre content marketing, vos battlecards et vos roadmaps avec ce qui est réellement prioritaire.',
    features: [
      'Extraction et classification des besoins exprimés dans les CR',
      'Comptage des occurrences par besoin, par région, par secteur',
      'Détection des besoins émergents (fréquence en hausse)',
      'Cartographie des besoins par segment client',
      'Intégration des verbatims exacts pour vos contenus',
    ],
    kpi: '7 nouveaux besoins détectés par mois en moyenne',
  },
  {
    id: 'deals',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    accentColor: '#6366F1',
    title: 'Deals Gagnés / Perdus',
    tagline: 'Pourquoi vous gagnez et pourquoi vous perdez',
    description:
      'Les bilans post-deal biaisés par le commercial (ou la honte de perdre) sont remplacés par une analyse des CR de visite réels. Field Intelligence identifie les patterns de victoire et de défaite depuis les comptes rendus — avant même que le deal soit clôturé.',
    features: [
      'Motifs de perte extraits des CR (prix, produit, relation, timing, concurrent…)',
      'Motifs de gain identifiés et quantifiés',
      'Analyse des patterns par commercial, par région, par segment',
      'Alerte early warning : signaux de perte précoce sur un deal',
      'Benchmark de performance par commercial avec les verbatims',
    ],
    kpi: '+18% de taux de closing identifié après correction des patterns',
  },
  {
    id: 'geo',
    icon: <Map className="w-6 h-6" />,
    color: 'text-teal-600 bg-teal-50',
    accentColor: '#0D9488',
    title: 'Cartographie Terrain',
    tagline: 'La carte de chaleur de votre marché',
    description:
      'Une vue géographique et sectorielle de la pression concurrentielle, des besoins, des scores de risque de portefeuille. Pour prioriser les zones à défendre, cibler les campagnes, allouer les ressources commerciales.',
    features: [
      'Heatmap de pression concurrentielle par région',
      'Score de risque du portefeuille par territoire',
      'Croisement géo × secteur × concurrent',
      'Évolution trimestrielle de la dynamique par zone',
      'Export pour vos outils de planification commerciale',
    ],
    kpi: '3 zones critiques identifiées et sécurisées Q1',
  },
];

const PLATFORM_FEATURES = [
  { icon: <RefreshCw className="w-5 h-5" />, label: 'Sync CRM automatique', desc: 'Les CR sont analysés dès leur création dans votre CRM.' },
  { icon: <Bell className="w-5 h-5" />, label: 'Alertes intelligentes', desc: 'Notifié quand un signal critique dépasse le seuil défini.' },
  { icon: <Filter className="w-5 h-5" />, label: 'Filtres avancés', desc: 'Période, région, commercial, concurrent, secteur, type.' },
  { icon: <Eye className="w-5 h-5" />, label: 'Vues par rôle', desc: 'Marketing, KAM, DirCo — chacun voit ce qui le concerne.' },
  { icon: <Download className="w-5 h-5" />, label: 'Export & rapports', desc: 'CSV, PDF, ou connexion directe à votre BI.' },
  { icon: <Globe className="w-5 h-5" />, label: 'Hébergé en Europe', desc: 'RGPD natif, données sur serveurs français.' },
];

export default function FonctionnalitesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#111827] py-24 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#3730A3]/40 border border-[#6366F1]/30 text-[#A5B4FC] text-sm font-medium">
            Fonctionnalités
          </span>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
          >
            Six modules.
            <br />
            <span className="text-[#6366F1]">Une seule source de vérité.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Field Intelligence transforme chaque CR de visite en données structurées, agrégées et visualisées.
            Voici ce que vos équipes peuvent faire avec.
          </p>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto space-y-24">
          {MODULES.map((mod, i) => (
            <div
              key={mod.id}
              id={mod.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              {/* Text side */}
              <div className={`space-y-6 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                    {mod.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{mod.tagline}</p>
                    <h3
                      className="text-2xl font-bold text-[#111827]"
                    >
                      {mod.title}
                    </h3>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed">{mod.description}</p>

                <ul className="space-y-2.5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual side */}
              <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="rounded-2xl bg-[#F9FAFB] border border-slate-200 p-8 space-y-6">
                  {/* Simulated chart/metric card */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">{mod.title}</span>
                    <span className="text-xs text-slate-400">Derniers 30 jours</span>
                  </div>

                  {/* Bar chart simulation */}
                  <div className="space-y-3">
                    {['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'].map((label, wi) => {
                      const widths = [45, 62, 78, 91];
                      return (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{label}</span>
                            <span style={{ color: mod.accentColor }}>{widths[wi]}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${widths[wi]}%`, backgroundColor: mod.accentColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* KPI */}
                  <div className="rounded-xl border p-4" style={{ borderColor: `${mod.accentColor}30`, backgroundColor: `${mod.accentColor}08` }}>
                    <p className="text-xs text-slate-500 mb-1">Résultat terrain observé</p>
                    <p className="text-sm font-semibold" style={{ color: mod.accentColor }}>{mod.kpi}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform capabilities */}
      <section className="bg-[#F9FAFB] py-20 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionTitle center>Conçu pour s'intégrer à votre stack</SectionTitle>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Des fonctionnalités plateforme qui rendent Field Intelligence opérationnel en quelques heures, pas en quelques mois.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.label} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center">
                  {f.icon}
                </div>
                <h4 className="font-semibold text-[#111827]">{f.label}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3730A3] py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2
            className="text-3xl sm:text-4xl font-bold text-white leading-tight"
          >
            Prêt à voir ces modules sur vos données ?
          </h2>
          <p className="text-lg text-[#A5B4FC]">
            Connectez votre CRM. Vos premiers signaux apparaissent en moins de 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-[#3730A3] font-semibold text-base hover:bg-[#EEF2FF] transition-colors"
            >
              Réserver une démo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/comment"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Comment ça marche
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
