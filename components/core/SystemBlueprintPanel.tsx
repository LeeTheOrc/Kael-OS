



import React from 'react';
import { 
    HammerIcon, 
    LockClosedIcon, 
    CpuChipIcon,
    GlobeAltIcon,
    ShellPromptIcon,
    CubeIcon,
    DocumentDuplicateIcon,
    SignalIcon,
    PaintBrushIcon,
    ComputerDesktopIcon,
    ShoppingCartIcon,
    SparklesIcon,
    RocketLaunchIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    BeakerIcon,
    ServerIcon,
    ShieldCheckIcon,
    FlameIcon,
    KeyIcon
} from './Icons';

interface SystemBlueprintPanelProps {
    className?: string;
}

type Status = 'protected' | 'forging' | 'pending' | 'testing';

interface BlueprintSpec {
    label: string;
    value: string;
    detail?: string;
    status: Status;
    icon: React.ReactNode;
}

interface BlueprintSection {
    title: string;
    specs: BlueprintSpec[];
}

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
    switch (status) {
        case 'protected': // DONE
            return (
                <div className="flex items-center gap-1.5 bg-orc-steel/10 px-2 py-0.5 rounded border border-orc-steel/30 shadow-[0_0_10px_rgba(122,235,190,0.1)]">
                    <ShieldCheckIcon className="w-3 h-3 text-orc-steel" />
                    <span className="text-[10px] font-bold text-orc-steel uppercase tracking-wider">Done</span>
                </div>
            );
        case 'forging': // BUSY
            return (
                <div className="flex items-center gap-1.5 bg-dragon-fire/10 px-2 py-0.5 rounded border border-dragon-fire/30 shadow-[0_0_10px_rgba(255,204,0,0.15)]">
                    <HammerIcon className="w-3 h-3 text-dragon-fire animate-pulse" />
                    <span className="text-[10px] font-bold text-dragon-fire uppercase tracking-wider">Busy</span>
                </div>
            );
        case 'testing': // EXPERIMENTAL
             return (
                <div className="flex items-center gap-1.5 bg-magic-purple/10 px-2 py-0.5 rounded border border-magic-purple/30 shadow-[0_0_10px_rgba(224,64,251,0.15)]">
                    <BeakerIcon className="w-3 h-3 text-magic-purple animate-pulse" />
                    <span className="text-[10px] font-bold text-magic-purple uppercase tracking-wider">Testing</span>
                </div>
            );
        case 'pending': // TO DO
            return (
                <div className="flex items-center gap-1.5 bg-forge-border/30 px-2 py-0.5 rounded border border-forge-border/50 opacity-60">
                    <div className="w-3 h-3 rounded-full border-2 border-forge-text-secondary/50" />
                    <span className="text-[10px] font-bold text-forge-text-secondary uppercase tracking-wider">To Do</span>
                </div>
            );
    }
};

