import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import CocktailForm from '@/components/CocktailForm';

export const dynamic = 'force-dynamic';

export default async function EditCocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) redirect('/admin');

  const { id } = await params;
  const cocktail = await prisma.cocktail.findUnique({
    where: { id: parseInt(id) },
    include: {
      ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } },
      instructions: { orderBy: { stepNumber: 'asc' } },
    },
  });
  if (!cocktail) notFound();

  const initial = {
    id: cocktail.id,
    name: cocktail.name,
    category: cocktail.category,
    style: cocktail.style,
    baseSpirit: cocktail.baseSpirit,
    method: cocktail.method,
    difficulty: cocktail.difficulty,
    prepTime: cocktail.prepTime,
    abv: cocktail.abv,
    glass: cocktail.glass,
    ice: cocktail.ice,
    garnish: cocktail.garnish,
    origin: cocktail.origin,
    originDate: cocktail.originDate,
    rating: cocktail.rating,
    tags: JSON.parse(cocktail.tags || '[]') as string[],
    notes: cocktail.notes,
    variations: cocktail.variations,
    ingredients: cocktail.ingredients.map(ci => ({
      name: ci.ingredient.name,
      amount: ci.amount,
      notes: ci.notes,
    })),
    instructions: cocktail.instructions.map(i => i.text),
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm mb-8"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to admin
      </Link>
      <h1 className="text-3xl font-semibold mb-8" style={{ color: 'var(--amber)' }}>Edit: {cocktail.name}</h1>
      <CocktailForm initial={initial} />
    </div>
  );
}
