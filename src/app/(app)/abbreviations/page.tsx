// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CATEGORY_LABELS, type Abbreviation } from '@/lib/abbreviations';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const supabase = createClient();

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
    const { data } = await supabase
      .from('abbreviations')
      .select('*')
      .eq('company_id', company.id)
      .order('short', { ascending: true });
    if (data) setAbbreviations(data as Abbreviation[]);
  }, [company?.id]);

  useEffect(() => {
    fetchAbbreviations();
  }, [fetchAbbreviations]);

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
    await supabase.from('abbreviations').insert({
      short: newShort.trim().toUpperCase(),
      full: newFull.trim(),
      category: newCategory,
      company_id: company.id,
    });
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
    await supabase.from('abbreviations').update({
      short: editShort.trim().toUpperCase(),
      full: editFull.trim(),
      category: editCategory,
    }).eq('id', id);
    setEditingId(null);
    fetchAbbreviations();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cette abbreviation ?')) return;
    await supabase.from('abbreviations').delete().eq('id', id);
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
            setShowAddForm(!showAddForm);
            setEditingId(null);
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
