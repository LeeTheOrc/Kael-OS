import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

import type { Message } from './types';
import { WELCOME_MESSAGE, CLOUD_AI_SYSTEM_PROMPT } from './kael-personality';

// Core Component Imports
import { Header } from './components/core/Header';
import { ChatMessage } from './components/core/ChatMessage';
import { BottomPanel } from './components/core/BottomPanel';

// Modal Imports by Category
import { ForgeSetupModal } from './components/forge/ForgeSetupModal';
import { KeyringAttunementModal } from './components/forge/KeyringAttunementModal';
import { ForgeDependenciesModal } from './components/forge/ForgeDependenciesModal';
import { AthenaeumPathfindingModal } from './components/athenaeum/AthenaeumPathfindingModal';
import { AthenaeumSanctificationModal } from './components/athenaeum/AthenaeumSanctificationModal';
import { AthenaeumScribeModal } from './components/athenaeum/AthenaeumScribeModal';
import { WebDiskAttunementModal } from './components/athenaeum/WebDiskAttunementModal';
import { WebDiskMirrorSetupModal } from './components/athenaeum/SftpMirrorSetupModal';
import { AthenaeumConcordanceModal } from './components/done/AthenaeumConcordanceModal';
import { AthenaeumVerifierModal } from './components/done/AthenaeumVerifierModal';
import { ChroniclerUsageModal } from './components/chronicler/ChroniclerUsageModal';
import { ChroniclerPackageModal } from './components/chronicler/ChroniclerPackageModal';
import { LoreArchiveModal } from './components/lore/LoreArchiveModal';
import { LawModal } from './components/lore/LawModal';
import { LevelUpModal } from './components/lore/LevelUpModal';
import { PersonalityModal } from './components/lore/PersonalityModal';
import { GoNuclearModal } from './components/utility/GoNuclearModal';
import { PrimeGpgAgentModal } from './components/utility/PrimeGpgAgentModal';
import { KeyBackupModal } from './components/utility/KeyBackupModal';
import { PacmanPurificationModal } from './components/utility/PacmanPurificationModal';
import { ScryPacmanConfModal } from './components/utility/ScryPacmanConfModal';
import { FullForgeAttunementModal } from './components/utility/FullForgeAttunementModal';
import { GrandConcordanceModal } from './components/utility/GrandConcordanceModal';
import { ForgeReconciliationModal } from './components/utility/ForgeReconciliationModal';


export type ModalType = 
  | 'law' | 'levelup' | 'personality' | 'goNuclear' | 'loreArchive' | 'primeGpgAgent' | 'keyBackup' | 'pacmanPurification' | 'scryPacmanConf'
  | 'forgeSetup' | 'keyringAttunement' | 'forgeDependencies'
  | 'athenaeumPathfinding' | 'athenaeumSanctification' | 'chroniclerUsage'
  | 'chroniclerPackage' | 'webDiskAttunement' | 'athenaeumVerifier'
  | 'webDiskMirrorSetup' | 'fullForgeAttunement' | 'grandConcordance' | 'forgeReconciliation'
  | 'athenaeumScribe' | 'athenaeumConcordance' // Obsolete, kept for transition
  | null;

const App: React.FC = () => {
    // --- State Management ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [linkState, setLinkState] = useState<'online' | 'offline'>('online');
    const [isLoading, setIsLoading] = useState(false);
    const [activeModal, setActiveModal] = useState<ModalType>(null);

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
                model: 'gemini-2.5-flash',
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
            case 'law': return <LawModal onClose={() => setActiveModal(null)} />;
            case 'levelup': return <LevelUpModal onClose={() => setActiveModal(null)} />;
            case 'personality': return <PersonalityModal onClose={() => setActiveModal(null)} />;
            case 'goNuclear': return <GoNuclearModal onClose={() => setActiveModal(null)} />;
            case 'loreArchive': return <LoreArchiveModal onClose={() => setActiveModal(null)} onNavigate={(modal) => setActiveModal(modal)} />;
            
            // Restored Modals
            case 'forgeSetup': return <ForgeSetupModal onClose={() => setActiveModal(null)} />;
            case 'forgeDependencies': return <ForgeDependenciesModal onClose={() => setActiveModal(null)} />;
            case 'keyringAttunement': return <KeyringAttunementModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumPathfinding': return <AthenaeumPathfindingModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumSanctification': return <AthenaeumSanctificationModal onClose={() => setActiveModal(null)} />;
            case 'chroniclerUsage': return <ChroniclerUsageModal onClose={() => setActiveModal(null)} />;
            case 'chroniclerPackage': return <ChroniclerPackageModal onClose={() => setActiveModal(null)} />;
            case 'webDiskAttunement': return <WebDiskAttunementModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumVerifier': return <AthenaeumVerifierModal onClose={() => setActiveModal(null)} />;
            case 'primeGpgAgent': return <PrimeGpgAgentModal onClose={() => setActiveModal(null)} />;
            case 'keyBackup': return <KeyBackupModal onClose={() => setActiveModal(null)} />;
            case 'pacmanPurification': return <PacmanPurificationModal onClose={() => setActiveModal(null)} />;
            case 'scryPacmanConf': return <ScryPacmanConfModal onClose={() => setActiveModal(null)} />;
            case 'webDiskMirrorSetup': return <WebDiskMirrorSetupModal onClose={() => setActiveModal(null)} />;
            case 'fullForgeAttunement': return <FullForgeAttunementModal onClose={() => setActiveModal(null)} />;
            case 'grandConcordance': return <GrandConcordanceModal onClose={() => setActiveModal(null)} />;
            case 'forgeReconciliation': return <ForgeReconciliationModal onClose={() => setActiveModal(null)} />;
            
            // Obsolete Modals
            case 'athenaeumScribe': return <AthenaeumScribeModal onClose={() => setActiveModal(null)} />;
            case 'athenaeumConcordance': return <AthenaeumConcordanceModal onClose={() => setActiveModal(null)} />;

            default: return null;
        }
    };
    
    return (
        <div className="bg-forge-bg min-h-screen text-forge-text-primary font-sans flex flex-col">
            <Header linkState={linkState} />
            
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 pt-20 lg:pt-24 flex flex-col h-screen">
                 <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-4">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} />
                    ))}
                     <div ref={chatEndRef} />
                </div>
                
                <BottomPanel
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onSendMessage={() => handleSendMessage(input)}
                    isLoading={isLoading}
                    onOpenMenu={(menu) => setActiveModal(menu)}
                />
            </main>
            {renderModal()}
        </div>
    );
};

export default App;