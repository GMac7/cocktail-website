'use client';

import { useState } from 'react';
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
};

type Tab = 'syrups' | 'infusions' | 'liqueurs' | 'shrubs';

const tabs: { key: Tab; label: string }[] = [
  { key: 'syrups', label: 'Syrups' },
  { key: 'infusions', label: 'Infusions' },
  { key: 'liqueurs', label: 'Liqueurs' },
  { key: 'shrubs', label: 'Shrubs' },
];

function ComponentCard({ item, modelType }: { item: Component; modelType: string }) {
  return (
    <div className="flex flex-col gap-3 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif-display text-lg" style={{ color: 'var(--text)' }}>{item.name}</h3>
        <span className="shrink-0 text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>
          {item.type}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
        {item.prepTime && (
          <div>
            <span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Prep </span>
            <span style={{ color: 'var(--text-muted)' }}>{item.prepTime}</span>
          </div>
        )}
        {item.shelfLife && (
          <div>
            <span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Shelf life </span>
            <span style={{ color: 'var(--text-muted)' }}>{item.shelfLife}</span>
          </div>
        )}
        {item.yield && (
          <div>
            <span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Yield </span>
            <span style={{ color: 'var(--text-muted)' }}>{item.yield}</span>
          </div>
        )}
      </div>
      {item.usedIn.length > 0 && (
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Used in <span style={{ color: 'var(--text-muted)' }}>{item.usedIn.join(', ')}</span>
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
      <div className="flex justify-end mt-1">
        <Link href={`/admin/components/${item.id}/edit?type=${modelType}`}
          className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
          style={{ color: 'var(--amber)' }}>
          Edit
        </Link>
      </div>
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

export default function ComponentsClient({ syrups, infusions, liqueurs, shrubs }: {
  syrups: Component[];
  infusions: Component[];
  liqueurs: Component[];
  shrubs: Component[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('syrups');

  const data: Record<Tab, Component[]> = { syrups, infusions, liqueurs, shrubs };
  const modelType: Record<Tab, string> = { syrups: 'syrup', infusions: 'infusion', liqueurs: 'liqueur', shrubs: 'shrub' };

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
            style={{
              color: activeTab === t.key ? 'var(--amber)' : 'var(--text-muted)',
            }}
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
            <ComponentCard key={item.id} item={item} modelType={modelType[activeTab]} />
          ))}
        </div>
      )}
    </div>
  );
}
