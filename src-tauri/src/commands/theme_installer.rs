// src-tauri/src/commands/theme_installer.rs
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, thiserror::Error)]
pub enum ThemeError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Command failed: {0}")]
    CommandFailed(String),
    #[error("Unsupported desktop environment")]
    UnsupportedDE,
}

pub struct ThemeInstaller;

impl ThemeInstaller {
    /// Install wallpaper to the current desktop environment
    pub fn install_wallpaper(wallpaper_path: &Path) -> Result<String, ThemeError> {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/home/user".to_string());
        
        // Detect desktop environment
        let desktop = Self::detect_desktop_environment();
        
        match desktop.as_str() {
            "KDE" | "PLASMA" => Self::install_kde_wallpaper(&home, wallpaper_path),
            "GNOME" => Self::install_gnome_wallpaper(wallpaper_path),
            "XFCE" => Self::install_xfce_wallpaper(wallpaper_path),
            _ => {
                // Generic fallback - copy to Pictures and try feh/nitrogen
                Self::install_generic_wallpaper(&home, wallpaper_path)
            }
        }
    }
    
    /// Install GRUB theme (requires sudo)
    pub fn install_grub_theme(grub_image_path: &Path) -> Result<String, ThemeError> {
        // Copy GRUB image to a user-accessible location first
        let home = std::env::var("HOME").unwrap_or_else(|_| "/home/user".to_string());
        let local_grub = PathBuf::from(&home).join(".local/share/kael-os/grub-theme.jpg");
        
        // Ensure directory exists
        if let Some(parent) = local_grub.parent() {
            fs::create_dir_all(parent)?;
        }
        
        // Copy image
        fs::copy(grub_image_path, &local_grub)?;
        
        Ok(format!(
            "GRUB theme image prepared at: {}\n\nTo install (requires sudo):\n\
            sudo cp {} /boot/grub/themes/kael-dragon.jpg\n\
            Then edit /etc/default/grub and add:\n\
            GRUB_BACKGROUND=\"/boot/grub/themes/kael-dragon.jpg\"\n\
            Finally run: sudo grub-mkconfig -o /boot/grub/grub.cfg",
            local_grub.display(),
            local_grub.display()
        ))
    }
    
    fn detect_desktop_environment() -> String {
        // Check environment variables
        if let Ok(desktop) = std::env::var("XDG_CURRENT_DESKTOP") {
            return desktop.to_uppercase();
        }
        
        if let Ok(session) = std::env::var("DESKTOP_SESSION") {
            return session.to_uppercase();
        }
        
        // Check for running processes
        if Command::new("pgrep")
            .arg("plasmashell")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return "KDE".to_string();
        }
        
