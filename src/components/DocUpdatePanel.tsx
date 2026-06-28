import React from 'react';
import { useDocStore } from '@/stores/docStore';
import { BookOpen, RefreshCw, FileText, CheckCircle2, XCircle, GitPullRequest } from 'lucide-react';

export const DocUpdatePanel: React.FC = () => {
  const { status, isUpdating, updateDiff, checkDocs, triggerUpdate } = useDocStore();

  if (!status) return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
      <button 
        onClick={checkDocs} 
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm transition-colors"
      >
        Analyze Documentation Status
      </button>
    </div>
  );

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <BookOpen size={18} /> Documentation Freshness
        </h3>
        <button 
          onClick={checkDocs} 
          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 transition-colors"
        >
          <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <DocItem label="README.md" current={status.readmeCurrent} icon={<FileText size={14} />} />
        <DocItem label="API Documentation" current={status.apiDocsUpdated} icon={<FileText size={14} />} />
        <DocItem label="Changelog" current={status.changelogAdded} icon={<FileText size={14} />} />
      </div>

      {(!status.readmeCurrent || !status.apiDocsUpdated || !status.changelogAdded) && (
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <button 
            onClick={triggerUpdate} 
            disabled={isUpdating}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            {isUpdating ? 'Agent is updating docs...' : 'Update Documentation via Agent'}
          </button>
          
          {updateDiff && (
            <div className="p-2 bg-black rounded border border-zinc-800 font-mono text-xs overflow-x-auto max-h-40 whitespace-pre">
              {updateDiff}
            </div>
          )}

          <button 
            disabled={!updateDiff}
            className="w-full py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 rounded-md text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <GitPullRequest size={14} /> Create Auto-PR with changes
          </button>
        </div>
      )}
    </div>
  );
};

const DocItem = ({ label, current, icon }: { label: string; current: boolean; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-md">
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      {icon} <span>{label}</span>
    </div>
    {current ? (
      <CheckCircle2 size={16} className="text-green-500" />
    ) : (
      <XCircle size={16} className="text-red-500" />
    )}
  </div>
);
