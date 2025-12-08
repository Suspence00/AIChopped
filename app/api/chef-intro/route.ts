import { generateText } from 'ai';
import { z } from 'zod';
import { createGatewayClient } from '@/lib/ai';
import { AVAILABLE_MODELS } from '@/lib/models';
import { checkRateLimit, extractBearerToken, getClientId, isModelAllowed } from '@/lib/security';

export const runtime = 'nodejs';

const chefSchema = z.object({
    id: z.enum(['openai', 'anthropic', 'google', 'xai']),
    name: z.string().min(1).max(80),
    modelId: z.string().min(1),
    imageModelId: z.string().optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().optional(),
    color: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const clientId = getClientId(req);
        const rate = checkRateLimit(clientId, 15, 60_000);
        if (!rate.allowed) {
            return new Response("Too Many Requests", { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } });
        }

        const token = extractBearerToken(req);
        if (!token) {
            return new Response("Missing Authorization header", { status: 401 });
        }

        const body = await req.json();
        const parsed = z.object({ chef: chefSchema }).safeParse(body);
        if (!parsed.success) {
            return new Response("Invalid payload", { status: 400 });
        }

        const chef = parsed.data.chef;
        if (!isModelAllowed(chef.id, chef.modelId, AVAILABLE_MODELS)) {
            return new Response("Model not allowed for provider", { status: 400 });
        }

        const gateway = createGatewayClient(token);

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
        } catch {
            data = { name: chef.name, bio: cleaned.slice(0, 180) };
        }

        const finalName = data.name || chef.name;
        const finalBio = data.bio || data.backstory || "A mysterious chef ready to compete.";

        // Portrait generation (stick to Gemini 2.5 flash image for stability)
        const portraitModelId = 'google/gemini-2.5-flash-image';
        const portraitPrompt = `Cinematic portrait of a chef named ${finalName}, ${finalBio}. Photorealistic, professional studio lighting, head and shoulders, confident smile, wearing a chef coat.`;

        let avatarUrl: string | undefined;
        try {
            const result: any = await generateText({
                model: gateway(portraitModelId),
                prompt: portraitPrompt,
            });

            const collectedFiles: any[] = [];
            if (result?.files?.length) collectedFiles.push(...result.files);
            if (result?.steps?.length) {
                result.steps.forEach((step: any) => {
                    if (step?.files?.length) collectedFiles.push(...step.files);
                });
            }
            const resolvedFiles = (result as any)?.resolvedOutput?.files;
            if (resolvedFiles?.length) collectedFiles.push(...resolvedFiles);

            if (collectedFiles.length) {
                const imageFile = collectedFiles[0];
                if (imageFile.base64) avatarUrl = `data:image/png;base64,${imageFile.base64}`;
                else if (imageFile.data) avatarUrl = `data:image/png;base64,${imageFile.data}`;
                else if (imageFile.url) avatarUrl = imageFile.url;
                else if (imageFile.uint8Array) {
                    avatarUrl = `data:image/png;base64,${Buffer.from(imageFile.uint8Array).toString('base64')}`;
                }
            }
        } catch (err) {
            console.error("Portrait generation failed:", err);
        }

        return Response.json({
            name: finalName,
            bio: finalBio,
            imageUrl: avatarUrl
        });
    } catch (error: any) {
        console.error("Chef intro failed:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
