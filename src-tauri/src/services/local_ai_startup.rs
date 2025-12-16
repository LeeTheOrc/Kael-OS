// Local AI Startup Manager
// Intelligently detects and starts all available local AI services on app launch
// Checks system capabilities and starts services that fit available resources

use std::process::Command;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemCapabilities {
    pub cpu_cores: usize,
    pub total_ram_gb: f64,
    pub gpu_available: bool,
    pub gpu_type: Option<String>,
    pub has_nvme: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum LocalAIType {
    Ollama,
    // Future: LM-Studio, Jan, Llama.cpp, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalAIStatus {
    pub ai_type: LocalAIType,
    pub installed: bool,
    pub running: bool,
    pub available_models: Vec<String>,
    pub recommended_model: Option<String>,
    pub status_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupResult {
    pub all_systems_ready: bool,
    pub statuses: Vec<LocalAIStatus>,
    pub total_startup_time_ms: u128,
    pub startup_messages: Vec<String>,
}

/// Detect system capabilities
pub fn detect_system_capabilities() -> SystemCapabilities {
    let cpu_cores = num_cpus::get();
    let total_ram_gb = sysinfo::System::new_all()
        .total_memory() as f64 / (1024.0 * 1024.0 * 1024.0);
    
    // Check for GPU
    let (gpu_available, gpu_type) = detect_gpu();
    
    // Check for NVMe storage
    let has_nvme = check_for_nvme();
    
    SystemCapabilities {
        cpu_cores,
        total_ram_gb,
        gpu_available,
        gpu_type,
        has_nvme,
    }
}

/// Detect available GPU
fn detect_gpu() -> (bool, Option<String>) {
    // Check NVIDIA
    if Command::new("which")
        .arg("nvidia-smi")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        if let Ok(output) = Command::new("nvidia-smi")
            .args(&["--query-gpu=name", "--format=csv,noheader"])
            .output()
        {
            let gpu_name = String::from_utf8_lossy(&output.stdout)
                .trim()
                .to_string();
            if !gpu_name.is_empty() {
                return (true, Some(format!("NVIDIA: {}", gpu_name)));
            }
        }
        return (true, Some("NVIDIA GPU".to_string()));
    }
    
    // Check AMD (ROCm)
    if Command::new("which")
        .arg("rocm-smi")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return (true, Some("AMD ROCm".to_string()));
    }
    
    // Check Intel
    if Command::new("which")
        .arg("clinfo")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        return (true, Some("Intel iGPU".to_string()));
    }
    
    (false, None)
}

/// Check if system has NVMe storage
fn check_for_nvme() -> bool {
    if let Ok(output) = Command::new("lsblk")
        .arg("-d")
        .arg("-n")
        .arg("-o")
        .arg("NAME,ROTA")
        .output()
    {
        let stdout = String::from_utf8_lossy(&output.stdout);
        stdout.lines().any(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                parts[0].contains("nvme") || (parts[1] == "0" && parts[0].starts_with("sd"))
            } else {
                false
            }
        })
    } else {
        false
    }
}

/// Check Ollama installation and status
pub async fn check_ollama_status() -> LocalAIStatus {
    let installed = is_ollama_installed();
    
    if !installed {
        return LocalAIStatus {
            ai_type: LocalAIType::Ollama,
            installed: false,
            running: false,
            available_models: vec![],
            recommended_model: None,
            status_message: "❌ Not installed. Install from: https://ollama.ai".to_string(),
        };
    }
    
    // Check if running
    let running = is_ollama_running().await;
    
    if !running {
        return LocalAIStatus {
            ai_type: LocalAIType::Ollama,
            installed: true,
            running: false,
            available_models: vec![],
            recommended_model: None,
            status_message: "⚠️  Installed but not running".to_string(),
        };
    }
    
    // Get available models
    let available_models = get_ollama_models().await.unwrap_or_default();
    let recommended = recommend_model(&available_models);
    
    let status_message = if available_models.is_empty() {
        "⚠️  Running but no models found".to_string()
    } else {
        format!("✅ Running with {} models", available_models.len())
    };
    
    LocalAIStatus {
        ai_type: LocalAIType::Ollama,
        installed: true,
        running: true,
        available_models,
        recommended_model: recommended,
        status_message,
    }
}

/// Check if Ollama is installed
fn is_ollama_installed() -> bool {
    Command::new("which")
        .arg("ollama")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if Ollama daemon is running
async fn is_ollama_running() -> bool {
    match reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(response) => response.status().is_success(),
        Err(_) => false,
    }
}

