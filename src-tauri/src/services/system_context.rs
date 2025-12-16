// System Context Manager - Teaches local AIs about the system they're running on
// This runs on first launch and provides context to all AI providers

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use sysinfo::{System, Disks};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemContext {
    /// First launch timestamp
    pub first_launch: String,
    /// Last updated
    pub last_updated: String,
    /// System summary for AI context
    pub system_prompt: String,
    /// Hardware details
    pub hardware: HardwareContext,
    /// Software environment
    pub software: SoftwareContext,
    /// User preferences
    pub preferences: UserPreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareContext {
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub cpu_threads: usize,
    pub total_ram_gb: f64,
    pub available_ram_gb: f64,
    pub gpu_type: Option<String>,
    pub gpu_name: Option<String>,
    pub has_nvidia: bool,
    pub has_amd: bool,
    pub storage_type: String, // "NVMe", "SSD", "HDD", "Mixed"
    pub total_storage_gb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoftwareContext {
    pub os_name: String,
    pub os_version: String,
    pub distro: Option<String>,
    pub package_manager: Vec<String>, // ["pacman", "paru", "yay"]
    pub shell: String,
    pub has_docker: bool,
    pub has_ollama: bool,
    pub ollama_models: Vec<String>,
    pub has_python: bool,
    pub has_node: bool,
    pub has_rust: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub prefer_local_ai: bool,
    pub max_local_model_size_gb: u8,
    pub enable_gpu: bool,
    pub gaming_mode_default: bool,
    pub language: String,
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            prefer_local_ai: true,
            max_local_model_size_gb: 8,
            enable_gpu: true,
            gaming_mode_default: false,
            language: "en".to_string(),
        }
    }
}

impl SystemContext {
    /// Detect system on first launch
    pub async fn detect() -> Result<Self, String> {
        let now = chrono::Utc::now().to_rfc3339();
        
        let hardware = HardwareContext::detect().await?;
        let software = SoftwareContext::detect().await?;
        let preferences = UserPreferences::default();
        
        let system_prompt = Self::generate_prompt(&hardware, &software);
        
        Ok(Self {
            first_launch: now.clone(),
            last_updated: now,
            system_prompt,
            hardware,
            software,
            preferences,
        })
    }
    
    /// Generate AI system prompt from detected context
    fn generate_prompt(hw: &HardwareContext, sw: &SoftwareContext) -> String {
        let mut prompt = String::from("SYSTEM CONTEXT:\n");
        
        // Hardware summary
        prompt.push_str(&format!("Hardware: {} ({} cores, {} threads)\n", 
            hw.cpu_brand, hw.cpu_cores, hw.cpu_threads));
        prompt.push_str(&format!("RAM: {:.1}GB total, {:.1}GB available\n", 
            hw.total_ram_gb, hw.available_ram_gb));
        
        if let Some(gpu) = &hw.gpu_name {
            prompt.push_str(&format!("GPU: {} ({})\n", 
                gpu, 
                if hw.has_nvidia { "NVIDIA CUDA" } 
                else if hw.has_amd { "AMD ROCm" } 
                else { "Generic" }
            ));
        }
        
        prompt.push_str(&format!("Storage: {} ({:.0}GB)\n", 
            hw.storage_type, hw.total_storage_gb));
        
        // Software environment
        prompt.push_str(&format!("\nOS: {} {}\n", sw.os_name, sw.os_version));
        if let Some(distro) = &sw.distro {
            prompt.push_str(&format!("Distribution: {}\n", distro));
        }
        
        prompt.push_str(&format!("Shell: {}\n", sw.shell));
        
        if !sw.package_manager.is_empty() {
            prompt.push_str(&format!("Package managers: {}\n", 
                sw.package_manager.join(", ")));
        }
        
        // Available tools
        prompt.push_str("\nInstalled tools:\n");
        if sw.has_ollama {
            prompt.push_str("- Ollama (local AI)\n");
            if !sw.ollama_models.is_empty() {
                prompt.push_str(&format!("  Models: {}\n", 
                    sw.ollama_models.join(", ")));
            }
        }
        if sw.has_docker { prompt.push_str("- Docker\n"); }
        if sw.has_python { prompt.push_str("- Python\n"); }
        if sw.has_node { prompt.push_str("- Node.js\n"); }
        if sw.has_rust { prompt.push_str("- Rust\n"); }
        
        // Capabilities
        prompt.push_str("\nCAPABILITIES:\n");
        if hw.has_nvidia {
            prompt.push_str("- Can run GPU-accelerated local AI models (CUDA)\n");
        } else if hw.has_amd {
            prompt.push_str("- Can run GPU-accelerated local AI models (ROCm)\n");
        }
        
        if sw.has_ollama {
            prompt.push_str("- Local AI available for privacy-sensitive tasks\n");
        }
        
        if hw.total_ram_gb >= 16.0 {
            prompt.push_str("- Sufficient RAM for large language models\n");
        }
        
        if hw.storage_type.contains("NVMe") {
            prompt.push_str("- Fast storage for quick model loading\n");
        }
        
        prompt.push_str("\nINSTRUCTIONS:\n");
        prompt.push_str("- Use this context to provide system-appropriate recommendations\n");
        prompt.push_str("- Suggest local AI when available for privacy\n");
        prompt.push_str("- Consider hardware limits when recommending models/tools\n");
        prompt.push_str("- Use appropriate package manager commands\n");
        
        prompt
    }
    
