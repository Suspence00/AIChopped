export interface ModelOption {
    id: string;
    name: string;
}

export const FORCED_IMAGE_MODELS = {
    openai: 'bfl/flux-2-flex',
    anthropic: 'bfl/flux-2-flex',
    google: 'bfl/flux-2-flex',
    xai: 'bfl/flux-2-flex',
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

export const AVAILABLE_IMAGE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: 'bfl/flux-2-flex', name: 'FLUX.2 (Flex)' },
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    google: [
        { id: 'bfl/flux-2-flex', name: 'FLUX.2 (Flex)' },
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    anthropic: [
        { id: 'bfl/flux-2-flex', name: 'FLUX.2 (Flex)' },
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ],
    xai: [
        { id: 'bfl/flux-2-flex', name: 'FLUX.2 (Flex)' },
        { id: 'google/gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image' },
        { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image Preview' },
    ]
};

export const DEFAULT_IMAGE_MODELS = {
    openai: 'bfl/flux-2-flex',
    anthropic: 'bfl/flux-2-flex',
    google: 'bfl/flux-2-flex',
    xai: 'bfl/flux-2-flex'
};
