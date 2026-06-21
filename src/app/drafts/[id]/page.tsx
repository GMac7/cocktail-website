'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Assembled = {
  method?: string;
  glass?: string;
  ice?: string;
  ingredients?: { name: string; amount: string }[];
  garnish?: string;
  ratioNotes?: string;
};

type Step = {
  step: string;
  label: string;
  choice: { name: string; reason: string } | null;
  skipped: boolean;
};

type Draft = {
  id: number;
  name: string;
  inspiration: string;
  steps: string;
  assembled: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export default function DraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/drafts/${id}`)
      .then(r => r.json())
      .then((d: Draft) => {
        setDraft(d);
        setName(d.name);
        setNotes(d.notes);
      });
  }, [id]);

  if (!draft) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading…</p>
    </div>
  );

  const assembled: Assembled = JSON.parse(draft.assembled || '{}');
  const steps: Step[] = JSON.parse(draft.steps || '[]');

  const saveEdits = async () => {
    setSaving(true);
    await fetch(`/api/drafts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, notes }),
    });
    setSaving(false);
  };

  const promote = async () => {
    setPromoting(true);
    const res = await fetch(`/api/drafts/${id}/promote`, { method: 'POST' });
    const { cocktailId } = await res.json();
    router.push(`/admin/cocktails/${cocktailId}/edit`);
  };

  const deleteDraft = async () => {
    if (!confirm(`Delete "${draft.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
    router.push('/drafts');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 w-full">
      <Link href="/drafts" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] mb-12 transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-muted)' }}>
        ← Drafts
      </Link>

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>
          Inspired by {draft.inspiration}
        </p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={saveEdits}
          className="w-full font-serif-display italic text-4xl outline-none bg-transparent"
          style={{ color: 'var(--text)', borderBottom: '1px solid transparent' }}
          onFocus={e => (e.target.style.borderBottomColor = 'var(--border)')}
        />
      </div>

      <div className="grid gap-10">
        {/* Assembled recipe */}
        {assembled.ingredients && assembled.ingredients.length > 0 && (
          <section>
            <h2 className="font-serif-display italic text-2xl mb-6" style={{ color: 'var(--text)' }}>Recipe</h2>
            <div className="flex gap-6 text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
              {assembled.method && <span className="uppercase tracking-[0.14em]">{assembled.method}</span>}
              {assembled.glass && <span className="uppercase tracking-[0.14em]">{assembled.glass}</span>}
              {assembled.ice && <span className="uppercase tracking-[0.14em]">{assembled.ice}</span>}
            </div>
            {assembled.ingredients.map((ing, i) => (
              <div key={i} className="flex items-baseline justify-between py-3"
                style={{ borderBottom: i < assembled.ingredients!.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{ing.name}</span>
                <span className="text-sm font-mono ml-4 shrink-0" style={{ color: 'var(--amber)' }}>{ing.amount}</span>
              </div>
            ))}
            {assembled.garnish && (
              <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                <span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Garnish </span>
                {assembled.garnish}
              </p>
            )}
            {assembled.ratioNotes && (
              <p className="text-xs mt-3 italic" style={{ color: 'var(--text-dim)' }}>{assembled.ratioNotes}</p>
            )}
          </section>
        )}

        {/* Build steps */}
        <section>
          <h2 className="font-serif-display italic text-2xl mb-6" style={{ color: 'var(--text)' }}>How it was built</h2>
          <div>
            {steps.filter(s => !s.skipped && s.choice).map((s, i) => (
              <div key={i} className="flex gap-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs uppercase tracking-[0.14em] w-24 shrink-0 pt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {s.label}
                </span>
                <div>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{s.choice!.name}</p>
                  {s.choice!.reason !== 'Custom choice' && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.choice!.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveEdits}
            placeholder="Tasting notes, ideas for refinement…"
            rows={4}
            className="w-full text-sm leading-relaxed outline-none bg-transparent resize-none"
            style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
          />
          {saving && <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Saving…</p>}
        </section>

        {/* Actions */}
        <section className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={promote}
            disabled={promoting}
            className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
            style={{ background: 'var(--amber)', color: 'white' }}
          >
            {promoting ? 'Moving…' : 'Move to Collection →'}
          </button>
          <Link href="/build"
            className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity hover:opacity-70"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Build another
          </Link>
          <button
            onClick={deleteDraft}
            disabled={deleting}
            className="ml-auto text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
            style={{ color: '#a14a4a' }}
          >
            {deleting ? 'Deleting…' : 'Delete draft'}
          </button>
        </section>
      </div>
    </div>
  );
}
