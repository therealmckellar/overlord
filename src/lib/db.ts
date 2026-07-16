import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "overlord.db");
  // Ensure the data directory exists before opening (silently fails on fresh installs otherwise)
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const newDb = new Database(dbPath);
  newDb.pragma("journal_mode = WAL");
  db = newDb;
  initTables();
  return db;
}

export function initTables() {
  const d = getDb();

  const tables = [
    `CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      base_branch TEXT NOT NULL DEFAULT 'main',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'merged', 'archived')),
      created_by TEXT,
      repo_path TEXT,
      worktree_path TEXT,
      pr_url TEXT,
      pr_number INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS workspace_comments (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      line_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      author TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )`,
    `CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'archived')),
      progress INTEGER NOT NULL DEFAULT 0,
      milestones TEXT,
      workspace_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS pipelines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      currentStageIndex INTEGER NOT NULL DEFAULT 0,
      stages TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )`,
    `CREATE TABLE IF NOT EXISTS social_verticals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS social_watch_terms (
      id TEXT PRIMARY KEY,
      vertical_id TEXT NOT NULL,
      term TEXT NOT NULL,
      term_type TEXT NOT NULL DEFAULT 'keyword',
      weight INTEGER NOT NULL DEFAULT 1,
      platform TEXT DEFAULT 'all',
      alert_on_spike INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (vertical_id) REFERENCES social_verticals(id)
    )`,
    `CREATE TABLE IF NOT EXISTS social_competitors (
      id TEXT PRIMARY KEY,
      vertical_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (vertical_id) REFERENCES social_verticals(id)
    )`,
    `CREATE TABLE IF NOT EXISTS social_accounts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      platform_user_id TEXT,
      account_name TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at INTEGER,
      status TEXT NOT NULL DEFAULT 'disconnected',
      last_sync INTEGER,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS social_mentions (
      id TEXT PRIMARY KEY,
      vertical_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      content TEXT,
      author_handle TEXT NOT NULL,
      author_name TEXT,
      url TEXT,
      mention_type TEXT NOT NULL DEFAULT 'brand',
      classification TEXT,
      sentiment_score REAL,
      engagement_count INTEGER DEFAULT 0,
      tracked_term TEXT,
      posted_at INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL,
      FOREIGN KEY (vertical_id) REFERENCES social_verticals(id)
    )`,
    `CREATE TABLE IF NOT EXISTS content_metrics (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      vertical_id TEXT,
      content_type TEXT NOT NULL,
      title TEXT,
      url TEXT,
      impressions INTEGER DEFAULT 0,
      engagements INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      recorded_at INTEGER NOT NULL,
      published_at INTEGER,
      source_pipeline_id TEXT,
      FOREIGN KEY (vertical_id) REFERENCES social_verticals(id)
    )`,
    `CREATE TABLE IF NOT EXISTS social_trends (
      id TEXT PRIMARY KEY,
      vertical_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      topic TEXT NOT NULL,
      volume INTEGER,
      velocity TEXT,
      velocity_score REAL,
      snippet TEXT,
      url TEXT,
      sentiment_score REAL,
      trending_at INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL,
      FOREIGN KEY (vertical_id) REFERENCES social_verticals(id)
    )`,
  ];

  for (const sql of tables) {
    d.exec(sql);
  }
}
