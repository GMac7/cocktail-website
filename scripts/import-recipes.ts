/**
 * Import recipes from Obsidian markdown files into the cocktail database.
 * Supports Cocktails, Syrups, Infusions, Liqueurs, Shrubs, and OtherRecipes.
 * Type is detected from the `type` frontmatter field (defaults to Cocktail).
 *
 * Usage:
 *   npx tsx scripts/import-recipes.ts <path> [options]
 *
 *   <path> can be a single .md file, a folder (non-recursive), or use --recursive
 *
 * Options:
 *   --recursive      Walk subdirectories (useful for pointing at your whole vault)
 *   --dry-run        Print what would be imported without writing to DB
 *   --skip-existing  Skip records that already exist (default: upsert/overwrite)
 *
 * Examples:
 *   npx tsx scripts/import-recipes.ts ~/Obsidian/Cocktails --dry-run
 *   npx tsx scripts/import-recipes.ts ~/Obsidian --recursive
 *   npx tsx scripts/import-recipes.ts ~/Obsidian/Syrups/GuinessSyrup.md
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import matter from 'gray-matter';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// DB
// ---------------------------------------------------------------------------

const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as Parameters<typeof PrismaClient>[0]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecipeType = 'Cocktail' | 'Syrup' | 'Infusion' | 'Liqueur' | 'Shrub' | 'Other';

interface BaseRecipe {
  name: string;
  type: RecipeType;
  difficulty: string;
  prepTime: string;
  shelfLife: string;
  storage: string;
  yield: string;
  tags: string[];
  ingredients: { amount: string; name: string }[];
  instructions: string[];
  notes: string;
  usedIn: string[];
  variations: string;
}

interface CocktailRecipe {
  type: 'Cocktail';
  name: string;
  category: string;
  style: string;
  baseSpirit: string;
  method: string;
  difficulty: string;
  prepTime: string;
  abv: string;
  glass: string;
  ice: string;
  garnish: string;
  origin: string;
  originDate: string;
  rating: number;
  tags: string[];
  notes: string;
  variations: string;
  ingredients: { amount: string; name: string; notes: string; order: number }[];
  instructions: string[];
}

interface SyrupRecipe extends BaseRecipe { type: 'Syrup'; ratio: string; sugarType: string; }
interface InfusionRecipe extends BaseRecipe { type: 'Infusion'; baseSpirit: string; }
interface LiqueurRecipe extends BaseRecipe { type: 'Liqueur'; baseSpirit: string; }
interface ShrubRecipe extends BaseRecipe { type: 'Shrub'; base: string; }
interface OtherRecipe extends BaseRecipe { type: 'Other'; metadata: Record<string, unknown>; }

type ParsedRecipe = CocktailRecipe | SyrupRecipe | InfusionRecipe | LiqueurRecipe | ShrubRecipe | OtherRecipe;

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function stripWikilinks(s: string): string {
  return s.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').trim();
}

function extractSection(content: string, heading: string): string {
  const pattern = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  return content.match(pattern)?.[1]?.trim() ?? '';
}

function parseIngredientLine(raw: string): { amount: string; name: string; notes: string } | null {
  const line = raw.replace(/^-\s*/, '').trim();
  if (!line) return null;

  const amountMatch = line.match(
    /^([\d./]+\s*(?:oz|ml|cl|tsp|tbsp|cup(?:s)?|dash(?:es)?|drop(?:s)?|splash(?:es)?|barspoon(?:s)?|rinse|whole|part(?:s)?)?)\s+(.+)$/i,
  );

  if (amountMatch) {
    const amount = amountMatch[1].trim();
    const rest = amountMatch[2].trim();
    const notesMatch = rest.match(/^(.*?)\s*(\(.*\))\s*$/);
    if (notesMatch) {
      return { amount, name: stripWikilinks(notesMatch[1]), notes: notesMatch[2] };
    }
    return { amount, name: stripWikilinks(rest), notes: '' };
  }

  return { amount: '', name: stripWikilinks(line), notes: '' };
}

