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
        { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano' },
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
    openai: 'openai/gpt-4.1-nano',
    anthropic: 'anthropic/claude-3-haiku',
    google: 'google/gemini-2.5-flash-lite',
    xai: 'xai/grok-4.1-fast-reasoning'
};

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
