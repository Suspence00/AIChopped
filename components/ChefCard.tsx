'use client';

import { Chef, Dish } from '@/lib/types';
import { Loader2, Utensils } from 'lucide-react';

interface ChefCardProps {
    chef: Chef;
    dish?: Dish;
    status: 'idle' | 'working' | 'done' | 'eliminated';
    onEliminate: (chefId: string) => void;
    isStreaming?: boolean;
    streamContent?: string;
}

export function ChefCard({ chef, dish, status, onEliminate, isStreaming, streamContent }: ChefCardProps) {
    const isEliminated = status === 'eliminated';
    const isLoading = status === 'working';

    // Use streamed content if available and dish is not yet finalized
    const description = isStreaming ? streamContent : dish?.description;
    const title = dish?.title || (isStreaming ? "Cooking..." : "Waiting for ingredients");

    return (
        <div className={`relative flex flex-col h-full bg-gray-900 border rounded-xl overflow-hidden transition-all duration-500
      ${isEliminated ? 'border-red-900 opacity-50 grayscale' : 'border-gray-700 hover:border-amber-500 shadow-lg'}
    `}>
            {/* Header */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-white text-black">
                        {chef.name[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{chef.name}</h3>
                        <span className="text-xs text-gray-400 uppercase tracking-wider">{chef.modelId}</span>
                    </div>
                </div>
                {isEliminated && <span className="text-red-500 font-bold px-2 border border-red-500 rounded text-sm">CHOPPED</span>}
            </div>

            {/* Body */}
            <div className="flex-1 p-4 flex flex-col gap-4">
                {isLoading && !isStreaming ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 animate-pulse">
                        <Utensils className="animate-spin mb-2" />
                        <p>Chef is cooking...</p>
                    </div>
                ) : (
                    <>
                        <div className="min-h-[60px]">
                            <h4 className="font-serif text-xl text-amber-500 mb-1 leading-snug">{title}</h4>
                        </div>

                        <div className="prose prose-invert prose-sm text-gray-300 flex-1 max-h-48 overflow-y-auto">
                            <p className="whitespace-pre-wrap">{description}</p>
                        </div>
                    </>
                )}

                {/* Image Area */}
                <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border border-gray-800">
                    {dish?.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-950">
                            {isLoading ? <Loader2 className="animate-spin opacity-20" size={48} /> : <Utensils className="opacity-10" size={48} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <button
                    onClick={() => onEliminate(chef.id)}
                    disabled={status !== 'done'}
                    className="w-full py-3 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-0 disabled:cursor-not-allowed"
                >
                    Chop Chef
                </button>
            </div>
        </div>
    );
}
