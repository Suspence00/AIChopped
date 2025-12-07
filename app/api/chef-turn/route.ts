import { generateText } from 'ai';
import { createGatewayClient } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/prompts';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { chef, ingredients, apiKey, roundNumber } = await req.json();

        if (!chef || !ingredients) {
            return new Response("Missing chef or ingredients", { status: 400 });
        }

        const gateway = createGatewayClient(apiKey);

        // Call AI Gateway w/ the specific model for this chef
        // The model ID 'openai/gpt-4o' or 'anthropic/claude-3-5-sonnet' is passed directly
        // Assuming the Gateway supports this format.
        const { text } = await generateText({
            model: gateway(chef.modelId),
            system: buildSystemPrompt(chef.id, ingredients, roundNumber),
            prompt: `Here are the ingredients: ${ingredients.join(', ')}. Present your dish.`,
            temperature: 0.8,
        });

        // Attempt to clean/parse JSON
        // Models often wrap JSON in ```json ... ```
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse JSON from model", text);
            // Fallback or retry? For hackathon, simple fallback.
            data = {
                dishTitle: "Experimental Dish",
                monologue: text,
                shortImagePrompt: "A mysterious experimental dish."
            };
        }

        return Response.json(data);
    } catch (error: any) {
        console.error("Chef Generation Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