function parseBulletList(section: string): string[] {
  return section
    .split('\n')
    .map(l => l.replace(/^-\s*/, '').trim())
    .map(stripWikilinks)
    .filter(Boolean);
}

function parseNumberedList(section: string): string[] {
  return section
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

function detectType(fm: Record<string, unknown>): RecipeType {
  const t = String(fm.type ?? '').toLowerCase();
  if (t === 'syrup') return 'Syrup';
  if (t === 'infusion') return 'Infusion';
  if (t === 'liqueur') return 'Liqueur';
  if (t === 'shrub') return 'Shrub';
  if (t && t !== 'cocktail') return 'Other';
  return 'Cocktail';
}

// ---------------------------------------------------------------------------
// Per-type parsers
// ---------------------------------------------------------------------------

function parseBase(name: string, fm: Record<string, unknown>, content: string): Omit<BaseRecipe, 'type'> {
  const ingredientsRaw = extractSection(content, 'Ingredients');
  const ingredients = ingredientsRaw
    .split('\n')
    .map(parseIngredientLine)
    .filter((x): x is NonNullable<typeof x> => x !== null && x.name !== '')
    .map(({ amount, name: n }) => ({ amount, name: n }));

  return {
    name,
    difficulty: String(fm.difficulty ?? ''),
    prepTime: String(fm.prep_time ?? ''),
    shelfLife: String(fm.shelf_life ?? ''),
    storage: String(fm.storage ?? ''),
    yield: String(fm.yield ?? ''),
    tags: parseTags(fm.tags),
    ingredients,
    instructions: parseNumberedList(extractSection(content, 'Instructions')),
    notes: extractSection(content, 'Notes'),
    usedIn: parseBulletList(extractSection(content, 'Used In')),
    variations: extractSection(content, 'Variations'),
  };
}

function parseCocktail(name: string, fm: Record<string, unknown>, content: string): CocktailRecipe {
  const ingredientsRaw = extractSection(content, 'Ingredients');
  const ingredients = ingredientsRaw
    .split('\n')
    .map(parseIngredientLine)
    .filter((x): x is NonNullable<typeof x> => x !== null && x.name !== '')
    .map((x, i) => ({ ...x, order: i + 1 }));

  return {
    type: 'Cocktail',
    name,
    category: String(fm.category ?? ''),
    style: String(fm.style ?? ''),
    baseSpirit: String(fm.base_spirit ?? ''),
    method: String(fm.method ?? ''),
    difficulty: String(fm.difficulty ?? ''),
    prepTime: String(fm.prep_time ?? ''),
    abv: String(fm.abv ?? ''),
    glass: String(fm.glass ?? ''),
    ice: String(fm.ice ?? ''),
    garnish: String(fm.garnish ?? ''),
    origin: String(fm.origin ?? ''),
    originDate: String(fm.origin_date ?? ''),
    rating: Number(fm.rating ?? 0),
    tags: parseTags(fm.tags),
    notes: extractSection(content, 'Notes'),
    variations: extractSection(content, 'Variations'),
    ingredients,
    instructions: parseNumberedList(extractSection(content, 'Instructions')),
  };
}

function parseFile(filePath: string): ParsedRecipe {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: fm, content } = matter(raw);
  const name = path.basename(filePath, '.md');
  const type = detectType(fm as Record<string, unknown>);

  if (type === 'Cocktail') return parseCocktail(name, fm as Record<string, unknown>, content);

  const base = parseBase(name, fm as Record<string, unknown>, content);

  if (type === 'Syrup') return { ...base, type: 'Syrup', ratio: String(fm.ratio ?? ''), sugarType: String(fm.sugar_type ?? '') };
  if (type === 'Infusion') return { ...base, type: 'Infusion', baseSpirit: String(fm.base_spirit ?? '') };
  if (type === 'Liqueur') return { ...base, type: 'Liqueur', baseSpirit: String(fm.base_spirit ?? '') };
  if (type === 'Shrub') return { ...base, type: 'Shrub', base: String(fm.base ?? '') };

  // Other
  const { type: _t, ...rest } = fm as Record<string, unknown>;
  return { ...base, type: 'Other', metadata: rest };
}

