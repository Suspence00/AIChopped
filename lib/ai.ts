import { createGateway } from '@ai-sdk/gateway';

// Construct a Gateway client using an explicitly provided token.
// We intentionally do not fall back to process.env so that server secrets
// are never used implicitly by untrusted callers.
export const createGatewayClient = (apiKey: string) => {
    const token = apiKey?.trim();

    if (!token) {
        throw new Error("Missing AI Gateway API Key. Authorization header required.");
    }

    const gateway = createGateway({
        baseURL: 'https://ai-gateway.vercel.sh/v1/ai',
        apiKey: token,
    });

    return (modelId: string) => gateway(modelId);
};