    /// Save context to disk
    pub fn save(&self, path: &PathBuf) -> Result<(), String> {
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize: {}", e))?;
        
        fs::write(path, json)
            .map_err(|e| format!("Failed to write file: {}", e))?;
        
        Ok(())
    }
    
    /// Load existing context
    pub fn load(path: &PathBuf) -> Result<Self, String> {
        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse: {}", e))
    }
    
    /// Load from default user data directory (for use in llm.rs without AppHandle)
    pub fn load_from_default_path() -> Result<Self, String> {
        let home = std::env::var("HOME")
            .map_err(|_| "HOME environment variable not set".to_string())?;
        
        let path = PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("kael-os")
            .join("system_context.json");
        
        Self::load(&path)
    }
}

impl HardwareContext {
    pub async fn detect() -> Result<Self, String> {
        let mut sys = System::new_all();
        sys.refresh_all();
        
        // CPU detection
        let cpu_brand = sys.cpus()
            .first()
            .map(|cpu| cpu.brand().to_string())
            .unwrap_or_else(|| "Unknown CPU".to_string());
        
        let cpu_cores = sys.physical_core_count().unwrap_or(1);
        let cpu_threads = sys.cpus().len();
        
        // RAM detection
        let total_ram_gb = sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        let available_ram_gb = sys.available_memory() as f64 / 1024.0 / 1024.0 / 1024.0;
        
        // GPU detection
        let (gpu_type, gpu_name, has_nvidia, has_amd) = Self::detect_gpu().await;
        
        // Storage detection
        let (storage_type, total_storage_gb) = Self::detect_storage(&sys);
        
        Ok(Self {
            cpu_brand,
            cpu_cores,
            cpu_threads,
            total_ram_gb,
            available_ram_gb,
            gpu_type,
            gpu_name,
            has_nvidia,
            has_amd,
            storage_type,
            total_storage_gb,
        })
    }
    
    async fn detect_gpu() -> (Option<String>, Option<String>, bool, bool) {
        // Try nvidia-smi first
        if let Ok(output) = tokio::process::Command::new("nvidia-smi")
            .arg("--query-gpu=name")
            .arg("--format=csv,noheader")
            .output()
            .await
        {
            if output.status.success() {
                if let Ok(gpu_name) = String::from_utf8(output.stdout) {
                    let gpu_name = gpu_name.trim().to_string();
                    return (
                        Some("NVIDIA".to_string()),
                        Some(gpu_name),
                        true,
                        false,
                    );
                }
            }
        }
        
        // Try lspci for AMD
        if let Ok(output) = tokio::process::Command::new("lspci")
            .output()
            .await
        {
            if output.status.success() {
                if let Ok(lspci_out) = String::from_utf8(output.stdout) {
                    if let Some(line) = lspci_out.lines()
                        .find(|l| l.contains("VGA") || l.contains("3D"))
                    {
                        if line.contains("AMD") || line.contains("Radeon") {
                            return (
                                Some("AMD".to_string()),
                                Some(line.split(':').last().unwrap_or("AMD GPU").trim().to_string()),
                                false,
                                true,
                            );
                        }
                    }
                }
            }
        }
        
        (None, None, false, false)
    }
    
