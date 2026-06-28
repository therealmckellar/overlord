import { create } from 'zustand';

interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'module';
  metadata?: any;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: any;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  
  setGraph: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setStats: (stats: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  stats: null,
  selectedNode: null,
  isLoading: false,
  error: null,

  setGraph: (nodes, edges) => set({ nodes, edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
