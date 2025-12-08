# Architecture Overview

This document explains the major runtime flows, component responsibilities, and data contracts for the “Chopped AI Gateway Edition” app. It is intended for engineers who need to understand, extend, or audit the system.

## High-Level System
- **Frontend**: Next.js App Router (React client components). Primary UI is `app/page.tsx` plus supporting components in `components/`.
- **Backend**: Next.js API routes under `app/api/*` (Node/Edge). These proxy to the Vercel AI Gateway via the `@ai-sdk/gateway` client.
- **AI Gateway**: External service at `https://ai-gateway.vercel.sh/v1/ai` and `.../credits`. All model invocations go through this gateway.
- **State & Storage**:
  - Ephemeral gateway key is kept in `sessionStorage` (per-tab) and passed as a Bearer token to API routes.
  - Non-secret preferences (models, personas, ingredient detail toggle) live in `localStorage`.
  - No server-side database; all game state is client memory.

## Data Types (lib/types.ts)
- `Chef`: { id, name, modelId, imageModelId, bio?, avatarUrl?, color }
- `Dish`: { roundNumber, chefId, title, description, imageUrl?, ingredientsUsed, shortImagePrompt? }
- `RoundState`: { roundNumber, status, ingredients, dishes, eliminated, contestants }

## Model Allowlisting (lib/models.ts)
- Defines `AVAILABLE_MODELS`, `AVAILABLE_IMAGE_MODELS`, `DEFAULT_MODELS`, and forced image models per provider. Server routes validate requested model IDs against these allowlists to prevent arbitrary model access.

## Security Utilities (lib/security.ts)
- **extractBearerToken(request)**: Reads Authorization header; required by all API routes.
- **getClientId(request)**: Derives a client identifier (IP headers) for rate limiting.
- **checkRateLimit(id, limit, windowMs)**: Simple in-memory token bucket used per route.
- **isModelAllowed(provider, modelId, allowedModels)**: Server-side model allowlist check.

## Gateway Client (lib/ai.ts)
- `createGatewayClient(apiKey)`: Thin wrapper around `createGateway` with an explicit token only (no env fallback). Returns a function `(modelId) => gateway(modelId)`.

## Ingredient Data (lib/ingredients.ts)
- Loads static `lib/data/chopped_episodes.json` to build per-round ingredient options and randomized baskets. Supports optional detail labels (Season/Episode).

## Prompts (lib/prompts.ts)
- `buildSystemPrompt(...)`: Builds the system message for chef dish generation, including optional personas and round-specific guidance.

## Demo Content (lib/demoData.ts)
- Pre-generated chefs, baskets, dishes, and intro status used in “Example Game (Free!)” mode to avoid network/model calls.

## API Routes
### /api/chef-intro (app/api/chef-intro/route.ts)
- **Purpose**: Generate chef name, bio, and portrait.
- **Flow**:
  1) Parse body `{ chef }`, validate via Zod, enforce model allowlist.
  2) Require Bearer token; rate-limit (15/min).
  3) Call `generateText` for JSON lower-third; parse JSON with cleanup.
  4) Call `generateText` on forced portrait model (`google/gemini-2.5-flash-image`); extract image from files/steps/resolvedOutput.
  5) Respond `{ name, bio, imageUrl }`.

### /api/chef-turn (app/api/chef-turn/route.ts)
- **Purpose**: Generate dish title/monologue/shortImagePrompt per round.
- **Flow**:
  1) Parse body with Zod: `{ chef, ingredients[4], roundNumber, usePersonas? }`.
  2) Require Bearer token; rate-limit (20/min); enforce model allowlist.
  3) Build system prompt via `buildSystemPrompt`.
  4) Call `generateText`; robust JSON parsing with fallback extraction of key fields.
  5) Respond JSON `{ dishTitle, monologue, shortImagePrompt }`.

