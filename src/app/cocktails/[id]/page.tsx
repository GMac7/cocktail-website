import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cocktail = await prisma.cocktail.findUnique({
    where: { id: parseInt(id) },
    include: {
      ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } },
      instructions: { orderBy: { stepNumber: 'asc' } },
    },
  });
  if (!cocktail) notFound();

  const tags: string[] = JSON.parse(cocktail.tags || '[]');

  const meta = [
    { label: 'Base Spirit', value: cocktail.baseSpirit },
    { label: 'Category', value: cocktail.category },
    { label: 'Style', value: cocktail.style },
    { label: 'Method', value: cocktail.method },
    { label: 'Glass', value: cocktail.glass },
    { label: 'Ice', value: cocktail.ice },
    { label: 'Garnish', value: cocktail.garnish },
    { label: 'ABV', value: cocktail.abv },
    { label: 'Prep Time', value: cocktail.prepTime },
    { label: 'Difficulty', value: cocktail.difficulty },
    { label: 'Origin', value: cocktail.origin },
    { label: 'Origin Date', value: cocktail.originDate },
  ].filter(m => m.value);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to collection
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--amber)' }}>
            {cocktail.name}
          </h1>
          {cocktail.rating > 0 && (
            <div className="shrink-0 text-xl font-mono px-3 py-1 rounded-lg mt-1"
              style={{ background: 'var(--bg-card)', color: 'var(--amber)', border: '1px solid var(--border)' }}>
              ★ {cocktail.rating}/10
            </div>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Meta grid */}
        <section className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {meta.map(m => (
              <div key={m.label}>
                <div className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>
                  {m.label}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ingredients */}
        <section>
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
            Ingredients
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {cocktail.ingredients.map((ci, i) => (
              <div key={ci.id}
                className="flex items-baseline justify-between px-5 py-3"
                style={{
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                  borderBottom: i < cocktail.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                  {ci.ingredient.name}
                  {ci.notes && <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>{ci.notes}</span>}
                </span>
                <span className="text-sm font-mono ml-4 shrink-0" style={{ color: 'var(--amber)' }}>
                  {ci.amount}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Instructions */}
        {cocktail.instructions.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>
              Instructions
            </h2>
            <ol className="flex flex-col gap-3">
              {cocktail.instructions.map(step => (
                <li key={step.id} className="flex gap-4 rounded-xl px-5 py-4"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: 'var(--amber-dim)', color: 'var(--amber-light)' }}>
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Notes */}
        {cocktail.notes && (
          <section className="rounded-xl px-5 py-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Notes</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{cocktail.notes}</p>
          </section>
        )}

        {/* Variations */}
        {cocktail.variations && (
          <section className="rounded-xl px-5 py-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Variations</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{cocktail.variations}</p>
          </section>
        )}

        <div className="flex justify-end">
          <Link href={`/admin/cocktails/${cocktail.id}/edit`}
            className="text-sm px-4 py-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Edit recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
