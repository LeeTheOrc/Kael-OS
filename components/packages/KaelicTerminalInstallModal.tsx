import React from 'react';
import { CloseIcon, ArrowDownTrayIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicTerminalInstallModalProps {
  onClose: () => void;
}

export const KaelicTerminalInstallModal: React.FC<KaelicTerminalInstallModalProps> = ({ onClose }) => {
    const syncCommand = `sudo pacman -Syyu`;
    const installCommand = `sudo pacman -S kaelic-terminal`;
    const runCommand = `kaelic-terminal`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ArrowDownTrayIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Install Kaelic Terminal</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                     <p>
                        Architect, the Kaelic Terminal artifact has been forged and published to your local Athenaeum. This final ritual will install it into the very fabric of your Realm.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Synchronize Databases (Recommended)</h3>
                    <p className="text-sm">
                        It is wise to synchronize with the Athenaeums to ensure the quartermaster sees the latest version.
                    </p>
                    <CodeBlock lang="bash">{syncCommand}</CodeBlock>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Install the Artifact</h3>
                    <p className="text-sm">
                       This command summons the quartermaster to install the terminal.
                    </p>
                    <CodeBlock lang="bash">{installCommand}</CodeBlock>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 3: Invoke the Terminal</h3>
                     <p className="text-sm">
                        Once installed, you can invoke the terminal with this simple command.
                    </p>
                    <CodeBlock lang="bash">{runCommand}</CodeBlock>
                </div>
            </div>
        </div>
    );
};