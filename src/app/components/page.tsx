import { prisma } from '@/lib/prisma';
import ComponentsClient from '@/components/ComponentsClient';

export const dynamic = 'force-dynamic';

export default async function ComponentsPage() {
  const [syrups, infusions, liqueurs, shrubs, cocktails] = await Promise.all([
    prisma.syrup.findMany({ orderBy: { name: 'asc' } }),
    prisma.infusion.findMany({ orderBy: { name: 'asc' } }),
    prisma.liqueur.findMany({ orderBy: { name: 'asc' } }),
    prisma.shrub.findMany({ orderBy: { name: 'asc' } }),
    prisma.cocktail.findMany({ select: { id: true, name: true } }),
  ]);

  const cocktailIdByName = Object.fromEntries(cocktails.map(c => [c.name, c.id]));

  const serialize = (items: { id: number; name: string; type: string; difficulty: string; prepTime: string; shelfLife: string; yield: string; tags: string; usedIn: string; ingredients: string; instructions: string; notes: string }[]) =>
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
      ingredients: JSON.parse(i.ingredients || '[]') as { amount: string; name: string }[],
      instructions: JSON.parse(i.instructions || '[]') as string[],
      notes: i.notes,
    }));

  return (
    <ComponentsClient
      syrups={serialize(syrups)}
      infusions={serialize(infusions)}
      liqueurs={serialize(liqueurs)}
      shrubs={serialize(shrubs)}
      cocktailIdByName={cocktailIdByName}
    />
  );
}
