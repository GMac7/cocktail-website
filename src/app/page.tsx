import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="relative w-full flex-1 min-h-[88vh] flex items-end overflow-hidden">
      {/* Full-bleed photo */}
      <img
        src="https://images.unsplash.com/photo-1551751299-1b51cab2694c?auto=format&fit=crop&w=2400&q=80"
        alt="A handcrafted cocktail, glowing amber in low light"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlay for legibility + mood */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(20,16,12,0.05) 0%, rgba(20,16,12,0.15) 45%, rgba(20,16,12,0.72) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 pb-20 sm:pb-28">
        <p className="text-xs uppercase tracking-[0.35em] mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
          A Personal Collection
        </p>
        <h1 className="font-serif-display italic text-5xl sm:text-7xl leading-[1.05] mb-8 text-white max-w-3xl">
          Recipes worth raising a glass to
        </h1>
        <p className="text-sm sm:text-base max-w-md mb-10" style={{ color: 'rgba(255,255,255,0.78)' }}>
          A hand-curated cabinet of cocktails, syrups, infusions, and garnishes — gathered, tested, and poured at home.
        </p>
        <Link
          href="/cocktails"
          className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] px-8 py-4 rounded-full transition-opacity hover:opacity-80"
          style={{ background: '#fdfcfa', color: '#1d1c1a' }}
        >
          Explore the Cocktails
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
