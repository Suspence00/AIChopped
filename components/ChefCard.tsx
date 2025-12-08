'use client';

import { Chef, Dish } from '@/lib/types';
import { Loader2, Utensils, Maximize2 } from 'lucide-react';

interface ChefCardProps {
    chef: Chef;
    dish?: Dish;
    status: 'idle' | 'working' | 'done' | 'eliminated';
    onEliminate: (chefId: string) => void;
    isStreaming?: boolean;
    streamContent?: string;
    onImageClick?: (src?: string) => void;
    onAvatarClick?: (src?: string) => void;
    chopLocked?: boolean;
    imageDisabled?: boolean;
}

export function ChefCard({ chef, dish, status, onEliminate, isStreaming, streamContent, onImageClick, onAvatarClick, chopLocked = false, imageDisabled = false }: ChefCardProps) {
    const isEliminated = status === 'eliminated';
    const isLoading = status === 'working';
    const canChop = status === 'done' && !chopLocked;
    const hasDish = !!dish;

    // Use streamed content if available and dish is not yet finalized
    const description = isStreaming ? streamContent : dish?.description;
    const title = dish?.title || (isStreaming ? "Cooking..." : "Waiting for ingredients");
    const displayTitle = hasDish ? title : (status === 'done' ? "No dish returned" : title);
    const displayDescription = hasDish ? description : (status === 'done' ? "The chef could not plate a dish this round." : description);

    const renderParagraphs = (text?: string) => {
        if (!text) return null;
        const parts = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        if (!parts.length) return <p className="whitespace-pre-wrap">{text}</p>;
        return parts.map((p, idx) => (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed mb-3 last:mb-0">{p}</p>
        ));
    };

    return (
        <div className={`relative flex flex-col h-full bg-gray-900 border rounded-xl overflow-hidden transition-all duration-500
      ${isEliminated ? 'border-red-900 opacity-50 grayscale' : 'border-gray-700 hover:border-amber-500 shadow-lg'}
    `}>
            {/* Header */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => chef.avatarUrl && onAvatarClick?.(chef.avatarUrl)}
                        className="w-16 h-16 rounded-full overflow-hidden bg-white text-black flex items-center justify-center font-bold text-sm disabled:cursor-default cursor-zoom-in ring-2 ring-amber-500/50"
                        disabled={!chef.avatarUrl}
                        title={chef.avatarUrl ? 'View portrait' : undefined}
                    >
                        {chef.avatarUrl ? (
                            <img src={chef.avatarUrl} alt={chef.name} className="w-full h-full object-cover" />
                        ) : chef.name[0]}
                    </button>
                    <div>
                        <h3 className="font-bold text-white text-xl leading-tight">{chef.name}</h3>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{chef.modelId}</span>
                    </div>
                </div>
                {isEliminated && <span className="text-red-500 font-bold px-2 border border-red-500 rounded text-sm">CHOPPED</span>}
            </div>

            {/* Body */}
            <div className="flex-1 p-4 flex flex-col gap-4">
                {chef.bio && (
                    <p className="text-md text-gray-200 italic leading-relaxed">{chef.bio}</p>
                )}
                {isLoading && !isStreaming ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 animate-pulse">
                        <Utensils className="animate-spin mb-2" />
                        <p>Chef is cooking...</p>
                    </div>
                ) : (
                    <>
                        <div className="min-h-[36px]">
                            <h4 className="font-serif text-xl text-amber-500 mb-1 leading-snug">{displayTitle}</h4>
                        </div>

                        <div className="prose prose-invert prose-sm text-gray-300 flex-1 min-h-[120px] max-h-72 overflow-y-auto">
                            {renderParagraphs(displayDescription)}
                        </div>
                    </>
                )}

                {/* Image Area */}
                <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-gray-800">
                    {dish?.imageUrl ? (
                        <button
                            onClick={() => onImageClick?.(dish.imageUrl)}
                            className="w-full h-full group cursor-zoom-in"
                        >
                            <img src={dish.imageUrl} alt={dish.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-950 px-3 text-center">
                            {imageDisabled ? (
                                <span className="text-xs text-gray-500">Image generation disabled</span>
                            ) : isLoading ? (
                                <Loader2 className="animate-spin opacity-20" size={48} />
                            ) : (
                                <Utensils className="opacity-10" size={48} />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <button
                    onClick={() => onEliminate(chef.id)}
                    disabled={!canChop}
                    className="w-full py-3 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-0 disabled:cursor-not-allowed"
                >
                    Chop Chef
                </button>
            </div>
        </div>
    );
}
