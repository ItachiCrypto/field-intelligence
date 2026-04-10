// @ts-nocheck
'use client';

import { useState } from 'react';
import { REGIONS } from '@/lib/constants';

const TYPE_OPTIONS = [
  { value: 'concurrence', label: 'Concurrence' },
  { value: 'besoin', label: 'Besoin client' },
  { value: 'prix', label: 'Prix' },
  { value: 'satisfaction', label: 'Satisfaction' },
  { value: 'opportunite', label: 'Opportunite' },
];

const SEVERITY_OPTIONS = [
  { value: 'rouge', label: 'Critique (Rouge)' },
  { value: 'orange', label: 'Eleve (Orange)' },
  { value: 'jaune', label: 'Modere (Jaune)' },
  { value: 'vert', label: 'Faible (Vert)' },
];

interface SignalFormProps {
  signal?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function SignalForm({ signal, onSubmit, onCancel, loading = false }: SignalFormProps) {
  const [type, setType] = useState(signal?.type ?? 'concurrence');
  const [severity, setSeverity] = useState(signal?.severity ?? 'orange');
  const [title, setTitle] = useState(signal?.title ?? '');
  const [content, setContent] = useState(signal?.content ?? '');
  const [clientName, setClientName] = useState(signal?.client_name ?? '');
  const [commercialName, setCommercialName] = useState(signal?.commercial_name ?? '');
  const [region, setRegion] = useState(signal?.region ?? REGIONS[0]);
  const [competitorName, setCompetitorName] = useState(signal?.competitor_name ?? '');
  const [priceDelta, setPriceDelta] = useState<string>(signal?.price_delta != null ? String(signal.price_delta) : '');

  const isEdit = !!signal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      type,
      severity,
      title: title.trim(),
      content: content.trim(),
      client_name: clientName.trim(),
      commercial_name: commercialName.trim(),
      region,
    };
    if (competitorName.trim()) data.competitor_name = competitorName.trim();
    if (priceDelta !== '') data.price_delta = parseFloat(priceDelta);
    await onSubmit(data);
  };

  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow';
  const selectClass = inputClass + ' appearance-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1: Type + Severity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Severite</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelClass}>Titre</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Titre du signal"
          className={inputClass}
        />
      </div>

      {/* Content */}
      <div>
        <label className={labelClass}>Contenu</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          placeholder="Description detaillee du signal..."
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Row 2: Client + Commercial */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nom du client</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="Nom du client"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Nom du commercial</label>
          <input
            type="text"
            value={commercialName}
            onChange={(e) => setCommercialName(e.target.value)}
            required
            placeholder="Nom du commercial"
            className={inputClass}
          />
        </div>
      </div>

      {/* Region */}
      <div>
        <label className={labelClass}>Region</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Row 3: Competitor + Price delta (optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Concurrent <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="text"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
            placeholder="Nom du concurrent"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Ecart de prix <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            type="number"
            step="0.01"
            value={priceDelta}
            onChange={(e) => setPriceDelta(e.target.value)}
            placeholder="Ex: -5.50"
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : isEdit ? 'Modifier le signal' : 'Creer le signal'}
        </button>
      </div>
    </form>
  );
}
