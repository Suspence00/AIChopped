import { generateText } from 'ai';
import { createGatewayClient } from '@/lib/ai';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { chef, apiKey } = await req.json();

        if (!chef) {
            return new Response("Missing chef payload", { status: 400 });
        }

        const gateway = createGatewayClient(apiKey);

        const { text } = await generateText({
            model: gateway(chef.modelId),
            system: `You are an energetic cooking show contestant. Respond only with compact JSON for your on-screen lower-third.`,
            prompt: `Create a unique but realistic human name for yourself (avoid obvious AI names, keep it plausible for TV) and a 1 sentence backstory (max 25 words).
Output JSON with keys: name, bio. No markdown, no code fences.`,
            temperature: 0.9
        });

        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        let data: any;

        try {
            data = JSON.parse(cleaned);
        } catch (e) {
            data = { name: chef.name, bio: cleaned.slice(0, 180) };
        }

        return Response.json({
            name: data.name || chef.name,
            bio: data.bio || data.backstory || "A mysterious chef ready to compete."
        });
    } catch (error: any) {
        console.error("Chef intro failed:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
