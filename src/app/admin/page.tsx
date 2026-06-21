import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get('admin_auth')?.value === process.env.SESSION_SECRET;

  if (!isAuthed) return <AdminLogin />;

  const [cocktails, syrups, infusions, liqueurs, shrubs] = await Promise.all([
    prisma.cocktail.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, category: true, baseSpirit: true, rating: true } }),
    prisma.syrup.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, type: true } }),
    prisma.infusion.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, type: true } }),
    prisma.liqueur.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, type: true } }),
    prisma.shrub.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, type: true } }),
  ]);

  return (
    <AdminDashboard
      cocktails={cocktails}
      syrups={syrups}
      infusions={infusions}
      liqueurs={liqueurs}
      shrubs={shrubs}
    />
  );
}
