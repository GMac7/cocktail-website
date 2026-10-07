'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = '/admin';
    } else {
      setError('Incorrect password');
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: 'var(--text-dim)' }}>Private</p>
          <h1 className="font-serif-display italic text-4xl mb-3" style={{ color: 'var(--text)' }}>Admin Access</h1>
          <div className="w-12 h-px mx-auto mb-3" style={{ background: 'var(--amber)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="w-full px-4 py-3 text-sm outline-none bg-transparent"
            style={{
              borderBottom: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          {error && <p className="text-sm text-center" style={{ color: '#a14a4a' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 text-xs uppercase tracking-[0.18em] rounded-full transition-opacity disabled:opacity-50 hover:opacity-80"
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
