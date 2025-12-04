export type Role = 'user' | 'model';
export type LinkState = 'online' | 'offline';

export interface Message {
  role: Role;
  text: string;
  linkState?: LinkState;
}

export type ModalType =
  | 'chroniclerPackage' | 'chroniclerUsage'
  | 'law' | 'levelUp' | 'personality'
  | 'goNuclear'
  | 'keyBackup'
  | 'webDiskMount' | 'webDiskAutomount'
  | 'kaelCloudCore' | 'kaelLocalCore' | 'kaelicShell' | 'kaelAIConfigurator'
  | 'forgeSetup' | 'athenaeumPathfinding' | 'athenaeumSanctification'
  | 'athenaeumConcordance' | 'webDiskAttunement' | 'keyringAttunement'
  | 'kaelicHardwareScryer' | 'kaelicTerminal' | 'kaelicTerminalInstall' | 'sovereignAssets'
  | 'kaelicTerminalDesktopEntry'
  | 'fullForgePurification' | 'forgeReconciliation'
  | 'grandArchiveRitual'
  | 'qemuVmSetup' | 'gpgTransferRitual' | 'forgeDependencies' | 'gpgKeyAwakening'
  | 'kernelGovernor' | 'vmMountRitual'
  | 'gitLfsSetup' | 'individualKernelForge'
  | 'gpgPersistence' | 'grandArmoryForge'
  | 'makepkgAttunement'
  | 'cachyosRepair'
  | 'athenaeumRepair'
  | 'athenaeumLfsRepair'
  | 'athenaeumFlattening'
  | 'athenaeumPurification'
  | 'lastForgeLog'
  | 'personalizedKernelForge'
  | 'kaelKhsPublisher'
  | 'grandConcordanceInstaller'
  | null;
