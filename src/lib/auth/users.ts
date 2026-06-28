/**
 * SQLite-backed user store.
 * Replaces the in-memory Map from users.ts.
 *
 * DB file: data/overlord.db (gitignored)
 * Table: users (id, username, email, name, password_hash, role, created_at, last_login_at)
 *
 * Seed user: mckellardev / admin123 (email kept as recovery contact)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { hashPassword, verifyPassword } from './hash';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'overlord.db');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  // Create users table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at INTEGER NOT NULL,
      last_login_at INTEGER
    );
  `);

  // Migration: add username column if missing
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.find(c => c.name === 'username')) {
    db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
    db.exec(`UPDATE users SET username = 'mckellardev' WHERE id = 'usr_admin_001'`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  }

  return db;
}

// Seed admin user on first access
let seeded = false;
let seedPromise: Promise<void> | null = null;

async function ensureSeed() {
  if (seeded) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const database = getDb();
    const existing = database.prepare('SELECT id FROM users WHERE username = ?').get('mckellardev');
    if (existing) {
      seeded = true;
      return;
    }

    const passwordHash = await hashPassword('admin123');
    const now = Date.now();
    database.prepare(`
      INSERT INTO users (id, username, email, name, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('usr_admin_001', 'mckellardev', 'richard@mycommercialfunding.com', 'mckellardev', passwordHash, 'admin', now);

    seeded = true;
  })();

  return seedPromise;
}

// Initialize seed on module load
const initPromise = ensureSeed();

export async function findByEmail(email: string): Promise<User | null> {
  await initPromise;
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as {
    id: string; username: string; email: string; name: string; password_hash: string; role: string; created_at: number; last_login_at: number | null;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
}

export async function findByUsername(username: string): Promise<User | null> {
  await initPromise;
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase()) as {
    id: string; username: string; email: string; name: string; password_hash: string; role: string; created_at: number; last_login_at: number | null;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
}

export async function findById(id: string): Promise<User | null> {
  await initPromise;
  const database = getDb();
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
    id: string; username: string; email: string; name: string; password_hash: string; role: string; created_at: number; last_login_at: number | null;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
}

export async function createUser(data: {
  username: string;
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}): Promise<User> {
  await initPromise;
  const database = getDb();
  const username = data.username.toLowerCase();
  const email = data.email.toLowerCase();

  const existing = database.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(data.password);
  const id = `usr_${Date.now().toString(36)}`;
  const now = Date.now();

  database.prepare(`
    INSERT INTO users (id, username, email, name, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, username, email, data.name, passwordHash, data.role || 'user', now);

  return {
    id,
    username,
    email,
    name: data.name,
    passwordHash,
    role: data.role || 'user',
    createdAt: now,
  };
}

export async function validateCredentials(
  identifier: string,
  password: string
): Promise<User | null> {
  await initPromise;
  // Try username first, then email
  const user = await findByUsername(identifier) || await findByEmail(identifier);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Update last login
  const database = getDb();
  const now = Date.now();
  database.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);
  user.lastLoginAt = now;

  return user;
}

export async function updateUser(id: string, data: { username?: string; name?: string; password?: string }): Promise<User | null> {
  await initPromise;
  const database = getDb();
  const user = await findById(id);
  if (!user) return null;

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (data.username) {
    updates.push('username = ?');
    params.push(data.username.toLowerCase());
  }

  if (data.name) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.password) {
    const passwordHash = await hashPassword(data.password);
    updates.push('password_hash = ?');
    params.push(passwordHash);
  }

  if (updates.length === 0) return user;

  params.push(id);
  database.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  return findById(id);
}

export async function deleteUser(id: string): Promise<boolean> {
  await initPromise;
  const database = getDb();
  const result = database.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  await initPromise;
  const database = getDb();
  const rows = database.prepare('SELECT id, username, email, name, role, created_at, last_login_at FROM users ORDER BY created_at DESC').all() as {
    id: string; username: string; email: string; name: string; role: string; created_at: number; last_login_at: number | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    role: row.role as 'admin' | 'user',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  }));
}

export function toSafeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
