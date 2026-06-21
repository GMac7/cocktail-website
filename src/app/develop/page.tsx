import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RecipeDeveloper from '@/components/RecipeDeveloper';

export const metadata = {
  title: 'Recipe Developer — Pours by Mackay',
  description: 'Develop new cocktail recipes with AI-assisted flavor pairing and balance guidance.',
};

export const dynamic = 'force-dynamic';

export default async function DevelopPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('admin_auth')?.value === process.env.SESSION_SECRET;
  if (!isAuthed) redirect('/admin');

  return <RecipeDeveloper />;
}
