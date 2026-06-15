import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Pours by Mackay",
  description: "A personal collection of handcrafted cocktail recipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(253, 252, 250, 0.85)", backdropFilter: "blur(8px)" }} className="sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="font-serif-display text-2xl italic tracking-wide" style={{ color: "var(--text)" }}>
                Pours by Mackay
              </span>
            </Link>
            <nav className="flex items-center gap-10">
              <Link href="/cocktails" className="text-xs uppercase tracking-[0.18em] transition-colors hover:opacity-60" style={{ color: "var(--text-muted)" }}>
                Cocktails
              </Link>
              <Link href="/components" className="text-xs uppercase tracking-[0.18em] transition-colors hover:opacity-60" style={{ color: "var(--text-muted)" }}>
                Components
              </Link>
              <Link href="/develop" className="text-xs uppercase tracking-[0.18em] transition-colors hover:opacity-60" style={{ color: "var(--amber)" }}>
                Workshop
              </Link>
              <Link href="/admin" className="text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full border transition-colors hover:opacity-60"
                style={{ color: "var(--text)", borderColor: "var(--border)" }}>
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }} className="py-10 text-center text-xs uppercase tracking-[0.18em]">
          Pours by Mackay — a personal collection
        </footer>
      </body>
    </html>
  );
}
