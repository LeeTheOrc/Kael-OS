export interface Blueprint {
  // User & System Identity
  username: string;
  hostname: string;
  
  // Core System
  base: string;
  kernel: string;
  filesystem: string;
  bootSplash: string;
  security: string;

  // Hybrid AI
  cloudCore: string;
  localCore: string;
  terminal: string;
  voiceSupport: string;

  // Desktop
  desktopEnvironment: string;
  displayManager: string;
  theme: string;
  icons: string;
  wallpapers: string;

  // Software
  browser: string;
  codeEditor: string;
  backupTool: string;
  aurHelper: string;
  gaming: string;
  office: string;
}

export const initialBlueprint: Blueprint = {
  // User & System Identity
  username: 'architect',
  hostname: 'kael-os',
  
  // Core System
  base: 'Arch Linux',
  kernel: 'CachyOS',
  filesystem: 'BTRFS + Snapper',
  bootSplash: 'Plymouth',
  security: 'UFW / Firewalld',
  
  // Hybrid AI
  cloudCore: 'Gemini 2.5 Pro (Balanced)',
  localCore: 'Llama 3 / Phi-3',
  terminal: "Kaelic Shell v3.0.1 (Guardian's Voice)",
  voiceSupport: 'Speech-to-Text',

  // Desktop
  desktopEnvironment: 'KDE Plasma 6',
  displayManager: 'SDDM',
  theme: 'Kael Dark',
  icons: 'BeautySolar',
  wallpapers: 'Kael Art',

  // Software
  browser: 'Firefox',
  codeEditor: 'VS Code Web',
  backupTool: 'Chronicler',
  aurHelper: 'Paru (AUR)',
  gaming: 'Steam / Lutris',
  office: 'LibreOffice',
};