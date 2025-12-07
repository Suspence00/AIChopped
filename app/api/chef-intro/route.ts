import { generateText } from 'ai';
import { createGatewayClient } from '@/lib/ai';

export const runtime = 'nodejs';

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
