
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CloseIcon } from './Icons';
import { CodeBlock } from './CodeBlock';

export const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const customComponents = {
        h3: ({ node, ...props }) => {
            if (node.children.length > 0 && node.children[0].type === 'text') {
                const textContent = node.children[0].value;
                const isRune = textContent.startsWith('RUNE ');
                const isQuest = textContent.startsWith('QUEST ');

                if (isRune || isQuest) {
                    const parts = textContent.split(':');
                    const keywordPart = parts[0]; 
                    const titlePart = parts.slice(1).join(':').trim(); 
                    
                    const keywordColor = isRune ? '#e040fb' : '#7aebbe';
                    
                    return (
                        <h3 {...props} style={{ color: '#ffcc00' }} className="font-display tracking-wider"> 
                            <span style={{ color: keywordColor }}>{keywordPart}</span>
                            <span>: {titlePart}</span> 
                        </h3>
                    );
                }
            }
            return <h3 {...props} className="font-display tracking-wider">{props.children}</h3>;
        },
        code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <CodeBlock lang={match[1]}>
                {String(children).replace(/\\n$/, '')}
              </CodeBlock>
            ) : (
              <code className="font-mono text-xs bg-forge-bg px-1 py-0.5 rounded border border-forge-border" {...props}>
                {children}
              </code>
            )
        }
    };

    return (
        <div className="prose prose-sm prose-invert max-w-none 
                        prose-headings:font-display prose-headings:tracking-wider
                        prose-strong:text-forge-text-primary 
                        prose-a:text-orc-steel prose-a:no-underline hover:prose-a:underline
                        prose-li:marker:text-dragon-fire
                        prose-hr:border-forge-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                {text}
            </ReactMarkdown>
        </div>
    );
};

// --- REUSABLE LORE MODAL ---

interface LoreModalProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({ title, icon, content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
        <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                    {icon}
                    <span>{title}</span>
                </h2>
                <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 leading-relaxed">
                <FormattedContent text={content} />
            </div>
        </div>
    </div>
  );
};
