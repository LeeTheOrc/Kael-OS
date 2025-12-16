// Chat History Module - SQLite-based persistence
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub provider: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub conversation_id: i64,
    pub role: String, // "user" or "assistant"
    pub content: String,
    pub timestamp: String,
}

pub struct ChatHistory {
    db_path: PathBuf,
}

impl ChatHistory {
    /// Initialize chat history database
    pub fn new() -> Result<Self, String> {
        let db_path = Self::get_db_path()?;

        // Create parent directory if needed
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create chat history directory: {}", e))?;
        }

        let history = ChatHistory { db_path };
        history.init_database()?;
        Ok(history)
    }

    /// Get database file path
    fn get_db_path() -> Result<PathBuf, String> {
        let home =
            std::env::var("HOME").map_err(|_| "HOME environment variable not set".to_string())?;
        Ok(PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("kael-os")
            .join("chat_history.db"))
    }

    /// Get database connection
    fn get_connection(&self) -> Result<Connection, String> {
        Connection::open(&self.db_path).map_err(|e| format!("Failed to open database: {}", e))
    }

    /// Initialize database schema
    fn init_database(&self) -> Result<(), String> {
        let conn = self.get_connection()?;

        // Create conversations table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                provider TEXT NOT NULL,
                model TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| format!("Failed to create conversations table: {}", e))?;

        // Create messages table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            )",
            [],
        )
        .map_err(|e| format!("Failed to create messages table: {}", e))?;

        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_messages_conversation 
             ON messages(conversation_id)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_updated 
             ON conversations(updated_at DESC)",
            [],
        )
        .map_err(|e| format!("Failed to create index: {}", e))?;

        Ok(())
    }

    /// Create a new conversation
    pub fn create_conversation(
        &self,
        title: &str,
        provider: &str,
        model: &str,
    ) -> Result<i64, String> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO conversations (title, provider, model) VALUES (?1, ?2, ?3)",
            params![title, provider, model],
        )
        .map_err(|e| format!("Failed to create conversation: {}", e))?;

        Ok(conn.last_insert_rowid())
    }

    /// Add a message to a conversation
    pub fn add_message(
        &self,
        conversation_id: i64,
        role: &str,
        content: &str,
    ) -> Result<i64, String> {
        let conn = self.get_connection()?;

        // Add message
        conn.execute(
            "INSERT INTO messages (conversation_id, role, content) VALUES (?1, ?2, ?3)",
            params![conversation_id, role, content],
        )
        .map_err(|e| format!("Failed to add message: {}", e))?;

        // Update conversation updated_at
        conn.execute(
            "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?1",
            params![conversation_id],
        )
        .map_err(|e| format!("Failed to update conversation timestamp: {}", e))?;

        Ok(conn.last_insert_rowid())
    }

    /// Get all conversations (most recent first)
    pub fn get_conversations(&self) -> Result<Vec<Conversation>, String> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, title, created_at, updated_at, provider, model 
                      FROM conversations ORDER BY updated_at DESC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let conversations = stmt
            .query_map([], |row| {
                Ok(Conversation {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    provider: row.get(4)?,
                    model: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query conversations: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect conversations: {}", e))?;

        Ok(conversations)
    }

    /// Get messages for a conversation
    pub fn get_messages(&self, conversation_id: i64) -> Result<Vec<Message>, String> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, conversation_id, role, content, timestamp 
                 FROM messages WHERE conversation_id = ?1 ORDER BY timestamp ASC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let messages = stmt
            .query_map(params![conversation_id], |row| {
                Ok(Message {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    timestamp: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to query messages: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect messages: {}", e))?;

        Ok(messages)
    }

    /// Delete a conversation and its messages
    pub fn delete_conversation(&self, conversation_id: i64) -> Result<(), String> {
        let conn = self.get_connection()?;
        conn.execute(
            "DELETE FROM conversations WHERE id = ?1",
            params![conversation_id],
        )
        .map_err(|e| format!("Failed to delete conversation: {}", e))?;

        Ok(())
    }

    /// Update conversation title
    pub fn update_title(&self, conversation_id: i64, new_title: &str) -> Result<(), String> {
        let conn = self.get_connection()?;
        conn.execute(
            "UPDATE conversations SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![new_title, conversation_id],
        )
        .map_err(|e| format!("Failed to update title: {}", e))?;

        Ok(())
    }

    /// Search conversations by title
    pub fn search_conversations(&self, query: &str) -> Result<Vec<Conversation>, String> {
        let conn = self.get_connection()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, title, created_at, updated_at, provider, model 
                 FROM conversations WHERE title LIKE ?1 ORDER BY updated_at DESC",
            )
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let search_query = format!("%{}%", query);
        let conversations = stmt
            .query_map(params![search_query], |row| {
                Ok(Conversation {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    provider: row.get(4)?,
                    model: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query conversations: {}", e))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("Failed to collect conversations: {}", e))?;

        Ok(conversations)
    }

    /// Export conversation to JSON
    pub fn export_conversation(&self, conversation_id: i64) -> Result<String, String> {
        let conn = self.get_connection()?;

        // Get conversation
        let mut conv_stmt = conn
            .prepare("SELECT id, title, created_at, updated_at, provider, model FROM conversations WHERE id = ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let conversation: Conversation = conv_stmt
            .query_row(params![conversation_id], |row| {
                Ok(Conversation {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                    provider: row.get(4)?,
                    model: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to get conversation: {}", e))?;

        // Get messages
        let messages = self.get_messages(conversation_id)?;

        let export = serde_json::json!({
            "conversation": conversation,
            "messages": messages
        });

        serde_json::to_string_pretty(&export)
            .map_err(|e| format!("Failed to serialize export: {}", e))
    }

    /// Get database statistics
    pub fn get_stats(&self) -> Result<(usize, usize), String> {
        let conn = self.get_connection()?;

        let conv_count: usize = conn
            .query_row("SELECT COUNT(*) FROM conversations", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count conversations: {}", e))?;

        let msg_count: usize = conn
            .query_row("SELECT COUNT(*) FROM messages", [], |row| row.get(0))
            .map_err(|e| format!("Failed to count messages: {}", e))?;

        Ok((conv_count, msg_count))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_history() {
        let history = ChatHistory::new().unwrap();

        // Create conversation
        let conv_id = history
            .create_conversation("Test Chat", "ollama", "llama2")
            .unwrap();

        // Add messages
        history.add_message(conv_id, "user", "Hello!").unwrap();
        history
            .add_message(conv_id, "assistant", "Hi there!")
            .unwrap();

        // Get messages
        let messages = history.get_messages(conv_id).unwrap();
        assert_eq!(messages.len(), 2);

        // Search
        let results = history.search_conversations("Test").unwrap();
        assert_eq!(results.len(), 1);

        // Export
        let export = history.export_conversation(conv_id).unwrap();
        assert!(export.contains("Test Chat"));
    }
}
