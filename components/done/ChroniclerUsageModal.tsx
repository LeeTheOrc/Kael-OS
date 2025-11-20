
import React from 'react';
import { CloseIcon, BookOpenIcon, SignalIcon, EyeIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ChroniclerUsageModalProps {
  onClose: () => void;
}

export const ChroniclerUsageModal: React.FC<ChroniclerUsageModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <BookOpenIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Chronicler's Guide v4.3</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        The Chronicler has ascended to <strong className="text-dragon-fire">The Guardian (v4.3)</strong>.
                    </p>

                    <div className="bg-dragon-fire/10 border border-dragon-fire/30 p-4 rounded-lg">
                        <h3 className="font-bold text-dragon-fire font-display flex items-center gap-2 mb-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            <span>The Guardian Protocol</span>
                        </h3>
                        <p className="text-sm mb-2 text-forge-text-primary">
                            Kael now automatically intercepts dangerous commands.
                        </p>
                        <ul className="list-disc list-inside text-sm text-forge-text-primary space-y-1 mb-3">
                            <li><code className="font-mono text-xs text-orc-steel">pacman</code> / <code className="font-mono text-xs text-orc-steel">paru</code> / <code className="font-mono text-xs text-orc-steel">yay</code></li>
                            <li><code className="font-mono text-xs text-orc-steel">makepkg</code></li>
                        </ul>
                        <p className="text-sm mb-3 text-forge-text-primary">
                            When you run these, they are secretly wrapped in a recording session. If they fail, I have the logs to help you fix it.
                        </p>
                        <div className="bg-black/30 p-2 rounded border border-forge-border/50">
                            <span className="text-xs text-forge-text-secondary block mb-1">Manual Wrapper:</span>
                            <CodeBlock lang="bash">guard ./dangerous_script.sh</CodeBlock>
                        </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-400/30 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-400 font-display flex items-center gap-2 mb-2">
                            <EyeIcon className="w-5 h-5" />
                            <span>The Overseer (Interactive)</span>
                        </h3>
                         <p className="text-sm mb-2 text-forge-text-primary">
                             <strong>Tabula Rasa:</strong> Starts with a clean screen.
                        </p>
                        <p className="text-sm mb-2 text-forge-text-primary">
                             <strong>Temporal Scrying:</strong> Automatically diffs and dumps any config files modified during your session.
                        </p>
                        <CodeBlock lang="bash">chronicler</CodeBlock>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Archive Management</h3>
                    <div className="grid gap-2">
                        <div className="bg-forge-bg/50 p-2 rounded border border-forge-border">
                            <span className="text-dragon-fire font-mono text-xs block mb-1">Snapshot File</span>
                            <code className="text-xs">chronicler /path/to/file</code>
                        </div>
                        <div className="bg-forge-bg/50 p-2 rounded border border-forge-border">
                            <span className="text-dragon-fire font-mono text-xs block mb-1">Restore File</span>
                            <code className="text-xs">chronicler --restore /path/to/file</code>
                        </div>
                         <div className="bg-forge-bg/50 p-2 rounded border border-forge-border">
                            <span className="text-dragon-fire font-mono text-xs block mb-1">Purge Old</span>
                            <code className="text-xs">chronicler --purge /path/to/file</code>
                        </div>
                    </div>

                    <p className="text-sm p-3 bg-forge-panel border-l-4 border-forge-border rounded mt-4">
                        <strong>Logs Location:</strong> <code className="font-mono text-xs">~/.local/share/chronicler/sessions/</code><br/>
                        <strong>Backups Location:</strong> <code className="font-mono text-xs">~/.local/share/chronicler/</code>
                    </p>
                </div>
            </div>
        </div>
    );
};
