'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, User, Bot } from 'lucide-react';
import type { Message } from '@/types';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallCard } from './ToolCallCard';
import { StatusCard } from './StatusCard';
import { MessageReactions } from './MessageReactions';

interface ChatMessageProps {
  message: Message;
  showStatus?: boolean;
  model?: string;
  tokenCount?: number;
  elapsedMs?: number;
  reasoningEffort?: string;
}

// Extract <think> blocks from content
function parseThinking(content: string): { thinking: string | null; rest: string } {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    return {
      thinking: thinkMatch[1].trim(),
      rest: content.replace(thinkMatch[0], '').trim(),
    };
  }
  return { thinking: null, rest: content };
}

// Extract tool call blocks from content: [TOOL:tool_name:status]input[/TOOL]
function parseToolCalls(content: string): {
  cleanContent: string;
  toolCalls: { toolName: string; input: string; status: string }[];
} {
  const toolCalls: { toolName: string; input: string; status: string }[] = [];
  const regex = /\[TOOL:([^:]+):([^\]]+)\]([\s\S]*?)\[\/TOOL\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    toolCalls.push({ toolName: match[1], status: match[2], input: match[3].trim() });
  }
  const cleanContent = content.replace(regex, '').trim();
  return { cleanContent, toolCalls };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function ChatMessage({
  message,
  showStatus,
  model,
  tokenCount,
  elapsedMs,
  reasoningEffort,
}: ChatMessageProps) {
  const isUser = message.sender.role === 'user';

  const { thinking, rest: afterThinking } = useMemo(() => parseThinking(message.content), [message.content]);
  const { cleanContent, toolCalls } = useMemo(() => parseToolCalls(afterThinking), [afterThinking]);

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Sender name */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {message.sender.name}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-xl px-4 py-3 ${
            isUser
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)]'
          }`}
        >
          {/* Copy button */}
          <div className={`absolute top-2 ${isUser ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <CopyButton text={message.content} />
          </div>

          {/* Thinking block */}
          {thinking && <ThinkingBlock content={thinking} />}

          {/* Tool call cards */}
          {toolCalls.map((tc, i) => (
            <ToolCallCard
              key={i}
              toolName={tc.toolName}
              input={tc.input}
              status={tc.status as 'pending' | 'running' | 'complete' | 'error'}
            />
          ))}

          {/* Main content with markdown */}
          {cleanContent && (
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''} prose-p:leading-relaxed prose-pre:bg-[var(--code-bg)] prose-pre:text-[var(--code-text)] prose-code:text-[var(--accent)] prose-code:bg-[var(--code-bg)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-table:border-collapse prose-th:border prose-th:border-[var(--border)] prose-th:bg-[var(--bg-tertiary)] prose-th:px-3 prose-th:py-2 prose-th:text-xs prose-th:font-semibold prose-td:border prose-td:border-[var(--border)] prose-td:px-3 prose-td:py-2 prose-td:text-xs prose-tr:hover:bg-[var(--bg-tertiary)]`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // Custom code block with copy button
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    return match ? (
                      <div className="relative group/code">
                        <div className="flex items-center justify-between px-3 py-1 bg-[var(--bg-tertiary)] border-b border-[var(--border)] rounded-t-lg">
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">{match[1]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="p-0.5 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="mt-0 rounded-t-none">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {cleanContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Status card */}
        {showStatus && !isUser && (
          <StatusCard
            model={model}
            tokenCount={tokenCount}
            elapsedMs={elapsedMs}
            reasoningEffort={reasoningEffort}
          />
        )}

        {/* Reactions & Pin */}
        <MessageReactions
          messageId={message.id}
          sessionId={message.sessionId}
          reactions={message.reactions}
          isPinned={message.pinned}
          showPin={!isUser}
        />
      </div>
    </div>
  );
}
