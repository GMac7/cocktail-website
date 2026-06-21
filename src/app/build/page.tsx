import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CocktailBuilder from '@/components/CocktailBuilder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Recipe Builder — Pours by Mackay',
};

export default async function BuildPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== process.env.SESSION_SECRET) redirect('/admin');

  const [syrups, infusions, liqueurs, shrubs] = await Promise.all([
    prisma.syrup.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.infusion.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.liqueur.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.shrub.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
  ]);

  const houseComponents = [
    ...syrups.map(c => ({ name: c.name, step: 'sweetener' as const })),
    ...shrubs.map(c => ({ name: c.name, step: 'acid' as const })),
    ...liqueurs.map(c => ({ name: c.name, step: 'modifier' as const })),
    ...infusions.map(c => ({ name: c.name, step: 'modifier' as const })),
  ];

  return <CocktailBuilder houseComponents={houseComponents} />;
}
