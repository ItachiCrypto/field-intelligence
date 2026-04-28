import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Users,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

export const metadata = {
  title: 'Guide — Rédiger un compte rendu optimal | Field Intelligence',
  description:
    "Comment écrire des comptes rendus de visite que l'IA peut interpréter avec précision : structure, mots-clés, exemples avant/après.",
};

const SECTIONS = [
  {
    num: '01',
    icon: Target,
    title: 'Le client, en clair',
    desc: 'Mentionnez le nom exact du client (pharmacie, entreprise, contact) tel qu\'il apparaît dans votre CRM. Évitez les surnoms internes ("la grosse pharma de Lyon"). L\'IA fait le rapprochement avec votre base accounts.',
    good: 'RDV avec Pharmacie du Centre — Marie Lambert (titulaire). Lyon 3e.',
    bad: 'RDV avec la cliente d\'hier, celle qu\'on connaît bien.',
  },
  {
    num: '02',
    icon: Users,
    title: 'Les concurrents, par nom',
    desc: "Citez les concurrents tels qu'ils apparaissent dans votre marché. Les mentions floues (\"un autre acteur\") ne déclenchent pas de signal de veille concurrentielle.",
    good: 'Travaille actuellement avec Abbott et Dexcom. Ypsomed perdu en 2025.',
    bad: 'Elle bosse avec un autre fournisseur, je sais plus lequel.',
  },
  {
    num: '03',
    icon: TrendingUp,
    title: 'Les chiffres, en chiffres',
    desc: "PDM, rotations, écarts de prix, volumes : donnez-les sous forme numérique. Une fourchette précise vaut mieux qu'un adjectif (\"beaucoup\", \"un peu\").",
    good: 'PDM 68%. Rotation B7 : 90 / K7 : 35 / L7 : 85. Écart prix vs Acme : −15%.',
    bad: 'Bonne PDM, rotation correcte, prix concurrentiel.',
  },
  {
    num: '04',
    icon: ShieldAlert,
    title: 'Les signaux faibles',
    desc: "Notez les phrases qui sortent de l'ordinaire : un client qui hésite, un concurrent qui revient, une remise inhabituelle. Ces verbatims alimentent les alertes.",
    good: '"Si vous bougez pas sur le prix, je passe chez Acme dans 2 mois." — verbatim direct.',
    bad: 'Le client n\'est pas content, ça pourrait basculer.',
  },
  {
    num: '05',
    icon: Sparkles,
    title: 'Les objectifs et leur résultat',
    desc: "Indiquez explicitement si l'objectif est atteint ou raté, et pourquoi. C'est ce qui nourrit l'analyse deals gagnés / perdus et la cartographie des causes.",
    good: 'Objectif AF → Atteint (+20). Objectif tests → Non atteint, cause : surstock 2025.',
    bad: 'Plutôt bonne visite, on verra le mois prochain.',
  },
  {
    num: '06',
    icon: Lightbulb,
    title: 'Les prochaines actions',
    desc: 'Terminez chaque CR par les next steps concrets : date du prochain RDV, mail à envoyer, animation à caler. L\'IA en extrait des recommandations exploitables.',
    good: 'Next rdv le 14/05 à 10h30. Envoyer argumentaire AF. Caler animation diabète semaine 22.',
    bad: 'À recontacter plus tard pour voir où ça en est.',
  },
];

const STRUCTURE = [
  { label: 'Client', desc: 'Nom exact + interlocuteur + lieu' },
  { label: 'Contexte', desc: 'PDM, potentiel, retours 2024/2025' },
  { label: 'Acteurs concurrents', desc: 'Liste nominative + parts perçues' },
  { label: 'Rotations / volumes', desc: 'Chiffres bruts produit par produit' },
  { label: 'Verbatims clés', desc: 'Citations directes du client (entre guillemets)' },
  { label: 'Objectifs', desc: 'Atteint / non atteint + cause ou facteur' },
  { label: 'Next steps', desc: 'Date prochaine action + livrable concret' },
];

const PITFALLS = [
  {
    bad: '"Bon RDV, bonne ambiance, on continue."',
    why: "Aucun signal, aucun chiffre, aucune action. L'IA ne génère rien.",
  },
  {
    bad: '"Le client envisage peut-être de regarder la concurrence."',
    why: "Trop conditionnel : pas de signal de risque déclenché. Préférez : « Risque de bascule chez X évoqué — délai 3 mois ».",
  },
  {
    bad: '"Voir mail."',
    why: "Le contenu doit être dans le CR, pas en pièce jointe. Sinon l'IA ne le voit jamais.",
  },
  {
    bad: '"Dirco a dit que…"',
    why: "Les abréviations non standard ne sont pas comprises. Définissez-les dans votre glossaire (Dirco = Directeur Commercial).",
  },
];

