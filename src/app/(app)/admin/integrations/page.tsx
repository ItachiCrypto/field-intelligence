'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { KpiCard } from '@/components/shared/kpi-card';
import {
  Link2, Unlink, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Clock, FileText, Zap, Settings,
  ExternalLink,
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
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/integrations/sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      await fetchStatus();
      if (!res.ok) {
        setBanner({ type: 'error', message: data?.error || 'Erreur lors de la synchronisation.' });
      } else {
        const synced = data?.synced ?? data?.records_synced ?? 0;
        setBanner({ type: 'success', message: `${synced} CR synchronises.` });
      }
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors de la synchronisation.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/integrations/process', { method: 'POST' });
      const data = await res.json();
      await fetchStatus();
      if (data.error) {
        setBanner({ type: 'error', message: `Erreur: ${data.error}` });
      } else {
        setBanner({ type: 'success', message: `Traitement termine: ${data.processed} CR traitees, ${data.errors} erreurs.` });
      }
    } catch {
      setBanner({ type: 'error', message: 'Erreur lors du traitement.' });
    } finally {
      setProcessing(false);
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  Synchroniser maintenant
                </button>
                {recordsPending > 0 && (
                  <button
                    onClick={handleProcess}
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Zap className={`w-4 h-4 ${processing ? 'animate-pulse' : ''}`} />
                    {processing ? 'Traitement...' : 'Traiter les CR'}
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-2 px-4 py-2 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-50 transition-colors"
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
