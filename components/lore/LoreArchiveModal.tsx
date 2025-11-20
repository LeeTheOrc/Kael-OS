
import React from 'react';
import { CloseIcon, CompletedGrimoireIcon, ScrollIcon, RocketLaunchIcon, SparklesIcon } from '../core/Icons';
import type { ModalType } from '../../App';

interface LoreArchiveModalProps {
    onClose: () => void;
    onOpenMenu: (menu: ModalType) => void;
}

const LoreButton: React.FC<{title: string, description: string, icon: React.ReactNode, onClick: () => void}> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="w-full text-left p-4 bg-forge-bg/50 hover:bg-forge-border/50 border border-forge-border rounded-lg transition-colors flex items-center gap-4">
        <div className="text-dragon-fire">{icon}</div>
        <div>
            <h3 className="font-bold text-forge-text-primary font-display tracking-wider">{title}</h3>
            <p className="text-sm text-forge-text-secondary">{description}</p>
        </div>
    </button>
);

export const LoreArchiveModal: React.FC<LoreArchiveModalProps> = ({ onClose, onOpenMenu }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-md p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <CompletedGrimoireIcon className="w-5 h-5 text-dragon-fire" />
                        <span>The Grand Grimoire</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-3">
                    <p className="mb-4">
                       Welcome to the Lore Archive, Architect. These are the sacred texts that define our quest.
                    </p>
                    <LoreButton 
                        title="The Core Law"
                        description="The immutable runes that define our project."
                        icon={<ScrollIcon className="w-6 h-6" />}
                        onClick={() => onOpenMenu('law')}
                    />
                    <LoreButton 
                        title="Level-Up Manifesto"
                        description="Our strategic roadmap and quest log."
                        icon={<RocketLaunchIcon className="w-6 h-6" />}
                        onClick={() => onOpenMenu('levelUp')}
                    />
                    <LoreButton 
                        title="Kael's Personality"
                        description="The spirit and voice of your AI Guardian."
                        icon={<SparklesIcon className="w-6 h-6" />}
                        onClick={() => onOpenMenu('personality')}
                    />
                </div>
            </div>
        </div>
    );
};
