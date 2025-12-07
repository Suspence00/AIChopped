'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Lock, CheckCircle, AlertCircle, RefreshCw, Wallet } from 'lucide-react';
import { AVAILABLE_MODELS, DEFAULT_MODELS } from '@/lib/models';

function Input({ value, onChange, placeholder, type = "text", className = "" }: any) {
    return (
        <input
            type={type}
            className={`w-full p-2 border border-gray-700 bg-gray-900 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm ${className}`}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}

function Select({ value, onChange, options }: any) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full p-1.5 border border-gray-700 bg-gray-900 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-8 cursor-pointer text-xs"
            >
                {options.map((o: any) => (
                    <option key={o.id} value={o.id}>
                        {o.name} ({o.priceTier})
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
            </div>
        </div>
    );
}

function Button({ onClick, children, className, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
}

// Modal content component
function ModalContent({ onClose, keyValue, setKey, models, handleModelChange, saveSettings, checkCredits, checkingCredits, creditInfo }: any) {
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-4xl mx-4 shadow-2xl"
                style={{ margin: 'auto' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700 bg-gray-900 rounded-t-xl">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Lock size={18} className="text-amber-500" />
                        Game Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Content - Horizontal Layout */}
                <div className="flex flex-col md:flex-row">
                    {/* Left: API Key */}
                    <div className="p-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-700 bg-gray-900/30">
                        <h3 className="text-xs font-bold text-amber-500 uppercase mb-2">1. API Key</h3>
                        <p className="text-gray-400 text-xs mb-2">Enter your Vercel AI Gateway Key</p>
                        <Input
                            value={keyValue}
                            onChange={(e: any) => setKey(e.target.value)}
                            type="password"
                            placeholder="vck_..."
                            className="font-mono mb-2"
                        />
                        <button
                            onClick={checkCredits}
                            disabled={!keyValue || checkingCredits}
                            className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {checkingCredits ? <RefreshCw size={12} className="animate-spin" /> : <Wallet size={12} />}
                            {checkingCredits ? 'Checking...' : 'Check Balance'}
                        </button>

                        {creditInfo && (
                            <div className={`mt-2 p-2 rounded text-xs ${creditInfo.error ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                                {creditInfo.error ? (
                                    <div className="flex gap-2">
                                        <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                        <span className="break-all">{creditInfo.error}</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <CheckCircle size={12} className="shrink-0 mt-0.5" />
                                        <span>Balance: ${creditInfo.balance} | Used: ${creditInfo.total_used}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Model Selection */}
                    <div className="p-4 md:w-2/3">
                        <h3 className="text-xs font-bold text-gray-300 uppercase mb-3">2. Chef Models (Optional)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-green-400 mb-1">OpenAI</label>
                                <Select
                                    value={models.openai}
                                    onChange={(e: any) => handleModelChange('openai', e.target.value)}
                                    options={AVAILABLE_MODELS.openai}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-orange-400 mb-1">Anthropic</label>
                                <Select
                                    value={models.anthropic}
                                    onChange={(e: any) => handleModelChange('anthropic', e.target.value)}
                                    options={AVAILABLE_MODELS.anthropic}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-blue-400 mb-1">Google</label>
                                <Select
                                    value={models.google}
                                    onChange={(e: any) => handleModelChange('google', e.target.value)}
                                    options={AVAILABLE_MODELS.google}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">xAI</label>
                                <Select
                                    value={models.xai}
                                    onChange={(e: any) => handleModelChange('xai', e.target.value)}
                                    options={AVAILABLE_MODELS.xai}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-sm text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <Button onClick={saveSettings} className="py-1.5 text-sm">
                        Save & Reload
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsModal() {
    const [open, setOpen] = useState(false);
    const [key, setKey] = useState('');
    const [models, setModels] = useState(DEFAULT_MODELS);
    const [checkingCredits, setCheckingCredits] = useState(false);
    const [creditInfo, setCreditInfo] = useState<{ balance?: string, total_used?: string, error?: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedKey = localStorage.getItem('AI_GATEWAY_API_KEY');
        if (storedKey) setKey(storedKey);

        const storedModels = localStorage.getItem('AI_MODELS_CONFIG');
        if (storedModels) {
            try {
                setModels({ ...DEFAULT_MODELS, ...JSON.parse(storedModels) });
            } catch (e) {
                console.error("Failed to parse stored models", e);
            }
        }
    }, []);

    const saveSettings = () => {
        localStorage.setItem('AI_GATEWAY_API_KEY', key);
        localStorage.setItem('AI_MODELS_CONFIG', JSON.stringify(models));
        setOpen(false);
        window.location.reload();
    };

    const checkCredits = async () => {
        if (!key) return;
        setCheckingCredits(true);
        setCreditInfo(null);
        try {
            const res = await fetch('/api/credits', {
                headers: { 'Authorization': `Bearer ${key}` }
            });
            const data = await res.json();
            if (data.error) {
                setCreditInfo({ error: data.error });
            } else {
                setCreditInfo(data);
            }
        } catch (e: any) {
            setCreditInfo({ error: e.message || "Failed to check credits" });
        } finally {
            setCheckingCredits(false);
        }
    };

    const handleModelChange = (provider: keyof typeof DEFAULT_MODELS, modelId: string) => {
        setModels(prev => ({ ...prev, [provider]: modelId }));
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Settings"
            >
                <Settings size={24} />
            </button>

            {mounted && open && createPortal(
                <ModalContent
                    onClose={() => setOpen(false)}
                    keyValue={key}
                    setKey={setKey}
                    models={models}
                    handleModelChange={handleModelChange}
                    saveSettings={saveSettings}
                    checkCredits={checkCredits}
                    checkingCredits={checkingCredits}
                    creditInfo={creditInfo}
                />,
                document.body
            )}
        </>
    );
}
