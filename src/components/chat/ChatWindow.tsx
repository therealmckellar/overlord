import React, { useState, useEffect, useRef } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { TypingIndicator } from './TypingIndicator';
import { ScrollControls } from './ScrollControls';

export const ChatWindow = () => {
  const { selectedAgentId, agents } = useAgentStore();
  const { sessions, addSession } = useSharedMemoryStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  useEffect(() => {
    if (selectedAgent) {
      const agentSessions = sessions.filter(s => s.agentName === selectedAgent.name);
      setMessages(agentSessions.map(s => ({
        id: s.id,
        role: s.role,
        content: s.content,
        timestamp: s.timestamp,
        agentName: s.agentName
      })));
    }
  }, [selectedAgentId, selectedAgent, sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!selectedAgent) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      agentName: 'Rich'
    };

    setMessages(prev => [...prev, userMsg]);
    addSession({ agentName: selectedAgent.name, role: 'user', content: text, topic: 'chat' });
    
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, agentId: selectedAgent.id }),
      });

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      
      const assistantMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        agentName: selectedAgent.name
      }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'done') {
              setIsTyping(false);
            } else if (data.text) {
              assistantText += data.text;
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId ? { ...m, content: assistantText } : m
              ));
            }
          }
        }
      }

      addSession({ agentName: selectedAgent.name, role: 'assistant', content: assistantText, topic: 'chat' });

    } catch (err) {
      console.error('Chat error:', err);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-l border-slate-800">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">
            {selectedAgent ? `${selectedAgent.name} // Session` : 'Select Agent'}
          </h3>
        </div>
        <ScrollControls containerRef={scrollRef} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
            No messages in this session. Start a conversation.
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <ChatComposer onSend={sendMessage} />
      </div>
    </div>
  );
};
