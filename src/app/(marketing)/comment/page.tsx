import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Plug, Cpu, BarChart2, ArrowRight, CheckCircle,
  Clock, Shield, Zap, HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Comment ça marche — Field Intelligence',
  description:
    'Connectez votre CRM en 10 minutes, laissez l\'IA analyser vos CR, consultez vos dashboards. Trois étapes, zéro friction.',
};

const STEPS = [
  {
    num: '01',
    icon: <Plug className="w-7 h-7" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    title: 'Connectez votre CRM',
    desc: 'Une connexion OAuth sécurisée en lecture seule. Aucune installation, aucun changement de process pour vos commerciaux.',
    details: [
      'Connexion OAuth en lecture seule (vos données restent dans votre CRM)',
      'Compatibilité native Salesforce, HubSpot, Pipedrive, Dynamics, Zoho…',
      'Paramétrage des objets à synchroniser (Tasks, Events, Notes…)',
      'Première synchronisation : 2 ans d\'historique analysés',
      'Temps d\'installation : moins de 10 minutes',
    ],
    duration: '10 min',
    durationLabel: 'pour connecter',
  },
  {
    num: '02',
    icon: <Cpu className="w-7 h-7" />,
    color: 'text-[#059669] bg-emerald-50',
    title: 'L\'IA analyse vos CR',
    desc: 'Chaque compte rendu de visite est lu par notre modèle d\'IA spécialisé, entraîné à extraire les signaux intelligence terrain avec une précision chirurgicale.',
    details: [
      'Détection des mentions de concurrents (nom, offre, argument)',
      'Extraction des signaux prix (fourchettes, remises, conditions)',
      'Classification des besoins exprimés par les clients',
      'Identification des motifs de gain et de perte',
      'Géolocalisation automatique par région commerciale',
    ],
    duration: '< 24h',
    durationLabel: 'pour l\'historique complet',
  },
  {
    num: '03',
    icon: <BarChart2 className="w-7 h-7" />,
    color: 'text-[#3730A3] bg-[#EEF2FF]',
    title: 'Consultez vos dashboards',
    desc: 'Vos équipes marketing, KAM et direction consultent leur vue dédiée. Les signaux s\'accumulent, les tendances émergent, les alertes vous préviennent en temps réel.',
    details: [
      'Dashboard Marketing : radar concurrent, prix, besoins, offres',
      'Dashboard KAM : portefeuille, comptes à risque, insights par client',
      'Dashboard DirCo : deals, territoire, performance équipe, priorités',
      'Filtres : période, région, commercial, secteur, concurrent',
      'Alertes configurables sur les signaux critiques',
    ],
    duration: 'Temps réel',
    durationLabel: 'dès le 1er CR synchronisé',
  },
];

const FAQ = [
  {
    q: 'Mes commerciaux doivent-ils changer leurs habitudes ?',
    a: 'Non. Field Intelligence se branche sur vos CR existants dans votre CRM. Vos commerciaux continuent de rédiger comme avant. Aucune formation, aucun nouveau champ à remplir.',
  },
  {
    q: 'Que se passe-t-il si un CR est mal rédigé ou trop court ?',
    a: 'Notre modèle est entraîné sur des CR de qualité variable. Il extrait ce qui peut être extrait, et ignore ce qui n\'est pas utilisable. Les CR vides ou trop courts sont simplement ignorés sans erreur.',
  },
  {
    q: 'Comment accède Field Intelligence à mon CRM ?',
    a: 'Via une connexion OAuth standard en lecture seule. Field Intelligence n\'écrit jamais dans votre CRM. Vos données sont lues, analysées et stockées dans notre infrastructure hébergée en Europe.',
  },
  {
    q: 'Combien de temps pour voir les premiers insights ?',
    a: 'Avec 2 ans d\'historique, vous avez vos premiers insights dans les 24h suivant la connexion. Pour les nouveaux CR, le délai est de quelques minutes.',
  },
  {
    q: 'Puis-je contrôler quels CR sont analysés ?',
    a: 'Oui. Vous paramétrez les objets, les types d\'activités, les équipes et les périodes à synchroniser. Vous pouvez exclure certains types de CR ou certains commerciaux.',
  },
  {
    q: 'Field Intelligence est-il conforme RGPD ?',
    a: 'Oui. Hébergement sur serveurs français, DPA disponible, données isolées par entreprise, connexion CRM en lecture seule. Nous ne revendons jamais vos données.',
  },
];

