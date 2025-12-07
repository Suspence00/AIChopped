import { createGateway } from '@ai-sdk/gateway';

// This function constructs a client that points to the Vercel AI Gateway using the Gateway provider,
// which supports image-capable/multimodal models.
export const createGatewayClient = (apiKey: string) => {
    const token = apiKey || process.env.AI_GATEWAY_API_KEY;

    if (!token) {
        throw new Error("Missing AI Gateway API Key. Please configure it in Settings.");
    }

    // Use the Gateway provider pointed at Vercel AI Gateway.
    // The provider expects the /v1/ai base URL (it will append /language-model, etc).
    const gateway = createGateway({
        baseURL: 'https://ai-gateway.vercel.sh/v1/ai',
        apiKey: token,
    });

    return (modelId: string) => gateway(modelId);
};
