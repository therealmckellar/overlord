"use client";

import React, { useState } from "react";
import { useReviewStore, Finding, Severity } from "@/stores/reviewStore";

export function CodeReviewPanel() {
  const { findings, passed, loading, setLoading, setFindings } = useReviewStore();
  const [input, setInput] = useState("");
  const [isDiffMode, setIsDiffMode] = useState(false);

  const handleReview = async () => {
    setLoading(true);
    try {
      const payload = isDiffMode 
        ? { diffText: input } 
        : { workspaceId: input };

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.findings) {
        setFindings(data.findings, data.passed);
      }
    } catch (err) {
      console.error("Review failed", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToMarkdown = () => {
    let md = `# Code Review Report\n\n`;
    md += `**Status:** ${passed ? "✅ PASSED" : "❌ FAILED"}\n`;
    md += `**Total Findings:** ${findings.length}\n\n`;
    md += `| Severity | Category | File | Line | Message | Suggestion |\n`;
    md += `|---|---|---|---|---|---|\n`;
    findings.forEach(f => {
      md += `| ${f.severity} | ${f.category} | ${f.file} | ${f.line} | ${f.message} | ${f.suggestion} |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codereview-report.md`;
    a.click();
  };

  const getSeverityColor = (s: Severity) => {
    switch (s) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'WARNING': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'INFO': return 'text-blue-400 bg-blue-900/20 border-blue-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[#16162d]">
        <div>
          <h2 className="text-lg font-semibold">Code Review Panel</h2>
          <p className="text-xs text-[var(--text-muted)]">OWASP & Bug Pattern Analysis</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={exportToMarkdown}
            disabled={findings.length === 0}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
          >
            Export MD
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-b border-[var(--border)] bg-[#16162d] space-y-3">
        <div className="flex gap-4 items-center">
          <div className="flex bg-gray-800 p-1 rounded text-xs">
            <button 
              onClick={() => setIsDiffMode(false)}
              className={`px-3 py-1 rounded ${!isDiffMode ? "bg-[var(--accent)] text-white" : "text-gray-400"}`}
            >
              Workspace ID
            </button>
            <button 
              onClick={() => setIsDiffMode(true)}
              className={`px-3 py-1 rounded ${isDiffMode ? "bg-[var(--accent)] text-white" : "text-gray-400"}`}
            >
              Git Diff
            </button>
          </div>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isDiffMode ? "Paste diff text here..." : "Enter Workspace ID..."}
            className="flex-1 bg-[#0f0f1e] border border-[var(--border)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
          />
          <button 
            onClick={handleReview}
            disabled={loading || !input}
            className="px-4 py-1.5 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Review"}
          </button>
        </div>
      </div>

      {/* Summary Header */}
      {findings.length > 0 && (
        <div className="p-4 bg-gray-900/50 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex gap-4 text-sm">
            <span className="font-medium">Total Findings: <span className="text-white">{findings.length}</span></span>
            <span className={`font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
              Status: {passed ? "PASS" : "FAIL"}
            </span>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Critical: {findings.filter(f => f.severity === 'CRITICAL').length}</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Warning: {findings.filter(f => f.severity === 'WARNING').length}</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Info: {findings.filter(f => f.severity === 'INFO').length}</span>
          </div>
        </div>
      )}

      {/* Findings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {findings.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm italic">
            No analysis performed yet. Enter a workspace ID or diff to start.
          </div>
        )}
        
        {findings.map((finding, idx) => (
          <div 
            key={idx} 
            className={`border rounded-lg overflow-hidden transition-all ${getSeverityColor(finding.severity)}`}
          >
            <div className="flex items-center justify-between p-2 bg-black/20 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="uppercase">{finding.severity}</span>
                <span className="opacity-50">|</span>
                <span>{finding.category}</span>
              </div>
              <div className="text-xs font-mono opacity-70">
                {finding.file}:{finding.line}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-sm font-medium">{finding.message}</div>
              <div className="text-xs opacity-80 bg-black/20 p-2 rounded border border-white/5 italic">
                <strong>Suggestion:</strong> {finding.suggestion}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
