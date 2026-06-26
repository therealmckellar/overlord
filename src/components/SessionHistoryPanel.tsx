'use client';

import React, { useState } from 'react';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';

export default function SessionHistoryPanel() {
  const sessions = useSharedMemoryStore((s) => s.sessions);
  const getSessionsByAgent = useSharedMemoryStore((s) => s.getSessionsByAgent);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique agent names
  const agentNames = [...new Set(sessions.map((s) => s.agentName))];

  const filteredSessions = selectedAgent
    ? getSessionsByAgent(selectedAgent)
    : sessions;

  const finalSessions = searchQuery
    ? filteredSessions.filter((s) =>
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredSessions;

  // Group by topic
  const topics = [...new Set(finalSessions.map((s) => s.topic).filter(Boolean))];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left — Agent List */}
      <div style={{
        width: '180px',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '12px',
          borderBottom: '1px solid #1e293b',
          fontSize: '11px',
          fontWeight: 600,
          color: '#64748b',
          textTransform: 'uppercase',
        }}>
          Agents
        </div>
        <button
          onClick={() => setSelectedAgent(null)}
          style={{
            padding: '8px 12px',
            textAlign: 'left',
            background: selectedAgent === null ? '#1e293b' : 'transparent',
            border: 'none',
            color: selectedAgent === null ? '#f1f5f9' : '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
            borderBottom: '1px solid #1e293b',
          }}
        >
          All Agents ({sessions.length})
        </button>
        {agentNames.map((name) => {
          const count = sessions.filter((s) => s.agentName === name).length;
          return (
            <button
              key={name}
              onClick={() => setSelectedAgent(name)}
              style={{
                padding: '8px 12px',
                textAlign: 'left',
                background: selectedAgent === name ? '#1e293b' : 'transparent',
                border: 'none',
                color: selectedAgent === name ? '#f1f5f9' : '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{name}</span>
              <span style={{ color: '#64748b' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right — Session Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Search */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1e293b',
        }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f1f5f9',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Topic Tags */}
        {topics.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: '8px 16px',
            borderBottom: '1px solid #1e293b',
            flexWrap: 'wrap',
          }}>
            {topics.map((topic) => (
              <span key={topic} style={{
                fontSize: '10px',
                color: '#3b82f6',
                background: '#3b82f615',
                padding: '2px 6px',
                borderRadius: '3px',
              }}>
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}>
          {finalSessions.slice(-50).reverse().map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                background: msg.role === 'user' ? '#1e293b' : '#0f172a',
                borderLeft: `3px solid ${msg.role === 'user' ? '#3b82f6' : '#10b981'}`,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: msg.role === 'user' ? '#3b82f6' : '#10b981',
                }}>
                  {msg.role === 'user' ? '👤 User' : `🤖 ${msg.agentName}`}
                </span>
                {msg.topic && (
                  <span style={{
                    fontSize: '9px',
                    color: '#64748b',
                    background: '#1e293b',
                    padding: '1px 5px',
                    borderRadius: '2px',
                  }}>
                    {msg.topic}
                  </span>
                )}
                <span style={{
                  fontSize: '9px',
                  color: '#475569',
                  marginLeft: 'auto',
                }}>
                  {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#e2e8f0',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {finalSessions.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#475569',
              fontSize: '13px',
              padding: '40px 0',
            }}>
              No session history yet. Start chatting with agents!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
