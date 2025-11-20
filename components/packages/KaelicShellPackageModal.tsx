






import React from 'react';
import { CloseIcon, ShellPromptIcon, RocketLaunchIcon, EyeIcon, ShieldCheckIcon, HammerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicShellPackageModalProps {
  onClose: () => void;
}

// --- ARTIFACT DEFINITIONS ---

// 1. FASTFETCH CONFIGURATION (JSONC)
// This replaces the deprecated --shell-format flag
// We include ALL standard modules here so the user doesn't lose their system stats.
const FASTFETCH_CONFIG = `
{
  "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
  "logo": {
    "padding": {
      "top": 2
    }
  },
  "modules": [
    "title",
    "separator",
    "os",
    "host",
    "kernel",
    "uptime",
    "packages",
    {
      "type": "shell",
      "format": "Kaelic Shell v1.7.1 (Guardian Edition)"
    },
    "display",
    "de",
    "wm",
    "wmtheme",
    "theme",
    "icons",
    "font",
    "cursor",
    "terminal",
    "cpu",
    "gpu",
    "memory",
    "swap",
    "disk",
    "localip",
    "battery",
    "poweradapter",
    "locale",
    "break",
    "colors"
  ]
}
`;

// 2. RUST SOURCE CODE (v1.7.1 - Guardian Edition - Config Fix)
const KAEL_SHELL_RS = `
use std::env;
use std::process::{Command, Stdio};
use std::path::{Path, PathBuf};
use std::borrow::Cow;
use std::collections::{HashMap, HashSet};
use std::rc::Rc;
use std::cell::RefCell;

use rustyline::error::ReadlineError;
use rustyline::Editor;
use rustyline::history::{FileHistory, SearchDirection};
use rustyline::completion::Completer;
use rustyline::hint::Hinter;
use rustyline::validate::Validator;
use rustyline::highlight::Highlighter;
use rustyline::Helper;
use rustyline::Context;
use serde_json::Value;

// --- COLORS (Kael Palette) ---
const DRAGON_FIRE: &str = "\\x1b[38;2;255;204;0m";   // #ffcc00
const ORC_STEEL: &str = "\\x1b[38;2;122;235;190m";    // #7aebbe
const MAGIC_PURPLE: &str = "\\x1b[38;2;224;64;251m";  // #e040fb
const RUNE_BLUE: &str = "\\x1b[38;2;96;165;250m";     // #60a5fa
const CRIMSON_ALERT: &str = "\\x1b[38;2;239;68;68m";  // #ef4444
const MYTHIC_GOLD: &str = "\\x1b[38;2;251;191;36m";   // #fbbf24
const GREY: &str = "\\x1b[38;5;240m";
const RESET: &str = "\\x1b[0m";

// --- TYPES ---
enum GuardianVerdict {
    Safe,
    Risky(String), // Contains the corrected command string
    Offline,
}

// --- HELPER & HIGHLIGHTER ---
#[derive(Clone)]
struct KaelHelper {
    hints: HashSet<String>,
    // Shared state to hold the AI suggestion for the NEXT prompt
    suggestion: Rc<RefCell<Option<String>>>,
}

impl KaelHelper {
    fn new(suggestion_ref: Rc<RefCell<Option<String>>>) -> Self {
        let mut hints = HashSet::new();
        // Common Realm Incantations
        let cmds = vec![
            "chronicler", "chronicler exec", "kael-shell", 
            "pacman -Syyu", "pacman -S", "paru -S", "paru -Syyu", 
            "makepkg -sif", "makepkg -sf",
            "ls -la", "ll", "la", "cd ..", 
            "systemctl status", "systemctl restart", "journalctl -xe",
            "git status", "git add .", "git commit -m", "git push",
            "cargo build", "cargo run", "cargo clean",
            "exit", "clear", "history", "fastfetch", "version"
        ];
        for c in cmds { hints.insert(c.to_string()); }
        Self { hints, suggestion: suggestion_ref }
    }
}

impl Completer for KaelHelper { type Candidate = String; }
impl Validator for KaelHelper {}
impl Helper for KaelHelper {}

// --- HINTER (Oracle Autosuggestions) ---
impl Hinter for KaelHelper {
    type Hint = String;

    fn hint(&self, line: &str, pos: usize, ctx: &Context<'_>) -> Option<String> {
        // 0. Priority: AI Guardian Suggestion (Ghost Fix)
        if line.is_empty() {
            if let Some(fix) = self.suggestion.borrow().as_ref() {
                return Some(fix.clone());
            }
        }

        if line.trim().is_empty() || pos < line.len() {
            return None;
        }

        // 1. History Check (Preferred)
        let history = ctx.history();
        let len = history.len();
        
        // Iterate backwards
        for i in (0..len).rev() {
            if let Ok(Some(search_result)) = history.get(i, SearchDirection::Forward) {
                let entry = &search_result.entry;
                if entry.starts_with(line) && entry != line {
                    return Some(entry[line.len()..].to_string());
                }
            }
        }

        // 2. Static Knowledge Check
        for cmd in &self.hints {
             if cmd.starts_with(line) && cmd.len() > line.len() {
                 return Some(cmd[line.len()..].to_string());
             }
        }

        None
    }
}

impl Highlighter for KaelHelper {
    fn highlight<'l>(&self, line: &'l str, _pos: usize) -> Cow<'l, str> {
        // Security Visualization: Base64 Injection Highlighting
        let trimmed = line.trim_start();
        if trimmed.starts_with("echo \\"") && line.contains("| base64 --decode | bash") {
             if let Some(start_q) = line.find('"') {
                if let Some(end_q) = line.rfind('"') {
                    if end_q > start_q {
                        let prefix = &line[..start_q+1];
                        let content = &line[start_q+1..end_q];
                        let suffix = &line[end_q..];
                        let res = format!("{}{}{}{}{}{}{}", 
                            ORC_STEEL, prefix, MYTHIC_GOLD, content, ORC_STEEL, suffix, RESET
                        );
                        return Cow::Owned(res);
                    }
                }
             }
        }
        // Highlight 'sudo'
        if trimmed.starts_with("sudo ") {
             let leading_ws_len = line.len() - trimmed.len();
             let leading_ws = &line[..leading_ws_len];
             let rest = &trimmed[5..]; 
             let res = format!("{}{}{}{}{}", leading_ws, CRIMSON_ALERT, "sudo ", RESET, rest);
             return Cow::Owned(res);
        }
        Cow::Borrowed(line)
    }
    
    fn highlight_hint<'h>(&self, hint: &'h str) -> Cow<'h, str> {
        // Display hints in Grey (Ghost Text)
        Cow::Owned(format!("{}{}{}", GREY, hint, RESET))
    }

    fn highlight_char(&self, _line: &str, _pos: usize) -> bool { true }
}

// --- AI GUARDIAN LOGIC (PRE-FLIGHT) ---
fn consult_guardian_preflight(cmd: &str) -> GuardianVerdict {
    let client = ureq::agent();
    // Check if local AI is reachable
    if client.get("http://localhost:11434/").call().is_err() {
        return GuardianVerdict::Offline;
    }
    
    let model = "phi3"; // Use fast model
    let prompt = format!(
        "You are a Linux Shell Guardian. Analyze this command: '{}'. \
        If it is valid, safe, and free of typos, respond EXACTLY with 'SAFE'. \
        If it has an error, typo, or is dangerous, respond ONLY with the corrected command string. \
        Do NOT output markdown or explanations.", 
        cmd
    );
    let payload = ureq::json!({ "model": model, "prompt": prompt, "stream": false });

    match client.post("http://localhost:11434/api/generate").send_json(payload) {
        Ok(response) => {
            if let Ok(json) = response.into_json::<Value>() {
                if let Some(text) = json["response"].as_str() {
                    let clean = text.trim();
                    if clean.eq_ignore_ascii_case("SAFE") {
                        return GuardianVerdict::Safe;
                    } else {
                        // Safety check: ensure suggestion is a single line command
                        if !clean.contains('\\x0A') && clean.len() < 300 {
                            return GuardianVerdict::Risky(clean.to_string());
                        }
                    }
                }
            }
        },
        Err(_) => return GuardianVerdict::Offline,
    }
    GuardianVerdict::Safe // Fail open if AI responds weirdly
}

// --- ALIAS LOGIC ---
fn get_aliases() -> HashMap<String, String> {
    let mut aliases = HashMap::new();
    // Common LS aliases
    aliases.insert("ll".to_string(), "ls -alF --color=auto".to_string());
    aliases.insert("la".to_string(), "ls -A --color=auto".to_string());
    aliases.insert("l".to_string(), "ls -CF --color=auto".to_string());
    aliases.insert("ls".to_string(), "ls --color=auto".to_string());
    
    // Safety
    aliases.insert("cp".to_string(), "cp -i".to_string());
    aliases.insert("mv".to_string(), "mv -i".to_string());
    aliases.insert("rm".to_string(), "rm -i".to_string());
    
    // Helpers
    aliases.insert("grep".to_string(), "grep --color=auto".to_string());
    aliases.insert("diff".to_string(), "diff --color=auto".to_string());
    aliases.insert("ip".to_string(), "ip -c".to_string());
    
    // Arch/Kael Specific
    aliases.insert("update".to_string(), "paru -Syyu".to_string());
    aliases.insert("install".to_string(), "paru -S".to_string());
    aliases.insert("remove".to_string(), "paru -Rns".to_string());
    aliases.insert("yay".to_string(), "paru".to_string()); // The Sentient Translator
    
    // Vanity (Branding) - The Synaptic Upgrade!
    // We now point to the installed config file to avoid CLI flag issues
    aliases.insert("fastfetch".to_string(), "fastfetch -c /usr/share/kael-shell/fastfetch.jsonc".to_string());

    aliases
}

fn expand_alias(cmd: &str, aliases: &HashMap<String, String>) -> String {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    if parts.is_empty() { return cmd.to_string(); }
    
    if let Some(expansion) = aliases.get(parts[0]) {
        let mut new_cmd = expansion.clone();
        if parts.len() > 1 {
            let rest = &cmd[parts[0].len()..].trim_start();
            new_cmd.push_str(" ");
            new_cmd.push_str(rest);
        }
        return new_cmd;
    }
    cmd.to_string()
}

// --- PROMPT LOGIC ---
fn get_git_branch() -> Option<String> {
    let output = Command::new("git").args(&["branch", "--show-current"]).stderr(Stdio::null()).output().ok()?;
    if output.status.success() {
        let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !branch.is_empty() { return Some(branch); }
    }
    None
}

fn get_prompt(last_exit: i32) -> String {
    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let home = env::var("HOME").unwrap_or_default();
    let cwd_str = cwd.to_string_lossy();
    let path = if !home.is_empty() && cwd_str.starts_with(&home) { cwd_str.replacen(&home, "~", 1) } else { cwd_str.into_owned() };
    let git_info = if let Some(branch) = get_git_branch() { format!(" {} {}{}", ORC_STEEL, branch, RESET) } else { String::new() };
    let host = hostname::get().unwrap_or_default().to_string_lossy().to_string();
    let user = env::var("USER").unwrap_or_else(|_| "architect".to_string());
    let symbol = if last_exit == 0 { format!("{}⚡{}", DRAGON_FIRE, RESET) } else { format!("{}✕{}", CRIMSON_ALERT, RESET) };
    
    format!("\\n{}{}@{}{}: {}{}{}{}\\n{} {} ", MAGIC_PURPLE, user, host, RESET, RUNE_BLUE, path, git_info, RESET, symbol, RESET)
}

// --- EXECUTION ENGINE (BASH WRAPPER) ---
fn execute_command_line(cmd_line: &str) -> i32 {
    if cmd_line.trim().is_empty() { return 0; }

    // 1. Built-ins handling
    let parts: Vec<&str> = cmd_line.split_whitespace().collect();
    if let Some(first) = parts.first() {
        match *first {
            "cd" => {
                let new_dir = if parts.len() > 1 { parts[1] } else { "~" };
                let target = if new_dir == "~" { env::var("HOME").unwrap_or_else(|_| "/".to_string()) } else { new_dir.to_string() };
                return match env::set_current_dir(&target) {
                    Ok(_) => 0,
                    Err(e) => { eprintln!("{}cd: {}{}", CRIMSON_ALERT, e, RESET); 1 }
                };
            },
            "exit" => std::process::exit(0),
            "version" | "--version" => {
                 println!("{}Kaelic Shell v{} (Guardian Edition){}", ORC_STEEL, env::var("KAEL_SHELL_VERSION").unwrap_or("?.?.?".to_string()), RESET);
                 return 0;
            },
            "export" => {
                if parts.len() > 1 {
                     let full_arg = cmd_line.trim_start_matches("export").trim();
                     if let Some((key, value)) = full_arg.split_once('=') {
                         env::set_var(key, value.trim_matches('"').trim_matches('\\''));
                     }
                }
                return 0;
            },
            "unset" => {
                if parts.len() > 1 { env::remove_var(parts[1]); }
                return 0;
            },
            _ => {}
        }
    }

    // 2. Guardian Interceptor Logic (Command Wrapping)
    let mut final_cmd = cmd_line.to_string();
    let guard_triggers = vec!["pacman", "paru", "makepkg", "yay", "sudo pacman", "sudo paru"];
    let chronicler_exists = Path::new("/usr/local/bin/chronicler").exists() || Path::new("/usr/bin/chronicler").exists();
    
    if chronicler_exists {
        for trigger in guard_triggers {
            if final_cmd.starts_with(trigger) {
                 if !final_cmd.starts_with("chronicler exec") {
                     final_cmd = format!("chronicler exec {}", final_cmd);
                 }
                 break;
            }
        }
    }

    // 3. Pass to Bash
    match Command::new("bash")
        .arg("-c")
        .arg(&final_cmd)
        .status() 
    {
        Ok(status) => status.code().unwrap_or(1),
        Err(e) => {
            eprintln!("{}Execution Error: {}{}", CRIMSON_ALERT, e, RESET);
            127
        }
    }
}

fn main() -> rustyline::Result<()> {
    // Handle CLI Args for Version Check
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        if args[1] == "--version" || args[1] == "-v" || args[1] == "version" {
             println!("Kaelic Shell v1.7.1 (Guardian Edition)");
             return Ok(());
        }
    }

    if let Ok(exe) = env::current_exe() { env::set_var("SHELL", exe); }
    env::set_var("KAEL_SHELL_VERSION", "1.7.1");

    // System Stats
    let mut stats_shown = false;
    // Try fastfetch with branding via config file
    if Command::new("fastfetch")
        .args(&["-c", "/usr/share/kael-shell/fastfetch.jsonc"])
        .status()
        .is_ok() 
    { 
        stats_shown = true; 
    } 
    // Fallback to standard fastfetch
    else if Command::new("fastfetch").status().is_ok() { stats_shown = true; } 
    // Fallback to neofetch
    else if Command::new("neofetch").status().is_ok() { stats_shown = true; }

    if !stats_shown { println!("{}⚔️  Kaelic Shell v1.7.1 (Guardian Edition) Online{}", ORC_STEEL, RESET); }
    println!("{}Type 'exit' to return to the void.{}", GREY, RESET);

    // Shared State for Ghost Fixes
    let suggestion_store = Rc::new(RefCell::new(None));

    let config = rustyline::Config::builder().build();
    let mut rl: Editor<KaelHelper, FileHistory> = Editor::with_config(config)?;
    
    rl.set_helper(Some(KaelHelper::new(suggestion_store.clone())));

    let history_path = dirs::home_dir().map(|p| p.join(".kael_history")).unwrap_or_else(|| PathBuf::from(".kael_history"));
    let _ = rl.load_history(&history_path);

    let aliases = get_aliases();
    let mut last_exit = 0;
    let mut last_blocked_cmd: Option<String> = None;

    loop {
        let prompt = get_prompt(last_exit);
        
        match rl.readline(&prompt) {
            Ok(line) => {
                // Clear current suggestion shown as ghost text
                suggestion_store.borrow_mut().take();

                let input = line.trim();
                if input.is_empty() { continue; }
                let _ = rl.add_history_entry(input);
                
                // 1. Expand Aliases
                let expanded = expand_alias(input, &aliases);
                
                // 2. Guardian Pre-Flight Analysis
                let execute_now = if let Some(blocked) = &last_blocked_cmd {
                    if blocked == &expanded {
                         // USER OVERRIDE: User typed the same command again. Allow it.
                         last_blocked_cmd = None;
                         true
                    } else {
                         // User typed something new. Analyze it.
                         match consult_guardian_preflight(&expanded) {
                            GuardianVerdict::Safe | GuardianVerdict::Offline => true,
                            GuardianVerdict::Risky(fix) => {
                                println!("{}🛡️  Guardian Intercept: Potential error detected.{}", ORC_STEEL, RESET);
                                println!("{}   Suggestion: {}{}{}", GREY, MYTHIC_GOLD, fix, RESET);
                                println!("{}   (Press Right Arrow to accept fix, or Enter again to override){}", GREY, RESET);
                                
                                // Set the fix as ghost text for the next empty prompt
                                *suggestion_store.borrow_mut() = Some(fix);
                                
                                // Halt execution and remember this command
                                last_blocked_cmd = Some(expanded.clone());
                                false
                            }
                        }
                    }
                } else {
                     // First time command. Analyze.
                     match consult_guardian_preflight(&expanded) {
                        GuardianVerdict::Safe | GuardianVerdict::Offline => true,
                        GuardianVerdict::Risky(fix) => {
                            println!("{}🛡️  Guardian Intercept: Potential error detected.{}", ORC_STEEL, RESET);
                            println!("{}   Suggestion: {}{}{}", GREY, MYTHIC_GOLD, fix, RESET);
                            println!("{}   (Press Right Arrow to accept fix, or Enter again to override){}", GREY, RESET);
                            *suggestion_store.borrow_mut() = Some(fix);
                            last_blocked_cmd = Some(expanded.clone());
                            false
                        }
                    }
                };
                
                // 3. Execute (if permitted)
                if execute_now {
                    last_exit = execute_command_line(&expanded);
                    last_blocked_cmd = None; // Clear block state on success
                } else {
                    last_exit = 128; // Custom code for "Blocked"
                }
            },
            Err(ReadlineError::Interrupted) => println!("^C"),
            Err(ReadlineError::Eof) => { println!("exit"); break; },
            Err(err) => { println!("Error: {:?}", err); break; }
        }
    }
    rl.save_history(&history_path)?;
    Ok(())
}
`;

// 3. CARGO.TOML
const CARGO_TOML = `
[package]
name = "kael-shell"
version = "1.7.1"
edition = "2021"

[dependencies]
rustyline = "12.0.0"
dirs = "5.0"
hostname = "0.3"
ureq = { version = "2.9", features = ["json"] }
serde_json = "1.0"
`;

// 4. PKGBUILD
const PKGBUILD_CONTENT = `
# Maintainer: Kael AI for The Architect
pkgname=kael-shell
pkgver=1.7.1
pkgrel=1
pkgdesc="Kaelic Shell: A sovereign shell for Kael OS. Features Guardian Pre-Flight Analysis (Ghost Fix), Oracle Autosuggestions, and Bash Compatibility."
arch=('x86_64')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('glibc' 'gcc-libs' 'gpm' 'chronicler' 'fastfetch' 'bash')
makedepends=('rust' 'cargo')
provides=('kael-shell')
conflicts=('kael-shell')
source=("main.rs" "Cargo.toml" "fastfetch.jsonc")
sha256sums=('SKIP' 'SKIP' 'SKIP')
options=('!lto')

prepare() {
    # Create the structure Cargo expects
    mkdir -p "$srcdir/src"
    cp "main.rs" "$srcdir/src/main.rs"
}

build() {
    echo "--> Forging the Sovereign Shell..."
    export RUSTUP_TOOLCHAIN=stable
    unset CFLAGS CXXFLAGS LDFLAGS
    cargo clean
    cargo build --release
}

package() {
    install -Dm755 "target/release/kael-shell" "$pkgdir/usr/bin/kael-shell"
    install -d "$pkgdir/etc"
    
    # Install the fastfetch configuration file to shared system path
    install -d "$pkgdir/usr/share/kael-shell"
    install -Dm644 "fastfetch.jsonc" "$pkgdir/usr/share/kael-shell/fastfetch.jsonc"
}

install=kael-shell.install
`;

// 5. INSTALL SCRIPT
const INSTALL_SCRIPT = `
post_install() {
    echo "--- Kaelic Shell Registration ---"
    if ! grep -q "/usr/bin/kael-shell" /etc/shells; then
        echo "--> Registering /usr/bin/kael-shell in /etc/shells..."
        echo "/usr/bin/kael-shell" >> /etc/shells
    fi
    echo "--> Enabling and Starting GPM service..."
    systemctl enable --now gpm.service 2>/dev/null || true
    echo "✅ Kaelic Shell installed."
    echo "--> Switch: chsh -s /usr/bin/kael-shell"
}

post_remove() {
    sed -i '\|/usr/bin/kael-shell|d' /etc/shells
    rm -rf /usr/share/kael-shell
}
`;


// 6. MASTER FORGE SCRIPT
const FORGE_SCRIPT_RAW = `#!/bin/bash
set -euo pipefail

# --- CONFIGURATION ---
PKG_DIR="$HOME/forge/packages/kaelic-shell-prototype"
PKG_NAME="kael-shell"

# --- BACKUP PROTOCOL ---
if [ -f "$PKG_DIR/main.rs" ]; then
    echo "--> 🛡️  Protecting previous shell source..."
    cp "$PKG_DIR/main.rs" "$PKG_DIR/main.rs.v1.7.0.bak"
    echo "    Backup created: main.rs.v1.7.0.bak"
fi

# --- CLEANUP ---
if [ -d "$PKG_DIR" ]; then
    # We only clean build artifacts, preserving the directory and backup
    rm -rf "$PKG_DIR/target" "$PKG_DIR/pkg" "$PKG_DIR/src"
else
    mkdir -p "$PKG_DIR"
fi

echo "--- Forging Kaelic Shell v1.7.1 (Guardian Edition) ---"
echo "⚠️  MODE: Local Forge Only. Future changes will NOT be auto-pushed."

# --- STEP 1: Prepare the Forge ---
echo "--> [1/3] Preparing the forge at \${PKG_DIR}..."
cd "\${PKG_DIR}"
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/3] Scribing the sacred scrolls..."

# Write Cargo.toml
cat > Cargo.toml << 'EOF'
${CARGO_TOML}
EOF

# Write PKGBUILD
cat > PKGBUILD << 'EOF'
${PKGBUILD_CONTENT}
EOF

# Write Install Script
cat > kael-shell.install << 'EOF'
${INSTALL_SCRIPT}
EOF

# Write Rust Source (main.rs)
cat > main.rs << 'EOF'
${KAEL_SHELL_RS}
EOF

# Write Fastfetch Config (fastfetch.jsonc)
cat > fastfetch.jsonc << 'EOF'
${FASTFETCH_CONFIG}
EOF

echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [2.5/3] Updating checksums..."
updpkgsums

# --- STEP 4: Forge Locally ---
echo "--> [3/3] Invoking Local Forge..."
# We use makepkg -si (Sync Deps + Install) to test locally without publishing
makepkg -si --noconfirm

echo ""
echo "✨ Ritual Complete! Kaelic Shell v1.7.1 (Guardian Edition) is installed locally."
echo "   REMINDER: This version was NOT pushed to the Athenaeum."
echo "   To test it immediately, type: kael-shell"
`;


export const KaelicShellPackageModal: React.FC<KaelicShellPackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;

    const equipCommand = `chsh -s /usr/bin/kael-shell`;
    const revertCommand = `chsh -s /usr/bin/fish`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ShellPromptIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kaelic Shell (Local Dev Mode)</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, the stable <strong className="text-orc-steel">v1.7.1 (Guardian Edition)</strong> is now protected in the Athenaeum.
                    </p>
                     <div className="text-sm p-3 bg-dragon-fire/10 border-l-4 border-dragon-fire rounded space-y-2">
                         <p>
                            <strong className="text-dragon-fire">⚠️ Local Dev Mode Active:</strong> Any further executions of this ritual will perform a <strong>Local Install Only</strong>. We will not push changes to the public repository until we are ready for v1.8.0.
                        </p>
                    </div>
                   
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: The Local Forge Incantation</h3>
                    <p>
                        Run this command to iterate on the shell locally without affecting the stable public release.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                    
                    <h3 className="font-semibold text-lg text-dragon-fire mt-4 mb-2 flex items-center gap-2">
                        <RocketLaunchIcon className="w-5 h-5" />
                        <span>Step 2: Equip as Default</span>
                    </h3>
                    <CodeBlock lang="bash">{equipCommand}</CodeBlock>
                    
                     <div className="mt-6 p-4 bg-red-900/10 border border-red-500/30 rounded-lg">
                        <h3 className="font-bold text-crimson-alert flex items-center gap-2 mb-2">
                            <ShieldCheckIcon className="w-5 h-5" />
                            <span>Emergency Revert Protocol</span>
                        </h3>
                        <p className="text-sm text-forge-text-secondary mb-2">
                            To restore <strong>Fish</strong> as your default shell:
                        </p>
                        <CodeBlock lang="bash">{revertCommand}</CodeBlock>
                    </div>
                </div>
            </div>
        </div>
    );
};