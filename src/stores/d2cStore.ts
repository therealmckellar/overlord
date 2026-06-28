import { create } from 'zustand';

interface D2CSpec {
  html: string;
  css: string;
  components: string[];
  description: string;
}

interface D2CState {
  uploadedImage: string | null;
  generatedSpec: D2CSpec | null;
  isGenerating: boolean;
  isCreatingWorkspace: boolean;
  error: string | null;

  setUploadedImage: (url: string | null) => void;
  setGeneratedSpec: (spec: D2CSpec | null) => void;
  setGenerating: (loading: boolean) => void;
  setCreatingWorkspace: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useD2CStore = create<D2CState>((set) => ({
  uploadedImage: null,
  generatedSpec: null,
  isGenerating: false,
  isCreatingWorkspace: false,
  error: null,

  setUploadedImage: (url) => set({ uploadedImage: url }),
  setGeneratedSpec: (spec) => set({ generatedSpec: spec }),
  setGenerating: (loading) => set({ isGenerating: loading }),
  setCreatingWorkspace: (loading) => set({ isCreatingWorkspace: loading }),
  setError: (error) => set({ error }),
}));
