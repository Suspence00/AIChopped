'use client';

import { useState, useEffect } from 'react';
import { Chef, Dish, RoundState, ChefProvider } from '@/lib/types';
import { ChefCard } from '@/components/ChefCard';
import SettingsModal from '@/components/SettingsModal';
import IngredientSelect from '@/components/IngredientSelect';
import { getIngredients, getRandomBasket, RoundType } from '@/lib/ingredients';
import { RefreshCw, Trophy, UtensilsCrossed, ArrowRight, ChefHat, Dices, Lock, UserPlus, ShieldCheck, AlertCircle } from 'lucide-react';

import { DEFAULT_MODELS, FORCED_IMAGE_MODELS, DEFAULT_IMAGE_MODELS } from '@/lib/models';

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
  const [currentImageModels, setCurrentImageModels] = useState(DEFAULT_IMAGE_MODELS);
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [usePersonas, setUsePersonas] = useState(false);
  const [chefs, setChefs] = useState<Chef[]>(INITIAL_CHEFS);
  const [dishHistory, setDishHistory] = useState<Record<ChefProvider, Dish[]>>({
    openai: [],
    anthropic: [],
    google: [],
    xai: []
  });
  const [hasGeneratedChefs, setHasGeneratedChefs] = useState(false);
  const [chefIntrosReady, setChefIntrosReady] = useState(false);
  const [generatingChefs, setGeneratingChefs] = useState(false);
  const [chefIntroStatus, setChefIntroStatus] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title?: string; chef?: string } | null>(null);
  const [creditsState, setCreditsState] = useState<{ status: 'checking' | 'valid' | 'invalid' | 'missing'; balance?: number; error?: string }>({ status: 'checking' });
  const [currentChefIndex, setCurrentChefIndex] = useState(0);
  const [hasChoppedThisRound, setHasChoppedThisRound] = useState(false);

  const isCreditLocked = creditsState.status !== 'valid';

  const validateCredits = async (forcedKey?: string) => {
    const key = forcedKey || localStorage.getItem('AI_GATEWAY_API_KEY') || '';
    if (!key) {
      setCreditsState({ status: 'missing', error: 'Add your AI Gateway key in Settings.' });
      return;
    }

    setCreditsState({ status: 'checking' });

    try {
      const res = await fetch('/api/credits', {
        headers: { Authorization: `Bearer ${key}` }
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setCreditsState({ status: 'invalid', error: data.error || 'Unable to validate balance.' });
        return;
      }

      let balanceValue = parseFloat(data.balance ?? data.remaining ?? '0');
      if (Number.isNaN(balanceValue)) balanceValue = 0;

      if (balanceValue > 1) {
        setCreditsState({ status: 'valid', balance: balanceValue });
        localStorage.setItem('CHOPPED_LAST_BALANCE', JSON.stringify({ balance: balanceValue, ts: Date.now() }));
      } else {
        setCreditsState({ status: 'invalid', balance: balanceValue, error: 'Balance must be above $1 to play.' });
      }
    } catch (e: any) {
      setCreditsState({ status: 'invalid', error: e.message || 'Balance check failed' });
    }
  };

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

    const storedImageModels = localStorage.getItem('AI_IMAGE_MODELS_CONFIG');
    if (storedImageModels) {
      try {
        const parsed = JSON.parse(storedImageModels);
        setCurrentImageModels(prev => ({ ...prev, ...parsed }));
      } catch (e) { }
    }

    // Load detail preference
    const storedShowDetails = localStorage.getItem('CHOPPED_SHOW_DETAILS');
    if (storedShowDetails) setShowDetails(JSON.parse(storedShowDetails));

    const storedPersonas = localStorage.getItem('CEF_PERSONAS_ENABLED');
    if (storedPersonas) setUsePersonas(JSON.parse(storedPersonas));

    const storedKey = localStorage.getItem('AI_GATEWAY_API_KEY');
    if (!storedKey) {
      setCreditsState({ status: 'missing', error: 'Add your AI Gateway key in Settings.' });
    } else {
      validateCredits(storedKey);
    }

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
    const base = chefs.find(c => c.id === id) || INITIAL_CHEFS.find(c => c.id === id)!;
    // Use state instead of direct localStorage access during render
    const config = { ...base };
    if (currentModels[id as keyof typeof DEFAULT_MODELS]) {
      config.modelId = currentModels[id as keyof typeof DEFAULT_MODELS];
    }
    // Use selected image model (fallback to defaults)
    if (currentImageModels[id as keyof typeof DEFAULT_IMAGE_MODELS]) {
      config.imageModelId = currentImageModels[id as keyof typeof DEFAULT_IMAGE_MODELS];
    } else {
      config.imageModelId = DEFAULT_IMAGE_MODELS[id as keyof typeof DEFAULT_IMAGE_MODELS];
    }
    return config;
  };

  const normalizeDishData = (payload: any) => {
    const tryParseString = (raw: string) => {
      if (typeof raw !== 'string') return null;
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/{[\s\S]*}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch { }
        }
      }
      return null;
    };

    if (!payload) {
      return null;
    }

    // If the payload itself is a JSON string
    if (typeof payload === 'string') {
      const parsed = tryParseString(payload);
      if (parsed) return parsed;
      return {
        dishTitle: 'Chef Special',
        monologue: payload,
        shortImagePrompt: 'A beautifully plated dish.'
      };
    }

    // If monologue accidentally contains JSON, try to parse and merge
    if (typeof payload.monologue === 'string') {
      const parsed = tryParseString(payload.monologue);
      if (parsed && (parsed.monologue || parsed.dishTitle)) {
        payload = { ...parsed, ...payload, dishTitle: parsed.dishTitle || payload.dishTitle, monologue: parsed.monologue || payload.monologue, shortImagePrompt: parsed.shortImagePrompt || payload.shortImagePrompt };
      } else {
        // Strip common JSON markers for display
        payload.monologue = payload.monologue.replace(/```json/gi, '').replace(/```/g, '').trim();
      }
    }

    return payload;
  };

  const normalizeIntroData = (payload: any) => {
    const result = { ...payload };

    const tryParseBio = (bioVal: any) => {
      if (typeof bioVal !== 'string') return bioVal;
      const cleaned = bioVal.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          // Prefer explicit bio/name fields
          if (parsed.bio) result.bio = parsed.bio;
          if (parsed.name && !result.name) result.name = parsed.name;
          return parsed.bio || parsed.description || cleaned;
        }
      } catch { }
      return cleaned;
    };

    if ('bio' in result) {
      result.bio = tryParseBio(result.bio);
    }
    if ('name' in result && typeof result.name === 'string') {
      result.name = result.name.replace(/["']/g, '').trim() || result.name;
    }

    return result;
  };

  const generateChefs = async () => {
    if (isCreditLocked) {
      alert('Validate your API key and balance in Settings first.');
      return;
    }

    const apiKey = localStorage.getItem('AI_GATEWAY_API_KEY') || '';
    if (!apiKey) {
      setCreditsState({ status: 'missing', error: 'Add your AI Gateway key in Settings.' });
      return;
    }

    setGeneratingChefs(true);
    setChefIntrosReady(false);
    const statusMap: Record<string, 'pending' | 'done' | 'error'> = {};
    gameState.contestants.forEach(id => statusMap[id] = 'pending');
    setChefIntroStatus(statusMap);

    await Promise.allSettled(gameState.contestants.map(async id => {
      try {
        const chefConfig = getChefConfig(id);
        const res = await fetch('/api/chef-intro', {
          method: 'POST',
          body: JSON.stringify({ chef: chefConfig, apiKey })
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || 'Unable to introduce chef');
        }

        const rawData = await res.json();
        const data = normalizeIntroData(rawData);
        setChefs(prev => prev.map(c => c.id === id ? { ...c, name: data.name || c.name, bio: data.bio || c.bio, avatarUrl: data.imageUrl || c.avatarUrl } : c));
        statusMap[id] = 'done';
        setChefIntroStatus(prev => ({ ...prev, [id]: 'done' }));
      } catch (e) {
        console.error(`Intro for ${id} failed`, e);
        statusMap[id] = 'error';
        setChefIntroStatus(prev => ({ ...prev, [id]: 'error' }));
      }
    }));

    const allSettled = Object.values(statusMap).every(s => s !== 'pending');
    setChefIntrosReady(allSettled);
    setGeneratingChefs(false);
  };

  const startRound = async () => {
    if (isCreditLocked) {
      alert("Validate your API key and balance before starting.");
      return;
    }

    if (!hasGeneratedChefs) {
      alert("Generate the chefs first to begin the competition.");
      return;
    }

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
    setCurrentChefIndex(0);
    setHasChoppedThisRound(false);

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
    if (isCreditLocked || !hasGeneratedChefs) return;

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
      let textData = await textRes.json();
      textData = normalizeDishData(textData) || textData;

      // Build base dish
      const baseDish: Dish = {
        roundNumber: roundNum,
        chefId: chef.id as ChefProvider,
        title: textData.dishTitle,
        description: textData.monologue,
        ingredientsUsed: ingredients,
        imageUrl: undefined
      };

      // Update State with Text
      setGameState(prev => ({
        ...prev,
        dishes: {
          ...prev.dishes,
          [chef.id]: baseDish
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
      const finalDish: Dish = { ...baseDish, imageUrl: finalImageUrl };

      setGameState(prev => ({
        ...prev,
        dishes: {
          ...prev.dishes,
          [chef.id]: finalDish
        }
      }));
      setLoadingStates(prev => ({ ...prev, [chef.id]: 'done' }));

      // Track history (upsert by round)
      setDishHistory(prev => {
        const existing = prev[chef.id] || [];
        const filtered = existing.filter(d => d.roundNumber !== roundNum);
        return { ...prev, [chef.id]: [...filtered, finalDish] };
      });

    } catch (e) {
      console.error(`Chef ${chef.name} failed:`, e);
      setLoadingStates(prev => ({ ...prev, [chef.id]: 'error' }));
    }
  };

  const moveToRoundOne = () => {
    if (!chefIntrosReady) return;
    setHasGeneratedChefs(true);
    setCurrentChefIndex(0);
    setHasChoppedThisRound(false);
  };

  const openLightbox = (src?: string, title?: string, chefName?: string) => {
    if (!src) return;
    setLightboxImage({ src, title, chef: chefName });
  };

  const closeLightbox = () => setLightboxImage(null);

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
    if (hasChoppedThisRound) {
      alert("You've already chopped a chef this round. Start the next round to chop again.");
      return;
    }

    const chefName = getChefConfig(chefId).name || chefId;
    if (!confirm(`Are you sure you want to CHOP ${chefName}?`)) return;

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
    setHasChoppedThisRound(true);
  };

  // Calculate current round type for labelling
  const currentRoundType = (gameState.roundNumber + 1) === 1 ? 'Appetizer' :
    (gameState.roundNumber + 1) === 2 ? 'Entree' :
      (gameState.roundNumber + 1) === 3 ? 'Dessert' : 'Mystery Round';

  // Get ingredient options for the current input based on upcoming round
  const ingredientOptions = mounted ? getIngredients(currentRoundType, showDetails) : [];
  const activeChefs = gameState.contestants.map(id => getChefConfig(id));
  const canStartRound = !generatingChefs && hasGeneratedChefs && basket.filter(i => i.trim()).length === 4;

  useEffect(() => {
    if (currentChefIndex > activeChefs.length - 1) {
      setCurrentChefIndex(Math.max(0, activeChefs.length - 1));
    }
  }, [activeChefs.length, currentChefIndex]);

  // --- Renders ---

  // 1. Winner View
  if (gameState.status === 'completed') {
    const winnerId = gameState.contestants[0];
    const winner = chefs.find(c => c.id === winnerId);
    const winnerDishes = (dishHistory[winnerId as ChefProvider] || []).sort((a, b) => a.roundNumber - b.roundNumber);

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center p-10 space-y-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-black to-black">
        <div className="flex flex-col items-center gap-4 text-center">
          <Trophy size={80} className="text-amber-500 animate-bounce" />
          <h1 className="text-6xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-600">
            {winner?.name} Wins!
          </h1>
          <p className="text-2xl text-gray-300 max-w-2xl">
            Champion of the Vercel AI Gateway Hackathon.
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => winner?.avatarUrl && openLightbox(winner.avatarUrl, `${winner.name} portrait`, winner.name)}
              className="w-40 h-40 rounded-full overflow-hidden border-4 border-amber-500 shadow-2xl cursor-zoom-in disabled:cursor-default"
              disabled={!winner?.avatarUrl}
            >
              {winner?.avatarUrl ? (
                <img src={winner.avatarUrl} alt={winner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-3xl font-bold">{winner?.name[0]}</div>
              )}
            </button>
            <div className="text-left">
              <p className="text-sm text-gray-400 uppercase tracking-wide">{winner?.modelId}</p>
              {winner?.bio && <p className="mt-2 text-gray-300 max-w-md">{winner.bio}</p>}
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Winning Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {winnerDishes.map(dish => (
              <div key={`${dish.roundNumber}-${dish.title}`} className="bg-gray-900/70 border border-amber-700/40 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-400">Round {dish.roundNumber}</span>
                  <ChefHat className="text-amber-400" size={18} />
                </div>
                <h3 className="text-xl font-semibold text-amber-300">{dish.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto">{dish.description}</p>
                {dish.imageUrl && (
                  <button
                    onClick={() => openLightbox(dish.imageUrl, dish.title, winner?.name)}
                    className="w-full rounded-xl overflow-hidden border border-gray-800 cursor-zoom-in group"
                  >
                    <img src={dish.imageUrl} alt={dish.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
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
        <div className="mb-6 p-4 border border-gray-800 rounded-xl bg-gray-900/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-start gap-3">
            {creditsState.status === 'valid' ? (
              <ShieldCheck className="text-green-400 mt-1" size={20} />
            ) : (
              <Lock className="text-amber-400 mt-1" size={20} />
            )}
            <div>
              <p className="text-sm font-semibold text-white">Enter your Vercel AI Gateway key in Settings, then validate balance.</p>
              <p className="text-xs text-gray-400">Gameplay stays locked (greyed out) until /credits shows more than $1 remaining.</p>
              <div className="text-xs mt-1">
                {creditsState.status === 'valid' && (
                  <span className="text-green-400 font-semibold">Balance OK: ${creditsState.balance?.toFixed(2)}</span>
                )}
                {creditsState.status !== 'valid' && (
                  <span className="text-amber-300 flex items-center gap-2">
                    <AlertCircle size={12} className="text-amber-500" />
                    {creditsState.error || 'Waiting for validation...'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => validateCredits()}
              disabled={creditsState.status === 'checking'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {creditsState.status === 'checking' ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {creditsState.status === 'checking' ? 'Checking...' : 'Validate Balance'}
            </button>
            <span className="text-[11px] text-gray-500">Use Settings to update your API key.</span>
          </div>
        </div>

        <div className={`${isCreditLocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>

        {/* Round Controls */}
        <section className="mb-12 text-center space-y-6">
          {!hasGeneratedChefs ? (
            <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center justify-center gap-3">
                <UserPlus className="text-amber-500" />
                <h2 className="text-3xl font-bold text-white">Generate Chefs</h2>
              </div>
              <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                Before cooking begins, let each AI chef pick their own name and a quick backstory. Basket selection unlocks once introductions are finished.
              </p>
              <button
                onClick={generateChefs}
                disabled={generatingChefs}
                className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
              >
                {generatingChefs ? <RefreshCw className="animate-spin" size={18} /> : <UserPlus size={18} />}
                {generatingChefs ? 'Asking chefs for intros...' : 'Generate Chefs'}
              </button>

              <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chefs.map(chef => {
                  const status = chefIntroStatus[chef.id];
                  const statusText = status === 'done' ? 'Ready' : status === 'error' ? 'Retry needed' : generatingChefs ? 'Generating...' : 'Waiting';
                  const statusColor = status === 'done' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-amber-400';
                  return (
                    <div key={chef.id} className="flex items-start gap-5 bg-gray-900/70 border border-gray-800 rounded-2xl p-6 min-h-[260px]">
                      <button
                        onClick={() => chef.avatarUrl && openLightbox(chef.avatarUrl, `${chef.name} portrait`, chef.name)}
                        className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 disabled:cursor-default shadow-inner"
                        disabled={!chef.avatarUrl}
                        title={chef.avatarUrl ? 'View portrait' : undefined}
                      >
                        {chef.avatarUrl ? (
                          <img src={chef.avatarUrl} alt={chef.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className={`w-full h-full flex items-center justify-center font-bold text-xs ${chef.color}`}>{chef.name[0]}</span>
                        )}
                      </button>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-white text-xl">{chef.name}</p>
                        <p className="text-[13px] text-gray-400 uppercase tracking-wide">{chef.modelId}</p>
                        {chef.bio && <p className="text-base text-gray-200 mt-3 leading-relaxed">{chef.bio}</p>}
                        <span className={`text-[12px] ${statusColor}`}>{statusText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {chefIntrosReady && (
                <div className="text-center">
                  <button
                    onClick={moveToRoundOne}
                    className="mt-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                  >
                    Move to Round 1
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
                        disabled={generatingChefs}
                        className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase disabled:opacity-50"
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
                      disabled={!canStartRound}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {gameState.ingredients.join(' | ')}
                  </div>
                  {gameState.status === 'judging' && (
                    <p className="mt-8 text-xl text-red-400 font-bold animate-pulse">
                      Who will be CHOPPED?
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Chefs Carousel */}
        {gameState.status !== 'idle' && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Chef Dishes</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentChefIndex(prev => Math.max(0, prev - 1))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white disabled:opacity-40"
                disabled={currentChefIndex === 0}
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentChefIndex(prev => Math.min(activeChefs.length - 1, prev + 1))}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white disabled:opacity-40"
                disabled={currentChefIndex >= activeChefs.length - 1}
              >
                Next
              </button>
            </div>
          </div>

          {activeChefs.length > 0 && (
            <div className="relative max-w-3xl mx-auto">
              {(() => {
                const chef = activeChefs[currentChefIndex];
                const dish = gameState.dishes[chef.id];
                const loadingInfo = loadingStates[chef.id];

                let cardStatus: any = 'idle';
                if (loadingInfo === 'text' || loadingInfo === 'image') cardStatus = 'working';
                else if (loadingInfo === 'done' || loadingInfo === 'error') cardStatus = 'done';

                return (
                  <ChefCard
                    key={chef.id}
                    chef={chef}
                    dish={dish}
                    status={cardStatus}
                    onEliminate={eliminateChef}
                    isStreaming={false}
                    onImageClick={(src?: string) => openLightbox(src, dish?.title, chef.name)}
                    onAvatarClick={(src?: string) => openLightbox(src, `${chef.name} portrait`, chef.name)}
                    chopLocked={hasChoppedThisRound}
                  />
                );
              })()}

              <div className="flex justify-center gap-2 mt-4">
                {activeChefs.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setCurrentChefIndex(idx)}
                    className={`w-3 h-3 rounded-full ${idx === currentChefIndex ? 'bg-amber-500' : 'bg-gray-700'}`}
                    aria-label={`View ${c.name}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        )}
        </div>

        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={closeLightbox}
          >
            <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lightboxImage.src} alt={lightboxImage.title || 'Dish image'} className="w-full h-auto rounded-xl border border-gray-800 shadow-2xl" />
              <div className="mt-3 text-center text-sm text-gray-300">
                <p className="font-semibold">{lightboxImage.title || 'Dish image'}</p>
                {lightboxImage.chef && <p className="text-gray-400">by {lightboxImage.chef}</p>}
              </div>
              <button
                onClick={closeLightbox}
                className="absolute top-3 right-3 px-3 py-1 bg-gray-900/80 text-white text-xs rounded-full border border-gray-700 hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
