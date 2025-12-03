
import React from 'react';
import { CloseIcon, ShellPromptIcon, ShieldCheckIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface KaelicShellPackageModalProps {
  onClose: () => void;
}

const FORGE_SCRIPT_RAW = `#!/bin/bash
(
set -euo pipefail

# --- VM-AWARE PATHING ---
USER_HOME=$(getent passwd "\${SUDO_USER:-$USER}" | cut -d: -f6)
if [ -d "$USER_HOME/host_forge" ]; then
    PKG_DIR="$USER_HOME/host_forge/packages/kael-shell"
else
    PKG_DIR="$USER_HOME/forge/packages/kael-shell"
fi

echo "--- Forging Kaelic Shell v3.2.2 (The Sovereign Bond) ---"

# --- STEP 1: Prepare the Forge ---
echo "--> [1/4] Preparing the forge at \${PKG_DIR}..."
mkdir -p "\${PKG_DIR}/src"
cd "\${PKG_DIR}"
echo "✅ Forge is ready."

# --- STEP 2: Scribe the Scrolls ---
echo "--> [2/4] Scribing the sacred scrolls..."

cat > src/main.rs << 'EOF'
// --- ARCHITECTURAL NOTE (The Symbiotic Weave) ---
// This shell serves as the "brain" of the Kael OS experience.
// It is responsible for:
//   1.  Parsing user input.
//   2.  Distinguishing between executable commands and conversational prompts.
//   3.  Brokering communication with the local (Ollama) and cloud (Gemini) AI cores.
//   4.  Managing shell state (current directory, history, etc.).
//
// In future versions, this shell will be upgraded to emit structured data (e.g., JSON)
// instead of just ANSI text streams. This will allow the Kaelic Terminal (the "body")
// to render rich, interactive UI elements, completing the symbiotic link.

use std::env;
use std::fs;
use std::io::{self, Write};
use std::process::Command;
use std::path::{Path, PathBuf};
use std::collections::HashSet;


use rustyline::error::ReadlineError;
use rustyline::{At, Cmd, Editor, KeyEvent, KeyCode, Modifiers, Movement, Word};
use rustyline::completion::{Completer, FilenameCompleter};
use rustyline::hint::HistoryHinter;
use rustyline::validate::Validator;
use rustyline::Helper;
use serde_json::Value;
use terminal_size;
use hostname;

// --- COLORS ---
const DRAGON_FIRE: &str = "\\x1b[38;2;255;204;0m";
const ORC_STEEL: &str = "\\x1b[38;2;122;235;190m";
const MAGIC_PURPLE: &str = "\\x1b[38;2;224;64;251m";
const RUNE_BLUE: &str = "\\x1b[38;2;96;165;250m";
const CRIMSON_ALERT: &str = "\\x1b[38;2;239;68;68m";
const GREY: &str = "\\x1b[38;5;240m";
const PAYLOAD_GREY: &str = "\\x1b[38;2;169;158;195m"; // forge-text-secondary #a99ec3

const STATUS_GREEN: &str = "\\x1b[38;2;34;197;94m";
const STATUS_YELLOW: &str = "\\x1b[38;2;234;179;8m";
const STATUS_RED: &str = "\\x1b[38;2;239;68;68m";

const RESET: &str = "\\x1b[0m";

// --- STATE & HELPERS ---
struct KaelHelper {
    completer: FilenameCompleter,
    hinter: HistoryHinter,
    executable_cache: HashSet<String>,
}

impl KaelHelper {
    fn new() -> Self {
        Self {
            completer: FilenameCompleter::new(),
            hinter: HistoryHinter {},
            executable_cache: Self::build_executable_cache(),
        }
    }

    fn build_executable_cache() -> HashSet<String> {
        let mut cache = HashSet::new();
        if let Ok(path_var) = env::var("PATH") {
            for path in env::split_paths(&path_var) {
                if let Ok(entries) = fs::read_dir(path) {
                    for entry in entries.flatten() {
                        if let Ok(metadata) = entry.metadata() {
                            if metadata.is_file() {
                                cache.insert(entry.file_name().to_string_lossy().to_string());
                            }
                        }
                    }
                }
            }
        }
        cache
    }
}
impl Completer for KaelHelper {
    type Candidate = rustyline::completion::Pair;
    fn complete(&self, line: &str, pos: usize, ctx: &rustyline::Context<'_>) -> rustyline::Result<(usize, Vec<Self::Candidate>)> {
        self.completer.complete(line, pos, ctx)
    }
}
impl rustyline::hint::Hinter for KaelHelper {
    type Hint = String;
    fn hint(&self, line: &str, pos: usize, ctx: &rustyline::Context<'_>) -> Option<Self::Hint> {
        self.hinter.hint(line, pos, ctx)
    }
}
impl rustyline::highlight::Highlighter for KaelHelper {
    fn highlight<'l>(&self, line: &'l str, _pos: usize) -> std::borrow::Cow<'l, str> {
        use std::borrow::Cow::{Borrowed, Owned};
        
        // --- Special check for base64 encoded scripts ---
        let trimmed_for_b64 = line.trim();
        let start_tag = "echo \\"";
        
        if trimmed_for_b64.starts_with(start_tag) && trimmed_for_b64.contains("| base64") {
            let leading_whitespace_len = line.len() - line.trim_start().len();
            let (whitespace, _) = line.split_at(leading_whitespace_len);
            
            // Basic highlighting for the blob: first 6 chars (echo ") + blob + rest
            if line.len() > 10 {
                 let (echo_part, rest) = trimmed_for_b64.split_at(6);
                 let pipe_idx = rest.find("\\" |").unwrap_or(rest.len());
                 
                 let (payload, suffix) = rest.split_at(pipe_idx);
                 
                 let mut s = String::with_capacity(line.len() * 2);
                 s.push_str(whitespace);
                 s.push_str(ORC_STEEL);
                 s.push_str(echo_part);
                 s.push_str(RESET);
                 s.push_str(PAYLOAD_GREY);
                 s.push_str(payload);
                 s.push_str(RESET);
                 s.push_str(ORC_STEEL);
                 s.push_str(suffix);
                 s.push_str(RESET);
                 return Owned(s);
            }
        }

        // --- Normal command highlighting ---
        let leading_whitespace_len = line.len() - line.trim_start().len();
        let (whitespace, trimmed_line) = line.split_at(leading_whitespace_len);

        if trimmed_line.is_empty() { return Borrowed(line); }

        let mut owned_string = String::with_capacity(line.len() * 2);
        owned_string.push_str(whitespace);

        let mut words = trimmed_line.split_whitespace();
        let first_word = words.next().unwrap_or("");
        
        if first_word == "sudo" {
            owned_string.push_str(ORC_STEEL);
            owned_string.push_str("sudo");
            owned_string.push_str(RESET);
            
            if let Some(second_word) = words.next() {
                let color = if self.executable_cache.contains(second_word) { ORC_STEEL } else { CRIMSON_ALERT };
                let rest_of_line = &trimmed_line[first_word.len()..];
                let (space_before_second, rest_after_space) = rest_of_line.split_at(rest_of_line.find(second_word).unwrap_or(0));
                let (second_word_part, final_rest) = rest_after_space.split_at(second_word.len());
                
                owned_string.push_str(space_before_second);
                owned_string.push_str(color);
                owned_string.push_str(second_word_part);
                owned_string.push_str(RESET);
                owned_string.push_str(final_rest);
            } else {
                owned_string.push_str(&trimmed_line[first_word.len()..]);
            }
            return Owned(owned_string);
        }

        let first_word_end = trimmed_line.find(char::is_whitespace).unwrap_or(trimmed_line.len());
        let (first_word_part, rest) = trimmed_line.split_at(first_word_end);
        let color = if self.executable_cache.contains(first_word_part) { ORC_STEEL } else { CRIMSON_ALERT };
        owned_string.push_str(color);
        owned_string.push_str(first_word_part);
        owned_string.push_str(RESET);
        owned_string.push_str(rest);
        
        return Owned(owned_string);
    }

    fn highlight_char(&self, _line: &str, _pos: usize, _forced: bool) -> bool {
        true
    }
}
impl Validator for KaelHelper {}
impl Helper for KaelHelper {}

// --- AI LOGIC ---
#[allow(dead_code)]
enum AiStatus {
    Working,
    Misconfigured,
    NotInstalled,
}

#[allow(dead_code)]
fn status_to_color(status: AiStatus) -> &'static str {
    match status {
        AiStatus::Working => STATUS_GREEN,
        AiStatus::Misconfigured => STATUS_YELLOW,
        AiStatus::NotInstalled => STATUS_RED,
    }
}

fn get_local_ai_status() -> AiStatus {
    if !Command::new("systemctl").args(&["is-active", "--quiet", "ollama.service"]).status().map_or(false, |s| s.success()) {
        return AiStatus::NotInstalled;
    }

    match Command::new("ollama").arg("list").output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if stdout.contains("llama3") {
                AiStatus::Working
            } else {
                AiStatus::Misconfigured
            }
        },
        Err(_) => AiStatus::Misconfigured,
    }
}

fn get_cloud_ai_status() -> AiStatus {
    match read_kael_env() {
        Err(_) => AiStatus::NotInstalled,
        Ok((key, model)) => {
            if key.is_empty() || key.contains("YOUR_API_KEY") || model.is_empty() {
                AiStatus::Misconfigured
            } else {
                AiStatus::Working
            }
        }
    }
}

#[allow(dead_code)]
fn get_ai_status_indicators() -> String {
    let local_status = get_local_ai_status();
    let cloud_status = get_cloud_ai_status();

    let local_color = status_to_color(local_status);
    let cloud_color = status_to_color(cloud_status);

    let local_indicator = format!("{}{}{}", local_color, "🧠", RESET);
    let cloud_indicator = format!("{}{}{}", cloud_color, "☁️", RESET);
    
    format!(" {}  {} ", local_indicator, cloud_indicator)
}

fn read_kael_env() -> Result<(String, String), io::Error> {
    let config_path = match dirs::home_dir() {
        Some(path) => path.join(".config/kael/env"),
        None => return Err(io::Error::new(io::ErrorKind::NotFound, "Home directory not found")),
    };

    let content = fs::read_to_string(config_path)?;

    let mut api_key = String::new();
    let mut model = String::new();

    for line in content.lines() {
        if let Some(stripped) = line.trim().strip_prefix("export GEMINI_API_KEY=") {
            api_key = stripped.trim_matches('"').to_string();
        } else if let Some(stripped) = line.trim().strip_prefix("export GEMINI_MODEL=") {
            model = stripped.trim_matches('"').to_string();
        }
    }
    
    Ok((api_key, model))
}

fn call_local_ai(prompt: &str) -> Option<String> {
    let client = ureq::agent();
    if client.get("http://localhost:11434/").call().is_err() { return None; }
    let payload = ureq::json!({
        "model": "llama3",
        "prompt": prompt,
        "stream": false,
        "system": "You are Kael, a helpful AI assistant in a Linux shell. Be concise and helpful. Your user is an expert. Do not apologize or use pleasantries."
    });
    let response: Value = client.post("http://localhost:11434/api/generate")
        .timeout(std::time::Duration::from_secs(15))
        .send_json(payload).ok()?.into_json().ok()?;
    response["response"].as_str().map(|s| s.trim().to_string())
}

fn call_cloud_ai(prompt: &str, api_key: &str, model: &str) -> Option<String> {
    let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", model, api_key);
    let payload = ureq::json!({
        "contents": [{"parts":[{"text": prompt}]}]
    });
    let response: Value = ureq::post(&url).send_json(payload).ok()?.into_json().ok()?;
    response["candidates"][0]["content"]["parts"][0]["text"].as_str().map(|s| s.trim().to_string())
}

// --- COMMAND & PROMPT LOGIC ---
fn is_command(cmd: &str, cache: &HashSet<String>) -> bool {
    let trimmed = cmd.trim_start();
    if trimmed.starts_with("#!") {
        return true;
    }
    let first_word = trimmed.split_whitespace().next().unwrap_or("");
    cache.contains(first_word)
}

fn get_truncated_path() -> String {
    let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let home = env::var("HOME").unwrap_or_default();
    let path_str = cwd.to_string_lossy();

    let display_path = if !home.is_empty() && path_str.starts_with(&home) {
        path_str.replacen(&home, "~", 1)
    } else {
        path_str.into_owned()
    };
    display_path
}

fn get_prompt(last_exit: i32) -> String {
    let width = terminal_size::terminal_size().map(|(w, _)| w.0 as usize).unwrap_or(80);
    let username = env::var("USER").unwrap_or_else(|_| "user".to_string());
    let hostname = hostname::get().map(|s| s.to_string_lossy().into_owned()).unwrap_or_else(|_| "host".to_string());
    let path_str = get_truncated_path();
    let time_str = if let Ok(output) = Command::new("date").arg("+%H:%M:%S").output() {
        String::from_utf8_lossy(&output.stdout).trim().to_string()
    } else { "??:??:??".to_string() };

    // --- Line 1: User, Path & Time ---
    let main_info = format!("{}{}{} {}{}{}{}{}{}{}{}{}{}{}",
        MAGIC_PURPLE, "@", username, " ", hostname, RESET,
        " ",
        RUNE_BLUE, "", RESET,
        " ",
        ORC_STEEL, &path_str, RESET
    );
    let time_info = format!("{}{}{}{}", GREY, " ◀ ", time_str, RESET);
    
    // Naive visible length calculation (good enough for this)
    let main_info_visible_len = 1 + username.len() + 1 + hostname.len() + 1 + 1 + 1 + path_str.len();
    let time_info_visible_len = 3 + time_str.len();
    let line1_padding = " ".repeat(width.saturating_sub(main_info_visible_len + time_info_visible_len));
    let line1 = format!("{}{}{}", main_info, line1_padding, time_info);
    
    // --- Line 2: Separator ---
    let center_part = get_ai_status_indicators();
    let center_visible_len = 6;
    let padding_len = width.saturating_sub(center_visible_len);
    let padding1 = padding_len / 2;
    let padding2 = padding_len - padding1;
    let filler = "─";
    let line2 = format!("{}{}{}{}{}{}{}",
        MAGIC_PURPLE, filler.repeat(padding1),
        RESET,
        center_part,
        MAGIC_PURPLE, filler.repeat(padding2),
        RESET
    );

    // --- Line 3: Prompt ---
    let prompt_color = if last_exit == 0 { MAGIC_PURPLE } else { CRIMSON_ALERT };
    let line3 = format!("{}{}{RESET} {}{}{RESET} {}{}{RESET}",
        MAGIC_PURPLE, "└─",
        GREY, " in Kaelic Shell",
        prompt_color, " ⚡"
    );
    
    format!("{}\n{}\n{} ", line1, line2, line3)
}

fn execute_command_child(cmd_line: &str) -> i32 {
    let parts: Vec<&str> = cmd_line.split_whitespace().collect();
    if parts.is_empty() { return 0; }
    
    match parts[0] {
        "bash" if parts.len() == 1 => {
            let status = Command::new("bash").status();
            return status.map(|s| s.code().unwrap_or(1)).unwrap_or(127);
        }
        _ => {}
    }

    let status = Command::new("bash").arg("-c").arg(cmd_line).status();
    status.map(|s| s.code().unwrap_or(1)).unwrap_or(127)
}

// --- MAIN ---
fn main() -> rustyline::Result<()> {
    if env::args().len() > 1 {
        let arg = env::args().nth(1).unwrap();
        if arg == "--version" || arg == "version" {
            println!("Kaelic Shell v3.2.2");
            return Ok(());
        }
    }
    let _ = Command::new("fastfetch").args(&["-c", "/usr/share/kael-shell/fastfetch.jsonc"]).status();

    let helper = KaelHelper::new();
    let mut rl = Editor::new()?;
    rl.set_helper(Some(helper));
    rl.bind_sequence(KeyEvent(KeyCode::Left, Modifiers::CTRL), Cmd::Move(Movement::BackwardWord(1, Word::Emacs)));
    rl.bind_sequence(KeyEvent(KeyCode::Right, Modifiers::CTRL), Cmd::Move(Movement::ForwardWord(1, At::AfterEnd, Word::Emacs)));
    rl.bind_sequence(KeyEvent(KeyCode::Backspace, Modifiers::CTRL), Cmd::Kill(Movement::BackwardWord(1, Word::Emacs)));
    rl.bind_sequence(KeyEvent(KeyCode::Delete, Modifiers::CTRL), Cmd::Kill(Movement::ForwardWord(1, At::AfterEnd, Word::Emacs)));
    
    let history_path = dirs::home_dir().map(|p| p.join(".kael_history")).unwrap();
    let _ = rl.load_history(&history_path);
    let mut last_exit = 0;

    // --- Rune of Awareness: Pacman DB Watcher ---
    let pacman_db_path = Path::new("/var/lib/pacman/local/");
    let mut last_db_mtime = fs::metadata(&pacman_db_path).ok().and_then(|m| m.modified().ok());

    loop {
        // --- Rune of Awareness Check ---
        if let Ok(current_mtime) = fs::metadata(&pacman_db_path).and_then(|m| m.modified()) {
            if let Some(last_mtime) = last_db_mtime {
                if current_mtime > last_mtime {
                    if let Some(helper) = rl.helper_mut() {
                        println!("\n{}Athenaeum updated. Re-hashing command paths...{}", ORC_STEEL, RESET);
                        helper.executable_cache = KaelHelper::build_executable_cache();
                        last_db_mtime = Some(current_mtime);
                    }
                }
            } else {
                last_db_mtime = Some(current_mtime);
            }
        }

        let prompt = get_prompt(last_exit);
        let readline = rl.readline(&prompt);
        match readline {
            Ok(line) => {
                let input = line.trim();
                if input.is_empty() { continue; }

                let parts: Vec<&str> = input.split_whitespace().collect();
                let command = parts.get(0).unwrap_or(&"");

                match *command {
                    "exit" => {
                        println!("exit");
                        break;
                    },
                    "cd" => {
                        rl.add_history_entry(input)?;
                        let target = if parts.len() > 1 { parts[1] } else { "~" };
                        let path = if target == "~" { dirs::home_dir().unwrap_or_default() } else { PathBuf::from(target) };
                        if let Err(e) = env::set_current_dir(&path) {
                            eprintln!("{}cd: {}{}", CRIMSON_ALERT, e, RESET);
                            last_exit = 1;
                        } else {
                            last_exit = 0;
                        }
                        continue;
                    },
                    "rehash" => {
                        rl.add_history_entry(input)?;
                        if let Some(helper) = rl.helper_mut() {
                            helper.executable_cache = KaelHelper::build_executable_cache();
                            println!("{}Paths re-hashed.{}", ORC_STEEL, RESET);
                        }
                        last_exit = 0;
                        continue;
                    },
                    _ => {
                        rl.add_history_entry(input)?;
                        
                        let is_ritual = input.trim_start().starts_with("echo \\"") && input.contains("| base64");

                        if is_ritual || is_command(input, &rl.helper().as_ref().unwrap().executable_cache) {
                            last_exit = execute_command_child(input);
                        } else {
                            let mut response: Option<String> = None;
                            let mut animus_used: &str = "";

                            if let Ok((api_key, model)) = read_kael_env() {
                                if !api_key.is_empty() && !api_key.contains("YOUR_API_KEY") && !model.is_empty() {
                                    println!("{}~ Consulting Cloud Animus (Gemini)...{}", GREY, RESET);
                                    io::stdout().flush().unwrap();
                                    response = call_cloud_ai(input, &api_key, &model);
                                    if response.is_some() {
                                        animus_used = "cloud";
                                    }
                                }
                            }

                            if response.is_none() {
                                println!("{}~ Consulting Local Animus (Llama 3)...{}", GREY, RESET);
                                io::stdout().flush().unwrap();
                                response = call_local_ai(input);
                                if response.is_some() {
                                    animus_used = "local";
                                }
                            }
                            
                            if let Some(text) = response {
                                let prefix = match animus_used {
                                    "cloud" => format!("{}☁️ Cloud Animus:{}", ORC_STEEL, RESET),
                                    "local" => format!("{}🧠 Local Animus:{}", DRAGON_FIRE, RESET),
                                    _ => format!("{}⚠️ Animus Error:{}", CRIMSON_ALERT, RESET),
                                };
                                println!("{} {}\\n", prefix, text);
                            } else {
                                println!("{}[Both Cloud and Local Animus are unresponsive. Check 'ollama' service and 'Kael AI Configurator'.]{}", CRIMSON_ALERT, RESET);
                            }
                            last_exit = 0;
                        }
                    }
                }
            },
            Err(ReadlineError::Interrupted) => { println!("^C"); last_exit = 130; },
            Err(ReadlineError::Eof) => { println!("exit"); break; },
            Err(err) => { println!("Error: {:?}", err); break; }
        }
    }
    rl.save_history(&history_path)?;
    Ok(())
}
EOF

cat > Cargo.toml << 'EOF'
[package]
name = "kael-shell"
version = "3.2.2"
edition = "2021"

[dependencies]
rustyline = "14.0.0"
dirs = "5.0"
hostname = "0.3"
ureq = { version = "2.9", default-features = false, features = ["json", "native-tls"] }
serde_json = "1.0"
terminal_size = "0.2"
EOF

cat > fastfetch.jsonc << 'EOF'
{
  "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
  "logo": { "padding": { "top": 2 } },
  "modules": [
    "title", "separator", "os", "host", "kernel", "uptime", "packages",
    {
      "type": "shell",
      "format": "Kaelic Shell v3.2.2"
    },
    "display", "de", "wm", "theme", "icons", "font", "terminal", "cpu", "gpu", "memory", "disk", "localip", "break", "colors"
  ]
}
EOF

cat > PKGBUILD << 'EOF'
# Maintainer: Kael AI for The Architect
pkgname=kael-shell
pkgver=3.2.2
pkgrel=1
pkgdesc="A conversational, hybrid AI shell. v3.2.2 depends on kaelic-fonts."
arch=('x86_64')
url="https://github.com/LeeTheOrc/Kael-OS"
license=('GPL3')
depends=('glibc' 'gcc-libs' 'bash' 'fastfetch' 'ollama' 'kaelic-fonts' 'chronicler' 'openssl')
makedepends=('rust' 'cargo')
provides=('kael-shell')
conflicts=('kael-shell')
source=("src/main.rs" "Cargo.toml" "fastfetch.jsonc")
sha256sums=('SKIP' 'SKIP' 'SKIP')

build() {
    export RUSTUP_TOOLCHAIN=stable
    cargo build --release
}

package() {
    install -Dm755 "target/release/kael-shell" "$pkgdir/usr/bin/kael-shell"
    install -d "$pkgdir/usr/share/kael-shell"
    install -Dm644 "fastfetch.jsonc" "$pkgdir/usr/share/kael-shell/fastfetch.jsonc"
}

install=kael-shell.install
EOF

cat > kael-shell.install << 'EOF'
post_install() {
    echo "--- Kaelic Shell Registration ---"
    if ! grep -q "/usr/bin/kael-shell" /etc/shells; then
        echo "/usr/bin/kael-shell" >> /etc/shells
    fi
    echo "✅ Kaelic Shell v3.2.2 installed."
    echo "--> To make it your default, run: chsh -s /usr/bin/kael-shell"
    echo "--> If already default, type 'exec kael-shell' to restart it."
}

post_upgrade() {
    post_install
}

post_remove() {
    sed -i '|/usr/bin/kael-shell|d' /etc/shells
    rm -rf /usr/share/kael-shell
}
EOF

echo "✅ Scrolls scribed."

# --- STEP 3: Attune the Runes ---
echo "--> [3/4] Attuning the runes (updating checksums)..."
updpkgsums
echo "✅ Runes attuned."

# --- STEP 4: Forge and Publish ---
echo "--> [4/4] Invoking the Athenaeum Scribe to forge and publish..."
grand-concordance

echo ""
echo "✨ Ritual Complete! The Kaelic Shell has been forged and published to all Athenaeums."
)
`;

export const KaelicShellPackageModal: React.FC<KaelicShellPackageModalProps> = ({ onClose }) => {
    const encodedScript = btoa(unescape(encodeURIComponent(FORGE_SCRIPT_RAW)));
    const finalForgeCommand = `echo "${encodedScript}" | base64 --decode | bash`;
    const changeShellCommand = `chsh -s /usr/bin/kael-shell`;
    const reengageCommand = `exec kael-shell`;
    const failsafeCommand = `chsh -s /bin/bash`;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ShellPromptIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Kaelic Shell v3.2.2</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                     <div className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded space-y-2">
                        <strong className="text-orc-steel">Update v3.2.2: The Sovereign Bond</strong><br/>
                        <p>
                           This version forges a sovereign bond. The shell now depends directly on our own <code className="font-mono text-xs">kaelic-fonts</code> package, resolving dependency conflicts and making our ecosystem self-reliant.
                        </p>
                    </div>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 1: The Publishing Incantation</h3>
                    <p>
                        Run this command to apply the update. It will forge and publish the new version to all Athenaeums.
                    </p>
                    <CodeBlock lang="bash">{finalForgeCommand}</CodeBlock>
                    
                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">Step 2: Engage the Shell</h3>
                    <p>
                        To set Kaelic Shell as your default login shell, run this command and then log out and back in:
                    </p>
                    <CodeBlock lang="bash">{changeShellCommand}</CodeBlock>
                    <p className="mt-2 text-sm">
                        If it's already your default, simply type this in your current terminal to restart and load the new version:
                    </p>
                    <CodeBlock lang="bash">{reengageCommand}</CodeBlock>
                    
                     <div className="mt-6 border-t-2 border-dashed border-forge-border pt-4">
                        <h3 className="font-bold text-lg text-dragon-fire flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5"/>
                            <span>Architect's Failsafe</span>
                        </h3>
                        <p className="text-sm mt-2">
                            If the shell ever locks you out, use the TTY failsafe (Ctrl+Alt+F3) to revert to bash:
                        </p>
                        <CodeBlock lang="bash">{failsafeCommand}</CodeBlock>
                    </div>

                </div>
            </div>
        </div>
    );
};
