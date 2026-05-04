// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles, Save, AlertCircle, CheckCircle2, Lightbulb, Loader2,
} from 'lucide-react';

// Same cap as buildExtractionPrompt (extraction-prompt.ts: MAX_BUSINESS_CONTEXT_CHARS).
// We let the user write more in the form for convenience but warn before saving
// that the prompt itself truncates beyond this many chars.
const SOFT_CHAR_LIMIT = 4_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Same raw-fetch helper pattern used in /abbreviations: bypasses any
// @supabase/ssr session staleness by reading the access token straight from the
// auth cookie and calling PostgREST directly.
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

async function rest(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const token = getAccessToken();
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(extraHeaders ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!resp.ok) {
    const msg =
      (data && (data.message || data.error || data.hint)) ||
      `HTTP ${resp.status}`;
    return { ok: false, status: resp.status, data, error: msg };
  }
  return { ok: true, status: resp.status, data };
}

export default function ContexteIaPage() {
  const { profile, company } = useAuth();

  const [businessContext, setBusinessContext] = useState('');
  const [initialContext, setInitialContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    const res = await rest(
      'GET',
      `companies?select=business_context&id=eq.${company.id}`
    );
    if (res.ok && Array.isArray(res.data) && res.data[0]) {
      const value = res.data[0].business_context ?? '';
      setBusinessContext(value);
      setInitialContext(value);
    } else if (!res.ok) {
      setErrorMsg(`Lecture impossible : ${res.error}`);
    }
    setLoading(false);
  }, [company?.id]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Auto-dismiss banners
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 6000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const dirty = businessContext !== initialContext;
  const charCount = businessContext.length;
  const overSoftLimit = charCount > SOFT_CHAR_LIMIT;

  async function handleSave() {
    if (!company?.id || !dirty) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    const trimmed = businessContext.trim();
    const res = await rest(
      'PATCH',
      `companies?id=eq.${company.id}`,
      { business_context: trimmed.length > 0 ? trimmed : null }
    );

    if (!res.ok) {
      setErrorMsg(`Sauvegarde impossible : ${res.error}`);
    } else {
      setSuccessMsg('Contexte mis à jour. L\'IA l\'utilisera au prochain CR analysé.');
      setInitialContext(trimmed);
      setBusinessContext(trimmed);
    }
    setSaving(false);
  }

  if (!profile || !company) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Contexte d&apos;entreprise pour l&apos;IA
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Cette description est injectée en tête du prompt envoyé à l&apos;IA pour chaque CR
          analysé. Plus elle est précise, plus l&apos;extraction est pertinente (concurrents
          mieux identifiés, jargon métier compris, KPIs reconnus).
        </p>
      </div>

      {/* Banners */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Editor card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Description de votre activité
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Secteur · produits · clientèle · concurrents · jargon · KPIs prioritaires
          </p>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement du contexte…
            </div>
          ) : (
            <>
              <textarea
                value={businessContext}
                onChange={(e) => setBusinessContext(e.target.value)}
                rows={18}
                className="w-full px-3.5 py-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-y leading-relaxed"
                placeholder={`Ex :
Activité : Distributeur de matériel de diagnostic glycémique aux pharmacies françaises.
Géographie : ~200 pharmacies/mois (IDF, Sud-Est, Ouest, Sud-Ouest).
Concurrents principaux : Abbott, Dexcom, Ypsomed, BD, Lifescan.

Aliases concurrents (UN GROUPE PAR LIGNE, séparé par "=" ; le PREMIER est le canonique) :
Lifescan = OneTouch = LS
Abbott = FreeStyle = FreeStyle Libre
BD = Becton Dickinson = Micro-Fine
Ascensia = Contour = Contour Next

Produits / SKU : lecteurs Accu-Chek B7, K7, L7, B7P. Aiguilles Accu-Fine 4mm/5mm/8mm. Auto-Piqueurs FastClix.
KPIs prioritaires : PDM (Part de Marché), rotation B7/K7/L7, signature offre AF, taux de switch.
Cycle de vente moyen : 45 jours. Stages pipeline : prospection → démo → contrat → réassort.`}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-slate-400">
                  {charCount} caractères
                  {overSoftLimit && (
                    <span className="text-amber-600 ml-2">
                      ⚠ Au-delà de {SOFT_CHAR_LIMIT.toLocaleString()} caractères, le prompt
                      tronque automatiquement.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {dirty && (
                    <button
                      onClick={() => {
                        setBusinessContext(initialContext);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {saving ? 'Sauvegarde…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tips card */}
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <Lightbulb className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-indigo-900">
              Que mettre dedans ?
            </h3>
            <p className="text-xs text-indigo-800/80 mt-0.5">
              Six axes à couvrir pour maximiser la pertinence de l&apos;extraction.
            </p>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-indigo-900/90 leading-relaxed pl-8">
          <li>
            <span className="font-semibold">Activité :</span> ce que vous vendez et à qui (ex.
            « matériel de diagnostic glycémique aux pharmacies françaises »).
          </li>
          <li>
            <span className="font-semibold">Géographie :</span> régions couvertes, taille du
            réseau commercial, fréquence des visites.
          </li>
          <li>
            <span className="font-semibold">Concurrents :</span> noms exacts des principaux
            acteurs (Abbott, Dexcom, Ypsomed…). L&apos;IA les reconnaîtra dans les CR.
          </li>
          <li>
            <span className="font-semibold">Aliases concurrents :</span> une ligne par
            groupe, termes séparés par <code className="font-mono bg-indigo-100 px-1 rounded">=</code>.
            Le 1<sup>er</sup> est le nom canonique. Ex.{' '}
            <code className="font-mono bg-indigo-100 px-1 rounded">Lifescan = OneTouch = LS</code>.
            <br />
            <span className="text-indigo-700/80">
              Sans ça l&apos;IA crée 3 concurrents distincts là où il n&apos;y en a qu&apos;un.
            </span>
          </li>
          <li>
            <span className="font-semibold">Produits :</span> gamme et codes internes (B7,
            K7, L7…). Permet à l&apos;IA d&apos;interpréter les rotations chiffrées.
          </li>
          <li>
            <span className="font-semibold">KPIs :</span> indicateurs prioritaires (PDM,
            rotation, AF, NPS…). L&apos;IA cible ce qui compte pour vous.
          </li>
          <li>
            <span className="font-semibold">Cycle commercial :</span> durée moyenne, étapes
            clés, motifs de gain/perte récurrents.
          </li>
        </ul>
      </div>

      {/* How it's used */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Comment ce contexte est-il utilisé ?
        </h3>
        <ol className="space-y-1.5 text-xs text-slate-600 leading-relaxed list-decimal pl-4">
          <li>
            À chaque CR brut récupéré (Salesforce, HubSpot…), le pipeline d&apos;extraction
            charge votre <span className="font-mono">business_context</span> depuis la table{' '}
            <span className="font-mono">companies</span>.
          </li>
          <li>
            Ce contexte est injecté en tête du prompt, dans une section{' '}
            <span className="font-mono">CONTEXTE DE L&apos;ENTREPRISE UTILISATRICE</span>,
            avant le texte du CR à analyser.
          </li>
          <li>
            L&apos;IA (Claude / GPT) lit ce contexte avant de classifier signaux, deals,
            besoins et concurrents — l&apos;extraction devient cohérente avec votre métier.
          </li>
          <li>
            Le contexte est tronqué à {SOFT_CHAR_LIMIT.toLocaleString()} caractères avant
            envoi pour borner le coût des appels.
          </li>
        </ol>
      </div>
    </div>
  );
}
