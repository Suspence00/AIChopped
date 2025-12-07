'use client';

import { useState, useEffect } from 'react';
import { Chef, Dish, RoundState, ChefProvider } from '@/lib/types';
import { ChefCard } from '@/components/ChefCard';
import SettingsModal from '@/components/SettingsModal';
import { RefreshCw, Trophy, UtensilsCrossed, ArrowRight, ChefHat } from 'lucide-react';

import { DEFAULT_MODELS } from '@/lib/models';

// --- Configuration ---
// Models are now dynamic, but we keep the initial structure.
const INITIAL_CHEFS: Chef[] = [
  { id: 'openai', name: 'Chef GPT', modelId: DEFAULT_MODELS.openai, imageModelId: 'openai/dall-e-3', color: 'bg-green-600' },
  { id: 'anthropic', name: 'Chef Claude', modelId: DEFAULT_MODELS.anthropic, imageModelId: 'openai/dall-e-3', color: 'bg-orange-600' },
  { id: 'google', name: 'Chef Gemini', modelId: DEFAULT_MODELS.google, imageModelId: 'openai/dall-e-3', color: 'bg-blue-600' },
  { id: 'xai', name: 'Chef Grok', modelId: DEFAULT_MODELS.xai, imageModelId: 'openai/dall-e-3', color: 'bg-gray-600' },
];
// Note: Using DALL-E 3 for everyone for consistency and availability via standard Gateway routes, 
// as image models vary wildly by provider availability in the SDK. 
// Ideally we'd use 'google/imagen-3' etc if supported.

export default function ChoppedGame() {
  // --- State ---
  const [ingredients, setIngredients] = useState('');
  const [gameState, setGameState] = useState<RoundState>({
    roundNumber: 0,
    status: 'idle',
    ingredients: [],
    dishes: { openai: undefined, anthropic: undefined, google: undefined, xai: undefined },
    eliminated: [],
    contestants: INITIAL_CHEFS.map(c => c.id) // All start active
  });

  const [loadingStates, setLoadingStates] = useState<Record<string, 'idle' | 'text' | 'image' | 'done' | 'error'>>({});

  // --- Actions ---

  // Load settings on mount
  useEffect(() => {
    const storedModels = localStorage.getItem('AI_MODELS_CONFIG');
    if (storedModels) {
      try {
        const models = JSON.parse(storedModels);
        // Update the chefs in the game state or just the global config used when starting?
        // Since we start from idle, we can just ensure we use the current config when starting/restarting.
        // But INITIAL_CHEFS is static. Let's update `gameState.contestants` logic or how we get chefs.
        // A better way: store chefs in state or ref.
        // Actually, we can just force update the CHEF objects in the state if we are idle?
        // Or simpler: We don't store "Chef Objects" in state, we store IDs.
        // But we need the modelId to call the API.
        // Let's create a derived variable or Ref for "Current Chef Configs".
      } catch (e) { }
    }
  }, []);

  const getChefConfig = (id: string) => {
    // Helper to get chef config with potentially updated model
    const base = INITIAL_CHEFS.find(c => c.id === id)!;

    // Check local storage directly for freshest config at start of round
    // (A bit hacky but ensures we get latest without complex state sync)
    // In a real app we'd use a Context.
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('AI_MODELS_CONFIG');
      if (stored) {
        const customs = JSON.parse(stored);
        if (customs[id]) {
          return { ...base, modelId: customs[id] };
        }
      }
    }
    return base;
  };

  const startRound = async () => {
    if (!ingredients.trim()) return alert("Please enter ingredients!");

    // Parse ingredients
    const ingredientList = ingredients.split(',').map(s => s.trim()).filter(Boolean);
    if (ingredientList.length !== 4) {
      if (!confirm("Chopped usually has 4 ingredients. Are you sure?")) return;
    }

    const nextRound = gameState.roundNumber + 1;

    // Reset round state
    setGameState(prev => ({
      ...prev,
      roundNumber: nextRound,
      status: 'working',
      ingredients: ingredientList,
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
      processChefTurn(chefConfig, ingredientList, nextRound);
    });
  };

  const processChefTurn = async (chef: Chef, ingredients: string[], roundNum: number) => {
    try {
      const apiKey = localStorage.getItem('AI_GATEWAY_API_KEY') || '';

      // 1. Generate Text
      const textRes = await fetch('/api/chef-turn', {
        method: 'POST',
        body: JSON.stringify({ chef, ingredients, apiKey })
      });

      if (!textRes.ok) throw new Error('Text Gen Failed');
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

      // Update State with Image
      setGameState(prev => ({
        ...prev,
        dishes: {
          ...prev.dishes,
          [chef.id]: {
            ...prev.dishes[chef.id]!,
            imageUrl: `data:image/png;base64,${imgData.imageUrl}`
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
    setIngredients(''); // Clear input
  };

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
            <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <h2 className="text-3xl font-light text-gray-300">
                Round {gameState.roundNumber + 1}
              </h2>
              <p className="text-gray-500">Enter 4 mystery ingredients to start the clock.</p>

              <div className="flex gap-2 relative">
                <input
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="e.g. Octopus, Gummy Bears, Kale, Duck Fat"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-4 text-lg focus:ring-2 focus:ring-amber-600 outline-none transition-all placeholder:text-gray-700"
                  onKeyDown={e => e.key === 'Enter' && startRound()}
                />
                <button
                  onClick={startRound}
                  className="absolute right-2 top-2 bottom-2 bg-amber-600 hover:bg-amber-500 text-white px-6 rounded font-bold transition-colors flex items-center gap-2"
                >
                  Open Basket <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {gameState.status !== 'idle' && (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Round {gameState.roundNumber}</h2>
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
