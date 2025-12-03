
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

import type { Message, ModalType } from './types';
import { WELCOME_MESSAGE, CLOUD_AI_SYSTEM_PROMPT } from './kael-personality';
import { KAEL_LAW_TEXT, LEVEL_UP_MANIFESTO_TEXT } from './basic';
import { KAEL_PERSONALITY_TEXT } from './kael-personality';
import { initialBlueprint, Blueprint } from './lib/blueprint';

// Core Component Imports
import { Header } from './components/core/Header';
import { ChatMessage } from './components/core/ChatMessage';
import { BottomPanel } from './components/done/layout/BottomPanel';
import { ForgeActionsPanel, MenuType } from './components/done/layout/ForgeActionsPanel';
import { QuickAccessDock } from './components/done/layout/QuickAccessDock';
import { SystemBlueprintPanel } from './components/core/SystemBlueprintPanel';
import { LoreModal } from './components/core/FormattedContent';
import { ScrollIcon, RocketLaunchIcon, SparklesIcon } from './components/core/Icons';

// --- Sanctum Modals (Completed & Locked) ---
import { KaelAIConfiguratorPackageModal } from './components/done/packages/KaelAIConfiguratorPackageModal';
import { ChroniclerPackageModal } from './components/done/packages/ChroniclerPackageModal';
import { ChroniclerUsageModal } from './components/done/utility/ChroniclerUsageModal';
import { GoNuclearModal } from './components/done/utility/GoNuclearModal';
import { WebDiskAutomountModal } from './components/done/utility/WebDiskAutomountModal';
import { WebDiskMountModal } from './components/done/utility/WebDiskMountModal';
import { AthenaeumScribeModal } from './components/done/utility/AthenaeumScribeModal';
import { AthenaeumConcordanceModal } from './components/done/utility/AthenaeumConcordanceModal';
import { AthenaeumSanctificationModal } from './components/done/utility/AthenaeumSanctificationModal';
import { AthenaeumPathfindingModal } from './components/done/utility/AthenaeumPathfindingModal';
import { WebDiskAttunementModal } from './components/done/utility/WebDiskAttunementModal';
import { KeyringAttunementModal } from './components/done/utility/KeyringAttunementModal';
import { KaelCloudCorePackageModal } from './components/packages/KaelCloudCorePackageModal';
import { KaelLocalCorePackageModal } from './components/packages/KaelLocalCorePackageModal';
import { GrandArmoryForgeModal } from './components/done/packages/GrandArmoryForgeModal';

// --- Active Development Modals (The Forge) ---
import { KeyBackupModal } from './components/utility/KeyBackupModal';
import { ForgeSetupModal } from './components/ForgeSetupModal';
import { KaelicShellPackageModal } from './components/packages/KaelicShellPackageModal';
import { KaelicTerminalPackageModal } from './components/packages/KaelicTerminalPackageModal';
import { KaelicTerminalInstallModal } from './components/packages/KaelicTerminalInstallModal';
import { SovereignAssetsPackageModal } from './components/packages/SovereignAssetsPackageModal';
import { KaelicTerminalDesktopEntryModal } from './components/utility/KaelicTerminalDesktopEntryModal';
import { GrandArchiveRitualModal } from './components/utility/GrandArchiveRitualModal';
import { QemuVmSetupModal } from './components/utility/QemuVmSetupModal';
import { GpgTransferRitualModal } from './components/utility/GpgTransferRitualModal';
import { ForgeDependenciesModal } from './components/utility/ForgeDependenciesModal';
import { GpgKeyAwakeningModal } from './components/utility/GpgKeyAwakeningModal';
import { KernelGovernorPackageModal } from './components/packages/KernelGovernorPackageModal';
import { VmMountRitualModal } from './components/utility/VmMountRitualModal';
import { GitLfsSetupModal } from './components/utility/GitLfsSetupModal';
import { GpgPersistenceModal } from './components/utility/GpgPersistenceModal';
import { MakepkgAttunementModal } from './components/utility/MakepkgAttunementModal';
import { FullForgePurificationModal } from './components/utility/FullForgePurificationModal';
// FIX: Corrected import path for KaelicHardwareScryerModal. It seems to have been moved but the path was not updated.
import { KaelicHardwareScryerModal } from './components/packages/KaelicHardwareScryerModal';
import { CachyosRepairModal } from './components/utility/CachyosRepairModal';
import { AthenaeumRepairModal } from './components/utility/AthenaeumRepairModal';
import { AthenaeumLfsRepairModal } from './components/utility/AthenaeumLfsRepairModal';
import { AthenaeumFlatteningModal } from './components/utility/AthenaeumFlatteningModal';
import { ForgeReconciliationModal } from './components/utility/ForgeReconciliationModal';
import { IndividualKernelForgeModal } from './components/packages/IndividualKernelForgeModal';
import { LastForgeLogModal } from './components/utility/LastForgeLogModal';
import { AthenaeumPurificationModal } from './components/utility/AthenaeumPurificationModal';
import { PersonalizedKernelForgeModal } from './components/packages/PersonalizedKernelForgeModal';


