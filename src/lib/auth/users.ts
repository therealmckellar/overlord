/**
 * User store — in-memory for now.
 * In production this would be a database (D1, Postgres, etc.)
 * Seed user: richard@mycommercialfunding.com / admin123
 */

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

// In-memory user store
const users: Map<string, User> = new Map();

// Seed admin user (async init)
let seeded = false;

async function seedAdmin() {
  if (seeded) return;
  seeded = true;

  const passwordHash = await hashPassword('admin123');
  const admin: User = {
    id: 'usr_admin_001',
    email: 'richard@mycommercialfunding.com',
    name: 'Richard',
    passwordHash,
    role: 'admin',
    createdAt: Date.now(),
  };
  users.set(admin.email, admin);
  users.set(admin.id, admin);
}

// Ensure seed runs
const seedPromise = seedAdmin();

export async function findByEmail(email: string): Promise<User | null> {
  await seedPromise;
  return users.get(email.toLowerCase()) || null;
}

export async function findById(id: string): Promise<User | null> {
  await seedPromise;
  return users.get(id) || null;
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}): Promise<User> {
  await seedPromise;

  const email = data.email.toLowerCase();
  if (users.has(email)) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(data.password);
  const user: User = {
    id: `usr_${Date.now().toString(36)}`,
    email,
    name: data.name,
    passwordHash,
    role: data.role || 'user',
    createdAt: Date.now(),
  };

  users.set(user.email, user);
  users.set(user.id, user);
  return user;
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  await seedPromise;
  const user = await findByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  // Update last login
  user.lastLoginAt = Date.now();
  return user;
}

export function toSafeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