const SpecRow: React.FC<{ spec: BlueprintSpec }> = ({ spec }) => {
    const isProtected = spec.status === 'protected';
    const isForging = spec.status === 'forging';
    const isTesting = spec.status === 'testing';

    let rowBorderColor = 'border-l-forge-border/30';
    let iconColor = 'text-forge-text-secondary';
    let valueColor = 'text-forge-text-secondary';
    let bgHover = 'hover:bg-forge-panel/30';
    let bgBase = '';

    if (isProtected) {
        rowBorderColor = 'border-l-orc-steel';
        iconColor = 'text-orc-steel';
        valueColor = 'text-orc-steel';
        bgHover = 'hover:bg-orc-steel/5';
        bgBase = 'bg-orc-steel/5';
    } else if (isForging) {
        rowBorderColor = 'border-l-dragon-fire';
        iconColor = 'text-dragon-fire';
        valueColor = 'text-dragon-fire';
        bgHover = 'hover:bg-dragon-fire/5';
        bgBase = 'bg-dragon-fire/5';
    } else if (isTesting) {
        rowBorderColor = 'border-l-magic-purple';
        iconColor = 'text-magic-purple';
        valueColor = 'text-magic-purple';
        bgHover = 'hover:bg-magic-purple/5';
        bgBase = 'bg-magic-purple/5';
    }

    return (
        <div className={`flex items-center justify-between py-2 pl-3 pr-2 border-l-2 ${rowBorderColor} ${bgBase} border-b border-forge-border/30 last:border-0 group ${bgHover} transition-all mb-1`}>
            <div className="flex items-center gap-3 min-w-0">
                 <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-forge-bg border border-forge-border/50 ${iconColor}`}>
                    {spec.icon}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-forge-text-secondary/60">{spec.label}</span>
                    <span className={`font-mono text-xs font-medium truncate ${valueColor} ${isForging || isTesting ? 'animate-pulse' : ''}`}>
                        {spec.value}
                    </span>
                    {spec.detail && (
                         <span className="text-[9px] text-forge-text-secondary/50 italic truncate">{spec.detail}</span>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0 ml-2">
                <StatusIcon status={spec.status} />
            </div>
        </div>
    );
};

export const SystemBlueprintPanel: React.FC<SystemBlueprintPanelProps> = ({ className = "" }) => {
    const sections: BlueprintSection[] = [
        {
            title: "Infrastructure (The Forge)",
            specs: [
                { 
                    label: "Repo System", 
                    value: "kael-os-repo", 
                    detail: "GitHub Pages Hosted",
                    status: 'protected', 
                    icon: <ServerIcon /> 
                },
                { 
                    label: "Mirror", 
                    value: "WebDisk FTPS", 
                    detail: "Secondary Redundancy",
                    status: 'protected', 
                    icon: <SignalIcon /> 
                },
                { 
                    label: "Build Engine", 
                    value: "archiso", 
                    detail: "Official Tooling",
                    status: 'protected', 
                    icon: <BeakerIcon /> 
                },
                { 
                    label: "CI/CD", 
                    value: "GitHub Actions", 
                    detail: "Automated ISO Builds",
                    status: 'protected', 
                    icon: <CpuChipIcon /> 
                },
            ]
        },
        {
            title: "Installation (The Genesis)",
            specs: [
                { 
                    label: "Framework", 
                    value: "Calamares", 
                    detail: "GUI Installer",
                    status: 'protected', 
                    icon: <RocketLaunchIcon /> 
                },
                { 
                    label: "Config", 
                    value: "modules.conf", 
                    detail: "Partitions & Users",
                    status: 'protected', 
                    icon: <CubeIcon /> 
                },
                { 
                    label: "Bootloader", 
                    value: "GRUB 2", 
                    detail: "Unified Boot",
                    status: 'protected', 
                    icon: <LockClosedIcon /> 
                },
                { 
                    label: "Branding", 
                    value: "branding.desc", 
                    detail: "Visual Identity",
                    status: 'pending', 
                    icon: <PaintBrushIcon /> 
                },
                { 
                    label: "Post-Install", 
                    value: "shellprocess", 
                    detail: "Cleanup Scripts",
                    status: 'pending', 
                    icon: <ShellPromptIcon /> 
                },
                { 
                    label: "Slideshow", 
                    value: "Install Images", 
                    detail: "Welcome Guide",
                    status: 'pending', 
                    icon: <EyeIcon /> 
                },
            ]
        },
        {
            title: "Core System (The Body)",
            specs: [
                { 
                    label: "Base", 
                    value: "Arch Linux", 
                    status: 'protected', 
                    icon: <CubeIcon /> 
                },
                { 
                    label: "Kernel", 
                    value: "CachyOS", 
                    detail: "Performance Tuned",
                    status: 'protected', 
                    icon: <CpuChipIcon /> 
                },
                { 
                    label: "Filesystem", 
                    value: "BTRFS + Snapper", 
                    detail: "Snapshot Support",
                    status: 'protected', 
                    icon: <DocumentDuplicateIcon /> 
                },
                { 
                    label: "Boot Splash", 
                    value: "Plymouth", 
                    detail: "Silent Boot",
                    status: 'pending', 
                    icon: <EyeIcon /> 
                },
                { 
                    label: "Security", 
                    value: "UFW / Firewalld", 
                    detail: "Network Aegis",
                    status: 'pending', 
                    icon: <ShieldCheckIcon /> 
                },
            ]
        },
        {
            title: "Hybrid AI (The Animus)",
            specs: [
                { 
                    label: "Cloud Core", 
                    value: "Gemini 3.0 Pro", 
                    detail: "Online Oracle",
                    status: 'forging', 
                    icon: <GlobeAltIcon /> 
                },
                { 
                    label: "Local Core", 
                    value: "Llama 3 / Phi-3", 
                    detail: "Offline Intelligence",
                    status: 'testing', 
                    icon: <CpuChipIcon /> 
                },
                { 
                    label: "Terminal", 
                    value: "Kaelic Shell v1.7.1", 
                    detail: "Guardian Edition",
                    status: 'protected', 
                    icon: <ShellPromptIcon /> 
                },
                { 
                    label: "Voice", 
                    value: "Speech-to-Text", 
                    detail: "Audio Interface",
                    status: 'pending', 
                    icon: <SignalIcon /> 
                },
            ]
        },
        {
            title: "Desktop (The Visage)",
            specs: [
                { 
                    label: "Env", 
                    value: "KDE Plasma 6", 
                    status: 'protected', 
                    icon: <ComputerDesktopIcon /> 
                },
                { 
                    label: "Login", 
                    value: "SDDM", 
                    status: 'protected', 
                    icon: <LockClosedIcon /> 
                },
                { 
                    label: "Theme", 
                    value: "Kael Dark", 
                    detail: "Global Theme",
                    status: 'forging', 
                    icon: <PaintBrushIcon /> 
                },
                { 
                    label: "Icons", 
                    value: "BeautySolar", 
                    detail: "Icon Pack",
                    status: 'forging', 
                    icon: <SparklesIcon /> 
                },
                { 
                    label: "Wallpapers", 
                    value: "Kael Art", 
                    detail: "4K Backgrounds",
                    status: 'pending', 
                    icon: <EyeIcon /> 
                },
            ]
        },
        {
            title: "Software (The Arsenal)",
            specs: [
                { 
                    label: "Browser", 
                    value: "Firefox", 
                    status: 'protected', 
                    icon: <GlobeAltIcon /> 
                },
                { 
                    label: "Code", 
                    value: "VS Code Web", 
                    status: 'protected', 
                    icon: <ArrowDownTrayIcon /> 
                },
                { 
                    label: "Backup", 
                    value: "Chronicler", 
                    status: 'protected', 
                    icon: <DocumentDuplicateIcon /> 
                },
                { 
                    label: "Pkgs", 
                    value: "Paru (AUR)", 
                    status: 'protected', 
                    icon: <ShoppingCartIcon /> 
                },
                { 
                    label: "Gaming", 
                    value: "Steam / Lutris", 
                    status: 'pending', 
                    icon: <RocketLaunchIcon /> 
                },
                { 
                    label: "Office", 
                    value: "LibreOffice", 
                    status: 'pending', 
                    icon: <DocumentDuplicateIcon /> 
                },
            ]
        }
    ];

    return (
        <div className={`flex flex-col h-full bg-forge-panel/20 ${className}`}>
            <header className="flex items-center justify-between p-6 border-b border-forge-border bg-forge-bg/80 backdrop-blur-md flex-shrink-0">
                <h2 className="text-lg font-bold text-forge-text-primary font-display tracking-wider flex items-center gap-3">
                    <span className="text-dragon-fire drop-shadow-md">System Blueprint</span>
                    <span className="text-[10px] font-bold text-orc-steel bg-orc-steel/10 border border-orc-steel/30 px-2 py-0.5 rounded-full">LOCKED</span>
                </h2>
                <div className="text-[10px] text-forge-text-secondary bg-forge-panel px-2 py-1 rounded border border-forge-border uppercase tracking-widest">
                    v0.9.7 Forge
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
                {sections.map((section, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 75}ms` }}>
                        <h3 className="text-[10px] font-bold text-forge-text-secondary/60 uppercase tracking-widest mb-2 pl-2 flex items-center gap-2 border-b border-forge-border/30 pb-1">
                            {section.title}
                        </h3>
                        <div className="space-y-0.5">
                            {section.specs.map((spec, i) => (
                                <SpecRow key={i} spec={spec} />
                            ))}
                        </div>
                    </div>
                ))}
                
                <div className="mt-8 mb-4 p-4 text-center opacity-50 hover:opacity-100 transition-opacity">
                     <span className="text-[10px] font-mono text-forge-text-secondary">
                        Status: <span className="text-orc-steel">Done</span> • <span className="text-dragon-fire">Busy</span> • <span className="text-magic-purple">Testing</span> • <span>To Do</span>
                     </span>
                </div>
            </div>
        </div>
    );
};
