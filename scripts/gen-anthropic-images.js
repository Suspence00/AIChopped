const { createGateway } = require('@ai-sdk/gateway');
const { generateText } = require('ai');
const fs = require('fs');

const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) { console.error('Missing key'); process.exit(1); }
const gw = createGateway({ baseURL: 'https://ai-gateway.vercel.sh/v1/ai', apiKey });

const prompts = [
  'Three crispy potato latke bites topped with seared shrimp, with a vibrant green tapenade and fresh herbs on a small plate, professional food photography',
  'Seared pork medallions on a plate topped with a vibrant blackberry-radish relish, with toasted sourdough crostini alongside, professional food photography',
  'A smooth dark chocolate terrine on a white plate, topped with blood orange compote and pistachio crumble, with fresh orange segments around, professional dessert photography'
];

const extract = (res) => {
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
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const res = await generateText({ model: gw('google/gemini-2.5-flash-image'), prompt });
    const img = extract(res);
    const file = `public/demo/dish-anthropic-r${i+1}.png`;
    if (img?.startsWith('data:image')) {
      const b64 = img.split(',')[1];
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      console.log('wrote', file);
    } else if (img) {
      console.log('url', img);
    } else {
      console.log('no image for', prompt);
    }
  }
})();