### /api/generate-image (app/api/generate-image/route.ts)
- **Purpose**: Generate dish image from `shortImagePrompt` or dish title.
- **Flow**:
  1) Parse `{ prompt, chef }` via Zod; require Bearer token; rate-limit (10/min).
  2) Enforce image model allowlist; select forced model per provider.
  3) Call `generateText` (multimodal); collect image from `files`, `steps`, `resolvedOutput`.
  4) Return `{ imageUrl, isUrl }`, or a safe SVG placeholder data URI on failure.

### /api/credits (app/api/credits/route.ts)
- **Purpose**: Validate gateway balance.
- **Flow**: Require Bearer token; rate-limit (30/min); proxy to `https://ai-gateway.vercel.sh/v1/credits`; return JSON or error.

## Frontend Flows (app/page.tsx)
### Initialization
- Hydrates preferences from `localStorage` (models, image models, personas, ingredient detail toggle).
- Hydrates gateway key from `sessionStorage` (if present) and triggers `/api/credits` validation.
- Sets initial `creditsState` (checking/missing/invalid/valid) and `gameplayLocked` derived from it unless in demo mode.

### Settings & Key Handling
- `SettingsModal` accepts `gatewayKey` and `onKeyChange`; saving writes the key to `sessionStorage` (not localStorage) and reloads. Gameplay unlock requires `/api/credits` success.

### Demo Mode
- `enterDemoMode()` injects `demoChefs`, `demoBaskets`, `demoDishes`, sets infinite credits, and bypasses network calls. Elimination order is fixed for storyline.

### Chef Intros
- `generateChefs()` iterates contestants, calling `/api/chef-intro` with Bearer token; updates each chef’s name/bio/avatar; tracks status map; enables “Move to Round 1” when complete.

### Rounds
- `startRound()` validates 4 ingredients, increments round, clears dishes, sets loading state, and triggers `processChefTurn` for active contestants.
- `processChefTurn()`:
  1) Calls `/api/chef-turn` for text; stores dish text.
  2) Calls `/api/generate-image` best-effort; logs errors; attaches image if returned.
  3) Updates `gameState` dishes/history and loading states.
- `processChefTurnDemo()` simulates async steps using pre-generated data.

### Elimination & Completion
- `eliminateChef()` guards one chop per round (unless demo storyline), updates eliminated/contestants, and sets status to completed when one remains. Winner view displays all winning dishes and portrait with lightbox.

### UI Components
- `ChefCard`: Displays chef header, model, bio, dish text (with paragraph splitting), dish image with zoom/lightbox, and Chop action. Bios use `text-md` for readability.
- `IngredientSelect`: Searchable dropdown with outside-click close; respects disabled states.
- `SettingsModal`: Key entry + model selectors (from allowlists) + toggles (personas, ingredient detail), credit check button (hits `/api/credits`).
- Lightboxes: For chef avatars and dish images, accessible via button overlays.

## Error Handling & Resilience
- **Text generation**: Tolerant JSON parsing; fallback dish fields if parsing fails.
- **Image generation**: Best-effort; prompt length capped (~380 chars); logs status/body; falls back to SVG placeholder to keep gameplay flowing.
- **Credits**: Errors surface in UI; gameplay locked unless demo mode.
- **Rate limiting**: Per-route in-memory buckets; effective per instance (not clustered).

## Security Posture
- No implicit server-key fallback; every API call requires a client-supplied Bearer token.
- Model IDs validated server-side against allowlists.
- Gateway key is not stored long-term; only in `sessionStorage` per tab. Preferences only in `localStorage`.
- Input validation via Zod on all API routes.
- Minimal PII; no persistent backend storage.

## Known Trade-offs / Future Improvements
- In-memory rate limits are per-instance only; consider durable/edge KV for distributed limits.
- Session-stored gateway key requires user re-entry per browser session; could offer optional encrypted, HTTP-only cookie storage if product requirements allow.
- Add automated tests (unit for parsers, integration for API routes with mocked gateway).
- Consider streaming text generation for live “chef is cooking” feel.
- Add observability (structured logs, correlation IDs) if deployed beyond hackathon scope.
