import React from 'react';
import { useUIStore, type WorkflowMode } from '@/stores/uiStore';
import { 
  Lightbulb, 
  MessageSquare, 
  Play, 
  ShieldCheck, 
  ChevronDown 
} from 'lucide-react';

interface ModeConfig {
  color: string;
  icon: React.ReactNode;
  description: string;
}

const MODES: Record<WorkflowMode, ModeConfig> = {
  PLAN: { 
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', 
    icon: <Lightbulb size={16} />, 
    description: 'Design docs, ADRs, strategic thinking' 
  },
  ASK: { 
    color: 'text-green-400 bg-green-400/10 border-green-400/20', 
    icon: <MessageSquare size={16} />, 
    description: 'Questions, code lookup, explanations' 
  },
  EXECUTE: { 
    color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', 
    icon: <Play size={16} />, 
    description: 'Build, fix, implement' 
  },
  REVIEW: { 
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', 
    icon: <ShieldCheck size={16} />, 
    description: 'Audit, test, review, validate' 
  },
};

export const ModeSwitcher: React.FC = () => {
  const { currentMode, setCurrentMode } = useUIStore();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${MODES[currentMode].color}`}
      >
        {MODES[currentMode].icon}
        <span className="text-xs font-bold tracking-wider uppercase">{currentMode}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {(Object.keys(MODES) as WorkflowMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setCurrentMode(mode);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 text-left ${
                currentMode === mode 
                  ? 'bg-neutral-800 text-white' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <div className={`p-1.5 rounded-md ${MODES[mode].color}`}>
                {MODES[mode].icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{mode}</span>
                <span className="text-[10px] text-neutral-500 leading-tight">{MODES[mode].description}</span>
              </div>
              {currentMode === mode && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
