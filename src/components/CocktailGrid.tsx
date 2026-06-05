'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type Cocktail = {
  id: number;
  name: string;
  category: string;
  style: string;
  baseSpirit: string;
  method: string;
  difficulty: string;
  abv: string;
  glass: string;
  rating: number;
  tags: string[];
  ingredientCount: number;
};

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Advanced: 4 };

const difficultyColor = (d: string) => {
  if (d === 'Easy') return '#4caf7a';
  if (d === 'Medium') return '#c8952a';
  if (d === 'Hard') return '#e07040';
  return '#c04040';
};

export default function CocktailGrid({
  cocktails,
  categories,
  spirits,
}: {
  cocktails: Cocktail[];
  categories: string[];
  spirits: string[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [spirit, setSpirit] = useState('');
  const [sort, setSort] = useState<'name' | 'rating' | 'difficulty'>('name');

  const filtered = useMemo(() => {
    let out = cocktails;
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q)) ||
          c.baseSpirit.toLowerCase().includes(q) ||
          c.style.toLowerCase().includes(q),
      );
    }
    if (category) out = out.filter(c => c.category === category);
    if (spirit) out = out.filter(c => c.baseSpirit === spirit);
    out = [...out].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'difficulty')
        return (DIFFICULTY_ORDER[a.difficulty] ?? 5) - (DIFFICULTY_ORDER[b.difficulty] ?? 5);
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [cocktails, search, category, spirit, sort]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 w-full">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2" style={{ color: 'var(--amber)' }}>
          Cocktail Collection
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {cocktails.length} recipe{cocktails.length !== 1 ? 's' : ''} in the cabinet
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="search"
          placeholder="Search cocktails, spirits, tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-60 px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={spirit}
          onChange={e => setSpirit(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All spirits</option>
          {spirits.map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as typeof sort)}
          className="px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="name">Sort: Name</option>
          <option value="rating">Sort: Rating</option>
          <option value="difficulty">Sort: Difficulty</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4" style={{ color: 'var(--text-dim)' }}>
          {cocktails.length === 0 ? (
            <>
              <span className="text-5xl">🍸</span>
              <p className="text-lg">No cocktails yet.</p>
              <Link
                href="/admin/cocktails/new"
                className="mt-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--amber)', color: '#0d0d0f' }}
              >
                Add your first recipe
              </Link>
            </>
          ) : (
            <>
              <span className="text-4xl">🔍</span>
              <p>No cocktails match your search.</p>
              <button
                onClick={() => { setSearch(''); setCategory(''); setSpirit(''); }}
                className="text-sm underline"
                style={{ color: 'var(--amber)' }}
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/cocktails/${c.id}`}
              className="group block rounded-xl p-5 transition-all duration-200"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-semibold text-lg leading-tight group-hover:text-amber transition-colors"
                  style={{ color: 'var(--text)' }}>
                  {c.name}
                </h2>
                {c.rating > 0 && (
                  <span className="shrink-0 text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--bg-hover)', color: 'var(--amber)' }}>
                    ★ {c.rating}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {c.baseSpirit && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {c.baseSpirit}
                  </span>
                )}
                {c.style && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {c.style}
                  </span>
                )}
                {c.method && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {c.method}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
                <span>{c.ingredientCount} ingredient{c.ingredientCount !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-3">
                  {c.abv && <span>{c.abv} ABV</span>}
                  {c.difficulty && (
                    <span style={{ color: difficultyColor(c.difficulty) }}>{c.difficulty}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
