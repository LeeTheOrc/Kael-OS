use rusqlite::{Connection, Result as SqlResult};

pub fn run_migrations(conn: &Connection) -> SqlResult<()> {
    // Create chat_messages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            text TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced INTEGER DEFAULT 0
        )",
        [],
    )?;

    // Create scripts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS scripts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Create kael_config table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kael_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    log::info!("Database migrations completed");
    Ok(())
}
