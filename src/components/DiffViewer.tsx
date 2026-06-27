"use client";

import { useEffect, useState, useCallback } from "react";

interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  diff: string;
}

interface DiffData {
  stat: string;
  files: DiffFile[];
}

export function DiffViewer({ workspaceId }: { workspaceId: string }) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState("");
  const [commentLine, setCommentLine] = useState<number>(0);

  const fetchDiff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/diff`);
      const data = await res.json();
      if (data.files) setDiffData(data);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  const addComment = async () => {
    if (!commentFile || !commentLine || !commentText) return;
    await fetch(`/api/workspaces/${workspaceId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_path: commentFile,
        line_number: commentLine,
        content: commentText,
      }),
    });
    setCommentText("");
    setCommentFile("");
    setCommentLine(0);
  };

  if (loading) return <div className="p-4 text-[var(--text-muted)]">Loading diff...</div>;
  if (!diffData || diffData.files.length === 0)
    return <div className="p-4 text-[var(--text-muted)]">No changes yet</div>;

  return (
    <div className="p-4">
      {/* Stat summary */}
      <pre className="text-xs text-[var(--text-muted)] mb-4 bg-[var(--code-bg)] p-3 rounded">
        {diffData.stat}
      </pre>

      {/* File list */}
      <div className="space-y-1">
        {diffData.files.map((file) => (
          <div key={file.path} className="border border-[var(--border)] rounded">
            <div
              onClick={() => setExpandedFile(expandedFile === file.path ? null : file.path)}
              className="flex items-center gap-3 p-2 cursor-pointer hover:bg-[var(--bg-tertiary)]"
            >
              <span className="text-xs">{expandedFile === file.path ? "▼" : "▶"}</span>
              <span className="text-sm font-mono flex-1 truncate">{file.path}</span>
              <span className="text-xs text-green-400">+{file.additions}</span>
              <span className="text-xs text-red-400">-{file.deletions}</span>
            </div>

            {expandedFile === file.path && (
              <div className="border-t border-[var(--border)]">
                <pre className="text-xs p-3 overflow-x-auto bg-[var(--code-bg)]">
                  {file.diff.split("\n").map((line, i) => {
                    let color = "text-[var(--code-text)]";
                    if (line.startsWith("+") && !line.startsWith("+++"))
                      color = "text-green-400";
                    else if (line.startsWith("-") && !line.startsWith("---"))
                      color = "text-red-400";
                    else if (line.startsWith("@@")) color = "text-blue-400";
                    else if (line.startsWith("diff")) color = "text-yellow-400";

                    return (
                      <div key={i} className="flex group">
                        <span className="w-8 text-right mr-3 text-[var(--text-muted)] select-none">
                          {i + 1}
                        </span>
                        <span className={`${color} flex-1`}>{line}</span>
                        <button
                          onClick={() => {
                            setCommentFile(file.path);
                            setCommentLine(i + 1);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-[var(--accent)] px-1"
                        >
                          💬
                        </button>
                      </div>
                    );
                  })}
                </pre>

                {/* Comment input */}
                {commentFile === file.path && (
                  <div className="p-2 border-t border-[var(--border)] flex gap-2">
                    <span className="text-xs text-[var(--text-muted)] py-1">
                      Line {commentLine}:
                    </span>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add comment..."
                      className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addComment()}
                    />
                    <button
                      onClick={addComment}
                      className="px-2 py-1 bg-[var(--accent)] text-white rounded text-xs"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
