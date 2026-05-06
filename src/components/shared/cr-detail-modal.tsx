'use client';

import { useState, useEffect } from 'react';
import { X, FileText, User, Building2, Calendar, MapPin, Gauge, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAccessToken(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith('sb-') && trimmed.includes('-auth-token=')) {
        const value = decodeURIComponent(trimmed.split('=').slice(1).join('='));
        if (value.startsWith('base64-')) {
          const decoded = atob(value.slice(7));
          const parsed = JSON.parse(decoded);
          return parsed.access_token || null;
        }
        const parsed = JSON.parse(value);
        return parsed.access_token || null;
      }
    }
  } catch {
    /* cookie parse failed */
  }
  return null;
}

interface RawCR {
  id: string;
  subject: string | null;
  content_text: string | null;
  client_name: string | null;
  commercial_name: string | null;
  visit_date: string | null;
  quality_score: number | null;
  quality_reasons: any;
}

interface CRDetailModalProps {
  reportIds: string[];
  onClose: () => void;
  /** Optional contextual hint to display above the CR list (ex: "Verbatim de ce CR") */
  contextLabel?: string;
}

const QUALITY_BAND_CLASS = (s: number | null | undefined): string => {
  if (s == null) return 'bg-slate-100 text-slate-600 border-slate-200';
  if (s >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s >= 70) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (s >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

const QUALITY_BAND_LABEL = (s: number | null | undefined): string => {
  if (s == null) return 'non noté';
  if (s >= 85) return 'Excellent';
  if (s >= 70) return 'Bon';
  if (s >= 50) return 'Moyen';
  return 'Faible';
};

function formatDate(d: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

export function CRDetailModal({ reportIds, onClose, contextLabel }: CRDetailModalProps) {
  const [crs, setCrs] = useState<RawCR[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (reportIds.length === 0) {
      setCrs([]);
      return;
    }
    // Validation stricte UUID v4 : evite que des chaines arbitraires
    // (commas, guillemets, injection PostgREST) ne se retrouvent dans
    // l'URL. Les ids non-UUID sont silencieusement ignores.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const ids = Array.from(new Set(reportIds.filter((id) => UUID_RE.test(id))));
    if (ids.length === 0) {
      setCrs([]);
      return;
    }
    const token = getAccessToken();
    const inList = `(${ids.map((id) => `"${id}"`).join(',')})`;
    const url = `${SUPABASE_URL}/rest/v1/raw_visit_reports?id=in.${encodeURIComponent(inList)}&select=id,subject,content_text,client_name,commercial_name,visit_date,quality_score,quality_reasons`;
    fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: RawCR[]) => {
        // Re-order to match input order (best-effort)
        const byId = new Map(data.map((c) => [c.id, c]));
        const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as RawCR[];
        setCrs(ordered.length > 0 ? ordered : data);
      })
      .catch((e) => setError(`Lecture impossible : ${String(e.message ?? e)}`));
  }, [reportIds]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const active = crs?.[activeIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                {contextLabel ?? `${reportIds.length} CR${reportIds.length > 1 ? 's' : ''} source${reportIds.length > 1 ? 's' : ''}`}
              </p>
              <h2 className="text-base font-bold text-slate-900 truncate">
                {active?.subject || active?.client_name || 'Compte rendu'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination if multiple CRs */}
          {crs && crs.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3 -mb-1 overflow-x-auto pb-1">
              {crs.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors shrink-0',
                    i === activeIdx
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  )}
                  title={c.subject ?? undefined}
                >
                  CR #{i + 1} · {c.client_name?.slice(0, 20) || 'sans client'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800">
              {error}
            </div>
          )}
          {!crs && !error && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}
          {crs && crs.length === 0 && (
            <p className="text-slate-400 text-sm italic text-center py-8">
              Aucun CR trouvé pour les références fournies.
            </p>
          )}
          {active && (
            <div className="space-y-4">
              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1 text-slate-400 uppercase tracking-wider mb-0.5">
                    <Building2 className="w-3 h-3" /> Client
                  </div>
                  <div className="text-slate-900 font-medium truncate" title={active.client_name ?? undefined}>
                    {active.client_name ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-slate-400 uppercase tracking-wider mb-0.5">
                    <User className="w-3 h-3" /> Commercial
                  </div>
                  <div className="text-slate-900 font-medium truncate" title={active.commercial_name ?? undefined}>
                    {active.commercial_name ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-slate-400 uppercase tracking-wider mb-0.5">
                    <Calendar className="w-3 h-3" /> Date
                  </div>
                  <div className="text-slate-900 font-medium">
                    {formatDate(active.visit_date)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-slate-400 uppercase tracking-wider mb-0.5">
                    <Gauge className="w-3 h-3" /> Score qualité
                  </div>
                  <div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border',
                        QUALITY_BAND_CLASS(active.quality_score),
                      )}
                    >
                      {active.quality_score ?? '—'}/100
                      <span className="font-normal opacity-70">· {QUALITY_BAND_LABEL(active.quality_score)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CR text */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">Compte rendu intégral</h3>
                </div>
                {active.content_text ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4 leading-relaxed">
                    {active.content_text}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg p-4">
                    Aucun texte fourni dans ce CR.
                  </p>
                )}
              </div>

              {/* Quality breakdown if present */}
              {active.quality_reasons?.criteria && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
                    Détail du score qualité ({active.quality_reasons.passed_weight}/{active.quality_reasons.total_weight} pts)
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4">
                    {active.quality_reasons.criteria.map((c: any) => (
                      <li
                        key={c.id}
                        className={cn('font-mono', c.passed ? 'text-emerald-700' : 'text-slate-400')}
                      >
                        {c.passed ? '✓' : '✗'} +{c.weight} · {c.id}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
