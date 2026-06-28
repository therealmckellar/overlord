import React, { useState, useEffect } from 'react';
import { useQAStore } from '@/stores/qaStore';
import { CheckCircle2, XCircle, Loader2, Play, History, Monitor, Smartphone, AlertCircle } from 'lucide-react';

const DEFAULT_SCENARIOS = [
  { id: 'page_load', label: 'Page loads without error' },
  { id: 'login_flow', label: 'Login flow works' },
  { id: 'navigation', label: 'Navigation works' },
  { id: 'form_submit', label: 'Forms submit correctly' },
  { id: 'console_errors', label: 'No console errors' },
  { id: 'responsive', label: 'Responsive on mobile' },
  { id: 'api_success', label: 'API calls succeed' },
];

export const QAPanel = () => {
  const { 
    sessions, 
    currentSessionId, 
    setCurrentSession, 
    setLoading, 
    setError, 
    updateScenario, 
    updateSession 
  } = useQAStore();

  const [url, setUrl] = useState('');
  const [testType, setTestType] = useState<'Smoke Test' | 'Full Flow' | 'Custom'>('Smoke Test');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(DEFAULT_SCENARIOS.map(s => s.id));

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const runQA = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qa/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          testType,
          scenarios: selectedScenarios,
        }),
      });

      if (!response.ok) throw new Error('Failed to start QA session');
      const data = await response.json();
      setCurrentSession(data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleScenario = (id: string) => {
    setSelectedScenarios(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full flex-col bg-[#0f0f1a] text-white p-6 gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Browser QA Testing</h2>
          <p className="text-slate-400 text-sm">Delegate browser tests to Hermes Agent</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setCurrentSession(null)} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#252545] transition-colors text-sm"
          >
            <History size={16} />
            History
          </button>
        </div>
      </div>

      {!currentSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-[#1a1a2e] p-6 rounded-xl border border-slate-800">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Target URL</label>
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://app.example.com"
                className="w-full px-4 py-2 bg-[#0f0f1a] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#6366f1] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Test Type</label>
              <div className="flex gap-2">
                {(['Smoke Test', 'Full Flow', 'Custom'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setTestType(type)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      testType === type 
                        ? 'bg-[#6366f1] text-white' 
                        : 'bg-[#0f0f1a] text-slate-400 hover:bg-[#252545]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Test Scenarios</label>
              <div className="grid grid-cols-1 gap-2">
                {DEFAULT_SCENARIOS.map(scenario => (
                  <label key={scenario.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f1a] border border-slate-800 cursor-pointer hover:border-slate-600 transition-all">
                    <input 
                      type="checkbox" 
                      checked={selectedScenarios.includes(scenario.id)}
                      onChange={() => toggleScenario(scenario.id)}
                      className="w-4 h-4 accent-[#6366f1]"
                    />
                    <span className="text-sm text-slate-300">{scenario.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={runQA}
              disabled={!url}
              className="w-full py-3 rounded-lg bg-[#6366f1] hover:bg-[#4f51d4] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Run QA Session
            </button>
          </div>

          <div className="bg-[#1a1a2e] p-6 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor size={20} className="text-[#6366f1]" />
              QA Agent Instructions
            </h3>
            <div className="p-4 bg-[#0f0f1a] rounded-lg border border-slate-800 text-sm text-slate-400 font-mono leading-relaxed">
              <p>Hermes will use Playwright tools to:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Navigate to {url || '[URL]'}</li>
                <li>Capture initial state screenshot</li>
                <li>Execute {testType} logic</li>
                <li>Verify {selectedScenarios.length} selected scenarios</li>
                <li>Monitor console for errors</li>
                <li>Report structured pass/fail results</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#1a1a2e] p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${currentSession.status === 'running' ? 'bg-yellow-500 animate-pulse' : currentSession.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <span className="text-sm font-medium text-slate-400">Session ID:</span>
                <span className="ml-2 text-sm font-mono text-white">{currentSession.id}</span>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-slate-400">Passed: <b className="text-green-500">{currentSession.summary.passed}</b></span>
              <span className="text-slate-400">Failed: <b className="text-red-500">{currentSession.summary.failed}</b></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSession.scenarios.map(scenario => (
              <div key={scenario.id} className="p-4 bg-[#1a1a2e] rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">{scenario.label}</span>
                  {scenario.status === 'running' && <Loader2 size={16} className="animate-spin text-[#6366f1]" />}
                  {scenario.status === 'pass' && <CheckCircle2 size={16} className="text-green-500" />}
                  {scenario.status === 'fail' && <XCircle size={16} className="text-red-500" />}
                  {scenario.status === 'pending' && <div className="w-4 h-4 rounded-full bg-slate-700" />}
                </div>
                
                {scenario.screenshot && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-700 group">
                    <img src={scenario.screenshot} alt={scenario.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={scenario.screenshot} target="_blank" rel="noreferrer" className="text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white">View Full Size</a>
                    </div>
                  </div>
                )}

                {scenario.error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{scenario.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => setCurrentSession(null)}
              className="px-4 py-2 rounded-lg bg-[#1a1a2e] hover:bg-[#252545] text-sm transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
