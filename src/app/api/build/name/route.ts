import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('admin_auth')?.value;
  if (!sessionCookie || sessionCookie !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inspiration, ingredients, method } = await req.json();

  const ingList = ingredients.map((i: { name: string }) => i.name).join(', ');

  const prompt = `Cocktail ingredients: ${ingList}. Method: ${method}. Inspired by: "${inspiration}".
Suggest 4 creative cocktail names. Evocative, not literal. 1-4 words each.
Return JSON only: {"names":["...","...","...","..."]}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    system: 'You are a creative cocktail namer. Return only valid JSON, no other text.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (msg.content[0] as { type: 'text'; text: string }).text.trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return NextResponse.json(match ? JSON.parse(match[0]) : { names: [] });
  }
}
