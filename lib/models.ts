export type PriceTier = '$' | '$$' | '$$$' | '$$$$' | '$$$$$';

export interface ModelOption {
    id: string;
    name: string;
    priceTier: PriceTier;
}

export const AVAILABLE_MODELS: Record<string, ModelOption[]> = {
    openai: [
        { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', priceTier: '$' },
        { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', priceTier: '$' },
        { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', priceTier: '$' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', priceTier: '$' },
        { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small', priceTier: '$' },
        { id: 'openai/gpt-5', name: 'GPT-5', priceTier: '$$' },
        { id: 'openai/gpt-5-codex', name: 'GPT-5 Codex', priceTier: '$$' },
        { id: 'openai/gpt-5.1-instant', name: 'GPT-5.1 Instant', priceTier: '$$' },
        { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat', priceTier: '$$' },
        { id: 'openai/gpt-5.1-thinking', name: 'GPT-5.1 Thinking', priceTier: '$$' },
        { id: 'openai/gpt-4o', name: 'GPT-4o', priceTier: '$$$' }, // Assumption based on typical pricing
    ],
    anthropic: [
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', priceTier: '$' },
        { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', priceTier: '$$' },
        { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', priceTier: '$$' },
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', priceTier: '$$$' },
        { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', priceTier: '$$$' },
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', priceTier: '$$$' },
        { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', priceTier: '$$$' }, // Standard default
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', priceTier: '$$$$' },
        { id: 'anthropic/claude-opus-4.1', name: 'Claude Opus 4.1', priceTier: '$$$$$' },
        { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', priceTier: '$$$$$' },
        { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', priceTier: '$$$$$' },
    ],
    google: [
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', priceTier: '$' },
        { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', priceTier: '$' },
        { id: 'google/gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', priceTier: '$' },
        { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', priceTier: '$' },
        { id: 'google/gemini-2.5-flash-lite-preview', name: 'Gemini 2.5 Flash Lite Preview', priceTier: '$' },
        { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash Preview', priceTier: '$' },
        { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', priceTier: '$$' },
        { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', priceTier: '$$' }, // Default
        { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', priceTier: '$$$' },
    ],
    xai: [
        { id: 'xai/grok-code-fast-1', name: 'Grok Code Fast 1', priceTier: '$' },
        { id: 'xai/grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning', priceTier: '$' },
        { id: 'xai/grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning', priceTier: '$' },
        { id: 'xai/grok-4.1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning', priceTier: '$' },
        { id: 'xai/grok-4.1-fast-non-reasoning', name: 'Grok 4.1 Fast Non-Reasoning', priceTier: '$' },
        { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', priceTier: '$' },
        { id: 'xai/grok-beta', name: 'Grok Beta', priceTier: '$$' }, // Default
        { id: 'xai/grok-4', name: 'Grok 4', priceTier: '$$$' },
        { id: 'xai/grok-2', name: 'Grok 2', priceTier: '$$$' },
        { id: 'xai/grok-3-fast', name: 'Grok 3 Fast', priceTier: '$$$$' },
    ]
};

export const DEFAULT_MODELS = {
    openai: 'openai/gpt-4o',
    anthropic: 'anthropic/claude-3-5-sonnet',
    google: 'google/gemini-1.5-pro',
    xai: 'xai/grok-beta'
};
