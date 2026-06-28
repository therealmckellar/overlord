import { getDb } from './db';
import { useCostStore } from '@/stores/costStore';

// Approximate pricing per 1M tokens (Blended Input/Output)
const MODEL_PRICING: Record<string, number> = {
  'openrouter/owl-alpha': 5.00,
  'openai/gpt-oss-120b:free': 0.00, 
  'google/gemma-4-31b-it:free': 0.00,
  'meta-llama/llama-3.2-3b-instruct:free': 0.00,
  'default': 10.00,
};

export interface SpendEvent {
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

export const costTracker = {
  calculateCost: (model: string, inputTokens: number, outputTokens: number): number => {
    const rate = MODEL_PRICING[model] || MODEL_PRICING['default'];
    // Simple approximation: (tokens / 1M) * rate
    return ((inputTokens + outputTokens) / 1_000_000) * rate;
  },

  async recordSpend(event: Omit<SpendEvent, 'timestamp' | 'cost'>) {
    const cost = this.calculateCost(event.model, event.inputTokens, event.outputTokens);
    const timestamp = Date.now();
    
    // 1. Update SQLite for persistence
    const db = getDb();
    db.prepare(`
      CREATE TABLE IF NOT EXISTS cost_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT,
        model TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost REAL,
        timestamp INTEGER
      )
    `).run();

    const stmt = db.prepare(`
      INSERT INTO cost_logs (agent_id, model, input_tokens, output_tokens, cost, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(event.agentId, event.model, event.inputTokens, event.outputTokens, cost, timestamp);

    // 2. Update Zustand store for real-time UI
    useCostStore.getState().recordSpend(event.agentId, event.model, cost);

    return cost;
  },

  async getSpendHistory() {
    const db = getDb();
    return db.prepare('SELECT * FROM cost_logs ORDER BY timestamp DESC LIMIT 100').all();
  }
};
