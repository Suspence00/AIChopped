export type PriceTier = '$' | '$$' | '$$$' | '$$$$' | '$$$$$';

export interface ModelOption {
    id: string;
    name: string;
    priceTier: PriceTier;
}

export const FORCED_IMAGE_MODELS = {
    openai: 'google/gemini-2.5-flash-image',
    anthropic: 'google/gemini-2.5-flash-image',
    google: 'google/gemini-2.5-flash-image-preview',
    xai: 'google/gemini-2.5-flash-image',
} as const;

export const AVAILABLE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', priceTier: '$' },
    ],
    anthropic: [
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', priceTier: '$' },
    ],
    google: [
        { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', priceTier: '$' },
    ],
    xai: [
        { id: 'xai/grok-4.1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning', priceTier: '$$' },
    ]
};

export const DEFAULT_MODELS = {
    openai: 'openai/gpt-4.1-nano',
    anthropic: 'anthropic/claude-3-haiku',
    google: 'google/gemini-2.5-flash-lite',
    xai: 'xai/grok-4.1-fast-reasoning'
};

export const AVAILABLE_IMAGE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: FORCED_IMAGE_MODELS.openai, name: 'Gemini 2.5 Flash Image (Nano Banana)', priceTier: '$' },
    ],
    google: [
        { id: FORCED_IMAGE_MODELS.google, name: 'Gemini 2.5 Flash Image Preview', priceTier: '$' },
    ],
    anthropic: [
        { id: FORCED_IMAGE_MODELS.anthropic, name: 'Gemini 2.5 Flash Image (Nano Banana)', priceTier: '$' },
    ],
    xai: [
        { id: FORCED_IMAGE_MODELS.xai, name: 'Gemini 2.5 Flash Image (Nano Banana)', priceTier: '$' },
    ]
};

export const DEFAULT_IMAGE_MODELS = {
    openai: FORCED_IMAGE_MODELS.openai,
    anthropic: FORCED_IMAGE_MODELS.anthropic,
    google: FORCED_IMAGE_MODELS.google,
    xai: FORCED_IMAGE_MODELS.xai
};
