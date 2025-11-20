
import React from 'react';
import { SendIcon, HammerIcon, ShieldCheckIcon, BookOpenIcon } from '../../core/Icons';
import type { MenuType } from './ForgeActionsPanel';

interface BottomPanelProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSendMessage: () => void;
    isLoading: boolean;
    onOpenMenu: (menu: MenuType) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ value, onChange, onSendMessage, isLoading, onOpenMenu }) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };
    
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div className="bg-forge-panel/95 backdrop-blur-sm border-t-2 border-forge-border rounded-t-xl mt-auto pb-4 px-4 pt-3 shadow-2xl shadow-black/30">
            <div className="relative flex items-center gap-3">
                {/* The Tripartite Menu */}
                <div className="flex gap-1">
                    <button
                        onClick={() => onOpenMenu('forge')}
                        className="p-3 bg-forge-bg border-2 border-forge-border rounded-lg text-forge-text-secondary hover:text-dragon-fire hover:border-dragon-fire/50 transition-colors group relative"
                        aria-label="Open The Forge (Active)"
                    >
                        <HammerIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-forge-border text-dragon-fire">
                            The Forge
                        </span>
                    </button>
                    
                    <button
                        onClick={() => onOpenMenu('sanctum')}
                        className="p-3 bg-forge-bg border-2 border-forge-border rounded-lg text-forge-text-secondary hover:text-orc-steel hover:border-orc-steel/50 transition-colors group relative"
                        aria-label="Open The Sanctum (Protected)"
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-forge-border text-orc-steel">
                            The Sanctum
                        </span>
                    </button>

                    <button
                        onClick={() => onOpenMenu('lore')}
                        className="p-3 bg-forge-bg border-2 border-forge-border rounded-lg text-forge-text-secondary hover:text-magic-purple hover:border-magic-purple/50 transition-colors group relative"
                        aria-label="Open The Grimoire (Lore)"
                    >
                        <BookOpenIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-forge-border text-magic-purple">
                            The Grimoire
                        </span>
                    </button>
                </div>

                {/* Input Area */}
                <div className="relative w-full">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        placeholder={'Converse with Kael...'}
                        className="w-full bg-forge-bg border-2 border-forge-border rounded-lg p-3 pr-16 resize-none focus:ring-1 focus:ring-dragon-fire text-base transition-colors text-forge-text-primary placeholder:text-forge-text-secondary"
                        rows={1}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                        <button
                            onClick={onSendMessage}
                            disabled={isLoading || (!value.trim())}
                            className="p-2 bg-dragon-fire text-black rounded-lg transition-colors disabled:bg-forge-border disabled:text-forge-text-secondary"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
