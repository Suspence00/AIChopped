import { createGatewayClient } from '@/lib/ai';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { chef, prompt, apiKey } = await req.json();
        const modelId = chef.imageModelId;

        // Refined prompt
        const fullPrompt = `${prompt}, high-quality professional food photography, 8k resolution, studio lighting, overhead shot, vibrant colors, photorealistic.`;

        // Direct fetch to Vercel AI Gateway (OpenAI compatible endpoint)
        // We use the Gateway Base URL + v1/images/generations
        const gatewayUrl = 'https://gateway.ai.vercel.dev/v1/images/generations';

        const response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                // Important: Some gateways/proxies need model mapped.
                // Vercel AI Gateway generally just needs the body.
            },
            body: JSON.stringify({
                model: modelId, // e.g. 'openai/dall-e-3'
                prompt: fullPrompt,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gateway Error (${response.status}): ${err}`);
        }

        const data = await response.json();

        // OpenAI format: { data: [ { b64_json: "..." } ... ] }
        const base64Image = data.data?.[0]?.b64_json;

        if (!base64Image) {
            throw new Error("No image data returned");
        }

        return Response.json({ imageUrl: base64Image });

    } catch (error: any) {
        console.error("Image Gen Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