// ---------------------------------------------------------------------------
// DB writers
// ---------------------------------------------------------------------------

type ImportResult = 'created' | 'updated' | 'skipped';

async function importCocktail(data: CocktailRecipe, skipExisting: boolean): Promise<ImportResult> {
  const existing = await prisma.cocktail.findUnique({ where: { name: data.name } });
  if (existing && skipExisting) return 'skipped';

  const ingredientIds: Record<string, number> = {};
  for (const ing of data.ingredients) {
    const record = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: {},
      create: { name: ing.name, type: '', brand: '' },
    });
    ingredientIds[ing.name] = record.id;
  }

  const scalar = {
    category: data.category, style: data.style, baseSpirit: data.baseSpirit,
    method: data.method, difficulty: data.difficulty, prepTime: data.prepTime,
    abv: data.abv, glass: data.glass, ice: data.ice, garnish: data.garnish,
    origin: data.origin, originDate: data.originDate, rating: data.rating,
    tags: JSON.stringify(data.tags), notes: data.notes, variations: data.variations,
  };

  const ingredientCreate = data.ingredients.map(ing => ({
    ingredientId: ingredientIds[ing.name],
    amount: ing.amount, notes: ing.notes, order: ing.order,
  }));
  const instructionCreate = data.instructions.map((text, i) => ({ stepNumber: i + 1, text }));

  if (existing) {
    await prisma.cocktailIngredient.deleteMany({ where: { cocktailId: existing.id } });
    await prisma.instruction.deleteMany({ where: { cocktailId: existing.id } });
    await prisma.cocktail.update({
      where: { id: existing.id },
      data: { ...scalar, ingredients: { create: ingredientCreate }, instructions: { create: instructionCreate } },
    });
    return 'updated';
  }

  await prisma.cocktail.create({
    data: { name: data.name, ...scalar, ingredients: { create: ingredientCreate }, instructions: { create: instructionCreate } },
  });
  return 'created';
}

function componentPayload(data: BaseRecipe & { [k: string]: unknown }) {
  return {
    name: data.name,
    difficulty: data.difficulty,
    prepTime: data.prepTime,
    shelfLife: data.shelfLife,
    storage: data.storage,
    yield: data.yield,
    tags: JSON.stringify(data.tags),
    ingredients: JSON.stringify(data.ingredients),
    instructions: JSON.stringify(data.instructions),
    notes: data.notes,
    usedIn: JSON.stringify(data.usedIn),
    variations: data.variations,
  };
}

async function importComponent(data: SyrupRecipe | InfusionRecipe | LiqueurRecipe | ShrubRecipe | OtherRecipe, skipExisting: boolean): Promise<ImportResult> {
  const payload = componentPayload(data as BaseRecipe & { [k: string]: unknown });

  if (data.type === 'Syrup') {
    const d = data as SyrupRecipe;
    const existing = await prisma.syrup.findUnique({ where: { name: d.name } });
    if (existing && skipExisting) return 'skipped';
    const extra = { type: 'Syrup', ratio: d.ratio, sugarType: d.sugarType };
    if (existing) { await prisma.syrup.update({ where: { id: existing.id }, data: { ...payload, ...extra } }); return 'updated'; }
    await prisma.syrup.create({ data: { ...payload, ...extra } });
    return 'created';
  }

  if (data.type === 'Infusion') {
    const d = data as InfusionRecipe;
    const existing = await prisma.infusion.findUnique({ where: { name: d.name } });
    if (existing && skipExisting) return 'skipped';
    const extra = { type: 'Infusion', baseSpirit: d.baseSpirit };
    if (existing) { await prisma.infusion.update({ where: { id: existing.id }, data: { ...payload, ...extra } }); return 'updated'; }
    await prisma.infusion.create({ data: { ...payload, ...extra } });
    return 'created';
  }

  if (data.type === 'Liqueur') {
    const d = data as LiqueurRecipe;
    const existing = await prisma.liqueur.findUnique({ where: { name: d.name } });
    if (existing && skipExisting) return 'skipped';
    const extra = { type: 'Liqueur', baseSpirit: d.baseSpirit };
    if (existing) { await prisma.liqueur.update({ where: { id: existing.id }, data: { ...payload, ...extra } }); return 'updated'; }
    await prisma.liqueur.create({ data: { ...payload, ...extra } });
    return 'created';
  }

  if (data.type === 'Shrub') {
    const d = data as ShrubRecipe;
    const existing = await prisma.shrub.findUnique({ where: { name: d.name } });
    if (existing && skipExisting) return 'skipped';
    const extra = { type: 'Shrub', base: d.base };
    if (existing) { await prisma.shrub.update({ where: { id: existing.id }, data: { ...payload, ...extra } }); return 'updated'; }
    await prisma.shrub.create({ data: { ...payload, ...extra } });
    return 'created';
  }

  // OtherRecipe
  const d = data as OtherRecipe;
  const existing = await prisma.otherRecipe.findUnique({ where: { name: d.name } });
  if (existing && skipExisting) return 'skipped';
  const extra = { type: 'Other', shelfLife: d.shelfLife, metadata: JSON.stringify(d.metadata) };
  if (existing) { await prisma.otherRecipe.update({ where: { id: existing.id }, data: { ...payload, ...extra } }); return 'updated'; }
  await prisma.otherRecipe.create({ data: { ...payload, ...extra } });
  return 'created';
}

