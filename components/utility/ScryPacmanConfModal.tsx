
import React, { useState, useEffect } from 'react';
import { CloseIcon, EyeIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ScryPacmanConfModalProps {
  onClose: () => void;
}

export const ScryPacmanConfModal: React.FC<ScryPacmanConfModalProps> = ({ onClose }) => {
    const [configContent, setConfigContent] = useState('Scrying the ether...');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This is a placeholder for a potential future API call to a local agent.
        // For now, we just display the command to the user.
        setIsLoading(false);
        setConfigContent(`
# This is a representation. To see your live config, run the command below.
#
# /etc/pacman.conf
#

[options]
HoldPkg      = pacman glibc
Architecture = auto
Color
CheckSpace
VerbosePkgLists
ParallelDownloads = 5

SigLevel    = Required DatabaseOptional
LocalFileSigLevel = Optional

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

[multilib]
Include = /etc/pacman.d/mirrorlist

# --- Kael & Allied Repositories ---

[kael-os-local]
SigLevel = Required DatabaseRequired
Server = file:///home/architect/forge/repo

[kael-os]
SigLevel = Required DatabaseOptional
Server = https://leetheorc.github.io/kael-os-repo/

[chaotic-aur]
Include = /etc/pacman.d/chaotic-mirrorlist

[cachyos]
Include = /etc/pacman.d/cachyos-mirrorlist
`);
    }, []);
    
    const scryCommand = `cat /etc/pacman.conf`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <EyeIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Scry Pacman Configuration</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        This ritual allows us to peer into the master scroll of our quartermaster, pacman, to verify the order and presence of our Athenaeums.
                    </p>
                    {isLoading ? (
                         <p>Scrying...</p>
                    ) : (
                         <CodeBlock lang="bash">{configContent.trim()}</CodeBlock>
                    )}
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Live Scrying Incantation</h3>
                    <p>
                        To see the live, true state of your <code className="font-mono text-xs">/etc/pacman.conf</code>, run this command in your terminal.
                    </p>
                    <CodeBlock lang="bash">{scryCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};
