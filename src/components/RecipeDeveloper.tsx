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

const LOADING_PHRASES = [
  'Consulting the ice bucket oracle…',
  'Arguing with the bitters about proportions…',
  'Politely asking the citrus to behave…',
  'Running the numbers through a jigger…',
  'Persuading the vermouth to cooperate…',
  'Taste-testing in an imaginary bar…',
  'Checking if this has been done before (it hasn\'t)…',
  'Sourcing rare ingredients from thin air…',
  'Balancing acid against sweet with a tiny seesaw…',
  'Shaking it. Stirring it. Shaking it again…',
  'Interviewing local citrus peels for the garnish role…',
  'Cross-referencing with 400 years of bad decisions…',
];

function getLoadingPhrase() {
  return LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];
}

function extractQuestion(text: string): string | null {
  if (!text.trim()) return null;
  const clean = text.replace(/```recipe[\s\S]*?```/g, '').trim();
  if (text.includes('```recipe')) return null;
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const questions = sentences.filter(s => s.trim().endsWith('?'));
  if (questions.length > 0) return clean;
  return null;
}

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
          <div key={i} className="w-2.5 h-2.5 rounded-sm transition-all"
            style={{ background: i <= level ? 'var(--amber)' : 'var(--border)' }} />
        ))}
      </div>
      <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-dim)' }}>
        {label}
      </span>
    </div>
  );
}

