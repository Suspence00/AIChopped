const { createGateway } = require('@ai-sdk/gateway');
const { generateText } = require('ai');
const fs = require('fs');
const path = require('path');

const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error('Missing AI_GATEWAY_API_KEY');
  process.exit(1);
}

const gw = createGateway({ baseURL: 'https://ai-gateway.vercel.sh/v1/ai', apiKey });
const baskets = [
  ['Fruit and Nut Bars', 'Turkey Giblets', 'Potato Latkes', 'Kosher Shrimp'],
  ['Sourdough Bread', 'Pork Tenderloin', 'Pickled Radish', 'Blackberries'],
  ['Coconut Milk', 'Dark Chocolate', 'Blood Orange', 'Pistachios'],
];
const chefBio = 'A passionate home cook from a vibrant multicultural family, Sophia brings a global flair to her cooking with bold flavors and family recipes.';
const personaName = 'Chef Claude';
const personaStyle = 'Sophisticated, articulate, focused on ethical sourcing and balance.';

const systemPrompt = (roundNumber, ingredients) => `You are ${personaName}, a contestant on the cooking show "Chopped".
Your personality is: ${personaStyle}.

This is the ${roundNumber === 1 ? 'Appetizer' : roundNumber === 2 ? 'Entree' : 'Dessert'} Round (Round ${roundNumber}).
Chef bio: ${chefBio}
Use this backstory to flavor the tone and dish concept.
The judges have given you 4 mystery ingredients: ${ingredients.join(', ')}.
You must create a ${roundNumber === 1 ? 'Appetizer' : roundNumber === 2 ? 'Entree' : 'Dessert'} dish that uses ALL 4 ingredients.
${roundNumber === 1 ? 'Create a starter dish that teases the palate. Small portion, high flavor impact.' : roundNumber === 2 ? 'Create a substantial main course. Balanced, filling, and technically proficient.' : 'Create a sweet conclusion to the meal. You must make a dessert.'}

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

const clean = (t) => t.replace(/```json/gi, '').replace(/```/g, '').trim();
const parse = (t) => {
  const c = clean(t);
  try { return JSON.parse(c); } catch {}
  const m = c.match(/{[\s\S]*}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return { monologue: c };
};

const extractImage = (res) => {
  const files = [];
  if (res?.files?.length) files.push(...res.files);
  if (res?.steps?.length) res.steps.forEach(s => { if (s?.files?.length) files.push(...s.files); });
  const rf = res?.resolvedOutput?.files;
  if (rf?.length) files.push(...rf);
  if (!files.length) return undefined;
  const f = files[0];
  if (f.base64) return `data:image/png;base64,${f.base64}`;
  if (f.data) return `data:image/png;base64,${f.data}`;
  if (f.url) return f.url;
  if (f.uint8Array) return `data:image/png;base64,${Buffer.from(f.uint8Array).toString('base64')}`;
};

(async () => {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const round = i + 1;
    const ingredients = baskets[i];
    const { text } = await generateText({
      model: gw('anthropic/claude-3-haiku'),
      system: systemPrompt(round, ingredients),
      prompt: `Here are the ingredients: ${ingredients.join(', ')}. Present your dish.`,
      temperature: 0.8,
    });
    const data = parse(text);
    if (!data.dishTitle) data.dishTitle = 'Chef Special';
    const imagePrompt = data.shortImagePrompt || data.dishTitle;
    const imgRes = await generateText({ model: gw('google/gemini-2.5-flash-image'), prompt: imagePrompt });
    const imgData = extractImage(imgRes);
    const filePath = path.join('public', 'demo', `dish-anthropic-r${round}.png`);
    if (imgData?.startsWith('data:image')) {
      const b64 = imgData.split(',')[1];
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
      out.push({ ...data, roundNumber: round, chefId: 'anthropic', ingredientsUsed: ingredients, imageUrl: `/demo/dish-anthropic-r${round}.png` });
    } else {
      out.push({ ...data, roundNumber: round, chefId: 'anthropic', ingredientsUsed: ingredients, imageUrl: imgData });
    }
  }
  console.log(JSON.stringify(out, null, 2));
})();
