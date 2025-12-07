'use client';

import { useState, useEffect } from 'react';
import { Chef, Dish, RoundState, ChefProvider } from '@/lib/types';
import { ChefCard } from '@/components/ChefCard';
import SettingsModal from '@/components/SettingsModal';
import IngredientSelect from '@/components/IngredientSelect';
import { getIngredients, getRandomBasket, RoundType } from '@/lib/ingredients';
import { RefreshCw, Trophy, UtensilsCrossed, ArrowRight, ChefHat, Dices } from 'lucide-react';

import { DEFAULT_MODELS, FORCED_IMAGE_MODELS } from '@/lib/models';

// --- Configuration ---
// Models are now dynamic, but we keep the initial structure.
const INITIAL_CHEFS: Chef[] = [
  { id: 'openai', name: 'Chef GPT', modelId: DEFAULT_MODELS.openai, imageModelId: FORCED_IMAGE_MODELS.openai, color: 'bg-green-600' },
  { id: 'anthropic', name: 'Chef Claude', modelId: DEFAULT_MODELS.anthropic, imageModelId: FORCED_IMAGE_MODELS.anthropic, color: 'bg-orange-600' },
  { id: 'google', name: 'Chef Gemini', modelId: DEFAULT_MODELS.google, imageModelId: FORCED_IMAGE_MODELS.google, color: 'bg-blue-600' },
  { id: 'xai', name: 'Chef Grok', modelId: DEFAULT_MODELS.xai, imageModelId: FORCED_IMAGE_MODELS.xai, color: 'bg-gray-600' },
];
// Image generation is locked to Gemini 2.5 image models (Nano Banana or preview variant) per provider to keep turnaround times low.

