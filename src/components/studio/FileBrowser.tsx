'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FolderGit2, File, Folder, ChevronRight, X, RefreshCw, Home, ChevronUp, Search } from 'lucide-react';

interface FileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  truncated?: boolean;
}

export function FileBrowser({ isOpen, onClose }: FileBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [allFiles, setAllFiles] = useState<string[]>([]); // flat list for search

  const loadDirectory = useCallback(async (dirPath?: string) => {
    setIsLoading(true);
    try {
      const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
      const res = await fetch(`/api/files${params}`);
      const data = await res.json();
      if (data.success) {
        if (data.type === 'folder' && data.children) {
          setFileTree(data.children);
          setCurrentPath(data.path);
          // Build flat file list for search
          const collectFiles = (nodes: FileNode[], prefix: string): string[] => {
            const result: string[] = [];
            for (const node of nodes) {
              const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
              if (node.type === 'file') result.push(fullPath);
              if (node.children) result.push(...collectFiles(node.children, fullPath));
            }
            return result;
          };
          setAllFiles(collectFiles(data.children, ''));
        }
      }
    } catch {
      // Error loading directory
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDirectory();
    }
  }, [isOpen, loadDirectory]);

  const navigateToFolder = useCallback(async (dirPath: string) => {
    await loadDirectory(dirPath);
    setExpandedFolders(prev => new Set([...prev, dirPath]));
  }, [loadDirectory]);

  const toggleFolder = useCallback((dirPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        // Load children if not already loaded
        navigateToFolder(dirPath);
      }
      return next;
    });
  }, [navigateToFolder]);

  const navigateUp = useCallback(() => {
    if (!currentPath || currentPath === os_homedir) return;
    const parent = currentPath.split('/').slice(0, -1).join('/');
    if (parent) {
      loadDirectory(parent || undefined);
    }
  }, [currentPath, loadDirectory]);

  const goHome = useCallback(() => {
    loadDirectory(undefined);
  }, [loadDirectory]);

  const filteredTree = searchQuery.trim()
    ? filterTree(fileTree, searchQuery.toLowerCase())
    : fileTree;

  const renderTree = (nodes: FileNode[], pathPrefix = '') => {
    return nodes.map((node) => {
      const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name;
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = selectedFile === node.path;

      return (
        <div key={node.path}>
          <button
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                setSelectedFile(node.path);
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">File Explorer</span>
          {currentPath && (
            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">
              {currentPath}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
            title="Search files"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={goHome}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
            title="Go to home directory"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={navigateUp}
            disabled={!currentPath || currentPath === '~'}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] disabled:opacity-30"
            title="Go up one level"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => loadDirectory(currentPath || undefined)}
            disabled={isLoading}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] disabled:opacity-30"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            autoFocus
          />
          {searchQuery.trim() && (
            <div className="mt-1 max-h-32 overflow-y-auto">
              {allFiles
                .filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 20)
                .map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      setSelectedFile(f);
                      const dir = f.split('/').slice(0, -1).join('/');
                      if (dir) {
                        setExpandedFolders(prev => new Set([...prev, dir]));
                      }
                    }}
                    className="w-full text-left px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)] truncate"
                  >
                    {f}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[var(--accent)] animate-spin" />
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            {searchQuery.trim() ? 'No matching files found' : 'Empty directory'}
          </div>
        ) : (
          renderTree(filteredTree)
        )}
      </div>

      {/* Selected file path */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-muted)] truncate">{selectedFile}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            clear
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function os_homedir(): string {
  // Simple approximation for display
  return '~';
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  return nodes.reduce<FileNode[]>((acc, node) => {
    const nameMatch = node.name.toLowerCase().includes(query);
    if (node.type === 'file' && nameMatch) {
      acc.push(node);
    } else if (node.type === 'folder') {
      const filteredChildren = node.children ? filterTree(node.children, query) : [];
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }
    }
    return acc;
  }, []);
}
