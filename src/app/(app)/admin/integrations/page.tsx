'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  Link2, Unlink, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Clock, FileText, Zap, ExternalLink, Trash2,
} from 'lucide-react';

type ConnectionState = 'loading' | 'disconnected' | 'connected' | 'error';

interface SyncStatus {
  connected: boolean;
  instance_url?: string;
  last_sync?: string;
  records_synced?: number;
  records_processed?: number;
  records_pending?: number;
  error?: string;
}

interface PipelineState {
  running: boolean;
  step: string;
  message: string;
  progress: number;   // 0-100
  total: number;
  processed: number;
  errors: number;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();

  const [state, setState] = useState<ConnectionState>('loading');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wiping, setWiping] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/salesforce/status');
      if (res.ok) {
        const data: SyncStatus = await res.json();
        setStatus(data);
        setState(data.connected ? 'connected' : 'disconnected');
      } else {
        setState('disconnected');
      }
    } catch {
      setState('disconnected');
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlMessage = searchParams.get('message');
    if (urlStatus === 'connected') {
      setBanner({ type: 'success', message: 'Salesforce connecté avec succès.' });
      setState('connected');
    } else if (urlStatus === 'error') {
      setBanner({ type: 'error', message: urlMessage || 'Erreur lors de la connexion.' });
      setState('error');
    }
  }, [searchParams]);

  // Cleanup SSE on unmount
  useEffect(() => () => { esRef.current?.close(); }, []);

  const handleConnect = () => { window.location.href = '/api/integrations/salesforce/authorize'; };

  const handleSyncAndProcess = async () => {
    if (pipeline?.running) return;
    setBanner(null);
    setPipeline({ running: true, step: 'connect', message: 'Connexion à Salesforce…', progress: 2, total: 0, processed: 0, errors: 0 });

    // Use fetch + ReadableStream for SSE (works in all browsers, handles auth cookies)
    try {
      const res = await fetch('/api/integrations/pipeline', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setBanner({ type: 'error', message: err?.error || `Erreur ${res.status}` });
        setPipeline(null);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let finished = false;

      const handlePayload = async (eventType: string, payload: any) => {
        if (eventType === 'error' || payload.error) {
          setPipeline(null);
          setBanner({ type: 'error', message: payload.message || 'Erreur pipeline.' });
          finished = true;
        } else if (eventType === 'done' || payload.step === 'done') {
          setPipeline(null);
          await fetchStatus();
          setBanner({ type: 'success', message: payload.message || 'Pipeline terminé.' });
          finished = true;
        } else if (payload.message !== undefined || payload.progress !== undefined) {
          setPipeline(p => p ? {
            ...p,
            step: payload.step ?? p.step,
            message: payload.message ?? p.message,
            progress: payload.progress ?? p.progress,
            total: payload.total ?? p.total,
            processed: payload.processed ?? p.processed,
            errors: payload.errors ?? p.errors,
          } : null);
        }
      };

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              await handlePayload(currentEvent, payload);
            } catch { /* ignore malformed JSON */ }
          } else if (line === '') {
            currentEvent = ''; // reset after blank line (SSE message separator)
          }
        }
      }

      if (!finished) {
        setPipeline(null);
        await fetchStatus();
      }
    } catch (e: any) {
      setBanner({ type: 'error', message: e?.message || 'Erreur réseau.' });
      setPipeline(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Salesforce ?')) return;
    try {
      await fetch('/api/integrations/salesforce/disconnect', { method: 'POST' });
      setState('disconnected');
      setStatus(null);
      setBanner({ type: 'success', message: 'Salesforce déconnecté.' });
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors de la déconnexion.' });
    }
  };

  const handleWipeActivities = async () => {
    setWiping(true);
    try {
      const res = await fetch('/api/integrations/salesforce/wipe-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      setShowWipeModal(false);
      if (!res.ok) {
        setBanner({
          type: 'error',
          message: data?.error === 'decrypt_failed'
            ? (data.message || 'Tokens expirés. Reconnectez Salesforce.')
            : (data?.error || 'Erreur lors de la suppression.'),
        });
      } else {
        const t = data.deleted?.tasks ?? 0;
        const e = data.deleted?.events ?? 0;
        setBanner({ type: 'success', message: `${t + e} activité(s) supprimée(s) dans Salesforce (${t} Tasks, ${e} Events).` });
        await fetchStatus();
      }
    } catch {
      setShowWipeModal(false);
      setBanner({ type: 'error', message: 'Erreur réseau lors de la suppression.' });
    } finally {
      setWiping(false);
    }
  };

  const recordsSynced = status?.records_synced ?? 0;
  const recordsProcessed = status?.records_processed ?? 0;
  const recordsPending = status?.records_pending ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Banner */}
      {banner && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
          banner.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="ml-auto opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Intégrations CRM</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connectez votre CRM pour alimenter automatiquement vos dashboards
        </p>
      </div>

      {/* Connection Card */}
      <div className={`bg-white rounded-xl border shadow-sm ${
        state === 'connected' ? 'border-l-4 border-l-emerald-500 border-slate-200'
        : state === 'error' ? 'border-l-4 border-l-rose-500 border-slate-200'
        : 'border-slate-200'
      }`}>
        <div className="p-6">

          {state === 'loading' && (
            <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          )}

          {state === 'disconnected' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-lg font-semibold text-slate-900">Salesforce</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connectez votre Salesforce pour importer automatiquement les comptes rendus
                de visite de tous vos commerciaux.
              </p>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Connecter Salesforce
              </button>
            </div>
          )}

          {state === 'connected' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-lg font-semibold text-slate-900">Salesforce connecté</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block mb-0.5">Instance</span>
                  <span className="text-slate-700 font-medium flex items-center gap-1 truncate">
                    {status?.instance_url?.replace('https://', '') || '--'}
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Dernière synchro</span>
                  <span className="text-slate-700 font-medium">
                    {status?.last_sync ? new Date(status.last_sync).toLocaleString('fr-FR') : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">CR synchronisés</span>
                  <span className="text-slate-700 font-medium">{recordsSynced}</span>
                </div>
              </div>

              {/* ── Barre de progression pipeline ── */}
              {pipeline?.running && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-800">{pipeline.message}</span>
                    <span className="text-xs text-indigo-500 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {pipeline.progress}%
                    </span>
                  </div>

                  {/* Barre de progression réelle */}
                  <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-indigo-600 transition-all duration-500 ease-out"
                      style={{ width: `${pipeline.progress}%` }}
                    />
                  </div>

                  {/* Détail par étape */}
                  <div className="flex items-center gap-6 text-xs text-indigo-600">
                    <span className={`flex items-center gap-1 ${pipeline.progress >= 15 ? 'opacity-100' : 'opacity-40'}`}>
                      <CheckCircle className="w-3 h-3" />
                      Import SF
                    </span>
                    <span className={`flex items-center gap-1 ${pipeline.progress >= 20 ? 'opacity-100' : 'opacity-40'}`}>
                      {pipeline.progress >= 85 ? <CheckCircle className="w-3 h-3" /> : <RefreshCw className={`w-3 h-3 ${pipeline.progress >= 20 && pipeline.progress < 85 ? 'animate-spin' : ''}`} />}
                      Analyse IA {pipeline.total > 0 ? `${pipeline.processed}/${pipeline.total}` : ''}
                    </span>
                    <span className={`flex items-center gap-1 ${pipeline.progress >= 90 ? 'opacity-100' : 'opacity-40'}`}>
                      {pipeline.progress >= 100 ? <CheckCircle className="w-3 h-3" /> : <RefreshCw className={`w-3 h-3 ${pipeline.progress >= 88 ? 'animate-spin' : ''}`} />}
                      Analytics
                    </span>
                  </div>

                  {pipeline.total > 0 && (
                    <p className="text-xs text-indigo-500">
                      ~{Math.ceil(((pipeline.total - pipeline.processed) / 5) * 3)}s restantes
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button
                  onClick={handleSyncAndProcess}
                  disabled={!!pipeline?.running}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Zap className={`w-4 h-4 ${pipeline?.running ? 'animate-pulse' : ''}`} />
                  {pipeline?.running ? 'En cours…' : 'Synchroniser'}
                </button>

                <button
                  onClick={() => setShowWipeModal(true)}
                  disabled={!!pipeline?.running}
                  className="inline-flex items-center gap-2 px-4 py-2 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer activités SF
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={!!pipeline?.running}
                  className="inline-flex items-center gap-2 px-4 py-2 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  Déconnecter
                </button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span className="text-lg font-semibold text-slate-900">Erreur de connexion</span>
              </div>
              <p className="text-sm text-rose-600">{status?.error || 'Impossible de se connecter à Salesforce.'}</p>
              <button
                onClick={handleConnect}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnecter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {state === 'connected' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="CR importés"
            value={recordsSynced}
            icon={<FileText className="w-5 h-5" />}
            iconColor="text-indigo-600 bg-indigo-50"
          />
          <KpiCard
            label="CR analysés par l'IA"
            value={recordsProcessed}
            icon={<Zap className="w-5 h-5" />}
            iconColor="text-emerald-600 bg-emerald-50"
          />
          <KpiCard
            label="En attente"
            value={recordsPending}
            icon={<Clock className="w-5 h-5" />}
            iconColor="text-amber-600 bg-amber-50"
          />
        </div>
      )}

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Comment ça fonctionne</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Connexion', description: "L'admin connecte le Salesforce de l'entreprise via OAuth", icon: <Link2 className="w-5 h-5" /> },
            { step: 2, title: 'Import automatique', description: 'Les comptes rendus, contacts et opportunités sont importés depuis Salesforce', icon: <RefreshCw className="w-5 h-5" /> },
            { step: 3, title: 'Analyse IA', description: 'Claude analyse chaque CR et extrait les signaux, deals et alertes pour vos dashboards', icon: <Zap className="w-5 h-5" /> },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">
                  {item.step}
                </div>
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600">
                  {item.icon}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wipe modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Supprimer toutes les activités Salesforce</h3>
                <p className="text-xs text-slate-400 mt-0.5">Action irréversible dans Salesforce</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 space-y-1.5">
              <p className="font-medium">Attention — ceci supprimera dans votre org Salesforce :</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 text-xs">
                <li>Toutes les <strong>Tasks</strong> (CR, appels, emails, tâches)</li>
                <li>Tous les <strong>Events</strong> (réunions, RDV)</li>
              </ul>
              <p className="text-amber-600 text-xs mt-2">Utilisez uniquement sur un compte de test ou sandbox.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowWipeModal(false)}
                disabled={wiping}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleWipeActivities}
                disabled={wiping}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {wiping ? <><RefreshCw className="w-4 h-4 animate-spin" />Suppression…</> : <><Trash2 className="w-4 h-4" />Oui, tout supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
