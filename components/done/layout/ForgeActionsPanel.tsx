
import React from 'react';
import type { ModalType } from '../../../App';
import {
    CloseIcon, HammerIcon, SignalIcon, DocumentDuplicateIcon, ServerIcon, CubeIcon, GlobeAltIcon,
    CpuChipIcon, ShellPromptIcon, KeyIcon, ShoppingCartIcon, EyeIcon, UsbDriveIcon, LinkIcon,
    BookOpenIcon, DocumentIcon, FlameIcon, ArrowDownTrayIcon, ShieldCheckIcon, ScrollIcon,
    RocketLaunchIcon, SparklesIcon, PackageIcon, ComputerDesktopIcon
} from '../../core/Icons';

export type MenuType = 'forge' | 'sanctum' | 'lore' | null;

interface ForgeActionsPanelProps {
    activeMenu: MenuType;
    onClose: () => void;
    onOpenModal: (modal: ModalType) => void;
}

const ActionButton: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; colorClass?: string }> = ({ title, description, icon, onClick, colorClass = 'text-dragon-fire' }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-3 flex items-center gap-4 bg-forge-bg/50 hover:bg-forge-border/50 border border-transparent hover:border-forge-border rounded-lg transition-all group"
    >
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-forge-panel ${colorClass} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-forge-text-primary">{title}</h3>
            <p className="text-xs text-forge-text-secondary">{description}</p>
        </div>
    </button>
);

const ActionSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="animate-fade-in">
        <h2 className="text-sm font-semibold text-forge-text-secondary uppercase tracking-widest mb-3 px-3 border-b border-forge-border pb-1">{title}</h2>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

