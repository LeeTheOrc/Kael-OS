


import React from 'react';
import { 
    CpuChipIcon, 
    ShellPromptIcon,
    GlobeAltIcon
} from '../../core/Icons';
import type { ModalType } from '../../../App';

interface QuickAccessItem {
    id: ModalType;
    label: string;
    icon: React.ReactNode;
    color: string;
}

interface QuickAccessDockProps {
    onOpenModal: (modal: ModalType) => void;
}

export const QuickAccessDock: React.FC<QuickAccessDockProps> = ({ onOpenModal }) => {
    // Active Project Slots: 
    // 1. Kaelic Shell (The Interface)
    // 2. Forge Local Core (The Offline Mind)
    // 3. Forge Cloud Core (The Online Oracle)
    const activeProjects: QuickAccessItem[] = [
        { 
            id: 'kaelicShell', 
            label: 'Kaelic Shell', 
            icon: <ShellPromptIcon className="w-5 h-5" />,
            color: 'text-magic-purple'
        },
        { 
            id: 'kaelLocalCore', 
            label: 'Forge Local Core', 
            icon: <CpuChipIcon className="w-5 h-5" />,
            color: 'text-dragon-fire'
        },
        { 
            id: 'kaelCloudCore', 
            label: 'Forge Cloud Core', 
            icon: <GlobeAltIcon className="w-5 h-5" />,
            color: 'text-orc-steel'
        }
    ];

    return (
        <div className="flex justify-center mb-4 animate-slide-in-left">
            <div className="bg-forge-panel/90 backdrop-blur-md border border-forge-border rounded-xl shadow-lg shadow-black/40 p-2 flex gap-4">
                {activeProjects.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onOpenModal(item.id)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-forge-bg/50 border border-transparent hover:border-forge-border hover:bg-forge-bg transition-all group"
                        title={`Open ${item.label}`}
                    >
                        <div className={`${item.color} group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <span className="text-sm font-medium text-forge-text-secondary group-hover:text-forge-text-primary">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};