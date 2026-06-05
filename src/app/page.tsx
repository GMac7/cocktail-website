import { prisma } from '@/lib/prisma';
import CocktailGrid from '@/components/CocktailGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cocktails = await prisma.cocktail.findMany({
    include: { ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } } },
    orderBy: { name: 'asc' },
  });

  const serialized = cocktails.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    style: c.style,
    baseSpirit: c.baseSpirit,
    method: c.method,
    difficulty: c.difficulty,
    abv: c.abv,
    glass: c.glass,
    rating: c.rating,
    tags: JSON.parse(c.tags || '[]') as string[],
    ingredientCount: c.ingredients.length,
  }));

  const categories = [...new Set(cocktails.map(c => c.category).filter(Boolean))].sort();
  const spirits = [...new Set(cocktails.map(c => c.baseSpirit).filter(Boolean))].sort();

  return <CocktailGrid cocktails={serialized} categories={categories} spirits={spirits} />;
}
