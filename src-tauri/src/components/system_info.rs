use dioxus::prelude::*;
use sysinfo::System;
use std::sync::{Arc, Mutex};

#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub ram_usage: f64,
    pub ram_total: u64,
    pub ram_used: u64,
    pub gpu_usage: f32,
    pub gpu_memory_used: u64,
    pub gpu_memory_total: u64,
}

impl Default for SystemStats {
    fn default() -> Self {
        SystemStats {
            cpu_usage: 0.0,
            ram_usage: 0.0,
            ram_total: 0,
            ram_used: 0,
            gpu_usage: 0.0,
            gpu_memory_used: 0,
            gpu_memory_total: 0,
        }
    }
}

async fn get_gpu_stats() -> (f32, u64, u64) {
    // Use nvidia-smi to get GPU stats
    match std::process::Command::new("nvidia-smi")
        .args(&["--query-gpu=utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"])
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let output_str = String::from_utf8_lossy(&output.stdout);
                let parts: Vec<&str> = output_str.trim().split(',').collect();
                if parts.len() >= 3 {
                    let usage = parts[0].trim().parse::<f32>().unwrap_or(0.0);
                    let used = parts[1].trim().parse::<u64>().unwrap_or(0) * 1024 * 1024; // Convert MiB to bytes
                    let total = parts[2].trim().parse::<u64>().unwrap_or(0) * 1024 * 1024;
                    return (usage, used, total);
                }
            }
        }
        Err(_) => {}
    }
    (0.0, 0, 0)
}

#[component]
pub fn SystemInfo() -> Element {
    let mut stats = use_signal(|| SystemStats::default());
    
    // Update stats every 5 seconds (less aggressive)
    use_future(move || async move {
        let sys = Arc::new(Mutex::new(System::new_all()));
        
        loop {
            // Update system info
            {
                let mut s = sys.lock().unwrap();
                s.refresh_cpu_usage();
                s.refresh_memory();
            }
            
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            
            let (cpu_usage, ram_used, ram_total, ram_usage) = {
                let s = sys.lock().unwrap();
                let cpu = s.global_cpu_info().cpu_usage();
                let used = s.used_memory();
                let total = s.total_memory();
                let usage = (used as f64 / total as f64) * 100.0;
                (cpu, used, total, usage)
            };
            
            // Only check GPU every other cycle (10 seconds instead of 5)
            static mut GPU_COUNTER: u32 = 0;
            let (gpu_usage, gpu_memory_used, gpu_memory_total) = unsafe {
                GPU_COUNTER += 1;
                if GPU_COUNTER % 2 == 0 {
                    get_gpu_stats().await
                } else {
                    (0.0, 0, 0) // Skip GPU check this cycle
                }
            };
            
            stats.set(SystemStats {
                cpu_usage,
                ram_usage,
                ram_total,
                ram_used,
                gpu_usage,
                gpu_memory_used,
                gpu_memory_total,
            });
            
            // Wait 5 seconds before next update
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
        }
    });
    
    let current_stats = stats.read();
    
    rsx! {
        div {
            class: "left-card p-3 mb-4",
            div { 
                class: "flex items-center justify-between mb-3",
                span { class: "section-label", "System Usage" }
                span { class: "text-[#7aebbe] text-xs", "⚡ Live" }
            }
            
            // CPU Usage
            div { class: "mb-3",
                div { class: "flex items-center justify-between mb-1",
                    span { style: "color: #f7f2ff; font-size: 12px; font-weight: 600;", "CPU" }
                    span { style: "color: #ffcc00; font-size: 12px;", "{current_stats.cpu_usage:.1}%" }
                }
                div { 
                    style: "height: 6px; background: #1f1631; border-radius: 3px; overflow: hidden; border: 1px solid #3a2d56;",
                    div { 
                        style: "height: 100%; background: linear-gradient(90deg, #ffcc00 0%, #e040fb 100%); width: {current_stats.cpu_usage}%; transition: width 0.3s ease;",
                    }
                }
            }
            
            // RAM Usage
            div { class: "mb-3",
                div { class: "flex items-center justify-between mb-1",
                    span { style: "color: #f7f2ff; font-size: 12px; font-weight: 600;", "RAM" }
                    span { 
                        style: "color: #7aebbe; font-size: 12px;", 
                        "{format_bytes(current_stats.ram_used)} / {format_bytes(current_stats.ram_total)} ({current_stats.ram_usage:.1}%)"
                    }
                }
                div { 
                    style: "height: 6px; background: #1f1631; border-radius: 3px; overflow: hidden; border: 1px solid #3a2d56;",
                    div { 
                        style: "height: 100%; background: linear-gradient(90deg, #7aebbe 0%, #5af0c8 100%); width: {current_stats.ram_usage}%; transition: width 0.3s ease;",
                    }
                }
            }
            
            // GPU Usage
            if current_stats.gpu_memory_total > 0 {
                div {
                    div { class: "flex items-center justify-between mb-1",
                        span { style: "color: #f7f2ff; font-size: 12px; font-weight: 600;", "GPU" }
                        span { style: "color: #e040fb; font-size: 12px;", "{current_stats.gpu_usage:.1}%" }
                    }
                    div { 
                        style: "height: 6px; background: #1f1631; border-radius: 3px; overflow: hidden; border: 1px solid #3a2d56; margin-bottom: 6px;",
                        div { 
                            style: "height: 100%; background: linear-gradient(90deg, #e040fb 0%, #ff6b9d 100%); width: {current_stats.gpu_usage}%; transition: width 0.3s ease;",
                        }
                    }
                    div { class: "flex items-center justify-between mb-1",
                        span { style: "color: #cbd5ff; font-size: 11px;", "VRAM" }
                        span { 
                            style: "color: #e040fb; font-size: 11px;", 
                            "{format_bytes(current_stats.gpu_memory_used)} / {format_bytes(current_stats.gpu_memory_total)}"
                        }
                    }
                    div { 
                        style: "height: 6px; background: #1f1631; border-radius: 3px; overflow: hidden; border: 1px solid #3a2d56;",
                        div { 
                            style: "height: 100%; background: linear-gradient(90deg, #e040fb 0%, #ff6b9d 100%); width: {(current_stats.gpu_memory_used as f64 / current_stats.gpu_memory_total as f64 * 100.0)}%; transition: width 0.3s ease;",
                        }
                    }
                }
            }
        }
    }
}

fn format_bytes(bytes: u64) -> String {
    const GB: u64 = 1024 * 1024 * 1024;
    const MB: u64 = 1024 * 1024;
    
    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.0} MB", bytes as f64 / MB as f64)
    } else {
        format!("{} KB", bytes / 1024)
    }
}
