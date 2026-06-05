'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Ingredient = { name: string; amount: string; notes: string };

type CocktailData = {
  id?: number;
  name: string;
  category: string;
  style: string;
  baseSpirit: string;
  method: string;
  difficulty: string;
  prepTime: string;
  abv: string;
  glass: string;
  ice: string;
  garnish: string;
  origin: string;
  originDate: string;
  rating: number;
  tags: string[];
  notes: string;
  variations: string;
  ingredients: Ingredient[];
  instructions: string[];
};

const EMPTY: CocktailData = {
  name: '', category: '', style: '', baseSpirit: '', method: '',
  difficulty: '', prepTime: '', abv: '', glass: '', ice: '', garnish: '',
  origin: '', originDate: '', rating: 0, tags: [], notes: '', variations: '',
  ingredients: [{ name: '', amount: '', notes: '' }],
  instructions: [''],
};

const inputClass = "w-full px-3 py-2.5 rounded-lg text-sm outline-none";
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

export default function CocktailForm({ initial }: { initial?: Partial<CocktailData> }) {
  const [form, setForm] = useState<CocktailData>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const set = (key: keyof CocktailData, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const updateIngredient = (i: number, key: keyof Ingredient, value: string) =>
    set('ingredients', form.ingredients.map((ing, idx) => idx === i ? { ...ing, [key]: value } : ing));

  const addIngredient = () => set('ingredients', [...form.ingredients, { name: '', amount: '', notes: '' }]);
  const removeIngredient = (i: number) => set('ingredients', form.ingredients.filter((_, idx) => idx !== i));

  const updateInstruction = (i: number, value: string) =>
    set('instructions', form.instructions.map((s, idx) => idx === i ? value : s));
  const addInstruction = () => set('instructions', [...form.instructions, '']);
  const removeInstruction = (i: number) => set('instructions', form.instructions.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: form.ingredients.filter(i => i.name).map((i, idx) => ({ ...i, order: idx + 1 })),
      instructions: form.instructions.filter(Boolean),
    };

    const url = form.id ? `/api/cocktails/${form.id}` : '/api/cocktails';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/cocktails/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
    }
  }

  const Field = ({ label, name, placeholder, half }: { label: string; name: keyof CocktailData; placeholder?: string; half?: boolean }) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block mb-1.5" style={labelStyle}>{label}</label>
      <input
        className={inputClass}
        style={inputStyle}
        placeholder={placeholder}
        value={String(form[name] ?? '')}
        onChange={e => set(name, e.target.value)}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Core info */}
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block mb-1.5" style={labelStyle}>Name *</label>
            <input required className={inputClass} style={inputStyle} placeholder="Old Fashioned"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <Field label="Category" name="category" placeholder="Classic, Tiki, Sour…" half />
          <Field label="Style" name="style" placeholder="Spirit-forward, Refreshing…" half />
          <Field label="Base Spirit" name="baseSpirit" placeholder="Bourbon, Rum, Gin…" half />
          <Field label="Method" name="method" placeholder="Stirred, Shaken, Built…" half />
          <Field label="Difficulty" name="difficulty" placeholder="Easy / Medium / Hard" half />
          <Field label="Prep Time" name="prepTime" placeholder="5 min" half />
          <Field label="Glass" name="glass" placeholder="Rocks, Coupe, Nick & Nora…" half />
          <Field label="Ice" name="ice" placeholder="Large cube, Crushed, None…" half />
          <Field label="Garnish" name="garnish" placeholder="Orange peel, Cherry…" half />
          <Field label="ABV" name="abv" placeholder="~30%" half />
          <Field label="Origin" name="origin" placeholder="Louisville, KY" half />
          <Field label="Origin Date" name="originDate" placeholder="1880s" half />
          <div className="col-span-1">
            <label className="block mb-1.5" style={labelStyle}>Rating (0-10)</label>
            <input type="number" min={0} max={10} className={inputClass} style={inputStyle}
              value={form.rating} onChange={e => set('rating', parseInt(e.target.value) || 0)} />
          </div>
          <div className="col-span-2">
            <label className="block mb-1.5" style={labelStyle}>Tags (comma-separated)</label>
            <input className={inputClass} style={inputStyle} placeholder="classic, stirred, boozy"
              value={tagInput} onChange={e => setTagInput(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Ingredients</h2>
        <div className="flex flex-col gap-3">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-5 gap-2">
                <input className={`${inputClass} col-span-2`} style={inputStyle} placeholder="Amount (2 oz)"
                  value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)} />
                <input className={`${inputClass} col-span-2`} style={inputStyle} placeholder="Ingredient name"
                  value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} />
                <input className={`${inputClass} col-span-1`} style={inputStyle} placeholder="Notes"
                  value={ing.notes} onChange={e => updateIngredient(i, 'notes', e.target.value)} />
              </div>
              <button type="button" onClick={() => removeIngredient(i)}
                className="shrink-0 px-2.5 py-2.5 rounded-lg text-sm"
                style={{ color: '#e07040', border: '1px solid var(--border)' }}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addIngredient}
            className="text-sm px-4 py-2 rounded-lg w-fit"
            style={{ color: 'var(--amber)', border: '1px solid var(--border)' }}>
            + Add ingredient
          </button>
        </div>
      </section>

      {/* Instructions */}
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Instructions</h2>
        <div className="flex flex-col gap-3">
          {form.instructions.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-2"
                style={{ background: 'var(--bg-hover)', color: 'var(--amber)' }}>
                {i + 1}
              </span>
              <textarea
                className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={inputStyle}
                rows={2}
                placeholder={`Step ${i + 1}`}
                value={step}
                onChange={e => updateInstruction(i, e.target.value)}
              />
              <button type="button" onClick={() => removeInstruction(i)}
                className="shrink-0 px-2.5 py-2.5 rounded-lg text-sm mt-0.5"
                style={{ color: '#e07040', border: '1px solid var(--border)' }}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addInstruction}
            className="text-sm px-4 py-2 rounded-lg w-fit"
            style={{ color: 'var(--amber)', border: '1px solid var(--border)' }}>
            + Add step
          </button>
        </div>
      </section>

      {/* Notes & Variations */}
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Notes & Variations</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1.5" style={labelStyle}>Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle}
              rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div>
            <label className="block mb-1.5" style={labelStyle}>Variations</label>
            <textarea className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle}
              rows={3} value={form.variations} onChange={e => set('variations', e.target.value)} />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-center" style={{ color: '#e07040' }}>{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-sm"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--amber)', color: '#0d0d0f' }}>
          {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create cocktail'}
        </button>
      </div>
    </form>
  );
}
