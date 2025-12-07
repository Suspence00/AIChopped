import episodesData from './data/chopped_episodes.json';

export type RoundType = 'Appetizer' | 'Entree' | 'Dessert';

export interface IngredientOption {
    value: string;
    label: string;
    season?: number;
    episode?: number;
    title?: string;
}

export interface IngredientDetail {
    name: string;
    season: number;
    episode: number;
    title: string;
}

// Map to cache ingredients by round type
const ingredientsCache: Record<RoundType, IngredientOption[]> = {
    Appetizer: [],
    Entree: [],
    Dessert: []
};

// Map to look up source details quickly
// We'll key by "IngredientName" -> List of appearances
const ingredientAppearances: Record<string, { season: number, episode: number, title: string, round: string }[]> = {};

let dataProcessed = false;

function processData() {
    if (dataProcessed) return;

    const episodes = episodesData as any[];

    episodes.forEach(ep => {
        const { season, episode_number, episode_title, ingredients } = ep;

        // Process each round
        (['Appetizer', 'Entree', 'Dessert'] as RoundType[]).forEach(round => {
            if (ingredients[round]) {
                ingredients[round].forEach((ing: string) => {
                    // Normalize? Maybe trim.
                    const name = ing.trim();

                    // Add to cache list if unique for that round? 
                    // Actually we want a master list per ROUND type for the dropdowns.
                    // But we might want to consolidate duplicates across episodes.

                    if (!ingredientAppearances[name]) {
                        ingredientAppearances[name] = [];
                    }
                    ingredientAppearances[name].push({
                        season,
                        episode: episode_number,
                        title: episode_title,
                        round
                    });
                });
            }
        });
    });

    // Now build the options lists
    (['Appetizer', 'Entree', 'Dessert'] as RoundType[]).forEach(round => {
        const optionMap = new Map<string, IngredientOption>();

        episodes.forEach(ep => {
            const roundIngredients = ep.ingredients[round];
            if (roundIngredients && Array.isArray(roundIngredients)) {
                roundIngredients.forEach((ingName: string) => {
                    const name = ingName.trim();
                    // We store the FIRST appearance as the source of truth for "S1 E1" label detail 
                    // if we want to show just one, OR we show the specific one from this episode.
                    // However, for the dropdown, we want UNIQUE names.
                    // If "Chicken" appears in 100 episodes, we list "Chicken" once.
                    // BUT if we want to show details, "Chicken (S1 E1)" vs "Chicken (S5 E5)"... 
                    // That makes distinct entries. 
                    // The user requirement: "Show extra detail for ingrediants" ... "adds the season and episode to the ingrediants in the drop down"
                    // If we distinct by name, which S/E do we show?
                    // Maybe we show the *first* one? Or maybe we create unique entries for every appearance?
                    // "Unique entries for every appearance" would mean the list has 500 "Chicken" entries distinguished by season. 
                    // That seems unusable. 
                    // "Restricted to selecting only those options"
                    // Let's assume we want Unique Ingredient Names. 
                    // The detail is metadata. We'll pick the first appearance or random appearance to show in the label 
                    // if details are on. Or better, just format it like "Chicken (seen in S1 E1...)"

                    if (!optionMap.has(name)) {
                        optionMap.set(name, {
                            value: name,
                            label: name,
                            season: ep.season,
                            episode: ep.episode_number,
                            title: ep.episode_title
                        });
                    }
                });
            }
        });

        ingredientsCache[round] = Array.from(optionMap.values()).sort((a, b) => a.value.localeCompare(b.value));
    });

    dataProcessed = true;
}

export function getIngredients(round: RoundType | string, showDetails: boolean = false): IngredientOption[] {
    if (!dataProcessed) processData();

    // Safe cast or fallback
    const r = (['Appetizer', 'Entree', 'Dessert'].includes(round) ? round : 'Appetizer') as RoundType;

    const options = ingredientsCache[r];

    if (showDetails) {
        return options.map(opt => ({
            ...opt,
            label: `${opt.value} (S${opt.season} E${opt.episode})`
        }));
    }

    return options;
}

export function getRandomBasket(round: string): string[] {
    if (!dataProcessed) processData();

    // Pick 4 random ingredients from the list of unique ingredients for this round.
    // User requested "randomize the choice".

    const r = (['Appetizer', 'Entree', 'Dessert'].includes(round) ? round : 'Appetizer') as RoundType;
    const options = ingredientsCache[r];

    if (options.length < 4) return options.map(o => o.value);

    // Shuffle
    const shuffled = [...options].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).map(o => o.value);
}
