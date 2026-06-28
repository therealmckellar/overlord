import React, { useState } from 'react';
import { useOpinionStore } from '@/stores/opinionStore';
import { ComparisonResult } from '@/lib/opinionCompare';

const MODELS = [
  'gpt-4o', 'claude-3-5-sonnet', 'llama-3-70b', 'mistral-large', 'gemini-1.5-pro'
];

export const SecondOpinionPanel: React.FC = () => {
  const { 
    addComparison, 
    isLoading, 
    setLoading, 
    setError, 
    error 
  } = useOpinionStore();
  
  const [prompt, setPrompt] = useState('');
  const [model1, setModel1] = useState(MODELS[0]);
  const [model2, setModel2] = useState(MODELS[1]);
  const [currentResult, setCurrentResult] = useState<{
    output1: string;
    output2: string;
    result: ComparisonResult;
  } | null>(null);

  const runComparison = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/opinion/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model1, model2 }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      addComparison(data);
      setCurrentResult({
        output1: data.output1,
        output2: data.output2,
        result: data.result,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 bg-[#0a0a0a] text-white border-l border-zinc-800">
      <h2 className="text-xl font-bold mb-4 text-zinc-100">Second Opinion</h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Task Prompt</label>
          <textarea 
            className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the task to compare..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Model 1</label>
            <select 
              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm outline-none"
              value={model1}
              onChange={(e) => setModel1(e.target.value)}
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase mb-1">Model 2</label>
            <select 
              className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm outline-none"
              value={model2}
              onChange={(e) => setModel2(e.target.value)}
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        
        <button 
          onClick={runComparison}
          disabled={isLoading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white rounded font-medium transition-colors"
        >
          {isLoading ? 'Comparing...' : 'Run Comparison'}
        </button>
        
        {error && <div className="p-2 text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded">{error}</div>}
      </div>

      {currentResult && (
        <div className="flex-1 overflow-auto space-y-6">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-zinc-500">Summary</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                currentResult.result.level === 'identical' ? 'bg-green-900 text-green-300' :
                currentResult.result.level === 'similar' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {currentResult.result.level}
              </span>
            </div>
            <div className="text-sm text-zinc-300 mb-2">Agreement Rate: {(currentResult.result.agreementRate * 100).toFixed(1)}%</div>
            <div className="text-sm italic text-zinc-400 border-l-2 border-blue-500 pl-2">{currentResult.result.recommendation}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col">
              <div className="text-xs font-bold uppercase text-zinc-500 mb-2">{model1}</div>
              <div className="flex-1 p-3 bg-zinc-900 border border-zinc-800 rounded overflow-auto whitespace-pre-wrap text-sm text-zinc-300 font-mono">
                {currentResult.output1}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-xs font-bold uppercase text-zinc-500 mb-2">{model2}</div>
              <div className="flex-1 p-3 bg-zinc-900 border border-zinc-800 rounded overflow-auto whitespace-pre-wrap text-sm text-zinc-300 font-mono">
                {currentResult.output2}
              </div>
            </div>
          </div>

          {currentResult.result.criticalDisagreements.length > 0 && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded">
              <div className="text-xs font-bold uppercase text-red-400 mb-2">Critical Disagreements</div>
              <ul className="space-y-1">
                {currentResult.result.criticalDisagreements.map((d, i) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-2">
                    <span className="text-red-500">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
