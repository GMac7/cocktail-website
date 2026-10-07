'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CocktailSummary = { id: number; name: string; category: string; baseSpirit: string; rating: number };
type ComponentSummary = { id: number; name: string; type: string };

async function handleDelete(type: 'cocktail' | 'component', id: number, modelType?: string) {
  const url = type === 'cocktail' ? `/api/cocktails/${id}` : `/api/components/${id}?type=${modelType}`;
  await fetch(url, { method: 'DELETE' });
}

export default function AdminDashboard({
  cocktails, syrups, infusions, liqueurs, shrubs,
}: {
  cocktails: CocktailSummary[];
  syrups: ComponentSummary[];
  infusions: ComponentSummary[];
  liqueurs: ComponentSummary[];
  shrubs: ComponentSummary[];
}) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.refresh();
  }

  async function deleteCocktail(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await handleDelete('cocktail', id);
    router.refresh();
  }

  async function deleteComponent(id: number, modelType: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await handleDelete('component', id, modelType);
    router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 w-full">
      <div className="flex items-center justify-between mb-12 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--text-dim)' }}>Behind the Bar</p>
          <h1 className="font-serif-display italic text-4xl" style={{ color: 'var(--text)' }}>Admin Dashboard</h1>
        </div>
        <button onClick={logout} className="text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full border transition-colors hover:opacity-60"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px mb-12" style={{ background: 'var(--border)' }}>
        {[
          { label: 'Cocktails', count: cocktails.length },
          { label: 'Syrups', count: syrups.length },
          { label: 'Infusions', count: infusions.length },
          { label: 'Liqueurs', count: liqueurs.length },
          { label: 'Shrubs', count: shrubs.length },
        ].map(s => (
          <div key={s.label} className="text-center py-6" style={{ background: 'var(--bg)' }}>
            <div className="font-serif-display italic text-3xl" style={{ color: 'var(--amber)' }}>{s.count}</div>
            <div className="text-xs uppercase tracking-[0.14em] mt-2" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cocktails */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif-display italic text-2xl" style={{ color: 'var(--text)' }}>Cocktails</h2>
          <Link href="/admin/cocktails/new"
            className="text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full transition-opacity hover:opacity-80"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}>
            + Add cocktail
          </Link>
        </div>
        {cocktails.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-dim)' }}>No cocktails yet.</p>
        ) : (
          <div>
            {cocktails.map((c, i) => (
              <div key={c.id}
                className="flex items-center justify-between py-4 gap-4"
                style={{
                  borderBottom: i < cocktails.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <div className="text-xs uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {[c.category, c.baseSpirit].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {c.rating > 0 && (
                  <span className="text-xs font-mono" style={{ color: 'var(--amber)' }}>{c.rating}/10</span>
                )}
                <div className="flex items-center gap-5 shrink-0 text-xs uppercase tracking-[0.14em]">
                  <Link href={`/cocktails/${c.id}`} style={{ color: 'var(--text-muted)' }} className="hover:opacity-60 transition-opacity">
                    View
                  </Link>
                  <Link href={`/admin/cocktails/${c.id}/edit`} style={{ color: 'var(--text-muted)' }} className="hover:opacity-60 transition-opacity">
                    Edit
                  </Link>
                  <button onClick={() => deleteCocktail(c.id, c.name)}
                    style={{ color: '#a14a4a' }} className="hover:opacity-60 transition-opacity">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Components */}
      {[
        { label: 'Syrups', items: syrups, modelType: 'syrup', slug: 'syrup' },
        { label: 'Infusions', items: infusions, modelType: 'infusion', slug: 'infusion' },
        { label: 'Liqueurs', items: liqueurs, modelType: 'liqueur', slug: 'liqueur' },
        { label: 'Shrubs', items: shrubs, modelType: 'shrub', slug: 'shrub' },
      ].map(section => (
        <section key={section.label} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif-display italic text-2xl" style={{ color: 'var(--text)' }}>{section.label}</h2>
            <Link href={`/admin/components/new?type=${section.slug}`}
              className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
              style={{ color: 'var(--amber)' }}>
              + Add
            </Link>
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-dim)' }}>None yet.</p>
          ) : (
            <div>
              {section.items.map((item, i) => (
                <div key={item.id}
                  className="flex items-center justify-between py-4 gap-4"
                  style={{
                    borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                  <span className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>{item.name}</span>
                  <div className="flex items-center gap-5 shrink-0 text-xs uppercase tracking-[0.14em]">
                    <Link href={`/admin/components/${item.id}/edit?type=${section.modelType}`}
                      style={{ color: 'var(--text-muted)' }} className="hover:opacity-60 transition-opacity">
                      Edit
                    </Link>
                    <button onClick={() => deleteComponent(item.id, section.modelType, item.name)}
                      style={{ color: '#a14a4a' }} className="hover:opacity-60 transition-opacity">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
