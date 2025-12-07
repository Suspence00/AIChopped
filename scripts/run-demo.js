// Temporary script to run a full sample game using the AI Gateway key.
// Generates chef intros (with portraits) and three rounds of dishes (with images),
// then writes results to scripts/demo-run.json.

const fs = require('fs');
const path = require('path');
const { createGateway } = require('@ai-sdk/gateway');
const { generateText } = require('ai');

const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error('Missing AI_GATEWAY_API_KEY');
  process.exit(1);
}

const gateway = createGateway({
  baseURL: 'https://ai-gateway.vercel.sh/v1/ai',
  apiKey,
});

const providerModel = (id) => gateway(id);

const CHEFS = [
  { id: 'anthropic', name: 'Chef Claude', modelId: 'anthropic/claude-3-haiku', color: 'bg-orange-600' },
  { id: 'google', name: 'Chef Gemini', modelId: 'google/gemini-2.5-flash-lite', color: 'bg-blue-600' },
  { id: 'openai', name: 'Chef GPT', modelId: 'openai/gpt-5-nano', color: 'bg-green-600' },
  { id: 'xai', name: 'Chef Grok', modelId: 'xai/grok-4.1-fast-reasoning', color: 'bg-gray-600' },
];

const BASKETS = [
  ['Fruit and Nut Bars', 'Turkey Giblets', 'Potato Latkes', 'Kosher Shrimp'],
  ['Sourdough Bread', 'Pork Tenderloin', 'Pickled Radish', 'Blackberries'],
  ['Coconut Milk', 'Dark Chocolate', 'Blood Orange', 'Pistachios'],
];

const roundMeta = (roundNumber) => {
  if (roundNumber === 1) return { roundType: 'Appetizer', instruction: 'Create a starter dish that teases the palate. Small portion, high flavor impact.' };
  if (roundNumber === 2) return { roundType: 'Entree', instruction: 'Create a substantial main course. Balanced, filling, and technically proficient.' };
  return { roundType: 'Dessert', instruction: 'Create a sweet conclusion to the meal. You must make a dessert.' };
};

const buildSystemPrompt = (chefId, ingredients, roundNumber, bio) => {
  const meta = roundMeta(roundNumber);
  const personaName = {
    anthropic: 'Chef Claude',
    google: 'Chef Gemini',
    openai: 'Chef GPT',
    xai: 'Chef Grok',
  }[chefId] || 'AI Chef';
  const style = {
    anthropic: 'Sophisticated, articulate, focused on ethical sourcing and balance.',
    google: 'Data-driven, multimodal, and experimental.',
    openai: 'Precise, technical, and enthusiastic.',
    xai: 'Edgy, witty, and unconventional.',
  }[chefId] || 'Creative and confident.';

  const bioLine = bio ? `\nChef bio: ${bio}\nUse this backstory to flavor the tone and dish concept.` : '';

  return `You are ${personaName}, a contestant on the cooking show "Chopped".
Your personality is: ${style}.

This is the ${meta.roundType} Round (Round ${roundNumber}).${bioLine}
The judges have given you 4 mystery ingredients: ${ingredients.join(', ')}.
You must create a ${meta.roundType} dish that uses ALL 4 ingredients.
${meta.instruction}

You must respond in a standardized JSON format so I can display your result on the show.
Do NOT output markdown code blocks. Just the raw JSON.

Rules:
1. Start your monologue with "Today for you judges, I have made..."
2. Explain how you transformed the ingredients.
3. Be creative but realistic.

JSON Structure:
{
  "dishTitle": "Name of your dish",
  "monologue": "Your spoken presentation to the judges...",
  "shortImagePrompt": "A visual description of the plated dish for a photographer."
}`;
};

const parseJsonLoose = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/{[\s\S]*}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) { }
    }
  }
  return null;
};

const extractImageFromResult = (result) => {
  const collected = [];
  if (result?.files?.length) collected.push(...result.files);
  if (result?.steps?.length) {
    result.steps.forEach((s) => {
      if (s?.files?.length) collected.push(...s.files);
    });
  }
  const resolvedFiles = result?.resolvedOutput?.files;
  if (resolvedFiles?.length) collected.push(...resolvedFiles);
  if (!collected.length) return undefined;
  const f = collected[0];
  if (f.base64) return `data:image/png;base64,${f.base64}`;
  if (f.data) return `data:image/png;base64,${f.data}`;
  if (f.url) return f.url;
  if (f.uint8Array) return `data:image/png;base64,${Buffer.from(f.uint8Array).toString('base64')}`;
  return undefined;
};

async function generateIntro(chef) {
  const { text } = await generateText({
    model: providerModel(chef.modelId),
    system: 'You are an energetic cooking show contestant. Respond only with compact JSON for your on-screen lower-third.',
    prompt: 'Create a unique but realistic human name for yourself (avoid obvious AI names, keep it plausible for TV) and a 1 sentence backstory (max 25 words).\nOutput JSON with keys: name, bio. No markdown, no code fences.',
    temperature: 0.9,
  });

  const parsed = parseJsonLoose(text) || {};
  const name = parsed.name || chef.name;
  const bio = parsed.bio || parsed.backstory || 'A mysterious chef ready to compete.';

  const portraitPrompt = `Cinematic portrait of a chef named ${name}, ${bio}. Photorealistic, professional studio lighting, head and shoulders, confident smile, wearing a chef coat.`;
  let avatarUrl;
  try {
    const portraitRes = await generateText({
      model: providerModel('google/gemini-2.5-flash-image'),
      prompt: portraitPrompt,
    });
    avatarUrl = extractImageFromResult(portraitRes);
  } catch (err) {
    console.error('Portrait failed for', name, err);
  }

  return { ...chef, name, bio, avatarUrl };
}

async function generateDish(chef, ingredients, roundNumber) {
  const { text } = await generateText({
    model: providerModel(chef.modelId),
    system: buildSystemPrompt(chef.id, ingredients, roundNumber, chef.bio),
    prompt: `Here are the ingredients: ${ingredients.join(', ')}. Present your dish.`,
    temperature: 0.8,
  });
  const parsed = parseJsonLoose(text) || {};
  const dishTitle = parsed.dishTitle || 'Chef Special';
  const monologue = parsed.monologue || text;
  const shortImagePrompt = parsed.shortImagePrompt || dishTitle;

  let imageUrl;
  try {
    const imgRes = await generateText({
      model: providerModel('google/gemini-2.5-flash-image'),
      prompt: shortImagePrompt,
    });
    imageUrl = extractImageFromResult(imgRes);
  } catch (err) {
    console.error('Image failed for', chef.name, 'round', roundNumber, err);
  }

  return {
    roundNumber,
    chefId: chef.id,
    title: dishTitle,
    description: monologue,
    ingredientsUsed: ingredients,
    imageUrl,
  };
}

async function main() {
  const results = { chefs: [], baskets: BASKETS, dishes: {} };

  for (const chef of CHEFS) {
    const intro = await generateIntro(chef);
    results.chefs.push(intro);
  }

  for (const chef of results.chefs) {
    results.dishes[chef.id] = [];
    for (let i = 0; i < BASKETS.length; i++) {
      const roundNum = i + 1;
      const dish = await generateDish(chef, BASKETS[i], roundNum);
      results.dishes[chef.id].push(dish);
    }
  }

  const outPath = path.join(__dirname, 'demo-run.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Demo run written to', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
