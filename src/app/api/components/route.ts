import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.ADMIN_PASSWORD;
}

const MODEL_MAP = {
  syrup: prisma.syrup,
  infusion: prisma.infusion,
  liqueur: prisma.liqueur,
  shrub: prisma.shrub,
} as const;

type ModelType = keyof typeof MODEL_MAP;

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { modelType, tags, ingredients, instructions, usedIn, variations, ...rest } = body;
  if (!MODEL_MAP[modelType as ModelType]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (MODEL_MAP[modelType as ModelType] as any).create({
    data: {
      ...rest,
      type: modelType.charAt(0).toUpperCase() + modelType.slice(1),
      tags: JSON.stringify(tags || []),
      ingredients: JSON.stringify(ingredients || []),
      instructions: JSON.stringify(instructions || []),
      usedIn: JSON.stringify(usedIn || []),
      variations: variations || '',
      notes: rest.notes || '',
    },
  });
  return NextResponse.json(record, { status: 201 });
}
