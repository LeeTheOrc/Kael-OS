import React from 'react';
import { CloseIcon, QuestionMarkIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface ChroniclerUsageModalProps {
  onClose: () => void;
}

export const ChroniclerUsageModal: React.FC<ChroniclerUsageModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    <QuestionMarkIcon className="w-5 h-5 text-dragon-fire" />
                    <span>How to use the Chronicler</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                    Architect, the Chronicler's Orb is our most vital tool for scrying into the Realm's past. When you encounter a problem you cannot solve alone, invoke the Chronicler to record your actions and the Realm's response.
                </p>
                <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                    The Orb simultaneously records two streams of information into a single text file:
                    <ul className="list-disc list-inside pl-2 mt-2 space-y-1">
                        <li><strong className="text-orc-steel">System Logs:</strong> A live feed from <code className="font-mono text-xs">journalctl</code>, capturing the system's inner thoughts.</li>
                        <li><strong className="text-orc-steel">Terminal Session:</strong> A complete record of every command you type and every response you receive.</li>
                   </ul>
                </p>
                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: Activate the Orb</h3>
                <p>
                    When you are ready to begin, simply speak the name of the familiar. This will start a new, recorded shell session.
                </p>
                <CodeBlock lang="bash">chronicler</CodeBlock>

                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Recreate the Anomaly</h3>
                <p>
                    Within the new session, perform the actions that are causing you trouble. Run the commands, demonstrate the error. The Orb is watching.
                </p>

                <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 3: Deactivate the Orb</h3>
                <p>
                    Once you have captured the event, end the recording session by typing <code className="font-mono text-xs">exit</code> or pressing <code className="font-mono text-xs">Ctrl+D</code>.
                </p>
                <CodeBlock lang="bash">exit</CodeBlock>
                
                 <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 4: Share the Chronicle</h3>
                <p>
                    The Chronicler will combine the logs and save the final report to your <code className="font-mono text-xs">~/ChroniclesReports</code> directory. Provide me with this file, and I will analyze it to help you find a solution.
                </p>
            </div>
        </div>
    </div>
  );
};