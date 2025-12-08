import { generateText } from 'ai';
import { z } from 'zod';
import { createGatewayClient } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/prompts';
import { AVAILABLE_MODELS } from '@/lib/models';
import { checkRateLimit, extractBearerToken, getClientId, isModelAllowed } from '@/lib/security';
export const runtime = 'nodejs';

const payloadSchema = z.object({
    chef: z.object({
        id: z.enum(['openai', 'anthropic', 'google', 'xai']),
        name: z.string().min(1).max(80),
        modelId: z.string().min(1),
        imageModelId: z.string().optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().optional(),
        color: z.string().optional(),
    }),
    ingredients: z.array(z.string().trim().min(1).max(80)).length(4, "Exactly 4 ingredients required"),
    roundNumber: z.number().int().min(1).max(5).default(1),
    usePersonas: z.boolean().optional(),
});

export async function POST(req: Request) {
    try {
        const clientId = getClientId(req);
        const rate = checkRateLimit(clientId, 20, 60_000);
        if (!rate.allowed) {
            return new Response("Too Many Requests", { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } });
        }

        const token = extractBearerToken(req);
        if (!token) {
            return new Response("Missing Authorization header", { status: 401 });
        }

        const json = await req.json();
        const parsed = payloadSchema.safeParse(json);
        if (!parsed.success) {
            return new Response("Invalid payload", { status: 400 });
        }

        const { chef, ingredients, roundNumber, usePersonas } = parsed.data;

        if (!isModelAllowed(chef.id, chef.modelId, AVAILABLE_MODELS)) {
            return new Response("Model not allowed for provider", { status: 400 });
        }

        const gateway = createGatewayClient(token);

        console.log(`[Chef Turn] Model: ${chef.modelId}`);

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

            const match = cleaned.match(/{[\s\S]*}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch { }
            }

            // Best-effort extraction when JSON is almost valid (e.g., missing comma)
            const extract = (key: string) => {
                const r = new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"`, 'i');
                const m = cleaned.match(r);
                return m ? m[1].replace(/\\"/g, '"').trim() : undefined;
            };
            const dishTitle = extract('dishTitle');
            const monologue = extract('monologue');
            const shortImagePrompt = extract('shortImagePrompt');
            if (dishTitle || monologue || shortImagePrompt) {
                return { dishTitle, monologue, shortImagePrompt };
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
