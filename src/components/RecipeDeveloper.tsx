'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Message = { role: 'user' | 'assistant'; content: string };

type RecipeIngredient = { amount: string; name: string; notes?: string };
type RecipeCard = {
  name: string;
  concept: string;
  glass: string;
  method: string;
  ice: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  garnish: string;
  balance_notes: string;
  variations: string;
  difficulty: string;
};

const STARTERS = [
  { label: 'Base spirit', prompt: 'I want to make something with ' },
  { label: 'Mood / occasion', prompt: 'I want something that feels ' },
  { label: 'Flavour profile', prompt: 'I want it to taste ' },
  { label: 'Riff on a classic', prompt: 'I want a twist on a ' },
  { label: 'Key ingredient', prompt: 'I have some and want to use it: ' },
];

function parseRecipeFromText(text: string): RecipeCard | null {
  const match = text.match(/```recipe\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as RecipeCard;
  } catch {
    return null;
  }
}

function stripRecipeBlock(text: string): string {
  return text.replace(/```recipe[\s\S]*?```/g, '').trim();
}

function BalancePip({ label, level }: { label: string; level: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex flex-col-reverse gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm transition-all"
            style={{
              background: i <= level ? 'var(--amber)' : 'var(--border)',
            }}
          />
        ))}
      </div>
      <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>
        {label}
      </span>
    </div>
  );
}

function LiveRecipeCard({ recipe, onSave, saving }: { recipe: RecipeCard; onSave: () => void; saving: boolean }) {
  // Rough balance inference from balance_notes and ingredients
  const notes = (recipe.balance_notes || '').toLowerCase();
  const getLevel = (word: string) => {
    if (notes.includes(`high ${word}`) || notes.includes(`strong ${word}`)) return 4;
    if (notes.includes(`low ${word}`) || notes.includes(`light ${word}`) || notes.includes(`little ${word}`)) return 2;
    return 3;
  };

  return (
    <div className="rounded-none border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
      {/* Card header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="font-serif-display italic text-2xl leading-tight" style={{ color: 'var(--text)' }}>
            {recipe.name || 'Untitled Recipe'}
          </h2>
          <span className="shrink-0 text-xs uppercase tracking-[0.14em] mt-1" style={{ color: 'var(--text-dim)' }}>
            {recipe.difficulty}
          </span>
        </div>
        {recipe.concept && (
          <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{recipe.concept}</p>
        )}
      </div>

      {/* Meta row */}
      <div className="px-6 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
        {recipe.glass && <span><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Glass </span><span style={{ color: 'var(--text)' }}>{recipe.glass}</span></span>}
        {recipe.method && <span><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Method </span><span style={{ color: 'var(--text)' }}>{recipe.method}</span></span>}
        {recipe.ice && <span><span className="uppercase tracking-[0.14em]" style={{ color: 'var(--text-dim)' }}>Ice </span><span style={{ color: 'var(--text)' }}>{recipe.ice}</span></span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
        {/* Ingredients */}
        <div style={{ background: 'var(--bg-card)' }}>
          <p className="text-xs uppercase tracking-[0.18em] px-6 pt-5 pb-3" style={{ color: 'var(--text-dim)' }}>Ingredients</p>
          <div>
            {recipe.ingredients?.map((ing, i) => (
              <div key={i} className="flex items-baseline justify-between px-6 py-2.5"
                style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {ing.name}
                  {ing.notes && <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{ing.notes}</span>}
                </span>
                <span className="text-sm font-mono ml-3 shrink-0" style={{ color: 'var(--amber)' }}>
                  {ing.amount}
                </span>
              </div>
            ))}
            {recipe.garnish && (
              <div className="px-6 py-2.5 text-sm" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <span className="text-xs uppercase tracking-[0.12em] mr-2" style={{ color: 'var(--text-dim)' }}>Garnish</span>
                {recipe.garnish}
              </div>
            )}
          </div>
        </div>

        {/* Method */}
        <div style={{ background: 'var(--bg-card)' }}>
          <p className="text-xs uppercase tracking-[0.18em] px-6 pt-5 pb-3" style={{ color: 'var(--text-dim)' }}>Method</p>
          <ol className="px-6 flex flex-col gap-2 pb-5">
            {recipe.instructions?.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-serif-display italic shrink-0" style={{ color: 'var(--amber)' }}>{i + 1}</span>
                <span style={{ color: 'var(--text)' }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Balance bar */}
      {recipe.balance_notes && (
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
          <div className="flex items-end justify-between gap-4">
            <div className="flex gap-4">
              <BalancePip label="Strength" level={getLevel('strength')} />
              <BalancePip label="Sweet" level={getLevel('sweet')} />
              <BalancePip label="Acid" level={getLevel('acid')} />
              <BalancePip label="Bitter" level={getLevel('bitter')} />
              <BalancePip label="Body" level={getLevel('body')} />
            </div>
            <p className="text-xs leading-relaxed text-right max-w-xs" style={{ color: 'var(--text-muted)' }}>
              {recipe.balance_notes}
            </p>
          </div>
        </div>
      )}

      {/* Variations */}
      {recipe.variations && (
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs uppercase tracking-[0.18em] mb-1.5" style={{ color: 'var(--text-dim)' }}>Variations</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{recipe.variations}</p>
        </div>
      )}

      {/* Save button */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-3 text-xs uppercase tracking-[0.22em] rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
        >
          {saving ? 'Saving…' : 'Save to Collection'}
        </button>
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--text-dim)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}

export default function RecipeDeveloper() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeCard | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setSavedId(null);

    try {
      const res = await fetch('/api/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.status === 500) {
        const err = await res.json();
        if (err.error?.includes('ANTHROPIC_API_KEY')) setApiKeyMissing(true);
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      const assistantMsg: Message = { role: 'assistant', content: '' };
      setMessages(m => [...m, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(m => m.map((msg, i) => i === m.length - 1 ? { ...msg, content: full } : msg));
        const recipe = parseRecipeFromText(full);
        if (recipe) setCurrentRecipe(recipe);
      }
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  async function saveRecipe() {
    if (!currentRecipe) return;
    setSaving(true);
    try {
      const res = await fetch('/api/cocktails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentRecipe.name,
          category: 'Original',
          style: '',
          baseSpirit: currentRecipe.ingredients?.[0]?.name ?? '',
          method: currentRecipe.method,
          difficulty: currentRecipe.difficulty,
          prepTime: '',
          abv: '',
          glass: currentRecipe.glass,
          ice: currentRecipe.ice,
          garnish: currentRecipe.garnish,
          origin: 'Developed with AI',
          originDate: '',
          rating: 0,
          tags: ['ai-developed'],
          notes: currentRecipe.balance_notes,
          variations: currentRecipe.variations,
          ingredients: currentRecipe.ingredients.map((ing, i) => ({
            name: ing.name,
            amount: ing.amount,
            notes: ing.notes || '',
            order: i + 1,
          })),
          instructions: currentRecipe.instructions,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedId(data.id);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      {/* Left: chat panel */}
      <div className="flex flex-col flex-1 lg:max-w-xl border-r" style={{ borderColor: 'var(--border)' }}>
        {/* Header */}
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--text-dim)' }}>
            Recipe Workshop
          </p>
          <h1 className="font-serif-display italic text-3xl" style={{ color: 'var(--text)' }}>
            Develop a Recipe
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Describe your idea — the AI will suggest a balanced, flavour-matched recipe.
          </p>
        </div>

        {/* API key warning */}
        {apiKeyMissing && (
          <div className="mx-6 mt-4 px-4 py-3 text-sm rounded" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
            Add your <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to <code className="font-mono text-xs">.env</code> to use this feature.
          </div>
        )}

        {/* Starter chips */}
        {messages.length === 0 && (
          <div className="px-6 pt-6">
            <p className="text-xs uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-dim)' }}>
              Start with…
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button
                  key={s.label}
                  onClick={() => { setInput(s.prompt); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-full border transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'user' ? (
                <div
                  className="max-w-xs px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
                  style={{ background: 'var(--text)', color: 'var(--bg)' }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="max-w-full text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                  <AssistantMessage text={msg.content} />
                </div>
              )}
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.role === 'user' && <ThinkingDots />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your cocktail idea…"
              rows={2}
              disabled={streaming}
              className="flex-1 text-sm resize-none outline-none bg-transparent leading-relaxed disabled:opacity-50"
              style={{ color: 'var(--text)' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="shrink-0 px-5 py-2.5 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-30 hover:opacity-80"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              {streaming ? '…' : 'Send'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Right: live recipe card */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        {currentRecipe ? (
          <div className="max-w-xl mx-auto">
            {savedId ? (
              <div className="mb-4 px-4 py-3 text-sm text-center rounded-full" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                Saved! {' '}
                <button onClick={() => router.push(`/cocktails/${savedId}`)} className="underline underline-offset-4 hover:opacity-70">
                  View in collection →
                </button>
              </div>
            ) : null}
            <LiveRecipeCard recipe={currentRecipe} onSave={saveRecipe} saving={saving} />
            {messages.length > 0 && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--text-dim)' }}>
                Continue the conversation to refine this recipe
              </p>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto gap-4">
            <div className="w-16 h-px mb-2" style={{ background: 'var(--border)' }} />
            <p className="font-serif-display italic text-2xl" style={{ color: 'var(--text-muted)' }}>
              Your recipe will appear here
            </p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              It updates live as the AI develops it, and you can save it straight to your collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Renders assistant messages, hiding the raw recipe JSON block
function AssistantMessage({ text }: { text: string }) {
  const clean = stripRecipeBlock(text);
  if (!clean) return null;

  // Render basic markdown: **bold**, *italic*, bullet lists
  const lines = clean.split('\n');
  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2">
              <span style={{ color: 'var(--amber)' }}>·</span>
              <span>{formatInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.startsWith('### ')) {
          return <p key={i} className="font-serif-display italic text-base mt-1" style={{ color: 'var(--text)' }}>{line.slice(4)}</p>;
        }
        if (line.startsWith('## ') || line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-xs uppercase tracking-[0.18em] mt-2" style={{ color: 'var(--text-dim)' }}>{line.replace(/\*\*/g, '').replace(/^## /, '')}</p>;
        }
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