export default function ChoppedGame() {
  // --- State ---
  const [basket, setBasket] = useState<string[]>(['', '', '', '']);
  const [currentModels, setCurrentModels] = useState(DEFAULT_MODELS); // State for models to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setMounted(true);
    const storedModels = localStorage.getItem('AI_MODELS_CONFIG');
    if (storedModels) {
      try {
        const parsed = JSON.parse(storedModels);
        setCurrentModels(prev => ({ ...prev, ...parsed }));
      } catch (e) { }
    }

    // Load detail preference
    const storedShowDetails = localStorage.getItem('CHOPPED_SHOW_DETAILS');
    if (storedShowDetails) setShowDetails(JSON.parse(storedShowDetails));

    // Listen for storage events or custom events if SettingsModal updates localstorage but doesn't window.reload
    // But SettingsModal currently does window.location.reload() which works fine.
  }, []);

  const [gameState, setGameState] = useState<RoundState>({
    roundNumber: 0,
    status: 'idle',
    ingredients: [],
    dishes: { openai: undefined, anthropic: undefined, google: undefined, xai: undefined },
    eliminated: [],
    contestants: INITIAL_CHEFS.map(c => c.id) // All start active
  });

  const [loadingStates, setLoadingStates] = useState<Record<string, 'idle' | 'text' | 'image' | 'done' | 'error'>>({});


  const getChefConfig = (id: string) => {
    const base = INITIAL_CHEFS.find(c => c.id === id)!;
    // Use state instead of direct localStorage access during render
    const config = { ...base };
    if (currentModels[id as keyof typeof DEFAULT_MODELS]) {
      config.modelId = currentModels[id as keyof typeof DEFAULT_MODELS];
    }
    // Force the mapped fast image model for every provider to keep rounds snappy
    config.imageModelId = FORCED_IMAGE_MODELS[id as keyof typeof FORCED_IMAGE_MODELS];
    return config;
  };

  const startRound = async () => {
    // Validate inputs
    const filledIngredients = basket.filter(i => i.trim());
    if (filledIngredients.length !== 4) {
      alert("Please select 4 ingredients!");
      return;
    }

    const nextRound = gameState.roundNumber + 1;

    // Reset round state
    setGameState(prev => ({
      ...prev,
      roundNumber: nextRound,
      status: 'working',
      ingredients: filledIngredients,
      dishes: { openai: undefined, anthropic: undefined, google: undefined, xai: undefined } // Clear dishes
    }));

    // Trigger Generation for all active chefs
    const activeChefsIds = gameState.contestants;

    // Initialize loading states
    const initialLoad: any = {};
    activeChefsIds.forEach(id => initialLoad[id] = 'text');
    setLoadingStates(initialLoad);

    // Parallel Execution
    activeChefsIds.forEach(id => {
      const chefConfig = getChefConfig(id);
      processChefTurn(chefConfig, filledIngredients, nextRound);
    });
  };

  const handleBasketChange = (index: number, val: string) => {
    const newBasket = [...basket];
    newBasket[index] = val;
    setBasket(newBasket);
  };

  const randomizeBasket = () => {
    // Determine round type - default to Appetizer if round 0, else follow sequence
    const rNum = gameState.roundNumber + 1;
    let type: RoundType = 'Appetizer';
    if (rNum === 2) type = 'Entree';
    if (rNum === 3) type = 'Dessert';

    // If completed or >3, pick random? Default to Appetizer for now unless we loop.
    if (rNum > 3) {
      const types: RoundType[] = ['Appetizer', 'Entree', 'Dessert'];
      type = types[Math.floor(Math.random() * types.length)];
    }

    const randomIngredients = getRandomBasket(type);
    setBasket(randomIngredients);
  };

  const processChefTurn = async (chef: Chef, ingredients: string[], roundNum: number) => {
    try {
      const apiKey = localStorage.getItem('AI_GATEWAY_API_KEY') || '';

      // 1. Generate Text
      const textRes = await fetch('/api/chef-turn', {
        method: 'POST',
        body: JSON.stringify({ chef, ingredients, apiKey, roundNumber: roundNum })
      });

      if (!textRes.ok) {
        let errorMsg = 'Text Gen Failed';
        try {
          const errData = await textRes.json();
          if (errData.error) errorMsg += `: ${errData.error}`;
        } catch (e) {
          errorMsg += `: ${textRes.status} ${textRes.statusText}`;
        }
        throw new Error(errorMsg);
      }
      const textData = await textRes.json();

      // Update State with Text
      setGameState(prev => ({
        ...prev,
        dishes: {
          ...prev.dishes,
          [chef.id]: {
            roundNumber: roundNum,
            chefId: chef.id,
            title: textData.dishTitle,
            description: textData.monologue,
            ingredientsUsed: ingredients,
            imageUrl: undefined
          }
        }
      }));
      setLoadingStates(prev => ({ ...prev, [chef.id]: 'image' }));

      // 2. Generate Image
      const imgRes = await fetch('/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          chef,
          prompt: textData.shortImagePrompt || textData.dishTitle,
          apiKey
        })
      });

      if (!imgRes.ok) throw new Error('Image Gen Failed');
      const imgData = await imgRes.json(); // Expect { imageUrl: base64 }

      const finalImageUrl = (() => {
        if (!imgData?.imageUrl) return undefined;
        if (imgData.isUrl) return imgData.imageUrl;
        if (typeof imgData.imageUrl === 'string' && imgData.imageUrl.startsWith('data:image')) return imgData.imageUrl;
        return `data:image/png;base64,${imgData.imageUrl}`;
      })();

      // Update State with Image
      setGameState(prev => ({
        ...prev,
        dishes: {
          ...prev.dishes,
          [chef.id]: {
            ...prev.dishes[chef.id]!,
            imageUrl: finalImageUrl
          }
        }
      }));
      setLoadingStates(prev => ({ ...prev, [chef.id]: 'done' }));

    } catch (e) {
      console.error(`Chef ${chef.name} failed:`, e);
      setLoadingStates(prev => ({ ...prev, [chef.id]: 'error' }));
    }
  };

  // Check if all are done
  useEffect(() => {
    if (gameState.status !== 'working') return;

    const activeChefs = gameState.contestants;
    const allDone = activeChefs.every(id => loadingStates[id] === 'done' || loadingStates[id] === 'error');

    if (allDone) {
      setGameState(prev => ({ ...prev, status: 'judging' }));
    }
  }, [loadingStates, gameState.status, gameState.contestants]);


  const eliminateChef = (chefId: string) => {
    if (!confirm(`Are you sure you want to CHOP ${chefId}?`)) return;

    setGameState(prev => {
      const newEliminated = [...prev.eliminated, chefId as any];
      const newContestants = prev.contestants.filter(id => id !== chefId);

      // Check Winner
      if (newContestants.length === 1) {
        return {
          ...prev,
          eliminated: newEliminated,
          contestants: newContestants,
          status: 'completed'
        };
      }

      return {
        ...prev,
        eliminated: newEliminated,
        contestants: newContestants,
        status: 'idle', // Ready for next round inputs
        ingredients: [] // Clear for next round
      };
    });
    setBasket(['', '', '', '']); // Clear input
  };

  // Calculate current round type for labelling
  const currentRoundType = (gameState.roundNumber + 1) === 1 ? 'Appetizer' :
    (gameState.roundNumber + 1) === 2 ? 'Entree' :
      (gameState.roundNumber + 1) === 3 ? 'Dessert' : 'Mystery Round';

  // Get ingredient options for the current input based on upcoming round
  const ingredientOptions = mounted ? getIngredients(currentRoundType, showDetails) : [];

  // --- Renders ---

  // 1. Winner View
  if (gameState.status === 'completed') {
    const winnerId = gameState.contestants[0];
    const winner = INITIAL_CHEFS.find(c => c.id === winnerId);

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center space-y-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-black to-black">
        <Trophy size={80} className="text-amber-500 animate-bounce" />
        <h1 className="text-6xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-600">
          {winner?.name} Wins!
        </h1>
        <p className="text-2xl text-gray-300 max-w-2xl">
          Champion of the Vercel AI Gateway Hackathon.
        </p>
        <div className="p-6 bg-gray-900 border border-amber-600 rounded-2xl shadow-2xl max-w-md mx-auto">
          <ChefHat className="mx-auto mb-4 text-gray-500" size={40} />
          <h3 className="text-xl font-bold mb-2">Winning Dish from Round {gameState.roundNumber}</h3>
          <div className="prose prose-invert text-sm text-gray-400 mb-4">
            {gameState.dishes[winnerId as ChefProvider]?.title}
          </div>
          {gameState.dishes[winnerId as ChefProvider]?.imageUrl && (
            <img src={gameState.dishes[winnerId as ChefProvider]?.imageUrl} className="rounded-lg w-full" />
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest hover:scale-105 transition-transform"
        >
          Start New Competition
        </button>
      </div>
    );
  }

  // 2. Main Game View
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-amber-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="text-amber-600" />
            <h1 className="text-xl font-bold tracking-tight">
              CHOPPED <span className="text-amber-600 font-black">AI</span>
            </h1>
            <span className="text-xs px-2 py-0.5 border border-gray-700 rounded-full text-gray-500">Gateway Edition</span>
          </div>
          <SettingsModal />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Round Controls */}
        <section className="mb-12 text-center space-y-6">
          {gameState.status === 'idle' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-baseline justify-center gap-3">
                <h2 className="text-3xl font-light text-gray-300">
                  Round {gameState.roundNumber + 1}:
                </h2>
                <h2 className="text-3xl font-bold text-amber-500 uppercase">{currentRoundType}</h2>
              </div>
              <p className="text-gray-500">Select 4 mystery ingredients to start the clock.</p>

              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Basket Items</h3>
                  <button
                    onClick={randomizeBasket}
                    className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase"
                  >
                    <Dices size={16} />
                    Randomize Basket
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <IngredientSelect
                    value={basket[0]}
                    onChange={v => handleBasketChange(0, v)}
                    options={ingredientOptions}
                    placeholder="Item 1"
                  />
                  <IngredientSelect
                    value={basket[1]}
                    onChange={v => handleBasketChange(1, v)}
                    options={ingredientOptions}
                    placeholder="Item 2"
                  />
                  <IngredientSelect
                    value={basket[2]}
                    onChange={v => handleBasketChange(2, v)}
                    options={ingredientOptions}
                    placeholder="Item 3"
                  />
                  <IngredientSelect
                    value={basket[3]}
                    onChange={v => handleBasketChange(3, v)}
                    options={ingredientOptions}
                    placeholder="Item 4"
                  />
                </div>

                <button
                  onClick={startRound}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 hover:scale-[1.01]"
                >
                  Open Basket & Start Round <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {gameState.status !== 'idle' && (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">
                {gameState.roundNumber === 1 ? 'Appetizer' :
                  gameState.roundNumber === 2 ? 'Entree' :
                    gameState.roundNumber === 3 ? 'Dessert' :
                      `Round ${gameState.roundNumber}`} Round
              </h2>
              <div className="flex gap-2 text-amber-500 font-mono text-sm border border-amber-900/50 bg-amber-950/20 px-4 py-2 rounded-full">
                {gameState.ingredients.join(' • ')}
              </div>
              {gameState.status === 'judging' && (
                <p className="mt-8 text-xl text-red-400 font-bold animate-pulse">
                  Who will be CHOPPED?
                </p>
              )}
            </div>
          )}
        </section>

        {/* Chefs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_CHEFS.map(initialChef => {
            const chef = getChefConfig(initialChef.id);
            const isEliminated = gameState.eliminated.includes(chef.id);
            // Only show card if active or recently eliminated in this View?
            // Actually, show all, but eliminated ones greyed out forever.

            const dish = gameState.dishes[chef.id];
            const loadingInfo = loadingStates[chef.id];

            let cardStatus: any = 'idle';
            if (isEliminated) cardStatus = 'eliminated';
            else if (loadingInfo === 'text' || loadingInfo === 'image') cardStatus = 'working';
            else if (loadingInfo === 'done') cardStatus = 'done';

            return (
              <ChefCard
                key={chef.id}
                chef={chef}
                dish={dish}
                status={cardStatus}
                onEliminate={eliminateChef}
                isStreaming={false} // Simplification for now
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