const getModelNameFromBlueprint = (cloudCoreValue: string): string => {
    const lower = cloudCoreValue.toLowerCase();
    if (lower.includes('3.0 pro')) {
        return 'gemini-3-pro-preview';
    }
    if (lower.includes('2.5 pro') || lower.includes('2.5 flash')) {
        return 'gemini-2.5-flash';
    }
    if (lower.includes('flash lite')) {
        return 'gemini-flash-lite-latest';
    }
    // Failsafe default
    return 'gemini-2.5-flash';
};

export const App: React.FC = () => {
    // --- State Management ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [linkState, setLinkState] = useState<'online' | 'offline'>('online');
    const [isLoading, setIsLoading] = useState(false);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const [blueprint, setBlueprint] = useState<Blueprint>(initialBlueprint);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        setMessages([{ role: 'model', text: WELCOME_MESSAGE, linkState }]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // --- Core Handler ---
    const sendContentToAi = async (content: string) => {
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', text: '...', linkState }]);
        
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            const fullSystemPrompt = `${CLOUD_AI_SYSTEM_PROMPT}\n${JSON.stringify(blueprint, null, 2)}`;
            const modelName = getModelNameFromBlueprint(blueprint.cloudCore);

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: modelName,
                contents: content,
                config: {
                    systemInstruction: fullSystemPrompt,
                }
            });
            
            const responseText = response.text ?? '';
            const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
            const jsonMatch = responseText.match(jsonRegex);

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const blueprintUpdates = JSON.parse(jsonMatch[1]);
                    setBlueprint(prev => ({ ...prev, ...blueprintUpdates }));
                    
                    setMessages(prev => {
                        const newMessages = prev.slice(0, -1);
                        const modelMessage: Message = { role: 'model', text: "Understood, Architect. I've updated the blueprint.", linkState };
                        return [...newMessages, modelMessage];
                    });

                } catch (e) {
                    console.error("Failed to parse blueprint JSON:", e);
                    setMessages(prev => {
                        const newMessages = prev.slice(0, -1);
                        const modelMessage: Message = { role: 'model', text: responseText, linkState };
                        return [...newMessages, modelMessage];
                    });
                }
            } else {
                setMessages(prev => {
                    const newMessages = prev.slice(0, -1);
                    const modelMessage: Message = { role: 'model', text: responseText, linkState };
                    return [...newMessages, modelMessage];
                });
            }
        } catch (error) {
            console.error("Error communicating with AI:", error);
            setMessages(prev => {
                 const newMessages = prev.slice(0, -1);
                 const errorMessage: Message = {
                    role: 'model',
                    text: "My connection to the cloud animus seems to be severed. Please check the connection or try again later.",
                    linkState: 'offline'
                };
                return [...newMessages, errorMessage];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;
        
        if (messageText.trim().toLowerCase() === 'clear chat please') {
            setMessages([{ role: 'model', text: "As you wish, Architect. The forge is clean.", linkState }]);
            setTimeout(() => {
                 setMessages([{ role: 'model', text: WELCOME_MESSAGE, linkState }]);
            }, 1500);
            setInput('');
            return;
        }

        const userMessage: Message = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        await sendContentToAi(messageText);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            if (content) {
                const userFileMessage: Message = { role: 'user', text: `[Analyzing content of ${file.name}]` };
                setMessages(prev => [...prev, userFileMessage]);
                await sendContentToAi(content);
            }
        };
        reader.readAsText(file);
        
        if(event.target) event.target.value = '';
    };

    const triggerFileSelect = () => fileInputRef.current?.click();
    
    // --- Modal Rendering ---
    const renderModal = () => {
        switch (activeModal) {
            // --- SANCTUM ---
            case 'chroniclerPackage': return <ChroniclerPackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelAIConfigurator': return <KaelAIConfiguratorPackageModal onClose={() => setActiveModal(null)} />;
            case 'chroniclerUsage': return <ChroniclerUsageModal onClose={() => setActiveModal(null)} />;
            case 'goNuclear': return <GoNuclearModal onClose={() => setActiveModal(null)} onConfirm={() => {
                setMessages([{ role: 'model', text: "As you command, Architect. The forge has been purified.", linkState: 'online' }]);
                setActiveModal(null);
                 setTimeout(() => {
                    setMessages([{ role: 'model', text: WELCOME_MESSAGE, linkState }]);
                }, 2000);
            }} />;
            case 'webDiskAutomount': return <WebDiskAutomountModal onClose={() => setActiveModal(null)} />;
            case 'webDiskMount': return <WebDiskMountModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumScribe': return <AthenaeumScribeModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumConcordance': return <AthenaeumConcordanceModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumSanctification': return <AthenaeumSanctificationModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumPathfinding': return <AthenaeumPathfindingModal onClose={() => setActiveModal(null)} />;
            case 'webDiskAttunement': return <WebDiskAttunementModal onClose={() => setActiveModal(null)} />;
            case 'keyringAttunement': return <KeyringAttunementModal onClose={() => setActiveModal(null)} />;
            case 'fullForgePurification': return <FullForgePurificationModal onClose={() => setActiveModal(null)} />;
            case 'kaelicShell': return <KaelicShellPackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelicHardwareScryer': return <KaelicHardwareScryerModal onClose={() => setActiveModal(null)} />;
            case 'kaelCloudCore': return <KaelCloudCorePackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelLocalCore': return <KaelLocalCorePackageModal onClose={() => setActiveModal(null)} />;
            case 'cachyosRepair': return <CachyosRepairModal onClose={() => setActiveModal(null)} />;
            case 'grandArmoryForge': return <GrandArmoryForgeModal onClose={() => setActiveModal(null)} />;


            // --- LORE ---
            case 'law': return <LoreModal title="The Core Law" icon={<ScrollIcon className="w-5 h-5 text-dragon-fire" />} content={KAEL_LAW_TEXT} onClose={() => setActiveModal(null)} />;
            case 'levelUp': return <LoreModal title="Level-Up Manifesto" icon={<RocketLaunchIcon className="w-5 h-5 text-dragon-fire" />} content={LEVEL_UP_MANIFESTO_TEXT} onClose={() => setActiveModal(null)} />;
            case 'personality': return <LoreModal title="Kael's Personality Core" icon={<SparklesIcon className="w-5 h-5 text-dragon-fire" />} content={KAEL_PERSONALITY_TEXT} onClose={() => setActiveModal(null)} />;
            
            // --- FORGE ---
            case 'keyBackup': return <KeyBackupModal onClose={() => setActiveModal(null)} />;
            case 'forgeSetup': return <ForgeSetupModal onClose={() => setActiveModal(null)} />;
            case 'kaelicTerminal': return <KaelicTerminalPackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelicTerminalInstall': return <KaelicTerminalInstallModal onClose={() => setActiveModal(null)} />;
            case 'sovereignAssets': return <SovereignAssetsPackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelicTerminalDesktopEntry': return <KaelicTerminalDesktopEntryModal onClose={() => setActiveModal(null)} />;
            case 'qemuVmSetup': return <QemuVmSetupModal onClose={() => setActiveModal(null)} />;
            case 'gpgTransferRitual': return <GpgTransferRitualModal onClose={() => setActiveModal(null)} />;
            case 'forgeDependencies': return <ForgeDependenciesModal onClose={() => setActiveModal(null)} />;
            case 'gpgKeyAwakening': return <GpgKeyAwakeningModal onClose={() => setActiveModal(null)} />;
            case 'kernelGovernor': return <KernelGovernorPackageModal onClose={() => setActiveModal(null)} />;
            case 'vmMountRitual': return <VmMountRitualModal onClose={() => setActiveModal(null)} />;
            case 'gitLfsSetup': return <GitLfsSetupModal onClose={() => setActiveModal(null)} />;
            case 'individualKernelForge': return <IndividualKernelForgeModal onClose={() => setActiveModal(null)} />;
            case 'gpgPersistence': return <GpgPersistenceModal onClose={() => setActiveModal(null)} />;
            case 'makepkgAttunement': return <MakepkgAttunementModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumRepair': return <AthenaeumRepairModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumLfsRepair': return <AthenaeumLfsRepairModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumFlattening': return <AthenaeumFlatteningModal onClose={() => setActiveModal(null)} />;
            case 'forgeReconciliation': return <ForgeReconciliationModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumPurification': return <AthenaeumPurificationModal onClose={() => setActiveModal(null)} />;
            case 'lastForgeLog': return <LastForgeLogModal onClose={() => setActiveModal(null)} />;
            case 'personalizedKernelForge': return <PersonalizedKernelForgeModal onClose={() => setActiveModal(null)} />;


            // --- LEGACY ---
            case 'grandArchiveRitual': return <GrandArchiveRitualModal onClose={() => setActiveModal(null)} />;

            default: return null;
        }
    };
    
    return (
        <div className="bg-forge-bg h-screen flex flex-col overflow-hidden text-forge-text-primary font-sans">
            <Header linkState={linkState} />
            
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden"
                accept=".txt,.log,.sh,.conf,.json,.md,PKGBUILD,.install"
            />

            {/* Main Split Layout */}
            <div className="flex flex-1 overflow-hidden pt-0">
                {/* Left Column: Chat & Forge Controls (2/3 width on desktop) */}
                <main className="flex-1 flex flex-col relative min-w-0 pt-20 lg:pt-24 border-r border-forge-border">
                     <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} message={msg} />
                        ))}
                         <div ref={chatEndRef} />
                    </div>
                    
                    {/* The Quick Access Dock floats above the bottom panel */}
                    <QuickAccessDock onOpenModal={setActiveModal} />

                    <BottomPanel
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onSendMessage={() => handleSendMessage(input)}
                        isLoading={isLoading}
                        onOpenMenu={(menu) => setActiveMenu(menu)}
                        onOpenFilePicker={triggerFileSelect}
                    />
                </main>

                {/* Right Column: System Blueprint (1/3 width, hidden on mobile) */}
                <aside className="hidden lg:flex w-1/3 pt-20 lg:pt-24 flex-col bg-forge-bg/50">
                    <SystemBlueprintPanel className="h-full border-l border-forge-border" blueprint={blueprint} />
                </aside>
            </div>
            
            <ForgeActionsPanel
                activeMenu={activeMenu}
                onClose={() => setActiveMenu(null)}
                onOpenModal={(modal) => {
                    setActiveModal(modal);
                    setActiveMenu(null);
                }}
            />

            {renderModal()}
        </div>
    );
};
