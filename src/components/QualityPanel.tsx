'use client';

import React, { useState, useEffect } from 'react';
import { useQualityStore } from '@/stores/qualityStore';
import { validateOutput, AssertionRule, QualityReport } from '@/lib/qualityEngine';

export default function QualityPanel() {
  const { savedRules, history, setOutput, currentOutput, addHistory } = useQualityStore();
  const [selectedRuleSet, setSelectedRuleSet] = useState('Default-Agent');
  const [testOutput, setTestOutput] = useState('');
  const [report, setReport] = useState<QualityReport | null>(null);

  useEffect(() => {
    setTestOutput(currentOutput);
  }, [currentOutput, setTestOutput]);

  const runValidation = async () => {
    const rules = savedRules[selectedRuleSet] || [];
    const result = validateOutput(testOutput, rules);
    setReport(result);
    addHistory(result);
  };

  const renderTrendChart = () => {
    if (history.length === 0) return <div className="text-gray-500 italic">No history yet...</div>;
    
    const scores = history.slice(0, 10).map(h => h.score).reverse();
    const maxScore = 100;
    const chartHeight = 5;
    
    let chart = '<div className="font-mono text-xs leading-tight">';
    for (let y = chartHeight; y >= 0; y--) {
      const threshold = (y / chartHeight) * maxScore;
      chart += `${threshold.toFixed(0)}% | `;
      scores.forEach(s => {
        chart += s >= threshold ? '█' : ' ';
      });
      chart += '<br/>';
    }
    chart += '     ' + '---'.repeat(scores.length);
    chart += '</div>';
    
    return <div dangerouslySetInnerHTML={{ __html: chart }} />;
  };

  return (
    <div className="p-4 rounded-xl border border-indigo-500/30 bg-[#1a1a2e] text-white w-full max-w-2xl space-y-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-indigo-400">Quality Validation Engine</h2>
        <select 
          className="bg-[#0f0f1a] border border-indigo-500/50 rounded px-2 py-1 text-sm outline-none"
          value={selectedRuleSet}
          onChange={(e) => setSelectedRuleSet(e.target.value)}
        >
          {Object.keys(savedRules).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Agent Output to Validate</label>
        <textarea 
          className="w-full h-32 p-3 rounded-lg bg-[#0f0f1a] border border-indigo-500/30 text-sm font-mono focus:border-indigo-500 outline-none transition-colors"
          value={testOutput}
          onChange={(e) => setTestOutput(e.target.value)}
          placeholder="Paste agent output here..."
        />
      </div>

      <button 
        onClick={runValidation}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all active:scale-95"
      >
        Validate Quality
      </button>

      {report && (
        <div className="p-4 rounded-lg bg-[#0f0f1a] border border-indigo-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-300">Overall Score:</span>
            <span className={`text-2xl font-black ${report.score >= 80 ? 'text-green-400' : report.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {report.score}%
            </span>
          </div>

          <div className="space-y-2">
            {report.results.map((res, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded bg-white/5 text-xs border-l-2 border-indigo-500/50">
                <span className={`text-lg ${res.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {res.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between font-bold">
                    <span>Rule {res.ruleId}</span>
                    <span className="text-gray-500">w{res.weight}</span>
                  </div>
                  <div className={res.passed ? 'text-gray-400' : 'text-red-300'}>{res.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-indigo-500/20">
        <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">Historical Performance</h3>
        {renderTrendChart()}
      </div>
    </div>
  );
}
