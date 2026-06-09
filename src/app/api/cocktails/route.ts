import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.SESSION_SECRET;
}

export async function GET() {
  const cocktails = await prisma.cocktail.findMany({
    include: { ingredients: { include: { ingredient: true }, orderBy: { order: 'asc' } }, instructions: { orderBy: { stepNumber: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(cocktails);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ingredients, instructions, tags, ...rest } = body;

  const cocktail = await prisma.cocktail.create({
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
  return NextResponse.json(cocktail, { status: 201 });
}