const SECURITY = [
  { icon: <Shield className="w-5 h-5" />, label: 'Lecture seule', desc: 'Accès CRM en lecture uniquement' },
  { icon: <Shield className="w-5 h-5" />, label: 'Hébergement Europe', desc: 'Serveurs en France, RGPD natif' },
  { icon: <Shield className="w-5 h-5" />, label: 'Isolation des données', desc: 'Vos données, pour vous seul' },
  { icon: <Clock className="w-5 h-5" />, label: 'SLA 99.9%', desc: 'Uptime garanti contractuellement' },
];

export default function CommentPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#111827] py-24 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#3730A3]/40 border border-[#6366F1]/30 text-[#A5B4FC] text-sm font-medium">
            Comment ça marche
          </span>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Opérationnel en
            <br />
            <span className="text-[#6366F1]">moins d'une heure.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Trois étapes. Zéro changement pour vos commerciaux. Vos premiers insights dans les 24 heures.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto space-y-20">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${i % 2 === 1 ? '' : ''}`}
            >
              {/* Left / Text */}
              <div className={`space-y-6 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                <div className="flex items-start gap-4">
                  <div
                    className="text-5xl font-bold text-slate-100 leading-none flex-shrink-0"
                    style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                  >
                    {step.num}
                  </div>
                  <div className="space-y-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step.color}`}>
                      {step.icon}
                    </div>
                    <h3
                      className="text-2xl font-bold text-[#111827]"
                      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>

                <ul className="space-y-2.5 pl-16">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right / Card */}
              <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div className="rounded-2xl bg-[#F9FAFB] border border-slate-200 p-8 space-y-6">
                  {/* Step visual */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.color} text-2xl font-bold`} style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
                      {step.num}
                    </div>
                    <div>
                      <div
                        className="text-xl font-bold text-[#111827]"
                        style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                      >
                        {step.duration}
                      </div>
                      <div className="text-sm text-slate-500">{step.durationLabel}</div>
                    </div>
                  </div>

                  {/* Progress bar simulation */}
                  <div className="space-y-3">
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${[40, 75, 100][i]}%`,
                          backgroundColor: i === 0 ? '#6366F1' : i === 1 ? '#059669' : '#3730A3',
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {i === 0 && 'Connexion CRM initialisée — en attente de première synchronisation'}
                      {i === 1 && '152 CR analysés sur 203 — traitement en cours'}
                      {i === 2 && 'Synchronisation complète — 203 CR analysés, 1 847 signaux extraits'}
                    </p>
                  </div>

                  {/* Fake terminal/output */}
                  {i === 1 && (
                    <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs space-y-1.5">
                      <p className="text-green-400">✓ 12 mentions concurrentes détectées</p>
                      <p className="text-amber-400">⚡ 3 offres bundle nouvelles identifiées</p>
                      <p className="text-[#A5B4FC]">📊 47 besoins clients extraits et classifiés</p>
                      <p className="text-slate-500">→ Agrégation des données en cours…</p>
                    </div>
                  )}

                  {i === 2 && (
                    <div className="space-y-2">
                      {[
                        { label: 'Radar Concurrent', value: '12 actifs', color: '#6366F1' },
                        { label: 'Signaux Prix', value: '−8% à −22%', color: '#D97706' },
                        { label: 'Besoins Clients', value: '47 identifiés', color: '#059669' },
                      ].map((kpi) => (
                        <div key={kpi.label} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{kpi.label}</span>
                          <span className="font-semibold" style={{ color: kpi.color }}>{kpi.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Security strip */}
      <section className="bg-[#F9FAFB] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {SECURITY.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#111827]">{s.label}</div>
                  <div className="text-xs text-slate-500">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2
              className="text-3xl font-bold text-[#111827]"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
                  <h4
                    className="font-semibold text-[#111827]"
                    style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                  >
                    {item.q}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pl-8">{item.a}</p>
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
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Prêt à démarrer en 10 minutes ?
          </h2>
          <p className="text-lg text-[#A5B4FC]">
            Réservez une démo — on connecte votre CRM ensemble et vous voyez vos premiers signaux en live.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#3730A3] font-semibold text-base hover:bg-[#EEF2FF] transition-colors"
          >
            Réserver une démo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
