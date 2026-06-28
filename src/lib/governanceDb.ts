import { getDb } from '@/lib/db';

export function initGovernanceTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS governance_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      user TEXT NOT NULL,
      need TEXT,
      risk TEXT,
      owner TEXT,
      status TEXT NOT NULL CHECK(status IN ('approved', 'overridden')),
      overrideReason TEXT
    );
  `);
}
