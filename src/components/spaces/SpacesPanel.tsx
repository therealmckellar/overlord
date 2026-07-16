import React, { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Trash2,
  MessageSquare,
  Bot,
  FileText,
  Send,
  X,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { useSpaceStore, type Space } from '@/stores/spaceStore';
import { useSkillsStore } from '@/stores/skillsStore';


// ── Empty state when no space selected ───────────────────────────────────────

function NoSpaceSelected() {
  const createSpace = useSpaceStore((s) => s.createSpace);
  const setActiveSpace = useSpaceStore((s) => s.setActiveSpace);
  const spaces = useSpaceStore((s) => s.spaces) ?? [];

  const handleCreate = () => {
    const name = prompt('Enter space name:');
    if (!name) return;
    const space = createSpace(name, 'A new workspace for your projects');
    setActiveSpace(space.id);
  };

  return (
    <div className="flex h-full">
      {/* Space list sidebar */}
      <SpaceListSidebar />

      {/* Empty center */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-2xl">
          ⬡
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">No Space Selected</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[200px]">
            {spaces.length > 0
              ? 'Pick a space from the sidebar or create a new one.'
              : 'Create your first space to get started.'}
          </p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary btn-sm">
          <Plus size={12} /> New Space
        </button>
      </div>
    </div>
  );
}

// ── Space list sidebar (left column) ─────────────────────────────────────────

function SpaceListSidebar() {
  const spaces = useSpaceStore((s) => s.spaces) ?? [];
  const activeSpaceId = useSpaceStore((s) => s.activeSpaceId);
  const setActiveSpace = useSpaceStore((s) => s.setActiveSpace);
  const createSpace = useSpaceStore((s) => s.createSpace);
  const deleteSpace = useSpaceStore((s) => s.deleteSpace);

  const handleCreate = () => {
    const space = createSpace('New Space', 'A new workspace');
    setActiveSpace(space.id);
  };

  return (
    <div className="w-[180px] flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Spaces</span>
        <button
          onClick={handleCreate}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] transition-colors"
          title="New space"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => setActiveSpace(space.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-all group ${
              activeSpaceId === space.id
                ? 'bg-[var(--nav-active-bg)] text-[var(--accent)] border border-[rgba(14,165,233,0.2)]'
                : 'text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span className="text-base flex-shrink-0">{space.icon ?? '📁'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium truncate">{space.name}</p>
              <p className="text-[9px] opacity-60 truncate">{(space.threads ?? []).length} threads</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteSpace(space.id); }}
              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--error)] transition-all"
              title="Delete"
            >
              <Trash2 size={10} />
            </button>
          </button>
        ))}
        {spaces.length === 0 && (
          <p className="text-[10px] text-[var(--text-muted)] text-center py-4 px-2">No spaces yet</p>
        )}
      </div>
    </div>
  );
}

// ── Main SpacesPanel ──────────────────────────────────────────────────────────

