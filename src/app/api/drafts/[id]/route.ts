import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isAuthed(req: NextRequest) {
  return req.cookies.get('admin_auth')?.value === process.env.SESSION_SECRET;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const draft = await prisma.draftCocktail.findUnique({ where: { id: parseInt(id) } });
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name, notes } = await req.json();
  const draft = await prisma.draftCocktail.update({
    where: { id: parseInt(id) },
    data: { name, notes },
  });
  return NextResponse.json(draft);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.draftCocktail.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
