mod commands;
mod db;
mod state;
mod terminal;
mod kael;
mod firebase;
mod api;

use tauri::Manager;
use std::sync::Mutex;

fn main() {
    #[cfg_attr(mobile, tauri::mobile_entry_point)]
    fn run() {
        tauri::Builder::default()
            .setup(|app| {
                // Initialize database
                let db = db::init_db().expect("Failed to initialize database");
                app.manage(Mutex::new(db));
                
                log::info!("Kael-OS initialized successfully");
                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                commands::send_message,
                commands::get_chat_history,
                commands::execute_script,
                commands::execute_terminal_command,
                commands::get_kael_config,
                commands::save_kael_config,
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
    
    #[cfg(mobile)]
    run();
    
    #[cfg(not(mobile))]
    run();
}
