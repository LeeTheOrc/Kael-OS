
import React from 'react';
import { CloseIcon, FlameIcon } from '../core/Icons';

interface GoNuclearModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const GoNuclearModal: React.FC<GoNuclearModalProps> = ({ onClose, onConfirm }) => {
  const [masterKey, setMasterKey] = React.useState('');
  const isKeyCorrect = masterKey === 'LeRoy0923!';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-red-500/50 rounded-lg shadow-2xl w-full max-w-lg p-6 m-4 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 font-display tracking-wider">
                    <FlameIcon className="w-5 h-5" />
                    <span>Rite of Annihilation</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="text-forge-text-secondary leading-relaxed space-y-4">
                <p>
                  Architect, this is a dangerous ritual. It will instantly and irrevocably purge our entire conversation history, cleansing the forge.
                </p>
                <p className="font-semibold text-dragon-fire">
                    This action cannot be undone.
                </p>
                <div>
                    <label htmlFor="masterKey" className="block text-sm font-medium text-forge-text-primary mb-1">
                        Utter the Master Key to proceed:
                    </label>
                    <input
                        type="password"
                        id="masterKey"
                        value={masterKey}
                        onChange={(e) => setMasterKey(e.target.value)}
                        className="w-full bg-forge-bg border-2 border-forge-border rounded-lg p-2 focus:ring-1 focus:ring-red-500 text-base text-forge-text-primary"
                        placeholder="LeRoy0923!"
                    />
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-forge-border hover:bg-forge-border/70 rounded-lg transition-colors"
                    >
                        Avert
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={!isKeyCorrect}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:bg-red-900/50 disabled:text-red-400/50 disabled:cursor-not-allowed"
                    >
                        Purge
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};