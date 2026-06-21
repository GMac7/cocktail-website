import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseMarkdown(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const get = (label: string) => {
    const match = content.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`));
    return match ? match[1].trim() : '';
  };

  const name = content.match(/^# (.+)$/m)?.[1] || '';
  const category = get('Category');
  const style = get('Style');
  const baseSpirit = get('Base Spirit');
  const method = get('Method');
  const difficulty = get('Difficulty');
  const prepTime = get('Prep Time');
  const abv = get('ABV');
  const glass = get('Glass');
  const ice = get('Ice');
  const garnish = get('Garnish');
  const origin = get('Origin');
  const originDate = get('Origin Date');
  const rating = parseInt(get('Rating')) || 0;
  const tags = (get('Tags').match(/#\w+/g) || []).map(t => t.replace('#', ''));
  const notes = get('Notes');
  const variations = '';

  // Ingredients
  const ingredientsSection = content.match(/## Ingredients([\s\S]+?)(##|$)/);
  const ingredients = (ingredientsSection ? ingredientsSection[1] : '')
    .split('\n')
    .map(line => line.replace(/^- /, '').trim())
    .filter(Boolean);

  // Instructions
  const instructionsSection = content.match(/## Instructions([\s\S]+?)(##|$)/);
  const instructions = (instructionsSection ? instructionsSection[1] : '')
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  return {
    name, category, style, baseSpirit, method, difficulty, prepTime, abv, glass, ice, garnish,
    origin, originDate, rating, tags, notes, variations, ingredients, instructions
  };
}

async function main() {
  // Path to your markdown file
  const filePath = path.join(__dirname, 'Old Fashioned.md');
  const data = parseMarkdown(filePath);

  // Upsert ingredients
  const ingredientIds: { [name: string]: number } = {};
  for (const line of data.ingredients) {
    // e.g. "2 oz Bourbon"
    const match = line.match(/^([\d./\s\w]+)\s+(.+)$/);
    const amount = match ? match[1].trim() : '';
    const name = match ? match[2].trim() : line;
    const ing = await prisma.ingredient.upsert({
      where: { name },
      update: {},
      create: { name, type: '', brand: '' }
    });
    ingredientIds[name] = ing.id;
  }

  // Create cocktail
  const cocktail = await prisma.cocktail.create({
    data: {
      name: data.name,
      category: data.category,
      style: data.style,
      baseSpirit: data.baseSpirit,
      method: data.method,
      difficulty: data.difficulty,
      prepTime: data.prepTime,
      abv: data.abv,
      glass: data.glass,
      ice: data.ice,
      garnish: data.garnish,
      origin: data.origin,
      originDate: data.originDate,
      rating: data.rating,
      tags: JSON.stringify(data.tags),
      notes: data.notes,
      variations: data.variations,
      ingredients: {
        create: data.ingredients.map((line, idx) => {
          const match = line.match(/^([\d./\s\w]+)\s+(.+)$/);
          const amount = match ? match[1].trim() : '';
          const name = match ? match[2].trim() : line;
          return {
            ingredient: { connect: { id: ingredientIds[name] } },
            amount,
            notes: '',
            order: idx + 1
          };
        })
      },
      instructions: {
        create: data.instructions.map((text, idx) => ({
          stepNumber: idx + 1,
          text
        }))
      }
    }
  });

  console.log('Imported:', cocktail.name);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());