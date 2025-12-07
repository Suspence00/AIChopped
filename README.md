# Chopped: AI Gateway Edition

A Next.js application built for the **Vercel AI Gateway Hackathon**. This app recreates the "Chopped" cooking competition with AI agents as contestants.

## Features

- **4 AI Contestants**: Team OpenAI, Team Anthropic, Team Google, and Team xAI.
- **Vercel AI SDK Integration**: Uses the standard SDK methods (`generateText`, `experimental_generateImage`) routed through the Gateway.
- **Single AI Gateway Key**: Routes requests to all providers using one API key.
- **Parallel Execution**: Simulates real-time competition by streaming requests concurrently.

## Getting Started

### 1. Installation

```bash
npm install
# or
yarn install
```

### 2. Configuration

You need a **Vercel AI Gateway API Key**.
You can set this in two ways:

**Option A: Environment Variable (Recommended for Local Dev)**
Create a `.env.local` file:
```env
AI_GATEWAY_API_KEY=sk-gw-...
```

**Option B: In-App Settings (BYOK)**
Launch the app, click the Settings icon in the header, and paste your key. This is stored in your browser's LocalStorage and sent securely to the backend for each request.

### 3. Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to Vercel:

1. Push to GitHub.
2. Import project in Vercel.
3. Add `AI_GATEWAY_API_KEY` to Vercel Environment Variables.
4. Deploy!

## Architecture

- **`lib/ai.ts`**: Configures the Vercel AI SDK to use `https://gateway.ai.vercel.dev/v1` as the baseURL.
- **`app/api/chef-turn`**: Handles text generation for a specific chef (provider).
- **`app/api/generate-image`**: Handles dish visualization.
- **`app/page.tsx`**: Manages the game state (rounds, eliminations, ingredients).

## Hackathon Notes

This project demonstrates how Vercel AI Gateway simplifies multi-provider apps. Instead of managing 4 different SDKs and keys, we use one standard `openai` compatible client pointing to the Gateway, and simply switch the `model` string (e.g., `anthropic/claude-3-5-sonnet` vs `google/gemini-1.5-pro`).
