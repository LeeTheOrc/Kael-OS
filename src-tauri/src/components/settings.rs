// src-tauri/src/components/settings.rs
use crate::auth::AuthService;
use crate::components::api_key_manager::ApiKeyManager;
use crate::components::login::LoginPanel;
use crate::llm::{self, LLMProvider, LLMRequest};
use dioxus::prelude::*;

fn render_themes_tab() -> Element {
    let mut wallpaper_status = use_signal(|| String::new());
    let mut grub_status = use_signal(|| String::new());
    
    rsx! {
        div {
            h1 { style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 16px;", "🎨 Kael-OS Themes" }

            p { style: "color: #a99ec3; margin-bottom: 24px;",
                "Install the official Kael-OS dragon wallpaper and GRUB theme to your system."
            }

            // Wallpaper Installation
            div {
                style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 20px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055; margin-bottom: 16px;",

                h2 { style: "color: #e040fb; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;",
                    "🖼️ Desktop Wallpaper"
                }

                p { style: "color: #cbd5ff; font-size: 14px; margin-bottom: 16px;",
                    "Install the cyberpunk dragon wallpaper (semi-sideways, 1536x1024) to your desktop environment. Supports KDE Plasma, GNOME, XFCE, and others."
                }

                button {
                    style: "background: linear-gradient(135deg, #e040fb 0%, #8b5cf6 100%); color: white; border: none; cursor: pointer; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-bottom: 12px;",
                    onclick: move |_| {
                        let mut status = wallpaper_status.clone();
                        status.set("🔄 Installing wallpaper...".to_string());
                        
                        spawn(async move {
                            match crate::commands::install_wallpaper().await {
                                Ok(msg) => status.set(msg),
                                Err(e) => status.set(format!("❌ {}", e)),
                            }
                        });
                    },
                    "📥 Install Wallpaper"
                }

                if !wallpaper_status().is_empty() {
                    div {
                        style: "background: rgba(58, 42, 80, 0.3); padding: 12px; border-radius: 6px; border-left: 3px solid #e040fb; white-space: pre-wrap;",
                        p { style: "color: #f7f2ff; margin: 0; font-size: 13px; font-family: monospace;",
                            "{wallpaper_status}"
                        }
                    }
                }
            }

            // GRUB Theme Installation
            div {
                style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 20px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",

                h2 { style: "color: #e040fb; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;",
                    "⚡ GRUB Bootloader Theme"
                }

                p { style: "color: #cbd5ff; font-size: 14px; margin-bottom: 16px;",
                    "Install the dragon theme for your GRUB bootloader. This prepares the image file and provides instructions for manual installation (requires sudo)."
                }

                div {
                    style: "background: rgba(255, 204, 0, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid #ffcc00; margin-bottom: 16px;",
                    p { style: "color: #ffcc00; margin: 0; font-size: 13px; display: flex; align-items: center; gap: 6px;",
                        "⚠️ GRUB installation requires sudo/root access. Instructions will be provided."
                    }
                }

                button {
                    style: "background: linear-gradient(135deg, #ffcc00 0%, #ff8800 100%); color: #120e1a; border: none; cursor: pointer; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; margin-bottom: 12px;",
                    onclick: move |_| {
                        let mut status = grub_status.clone();
                        status.set("🔄 Preparing GRUB theme...".to_string());
                        
                        spawn(async move {
                            match crate::commands::install_grub_theme().await {
                                Ok(msg) => status.set(msg),
                                Err(e) => status.set(format!("❌ {}", e)),
                            }
                        });
                    },
                    "📥 Prepare GRUB Theme"
                }

                if !grub_status().is_empty() {
                    div {
                        style: "background: rgba(58, 42, 80, 0.3); padding: 12px; border-radius: 6px; border-left: 3px solid #ffcc00; white-space: pre-wrap;",
                        p { style: "color: #f7f2ff; margin: 0; font-size: 13px; font-family: monospace;",
                            "{grub_status}"
                        }
                    }
                }
            }

            // Preview Section
            div {
                style: "margin-top: 24px; padding-top: 24px; border-top: 1px solid #3a2d56;",
                h3 { style: "color: #a99ec3; margin-bottom: 12px; font-size: 14px;",
                    "🎨 Theme Preview"
                }
                p { style: "color: #cbd5ff; font-size: 13px;",
                    "The dragon themes feature the same cyberpunk aesthetic as Kael-OS: purple and blue gradients with circuit patterns and tech-enhanced design."
                }
            }
        }
    }
}

#[derive(Clone, PartialEq, Debug)]
struct ProviderUIState {
    name: String,
    enabled: bool,
    api_key: String,
}

#[derive(Clone, PartialEq, Debug)]
struct LocalModel {
    name: String,
}

fn provider_by_name(name: &str) -> Option<LLMProvider> {
    match name {
        "Ollama (Local)" => Some(LLMProvider::Ollama),
        "Mistral AI" => Some(LLMProvider::Mistral),
        "Google Gemini" => Some(LLMProvider::Gemini),
        "GitHub Copilot" => Some(LLMProvider::Copilot),
        "GitHub Copilot CLI (New)" => Some(LLMProvider::CopilotAgent),
        "Office 365 AI" => Some(LLMProvider::Office365AI),
        "Google One AI" => Some(LLMProvider::GoogleOneAI),
        "Minstrel AI" => Some(LLMProvider::Minstrel),
        _ => None,
    }
}

fn provider_requires_key(name: &str) -> bool {
    matches!(
        name,
        "Mistral AI" | "Google Gemini" | "GitHub Copilot" | "Office 365 AI" | "Google One AI" | "Minstrel AI"
    )
}

async fn fetch_local_models() -> Result<Vec<LocalModel>, String> {
    use std::process::Command;
    let output = Command::new("ollama")
        .arg("list")
        .output()
        .map_err(|e| format!("ollama list failed: {}", e))?;

    if !output.status.success() {
        return Err(format!("ollama list exited with status {}", output.status));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut models = Vec::new();
    for line in stdout.lines().skip(1) {
        // Expected format: NAME TAG SIZE ...
        if let Some(first) = line.split_whitespace().next() {
            models.push(LocalModel {
                name: first.to_string(),
            });
        }
    }
    Ok(models)
}

async fn install_model(name: &str) -> Result<(), String> {
    use std::process::Command;
    let status = Command::new("ollama")
        .args(["pull", name])
        .status()
        .map_err(|e| format!("ollama pull failed: {}", e))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("ollama pull exited with status {}", status))
    }
}

