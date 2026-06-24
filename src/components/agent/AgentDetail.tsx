'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '@/stores/agentStore';

interface AgentDetailProps {
  agent: Agent;
  onClose: () => void;
  onKill: (id: string) => void;
  onPause: (id: string) => void;
  onRestart: (id: string) => void;
}

export const AgentDetail = ({ agent, onClose, onKill, onPause, onRestart }: AgentDetailProps) => {
  const [messages, setMessages] = useState(agent.messages);
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agent.logs]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newUserMsg = { role: 'user' as const, content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages([...messages, newUserMsg]);
    setInput('');
    
    // Mock assistant response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Acknowledgement received. Processing request: "${input}"`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] border-l border-[var(--border)] w-full max-w-3xl">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-[var(--border)] rounded-lg text-[var(--text-muted)]">
            ←
          </button>
          <div>
            <h2 className="font-bold text-[var(--text)]">{agent.name}</h2>
            <p className="text-xs text-[var(--text-muted)]">{agent.role} • {agent.model}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPause(agent.id)} className="px-3 py-1 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] hover:border-[var(--accent)]">Pause</button>
          <button onClick={() => onRestart(agent.id)} className="px-3 py-1 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] hover:border-[var(--accent)]">Restart</button>
          <button onClick={() => onKill(agent.id)} className="px-3 py-1 text-xs bg-red-500/10 border border-red-500/20 rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-all">Kill</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col border-r border-[var(--border)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm italic">
                No messages yet. Start a conversation with {agent.name}.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[var(--accent)] text-white rounded-tr-none' 
                    : 'bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)] rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border)] flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder={`Message ${agent.name}...`}
            />
            <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium">Send</button>
          </form>
        </div>

        {/* Side Info Area */}
        <div className="w-80 flex flex-col overflow-hidden bg-[var(--bg-secondary)]/50">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map(skill => (
                <span key={skill} className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded text-[10px] text-[var(--text)]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">System Logs</h3>
              <span className="text-[10px] text-[var(--text-muted)]">{agent.logs.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2">
              {agent.logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-500' : 
                    log.type === 'warn' ? 'text-amber-500' : 'text-[var(--text)]'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
          
          <div className="p-4 border-t border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Token Usage</h3>
            <div className="flex items-end gap-1 h-12">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-[var(--accent)] opacity-40 rounded-t-sm" 
                  style={{ height: `${Math.random() * 100}%` }} 
                />
              ))}
            </div>
            <div className="text-center text-[10px] text-[var(--text-muted)] mt-2">
              Total: {agent.tokensUsed.toLocaleString()} tokens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
