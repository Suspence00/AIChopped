import { generateText } from 'ai';
import { createGatewayClient } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/prompts';
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { chef, ingredients, apiKey, roundNumber, usePersonas } = await req.json();

        if (!chef || !ingredients) {
            return new Response("Missing chef or ingredients", { status: 400 });
        }

        const gateway = createGatewayClient(apiKey);

        console.log(`[Chef Turn] Model: ${chef.modelId}`);

        // Call AI Gateway w/ the specific model for this chef
        // The model ID 'openai/gpt-4o' or 'anthropic/claude-3-5-sonnet' is passed directly
        // Assuming the Gateway supports this format.
        const { text } = await generateText({
            model: gateway(chef.modelId),
            system: buildSystemPrompt(chef.id, ingredients, roundNumber, !!usePersonas, chef.bio),
            prompt: `Here are the ingredients: ${ingredients.join(', ')}. Present your dish.`,
            temperature: 0.8,
        });

        const tryParse = (raw: string) => {
            const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleaned);
            } catch { }

            // Try to extract first JSON object
            const match = cleaned.match(/{[\s\S]*}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch { }
            }
            return null;
        };

        let data = tryParse(text);

        if (!data || !data.dishTitle || !data.monologue) {
            console.error("Failed to parse JSON from model, using fallback", text);
            data = {
                dishTitle: data?.dishTitle || "Chef's Special",
                monologue: data?.monologue || text,
                shortImagePrompt: data?.shortImagePrompt || "A beautifully plated dish."
            };
        }

        return Response.json(data);
    } catch (error: any) {
        console.error("Chef Generation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
