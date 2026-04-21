'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  Link2, Unlink, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Clock, FileText, Zap, Settings,
  ExternalLink, Trash2,
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

export default function IntegrationsPage() {
  const { profile, company } = useAuth();
  const searchParams = useSearchParams();

  const [state, setState] = useState<ConnectionState>('loading');
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pipeline, setPipeline] = useState<{
    running: boolean;
    step: 'sync' | 'process' | 'done';
    synced: number;
    processed: number;
    total: number;
    errors: number;
  } | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wiping, setWiping] = useState(false);

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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlMessage = searchParams.get('message');

    if (urlStatus === 'connected') {
      setBanner({ type: 'success', message: 'Salesforce connecte avec succes.' });
      setState('connected');
    } else if (urlStatus === 'error') {
      setBanner({ type: 'error', message: urlMessage || 'Erreur lors de la connexion.' });
      setState('error');
      setStatus((prev) => prev ? { ...prev, error: urlMessage || 'Erreur inconnue' } : { connected: false, error: urlMessage || 'Erreur inconnue' });
    }
  }, [searchParams]);

  const handleConnect = () => {
    window.location.href = '/api/integrations/salesforce/authorize';
  };

  // Sync seul (gardé pour rétro-compat)
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      await fetchStatus();
      if (!res.ok) setBanner({ type: 'error', message: data?.error || 'Erreur lors de la synchronisation.' });
      else setBanner({ type: 'success', message: `${data?.synced ?? 0} CR synchronises.` });
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors de la synchronisation.' });
    } finally {
      setSyncing(false);
    }
  };

  // Process seul (gardé pour rétro-compat)
  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/integrations/process', { method: 'POST' });
      const data = await res.json();
      await fetchStatus();
      if (data.error) setBanner({ type: 'error', message: `Erreur: ${data.error}` });
      else setBanner({ type: 'success', message: `Traitement termine: ${data.processed} CR traitees, ${data.errors} erreurs.` });
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors du traitement.' });
    } finally {
      setProcessing(false);
    }
  };

  // Pipeline complet : sync → process en boucle avec progression
  const handleSyncAndProcess = async () => {
    setPipeline({ running: true, step: 'sync', synced: 0, processed: 0, total: 0, errors: 0 });
    setBanner(null);
    try {
      // Étape 1 : sync
      const syncRes = await fetch('/api/integrations/sync', { method: 'POST' });
      const syncData = await syncRes.json().catch(() => ({}));
      if (!syncRes.ok) {
        setBanner({ type: 'error', message: syncData?.error || 'Erreur sync.' });
        setPipeline(null);
        return;
      }
      const synced: number = syncData?.synced ?? 0;
      setPipeline(p => p ? { ...p, step: 'process', synced, total: synced } : null);
      await fetchStatus();

      // Étape 2 : process en boucle jusqu'à épuisement des pending
      let totalProcessed = 0;
      let totalErrors = 0;
      let remaining = synced;
      while (remaining > 0) {
        const procRes = await fetch('/api/integrations/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ retry_errors: false }),
        });
        const procData = await procRes.json().catch(() => ({}));
        const batchProcessed: number = procData?.processed ?? 0;
        const batchErrors: number = procData?.errors ?? 0;
        totalProcessed += batchProcessed;
        totalErrors += batchErrors;
        remaining = remaining - batchProcessed - batchErrors;
        if (batchProcessed === 0 && batchErrors === 0) break; // plus rien à faire
        setPipeline(p => p ? { ...p, processed: totalProcessed, errors: totalErrors } : null);
      }
      await fetchStatus();
      setPipeline(p => p ? { ...p, running: false, step: 'done' } : null);
      setBanner({
        type: totalErrors > 0 ? 'error' : 'success',
        message: `${synced} CR importés, ${totalProcessed} analysés par l'IA${totalErrors > 0 ? `, ${totalErrors} erreur(s)` : ''}.`,
      });
    } catch (e: any) {
      setBanner({ type: 'error', message: e?.message || 'Erreur pipeline.' });
    } finally {
      setPipeline(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Etes-vous sur de vouloir deconnecter Salesforce ?')) return;
    try {
      await fetch('/api/integrations/salesforce/disconnect', { method: 'POST' });
      setState('disconnected');
      setStatus(null);
      setBanner({ type: 'success', message: 'Salesforce deconnecte.' });
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors de la deconnexion.' });
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
        if (data?.error === 'decrypt_failed') {
          setBanner({
            type: 'error',
            message: data.message || 'Tokens chiffres avec une ancienne cle. Reconnectez Salesforce puis reessayez.',
          });
        } else {
          setBanner({ type: 'error', message: data?.error || 'Erreur lors de la suppression.' });
        }
      } else {
        const t = data.deleted?.tasks ?? 0;
        const e = data.deleted?.events ?? 0;
        const total = t + e;
        setBanner({
          type: 'success',
          message: `${total} activite(s) supprimee(s) dans Salesforce (${t} Tasks, ${e} Events).${data.errors?.length ? ` ${data.errors.length} erreur(s).` : ''}`,
        });
        await fetchStatus();
      }
    } catch {
      setShowWipeModal(false);
      setBanner({ type: 'error', message: 'Erreur reseau lors de la suppression.' });
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
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="ml-auto text-current opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations CRM</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connectez votre CRM pour alimenter automatiquement vos dashboards
        </p>
      </div>

      {/* Connection Card */}
      <div
        className={`bg-white rounded-xl border shadow-sm ${
          state === 'connected'
            ? 'border-l-4 border-l-emerald-500 border-slate-200'
            : state === 'error'
            ? 'border-l-4 border-l-rose-500 border-slate-200'
            : 'border-slate-200'
        }`}
      >
        <div className="p-6">
          {state === 'loading' && (
            <div className="flex items-center gap-3 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement...</span>
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
                <span className="text-lg font-semibold text-slate-900">Salesforce connecte</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block mb-0.5">Instance</span>
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    {status?.instance_url || '--'}
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Derniere synchro</span>
                  <span className="text-slate-700 font-medium">
                    {status?.last_sync
                      ? new Date(status.last_sync).toLocaleString('fr-FR')
                      : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">CR synchronises</span>
                  <span className="text-slate-700 font-medium">{recordsSynced}</span>
                </div>
              </div>

              {/* Barre de progression pipeline */}
              {pipeline && (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-indigo-700">
                    <span>
                      {pipeline.step === 'sync' && '⟳ Import depuis Salesforce...'}
                      {pipeline.step === 'process' && `⚡ Analyse IA — ${pipeline.processed}/${pipeline.synced} CR traités`}
                      {pipeline.step === 'done' && '✓ Terminé'}
                    </span>
                    <span>{pipeline.synced > 0 ? Math.round((pipeline.processed / pipeline.synced) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: pipeline.step === 'sync'
                          ? '10%'
                          : pipeline.synced > 0
                          ? `${Math.max(10, Math.round((pipeline.processed / pipeline.synced) * 100))}%`
                          : '100%',
                      }}
                    />
                  </div>
                  {pipeline.errors > 0 && (
                    <p className="text-xs text-amber-600">{pipeline.errors} erreur(s) ignorée(s)</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {/* Bouton principal : sync + process en une fois */}
                <button
                  onClick={handleSyncAndProcess}
                  disabled={!!pipeline || syncing || processing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${pipeline ? 'animate-pulse' : ''}`} />
                  {pipeline ? 'En cours...' : 'Synchroniser & Analyser'}
                </button>
                <button
                  onClick={() => setShowWipeModal(true)}
                  disabled={!!pipeline}
                  className="inline-flex items-center gap-2 px-4 py-2 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer activites SF
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={!!pipeline}
                  className="inline-flex items-center gap-2 px-4 py-2 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Unlink className="w-4 h-4" />
                  Deconnecter
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
              <p className="text-sm text-rose-600">
                {status?.error || 'Impossible de se connecter a Salesforce.'}
              </p>
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

      {/* Sync Dashboard */}
      {state === 'connected' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Tableau de synchronisation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="CR importes"
              value={recordsSynced}
              icon={<FileText className="w-5 h-5" />}
              iconColor="text-indigo-600 bg-indigo-50"
            />
            <KpiCard
              label="CR traites"
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
        </div>
      )}

      {/* Wipe confirmation modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Supprimer toutes les activites Salesforce
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Action irreversible dans Salesforce</p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 space-y-1.5">
              <p className="font-medium">Attention — ceci supprimera dans votre org Salesforce :</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>Toutes les <strong>Tasks</strong> (CR, appels, emails, taches)</li>
                <li>Tous les <strong>Events</strong> (reunions, RDV)</li>
              </ul>
              <p className="text-amber-600 text-xs mt-2">
                Cette action est permanente et ne peut pas etre annulee.
                Utilisez uniquement sur un compte de test ou sandbox.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowWipeModal(false)}
                disabled={wiping}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleWipeActivities}
                disabled={wiping}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {wiping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Oui, tout supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Comment ca fonctionne</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: 1,
              title: 'Connexion',
              description: "L'admin connecte le Salesforce de l'entreprise via OAuth",
              icon: <Link2 className="w-5 h-5" />,
            },
            {
              step: 2,
              title: 'Import automatique',
              description: 'Les CR de visite sont importes toutes les 15 minutes',
              icon: <RefreshCw className="w-5 h-5" />,
            },
            {
              step: 3,
              title: 'Analyse IA',
              description: 'Claude analyse chaque CR et extrait les signaux pour vos dashboards',
              icon: <Zap className="w-5 h-5" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
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
    </div>
  );
}
