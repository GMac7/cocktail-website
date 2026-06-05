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

const tabs: { key: Tab; label: string; emoji: string }[] = [
  { key: 'syrups', label: 'Syrups', emoji: '🍯' },
  { key: 'infusions', label: 'Infusions', emoji: '🌿' },
  { key: 'liqueurs', label: 'Liqueurs', emoji: '🍾' },
  { key: 'shrubs', label: 'Shrubs', emoji: '🫙' },
];

function ComponentCard({ item, modelType }: { item: Component; modelType: string }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{item.name}</h3>
        <span className="shrink-0 text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          {item.type}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {item.prepTime && (
          <div>
            <div className="uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>Prep</div>
            <div style={{ color: 'var(--text-muted)' }}>{item.prepTime}</div>
          </div>
        )}
        {item.shelfLife && (
          <div>
            <div className="uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>Shelf life</div>
            <div style={{ color: 'var(--text-muted)' }}>{item.shelfLife}</div>
          </div>
        )}
        {item.yield && (
          <div>
            <div className="uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-dim)' }}>Yield</div>
            <div style={{ color: 'var(--text-muted)' }}>{item.yield}</div>
          </div>
        )}
      </div>
      {item.usedIn.length > 0 && (
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Used in: <span style={{ color: 'var(--text-muted)' }}>{item.usedIn.join(', ')}</span>
        </div>
      )}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-hover)', color: 'var(--amber-dim)', border: '1px solid var(--border)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-auto pt-1">
        <Link href={`/admin/components/${item.id}/edit?type=${modelType}`}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
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
      <p>No {labelMap[tab]}s yet.</p>
      <Link href={`/admin/components/new?type=${tab.slice(0, -1)}`}
        className="px-5 py-2.5 rounded-lg text-sm font-medium"
        style={{ background: 'var(--amber)', color: '#0d0d0f' }}>
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
    <div className="max-w-6xl mx-auto px-6 py-12 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-2" style={{ color: 'var(--amber)' }}>
          House Components
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Syrups, infusions, liqueurs, and shrubs made in-house
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === t.key ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === t.key ? 'var(--amber)' : 'var(--text-muted)',
              border: activeTab === t.key ? '1px solid var(--border)' : '1px solid transparent',
            }}
          >
            <span>{t.emoji}</span>
            {t.label}
            <span className="text-xs px-1.5 py-0.5 rounded-full ml-0.5"
              style={{ background: 'var(--bg)', color: 'var(--text-dim)' }}>
              {data[t.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {data[activeTab].length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data[activeTab].map(item => (
            <ComponentCard key={item.id} item={item} modelType={modelType[activeTab]} />
          ))}
        </div>
      )}
    </div>
  );
}
