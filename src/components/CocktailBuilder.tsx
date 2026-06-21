'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type StepKey = 'spirit' | 'modifier' | 'sweetener' | 'acid' | 'accent';

const STANDARD_OPTIONS: Record<StepKey, string[]> = {
  spirit: [
    'Bourbon', 'Rye Whiskey', 'Scotch', 'Irish Whiskey', 'Vodka', 'Gin',
    'Tequila (Blanco)', 'Tequila (Reposado)', 'Mezcal', 'White Rum', 'Aged Rum',
    'Brandy', 'Cognac', 'Calvados', 'Pisco',
  ],
  modifier: [
    'Sweet Vermouth', 'Dry Vermouth', 'Blanc Vermouth', 'Campari', 'Aperol',
    'Cynar', 'Amaro Nonino', 'Averna', 'Fernet-Branca', 'St-Germain',
    'Lillet Blanc', 'Green Chartreuse', 'Yellow Chartreuse', 'Bénédictine', 'Port',
  ],
  sweetener: [
    'Simple Syrup', 'Rich Demerara Syrup', 'Honey Syrup', 'Maple Syrup',
    'Agave Nectar', 'Grenadine', 'Orgeat', 'Falernum', 'Brown Sugar Syrup',
    'Cinnamon Syrup', 'Ginger Syrup', 'Raspberry Syrup', 'Passion Fruit Syrup',
    'Peach Syrup', 'Vanilla Syrup',
  ],
  acid: [
    'Fresh Lemon Juice', 'Fresh Lime Juice', 'Fresh Grapefruit Juice',
    'Fresh Orange Juice', 'Yuzu Juice', 'Pineapple Juice', 'Verjuice',
    'Apple Cider Vinegar', 'Champagne Vinegar', 'Tamarind',
  ],
  accent: [
    'Angostura Bitters', "Peychaud's Bitters", 'Orange Bitters', 'Mole Bitters',
    'Cardamom Bitters', 'Absinthe (rinse)', 'Maraschino Liqueur', 'Cointreau',
    'Grand Marnier', 'Crème de Cassis', 'Crème de Violette', 'Mezcal (float)',
    'Islay Scotch (float)', 'Saline Solution', 'Activated Charcoal',
  ],
};

const STEPS: { key: StepKey; label: string; description: string }[] = [
  { key: 'spirit', label: 'Base Spirit', description: 'The backbone of the drink' },
  { key: 'modifier', label: 'Modifier', description: 'Vermouth, aperitif, or secondary spirit' },
  { key: 'sweetener', label: 'Sweetener', description: 'Syrup, honey, or sweet liqueur' },
  { key: 'acid', label: 'Acid', description: 'Citrus, shrub, or verjuice' },
  { key: 'accent', label: 'Accent', description: 'Bitters, liqueur, or something unexpected' },
];

type Choice = { name: string; reason: string };
type StepStatus = 'pending' | 'loading' | 'ready' | 'chosen' | 'skipped';
type HouseComponent = { name: string; step: StepKey };

type Assembled = {
  method: string;
  glass: string;
  ice: string;
  ingredients: { name: string; amount: string }[];
  garnish: string;
  ratioNotes: string;
};

const statusColor: Record<StepStatus, string> = {
  pending: 'var(--text-dim)',
  loading: 'var(--amber)',
  ready: 'var(--text-muted)',
  chosen: 'var(--text)',
  skipped: 'var(--text-dim)',
};

