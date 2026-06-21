/**
 * SQLite-backed user store.
 * Replaces the in-memory Map from users.ts.
 *
 * DB file: data/overlord.db (gitignored)
 * Table: users (id, email, name, password_hash, role, created_at, last_login_at)
 *
 * Seed user: richard@mycommercialfunding.com / admin123
 */

import Database from 'better-sqlite3';
import path from 'path';
import { hashPassword, verifyPassword } from './hash';

export interface User {
  id: string;
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
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at INTEGER NOT NULL,
      last_login_at INTEGER
    );
  `);

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
    const existing = database.prepare('SELECT id FROM users WHERE email = ?').get('richard@mycommercialfunding.com');
    if (existing) {
      seeded = true;
      return;
    }

    const passwordHash = await hashPassword('admin123');
    const now = Date.now();
    database.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('usr_admin_001', 'richard@mycommercialfunding.com', 'Richard', passwordHash, 'admin', now);

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
    id: string; email: string; name: string; password_hash: string; role: string; created_at: number; last_login_at: number | null;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
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
    id: string; email: string; name: string; password_hash: string; role: string; created_at: number; last_login_at: number | null;
  } | undefined;

  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || undefined,
  };
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}): Promise<User> {
  await initPromise;
  const database = getDb();
  const email = data.email.toLowerCase();

  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(data.password);
  const id = `usr_${Date.now().toString(36)}`;
  const now = Date.now();

  database.prepare(`
    INSERT INTO users (id, email, name, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, data.name, passwordHash, data.role || 'user', now);

  return {
    id,
    email,
    name: data.name,
    passwordHash,
    role: data.role || 'user',
    createdAt: now,
  };
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  await initPromise;
  const user = await findByEmail(email);
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

export async function updateUser(id: string, data: { name?: string; password?: string }): Promise<User | null> {
  await initPromise;
  const database = getDb();
  const user = await findById(id);
  if (!user) return null;

  const updates: string[] = [];
  const params: (string | number)[] = [];

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
  const rows = database.prepare('SELECT id, email, name, role, created_at, last_login_at FROM users ORDER BY created_at DESC').all() as {
    id: string; email: string; name: string; role: string; created_at: number; last_login_at: number | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
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