/// Get list of Ollama models
async fn get_ollama_models() -> Result<Vec<String>, String> {
    match reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<serde_json::Value>().await {
                Ok(data) => {
                    let models: Vec<String> = data
                        .get("models")
                        .and_then(|m| m.as_array())
                        .map(|arr| {
                            arr.iter()
                                .filter_map(|item| {
                                    item.get("name")
                                        .and_then(|n| n.as_str())
                                        .map(|s| s.to_string())
                                })
                                .collect()
                        })
                        .unwrap_or_default();
                    Ok(models)
                }
                Err(e) => Err(format!("Parse error: {}", e)),
            }
        }
        Err(e) => Err(format!("Connection error: {}", e)),
    }
}

/// Recommend best model based on system capabilities and availability
fn recommend_model(available: &[String]) -> Option<String> {
    let priority = vec!["llama2", "neural-chat", "mistral", "phi", "orca-mini"];
    
    for preferred in priority {
        if let Some(model) = available.iter().find(|m| m.contains(preferred)) {
            return Some(model.clone());
        }
    }
    
    available.first().cloned()
}

/// Recommend models to download based on system capabilities
pub fn recommend_models_to_download(caps: &SystemCapabilities) -> Vec<String> {
    let mut recommendations = vec![];
    
    // Recommend based on RAM
    if caps.total_ram_gb >= 16.0 {
        // High-performance systems
        recommendations.push("llama2:13b".to_string());
        recommendations.push("mistral".to_string());
    } else if caps.total_ram_gb >= 8.0 {
        // Mid-range systems
        recommendations.push("llama2:7b".to_string());
        recommendations.push("neural-chat".to_string());
    } else {
        // Low-resource systems
        recommendations.push("phi".to_string());
        recommendations.push("orca-mini".to_string());
    }
    
    // Add GPU-optimized if available
    if caps.gpu_available {
        if let Some(ref gpu) = caps.gpu_type {
            if gpu.contains("NVIDIA") {
                recommendations.push("wizard-vicuna-uncensored".to_string());
            }
        }
    }
    
    recommendations
}

/// Start Ollama service
pub async fn start_ollama() -> Result<(), String> {
    log::info!("🔵 Attempting to start Ollama service...");
    
    // Try systemctl --user first (preferred for user service)
    if let Ok(output) = Command::new("systemctl")
        .args(&["--user", "start", "ollama"])
        .output()
    {
        if output.status.success() {
            log::info!("✅ Ollama started via systemctl --user");
            tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
            return Ok(());
        }
    }
    
    // Try systemctl with sudo
    if let Ok(output) = Command::new("sudo")
        .args(&["systemctl", "start", "ollama"])
        .output()
    {
        if output.status.success() {
            log::info!("✅ Ollama started via sudo systemctl");
            tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
            return Ok(());
        }
    }
    
    // Try direct spawn with nohup
    if let Ok(_) = Command::new("nohup")
        .arg("ollama")
        .arg("serve")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
    {
        log::info!("✅ Ollama spawned with nohup");
        tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;
        return Ok(());
    }
    
    Err("Failed to start Ollama service".to_string())
}

/// Wait for Ollama to be ready with exponential backoff
pub async fn wait_for_ollama_ready(max_retries: u32) -> bool {
    log::info!("⏳ Waiting for Ollama to be ready (max {} retries)...", max_retries);
    
    for i in 0..max_retries {
        if is_ollama_running().await {
            log::info!("✅ Ollama is ready!");
            return true;
        }
        
        let wait_ms = (500 * (i + 1)).min(5000); // Exponential backoff, capped at 5s
        log::debug!("Retry {}/{}, waiting {}ms", i + 1, max_retries, wait_ms);
        tokio::time::sleep(tokio::time::Duration::from_millis(wait_ms as u64)).await;
    }
    
    log::warn!("⚠️  Ollama did not become ready within timeout");
    false
}

/// Download recommended models for the system
pub async fn download_recommended_models(models: &[String]) -> Vec<String> {
    let mut downloaded = vec![];
    
    for model in models {
        log::info!("📦 Attempting to download model: {}", model);
        
        match Command::new("ollama")
            .arg("pull")
            .arg(model)
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    log::info!("✅ Downloaded model: {}", model);
                    downloaded.push(model.clone());
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    log::warn!("⚠️  Failed to download {}: {}", model, stderr);
                }
            }
            Err(e) => {
                log::warn!("⚠️  Error downloading {}: {}", model, e);
            }
        }
    }
    
    downloaded
}

