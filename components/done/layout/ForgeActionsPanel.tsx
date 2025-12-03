
import React from 'react';
import type { ModalType } from '../../../types';
import {
    CloseIcon, HammerIcon, SignalIcon, DocumentDuplicateIcon, ServerIcon, CubeIcon, GlobeAltIcon,
    CpuChipIcon, ShellPromptIcon, KeyIcon, EyeIcon, UsbDriveIcon, LinkIcon,
    BookOpenIcon, FlameIcon, ArrowDownTrayIcon, ShieldCheckIcon, ScrollIcon,
    RocketLaunchIcon, SparklesIcon, ComputerDesktopIcon, FolderIcon, PaintBrushIcon, PencilIcon,
    ArchiveBoxIcon, PackageIcon, BroomIcon
} from '../../core/Icons';

export type MenuType = 'forge' | 'sanctum' | 'lore' | 'legacy' | null;

interface ForgeActionsPanelProps {
    activeMenu: MenuType;
    onClose: () => void;
    onOpenModal: (modal: ModalType) => void;
}

const ActionButton: React.FC<{ title: React.ReactNode; description: string; icon: React.ReactNode; onClick: () => void; colorClass?: string }> = ({ title, description, icon, onClick, colorClass = 'text-dragon-fire' }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-3 flex items-center gap-4 bg-forge-bg/50 hover:bg-forge-border/50 border border-transparent hover:border-forge-border rounded-lg transition-all group"
    >
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-forge-panel ${colorClass} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-forge-text-primary flex items-center gap-2">{title}</h3>
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
            case 'legacy':
                return { title: "Legacy Archives", icon: <ArchiveBoxIcon className="w-6 h-6 text-forge-text-secondary" />, color: "text-forge-text-secondary" };
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
                <header className="flex items-center justify-between p-5 border-b border-forge-border flex-shrink-0 bg-forge-bg/80">
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
                           <ActionSection title="Core Setup">
                                <ActionButton title="Install Forge Dependencies" description="Phase 1 & 2: Tools, Repos, and Assets." icon={<PackageIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeDependencies')} />
                                <ActionButton title="Setup GPG Persistence" description="One-time setup for a persistent GPG agent." icon={<ShieldCheckIcon className="w-5 h-5" />} onClick={() => onOpenModal('gpgPersistence')} />
                                <ActionButton title="Attune The Master Crafter" description="Enable multi-core compilation for makepkg." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('makepkgAttunement')} />
                                <ActionButton title="Awaken GPG Agent (v1.2)" description="Manually unlock your GPG key for signing." icon={<KeyIcon className="w-5 h-5" />} onClick={() => onOpenModal('gpgKeyAwakening')} />
                                <ActionButton title="Forge Custom ISO & VM" description="Setup a development VM with shared folders." icon={<ComputerDesktopIcon className="w-5 h-5" />} onClick={() => onOpenModal('qemuVmSetup')} />
                                <ActionButton title="Mount VM Shared Folders" description="Manually mount 'host_forge' & 'host_webdisk'." icon={<LinkIcon className="w-5 h-5" />} onClick={() => onOpenModal('vmMountRitual')} />
                                <ActionButton title="Transfer GPG Identity to VM" description="Export host key to shared VM folder." icon={<KeyIcon className="w-5 h-5" />} onClick={() => onOpenModal('gpgTransferRitual')} />
                                <ActionButton title={<span>Setup Git LFS (v2.0)</span>} description="One-time setup for large file storage." icon={<ServerIcon className="w-5 h-5" />} onClick={() => onOpenModal('gitLfsSetup')} />
                            </ActionSection>
                            
                            <ActionSection title="Sovereign Packages & Tools">
                                <ActionButton title="Grand Concordance (Scribe)" description="Forge, Sign & Publish an artifact." icon={<BookOpenIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumScribe')} />
                                <ActionButton title="Forge Sovereign Assets 0.00.01" description="Forge font and icon packs." icon={<PaintBrushIcon className="w-5 h-5" />} onClick={() => onOpenModal('sovereignAssets')} />
                                <ActionButton title="Sovereign Kernel Forge" description="Forge a PGO/LTO optimized kernel." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('personalizedKernelForge')} />
                                <ActionButton title={<span>Forge Single Kernel (Armory) <span className="text-xs text-dragon-fire/70">[HOST]</span></span>} description="Compile a specific, optimized kernel." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('individualKernelForge')} />
                                <ActionButton title="Forge Kernel Governor v0.00.02" description="The self-managing kernel package." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('kernelGovernor')} />
                                <ActionButton title="Forge Driver Sentinel v0.056" description="Auto-manage drivers & kernel." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicHardwareScryer')} />
                                <ActionButton title="Forge Chronicler 0.00.01" description="Build the file backup & log utility." icon={<CubeIcon className="w-5 h-5" />} onClick={() => onOpenModal('chroniclerPackage')} />
                            </ActionSection>

                            <ActionSection title="Forge Maintenance">
                                <ActionButton title="Reconcile Repositories" description="Fix 404 errors by reinstalling repo configs." icon={<SignalIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeReconciliation')} colorClass="text-orc-steel" />
                                <ActionButton title="Athenaeum Repair Ritual" description="Fix 'kael-os-local.db not found' errors." icon={<ShieldCheckIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumRepair')} colorClass="text-orc-steel" />
                                <ActionButton title="Athenaeum LFS Repair Ritual" description="Fix GitHub push errors for large files." icon={<ServerIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumLfsRepair')} colorClass="text-orc-steel" />
                                <ActionButton title="Athenaeum Flattening Ritual" description="Fix nested gh-pages directory." icon={<FolderIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumFlattening')} colorClass="text-orc-steel" />
                                <ActionButton title="Athenaeum Purification" description="Remove unwanted artifacts from local repo." icon={<BroomIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumPurification')} colorClass="text-orc-steel" />
                            </ActionSection>
                        </>
                    )}

                    {/* --- SANCTUM CONTENT (Completed/Protected) --- */}
                    {activeMenu === 'sanctum' && (
                         <>
                             <ActionSection title="System Repair">
                                <ActionButton title="CachyOS Restoration Ritual" description="Fix a broken CachyOS keyring." icon={<ShieldCheckIcon className="w-5 h-5" />} onClick={() => onOpenModal('cachyosRepair')} colorClass="text-dragon-fire" />
                             </ActionSection>
                             <ActionSection title="Armory Management">
                                <ActionButton title={<span>Forge Full Kernel Armory <span className="text-xs text-orc-steel">[PROTECTED]</span></span>} description="Mass-compile all distributable kernels." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('grandArmoryForge')} colorClass="text-orc-steel" />
                            </ActionSection>
                            <ActionSection title="Guides & Utilities">
                                <ActionButton title="Chronicler Usage Guide" description="Learn how to use the backup tool." icon={<BookOpenIcon className="w-5 h-5" />} onClick={() => onOpenModal('chroniclerUsage')} colorClass="text-orc-steel" />
                                <ActionButton title="Key Backup & Restore" description="Export or import your GPG signing key." icon={<UsbDriveIcon className="w-5 h-5" />} onClick={() => onOpenModal('keyBackup')} colorClass="text-orc-steel" />
                            </ActionSection>
                             <ActionSection title="Core Packages">
                                <ActionButton title="Kael Cloud Core" description="Meta-package for the Cloud Animus." icon={<GlobeAltIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelCloudCore')} colorClass="text-orc-steel" />
                                <ActionButton title="Kael Local Core" description="Installs Ollama & the Soul-Warden." icon={<CpuChipIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelLocalCore')} colorClass="text-orc-steel" />
                            </ActionSection>
                             <ActionSection title="Dangerous Rituals">
                                <ActionButton title="Purge Chat History" description="[Locked] Purge conversation history." icon={<FlameIcon className="w-5 h-5" />} onClick={() => onOpenModal('goNuclear')} colorClass="text-red-500" />
                            </ActionSection>
                        </>
                    )}

                    {/* --- LEGACY CONTENT (Archived) --- */}
                    {activeMenu === 'legacy' && (
                        <>
                             <div className="p-4 bg-forge-bg/30 border border-forge-border rounded-lg mb-4">
                                <p className="text-sm text-forge-text-secondary">
                                    This archive contains rituals for system resets or those made obsolete by newer, unified incantations.
                                </p>
                             </div>

                             <ActionSection title="Archived Core Setup">
                                <ActionButton title="Setup Local Forge" description="Create ~/forge and clone repositories." icon={<ComputerDesktopIcon className="w-5 h-5" />} onClick={() => onOpenModal('forgeSetup')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Automount WebDisk" description="Set up automatic, persistent WebDisk." icon={<ServerIcon className="w-5 h-5" />} onClick={() => onOpenModal('webDiskAutomount')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Attune GPG Keyring" description="Make pacman trust your signing key." icon={<KeyIcon className="w-5 h-5" />} onClick={() => onOpenModal('keyringAttunement')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Athenaeum Concordance" description="Manually sync all repositories." icon={<SignalIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumConcordance')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="WebDisk Forge Sync" description="Sync entire forge to WebDisk." icon={<DocumentDuplicateIcon className="w-5 h-5" />} onClick={() => onOpenModal('webDiskMount')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Sanctify Athenaeum" description="Force-create local repo DB." icon={<ShieldCheckIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumSanctification')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Configure Build Paths" description="Optimize makepkg to use ~/forge." icon={<FolderIcon className="w-5 h-5" />} onClick={() => onOpenModal('athenaeumPathfinding')} colorClass="text-forge-text-secondary" />
                             </ActionSection>
                             
                             <ActionSection title="Archived Terminal Suite">
                                <ActionButton title="Forge AI Configurator" description="Manage Kael's Hybrid Core." icon={<SparklesIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelAIConfigurator')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Forge Kaelic Shell" description="The conversational AI Shell." icon={<ShellPromptIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicShell')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Forge Kaelic Terminal" description="Quest: Build our sovereign AI Terminal." icon={<ShellPromptIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicTerminal')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Install Kaelic Terminal" description="Install the forged terminal artifact." icon={<ArrowDownTrayIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicTerminalInstall')} colorClass="text-forge-text-secondary" />
                                <ActionButton title="Create Menu Entry" description="Add Kaelic Terminal to the start menu." icon={<PencilIcon className="w-5 h-5" />} onClick={() => onOpenModal('kaelicTerminalDesktopEntry')} colorClass="text-forge-text-secondary" />
                            </ActionSection>

                             <ActionSection title="System Resets">
                                <ActionButton title="Perform Grand Archive" description="Move all current work to Legacy and reset." icon={<ArchiveBoxIcon className="w-5 h-5" />} onClick={() => onOpenModal('grandArchiveRitual')} colorClass="text-dragon-fire" />
                                <ActionButton title="Purge Forge & Configs" description="[DANGEROUS] Nuke all forge files." icon={<FlameIcon className="w-5 h-5" />} onClick={() => onOpenModal('fullForgePurification')} colorClass="text-red-500" />
                             </ActionSection>

                             <ActionSection title="Obsolete Rituals">
                                <ActionButton title="Attune to WebDisk" description="Superseded by Unified Mirrorlist." icon={<LinkIcon className="w-5 h-5" />} onClick={() => onOpenModal('webDiskAttunement')} colorClass="text-forge-text-secondary" />
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
