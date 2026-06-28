import React, { useState } from 'react';
import { useRetroStore, RetroSummary } from '@/stores/retroStore';
import { Download, RefreshCw, History, FileText, CheckCircle2, AlertCircle, DollarSign, Lightbulb } from 'lucide-react';

export const RetroPanel: React.FC = () => {
  const { retros, isLoading, addRetro, setLoading, setError } = useRetroStore();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const generateRetro = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/retro/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: dateRange.from, to: dateRange.to }),
      });
      if (!response.ok) throw new Error('Failed to generate retro');
      const data: RetroSummary = await response.json();
      addRetro(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportMarkdown = (retro: RetroSummary) => {
    const blob = new Blob([retro.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "retro-" + retro.id + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 text-zinc-100 p-6 space-y-6 rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          Weekly Retrospective
        </h2>
        <button 
          onClick={generateRetro} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Generate Now
        </button>
      </div>

      <div className="flex gap-4 items-end bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 uppercase font-semibold">From</label>
          <input 
            type="date" 
            value={dateRange.from} 
            onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 uppercase font-semibold">To</label>
          <input 
            type="date" 
            value={dateRange.to} 
            onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {retros.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
            <FileText className="w-12 h-12 opacity-20" />
            <p>No retrospectives found. Generate your first one!</p>
          </div>
        ) : (
          retros.map(retro => (
            <div key={retro.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-400">
                  {retro.dateRange.from} &rarr; {retro.dateRange.to}
                </span>
                <button 
                  onClick={() => exportMarkdown(retro)}
                  className="p-1.5 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors"
                  title="Export Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
                    <CheckCircle2 className="w-4 h-4" /> Shipped
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                    {retro.shipped.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
                    <AlertCircle className="w-4 h-4" /> Broke
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                    {retro.broke.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                    <DollarSign className="w-4 h-4" /> Costs
                  </div>
                  <div className="text-xs text-zinc-300">
                    Total: <span className="font-bold text-white">${retro.costSummary.totalSpend.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
                    <Lightbulb className="w-4 h-4" /> Lessons
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                    {retro.lessons.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
