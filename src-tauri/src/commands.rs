use crate::state::{ChatMessage, KaelConfig};
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn send_message(
    message: String,
    db: State<Mutex<Connection>>,
) -> Result<ChatMessage, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    let msg = ChatMessage::new("user".to_string(), message);
    
    crate::db::add_message(&conn, &msg.role, &msg.text)
        .map_err(|e| e.to_string())?;
    
    Ok(msg)
}

#[tauri::command]
pub fn get_chat_history(
    db: State<Mutex<Connection>>,
) -> Result<Vec<ChatMessage>, String> {
    let conn = db.lock().map_err(|e| e.to_string())?;
    crate::db::get_chat_history(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn execute_script(script: String) -> Result<String, String> {
    log::info!("Executing script: {}", script);
    Ok(format!("Script executed: {}", script))
}

#[tauri::command]
pub fn execute_terminal_command(command: String) -> Result<String, String> {
    log::info!("Terminal command: {}", command);
    Ok(format!("Command output: {}", command))
}

#[tauri::command]
pub fn get_kael_config() -> Result<KaelConfig, String> {
    Ok(KaelConfig::default())
}

#[tauri::command]
pub fn save_kael_config(config: KaelConfig) -> Result<(), String> {
    log::info!("Saving Kael config: {:?}", config);
    Ok(())
}
