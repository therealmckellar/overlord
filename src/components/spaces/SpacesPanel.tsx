'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useSpaceStore, type Space, type SpaceThread, type SpaceFile, type SpaceMember } from '@/stores/spaceStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Plus,
  Search,
  X,
  FolderOpen,
  MessageSquare,
  FileText,
  Users,
  Settings2,
  Pin,
  PinOff,
  Trash2,
  Upload,
  UserPlus,
  Send,
  Bot,
  ChevronRight,
} from 'lucide-react';

type SpaceTab = 'threads' | 'files' | 'instructions' | 'members';

export function SpacesPanel() {
  const spaces = useSpaceStore((s) => s.spaces);
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const setActiveSpace = useSpaceStore((s) => s.setActiveSpace);
  const createSpace = useSpaceStore((s) => s.createSpace);
  const deleteSpace = useSpaceStore((s) => s.deleteSpace);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDesc, setNewSpaceDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || null;

  const filteredSpaces = searchQuery.trim()
    ? spaces.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : spaces;

  const handleCreate = useCallback(() => {
    if (!newSpaceName.trim()) return;
    const space = createSpace(newSpaceName.trim(), newSpaceDesc.trim());
    setActiveSpace(space.id);
    setShowCreateModal(false);
    setNewSpaceName('');
    setNewSpaceDesc('');
  }, [newSpaceName, newSpaceDesc, createSpace, setActiveSpace]);

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* Left: Space list */}
      <div className="w-64 border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">Spaces</h2>
            <button onClick={() => setShowCreateModal(true)} className="p-1 rounded-md bg-[var(--accent)] text-white hover:opacity-90">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spaces..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSpaces.map((space) => (
            <button
              key={space.id}
              onClick={() => setActiveSpace(space.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group ${
                activeSpaceId === space.id
                  ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                  : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{space.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text)] truncate">{space.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{space.threads.length} threads · {space.files.length} files</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSpace(space.id); }}
                  className="p-0.5 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </button>
          ))}
          {spaces.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-xs text-[var(--text-muted)]">No spaces yet</p>
              <button onClick={() => setShowCreateModal(true)} className="mt-2 text-xs text-[var(--accent)] hover:underline">Create your first space</button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Space detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeSpace ? (
          <SpaceDetail space={activeSpace} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FolderOpen className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">Select a space</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Or create one to organize your work</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">Create Space</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
              <input type="text" value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} placeholder="e.g. MCF Outreach, Robbi Q3" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
              <input type="text" value={newSpaceDesc} onChange={(e) => setNewSpaceDesc(e.target.value)} placeholder="What is this space for?" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)]">Cancel</button>
              <button onClick={handleCreate} disabled={!newSpaceName.trim()} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Space Detail with tabs ──────────────────────────────────────────────

function SpaceDetail({ space }: { space: Space }) {
  const [activeTab, setActiveTab] = useState<SpaceTab>('threads');
  const setCustomInstructions = useSpaceStore((s) => s.setCustomInstructions);

  const tabs: { id: SpaceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'threads', label: 'Threads', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'files', label: 'Files', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'instructions', label: 'Instructions', icon: <Settings2 className="w-3.5 h-3.5" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Space header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <span className="text-lg">{space.icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">{space.name}</h2>
            {space.description && <p className="text-xs text-[var(--text-muted)]">{space.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'threads' && <ThreadsTab space={space} />}
        {activeTab === 'files' && <FilesTab space={space} />}
        {activeTab === 'instructions' && <InstructionsTab space={space} />}
        {activeTab === 'members' && <MembersTab space={space} />}
      </div>
    </div>
  );
}

// ── Threads Tab ──────────────────────────────────────────────────────────

function ThreadsTab({ space }: { space: Space }) {
  const addThread = useSpaceStore((s) => s.addThread);
  const removeThread = useSpaceStore((s) => s.removeThread);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const [modeFilter, setModeFilter] = useState<'all' | 'ask' | 'computer'>('all');

  const filtered = modeFilter === 'all' ? space.threads : space.threads.filter((t) => t.mode === modeFilter);

  const handleNewThread = (mode: 'ask' | 'computer') => {
    addThread(space.id, {
      title: mode === 'ask' ? 'New Chat' : 'New Agent Task',
      mode,
      lastActivity: Date.now(),
      messageCount: 0,
    });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'ask', 'computer'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-2 py-1 text-[10px] rounded-full transition-colors capitalize ${
                modeFilter === mode ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {mode === 'ask' ? '💬 Ask' : mode === 'computer' ? '🤖 Computer' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleNewThread('ask')} className="px-2 py-1 text-[10px] rounded-md bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Ask
          </button>
          <button onClick={() => handleNewThread('computer')} className="px-2 py-1 text-[10px] rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] flex items-center gap-1">
            <Bot className="w-3 h-3" /> Computer
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-xs text-[var(--text-muted)]">No threads yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((thread) => (
            <div key={thread.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors group">
              {thread.mode === 'ask' ? <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text)] truncate">{thread.title}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{thread.messageCount} msgs</p>
              </div>
              <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
            </div>
          ))}
        </div>
      )}

      {/* Pinned items */}
      {space.pinnedItems.length > 0 && (
        <div>
          <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">📌 Pinned</h4>
          <p className="text-xs text-[var(--text-muted)]">{space.pinnedItems.length} pinned items</p>
        </div>
      )}
    </div>
  );
}