export default function CocktailBuilder({ houseComponents }: { houseComponents: HouseComponent[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<'inspiration' | 'building' | 'assembling' | 'review' | 'saving'>('inspiration');
  const [inspiration, setInspiration] = useState('');
  const [startingComponent, setStartingComponent] = useState<HouseComponent | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [activeStep, setActiveStep] = useState<StepKey>('spirit');
  const [statuses, setStatuses] = useState<Record<StepKey, StepStatus>>({
    spirit: 'pending', modifier: 'pending', sweetener: 'pending', acid: 'pending', accent: 'pending',
  });
  const [suggestions, setSuggestions] = useState<Record<StepKey, Choice[]>>({
    spirit: [], modifier: [], sweetener: [], acid: [], accent: [],
  });
  const [choices, setChoices] = useState<Record<StepKey, Choice | null>>({
    spirit: null, modifier: null, sweetener: null, acid: null, accent: null,
  });
  const [assembled, setAssembled] = useState<Assembled | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);

  const getChosen = useCallback((currentChoices: Record<StepKey, Choice | null>) => {
    return STEPS
      .filter(s => currentChoices[s.key] !== null && statuses[s.key] === 'chosen')
      .map(s => ({ step: s.key, name: currentChoices[s.key]!.name }));
  }, [statuses]);

  const fetchSuggestions = useCallback(async (step: StepKey, currentChoices: Record<StepKey, Choice | null>) => {
    setStatuses(prev => ({ ...prev, [step]: 'loading' }));
    try {
      const chosen = STEPS
        .filter(s => currentChoices[s.key] !== null && s.key !== step)
        .map(s => ({ step: s.key, name: currentChoices[s.key]!.name }));

      const res = await fetch('/api/build/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspiration, step, chosen }),
      });
      const data = await res.json();
      setSuggestions(prev => ({ ...prev, [step]: data.suggestions || [] }));
      setStatuses(prev => ({ ...prev, [step]: 'ready' }));
    } catch {
      setStatuses(prev => ({ ...prev, [step]: 'ready' }));
    }
  }, [inspiration]);

  const startBuilding = (ing: string, component?: HouseComponent) => {
    setInspiration(ing);
    setStartingComponent(component ?? null);
    setPhase('building');

    if (component) {
      const preChoice = { name: component.name, reason: 'Your house component' };
      setChoices(prev => ({ ...prev, [component.step]: preChoice }));
      setStatuses(prev => ({ ...prev, [component.step]: 'chosen' }));
      // Start at the first step that isn't pre-chosen
      const firstFree = STEPS.find(s => s.key !== component.step);
      setActiveStep(firstFree?.key ?? 'spirit');
    } else {
      setActiveStep('spirit');
    }
  };

  // Fetch suggestions when phase starts or active step changes
  useEffect(() => {
    if (phase !== 'building') return;
    if (statuses[activeStep] === 'pending') {
      fetchSuggestions(activeStep, choices);
    }
  }, [phase, activeStep, statuses, choices, fetchSuggestions]);

  const nextPendingStep = (currentChoices: Record<StepKey, Choice | null>, currentStatuses: Record<StepKey, StepStatus>) => {
    return STEPS.find(s => currentStatuses[s.key] === 'pending' || currentStatuses[s.key] === 'loading' || currentStatuses[s.key] === 'ready')?.key ?? null;
  };

  const handleChoose = (step: StepKey, choice: Choice) => {
    const newChoices = { ...choices, [step]: choice };
    const newStatuses = { ...statuses, [step]: 'chosen' as StepStatus };
    setChoices(newChoices);
    setStatuses(newStatuses);

    const next = nextPendingStep(newChoices, newStatuses);
    if (next) {
      setActiveStep(next);
      if (newStatuses[next] === 'pending') {
        fetchSuggestions(next, newChoices);
      }
    } else {
      assemble(newChoices);
    }
  };

  const handleSkip = (step: StepKey) => {
    const newStatuses = { ...statuses, [step]: 'skipped' as StepStatus };
    setStatuses(newStatuses);

    const next = nextPendingStep(choices, newStatuses);
    if (next) {
      setActiveStep(next);
      if (newStatuses[next] === 'pending') {
        fetchSuggestions(next, choices);
      }
    } else {
      assemble(choices);
    }
  };

  const handleCustom = (step: StepKey) => {
    if (!customInput.trim()) return;
    handleChoose(step, { name: customInput.trim(), reason: 'Custom choice' });
    setCustomInput('');
  };

  const handleStepClick = (step: StepKey) => {
    const s = statuses[step];
    if (s === 'chosen' || s === 'skipped' || s === 'ready') {
      // Reset this step and all subsequent ones
      const stepIdx = STEPS.findIndex(st => st.key === step);
      const newStatuses = { ...statuses };
      const newChoices = { ...choices };
      STEPS.forEach((st, i) => {
        if (i >= stepIdx) {
          newStatuses[st.key] = 'pending';
          newChoices[st.key] = null;
        }
      });
      setStatuses(newStatuses);
      setChoices(newChoices);
      setSuggestions(prev => {
        const next = { ...prev };
        STEPS.forEach((st, i) => { if (i >= stepIdx) next[st.key] = []; });
        return next;
      });
      setActiveStep(step);
      setAssembled(null);
      setPhase('building');
      fetchSuggestions(step, newChoices);
    }
  };

  const assemble = async (finalChoices: Record<StepKey, Choice | null>) => {
    setPhase('assembling');
    const chosen = STEPS
      .filter(s => finalChoices[s.key] !== null && statuses[s.key] !== 'skipped')
      .map(s => ({ step: s.key, name: finalChoices[s.key]!.name }));

    // Also add inspiration as potential ingredient
    const allChosen = [{ step: 'inspiration', name: inspiration }, ...chosen];

    try {
      const res = await fetch('/api/build/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspiration, chosen: allChosen }),
      });
      const data = await res.json();
      setAssembled(data);
      setDraftName('');
      setPhase('review');
    } catch {
      setPhase('review');
    }
  };

  const suggestNames = async () => {
    if (!assembled) return;
    setLoadingNames(true);
    setNameSuggestions([]);
    try {
      const res = await fetch('/api/build/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspiration,
          ingredients: assembled.ingredients,
          method: assembled.method,
        }),
      });
      const data = await res.json();
      setNameSuggestions(data.names || []);
    } finally {
      setLoadingNames(false);
    }
  };

  const saveDraft = async () => {
    if (!draftName.trim()) return;
    setSaving(true);
    const steps = STEPS.map(s => ({
      step: s.key,
      label: s.label,
      choice: choices[s.key],
      skipped: statuses[s.key] === 'skipped',
    }));
    await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: draftName, inspiration, steps, assembled, notes: draftNotes }),
    });
    router.push('/drafts');
  };

  const chosenCount = STEPS.filter(s => statuses[s.key] === 'chosen').length;

  // ─── Phases ──────────────────────────────────────────────────────────────

  if (phase === 'inspiration') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-dim)' }}>Recipe Builder</p>
          <h1 className="font-serif-display italic text-5xl mb-4" style={{ color: 'var(--text)' }}>Start with an inspiration</h1>
          <div className="w-16 h-px mx-auto mb-4" style={{ background: 'var(--amber)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            What ingredient, flavor, or house component is sparking this idea?
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="e.g. autumn spice, smoked honey, fig…"
            value={inspiration}
            onChange={e => setInspiration(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inspiration.trim() && startBuilding(inspiration.trim(), startingComponent ?? undefined)}
            autoFocus
            className="w-full px-4 py-4 text-base outline-none bg-transparent text-center"
            style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
          />

          {startingComponent && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Starting with</span>
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--amber)', color: 'white' }}>
                {startingComponent.name}
              </span>
              <button
                onClick={() => setStartingComponent(null)}
                className="text-xs transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-dim)' }}
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={() => inspiration.trim() && startBuilding(inspiration.trim(), startingComponent ?? undefined)}
            disabled={!inspiration.trim()}
            className="w-full mt-5 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-40 hover:opacity-80"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            Start building
          </button>
        </div>

        {houseComponents.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] mb-2 text-center" style={{ color: 'var(--text-dim)' }}>
              Start with a house component
            </p>
            <p className="text-xs mb-4 text-center" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
              It'll be pre-selected — AI suggestions for other steps will factor it in
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {houseComponents.map(c => {
                const isSelected = startingComponent?.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      if (isSelected) {
                        setStartingComponent(null);
                      } else {
                        setStartingComponent(c);
                        if (!inspiration.trim()) setInspiration(c.name);
                      }
                    }}
                    className="text-xs px-4 py-2 rounded-full transition-all hover:opacity-80"
                    style={{
                      border: `1px solid ${isSelected ? 'var(--amber)' : 'var(--border)'}`,
                      color: isSelected ? 'var(--amber)' : 'var(--text-muted)',
                      background: isSelected ? 'rgba(180,120,40,0.08)' : 'transparent',
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'assembling') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif-display italic text-2xl mb-3" style={{ color: 'var(--text-muted)' }}>
            Assembling your recipe…
          </p>
          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-dim)' }}>
            Working out the ratios
          </p>
        </div>
      </div>
    );
  }

  // ─── Building phase ───────────────────────────────────────────────────────

  const activeStepConfig = STEPS.find(s => s.key === activeStep)!;
  const activeSuggestions = suggestions[activeStep];
  const activeStatus = statuses[activeStep];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 w-full">
      <div className="flex gap-12">

        {/* Left: Progress + recipe preview */}
        <div className="w-64 shrink-0">
          <div className="sticky top-28">
            <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-dim)' }}>
              Inspiration
            </p>
            <p className="font-serif-display italic text-lg mb-8" style={{ color: 'var(--amber)' }}>
              {inspiration}
            </p>

            <div className="flex flex-col gap-1 mb-8">
              {STEPS.map(s => {
                const status = statuses[s.key];
                const choice = choices[s.key];
                const isActive = s.key === activeStep && phase === 'building';
                return (
                  <button
                    key={s.key}
                    onClick={() => handleStepClick(s.key)}
                    className="text-left py-3 transition-opacity"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: status === 'pending' ? 0.4 : 1,
                      cursor: status === 'pending' ? 'default' : 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs" style={{ color: isActive ? 'var(--amber)' : statusColor[status] }}>
                        {status === 'chosen' ? '●' : status === 'skipped' ? '○' : isActive ? '▶' : '○'}
                      </span>
                      <span className="text-xs uppercase tracking-[0.14em]"
                        style={{ color: isActive ? 'var(--amber)' : statusColor[status] }}>
                        {s.label}
                      </span>
                    </div>
                    {choice && status === 'chosen' && (
                      <div className="pl-4 flex items-center gap-2">
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{choice.name}</p>
                        {startingComponent?.step === s.key && choice.reason === 'Your house component' && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(180,120,40,0.15)', color: 'var(--amber)' }}>⌂</span>
                        )}
                      </div>
                    )}
                    {status === 'skipped' && (
                      <p className="text-xs pl-4" style={{ color: 'var(--text-dim)' }}>Skipped</p>
                    )}
                  </button>
                );
              })}
            </div>

            {phase === 'review' && assembled && (
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                <p className="uppercase tracking-[0.14em] mb-1">{assembled.method} · {assembled.glass}</p>
                {assembled.garnish && <p>Garnish: {assembled.garnish}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active step or review */}
        <div className="flex-1">

          {phase === 'building' && (
            <>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-dim)' }}>
                  Step {STEPS.findIndex(s => s.key === activeStep) + 1} of {STEPS.length}
                </p>
                <h2 className="font-serif-display italic text-4xl mb-2" style={{ color: 'var(--text)' }}>
                  {activeStepConfig.label}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{activeStepConfig.description}</p>
              </div>

              {activeStatus === 'loading' ? (
                <div className="py-16 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Finding pairings for {inspiration}…</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {activeSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleChoose(activeStep, s)}
                        className="text-left p-5 transition-all hover:opacity-80 group"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                      >
                        <p className="font-serif-display text-lg mb-2 group-hover:opacity-80" style={{ color: 'var(--text)' }}>
                          {s.name}
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {s.reason}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Standard options */}
                  <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>
                      More options
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_OPTIONS[activeStep].map(name => (
                        <button
                          key={name}
                          onClick={() => handleChoose(activeStep, { name, reason: '' })}
                          className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Add your own…"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustom(activeStep)}
                      className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
                      style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    <button
                      onClick={() => handleCustom(activeStep)}
                      disabled={!customInput.trim()}
                      className="text-xs uppercase tracking-[0.18em] px-4 py-2.5 transition-opacity disabled:opacity-30 hover:opacity-70"
                      style={{ color: 'var(--amber)' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => handleSkip(activeStep)}
                      className="text-xs uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      Skip →
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {phase === 'review' && assembled && (
            <>
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: 'var(--text-dim)' }}>
                  {chosenCount} ingredient{chosenCount !== 1 ? 's' : ''} chosen
                </p>
                <h2 className="font-serif-display italic text-4xl mb-2" style={{ color: 'var(--text)' }}>
                  Your recipe
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{assembled.ratioNotes}</p>
              </div>

              {/* Assembled recipe card */}
              <div className="mb-8 p-6" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div className="flex gap-6 text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
                  <span className="uppercase tracking-[0.14em]">{assembled.method}</span>
                  <span className="uppercase tracking-[0.14em]">{assembled.glass}</span>
                  {assembled.ice && <span className="uppercase tracking-[0.14em]">{assembled.ice}</span>}
                </div>

                <div className="mb-6">
                  {assembled.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-baseline justify-between py-2.5"
                      style={{ borderBottom: i < assembled.ingredients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-sm" style={{ color: 'var(--text)' }}>{ing.name}</span>
                      <span className="text-sm font-mono ml-4 shrink-0" style={{ color: 'var(--amber)' }}>{ing.amount}</span>
                    </div>
                  ))}
                </div>

                {assembled.garnish && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Garnish </span>
                    {assembled.garnish}
                  </p>
                )}
              </div>

              {/* Save as draft */}
              <div className="flex flex-col gap-4 max-w-md">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Name this recipe…"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    autoFocus
                    className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                    style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={suggestNames}
                    disabled={loadingNames}
                    className="shrink-0 text-xs uppercase tracking-[0.14em] transition-opacity hover:opacity-60 disabled:opacity-40"
                    style={{ color: 'var(--amber)' }}
                  >
                    {loadingNames ? '…' : '✦ Suggest'}
                  </button>
                </div>
                {nameSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nameSuggestions.map(name => (
                      <button
                        key={name}
                        onClick={() => { setDraftName(name); setNameSuggestions([]); }}
                        className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-70"
                        style={{ border: '1px solid var(--amber)', color: 'var(--amber)' }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  placeholder="Notes (optional)…"
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 text-sm outline-none bg-transparent resize-none"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <div className="flex gap-4">
                  <button
                    onClick={saveDraft}
                    disabled={!draftName.trim() || saving}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-40 hover:opacity-80"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}
                  >
                    {saving ? 'Saving…' : 'Save to Drafts'}
                  </button>
                  <button
                    onClick={() => { setPhase('inspiration'); setInspiration(''); setStartingComponent(null); setStatuses({ spirit: 'pending', modifier: 'pending', sweetener: 'pending', acid: 'pending', accent: 'pending' }); setChoices({ spirit: null, modifier: null, sweetener: null, acid: null, accent: null }); setSuggestions({ spirit: [], modifier: [], sweetener: [], acid: [], accent: [] }); setAssembled(null); }}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity hover:opacity-60"
                    style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    Start over
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
