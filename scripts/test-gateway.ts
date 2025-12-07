import { streamText } from 'ai';
import { createGatewayClient } from '../lib/ai';
import 'dotenv/config';

// Usage: npx tsx scripts/test-gateway.ts <your-vck-key-here>

const apiKey = process.argv[2] || process.env.AI_GATEWAY_API_KEY;

if (!apiKey) {
    console.error("Please provide a key: npx tsx scripts/test-gateway.ts <vck_...>");
    process.exit(1);
}

// Minimal stub for Chef to match our helper's signature or use raw createOpenAI
// We will test using the exact same helper our app uses.
const gateway = createGatewayClient(apiKey);

async function main() {
    console.log("Testing Vercel AI Gateway connection with key:", apiKey.slice(0, 8) + "...");

    try {
        const result = streamText({
            model: gateway('openai/gpt-4o'), // Use a standard model
            prompt: 'Invent a new holiday and describe its traditions. Keep it short.',
        });

        process.stdout.write("Response: ");
        for await (const textPart of result.textStream) {
            process.stdout.write(textPart);
        }
        console.log("\n\n✅ Success! Text streaming works.");
    } catch (e) {
        console.error("\n❌ Failed:", e);
    }
}

main().catch(console.error);