function RecipeModal({
  recipe, onClose, onSave, saving, savedId, savedRecipeId,
}: {
  recipe: RecipeCard;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  savedId: number | null;
  savedRecipeId: number | null;
}) {
  const router = useRouter();
  const notes = (recipe.balance_notes || '').toLowerCase();
  const getLevel = (word: string) => {
    if (notes.includes(`high ${word}`) || notes.includes(`strong ${word}`)) return 4;
    if (notes.includes(`low ${word}`) || notes.includes(`light ${word}`) || notes.includes(`little ${word}`)) return 2;
    return 3;
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(20,16,12,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-xs uppercase tracking-[0.18em] px-3 py-1.5 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-dim)' }}
        >
          Close ✕
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-10 mb-2">
            <h2 className="font-serif-display italic text-3xl leading-tight" style={{ color: 'var(--text)' }}>
              {recipe.name || 'Untitled Recipe'}
            </h2>
            <span className="shrink-0 text-xs uppercase tracking-[0.14em] mt-2" style={{ color: 'var(--text-dim)' }}>
              {recipe.difficulty}
            </span>
          </div>
          {recipe.concept && (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{recipe.concept}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="px-6 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
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
                <div className="px-6 py-2.5 text-sm"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <span className="text-xs uppercase tracking-[0.12em] mr-2" style={{ color: 'var(--text-dim)' }}>Garnish</span>
                  {recipe.garnish}
                </div>
              )}
            </div>
          </div>

          {/* Method */}
          <div style={{ background: 'var(--bg-card)' }}>
            <p className="text-xs uppercase tracking-[0.18em] px-6 pt-5 pb-3" style={{ color: 'var(--text-dim)' }}>Method</p>
            <ol className="px-6 flex flex-col gap-3 pb-5">
              {recipe.instructions?.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-serif-display italic shrink-0" style={{ color: 'var(--amber)' }}>{i + 1}</span>
                  <span style={{ color: 'var(--text)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Balance */}
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

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          {savedRecipeId ? (
            <button
              onClick={() => router.push(`/cocktails/${savedRecipeId}`)}
              className="flex-1 py-3 text-xs uppercase tracking-[0.22em] rounded-full transition-opacity hover:opacity-80"
              style={{ background: 'var(--amber)', color: 'var(--bg)' }}
            >
              View in Collection →
            </button>
          ) : (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 py-3 text-xs uppercase tracking-[0.22em] rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
            >
              {saving ? 'Saving…' : 'Save to Collection'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 text-xs uppercase tracking-[0.18em] rounded-full border transition-opacity hover:opacity-60"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Refine
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingState({ phrase }: { phrase: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--amber)', animation: `blink 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{phrase}</span>
      <style>{`@keyframes blink { 0%,100%{opacity:.25} 50%{opacity:1} }`}</style>
    </div>
  );
}

export default function RecipeDeveloper() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(getLoadingPhrase);
  const [currentRecipe, setCurrentRecipe] = useState<RecipeCard | null>(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming, pendingQuestion]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setPendingQuestion(null);
    setSavedId(null);
    setLoadingPhrase(getLoadingPhrase());

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const question = extractQuestion(full);
        if (question) setPendingQuestion(question);
      }

      // Done — commit message and show recipe if present
      const recipe = parseRecipeFromText(full);
      setMessages(m => [...m, { role: 'assistant', content: full }]);
      setPendingQuestion(null);

      if (recipe) {
        setCurrentRecipe(recipe);
        setShowRecipe(true);
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
            name: ing.name, amount: ing.amount, notes: ing.notes || '', order: i + 1,
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
    <>
      {/* Modal */}
      {showRecipe && currentRecipe && (
        <RecipeModal
          recipe={currentRecipe}
          onClose={() => setShowRecipe(false)}
          onSave={saveRecipe}
          saving={saving}
          savedId={savedId}
          savedRecipeId={savedId}
        />
      )}

      {/* Full-height chat layout — never scrolls the outer page */}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Header */}
        <div className="px-6 py-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--text-dim)' }}>
                Recipe Workshop
              </p>
              <h1 className="font-serif-display italic text-3xl" style={{ color: 'var(--text)' }}>
                Develop a Recipe
              </h1>
            </div>
            {currentRecipe && !streaming && (
              <button
                onClick={() => setShowRecipe(true)}
                className="shrink-0 text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full transition-opacity hover:opacity-80 mb-1"
                style={{ background: 'var(--amber)', color: 'var(--bg)' }}
              >
                View Recipe
              </button>
            )}
          </div>
        </div>

        {/* API key warning */}
        {apiKeyMissing && (
          <div className="mx-auto w-full max-w-2xl px-6 mt-4 shrink-0">
            <div className="px-4 py-3 text-sm rounded" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
              Add your <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to <code className="font-mono text-xs">.env</code> to use this feature.
            </div>
          </div>
        )}

        {/* Scrollable message area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-5">

            {/* Starter chips — before first message */}
            {messages.length === 0 && !streaming && (
              <div>
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
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-sm px-4 py-3 rounded-2xl rounded-tr-sm text-sm"
                    style={{ background: 'var(--text)', color: 'var(--bg)' }}>
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    <CompletedAssistantMessage text={msg.content} />
                  </div>
                )}
              </div>
            ))}

            {/* Streaming state */}
            {streaming && (
              <div className="flex justify-start">
                {pendingQuestion ? (
                  <div className="max-w-sm text-sm leading-relaxed p-4"
                    style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <FormattedText text={pendingQuestion} />
                  </div>
                ) : (
                  <ThinkingState phrase={loadingPhrase} />
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar — always at the bottom */}
        <div className="shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-6 py-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={streaming ? 'Waiting for response…' : 'Describe your cocktail idea…'}
                rows={2}
                disabled={streaming}
                className="flex-1 text-sm resize-none outline-none bg-transparent leading-relaxed disabled:opacity-40"
                style={{ color: 'var(--text)' }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="shrink-0 px-5 py-2.5 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-30 hover:opacity-80"
                style={{ background: 'var(--text)', color: 'var(--bg)' }}
              >
                Send
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function CompletedAssistantMessage({ text }: { text: string }) {
  const clean = stripRecipeBlock(text);
  if (!clean) return null;
  return <FormattedText text={clean} />;
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
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
        if (line.startsWith('### ')) return (
          <p key={i} className="font-serif-display italic text-base mt-1" style={{ color: 'var(--text)' }}>{line.slice(4)}</p>
        );
        if (line.startsWith('## ')) return (
          <p key={i} className="text-xs uppercase tracking-[0.18em] mt-2" style={{ color: 'var(--text-dim)' }}>{line.slice(3)}</p>
        );
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: 'var(--text)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}
