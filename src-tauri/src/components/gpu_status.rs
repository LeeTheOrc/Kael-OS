// src-tauri/src/components/gpu_status.rs
//! GPU Status indicator component - shows if Ollama is using GPU or CPU

use dioxus::prelude::*;

#[derive(Debug, Clone, PartialEq)]
pub enum ComputeMode {
    Gpu,
    Cpu,
    Unknown,
}

/// Fetch Ollama compute mode (GPU or CPU) from the Ollama API
pub async fn get_ollama_compute_mode() -> ComputeMode {
    match reqwest::Client::new()
        .get("http://127.0.0.1:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(resp) => {
            match resp.text().await {
                Ok(body) => {
                    // Check if response contains VRAM info (GPU presence) or CPU-only
                    if body.contains("vram") && !body.contains("vram\":0") {
                        ComputeMode::Gpu
                    } else if body.contains("inference") {
                        ComputeMode::Cpu
                    } else {
                        ComputeMode::Unknown
                    }
                }
                Err(_) => ComputeMode::Unknown,
            }
        }
        Err(_) => ComputeMode::Unknown,
    }
}

#[allow(non_snake_case)]
pub fn GpuStatusIndicator() -> Element {
    let mut compute_mode = use_signal(|| ComputeMode::Unknown);
    let _poll_count = use_signal(|| 0);

    // Poll Ollama compute mode on mount and periodically
    {
        use_effect(move || {
            spawn(async move {
                loop {
                    let mode = get_ollama_compute_mode().await;
                    compute_mode.set(mode);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            });
        });
    }

    let (bg_color, icon, label) = match *compute_mode.read() {
        ComputeMode::Gpu => ("#2ecc71", "⚡", "GPU Accelerated"),
        ComputeMode::Cpu => ("#f39c12", "⚙️", "CPU Mode"),
        ComputeMode::Unknown => ("#95a5a6", "❓", "Checking..."),
    };

    rsx! {
        div {
            class: "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold",
            style: format!("background-color: {bg_color}22; border: 1px solid {bg_color}; color: {bg_color};"),
            span { "{icon}" }
            span { "{label}" }
        }
    }
}
