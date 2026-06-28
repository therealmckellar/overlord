import { getDb } from './db';

export function initQaTables() {
  const db = getDb();
  const sql = `
    CREATE TABLE IF NOT EXISTS qa_sessions (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      testType TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      startTime INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      endTime INTEGER,
      summary TEXT NOT NULL, 
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE IF NOT EXISTS qa_scenarios (
      sessionId TEXT NOT NULL,
      scenarioId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      screenshot TEXT,
      error TEXT,
      PRIMARY KEY (sessionId, scenarioId),
      FOREIGN KEY (sessionId) REFERENCES qa_sessions(id)
    );
  `;
  db.exec(sql);
}

export const qaDb = {
  createSession: (session: any) => {
    const db = getDb();
    const { id, url, testType, status, summary } = session;
    db.prepare('INSERT INTO qa_sessions (id, url, testType, status, summary) VALUES (?, ?, ?, ?, ?)')
      .run(id, url, testType, status, JSON.stringify(summary));
  },
  createScenario: (scenario: any) => {
    const db = getDb();
    db.prepare('INSERT INTO qa_scenarios (sessionId, scenarioId, status) VALUES (?, ?, ?)')
      .run(scenario.sessionId, scenario.scenarioId, scenario.status);
  },
  updateScenario: (sessionId: string, scenarioId: string, updates: any) => {
    const db = getDb();
    const { status, screenshot, error } = updates;
    db.prepare('UPDATE qa_scenarios SET status = ?, screenshot = ?, error = ? WHERE sessionId = ? AND scenarioId = ?')
      .run(status, screenshot, error, sessionId, scenarioId);
  },
  updateSession: (id: string, updates: any) => {
    const db = getDb();
    if (updates.status) {
      db.prepare('UPDATE qa_sessions SET status = ? WHERE id = ?').run(updates.status, id);
    }
    if (updates.summary) {
      db.prepare('UPDATE qa_sessions SET summary = ? WHERE id = ?').run(JSON.stringify(updates.summary), id);
    }
  },
  getSession: (id: string) => {
    const db = getDb();
    const session = db.prepare('SELECT * FROM qa_sessions WHERE id = ?').get(id) as any;
    if (!session) return null;
    const scenarios = db.prepare('SELECT * FROM qa_scenarios WHERE sessionId = ?').all(id) as any[];
    return { ...session, summary: JSON.parse(session.summary), scenarios };
  },
  getHistory: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM qa_sessions ORDER BY startTime DESC LIMIT 50').all() as any[];
  },
};
