// src-tauri/src/components/app.rs
use dioxus::prelude::*;

use crate::auth::AuthService;
use crate::components::app_tracker_manager::AppTrackerManager;
use crate::components::brainstorm::BrainstormPanel;
use crate::components::chat::ChatPanel;
use crate::components::header::Header;
use crate::components::icons::{KaelSigilIcon, PanelIcon, SparkIcon};
use crate::components::project_archive_settings::ProjectArchiveSettings;
use crate::components::settings::SettingsPanel;
use crate::components::terminal::TerminalPanel;
use crate::state::{AppProject, AppStatus};
use crate::llm;

// Strip ANSI escape sequences from text (robustly skips ESC sequences)
fn strip_ansi(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars().peekable();
    
    while let Some(ch) = chars.next() {
        match ch {
            '\x1b' => {
                // ESC sequence detected - skip until we find the terminator
                if chars.peek() == Some(&'[') {
                    chars.next(); // Skip '['
                    // CSI sequence: ESC [ ... final_byte
                    // Final byte is in range 0x40-0x7E (@A-Z[\]^_`a-z{|}~)
                    while let Some(&next_ch) = chars.peek() {
                        chars.next();
                        if ('@'..='~').contains(&next_ch) {
                            break;
                        }
                    }
                } else if chars.peek() == Some(&']') {
                    chars.next(); // Skip ']'
                    // OSC sequence: ESC ] ... BEL or ESC \
                    while let Some(&next_ch) = chars.peek() {
                        chars.next();
                        if next_ch == '\x07' {
                            break; // BEL
                        }
                        if next_ch == '\x1b' {
                            if chars.peek() == Some(&'\\') {
                                chars.next(); // ESC \
                                break;
                            }
                        }
                    }
                } else {
                    // Other ESC sequences (Fe, Fp, etc.)
                    chars.next();
                }
            }
            '\x00'..='\x1f' if ch != '\n' && ch != '\r' && ch != '\t' => {
                // Skip other control characters except newline, carriage return, and tab
            }
            _ => {
                out.push(ch);
            }
        }
    }
    out
}

// Load app projects from persistent storage
fn load_projects() -> Vec<AppProject> {
    if let Ok(json) = std::fs::read_to_string("/tmp/kael_projects.json") {
        serde_json::from_str(&json).unwrap_or_default()
    } else {
        // Default projects
        vec![
            AppProject::new(
                "Kael-CLI".to_string(),
                "Command-line interface for Kael-OS".to_string(),
                AppStatus::Making,
            ),
            AppProject::new(
                "Kael-Web".to_string(),
                "Web-based dashboard for remote management".to_string(),
                AppStatus::Want,
            ),
            AppProject::new(
                "Kael-Tests".to_string(),
                "Integration test suite".to_string(),
                AppStatus::Testing,
            ),
        ]
    }
}

// Save app projects to persistent storage
fn save_projects(projects: &[AppProject]) {
    if let Ok(json) = serde_json::to_string(projects) {
        let _ = std::fs::write("/tmp/kael_projects.json", json);
    }
}

