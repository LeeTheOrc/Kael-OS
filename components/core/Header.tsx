
import React from 'react';
import type { LinkState } from '../../types';
import { Logo } from './Logo';

interface HeaderProps {
    linkState: LinkState;
}

export const Header: React.FC<HeaderProps> = ({ linkState }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-30 p-4 bg-forge-bg/80 backdrop-blur-sm border-b border-forge-border">
            <div className="max-w-full mx-auto flex justify-between items-center px-4">
                <div className="flex items-center gap-4">
                    <Logo linkState={linkState} />
                </div>
            </div>
        </header>
    );
};
