import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  version: string;
  author: string;
  code: string;
  enabled: boolean;
  createdAt: number;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  steps: PlaybookStep[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaybookStep {
  id: string;
  order: number;
  skillId: string;
  action: string;
  params: Record<string, string>;
}

const generateId = () => `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const now = Date.now();

const SEED_SKILLS: Skill[] = [];

const SEED_PLAYBOOKS: Playbook[] = [];

export interface SkillsState {
  skills: Skill[];
  playbooks: Playbook[];
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt'>) => string;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;
  toggleSkill: (id: string) => void;
  addPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePlaybook: (id: string, updates: Partial<Playbook>) => void;
  deletePlaybook: (id: string) => void;
  getSkillsByCategory: (category: string) => Skill[];
  getPlaybookSkills: (playbook: Playbook) => Skill[];
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      skills: SEED_SKILLS,
      playbooks: SEED_PLAYBOOKS,
      addSkill: (skill) => {
        const id = generateId();
        set((state) => ({
          skills: [...state.skills, { ...skill, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },
      deleteSkill: (id) => {
        set((state) => ({ skills: state.skills.filter((s) => s.id !== id) }));
      },
      toggleSkill: (id) => {
        set((state) => ({
          skills: state.skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        }));
      },
      addPlaybook: (playbook) => {
        const id = `pb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          playbooks: [...state.playbooks, { ...playbook, id, createdAt: Date.now(), updatedAt: Date.now() }],
        }));
        return id;
      },
      updatePlaybook: (id, updates) => {
        set((state) => ({
          playbooks: state.playbooks.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },
      deletePlaybook: (id) => {
        set((state) => ({ playbooks: state.playbooks.filter((p) => p.id !== id) }));
      },
      getSkillsByCategory: (category) => get().skills.filter((s) => s.category === category),
      getPlaybookSkills: (playbook) =>
        playbook.steps
          .map((step) => get().skills.find((s) => s.id === step.skillId))
          .filter((s): s is Skill => s !== undefined),
    }),
    { name: 'overlord-skills' }
  )
);
