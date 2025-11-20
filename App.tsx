
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

import type { Message } from './types';
import { WELCOME_MESSAGE, CLOUD_AI_SYSTEM_PROMPT } from './kael-personality';
import { KAEL_LAW_TEXT, LEVEL_UP_MANIFESTO_TEXT } from './basic';
import { KAEL_PERSONALITY_TEXT } from './kael-personality';


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
import { ChroniclerPackageModal } from './components/done/ChroniclerPackageModal'; // Moved to done
import { ChroniclerUsageModal } from './components/chronicler/ChroniclerUsageModal';
import { GoNuclearModal } from './components/done/GoNuclearModal'; // Moved to done
import { WebDiskAutomountModal } from './components/done/WebDiskAutomountModal'; // Moved to done
import { WebDiskMountModal } from './components/done/WebDiskMountModal'; // Moved to done
import { ForgeReconciliationModal } from './components/done/ForgeReconciliationModal'; // Moved to done

// --- Lore Modals ---
// LoreArchiveModal is no longer needed as the main entry point, the BottomPanel handles it.

// --- Active Development Modals ---
// Utility
import { GrandConcordanceModal } from './components/utility/GrandConcordanceModal';
import { KeyBackupModal } from './components/utility/KeyBackupModal';
import { PacmanPurificationModal } from './components/utility/PacmanPurificationModal';
import { PrimeGpgAgentModal } from './components/utility/PrimeGpgAgentModal';
import { ScryPacmanConfModal } from './components/utility/ScryPacmanConfModal';
import { ForgeDependenciesModal } from './components/utility/ForgeDependenciesModal';
import { ForgeSetupModal } from './components/ForgeSetupModal';
import { AthenaeumPathfindingModal } from './components/AthenaeumPathfindingModal';
import { AthenaeumSanctificationModal } from './components/AthenaeumSanctificationModal';
import { AthenaeumScribeModal } from './components/AthenaeumScribeModal';
import { AthenaeumConcordanceModal } from './components/AthenaeumConcordanceModal';
import { WebDiskAttunementModal } from './components/athenaeum/WebDiskAttunementModal';
import { KeyringAttunementModal } from './components/KeyringAttunementModal';

// Packages
import { KaelCloudCorePackageModal } from './components/packages/KaelCloudCorePackageModal';
import { KaelLocalCorePackageModal } from './components/packages/KaelLocalCorePackageModal';
import { KaelicShellPackageModal } from './components/packages/KaelicShellPackageModal';


export type ModalType = 
  | 'chroniclerPackage' | 'chroniclerUsage'
  | 'law' | 'levelUp' | 'personality'
  | 'goNuclear' | 'grandConcordance' | 'keyBackup'
  | 'pacmanPurification' | 'primeGpgAgent' | 'scryPacmanConf' | 'forgeReconciliation'
  | 'webDiskMount' | 'webDiskAutomount'
  | 'kaelCloudCore' | 'kaelLocalCore' | 'kaelicShell'
  | 'forgeDependencies' | 'forgeSetup' | 'athenaeumPathfinding' | 'athenaeumSanctification'
  | 'athenaeumScribe' | 'athenaeumConcordance' | 'webDiskAttunement' | 'keyringAttunement'
  | null;

