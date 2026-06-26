'use client';

import React, { useState } from 'react';
import { useSkillsStore, Skill, Playbook, PlaybookStep } from '@/stores/skillsStore';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '📦' },
  { value: 'data', label: 'Data', icon: '📊' },
  { value: 'sales', label: 'Sales', icon: '💰' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'analysis', label: 'Analysis', icon: '🔬' },
  { value: 'documents', label: 'Documents', icon: '📄' },
];

export default function SkillsPanel() {
  const skills = useSkillsStore((s) => s.skills);
  const playbooks = useSkillsStore((s) => s.playbooks);
  const addSkill = useSkillsStore((s) => s.addSkill);
  const toggleSkill = useSkillsStore((s) => s.toggleSkill);
  const deleteSkill = useSkillsStore((s) => s.deleteSkill);
  const addPlaybook = useSkillsStore((s) => s.addPlaybook);
  const deletePlaybook = useSkillsStore((s) => s.deletePlaybook);
  const getPlaybookSkills = useSkillsStore((s) => s.getPlaybookSkills);

  const [tab, setTab] = useState<'skills' | 'playbooks'>('skills');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [showNewPlaybook, setShowNewPlaybook] = useState(false);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null);

  // New skill form
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillCategory, setSkillCategory] = useState('data');
  const [skillIcon, setSkillIcon] = useState('⚡');
  const [skillCode, setSkillCode] = useState('// Skill code here\nexport async function run() {\n  \n}');

  // New playbook form
  const [pbName, setPbName] = useState('');
  const [pbDesc, setPbDesc] = useState('');
  const [pbSteps, setPbSteps] = useState<{ skillId: string; action: string }[]>([]);

  const filteredSkills = filterCategory === 'all'
    ? skills
    : skills.filter((s) => s.category === filterCategory);

  const handleCreateSkill = () => {
    if (!skillName.trim()) return;
    addSkill({
      name: skillName,
      description: skillDesc,
      category: skillCategory,
      icon: skillIcon,
      version: '0.1.0',
      author: 'Rich',
      code: skillCode,
      enabled: true,
    });
    setSkillName('');
    setSkillDesc('');
    setSkillCode('// Skill code here\nexport async function run() {\n  \n}');
    setShowNewSkill(false);
  };

  const handleCreatePlaybook = () => {
    if (!pbName.trim() || pbSteps.length === 0) return;
    const steps: PlaybookStep[] = pbSteps.map((step, i) => ({
      id: `step_${Date.now()}_${i}`,
      order: i + 1,
      skillId: step.skillId,
      action: step.action,
      params: {},
    }));
    addPlaybook({ name: pbName, description: pbDesc, steps });
    setPbName('');
    setPbDesc('');
    setPbSteps([]);
    setShowNewPlaybook(false);
  };

  const addStep = () => {
    if (skills.length === 0) return;
    setPbSteps([...pbSteps, { skillId: skills[0].id, action: 'run' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
            ⚡ Skills & Playbooks
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {skills.length} skills · {playbooks.length} playbooks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTab('skills')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: tab === 'skills' ? 'none' : '1px solid #334155',
              background: tab === 'skills' ? '#3b82f6' : 'transparent',
              color: tab === 'skills' ? '#fff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skills
          </button>
          <button
            onClick={() => setTab('playbooks')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: tab === 'playbooks' ? 'none' : '1px solid #334155',
              background: tab === 'playbooks' ? '#3b82f6' : 'transparent',
              color: tab === 'playbooks' ? '#fff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Playbooks
          </button>
        </div>
      </div>

      {/* Skills Tab */}
      {tab === 'skills' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Category Filter + Add */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid #1e293b',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: filterCategory === cat.value ? 'none' : '1px solid #334155',
                    background: filterCategory === cat.value ? '#1e293b' : 'transparent',
                    color: filterCategory === cat.value ? '#f1f5f9' : '#64748b',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewSkill(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + New Skill
            </button>
          </div>

          {/* New Skill Form */}
          {showNewSkill && (
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              background: '#0f172a',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  value={skillIcon}
                  onChange={(e) => setSkillIcon(e.target.value)}
                  style={{
                    width: '40px',
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: '16px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Skill name"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <select
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                >
                  {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={skillDesc}
                onChange={(e) => setSkillDesc(e.target.value)}
                placeholder="Description"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                value={skillCode}
                onChange={(e) => setSkillCode(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  background: '#0a0f1a',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  marginBottom: '8px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowNewSkill(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSkill}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create Skill
                </button>
              </div>
            </div>
          )}

          {/* Skills Grid */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            alignContent: 'start',
          }}>
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  background: '#0f172a',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setExpandedSkill(expandedSkill === skill.id ? null : skill.id)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{skill.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                      {skill.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      v{skill.version} · {skill.category}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSkill(skill.id); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: skill.enabled ? '#10b98120' : '#1e293b',
                      color: skill.enabled ? '#10b981' : '#64748b',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {skill.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {expandedSkill === skill.id && (
                  <div style={{
                    padding: '0 14px 12px',
                    borderTop: '1px solid #1e293b',
                    paddingTop: '10px',
                  }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px', lineHeight: '1.4' }}>
                      {skill.description}
                    </p>
                    <div style={{
                      background: '#0a0f1a',
                      borderRadius: '4px',
                      padding: '8px',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: '#94a3b8',
                      maxHeight: '80px',
                      overflow: 'hidden',
                      lineHeight: '1.5',
                    }}>
                      {skill.code.split('\n').slice(0, 4).join('\n')}
                      {skill.code.split('\n').length > 4 ? '\n...' : ''}
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playbooks Tab */}
      {tab === 'playbooks' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => setShowNewPlaybook(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + New Playbook
            </button>
          </div>

          {/* New Playbook Form */}
          {showNewPlaybook && (
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              background: '#0f172a',
            }}>
              <input
                value={pbName}
                onChange={(e) => setPbName(e.target.value)}
                placeholder="Playbook name"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                }}
              />
              <input
                value={pbDesc}
                onChange={(e) => setPbDesc(e.target.value)}
                placeholder="Description"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Steps:</div>
                {pbSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <span style={{
                      width: '20px',
                      fontSize: '11px',
                      color: '#64748b',
                      padding: '6px 0',
                      textAlign: 'center',
                    }}>
                      {i + 1}.
                    </span>
                    <select
                      value={step.skillId}
                      onChange={(e) => {
                        const newSteps = [...pbSteps];
                        newSteps[i].skillId = e.target.value;
                        setPbSteps(newSteps);
                      }}
                      style={{
                        flex: 1,
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#f1f5f9',
                        fontSize: '11px',
                      }}
                    >
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                    <input
                      value={step.action}
                      onChange={(e) => {
                        const newSteps = [...pbSteps];
                        newSteps[i].action = e.target.value;
                        setPbSteps(newSteps);
                      }}
                      placeholder="action"
                      style={{
                        width: '80px',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#f1f5f9',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => setPbSteps(pbSteps.filter((_, j) => j !== i))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addStep}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px dashed #334155',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  + Add Step
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowNewPlaybook(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #334155',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaybook}
                  disabled={!pbName.trim() || pbSteps.length === 0}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: pbName.trim() && pbSteps.length > 0 ? '#10b981' : '#334155',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: pbName.trim() && pbSteps.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Create Playbook
                </button>
              </div>
            </div>
          )}

          {/* Playbooks List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {playbooks.map((pb) => {
              const pbSkills = getPlaybookSkills(pb);
              return (
                <div
                  key={pb.id}
                  style={{
                    marginBottom: '12px',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    background: '#0f172a',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setExpandedPlaybook(expandedPlaybook === pb.id ? null : pb.id)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                        📋 {pb.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {pb.description}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#64748b',
                      background: '#1e293b',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}>
                      {pb.steps.length} steps
                    </span>
                  </div>
                  {expandedPlaybook === pb.id && (
                    <div style={{
                      padding: '0 16px 12px',
                      borderTop: '1px solid #1e293b',
                      paddingTop: '10px',
                    }}>
                      {pb.steps.map((step, i) => {
                        const skill = pbSkills.find((s) => s.id === step.skillId);
                        return (
                          <div key={step.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '6px 0',
                            borderBottom: i < pb.steps.length - 1 ? '1px solid #1e293b' : 'none',
                          }}>
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#1e293b',
                              color: '#94a3b8',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                            }}>
                              {i + 1}
                            </span>
                            <span style={{ fontSize: '16px' }}>{skill?.icon || '❓'}</span>
                            <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 500 }}>
                              {skill?.name || 'Unknown'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              → {step.action}
                            </span>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => deletePlaybook(pb.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
