'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Component = {
  id: number;
  name: string;
  type: string;
  difficulty: string;
  prepTime: string;
  shelfLife: string;
  yield: string;
  tags: string[];
  usedIn: string[];
  ingredients: { amount: string; name: string }[];
  instructions: string[];
  notes: string;
};

type Tab = 'syrups' | 'infusions' | 'liqueurs' | 'shrubs';

const tabs: { key: Tab; label: string }[] = [
  { key: 'syrups', label: 'Syrups' },
  { key: 'infusions', label: 'Infusions' },
  { key: 'liqueurs', label: 'Liqueurs' },
  { key: 'shrubs', label: 'Shrubs' },
];

function ComponentCard({ item, modelType, highlighted, cocktailIdByName }: { item: Component; modelType: string; highlighted?: boolean; cocktailIdByName: Record<string, number> }) {
  const [expanded, setExpanded] = useState(false);
  const hasRecipe = item.ingredients.length > 0 || item.instructions.length > 0;

  return (
    <div
      id={`component-${item.name}`}
      className="py-6 transition-colors duration-700"
      style={{ borderBottom: '1px solid var(--border)', background: highlighted ? 'var(--amber-dim)' : 'transparent' }}
    >
      {/* Summary — always visible */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-serif-display text-lg" style={{ color: 'var(--text)' }}>{item.name}</h3>
        <span className="shrink-0 text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>{item.type}</span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs mb-4">
        {item.prepTime && <div><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Prep </span><span style={{ color: 'var(--text-muted)' }}>{item.prepTime}</span></div>}
        {item.shelfLife && <div><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Shelf life </span><span style={{ color: 'var(--text-muted)' }}>{item.shelfLife}</span></div>}
        {item.yield && <div><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Yield </span><span style={{ color: 'var(--text-muted)' }}>{item.yield}</span></div>}
      </div>

      <div className="flex items-center justify-between">
        {hasRecipe ? (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60 flex items-center gap-1.5"
            style={{ color: 'var(--amber)' }}
          >
            {expanded ? 'Hide recipe' : 'View recipe'}
            <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
          </button>
        ) : <span />}
        <Link href={`/admin/components/${item.id}/edit?type=${modelType}`}
          className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-dim)' }}>
          Edit
        </Link>
      </div>

      {/* Expandable recipe */}
      {expanded && (
        <div className="mt-5 flex flex-col gap-5" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          {item.ingredients.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Ingredients</p>
              {item.ingredients.map((ing, i) => {
                const isHeader = !ing.amount && ing.name.startsWith('**');
                const label = ing.name.replace(/\*\*/g, '');
                if (isHeader) return (
                  <div key={i} className="text-xs uppercase tracking-[0.14em] mt-4 mb-1 first:mt-0" style={{ color: 'var(--text-dim)' }}>{label}</div>
                );
                return (
                  <div key={i} className="flex items-baseline justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm" style={{ color: 'var(--text)' }}>{ing.name}</span>
                    {ing.amount && <span className="text-sm font-mono ml-4 shrink-0" style={{ color: 'var(--amber)' }}>{ing.amount}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {item.instructions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>Instructions</p>
              <ol className="flex flex-col gap-3">
                {item.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 font-serif-display italic text-lg" style={{ color: 'var(--amber)' }}>{i + 1}</span>
                    <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--text-muted)' }}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {item.notes && (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>{item.notes}</p>
          )}

          {item.usedIn.length > 0 && (
            <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Used in{' '}
              {item.usedIn.map((name, i) => {
                const id = cocktailIdByName[name];
                return (
                  <span key={name}>
                    {i > 0 && ', '}
                    {id ? (
                      <Link href={`/cocktails/${id}`}
                        className="underline underline-offset-2 decoration-dotted transition-opacity hover:opacity-60"
                        style={{ color: 'var(--amber)' }}>
                        {name}
                      </Link>
                    ) : name}
                  </span>
                );
              })}
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map(t => (
                <span key={t} className="text-xs uppercase tracking-[0.1em] px-3 py-1"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const labelMap: Record<Tab, string> = { syrups: 'syrup', infusions: 'infusion', liqueurs: 'liqueur', shrubs: 'shrub' };
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ color: 'var(--text-dim)' }}>
      <p className="font-serif-display italic text-xl" style={{ color: 'var(--text-muted)' }}>No {labelMap[tab]}s yet.</p>
      <Link href={`/admin/components/new?type=${tab.slice(0, -1)}`}
        className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity hover:opacity-80"
        style={{ background: 'var(--text)', color: 'var(--bg)' }}>
        Add a {labelMap[tab]}
      </Link>
    </div>
  );
}

export default function ComponentsClient({ syrups, infusions, liqueurs, shrubs, cocktailIdByName }: {
  syrups: Component[];
  infusions: Component[];
  liqueurs: Component[];
  shrubs: Component[];
  cocktailIdByName: Record<string, number>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('syrups');
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const data: Record<Tab, Component[]> = { syrups, infusions, liqueurs, shrubs };
  const modelType: Record<Tab, string> = { syrups: 'syrup', infusions: 'infusion', liqueurs: 'liqueur', shrubs: 'shrub' };

  useEffect(() => {
    const open = searchParams.get('open');
    if (!open) return;

    const tabMap: Record<Tab, Component[]> = { syrups, infusions, liqueurs, shrubs };
    for (const [tab, items] of Object.entries(tabMap) as [Tab, Component[]][]) {
      if (items.some(i => i.name === open)) {
        setActiveTab(tab);
        setHighlightedName(open);
        setTimeout(() => {
          document.getElementById(`component-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => setHighlightedName(null), 2500);
        break;
      }
    }
  }, [searchParams, syrups, infusions, liqueurs, shrubs]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 w-full">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-5" style={{ color: 'var(--text-dim)' }}>
          In the Cabinet
        </p>
        <h1 className="font-serif-display italic text-5xl mb-5" style={{ color: 'var(--text)' }}>
          House Components
        </h1>
        <div className="w-16 h-px mx-auto mb-5" style={{ background: 'var(--amber)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Syrups, infusions, liqueurs, and shrubs made in-house
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-8 mb-4 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
            style={{ color: activeTab === t.key ? 'var(--amber)' : 'var(--text-muted)' }}
          >
            {t.label} <span style={{ color: 'var(--text-dim)' }}>({data[t.key].length})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {data[activeTab].length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div>
          {data[activeTab].map(item => (
            <ComponentCard key={`${activeTab}-${item.id}`} item={item} modelType={modelType[activeTab]} highlighted={item.name === highlightedName} cocktailIdByName={cocktailIdByName} />
          ))}
        </div>
      )}
    </div>
  );
}