        if Command::new("pgrep")
            .arg("gnome-shell")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return "GNOME".to_string();
        }
        
        "UNKNOWN".to_string()
    }
    
    fn install_kde_wallpaper(home: &str, wallpaper_path: &Path) -> Result<String, ThemeError> {
        // Copy to Pictures
        let pictures = PathBuf::from(home).join("Pictures/kael-dragon-wallpaper.jpg");
        fs::copy(wallpaper_path, &pictures)?;
        
        // Try to set via plasma-apply-wallpaperimage
        let output = Command::new("plasma-apply-wallpaperimage")
            .arg(&pictures)
            .output();
            
        match output {
            Ok(output) if output.status.success() => {
                Ok(format!("✅ Wallpaper installed and set for KDE Plasma!\nLocation: {}", pictures.display()))
            }
            _ => {
                // Fallback: just copy the file
                Ok(format!(
                    "Wallpaper copied to: {}\n\
                    Right-click desktop → Configure Desktop and Wallpaper → select the image",
                    pictures.display()
                ))
            }
        }
    }
    
    fn install_gnome_wallpaper(wallpaper_path: &Path) -> Result<String, ThemeError> {
        let wallpaper_str = wallpaper_path.to_string_lossy();
        
        let output = Command::new("gsettings")
            .args(&[
                "set",
                "org.gnome.desktop.background",
                "picture-uri",
                &format!("file://{}", wallpaper_str),
            ])
            .output();
            
        match output {
            Ok(output) if output.status.success() => {
                Ok(format!("✅ Wallpaper set for GNOME!\nLocation: {}", wallpaper_str))
            }
            _ => Err(ThemeError::CommandFailed("gsettings failed".to_string())),
        }
    }
    
    fn install_xfce_wallpaper(wallpaper_path: &Path) -> Result<String, ThemeError> {
        let wallpaper_str = wallpaper_path.to_string_lossy();
        
        let output = Command::new("xfconf-query")
            .args(&[
                "-c",
                "xfce4-desktop",
                "-p",
                "/backdrop/screen0/monitor0/workspace0/last-image",
                "-s",
                &wallpaper_str,
            ])
            .output();
            
        match output {
            Ok(output) if output.status.success() => {
                Ok(format!("✅ Wallpaper set for XFCE!\nLocation: {}", wallpaper_str))
            }
            _ => Err(ThemeError::CommandFailed("xfconf-query failed".to_string())),
        }
    }
    
    fn install_generic_wallpaper(home: &str, wallpaper_path: &Path) -> Result<String, ThemeError> {
        let pictures = PathBuf::from(home).join("Pictures/kael-dragon-wallpaper.jpg");
        fs::copy(wallpaper_path, &pictures)?;
        
        // Try feh
        let feh_result = Command::new("feh")
            .args(&["--bg-fill", &pictures.to_string_lossy()])
            .output();
            
        if feh_result.map(|o| o.status.success()).unwrap_or(false) {
            return Ok(format!("✅ Wallpaper set using feh!\nLocation: {}", pictures.display()));
        }
        
        // Try nitrogen
        let nitrogen_result = Command::new("nitrogen")
            .args(&["--set-zoom-fill", &pictures.to_string_lossy()])
            .output();
            
        if nitrogen_result.map(|o| o.status.success()).unwrap_or(false) {
            return Ok(format!("✅ Wallpaper set using nitrogen!\nLocation: {}", pictures.display()));
        }
        
        // Fallback: just copy
        Ok(format!(
            "Wallpaper copied to: {}\n\
            Please set it manually from your desktop settings",
            pictures.display()
        ))
    }
}

#[tauri::command]
pub async fn install_wallpaper() -> Result<String, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe dir: {}", e))?
        .parent()
        .ok_or("No parent dir")?
        .to_path_buf();
    
    // Look for wallpaper in multiple locations
    let possible_paths = vec![
        exe_dir.join("../share/kael-os/wallpapers/kael-dragon-wallpaper.jpg"),
        exe_dir.join("assets/wallpapers/kael-dragon-wallpaper.jpg"),
        PathBuf::from("/usr/share/kael-os/wallpapers/kael-dragon-wallpaper.jpg"),
    ];
    
    for path in possible_paths {
        if path.exists() {
            return ThemeInstaller::install_wallpaper(&path)
                .map_err(|e| format!("Failed to install wallpaper: {}", e));
        }
    }
    
    Err("Wallpaper file not found. Please ensure Kael-OS is properly installed.".to_string())
}

#[tauri::command]
pub async fn install_grub_theme() -> Result<String, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe dir: {}", e))?
        .parent()
        .ok_or("No parent dir")?
        .to_path_buf();
    
    let possible_paths = vec![
        exe_dir.join("../share/kael-os/grub/kael-dragon-grub.jpg"),
        exe_dir.join("assets/grub/kael-dragon-grub.jpg"),
        PathBuf::from("/usr/share/kael-os/grub/kael-dragon-grub.jpg"),
    ];
    
    for path in possible_paths {
        if path.exists() {
            return ThemeInstaller::install_grub_theme(&path)
                .map_err(|e| format!("Failed to prepare GRUB theme: {}", e));
        }
    }
    
    Err("GRUB theme file not found. Please ensure Kael-OS is properly installed.".to_string())
}
