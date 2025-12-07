import { generateText } from 'ai';
import { createGatewayClient } from '@/lib/ai';
import { FORCED_IMAGE_MODELS, AVAILABLE_IMAGE_MODELS } from '@/lib/models';

export const runtime = 'nodejs'; // Switch to nodejs for better logging

// Simple placeholder SVG as base64
const PLACEHOLDER_IMAGE = 'PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9IiMyMDIwMjAiLz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSIjRkZCMzAwIi8+PHBhdGggZD0iTTEyOCAzMjBDMTI4IDI4MCAyMDAgMjQwIDI1NiAyNDBDMzEyIDI0MCAzODQgMjgwIDM4NCAzMjBWNDAwSDEyOFYzMjBaIiBmaWxsPSIjOEI0NTEzIi8+PHRleHQgeD0iMjU2IiB5PSI0NzAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBHZW5lcmF0aW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

export async function POST(req: Request) {
    try {
        const { prompt, apiKey, chef } = await req.json();
        const providerId = chef?.id as keyof typeof FORCED_IMAGE_MODELS | undefined;
        const forcedModel = providerId ? FORCED_IMAGE_MODELS[providerId] : FORCED_IMAGE_MODELS.openai;
        const allowedModels = providerId ? AVAILABLE_IMAGE_MODELS[providerId].map(m => m.id) : [];
        const modelId = (chef?.imageModelId && allowedModels.includes(chef.imageModelId)) ? chef.imageModelId : forcedModel;

        const fullPrompt = `Generate an image of: ${prompt}. Style: high-quality professional food photography, 8k resolution, studio lighting, overhead shot, vibrant colors, photorealistic, plated beautifully on a white plate.`;

        const gateway = createGatewayClient(apiKey);

        console.log(`[Image Gen] Using model: ${modelId} (forced for all providers)`);

        // Use multimodal text call that can return image files
        const result = await generateText({
            model: gateway(modelId),
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

        // Collect possible file outputs (direct files, step files, resolved output files)
        const collectedFiles: any[] = [];
        if (result.files && result.files.length > 0) collectedFiles.push(...result.files);
        if (result.steps && result.steps.length > 0) {
            result.steps.forEach((step: any) => {
                if (step?.files?.length) collectedFiles.push(...step.files);
            });
        }
        const resolvedFiles = (result as any).resolvedOutput?.files;
        if (resolvedFiles?.length) collectedFiles.push(...resolvedFiles);

        // Try to extract image from collected files
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

        // If no image, return placeholder with a note
        if (!base64Image && !directUrl) {
            console.log(`[Image Gen] No image in result, using placeholder`);
            // Return placeholder - the game can still proceed
            return Response.json({
                imageUrl: PLACEHOLDER_IMAGE,
                isPlaceholder: true
            });
        }

        return Response.json({ imageUrl: base64Image ?? directUrl, isUrl: !!directUrl });

    } catch (error: any) {
        console.error("Image Gen Error:", error);
        // Return placeholder on error so game can proceed
        return Response.json({
            imageUrl: PLACEHOLDER_IMAGE,
            isPlaceholder: true,
            error: error.message
        });
    }
}
