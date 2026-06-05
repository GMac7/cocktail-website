import { prisma } from '@/lib/prisma';
import ComponentsClient from '@/components/ComponentsClient';

export const dynamic = 'force-dynamic';

export default async function ComponentsPage() {
  const [syrups, infusions, liqueurs, shrubs] = await Promise.all([
    prisma.syrup.findMany({ orderBy: { name: 'asc' } }),
    prisma.infusion.findMany({ orderBy: { name: 'asc' } }),
    prisma.liqueur.findMany({ orderBy: { name: 'asc' } }),
    prisma.shrub.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const serialize = (items: { id: number; name: string; type: string; difficulty: string; prepTime: string; shelfLife: string; yield: string; tags: string; usedIn: string }[]) =>
    items.map(i => ({
      id: i.id,
      name: i.name,
      type: i.type,
      difficulty: i.difficulty,
      prepTime: i.prepTime,
      shelfLife: i.shelfLife,
      yield: i.yield,
      tags: JSON.parse(i.tags || '[]') as string[],
      usedIn: JSON.parse(i.usedIn || '[]') as string[],
    }));

  return (
    <ComponentsClient
      syrups={serialize(syrups)}
      infusions={serialize(infusions)}
      liqueurs={serialize(liqueurs)}
      shrubs={serialize(shrubs)}
    />
  );
}
