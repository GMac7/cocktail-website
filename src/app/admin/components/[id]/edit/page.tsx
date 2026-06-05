import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ComponentForm from '@/components/ComponentForm';

export const dynamic = 'force-dynamic';

const MODEL_MAP = {
  syrup: prisma.syrup,
  infusion: prisma.infusion,
  liqueur: prisma.liqueur,
  shrub: prisma.shrub,
} as const;

type ModelType = keyof typeof MODEL_MAP;

export default async function EditComponentPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_auth')?.value !== process.env.ADMIN_PASSWORD) redirect('/admin');

  const [{ id }, { type = 'syrup' }] = await Promise.all([params, searchParams]);
  const model = MODEL_MAP[type as ModelType];
  if (!model) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = await (model as any).findUnique({ where: { id: parseInt(id) } });
  if (!record) notFound();

  const initial = {
    id: record.id,
    name: record.name,
    ratio: record.ratio,
    sugarType: record.sugarType,
    baseSpirit: record.baseSpirit,
    base: record.base,
    difficulty: record.difficulty,
    prepTime: record.prepTime,
    shelfLife: record.shelfLife,
    storage: record.storage,
    yield: record.yield,
    tags: JSON.parse(record.tags || '[]') as string[],
    ingredients: JSON.parse(record.ingredients || '[]') as { name: string; amount: string }[],
    instructions: JSON.parse(record.instructions || '[]') as string[],
    notes: record.notes,
    usedIn: JSON.parse(record.usedIn || '[]') as string[],
    variations: record.variations,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 w-full">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm mb-8"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to admin
      </Link>
      <h1 className="text-3xl font-semibold mb-8" style={{ color: 'var(--amber)' }}>
        Edit: {record.name}
      </h1>
      <ComponentForm modelType={type} initial={initial} />
    </div>
  );
}
