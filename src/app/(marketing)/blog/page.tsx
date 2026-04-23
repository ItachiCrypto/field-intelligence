import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — Field Intelligence',
  description:
    'Ressources, guides et analyses sur l\'intelligence terrain, le product marketing B2B et la veille concurrentielle.',
};

const ARTICLES = [
  {
    slug: 'cr-visite-mine-or',
    category: 'Intelligence Terrain',
    categoryColor: 'text-[#6366F1] bg-[#EEF2FF]',
    title: 'Le CR de visite : la mine d\'or que votre marketing ignore',
    excerpt:
      'Vos commerciaux rédigent 3 à 5 comptes rendus par semaine dans le CRM. Chacun contient des signaux précieux sur la concurrence, les prix et les besoins de vos clients. Voici pourquoi personne ne les lit — et comment y remédier.',
    readTime: '8 min',
    date: '14 Avril 2025',
    tags: ['CRM', 'Intelligence Marché', 'Veille'],
    featured: true,
  },
  {
    slug: 'battlecard-temps-reel',
    category: 'Product Marketing',
    categoryColor: 'text-amber-700 bg-amber-50',
    title: 'Comment créer des battlecards qui ne sont pas périmées à la publication',
    excerpt:
      'La plupart des battlecards sont construites sur ce que les concurrents communiquent publiquement — pas sur ce qu\'ils proposent réellement en rendez-vous. Un problème fondamental que l\'intelligence terrain résout.',
    readTime: '6 min',
    date: '2 Avril 2025',
    tags: ['Battlecards', 'Concurrence', 'Product Marketing'],
    featured: false,
  },
  {
    slug: 'etude-marche-vs-terrain',
    category: 'Stratégie',
    categoryColor: 'text-[#059669] bg-emerald-50',
    title: 'Étude de marché vs. intelligence terrain : ce que l\'une capture que l\'autre manque',
    excerpt:
      'Les études de marché capturent du déclaratif sur un échantillon. L\'intelligence terrain capture du comportemental sur 100% de vos RDV clients. Les deux sont utiles — mais pour des décisions très différentes.',
    readTime: '10 min',
    date: '18 Mars 2025',
    tags: ['Études de Marché', 'Stratégie', 'Intelligence'],
    featured: false,
  },
  {
    slug: 'signaux-concurrentiels-crm',
    category: 'Intelligence Terrain',
    categoryColor: 'text-[#6366F1] bg-[#EEF2FF]',
    title: '5 signaux concurrentiels que vous pouvez extraire de votre CRM dès aujourd\'hui',
    excerpt:
      'Sans outil particulier, vos CR de visite contiennent déjà des signaux exploitables. Voici comment les identifier manuellement — et pourquoi l\'automatisation change fondamentalement le ROI de cette pratique.',
    readTime: '7 min',
    date: '5 Mars 2025',
    tags: ['Concurrence', 'CRM', 'Pratique'],
    featured: false,
  },
  {
    slug: 'prix-terrain-vs-affiche',
    category: 'Pricing',
    categoryColor: 'text-red-700 bg-red-50',
    title: 'Écarts de prix terrain : pourquoi vos concurrents ne font jamais ce qu\'ils affichent',
    excerpt:
      'Les grilles tarifaires publiques de vos concurrents n\'ont aucune relation avec ce qu\'ils proposent réellement en RDV. Les remises, bundles et conditions spéciales ne se voient que sur le terrain.',
    readTime: '9 min',
    date: '19 Février 2025',
    tags: ['Pricing', 'Concurrence', 'Terrain'],
    featured: false,
  },
  {
    slug: 'verbatims-clients-contenu',
    category: 'Content Marketing',
    categoryColor: 'text-teal-700 bg-teal-50',
    title: 'Utiliser les verbatims de vos clients pour créer un contenu qui convertit',
    excerpt:
      'La meilleure copie marketing utilise les mots exacts de vos clients — pas votre jargon interne. Field Intelligence extrait les formulations réelles de vos prospects depuis vos CR de visite.',
    readTime: '5 min',
    date: '3 Février 2025',
    tags: ['Content Marketing', 'Copywriting', 'Verbatims'],
    featured: false,
  },
];

