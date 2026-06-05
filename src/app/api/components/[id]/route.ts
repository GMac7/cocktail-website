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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { modelType, tags, ingredients, instructions, usedIn, variations, ...rest } = body;
  if (!MODEL_MAP[modelType as ModelType]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (MODEL_MAP[modelType as ModelType] as any).update({
    where: { id: parseInt(id) },
    data: {
      ...rest,
      tags: JSON.stringify(tags || []),
      ingredients: JSON.stringify(ingredients || []),
      instructions: JSON.stringify(instructions || []),
      usedIn: JSON.stringify(usedIn || []),
      variations: variations || '',
      notes: rest.notes || '',
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url);
  const modelType = url.searchParams.get('type') as ModelType;
  if (!MODEL_MAP[modelType]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (MODEL_MAP[modelType] as any).delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
