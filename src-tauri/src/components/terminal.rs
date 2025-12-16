// src-tauri/src/components/terminal.rs
use dioxus::events::Code;
use dioxus::prelude::*;

use crate::components::icons::{PanelIcon, SparkIcon};
use crate::terminal::PtyTerminal;

#[derive(Props, Clone, PartialEq)]
pub struct TerminalProps {
    pub term_out: Signal<String>,
    pub pty: Signal<PtyTerminal>,
}

/// Strip ANSI escape sequences from text
fn strip_ansi(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut in_escape = false;
    for ch in text.chars() {
        if !in_escape {
            if ch == '\x1b' {
                in_escape = true;
            } else {
                out.push(ch);
            }
        } else {
            // Inside an escape: skip until we hit a final byte in the range '@'..='~'
            if ('@'..='~').contains(&ch) {
                in_escape = false;
            }
        }
    }
    out
}

fn format_terminal_line(line: &str) -> String {
    // Strip ANSI codes first
    let line = strip_ansi(line);
    let line = line.trim();
    if line.is_empty() {
        return String::new();
    }

    // HTML escape the line content
    let escaped = line
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;");

    // Detect message type and add color
    if line.starts_with("✅")
        || line.contains("success")
        || line.contains("Success")
        || line.contains("SUCCESS")
    {
        format!("<span style='color: #7aebbe;'>{}</span>", escaped)
    } else if line.starts_with("❌")
        || line.contains("error")
        || line.contains("Error")
        || line.contains("ERROR")
        || line.contains("failed")
        || line.contains("Failed")
    {
        format!("<span style='color: #ff6b9d;'>{}</span>", escaped)
    } else if line.starts_with("⚠️")
        || line.starts_with("💡")
        || line.contains("warning")
        || line.contains("Warning")
        || line.contains("WARN")
    {
        format!("<span style='color: #ffcc00;'>{}</span>", escaped)
    } else if line.starts_with("📋")
        || line.starts_with("☁️")
        || line.starts_with("💾")
        || line.starts_with("🔍")
    {
        format!("<span style='color: #e040fb;'>{}</span>", escaped)
    } else if line.starts_with("$") || line.starts_with(">") {
        format!("<span style='color: #5af0c8;'>{}</span>", escaped)
    } else if line.starts_with("   ") || line.starts_with("  ") {
        // Indented continuation lines
        format!(
            "<span style='color: #a99ec3; padding-left: 1em;'>{}</span>",
            escaped
        )
    } else {
        format!("<span style='color: #f7f2ff;'>{}</span>", escaped)
    }
}

#[allow(non_snake_case)]
pub fn TerminalPanel(props: TerminalProps) -> Element {
    let mut user_input = use_signal(String::new);
    let mut is_password_prompt = use_signal(|| false);

    // Format output with colors
    let formatted_output = props.term_out.read();

    // Detect password prompts in the last few lines
    {
        let last_lines: Vec<&str> = formatted_output.lines().rev().take(3).collect();
        let mut is_pwd = false;
        for line in last_lines {
            let lower = line.to_lowercase();
            if lower.contains("password") || lower.contains("sudo") {
                is_pwd = true;
                break;
            }
        }
        is_password_prompt.set(is_pwd);
    }

    let lines: Vec<String> = formatted_output
        .lines()
        .map(|line| format_terminal_line(line))
        .collect();
    let formatted_html = lines.join("<br/>");

    rsx! {
        div {
            class: "flex flex-col gap-3",
            // Title / header
            div { class: "flex items-center gap-2",
                PanelIcon { class: "w-3 h-3" }
                span { style: "color: #7aebbe; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em;", "Terminal Output" }
            }
            // Container card
            div {
                class: "pane-scroll",
                style: "padding: 12px; border: 1px solid #3a2d56; border-radius: 12px; background: linear-gradient(160deg, #171025 0%, #0f0b1a 55%, #0b0816 100%); box-shadow: inset 0 1px 0 #2a1e40, 0 10px 24px #00000055;",
                // Shell header
                div { style: "height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: linear-gradient(120deg, #1f1631 0%, #181024 80%, #120b1f 100%); color: #7aebbe; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; border: 1px solid #3a2d56; border-radius: 8px;",
                    SparkIcon { class: "w-3 h-3" }
                    span { "Shell Status" }
                }
                // Output area with better formatting
                div {
                    style: "margin: 12px 0 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; background: linear-gradient(180deg, #181024 0%, #120b1f 100%); padding: 12px; max-height: 260px; overflow-y: auto; border: 1px solid #3a2d56; border-radius: 10px; font-size: 13px; line-height: 1.6;",
                    dangerous_inner_html: "{formatted_html}"
                }
                // Info message if no output
                if formatted_output.is_empty() {
                    div { style: "margin: 12px 0 0; padding: 12px; color: #a99ec3; font-size: 13px; text-align: center; font-style: italic;",
                        "Terminal output will appear here..."
                    }
                }
                // Input field for interactive terminal
                div {
                    style: "margin-top: 12px; display: flex; gap: 8px; align-items: center;",
                    input {
                        r#type: if is_password_prompt() { "password" } else { "text" },
                        value: "{user_input}",
                        placeholder: if is_password_prompt() { "Enter password..." } else { "Type input and press Enter..." },
                        style: "flex: 1; padding: 8px 12px; background: linear-gradient(180deg, #181024 0%, #120b1f 100%); border: 1px solid #3a2d56; border-radius: 8px; color: #f7f2ff; font-family: ui-monospace, monospace; font-size: 13px; outline: none;",
                        oninput: move |evt| {
                            user_input.set(evt.value().clone());
                        },
                        onkeydown: move |evt| {
                            if evt.code() == Code::Enter {
                                let input_text = user_input();
                                if !input_text.is_empty() {
                                    let pty = props.pty.read().clone();
                                    let text_to_send = input_text.clone();
                                    spawn(async move {
                                        if let Err(e) = pty.write_line(&text_to_send).await {
                                            log::error!("Failed to send input to terminal: {}", e);
                                        }
                                    });
                                    user_input.set(String::new());
                                } else {
                                    // Just send newline if empty (for prompts)
                                    let pty = props.pty.read().clone();
                                    spawn(async move {
                                        if let Err(e) = pty.write_line("").await {
                                            log::error!("Failed to send newline to terminal: {}", e);
                                        }
                                    });
                                }
                            }
                        }
                    }
                    button {
                        style: "padding: 8px 16px; background: linear-gradient(135deg, #7aebbe 0%, #5af0c8 100%); border: none; border-radius: 8px; color: #0b0816; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s;",
                        onclick: move |_| {
                            let input_text = user_input();
                            if !input_text.is_empty() {
                                let pty = props.pty.read().clone();
                                let text_to_send = input_text.clone();
                                spawn(async move {
                                    if let Err(e) = pty.write_line(&text_to_send).await {
                                        log::error!("Failed to send input to terminal: {}", e);
                                    }
                                });
                                user_input.set(String::new());
                            }
                        },
                        "Send"
                    }
                }
            }
        }
    }
}
