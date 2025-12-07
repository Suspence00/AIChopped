export type ChefProvider = 'openai' | 'anthropic' | 'google' | 'xai';

export interface Chef {
    id: ChefProvider;
    name: string; // e.g. "Chef GPT"
    modelId: string; // e.g. "openai/gpt-4o"
    imageModelId: string; // e.g. "openai/dall-e-3"
    bio?: string;
    color: string;
}

export interface Dish {
    roundNumber: number;
    chefId: ChefProvider;
    title: string;
    description: string; // The monologue
    imageUrl?: string;
    ingredientsUsed: string[];
}

export interface RoundState {
    roundNumber: number;
    status: 'idle' | 'working' | 'generating_text' | 'generating_image' | 'judging' | 'completed';
    ingredients: string[];
    dishes: Record<ChefProvider, Dish | undefined>;
    eliminated: ChefProvider[];
    contestants: ChefProvider[]; // Who is currently in the round
}
