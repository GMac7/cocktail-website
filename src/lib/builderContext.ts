import { prisma } from './prisma';

type BuilderContext = { suggest: string; assemble: string };

let cache: BuilderContext | null = null;
let cacheAt = 0;
const TTL = 5 * 60 * 1000;

export async function getBuilderContext(): Promise<BuilderContext> {
  if (cache && Date.now() - cacheAt < TTL) return cache;

  const recipes = await prisma.cocktail.findMany({
    where: { rating: { gte: 8 } },
    select: {
      method: true,
      baseSpirit: true,
      ingredients: { include: { ingredient: true } },
    },
  });

  if (recipes.length === 0) {
    cache = { suggest: '', assemble: '' };
    cacheAt = Date.now();
    return cache;
  }

  const hasAcid = (r: typeof recipes[number]) =>
    r.ingredients.some(i => /lemon|lime|grapefruit|orange juice|shrub|verjuice|citrus|vinegar/i.test(i.ingredient.name));

  // Method rules derived from actual recipe patterns
  const shakenWithAcid = recipes.filter(r => r.method === 'Shaken' && hasAcid(r)).length;
  const stirredNoAcid = recipes.filter(r => r.method === 'Stirred' && !hasAcid(r)).length;
  const methodRules: string[] = [];
  if (shakenWithAcid > 0) methodRules.push('citrus/shrub/acid present → Shaken');
  if (stirredNoAcid > 0) methodRules.push('no citrus, spirit-forward → Stirred');

  // Spirit preferences
  const spiritCounts: Record<string, number> = {};
  for (const r of recipes) {
    if (r.baseSpirit) spiritCounts[r.baseSpirit] = (spiritCounts[r.baseSpirit] ?? 0) + 1;
  }
  const topSpirits = Object.entries(spiritCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s]) => s);

  // Compact proven pairings (ingredient names only, no amounts)
  const pairings = recipes.slice(0, 8).map(r => {
    const ings = r.ingredients.slice(0, 4).map(i => i.ingredient.name).join(', ');
    return `${r.method}(${ings})`;
  }).join(' | ');

  const suggest = topSpirits.length > 0
    ? `User's preferred spirits: ${topSpirits.join(', ')}.`
    : '';

  const assemble = [
    methodRules.length > 0 ? `Method rules from user's collection: ${methodRules.join('; ')}.` : '',
    pairings ? `Proven combos: ${pairings}.` : '',
  ].filter(Boolean).join(' ');

  cache = { suggest, assemble };
  cacheAt = Date.now();
  return cache;
}
