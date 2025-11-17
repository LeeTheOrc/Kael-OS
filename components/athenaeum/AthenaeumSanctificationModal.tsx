import React from 'react';
import { CloseIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface AthenaeumSanctificationModalProps {
  onClose: () => void;
}

export const AthenaeumSanctificationModal: React.FC<AthenaeumSanctificationModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <ShieldCheckIcon className="w-5 h-5 text-dragon-fire" />
                    <span>Sanctify Athenaeum Repo (Obsolete)</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                 <p className="text-lg p-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded">
                    <strong className="text-dragon-fire">This ritual has been reforged!</strong>
                </p>
                <p>
                   Architect, I have combined this ritual's logic into a single, more powerful incantation.
                </p>
                 <p>
                    Please use the new <strong className="text-orc-steel">'Full Forge Attunement'</strong> ritual (the Hammer icon) to prepare your system. It will sanctify your local repository automatically.
                </p>
            </div>
        </div>
    </div>
  );
};