export default function SpacesPanel() {
  const activeSpace = useSpaceStore((s) => s.getActiveSpace());
  const activeThreadId = useSpaceStore((s) => s.activeThreadId);
  const setActiveThread = useSpaceStore((s) => s.setActiveThread);
  const addThread = useSpaceStore((s) => s.addThread);
  const removeThread = useSpaceStore((s) => s.removeThread);
  const [showSettings, setShowSettings] = useState(false);

  if (!activeSpace) {
    return <NoSpaceSelected />;
  }

  const threads = activeSpace.threads ?? [];

  const handleNewThread = () => {
    addThread(activeSpace.id, {
      title: `Thread ${threads.length + 1}`,
      lastActivity: Date.now(),
      messageCount: 0,
      messages: [],
    });
  };

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg)]">
      {/* Left: Space list */}
      <SpaceListSidebar />

      {/* Middle: Threads + Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Space header */}
        <div className="panel-header shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-lg flex-shrink-0">
              {activeSpace.icon ?? '📁'}
            </div>
            <div>
              <h2 className="panel-title">{activeSpace.name}</h2>
              <p className="panel-subtitle truncate max-w-[220px]">{activeSpace.description || 'No description'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`btn btn-ghost btn-xs ${showSettings ? 'text-[var(--accent)]' : ''}`}
          >
            <Settings size={12} />
          </button>
        </div>

        {/* Body: threads sidebar + chat view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Thread list */}
          <div className="w-48 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]/50">
            <div className="p-2 border-b border-[var(--border)]">
              <button
                onClick={handleNewThread}
                className="btn btn-primary btn-xs w-full"
              >
                <Plus size={10} /> New Thread
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {threads.length === 0 ? (
                <p className="text-[10px] text-[var(--text-muted)] text-center py-4">No threads yet</p>
              ) : threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThread(thread.id)}
                  className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-md text-left transition-all group ${
                    activeThreadId === thread.id
                      ? 'bg-[var(--nav-active-bg)] text-[var(--accent)] border border-[rgba(14,165,233,0.2)]'
                      : 'text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <MessageSquare size={11} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate">{thread.title}</p>
                    <p className="text-[9px] opacity-50">{(thread.messages ?? []).length} msgs</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeThread(activeSpace.id, thread.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--error)]"
                  >
                    <X size={9} />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* Chat view */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeThreadId ? (
              <ThreadChatView space={activeSpace} threadId={activeThreadId} />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <MessageSquare size={20} className="text-[var(--text-muted)]" />
                </div>
                <p className="empty-state-title">Select a thread</p>
                <p className="empty-state-desc">Pick a thread from the list or create a new one to start chatting.</p>
                <button onClick={handleNewThread} className="btn btn-secondary btn-sm mt-1">
                  <Plus size={11} /> New Thread
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Settings panel (togglable) */}
      {showSettings && (
        <div className="w-72 flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border)] overflow-y-auto flex-shrink-0">
          <div className="panel-header">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-[var(--text-muted)]" />
              <span className="panel-title">Space Settings</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="btn-ghost btn btn-xs">
              <X size={12} />
            </button>
          </div>
          <div className="p-4 space-y-5">
            <SpaceInstructionsSection space={activeSpace} />
            <SpaceFilesSection space={activeSpace} />
            <SpaceSkillsSection space={activeSpace} />
            <SpaceLinksSection space={activeSpace} />
            <SpaceMembersSection space={activeSpace} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Sections ─────────────────────────────────────────────────────────

function SidebarSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
      <div>
        <h4 className="text-[11px] font-semibold text-[var(--text)]">{title}</h4>
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SpaceInstructionsSection({ space }: { space: Space }) {
  const setCustomInstructions = useSpaceStore((s) => s.setCustomInstructions);
  const setMasterPrompt = useSpaceStore((s) => s.setMasterPrompt);
  const [master, setMaster] = useState(space.masterPrompt ?? '');
  const [custom, setCustom] = useState(space.customInstructions ?? '');

  return (
    <SidebarSection title="Instructions" description="Tell the AI how it should behave in this space.">
      <div className="space-y-2.5">
        <div>
          <label className="text-[9px] font-semibold text-[var(--text-muted)] mb-1 block uppercase tracking-wider">Master Prompt</label>
          <textarea
            value={master}
            onChange={(e) => setMaster(e.target.value)}
            onBlur={() => setMasterPrompt(space.id, master)}
            rows={3}
            className="input textarea text-[11px] font-mono"
            placeholder="Define role and core constraints..."
          />
        </div>
        <div>
          <label className="text-[9px] font-semibold text-[var(--text-muted)] mb-1 block uppercase tracking-wider">Custom Instructions</label>
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={() => setCustomInstructions(space.id, custom)}
            rows={2}
            className="input textarea text-[11px] font-mono"
            placeholder="Supplementary tone or formatting..."
          />
        </div>
      </div>
    </SidebarSection>
  );
}

function SpaceFilesSection({ space }: { space: Space }) {
  const addFile = useSpaceStore((s) => s.addFile);
  const removeFile = useSpaceStore((s) => s.removeFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const files = space.files ?? [];

  return (
    <SidebarSection title="Files" description="Reference docs, data, or files the AI should use as context.">
      <div className="space-y-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-secondary btn-xs w-full"
        >
          <Plus size={10} /> Add files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const f = e.target.files;
            if (!f) return;
            for (const file of Array.from(f)) {
              addFile(space.id, { name: file.name, type: file.type, size: file.size, url: URL.createObjectURL(file) });
            }
          }}
        />
        {files.map((file) => (
          <div key={file.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg)] border border-[var(--border)] group">
            <FileText size={10} className="text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-[10px] text-[var(--text)] truncate flex-1">{file.name}</span>
            <button onClick={() => removeFile(space.id, file.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--error)]">
              <Trash2 size={9} />
            </button>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
}

function SpaceSkillsSection({ space }: { space: Space }) {
  const addSkill = useSpaceStore((s) => s.addSkill);
  const removeSkill = useSpaceStore((s) => s.removeSkill);
  const installedSkills = useSkillsStore((s) => s.skills);
  const [search, setSearch] = useState('');
  const skills = space.skills ?? [];

  const filtered = installedSkills.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SidebarSection title="Skills" description="Extend what the AI can do in this space.">
      <div className="space-y-1.5">
        <div className="relative">
          <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="input text-[10px] pl-7"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {skills.map((skillId) => {
            const skill = installedSkills.find((s) => s.id === skillId);
            if (!skill) return null;
            return (
              <span key={skillId} className="badge badge-accent text-[9px] group">
                {skill.name}
                <button onClick={() => removeSkill(space.id, skillId)} className="hover:text-[var(--error)] ml-0.5">
                  <X size={8} />
                </button>
              </span>
            );
          })}
        </div>
        {search && filtered.length > 0 && (
          <div className="max-h-28 overflow-y-auto border border-[var(--border)] rounded-md bg-[var(--bg)]">
            {filtered.map((skill) => (
              <button
                key={skill.id}
                onClick={() => addSkill(space.id, skill.id)}
                className="w-full text-left px-2.5 py-1.5 text-[10px] hover:bg-[var(--bg-tertiary)] flex items-center justify-between text-[var(--text-secondary)]"
              >
                <span>{skill.name}</span>
                <Plus size={9} />
              </button>
            ))}
          </div>
        )}
      </div>
    </SidebarSection>
  );
}

function SpaceLinksSection({ space }: { space: Space }) {
  const addLink = useSpaceStore((s) => s.addLink);
  const removeLink = useSpaceStore((s) => s.removeLink);
  const [url, setUrl] = useState('');
  const links = space.links ?? [];

  const handleAdd = () => {
    if (!url.trim()) return;
    try {
      addLink(space.id, { url: url.trim(), title: new URL(url.trim()).hostname });
    } catch {
      addLink(space.id, { url: url.trim(), title: url.trim() });
    }
    setUrl('');
  };

  return (
    <SidebarSection title="Links" description="Websites the AI should prioritize for context.">
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="https://..."
            className="input text-[10px] flex-1"
          />
          <button onClick={handleAdd} className="btn btn-primary btn-xs flex-shrink-0">
            <Plus size={10} />
          </button>
        </div>
        {links.map((link) => (
          <div key={link.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg)] border border-[var(--border)] group">
            <LinkIcon size={9} className="text-[var(--text-muted)] flex-shrink-0" />
            <span className="text-[10px] text-[var(--accent)] truncate flex-1">{link.title}</span>
            <button onClick={() => removeLink(space.id, link.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--error)]">
              <Trash2 size={9} />
            </button>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
}

function SpaceMembersSection({ space }: { space: Space }) {
  const members = space.members ?? [];
  return (
    <SidebarSection title="Members" description="People and agents in this space.">
      <div className="space-y-1">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg)] border border-[var(--border)]">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-glow)] border border-[rgba(14,165,233,0.3)] flex items-center justify-center text-[9px] font-bold text-[var(--accent)] flex-shrink-0">
              {(m.name ?? '?')[0].toUpperCase()}
            </div>
            <span className="text-[10px] text-[var(--text)] flex-1">{m.name}</span>
            <span className="badge badge-accent text-[8px]">{m.role}</span>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-[10px] text-[var(--text-muted)]">No members yet.</p>
        )}
      </div>
    </SidebarSection>
  );
}

// ── Thread Chat View ──────────────────────────────────────────────────────────

function ThreadChatView({ space, threadId }: { space: Space; threadId: string }) {
  const thread = (space.threads ?? []).find((t) => t.id === threadId);
  const messages = thread?.messages ?? [];
  const addThreadMessage = useSpaceStore((s) => s.addThreadMessage);
  const updateThreadTitle = useSpaceStore((s) => s.updateThreadTitle);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Cleanup abort on unmount
  React.useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    setIsLoading(true);

    // Update thread title from first message
    if (messages.length === 0 && thread) {
      updateThreadTitle(space.id, threadId, msg.slice(0, 40) + (msg.length > 40 ? '…' : ''));
    }

    addThreadMessage(space.id, threadId, { role: 'user', content: msg });

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build message history from this thread only (fully isolated from main chat)
      // Retrieve the absolute latest space state to avoid stale closure references
      const latestSpace = useSpaceStore.getState().spaces.find(s => s.id === space.id);
      const latestThread = (latestSpace?.threads ?? []).find((t) => t.id === threadId);
      const threadMessages = latestThread?.messages ?? [];
      const history = threadMessages.slice(-20).map((m) => ({
        sender: { role: m.role },
        content: m.content,
      }));

      const systemPrompt = [space.masterPrompt, space.customInstructions].filter(Boolean).join('\n\n');

      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          systemPrompt: systemPrompt || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Chat error ${res.status}: ${text.slice(0, 200)}`);
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buf = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Parse SSE events
        while (true) {
          const eventEnd = buf.indexOf('\n\n');
          if (eventEnd === -1) break;
          const eventBlock = buf.slice(0, eventEnd);
          buf = buf.slice(eventEnd + 2);

          let eventType = '';
          let dataStr = '';
          for (const line of eventBlock.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }
          if (!eventType || !dataStr) continue;

          let parsed: { content?: string } = {};
          try { parsed = JSON.parse(dataStr); } catch { /* ignore */ }

          if (eventType === 'chunk' && parsed.content) {
            assistantContent += parsed.content;
          } else if (eventType === 'error') {
            throw new Error(parsed.content || 'Stream error');
          }
        }
      }

      addThreadMessage(space.id, threadId, { role: 'assistant', content: assistantContent || '(no response)' });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      addThreadMessage(space.id, threadId, { role: 'assistant', content: '⚠ Error getting response.' });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="empty-state h-full">
            <div className="empty-state-icon">
              <Bot size={22} className="text-[var(--text-muted)]" />
            </div>
            <p className="empty-state-title">Start a conversation</p>
            <p className="empty-state-desc">
              {space.masterPrompt
                ? `This space has custom instructions active.`
                : 'Type a message below to begin.'}
            </p>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[var(--accent-glow)] border border-[rgba(14,165,233,0.3)] flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot size={12} className="text-[var(--accent)]" />
              </div>
            )}
            <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
              <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-glow)] border border-[rgba(14,165,233,0.3)] flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-[var(--accent)]" />
            </div>
            <div className="chat-bubble-assistant flex gap-1 items-center py-2.5 px-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"
                  style={{ animation: `typing-bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${space.name}...`}
            rows={1}
            className="input textarea flex-1 min-h-[36px] max-h-[120px] text-[12.5px] resize-none"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary flex-shrink-0 h-9 w-9 p-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
