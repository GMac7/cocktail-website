import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Drafts — Pours by Mackay',
};

export default async function DraftsPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== process.env.SESSION_SECRET) redirect('/admin');

  const drafts = await prisma.draftCocktail.findMany({ orderBy: { updatedAt: 'desc' } });

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 w-full">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--text-dim)' }}>Unproven</p>
        <h1 className="font-serif-display italic text-5xl mb-5" style={{ color: 'var(--text)' }}>Draft Recipes</h1>
        <div className="w-16 h-px mx-auto mb-5" style={{ background: 'var(--amber)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Ideas waiting to be tested and refined
        </p>
      </div>

      <div className="flex justify-end mb-8">
        <Link href="/build"
          className="text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}>
          + New recipe
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-serif-display italic text-2xl" style={{ color: 'var(--text-muted)' }}>
            No drafts yet.
          </p>
          <Link href="/build"
            className="text-xs uppercase tracking-[0.18em] underline underline-offset-4"
            style={{ color: 'var(--amber)' }}>
            Start building a recipe
          </Link>
        </div>
      ) : (
        <div>
          {drafts.map(draft => {
            type Assembled = { method?: string; glass?: string; ingredients?: { name: string; amount: string }[] };
            const assembled: Assembled = JSON.parse(draft.assembled || '{}');
            const ingredientCount = assembled.ingredients?.length ?? 0;
            return (
              <Link key={draft.id} href={`/drafts/${draft.id}`} className="group block py-6 transition-opacity hover:opacity-70"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="font-serif-display text-xl" style={{ color: 'var(--text)' }}>{draft.name}</h2>
                  <span className="text-xs shrink-0 mt-1" style={{ color: 'var(--text-dim)' }}>
                    {new Date(draft.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--text-muted)' }}>
                  Inspired by {draft.inspiration}
                </p>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {[assembled.method, assembled.glass, ingredientCount > 0 && `${ingredientCount} ingredients`]
                    .filter(Boolean).join(' · ')}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