const CATEGORIES = ['Tous', 'Intelligence Terrain', 'Product Marketing', 'Stratégie', 'Pricing', 'Content Marketing'];

function ArticleCard({ article }: { article: typeof ARTICLES[0] }) {
  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <article className="h-full bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all">
        {/* Placeholder image */}
        <div className="aspect-[16/9] bg-gradient-to-br from-[#EEF2FF] to-[#F9FAFB] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[80px] font-bold text-[#6366F1]/10 select-none"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              FI
            </span>
          </div>
          <div className="absolute top-4 left-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${article.categoryColor}`}>
              {article.category}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3
            className="text-lg font-bold text-[#111827] leading-snug group-hover:text-[#6366F1] transition-colors line-clamp-2"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            {article.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{article.excerpt}</p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{article.date}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage() {
  const featured = ARTICLES.find((a) => a.featured);
  const rest = ARTICLES.filter((a) => !a.featured);

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#111827] py-24 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#3730A3]/40 border border-[#6366F1]/30 text-[#A5B4FC] text-sm font-medium">
            Ressources
          </span>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Intelligence terrain,
            <br />
            <span className="text-[#6366F1]">mode d'emploi.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Guides pratiques, analyses et retours d'expérience sur l'intelligence terrain, la veille concurrentielle et le product marketing B2B.
          </p>
        </div>
      </section>

      {/* Category filter — static for now */}
      <section className="py-8 px-4 border-b border-slate-200 sticky top-[64px] bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  i === 0
                    ? 'bg-[#3730A3] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Featured article */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="group block">
              <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all grid grid-cols-1 lg:grid-cols-2">
                {/* Visual */}
                <div className="aspect-video lg:aspect-auto lg:min-h-[280px] bg-gradient-to-br from-[#3730A3] to-[#6366F1] relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-[120px] font-bold text-white/10 select-none"
                      style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                    >
                      FI
                    </span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                      À la une
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 lg:p-10 flex flex-col justify-center space-y-4">
                  <span className={`inline-block w-fit px-3 py-1 rounded-full text-xs font-semibold ${featured.categoryColor}`}>
                    {featured.category}
                  </span>
                  <h2
                    className="text-2xl lg:text-3xl font-bold text-[#111827] leading-snug group-hover:text-[#6366F1] transition-colors"
                    style={{ fontFamily: 'var(--font-syne), sans-serif' }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-slate-500 leading-relaxed">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{featured.date}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {featured.readTime}
                    </span>
                    <span className="text-sm font-semibold text-[#6366F1] flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
                      Lire <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {/* Article grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-[#EEF2FF] py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2
            className="text-3xl font-bold text-[#111827]"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            Recevez nos analyses chaque semaine
          </h2>
          <p className="text-slate-600">
            Intelligence terrain, veille concurrentielle, product marketing B2B — directement dans votre boîte mail.
          </p>
          <form className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#3730A3] text-white font-semibold text-sm hover:bg-[#2d279b] transition-colors flex-shrink-0"
            >
              S'abonner
            </button>
          </form>
          <p className="text-xs text-slate-400">Pas de spam. Désabonnement en un clic.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#111827] py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3
              className="text-xl font-bold text-white"
              style={{ fontFamily: 'var(--font-syne), sans-serif' }}
            >
              Prêt à passer à l'action ?
            </h3>
            <p className="text-slate-400 text-sm">Connectez votre CRM et voyez vos premiers signaux en 24h.</p>
          </div>
          <Link
            href="/demo"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6366F1] text-white font-semibold text-sm hover:bg-[#4F46E5] transition-colors"
          >
            Réserver une démo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