async function importRecipe(recipe: ParsedRecipe, skipExisting: boolean): Promise<ImportResult> {
  if (recipe.type === 'Cocktail') return importCocktail(recipe, skipExisting);
  return importComponent(recipe as SyrupRecipe | InfusionRecipe | LiqueurRecipe | ShrubRecipe | OtherRecipe, skipExisting);
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function collectFiles(target: string, recursive: boolean): string[] {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return target.endsWith('.md') ? [target] : [];

  const entries = fs.readdirSync(target, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(target, entry.name);
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    } else if (entry.isDirectory() && recursive) {
      files.push(...collectFiles(full, true));
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipExisting = args.includes('--skip-existing');
  const recursive = args.includes('--recursive');
  const target = args.find(a => !a.startsWith('--'));

  if (!target) {
    console.error('Usage: npx tsx scripts/import-recipes.ts <folder-or-file> [--recursive] [--dry-run] [--skip-existing]');
    process.exit(1);
  }

  const files = collectFiles(path.resolve(target), recursive);
  console.log(`\nFound ${files.length} file(s)${dryRun ? ' (dry run)' : ''}\n`);

  const counts = { created: 0, updated: 0, skipped: 0, errors: 0 };
  const byType: Record<string, number> = {};

  for (const file of files) {
    const name = path.basename(file, '.md');
    try {
      const parsed = parseFile(file);
      byType[parsed.type] = (byType[parsed.type] ?? 0) + 1;

      if (dryRun) {
        const extra =
          parsed.type === 'Cocktail'
            ? `${parsed.ingredients.length} ingredients, ${parsed.instructions.length} steps`
            : `${(parsed as BaseRecipe).ingredients.length} ingredients`;
        console.log(`  [${parsed.type}] ${name} — ${extra}`);
        continue;
      }

      const result = await importRecipe(parsed, skipExisting);
      counts[result]++;
      const icon = result === 'created' ? '✓' : result === 'updated' ? '↻' : '–';
      console.log(`  ${icon} [${parsed.type}] ${name} (${result})`);
    } catch (err) {
      counts.errors++;
      console.error(`  ✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (dryRun) {
    console.log('\nType breakdown:');
    for (const [type, count] of Object.entries(byType)) console.log(`  ${type}: ${count}`);
  } else {
    console.log(`\nDone: ${counts.created} created, ${counts.updated} updated, ${counts.skipped} skipped, ${counts.errors} errors`);
    if (Object.keys(byType).length > 1) {
      console.log('Type breakdown:', Object.entries(byType).map(([t, n]) => `${t}: ${n}`).join(', '));
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
