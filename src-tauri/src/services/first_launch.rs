// First launch detection and system context initialization
// This runs once on app startup to teach AIs about the system

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::services::system_context::SystemContext;

/// Check if this is the first launch
pub fn is_first_launch(app: &AppHandle) -> bool {
    let context_path = get_context_path(app);
    !context_path.exists()
}

/// Get path to system context file
pub fn get_context_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("system_context.json")
}

/// Initialize system context on first launch
pub async fn initialize_first_launch(app: &AppHandle) -> Result<SystemContext, String> {
    println!("🔍 First launch detected - analyzing system...");
    
    // Detect system
    let context = SystemContext::detect().await?;
    
    // Save for future use
    let path = get_context_path(app);
    
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    
    context.save(&path)?;
    
    println!("✅ System context saved:");
    println!("   CPU: {} ({} cores)", context.hardware.cpu_brand, context.hardware.cpu_cores);
    println!("   RAM: {:.1}GB", context.hardware.total_ram_gb);
    if let Some(gpu) = &context.hardware.gpu_name {
        println!("   GPU: {}", gpu);
    }
    println!("   OS: {} {}", context.software.os_name, context.software.os_version);
    if context.software.has_ollama {
        println!("   Ollama: {} models available", context.software.ollama_models.len());
    }
    
    Ok(context)
}

/// Load or initialize system context
pub async fn get_or_init_context(app: &AppHandle) -> Result<SystemContext, String> {
    let path = get_context_path(app);
    
    if path.exists() {
        // Load existing
        SystemContext::load(&path)
    } else {
        // First launch - detect and save
        initialize_first_launch(app).await
    }
}

/// Refresh system context (e.g., after installing Ollama)
pub async fn refresh_context(app: &AppHandle) -> Result<SystemContext, String> {
    println!("🔄 Refreshing system context...");
    
    let mut context = SystemContext::detect().await?;
    
    // Keep original first_launch timestamp
    let path = get_context_path(app);
    if let Ok(existing) = SystemContext::load(&path) {
        context.first_launch = existing.first_launch;
        context.preferences = existing.preferences;
    }
    
    context.save(&path)?;
    
    println!("✅ System context refreshed");
    Ok(context)
}

// ==================== STANDALONE FUNCTIONS (for Dioxus Desktop) ====================

/// Get path to system context file (standalone version without AppHandle)
pub fn get_context_path_standalone() -> PathBuf {
    let home = std::env::var("HOME")
        .unwrap_or_else(|_| "/tmp".to_string());
    
    PathBuf::from(home)
        .join(".local")
        .join("share")
        .join("kael-os")
        .join("system_context.json")
}

/// Check if this is the first launch (standalone)
pub fn is_first_launch_standalone() -> bool {
    let context_path = get_context_path_standalone();
    !context_path.exists()
}

/// Initialize system context on first launch (standalone)
pub async fn initialize_first_launch_standalone() -> Result<SystemContext, String> {
    println!("🔍 First launch detected - analyzing system...");
    
    // Detect system
    let context = SystemContext::detect().await?;
    
    // Save for future use
    let path = get_context_path_standalone();
    
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    
    context.save(&path)?;
    
    println!("✅ System context saved:");
    println!("   CPU: {} ({} cores)", context.hardware.cpu_brand, context.hardware.cpu_cores);
    println!("   RAM: {:.1}GB", context.hardware.total_ram_gb);
    if let Some(gpu) = &context.hardware.gpu_name {
        println!("   GPU: {}", gpu);
    }
    println!("   OS: {} {}", context.software.os_name, context.software.os_version);
    if context.software.has_ollama {
        println!("   Ollama: {} models available", context.software.ollama_models.len());
    }
    
    Ok(context)
}

/// Load or initialize system context (standalone)
pub async fn get_or_init_context_standalone() -> Result<SystemContext, String> {
    let path = get_context_path_standalone();
    
    if path.exists() {
        // Load existing
        SystemContext::load(&path)
    } else {
        // First launch - detect and save
        initialize_first_launch_standalone().await
    }
}

/// Refresh system context (standalone)
pub async fn refresh_context_standalone() -> Result<SystemContext, String> {
    println!("🔄 Refreshing system context...");
    
    let mut context = SystemContext::detect().await?;
    
    // Keep original first_launch timestamp
    let path = get_context_path_standalone();
    if let Ok(existing) = SystemContext::load(&path) {
        context.first_launch = existing.first_launch;
        context.preferences = existing.preferences;
    }
    
    context.save(&path)?;
    
    println!("✅ System context refreshed");
    Ok(context)
}
