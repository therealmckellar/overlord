/**
 * Loop Engineering: track build outcomes, calculate success rates
 */

export interface BuildRecord {
  agent: string;
  task: string;
  success: boolean;
  timestamp: number;
  duration: number; // ms
}

const STORAGE_KEY = 'ol-loop-data';
const MAX_RECORDS = 100;

function getStorage(): BuildRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStorage(records: BuildRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch { /* ignore */ }
}

export function recordBuild(agent: string, task: string, success: boolean, duration: number) {
  const records = getStorage();
  records.push({ agent, task: task.slice(0, 100), success, timestamp: Date.now(), duration });
  saveStorage(records);
}

export function getAgentStats(agent: string): { total: number; successes: number; rate: number; avgDuration: number } {
  const records = getStorage().filter(r => r.agent === agent);
  const successes = records.filter(r => r.success).length;
  const avgDuration = records.length > 0
    ? records.reduce((sum, r) => sum + r.duration, 0) / records.length
    : 0;
  return {
    total: records.length,
    successes,
    rate: records.length > 0 ? successes / records.length : 0,
    avgDuration,
  };
}

export function getAllStats(): Record<string, ReturnType<typeof getAgentStats>> {
  const records = getStorage();
  const agents = [...new Set(records.map(r => r.agent))];
  const result: Record<string, ReturnType<typeof getAgentStats>> = {};
  for (const agent of agents) {
    result[agent] = getAgentStats(agent);
  }
  return result;
}

export function getOverallHealth(): number {
  const records = getStorage();
  if (records.length === 0) return 1;
  const successes = records.filter(r => r.success).length;
  return successes / records.length;
}

export function getRecentBuilds(limit = 20): BuildRecord[] {
  return getStorage().slice(-limit).reverse();
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