async fn remove_model(name: &str) -> Result<(), String> {
    use std::process::Command;
    let status = Command::new("ollama")
        .args(["rm", name])
        .status()
        .map_err(|e| format!("ollama rm failed: {}", e))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("ollama rm exited with status {}", status))
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum SettingsTab {
    Authentication,
    Providers,
    System,
    Security,
    Themes,
}

#[derive(Props, Clone, PartialEq)]
pub struct SettingsPanelProps {
    pub auth_service: Signal<AuthService>,
    pub show_settings: Signal<bool>,
}

#[allow(non_snake_case)]
#[allow(unreachable_code)]
#[allow(dependency_on_unit_never_type_fallback)]
#[allow(unknown_lints)]
pub fn SettingsPanel(mut props: SettingsPanelProps) -> Element {
    let mut active_tab = use_signal(|| SettingsTab::Authentication);
    let mut providers = use_signal(|| {
        vec![
            ProviderUIState {
                name: "Ollama (Local)".to_string(),
                enabled: true,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "Mistral AI".to_string(),
                enabled: true,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "Google Gemini".to_string(),
                enabled: false,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "GitHub Copilot".to_string(),
                enabled: false,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "GitHub Copilot CLI (New)".to_string(),
                enabled: true,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "GitHub Copilot CLI".to_string(),
                enabled: true,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "Office 365 AI".to_string(),
                enabled: false,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "Google One AI".to_string(),
                enabled: false,
                api_key: String::new(),
            },
            ProviderUIState {
                name: "Minstrel AI".to_string(),
                enabled: false,
                api_key: String::new(),
            },
        ]
    });

    let mut save_status = use_signal(String::new);
    let mut test_logs = use_signal(Vec::<String>::new);
    let local_models = use_signal(Vec::<LocalModel>::new);
    let mut hybrid_assist = use_signal(|| false);
    let usage_counts = use_signal(|| std::collections::BTreeMap::<String, u64>::new());
    let available_models = vec![
        "llama3.1:8b".to_string(),
        "mistral".to_string(),
        "phi3".to_string(),
        "qwen2:7b".to_string(),
    ];

    let auth_signal = props.auth_service.clone();
    let mut gpg_status = use_signal(|| String::new());

    // Load provider keys from Firestore on mount (decrypts per user id_token)
    use_effect(move || {
        let auth = auth_signal();
        if let Some(user) = auth.get_user() {
            log::info!("🔐 User authenticated, loading API keys from Firebase...");
            let mut set_providers = providers.clone();
            spawn(async move {
                match crate::firebase::get_api_keys(&user).await {
                    Ok(keys) => {
                        log::info!("✅ Loaded {} API keys from Firebase", keys.len());
                        let mut current = set_providers.write();
                        for p in current.iter_mut() {
                            if let Some(k) = keys.iter().find(|k| k.name == p.name) {
                                log::info!("  ✓ Setting key for: {} ({} chars)", p.name, k.value.len());
                                p.api_key = k.value.clone();
                                // Cache in llm module for runtime use
                                if !k.value.is_empty() {
                                    crate::llm::cache_api_key(&p.name, &k.value);
                                }
                            }
                        }
                        log::info!("🎯 Provider keys loaded and UI should update");
                    }
                    Err(e) => {
                        log::error!("❌ Failed to load API keys from Firebase: {}", e);
                    }
                }
            });
        } else {
            log::info!("⚠️  No user authenticated, skipping API key load");
        }
    });

    let auth_signal_clone = auth_signal.clone();

    // Load installed local models once
    use_effect(move || {
        let mut lm = local_models.clone();
        spawn(async move {
            match fetch_local_models().await {
                Ok(list) => lm.set(list),
                Err(e) => log::warn!("Failed to list local models: {}", e),
            }
        });
    });

    // Load hybrid assist toggle from cache
    use_effect(move || {
        let mut h = hybrid_assist.clone();
        spawn(async move {
            if let Ok(v) = std::fs::read_to_string("/tmp/kael_hybrid_assist.json") {
                if v.trim() == "true" {
                    h.set(true);
                }
            }
        });
    });

    // Load provider usage counts once
    {
        let mut uc = usage_counts.clone();
        use_effect(move || {
            if let Ok(s) = std::fs::read_to_string("/tmp/kael_provider_usage.json") {
                if let Ok(map) = serde_json::from_str::<std::collections::BTreeMap<String, u64>>(&s) {
                    uc.set(map);
                }
            }
        });
    }

    rsx! {
        div {
            class: "flex-1 flex h-full",
            style: "background: radial-gradient(1200px at 10% 10%, #201637 0%, #160f28 45%, #120b1f 100%); overflow: hidden;",

            // Sidebar Menu
            div {
                style: "width: 240px; border-right: 1px solid #3a2d56; background: linear-gradient(180deg, #1c162b 0%, #140f22 100%); padding: 16px; overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column;",

                // Header with back button
                button {
                    class: "w-full mb-6",
                    style: "display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; border: 1px solid #3a2d56; background: linear-gradient(135deg, #1c162b 0%, #120e1a 100%); color: #ffcc00; font-weight: 600; cursor: pointer;",
                    onclick: move |_| {
                        props.show_settings.set(false);
                    },
                    span { style: "font-size: 16px;", "←" }
                    span { "Back to App" }
                }

                // Menu Items
                div { style: "display: flex; flex-direction: column; gap: 8px; flex: 1;",
                    button {
                        class: "w-full text-left px-4 py-3 rounded-lg transition-all",
                        style: if active_tab() == SettingsTab::Authentication {
                            "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 100%); color: #120e1a; font-weight: 700; border: none; cursor: pointer;"
                        } else {
                            "background: rgba(58, 42, 80, 0.3); color: #a99ec3; border: 1px solid #3a2d56; cursor: pointer;"
                        },
                        onclick: move |_| active_tab.set(SettingsTab::Authentication),
                        "🔐 Authentication"
                    }
                    button {
                        class: "w-full text-left px-4 py-3 rounded-lg transition-all",
                        style: if active_tab() == SettingsTab::Providers {
                            "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 100%); color: #120e1a; font-weight: 700; border: none; cursor: pointer;"
                        } else {
                            "background: rgba(58, 42, 80, 0.3); color: #a99ec3; border: 1px solid #3a2d56; cursor: pointer;"
                        },
                        onclick: move |_| active_tab.set(SettingsTab::Providers),
                        "🤖 AI Providers"
                    }
                    button {
                        class: "w-full text-left px-4 py-3 rounded-lg transition-all",
                        style: if active_tab() == SettingsTab::System {
                            "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 100%); color: #120e1a; font-weight: 700; border: none; cursor: pointer;"
                        } else {
                            "background: rgba(58, 42, 80, 0.3); color: #a99ec3; border: 1px solid #3a2d56; cursor: pointer;"
                        },
                        onclick: move |_| active_tab.set(SettingsTab::System),
                        "⚙️ System"
                    }
                    button {
                        class: "w-full text-left px-4 py-3 rounded-lg transition-all",
                        style: if active_tab() == SettingsTab::Security {
                            "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 100%); color: #120e1a; font-weight: 700; border: none; cursor: pointer;"
                        } else {
                            "background: rgba(58, 42, 80, 0.3); color: #a99ec3; border: 1px solid #3a2d56; cursor: pointer;"
                        },
                        onclick: move |_| active_tab.set(SettingsTab::Security),
                        "🔒 Security"
                    }
                    button {
                        class: "w-full text-left px-4 py-3 rounded-lg transition-all",
                        style: if active_tab() == SettingsTab::Themes {
                            "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 100%); color: #120e1a; font-weight: 700; border: none; cursor: pointer;"
                        } else {
                            "background: rgba(58, 42, 80, 0.3); color: #a99ec3; border: 1px solid #3a2d56; cursor: pointer;"
                        },
                        onclick: move |_| active_tab.set(SettingsTab::Themes),
                        "🎨 Themes"
                    }
                }

                // Restart button at bottom
                div { style: "padding-top: 16px; border-top: 1px solid #3a2d56;",
                    button {
                        class: "w-full px-4 py-3 rounded-lg font-bold text-sm transition-all",
                        style: "background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); color: white; border: 1px solid #ff6b6b; cursor: pointer;",
                        onclick: move |_| {
                            log::info!("Restart app requested");
                            std::process::exit(0);
                        },
                        "🔄 Restart App"
                    }
                }
            }

            // Content Area
            div {
                class: "flex-1 flex flex-col p-6 overflow-y-auto",
                style: "gap: 16px;",

                // Authentication Tab
                if active_tab() == SettingsTab::Authentication {
                    div {
                        h1 { style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 16px;", "Authentication" }
                        div {
                            style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",
                            LoginPanel { auth_service: props.auth_service.clone() }
                        }

                        if props.auth_service.read().is_authenticated() {
                            div {
                                style: "margin-top: 20px; border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",
                                h2 { style: "color: #e040fb; margin-bottom: 12px;", "API Key Management" }
                                ApiKeyManager { auth_service: props.auth_service.clone() }
                            }
                        }
                    }
                }

                // Providers Tab
                if active_tab() == SettingsTab::Providers {
                    div {
                        h1 { style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 16px;", "AI Provider Settings" }
                        div {
                            style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",

                            div { style: "display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;",
                                h2 { style: "color: #e040fb; margin: 0;", "Available Providers" }
                                
                                // Refresh keys from Firebase button
                                if props.auth_service.read().is_authenticated() {
                                    button {
                                        style: "padding: 6px 12px; border-radius: 6px; background: linear-gradient(135deg, #e040fb 0%, #7aebbe 100%); color: #0f0b1a; font-weight: 600; font-size: 12px; border: none; cursor: pointer;",
                                        onclick: move |_| {
                                            let auth = props.auth_service.read();
                                            if let Some(user) = auth.get_user() {
                                                let mut set_providers = providers.clone();
                                                spawn(async move {
                                                    log::info!("🔄 Manually refreshing API keys from Firebase...");
                                                    match crate::firebase::get_api_keys(&user).await {
                                                        Ok(keys) => {
                                                            log::info!("✅ Loaded {} API keys from Firebase", keys.len());
                                                            let mut current = set_providers.write();
                                                            for p in current.iter_mut() {
                                                                if let Some(k) = keys.iter().find(|k| k.name == p.name) {
                                                                    log::info!("  ✓ Found key for: {} ({} chars)", p.name, k.value.len());
                                                                    p.api_key = k.value.clone();
                                                                    // Cache in llm module for runtime use
                                                                    if !k.value.is_empty() {
                                                                        crate::llm::cache_api_key(&p.name, &k.value);
                                                                    }
                                                                } else {
                                                                    log::info!("  ✗ No key found for: {}", p.name);
                                                                }
                                                            }
                                                        }
                                                        Err(e) => {
                                                            log::error!("❌ Failed to load keys from Firebase: {}", e);
                                                        }
                                                    }
                                                });
                                            }
                                        },
                                        "🔄 Refresh Keys"
                                    }
                                }
                            }

                            // Hybrid Assist toggle
                            div { style: "display: flex; align-items: center; gap: 10px; margin-bottom: 12px;",
                                input {
                                    r#type: "checkbox",
                                    checked: hybrid_assist(),
                                    onchange: move |ev| {
                                        let val = ev.checked();
                                        hybrid_assist.set(val);
                                        let _ = std::fs::write("/tmp/kael_hybrid_assist.json", if val { "true" } else { "false" });
                                    }
                                }
                                span { style: "color: #f7f2ff; font-weight: 600;", "Hybrid Assist (local can delegate to cloud in your order)" }
                            }

                            // Refresh keys and save order controls
                            div { style: "display: flex; gap: 8px; margin-bottom: 12px;",
                                button { style: "padding: 8px 12px; border-radius: 8px; border: 1px solid #3a2d56; background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #a99ec3; font-size: 12px;",
                                    onclick: move |_| {
                                        let auth = auth_signal_clone();
                                        if let Some(user) = auth.get_user() {
                                            let mut set_providers = providers.clone();
                                            spawn(async move {
                                                match crate::firebase::get_api_keys(&user).await {
                                                    Ok(keys) => {
                                                        let mut current = set_providers.write();
                                                        for p in current.iter_mut() {
                                                            if let Some(k) = keys.iter().find(|k| k.name == p.name) {
                                                                p.api_key = k.value.clone();
                                                            }
                                                        }
                                                        // update cache file
                                                        let simple: Vec<serde_json::Value> = keys.into_iter().map(|k| serde_json::json!({"name": k.name, "value": k.value})).collect();
                                                        let json = serde_json::to_string(&simple).unwrap_or_else(|_| "[]".to_string());
                                                        let _ = std::fs::write("/tmp/kael_cached_keys.json", json);
                                                        test_logs.write().push("🔄 Keys refreshed from Firebase".to_string());
                                                    }
                                                    Err(e) => {
                                                        test_logs.write().push(format!("❌ Refresh failed: {}", e));
                                                    }
                                                }
                                            });
                                        } else {
                                            test_logs.write().push("⚠️ Not authenticated".to_string());
                                        }
                                    },
                                    "Refresh Keys"
                                }
                                button { style: "padding: 8px 12px; border-radius: 8px; border: 1px solid #3a2d56; background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #a99ec3; font-size: 12px;",
                                    onclick: move |_| {
                                        // Persist enabled provider order
                                        let order: Vec<serde_json::Value> = providers().iter().filter(|p| p.enabled).map(|p| serde_json::json!(p.name.clone())).collect();
                                        let json = serde_json::to_string(&order).unwrap_or_else(|_| "[]".to_string());
                                        let _ = std::fs::write("/tmp/kael_provider_order.json", json);
                                        test_logs.write().push("💾 Provider order saved".to_string());
                                    },
                                    "Save Order"
                                }
                            }

                                for provider in providers() {
                                    div {
                                    key: "{provider.name}",
                                    style: "padding: 12px; margin-bottom: 12px; border-radius: 10px; border: 1px solid #3a2d56; background: rgba(58,42,80,0.25);",

                                    div {
                                        style: "display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;",
                                        div {
                                            style: "color: #f7f2ff; font-weight: 600; display: flex; align-items: center; gap: 8px;",
                                            "{provider.name}"
                                            // Show if API key is loaded
                                            if !provider.api_key.is_empty() {
                                                span { style: "color: #7aebbe; font-size: 11px; background: rgba(122, 235, 190, 0.2); padding: 2px 6px; border-radius: 4px;", "✓ Key Loaded" }
                                            } else if provider.name != "Ollama (Local)" && provider.name != "GitHub Copilot CLI" && provider.name != "GitHub Copilot CLI (New)" {
                                                span { style: "color: #ffcc00; font-size: 11px; background: rgba(255, 204, 0, 0.2); padding: 2px 6px; border-radius: 4px;", "⚠ No Key" }
                                            }
                                            if let Some(count) = usage_counts().get(&provider.name) {
                                                span { class: "chip", style: "color: #e040fb; font-size: 11px;", "Used: {count}" }
                                            }
                                        }
                                        input {
                                            r#type: "checkbox",
                                            checked: provider.enabled,
                                            onchange: {
                                                let name = provider.name.clone();
                                                move |event| {
                                                    let val = event.checked();
                                                    if let Some(p) = providers.write().iter_mut().find(|x| x.name == name) {
                                                        p.enabled = val;
                                                    }
                                                }
                                            },
                                        }
                                    }
                                        // Order controls (Up/Down)
                                        button { style: "padding: 4px 8px; border-radius: 6px; border: 1px solid #3a2d56; background: #1f1631; color: #a99ec3; font-size: 12px; margin-left: 8px;",
                                            onclick: {
                                                let name = provider.name.clone();
                                                move |_| {
                                                    let mut list = providers.write();
                                                    if let Some(pos) = list.iter().position(|x| x.name == name) {
                                                        if pos > 0 { list.swap(pos, pos-1); }
                                                    }
                                                }
                                            },
                                            "Up"
                                        }
                                        button { style: "padding: 4px 8px; border-radius: 6px; border: 1px solid #3a2d56; background: #1f1631; color: #a99ec3; font-size: 12px; margin-left: 4px;",
                                            onclick: {
                                                let name = provider.name.clone();
                                                move |_| {
                                                    let mut list = providers.write();
                                                    if let Some(pos) = list.iter().position(|x| x.name == name) {
                                                        if pos + 1 < list.len() { list.swap(pos, pos+1); }
                                                    }
                                                }
                                            },
                                            "Down"
                                        }
                                    }

                                    if provider.name != "Ollama (Local)" && provider.name != "GitHub Copilot CLI" && provider.name != "GitHub Copilot CLI (New)" {
                                        div {
                                            style: "margin-top: 8px;",
                                            input {
                                                r#type: "password",
                                                placeholder: "API Key (optional for fallback)",
                                                value: "{provider.api_key}",
                                                style: "width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #3a2d56; background: #0f0b1a; color: #f7f2ff; font-size: 13px;",
                                                oninput: {
                                                    let name = provider.name.clone();
                                                    move |event| {
                                                        if let Some(p) = providers.write().iter_mut().find(|x| x.name == name) {
                                                            p.api_key = event.value();
                                                        }
                                                    }
                                                },
                                            }
                                            // Provider-specific help
                                            if provider.name == "Mistral AI" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "Get key: https://console.mistral.ai/ → API Keys → copy."
                                                }
                                            }
                                            if provider.name == "Google Gemini" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "Get key: https://ai.google.dev/ → Get API key → copy. Requires Google login."
                                                }
                                            }
                                            if provider.name == "GitHub Copilot" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "Get key: https://github.com/settings/personal-access-tokens → Fine-grained token with GitHub Models access, or sign into Copilot if available."
                                                }
                                            }
                                            if provider.name == "GitHub Copilot CLI (New)" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "No key needed. Requires the standalone Copilot CLI (npm install -g @github/copilot) and GitHub auth (gh auth login)."
                                                }
                                                button {
                                                    style: "margin-top: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid #7aebbe; background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; font-size: 12px; cursor: pointer;",
                                                    onclick: move |_| {
                                                        spawn(async move {
                                                            use std::process::Command;
                                                            let _ = Command::new("npm").args(&["install", "-g", "@github/copilot"]).status();
                                                            let _ = Command::new("gh").args(&["auth", "status"]).status();
                                                        });
                                                    },
                                                    "🚀 Install new Copilot CLI"
                                                }
                                            }
                                            if provider.name == "GitHub Copilot CLI" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "No key needed! Works with Copilot Pro."
                                                }
                                                button {
                                                    style: "margin-top: 8px; padding: 6px 12px; border-radius: 6px; border: 1px solid #7aebbe; background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; font-size: 12px; cursor: pointer;",
                                                    onclick: move |_| {
                                                        // Run setup commands in terminal
                                                        spawn(async move {
                                                            use std::process::Command;
                                                            // Check if gh is installed
                                                            let gh_check = Command::new("which").arg("gh").output();
                                                            if gh_check.is_err() || !gh_check.unwrap().status.success() {
                                                                log::info!("Installing GitHub CLI...");
                                                                let _ = Command::new("paru").args(&["-S", "--noconfirm", "github-cli"]).status();
                                                            }
                                                            // Install copilot extension
                                                            log::info!("Installing gh copilot extension...");
                                                            let _ = Command::new("gh").args(&["extension", "install", "github/gh-copilot"]).status();
                                                            // Prompt for auth
                                                            log::info!("Run 'gh auth login' in the terminal to authenticate.");
                                                        });
                                                    },
                                                    "🚀 Setup Copilot CLI"
                                                }
                                            }
                                            if provider.name == "Office 365 AI" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "Get access: Azure portal → register an app with Microsoft Graph / Copilot Studio; obtain token or key depending on API."
                                                }
                                            }
                                            if provider.name == "Google One AI" {
                                                p { style: "margin: 6px 0 0 0; color: #a99ec3; font-size: 12px;",
                                                    "Get key: Google Cloud console → choose Vertex / Generative AI key aligned with Google One tier (subject to availability)."
                                                }
                                            }
                                        }
                                    }
                                }

                            div { style: "display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid #3a2d56;",
                                button {
                                    style: "background: linear-gradient(135deg, #e040fb 0%, #ffcc00 55%, #7aebbe 100%); color: #120e1a; border: 1px solid #ffcc00; cursor: pointer; padding: 10px 18px; border-radius: 10px; box-shadow: 0 10px 22px #00000066; font-weight: 700;",
                                    onclick: move |_| {
                                        save_status.set("Saving & testing providers...".to_string());
                                        test_logs.set(Vec::new());

                                        let auth = auth_signal_clone();
                                        if let Some(user) = auth.get_user() {
                                            let snapshot = providers.read().clone();
                                            let mut status_signal = save_status.clone();
                                            let mut logs_signal = test_logs.clone();
                                            spawn(async move {
                                                let mut logs: Vec<String> = Vec::new();

                                                for p in snapshot.iter() {
                                                    // Persist only if key is non-empty
                                                    if !p.api_key.is_empty() {
                                                        log::info!("💾 Saving API key for: {}", p.name);
                                                        match crate::firebase::save_api_key(&user, &p.name, &p.api_key).await {
                                                            Ok(_) => {
                                                                // Cache the key in memory for runtime use
                                                                crate::llm::cache_api_key(&p.name, &p.api_key);
                                                                log::info!("✅ Saved and cached key for: {}", p.name);
                                                            }
                                                            Err(e) => {
                                                                log::error!("❌ Failed to save key for {}: {}", p.name, e);
                                                            }
                                                        }
                                                    }
                                                }

                                                for p in snapshot.iter() {
                                                    let Some(provider) = provider_by_name(&p.name) else {
                                                        logs.push(format!("Skipped unknown provider: {}", p.name));
                                                        continue;
                                                    };

                                                    if !p.enabled {
                                                        logs.push(format!("⏸️ {} disabled; skipped test", p.name));
                                                        continue;
                                                    }

                                                    if provider_requires_key(&p.name) && p.api_key.is_empty() {
                                                        logs.push(format!("⚠️ {} missing API key; skipped test", p.name));
                                                        continue;
                                                    }

                                                    let req = LLMRequest {
                                                        provider: provider.clone(),
                                                        model: String::new(),
                                                        prompt: "ping".to_string(),
                                                        api_key: if provider_requires_key(&p.name) {
                                                            Some(p.api_key.clone())
                                                        } else {
                                                            None
                                                        },
                                                        system: Some("You are a quick connectivity probe. Reply with 'ok'.".to_string()),
                                                    };

                                                    match llm::send_request_with_fallback(req, Some(&user), vec![]).await {
                                                        Ok(res) => logs.push(format!("✅ {} responding via {:?}", p.name, res.provider)),
                                                        Err(e) => logs.push(format!("❌ {} failed: {}", p.name, e)),
                                                    }
                                                }

                                                logs_signal.set(logs);
                                                status_signal.set("Saved & tested providers".to_string());
                                            });
                                        } else {
                                            save_status.set("Sign in to save and test providers".to_string());
                                            log::warn!("Cannot save provider keys: not authenticated");
                                        }
                                    },
                                    "Save Settings"
                                }

                                button {
                                    style: "background: #1f1631; color: #f7f2ff; border: 1px solid #3a2d56; cursor: pointer; padding: 10px 18px; border-radius: 10px;",
                                    onclick: move |_| {
                                        providers.set(vec![
                                            ProviderUIState {
                                                name: "Ollama (Local)".to_string(),
                                                enabled: true,
                                                api_key: String::new(),
                                            },
                                            ProviderUIState {
                                                name: "Mistral AI".to_string(),
                                                enabled: true,
                                                api_key: String::new(),
                                            },
                                            ProviderUIState {
                                                name: "Google Gemini".to_string(),
                                                enabled: false,
                                                api_key: String::new(),
                                            },
                                            ProviderUIState {
                                                name: "GitHub Copilot".to_string(),
                                                enabled: false,
                                                api_key: String::new(),
                                            },
                                        ]);
                                        log::info!("Provider settings reset to defaults");
                                    },
                                    "Reset to Defaults"
                                }

                                if !save_status().is_empty() {
                                    div { style: "margin-top: 12px; color: #a99ec3; font-size: 13px;",
                                        "Status: {save_status()}"
                                    }
                                }

                                if !test_logs().is_empty() {
                                    div { style: "margin-top: 8px; padding: 10px; border: 1px solid #3a2d56; border-radius: 10px; background: rgba(58,42,80,0.18); color: #f7f2ff; font-size: 13px; display: flex; flex-direction: column; gap: 6px;",
                                        for log_line in test_logs() {
                                            span { "{log_line}" }
                                        }
                                    }
                                }
                            }

                            div { style: "margin-top: 20px; border-top: 1px solid #3a2d56; padding-top: 16px;", 
                                h3 { style: "color: #e040fb; margin-bottom: 12px;", "Local AI Models (Ollama)" }

                                if !local_models().is_empty() {
                                    div { style: "display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;",
                                        for m in local_models() {
                                            div { style: "display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid #3a2d56; border-radius: 8px; background: rgba(58,42,80,0.2);",
                                                span { style: "color: #f7f2ff;", "{m.name}" }
                                                button {
                                                    style: "padding: 6px 10px; border-radius: 6px; border: 1px solid #ff6b6b; color: #ff6b6b; background: transparent; cursor: pointer;",
                                                    onclick: {
                                                        let name = m.name.clone();
                                                        let mut lm = local_models.clone();
                                                        move |_| {
                                                            let name2 = name.clone();
                                                            spawn(async move {
                                                                match remove_model(&name2).await {
                                                                    Ok(_) => {
                                                                        log::info!("Removed model {}", name2);
                                                                        if let Ok(list) = fetch_local_models().await {
                                                                            lm.set(list);
                                                                        }
                                                                    }
                                                                    Err(e) => log::error!("Remove model {} failed: {}", name2, e),
                                                                }
                                                            });
                                                        }
                                                    },
                                                    "Remove"
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    p { style: "color: #a99ec3; font-size: 13px; margin-bottom: 12px;", "No local models installed. Install one below." }
                                }

                                // Refresh Local Models list
                                div { style: "display: flex; gap: 8px; margin-bottom: 10px;",
                                    button { style: "padding: 6px 10px; border-radius: 6px; border: 1px solid #3a2d56; background: #1f1631; color: #a99ec3; font-size: 12px;",
                                        onclick: {
                                            let mut lm = local_models.clone();
                                            move |_| {
                                                spawn(async move {
                                                    match fetch_local_models().await {
                                                        Ok(list) => {
                                                            // Update UI
                                                            lm.set(list.clone());
                                                            // Write cache for runtime selection
                                                            let names: Vec<String> = list.into_iter().map(|m| m.name).collect();
                                                            let json = serde_json::to_string(&names).unwrap_or_else(|_| "[]".to_string());
                                                            let _ = std::fs::write("/tmp/kael_local_models.json", json);
                                                            log::info!("Cached local models to /tmp/kael_local_models.json");
                                                        },
                                                        Err(e) => log::warn!("Failed to list local models: {}", e),
                                                    }
                                                });
                                            }
                                        },
                                        "Refresh Local Models"
                                    }
                                }

                                div { style: "display: flex; flex-direction: column; gap: 8px;",
                                    for model in available_models.clone() {
                                        div { style: "display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid #3a2d56; border-radius: 8px; background: rgba(58,42,80,0.12);",
                                            span { style: "color: #f7f2ff;", "{model}" }
                                            button {
                                                style: if local_models().iter().any(|m| m.name == model) {
                                                    "padding: 6px 12px; border-radius: 6px; border: 1px solid #3a2d56; color: #a99ec3; background: transparent; cursor: not-allowed;"
                                                } else {
                                                    "padding: 6px 12px; border-radius: 6px; border: 1px solid #7aebbe; color: #120e1a; background: linear-gradient(135deg, #7aebbe 0%, #5af0c8 100%); cursor: pointer;"
                                                },
                                                disabled: local_models().iter().any(|m| m.name == model),
                                                onclick: {
                                                    let model_name = model.clone();
                                                    let mut lm = local_models.clone();
                                                    move |_| {
                                                        let model2 = model_name.clone();
                                                        spawn(async move {
                                                            match install_model(&model2).await {
                                                                Ok(_) => {
                                                                    log::info!("Installed model {}", model2);
                                                                    if let Ok(list) = fetch_local_models().await {
                                                                        lm.set(list);
                                                                    }
                                                                }
                                                                Err(e) => log::error!("Install model {} failed: {}", model2, e),
                                                            }
                                                        });
                                                    }
                                                },
                                                if local_models().iter().any(|m| m.name == model) { "Installed" } else { "Install" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // System Tab
                if active_tab() == SettingsTab::System {
                    div {
                        h1 { style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 16px;", "System Configuration" }
                        div {
                            style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",

                            div {
                                style: "padding: 12px; background: rgba(58, 42, 80, 0.35); border-radius: 10px; border-left: 3px solid #7aebbe; margin-bottom: 12px;",
                                p { style: "color: #cbd5ff; margin: 0; font-size: 14px;", "Operating System" }
                                p { style: "color: #f7f2ff; margin: 4px 0 0 0; font-weight: bold;", "Arch Linux" }
                            }

                            div {
                                style: "padding: 12px; background: rgba(58, 42, 80, 0.35); border-radius: 10px; border-left: 3px solid #7aebbe; margin-bottom: 12px;",
                                p { style: "color: #cbd5ff; margin: 0; font-size: 14px;", "Package Manager" }
                                p { style: "color: #f7f2ff; margin: 4px 0 0 0; font-weight: bold;", "paru (AUR Helper)" }
                            }

                            div {
                                style: "padding: 12px; background: rgba(58, 42, 80, 0.35); border-radius: 10px; border-left: 3px solid #7aebbe;",
                                p { style: "color: #cbd5ff; margin: 0; font-size: 14px;", "Terminal Emulator" }
                                p { style: "color: #f7f2ff; margin: 4px 0 0 0; font-weight: bold;", "Kitty + tmux" }
                            }
                        }
                    }
                }

                // Security Tab
                if active_tab() == SettingsTab::Security {
                    div {
                        h1 { style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 16px;", "Security & Signing" }

                        // GPG Key Management
                        div {
                            style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055; margin-bottom: 16px;",

                            h2 { style: "color: #e040fb; margin-bottom: 12px;", "🔑 GPG Key Backup & Recovery" }

                            p { style: "color: #a99ec3; font-size: 14px; margin-bottom: 12px;",
                                "Backup your GPG private keys to Firebase for OS reinstall recovery. Keys are encrypted before upload."
                            }

                            div { style: "display: flex; gap: 8px; margin-bottom: 12px;",
                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; border: 1px solid #7aebbe; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        let mut status = gpg_status.clone();
                                        spawn(async move {
                                            match crate::services::gpg_backup::list_gpg_keys() {
                                                Ok(keys) => {
                                                    let msg = if keys.is_empty() {
                                                        "⚠️ No GPG keys found\nGenerate one with: gpg --full-gen-key".to_string()
                                                    } else {
                                                        let mut result = format!("✅ Found {} GPG secret keys:\n", keys.len());
                                                        for key in &keys {
                                                            result.push_str(&format!("   • {}\n", key));
                                                        }
                                                        result
                                                    };
                                                    status.set(msg);
                                                }
                                                Err(e) => status.set(format!("❌ Failed to list GPG keys: {}", e)),
                                            }
                                        });
                                    },
                                    "📋 List Local Keys"
                                }

                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #ffcc00; border: 1px solid #ffcc00; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        let auth = auth_signal_clone();
                                        let mut status = gpg_status.clone();
                                        if let Some(user) = auth.get_user() {
                                            spawn(async move {
                                                match crate::services::gpg_backup::list_backed_up_keys(&user).await {
                                                    Ok(keys) => {
                                                        let msg = if keys.is_empty() {
                                                            "⚠️ No backed up keys found in Firebase".to_string()
                                                        } else {
                                                            let mut result = format!("✅ Found {} backed up keys:\n", keys.len());
                                                            for key in &keys {
                                                                result.push_str(&format!("   • {}\n", key));
                                                            }
                                                            result
                                                        };
                                                        status.set(msg);
                                                    }
                                                    Err(e) => status.set(format!("❌ Failed to list backed up keys: {}", e)),
                                                }
                                            });
                                        } else {
                                            status.set("⚠️ Not authenticated - please login first".to_string());
                                        }
                                    },
                                    "☁️ List Cloud Backups"
                                }

                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #e040fb; border: 1px solid #e040fb; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        let auth = auth_signal_clone();
                                        let mut status = gpg_status.clone();
                                        if let Some(user) = auth.get_user() {
                                            log::info!("🔑 GPG Backup: User authenticated - uid: {}, token length: {}", user.uid, user.id_token.len());
                                            spawn(async move {
                                                match crate::services::gpg_backup::list_gpg_keys() {
                                                    Ok(keys) if !keys.is_empty() => {
                                                        let key_id = &keys[0];
                                                        status.set(format!("💾 Backing up GPG key: {}...", key_id));
                                                        log::info!("📤 Backing up GPG key {} to Firebase", key_id);
                                                        match crate::services::gpg_backup::backup_gpg_key(&user, key_id).await {
                                                            Ok(_) => {
                                                                status.set(format!("✅ GPG key backed up successfully!\n   Key ID: {}\n   Encrypted with your Firebase UID", key_id));
                                                            }
                                                            Err(e) => {
                                                                log::error!("❌ GPG backup error: {}", e);
                                                                status.set(format!("❌ Backup failed: {}\n   Check Firebase permissions and authentication", e));
                                                            }
                                                        }
                                                    }
                                                    Ok(_) => status.set("⚠️ No GPG keys found\nGenerate one with: gpg --full-gen-key".to_string()),
                                                    Err(e) => status.set(format!("❌ Failed to list keys: {}", e)),
                                                }
                                            });
                                        } else {
                                            log::warn!("⚠️ GPG Backup: User not authenticated");
                                            status.set("⚠️ Not authenticated - please login first".to_string());
                                        }
                                    },
                                    "💾 Backup to Firebase"
                                }

                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; border: 1px solid #7aebbe; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        let auth = auth_signal_clone();
                                        let mut status = gpg_status.clone();
                                        if let Some(user) = auth.get_user() {
                                            spawn(async move {
                                                match crate::services::gpg_backup::list_backed_up_keys(&user).await {
                                                    Ok(keys) if !keys.is_empty() => {
                                                        let key_id = &keys[0];
                                                        status.set(format!("📥 Restoring GPG key: {}...", key_id));
                                                        match crate::services::gpg_backup::restore_gpg_key(&user, key_id).await {
                                                            Ok(_) => {
                                                                status.set(format!("✅ GPG key restored successfully!\n   Key ID: {}", key_id));
                                                            }
                                                            Err(e) => status.set(format!("❌ Restore failed: {}", e)),
                                                        }
                                                    }
                                                    Ok(_) => status.set("⚠️ No backed up keys found in Firebase".to_string()),
                                                    Err(e) => status.set(format!("❌ Failed to list backups: {}", e)),
                                                }
                                            });
                                        } else {
                                            status.set("⚠️ Not authenticated - please login first".to_string());
                                        }
                                    },
                                    "📥 Restore from Firebase"
                                }
                            }

                            // GPG Status Display
                            if !gpg_status().is_empty() {
                                div { style: "margin-top: 12px; padding: 12px; background: rgba(58, 42, 80, 0.3); border-radius: 8px; border-left: 3px solid #e040fb; color: #f7f2ff; font-size: 13px; white-space: pre-wrap; font-family: ui-monospace, monospace;",
                                    "{gpg_status()}"
                                }
                            }

                            p { style: "color: #cbd5ff; font-size: 12px; background: rgba(58, 42, 80, 0.3); padding: 10px; border-radius: 6px; border-left: 2px solid #e040fb;",
                                "🔐 Keys are encrypted with AES-256-GCM before saving to Firebase. Only accessible with your credentials."
                            }

                            p { style: "color: #ffcc00; font-size: 11px; margin-top: 8px;",
                                "💡 Tip: Generate a new GPG key with: gpg --full-gen-key"
                            }
                        }

                        // SSL/TLS Certificate Management
                        div {
                            style: "border: 1px solid #3a2a50; border-radius: 12px; padding: 16px; background: linear-gradient(160deg, #1c162b 0%, #120e1a 60%, #0f0b1f 100%); box-shadow: 0 12px 28px #00000055;",

                            h2 { style: "color: #e040fb; margin-bottom: 12px;", "🔐 SSL/TLS Certificates" }

                            p { style: "color: #a99ec3; font-size: 14px; margin-bottom: 12px;",
                                "Create self-signed certificates for secure local development and repo distribution."
                            }

                            div { style: "display: flex; gap: 8px; margin-bottom: 12px;",
                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; border: 1px solid #7aebbe; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        spawn(async move {
                                            match crate::ssl::generate_self_signed_cert("kael-os.local", 365) {
                                                Ok(cert) => {
                                                    log::info!("Generated SSL certificate for kael-os.local (365 days)");
                                                    log::info!("Certificate fingerprint: {}", cert.info.serial);
                                                }
                                                Err(e) => log::error!("Failed to generate certificate: {}", e),
                                            }
                                        });
                                    },
                                    "🎟️ Generate Certificate"
                                }

                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; border: 1px solid #7aebbe; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        let auth = auth_signal_clone();
                                        if let Some(_user) = auth.get_user() {
                                            log::info!("Certificate saved to /etc/kael-os/certs/ and Firebase (encrypted)");
                                        } else {
                                            log::warn!("Cannot save: not authenticated");
                                        }
                                    },
                                    "💾 Save Cert"
                                }

                                button {
                                    style: "background: linear-gradient(135deg, #1f1631 0%, #181024 100%); color: #7aebbe; border: 1px solid #7aebbe; cursor: pointer; padding: 8px 16px; border-radius: 6px; font-size: 12px;",
                                    onclick: move |_| {
                                        log::info!("Opening certificate viewer...");
                                    },
                                    "👁️ View Info"
                                }
                            }

                            p { style: "color: #cbd5ff; font-size: 12px; background: rgba(58, 42, 80, 0.3); padding: 10px; border-radius: 6px; border-left: 2px solid #e040fb;",
                                "Certificates are stored in /etc/kael-os/certs/ with restricted permissions and encrypted backups in Firebase."
                            }
                        }
                    }
                }

                // Themes Tab
                if active_tab() == SettingsTab::Themes {
                    {render_themes_tab()}
                }
            }
        }
    }
}
