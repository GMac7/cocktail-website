import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.SESSION_SECRET;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cocktail = await prisma.cocktail.findUnique({
    where: { id: parseInt(id) },
    include: {
      ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } },
      instructions: { orderBy: { stepNumber: 'asc' } },
    },
  });
  if (!cocktail) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(cocktail);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const cocktailId = parseInt(id);
  const body = await req.json();
  const { ingredients, instructions, tags, id: _formId, name, createdAt: _ca, updatedAt: _ua, ...rest } = body;

  // If the name is changing, check for conflicts first
  if (name) {
    const conflict = await prisma.cocktail.findFirst({ where: { name, NOT: { id: cocktailId } } });
    if (conflict) return NextResponse.json({ error: `A cocktail named "${name}" already exists` }, { status: 409 });
  }

  // Delete existing relationships before updating
  await prisma.cocktailIngredient.deleteMany({ where: { cocktailId } });
  await prisma.instruction.deleteMany({ where: { cocktailId } });

  const ingredientCreate = await Promise.all(
    (ingredients || []).map(async (ing: { name: string; amount: string; notes: string; order: number }, idx: number) => {
      const ingredient = await prisma.ingredient.upsert({
        where: { name: ing.name },
        update: {},
        create: { name: ing.name, type: '', brand: '' },
      });
      return { ingredientId: ingredient.id, amount: ing.amount, notes: ing.notes || '', order: ing.order ?? idx + 1 };
    }),
  );

  const cocktail = await prisma.cocktail.update({
    where: { id: cocktailId },
    data: {
      ...rest,
      ...(name ? { name } : {}),
      tags: JSON.stringify(tags || []),
      variations: rest.variations || '',
      notes: rest.notes || '',
      ingredients: { create: ingredientCreate },
      instructions: {
        create: (instructions || []).map((text: string, idx: number) => ({ stepNumber: idx + 1, text })),
      },
    },
  });
  return NextResponse.json(cocktail);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.cocktail.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
