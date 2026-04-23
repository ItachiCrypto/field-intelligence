// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CATEGORY_LABELS, type Abbreviation } from '@/lib/abbreviations';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Recupere l'access token depuis le cookie auth Supabase (meme logique que use-data.ts)
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

const CATEGORIES = ['tous', 'general', 'commercial', 'technique', 'organisation'] as const;
const CATEGORY_CHIP_LABELS: Record<string, string> = {
  tous: 'Tous',
  ...CATEGORY_LABELS,
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700',
  commercial: 'bg-sky-50 text-sky-700',
  technique: 'bg-violet-50 text-violet-700',
  organisation: 'bg-amber-50 text-amber-700',
};

export default function AbbreviationsPage() {
  const { company } = useAuth();
  const [abbreviations, setAbbreviations] = useState<Abbreviation[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('tous');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add form state
  const [newShort, setNewShort] = useState('');
  const [newFull, setNewFull] = useState('');
  const [newCategory, setNewCategory] = useState<Abbreviation['category']>('general');

  // Edit form state
  const [editShort, setEditShort] = useState('');
  const [editFull, setEditFull] = useState('');
  const [editCategory, setEditCategory] = useState<Abbreviation['category']>('general');

  const fetchAbbreviations = useCallback(async () => {
    if (!company?.id) return;
    const res = await rest(
      'GET',
      `abbreviations?select=*&company_id=eq.${company.id}&order=short.asc`
    );
    if (res.ok && Array.isArray(res.data)) {
      setAbbreviations(res.data as Abbreviation[]);
    } else if (!res.ok) {
      setErrorMsg(`Lecture: ${res.error}`);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchAbbreviations();
  }, [fetchAbbreviations]);

  // Auto-dismiss error after 6s
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 6000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const filtered = useMemo(() => {
    let list = abbreviations;
    if (activeCategory !== 'tous') {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.short.toLowerCase().includes(q) ||
          a.full.toLowerCase().includes(q)
      );
    }
    return list;
  }, [abbreviations, activeCategory, search]);

  async function handleAdd() {
    if (!newShort.trim() || !newFull.trim() || !company?.id) return;
    setErrorMsg(null);

    const payload = {
      short: newShort.trim().toUpperCase(),
      full: newFull.trim(),
      category: newCategory,
      company_id: company.id,
    };

    const res = await rest('POST', 'abbreviations', payload);
    if (!res.ok) {
      setErrorMsg(`Ajout impossible: ${res.error}`);
      return;
    }

    // Mise a jour optimiste + refetch pour rester coherent
    const inserted = Array.isArray(res.data) ? res.data[0] : res.data;
    if (inserted) {
      setAbbreviations((prev) =>
        [...prev, inserted as Abbreviation].sort((a, b) =>
          a.short.localeCompare(b.short)
        )
      );
      // Si la nouvelle categorie ne match pas le filtre actif, on bascule
      // sur "tous" pour que l'utilisateur voie immediatement son ajout.
      if (activeCategory !== 'tous' && inserted.category !== activeCategory) {
        setActiveCategory('tous');
      }
    }
    setNewShort('');
    setNewFull('');
    setNewCategory('general');
    setShowAddForm(false);
    fetchAbbreviations();
  }

  function handleStartEdit(abbr: Abbreviation) {
    setEditingId(abbr.id);
    setEditShort(abbr.short);
    setEditFull(abbr.full);
    setEditCategory(abbr.category);
  }

  async function handleSaveEdit(id: string) {
    if (!editShort.trim() || !editFull.trim()) return;
    setErrorMsg(null);
    const res = await rest('PATCH', `abbreviations?id=eq.${id}`, {
      short: editShort.trim().toUpperCase(),
      full: editFull.trim(),
      category: editCategory,
    });
    if (!res.ok) {
      setErrorMsg(`Modification impossible: ${res.error}`);
      return;
    }
    setEditingId(null);
    fetchAbbreviations();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette abbreviation ?')) return;
    setErrorMsg(null);
    const res = await rest('DELETE', `abbreviations?id=eq.${id}`);
    if (!res.ok) {
      setErrorMsg(`Suppression impossible: ${res.error}`);
      return;
    }
    fetchAbbreviations();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Glossaire des abbreviations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerez les abbreviations utilisees dans vos comptes rendus
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">{errorMsg}</div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Add button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une abbreviation..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          />
        </div>
        <button
          onClick={() => {
            const opening = !showAddForm;
            setShowAddForm(opening);
            setEditingId(null);
            if (opening) {
              setNewCategory(
                activeCategory !== 'tous'
                  ? (activeCategory as Abbreviation['category'])
                  : 'general'
              );
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une abbreviation
        </button>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {CATEGORY_CHIP_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-36">
                Abbreviation
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                Definition
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-36">
                Categorie
              </th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Add form row */}
            {showAddForm && (
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={newShort}
                    onChange={(e) => setNewShort(e.target.value)}
                    placeholder="Ex: CRM"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    value={newFull}
                    onChange={(e) => setNewFull(e.target.value)}
                    placeholder="Definition complete..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </td>
                <td className="px-5 py-3">
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as Abbreviation['category'])
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={handleAdd}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {filtered.map((abbr) => (
              <tr
                key={abbr.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                {editingId === abbr.id ? (
                  <>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editShort}
                        onChange={(e) => setEditShort(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={editFull}
                        onChange={(e) => setEditFull(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(
                            e.target.value as Abbreviation['category']
                          )
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSaveEdit(abbr.id)}
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {abbr.short}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-slate-700">
                        {abbr.full}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
                          CATEGORY_COLORS[abbr.category]
                        )}
                      >
                        {CATEGORY_LABELS[abbr.category]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(abbr)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(abbr.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-12 text-center text-sm text-slate-400"
                >
                  Aucune abbreviation trouvee
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40">
          <span className="text-xs text-slate-400">
            {filtered.length} abbreviation{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
