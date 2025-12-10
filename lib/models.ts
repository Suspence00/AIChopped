export interface ModelOption {
    id: string;
    name: string;
}

export const FORCED_IMAGE_MODELS = {
    openai: 'google/gemini-2.5-flash-image',
    anthropic: 'google/gemini-2.5-flash-image',
    google: 'google/gemini-2.5-flash-image',
    xai: 'google/gemini-2.5-flash-image',
} as const;

export const AVAILABLE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
    ],
    anthropic: [
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    ],
    google: [
        { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    ],
    xai: [
        { id: 'xai/grok-4.1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning' },
    ]
};

export const DEFAULT_MODELS = {
    openai: 'openai/gpt-5-nano',
    anthropic: 'anthropic/claude-3-haiku',
    google: 'google/gemini-2.5-flash-lite',
    xai: 'xai/grok-4.1-fast-reasoning'
};

export function sanitizeModelConfig(config: Partial<Record<keyof typeof DEFAULT_MODELS, string>> = {}) {
    const sanitized: typeof DEFAULT_MODELS = { ...DEFAULT_MODELS };
    (Object.keys(DEFAULT_MODELS) as (keyof typeof DEFAULT_MODELS)[]).forEach(provider => {
        const allowed = AVAILABLE_MODELS[provider].map(m => m.id);
        const candidate = config[provider];
        if (typeof candidate === 'string' && allowed.includes(candidate)) {
            sanitized[provider] = candidate;
        }
    });
    return sanitized;
}

export const AVAILABLE_IMAGE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    google: [
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    anthropic: [
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    xai: [
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ]
};

export const DEFAULT_IMAGE_MODELS = {
    openai: 'google/gemini-2.5-flash-image',
    anthropic: 'google/gemini-2.5-flash-image',
    google: 'google/gemini-2.5-flash-image',
    xai: 'google/gemini-2.5-flash-image'
};
