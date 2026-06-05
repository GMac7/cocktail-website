import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Cocktail Cabinet",
  description: "A personal collection of handcrafted cocktail recipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }} className="sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl" role="img" aria-label="cocktail">🍸</span>
              <span className="font-semibold tracking-wide" style={{ color: "var(--amber)", letterSpacing: "0.08em" }}>
                The Cocktail Cabinet
              </span>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sm hover:text-amber transition-colors" style={{ color: "var(--text-muted)" }}>
                Cocktails
              </Link>
              <Link href="/components" className="text-sm hover:text-amber transition-colors" style={{ color: "var(--text-muted)" }}>
                Components
              </Link>
              <Link href="/admin" className="text-sm px-3 py-1.5 rounded border transition-colors"
                style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }} className="py-8 text-center text-xs">
          The Cocktail Cabinet — a personal collection
        </footer>
      </body>
    </html>
  );
}
