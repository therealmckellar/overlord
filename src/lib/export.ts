/**
 * Session Export Utilities
 * Handles converting session data to various formats for download
 */

import type { Session, Message } from '@/types';

/**
 * Exports a single session and its messages to a formatted JSON string.
 */
export function exportSessionAsJSON(session: Session, messages: Message[]) {
  return JSON.stringify({
    session,
    messages,
    exportedAt: Date.now(),
  }, null, 2);
}

/**
 * Exports a single session to Markdown format.
 */
export function exportSessionAsMarkdown(session: Session, messages: Message[]) {
  const header = ` # ${session.title}\n` +
    `Created: ${new Date(session.createdAt).toLocaleString()}\n` +
    `Messages: ${session.messageCount}\n` +
    `---\n\n`;

  const body = messages
    .map((m) => `**${m.sender.name}** (${new Date(m.timestamp).toLocaleString()}):\n${m.content}\n`)
    .join('\n\n');

  return header + body;
}

/**
 * Exports all sessions and their associated messages.
 */
export function exportAllSessions(sessions: Session[], messagesMap: Record<string, Message[]>) {
  const data = sessions.map((s) => ({
    session: s,
    messages: messagesMap[s.id] || [],
  }));
  return JSON.stringify(data, null, 2);
}

/**
 * Triggers a browser download for the given content.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