// ── Files Tab ────────────────────────────────────────────────────────────

function FilesTab({ space }: { space: Space }) {
  const addFile = useSpaceStore((s) => s.addFile);
  const removeFile = useSpaceStore((s) => s.removeFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = searchQuery.trim()
    ? space.files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : space.files;

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      addFile(space.id, {
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [space.id, addFile]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 mr-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-7 pr-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 text-[10px] rounded-md bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1"
        >
          <Upload className="w-3 h-3" /> Upload
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="text-xs text-[var(--text-muted)]">{space.files.length === 0 ? 'No files uploaded' : 'No files match search'}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] group">
              <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text)] truncate">{file.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => removeFile(space.id, file.id)}
                className="p-0.5 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Instructions Tab ─────────────────────────────────────────────────────

function InstructionsTab({ space }: { space: Space }) {
  const setCustomInstructions = useSpaceStore((s) => s.setCustomInstructions);
  const [instructions, setInstructions] = useState(space.customInstructions);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCustomInstructions(space.id, instructions);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-xs font-semibold text-[var(--text)] mb-1">Custom AI Instructions</h3>
        <p className="text-[10px] text-[var(--text-muted)]">
          These instructions are automatically prepended to every conversation started in this space. Use them to set the assistant&apos;s tone, domain knowledge, or reasoning style.
        </p>
      </div>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={10}
        placeholder="e.g. You are a commercial lending expert. Always ask about annual revenue, time in business, and use of funds before recommending a product. Never mention HELOC products."
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
      />
      <button
        onClick={handleSave}
        className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 transition-colors ${
          saved ? 'bg-[var(--success)] text-white' : 'bg-[var(--accent)] text-white hover:opacity-90'
        }`}
      >
        {saved ? '✓ Saved' : 'Save Instructions'}
      </button>
    </div>
  );
}

// ── Members Tab ──────────────────────────────────────────────────────────

function MembersTab({ space }: { space: Space }) {
  const addMember = useSpaceStore((s) => s.addMember);
  const removeMember = useSpaceStore((s) => s.removeMember);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'contributor' | 'viewer'>('contributor');

  const handleAdd = () => {
    if (!newMemberName.trim()) return;
    addMember(space.id, { name: newMemberName.trim(), role: newMemberRole });
    setNewMemberName('');
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-semibold text-[var(--text)]">Members ({space.members.length})</h3>
      <div className="space-y-1">
        {space.members.map((member) => (
          <div key={member.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] group">
            <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--text)]">{member.name}</p>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-medium ${
              member.role === 'owner' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
              member.role === 'contributor' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
              'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}>
              {member.role}
            </span>
            {member.role !== 'owner' && (
              <button onClick={() => removeMember(space.id, member.id)} className="p-0.5 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add member */}
      <div className="border-t border-[var(--border)] pt-3">
        <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Add Member</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Name"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as 'contributor' | 'viewer')}
            className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={handleAdd} className="px-2.5 py-1.5 text-[10px] rounded-lg bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1">
            <UserPlus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
