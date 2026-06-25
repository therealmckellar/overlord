/**
 * Slash command registry and handler
 */

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string, context: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  setInput: (text: string) => void;
  clearMessages: () => void;
  switchPanel: (panel: string) => void;
  exportSession: () => void;
  focusSearch: () => void;
  newSession: () => void;
  showSettings: () => void;
  addToast: (toast: { type: 'info' | 'success' | 'warning' | 'error'; message: string }) => void;
}

export const COMMANDS: SlashCommand[] = [
  {
    name: 'help',
    description: 'Show available commands',
    usage: '/help',
    execute: (_, ctx) => {
      const list = COMMANDS.map(c => `**/${c.name}** — ${c.description}`).join('\n');
      ctx.addToast({ type: 'info', message: `Available commands:\n${list}` });
    },
  },
  {
    name: 'clear',
    description: 'Clear current session messages',
    usage: '/clear',
    execute: (_, ctx) => {
      ctx.clearMessages();
      ctx.addToast({ type: 'success', message: 'Messages cleared' });
    },
  },
  {
    name: 'export',
    description: 'Export current session as JSON',
    usage: '/export',
    execute: (_, ctx) => {
      ctx.exportSession();
      ctx.addToast({ type: 'success', message: 'Session exported' });
    },
  },
  {
    name: 'settings',
    description: 'Open settings panel',
    usage: '/settings',
    execute: (_, ctx) => {
      ctx.switchPanel('settings');
    },
  },
  {
    name: 'pipeline',
    description: 'Switch to pipeline panel',
    usage: '/pipeline',
    execute: (_, ctx) => {
      ctx.switchPanel('pipeline');
    },
  },
  {
    name: 'search',
    description: 'Focus search input',
    usage: '/search',
    execute: (_, ctx) => {
      ctx.focusSearch();
    },
  },
  {
    name: 'new',
    description: 'Create new session',
    usage: '/new',
    execute: (_, ctx) => {
      ctx.newSession();
      ctx.addToast({ type: 'success', message: 'New session created' });
    },
  },
];

export function getCommand(name: string): SlashCommand | undefined {
  return COMMANDS.find(c => c.name === name.toLowerCase());
}

export function getCompletions(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return [];
  const query = input.slice(1).toLowerCase();
  return COMMANDS.filter(c => c.name.startsWith(query));
}

export function parseCommand(input: string): { command: string; args: string } | null {
  if (!input.startsWith('/')) return null;
  const parts = input.slice(1).split(/\\s+/);
  return { command: parts[0], args: parts.slice(1).join(' ') };
}

// Compatible command list with .value property for existing UI
export const SLASH_COMMANDS = COMMANDS.map(cmd => ({
  value: cmd.name,
  label: `/${cmd.name}`,
  description: cmd.description,
  usage: cmd.usage,
}));

import { useState, useCallback } from 'react';

export function useSlashCommands(handlers: {
  setInput: (text: string) => void;
  clearMessages: () => void;
  switchPanel: (panel: string) => void;
  exportSession: () => void;
  focusSearch: () => void;
  newSession: () => void;
  showSettings: () => void;
}) {
  return {
    getCompletions,
    parseCommand,
    execute: (input: string) => {
      const parsed = parseCommand(input);
      if (!parsed) return false;
      const cmd = getCommand(parsed.command);
      if (!cmd) return false;
      cmd.execute(parsed.args, {
        setInput: handlers.setInput,
        clearMessages: handlers.clearMessages,
        switchPanel: handlers.switchPanel,
        exportSession: handlers.exportSession,
        focusSearch: handlers.focusSearch,
        newSession: handlers.newSession,
        showSettings: handlers.showSettings,
        addToast: (t) => {
          // Simple fallback - just log
          console.log(`[Toast] ${t.type}: ${t.message}`);
        },
      });
      return true;
    },
  };
}
