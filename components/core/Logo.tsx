
import React, { useState } from 'react';
import type { LinkState } from '../../types';

interface LinkStateIndicatorProps {
    linkState: LinkState;
}

const LinkStateIndicator: React.FC<LinkStateIndicatorProps> = ({ linkState }) => {
    const isOnline = linkState === 'online';
    const [isHovered, setIsHovered] = useState(false);

    const indicatorClasses = isOnline
        ? 'bg-dragon-fire animate-pulse-glow-small'
        : 'bg-forge-text-secondary/50';

    const tooltipText = isOnline
      ? "Online: Connected to Gemini."
      : "Offline: Connection to Gemini is severed.";

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`w-3 h-3 rounded-full transition-colors ${indicatorClasses}`}
                aria-label={`Current status: ${linkState}.`}
            />
            {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-forge-panel border border-forge-border text-forge-text-secondary text-xs rounded-lg shadow-lg z-10 animate-fade-in-fast">
                    {tooltipText}
                </div>
            )}
        </div>
    );
}


interface LogoProps {
    linkState: LinkState;
}

export const Logo: React.FC<LogoProps> = ({ linkState }) => (
  <div className="flex items-center gap-3 text-2xl font-semibold text-forge-text-primary group">
    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 text-dragon-fire group-hover:drop-shadow-[0_0_3px_#ffcc00] transition-all duration-300"
            aria-label="Kael AI Logo"
        >
            <path d="M4 20V4M4 12h8M12 12l6-8M12 12l6 8"/>
        </svg>
    </div>
    <div className="flex items-center gap-2 font-display tracking-wider">
        <span>Kael AI</span>
        <LinkStateIndicator linkState={linkState} />
    </div>
  </div>
);
