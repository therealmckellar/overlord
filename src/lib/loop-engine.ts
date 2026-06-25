import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  iterations: number;
  maxIterations: number;
  currentScore: number;
  bestScore: number;
  bestModel: string;
  results: LoopResult[];
  createdAt: number;
  config: {
    model: string;
    prompt: string;
  };
}

interface LoopState {
  loops: LoopTask[];
  startLoop: (task: LoopTask) => Promise<void>;
  stopLoop: (id: string) => void;
  updateLoop: (id: string, changes: Partial<LoopTask>) => void;
  removeLoop: (id: string) => void;
}

export const useLoopStore = create<LoopState>()(
  persist(
    (set, get) => ({
      loops: [],
      startLoop: async (task) => {
        const id = task.id || Math.random().toString(36).substr(2, 9);
        const updatedTask = { ...task, id, status: 'running' as const, iterations: 0, results: [] };
        
        set((state) => ({
          loops: [...state.loops.filter(l => l.id !== id), updatedTask]
        }));

        try {
          const response = await fetch('/api/agents/spawn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'loop',
              config: {
                name: updatedTask.name,
                description: updatedTask.description,
                model: updatedTask.config.model,
                maxIterations: updatedTask.maxIterations,
                prompt: updatedTask.config.prompt
              }
            })
          });

          if (!response.ok) throw new Error('Failed to spawn loop');
          
          const { jobId } = await response.json();
          // The real wiring to SSE would happen in the component using this jobId
        } catch (e) {
          set((state) => ({
            loops: state.loops.map(l => l.id === id ? { ...l, status: 'error' } : l)
          }));
          throw e;
        }
      },
      stopLoop: (id) => set((state) => ({
        loops: state.loops.map(l => l.id === id ? { ...l, status: 'idle' } : l)
      })),
      updateLoop: (id, changes) => set((state) => ({
        loops: state.loops.map(l => l.id === id ? { ...l, ...changes } : l)
      })),
      removeLoop: (id) => set((state) => ({
        loops: state.loops.filter(l => l.id !== id)
      })),
    }),
    { name: 'ol-loop-store' }
  )
);
