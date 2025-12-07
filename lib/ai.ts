import { createOpenAI } from '@ai-sdk/openai';

// This function constructs a client that points to the Vercel AI Gateway
// or a compatible endpoint.
export const createGatewayClient = (apiKey: string) => {
    // If the user provided a key (BYOK), use it.
    // Otherwise, fallback to env (if available).
    const token = apiKey || process.env.AI_GATEWAY_API_KEY;

    if (!token) {
        throw new Error("Missing AI Gateway API Key. Please configure it in Settings.");
    }

    // Use the standard OpenAI provider but point baseURL to Vercel AI Gateway.
    // Note: Vercel AI Gateway (beta) supports the OpenAI API signature.
    // We use the 'openai' provider wrapper for convenience.
    const gateway = createOpenAI({
        baseURL: 'https://gateway.ai.vercel.dev/v1',
        apiKey: token,
    });

    return gateway;
};
