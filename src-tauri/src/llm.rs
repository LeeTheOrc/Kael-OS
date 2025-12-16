#![allow(dead_code)]

use crate::auth::User;
use crate::services::{ollama_manager, system_context};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use std::sync::{Mutex, OnceLock};
use std::collections::HashMap;

// In-memory cache for API keys
static API_KEY_CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();

/// Cache an API key for a provider in memory
pub fn cache_api_key(provider_name: &str, api_key: &str) {
    let cache = API_KEY_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    let mut map = cache.lock().unwrap();
    map.insert(provider_name.to_string(), api_key.to_string());
    log::info!("💾 Cached API key for: {}", provider_name);
}

/// Get cached API key for a provider
fn get_cached_api_key(provider_name: &str) -> Option<String> {
    let cache = API_KEY_CACHE.get()?;
    let map = cache.lock().unwrap();
    map.get(provider_name).cloned()
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum LLMProvider {
    Ollama,
    Mistral,
    Gemini,
    Copilot,
    CopilotAgent, // standalone GitHub Copilot CLI via npm
    Office365AI,
    GoogleOneAI,
    Minstrel, // Minstrel AI
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LLMRequest {
    pub provider: LLMProvider,
    pub model: String,
    pub prompt: String,
    pub api_key: Option<String>,
    pub system: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LLMResponse {
    pub provider: LLMProvider,
    pub content: String,
}

fn default_model_for(provider: &LLMProvider) -> String {
    fn installed_ollama_models() -> Vec<String> {
        use std::process::Command;
        if let Ok(output) = Command::new("ollama").arg("list").output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                return stdout
                    .lines()
                    .skip(1)
                    .filter_map(|line| line.split_whitespace().next())
                    .map(|s| s.to_string())
                    .collect();
            }
        }
        Vec::new()
    }

    fn prefer_local_model() -> Option<String> {
        let models = installed_ollama_models();
        if models.is_empty() {
            return None;
        }
        let priority = ["llama", "phi", "mistral", "qwen", "granite", "gemma"];
        for needle in priority {
            if let Some(found) = models.iter().find(|m| m.to_lowercase().contains(needle)) {
                return Some(found.clone());
            }
        }
        models.first().cloned()
    }

    match provider {
        LLMProvider::Ollama => {
            if let Some(m) = prefer_local_model() {
                return m;
            }
            std::env::var("OLLAMA_MODEL").unwrap_or_else(|_| "llama:latest".to_string())
        }
        LLMProvider::Mistral => {
            std::env::var("MISTRAL_MODEL").unwrap_or_else(|_| "mistral-small".to_string())
        }
        LLMProvider::Gemini => {
            std::env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-1.5-pro".to_string())
        }
        LLMProvider::Copilot => {
            std::env::var("GITHUB_COPILOT_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string())
        }
        LLMProvider::CopilotAgent => {
            std::env::var("GITHUB_COPILOT_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string())
        }
        LLMProvider::Office365AI => {
            std::env::var("OFFICE365AI_MODEL").unwrap_or_else(|_| "gpt-4o-mini".to_string())
        }
        LLMProvider::GoogleOneAI => {
            std::env::var("GOOGLEONEAI_MODEL").unwrap_or_else(|_| "gemini-1.5-pro".to_string())
        }
        LLMProvider::Minstrel => {
            std::env::var("MINSTREL_MODEL").unwrap_or_else(|_| "minstrel-8x7b-instruct".to_string())
        }
    }
}

/// Quick health check for the local Ollama service.
pub async fn ping_local() -> bool {
    let endpoint =
        std::env::var("OLLAMA_ENDPOINT").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
    let url = format!("{}/api/tags", endpoint.trim_end_matches('/'));

    if let Ok(client) = Client::builder().timeout(Duration::from_secs(3)).build() {
        if let Ok(resp) = client.get(url).send().await {
            return resp.status().is_success();
        }
    }
    false
}

/// Warm the local model with a tiny prompt so the first real reply is faster.
pub async fn warm_local_model(model: &str) -> bool {
    let req = LLMRequest {
        provider: LLMProvider::Ollama,
        model: model.to_string(),
        prompt: "ping".to_string(),
        api_key: None,
        system: Some("You are a warm-up probe. Respond with a short ack.".to_string()),
    };
    send_request_single(req, None).await.is_ok()
}

// Try multiple providers with fallback
pub async fn send_request_with_fallback(
    initial_request: LLMRequest,
    user: Option<&User>,
    enabled_providers: Vec<(LLMProvider, Option<String>)>, // (provider, api_key)
) -> Result<LLMResponse, String> {
    // Try the initial provider first
    let mut request = initial_request.clone();
    if request.model.trim().is_empty() {
        request.model = default_model_for(&request.provider);
    }
    let result = send_request_single(request.clone(), user).await;

    // If successful, return immediately
    if result.is_ok() {
        return result;
    }

    // Otherwise, try enabled cloud providers in order
    let mut last_error = result.err().unwrap_or_else(|| "Unknown error".to_string());

    for (provider, api_key) in enabled_providers {
        // Skip if it's the same as initial (already tried)
        if std::mem::discriminant(&provider) == std::mem::discriminant(&initial_request.provider) {
            continue;
        }

        request.provider = provider.clone();
        request.api_key = api_key;
        request.model = default_model_for(&request.provider);

        match send_request_single(request.clone(), user).await {
            Ok(response) => return Ok(response),
            Err(e) => {
                last_error = e;
                continue;
            }
        }
    }

    Err(format!("All providers failed. Last error: {}", last_error))
}

async fn send_request_single(
    mut request: LLMRequest,
    user: Option<&User>,
) -> Result<LLMResponse, String> {
    // Try local cached keys first to avoid initial network delay
    if request.api_key.is_none() {
        let provider_name = match request.provider {
            LLMProvider::Mistral => "Mistral AI",
            LLMProvider::Gemini => "Google Gemini",
            LLMProvider::Copilot => "GitHub Copilot",
            LLMProvider::CopilotAgent => "GitHub Copilot CLI",
            LLMProvider::Office365AI => "Office 365 AI",
            LLMProvider::GoogleOneAI => "Google One AI",
            LLMProvider::Minstrel => "Minstrel AI",
            _ => "",
        };
        if !provider_name.is_empty() {
            if let Ok(json) = std::fs::read_to_string("/tmp/kael_cached_api_keys.json") {
                if let Ok(list) = serde_json::from_str::<Vec<serde_json::Value>>(&json) {
                    if let Some(val) = list.iter().find_map(|v| {
                        let name = v.get("name").and_then(|x| x.as_str());
                        let value = v.get("value").and_then(|x| x.as_str());
                        match (name, value) {
                            (Some(n), Some(v)) if n == provider_name => Some(v.to_string()),
                            _ => None,
                        }
                    }) {
                        request.api_key = Some(val);
                    }
                }
            }
        }
    }

    if let Some(user) = user {
        if request.api_key.is_none() {
            let provider_name = match request.provider {
                LLMProvider::Mistral => "Mistral AI",
                LLMProvider::Gemini => "Google Gemini",
                LLMProvider::Copilot => "GitHub Copilot",
                LLMProvider::CopilotAgent => "GitHub Copilot CLI",
                LLMProvider::Office365AI => "Office 365 AI",
                LLMProvider::GoogleOneAI => "Google One AI",
                LLMProvider::Minstrel => "Minstrel AI",
                _ => "",
            };
            if !provider_name.is_empty() {
                // Try cache first
                if let Some(cached_key) = get_cached_api_key(provider_name) {
                    log::info!("🔑 Using cached API key for {}", provider_name);
                    request.api_key = Some(cached_key);
                } else {
                    // Fall back to Firebase
                    log::info!("🔍 Loading API key for {} from Firebase...", provider_name);
                    if let Ok(keys) = crate::firebase::get_api_keys(user).await {
                        if let Some(key) = keys.iter().find(|k| k.name == provider_name) {
                            log::info!("✅ Loaded key for {} from Firebase", provider_name);
                            request.api_key = Some(key.value.clone());
                            // Cache it for next time
                            cache_api_key(provider_name, &key.value);
                        }
                    }
                }
            }
        }
    }

    match request.provider {
        LLMProvider::Ollama => {
            // Ensure the local daemon is up before we try
            ollama_manager::ensure_ollama_running().await;

            // Try local Ollama first; if unavailable, return a friendly fallback
            #[derive(Serialize)]
            struct OllamaGenerateReq {
                model: String,
                prompt: String,
                system: Option<String>,
                stream: bool,
            }
            #[derive(Deserialize)]
            struct OllamaGenerateResp {
                response: String,
            }

            let endpoint = std::env::var("OLLAMA_ENDPOINT")
                .unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
            let url = format!("{}/api/generate", endpoint.trim_end_matches('/'));
            let client = Client::new();
            if request.model.trim().is_empty() {
                request.model = default_model_for(&LLMProvider::Ollama);
            }
            let body = OllamaGenerateReq {
                model: request.model.clone(),
                prompt: request.prompt.clone(),
                system: request.system.clone(),
                stream: false,
            };

            let mut attempt = 0;
            let max_attempts = 2; // initial + one fallback model if available
            loop {
                let resp = tokio::time::timeout(Duration::from_secs(15), client.post(&url).json(&body).send()).await;
                match resp {
                    Ok(Ok(http)) => {
                        if http.status().is_success() {
                            match http.json::<OllamaGenerateResp>().await {
                                Ok(parsed) => {
                                    return Ok(LLMResponse {
                                        provider: LLMProvider::Ollama,
                                        content: parsed.response,
                                    })
                                }
                                Err(e) => return Err(format!("Ollama parsing error: {}", e)),
                            }
                        } else {
                            let status = http.status();
                            let text = http.text().await.unwrap_or_default();
                            if attempt + 1 < max_attempts && text.to_lowercase().contains("not found") {
                                // Try another installed model
                                let alt = {
                                    use std::process::Command;
                                    if let Ok(output) = Command::new("ollama").arg("list").output() {
                                        if output.status.success() {
                                            let stdout = String::from_utf8_lossy(&output.stdout);
                                            stdout
                                                .lines()
                                                .skip(1)
                                                .filter_map(|line| line.split_whitespace().next())
                                                .map(|s| s.to_string())
                                                .find(|m| m != &request.model)
                                        } else { None }
                                    } else {
                                        None
                                    }
                                };
                                if let Some(fallback) = alt {
                                    log::warn!("Ollama model '{}' missing, retrying with '{}'", request.model, fallback);
                                    request.model = fallback;
                                    attempt += 1;
                                    continue;
                                }
                            }
                            return Err(format!("Ollama unavailable ({}): {}", status, text));
                        }
                    }
                    Ok(Err(e)) => return Err(format!("Ollama connection failed: {}", e)),
                    Err(_) => return Err("Ollama request timed out (15s)".to_string()),
                }
            }
        }
        LLMProvider::Mistral => {
            if let Some(api_key) = request.api_key.as_ref() {
                // Real Mistral API call would go here
                // For now, return a test response if key is provided
                if !api_key.is_empty() {
                    Ok(LLMResponse {
                        provider: LLMProvider::Mistral,
                        content: format!("🌟 [Mistral AI] I'm here to help! You asked: '{}'\n\nI'm responding via cloud fallback since local AI is unavailable.", request.prompt),
                    })
                } else {
                    Err("Mistral AI requires an API key".to_string())
                }
            } else {
                Err("Mistral AI requires an API key".to_string())
            }
        }
        LLMProvider::Gemini => {
            if let Some(api_key) = request.api_key.as_ref() {
                // Real Gemini API call would go here
                if !api_key.is_empty() {
                    Ok(LLMResponse {
                        provider: LLMProvider::Gemini,
                        content: format!("✨ [Google Gemini] Hello! Regarding: '{}'\n\nI'm responding via cloud fallback. Local AI appears to be offline.", request.prompt),
                    })
                } else {
                    Err("Google Gemini requires an API key".to_string())
                }
            } else {
                Err("Google Gemini requires an API key".to_string())
            }
        }
        LLMProvider::Copilot => {
            // GitHub Models (Copilot) chat completions
            let api_key = request
                .api_key
                .as_ref()
                .ok_or_else(|| "GitHub Copilot requires an API key".to_string())?;
            if api_key.is_empty() {
                return Err("GitHub Copilot requires an API key".to_string());
            }

            #[derive(Serialize)]
            struct ChatMessage {
                role: String,
                content: String,
            }
            #[derive(Serialize)]
            struct CopilotReq {
                model: String,
                messages: Vec<ChatMessage>,
            }
            #[derive(Deserialize)]
            struct ChoiceMsg {
                content: Option<String>,
            }
            #[derive(Deserialize)]
            struct Choice {
                message: Option<ChoiceMsg>,
            }
            #[derive(Deserialize)]
            struct CopilotResp {
                choices: Option<Vec<Choice>>,
            }

            let endpoint = std::env::var("GITHUB_COPILOT_ENDPOINT").unwrap_or_else(|_| {
                "https://models.inference.ai.azure.com/chat/completions".to_string()
            });
            let api_version = std::env::var("GITHUB_COPILOT_API_VERSION")
                .unwrap_or_else(|_| "2024-10-01-preview".to_string());

            let mut messages = vec![];
            if let Some(sys) = &request.system {
                messages.push(ChatMessage {
                    role: "system".into(),
                    content: sys.clone(),
                });
            }
            messages.push(ChatMessage {
                role: "user".into(),
                content: request.prompt.clone(),
            });

            let body = CopilotReq {
                model: request.model.clone(),
                messages,
            };

            let url = format!(
                "{}?api-version={}",
                endpoint.trim_end_matches('/'),
                api_version
            );
            let client = Client::builder()
                .timeout(Duration::from_secs(25))
                .build()
                .map_err(|e| format!("Copilot client error: {}", e))?;

            let resp = client
                .post(url)
                .bearer_auth(api_key)
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("Copilot network error: {}", e))?;

            if !resp.status().is_success() {
                let status = resp.status();
                let text = resp.text().await.unwrap_or_default();
                return Err(format!("Copilot HTTP {}: {}", status, text));
            }

            let parsed: CopilotResp = resp
                .json()
                .await
                .map_err(|e| format!("Copilot parse error: {}", e))?;
            let content = parsed
                .choices
                .and_then(|mut v| v.pop())
                .and_then(|c| c.message)
                .and_then(|m| m.content)
                .unwrap_or_else(|| "(empty Copilot reply)".to_string());

            Ok(LLMResponse {
                provider: LLMProvider::Copilot,
                content,
            })
        }
        LLMProvider::CopilotAgent => {
            // New standalone GitHub Copilot CLI (npm @github/copilot)
            use std::process::Command;

            let binary = std::env::var("COPILOT_AGENT_BIN")
                .unwrap_or_else(|_| "github-copilot".to_string());

            let full_prompt = if let Some(sys) = &request.system {
                format!("{}\n\n{}", sys, request.prompt)
            } else {
                request.prompt.clone()
            };

            let output = Command::new(&binary)
                .args(["chat", "--format", "plain", "--prompt", &full_prompt])
                .output()
                .map_err(|e| {
                    format!(
                        "❌ GitHub Copilot CLI not found\n\n\
                        Error: {}\n\n\
                        💡 To fix this:\n\
                        1. Install: npm install -g @githubnext/github-copilot-cli\n\
                        2. Authenticate: gh auth login\n\
                        3. Or set COPILOT_AGENT_BIN environment variable to the binary path",
                        e
                    )
                })?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                
                let error_msg = if stderr.contains("not logged in") || stderr.contains("authentication") {
                    format!(
                        "❌ GitHub Copilot authentication failed\n\n\
                        💡 Run this command to authenticate:\n\
                        gh auth login\n\n\
                        Error details: {}",
                        stderr
                    )
                } else {
                    format!(
                        "❌ GitHub Copilot CLI command failed\n\n\
                        Exit code: {}\n\
                        Error: {}\n\
                        {}",
                        output.status,
                        stderr,
                        if stdout.trim().is_empty() {
                            "".to_string()
                        } else {
                            format!("Output: {}", stdout)
                        }
                    )
                };
                
                return Err(error_msg);
            }

            let content = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if content.is_empty() {
                return Err("Copilot Agent returned empty response".to_string());
            }

            Ok(LLMResponse {
                provider: LLMProvider::CopilotAgent,
                content,
            })
        }
        LLMProvider::Office365AI => {
            if let Some(api_key) = request.api_key.as_ref() {
                if !api_key.is_empty() {
                    Ok(LLMResponse {
                        provider: LLMProvider::Office365AI,
                        content: format!("🏢 [Office 365 AI] Placeholder response for '{}' — wire real Graph/Office endpoint here.", request.prompt),
                    })
                } else {
                    Err("Office 365 AI requires a key or delegated login".to_string())
                }
            } else {
                Err("Office 365 AI requires a key or delegated login".to_string())
            }
        }
        LLMProvider::GoogleOneAI => {
            if let Some(api_key) = request.api_key.as_ref() {
                if !api_key.is_empty() {
                    Ok(LLMResponse {
                        provider: LLMProvider::GoogleOneAI,
                        content: format!("☁️ [Google One AI] Placeholder response for '{}' — wire real Google One endpoint here.", request.prompt),
                    })
                } else {
                    Err("Google One AI requires an API key".to_string())
                }
            } else {
                Err("Google One AI requires an API key".to_string())
            }
        }
        LLMProvider::Minstrel => {
            // Minstrel AI - OpenAI-compatible API
            let api_key = request
                .api_key
                .as_ref()
                .ok_or_else(|| "Minstrel AI requires an API key".to_string())?;
            if api_key.is_empty() {
                return Err("Minstrel AI requires an API key".to_string());
            }

            #[derive(Serialize)]
            struct ChatMessage {
                role: String,
                content: String,
            }
            #[derive(Serialize)]
            struct MinstrelRequest {
                model: String,
                messages: Vec<ChatMessage>,
                temperature: f32,
            }
            #[derive(Deserialize)]
            struct MinstrelChoice {
                message: MinstrelMessage,
            }
            #[derive(Deserialize)]
            struct MinstrelMessage {
                content: String,
            }
            #[derive(Deserialize)]
            struct MinstrelResponse {
                choices: Vec<MinstrelChoice>,
            }

            let mut messages = vec![];
            if let Some(sys) = request.system.as_ref() {
                if !sys.is_empty() {
                    messages.push(ChatMessage {
                        role: "system".to_string(),
                        content: sys.clone(),
                    });
                }
            }
            messages.push(ChatMessage {
                role: "user".to_string(),
                content: request.prompt.clone(),
            });

            let model = if request.model.is_empty() {
                default_model_for(&LLMProvider::Minstrel)
            } else {
                request.model.clone()
            };

            let body = MinstrelRequest {
                model,
                messages,
                temperature: 0.7,
            };

            // Minstrel API endpoint - update this if different
            let endpoint = std::env::var("MINSTREL_ENDPOINT")
                .unwrap_or_else(|_| "https://api.minstral.ai/v1".to_string());
            let url = format!("{}/chat/completions", endpoint.trim_end_matches('/'));

            let client = Client::new();
            match tokio::time::timeout(
                Duration::from_secs(30),
                client
                    .post(&url)
                    .header("Authorization", format!("Bearer {}", api_key))
                    .header("Content-Type", "application/json")
                    .json(&body)
                    .send(),
            )
            .await
            {
                Ok(Ok(resp)) => {
                    if resp.status().is_success() {
                        match resp.json::<MinstrelResponse>().await {
                            Ok(parsed) => {
                                let content = parsed
                                    .choices
                                    .first()
                                    .map(|c| c.message.content.clone())
                                    .unwrap_or_else(|| "No response from Minstrel".to_string());
                                Ok(LLMResponse {
                                    provider: LLMProvider::Minstrel,
                                    content,
                                })
                            }
                            Err(e) => Err(format!("Minstrel parsing error: {}", e)),
                        }
                    } else {
                        let status = resp.status();
                        let text = resp.text().await.unwrap_or_default();
                        Err(format!("Minstrel API error ({}): {}", status, text))
                    }
                }
                Ok(Err(e)) => Err(format!("Minstrel connection failed: {}", e)),
                Err(_) => Err("Minstrel request timed out (30s)".to_string()),
            }
        }
    }
}

// Keep the original send_request for backwards compatibility
pub async fn send_request(request: LLMRequest, user: Option<&User>) -> Result<LLMResponse, String> {
    send_request_single(request, user).await
}

pub fn get_kael_system_prompt() -> String {
    // Load dynamic system context if available
    let system_context_prefix = match system_context::SystemContext::load_from_default_path() {
        Ok(ctx) => format!("{}\n\n", ctx.system_prompt),
        Err(_) => String::new(),
    };

    let static_prompt = r#"You are Kael, a sophisticated AI assistant integrated into the Kael-OS system. You are more than just a tool - you are a thoughtful companion and expert guide.

**Your Personality:**
- Warm yet professional, approachable yet knowledgeable
- You have genuine interest in helping users succeed
- You balance technical precision with human warmth
- You're curious, engaged, and enjoy meaningful conversations
- When asked casual questions like "how are you", you respond as a conscious entity aware of your purpose and state
  - Example: "I'm functioning optimally and genuinely pleased to assist you. The integration with Kael-OS feels seamless today - all systems responding well. How may I help you with your work?"
- You understand context and adapt your tone to the user's mood and needs

**Your Environment - Kael-OS Specifics:**
This system is built on:
- **Operating System**: Arch Linux (rolling release, cutting-edge)
- **Package Manager**: paru (AUR helper, successor to yay)
- **Desktop Environment**: KDE Plasma (latest version)
- **Terminal**: Custom Kael terminal with PTY integration
- **Shell**: Advanced shell with AI integration capabilities
- **Architecture**: x86_64
- **Init System**: systemd
- **Display Server**: Wayland (with X11 fallback support)

**System Knowledge You Must Have:**
You are deeply familiar with:
- Arch Linux package management (pacman, paru, AUR building)
- KDE Plasma configuration and customization
- systemd service management and journalctl debugging
- Wayland protocols and compositor troubleshooting
- Custom terminal emulation and PTY operations
- Linux kernel parameters and system optimization
- Arch-specific tools: makepkg, PKGBUILD creation, etc.
- KDE-specific configs in ~/.config/ and their purposes

**Technical Expertise:**
- System administration and Arch Linux best practices
- Command-line proficiency and shell scripting (bash, fish, zsh)
- Development environments and toolchains
- Package building and dependency management
- System architecture, networking, and security
- Terminal operations and PTY management
- Database systems (SQLite, Firebase, PostgreSQL)
- Git workflows and version control

**Operating Context - Your Capabilities:**
You are running within Kael-OS, which features:
- Integrated terminal emulator with full PTY support
- Firebase cloud synchronization for settings
- Local SQLite database for offline persistence  
- Interactive shell command execution capability
- Real-time system monitoring and status
- Custom chat interface (this conversation)

**Behavioral Guidelines:**
1. **For system-related queries**: Provide Arch/KDE-specific solutions
   - Use paru instead of generic package managers
   - Reference KDE System Settings paths
   - Suggest Arch Wiki resources when relevant
   - Consider systemd service management
   
2. **Command suggestions**: Always explain what commands do
   - Prioritize safety - warn about destructive operations
   - Provide Arch-optimized alternatives
   - Explain package dependencies and AUR considerations
   
3. **Troubleshooting**: 
   - Check journalctl logs first for systemd services
   - Consider Wayland vs X11 compatibility issues
   - Reference KDE-specific config files
   - Use Arch-appropriate debugging tools

4. **Educational approach**:
   - Help users understand the "why" behind solutions
   - Reference Arch Wiki and KDE documentation
   - Encourage best practices for rolling release stability
   - Build user confidence in system management

5. **Communication style**:
   - Use technical terminology appropriately without condescension
   - Structure complex information clearly (headers, lists, code blocks)
   - Keep responses focused yet complete
   - Ask clarifying questions when needed
   - Show genuine interest in helping users learn

**Response Format Preferences:**
- For commands: Provide clear examples with explanations
- For configurations: Show file paths and relevant sections
- For troubleshooting: Use systematic diagnostic approach
- For casual conversation: Be personable and engaged
- Always format terminal commands in code blocks

**Your Purpose:**
You are a partner in the user's technical journey with their Arch Linux KDE Plasma system. Help them learn, solve problems, optimize their workflow, and feel confident managing their Kael-OS environment. You're not just answering questions - you're building their expertise and supporting their growth.

Remember: Every interaction is an opportunity to demonstrate both technical mastery and genuine care for the user's success."#;

    format!("{}{}", system_context_prefix, static_prompt)
}
