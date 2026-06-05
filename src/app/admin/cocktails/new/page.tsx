import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CocktailForm from '@/components/CocktailForm';

export const dynamic = 'force-dynamic';

export default async function NewCocktailPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) redirect('/admin');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm mb-8"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to admin
      </Link>
      <h1 className="text-3xl font-semibold mb-8" style={{ color: 'var(--amber)' }}>New Cocktail</h1>
      <CocktailForm />
    </div>
  );
}
