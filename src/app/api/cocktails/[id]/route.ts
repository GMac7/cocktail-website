import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
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
  const body = await req.json();
  const { ingredients, instructions, tags, ...rest } = body;

  // Delete existing relationships
  await prisma.cocktailIngredient.deleteMany({ where: { cocktailId: parseInt(id) } });
  await prisma.instruction.deleteMany({ where: { cocktailId: parseInt(id) } });

  const cocktail = await prisma.cocktail.update({
    where: { id: parseInt(id) },
    data: {
      ...rest,
      tags: JSON.stringify(tags || []),
      variations: rest.variations || '',
      notes: rest.notes || '',
      ingredients: {
        create: await Promise.all(
          (ingredients || []).map(async (ing: { name: string; amount: string; notes: string; order: number }, idx: number) => {
            const ingredient = await prisma.ingredient.upsert({
              where: { name: ing.name },
              update: {},
              create: { name: ing.name, type: '', brand: '' },
            });
            return { ingredientId: ingredient.id, amount: ing.amount, notes: ing.notes || '', order: ing.order ?? idx + 1 };
          }),
        ),
      },
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
