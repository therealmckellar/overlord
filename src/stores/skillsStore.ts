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

// Seed skills
const SEED_SKILLS: Skill[] = [
  // Data Category
  { id: 'skill-data-1', name: 'Task Decomposition', description: 'Decompose high-level milestones into sequential, dependent subtasks.', category: 'data', icon: '📋', version: '1.0.0', author: 'System', code: 'export async function run(goal) { return ["Subtask 1", "Subtask 2"]; }', enabled: true, createdAt: now },
  { id: 'skill-data-2', name: 'Dependency Analysis', description: 'Analyze task dependency trees to identify critical paths and bottlenecks.', category: 'data', icon: '🔗', version: '1.0.0', author: 'System', code: 'export async function run(tasks) { return "Critical Path identified"; }', enabled: true, createdAt: now },
  { id: 'skill-data-3', name: 'Market Analysis', description: 'Fetch and evaluate real estate and commercial real estate market data.', category: 'data', icon: '🏢', version: '1.0.0', author: 'System', code: 'export async function run(zipCode) { return "Market Trend: Stable"; }', enabled: true, createdAt: now },
  
  // Sales Category
  { id: 'skill-sales-1', name: 'Outreach Campaign Generation', description: 'Design email sequences tailored for specific commercial funding prospects.', category: 'sales', icon: '✉️', version: '1.0.0', author: 'System', code: 'export async function run(lead) { return "Email generated"; }', enabled: true, createdAt: now },
  { id: 'skill-sales-2', name: 'Lead Qualification', description: 'Evaluate lead data against underwriting guidelines.', category: 'sales', icon: '🎯', version: '1.0.0', author: 'System', code: 'export async function run(companyData) { return { qualified: true }; }', enabled: true, createdAt: now },

  // Marketing Category
  { id: 'skill-mkt-1', name: 'Social Media Automation', description: 'Publish promotional content and cross-post updates to social platforms.', category: 'marketing', icon: '📢', version: '1.0.0', author: 'System', code: 'export async function run(postContent) { return "Cross-posted"; }', enabled: true, createdAt: now },
  { id: 'skill-mkt-2', name: 'Newsletter Drafting', description: 'Generate formatted newsletters and Substack post content draft.', category: 'marketing', icon: '✍️', version: '1.0.0', author: 'System', code: 'export async function run(topic) { return "Draft complete"; }', enabled: true, createdAt: now },

  // Analysis Category
  { id: 'skill-ana-1', name: 'Codebase Scan (AST)', description: 'Scan project files using AST parser to locate design pattern instances.', category: 'analysis', icon: '🔍', version: '1.0.0', author: 'System', code: 'export async function run(filePath) { return "No violations found"; }', enabled: true, createdAt: now },
  { id: 'skill-ana-2', name: 'Security Audit', description: 'Analyze code and configurations for potential OWASP top 10 vulnerabilities.', category: 'analysis', icon: '🔒', version: '1.0.0', author: 'System', code: 'export async function run(codeSnippet) { return "0 security gaps"; }', enabled: true, createdAt: now },
  { id: 'skill-ana-3', name: 'Performance Audit', description: 'Measure component render speeds and bundle size bottlenecks.', category: 'analysis', icon: '⚡', version: '1.0.0', author: 'System', code: 'export async function run(bundleUrl) { return "Performance score: 95/100"; }', enabled: true, createdAt: now },

  // Documents Category
  { id: 'skill-doc-1', name: 'API Docs Generation', description: 'Generate markdown documentation blocks for Next.js App Router endpoints.', category: 'documents', icon: '📝', version: '1.0.0', author: 'System', code: 'export async function run(routeFile) { return "Markdown generated"; }', enabled: true, createdAt: now },
  { id: 'skill-doc-2', name: 'Pitch Deck Structuring', description: 'Generate slide outlines and presentation content layouts.', category: 'documents', icon: '📊', version: '1.0.0', author: 'System', code: 'export async function run(specs) { return "Slides ready"; }', enabled: true, createdAt: now },
];

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
    { name: 'overlord-skills', partialize: (state) => ({ skills: state.skills, playbooks: state.playbooks }) }
  )
);
