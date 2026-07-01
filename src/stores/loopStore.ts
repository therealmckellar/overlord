import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Inlined from lib/loop-patterns (deleted) ---
interface LoopPattern {
  id: string;
  name: string;
  description: string;
  lane: string;
  cadence: string;
  maxIterations: number;
  prompt: string;
  estimatedTokensPerIteration: number;
  readinessLevel: 'L1' | 'L2' | 'L3';
  riskLevel: 'low' | 'medium' | 'high';
  requiresSubAgents: boolean;
  requiresMCP: boolean;
  humanGateOn: 'never' | 'always' | 'risky';
  version: string;
  tags: string[];
}

function estimateMonthlyCost(pattern: LoopPattern): number {
  const cadenceMinutes: Record<string, number> = { '15m': 15, '30m': 30, '1h': 60, '2h': 120, '6h': 360, '1d': 1440, '1w': 10080 };
  const runsPerMonth = (30 * 24 * 60) / (cadenceMinutes[pattern.cadence] || 1440);
  const costPerRun = (pattern.estimatedTokensPerIteration / 1000) * 0.01;
  return Math.round(runsPerMonth * costPerRun * 100) / 100;
}

function getReadinessScore(pattern: LoopPattern): number {
  let score = 0;
  if (pattern.readinessLevel === 'L1') score += 30;
  if (pattern.readinessLevel === 'L2') score += 60;
  if (pattern.readinessLevel === 'L3') score += 90;
  if (pattern.riskLevel === 'low') score += 10;
  if (pattern.riskLevel === 'medium') score += 5;
  if (!pattern.requiresSubAgents) score += 5;
  if (!pattern.requiresMCP) score += 5;
  return Math.min(100, score);
}
// --- End inlined ---

export interface LoopResult {
  iteration: number;
  model: string;
  score: number;
  output: string;
  duration: number;
  timestamp: number;
}

export interface LoopTask {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  model: string;
  maxIterations: number;
  currentIteration: number;
  prompt: string;
  results: LoopResult[];
  bestScore: number;
  bestModel: string;
  createdAt: number;
  // Pattern Template integration
  patternId?: string;           // ID of the LoopPattern this task was created from
  lane?: string;                // business lane
  cadence?: string;             // e.g. '1d', '2h'
  estimatedMonthlyCost?: number; // USD
  readinessScore?: number;      // 0-100
  riskLevel?: 'low' | 'medium' | 'high';
  rubric?: string[];              // Ship readiness criteria
  rubricStatus?: ('pending' | 'passed' | 'failed')[];
}

interface LoopState {
  loops: LoopTask[];
  activeAbortControllers: Map<string, AbortController>;
  createLoop: (loop: Omit<LoopTask, 'id' | 'status' | 'currentIteration' | 'results' | 'bestScore' | 'bestModel' | 'createdAt'>) => string;
  createLoopFromPattern: (pattern: LoopPattern, model?: string) => string;
  startLoop: (id: string) => Promise<void>;
  stopLoop: (id: string) => void;
  updateLoop: (id: string, changes: Partial<LoopTask>) => void;
  deleteLoop: (id: string) => void;
}