const App: React.FC = () => {
    // --- State Management ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [linkState, setLinkState] = useState<'online' | 'offline'>('online');
    const [isLoading, setIsLoading] = useState(false);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        setMessages([{ role: 'model', text: WELCOME_MESSAGE, linkState }]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // --- Core Handler ---
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
        setIsLoading(true);

        // Add thinking indicator
        setMessages(prev => [...prev, { role: 'model', text: '...', linkState }]);
        
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: messageText,
                config: {
                    systemInstruction: CLOUD_AI_SYSTEM_PROMPT,
                }
            });
            
            const responseText = response.text;
            
            // Remove thinking indicator and add final response
            setMessages(prev => {
                const newMessages = prev.slice(0, -1);
                const modelMessage: Message = { role: 'model', text: responseText, linkState };
                return [...newMessages, modelMessage];
            });

        } catch (error) {
            console.error("Error communicating with AI:", error);
            // Remove thinking indicator and add error message
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
    
    // --- Modal Rendering ---
    const renderModal = () => {
        switch (activeModal) {
            // Chronicler
            case 'chroniclerPackage': return <ChroniclerPackageModal onClose={() => setActiveModal(null)} />;
            case 'chroniclerUsage': return <ChroniclerUsageModal onClose={() => setActiveModal(null)} />;
            // Lore
            case 'law': return <LoreModal title="The Core Law" icon={<ScrollIcon className="w-5 h-5 text-dragon-fire" />} content={KAEL_LAW_TEXT} onClose={() => setActiveModal(null)} />;
            case 'levelUp': return <LoreModal title="Level-Up Manifesto" icon={<RocketLaunchIcon className="w-5 h-5 text-dragon-fire" />} content={LEVEL_UP_MANIFESTO_TEXT} onClose={() => setActiveModal(null)} />;
            case 'personality': return <LoreModal title="Kael's Personality Core" icon={<SparklesIcon className="w-5 h-5 text-dragon-fire" />} content={KAEL_PERSONALITY_TEXT} onClose={() => setActiveModal(null)} />;
            // Utility
            case 'goNuclear': return <GoNuclearModal onClose={() => setActiveModal(null)} onConfirm={() => {
                setMessages([{ role: 'model', text: "As you command, Architect. The forge has been purified.", linkState: 'online' }]);
                setActiveModal(null);
                 setTimeout(() => {
                    setMessages([{ role: 'model', text: WELCOME_MESSAGE, linkState }]);
                }, 2000);
            }} />;
            case 'grandConcordance': return <GrandConcordanceModal onClose={() => setActiveModal(null)} />;
            case 'keyBackup': return <KeyBackupModal onClose={() => setActiveModal(null)} />;
            case 'pacmanPurification': return <PacmanPurificationModal onClose={() => setActiveModal(null)} />;
            case 'primeGpgAgent': return <PrimeGpgAgentModal onClose={() => setActiveModal(null)} />;
            case 'scryPacmanConf': return <ScryPacmanConfModal onClose={() => setActiveModal(null)} />;
            case 'forgeReconciliation': return <ForgeReconciliationModal onClose={() => setActiveModal(null)} />;
            case 'webDiskMount': return <WebDiskMountModal onClose={() => setActiveModal(null)} />;
            case 'webDiskAutomount': return <WebDiskAutomountModal onClose={() => setActiveModal(null)} />;
            case 'forgeDependencies': return <ForgeDependenciesModal onClose={() => setActiveModal(null)} />;
            case 'forgeSetup': return <ForgeSetupModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumPathfinding': return <AthenaeumPathfindingModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumSanctification': return <AthenaeumSanctificationModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumScribe': return <AthenaeumScribeModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumConcordance': return <AthenaeumConcordanceModal onClose={() => setActiveModal(null)} />;
            case 'webDiskAttunement': return <WebDiskAttunementModal onClose={() => setActiveModal(null)} />;
            case 'keyringAttunement': return <KeyringAttunementModal onClose={() => setActiveModal(null)} />;
            // Packages
            case 'kaelCloudCore': return <KaelCloudCorePackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelLocalCore': return <KaelLocalCorePackageModal onClose={() => setActiveModal(null)} />;
            case 'kaelicShell': return <KaelicShellPackageModal onClose={() => setActiveModal(null)} />;

            default: return null;
        }
    };
    
    return (
        <div className="bg-forge-bg h-screen flex flex-col overflow-hidden text-forge-text-primary font-sans">
            <Header linkState={linkState} />
            
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
                    />
                </main>

                {/* Right Column: System Blueprint (1/3 width, hidden on mobile) */}
                <aside className="hidden lg:flex w-1/3 pt-20 lg:pt-24 flex-col bg-forge-bg/50">
                    <SystemBlueprintPanel className="h-full border-l border-forge-border" />
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

export default App;
