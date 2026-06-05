'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Ingredient = { name: string; amount: string };

type ComponentData = {
  id?: number;
  name: string;
  ratio?: string;
  sugarType?: string;
  baseSpirit?: string;
  base?: string;
  difficulty: string;
  prepTime: string;
  shelfLife: string;
  storage: string;
  yield: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  notes: string;
  usedIn: string[];
  variations: string;
};

const EMPTY: ComponentData = {
  name: '', difficulty: '', prepTime: '', shelfLife: '', storage: '', yield: '',
  tags: [], ingredients: [{ name: '', amount: '' }], instructions: [''],
  notes: '', usedIn: [], variations: '',
};

const inputClass = "w-full px-3 py-2.5 rounded-lg text-sm outline-none";
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' };
const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

const TYPE_FIELDS: Record<string, { label: string; field: keyof ComponentData; placeholder: string }[]> = {
  syrup: [
    { label: 'Ratio', field: 'ratio', placeholder: '1:1, 2:1…' },
    { label: 'Sugar Type', field: 'sugarType', placeholder: 'White Sugar, Demerara…' },
  ],
  infusion: [
    { label: 'Base Spirit', field: 'baseSpirit', placeholder: 'Bourbon, Vodka…' },
  ],
  liqueur: [
    { label: 'Base Spirit', field: 'baseSpirit', placeholder: 'Grain Spirit, Brandy…' },
  ],
  shrub: [
    { label: 'Base', field: 'base', placeholder: 'Cherry Juice, Strawberries…' },
  ],
};

export default function ComponentForm({ modelType, initial }: { modelType: string; initial?: Partial<ComponentData> }) {
  const [form, setForm] = useState<ComponentData>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '));
  const [usedInInput, setUsedInInput] = useState((initial?.usedIn ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const set = (key: keyof ComponentData, value: unknown) => setForm(f => ({ ...f, [key]: value }));
  const updateIng = (i: number, key: keyof Ingredient, value: string) =>
    set('ingredients', form.ingredients.map((ing, idx) => idx === i ? { ...ing, [key]: value } : ing));
  const updateStep = (i: number, value: string) =>
    set('instructions', form.instructions.map((s, idx) => idx === i ? value : s));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      modelType,
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
      usedIn: usedInInput.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: form.ingredients.filter(i => i.name),
      instructions: form.instructions.filter(Boolean),
    };

    const url = form.id ? `/api/components/${form.id}` : '/api/components';
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong');
    }
  }

  const extraFields = TYPE_FIELDS[modelType] ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block mb-1.5" style={labelStyle}>Name *</label>
            <input required className={inputClass} style={inputStyle} value={form.name}
              onChange={e => set('name', e.target.value)} />
          </div>
          {extraFields.map(f => (
            <div key={f.field}>
              <label className="block mb-1.5" style={labelStyle}>{f.label}</label>
              <input className={inputClass} style={inputStyle} placeholder={f.placeholder}
                value={String(form[f.field] ?? '')} onChange={e => set(f.field, e.target.value)} />
            </div>
          ))}
          {[
            { label: 'Difficulty', field: 'difficulty' as const, placeholder: 'Easy / Medium / Hard' },
            { label: 'Prep Time', field: 'prepTime' as const, placeholder: '30 min' },
            { label: 'Shelf Life', field: 'shelfLife' as const, placeholder: '2 weeks' },
            { label: 'Storage', field: 'storage' as const, placeholder: 'Refrigerator' },
            { label: 'Yield', field: 'yield' as const, placeholder: '500 ml' },
          ].map(f => (
            <div key={f.field}>
              <label className="block mb-1.5" style={labelStyle}>{f.label}</label>
              <input className={inputClass} style={inputStyle} placeholder={f.placeholder}
                value={form[f.field]} onChange={e => set(f.field, e.target.value)} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block mb-1.5" style={labelStyle}>Tags (comma-separated)</label>
            <input className={inputClass} style={inputStyle} placeholder="simple, house-made"
              value={tagInput} onChange={e => setTagInput(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block mb-1.5" style={labelStyle}>Used in cocktails (comma-separated)</label>
            <input className={inputClass} style={inputStyle} placeholder="Old Fashioned, Manhattan"
              value={usedInInput} onChange={e => setUsedInInput(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Ingredients</h2>
        <div className="flex flex-col gap-3">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input className={`${inputClass} flex-1`} style={inputStyle} placeholder="Amount"
                value={ing.amount} onChange={e => updateIng(i, 'amount', e.target.value)} />
              <input className={`${inputClass} flex-[2]`} style={inputStyle} placeholder="Ingredient"
                value={ing.name} onChange={e => updateIng(i, 'name', e.target.value)} />
              <button type="button" onClick={() => set('ingredients', form.ingredients.filter((_, idx) => idx !== i))}
                className="px-2.5 py-2.5 rounded-lg text-sm" style={{ color: '#e07040', border: '1px solid var(--border)' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => set('ingredients', [...form.ingredients, { name: '', amount: '' }])}
            className="text-sm px-4 py-2 rounded-lg w-fit" style={{ color: 'var(--amber)', border: '1px solid var(--border)' }}>
            + Add ingredient
          </button>
        </div>
      </section>

      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Instructions</h2>
        <div className="flex flex-col gap-3">
          {form.instructions.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-2"
                style={{ background: 'var(--bg-hover)', color: 'var(--amber)' }}>{i + 1}</span>
              <textarea className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle}
                rows={2} value={step} onChange={e => updateStep(i, e.target.value)} />
              <button type="button" onClick={() => set('instructions', form.instructions.filter((_, idx) => idx !== i))}
                className="px-2.5 py-2.5 rounded-lg text-sm mt-0.5" style={{ color: '#e07040', border: '1px solid var(--border)' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => set('instructions', [...form.instructions, ''])}
            className="text-sm px-4 py-2 rounded-lg w-fit" style={{ color: 'var(--amber)', border: '1px solid var(--border)' }}>
            + Add step
          </button>
        </div>
      </section>

      <section className="rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: 'var(--text-dim)' }}>Notes & Variations</h2>
        <div className="flex flex-col gap-4">
          {[{ label: 'Notes', field: 'notes' as const }, { label: 'Variations', field: 'variations' as const }].map(f => (
            <div key={f.field}>
              <label className="block mb-1.5" style={labelStyle}>{f.label}</label>
              <textarea className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={inputStyle}
                rows={3} value={form[f.field]} onChange={e => set(f.field, e.target.value)} />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-center" style={{ color: '#e07040' }}>{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-sm" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: 'var(--amber)', color: '#0d0d0f' }}>
          {saving ? 'Saving…' : form.id ? 'Save changes' : `Create ${modelType}`}
        </button>
      </div>
    </form>
  );
}
