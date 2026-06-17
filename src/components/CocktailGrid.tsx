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
  isOriginal: boolean;
};

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Advanced: 4 };

const difficultyColor = (d: string) => {
  if (d === 'Easy') return '#5b8266';
  if (d === 'Medium') return '#a3742c';
  if (d === 'Hard') return '#b5663f';
  return '#a14a4a';
};

function CocktailCard({ c }: { c: Cocktail }) {
  return (
    <Link key={c.id} href={`/cocktails/${c.id}`} className="group block">
      <div className="aspect-[4/5] mb-5 flex items-center justify-center transition-colors duration-300"
        style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
        <span className="font-serif-display italic text-3xl text-center px-6 transition-opacity duration-300 opacity-30 group-hover:opacity-50"
          style={{ color: 'var(--text)' }}>
          {c.name}
        </span>
      </div>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h2 className="font-serif-display text-xl leading-tight" style={{ color: 'var(--text)' }}>
          {c.name}
        </h2>
        {c.rating > 0 && (
          <span className="shrink-0 text-xs font-mono mt-1" style={{ color: 'var(--amber)' }}>
            {c.rating}/10
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--text-muted)' }}>
        {[c.baseSpirit, c.style, c.method].filter(Boolean).join(' · ')}
      </p>
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
  );
}

function CocktailCardGrid({ cocktails }: { cocktails: Cocktail[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {cocktails.map(c => <CocktailCard key={c.id} c={c} />)}
    </div>
  );
}

function Section({ title, cocktails }: { title: string; cocktails: Cocktail[] }) {
  if (cocktails.length === 0) return null;
  return (
    <div className="mb-20">
      <div className="flex items-center gap-6 mb-10">
        <h2 className="font-serif-display italic text-3xl shrink-0" style={{ color: 'var(--text)' }}>
          {title}
        </h2>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs uppercase tracking-[0.18em] shrink-0" style={{ color: 'var(--text-dim)' }}>
          {cocktails.length}
        </span>
      </div>
      <CocktailCardGrid cocktails={cocktails} />
    </div>
  );
}

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

  const isFiltering = !!(search || category || spirit);

  return (
    <div className="w-full">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--text-dim)' }}>
          A Personal Collection
        </p>
        <h1 className="font-serif-display italic text-5xl sm:text-6xl mb-5" style={{ color: 'var(--text)' }}>
          Pours by Mackay
        </h1>
        <div className="w-16 h-px mx-auto mb-5" style={{ background: 'var(--amber)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {cocktails.length} recipe{cocktails.length !== 1 ? 's' : ''}, carefully measured and poured
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-24">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
          <input
            type="search"
            placeholder="Search cocktails, spirits, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-60 px-4 py-2.5 text-sm outline-none transition-colors bg-transparent"
            style={{
              borderBottom: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-4 py-2.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            value={spirit}
            onChange={e => setSpirit(e.target.value)}
            className="px-4 py-2.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <option value="">All spirits</option>
            {spirits.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="px-4 py-2.5 text-sm outline-none bg-transparent"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}
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
                <p className="font-serif-display italic text-2xl" style={{ color: 'var(--text-muted)' }}>The cabinet is empty.</p>
                <Link
                  href="/admin/cocktails/new"
                  className="mt-3 px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity hover:opacity-80"
                  style={{ background: 'var(--text)', color: 'var(--bg)' }}
                >
                  Add your first recipe
                </Link>
              </>
            ) : (
              <>
                <p className="font-serif-display italic text-2xl" style={{ color: 'var(--text-muted)' }}>No cocktails match your search.</p>
                <button
                  onClick={() => { setSearch(''); setCategory(''); setSpirit(''); }}
                  className="text-xs uppercase tracking-[0.18em] underline underline-offset-4"
                  style={{ color: 'var(--amber)' }}
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : isFiltering ? (
          <CocktailCardGrid cocktails={filtered} />
        ) : (
          <>
            <Section title="Original Creations" cocktails={filtered.filter(c => c.isOriginal)} />
            <Section title="Classics & Discovered" cocktails={filtered.filter(c => !c.isOriginal)} />
          </>
        )}
      </div>
    </div>
  );
}

