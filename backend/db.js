const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'guidebook.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
function initializeDatabase() {
  // Assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      course_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      require_extra_ai_logs BOOLEAN DEFAULT 0,
      require_extra_declarations BOOLEAN DEFAULT 0,
      extra_ai_logs_content TEXT,
      extra_declarations_content TEXT
    )
  `);

  // AI Logs table (for students)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      description TEXT,
      purpose TEXT,
      duration_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    )
  `);

  // AI Declarations table (for students)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id TEXT NOT NULL,
      declaration_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    )
  `);
}

initializeDatabase();

module.exports = db;
