"use client";

import { useState, useEffect } from "react";

interface LinearIssue {
  id: string;
  title: string;
  identifier: string;
  state?: { name: string };
  team?: { name: string };
}

export function LinearSettings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [connected, setConnected] = useState(false);
  const [issues, setIssues] = useState<LinearIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linear");
      const data = await res.json();
      setConnected(data.connected);
      if (data.issues) setIssues(data.issues);
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  const saveKey = async () => {
    setSaving(true);
    await fetch("/api/linear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    checkConnection();
  };

  const importIssue = async (issue: LinearIssue) => {
    const res = await fetch("/api/linear/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue_id: issue.id,
        issue_title: issue.title,
        issue_identifier: issue.identifier,
      }),
    });
    const data = await res.json();
    if (data.workspace_id) {
      alert(`Created workspace ${data.branch} + goal for ${issue.identifier}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border border-[var(--border)] rounded p-4">
        <h3 className="text-sm font-semibold mb-2">Linear Connection</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-xs text-[var(--text-muted)]">
            {connected ? "Connected" : "Not connected"}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="lin_api_..."
            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-mono"
          />
          <button
            onClick={saveKey}
            disabled={saving || !apiKey}
            className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm disabled:opacity-50"
          >
            {saving ? "..." : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      {connected && issues.length > 0 && (
        <div className="border border-[var(--border)] rounded p-4">
          <h3 className="text-sm font-semibold mb-2">Import Issues → Workspaces</h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-tertiary)]"
              >
                <div>
                  <span className="text-xs font-mono text-[var(--accent)]">{issue.identifier}</span>
                  <span className="text-sm ml-2">{issue.title}</span>
                  {issue.state && (
                    <span className="text-xs text-[var(--text-muted)] ml-2">({issue.state.name})</span>
                  )}
                </div>
                <button
                  onClick={() => importIssue(issue)}
                  className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded hover:border-[var(--accent)]"
                >
                  Import
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
