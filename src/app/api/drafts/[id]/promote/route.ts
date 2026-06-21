import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.SESSION_SECRET;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const draft = await prisma.draftCocktail.findUnique({ where: { id: parseInt(id) } });
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  type AssembledIngredient = { name: string; amount: string };
  type Assembled = {
    method?: string;
    glass?: string;
    ice?: string;
    garnish?: string;
    ratioNotes?: string;
    ingredients?: AssembledIngredient[];
  };

  const assembled: Assembled = JSON.parse(draft.assembled || '{}');
  const ingredients: AssembledIngredient[] = assembled.ingredients || [];

  // Create cocktail record
  const cocktail = await prisma.cocktail.create({
    data: {
      name: draft.name,
      category: 'Cocktail',
      style: '',
      baseSpirit: '',
      method: assembled.method || '',
      difficulty: '',
      prepTime: '',
      abv: '',
      glass: assembled.glass || '',
      ice: assembled.ice || '',
      garnish: assembled.garnish || '',
      origin: 'Original Recipe',
      originDate: new Date().getFullYear().toString(),
      rating: 0,
      tags: '[]',
      notes: `${draft.notes || ''}${assembled.ratioNotes ? `\n\nBalance: ${assembled.ratioNotes}` : ''}`.trim(),
      variations: '',
    },
  });

  // Find or create each ingredient and link it
  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const ingredient = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: { name: ing.name, type: 'Unknown', brand: '' },
    });
    await prisma.cocktailIngredient.create({
      data: {
        cocktailId: cocktail.id,
        ingredientId: ingredient.id,
        amount: ing.amount,
        notes: '',
        order: i + 1,
      },
    });
  }

  return NextResponse.json({ cocktailId: cocktail.id });
}
