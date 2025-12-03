import React from 'react';
import { CloseIcon, BroomIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface PacmanPurificationModalProps {
  onClose: () => void;
}

const PURGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

echo "--- Pacman Purification Ritual ---"
echo "This ritual will cleanse the pacman cache to free up disk space."
echo ""

# --- CACHE CLEANING ---
echo "--> Removing all cached packages except for the last 3 versions..."
sudo paccache -rk3

echo "--> Removing cached packages for uninstalled software..."
sudo paccache -ruk0

echo ""
echo "✨ Ritual Complete! The pacman cache has been purified."
`;

export const PacmanPurificationModal: React.FC<PacmanPurificationModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BroomIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Pacman Purification</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Over time, Architect, the forge accumulates dust. Pacman, our master quartermaster, stores every package it ever fetches. This ritual purifies the cache, keeping our forge lean and efficient.
                    </p>
                     <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This incantation uses the <code className="font-mono text-xs">paccache</code> tool to safely remove all cached packages except for the three most recent versions, as well as all packages for software that is no longer installed.
                    </p>
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Purification Incantation</h3>
                    <p>
                        Copy and run this entire script to cleanse the cache.
                    </p>
                    <CodeBlock lang="bash">{PURGE_SCRIPT_RAW}</CodeBlock>
                </div>
            </div>
        </div>
    );
};