export const useLoopStore = create<LoopState>()(
  persist(
    (set, get) => ({
      loops: [],
      activeAbortControllers: new Map(),

      createLoop: (loopConfig) => {
        const id = 'loop_' + Math.random().toString(36).substr(2, 9);
        const newLoop: LoopTask = {
          ...loopConfig,
          id,
          status: 'idle',
          currentIteration: 0,
          results: [],
          bestScore: 0,
          bestModel: loopConfig.model,
          createdAt: Date.now(),
        };
        set((state) => ({ loops: [...state.loops, newLoop] }));
        return id;
      },

      createLoopFromPattern: (pattern, model) => {
        const id = 'loop_' + Math.random().toString(36).substr(2, 9);
        const newLoop: LoopTask = {
          id,
          name: pattern.name,
          description: pattern.description,
          model: model || 'google/gemma-4-31b-it:free',
          maxIterations: pattern.maxIterations,
          prompt: pattern.prompt,
          status: 'idle',
          currentIteration: 0,
          results: [],
          bestScore: 0,
          bestModel: model || 'google/gemma-4-31b-it:free',
          createdAt: Date.now(),
          patternId: pattern.id,
          lane: pattern.lane,
          cadence: pattern.cadence,
          estimatedMonthlyCost: estimateMonthlyCost(pattern),
          readinessScore: getReadinessScore(pattern),
          riskLevel: pattern.riskLevel,
        };
        set((state) => ({ loops: [...state.loops, newLoop] }));
        return id;
      },

      startLoop: async (id: string) => {
        const loop = get().loops.find((l) => l.id === id);
        if (!loop || loop.status === 'running') return;

        const abortController = new AbortController();
        set((state) => {
          const newControllers = new Map(state.activeAbortControllers);
          newControllers.set(id, abortController);
          return {
            loops: state.loops.map((l) =>
              l.id === id ? { ...l, status: 'running' as const, currentIteration: 0, results: [], bestScore: 0 } : l
            ),
            activeAbortControllers: newControllers,
          };
        });

        const startTime = Date.now();
        const results: LoopResult[] = [];

        for (let i = 1; i <= loop.maxIterations; i++) {
          if (abortController.signal.aborted) break;

          const iterStart = Date.now();

          try {
            const response = await fetch('/api/agents/spawn', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'loop',
                config: {
                  prompt: loop.prompt,
                  model: loop.model,
                  iteration: i,
                  maxIterations: loop.maxIterations,
                  taskName: loop.name,
                },
              }),
              signal: abortController.signal,
            });

            const data = await response.json();
            const duration = Date.now() - iterStart;

            // Calculate score (simple heuristic based on output length and quality signals)
            const output = data.output || '';
            const score = Math.min(100, Math.floor(50 + (output.length > 100 ? 20 : 0) + (output.includes('✅') || output.includes('✓') ? 15 : 0) + Math.random() * 15));

            const result: LoopResult = {
              iteration: i,
              model: loop.model,
              score: Math.round(score),
              output: output.slice(0, 500),
              duration,
              timestamp: Date.now(),
            };

            results.push(result);

            const bestScore = Math.max(...results.map((r) => r.score));

            set((state) => ({
              loops: state.loops.map((l) =>
                l.id === id
                  ? { ...l, currentIteration: i, results: [...results], bestScore, status: i >= loop.maxIterations ? 'complete' as const : 'running' as const }
                  : l
              ),
            }));

            if (i >= loop.maxIterations) break;

            // Brief delay between iterations
            await new Promise((r) => setTimeout(r, 1000));
          } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
              break;
            }
            const duration = Date.now() - iterStart;
            const result: LoopResult = {
              iteration: i,
              model: loop.model,
              score: 0,
              output: 'Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
              duration,
              timestamp: Date.now(),
            };
            results.push(result);

            set((state) => ({
              loops: state.loops.map((l) =>
                l.id === id ? { ...l, status: 'error' as const, results: [...results] } : l
              ),
            }));
            break;
          }
        }

        // Clean up abort controller
        set((state) => {
          const newControllers = new Map(state.activeAbortControllers);
          newControllers.delete(id);
          return { activeAbortControllers: newControllers };
        });

        // Mark complete if not already
        set((state) => ({
          loops: state.loops.map((l) =>
            l.id === id && l.status === 'running' ? { ...l, status: 'complete' as const } : l
          ),
        }));
      },

      stopLoop: (id: string) => {
        const controller = get().activeAbortControllers.get(id);
        if (controller) {
          controller.abort();
        }
        set((state) => {
          const newControllers = new Map(state.activeAbortControllers);
          newControllers.delete(id);
          return {
            loops: state.loops.map((l) =>
              l.id === id && l.status === 'running' ? { ...l, status: 'idle' as const } : l
            ),
            activeAbortControllers: newControllers,
          };
        });
      },

      updateLoop: (id: string, changes: Partial<LoopTask>) => {
        set((state) => ({
          loops: state.loops.map((l) => (l.id === id ? { ...l, ...changes } : l)),
        }));
      },

      deleteLoop: (id: string) => {
        get().stopLoop(id);
        set((state) => ({
          loops: state.loops.filter((l) => l.id !== id),
        }));
      },
    }),
    {
      name: 'overlord-loops',
      partialize: (state) => ({ loops: state.loops }),
    }
  )
);
