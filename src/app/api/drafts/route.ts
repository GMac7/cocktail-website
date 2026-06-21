import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.SESSION_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const drafts = await prisma.draftCocktail.findMany({ orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(drafts);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, inspiration, steps, assembled, notes } = await req.json();
  const draft = await prisma.draftCocktail.create({
    data: {
      name: name || 'Untitled Draft',
      inspiration,
      steps: JSON.stringify(steps),
      assembled: JSON.stringify(assembled || {}),
      notes: notes || '',
    },
  });
  return NextResponse.json(draft, { status: 201 });
}
