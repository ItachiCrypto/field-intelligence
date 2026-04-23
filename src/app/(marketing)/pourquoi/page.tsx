import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle, Clock, TrendingDown, Zap, Users, CheckCircle,
  ArrowRight, Quote, Target, BarChart2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pourquoi Field Intelligence — L\'intelligence terrain que vos études ne capturent pas',
  description:
    'Vos commerciaux recueillent des centaines de signaux terrain chaque semaine. Sans Field Intelligence, 85% disparaissent dans des CR non lus.',
};

const PAIN_POINTS = [
  {
    icon: <Clock className="w-6 h-6" />,
    color: 'text-red-600 bg-red-50',
    title: 'L\'étude de marché est déjà périmée',
    desc: '6 à 12 mois pour produire. Les concurrents ont bougé, les prix ont changé, les besoins ont évolué. Vous briefez vos équipes avec des données d\'hier.',
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'text-amber-600 bg-amber-50',
    title: 'Le CR de visite ne remonte jamais',
    desc: 'Un commercial rédige 3 à 5 CR par semaine dans le CRM. Ces CR contiennent des signaux priceless sur les concurrents, les prix, les objections. Personne ne les lit.',
  },
  {
    icon: <TrendingDown className="w-6 h-6" />,
    color: 'text-[#6366F1] bg-[#EEF2FF]',
    title: 'Vos battlecards sont basées sur du vent',
    desc: 'Vous créez des contenus à partir de ce que vos concurrents affichent sur leur site. Pas de ce qu\'ils font sur le terrain. Le décalage se voit dans les taux de closing.',
  },
];

const STATS = [
  { value: '85%', label: 'des signaux terrain perdus', desc: 'Dans des CR non lus, des notes informelles, des réunions sans suivi.' },
  { value: '4 mois', label: 'de délai moyen', desc: 'Entre un signal terrain et son intégration dans la stratégie marketing.' },
  { value: '200+', label: 'signaux/mois', desc: 'Générés par une équipe de 15 commerciaux — qui disparaissent aujourd\'hui.' },
];

const TESTIMONIALS = [
  {
    quote: 'On avait des battlecards Salesforce basées sur ce qu\'ils communiquaient publiquement. Quand on a branché Field Intelligence sur nos CRs, on a découvert 3 offres bundle qu\'on ignorait complètement.',
    name: 'Directrice Marketing',
    company: 'Éditeur SaaS B2B, 80M€ ARR',
    initials: 'CM',
  },
  {
    quote: 'Notre process avant : réunion mensuelle avec les KAM, prise de notes, brief marketing. Field Intelligence l\'a remplacé par un dashboard qu\'on consulte chaque matin.',
    name: 'Responsable Product Marketing',
    company: 'Scale-up industrielle, 40 commerciaux',
    initials: 'LB',
  },
];

const HOW_DIFFERENT = [
  {
    aspect: 'Fraîcheur des données',
    before: 'Étude de marché : 6-12 mois',
    after: 'Signal terrain : en temps réel',
  },
  {
    aspect: 'Source',
    before: 'Sondages, panels, cabinets',
    after: 'Verbatims de vos propres RDV clients',
  },
  {
    aspect: 'Coût',
    before: '15 000€ à 80 000€ par étude',
    after: 'Abonnement mensuel fixe',
  },
  {
    aspect: 'Biais',
    before: 'Déclaratif, questions orientées',
    after: 'Comportemental, non sollicité',
  },
  {
    aspect: 'Couverture',
    before: 'Échantillon représentatif',
    after: '100% de vos RDV clients',
  },
  {
    aspect: 'Actionabilité',
    before: 'Rapport PDF + réunion de restitution',
    after: 'Dashboard filtrable, alertes temps réel',
  },
];

export default function PourquoiPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#111827] py-24 sm:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#3730A3]/40 border border-[#6366F1]/30 text-[#A5B4FC] text-sm font-medium">
            Pourquoi Field Intelligence
          </span>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
          >
            Vos commerciaux savent.
            <br />
            <span className="text-[#6366F1]">Votre marketing, non.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Chaque semaine, votre équipe terrain rencontre vos clients, entend vos concurrents, teste vos prix.
            Cette intelligence disparaît dans des CR que personne ne lit. Field Intelligence change ça.
          </p>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] leading-tight"
            >
              Le problème que personne ne résout vraiment
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Trois dysfonctionnements structurels qui coûtent cher — et qui sont tous liés au même angle mort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.color}`}>
                  {p.icon}
                </div>
                <h3
                  className="text-xl font-bold text-[#111827]"
                >
                  {p.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#EEF2FF] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STATS.map((s) => (
              <div key={s.value} className="text-center space-y-2">
                <div
                  className="text-5xl font-bold text-[#3730A3]"
                >
                  {s.value}
                </div>
                <div className="text-base font-semibold text-[#111827]">{s.label}</div>
                <div className="text-sm text-slate-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it's different */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] leading-tight"
            >
              Ce n'est pas une étude de marché améliorée
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              C'est une catégorie différente. L'intelligence terrain est continue, non sollicitée et ancrée dans votre propre portefeuille client.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
              <div className="p-4 text-sm font-semibold text-slate-500 uppercase tracking-wider"></div>
              <div className="p-4 text-sm font-semibold text-slate-500 border-l border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Étude de marché
              </div>
              <div className="p-4 text-sm font-semibold text-[#3730A3] border-l border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                Field Intelligence
              </div>
            </div>
            {HOW_DIFFERENT.map((row, i) => (
              <div key={row.aspect} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                <div className="p-4 text-sm font-medium text-slate-700 border-r border-slate-200">
                  {row.aspect}
                </div>
                <div className="p-4 text-sm text-slate-500 border-r border-slate-200">
                  {row.before}
                </div>
                <div className="p-4 text-sm font-medium text-[#059669]">
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#F9FAFB] py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2
            className="text-3xl font-bold text-[#111827] text-center"
          >
            Ce qu'en disent nos clients
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
                <Quote className="w-8 h-8 text-[#6366F1]/30" />
                <p className="text-slate-700 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-[#3730A3] flex items-center justify-center text-white text-sm font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] leading-tight"
            >
              Pour qui ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-6 h-6" />,
                role: 'Équipes Marketing B2B',
                desc: 'Product marketing, content, stratégie go-to-market. Field Intelligence remplace vos études de marché et alimente vos battlecards en continu.',
                items: ['Battlecards temps réel', 'Brief product fondé sur le terrain', 'Insights pour vos contenus'],
              },
              {
                icon: <BarChart2 className="w-6 h-6" />,
                role: 'Direction Commerciale',
                desc: 'Territoire, priorisation, performance. Une vue consolidée de ce qui se passe chez vos clients sans attendre le point mensuel.',
                items: ['Score de risque par compte', 'Zones à sécuriser en priorité', 'Patterns de perte / gain'],
              },
              {
                icon: <Users className="w-6 h-6" />,
                role: 'Key Account Managers',
                desc: 'Préparer chaque RDV avec l\'intelligence de tous les RDV précédents sur ce compte ou ce secteur.',
                items: ['Historique signaux par compte', 'Alertes sur les comptes à risque', 'Contexte concurrentiel ciblé'],
              },
            ].map((item) => (
              <div key={item.role} className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center">
                  {item.icon}
                </div>
                <h3
                  className="text-xl font-bold text-[#111827]"
                >
                  {item.role}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5">
                  {item.items.map((it) => (
                    <li key={it} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0" />
                      {it}
                    </li>
                  ))}
                </ul>
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
            Commencez par brancher votre CRM.
            <br />
            Le reste suit automatiquement.
          </h2>
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
