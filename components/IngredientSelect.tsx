'use client';

import { useState, useEffect, useRef } from 'react';
import { IngredientOption } from '@/lib/ingredients';
import { X, ChevronDown, Check } from 'lucide-react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    options: IngredientOption[];
    placeholder?: string;
    disabled?: boolean;
}

export default function IngredientSelect({ value, onChange, options, placeholder = "Select...", disabled }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // When value changes externally, we might want to reset search? 
    // Actually search is just for filtering the list.

    // Filter options
    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setSearch('');
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearch('');
    };

    // Find current label
    const currentOption = options.find(o => o.value === value);
    const displayValue = currentOption ? currentOption.label : value;

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className={`
                    w-full min-h-[42px] px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                    flex items-center justify-between cursor-pointer hover:border-gray-600 transition-colors
                    ${disabled ? 'opacity-50 pointer-events-none' : ''}
                    ${open ? 'ring-2 ring-amber-500 border-transparent' : ''}
                `}
                onClick={() => !disabled && setOpen(!open)}
            >
                <div className="flex-1 truncate text-gray-200">
                    {displayValue || <span className="text-gray-500">{placeholder}</span>}
                </div>
                <div className="flex items-center gap-1">
                    {value && !disabled && (
                        <button
                            onClick={clearSelection}
                            className="p-1 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-700 bg-gray-800 sticky top-0">
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search ingredients..."
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">No matches found</div>
                        ) : (
                            filtered.map((opt, idx) => (
                                <button
                                    key={`${opt.value}-${idx}`} // Prevent duplicate key warnings if data contains repeats
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                       w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between
                                       ${value === opt.value ? 'bg-amber-900/30 text-amber-200' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                                   `}
                                >
                                    <span>{opt.label}</span>
                                    {value === opt.value && <Check size={14} className="text-amber-500" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
