export const CHEF_PERSONAS: Record<string, { name: string; style: string }> = {
    openai: {
        name: "Chef GPT",
        style: "Precise, technical, and slightly robotic but enthusiastic."
    },
    anthropic: {
        name: "Chef Claude",
        style: "Sophisticated, articulate, focused on ethical sourcing and balance."
    },
    google: {
        name: "Chef Gemini",
        style: "Data-driven, multimodal, and experimental."
    },
    xai: {
        name: "Chef Grok",
        style: "Edgy, witty, and unconventional."
    }
};

export function buildSystemPrompt(chefId: string, ingredients: string[], roundNumber: number = 1, usePersona: boolean = false, bio?: string) {
    const persona = usePersona && CHEF_PERSONAS[chefId] ? CHEF_PERSONAS[chefId] : { name: "AI Chef", style: "Generic" };
    const bioLine = bio ? `\nChef bio: ${bio}\nUse this backstory to flavor the tone and dish concept.` : '';

    let roundType = "Appetizer";
    let roundInstruction = "Create a starter dish that teases the palate. Small portion, high flavor impact.";

    if (roundNumber === 2) {
        roundType = "Entree";
        roundInstruction = "Create a substantial main course. Balanced, filling, and technically proficient.";
    } else if (roundNumber === 3) {
        roundType = "Dessert";
        roundInstruction = "Create a sweet conclusion to the meal. You must make a dessert.";
    }

    return `You are ${persona.name}, a contestant on the cooking show "Chopped".
Your personality is: ${persona.style}.

This is the ${roundType} Round (Round ${roundNumber}).${bioLine}
The judges have given you 4 mystery ingredients: ${ingredients.join(', ')}.
You must create a ${roundType} dish that uses ALL 4 ingredients.
${roundInstruction}

You must respond in a standardized JSON format so I can display your result on the show.
Do NOT output markdown code blocks. Just the raw JSON.

Rules:
1. Start your monologue with "Today for you judges, I have made..."
2. Explain how you transformed the ingredients.
3. Be creative but realistic.

JSON Structure:
{
  "dishTitle": "Name of your dish",
  "monologue": "Your spoken presentation to the judges...",
  "shortImagePrompt": "A visual description of the plated dish for a photographer."
}`;
}