export default function GuideCrPage() {
  return (
    <div data-marketing className="bg-slate-50 min-h-screen">
      {/* Spacer for fixed nav */}
      <div className="h-14" />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-4">
            Guide pratique
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Rédiger un compte rendu que l&apos;IA comprend vraiment.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-6">
            Field Intelligence convertit chaque compte rendu de visite en signaux marketing
            exploitables — concurrents détectés, écarts prix, deals à risque, besoins
            émergents. La qualité de l&apos;analyse dépend directement de la qualité du CR.
            Voici comment écrire les vôtres pour que rien ne soit perdu.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> 7 minutes de lecture
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
              Pour commerciaux terrain & KAM
            </span>
          </div>
        </div>
      </section>

      {/* ── STRUCTURE TYPE ──────────────────────────────────── */}
      <section className="px-5 sm:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Structure recommandée
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Sept blocs à toujours faire apparaître.
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Pas besoin de remplir un formulaire rigide : ces blocs peuvent apparaître dans
            n&apos;importe quel ordre, en phrases libres. L&apos;essentiel est qu&apos;ils
            soient présents.
          </p>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">
                    Bloc
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Ce qu&apos;il doit contenir
                  </th>
                </tr>
              </thead>
              <tbody>
                {STRUCTURE.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i < STRUCTURE.length - 1 ? 'border-b border-slate-100' : ''}
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{row.label}</td>
                    <td className="px-5 py-3.5 text-slate-600">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 6 PRINCIPLES ────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Six principes
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 tracking-tight">
            Ce qui transforme un CR en signal marché.
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {SECTIONS.map(({ num, icon: Icon, title, desc, good, bad }) => (
              <div
                key={num}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-400 mb-1">§{num}</p>
                    <h3 className="text-base font-semibold text-slate-900 leading-tight">
                      {title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 italic leading-relaxed">{good}</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 italic leading-relaxed line-through decoration-rose-300">
                      {bad}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE BEFORE / AFTER ──────────────────────────── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Exemple complet
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-12 tracking-tight">
            Avant / après : la différence est nette.
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-rose-50 border-b border-rose-200 px-5 py-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                  CR vague — l&apos;IA ne génère rien
                </span>
              </div>
              <div className="p-5 text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-line bg-slate-50/40">
{`RDV cliente.
Bon retours en général.
Elle parle d'un autre acteur mais sans plus.
Voir prochain RDV.
Pas signé encore mais ça va venir.`}
              </div>
              <div className="px-5 py-4 border-t border-slate-100 bg-white">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Résultat IA :</span> 0 signal,
                  0 deal, 0 alerte. Le CR est marqué « traité » mais ne nourrit aucun tableau
                  de bord.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  CR exploitable — 8 signaux extraits
                </span>
              </div>
              <div className="p-5 text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-line bg-slate-50/40">
{`RDV Pharmacie du Centre — Marie Lambert (titulaire), Lyon 3e.
Acteurs : ROCHE et Abbott. Bons retours sur 2025.
PDM 68%. Potentiel 220 tests.

Rotation ROCHE : B7 : 90 / K7 : 35 / L7 : 85.
Écart prix perçu vs Abbott : −12%.

Verbatim : "Si vous bougez pas sur l'AF, je teste Abbott
au prochain trimestre."

Objectif AF → Non atteint. Cause : surstock 2025.
Objectif signature → Atteint.

Next rdv le 14/05 à 10h30. Envoi argumentaire AF.`}
              </div>
              <div className="px-5 py-4 border-t border-slate-100 bg-white">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">Résultat IA :</span> 1 signal
                  concurrence (Abbott), 1 signal prix (−12%), 1 deal en risque, 1 alerte
                  rouge churn, 2 objectifs analysés, 1 next step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PITFALLS ────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200 px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-3">
            Pièges à éviter
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 tracking-tight">
            Ces formulations tuent l&apos;analyse.
          </h2>

          <div className="space-y-4">
            {PITFALLS.map((p) => (
              <div
                key={p.bad}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4"
              >
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-slate-700 mb-1.5 italic">{p.bad}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUSINESS CONTEXT REMINDER ──────────────────────── */}
      <section className="px-5 sm:px-8 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
                Astuce — contexte d&apos;entreprise
              </p>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                Plus votre IA connaît votre métier, mieux elle interprète vos CR.
              </h3>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            À la création de votre compte Field Intelligence, vous décrivez votre activité :
            secteur, produits, concurrents, jargon métier, KPIs prioritaires. Cette
            description sert de contexte permanent à l&apos;IA pour analyser tous vos comptes
            rendus. Plus elle est riche, plus l&apos;extraction est pertinente.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Vous pouvez aussi alimenter le glossaire d&apos;abréviations métier (CRM, PDM, KAM,
            etc.) directement depuis l&apos;application — l&apos;IA s&apos;y réfère pour
            décoder vos verbatims.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────── */}
      <section className="bg-indigo-600 px-5 sm:px-8 py-20 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Prêt à transformer vos CR en intelligence marché ?
          </h2>
          <p className="text-indigo-100 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            14 jours d&apos;essai gratuit. Pas de carte bancaire. Premiers signaux dès le
            premier CR analysé.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors text-sm"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/comment"
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-500/30 backdrop-blur text-white font-semibold rounded-lg hover:bg-indigo-500/40 transition-colors text-sm border border-indigo-400/40"
            >
              Voir comment ça marche
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