#[allow(non_snake_case)]
pub fn App() -> Element {
    let _quick_actions = vec![
        (
            "New Script",
            "Launch a fresh Kael script pad",
            "linear-gradient(135deg, #e040fb 0%, #ffcc00 60%, #7aebbe 100%)",
        ),
        (
            "Sync Repo",
            "Pull latest mission changes",
            "linear-gradient(135deg, #7aebbe 0%, #5af0c8 60%, #ffcc00 100%)",
        ),
        (
            "Deploy",
            "Ship build to forge target",
            "linear-gradient(135deg, #ffcc00 0%, #ff9f0a 60%, #e040fb 100%)",
        ),
    ];

    let _pinned_panels = vec![
        ("Terminal", "Active", "#7aebbe"),
        ("Firebase", "Linked", "#ffcc00"),
        ("Local DB", "Online", "#e040fb"),
    ];

    let mut terminal_output = use_signal(String::new);
    let mut pty_ready = use_signal(|| false);
    let current_command = use_signal(String::new);
    let auth_service = use_signal(|| AuthService::new());
    let show_settings = use_signal(|| false);
    let mut projects = use_signal(|| load_projects());
    let mut clear_chat_trigger = use_signal(|| false);
    let chat_messages_out = use_signal(Vec::<crate::components::chat::Message>::new);
    let hybrid_assist = use_signal(|| false);
    let show_brainstorm = use_signal(|| false);
    let pty_instance = use_signal(|| {
        use crate::terminal::PtyTerminal;
        PtyTerminal::new()
    });

    // Prefetch provider API keys on authentication to avoid first-request delay
    {
        let auth_signal = auth_service.clone();
        use_effect(move || {
            if let Some(user) = auth_signal.read().get_user() {
                spawn(async move {
                    match crate::firebase::get_api_keys(&user).await {
                        Ok(keys) => {
                            let simple: Vec<serde_json::Value> = keys
                                .into_iter()
                                .map(|k| serde_json::json!({"name": k.name, "value": k.value}))
                                .collect();
                            let json = serde_json::to_string(&simple).unwrap_or_else(|_| "[]".to_string());
                            let _ = std::fs::write("/tmp/kael_cached_keys.json", json);
                            log::info!("Prefetched provider keys and cached to /tmp/kael_cached_keys.json");
                        }
                        Err(e) => {
                            log::warn!("Failed to prefetch provider keys: {}", e);
                        }
                    }
                });
            }
        });
    }

    // Auto-refresh token before it expires (keeps user logged in indefinitely)
    {
        let mut auth_signal = auth_service.clone();
        use_effect(move || {
            spawn(async move {
                loop {
                    // Check every 30 minutes
                    tokio::time::sleep(std::time::Duration::from_secs(30 * 60)).await;
                    
                    let should_refresh = {
                        let auth = auth_signal.read();
                        if let Some(user) = auth.get_user() {
                            if let Some(expires_in) = user.expires_in {
                                let now = chrono::Utc::now().timestamp();
                                // Refresh if token expires in less than 10 minutes
                                expires_in - now < 10 * 60
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    };

                    if should_refresh {
                        let current_user = auth_signal.read().get_user();
                        if let Some(user) = current_user {
                            if let Some(refresh_token) = &user.refresh_token {
                                log::info!("🔄 Auto-refreshing token...");
                                match crate::auth::AuthService::refresh_token_public(refresh_token).await {
                                    Ok(mut refreshed_user) => {
                                        // Preserve existing user info (email, name, photo)
                                        refreshed_user.email = user.email;
                                        refreshed_user.name = user.name;
                                        refreshed_user.photo_url = user.photo_url;
                                        
                                        auth_signal.write().set_user(refreshed_user);
                                        log::info!("✅ Token auto-refreshed successfully");
                                    }
                                    Err(e) => {
                                        log::error!("❌ Auto-refresh failed: {}", e);
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });
    }

    // Load hybrid assist flag from cache - default to hybrid, fallback to local-only if no API keys
    {
        let mut ha = hybrid_assist.clone();
        use_effect(move || {
            // Check if we have any API keys cached
            let has_api_keys = std::fs::read_to_string("/tmp/kael_cached_keys.json")
                .ok()
                .and_then(|s| serde_json::from_str::<Vec<serde_json::Value>>(&s).ok())
                .map(|keys| !keys.is_empty())
                .unwrap_or(false);
            
            // If we have API keys, enable hybrid mode by default
            if has_api_keys {
                ha.set(true);
                let _ = std::fs::write("/tmp/kael_hybrid_assist.json", "true");
                log::info!("🔄 Hybrid mode enabled - API keys detected");
            } else {
                // No API keys - use local-only (Ollama)
                ha.set(false);
                let _ = std::fs::write("/tmp/kael_hybrid_assist.json", "false");
                log::info!("🏠 Local-only mode - no API keys found, using Ollama");
            }
        });
    }

    // Initialize system context on first launch (detects hardware/software)
    use_effect(move || {
        spawn(async move {
            log::info!("🔍 Initializing system context...");
            
            // This will detect on first launch or load existing context
            match crate::services::first_launch::get_or_init_context_standalone().await {
                Ok(ctx) => {
                    log::info!("✅ System context loaded:");
                    log::info!("   CPU: {} ({} cores)", ctx.hardware.cpu_brand, ctx.hardware.cpu_cores);
                    log::info!("   RAM: {:.1}GB total", ctx.hardware.total_ram_gb);
                    if let Some(gpu) = &ctx.hardware.gpu_name {
                        log::info!("   GPU: {}", gpu);
                    }
                    log::info!("   OS: {} {}", ctx.software.os_name, ctx.software.os_version);
                    if !ctx.software.ollama_models.is_empty() {
                        log::info!("   Ollama models: {}", ctx.software.ollama_models.join(", "));
                    }
                    log::info!("📝 AI will use this context for system-aware responses");
                }
                Err(e) => {
                    log::warn!("⚠️  System context detection failed (non-critical): {}", e);
                    log::info!("   AI will continue without detailed system context");
                }
            }
        });
    });

    // Ensure Ollama is running, then warm local AI on app start
    use_effect(move || {
        spawn(async move {
            log::info!("🚀 Starting comprehensive local AI initialization...");
            
            // Initialize all local AI services with system capability detection
            let startup_result = crate::services::local_ai_startup::initialize_local_ai().await;
            
            // Log startup results
            log::info!("📊 Local AI Startup Results:");
            for msg in &startup_result.startup_messages {
                log::info!("  {}", msg);
            }
            
            // If any systems are ready, try to warm the model
            if startup_result.all_systems_ready {
                log::info!("✅ At least one local AI system is ready, warming model...");
                
                // Find recommended model from statuses
                let recommended_model = startup_result
                    .statuses
                    .iter()
                    .find_map(|s| s.recommended_model.clone())
                    .unwrap_or_else(|| "llama3:latest".to_string());
                
                // Give services a moment to stabilize
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                
                // Warm the model
                let warmed = llm::warm_local_model(&recommended_model).await;
                if warmed {
                    log::info!("✅ Local AI model warmup complete for: {}", recommended_model);
                } else {
                    log::warn!("⚠️  Local AI warmup failed or service unavailable");
                }
            } else {
                log::warn!(
                    "⚠️  No local AI systems ready. App will use cloud fallbacks. Startup took {}ms",
                    startup_result.total_startup_time_ms
                );
            }
        });
    });

    // Spawn PTY terminal session on mount
    use_effect(move || {
        spawn(async move {
            let pty = pty_instance();
            if let Err(e) = pty.ensure_session().await {
                eprintln!("PTY init failed: {e}");
                return;
            }
            pty_ready.set(true);

            // Stream output
            if let Ok(rx) = pty.get_output_receiver().await {
                spawn(async move {
                    while let Ok(chunk) = rx.recv().await {
                        let text = String::from_utf8_lossy(&chunk).to_string();
                        let clean_text = strip_ansi(&text);
                        terminal_output.write().push_str(&clean_text);
                    }
                });
            }
        });
    });

    rsx! {
        style { {include_str!("../../assets/tailwind.out.css")} }
        style { "
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            .app-root {{
                height: 100vh;
                display: flex;
                flex-direction: column;
                background: radial-gradient(1200px at 20% 0%, #1c162b 0%, #120e1a 45%, #0b0816 100%);
                color: #f7f2ff;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }}
            .main-container {{
                display: flex;
                flex: 1;
                overflow: hidden;
                position: relative;
            }}
            .resizable-left {{
                flex: 0 0 256px;
                background: linear-gradient(180deg, #1c162b 0%, #140f22 55%, #0f0b1a 100%);
                border-right: 1px solid #3a2d56;
                overflow-y: auto;
                padding: 1rem;
                min-width: 150px;
                max-width: 70%;
            }}
            .left-card {{
                border: 1px solid #3a2d56;
                border-radius: 12px;
                background: linear-gradient(160deg, #1a1326 0%, #100b1c 65%, #0b0816 100%);
                box-shadow: 0 14px 28px #00000055, inset 0 1px 0 #2a1e40;
            }}
            .section-label {{
                color: #a99ec3;
                letter-spacing: 0.08em;
                font-size: 12px;
                text-transform: uppercase;
            }}
            .chip {{
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 8px 10px;
                border-radius: 10px;
                background: rgba(58,45,86,0.35);
                border: 1px solid #3a2d56;
                color: #f7f2ff;
                font-size: 12px;
                box-shadow: inset 0 1px 0 #2a1e40;
            }}
            .splitter {{
                flex: 0 0 6px;
                background-color: #3a2d56;
                cursor: col-resize;
                user-select: none;
                transition: background-color 0.2s;
            }}
            .splitter:hover {{
                background-color: #ffcc00;
            }}
            .splitter.dragging {{
                background-color: #ffcc00;
            }}
            .chat-container {{
                flex: 1;
                min-width: 200px;
                overflow: hidden;
            }}
            .resizable-right {{
                flex: 0 0 320px;
                background: linear-gradient(180deg, #1c162b 0%, #140f22 55%, #0f0b1a 100%);
                border-left: 1px solid #3a2d56;
                overflow-y: auto;
                padding: 1rem;
                min-width: 150px;
                max-width: 70%;
            }}
            .status-card {{
                border: 1px solid #3a2d56;
                border-radius: 14px;
                padding: 14px;
                background: linear-gradient(150deg, #1a1426 0%, #110d1d 60%, #0d0a16 100%);
                box-shadow: 0 12px 26px #00000055, inset 0 1px 0 #2a1e40;
            }}
            .pane-scroll::-webkit-scrollbar {{ width: 8px; }}
            .pane-scroll::-webkit-scrollbar-track {{ background: #0f0b1a; border-radius: 10px; }}
            .pane-scroll::-webkit-scrollbar-thumb {{ background: linear-gradient(180deg, #3a2d56 0%, #2a1e40 100%); border-radius: 10px; border: 1px solid #120e1a; }}
            .pane-scroll::-webkit-scrollbar-thumb:hover {{ background: linear-gradient(180deg, #ffcc00 0%, #e040fb 100%); }}
        " }
        div {
            class: "app-root",
            Header { show_settings: show_settings.clone() },

            if show_settings() {
                SettingsPanel { auth_service: auth_service.clone(), show_settings: show_settings.clone() }
            } else {
                div {
                    class: "main-container",
                    // Left Panel - Chat Controls
                    aside {
                    class: "resizable-left pane-scroll",
                    div { class: "flex items-center gap-3 mb-4",
                        div { class: "p-2 rounded-lg border", style: "border-color: #3a2d56; background: radial-gradient(circle at 30% 30%, #e040fb 0%, #120e1a 55%, #0f0c1a 100%); box-shadow: inset 2px 0 0 #ffcc00;",
                            KaelSigilIcon { class: "w-5 h-5" }
                        }
                        h2 { class: "font-bold text-lg", style: "color: #ffcc00; letter-spacing: 0.02em;", "Chat Controls" }
                    }

                    // Chat Controls
                    div { class: "left-card p-3 mb-4",
                        div { class: "flex items-center justify-between mb-3",
                            span { class: "section-label", "Chat Controls" }
                            SparkIcon { class: "w-4 h-4 text-[#ffcc00]" }
                        }
                        button {
                            class: "w-full mb-2",
                            style: "padding: 10px 12px; border-radius: 8px; border: 1px solid #3a2d56; background: linear-gradient(135deg, #7aebbe 0%, #5af0c8 100%); color: #120e1a; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(122, 235, 190, 0.3);",
                            onclick: move |_| {
                                use chrono::Local;
                                let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
                                let filename = format!("kael_chat_{}.txt", timestamp);

                                let mut text_content = format!("Kael Chat Export - {}\n", Local::now().format("%Y-%m-%d %H:%M:%S"));
                                text_content.push_str(&"=".repeat(60));
                                text_content.push_str("\n\n");

                                match std::fs::read_to_string("/tmp/kael_chat_history.json") {
                                    Ok(json_content) => {
                                        match serde_json::from_str::<Vec<serde_json::Value>>(&json_content) {
                                            Ok(messages) => {
                                                for msg in messages {
                                                    if let (Some(author), Some(text)) = (msg.get("author").and_then(|a| a.as_str()), msg.get("text").and_then(|t| t.as_str())) {
                                                        text_content.push_str(&format!("[{}]\n{}\n\n", author, text));
                                                    }
                                                }
                                            }
                                            Err(e) => {
                                                log::error!("Failed to parse chat history for export: {}", e);
                                                text_content.push_str("(No messages: history parse failed)\n");
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        if e.kind() == std::io::ErrorKind::NotFound {
                                            let live = chat_messages_out();
                                            if live.is_empty() {
                                                log::info!("No chat history file to export; writing empty export");
                                                text_content.push_str("(No messages: history file missing)\n");
                                            } else {
                                                for m in live {
                                                    text_content.push_str(&format!("[{}]\n{}\n\n", m.author, m.text));
                                                }
                                            }
                                        } else {
                                            log::error!("Failed to read chat history: {}", e);
                                            text_content.push_str("(No messages: history read error)\n");
                                        }
                                    }
                                }

                                let save_path = format!("/tmp/{}", filename);
                                match std::fs::write(&save_path, text_content) {
                                    Ok(_) => log::info!("Chat saved to: {}", save_path),
                                    Err(e) => log::error!("Failed to save chat: {}", e),
                                }
                            },
                            "💾 Save Chat"
                        }
                        button {
                            class: "w-full",
                            style: "padding: 10px 12px; border-radius: 8px; border: 1px solid #3a2d56; background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); color: white; font-weight: 600; font-size: 13px; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);",
                            onclick: move |_| {
                                match std::fs::remove_file("/tmp/kael_chat_history.json") {
                                    Ok(_) => {
                                        log::info!("Chat history cleared");
                                        clear_chat_trigger.set(true);
                                        let mut trig = clear_chat_trigger.clone();
                                        spawn(async move {
                                            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                                            trig.set(false);
                                        });
                                    },
                                    Err(e) => {
                                        if e.kind() == std::io::ErrorKind::NotFound {
                                            log::info!("Chat history already clear (file missing)");
                                            clear_chat_trigger.set(true);
                                            let mut trig = clear_chat_trigger.clone();
                                            spawn(async move {
                                                tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                                                trig.set(false);
                                            });
                                        } else {
                                            log::error!("Failed to clear chat: {}", e);
                                        }
                                    }
                                }
                            },
                            "🗑️ Clear Chat"
                        }
                    }

                    // Terminal Status
                    div { class: "left-card p-3",
                        div { class: "flex items-center justify-between mb-3",
                            span { class: "section-label", "Terminal Status" }
                            if current_command() != "" { PanelIcon { class: "w-4 h-4 text-[#7aebbe]" } } else { PanelIcon { class: "w-4 h-4 text-[#3a2d56]" } }
                        }
                        if current_command() != "" {
                            div { style: "padding: 10px; background: linear-gradient(135deg, #1f1631 0%, #181024 100%); border: 1px solid #3a2d56; border-radius: 8px; color: #7aebbe; font-size: 12px; font-family: monospace; overflow-x: auto; word-break: break-all;",
                                "$ {current_command()}"
                            }
                        } else {
                            span { style: "color: #a99ec3; font-size: 13px;", "No active command" }
                        }
                    }
                }
                // Left Splitter
                div {
                    class: "splitter",
                },
                // Center Chat + Terminal
                div {
                    class: "chat-container",
                    style: "display: flex; flex-direction: column; flex: 1; gap: 16px;",
                    if show_brainstorm() {
                        BrainstormPanel { auth_service: auth_service.clone() }
                    } else {
                        {
                            let user_photo_url = auth_service.read().get_user().and_then(|u| u.photo_url);
                            let user_name = auth_service.read().get_user().map(|u| u.name).unwrap_or_else(|| "Architect".to_string());
                            rsx! {
                                ChatPanel {
                                    term_out: terminal_output.clone(),
                                    pty: pty_instance.clone(),
                                    current_cmd: current_command.clone(),
                                    user_photo_url: user_photo_url,
                                    user_name: user_name,
                                    auth_service: auth_service.clone(),
                                    clear_chat_trigger: clear_chat_trigger.clone(),
                                    messages_out: chat_messages_out.clone(),
                                    last_provider: use_signal(|| String::new()),
                                    hybrid_assist: hybrid_assist.clone(),
                                }
                            }
                        }
                        TerminalPanel { 
                            term_out: terminal_output.clone(),
                            pty: pty_instance.clone()
                        }
                    }
                },
                // Right Splitter
                div {
                    class: "splitter",
                },
                // Right Panel - Todo & App Status
                aside {
                    class: "resizable-right pane-scroll",
                    div { class: "flex items-center gap-3 mb-4",
                        div { class: "p-2 rounded-lg border", style: "border-color: #3a2d56; background: radial-gradient(circle at 30% 30%, #7aebbe 0%, #120e1a 55%, #0f0c1a 100%); box-shadow: inset 2px 0 0 #e040fb;",
                            SparkIcon { class: "w-5 h-5" }
                        }
                        h2 { class: "font-bold text-lg", style: "color: #7aebbe; letter-spacing: 0.02em;", "Todo & App Status" }
                    }

                    // App Projects Tracker
                    {
                        let archived_projects: Vec<AppProject> = projects().iter().filter(|p| p.archived).cloned().collect();
                        let active_projects: Vec<AppProject> = projects().iter().filter(|p| !p.archived).cloned().collect();
                        
                        rsx! {
                            AppTrackerManager {
                                projects: active_projects,
                                on_add: move |new_project: AppProject| {
                                    projects.write().push(new_project.clone());
                                    save_projects(&projects());
                                },
                                on_remove: move |project_id: String| {
                                    projects.write().retain(|p| p.id != project_id);
                                    save_projects(&projects());
                                },
                                on_status_change: move |(project_id, new_status): (String, AppStatus)| {
                                    if let Some(project) = projects.write().iter_mut().find(|p| p.id == project_id) {
                                        project.status = new_status;
                                    }
                                    save_projects(&projects());
                                },
                                on_archive: move |(project_id, archived): (String, bool)| {
                                    if let Some(project) = projects.write().iter_mut().find(|p| p.id == project_id) {
                                        project.archived = archived;
                                    }
                                    save_projects(&projects());
                                },
                            }

                            // Archived Projects Settings
                            if archived_projects.len() > 0 {
                                ProjectArchiveSettings {
                                    archived_projects: archived_projects,
                                    on_restore: move |(project_id, unarchive): (String, bool)| {
                                        if let Some(project) = projects.write().iter_mut().find(|p| p.id == project_id) {
                                            project.archived = unarchive;
                                        }
                                        save_projects(&projects());
                                    },
                                    on_delete: move |project_id: String| {
                                        projects.write().retain(|p| p.id != project_id);
                                        save_projects(&projects());
                                    },
                                }
                            }
                        }
                    }
                }
                }
            }
        }
    }
}
