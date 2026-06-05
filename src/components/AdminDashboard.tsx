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
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--amber)' }}>Admin Dashboard</h1>
        <button onClick={logout} className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        {[
          { label: 'Cocktails', count: cocktails.length },
          { label: 'Syrups', count: syrups.length },
          { label: 'Infusions', count: infusions.length },
          { label: 'Liqueurs', count: liqueurs.length },
          { label: 'Shrubs', count: shrubs.length },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--amber)' }}>{s.count}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Cocktails */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Cocktails</h2>
          <Link href="/admin/cocktails/new"
            className="text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: 'var(--amber)', color: '#0d0d0f' }}>
            + Add cocktail
          </Link>
        </div>
        {cocktails.length === 0 ? (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-dim)' }}>No cocktails yet.</p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {cocktails.map((c, i) => (
              <div key={c.id}
                className="flex items-center justify-between px-5 py-3 gap-4"
                style={{
                  background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                  borderBottom: i < cocktails.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {[c.category, c.baseSpirit].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {c.rating > 0 && (
                  <span className="text-xs" style={{ color: 'var(--amber)' }}>★ {c.rating}</span>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/cocktails/${c.id}`} className="text-xs px-2.5 py-1.5 rounded"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    View
                  </Link>
                  <Link href={`/admin/cocktails/${c.id}/edit`} className="text-xs px-2.5 py-1.5 rounded"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Edit
                  </Link>
                  <button onClick={() => deleteCocktail(c.id, c.name)}
                    className="text-xs px-2.5 py-1.5 rounded transition-colors"
                    style={{ color: '#e07040', border: '1px solid var(--border)' }}>
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
        <section key={section.label} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{section.label}</h2>
            <Link href={`/admin/components/new?type=${section.slug}`}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              + Add
            </Link>
          </div>
          {section.items.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--text-dim)' }}>None yet.</p>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {section.items.map((item, i) => (
                <div key={item.id}
                  className="flex items-center justify-between px-5 py-3 gap-4"
                  style={{
                    background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                    borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                  <span className="font-medium text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--text)' }}>{item.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/components/${item.id}/edit?type=${section.modelType}`}
                      className="text-xs px-2.5 py-1.5 rounded"
                      style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Edit
                    </Link>
                    <button onClick={() => deleteComponent(item.id, section.modelType, item.name)}
                      className="text-xs px-2.5 py-1.5 rounded"
                      style={{ color: '#e07040', border: '1px solid var(--border)' }}>
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
