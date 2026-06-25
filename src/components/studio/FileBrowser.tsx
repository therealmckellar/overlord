'use client';

import React, { useState, useCallback } from 'react';
import { FolderGit2, File, Folder, ChevronRight, X } from 'lucide-react';

interface FileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const MOCK_FS: FileNode[] = [
  {
    name: 'overlord',
    type: 'folder',
    children: [
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'components',
            type: 'folder',
            children: [
              { name: 'AgentDesigner.tsx', type: 'file' },
              { name: 'Dashboard.tsx', type: 'file' },
              { name: 'LoopEngineering.tsx', type: 'file' },
              { name: 'StudioView.tsx', type: 'file' },
            ],
          },
          {
            name: 'stores',
            type: 'folder',
            children: [
              { name: 'agentStore.ts', type: 'file' },
              { name: 'authStore.ts', type: 'file' },
              { name: 'sessionStore.ts', type: 'file' },
            ],
          },
          { name: 'app', type: 'folder', children: [{ name: 'page.tsx', type: 'file' }] },
          { name: 'lib', type: 'folder', children: [{ name: 'model-graph.ts', type: 'file' }] },
        ],
      },
      { name: 'package.json', type: 'file' },
      { name: 'next.config.ts', type: 'file' },
      { name: 'tsconfig.json', type: 'file' },
    ],
  },
];

export function FileBrowser({ isOpen, onClose }: FileBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['overlord', 'overlord/src']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const renderTree = (nodes: FileNode[], pathPrefix = '') => {
    return nodes.map((node) => {
      const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
      const isExpanded = expandedFolders.has(fullPath);
      const isSelected = selectedFile === fullPath;

      return (
        <div key={fullPath}>
          <button
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(fullPath);
              } else {
                setSelectedFile(fullPath);
              }
            }}
            className={`w-full flex items-center gap-1.5 py-1 px-2 rounded text-xs transition-colors ${
              isSelected
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]'
            }`}
          >
            {node.type === 'folder' ? (
              <>
                <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <Folder className="w-3.5 h-3.5 text-[var(--warning)]" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <File className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </button>
          {node.type === 'folder' && isExpanded && node.children && (
            <div className="ml-3 border-l border-[var(--border)]">
              {renderTree(node.children, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">Files</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {renderTree(MOCK_FS)}
      </div>
      {selectedFile && (
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <span className="text-[10px] text-[var(--text-muted)]">{selectedFile}</span>
        </div>
      )}
    </div>
  );
}