    fn detect_storage(_sys: &System) -> (String, f64) {
        let disks = Disks::new_with_refreshed_list();
        let mut has_nvme = false;
        let mut has_ssd = false;
        let mut has_hdd = false;
        let mut total_gb = 0.0;
        
        for disk in &disks {
            total_gb += disk.total_space() as f64 / 1024.0 / 1024.0 / 1024.0;
            
            let name = disk.name().to_string_lossy().to_lowercase();
            if name.contains("nvme") {
                has_nvme = true;
            } else if name.contains("ssd") {
                has_ssd = true;
            } else {
                has_hdd = true;
            }
        }
        
        let storage_type = if has_nvme && has_hdd {
            "Mixed (NVMe + HDD)".to_string()
        } else if has_nvme {
            "NVMe".to_string()
        } else if has_ssd && has_hdd {
            "Mixed (SSD + HDD)".to_string()
        } else if has_ssd {
            "SSD".to_string()
        } else {
            "HDD".to_string()
        };
        
        (storage_type, total_gb)
    }
}

impl SoftwareContext {
    pub async fn detect() -> Result<Self, String> {
        let os_name = std::env::consts::OS.to_string();
        let os_version = Self::get_os_version().await;
        let distro = Self::detect_distro().await;
        
        let package_manager = Self::detect_package_managers().await;
        let shell = std::env::var("SHELL")
            .unwrap_or_else(|_| "/bin/sh".to_string())
            .split('/')
            .last()
            .unwrap_or("sh")
            .to_string();
        
        let has_docker = Self::check_command("docker").await;
        let has_ollama = Self::check_command("ollama").await;
        let ollama_models = if has_ollama {
            Self::get_ollama_models().await
        } else {
            vec![]
        };
        
        let has_python = Self::check_command("python3").await 
            || Self::check_command("python").await;
        let has_node = Self::check_command("node").await;
        let has_rust = Self::check_command("rustc").await;
        
        Ok(Self {
            os_name,
            os_version,
            distro,
            package_manager,
            shell,
            has_docker,
            has_ollama,
            ollama_models,
            has_python,
            has_node,
            has_rust,
        })
    }
    
    async fn get_os_version() -> String {
        if let Ok(output) = tokio::process::Command::new("uname")
            .arg("-r")
            .output()
            .await
        {
            String::from_utf8_lossy(&output.stdout).trim().to_string()
        } else {
            "Unknown".to_string()
        }
    }
    
    async fn detect_distro() -> Option<String> {
        // Try /etc/os-release first
        if let Ok(content) = tokio::fs::read_to_string("/etc/os-release").await {
            for line in content.lines() {
                if line.starts_with("PRETTY_NAME=") {
                    return Some(
                        line.split('=')
                            .nth(1)?
                            .trim_matches('"')
                            .to_string()
                    );
                }
            }
        }
        None
    }
    
    async fn detect_package_managers() -> Vec<String> {
        let mut managers = Vec::new();
        
        for pm in &["paru", "yay", "pacman", "apt", "dnf", "zypper", "brew"] {
            if Self::check_command(pm).await {
                managers.push(pm.to_string());
            }
        }
        
        managers
    }
    
    async fn check_command(cmd: &str) -> bool {
        tokio::process::Command::new("which")
            .arg(cmd)
            .output()
            .await
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
    
    async fn get_ollama_models() -> Vec<String> {
        if let Ok(output) = tokio::process::Command::new("ollama")
            .arg("list")
            .output()
            .await
        {
            if output.status.success() {
                String::from_utf8_lossy(&output.stdout)
                    .lines()
                    .skip(1) // Skip header
                    .filter_map(|line| {
                        line.split_whitespace()
                            .next()
                            .map(|s| s.to_string())
                    })
                    .collect()
            } else {
                vec![]
            }
        } else {
            vec![]
        }
    }
}
