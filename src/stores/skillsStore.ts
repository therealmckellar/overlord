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

const SEED_SKILLS: Skill[] = [
  {
    id: 'skill_1',
    name: 'Web Scraper',
    description: 'Extract structured data from any web page using Firecrawl API',
    category: 'data',
    icon: '🕷️',
    version: '1.0.0',
    author: 'Rich',
    code: '// Firecrawl extraction logic\nexport async function scrape(url: string) {\n  const response = await fetch("/api/extract", {\n    method: "POST",\n    body: JSON.stringify({ url })\n  });\n  return response.json();\n}',
    enabled: true,
    createdAt: now - 86400000 * 7,
  },
  {
    id: 'skill_2',
    name: 'Lead Enrichment',
    description: 'Enrich B2B lead data with company info, tech stack, and decision-makers',
    category: 'sales',
    icon: '🎯',
    version: '1.1.0',
    author: 'Rich',
    code: '// Lead enrichment pipeline\nexport async function enrichLead(lead: Lead) {\n  const company = await researchCompany(lead.domain);\n  const contacts = await findDecisionMakers(company);\n  return { ...lead, company, contacts };\n}',
    enabled: true,
    createdAt: now - 86400000 * 5,
  },
  {
    id: 'skill_3',
    name: 'Email Sequence Generator',
    description: 'Generate personalized cold email sequences based on prospect data',
    category: 'marketing',
    icon: '✉️',
    version: '2.0.0',
    author: 'Rich',
    code: '// Email sequence generator\nexport async function generateSequence(prospect: Prospect) {\n  const tone = prospect.industry === "finance" ? "formal" : "casual";\n  return buildSequence(prospect, tone);\n}',
    enabled: true,
    createdAt: now - 86400000 * 3,
  },
  {
    id: 'skill_4',
    name: 'Financial Analyzer',
    description: 'Analyze business financial health from public filings and data',
    category: 'analysis',
    icon: '📊',
    version: '0.9.0',
    author: 'Rich',
    code: '// Financial analysis engine\nexport async function analyzeBusiness(domain: string) {\n  const filings = await fetchFilings(domain);\n  return calculateMetrics(filings);\n}',
    enabled: false,
    createdAt: now - 86400000 * 2,
  },
  {
    id: 'skill_5',
    name: 'LinkedIn Prospector',
    description: 'Find and qualify leads on LinkedIn Sales Navigator',
    category: 'sales',
    icon: '💼',
    version: '1.0.0',
    author: 'Rich',
    code: '// LinkedIn prospecting\nexport async function findProspects(criteria: Criteria) {\n  const results = await searchSalesNavigator(criteria);\n  return scoreAndRank(results);\n}',
    enabled: true,
    createdAt: now - 86400000,
  },
  {
    id: 'skill_6',
    name: 'Document Generator',
    description: 'Generate proposals, contracts, and reports from templates',
    category: 'documents',
    icon: '📄',
    version: '1.2.0',
    author: 'Rich',
    code: '// Document generation\nexport async function generateDoc(template: string, data: any) {\n  const template = await loadTemplate(template);\n  return renderTemplate(template, data);\n}',
    enabled: true,
    createdAt: now - 86400000 * 4,
  },
];

const SEED_PLAYBOOKS: Playbook[] = [
  {
    id: 'playbook_1',
    name: 'MCA Lead Qualification',
    description: 'Full pipeline: scrape → enrich → score → outreach for MCA leads',
    steps: [
      { id: 'ps1', order: 1, skillId: 'skill_2', action: 'enrich', params: { source: 'linkedin' } },
      { id: 'ps2', order: 2, skillId: 'skill_5', action: 'prospect', params: { industry: 'construction' } },
      { id: 'ps3', order: 3, skillId: 'skill_3', action: 'sequence', params: { template: 'mca_intro' } },
    ],
    createdAt: now - 86400000 * 6,
    updatedAt: now - 86400000,
  },
  {
    id: 'playbook_2',
    name: 'Restaurant Promo Outreach',
    description: 'Find local restaurants, create promo offer, send visual email',
    steps: [
      { id: 'ps4', order: 1, skillId: 'skill_1', action: 'scrape', params: { type: 'restaurant_listings' } },
      { id: 'ps5', order: 2, skillId: 'skill_6', action: 'generate', params: { template: 'promo_flyer' } },
      { id: 'ps6', order: 3, skillId: 'skill_3', action: 'sequence', params: { template: 'restaurant_promo' } },
    ],
    createdAt: now - 86400000 * 4,
    updatedAt: now - 86400000 * 2,
  },
];

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
