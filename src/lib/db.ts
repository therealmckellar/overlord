import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "overlord.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

export function initTables() {
  const d = getDb();
  const sql = "CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, name TEXT NOT NULL, branch TEXT NOT NULL, base_branch TEXT NOT NULL DEFAULT 'main', status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'merged', 'archived')), created_by TEXT, repo_path TEXT, worktree_path TEXT, pr_url TEXT, pr_number INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL); " +
    "CREATE TABLE IF NOT EXISTS workspace_comments (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, file_path TEXT NOT NULL, line_number INTEGER NOT NULL, content TEXT NOT NULL, author TEXT, created_at INTEGER NOT NULL, FOREIGN KEY (workspace_id) REFERENCES workspaces(id)); " +
    "CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'archived')), progress INTEGER NOT NULL DEFAULT 0, milestones TEXT, workspace_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL); " +
    "CREATE TABLE IF NOT EXISTS pipelines (id TEXT PRIMARY KEY, name TEXT NOT NULL, currentStageIndex INTEGER NOT NULL DEFAULT 0, stages TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')), updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')));";
  d.exec(sql);
}
