
import React from 'react';
import { CloseIcon, BookOpenIcon, SignalIcon, EyeIcon, ShieldCheckIcon, ShellPromptIcon } from '../core/Icons';
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
                        <span>Chronicler's Guide v4.7</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        The Chronicler is active, but the <strong>Auto-Intervention</strong> protocols have been suspended to ensure stability during base64 rituals. You now have full manual control.
                    </p>

                    <div className="bg-orc-steel/10 border border-orc-steel/30 p-4 rounded-lg">
                        <h3 className="font-bold text-orc-steel font-display flex items-center gap-2 mb-2">
                            <ShellPromptIcon className="w-5 h-5" />
                            <span>Manual Control (Active)</span>
                        </h3>
                        <p className="text-sm mb-2 text-forge-text-primary">
                            The shell will no longer interrupt you. To record a session or wrap a dangerous command, you must invoke the Chronicler yourself.
                        </p>
                        
                        <div className="space-y-3 mt-3">
                            <div>
                                <span className="text-xs font-bold text-dragon-fire uppercase tracking-wider">Start Recording Session</span>
                                <p className="text-xs text-forge-text-secondary mb-1">Records everything until you type 'exit'.</p>
                                <CodeBlock lang="bash">chronicler</CodeBlock>
                            </div>
                            
                            <div>
                                <span className="text-xs font-bold text-dragon-fire uppercase tracking-wider">Wrap Single Command</span>
                                <p className="text-xs text-forge-text-secondary mb-1">Records just this command, then exits.</p>
                                <CodeBlock lang="bash">chronicler exec ./dangerous_script.sh</CodeBlock>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-400/30 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-400 font-display flex items-center gap-2 mb-2">
                            <EyeIcon className="w-5 h-5" />
                            <span>The Overseer (Snapshot)</span>
                        </h3>
                         <p className="text-sm mb-2 text-forge-text-primary">
                             The Overseer still watches when invoked. It creates timestamped backups of files.
                        </p>
                        <div className="grid gap-2">
                            <div className="bg-forge-bg/50 p-2 rounded border border-forge-border">
                                <span className="text-dragon-fire font-mono text-xs block mb-1">Snapshot File</span>
                                <code className="text-xs">chronicler /path/to/file</code>
                            </div>
                            <div className="bg-forge-bg/50 p-2 rounded border border-forge-border">
                                <span className="text-dragon-fire font-mono text-xs block mb-1">Restore File</span>
                                <code className="text-xs">chronicler --restore /path/to/file</code>
                            </div>
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
