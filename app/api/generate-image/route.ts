import { generateText } from 'ai';
import { z } from 'zod';
import { createGatewayClient } from '@/lib/ai';
import { FORCED_IMAGE_MODELS, AVAILABLE_IMAGE_MODELS } from '@/lib/models';
import { checkRateLimit, extractBearerToken, getClientId, isModelAllowed } from '@/lib/security';

export const runtime = 'nodejs'; // Switch to nodejs for better logging

// Simple placeholder SVG as base64 data URI
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMyMDIwMjAiLz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSIjRkZCMzAwIi8+PHBhdGggZD0iTTEyOCAzMjBDMTI4IDI4MCAyMDAgMjQwIDI1NiAyNDBDMzEyIDI0MCAzODQgMjgwIDM4NCAzMjBWNDAwSDEyOFYzMjBaIiBmaWxsPSIjOEI0NTEzIi8+PHRleHQgeD0iMjU2IiB5PSI0NzAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBHZW5lcmF0aW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

const payloadSchema = z.object({
    prompt: z.string().min(1).max(400),
    chef: z.object({
        id: z.enum(['openai', 'anthropic', 'google', 'xai']),
        modelId: z.string().optional(),
        imageModelId: z.string().optional(),
    }),
});

export async function POST(req: Request) {
    try {
        const clientId = getClientId(req);
        const rate = checkRateLimit(clientId, 10, 60_000);
        if (!rate.allowed) {
            return new Response("Too Many Requests", { status: 429, headers: { 'Retry-After': Math.ceil((rate.resetAt - Date.now()) / 1000).toString() } });
        }

        const token = extractBearerToken(req);
        if (!token) {
            return new Response("Missing Authorization header", { status: 401 });
        }

        const body = await req.json();
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
            return new Response("Invalid payload", { status: 400 });
        }

        const { prompt, chef } = parsed.data;
        const providerId = chef?.id as keyof typeof FORCED_IMAGE_MODELS | undefined;
        const forcedModel = providerId ? FORCED_IMAGE_MODELS[providerId] : FORCED_IMAGE_MODELS.openai;
        const allowedModels = providerId ? AVAILABLE_IMAGE_MODELS[providerId].map(m => m.id) : [];

        const requestedImageModel = chef?.imageModelId && allowedModels.includes(chef.imageModelId) ? chef.imageModelId : forcedModel;
        if (providerId && !isModelAllowed(providerId, requestedImageModel, AVAILABLE_IMAGE_MODELS)) {
            return new Response("Image model not allowed for provider", { status: 400 });
        }

        const fullPrompt = `Generate an image of: ${prompt}. Style: high-quality professional food photography, 8k resolution, studio lighting, overhead shot, vibrant colors, photorealistic, plated beautifully on a white plate.`;

        const gateway = createGatewayClient(token);

        console.log(`[Image Gen] Using model: ${requestedImageModel} (forced for all providers)`);

        const result = await generateText({
            model: gateway(requestedImageModel),
            prompt: fullPrompt,
        });

        console.log(`[Image Gen] Result:`, JSON.stringify({
            hasFiles: !!result.files,
            filesCount: result.files?.length ?? 0,
            hasSteps: !!result.steps,
            stepFilesCount: (result.steps || []).reduce((acc: number, s: any) => acc + ((s?.files || []).length || 0), 0),
            resolvedOutputHasFiles: !!(result as any).resolvedOutput?.files,
            resultKeys: Object.keys(result as any),
        }, null, 2));

        const collectedFiles: any[] = [];
        if (result.files && result.files.length > 0) collectedFiles.push(...result.files);
        if (result.steps && result.steps.length > 0) {
            result.steps.forEach((step: any) => {
                if (step?.files?.length) collectedFiles.push(...step.files);
            });
        }
        const resolvedFiles = (result as any).resolvedOutput?.files;
        if (resolvedFiles?.length) collectedFiles.push(...resolvedFiles);

        let base64Image: string | undefined;
        let directUrl: string | undefined;

        if (collectedFiles.length > 0) {
            const imageFile = collectedFiles[0];
            console.log(`[Image Gen] File keys:`, Object.keys(imageFile));

            if ('base64' in imageFile && imageFile.base64) {
                base64Image = imageFile.base64;
            } else if ('data' in imageFile && imageFile.data) {
                base64Image = imageFile.data;
            } else if ('url' in imageFile && imageFile.url) {
                directUrl = imageFile.url;
            } else if ('uint8Array' in imageFile && imageFile.uint8Array) {
                const bytes = imageFile.uint8Array;
                base64Image = Buffer.from(bytes).toString('base64');
            }
        }

        if (!base64Image && !directUrl) {
            console.log(`[Image Gen] No image in result, using placeholder`);
            return Response.json({
                imageUrl: PLACEHOLDER_IMAGE,
                isPlaceholder: true
            });
        }

        return Response.json({ imageUrl: base64Image ?? directUrl, isUrl: !!directUrl });

    } catch (error: any) {
        console.error("Image Gen Error:", error);
        return Response.json({
            imageUrl: PLACEHOLDER_IMAGE,
            isPlaceholder: true,
            error: error.message
        });
    }
}
