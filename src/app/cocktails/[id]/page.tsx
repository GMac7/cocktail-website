import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cocktail, syrups, infusions, liqueurs, shrubs] = await Promise.all([
    prisma.cocktail.findUnique({
      where: { id: parseInt(id) },
      include: {
        ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } },
        instructions: { orderBy: { stepNumber: 'asc' } },
      },
    }),
    prisma.syrup.findMany({ select: { name: true } }),
    prisma.infusion.findMany({ select: { name: true } }),
    prisma.liqueur.findMany({ select: { name: true } }),
    prisma.shrub.findMany({ select: { name: true } }),
  ]);
  if (!cocktail) notFound();

  // Build a lookup: ingredient name → URL to its component page
  const componentLink: Record<string, string> = {};
  for (const { name } of syrups) componentLink[name] = `/components?open=${encodeURIComponent(name)}`;
  for (const { name } of infusions) componentLink[name] = `/components?open=${encodeURIComponent(name)}`;
  for (const { name } of liqueurs) componentLink[name] = `/components?open=${encodeURIComponent(name)}`;
  for (const { name } of shrubs) componentLink[name] = `/components?open=${encodeURIComponent(name)}`;

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
    <div className="max-w-3xl mx-auto px-6 py-16 w-full">
      <Link href="/cocktails" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] mb-12 transition-opacity hover:opacity-60"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to collection
      </Link>

      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-dim)' }}>
          {[cocktail.baseSpirit, cocktail.category].filter(Boolean).join(' · ')}
        </p>
        <h1 className="font-serif-display italic text-5xl mb-4" style={{ color: 'var(--text)' }}>
          {cocktail.name}
        </h1>
        <div className="w-16 h-px mx-auto mb-4" style={{ background: 'var(--amber)' }} />
        {cocktail.rating > 0 && (
          <p className="text-sm font-mono mb-4" style={{ color: 'var(--amber)' }}>
            {cocktail.rating}/10
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map(t => (
              <span key={t} className="text-xs uppercase tracking-[0.1em] px-3 py-1"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-12">
        {/* Meta grid */}
        <section className="py-8" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
            {meta.map(m => (
              <div key={m.label}>
                <div className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--text-dim)' }}>
                  {m.label}
                </div>
                <div className="text-sm" style={{ color: 'var(--text)' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ingredients */}
        <section>
          <h2 className="font-serif-display italic text-2xl mb-6" style={{ color: 'var(--text)' }}>
            Ingredients
          </h2>
          <div>
            {cocktail.ingredients.map((ci, i) => (
              <div key={ci.id}
                className="flex items-baseline justify-between py-3.5"
                style={{
                  borderBottom: i < cocktail.ingredients.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {componentLink[ci.ingredient.name] ? (
                    <Link href={componentLink[ci.ingredient.name]}
                      className="underline underline-offset-2 decoration-dotted transition-opacity hover:opacity-60"
                      style={{ color: 'var(--amber)' }}>
                      {ci.ingredient.name}
                    </Link>
                  ) : ci.ingredient.name}
                  {ci.notes && <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>{ci.notes}</span>}
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
            <h2 className="font-serif-display italic text-2xl mb-6" style={{ color: 'var(--text)' }}>
              Instructions
            </h2>
            <ol className="flex flex-col gap-6">
              {cocktail.instructions.map(step => (
                <li key={step.id} className="flex gap-5">
                  <span className="shrink-0 font-serif-display italic text-xl mt-0.5"
                    style={{ color: 'var(--amber)' }}>
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--text)' }}>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Notes */}
        {cocktail.notes && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Notes</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{cocktail.notes}</p>
          </section>
        )}

        {/* Variations */}
        {cocktail.variations && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Variations</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{cocktail.variations}</p>
          </section>
        )}

        <div className="flex justify-center pt-4">
          <Link href={`/admin/cocktails/${cocktail.id}/edit`}
            className="text-xs uppercase tracking-[0.18em] px-6 py-3 rounded-full border transition-colors hover:opacity-60"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Edit recipe
          </Link>
        </div>
      </div>
    </div>
  );
}
