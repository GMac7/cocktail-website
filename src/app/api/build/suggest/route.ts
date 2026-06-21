import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getBuilderContext } from '@/lib/builderContext';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STEP_LABELS: Record<string, string> = {
  spirit: 'base spirit',
  modifier: 'modifier (vermouth, aperitif, or secondary spirit)',
  sweetener: 'sweetener (syrup, honey, or sweet liqueur)',
  acid: 'acid (citrus juice, shrub, or verjuice)',
  accent: 'accent (bitters, liqueur, or unusual element)',
};

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('admin_auth')?.value;
  if (!sessionCookie || sessionCookie !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inspiration, step, chosen } = await req.json();

  const chosenSummary = chosen?.length
    ? `Already chosen: ${chosen.map((c: { name: string; step: string }) => `${c.name} as ${c.step}`).join(', ')}.`
    : '';

  const { suggest: userStyle } = await getBuilderContext();

  const prompt = `${userStyle ? userStyle + '\n' : ''}Cocktail inspiration: "${inspiration}". ${chosenSummary}
Suggest 3 options for the ${STEP_LABELS[step]}.
Return JSON only: {"suggestions":[{"name":"...","reason":"..."}]}
Keep each reason under 10 words. Be specific to the inspiration and prior choices.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: 'You are a cocktail expert. Return only valid JSON, no other text.',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (msg.content[0] as { type: 'text'; text: string }).text.trim();
  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    // Extract JSON if model added extra text
    const match = text.match(/\{[\s\S]*\}/);
    return NextResponse.json(match ? JSON.parse(match[0]) : { suggestions: [] });
  }
}
