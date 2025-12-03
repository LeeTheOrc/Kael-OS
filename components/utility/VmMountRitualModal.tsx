import React from 'react';
import { CloseIcon, LinkIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface VmMountRitualModalProps {
  onClose: () => void;
}

const FORGE_MOUNT_CMD = `mkdir -p ~/host_forge && sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_forge ~/host_forge`;
const WEBDISK_MOUNT_CMD = `mkdir -p ~/host_webdisk && sudo mount -t 9p -o trans=virtio,version=9p2000.L,rw host_webdisk ~/host_webdisk`;


export const VmMountRitualModal: React.FC<VmMountRitualModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <LinkIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Mount VM Shared Folders</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, these are the incantations to manually bridge the void between your host machine and the VM. Use these if the shared folders are not automatically mounted on boot.
                    </p>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Mount the Forge</h3>
                    <p className="text-sm">
                        This command connects your local <code className="font-mono text-xs">~/forge</code> directory to <code className="font-mono text-xs">~/host_forge</code> inside the VM.
                    </p>
                    <CodeBlock lang="bash">{FORGE_MOUNT_CMD}</CodeBlock>

                     <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Mount the WebDisk</h3>
                    <p className="text-sm">
                        This command connects your local <code className="font-mono text-xs">~/WebDisk</code> directory to <code className="font-mono text-xs">~/host_webdisk</code> inside the VM.
                    </p>
                    <CodeBlock lang="bash">{WEBDISK_MOUNT_CMD}</CodeBlock>
                </div>
            </div>
        </div>
    );
};