export const ForgeActionsPanel: React.FC<ForgeActionsPanelProps> = ({ activeMenu, onClose, onOpenModal }) => {
    if (!activeMenu) return null;

    const getHeaderContent = () => {
        switch (activeMenu) {
            case 'forge':
                return { title: "The Forge", icon: <HammerIcon className="w-6 h-6 text-dragon-fire" />, color: "text-dragon-fire" };
            case 'sanctum':
                return { title: "The Sanctum", icon: <ShieldCheckIcon className="w-6 h-6 text-orc-steel" />, color: "text-orc-steel" };
            case 'lore':
                return { title: "The Grimoire", icon: <BookOpenIcon className="w-6 h-6 text-magic-purple" />, color: "text-magic-purple" };
            default:
                return { title: "Unknown", icon: null, color: "" };
        }
    };

    const { title, icon, color } = getHeaderContent();

    return (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-fast" onClick={onClose} />

            {/* Panel */}
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-forge-panel border-l-2 border-forge-border shadow-2xl flex flex-col animate-slide-in-right">
                <header className="flex items-center justify-between p-5 border-b border-forge-border flex-shrink-0 bg-forge-bg/50">
                    <h2 className={`text-2xl font-bold ${color} flex items-center gap-3 font-display tracking-wider`}>
                        {icon}
                        <span>{title}</span>
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-forge-text-secondary hover:text-forge-text-primary hover:bg-forge-border transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* --- FORGE CONTENT (Active Work) --- */}
                    {activeMenu === 'forge' && (
                        <>
                             <ActionSection title="The Genesis Path">
                                <ActionButton title="Install Forge Dependencies" description="Install base-devel, git, and attune repos." icon={<PackageIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeDependencies')} />
                                <ActionButton title="Setup Local Forge" description="Create directory structure and clone repos." icon={<ComputerDesktopIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeSetup')} />
                                <ActionButton title="Configure Athenaeum Paths" description="Optimize makepkg to use ~/forge/artifacts." icon={<LinkIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumPathfinding')} />
                                <ActionButton title="Sanctify Athenaeum" description="Create and sign the local repository DB." icon={<ShieldCheckIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumSanctification')} />
                             </ActionSection>

                            <ActionSection title="The Scribe's Path">
                                <ActionButton title="Grand Concordance" description="Forge a package and push to all Athenaeums." icon={<SignalIcon className="w-5 h-5" />} onClick={() => onOpenModal('grandConcordance')} colorClass="text-orc-steel" />
                                <ActionButton title="Upgrade Concordance" description="Install the latest forge-and-publish tool." icon={<ArrowDownTrayIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumScribe')} />
                            </ActionSection>
                            
                            <ActionSection title="Package Grimoires">
                                <ActionButton title="Forge Kael Cloud Core" description="Build the self-hosted public chat UI." icon={<GlobeAltIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelCloudCore')} colorClass="text-magic-purple" />
                                <ActionButton title="Forge Kael Local Core" description="Build the offline AI (Ollama) package." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelLocalCore')} colorClass="text-magic-purple" />
                                <ActionButton title="Forge Kaelic Shell" description="Build the Rust-based shell with mouse support." icon={<ShellPromptIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicShell')} colorClass="text-magic-purple" />
                            </ActionSection>

                            <ActionSection title="The Warden's Path">
                                <ActionButton title="Prime GPG Agent" description="Wake up GPG and cache your passphrase." icon={<KeyIcon className="w-5 h-5" />} onClick={() => onOpenModal('primeGpgAgent')} />
                                <ActionButton title="Pacman Purification" description="Clean the pacman package cache." icon={<ShoppingCartIcon className="w-5 h-5" />} onClick={() => onOpenModal('pacmanPurification')} />
                                <ActionButton title="Scry Pacman Conf" description="View the current pacman configuration." icon={<EyeIcon className="w-5 h-5" />} onClick={() => onOpenModal('scryPacmanConf')} />
                                <ActionButton title="Key Backup & Restore" description="Export or import your GPG key." icon={<UsbDriveIcon className="w-5 h-5" />} onClick={() => onOpenModal('keyBackup')} />
                                <ActionButton title="Chronicler Usage Guide" description="Learn how to use the backup tool." icon={<BookOpenIcon className="w-5 h-5" />} onClick={() => onOpenModal('chroniclerUsage')} />
                            </ActionSection>
                        </>
                    )}

                    {/* --- SANCTUM CONTENT (Completed/Protected) --- */}
                    {activeMenu === 'sanctum' && (
                        <>
                             <div className="p-4 bg-green-900/20 border border-orc-steel/30 rounded-lg mb-4">
                                <p className="text-sm text-orc-steel">
                                    These rituals are complete and stable. 
                                    They are archived here for easy access.
                                </p>
                             </div>
                             <ActionSection title="Protected Rituals">
                                <ActionButton title="Grand Forge Maintenance" description="Repair connections and arm the forge." icon={<ArrowDownTrayIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeReconciliation')} colorClass="text-orc-steel" />
                                <ActionButton title="Automount WebDisk" description="Set up automatic WebDisk mounting on login." icon={<ServerIcon className="w-5 h-5" />} onClick={() => onOpenModal('webDiskAutomount')} colorClass="text-orc-steel" />
                                <ActionButton title="WebDisk Manual Sync" description="Manually sync full forge to WebDisk." icon={<DocumentDuplicateIcon className="w-5 h-5" />} onClick={() => onOpenModal('webDiskMount')} colorClass="text-orc-steel" />
                                <ActionButton title="Forge Chronicler Package" description="Build the file backup utility package." icon={<CubeIcon className="w-5 h-5" />} onClick={() => onOpenModal('chroniclerPackage')} colorClass="text-orc-steel" />
                            </ActionSection>

                            <ActionSection title="Dangerous Arts">
                                <ActionButton title="Rite of Annihilation" description="[Locked] Permanently purge the entire chat history." icon={<FlameIcon className="w-5 h-5" />} onClick={() => onOpenModal('goNuclear')} colorClass="text-red-500" />
                            </ActionSection>
                        </>
                    )}

                    {/* --- LORE CONTENT (Info) --- */}
                    {activeMenu === 'lore' && (
                        <>
                             <ActionSection title="The Grand Grimoire">
                                <ActionButton title="The Core Law" description="The immutable runes that define our project." icon={<ScrollIcon className="w-5 h-5" />} onClick={() => onOpenModal('law')} colorClass="text-magic-purple" />
                                <ActionButton title="Level-Up Manifesto" description="Our strategic roadmap and quest log." icon={<RocketLaunchIcon className="w-5 h-5" />} onClick={() => onOpenModal('levelUp')} colorClass="text-magic-purple" />
                                <ActionButton title="Kael's Personality" description="The spirit and voice of your AI Guardian." icon={<SparklesIcon className="w-5 h-5" />} onClick={() => onOpenModal('personality')} colorClass="text-magic-purple" />
                            </ActionSection>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
