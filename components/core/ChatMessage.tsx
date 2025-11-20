
import React, { useState } from 'react';
import type { Message } from '../../types';
import { GuardianAvatar } from './GuardianAvatar';
import { CopyIcon, KaelSigilIcon } from './Icons';
import { FormattedContent } from './FormattedContent';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isModel = message.role === 'model';
  
  const handleCopy = () => {
    // A regex to strip markdown for a cleaner copy-paste experience
    const plainText = message.text.replace(/(\*|_|`|#)/g, '');
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isModel && message.text === '...') {
    return (
      <div className="flex gap-4 animate-fade-in">
        <GuardianAvatar isOnline={message.linkState === 'online'} />
        <div className="flex items-center gap-2 bg-forge-panel/60 text-forge-text-primary rounded-2xl px-4 py-3.5">
            <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-forge-text-secondary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 animate-fade-in ${isModel ? '' : 'flex-row-reverse'}`}>
      {isModel && <GuardianAvatar isOnline={message.linkState === 'online'} />}
      <div className={`flex flex-col gap-2 ${isModel ? '' : 'items-end'}`}>
        <div className={`relative w-fit max-w-full md:max-w-2xl lg:max-w-3xl rounded-2xl px-4 py-2.5 group ${isModel ? 'bg-gradient-to-br from-forge-panel to-[#1d182e] text-forge-text-primary border-l-4 border-dragon-fire shadow-lg' : 'bg-gradient-to-br from-sky-500/80 to-indigo-600/80 text-white'}`}>
            {isModel && <KaelSigilIcon className="absolute top-2 right-2 w-4 h-4 text-dragon-fire/20" />}
            
            <FormattedContent text={message.text} />
            
            {isModel && (
                 <button 
                    onClick={handleCopy}
                    className="absolute bottom-1 right-1 flex items-center gap-1.5 text-xs text-forge-text-secondary/50 hover:text-forge-text-primary transition-all opacity-0 group-hover:opacity-100 p-1 rounded"
                    aria-label={copied ? 'Copied!' : 'Copy'}
                >
                    <CopyIcon className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