/// Main startup routine - called on app launch
pub async fn initialize_local_ai() -> StartupResult {
    let start_time = std::time::Instant::now();
    
    log::info!("🚀 === LOCAL AI STARTUP SEQUENCE ===");
    
    let mut messages = vec!["🚀 Initializing local AI services...".to_string()];
    let mut statuses = vec![];
    let capabilities = detect_system_capabilities();
    
    // Log system capabilities
    log::info!(
        "📊 System Capabilities: {} cores, {:.1}GB RAM, GPU: {}, NVMe: {}",
        capabilities.cpu_cores,
        capabilities.total_ram_gb,
        capabilities
            .gpu_type
            .as_ref()
            .map(|g| g.as_str())
            .unwrap_or("None"),
        capabilities.has_nvme
    );
    
    messages.push(format!(
        "📊 System: {} cores, {:.1}GB RAM, GPU: {}, NVMe: {}",
        capabilities.cpu_cores,
        capabilities.total_ram_gb,
        capabilities
            .gpu_type
            .as_deref()
            .unwrap_or("None"),
        if capabilities.has_nvme { "Yes" } else { "No" }
    ));
    
    // Check Ollama
    log::info!("🔍 Checking Ollama...");
    let ollama_status = check_ollama_status().await;
    
    if ollama_status.installed && !ollama_status.running {
        log::info!("🔵 Ollama installed but not running, attempting to start...");
        messages.push("🔵 Starting Ollama service...".to_string());
        
        match start_ollama().await {
            Ok(_) => {
                log::info!("✅ Ollama start command issued");
                
                if wait_for_ollama_ready(10).await {
                    messages.push("✅ Ollama is running!".to_string());
                    
                    // Refresh status
                    let refreshed = check_ollama_status().await;
                    
                    if refreshed.available_models.is_empty() {
                        log::warn!("⚠️  Ollama running but no models found");
                        messages.push("⚠️  Ollama running but no models installed".to_string());
                        
                        let recommended = recommend_models_to_download(&capabilities);
                        log::info!("📦 Recommended models for your system: {:?}", recommended);
                        messages.push(format!(
                            "📦 Recommended models: {}",
                            recommended.join(", ")
                        ));
                        
                        log::info!("📥 Downloading recommended models (this may take a while)...");
                        messages.push("📥 Downloading models (this takes time, be patient)...".to_string());
                        
                        let downloaded = download_recommended_models(&recommended).await;
                        if !downloaded.is_empty() {
                            messages.push(format!("✅ Downloaded: {}", downloaded.join(", ")));
                        } else {
                            messages.push("⚠️  No models could be downloaded".to_string());
                        }
                        
                        statuses.push(check_ollama_status().await);
                    } else {
                        log::info!("✅ Ollama ready with {} models", refreshed.available_models.len());
                        messages.push(format!(
                            "✅ Ollama ready with models: {}",
                            refreshed.available_models.join(", ")
                        ));
                        statuses.push(refreshed);
                    }
                } else {
                    log::warn!("⚠️  Ollama failed to start within timeout");
                    messages.push("⚠️  Ollama failed to start (might already be running or have issues)".to_string());
                    statuses.push(ollama_status);
                }
            }
            Err(e) => {
                log::error!("❌ Failed to start Ollama: {}", e);
                messages.push(format!("❌ Failed to start Ollama: {}", e));
                statuses.push(ollama_status);
            }
        }
    } else if ollama_status.installed && ollama_status.running {
        log::info!("✅ Ollama already running");
        messages.push(format!(
            "✅ Ollama ready with {} models",
            ollama_status.available_models.len()
        ));
        statuses.push(ollama_status);
    } else if !ollama_status.installed {
        log::warn!("⚠️  Ollama not installed");
        messages.push(
            "⚠️  Ollama not installed. Install from: https://ollama.ai".to_string(),
        );
        statuses.push(ollama_status);
    }
    
    let elapsed = start_time.elapsed();
    log::info!(
        "🏁 Local AI startup complete in {}ms",
        elapsed.as_millis()
    );
    
    messages.push(format!("🏁 Startup completed in {}ms", elapsed.as_millis()));
    
    let all_systems_ready = statuses.iter().any(|s| s.running);
    
    StartupResult {
        all_systems_ready,
        statuses,
        total_startup_time_ms: elapsed.as_millis(),
        startup_messages: messages,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_system_capabilities_detection() {
        let caps = detect_system_capabilities();
        assert!(caps.cpu_cores > 0);
        assert!(caps.total_ram_gb > 0.0);
    }
    
    #[test]
    fn test_recommend_model() {
        let models = vec![
            "llama2:latest".to_string(),
            "neural-chat:latest".to_string(),
            "phi:latest".to_string(),
        ];
        
        let recommended = recommend_model(&models);
        assert!(recommended.is_some());
        assert_eq!(recommended.unwrap(), "llama2:latest");
    }
    
    #[test]
    fn test_model_recommendations_by_ram() {
        let high_ram = SystemCapabilities {
            cpu_cores: 16,
            total_ram_gb: 32.0,
            gpu_available: true,
            gpu_type: Some("NVIDIA".to_string()),
            has_nvme: true,
        };
        
        let recommendations = recommend_models_to_download(&high_ram);
        assert!(!recommendations.is_empty());
        assert!(recommendations.iter().any(|m| m.contains("13b")));
    }
}
