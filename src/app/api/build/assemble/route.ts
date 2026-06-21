import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getBuilderContext } from '@/lib/builderContext';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('admin_auth')?.value;
  if (!sessionCookie || sessionCookie !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inspiration, chosen } = await req.json();

  const ingredientList = chosen.map((c: { name: string; step: string }) => `${c.name} (${c.step})`).join(', ');

  const { assemble: userContext } = await getBuilderContext();

  const prompt = `${userContext ? userContext + '\n' : ''}Build a cocktail recipe using these ingredients: ${ingredientList}. Inspired by: "${inspiration}".
Return JSON only:
{
  "method": "Stirred|Shaken|Built|Blended",
  "glass": "glass type",
  "ice": "ice style",
  "ingredients": [{"name":"...","amount":"..."}],
  "garnish": "...",
  "ratioNotes": "one sentence on balance"
}
Use classic ratios. Include all chosen ingredients. Add water/ice dilution note if stirred.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: 'You are a cocktail expert. Return only valid JSON, no other text.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (msg.content[0] as { type: 'text'; text: string }).text.trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    return NextResponse.json(match ? JSON.parse(match[0]) : {});
  }
}
