import React from 'react';
import { CloseIcon, EyeIcon } from '../core/Icons';

const RAW_LOG_CONTENT = `
--- The Dragon's Breath Forge - Step 6/6: The True Concordance (v30.1) ---
This ritual synchronizes the entire local Athenaeum to all remote mirrors.

✅ Local Athenaeum is populated and ready for sync.

--> [2/4] Waking the GPG Agent...
✅ GPG Agent is ready.

--> [3/4] Synchronizing with GitHub Athenaeum...
Cloning into '/tmp/tmp.tUnEgnofcb'...
remote: Enumerating objects: 83, done.
remote: Counting objects: 100% (83/83), done.
remote: Compressing objects: 100% (71/71), done.
remote: Total 83 (delta 0), reused 81 (delta 0), pack-reused 0 (from 0)
Receiving objects: 100% (83/83), 1001.42 KiB | 52.71 MiB/s, done.
Filtering content: 100% (17/17), 282.78 MiB | 5.90 MiB/s, done.
    -> Mirroring all artifacts to the clone root...
sending incremental file list
deleting kaelic-kernel-governor-0.00.02-1-any.pkg.tar.zst.sig
deleting kaelic-kernel-governor-0.00.02-1-any.pkg.tar.zst
deleting kaelic-fonts-0.00.01-1-any.pkg.tar.zst.sig
deleting kaelic-fonts-0.00.01-1-any.pkg.tar.zst
./
kaelic-icons-0.00.01-1-any.pkg.tar.zst
kaelic-icons-0.00.01-1-any.pkg.tar.zst.sig
khs-0.042-1-any.pkg.tar.zst
khs-0.042-1-any.pkg.tar.zst.sig
linux-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig
linux-docs-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-docs-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig
linux-headers-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-headers-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig

sent 287,687,851 bytes  received 405 bytes  191,792,170.67 bytes/sec
total size is 287,616,827  speedup is 1.00
    -> Re-sanctifying the GitHub Athenaeum database (kael-os-repo.db)...
[INFO] Extracting kael-os-repo.db.tar.gz to a temporary location...
[INFO] Extracting kael-os-repo.files.tar.gz to a temporary location...
[INFO] Adding package './khs-0.042-1-any.pkg.tar.zst'
[INFO] Computing checksums...
[INFO] Creating 'desc' db entry...
[INFO] Creating 'files' db entry...
[INFO] Adding package './kaelic-icons-0.00.01-1-any.pkg.tar.zst'
[INFO] Computing checksums...
[INFO] Creating 'desc' db entry...
[INFO] Creating 'files' db entry...
[INFO] Adding package './linux-6.17.9.arch1-1-x86_64.pkg.tar.zst'
[INFO] Adding package './linux-headers-6.17.9.arch1-1-x86_64.pkg.tar.zst'
[INFO] Adding package './linux-docs-6.17.9.arch1-1-x86_64.pkg.tar.zst'
[INFO] Computing checksums...
[INFO] Computing checksums...
[INFO] Computing checksums...
[INFO] Creating 'desc' db entry...
[INFO] Creating 'files' db entry...
[INFO] Creating 'desc' db entry...
[INFO] Creating 'files' db entry...
[INFO] Creating 'desc' db entry...
[INFO] Creating 'files' db entry...
[INFO] Creating updated database file './kael-os-repo.db.tar.gz'
[INFO] Signing database 'kael-os-repo.db.tar.gz'...
[INFO] Signing database 'kael-os-repo.files.tar.gz'...
[INFO] Created signature file 'kael-os-repo.db.tar.gz.sig'
[INFO] Created signature file 'kael-os-repo.files.tar.gz.sig'
[gh-pages aedfc07] chore(armory): publish all forged kernels
 14 files changed, 4 insertions(+), 8 deletions(-)
 create mode 120000 kael-os-repo.db.sig
 create mode 100644 kael-os-repo.db.tar.gz.sig
 create mode 120000 kael-os-repo.files.sig
 create mode 100644 kael-os-repo.files.tar.gz.sig
 delete mode 100644 kaelic-fonts-0.00.01-1-any.pkg.tar.zst
 delete mode 100644 kaelic-fonts-0.00.01-1-any.pkg.tar.zst.sig
 delete mode 100644 kaelic-kernel-governor-0.00.02-1-any.pkg.tar.zst
 delete mode 100644 kaelic-kernel-governor-0.00.02-1-any.pkg.tar.zst.sig
Uploading LFS objects: 100% (1/1), 4.5 KB | 0 B/s, done.
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 16 threads
Compressing objects: 100% (8/8), done.
Writing objects: 100% (10/10), 482.38 KiB | 60.30 MiB/s, done.
Total 10 (delta 1), reused 2 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
To https://github.com/LeeTheOrc/kael-os-repo.git
   ab184c9..aedfc07  gh-pages -> gh-pages
✅ GitHub Athenaeum is in concordance.

--> Synchronizing with WebDisk Mount...
    -> 🚀 Syncing via local filesystem to /home/leetheorc/WebDisk...
sending incremental file list
./
kael-os-local.db
kael-os-local.db.sig
kael-os-local.db.tar.gz
kael-os-local.db.tar.gz.old
kael-os-local.db.tar.gz.old.sig
kael-os-local.db.tar.gz.sig
kael-os-local.files
kael-os-local.files.sig
kael-os-local.files.tar.gz
kael-os-local.files.tar.gz.old
kael-os-local.files.tar.gz.old.sig
kael-os-local.files.tar.gz.sig
kaelic-icons-0.00.01-1-any.pkg.tar.zst
kaelic-icons-0.00.01-1-any.pkg.tar.zst.sig
khs-0.042-1-any.pkg.tar.zst
khs-0.042-1-any.pkg.tar.zst.sig
linux-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig
linux-docs-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-docs-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig
linux-headers-6.17.9.arch1-1-x86_64.pkg.tar.zst
linux-headers-6.17.9.arch1-1-x86_64.pkg.tar.zst.sig

sent 289,185,875 bytes  received 437 bytes  5,508,310.70 bytes/sec
total size is 289,113,709  speedup is 1.00
    -> Transmuting WebDisk database names for Unified Mirrorlist...
✅ WebDisk Athenaeum synchronized.

--> [4/4] Reminding to synchronize local pacman databases...
    Run 'sudo pacman -Syyu' to ensure your system sees the latest changes.

✨ THE DRAGON'S BREATH FORGE IS COMPLETE. THE GRAND ARMORY IS PUBLISHED.
@leetheorc  LeeTheOrc-Linux  ~               
Script done on 2025-12-03 01:33:32+02:00 [COMMAND_EXIT_CODE="0"]

######################################################################
# CHRONICLER OVERSEER REPORT (Modified Artifacts)
######################################################################
>>> DETECTED MODIFICATION: /home/leetheorc/.config/google-chrome/BrowserMetrics/BrowserMetrics-692F76E0-2AD52F.pma (Skipped - Too Large: 4194304 bytes)
>>> DETECTED MODIFICATION: /home/leetheorc/.config/google-chrome/BrowserMetrics/BrowserMetrics-692F76E0-2AD52F.pma (Skipped - Too Large: 4194304 bytes)
>>> DETECTED MODIFICATION: /home/leetheorc/.davfs2/cache/leroyonline.co.za+home-leetheorc-WebDisk+leetheorc/.kael-pacman-conf-1-1-any.pkg.tar.zst.sig.2fQQDw-cwnbmF (Skipped - Binary File)
>>> DETECTED MODIFICATION: /home/leetheorc/.kael_history (Skipped - Too Large: 642197 bytes)
`;

// This regex attempts to strip out most common ANSI escape codes and terminal control sequences
// found in the provided 'script' command output.
const stripAnsi = (str: string) => str.replace(/ \[\??[\d;]*[a-zA-Z]/g, '').replace(/[\u001b\u009b][[()#;?]*.{0,2}(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

export const LastForgeLogModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // Clean the log content for better readability in a non-terminal environment.
    const cleanLog = stripAnsi(RAW_LOG_CONTENT);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-4xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <EyeIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Transcript: The Grand Armory Forge</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <pre className="overflow-y-auto pr-2 bg-forge-bg border border-forge-border rounded-lg p-4 text-xs font-mono text-forge-text-secondary whitespace-pre-wrap">
                    {cleanLog.trim()}
                </pre>
            </div>
        </div>
    );
};